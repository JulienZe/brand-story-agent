import { PromptTemplate } from './src/core/PromptTemplate.js';
import { ContentGenerator } from './src/core/ContentGenerator.js';

async function testScenario() {
  const promptTemplate = new PromptTemplate();
  const generator = new ContentGenerator({ provider: 'mock' });
  
  // 测试场景设计提示词
  const scenePrompt = promptTemplate.render('sceneDesign', {
    userPersona: { name: '测试用户', description: '测试描述' },
    keyFeatures: [{ feature: '功能1', benefit: '收益1' }],
    painPoints: [{ pain: '痛点1', intensity: '高' }],
    sceneCount: 3
  });
  
  console.log('=== 场景设计提示词 ===');
  console.log('User内容开头:', scenePrompt.user.substring(0, 150));
  console.log('');
  console.log('包含"场景构建"?', scenePrompt.user.includes('场景构建'));
  console.log('包含"使用场景:"?', scenePrompt.user.includes('使用场景:'));
  console.log('包含"设计3个产品使用场景"?', scenePrompt.user.includes('设计3个产品使用场景'));
  
  // 测试生成
  console.log('\n=== 调用生成器 ===');
  const result = await generator.generate(scenePrompt);
  console.log('生成结果类型:', typeof result);
  console.log('生成结果:', JSON.stringify(result, null, 2));
  console.log('');
  console.log('scenarios:', result.scenarios);
}

testScenario().catch(console.error);