// 模拟服务器端的导入流程
import express from 'express';
import { BrandStoryAgent } from './src/core/Agent.js';

const app = express();
app.use(express.json());

app.post('/test', async (req, res) => {
  try {
    console.log('[TEST] 接收到请求');
    const { productInfo, brandPositioning, targetAudience } = req.body;
    
    console.log('[TEST] 创建Agent实例');
    const agent = new BrandStoryAgent();
    
    console.log('[TEST] 执行createBrandStory');
    const result = await agent.createBrandStory({
      productInfo,
      brandPositioning: brandPositioning || {},
      targetAudience: targetAudience || {}
    });
    
    console.log('[TEST] 成功');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[TEST] 错误:', error.message);
    console.error('[TEST] 堆栈:', error.stack);
    res.json({ success: false, error: error.message });
  }
});

app.listen(3002, () => {
  console.log('测试服务器运行在 http://localhost:3002');
});