/**
 * 统一配置管理
 * 支持多种AI提供商：中国开源模型、Ollama本地部署、硅基流动等
 */

const config = {
  app: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    name: 'brand-story-agent',
    version: '2.0.0'
  },
  
  ai: {
    provider: process.env.AI_PROVIDER || 'ollama',
    model: process.env.AI_MODEL || 'qwen3:8b',
    fallback: {
      enabled: process.env.AI_FALLBACK_ENABLED === 'true',
      order: (process.env.AI_FALLBACK_ORDER || 'ollama,deepseek,mock').split(',')
    },
    rateLimit: {
      maxRequests: parseInt(process.env.AI_RATE_LIMIT || '60'),
      windowMs: 60000
    },
    retry: {
      maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
      backoffMs: parseInt(process.env.AI_RETRY_BACKOFF || '1000')
    },
    costTracking: {
      enabled: process.env.AI_COST_TRACKING !== 'false'
    }
  },
  
  workflow: {
    persistence: {
      enabled: process.env.WORKFLOW_PERSISTENCE === 'true',
      storage: process.env.WORKFLOW_STORAGE || 'memory'
    },
    timeout: parseInt(process.env.WORKFLOW_TIMEOUT || '300000')
  },
  
  providers: {
    // ==================== 本地Ollama模型（免费） ====================
    ollama: {
      type: 'local',
      apiKey: null,
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      defaultModel: 'qwen2.5:7b',
      maxTokens: 4096,
      pricing: {
        input: 0,
        output: 0
      },
      description: 'Ollama本地部署的开源模型，完全免费，支持qwen3、deepseek-r1、llama3等'
    },
    
    // ==================== 硅基流动（免费额度） ====================
    siliconflow: {
      type: 'api',
      apiKey: process.env.SILICONFLOW_API_KEY,
      baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
      defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
      maxTokens: 4096,
      pricing: {
        input: 0,
        output: 0
      },
      description: '硅基流动提供免费额度，支持多种开源模型'
    },
    
    // ==================== DeepSeek（便宜） ====================
    deepseek: {
      type: 'api',
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      defaultModel: 'deepseek-chat',
      maxTokens: 4096,
      pricing: {
        input: 0.0001,
        output: 0.0002
      },
      description: 'DeepSeek V3，性价比高，中文支持好'
    },
    
    // ==================== Claude（付费） ====================
    claude: {
      type: 'api',
      apiKey: process.env.CLAUDE_API_KEY,
      baseUrl: process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com',
      defaultModel: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      pricing: {
        input: 0.003,
        output: 0.015
      },
      description: 'Anthropic Claude，中文理解能力强，创意写作质量高'
    },
    
    // ==================== OpenAI（付费） ====================
    openai: {
      type: 'api',
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com',
      defaultModel: 'gpt-4o',
      maxTokens: 4096,
      pricing: {
        input: 0.005,
        output: 0.015
      },
      description: 'OpenAI GPT-4o，通用性强'
    },
    
    // ==================== 讯飞星火（免费额度） ====================
    xfyun: {
      type: 'api',
      apiKey: process.env.XFYUN_API_KEY,
      appId: process.env.XFYUN_APP_ID,
      apiSecret: process.env.XFYUN_API_SECRET,
      baseUrl: 'https://spark-api.xf-yun.com',
      defaultModel: 'v3.5',
      maxTokens: 4096,
      pricing: {
        input: 0,
        output: 0
      },
      description: '讯飞星火认知大模型，提供免费额度'
    }
  },
  
  // 推荐的中国开源免费模型配置
  recommendedModels: {
    ollama: [
      { model: 'qwen2.5:7b', name: '通义千问2.5 7B', memory: '7B', description: '阿里开源，中文能力强，已安装 ⭐当前使用', hardware: '~5GB显存/10GB内存' },
      { model: 'qwen2.5:latest', name: '通义千问2.5 latest', memory: '7B', description: '最新版本通义千问', hardware: '~5GB显存/10GB内存' },
      { model: 'qwen2.5-coder:14b-base-q2_K', name: '通义千问Coder 14B', memory: '14B', description: '代码能力强', hardware: '~6GB显存/12GB内存' },
      { model: 'deepcoder:latest', name: 'DeepCoder latest', memory: '14.8B', description: '代码生成能力强', hardware: '~9GB显存/18GB内存' },
      { model: 'marco-o1:latest', name: 'Marco-o1 latest', memory: '7.6B', description: '推理优化模型', hardware: '~5GB显存/10GB内存' }
    ],
    siliconflow: [
      { model: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5 7B', description: '阿里开源，中文优化', price: '免费' },
      { model: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', description: 'DeepSeek官方', price: '免费' },
      { model: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', description: 'Meta开源', price: '免费' }
    ]
  }
};

export function validateConfig() {
  const errors = [];
  const warnings = [];
  
  const validProviders = ['ollama', 'siliconflow', 'deepseek', 'xfyun', 'claude', 'openai', 'mock'];
  
  if (!validProviders.includes(config.ai.provider)) {
    errors.push(`不支持的AI提供商: ${config.ai.provider}`);
    errors.push(`支持的提供商: ${validProviders.join(', ')}`);
  }
  
  if (config.ai.provider !== 'mock' && config.ai.provider !== 'ollama') {
    const providerConfig = config.providers[config.ai.provider];
    if (providerConfig && providerConfig.type === 'api' && !providerConfig.apiKey) {
      errors.push(`缺少 ${config.ai.provider.toUpperCase()}_API_KEY 环境变量`);
    }
  }
  
  // Ollama特殊检查
  if (config.ai.provider === 'ollama') {
    warnings.push('Ollama模式：需要本地安装Ollama并下载模型');
    warnings.push('安装命令: ollama pull qwen3:8b');
    warnings.push('启动服务: ollama serve');
  }
  
  if (errors.length > 0) {
    console.error('='.repeat(60));
    console.error('配置验证失败:');
    errors.forEach(e => console.error('  ❌ ' + e));
    console.error('='.repeat(60));
    console.warn('将使用 Mock 模式运行');
    config.ai.provider = 'mock';
    return false;
  }
  
  if (warnings.length > 0) {
    console.warn('='.repeat(60));
    console.warn('配置提示:');
    warnings.forEach(w => console.warn('  ⚠️  ' + w));
    console.warn('='.repeat(60));
  }
  
  return true;
}

export function getAIConfig(provider = null) {
  const targetProvider = provider || config.ai.provider;
  
  if (targetProvider === 'mock') {
    return { provider: 'mock' };
  }
  
  const providerConfig = config.providers[targetProvider];
  if (!providerConfig) {
    throw new Error(`未知的AI提供商: ${targetProvider}`);
  }
  
  return {
    provider: targetProvider,
    type: providerConfig.type,
    apiKey: providerConfig.apiKey,
    baseUrl: providerConfig.baseUrl,
    model: config.ai.model || providerConfig.defaultModel,
    maxTokens: providerConfig.maxTokens,
    pricing: providerConfig.pricing,
    description: providerConfig.description
  };
}

export function getRecommendedModels(provider = null) {
  const targetProvider = provider || config.ai.provider;
  return config.recommendedModels[targetProvider] || [];
}

export function getAllProviders() {
  const providers = {};
  
  for (const [key, provider] of Object.entries(config.providers)) {
    providers[key] = {
      name: key,
      type: provider.type,
      description: provider.description,
      defaultModel: provider.defaultModel,
      pricing: provider.pricing
    };
  }
  
  return providers;
}

export default config;
