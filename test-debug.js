import { PromptTemplate } from './src/core/PromptTemplate.js';
import { ContentGenerator } from './src/core/ContentGenerator.js';

async function test() {
  const promptTemplate = new PromptTemplate();
  const generator = new ContentGenerator({ provider: 'mock' });
  
  // 测试产品分析提示词
  const productPrompt = promptTemplate.render('productAnalysis', {
    productName: '智能创作工具',
    productDescription: 'AI驱动的内容创作平台',
    productFeatures: ['AI智能排版', '多平台发布', '实时协作'],
    productCategory: 'SaaS',
    competitiveLandscape: '无'
  });
  
  console.log('=== 产品分析提示词 ===');
  console.log('User内容:', productPrompt.user.substring(0, 100) + '...');
  console.log('包含"产品名称:"?', productPrompt.user.includes('产品名称:'));
  console.log('包含"核心价值主张"?', productPrompt.user.includes('核心价值主张'));
  
  // 测试生成
  console.log('\n=== 调用生成器 ===');
  const result = await generator.generate(productPrompt);
  console.log('生成结果:', JSON.stringify(result, null, 2));
}

test().catch(console.error);