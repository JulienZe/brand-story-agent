/**
 * 工作流引擎
 * 管理多阶段工作流的执行、依赖和状态
 */

export class WorkflowEngine {
  constructor() {
    this.stages = new Map();
    this.transitions = new Map();
    this.middleware = [];
  }

  /**
   * 添加工作流阶段
   */
  addStage(name, config) {
    this.stages.set(name, {
      name,
      ...config,
      status: 'pending',
      result: null,
      error: null,
      startTime: null,
      endTime: null
    });
    return this;
  }

  /**
   * 添加阶段转换规则
   */
  addTransition(from, to, condition = null) {
    if (!this.transitions.has(from)) {
      this.transitions.set(from, []);
    }
    this.transitions.get(from).push({ to, condition });
    return this;
  }

  /**
   * 添加中间件
   */
  use(middleware) {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * 执行工作流
   */
  async execute(context) {
    const executionContext = {
      ...context,
      stageResults: {},
      metadata: {
        startTime: Date.now(),
        stagesCompleted: 0,
        stagesFailed: 0
      }
    };

    // 按顺序执行阶段
    for (const [stageName, stage] of this.stages) {
      try {
        // 检查输入依赖
        this._validateInputs(stage, executionContext);
        
        // 执行前置中间件
        for (const mw of this.middleware) {
          if (mw.before) {
            await mw.before(stageName, executionContext);
          }
        }

        // 执行阶段
        console.log(`[Workflow] 执行阶段: ${stage.name}`);
        stage.status = 'running';
        stage.startTime = Date.now();
        
        const result = await stage.handler(executionContext);
        
        stage.status = 'completed';
        stage.endTime = Date.now();
        stage.result = result;
        
        // 保存结果到上下文
        executionContext.stageResults[stageName] = result;
        Object.assign(executionContext, result);
        
        executionContext.metadata.stagesCompleted++;
        
        // 执行后置中间件
        for (const mw of this.middleware) {
          if (mw.after) {
            await mw.after(stageName, result, executionContext);
          }
        }
        
      } catch (error) {
        stage.status = 'failed';
        stage.endTime = Date.now();
        stage.error = error;
        
        executionContext.metadata.stagesFailed++;
        
        // 错误处理策略
        const shouldContinue = await this._handleStageError(stage, error, executionContext);
        if (!shouldContinue) {
          throw new WorkflowError(
            `工作流在阶段 "${stage.name}" 失败: ${error.message}`,
            { stage: stageName, originalError: error }
          );
        }
      }
    }

    executionContext.metadata.endTime = Date.now();
    executionContext.metadata.duration = executionContext.metadata.endTime - executionContext.metadata.startTime;
    
    console.log(`[Workflow] 完成! 耗时: ${executionContext.metadata.duration}ms`);
    
    return executionContext;
  }

  /**
   * 验证阶段输入
   */
  _validateInputs(stage, context) {
    if (!stage.requiredInputs) return;
  }

  /**
   * 处理阶段错误
   */
  async _handleStageError(stage, error, context) {
    console.error(`[Workflow] 阶段 "${stage.name}" 错误: ${error.message}`);
    
    // 如果有错误处理中间件
    for (const mw of this.middleware) {
      if (mw.onError) {
        const result = await mw.onError(stage.name, error, context);
        if (result === 'stop') return false;
        if (result === 'continue') return true;
      }
    }
    
    // 默认策略：停止工作流
    return false;
  }

  /**
   * 获取工作流状态
   */
  getStatus() {
    const stages = Array.from(this.stages.values());
    return {
      total: stages.length,
      completed: stages.filter(s => s.status === 'completed').length,
      failed: stages.filter(s => s.status === 'failed').length,
      running: stages.filter(s => s.status === 'running').length,
      pending: stages.filter(s => s.status === 'pending').length,
      stages: stages.map(s => ({
        name: s.name,
        status: s.status,
        duration: s.endTime && s.startTime ? s.endTime - s.startTime : null
      }))
    };
  }

  /**
   * 重置工作流
   */
  reset() {
    for (const stage of this.stages.values()) {
      stage.status = 'pending';
      stage.result = null;
      stage.error = null;
      stage.startTime = null;
      stage.endTime = null;
    }
  }
}

/**
 * 工作流错误
 */
export class WorkflowError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'WorkflowError';
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}
