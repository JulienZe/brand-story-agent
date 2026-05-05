/**
 * 质量验证器
 * 确保生成的内容符合品牌规范和法律法规
 */

export class QualityValidator {
  constructor(config = {}) {
    this.config = {
      maxExaggerationScore: 3,
      minWordCount: 500,
      maxWordCount: 3000,
      requiredElements: ['场景', '情感', '产品价值'],
      ...config
    };

    this.sensitiveWords = [
      '最', '第一', '顶级', '绝对', '永远', '保证', '100%',
      '政治', '宗教', '色情', '暴力', '歧视'
    ];

    this.validationRules = new Map([
      ['noExaggeration', this._checkExaggeration.bind(this)],
      ['noSensitiveContent', this._checkSensitiveContent.bind(this)],
      ['toneConsistency', this._checkToneConsistency.bind(this)],
      ['lengthCheck', this._checkLength.bind(this)],
      ['structureCheck', this._checkStructure.bind(this)],
      ['callToActionCheck', this._checkCallToAction.bind(this)]
    ]);
  }

  /**
   * 验证内容
   */
  validate(content, options = {}) {
    const rules = options.rules || Array.from(this.validationRules.keys());
    const issues = [];
    const passedRules = [];

    for (const ruleName of rules) {
      const rule = this.validationRules.get(ruleName);
      if (!rule) {
        console.warn(`[QualityValidator] 未知规则: ${ruleName}`);
        continue;
      }

      const result = rule(content);
      if (result.passed) {
        passedRules.push(ruleName);
      } else {
        issues.push(...result.issues);
      }
    }

    const validation = {
      passed: issues.length === 0,
      score: this._calculateScore(issues.length, rules.length),
      issues,
      passedRules,
      failedRules: rules.filter(r => !passedRules.includes(r)),
      timestamp: new Date().toISOString()
    };

    return validation;
  }

  /**
   * 检查夸大宣传
   */
  _checkExaggeration(content) {
    const exaggerationPatterns = [
      { pattern: /最[\u4e00-\u9fa5]+的/g, level: 'high', desc: '使用"最"字极限词' },
      { pattern: /第一[\u4e00-\u9fa5]*/g, level: 'high', desc: '使用"第一"等排名词' },
      { pattern: /100%[\u4e00-\u9fa5]*/g, level: 'high', desc: '使用"100%"绝对化表述' },
      { pattern: /绝对[\u4e00-\u9fa5]+/g, level: 'medium', desc: '使用"绝对"等确定性词汇' },
      { pattern: /永远[\u4e00-\u9fa5]+/g, level: 'medium', desc: '使用"永远"等时间极限词' },
      { pattern: /保证[\u4e00-\u9fa5]+/g, level: 'medium', desc: '使用"保证"等承诺性词汇' },
      { pattern: /立即[\u4e00-\u9fa5]+/g, level: 'low', desc: '使用"立即"等紧迫性词汇' },
      { pattern: /瞬间[\u4e00-\u9fa5]+/g, level: 'low', desc: '使用"瞬间"等速度极限词' }
    ];

    const issues = [];
    let exaggerationScore = 0;

    for (const { pattern, level, desc } of exaggerationPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        const score = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
        exaggerationScore += score * matches.length;
        
        issues.push({
          type: 'exaggeration',
          level,
          description: desc,
          occurrences: matches,
          suggestion: `建议替换为更客观的表述，如将"${matches[0]}"改为更具体的描述`
        });
      }
    }

    return {
      passed: exaggerationScore <= this.config.maxExaggerationScore,
      issues,
      score: exaggerationScore
    };
  }

  /**
   * 检查敏感内容
   */
  _checkSensitiveContent(content) {
    const issues = [];

    for (const word of this.sensitiveWords) {
      if (content.includes(word)) {
        issues.push({
          type: 'sensitive',
          level: 'high',
          description: `包含敏感词汇: "${word}"`,
          occurrences: [word],
          suggestion: '请移除或替换敏感词汇'
        });
      }
    }

    // 检查政治、宗教等话题
    const sensitiveTopics = [
      { pattern: /(共产党|政府|政策)(?!.{0,5}(支持|了解))/, desc: '涉及政治话题' },
      { pattern: /(佛教|道教|基督教|伊斯兰教)(?!.{0,5}(文化|历史))/, desc: '涉及宗教话题' },
      { pattern: /(色情|暴力|赌博|毒品)/, desc: '涉及违法违规内容' }
    ];

    for (const { pattern, desc } of sensitiveTopics) {
      if (pattern.test(content)) {
        issues.push({
          type: 'sensitive',
          level: 'critical',
          description: desc,
          suggestion: '请完全删除相关内容'
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * 检查调性一致性
   */
  _checkToneConsistency(content) {
    const issues = [];

    // 检查品牌调性关键词
    const toneIndicators = {
      warm: ['温暖', '陪伴', '理解', '贴心', '关怀'],
      professional: ['专业', '品质', '精准', '高效', '可靠'],
      youthful: ['活力', '潮流', '酷', 'fun', '嗨'],
      luxury: ['尊贵', '奢华', '品味', '格调', '优雅']
    };

    // 检测混合调性
    const detectedTones = [];
    for (const [tone, words] of Object.entries(toneIndicators)) {
      const count = words.reduce((sum, word) => {
        const matches = content.match(new RegExp(word, 'g'));
        return sum + (matches ? matches.length : 0);
      }, 0);
      
      if (count > 2) {
        detectedTones.push({ tone, count });
      }
    }

    if (detectedTones.length > 2) {
      issues.push({
        type: 'tone',
        level: 'medium',
        description: `检测到混合调性: ${detectedTones.map(t => t.tone).join(', ')}`,
        suggestion: '建议统一品牌调性，避免风格混乱'
      });
    }

    // 检查语气词使用
    const casualWords = ['啦', '呢', '哦', '哈', '呗'];
    const casualCount = casualWords.reduce((sum, word) => {
      const matches = content.match(new RegExp(word, 'g'));
      return sum + (matches ? matches.length : 0);
    }, 0);

    if (casualCount > 10) {
      issues.push({
        type: 'tone',
        level: 'low',
        description: '语气词使用过多，可能影响专业感',
        suggestion: '适当减少语气词，保持简洁有力的表达'
      });
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * 检查长度
   */
  _checkLength(content) {
    const issues = [];
    const wordCount = this._countWords(content);

    if (wordCount < this.config.minWordCount) {
      issues.push({
        type: 'length',
        level: 'medium',
        description: `内容过短 (${wordCount}字)，建议至少 ${this.config.minWordCount} 字`,
        suggestion: '增加场景描写、情感铺垫或用户证言'
      });
    }

    if (wordCount > this.config.maxWordCount) {
      issues.push({
        type: 'length',
        level: 'low',
        description: `内容较长 (${wordCount}字)，可能超出部分渠道限制`,
        suggestion: '考虑拆分为系列内容或精简次要信息'
      });
    }

    return {
      passed: issues.length === 0,
      issues,
      wordCount
    };
  }

  /**
   * 检查结构完整性
   */
  _checkStructure(content) {
    const issues = [];
    const requiredElements = this.config.requiredElements;

    // 检查必要元素
    for (const element of requiredElements) {
      if (!content.includes(element)) {
        issues.push({
          type: 'structure',
          level: 'medium',
          description: `缺少必要元素: "${element}"`,
          suggestion: `请在内容中融入${element}相关内容`
        });
      }
    }

    // 检查段落结构
    const paragraphs = content.split(/\n\n+/);
    if (paragraphs.length < 5) {
      issues.push({
        type: 'structure',
        level: 'low',
        description: '段落较少，内容结构可能过于简单',
        suggestion: '增加段落划分，提升可读性'
      });
    }

    // 检查是否有标题
    if (!content.includes('#')) {
      issues.push({
        type: 'structure',
        level: 'low',
        description: '缺少标题层级',
        suggestion: '添加适当的标题和副标题'
      });
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * 检查行动号召
   */
  _checkCallToAction(content) {
    const issues = [];

    const ctaPatterns = [
      /欢迎.{0,10}(加入|关注|体验|尝试)/,
      /立即.{0,10}(下载|体验|购买|行动)/,
      /点击.{0,10}(链接|了解|查看)/,
      /扫描.{0,10}(二维码|关注)/,
      /现在.{0,10}(开始|行动)/
    ];

    const hasCTA = ctaPatterns.some(pattern => pattern.test(content));

    if (!hasCTA) {
      issues.push({
        type: 'cta',
        level: 'medium',
        description: '缺少明确的行动号召',
        suggestion: '在结尾添加软性行动号召，如"欢迎体验"、"了解更多"等'
      });
    }

    // 检查CTA是否过于强硬
    const hardSellPatterns = [
      /必须.{0,5}(购买|行动)/,
      /不要.{0,5}(错过|犹豫)/,
      /限时.{0,5}(抢购|优惠)/,
      /最后.{0,5}(机会|一天)/
    ];

    for (const pattern of hardSellPatterns) {
      if (pattern.test(content)) {
        issues.push({
          type: 'cta',
          level: 'medium',
          description: '行动号召过于强硬，可能引起反感',
          suggestion: '使用更柔和的表达方式，如"期待你的加入"代替"不要错过"'
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * 计算质量分数
   */
  _calculateScore(issueCount, totalRules) {
    if (issueCount === 0) return 100;
    const penalty = Math.min(issueCount * 15, 80);
    return Math.max(100 - penalty, 20);
  }

  /**
   * 字数统计
   */
  _countWords(content) {
    // 中文字符
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 英文单词
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    // 数字
    const numbers = (content.match(/\d+/g) || []).length;
    
    return chineseChars + englishWords + numbers;
  }

  /**
   * 添加自定义验证规则
   */
  addRule(name, handler) {
    this.validationRules.set(name, handler);
    return this;
  }

  /**
   * 添加敏感词
   */
  addSensitiveWords(words) {
    this.sensitiveWords.push(...words);
    return this;
  }

  /**
   * 获取验证报告
   */
  generateReport(validation) {
    const lines = [
      '# 内容质量验证报告',
      '',
      `验证时间: ${validation.timestamp}`,
      `总体评分: ${validation.score}/100`,
      `验证结果: ${validation.passed ? '✅ 通过' : '❌ 未通过'}`,
      '',
      '## 规则检查',
      ''
    ];

    for (const rule of validation.passedRules) {
      lines.push(`- ✅ ${rule}`);
    }

    for (const rule of validation.failedRules) {
      lines.push(`- ❌ ${rule}`);
    }

    if (validation.issues.length > 0) {
      lines.push('', '## 问题详情', '');
      
      for (const issue of validation.issues) {
        lines.push(
          `### ${issue.type} (${issue.level})`,
          `- 描述: ${issue.description}`,
          `- 建议: ${issue.suggestion}`,
          ''
        );
      }
    }

    return lines.join('\n');
  }
}
