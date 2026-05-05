import { WorkflowEngine } from './src/core/WorkflowEngine.js';

async function testWorkflow() {
  const workflow = new WorkflowEngine();
  
  workflow
    .addStage('stage1', {
      name: '阶段1',
      handler: async (ctx) => {
        console.log('执行阶段1');
        return { valueProposition: '测试价值主张', keyFeatures: ['功能1', '功能2'] };
      },
      requiredInputs: ['productInfo'],
      outputs: ['valueProposition', 'keyFeatures']
    })
    .addStage('stage2', {
      name: '阶段2',
      handler: async (ctx) => {
        console.log('执行阶段2, valueProposition:', ctx.valueProposition);
        return { userPersona: '测试用户画像' };
      },
      requiredInputs: ['targetAudience', 'valueProposition'],
      outputs: ['userPersona']
    });
  
  try {
    const context = {
      productInfo: { name: '测试产品' },
      targetAudience: { description: '测试用户' }
    };
    
    console.log('初始上下文:', Object.keys(context));
    const result = await workflow.execute(context);
    console.log('执行结果:', Object.keys(result));
  } catch (error) {
    console.error('错误:', error.message);
  }
}

testWorkflow().catch(console.error);