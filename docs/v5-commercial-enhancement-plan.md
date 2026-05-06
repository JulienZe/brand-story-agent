# 品牌故事创作智能体 — 商业级亮点功能增强计划

> 聚焦：从"AI文案生成工具"升级为"AI品牌内容智能平台"
> 日期：2026-05-06
> 基于版本3已完成功能：SSE流式推送、JSON Schema校验、内容评分、骨架屏、错误边界、响应式适配
> 基于版本4已规划功能：模型运行时切换、Prompt编辑器、批量生成、Diff对比、分享、国际化

---

## 当前功能盘点与商业级差距

| 已有能力 | 商业级差距 |
|----------|-----------|
| 五阶段AI工作流 | 工作流固定，无法自定义阶段和流程 |
| 多模型支持 | 模型切换需改配置重启，无运行时切换 |
| SSE流式推送 | 仅推送文本片段，无结构化中间结果展示 |
| 内容评分 | 评分维度固定，无法自定义评估标准 |
| 版本管理 | 版本对比为全文JSON，无智能Diff |
| 多渠道适配 | 适配为前端模板拼接，非AI生成 |
| PDF导出 | 导出样式简陋，无品牌定制 |
| 数据看板 | 数据维度少，无洞察分析 |

---

## Phase 1: AI品牌知识库 🔴 最高优先级

**商业价值**: 让AI"懂"品牌，生成内容不再千篇一律，而是深度契合品牌DNA

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 1.1 品牌资料库 | `server.js` + `Database.js` | 上传品牌手册、历史文案、产品文档，解析为结构化知识；新增 `brand_knowledge` 表 |
| 1.2 品牌DNA提取 | `BrandAnalyzer.js` | AI自动提取品牌调性、价值观、语言风格、禁用词，生成品牌DNA档案 |
| 1.3 RAG增强生成 | `Agent.js` + `RAGRetriever.js` | 创作时检索品牌知识库，将相关片段注入Prompt，确保内容与品牌调性一致 |
| 1.4 品牌风格锁定 | `BrandStyleGuard.js` | 基于品牌DNA约束AI输出，自动检测风格偏离并预警 |
| 1.5 前端品牌管理页 | `PageBrand.jsx` | 品牌资料上传、DNA档案展示、风格校验报告 |
| 1.6 创作页集成 | `PageCreate.jsx` | 创作时选择品牌，自动注入品牌上下文 |

### 技术细节

- `brand_knowledge` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS brand_knowledge (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    doc_type TEXT NOT NULL,        -- 'handbook' | 'copywriting' | 'product_doc' | 'brand_dna'
    title TEXT,
    content TEXT NOT NULL,
    chunks TEXT,                   -- JSON: 分块后的文本数组
    vectors TEXT,                  -- JSON: 简化向量（TF-IDF关键词权重）
    metadata TEXT,                 -- JSON: 额外元数据
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_brand_knowledge_brand ON brand_knowledge(brand_name);
  CREATE INDEX IF NOT EXISTS idx_brand_knowledge_type ON brand_knowledge(doc_type);
  ```

- `brand_dna` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS brand_dna (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL UNIQUE,
    tone_keywords TEXT,            -- JSON: 语调关键词 ["温暖","专业","可靠"]
    values TEXT,                   -- JSON: 品牌价值观 ["创新","品质","用户至上"]
    style_guide TEXT,              -- JSON: 语言风格指南 { sentenceStyle, vocabulary, forbiddenWords }
    personality TEXT,              -- JSON: 品牌人格 { archetype, traits, voice }
    color_palette TEXT,            -- JSON: 品牌色板 ["#1B4332","#2D6A4F"]
    sample_phrases TEXT,           -- JSON: 品牌典型用语
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  ```

- RAG检索方案（轻量级，无需额外向量数据库）：
  - 文本分块：按段落分割，每块200-500字
  - 关键词提取：TF-IDF算法提取每块Top20关键词
  - 检索：用户输入关键词匹配 → 计算余弦相似度 → 返回Top3相关片段
  - 注入方式：`systemPrompt += '\n\n【品牌知识参考】\n' + retrievedChunks.join('\n')`

- 品牌风格偏离检测：
  - 对比生成内容与品牌DNA的关键词重叠度
  - 检测禁用词使用
  - 语调一致性评分（0-100）
  - 偏离度>30%时标黄预警，>50%时标红阻断

### 涉及文件

| 文件 | 变更类型 |
|------|----------|
| `src/core/BrandAnalyzer.js` | 新增 |
| `src/core/RAGRetriever.js` | 新增 |
| `src/core/BrandStyleGuard.js` | 新增 |
| `src/core/Database.js` | 修改 |
| `src/core/Agent.js` | 修改 |
| `src/server.js` | 修改 |
| `frontend/src/components/brand/PageBrand.jsx` | 新增 |
| `frontend/src/components/create/PageCreate.jsx` | 修改 |
| `frontend/src/services/api.js` | 修改 |
| `frontend/src/App.jsx` | 修改 |
| `frontend/src/App.css` | 修改 |

---

## Phase 2: 智能竞品分析 🔴 高优先级

**商业价值**: 帮用户了解市场格局，生成差异化定位，这是竞品没有的杀手功能

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 2.1 竞品信息采集 | `CompetitorAnalyzer.js` | 用户输入竞品名称，AI自动分析竞品定位、卖点、文案风格 |
| 2.2 差异化矩阵 | `DiffMatrix.js` | 生成竞品对比矩阵，多维度可视化展示差异点 |
| 2.3 定位建议 | `CompetitorAnalyzer.js` | 基于竞品分析，AI给出差异化定位建议和避坑指南 |
| 2.4 前端竞品分析页 | `PageCompetitor.jsx` | 竞品列表、对比矩阵雷达图、定位建议卡片 |
| 2.5 创作流程集成 | `Agent.js` | "产品价值分析"阶段自动参考竞品数据，强化差异化表达 |

### 技术细节

- `competitors` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS competitors (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    competitor_name TEXT NOT NULL,
    positioning TEXT,              -- JSON: 竞品定位 { tagline, targetUser, priceRange }
    selling_points TEXT,           -- JSON: 核心卖点 [{ point, strength }]
    weaknesses TEXT,               -- JSON: 薄弱环节 [{ weakness, severity }]
    copywriting_style TEXT,        -- JSON: 文案风格 { tone, vocabulary, structure }
    market_share TEXT,             -- 市场份额估计
    analysis TEXT,                 -- JSON: AI完整分析结果
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_competitors_brand ON competitors(brand_name);
  ```

- AI竞品分析Prompt结构：
  ```
  System: 你是一位市场分析专家，擅长竞品分析和差异化定位。
  User: 请分析以下竞品：
    竞品名称：{competitorName}
    我方产品：{productName} - {productDesc}
    我方品牌DNA：{brandDNA}
  
  请从以下维度分析：
  1. 竞品定位与核心卖点
  2. 竞品文案风格特征
  3. 竞品薄弱环节
  4. 我方差异化机会
  5. 定位建议与避坑指南
  ```

- 差异化矩阵维度：
  - 功能覆盖度
  - 价格竞争力
  - 用户体验
  - 品牌认知度
  - 创新程度
  - 服务质量

- 前端雷达图：纯CSS/SVG实现，无需引入图表库
- 创作流程集成：Agent `_analyzeProduct` 阶段注入竞品上下文

### 涉及文件

| 文件 | 变更类型 |
|------|----------|
| `src/core/CompetitorAnalyzer.js` | 新增 |
| `src/core/DiffMatrix.js` | 新增 |
| `src/core/Database.js` | 修改 |
| `src/core/Agent.js` | 修改 |
| `src/server.js` | 修改 |
| `frontend/src/components/competitor/PageCompetitor.jsx` | 新增 |
| `frontend/src/services/api.js` | 修改 |
| `frontend/src/App.jsx` | 修改 |
| `frontend/src/App.css` | 修改 |

---

## Phase 3: AI多轮对话式创作 🔴 高优先级

**商业价值**: 从"一键生成"升级为"人机协作"，大幅提升内容质量和用户参与感

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 3.1 对话数据模型 | `Database.js` | 新增 `conversations` 和 `messages` 表，存储对话历史 |
| 3.2 对话式后端API | `server.js` | `POST /api/chat` 流式对话接口，支持上下文记忆 |
| 3.3 对话式Agent | `Agent.js` | `agent.chat(message, history)` 方法，多轮对话逐步完善内容 |
| 3.4 智能追问引擎 | `ProactiveQuestioner.js` | AI主动追问关键信息（目标用户、核心卖点、情感调性） |
| 3.5 逐段确认机制 | `Agent.js` | 每个阶段生成后暂停，用户确认/修改/重新生成后继续 |
| 3.6 对话式前端UI | `ChatInterface.jsx` | 聊天式界面：消息气泡 + 输入框 + 快捷指令 + 阶段进度 |
| 3.7 模式切换 | `PageCreate.jsx` | 支持"一键生成"与"对话创作"两种模式切换 |

### 技术细节

- `conversations` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    story_id TEXT,
    brand_name TEXT,
    mode TEXT DEFAULT 'chat',      -- 'chat' | 'workflow'
    current_stage TEXT,
    stage_results TEXT,            -- JSON: 各阶段已确认结果
    status TEXT DEFAULT 'active',  -- 'active' | 'completed' | 'abandoned'
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE SET NULL
  );
  ```

- `messages` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,            -- 'user' | 'assistant' | 'system'
    content TEXT NOT NULL,
    stage TEXT,                    -- 关联的工作流阶段
    metadata TEXT,                 -- JSON: { suggestions, stageResult, actions }
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
  ```

- 对话式Agent核心逻辑：
  ```js
  async chat(message, conversationId) {
    const history = await db.getMessages(conversationId)
    const context = this._buildChatContext(history)
    const response = await this.contentGenerator.generate({
      system: CHAT_SYSTEM_PROMPT + context,
      user: message
    }, { stream: true })
    return response
  }
  ```

- 智能追问策略：
  - 首轮：询问产品核心卖点
  - 第二轮：确认目标用户画像
  - 第三轮：了解期望情感调性
  - 后续：基于已收集信息补充追问
  - 追问条件：关键信息缺失时自动触发

- 逐段确认流程：
  - 阶段生成完成 → 展示结果 + 操作按钮（确认/修改/重新生成）
  - 用户确认 → 进入下一阶段
  - 用户修改 → 更新结果 → 重新确认
  - 用户重新生成 → 带修改意见重新调用AI

- 快捷指令：
  - `/regenerate [阶段]` — 重新生成指定阶段
  - `/tone [语调]` — 切换语调
  - `/detail [阶段]` — 展开某阶段详情
  - `/export` — 导出当前内容
  - `/done` — 完成创作

### 涉及文件

| 文件 | 变更类型 |
|------|----------|
| `src/core/ProactiveQuestioner.js` | 新增 |
| `src/core/Database.js` | 修改 |
| `src/core/Agent.js` | 修改 |
| `src/server.js` | 修改 |
| `frontend/src/components/chat/ChatInterface.jsx` | 新增 |
| `frontend/src/components/chat/ChatMessage.jsx` | 新增 |
| `frontend/src/components/chat/ChatInput.jsx` | 新增 |
| `frontend/src/components/create/PageCreate.jsx` | 修改 |
| `frontend/src/services/api.js` | 修改 |
| `frontend/src/App.css` | 修改 |

---

## Phase 4: 品牌视觉资产生成 🟡 中优先级

**商业价值**: 从纯文本到图文并茂，一站式解决品牌内容创作

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 4.1 AI配图提示词 | `ImagePromptBuilder.js` | 基于故事内容自动生成品牌配图提示词 |
| 4.2 图片生成集成 | `ImageGenerator.js` | 调用图片生成API（SiliconFlow/Stable Diffusion/FLUX） |
| 4.3 品牌海报模板 | `PosterTemplates.js` | 预设多套品牌海报模板配置（标题+正文+配图+品牌色） |
| 4.4 海报渲染引擎 | `PosterRenderer.jsx` | 前端Canvas渲染海报，自动填充故事内容+品牌色+配图 |
| 4.5 社交媒体图卡 | `SocialCardBuilder.jsx` | 一键生成小红书封面图、公众号头图、朋友圈海报 |
| 4.6 品牌色板提取 | `ColorExtractor.jsx` | 上传品牌Logo/图片 → Canvas采样 → 生成品牌色板 |
| 4.7 资产管理页 | `PageAssets.jsx` | 统一管理生成的图片、海报、色板 |

### 技术细节

- `brand_assets` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS brand_assets (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,      -- 'image' | 'poster' | 'social_card' | 'color_palette' | 'logo'
    title TEXT,
    prompt TEXT,                   -- AI生成提示词
    image_data TEXT,               -- Base64图片数据或URL
    config TEXT,                   -- JSON: 模板配置/色板数据
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (brand_name) REFERENCES brand_dna(brand_name) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_brand_assets_brand ON brand_assets(brand_name);
  CREATE INDEX IF NOT EXISTS idx_brand_assets_type ON brand_assets(asset_type);
  ```

- AI配图提示词生成：
  ```
  基于品牌故事内容，生成3组配图提示词：
  - 场景图：描述故事中的关键场景
  - 情绪图：传达故事核心情感
  - 产品图：展示产品使用场景
  约束：风格={brandStyle}，色调={brandColors}，禁止文字
  ```

- 图片生成API调用：
  - SiliconFlow：`POST /v1/images/generations`（Stable Diffusion/FLUX）
  - 降级方案：返回提示词，用户自行使用Midjourney等工具
  - 图片存储：Base64存数据库（小规模）或本地文件（大规模）

- 海报模板配置示例：
  ```js
  {
    id: 'minimal-brand',
    name: '极简品牌',
    layout: { type: 'vertical', padding: 40 },
    header: { fontSize: 36, color: '{{brandPrimary}}' },
    body: { fontSize: 16, lineHeight: 1.8, color: '#333' },
    footer: { logo: true, brandName: true },
    accent: { color: '{{brandSecondary}}', position: 'left-bar' }
  }
  ```

- 品牌色提取算法：
  - Canvas绘制图片 → getImageData采样
  - K-Means聚类提取主色调（简化版：颜色量化到Top8）
  - 生成色板：主色、辅色、强调色、背景色、文字色

### 涉及文件

| 文件 | 变更类型 |
|------|----------|
| `src/core/ImagePromptBuilder.js` | 新增 |
| `src/core/ImageGenerator.js` | 新增 |
| `src/core/Database.js` | 修改 |
| `src/server.js` | 修改 |
| `frontend/src/components/assets/PageAssets.jsx` | 新增 |
| `frontend/src/components/assets/PosterRenderer.jsx` | 新增 |
| `frontend/src/components/assets/SocialCardBuilder.jsx` | 新增 |
| `frontend/src/components/assets/ColorExtractor.jsx` | 新增 |
| `frontend/src/services/api.js` | 修改 |
| `frontend/src/App.jsx` | 修改 |
| `frontend/src/App.css` | 修改 |

---

## Phase 5: 团队协作空间 🟡 中优先级

**商业价值**: 从个人工具升级为团队平台，支撑B端商业模式

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 5.1 工作空间模型 | `Database.js` | 新增 `workspaces` 表，多空间隔离 |
| 5.2 成员管理 | `Database.js` + `server.js` | 新增 `members` 表，邀请加入，角色权限（管理员/编辑/查看） |
| 5.3 简单认证 | `AuthService.js` | Token认证（无需完整用户系统），空间级权限控制 |
| 5.4 评审流程 | `ReviewService.js` | 内容创作→提交评审→评审批注→修改→发布 |
| 5.5 评审批注 | `Database.js` | 新增 `reviews` 和 `comments` 表，支持行级评论 |
| 5.6 活动日志 | `Database.js` | 新增 `activity_logs` 表，记录所有操作 |
| 5.7 前端空间管理 | `PageWorkspace.jsx` | 空间切换、成员列表、权限设置 |
| 5.8 评审界面 | `ReviewPanel.jsx` | 评审状态流、批注高亮、审批操作 |

### 技术细节

- `workspaces` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    brand_name TEXT,
    settings TEXT,                 -- JSON: 空间级配置
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  ```

- `members` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'editor',    -- 'admin' | 'editor' | 'viewer'
    token TEXT,                    -- 认证Token
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_members_workspace ON members(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_members_token ON members(token);
  ```

- `reviews` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL,
    workspace_id TEXT,
    reviewer_id TEXT,
    status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'revision'
    summary TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
  );
  ```

- `comments` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    section TEXT,                  -- 批注关联的内容段落
    content TEXT NOT NULL,
    resolved INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_comments_review ON comments(review_id);
  ```

- `activity_logs` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id TEXT,
    member_id TEXT,
    action TEXT NOT NULL,          -- 'create' | 'edit' | 'review' | 'approve' | 'share' | 'delete'
    target_type TEXT,              -- 'story' | 'template' | 'brand' | 'member'
    target_id TEXT,
    detail TEXT,                   -- JSON: 变更摘要
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_activity_workspace ON activity_logs(workspace_id, created_at DESC);
  ```

- 认证方案（轻量级）：
  - 首次访问生成Token存localStorage
  - API请求Header携带 `X-Workspace-Token`
  - 中间件校验Token → 解析workspace_id和member_id
  - 无需注册/登录流程，通过邀请链接加入空间

- 评审流程状态机：
  ```
  draft → submitted → in_review → approved → published
                                → revision_needed → draft
                                → rejected
  ```

### 涉及文件

| 文件 | 变更类型 |
|------|----------|
| `src/core/AuthService.js` | 新增 |
| `src/core/ReviewService.js` | 新增 |
| `src/core/Database.js` | 修改 |
| `src/server.js` | 修改 |
| `frontend/src/components/workspace/PageWorkspace.jsx` | 新增 |
| `frontend/src/components/workspace/MemberList.jsx` | 新增 |
| `frontend/src/components/workspace/ReviewPanel.jsx` | 新增 |
| `frontend/src/components/workspace/ActivityLog.jsx` | 新增 |
| `frontend/src/services/api.js` | 修改 |
| `frontend/src/App.jsx` | 修改 |
| `frontend/src/App.css` | 修改 |

---

## Phase 6: 内容日历与发布计划 🟢 低优先级

**商业价值**: 从"创作工具"升级为"内容运营平台"，提升用户粘性和留存

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 6.1 内容日历模型 | `Database.js` | 新增 `content_calendar` 表，关联故事和发布计划 |
| 6.2 日历视图 | `CalendarView.jsx` | 月/周/日视图，拖拽调整发布时间 |
| 6.3 发布计划 | `PublishPlanner.js` | 设定发布时间、平台、频率，AI生成内容排期建议 |
| 6.4 素材库 | `Database.js` | 新增 `media_library` 表，统一管理品牌素材 |
| 6.5 素材管理页 | `PageMedia.jsx` | 文件上传 + 标签分类 + 搜索 + 创作时快速引用 |
| 6.6 效果追踪 | `ContentTracker.js` | 发布后记录阅读量/互动数据，AI分析优化建议 |
| 6.7 数据报告 | `PageReport.jsx` | 内容效果周报/月报，AI生成洞察总结 |

### 技术细节

- `content_calendar` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS content_calendar (
    id TEXT PRIMARY KEY,
    story_id TEXT,
    workspace_id TEXT,
    title TEXT NOT NULL,
    platform TEXT,                 -- 'wechat' | 'xiaohongshu' | 'douyin' | 'weibo' | 'zhihu' | 'other'
    scheduled_at TEXT,
    published_at TEXT,
    status TEXT DEFAULT 'planned', -- 'planned' | 'scheduled' | 'published' | 'archived'
    metrics TEXT,                  -- JSON: { views, likes, comments, shares, ctr }
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS idx_calendar_scheduled ON content_calendar(scheduled_at);
  CREATE INDEX IF NOT EXISTS idx_calendar_status ON content_calendar(status);
  ```

- `media_library` 表结构：
  ```sql
  CREATE TABLE IF NOT EXISTS media_library (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,       -- 'image' | 'video' | 'document' | 'template'
    file_data TEXT,                -- Base64或文件路径
    tags TEXT,                     -- JSON: 标签数组
    metadata TEXT,                 -- JSON: 宽高、大小等
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_media_workspace ON media_library(workspace_id);
  ```

- AI排期建议逻辑：
  - 分析历史发布数据，识别最佳发布时段
  - 根据平台特性推荐发布频率
  - 避免内容扎堆，合理间隔
  - 考虑节假日和热点事件

- 效果追踪数据录入：
  - 手动录入各平台数据（阅读量、点赞、评论、分享）
  - AI分析趋势，生成优化建议
  - 周报/月报自动生成

### 涉及文件

| 文件 | 变更类型 |
|------|----------|
| `src/core/PublishPlanner.js` | 新增 |
| `src/core/ContentTracker.js` | 新增 |
| `src/core/Database.js` | 修改 |
| `src/server.js` | 修改 |
| `frontend/src/components/calendar/CalendarView.jsx` | 新增 |
| `frontend/src/components/calendar/PageCalendar.jsx` | 新增 |
| `frontend/src/components/media/PageMedia.jsx` | 新增 |
| `frontend/src/components/report/PageReport.jsx` | 新增 |
| `frontend/src/services/api.js` | 修改 |
| `frontend/src/App.jsx` | 修改 |
| `frontend/src/App.css` | 修改 |

---

## 实施优先级与依赖关系

```
Phase 1 (品牌知识库) ──→ Phase 2 (竞品分析) ──→ Phase 3 (对话式创作)
                                                      ↓
                                              Phase 4 (视觉资产)
                                                      ↓
                                              Phase 5 (团队协作)
                                                      ↓
                                              Phase 6 (内容日历)
```

- **Phase 1-3** 是核心差异化功能，串行优先实施
- **Phase 4** 依赖 Phase 1 的品牌数据
- **Phase 5-6** 是商业化扩展，在核心功能稳定后实施

---

## 亮点功能竞争力分析

| 亮点功能 | 竞品覆盖率 | 差异化程度 | 用户价值 | 实施难度 |
|----------|-----------|-----------|---------|---------|
| AI品牌知识库 | <5% | ⭐⭐⭐⭐⭐ | 让AI真正"懂"品牌 | 中 |
| 智能竞品分析 | <3% | ⭐⭐⭐⭐⭐ | 市场洞察+差异化定位 | 中 |
| 对话式创作 | ~15% | ⭐⭐⭐⭐ | 人机协作，质量可控 | 高 |
| 品牌视觉资产 | ~10% | ⭐⭐⭐⭐ | 图文一站式 | 高 |
| 团队协作 | ~20% | ⭐⭐⭐ | B端必备 | 中 |
| 内容日历 | ~25% | ⭐⭐⭐ | 运营闭环 | 低 |

---

## 涉及文件总览

### 后端新增文件

| 文件 | Phase |
|------|-------|
| `src/core/BrandAnalyzer.js` | 1 |
| `src/core/RAGRetriever.js` | 1 |
| `src/core/BrandStyleGuard.js` | 1 |
| `src/core/CompetitorAnalyzer.js` | 2 |
| `src/core/DiffMatrix.js` | 2 |
| `src/core/ProactiveQuestioner.js` | 3 |
| `src/core/ImagePromptBuilder.js` | 4 |
| `src/core/ImageGenerator.js` | 4 |
| `src/core/AuthService.js` | 5 |
| `src/core/ReviewService.js` | 5 |
| `src/core/PublishPlanner.js` | 6 |
| `src/core/ContentTracker.js` | 6 |

### 后端修改文件

| 文件 | Phase |
|------|-------|
| `src/core/Database.js` | 1,2,3,4,5,6 |
| `src/core/Agent.js` | 1,2,3 |
| `src/server.js` | 1,2,3,4,5,6 |
| `src/config/index.js` | 4 |

### 前端新增文件

| 文件 | Phase |
|------|-------|
| `frontend/src/components/brand/PageBrand.jsx` | 1 |
| `frontend/src/components/competitor/PageCompetitor.jsx` | 2 |
| `frontend/src/components/chat/ChatInterface.jsx` | 3 |
| `frontend/src/components/chat/ChatMessage.jsx` | 3 |
| `frontend/src/components/chat/ChatInput.jsx` | 3 |
| `frontend/src/components/assets/PageAssets.jsx` | 4 |
| `frontend/src/components/assets/PosterRenderer.jsx` | 4 |
| `frontend/src/components/assets/SocialCardBuilder.jsx` | 4 |
| `frontend/src/components/assets/ColorExtractor.jsx` | 4 |
| `frontend/src/components/workspace/PageWorkspace.jsx` | 5 |
| `frontend/src/components/workspace/MemberList.jsx` | 5 |
| `frontend/src/components/workspace/ReviewPanel.jsx` | 5 |
| `frontend/src/components/workspace/ActivityLog.jsx` | 5 |
| `frontend/src/components/calendar/CalendarView.jsx` | 6 |
| `frontend/src/components/calendar/PageCalendar.jsx` | 6 |
| `frontend/src/components/media/PageMedia.jsx` | 6 |
| `frontend/src/components/report/PageReport.jsx` | 6 |

### 前端修改文件

| 文件 | Phase |
|------|-------|
| `frontend/src/App.jsx` | 1,2,3,4,5,6 |
| `frontend/src/App.css` | 1,2,3,4,5,6 |
| `frontend/src/services/api.js` | 1,2,3,4,5,6 |
| `frontend/src/components/create/PageCreate.jsx` | 1,3 |
| `frontend/src/components/layout/Navbar.jsx` | 1,2,5,6 |
| `frontend/src/components/result/StoryViewer.jsx` | 5 |
