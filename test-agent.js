import { BrandStoryAgent } from './src/core/Agent.js';

async function testAgent() {
  const agent = new BrandStoryAgent();
  
  console.log('=== 测试品牌故事智能体 ===');
  
  try {
    const result = await agent.createBrandStory({
      productInfo: {
        name: '智能创作工具',
        description: 'AI驱动的内容创作平台',
        features: ['AI智能排版', '多平台发布', '实时协作'],
        category: 'SaaS'
      },
      brandPositioning: {
        tone: 'warm_professional',
        values: ['创新', '用户至上', '专业'],
        channels: ['微信公众号', '小红书']
      },
      targetAudience: {
        description: '25-35岁的自由撰稿人和内容创作者',
        demographics: { age: '25-35', gender: '不限', income: '8k-20k' },
        psychographics: { interests: ['写作', '设计', '新媒体'] }
      }
    });
    
    console.log('=== 成功 ===');
    console.log('生成的品牌故事:', result.brandStory.content.substring(0, 500) + '...');
  } catch (error) {
    console.error('=== 错误 ===');
    console.error('错误信息:', error.message);
    if (error.originalError) {
      console.error('原始错误:', error.originalError.message);
    }
  }
}

testAgent().catch(console.error);