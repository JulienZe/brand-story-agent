/**
 * 品牌故事创作智能体核心引擎
 * 基于提示词模板的工作流驱动架构
 */

import { WorkflowEngine } from './WorkflowEngine.js';
import { PromptTemplate } from './PromptTemplate.js';
import { EnhancedContentGenerator } from './EnhancedContentGenerator.js';
import { QualityValidator } from './QualityValidator.js';
import config, { validateConfig } from '../config/index.js';

export class BrandStoryAgent {
  static STAGE_SCHEMAS = {
    productAnalysis: {
      valueProposition: { type: 'object', required: true, defaultValue: {} },
      differentiation: { type: 'object', required: false, defaultValue: {} },
      keyFeatures: { type: 'array', required: false, defaultValue: [] },
      coreBenefits: { type: 'object', required: false, defaultValue: {} }
    },
    userInsight: {
      persona: { type: 'object', required: true, defaultValue: {} },
      painPoints: { type: 'array', required: false, defaultValue: [] },
      emotionalNeeds: { type: 'array', required: false, defaultValue: [] },
      motivationTriggers: { type: 'array', required: false, defaultValue: [] }
    },
    sceneDesign: {
      scenarios: { type: 'array', required: true, defaultValue: [] },
      emotionalConnections: { type: 'array', required: false, defaultValue: [] },
      sensoryDetails: { type: 'array', required: false, defaultValue: [] }
    },
    storyCreation: {
      content: { type: 'string', required: true, defaultValue: '', minLength: 100, sanitize: true },
      storyContent: { type: 'string', required: false, defaultValue: '', sanitize: true },
      emotionalResonance: { type: 'string', required: false, defaultValue: '' },
      narrativeArc: { type: 'string', required: false, defaultValue: '' }
    },
    contentOptimization: {
      content: { type: 'string', required: true, defaultValue: '', minLength: 100, sanitize: true },
      suggestions: { type: 'array', required: false, defaultValue: [] },
      keyMessages: { type: 'array', required: false, defaultValue: [] },
      emotionalTriggers: { type: 'array', required: false, defaultValue: [] }
    }
  };

  constructor(configOverrides = {}) {
    validateConfig();
    
    this.config = {
      maxRetries: 3,
      defaultTone: 'warm_professional',
      outputFormat: 'markdown',
      ...configOverrides
    };
    
    this.workflow = new WorkflowEngine();
    this.promptTemplate = new PromptTemplate();
    this.contentGenerator = new EnhancedContentGenerator({
      provider: config.ai.provider,
      ...configOverrides
    });
    this.validator = new QualityValidator();
    
    this._initializeWorkflow();
  }

  /**
   * 初始化工作流阶段
   */
  _initializeWorkflow() {
    this.workflow
      .addStage('productAnalysis', {
        name: '产品价值分析',
        description: '深入分析产品功能特性，提炼核心价值主张',
        handler: this._analyzeProduct.bind(this),
        requiredInputs: ['productInfo'],
        outputs: ['valueProposition', 'differentiation', 'keyFeatures']
      })
      .addStage('userInsight', {
        name: '用户需求洞察',
        description: '识别目标用户群体特征，分析需求痛点',
        handler: this._analyzeUser.bind(this),
        requiredInputs: [],
        outputs: ['userPersona', 'painPoints', 'emotionalNeeds']
      })
      .addStage('sceneDesign', {
        name: '场景构建设计',
        description: '设计真实可信的产品使用场景',
        handler: this._designScenes.bind(this),
        requiredInputs: [],
        outputs: ['scenarios', 'emotionalConnections']
      })
      .addStage('storyCreation', {
        name: '故事叙事创作',
        description: '创作完整的品牌推广故事内容',
        handler: this._createStory.bind(this),
        requiredInputs: [],
        outputs: ['storyContent', 'emotionalResonance']
      })
      .addStage('contentOptimization', {
        name: '内容优化完善',
        description: '润色优化，确保符合品牌调性',
        handler: this._optimizeContent.bind(this),
        requiredInputs: [],
        outputs: ['finalContent', 'distributionSuggestions']
      });
  }

  /**
   * 执行完整的品牌故事创作流程
   */
  async createBrandStory(input) {
    const { productInfo, brandPositioning, targetAudience, options = {} } = input;
    
    console.log('[BrandStoryAgent] 开始创作流程...');
    console.log(`[BrandStoryAgent] 产品: ${productInfo.name || '未命名产品'}`);
    
    const context = {
      productInfo,
      brandPositioning,
      targetAudience,
      options: { ...this.config, ...options }
    };

    try {
      const result = await this.workflow.execute(context);
      
      // 构建最终输出
      const output = this._buildOutput(result);
      
      console.log('[BrandStoryAgent] 创作完成!');
      return output;
      
    } catch (error) {
      console.error('[BrandStoryAgent] 创作失败:', error.message);
      throw new BrandStoryError(`创作流程失败: ${error.message}`, error);
    }
  }

  /**
   * 阶段1: 产品价值分析
   */
  async _analyzeProduct(context) {
    const { productInfo } = context;
    
    console.log('[Stage 1/5] 分析产品价值...');
    
    const prompt = this.promptTemplate.render('productAnalysis', {
      productName: productInfo.name,
      productDescription: productInfo.description,
      productFeatures: productInfo.features,
      productCategory: productInfo.category,
      competitiveLandscape: productInfo.competitors
    });

    const analysis = await this.contentGenerator.generate(prompt, {
      temperature: 0.3,
      maxTokens: 1500,
      schema: BrandStoryAgent.STAGE_SCHEMAS.productAnalysis
    });

    return {
      valueProposition: analysis.valueProposition,
      differentiation: analysis.differentiation,
      keyFeatures: analysis.keyFeatures,
      coreBenefits: analysis.coreBenefits
    };
  }

  /**
   * 阶段2: 用户需求洞察
   */
  async _analyzeUser(context) {
    const { targetAudience, valueProposition } = context;
    
    console.log('[Stage 2/5] 洞察用户需求...');
    
    const prompt = this.promptTemplate.render('userInsight', {
      targetAudience: targetAudience.description,
      demographics: targetAudience.demographics,
      psychographics: targetAudience.psychographics,
      valueProposition: valueProposition
    });

    const insight = await this.contentGenerator.generate(prompt, {
      temperature: 0.4,
      maxTokens: 1500,
      schema: BrandStoryAgent.STAGE_SCHEMAS.userInsight
    });

    return {
      userPersona: insight.persona,
      painPoints: insight.painPoints,
      emotionalNeeds: insight.emotionalNeeds,
      motivationTriggers: insight.motivationTriggers
    };
  }

  /**
   * 阶段3: 场景构建设计
   */
  async _designScenes(context) {
    const { userPersona, keyFeatures, painPoints } = context;
    
    console.log('[Stage 3/5] 构建使用场景...');
    
    const prompt = this.promptTemplate.render('sceneDesign', {
      userPersona: userPersona,
      keyFeatures: keyFeatures,
      painPoints: painPoints,
      sceneCount: 3
    });

    const scenes = await this.contentGenerator.generate(prompt, {
      temperature: 0.6,
      maxTokens: 2000,
      schema: BrandStoryAgent.STAGE_SCHEMAS.sceneDesign
    });

    return {
      scenarios: scenes.scenarios,
      emotionalConnections: scenes.emotionalConnections,
      sensoryDetails: scenes.sensoryDetails
    };
  }

  /**
   * 阶段4: 故事叙事创作
   */
  async _createStory(context) {
    const { scenarios, valueProposition, brandPositioning } = context;
    
    console.log('[Stage 4/5] 创作品牌故事...');
    
    const prompt = this.promptTemplate.render('storyCreation', {
      scenarios: scenarios,
      valueProposition: valueProposition,
      brandTone: brandPositioning.tone,
      brandValues: brandPositioning.values,
      storyLength: '800-1200字'
    });

    const story = await this.contentGenerator.generate(prompt, {
      temperature: 0.7,
      maxTokens: 3000,
      schema: BrandStoryAgent.STAGE_SCHEMAS.storyCreation
    });

    const storyContent = story.content || story.storyContent || '';
    if (storyContent && typeof storyContent === 'string') {
      const chars = storyContent.split('');
      const chunkSize = Math.max(1, Math.ceil(chars.length / 60));
      for (let i = 0; i < chars.length; i += chunkSize) {
        const chunk = chars.slice(i, i + chunkSize).join('');
        this.workflow.emit('stage:text', {
          stage: 'storyCreation',
          text: chunk,
          progress: Math.min(100, Math.round((i / chars.length) * 100)),
          timestamp: Date.now(),
        });
        await new Promise(r => setTimeout(r, 30));
      }
    }

    return {
      storyContent: storyContent,
      emotionalResonance: story.emotionalResonance,
      narrativeArc: story.narrativeArc
    };
  }

  /**
   * 阶段5: 内容优化完善
   */
  async _optimizeContent(context) {
    const { storyContent, brandPositioning } = context;
    
    console.log('[Stage 5/5] 优化内容质量...');
    
    const prompt = this.promptTemplate.render('contentOptimization', {
      content: storyContent,
      brandTone: brandPositioning.tone,
      targetChannels: brandPositioning.channels
    });

    const optimized = await this.contentGenerator.generate(prompt, {
      temperature: 0.5,
      maxTokens: 3000,
      schema: BrandStoryAgent.STAGE_SCHEMAS.contentOptimization
    });

    // 质量验证
    const validation = this.validator.validate(optimized.content, {
      rules: ['noExaggeration', 'noSensitiveContent', 'toneConsistency', 'lengthCheck']
    });

    if (!validation.passed) {
      console.warn('[QualityCheck] 发现问题，自动修正...');
      return this._autoFix(optimized, validation.issues);
    }

    return {
      finalContent: optimized.content,
      distributionSuggestions: optimized.suggestions,
      keyMessages: optimized.keyMessages,
      emotionalTriggers: optimized.emotionalTriggers,
      validation: validation
    };
  }

  /**
   * 自动修正内容问题
   */
  async _autoFix(content, issues) {
    let fixed = content;
    
    for (const issue of issues) {
      const fixPrompt = this.promptTemplate.render('autoFix', {
        content: fixed,
        issue: issue
      });
      
      fixed = await this.contentGenerator.generate(fixPrompt, {
        temperature: 0.3,
        maxTokens: 2000
      });
    }
    
    return fixed;
  }

  /**
   * 构建最终输出
   */
  _buildOutput(result) {
    const { 
      valueProposition, 
      userPersona, 
      scenarios, 
      storyContent, 
      finalContent,
      distributionSuggestions,
      emotionalTriggers,
      keyMessages,
      painPoints,
      emotionalNeeds,
      emotionalResonance,
      sensoryDetails,
      motivationTriggers,
      behaviorPatterns,
      validation
    } = result;

    const diff = valueProposition?.differentiation || {};
    const coreBenefits = valueProposition?.coreBenefits || {};

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.1.0',
        workflowStages: 5,
        duration: result.metadata?.duration
      },
      
      productValue: {
        coreValue: valueProposition?.valueProposition?.core || valueProposition?.core || '',
        extended: valueProposition?.valueProposition?.extended || '',
        differentiation: {
          uniquePoints: diff.uniquePoints || [],
          competitiveAdvantage: diff.competitiveAdvantage || '',
          marketPosition: diff.marketPosition || ''
        },
        keyBenefits: {
          functional: coreBenefits.functional || valueProposition?.valueProposition?.benefits || [],
          emotional: coreBenefits.emotional || [],
          social: coreBenefits.social || []
        },
        keyFeatures: valueProposition?.keyFeatures || [],
        painSolutions: this._derivePainSolutions(valueProposition, painPoints)
      },
      
      userProfile: {
        persona: userPersona || {},
        demographics: this._extractDemographics(userPersona),
        painPoints: painPoints || [],
        emotionalNeeds: emotionalNeeds || [],
        motivationTriggers: motivationTriggers || [],
        behaviorPatterns: behaviorPatterns || {}
      },
      
      scenarios: (scenarios || []).map(s => this._normalizeScenario(s)),
      
      brandStory: {
        content: this._cleanContent(finalContent || storyContent || ''),
        wordCount: this._cleanContent(finalContent || storyContent || '').length,
        emotionalResonance: emotionalResonance || {}
      },
      
      emotionalConnections: {
        triggers: emotionalTriggers || [],
        keyMessages: keyMessages || [],
        sensoryDetails: sensoryDetails || {}
      },
      
      distribution: {
        channelSuggestions: distributionSuggestions || [],
        formatRecommendations: this._getFormatRecommendations(distributionSuggestions)
      },
      
      quality: validation || { passed: true },
      
      contentScore: this.validator.scoreContent(
        this._cleanContent(finalContent || storyContent || ''),
        { brandTone: result.brandPositioning?.tone || result.options?.defaultTone }
      ),
      
      stats: this.contentGenerator.getStats()
    };
  }

  _derivePainSolutions(valueProposition, painPoints) {
    const features = valueProposition?.keyFeatures || [];
    const benefits = valueProposition?.coreBenefits?.functional || valueProposition?.valueProposition?.benefits || [];
    const pains = painPoints || [];
    
    if (pains.length === 0 && features.length === 0) return [];
    
    return pains.map((p, i) => {
      const painText = typeof p === 'string' ? p : p.pain || p.description || '';
      const matchedFeature = features[i] || features[0] || null;
      const matchedBenefit = benefits[i] || benefits[0] || '';
      return {
        pain: painText,
        intensity: typeof p === 'object' ? p.intensity || '中' : '中',
        solution: matchedFeature ? (typeof matchedFeature === 'object' ? matchedFeature.benefit || matchedFeature.feature : matchedFeature) : matchedBenefit,
        feature: matchedFeature ? (typeof matchedFeature === 'object' ? matchedFeature.feature : matchedFeature) : ''
      };
    });
  }

  _extractDemographics(persona) {
    if (!persona) return {};
    if (typeof persona === 'object' && !persona.name) return persona;
    const desc = persona.description || '';
    const ageMatch = desc.match(/(\d{2}[-~]\d{2})岁/);
    const incomeMatch = desc.match(/(\d+k[-~]\d+k)/);
    return {
      ageRange: ageMatch ? ageMatch[1] + '岁' : '',
      incomeRange: incomeMatch ? incomeMatch[1] : '',
      education: desc.includes('本科') ? '本科及以上' : '',
      location: desc.match(/一二线|三四线|城市/) ? (desc.includes('一二线') ? '一二线城市' : '三四线城市') : '',
      occupation: persona.archetype || ''
    };
  }

  _normalizeScenario(s) {
    if (!s) return s;
    return {
      title: s.title || '',
      setting: {
        time: s.setting?.time || '',
        place: s.setting?.place || '',
        atmosphere: s.setting?.atmosphere || ''
      },
      character: {
        name: s.character?.name || (s.userRole?.name) || '',
        role: s.character?.role || s.userRole?.role || '',
        state: s.character?.state || '',
        desire: s.character?.desire || ''
      },
      plot: {
        setup: s.plot?.setup || '',
        conflict: s.plot?.conflict || '',
        climax: s.plot?.climax || '',
        resolution: s.plot?.resolution || '',
        aftermath: s.plot?.aftermath || ''
      },
      sensoryDetails: s.sensoryDetails || [],
      emotionalArc: s.emotionalArc || [],
      productRole: s.productRole || '',
      expectedEffect: s.expectedEffect || s.plot?.aftermath || '',
      operationFlow: s.operationFlow || this._deriveOperationFlow(s)
    };
  }

  _deriveOperationFlow(s) {
    if (!s || !s.plot) return [];
    const steps = [];
    if (s.plot.setup) steps.push({ step: 1, action: s.plot.setup, phase: '背景' });
    if (s.plot.conflict) steps.push({ step: 2, action: s.plot.conflict, phase: '挑战' });
    if (s.plot.climax) steps.push({ step: 3, action: s.plot.climax, phase: '产品介入' });
    if (s.plot.resolution) steps.push({ step: 4, action: s.plot.resolution, phase: '问题解决' });
    return steps;
  }

  _cleanContent(content) {
    if (!content || typeof content !== 'string') return ''
    let cleaned = content
    cleaned = cleaned.replace(/" "(\s*" ")*/g, '')
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    const lines = cleaned.split('\n')
    const result = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) { result.push(''); continue }
      if (/^(但|却|直到|突然|并|在那一刻)$/.test(line) && i + 1 < lines.length) {
        lines[i + 1] = line + lines[i + 1]
        continue
      }
      const prevLine = result.length > 0 ? result[result.length - 1] : ''
      if (prevLine && line.length <= 4 && /^[^\s#\-*>]/.test(line) && !/^[0-9]+$/.test(line)) {
        result[result.length - 1] = prevLine + line
        continue
      }
      result.push(line)
    }
    return result.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  }

  /**
   * 获取格式推荐
   */
  _getFormatRecommendations(channels) {
    const formatMap = {
      '微信公众号': { format: '长图文', length: '1200-2000字', style: '深度叙事' },
      '小红书': { format: '图文笔记', length: '300-800字', style: '场景种草' },
      '抖音': { format: '短视频脚本', length: '200-500字', style: '快节奏剧情' },
      '微博': { format: '短图文', length: '100-300字', style: '话题互动' },
      '知乎': { format: '问答体', length: '1500-3000字', style: '专业分析' },
      'B站': { format: '视频脚本', length: '800-1500字', style: '年轻化表达' }
    };

    return (channels || []).map(ch => formatMap[ch] || { format: '通用', length: '800-1200字', style: '标准' });
  }

  /**
   * 快速创作接口
   */
  async quickCreate(productName, productDesc, targetUser, productFeatures = []) {
    return this.createBrandStory({
      productInfo: {
        name: productName,
        description: productDesc,
        features: productFeatures
      },
      brandPositioning: {
        tone: 'warm_professional',
        values: [],
        channels: ['微信公众号', '小红书']
      },
      targetAudience: {
        description: targetUser,
        demographics: {},
        psychographics: {}
      }
    });
  }

  async regenerateSection(existingResult, section, instruction) {
    const sectionNames = {
      productValue: '产品价值',
      userProfile: '用户画像',
      scenarios: '使用场景',
      brandStory: '品牌故事',
    }
    const sectionLabel = sectionNames[section] || section

    const sectionData = existingResult[section]
    const contextInfo = {
      productValue: existingResult.productValue,
      userProfile: existingResult.userProfile,
    }

    const prompt = this.promptTemplate.render('regenerateSection', {
      sectionName: sectionLabel,
      sectionContent: JSON.stringify(sectionData, null, 2),
      instruction: instruction || `请重新生成${sectionLabel}部分，保持与其他部分的一致性`,
      productContext: JSON.stringify({
        coreValue: contextInfo.productValue?.coreValue,
        persona: contextInfo.userProfile?.persona,
      }, null, 2),
    })

    const result = await this.contentGenerator.generate(prompt, {
      temperature: 0.6,
      maxTokens: 2000,
    })

    return result.section || result
  }

  async refineContent(existingResult, instruction, sections) {
    const targetSections = sections || ['productValue', 'userProfile', 'scenarios', 'brandStory']

    const prompt = this.promptTemplate.render('refineContent', {
      currentContent: JSON.stringify(
        Object.fromEntries(targetSections.map(s => [s, existingResult[s]])),
        null,
        2
      ),
      instruction,
      productContext: JSON.stringify({
        productName: existingResult.metadata || '',
        coreValue: existingResult.productValue?.coreValue,
      }, null, 2),
    })

    const refined = await this.contentGenerator.generate(prompt, {
      temperature: 0.5,
      maxTokens: 3000,
    })

    const merged = { ...existingResult }
    if (refined.productValue) merged.productValue = { ...merged.productValue, ...refined.productValue }
    if (refined.userProfile) merged.userProfile = { ...merged.userProfile, ...refined.userProfile }
    if (refined.scenarios) merged.scenarios = refined.scenarios
    if (refined.brandStory) merged.brandStory = { ...merged.brandStory, ...refined.brandStory }
    if (refined.emotionalConnections) merged.emotionalConnections = { ...merged.emotionalConnections, ...refined.emotionalConnections }

    return merged
  }
}

/**
 * 自定义错误类
 */
export class BrandStoryError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'BrandStoryError';
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}
