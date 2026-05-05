import express from 'express';

const app = express();
app.use(express.json());

app.post('/test', async (req, res) => {
  console.log('[TEST] 接收到请求');
  console.log('[TEST] body:', JSON.stringify(req.body));
  
  try {
    // 动态导入 BrandStoryAgent
    console.log('[TEST] 尝试导入Agent');
    const { BrandStoryAgent } = await import('./src/core/Agent.js');
    console.log('[TEST] 导入成功');
    
    console.log('[TEST] 创建Agent实例');
    const agent = new BrandStoryAgent();
    console.log('[TEST] Agent创建成功');
    
    console.log('[TEST] 执行createBrandStory');
    const result = await agent.createBrandStory({
      productInfo: req.body.productInfo,
      brandPositioning: req.body.brandPositioning || {},
      targetAudience: req.body.targetAudience || {}
    });
    
    console.log('[TEST] 成功');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[TEST] 错误:', error.message);
    console.error('[TEST] 堆栈:', error.stack);
    res.json({ success: false, error: error.message });
  }
});

app.listen(3003, () => {
  console.log('测试服务器运行在 http://localhost:3003');
});