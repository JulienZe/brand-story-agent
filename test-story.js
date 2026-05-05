import { PromptTemplate } from './src/core/PromptTemplate.js';
import { ContentGenerator } from './src/core/ContentGenerator.js';

async function testStory() {
  const promptTemplate = new PromptTemplate();
  const generator = new ContentGenerator({ provider: 'mock' });
  
  // 测试故事创作提示词
  const storyPrompt = promptTemplate.render('storyCreation', {
    scenarios: [{ title: '测试场景' }],
    valueProposition: { core: '测试价值主张' },
    brandTone: 'warm_professional',
    brandValues: ['创新', '用户至上'],
    storyLength: '800-1200字'
  });
  
  console.log('=== 故事创作提示词 ===');
  console.log('User内容开头:', storyPrompt.user.substring(0, 150));
  console.log('');
  console.log('包含"品牌推广软文"?', storyPrompt.user.includes('品牌推广软文'));
  console.log('包含"品牌故事"?', storyPrompt.user.includes('品牌故事'));
  console.log('包含"narrativeArc"?', storyPrompt.user.includes('narrativeArc'));
  
  // 测试生成
  console.log('\n=== 调用生成器 ===');
  const result = await generator.generate(storyPrompt);
  console.log('生成结果类型:', typeof result);
  console.log('生成结果键:', Object.keys(result));
  console.log('storyContent:', result.content);
}

testStory().catch(console.error);