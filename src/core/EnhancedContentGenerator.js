/**
 * 增强版内容生成器
 * 支持多AI提供商、速率限制、重试机制、成本追踪
 */

import { getAIConfig } from '../config/index.js';

export class EnhancedContentGenerator {
  constructor(config = {}) {
    this.config = {
      provider: 'mock',
      ...config
    };
    
    this.rateLimiter = new RateLimiter();
    this.retryManager = new RetryManager();
    this.costTracker = new CostTracker();
    this.validator = new ResponseValidator();
    
    this.generationHistory = [];
  }

  /**
   * 生成内容
   */
  async generate(prompt, options = {}) {
    const startTime = Date.now();
    const provider = options.provider || this.config.provider;
    
    try {
      // 等待速率限制
      await this.rateLimiter.waitForSlot();
      
      // 使用重试机制执行
      const result = await this.retryManager.execute(async () => {
        return await this._generateWithProvider(provider, prompt, options);
      });
      
      // 记录历史
      this.generationHistory.push({
        timestamp: new Date().toISOString(),
        provider,
        prompt: typeof prompt === 'object' ? prompt.user : prompt,
        result,
        duration: Date.now() - startTime,
        success: true
      });
      
      return result;
      
    } catch (error) {
      // 记录失败
      this.generationHistory.push({
        timestamp: new Date().toISOString(),
        provider,
        error: error.message,
        duration: Date.now() - startTime,
        success: false
      });
      
      // 尝试降级
      if (options.fallback !== false) {
        return await this._fallbackGenerate(prompt, options, error);
      }
      
      throw error;
    }
  }

  /**
   * 使用指定提供商生成
   */
  async _generateWithProvider(provider, prompt, options) {
    switch (provider) {
      case 'ollama':
        return await this._generateWithOllama(prompt, options);
      case 'siliconflow':
        return await this._generateWithSiliconFlow(prompt, options);
      case 'xfyun':
        return await this._generateWithXFYun(prompt, options);
      case 'claude':
        return await this._generateWithClaude(prompt, options);
      case 'openai':
        return await this._generateWithOpenAI(prompt, options);
      case 'deepseek':
        return await this._generateWithDeepSeek(prompt, options);
      case 'mock':
      default:
        return await this._generateWithMock(prompt, options);
    }
  }

  /**
   * Ollama 本地模型调用
   */
  async _generateWithOllama(prompt, options) {
    const aiConfig = getAIConfig('ollama');
    
    const systemPrompt = typeof prompt === 'object' ? prompt.system : '';
    const userPrompt = typeof prompt === 'object' ? prompt.user : prompt;
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n---\n\n${userPrompt}` : userPrompt;

    const response = await fetch(`${aiConfig.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || aiConfig.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || aiConfig.maxTokens
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`Ollama API错误: ${response.status} - ${errorData.error || response.statusText}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const content = data.response || '';
    
    console.log(`[Ollama] 生成完成，耗时: ${data.total_duration ? (data.total_duration / 1e9).toFixed(2) : '?'}s`);
    
    return this._parseResponse(content, options);
  }

  /**
   * 硅基流动 API 调用
   */
  async _generateWithSiliconFlow(prompt, options) {
    const aiConfig = getAIConfig('siliconflow');
    
    if (!aiConfig.apiKey) {
      throw new Error('SiliconFlow API密钥未配置，请设置 SILICONFLOW_API_KEY 环境变量');
    }

    const systemPrompt = typeof prompt === 'object' ? prompt.system : '你是一个有帮助的AI助手。';
    const userPrompt = typeof prompt === 'object' ? prompt.user : prompt;

    const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || aiConfig.maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`SiliconFlow API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // 追踪成本（硅基流动免费额度内不计费）
    if (data.usage) {
      this.costTracker.track('siliconflow', data.usage.prompt_tokens, data.usage.completion_tokens);
    }
    
    return this._parseResponse(content, options);
  }

  /**
   * 讯飞星火 API 调用
   */
  async _generateWithXFYun(prompt, options) {
    const aiConfig = getAIConfig('xfyun');
    
    if (!aiConfig.apiKey) {
      throw new Error('讯飞星火 API密钥未配置，请设置 XFYUN_API_KEY 环境变量');
    }

    const systemPrompt = typeof prompt === 'object' ? prompt.system : '你是一个有帮助的AI助手。';
    const userPrompt = typeof prompt === 'object' ? prompt.user : prompt;

    // 讯飞星火使用WebSocket，这里简化为HTTP接口
    const response = await fetch(`${aiConfig.baseUrl}/v3.5/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appid': aiConfig.appId,
        'X-CurTime': Math.floor(Date.now() / 1000).toString(),
        'X-Param': Buffer.from(JSON.stringify({
          aue: 'raw',
          auf: 'audio/L16;rate=16000',
          vcn: 'xiaoyan',
          speed: 50,
          volume: 50,
          pitch: 50,
          engine_type: 's迎风3.5'
        })).toString('base64')
      },
      body: JSON.stringify({
        header: {
          app_id: aiConfig.appId,
          uid: 'brand-story-agent'
        },
        parameter: {
          chat: {
            domain: 'generalv3.5',
            temperature: options.temperature || 0.5,
            max_tokens: options.maxTokens || 2048
          }
        },
        payload: {
          message: {
            text: [
              { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
            ]
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`讯飞星火 API错误: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const content = data.payload?.choices?.text?.[0]?.content || '';
    
    return this._parseResponse(content, options);
  }

  /**
   * Claude API 调用
   */
  async _generateWithClaude(prompt, options) {
    const aiConfig = getAIConfig('claude');
    
    if (!aiConfig.apiKey) {
      throw new Error('Claude API密钥未配置');
    }

    const systemPrompt = typeof prompt === 'object' ? prompt.system : '你是一个有帮助的AI助手。';
    const userPrompt = typeof prompt === 'object' ? prompt.user : prompt;

    const response = await fetch(`${aiConfig.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': aiConfig.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: options.model || aiConfig.model,
        max_tokens: options.maxTokens || aiConfig.maxTokens,
        temperature: options.temperature || 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`Claude API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    // 追踪成本
    if (data.usage) {
      this.costTracker.track('claude', data.usage.input_tokens, data.usage.output_tokens);
    }
    
    // 解析JSON响应
    return this._parseResponse(content, options);
  }

  /**
   * OpenAI API 调用
   */
  async _generateWithOpenAI(prompt, options) {
    const aiConfig = getAIConfig('openai');
    
    if (!aiConfig.apiKey) {
      throw new Error('OpenAI API密钥未配置');
    }

    const systemPrompt = typeof prompt === 'object' ? prompt.system : '你是一个有帮助的AI助手。';
    const userPrompt = typeof prompt === 'object' ? prompt.user : prompt;

    const response = await fetch(`${aiConfig.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || aiConfig.maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`OpenAI API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // 追踪成本
    if (data.usage) {
      this.costTracker.track('openai', data.usage.prompt_tokens, data.usage.completion_tokens);
    }
    
    return this._parseResponse(content, options);
  }

  /**
   * DeepSeek API 调用
   */
  async _generateWithDeepSeek(prompt, options) {
    const aiConfig = getAIConfig('deepseek');
    
    if (!aiConfig.apiKey) {
      throw new Error('DeepSeek API密钥未配置');
    }

    const systemPrompt = typeof prompt === 'object' ? prompt.system : '你是一个有帮助的AI助手。';
    const userPrompt = typeof prompt === 'object' ? prompt.user : prompt;

    const response = await fetch(`${aiConfig.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || aiConfig.maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`DeepSeek API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // 追踪成本
    if (data.usage) {
      this.costTracker.track('deepseek', data.usage.prompt_tokens, data.usage.completion_tokens);
    }
    
    return this._parseResponse(content, options);
  }

  /**
   * Mock生成
   */
  async _generateWithMock(prompt, options) {
    await this._delay(500 + Math.random() * 1000);
    
    const promptText = typeof prompt === 'object' ? prompt.user : prompt;
    
    if (promptText.includes('请分析以下产品') && promptText.includes('产品名称:')) {
      return this._mockProductAnalysis(promptText);
    } else if (promptText.includes('请创作一篇品牌推广软文')) {
      return this._mockStoryCreation(promptText);
    } else if (promptText.includes('设计3个产品使用场景')) {
      return this._mockSceneDesign(promptText);
    } else if (promptText.includes('请分析以下目标用户群体')) {
      return this._mockUserInsight(promptText);
    } else if (promptText.includes('请优化以下品牌故事内容')) {
      return this._mockContentOptimization(promptText);
    } else {
      return { content: '这是一个模拟的品牌故事内容。' };
    }
  }

  /**
   * 降级处理
   */
  async _fallbackGenerate(prompt, options, originalError) {
    console.warn(`[ContentGenerator] ${options.provider || this.config.provider} 失败，尝试降级:`, originalError.message);
    
    const fallbackOrder = ['ollama', 'siliconflow', 'deepseek', 'xfyun', 'claude', 'openai', 'mock'];
    const currentProvider = options.provider || this.config.provider;
    const currentIndex = fallbackOrder.indexOf(currentProvider);
    
    for (let i = currentIndex + 1; i < fallbackOrder.length; i++) {
      const fallbackProvider = fallbackOrder[i];
      
      try {
        console.log(`[ContentGenerator] 尝试使用 ${fallbackProvider}`);
        const result = await this._generateWithProvider(fallbackProvider, prompt, { ...options, fallback: false });
        console.log(`[ContentGenerator] ${fallbackProvider} 成功`);
        return result;
      } catch (error) {
        console.warn(`[ContentGenerator] ${fallbackProvider} 也失败了:`, error.message);
        continue;
      }
    }
    
    throw new Error(`所有AI提供商都失败了: ${originalError.message}`);
  }

  /**
   * 解析响应
   */
  _parseResponse(content, options) {
    // 如果期望JSON格式
    if (options.expectJson !== false) {
      try {
        // 尝试提取JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // 验证响应
          if (options.schema) {
            const validation = this.validator.validate(parsed, options.schema);
            if (!validation.valid) {
              console.warn('[ContentGenerator] 响应验证失败:', validation.errors);
            }
          }
          
          return parsed;
        }
      } catch (error) {
        console.warn('[ContentGenerator] JSON解析失败:', error.message);
      }
    }
    
    // 返回原始内容
    return { content };
  }

  /**
   * Mock方法（保持原有逻辑）
   */
  _mockProductAnalysis(promptText) {
    const productName = this._extractVariable(promptText, '产品名称') || '智能创作工具';
    const productDesc = this._extractVariable(promptText, '产品描述') || 'AI驱动的内容创作平台';
    
    return {
      valueProposition: {
        core: `让${productName}触手可及`,
        extended: `为用户提供${productDesc}，大幅提升创作效率与作品质量`,
        benefits: ['效率提升', '专业呈现', '多平台发布', '实时协作']
      },
      differentiation: {
        uniquePoints: ['AI智能排版', '一键多平台发布', '云端素材库'],
        competitiveAdvantage: '专注创作者痛点，提供完整的创作到发布闭环',
        marketPosition: '面向独立创作者的轻量级智能创作工具'
      },
      keyFeatures: [
        { feature: 'AI智能排版', benefit: '自动生成专业排版方案', scenario: '内容创作完成后一键美化' },
        { feature: '多平台发布', benefit: '一次创作，多平台分发', scenario: '内容创作完成后同步发布' },
        { feature: '实时协作', benefit: '多人实时协同编辑', scenario: '团队协作完成大型项目' }
      ],
      coreBenefits: {
        functional: ['提升创作效率', '降低技术门槛', '专业输出质量'],
        emotional: ['减轻创作焦虑', '增强专业自信', '获得成就感'],
        social: ['提升个人品牌形象', '扩大内容影响力']
      }
    };
  }

  _mockUserInsight(promptText) {
    return {
      persona: {
        name: '小林',
        archetype: '追求成长的创作者',
        description: '28岁，自由撰稿人，在一二线城市生活，本科及以上学历，月收入8k-20k。热爱创作，重视个人品牌建设，追求专业品质。',
        quote: '好的内容值得被好好呈现'
      },
      painPoints: [
        { pain: '工具复杂难上手', intensity: '高', frequency: '经常' },
        { pain: '排版耗时费力', intensity: '高', frequency: '经常' },
        { pain: '作品不够专业', intensity: '中', frequency: '偶尔' }
      ],
      emotionalNeeds: [
        { need: '被理解和认同', manifestation: '作品获得认可和赞赏', priority: '高' },
        { need: '成长与进步', manifestation: '技能提升和职业发展', priority: '高' }
      ],
      motivationTriggers: [
        { trigger: 'deadline压力', context: '紧急任务', action: '寻找高效工具' }
      ],
      behaviorPatterns: {
        informationGathering: '通过社交媒体、公众号获取信息',
        decisionFactors: '用户评价、功能匹配度、价格',
        usageContext: '深夜创作、咖啡馆工作、居家办公'
      }
    };
  }

  _mockSceneDesign(promptText) {
    return {
      scenarios: [
        {
          title: '深夜的救星',
          setting: { time: '深夜十一点', place: '家中书房', atmosphere: '窗外雨声淅沥，台灯昏黄' },
          character: { name: '小林', state: '疲惫但焦虑', desire: '尽快完成排版任务' },
          plot: {
            setup: '客户临时要求明天一早看到排版精美的方案',
            conflict: '小林不擅长排版，以往都要花一整天',
            climax: '打开工具，AI自动完成排版和设计',
            resolution: '半小时完成原本需要一天的工作',
            aftermath: '小林终于能安心睡个好觉'
          },
          sensoryDetails: ['键盘敲击声在雨夜中格外清晰', '屏幕蓝光映在小林疲惫的脸上'],
          emotionalArc: ['焦虑', '惊喜', '释然', '自信'],
          productRole: '在关键时刻提供能力加成'
        }
      ],
      emotionalConnections: [
        { emotion: '被理解的温暖', trigger: '工具懂创作者的痛点', resonance: '减少孤独感' }
      ],
      sensoryDetails: {
        visual: ['深夜的屏幕蓝光', '咖啡馆的阳光'],
        auditory: ['雨声', '爵士乐', '键盘声'],
        tactile: ['咖啡杯的温度', '平板的触感']
      }
    };
  }

  _mockStoryCreation(promptText) {
    return {
      content: `# 一个人的创作，也可以很专业

深夜十一点，雨声敲打着窗户。

小林盯着电脑屏幕，手指悬在键盘上方。客户的消息还亮在手机上："明天早上能把排版好的方案发我吗？"

她叹了口气。内容早就写好了，但排版...那是她的软肋。

---

**每一个创作者，都有过这样的时刻。**

好的工具，不是让你变成另一个人，而是让你成为更好的自己。

---

**每一个认真创作的人，都值得被认真对待。**

**让专业，触手可及。**`,
      emotionalResonance: {
        primary: '被理解的温暖与专业认同',
        secondary: '从焦虑到自信的转变',
        intensity: '高'
      },
      narrativeArc: {
        hook: '深夜截稿的焦虑场景',
        setup: '创作者的技术困境',
        climax: '三十秒完成一天工作的转折',
        resolution: '专业触手可及的信念升华'
      },
      keyMessages: ['工具不应成为创作的门槛', '专业呈现是每个创作者的权利'],
      callToAction: {
        text: '欢迎加入我们，和十万创作者一起',
        type: '软',
        urgency: '低'
      }
    };
  }

  _mockContentOptimization(promptText) {
    const content = this._extractVariable(promptText, '原始内容') || '';
    
    return {
      content: content || '优化后的内容',
      improvements: [
        { aspect: '开头吸引力', before: '原文', after: '优化后', reason: '增加吸引力' }
      ],
      suggestions: [
        { channel: '微信公众号', adaptation: '增加引导关注', format: '长图文' }
      ],
      keyMessages: ['专业触手可及'],
      emotionalTriggers: [
        { trigger: '深夜孤独场景', location: '开头', technique: '场景共鸣' }
      ],
      goldenSentences: ['好的工具，让你成为更好的自己。'],
      seoKeywords: ['创作者工具', '内容创作']
    };
  }

  /**
   * 辅助方法
   */
  _extractVariable(text, varName) {
    const regex = new RegExp(`${varName}[:\\s]+([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalRequests: this.generationHistory.length,
      successfulRequests: this.generationHistory.filter(h => h.success).length,
      failedRequests: this.generationHistory.filter(h => !h.success).length,
      totalCost: this.costTracker.getTotalCost(),
      costByProvider: this.costTracker.getCostByProvider()
    };
  }
}

/**
 * 速率限制器
 */
class RateLimiter {
  constructor(maxRequests = 60, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async waitForSlot() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.windowMs - (now - this.requests[0]);
      console.log(`[RateLimiter] 达到速率限制，等待 ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}

/**
 * 重试管理器
 */
class RetryManager {
  constructor(maxRetries = 3, backoffMs = 1000) {
    this.maxRetries = maxRetries;
    this.backoffMs = backoffMs;
  }

  async execute(fn) {
    let lastError;
    
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (this._isRetryable(error)) {
          const waitTime = this.backoffMs * Math.pow(2, i);
          console.log(`[RetryManager] 第 ${i + 1} 次重试，等待 ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError;
  }

  _isRetryable(error) {
    return error.status === 429 || error.status >= 500;
  }
}

/**
 * 成本追踪器
 */
class CostTracker {
  constructor() {
    this.pricing = {
      'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'deepseek-chat': { input: 0.0001, output: 0.0002 }
    };
    
    this.usage = {};
  }

  track(provider, inputTokens, outputTokens) {
    if (!this.usage[provider]) {
      this.usage[provider] = { input: 0, output: 0, cost: 0 };
    }
    
    const pricing = this.pricing[this._getModelForProvider(provider)];
    const cost = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
    
    this.usage[provider].input += inputTokens;
    this.usage[provider].output += outputTokens;
    this.usage[provider].cost += cost;
    
    console.log(`[CostTracker] ${provider}: 输入${inputTokens} 输出${outputTokens} 成本$${cost.toFixed(4)}`);
    
    return cost;
  }

  getTotalCost() {
    return Object.values(this.usage).reduce((sum, u) => sum + u.cost, 0);
  }

  getCostByProvider() {
    const result = {};
    for (const [provider, usage] of Object.entries(this.usage)) {
      result[provider] = {
        inputTokens: usage.input,
        outputTokens: usage.output,
        cost: usage.cost
      };
    }
    return result;
  }

  _getModelForProvider(provider) {
    const modelMap = {
      'claude': 'claude-3-5-sonnet',
      'openai': 'gpt-4o',
      'deepseek': 'deepseek-chat'
    };
    return modelMap[provider] || 'claude-3-5-sonnet';
  }
}

/**
 * 响应验证器
 */
class ResponseValidator {
  validate(response, schema) {
    const errors = [];
    
    for (const [key, rule] of Object.entries(schema)) {
      if (rule.required && !response[key]) {
        errors.push(`缺少必需字段: ${key}`);
      }
      
      if (rule.type && response[key] !== undefined && typeof response[key] !== rule.type) {
        errors.push(`字段 ${key} 类型错误: 期望 ${rule.type}, 实际 ${typeof response[key]}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
