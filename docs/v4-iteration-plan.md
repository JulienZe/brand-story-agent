# 品牌故事创作智能体 — 版本4迭代计划

> 聚焦：AI能力升级 + 协作效率
> 日期：2026-05-06
> 基于版本3已完成功能：SSE流式推送、JSON Schema校验、内容评分、骨架屏、错误边界、响应式适配

---

## Phase 1: AI模型运行时切换 🔴 高优先级

**痛点**: 当前模型配置写死在 `.env`，切换需重启服务，无法实时对比不同模型输出质量

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 1.1 后端模型切换API | `server.js` | `POST /api/models/switch` — 运行时切换 provider+model，无需重启；`GET /api/models` 增加可用性检测（Ollama ping、API Key 校验） |
| 1.2 前端模型选择器 | `ModelSelector.jsx` | 下拉面板组件，展示所有 provider 及推荐模型，标注免费/付费、在线/离线状态，支持一键切换 |
| 1.3 创作页集成 | `PageCreate.jsx` | 在创作表单中嵌入模型选择器，生成时使用选定模型；结果页展示使用的模型信息 |
| 1.4 模型状态持久化 | `config/index.js` | 切换后写入运行时状态，新请求使用新模型；Dashboard 展示各模型使用占比 |

### 技术细节

- 后端 `config.ai.provider` 和 `config.ai.model` 改为可变运行时状态
- Ollama 可用性检测：`GET ${baseUrl}/api/tags` 超时3秒
- API Key 校验：检测环境变量是否存在且非空
- 前端模型选择器需展示：provider名称、模型名、定价、在线状态标签
- 切换后通过 SSE 通知前端当前模型变更

---

## Phase 2: Prompt模板编辑器 🔴 高优先级

**痛点**: Prompt 硬编码在 `PromptTemplate.js`，调优需改代码重启，无法可视化编辑和A/B测试

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 2.1 数据库表 | `Database.js` | 新增 `prompt_templates` 表：id, name, stage, system_prompt, user_prompt, is_default, created_at |
| 2.2 后端CRUD API | `server.js` | `GET/POST/PUT/DELETE /api/prompts` — 模板增删改查；`POST /api/prompts/test` — 测试模板效果 |
| 2.3 前端编辑器组件 | `PromptEditor.jsx` | 可视化编辑器：左侧阶段选择，右侧 system/user 双栏编辑，变量高亮（`{{productName}}`等），实时预览 |
| 2.4 模板管理页 | `PagePrompts.jsx` | 独立页面，模板列表+编辑+测试+恢复默认；Navbar 增加入口 |
| 2.5 Agent集成 | `Agent.js` | `createStory` 时支持传入自定义模板ID，从数据库加载而非硬编码 |

### 技术细节

- `prompt_templates` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS prompt_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    stage TEXT NOT NULL,
    system_prompt TEXT,
    user_prompt TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_prompt_templates_stage ON prompt_templates(stage);
  ```
- 默认模板从 `PromptTemplate.js` 初始化导入到数据库
- 变量高亮正则：`\{\{(\w+)\}\}` 匹配模板变量
- 测试接口接收 productName 等参数，渲染模板后调用AI生成，返回结果和耗时

---

## Phase 3: 批量生成 🟡 中优先级

**痛点**: 每次只能生成一个产品，多产品需重复操作，效率低

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 3.1 后端批量API | `server.js` | `POST /api/story/batch` — 接收产品数组，队列化执行，返回 batch_id；`GET /api/story/batch/:id` — 查询批量进度 |
| 3.2 批量队列引擎 | `BatchQueue.js` | 内存队列管理，并发控制（最多2个同时），进度追踪，失败重试 |
| 3.3 前端批量表单 | `BatchCreate.jsx` | 可添加多行产品信息的表单，支持 CSV 粘贴导入，实时显示每个产品的生成状态 |
| 3.4 批量进度面板 | `BatchProgress.jsx` | 展示批量任务进度条，每个产品独立状态（等待/生成中/完成/失败），可单独查看结果 |

### 技术细节

- BatchQueue 类：
  - `add(items)` — 入队，返回 batchId
  - `start()` — 按并发度执行
  - `getStatus(batchId)` — 返回各item状态
  - 并发控制：信号量模式，maxConcurrency=2
  - 失败重试：单个item最多重试1次
- CSV 导入格式：`产品名称,产品描述,目标用户,语调`
- SSE 推送批量进度事件：`batch:progress`、`batch:item:complete`、`batch:item:error`、`batch:done`
- 前端批量表单支持动态增删行

---

## Phase 4: 内容对比Diff 🟡 中优先级

**痛点**: 版本对比只展示两个版本全文，无法快速定位差异，合并需手动复制粘贴

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 4.1 后端diff API | `server.js` | `POST /api/stories/diff` — 接收两个版本内容，返回结构化diff（按段落/句子级别） |
| 4.2 Diff算法 | `diffUtils.js` | 基于最长公共子序列的文本diff，支持段落级和句子级对比，生成增/删/改标记 |
| 4.3 前端Diff组件 | `DiffViewer.jsx` | 双栏对比视图，差异高亮（新增绿色、删除红色、修改黄色），支持按段落折叠 |
| 4.4 合并操作 | `StoryViewer.jsx` | 在Diff视图中支持"采用左版/采用右版"操作，生成合并后内容 |

### 技术细节

- Diff算法实现：
  - 先按段落分割，段落级 LCS 匹配
  - 匹配段落内按句子分割，句子级 LCS 匹配
  - 输出结构：`[{ type: 'equal'|'add'|'delete'|'modify', left, right }]`
- DiffViewer 双栏同步滚动
- 合并操作：每个差异块独立选择左/右，最终拼接生成合并内容
- 替换现有 `VersionCompare` 组件中的简单对比逻辑

---

## Phase 5: 分享功能 🟡 中优先级

**痛点**: 生成的内容只能本地查看，无法便捷分享给团队成员或客户

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 5.1 数据库表 | `Database.js` | 新增 `shared_stories` 表：id, story_id, share_token, password, expires_at, view_count, created_at |
| 5.2 后端分享API | `server.js` | `POST /api/stories/:id/share` — 创建分享链接；`GET /api/share/:token` — 公开访问分享内容；`DELETE /api/stories/:id/share` — 取消分享 |
| 5.3 前端分享弹窗 | `ShareDialog.jsx` | 生成分享链接+复制按钮，可选密码保护/过期时间，生成嵌入代码（iframe） |
| 5.4 分享预览页 | `SharePreview.jsx` | 公开分享页，精美排版展示品牌文档，带水印和品牌标识 |

### 技术细节

- `shared_stories` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS shared_stories (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL,
    share_token TEXT NOT NULL UNIQUE,
    password TEXT,
    expires_at TEXT,
    view_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_shared_stories_token ON shared_stories(share_token);
  ```
- share_token：`crypto.randomUUID()` 生成，16字符短链
- 密码保护：bcrypt 哈希存储，访问时校验
- 过期时间：可选 1天/7天/30天/永不过期
- 嵌入代码：`<iframe src="{host}/share/{token}" width="800" height="600"></iframe>`
- 分享页独立路由，无需登录

---

## Phase 6: 国际化i18n 🟢 低优先级

**痛点**: 界面全中文，无法服务海外用户

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 6.1 i18n框架 | `i18n.js` | 轻量级 i18n 方案（无需引入重型库），基于 React Context + useTranslation hook |
| 6.2 词典文件 | `locales/` | `zh.json` + `en.json` 双语词典，覆盖所有界面文案 |
| 6.3 语言切换器 | `Navbar.jsx` | Navbar 右侧语言切换按钮，偏好存 localStorage |
| 6.4 组件改造 | 所有组件 | 将硬编码中文替换为 `t('key')` 调用 |

### 技术细节

- i18n 核心实现：
  ```js
  // i18n.js
  const I18nContext = React.createContext()
  export function I18nProvider({ children }) { ... }
  export function useTranslation() {
    const { locale, t, setLocale } = useContext(I18nContext)
    return { t, locale, setLocale }
  }
  ```
- 词典结构：`{ "nav.home": "首页", "nav.create": "创作", ... }`
- 语言切换无需刷新页面，Context 更新触发重渲染
- 优先改造：Navbar、PageHome、PageCreate、StoryViewer
- Prompt 模板暂不翻译（AI输出语言由用户输入决定）

---

## 实施优先级与依赖关系

```
Phase 1 (模型切换) ──→ Phase 2 (Prompt编辑器) ──→ Phase 3 (批量生成)
                                                  ──→ Phase 4 (Diff对比)
                                                  ──→ Phase 5 (分享功能)
                                                  ──→ Phase 6 (国际化)
```

- Phase 1-2 是核心能力升级，串行优先实施
- Phase 3-5 是协作效率提升，Phase 2 完成后可并行
- Phase 6 是扩展性，最后实施

---

## 涉及文件总览

### 后端新增/修改
| 文件 | 变更类型 | Phase |
|------|----------|-------|
| `src/server.js` | 修改 | 1,2,3,4,5 |
| `src/config/index.js` | 修改 | 1 |
| `src/core/Database.js` | 修改 | 2,5 |
| `src/core/Agent.js` | 修改 | 2 |
| `src/core/PromptTemplate.js` | 修改 | 2 |
| `src/core/BatchQueue.js` | 新增 | 3 |
| `src/core/diffUtils.js` | 新增 | 4 |

### 前端新增/修改
| 文件 | 变更类型 | Phase |
|------|----------|-------|
| `frontend/src/components/common/ModelSelector.jsx` | 新增 | 1 |
| `frontend/src/components/common/PromptEditor.jsx` | 新增 | 2 |
| `frontend/src/components/common/DiffViewer.jsx` | 新增 | 4 |
| `frontend/src/components/common/ShareDialog.jsx` | 新增 | 5 |
| `frontend/src/components/prompts/PagePrompts.jsx` | 新增 | 2 |
| `frontend/src/components/batch/BatchCreate.jsx` | 新增 | 3 |
| `frontend/src/components/batch/BatchProgress.jsx` | 新增 | 3 |
| `frontend/src/components/share/SharePreview.jsx` | 新增 | 5 |
| `frontend/src/components/create/PageCreate.jsx` | 修改 | 1,3 |
| `frontend/src/components/result/StoryViewer.jsx` | 修改 | 1,4 |
| `frontend/src/components/layout/Navbar.jsx` | 修改 | 2,6 |
| `frontend/src/services/api.js` | 修改 | 1,2,3,4,5 |
| `frontend/src/i18n.js` | 新增 | 6 |
| `frontend/src/locales/zh.json` | 新增 | 6 |
| `frontend/src/locales/en.json` | 新增 | 6 |
| `frontend/src/App.jsx` | 修改 | 2,5,6 |
| `frontend/src/App.css` | 修改 | 1,2,3,4,5 |
