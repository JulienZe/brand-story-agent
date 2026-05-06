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

    agent.workflow.on('stage:text', (data) => {
      sendSSE('stage:text', data);
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

app.get('/api/stories/:id/versions', (req, res) => {
  try {
    const story = db.getStory(req.params.id)
    if (!story) return res.status(404).json({ success: false, error: '记录不存在' })
    const versions = db.getVersionsByStoryId(req.params.id)
    res.json({ success: true, data: { versions, currentVersion: story.currentVersion } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/stories/:id/versions/:version', (req, res) => {
  try {
    const version = db.getVersionByNumber(req.params.id, parseInt(req.params.version))
    if (!version) return res.status(404).json({ success: false, error: '版本不存在' })
    res.json({ success: true, data: version })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/api/stories/:id/content', (req, res) => {
  try {
    const { result } = req.body
    if (!result) return res.status(400).json({ success: false, error: '缺少必要参数: result' })
    const updated = db.updateStoryResult(req.params.id, result)
    if (!updated) return res.status(404).json({ success: false, error: '记录不存在' })
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/api/stories/:id/rating', (req, res) => {
  try {
    const { rating } = req.body
    if (rating === undefined || rating < 0 || rating > 5) {
      return res.status(400).json({ success: false, error: '评分必须在0-5之间' })
    }
    const updated = db.updateStoryRating(req.params.id, rating)
    if (!updated) return res.status(404).json({ success: false, error: '记录不存在' })
    res.json({ success: true, data: { rating } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/stories/:id/regenerate/section', async (req, res) => {
  try {
    const { section, instruction } = req.body
    if (!section) return res.status(400).json({ success: false, error: '缺少必要参数: section' })

    const story = db.getStory(req.params.id)
    if (!story) return res.status(404).json({ success: false, error: '记录不存在' })

    const { BrandStoryAgent } = await import('./core/Agent.js')
    const agent = new BrandStoryAgent({ tone: story.tone })
    const sectionResult = await agent.regenerateSection(story.result, section, instruction || '')

    const mergedResult = { ...story.result, [section]: sectionResult }
    const updated = db.updateStoryResult(req.params.id, mergedResult)

    db.createVersion({
      id: `v_${req.params.id}_${updated.currentVersion}`,
      storyId: req.params.id,
      version: updated.currentVersion,
      result: mergedResult,
      changeType: 'regenerate',
      changeSummary: `重新生成: ${section}`,
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('局部重新生成失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/stories/:id/refine', async (req, res) => {
  try {
    const { instruction, sections } = req.body
    if (!instruction) return res.status(400).json({ success: false, error: '缺少必要参数: instruction' })

    const story = db.getStory(req.params.id)
    if (!story) return res.status(404).json({ success: false, error: '记录不存在' })

    const { BrandStoryAgent } = await import('./core/Agent.js')
    const agent = new BrandStoryAgent({ tone: story.tone })
    const refinedResult = await agent.refineContent(story.result, instruction, sections)

    const updated = db.updateStoryResult(req.params.id, refinedResult)

    db.createVersion({
      id: `v_${req.params.id}_${updated.currentVersion}`,
      storyId: req.params.id,
      version: updated.currentVersion,
      result: refinedResult,
      changeType: 'refine',
      changeSummary: instruction.substring(0, 100),
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('优化创作失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/dashboard', (req, res) => {
  try {
    const stats = db.getDashboardStats()
    const usageStats = db.getUsageStats({ days: 30 })
    res.json({ success: true, data: { ...stats, usage: usageStats } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ========== 品牌DNA API ==========

app.get('/api/brands', (req, res) => {
  try {
    const brands = db.getAllBrandDNAs()
    res.json({ success: true, data: brands })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/brands/:name', (req, res) => {
  try {
    const brand = db.getBrandDNA(req.params.name)
    if (!brand) return res.status(404).json({ success: false, error: '品牌不存在' })
    res.json({ success: true, data: brand })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/brands', (req, res) => {
  try {
    const { brandName, toneKeywords, values, styleGuide, personality, colorPalette, samplePhrases, logoData } = req.body
    if (!brandName) return res.status(400).json({ success: false, error: '缺少必要参数: brandName' })
    const brand = db.createBrandDNA({ brandName, toneKeywords, values, styleGuide, personality, colorPalette, samplePhrases, logoData })
    res.json({ success: true, data: brand })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/brands/:name', (req, res) => {
  try {
    const deleted = db.deleteBrandDNA(req.params.name)
    if (!deleted) return res.status(404).json({ success: false, error: '品牌不存在' })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ========== 品牌资产 API ==========

app.get('/api/brands/:name/assets', (req, res) => {
  try {
    const { assetType, limit, offset } = req.query
    const assets = db.getBrandAssets(req.params.name, { assetType, limit: parseInt(limit) || 50, offset: parseInt(offset) || 0 })
    const total = db.getBrandAssetCount(req.params.name)
    res.json({ success: true, data: { assets, total } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/assets/:id', (req, res) => {
  try {
    const asset = db.getBrandAsset(req.params.id)
    if (!asset) return res.status(404).json({ success: false, error: '资产不存在' })
    res.json({ success: true, data: asset })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/brands/:name/assets', (req, res) => {
  try {
    const { assetType, title, prompt, imageData, config, tags, metadata } = req.body
    if (!assetType) return res.status(400).json({ success: false, error: '缺少必要参数: assetType' })
    const asset = db.createBrandAsset({ brandName: req.params.name, assetType, title, prompt, imageData, config, tags, metadata })
    res.json({ success: true, data: asset })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/assets/:id', (req, res) => {
  try {
    const deleted = db.deleteBrandAsset(req.params.id)
    if (!deleted) return res.status(404).json({ success: false, error: '资产不存在' })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ========== 图片生成 API ==========

app.post('/api/image/generate', async (req, res) => {
  try {
    const { prompt, negativePrompt, width, height, brandName, assetType, title } = req.body
    if (!prompt) return res.status(400).json({ success: false, error: '缺少必要参数: prompt' })

    const { ImageGenerator } = await import('./core/ImageGenerator.js')
    const generator = new ImageGenerator()
    const result = await generator.generate({ prompt, negativePrompt, width, height })

    if (brandName && result.success) {
      const asset = db.createBrandAsset({
        brandName,
        assetType: assetType || 'image',
        title: title || 'AI Generated Image',
        prompt,
        imageData: result.imageData,
        tags: ['ai-generated', result.provider],
        metadata: { model: result.model, provider: result.provider, isPlaceholder: result.isPlaceholder || false },
      })
      result.assetId = asset.id
    }

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('图片生成失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/image/prompts', async (req, res) => {
  try {
    const { brandName, storyContent, toneKeywords, colorPalette } = req.body
    if (!brandName) return res.status(400).json({ success: false, error: '缺少必要参数: brandName' })

    const { ImagePromptBuilder } = await import('./core/ImagePromptBuilder.js')
    const builder = new ImagePromptBuilder()
    const prompts = await builder.buildStoryImagePrompts({ brandName, storyContent, toneKeywords, colorPalette })

    res.json({ success: true, data: prompts })
  } catch (error) {
    console.error('提示词生成失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/image/poster-prompt', async (req, res) => {
  try {
    const { brandName, productName, personality, colorPalette, posterStyle } = req.body
    if (!brandName) return res.status(400).json({ success: false, error: '缺少必要参数: brandName' })

    const { ImagePromptBuilder } = await import('./core/ImagePromptBuilder.js')
    const builder = new ImagePromptBuilder()
    const result = await builder.buildPosterBackgroundPrompt({ brandName, productName, personality, colorPalette, posterStyle })

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('海报提示词生成失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/image/social-card-prompt', async (req, res) => {
  try {
    const { brandName, platform, title, colorPalette } = req.body
    if (!brandName || !platform) return res.status(400).json({ success: false, error: '缺少必要参数: brandName, platform' })

    const { ImagePromptBuilder } = await import('./core/ImagePromptBuilder.js')
    const builder = new ImagePromptBuilder()
    const result = builder.buildSocialCardPrompt({ brandName, platform, title, colorPalette })

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('社交图卡提示词生成失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/image/status', async (req, res) => {
  try {
    const { ImageGenerator } = await import('./core/ImageGenerator.js')
    const generator = new ImageGenerator()
    const info = generator.getProviderInfo()
    res.json({ success: true, data: info })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ========== 色板提取 API ==========

app.post('/api/brand/extract-colors', (req, res) => {
  try {
    const { imageData, brandName } = req.body
    if (!imageData) return res.status(400).json({ success: false, error: '缺少必要参数: imageData' })

    const base64Match = imageData.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/)
    if (!base64Match) return res.status(400).json({ success: false, error: '无效的图片数据格式' })

    const colors = extractColorsFromBase64(base64Match[2])

    if (brandName) {
      const existingBrand = db.getBrandDNA(brandName)
      if (existingBrand) {
        db.createBrandDNA({
          brandName,
          toneKeywords: existingBrand.toneKeywords,
          values: existingBrand.values,
          styleGuide: existingBrand.styleGuide,
          personality: existingBrand.personality,
          colorPalette: colors.map(c => c.hex),
          samplePhrases: existingBrand.samplePhrases,
          logoData: existingBrand.logoData,
        })
      } else {
        db.createBrandDNA({
          brandName,
          colorPalette: colors.map(c => c.hex),
        })
      }
    }

    res.json({ success: true, data: colors })
  } catch (error) {
    console.error('色板提取失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

function extractColorsFromBase64(base64Data) {
  const buffer = Buffer.from(base64Data, 'base64')
  const pixelSkip = Math.max(1, Math.floor(buffer.length / 5000))
  const colorMap = new Map()

  for (let i = 0; i < buffer.length - 2; i += pixelSkip) {
    const r = buffer[i]
    const g = buffer[i + 1]
    const b = buffer[i + 2]

    const qr = Math.round(r / 32) * 32
    const qg = Math.round(g / 32) * 32
    const qb = Math.round(b / 32) * 32

    const brightness = (qr * 299 + qg * 587 + qb * 114) / 1000
    if (brightness < 20 || brightness > 245) continue

    const key = `${qr},${qg},${qb}`
    colorMap.set(key, (colorMap.get(key) || 0) + 1)
  }

  const sorted = [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  const results = []
  for (const [key, count] of sorted) {
    const [r, g, b] = key.split(',').map(Number)
    const hex = '#' + [r, g, b].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('')
    const hsl = rgbToHsl(r, g, b)
    results.push({ hex, r, g, b, hsl, count })
  }

  const filtered = []
  for (const color of results) {
    const isDuplicate = filtered.some(existing => {
      const dr = Math.abs(existing.r - color.r)
      const dg = Math.abs(existing.g - color.g)
      const db = Math.abs(existing.b - color.b)
      return dr + dg + db < 80
    })
    if (!isDuplicate) filtered.push(color)
    if (filtered.length >= 8) break
  }

  return filtered.length > 0 ? filtered : [
    { hex: '#1B4332', r: 27, g: 67, b: 50, hsl: [155, 42, 18], count: 0 },
    { hex: '#2D6A4F', r: 45, g: 106, b: 79, hsl: [153, 40, 30], count: 0 },
    { hex: '#40916C', r: 64, g: 145, b: 108, hsl: [152, 39, 41], count: 0 },
    { hex: '#52B788', r: 82, g: 183, b: 136, hsl: [151, 42, 52], count: 0 },
  ]
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

// ========== 海报模板 API ==========

app.get('/api/poster-templates', (req, res) => {
  const templates = [
    {
      id: 'minimal-brand',
      name: '极简品牌',
      description: '简洁大气的品牌海报',
      preview: 'linear-gradient(135deg, #1B4332, #2D6A4F)',
      layout: { type: 'vertical', padding: 60, headerHeight: 120, footerHeight: 80 },
      header: { fontSize: 42, fontWeight: 700, color: '#1B4332', align: 'left' },
      body: { fontSize: 18, lineHeight: 1.8, color: '#333333', maxWidth: 600 },
      footer: { showLogo: true, showBrandName: true, color: '#666666', fontSize: 14 },
      accent: { type: 'left-bar', width: 6, color: '#2D6A4F' },
      background: { type: 'solid', color: '#FFFFFF' },
    },
    {
      id: 'story-narrative',
      name: '故事叙事',
      description: '沉浸式故事讲述海报',
      preview: 'linear-gradient(135deg, #2D6A4F, #40916C)',
      layout: { type: 'vertical', padding: 50, headerHeight: 100, footerHeight: 60 },
      header: { fontSize: 36, fontWeight: 600, color: '#FFFFFF', align: 'center' },
      body: { fontSize: 16, lineHeight: 2, color: 'rgba(255,255,255,0.9)', maxWidth: 560 },
      footer: { showLogo: true, showBrandName: true, color: 'rgba(255,255,255,0.6)', fontSize: 12 },
      accent: { type: 'bottom-line', height: 3, color: 'rgba(255,255,255,0.3)' },
      background: { type: 'gradient', from: '#1B4332', to: '#2D6A4F' },
    },
    {
      id: 'product-showcase',
      name: '产品展示',
      description: '突出产品特性的展示海报',
      preview: 'linear-gradient(135deg, #40916C, #74C69D)',
      layout: { type: 'split', padding: 40, imageRatio: 0.5 },
      header: { fontSize: 32, fontWeight: 700, color: '#1B4332', align: 'left' },
      body: { fontSize: 15, lineHeight: 1.8, color: '#444444', maxWidth: 400 },
      footer: { showLogo: true, showBrandName: true, color: '#888888', fontSize: 13 },
      accent: { type: 'corner-triangle', size: 80, color: '#52B788' },
      background: { type: 'solid', color: '#F8F9FA' },
    },
    {
      id: 'social-card',
      name: '社交卡片',
      description: '适合社交媒体分享的卡片',
      preview: 'linear-gradient(135deg, #74C69D, #95D5B2)',
      layout: { type: 'card', padding: 30, borderRadius: 16 },
      header: { fontSize: 24, fontWeight: 700, color: '#1B4332', align: 'center' },
      body: { fontSize: 14, lineHeight: 1.7, color: '#555555', maxWidth: 320 },
      footer: { showLogo: true, showBrandName: true, color: '#999999', fontSize: 11 },
      accent: { type: 'top-bar', height: 4, color: '#2D6A4F' },
      background: { type: 'solid', color: '#FFFFFF' },
    },
  ]
  res.json({ success: true, data: templates })
})

app.post('/api/poster/render', (req, res) => {
  try {
    const { templateId, brandName, title, content, colorPalette, logoData, width, height } = req.body
    if (!templateId || !content) return res.status(400).json({ success: false, error: '缺少必要参数' })

    const posterConfig = {
      templateId,
      brandName: brandName || 'Brand',
      title: title || '',
      content: content.substring(0, 2000),
      colorPalette: colorPalette || ['#1B4332', '#2D6A4F'],
      logoData: logoData || null,
      width: width || 800,
      height: height || 1200,
    }

    const asset = db.createBrandAsset({
      brandName: posterConfig.brandName,
      assetType: 'poster',
      title: title || `Poster - ${templateId}`,
      config: posterConfig,
      tags: ['poster', templateId],
    })

    res.json({ success: true, data: { config: posterConfig, assetId: asset.id } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.originalUrl
  })
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('[ServerError]', err)
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: '请求体JSON格式错误' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: '请求体过大' })
  }
  if (err.code === 'SQLITE_ERROR') {
    return res.status(500).json({ success: false, error: '数据库操作失败', detail: err.message })
  }
  
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    success: false,
    error: status >= 500 ? '服务器内部错误' : err.message,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 进程级异常处理
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err)
})

process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason)
})

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
