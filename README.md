# 品牌故事创作智能体 (Brand Story Agent)

> 基于提示词工程的产品品牌推广软文创作智能体，将产品特性转化为生动的品牌故事和场景化体验。

## 核心特性

- **五阶段工作流**：产品分析 → 用户洞察 → 场景构建 → 故事创作 → 内容优化
- **智能提示词模板**：针对不同创作阶段的专用提示词模板
- **质量验证系统**：自动检查夸大宣传、敏感内容、调性一致性
- **多提供商支持**：支持 OpenAI、Claude、本地模型等
- **Web API 服务**：提供 HTTP 接口，易于集成
- **高度可扩展**：支持自定义模板、验证规则、工作流中间件

## 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/your-org/brand-story-agent.git
cd brand-story-agent

# 安装依赖
npm install

# 启动演示
npm start
```

### 基础使用

```javascript
import { BrandStoryAgent } from './src/index.js';

const agent = new BrandStoryAgent();

const result = await agent.createBrandStory({
  productInfo: {
    name: '你的产品名称',
    description: '产品描述',
    features: ['功能1', '功能2', '功能3']
  },
  brandPositioning: {
    tone: 'warm_professional',
    values: ['专业', '温暖'],
    channels: ['微信公众号', '小红书']
  },
  targetAudience: {
    description: '目标用户描述',
    demographics: { age: '25-35' }
  }
});

console.log(result.brandStory.content);
```

### 快速创建

```javascript
const result = await agent.quickCreate(
  '产品名称',
  '产品描述',
  '目标用户'
);
```

## 工作流架构

```
┌─────────────────────────────────────────────────────────────┐
│                    品牌故事创作工作流                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  阶段1: 产品价值分析                                          │
│  ├── 输入: 产品信息、功能特性、竞争格局                         │
│  └── 输出: 核心价值主张、差异化优势、关键收益                   │
│                          ↓                                  │
│  阶段2: 用户需求洞察                                          │
│  ├── 输入: 目标受众、人口统计、心理特征                         │
│  └── 输出: 用户画像、痛点分析、情感需求、动机触发器             │
│                          ↓                                  │
│  阶段3: 场景构建设计                                          │
│  ├── 输入: 用户画像、产品功能、痛点                             │
│  └── 输出: 使用场景、情感连接点、感官细节                       │
│                          ↓                                  │
│  阶段4: 故事叙事创作                                          │
│  ├── 输入: 场景、价值主张、品牌调性                             │
│  └── 输出: 品牌故事、情感共鸣、叙事弧线                         │
│                          ↓                                  │
│  阶段5: 内容优化完善                                          │
│  ├── 输入: 故事内容、品牌调性、目标渠道                         │
│  └── 输出: 优化内容、传播建议、金句、SEO关键词                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API 服务

### 启动服务

```bash
npm run server
# 或
node src/server.js
```

### API 端点

#### 创建品牌故事

```bash
POST /api/story/create
Content-Type: application/json

{
  "productInfo": {
    "name": "智能手环",
    "description": "健康监测智能手环",
    "features": ["心率监测", "睡眠分析", "运动追踪"]
  },
  "brandPositioning": {
    "tone": "warm_professional",
    "channels": ["微信公众号"]
  },
  "targetAudience": {
    "description": "25-40岁健康关注者"
  }
}
```

#### 快速创建

```bash
POST /api/story/quick
Content-Type: application/json

{
  "productName": "智能手环",
  "productDesc": "健康监测智能手环",
  "targetUser": "25-40岁健康关注者"
}
```

#### 内容验证

```bash
POST /api/validate
Content-Type: application/json

{
  "content": "你的内容...",
  "rules": ["noExaggeration", "noSensitiveContent"]
}
```

## 项目结构

```
brand-story-agent/
├── src/
│   ├── core/
│   │   ├── Agent.js              # 智能体主类
│   │   ├── WorkflowEngine.js     # 工作流引擎
│   │   ├── PromptTemplate.js     # 提示词模板
│   │   ├── ContentGenerator.js   # 内容生成器
│   │   └── QualityValidator.js   # 质量验证器
│   ├── index.js                  # 主入口
│   └── server.js                 # Web服务
├── examples/
│   ├── basic-usage.js            # 基础示例
│   └── advanced-usage.js         # 高级示例
├── test/                         # 测试文件
├── package.json
└── README.md
```

## 配置选项

```javascript
const agent = new BrandStoryAgent({
  maxRetries: 3,              // 最大重试次数
  defaultTone: 'warm_professional', // 默认调性
  outputFormat: 'markdown',   // 输出格式
  
  // AI 提供商配置
  provider: 'openai',         // 'mock', 'openai', 'claude', 'local'
  apiKey: 'your-api-key',
  model: 'gpt-4',
  baseUrl: 'https://api.openai.com'
});
```

## 调性选项

| 调性 | 描述 | 适用场景 |
|------|------|---------|
| `warm_professional` | 温暖专业 | 大多数B2C产品 |
| `luxury` | 奢华高端 | 奢侈品、高端服务 |
| `youthful` | 年轻活力 | 年轻人市场 |
| `minimalist` | 极简克制 | 设计类产品 |
| `playful` | 趣味 playful | 游戏、娱乐 |

## 质量验证规则

- **noExaggeration**: 检查夸大宣传（最、第一、100%等）
- **noSensitiveContent**: 检查敏感内容
- **toneConsistency**: 检查调性一致性
- **lengthCheck**: 检查内容长度
- **structureCheck**: 检查结构完整性
- **callToActionCheck**: 检查行动号召

## 自定义扩展

### 自定义模板

```javascript
import { PromptTemplate } from './src/core/PromptTemplate.js';

const template = new PromptTemplate();

template.register('myTemplate', {
  system: '系统提示词',
  user: '用户提示词，支持 {{变量}}'
});

const prompt = template.render('myTemplate', { variable: '值' });
```

### 自定义验证规则

```javascript
import { QualityValidator } from './src/core/QualityValidator.js';

const validator = new QualityValidator();

validator.addRule('myRule', (content) => {
  const issues = [];
  // 检查逻辑...
  return { passed: issues.length === 0, issues };
});
```

### 工作流中间件

```javascript
agent.workflow.use({
  before: async (stageName, context) => {
    console.log(`阶段开始: ${stageName}`);
  },
  after: async (stageName, result, context) => {
    console.log(`阶段完成: ${stageName}`);
  },
  onError: async (stageName, error, context) => {
    console.error(`阶段错误: ${stageName}`);
    return 'continue'; // 或 'stop'
  }
});
```

## 输出格式

```json
{
  "metadata": {
    "generatedAt": "2024-01-01T00:00:00Z",
    "version": "1.0.0",
    "workflowStages": 5
  },
  "productValue": {
    "coreValue": "核心价值主张",
    "differentiation": "差异化优势",
    "keyBenefits": ["收益1", "收益2"]
  },
  "userProfile": {
    "persona": { /* 用户画像 */ },
    "painPoints": [ /* 痛点 */ ],
    "emotionalNeeds": [ /* 情感需求 */ ]
  },
  "scenarios": [ /* 使用场景 */ ],
  "brandStory": {
    "content": "品牌故事正文（Markdown）",
    "wordCount": 1200,
    "emotionalResonance": { /* 情感共鸣 */ }
  },
  "emotionalConnections": {
    "triggers": [ /* 情感触发点 */ ],
    "keyMessages": [ /* 关键信息 */ ]
  },
  "distribution": {
    "channelSuggestions": [ /* 渠道建议 */ ],
    "formatRecommendations": [ /* 格式建议 */ ]
  },
  "quality": {
    "passed": true,
    "score": 95
  }
}
```

## 环境变量

```bash
# AI 提供商配置
OPENAI_API_KEY=your-openai-key
OPENAI_BASE_URL=https://api.openai.com
OPENAI_MODEL=gpt-4

# Claude 配置
CLAUDE_API_KEY=your-claude-key

# 服务配置
PORT=3000
NODE_ENV=development
```

## 开发计划

- [ ] 支持更多 AI 提供商（Gemini、文心一言等）
- [ ] 可视化工作流编辑器
- [ ] 多语言支持（英文、日文等）
- [ ] A/B 测试功能
- [ ] 内容效果追踪
- [ ] 团队协作功能

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

[MIT](LICENSE)

## 联系方式

- 项目主页: https://github.com/your-org/brand-story-agent
- 问题反馈: https://github.com/your-org/brand-story-agent/issues
- 邮箱: your-email@example.com

---

> 让每一个产品，都有属于自己的动人故事。
