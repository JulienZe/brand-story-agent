/**
 * 内容生成器
 * 支持多种AI提供商：mock, openai, claude, local
 */

export class ContentGenerator {
  constructor(config = {}) {
    this.config = {
      provider: 'mock',
      apiKey: null,
      baseUrl: null,
      model: 'gpt-4',
      ...config
    };
    this.generationHistory = [];
  }

  /**
   * 生成内容
   */
  async generate(promptText, options = {}) {
    const startTime = Date.now();
    
    let result;
    switch (this.config.provider) {
      case 'openai':
        result = await this._generateWithOpenAI(promptText, options);
        break;
      case 'claude':
        result = await this._generateWithClaude(promptText, options);
        break;
      case 'local':
        result = await this._generateWithLocal(promptText, options);
        break;
      case 'mock':
      default:
        result = await this._generateWithMock(promptText, options);
        break;
    }

    this.generationHistory.push({
      timestamp: new Date().toISOString(),
      provider: this.config.provider,
      prompt: promptText,
      result,
      duration: Date.now() - startTime
    });

    return result;
  }

  /**
   * 模拟生成（Mock模式）
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
   * 模拟产品分析
   */
  _mockProductAnalysis(promptText) {
    const productName = promptText.match(/产品名称:\s*(.+?)(?:\n|$)/)?.[1] || '智能创作工具';
    
    return {
      valueProposition: {
        core: '让专业创作触手可及',
        extended: '为独立创作者提供AI驱动的智能工具，大幅提升创作效率与作品质量',
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
        { feature: '实时协作', benefit: '多人实时协同编辑', scenario: '团队协作完成大型项目' },
        { feature: '云端素材库', benefit: '丰富的模板和素材资源', scenario: '快速创建专业内容' }
      ],
      coreBenefits: {
        functional: ['提升创作效率', '降低技术门槛', '专业输出质量'],
        emotional: ['减轻创作焦虑', '增强专业自信', '获得成就感'],
        social: ['提升个人品牌形象', '扩大内容影响力']
      }
    };
  }

  /**
   * 模拟用户洞察
   */
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
        { pain: '作品不够专业', intensity: '中', frequency: '偶尔' },
        { pain: '多平台运营繁琐', intensity: '中', frequency: '经常' }
      ],
      emotionalNeeds: [
        { need: '被理解和认同', manifestation: '作品获得认可和赞赏', priority: '高' },
        { need: '成长与进步', manifestation: '技能提升和职业发展', priority: '高' },
        { need: '效率与自由', manifestation: '高效完成工作，拥有更多时间', priority: '中' }
      ],
      motivationTriggers: [
        { trigger: 'deadline压力', context: '紧急任务', action: '寻找高效工具' },
        { trigger: '看到优秀作品', context: '社交媒体', action: '渴望提升自己' },
        { trigger: '获得正面反馈', context: '作品发布后', action: '持续创作' }
      ],
      behaviorPatterns: {
        informationGathering: '通过社交媒体、公众号获取信息',
        decisionFactors: '用户评价、功能匹配度、价格',
        usageContext: '深夜创作、咖啡馆工作、居家办公'
      }
    };
  }

  /**
   * 模拟场景设计
   */
  _mockSceneDesign(promptText) {
    return {
      scenarios: [
        {
          title: '深夜的救星',
          setting: {
            time: '深夜十一点',
            place: '家中书房',
            atmosphere: '窗外雨声淅沥，台灯昏黄，空气中弥漫着咖啡香气'
          },
          character: {
            name: '小林',
            state: '疲惫但焦虑',
            desire: '尽快完成排版任务'
          },
          plot: {
            setup: '客户临时要求明天一早看到排版精美的方案',
            conflict: '小林不擅长排版，以往都要花一整天',
            climax: '打开工具，AI自动完成排版和设计',
            resolution: '半小时完成原本需要一天的工作',
            aftermath: '小林终于能安心睡个好觉'
          },
          sensoryDetails: [
            '键盘敲击声在雨夜中格外清晰',
            '屏幕蓝光映在小林疲惫的脸上',
            '咖啡从热变凉的温度变化'
          ],
          emotionalArc: ['焦虑', '惊喜', '释然', '自信'],
          productRole: '在关键时刻提供能力加成'
        },
        {
          title: '咖啡馆里的灵感时刻',
          setting: {
            time: '周日下午',
            place: '街角咖啡馆',
            atmosphere: '阳光透过玻璃窗，爵士乐轻柔，咖啡香气弥漫'
          },
          character: {
            name: '小林',
            state: '放松但期待',
            desire: '抓住突发的创作灵感'
          },
          plot: {
            setup: '在咖啡馆突然想到一个绝妙的选题',
            conflict: '没带电脑，只有手机和平板',
            climax: '打开移动端APP，完整功能一应俱全',
            resolution: '在咖啡馆完成从构思到成稿的全过程',
            aftermath: '小林感受到前所未有的创作自由'
          },
          sensoryDetails: [
            '咖啡豆研磨的沙沙声',
            '阳光在桌面上移动的光影',
            '指尖在平板上滑动的触感'
          ],
          emotionalArc: ['兴奋', '担忧', '惊喜', '满足'],
          productRole: '打破设备限制，让灵感随时落地'
        },
        {
          title: '客户面前的专业时刻',
          setting: {
            time: '周五下午',
            place: '客户公司会议室',
            atmosphere: '明亮的LED灯，投影屏幕，正式的会议氛围'
          },
          character: {
            name: '小林',
            state: '紧张但准备充分',
            desire: '获得客户认可和后续合作'
          },
          plot: {
            setup: '第一次向大客户展示方案',
            conflict: '客户临时要求调整方向',
            climax: '现场使用协作功能实时修改',
            resolution: '客户看到修改后的方案眼前一亮',
            aftermath: '当场签下长期合作协议'
          },
          sensoryDetails: [
            '投影仪风扇的嗡嗡声',
            '客户点头时的微笑',
            '合同签字笔划过纸面的声音'
          ],
          emotionalArc: ['紧张', '慌乱', '自信', '骄傲'],
          productRole: '在关键时刻展现专业实力'
        }
      ],
      emotionalConnections: [
        { emotion: '被理解的温暖', trigger: '工具懂创作者的痛点', resonance: '减少孤独感' },
        { emotion: '能力增长的自信', trigger: '轻松产出专业作品', resonance: '职业成长感' },
        { emotion: '时间自由的掌控', trigger: '效率提升带来的空闲', resonance: '生活平衡感' }
      ],
      sensoryDetails: {
        visual: ['深夜的屏幕蓝光', '咖啡馆的阳光', '会议室的投影'],
        auditory: ['雨声', '爵士乐', '键盘声'],
        tactile: ['咖啡杯的温度', '平板的触感', '签字笔的重量']
      }
    };
  }

  /**
   * 模拟故事创作
   */
  _mockStoryCreation(promptText) {
    const brandTone = promptText.match(/品牌调性:\s*(.+?)(?:\n|$)/)?.[1] || 'warm_professional';
    
    return {
      content: `# 一个人的创作，也可以很专业

深夜十一点，雨声敲打着窗户。

小林盯着电脑屏幕，手指悬在键盘上方。客户的消息还亮在手机上："明天早上能把排版好的方案发我吗？"

她叹了口气。内容早就写好了，但排版...那是她的软肋。上次花了一整天调整格式，最后客户还是说不专业。

咖啡已经凉了，台灯的光在雨夜里显得格外孤单。

---

**每一个创作者，都有过这样的时刻。**

明明有满脑子的好想法，却被技术门槛拦在门外。明明付出了同样的努力，作品却因为呈现方式不被认可。

这不是能力的问题，是工具的问题。

---

小林打开了一个新的工具。

她只是想试试——反正也不会更糟了。

导入文档，点击"智能排版"。然后她愣住了。

原本需要一整天的工作，在三十秒内完成了。不是那种模板的生硬堆砌，而是像有一位资深设计师在帮她调整：字号层级、留白节奏、配色方案，甚至根据内容情绪推荐了适合的插图风格。

她滑动鼠标滚轮，看着屏幕上逐渐成型的方案。

那一刻，她忽然觉得，也许自己真的可以。

---

**好的工具，不是让你变成另一个人。**

**而是让你成为更好的自己。**

---

三个月后，小林在咖啡馆里打开了同一个工具。

阳光很好，她刚刚想到一个绝妙的选题。没有带电脑，只有平板。但她一点也不慌——完整的创作体验，从构思到排版，从协作到发布，都在这一个应用里。

她想起第一次使用时的那个深夜。

现在的她，已经签下了三个长期客户，有了自己的小团队，甚至开始接品牌合作的案子。

工具没有改变她是谁。

但它让她终于能被看见。

---

**每一个认真创作的人，都值得被认真对待。**

**让专业，触手可及。**

---

欢迎加入我们，和十万创作者一起，让创作回归创作本身。`,
      emotionalResonance: {
        primary: '被理解的温暖与专业认同',
        secondary: '从焦虑到自信的转变',
        intensity: '高'
      },
      narrativeArc: {
        hook: '深夜截稿的焦虑场景',
        setup: '创作者的技术困境',
        risingAction: '尝试新工具的犹豫与惊喜',
        climax: '三十秒完成一天工作的转折',
        fallingAction: '三个月后的成长变化',
        resolution: '专业触手可及的信念升华'
      },
      keyMessages: [
        '工具不应成为创作的门槛',
        '专业呈现是每个创作者的权利',
        '好的工具让你成为更好的自己'
      ],
      callToAction: {
        text: '欢迎加入我们，和十万创作者一起',
        type: '软',
        urgency: '低'
      }
    };
  }

  /**
   * 模拟内容优化
   */
  _mockContentOptimization(promptText) {
    const content = promptText.match(/原始内容:\s*([\s\S]+?)(?:\n优化要求|$)/)?.[1] || '';
    
    return {
      content: content.replace(/\n/g, '\n\n').replace(/^(# .+)$/m, '✨ $1 ✨'),
      improvements: [
        {
          aspect: '开头吸引力',
          before: '深夜十一点，雨声敲打着窗户。',
          after: '✨ 深夜十一点，雨声敲打着窗户。',
          reason: '增加视觉符号提升注意力'
        }
      ],
      suggestions: [
        {
          channel: '微信公众号',
          adaptation: '增加引导关注和转发话术',
          format: '长图文，适合深度阅读'
        },
        {
          channel: '小红书',
          adaptation: '拆分为3-4篇笔记，增加表情符号',
          format: '短图文，重点突出'
        }
      ],
      keyMessages: ['专业触手可及', '工具服务于创作'],
      emotionalTriggers: [
        { trigger: '深夜孤独场景', location: '开头', technique: '场景共鸣' },
        { trigger: '三十秒完成工作', location: '中段', technique: '反差惊喜' }
      ],
      goldenSentences: [
        '好的工具，不是让你变成另一个人，而是让你成为更好的自己。',
        '每一个认真创作的人，都值得被认真对待。'
      ],
      seoKeywords: ['创作者工具', '内容创作', '独立创作']
    };
  }

  /**
   * OpenAI API 调用
   */
  async _generateWithOpenAI(prompt, options) {
    const response = await fetch(`${this.config.baseUrl || 'https://api.openai.com'}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || this.config.model,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return { content };
    }
  }

  /**
   * Claude API 调用
   */
  async _generateWithClaude(prompt, options) {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error('Claude API key is required');
    }

    const response = await fetch(`${this.config.baseUrl || 'https://api.anthropic.com'}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: options.model || this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
        system: prompt.system,
        messages: [
          { role: 'user', content: prompt.user }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Claude API 错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    try {
      return JSON.parse(content);
    } catch {
      return { content };
    }
  }

  /**
   * 本地模型调用（Ollama）
   */
  async _generateWithLocal(prompt, options) {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || this.config.model || 'llama3',
        prompt: `${prompt.system}\n\n---\n\n${prompt.user}`,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_ctx: options.maxTokens || 2000,
          num_predict: options.maxTokens || 2000
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Local model 错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.response || '';
    
    try {
      return JSON.parse(content);
    } catch {
      return { content };
    }
  }

  /**
   * 延迟辅助
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取生成历史
   */
  getHistory() {
    return this.generationHistory;
  }

  /**
   * 切换提供商
   */
  setProvider(provider, config = {}) {
    this.config.provider = provider;
    Object.assign(this.config, config);
  }
}