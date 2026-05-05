/**
 * 高级使用示例
 * 展示自定义配置、分阶段执行、质量验证等高级功能
 */

import { BrandStoryAgent } from '../src/core/Agent.js';
import { QualityValidator } from '../src/core/QualityValidator.js';
import { PromptTemplate } from '../src/core/PromptTemplate.js';

// 示例1: 自定义配置
async function customConfigExample() {
  console.log('🔧 自定义配置示例\n');

  const agent = new BrandStoryAgent({
    maxRetries: 5,
    defaultTone: 'luxury',
    outputFormat: 'markdown'
  });

  const result = await agent.createBrandStory({
    productInfo: {
      name: '高端护肤套装',
      description: '采用珍稀植物提取物的奢华护肤体验',
      features: ['珍稀成分', '定制配方', '奢华包装'],
      category: '美妆护肤'
    },
    brandPositioning: {
      tone: 'luxury',
      values: ['奢华', '珍稀', '专属'],
      channels: ['小红书', '抖音']
    },
    targetAudience: {
      description: '30-45岁高收入女性，追求品质生活',
      demographics: { gender: '女性', income: '高收入' },
      psychographics: { values: '品质优先' }
    }
  });

  console.log('✅ 奢华风格故事创作完成!');
  console.log();
}

// 示例2: 质量验证
async function qualityValidationExample() {
  console.log('🔍 质量验证示例\n');

  const validator = new QualityValidator({
    minWordCount: 800,
    maxWordCount: 2000
  });

  const testContent = `
# 最好的智能手表

这是世界上最好的智能手表！100%准确，绝对完美！

它拥有最顶级的功能，保证让你满意！

立即购买，不要错过最后的机会！
`;

  const result = validator.validate(testContent, {
    rules: ['noExaggeration', 'noSensitiveContent', 'lengthCheck', 'callToActionCheck']
  });

  console.log('验证结果:', result.passed ? '通过' : '未通过');
  console.log('质量评分:', result.score);
  console.log('问题数量:', result.issues.length);
  
  if (result.issues.length > 0) {
    console.log('\n发现问题:');
    result.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. [${issue.level}] ${issue.description}`);
      console.log(`     建议: ${issue.suggestion}`);
    });
  }
  console.log();
}

// 示例3: 自定义模板
async function customTemplateExample() {
  console.log('📝 自定义模板示例\n');

  const template = new PromptTemplate();
  
  // 注册自定义模板
  template.register('myCustomTemplate', {
    system: '你是一位专业的科技产品评论员',
    user: '请评价以下产品: {{productName}}，重点关注: {{focus}}'
  });

  // 使用自定义模板
  const prompt = template.render('myCustomTemplate', {
    productName: 'AI写作助手',
    focus: '创作效率和内容质量'
  });

  console.log('自定义模板渲染结果:');
  console.log('System:', prompt.system);
  console.log('User:', prompt.user);
  console.log();
}

// 示例4: 快速创建
async function quickCreateExample() {
  console.log('⚡ 快速创建示例\n');

  const agent = new BrandStoryAgent();

  const result = await agent.quickCreate(
    '便携式咖啡机',
    '一款可以放在包里的专业级咖啡机',
    '咖啡爱好者、商务人士'
  );

  console.log('✅ 快速创建完成!');
  console.log('核心价值:', result.productValue.coreValue);
  console.log('用户画像:', result.userProfile.persona?.name);
  console.log();
}

// 示例5: 完整工作流监控
async function workflowMonitoringExample() {
  console.log('📊 工作流监控示例\n');

  const agent = new BrandStoryAgent();

  // 这里可以添加中间件来监控每个阶段的执行
  agent.workflow.use({
    before: async (stageName, context) => {
      console.log(`[监控] 阶段开始: ${stageName}`);
    },
    after: async (stageName, result, context) => {
      console.log(`[监控] 阶段完成: ${stageName}`);
    },
    onError: async (stageName, error, context) => {
      console.error(`[监控] 阶段错误: ${stageName} - ${error.message}`);
      return 'continue'; // 或 'stop'
    }
  });

  const result = await agent.quickCreate(
    '智能台灯',
    '护眼、可调光、支持语音控制的智能台灯',
    '学生、上班族'
  );

  console.log('\n✅ 带监控的创作完成!');
  console.log();
}

// 运行所有示例
async function runAllExamples() {
  console.log('='.repeat(60));
  console.log('  品牌故事创作智能体 - 高级示例');
  console.log('='.repeat(60));
  console.log();

  try {
    await customConfigExample();
    await qualityValidationExample();
    await customTemplateExample();
    await quickCreateExample();
    await workflowMonitoringExample();

    console.log('='.repeat(60));
    console.log('  所有示例执行完成!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('示例执行失败:', error);
  }
}

runAllExamples();
