/**
 * 基础使用示例
 */

import { BrandStoryAgent } from '../src/core/Agent.js';

async function basicExample() {
  console.log('🚀 基础使用示例\n');

  const agent = new BrandStoryAgent();

  const result = await agent.createBrandStory({
    productInfo: {
      name: '智能保温杯',
      description: '一款可以显示温度、提醒喝水的智能保温杯',
      features: ['OLED温度显示', '喝水提醒', 'APP连接', '水质检测'],
      category: '智能生活',
      competitors: '普通保温杯、其他智能杯'
    },
    brandPositioning: {
      tone: 'warm_professional',
      values: ['关怀', '健康', '科技'],
      channels: ['微信公众号', '小红书']
    },
    targetAudience: {
      description: '25-40岁上班族，关注健康但工作忙碌',
      demographics: { age: '25-40', occupation: '白领' },
      psychographics: { values: '健康优先', lifestyle: '忙碌' }
    }
  });

  console.log('✅ 创作完成!');
  console.log('核心价值:', result.productValue.coreValue);
  console.log('故事字数:', result.brandStory.wordCount);
}

basicExample().catch(console.error);
