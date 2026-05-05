/**
 * Web API 服务
 * 提供HTTP接口供外部调用
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import config, { validateConfig } from './config/index.js';
import * as db from './core/Database.js';

validateConfig();

const app = express();
const PORT = config.app.port;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode}`);
  });
  
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'brand-story-agent',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API 文档
app.get('/', (req, res) => {
  res.json({
    name: '品牌故事创作智能体 API',
    version: '2.0.0',
    aiProvider: config.ai.provider,
    endpoints: {
      'POST /api/story/create': '创建品牌故事',
      'POST /api/story/quick': '快速创建品牌故事',
      'GET /api/templates': '获取可用模板列表',
      'POST /api/validate': '验证内容质量',
      'GET /api/workflow/status': '获取工作流状态',
      'GET /api/stats': '获取AI使用统计',
      'GET /health': '健康检查'
    },
    documentation: 'https://github.com/your-org/brand-story-agent'
  });
});

/**
 * 创建品牌故事 (完整流程)
 * POST /api/story/create
 */
app.post('/api/story/create', async (req, res) => {
  try {
    const { productInfo, brandPositioning, targetAudience, options } = req.body;

    if (!productInfo || !productInfo.name) {
      return res.status(400).json({
        error: '缺少必要参数: productInfo.name'
      });
    }

    const { BrandStoryAgent } = await import('./core/Agent.js');
    const agent = new BrandStoryAgent(options);
    const result = await agent.createBrandStory({
      productInfo,
      brandPositioning: brandPositioning || {},
      targetAudience: targetAudience || {},
      options
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('创建品牌故事失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.details || {}
    });
  }
});

/**
 * SSE 创建品牌故事 (实时进度推送)
 * GET /api/story/create/stream
 */
app.get('/api/story/create/stream', async (req, res) => {
  const { productName, productDesc, targetUser, tone, features } = req.query;

  if (!productName || !productDesc) {
    return res.status(400).json({ error: '缺少必要参数: productName, productDesc' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendSSE = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  sendSSE('connected', { message: 'SSE连接已建立', timestamp: Date.now() });

  try {
    const { BrandStoryAgent } = await import('./core/Agent.js');
    const agent = new BrandStoryAgent({ tone });

    agent.workflow.on('stage:start', (data) => {
      sendSSE('stage:start', data);
    });

    agent.workflow.on('stage:complete', (data) => {
      sendSSE('stage:complete', data);
    });

    agent.workflow.on('stage:error', (data) => {
      sendSSE('stage:error', data);
    });

    const productFeatures = features ? features.split(',').filter(f => f.trim()) : [];

    const result = await agent.quickCreate(
      productName,
      productDesc,
      targetUser || '通用用户',
      productFeatures
    );

    const record = {
      id: Date.now().toString(),
      productName,
      productDesc,
      template: null,
      targetUser: targetUser || null,
      tone: tone || null,
      result,
    };
    try { db.createStory(record) } catch (e) { console.error('保存到数据库失败:', e.message) }

    sendSSE('complete', { result, id: record.id });
  } catch (error) {
    console.error('SSE创建失败:', error);
    sendSSE('error', { error: error.message });
  } finally {
    res.end();
  }
});

/**
 * 快速创建品牌故事
 * POST /api/story/quick
 */
app.post('/api/story/quick', async (req, res) => {
  try {
    const { productName, productDesc, productFeatures, targetUser, options } = req.body;

    if (!productName || !productDesc) {
      return res.status(400).json({
        error: '缺少必要参数: productName, productDesc'
      });
    }

    const { BrandStoryAgent } = await import('./core/Agent.js');
    const agent = new BrandStoryAgent(options);
    const result = await agent.quickCreate(
      productName,
      productDesc,
      targetUser || '通用用户',
      productFeatures || []
    );

    const record = {
      id: Date.now().toString(),
      productName,
      productDesc,
      template: null,
      targetUser: targetUser || null,
      tone: options?.tone || null,
      result,
    }
    try { db.createStory(record) } catch (e) { console.error('保存到数据库失败:', e.message) }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('快速创建失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取模板列表
 * GET /api/templates
 */
app.get('/api/templates', async (req, res) => {
  try {
    const { PromptTemplate } = await import('./core/PromptTemplate.js');
    const template = new PromptTemplate();
    
    res.json({
      success: true,
      data: {
        templates: template.listTemplates(),
        stages: [
          { id: 'productAnalysis', name: '产品价值分析', description: '提炼核心价值主张' },
          { id: 'userInsight', name: '用户需求洞察', description: '分析用户痛点需求' },
          { id: 'sceneDesign', name: '场景构建设计', description: '设计使用场景' },
          { id: 'storyCreation', name: '故事叙事创作', description: '创作品牌故事' },
          { id: 'contentOptimization', name: '内容优化完善', description: '优化传播效果' }
        ]
      }
    });
  } catch (error) {
    console.error('获取模板失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 内容质量验证
 * POST /api/validate
 */
app.post('/api/validate', async (req, res) => {
  try {
    const { content, rules } = req.body;

    if (!content) {
      return res.status(400).json({
        error: '缺少必要参数: content'
      });
    }

    const { QualityValidator } = await import('./core/QualityValidator.js');
    const validator = new QualityValidator();
    const result = validator.validate(content, { rules });

    res.json({
      success: true,
      data: {
        passed: result.passed,
        score: result.score,
        issues: result.issues,
        report: validator.generateReport(result)
      }
    });

  } catch (error) {
    console.error('验证失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取工作流状态
 * GET /api/workflow/status
 */
app.get('/api/workflow/status', (req, res) => {
  res.json({
    success: true,
    data: {
      stages: [
        { id: 1, name: '产品价值分析', status: 'available' },
        { id: 2, name: '用户需求洞察', status: 'available' },
        { id: 3, name: '场景构建设计', status: 'available' },
        { id: 4, name: '故事叙事创作', status: 'available' },
        { id: 5, name: '内容优化完善', status: 'available' }
      ]
    }
  });
});

/**
 * 获取AI使用统计
 * GET /api/stats
 */
app.get('/api/stats', async (req, res) => {
  try {
    const { EnhancedContentGenerator } = await import('./core/EnhancedContentGenerator.js');
    const generator = new EnhancedContentGenerator();
    const stats = generator.getStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        provider: config.ai.provider,
        config: {
          fallbackEnabled: config.ai.fallback.enabled,
          rateLimit: config.ai.rateLimit.maxRequests
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取可用的AI模型列表
 * GET /api/models
 */
app.get('/api/models', async (req, res) => {
  try {
    const { getAllProviders, getRecommendedModels } = await import('./config/index.js');
    
    const providers = getAllProviders();
    const recommended = getRecommendedModels();
    
    res.json({
      success: true,
      data: {
        currentProvider: config.ai.provider,
        currentModel: config.ai.model,
        providers: Object.entries(providers).map(([key, p]) => ({
          id: key,
          name: key.toUpperCase(),
          type: p.type,
          description: p.description,
          defaultModel: p.defaultModel,
          pricing: p.pricing
        })),
        recommendedModels: recommended,
        setup: {
          ollama: {
            install: '下载安装: https://ollama.com/',
            models: [
              'ollama pull qwen3:8b',
              'ollama pull deepseek-r1:7b',
              'ollama pull llama3:8b'
            ],
            start: 'ollama serve'
          },
          siliconflow: {
            register: 'https://www.siliconflow.cn/',
            free: '有免费额度',
            models: ['Qwen/Qwen2.5-7B-Instruct', 'deepseek-ai/DeepSeek-V3']
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== 数据库持久化 API ==========

app.get('/api/stories', (req, res) => {
  try {
    const { search, favorites, limit, offset } = req.query
    const stories = db.getAllStories({
      search: search || undefined,
      favoritesOnly: favorites === 'true' || favorites === '1',
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    })
    const total = db.getStoryCount()
    res.json({ success: true, data: { stories, total } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/stories/:id', (req, res) => {
  try {
    const story = db.getStory(req.params.id)
    if (!story) return res.status(404).json({ success: false, error: '记录不存在' })
    res.json({ success: true, data: story })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/stories', (req, res) => {
  try {
    const { id, productName, productDesc, template, targetUser, tone, result } = req.body
    if (!id || !productName || !result) {
      return res.status(400).json({ success: false, error: '缺少必要参数' })
    }
    const story = db.createStory({ id, productName, productDesc, template, targetUser, tone, result })
    res.json({ success: true, data: story })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/stories/:id', (req, res) => {
  try {
    const deleted = db.deleteStory(req.params.id)
    if (!deleted) return res.status(404).json({ success: false, error: '记录不存在' })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/api/stories/:id/favorite', (req, res) => {
  try {
    const isFav = db.toggleFavorite(req.params.id)
    if (isFav === null) return res.status(404).json({ success: false, error: '记录不存在' })
    res.json({ success: true, data: { isFavorite: isFav } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/favorites', (req, res) => {
  try {
    const ids = db.getFavorites()
    res.json({ success: true, data: ids })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('未捕获错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: err.message
  });
});

// 启动服务
const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('  品牌故事创作智能体服务已启动');
  console.log('='.repeat(60));
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  API文档: http://localhost:${PORT}/`);
  console.log(`  健康检查: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
});

// 服务器错误处理
server.on('error', (error) => {
  console.error('服务器错误:', error);
});

// 防止进程意外退出
process.on('uncaughtException', (error) => {
  console.error('未捕获异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的拒绝:', reason);
});

export default app;
