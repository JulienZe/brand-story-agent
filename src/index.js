/**
 * 品牌故事创作智能体 - 主入口
 * 
 * 使用方式:
 * 1. 作为模块导入: import { BrandStoryAgent } from './index.js'
 * 2. 命令行运行: node src/index.js
 * 3. Web服务: node src/server.js
 */

import { BrandStoryAgent } from './core/Agent.js';
import { WorkflowEngine } from './core/WorkflowEngine.js';
import { PromptTemplate } from './core/PromptTemplate.js';
import { ContentGenerator } from './core/ContentGenerator.js';
import { QualityValidator } from './core/QualityValidator.js';

export {
  BrandStoryAgent,
  WorkflowEngine,
  PromptTemplate,
  ContentGenerator,
  QualityValidator
};

// 默认导出
export default BrandStoryAgent;

// 命令行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('='.repeat(60));
  console.log('  品牌故事创作智能体 - 演示模式');
  console.log('='.repeat(60));
  console.log();

  const agent = new BrandStoryAgent();

  // 演示用例
  const demoInput = {
    productInfo: {
      name: '创作助手 Pro',
      description: '一款面向独立创作者的AI辅助创作工具，提供智能排版、多平台发布、协作编辑等功能',
      features: [
        'AI智能排版与设计',
        '一键多平台发布',
        '实时协作编辑',
        '云端素材库',
        '数据分析看板'
      ],
      category: '创作工具',
      competitors: 'Canva, Notion, 稿定设计'
    },
    brandPositioning: {
      tone: 'warm_professional',
      values: ['专业', '简单', '温暖', '赋能'],
      channels: ['微信公众号', '小红书', '知乎']
    },
    targetAudience: {
      description: '独立创作者、自由撰稿人、自媒体运营者',
      demographics: {
        age: '25-35岁',
        income: '8k-20k/月',
        education: '本科及以上',
        location: '一二线城市'
      },
      psychographics: {
        values: '追求专业品质，重视个人品牌',
        lifestyle: '灵活工作，注重效率',
        painPoints: '工具复杂、时间不够、作品不专业'
      }
    }
  };

  console.log('📝 输入信息:');
  console.log(`   产品: ${demoInput.productInfo.name}`);
  console.log(`   受众: ${demoInput.targetAudience.description}`);
  console.log();

  agent.createBrandStory(demoInput)
    .then(result => {
      console.log('='.repeat(60));
      console.log('  创作完成!');
      console.log('='.repeat(60));
      console.log();
      
      // 输出结果摘要
      console.log('📊 结果摘要:');
      console.log(`   工作流阶段: ${result.metadata.workflowStages}`);
      console.log(`   生成时间: ${result.metadata.generatedAt}`);
      console.log(`   故事字数: ${result.brandStory.wordCount}`);
      console.log(`   质量评分: ${result.quality.score || 'N/A'}`);
      console.log();
      
      console.log('🎯 核心价值:');
      console.log(`   ${result.productValue.coreValue}`);
      console.log();
      
      console.log('👤 用户画像:');
      console.log(`   ${result.userProfile.persona?.description || 'N/A'}`);
      console.log();
      
      console.log('📖 品牌故事预览 (前300字):');
      const preview = result.brandStory.content?.substring(0, 300) || 'N/A';
      console.log(`   ${preview}...`);
      console.log();
      
      console.log('💡 情感共鸣点:');
      (result.emotionalConnections.triggers || []).forEach((trigger, i) => {
        console.log(`   ${i + 1}. ${trigger.trigger} - ${trigger.resonance}`);
      });
      console.log();
      
      console.log('📢 传播建议:');
      (result.distribution.channelSuggestions || []).forEach((ch, i) => {
        console.log(`   ${i + 1}. ${ch.channel}: ${ch.format}`);
      });
      console.log();
      
      console.log('='.repeat(60));
      console.log('  完整结果已生成，可在程序中获取');
      console.log('='.repeat(60));
    })
    .catch(error => {
      console.error('❌ 创作失败:', error.message);
      process.exit(1);
    });
}
