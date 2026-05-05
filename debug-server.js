import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 详细请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode}`);
  });
  
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'brand-story-agent',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.post('/test', async (req, res) => {
  try {
    console.log('[DEBUG] 开始处理请求');
    
    // 动态导入所有依赖
    console.log('[DEBUG] 导入Agent');
    const { BrandStoryAgent } = await import('./src/core/Agent.js');
    
    console.log('[DEBUG] 创建Agent实例');
    const agent = new BrandStoryAgent();
    
    console.log('[DEBUG] 执行createBrandStory');
    const result = await agent.createBrandStory({
      productInfo: req.body.productInfo,
      brandPositioning: req.body.brandPositioning || {},
      targetAudience: req.body.targetAudience || {}
    });
    
    console.log('[DEBUG] 返回响应');
    res.json({
      success: true,
      data: result
    });
    
    console.log('[DEBUG] 响应已发送');
  } catch (error) {
    console.error('[DEBUG] 错误:', error.message);
    console.error('[DEBUG] 堆栈:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('  调试服务器已启动');
  console.log('='.repeat(60));
  console.log(`  服务地址: http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('[DEBUG] 服务器错误:', error);
});

server.on('close', () => {
  console.log('[DEBUG] 服务器关闭');
});

console.log('[DEBUG] 服务器已启动，等待连接...');

// 防止进程意外退出
process.on('uncaughtException', (error) => {
  console.error('[DEBUG] 未捕获异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[DEBUG] 未处理的拒绝:', reason);
});

process.on('exit', (code) => {
  console.log(`[DEBUG] 进程退出，代码: ${code}`);
});
