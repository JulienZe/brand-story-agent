/**
 * 提示词模板引擎
 * 管理所有创作阶段的提示词模板
 */

export class PromptTemplate {
  constructor() {
    this.templates = new Map();
    this._registerDefaultTemplates();
  }

  /**
   * 注册默认模板
   */
  _registerDefaultTemplates() {
    // 阶段1: 产品价值分析
    this.templates.set('productAnalysis', {
      system: `你是一位产品分析师。请严格按照JSON格式输出，不要输出任何JSON之外的内容。`,
      
      user: `分析以下产品的核心价值，输出JSON格式：

产品名称: {{productName}}
产品描述: {{productDescription}}
主要功能: {{productFeatures}}
产品类别: {{productCategory}}

输出格式（严格遵守）：
{"valueProposition":{"core":"一句话核心价值","extended":"一段话扩展描述","benefits":["收益1","收益2","收益3"]},"differentiation":{"uniquePoints":["差异点1","差异点2"],"competitiveAdvantage":"竞争优势","marketPosition":"市场定位"},"keyFeatures":[{"feature":"功能名","benefit":"用户收益","scenario":"使用场景"}],"coreBenefits":{"functional":["功能收益1","功能收益2"],"emotional":["情感收益1"],"social":["社交收益1"]}}`
    });

    this.templates.set('userInsight', {
      system: `你是一位用户研究专家。请严格按照JSON格式输出，不要输出任何JSON之外的内容。`,
      
      user: `分析以下目标用户，输出JSON格式：

目标用户: {{targetAudience}}
人口统计: {{demographics}}
产品价值: {{valueProposition}}

输出格式（严格遵守）：
{"persona":{"name":"用户画像名称","archetype":"用户原型","description":"详细描述","quote":"代表性语录"},"painPoints":[{"pain":"痛点描述","intensity":"高","frequency":"经常"}],"emotionalNeeds":[{"need":"情感需求","manifestation":"表现形式","priority":"高"}],"motivationTriggers":[{"trigger":"触发因素","context":"触发场景","action":"期望行动"}],"behaviorPatterns":{"informationGathering":"信息收集方式","decisionFactors":"决策因素","usageContext":"使用场景"}}`
    });

    this.templates.set('sceneDesign', {
      system: `你是一位场景设计师。请严格按照JSON格式输出，不要输出任何JSON之外的内容。`,
      
      user: `基于以下信息设计2个产品使用场景，输出JSON格式：

用户画像: {{userPersona}}
产品功能: {{keyFeatures}}
用户痛点: {{painPoints}}

输出格式（严格遵守）：
{"scenarios":[{"title":"场景标题","setting":{"time":"时间","place":"地点","atmosphere":"氛围"},"character":{"name":"角色名","role":"角色身份","state":"初始状态","desire":"内心渴望"},"plot":{"setup":"场景铺垫","conflict":"冲突展现","climax":"产品介入","resolution":"问题解决","aftermath":"情感升华"},"sensoryDetails":["感官细节1"],"emotionalArc":["起始情绪","转折情绪","最终情绪"],"productRole":"产品作用"}]}`
    });

    // 阶段4: 故事叙事创作
    this.templates.set('storyCreation', {
      system: `你是一位品牌故事作家。请严格按照JSON格式输出，不要输出任何JSON之外的内容。content字段必须是完整连贯的中文文章，不要出现断裂、重复或空内容。`,
      
      user: `请根据以下信息创作品牌故事，输出JSON格式：

产品价值: {{valueProposition}}
使用场景: {{scenarios}}
品牌调性: {{brandTone}}
故事长度: {{storyLength}}

要求：
1. 用真实场景开头
2. 展现产品如何解决问题
3. 语言自然流畅
4. 结尾有行动号召

输出格式（严格遵守）：
{"content":"完整的故事正文，用\\n换行，用##作为段落标题","emotionalResonance":{"primary":"主要情感","secondary":"次要情感","intensity":"中"},"keyMessages":["信息1","信息2"],"callToAction":{"text":"号召文案","type":"软","urgency":"低"}}

注意：content必须是一篇完整连贯的文章，不能有断裂或重复。`
    });

    // 阶段5: 内容优化
    this.templates.set('contentOptimization', {
      system: `你是一位内容编辑。请严格按照JSON格式输出，不要输出任何JSON之外的内容。content字段必须是完整连贯的中文文章。`,
      
      user: `请优化以下品牌故事，输出JSON格式：

原始内容: {{content}}
品牌调性: {{brandTone}}

优化要求：
1. 修正语法问题
2. 增强开头吸引力
3. 优化段落节奏
4. 强化金句

输出格式（严格遵守）：
{"content":"优化后的完整文章，用\\n换行","keyMessages":["信息1","信息2"],"goldenSentences":["金句1","金句2"]}

注意：content必须完整输出优化后的文章，不能省略或截断。`
    });

    // 自动修正模板
    this.templates.set('autoFix', {
      system: `你是一位内容修正专家，负责快速修复内容中的问题。`,
      user: `请修正以下内容中的问题：

内容: {{content}}
问题: {{issue}}

请直接输出修正后的内容，保持原有风格和结构。`
    });
  }

  /**
   * 渲染模板
   */
  render(templateName, variables = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`模板 "${templateName}" 不存在`);
    }

    return {
      system: this._interpolate(template.system, variables),
      user: this._interpolate(template.user, variables)
    };
  }

  /**
   * 插值替换
   */
  _interpolate(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key];
      if (value === undefined) {
        console.warn(`[PromptTemplate] 变量 "${key}" 未提供`);
        return match;
      }
      
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
      
      return String(value);
    });
  }

  /**
   * 注册自定义模板
   */
  register(name, template) {
    this.templates.set(name, template);
    return this;
  }

  /**
   * 获取模板列表
   */
  listTemplates() {
    return Array.from(this.templates.keys());
  }

  /**
   * 克隆并修改模板
   */
  extend(baseName, newName, overrides) {
    const base = this.templates.get(baseName);
    if (!base) {
      throw new Error(`基础模板 "${baseName}" 不存在`);
    }

    this.templates.set(newName, {
      system: overrides.system || base.system,
      user: overrides.user || base.user
    });

    return this;
  }
}
