import { useState, useRef, useCallback } from 'react'
import { Icon } from '../common/Icon'
import { CharCount } from '../common/CharCount'
import { TEMPLATES, TONES, STEPS, WORKFLOW_STAGES } from '../../constants'
import { createStory, createStorySSE, refineStory } from '../../services/api'

export function PageCreate({ onCreate, onNavigate, history, refineTarget }) {
  const [step, setStep] = useState(refineTarget ? 2 : 1)
  const [template, setTemplate] = useState(refineTarget?.template || null)
  const [productName, setProductName] = useState(refineTarget?.productName || '')
  const [productDesc, setProductDesc] = useState(refineTarget?.productDesc || '')
  const [productFeatures, setProductFeatures] = useState('')
  const [targetUser, setTargetUser] = useState(refineTarget?.targetUser || '')
  const [tone, setTone] = useState(refineTarget?.tone || 'warm_professional')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [progressStages, setProgressStages] = useState([])
  const [touched, setTouched] = useState({})
  const [isRefineMode, setIsRefineMode] = useState(!!refineTarget)
  const [refineInstruction, setRefineInstruction] = useState('')
  const [showHistoryPicker, setShowHistoryPicker] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const sseRef = useRef(null)

  const nameError = touched.name && !productName.trim() ? '请输入产品名称' : ''
  const descError = touched.desc && !productDesc.trim() ? '请输入产品描述' : ''

  const runFallback = useCallback((features) => {
    setLoading(true)
    setError(null)
    setStep(3)
    setProgress(0)
    setProgressStages([])
    setProgressLabel(WORKFLOW_STAGES[0].label)
    setProgressStages([{ ...WORKFLOW_STAGES[0], status: 'active' }])

    let currentStage = 0
    const stageTimer = setInterval(() => {
      currentStage++
      if (currentStage < WORKFLOW_STAGES.length) {
        setProgressLabel(WORKFLOW_STAGES[currentStage].label)
        setProgress(Math.round(((currentStage + 1) / WORKFLOW_STAGES.length) * 100))
        setProgressStages(prev => [
          ...prev.map(s => s.status === 'active' ? { ...s, status: 'done' } : s),
          { ...WORKFLOW_STAGES[currentStage], status: 'active' }
        ])
      }
    }, 5000)

    createStory({
      productName,
      productDesc,
      productFeatures: features,
      targetUser: targetUser || undefined,
      tone,
    })
      .then((data) => {
        clearInterval(stageTimer)
        setProgress(100)
        setProgressLabel('创作完成')
        setProgressStages(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'done' } : s))
        setTimeout(() => {
          onCreate({
            id: Date.now(),
            productName,
            productDesc,
            template,
            targetUser,
            tone,
            result: data,
            createdAt: new Date().toISOString(),
          })
          setStep(4)
        }, 600)
      })
      .catch((err) => {
        clearInterval(stageTimer)
        setError(err.message || '网络连接失败，请检查后端服务是否运行')
        setStep(2)
      })
      .finally(() => setLoading(false))
  }, [productName, productDesc, targetUser, tone, template, onCreate])

  const handleSubmit = useCallback(() => {
    if (!productName.trim() || !productDesc.trim()) {
      setTouched({ name: true, desc: true })
      return
    }
    setLoading(true)
    setError(null)
    setStep(3)
    setProgress(0)
    setProgressStages([])
    setProgressLabel('连接AI服务...')
    setStreamingText('')

    const features = productFeatures.split('\n').filter(f => f.trim())

    sseRef.current = createStorySSE(
      { productName, productDesc, productFeatures: features, targetUser: targetUser || undefined, tone },
      {
        onConnected: () => {
          setProgressLabel('工作流初始化...')
        },
        onStageStart: (data) => {
          const stageInfo = WORKFLOW_STAGES[data.index] || { label: data.name, desc: data.description || '' }
          setProgressLabel(stageInfo.label)
          setProgress(data.progress)
          setProgressStages(prev => [
            ...prev.map(s => s.status === 'active' ? { ...s, status: 'done' } : s),
            { ...stageInfo, status: 'active' }
          ])
        },
        onStageComplete: (data) => {
          setProgress(data.progress)
          setProgressStages(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'done' } : s))
        },
        onStageText: (data) => {
          setStreamingText(prev => prev + data.text)
        },
        onStageError: (data) => {
          setProgressStages(prev => prev.map(s =>
            s.status === 'active' ? { ...s, status: 'error' } : s
          ))
        },
        onComplete: (data) => {
          setProgress(100)
          setProgressLabel('创作完成')
          setProgressStages(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'done' } : s))
          setLoading(false)

          setTimeout(() => {
            onCreate({
              id: data.id || Date.now(),
              productName,
              productDesc,
              template,
              targetUser,
              tone,
              result: data.result,
              createdAt: new Date().toISOString(),
            })
            setStep(4)
          }, 600)
        },
        onError: () => {
          setLoading(false)
          runFallback(features)
        },
      }
    )
  }, [productName, productDesc, productFeatures, targetUser, tone, template, onCreate, runFallback])

  const handleRefineSubmit = useCallback(async () => {
    if (!refineTarget?.id || !refineInstruction.trim()) return
    setLoading(true)
    setError(null)
    setStep(3)
    setProgress(0)
    setProgressStages([])
    setProgressLabel('AI优化中...')

    const stageTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(stageTimer); return prev }
        return prev + Math.random() * 15
      })
    }, 2000)

    try {
      const updated = await refineStory(refineTarget.id, refineInstruction)
      clearInterval(stageTimer)
      setProgress(100)
      setProgressLabel('优化完成')

      setTimeout(() => {
        onCreate({
          id: updated.id || refineTarget.id,
          productName: updated.productName || productName,
          productDesc: updated.productDesc || productDesc,
          template: updated.template || template,
          targetUser: updated.targetUser || targetUser,
          tone: updated.tone || tone,
          result: updated.result,
          currentVersion: updated.currentVersion,
          createdAt: new Date().toISOString(),
        })
        setStep(4)
      }, 600)
    } catch (err) {
      clearInterval(stageTimer)
      setError(err.message || '优化失败，请重试')
      setStep(2)
    } finally {
      setLoading(false)
    }
  }, [refineTarget, refineInstruction, productName, productDesc, template, targetUser, tone, onCreate])

  const handleSelectHistory = useCallback((item) => {
    setProductName(item.productName)
    setProductDesc(item.productDesc || '')
    setTargetUser(item.targetUser || '')
    setTemplate(item.template || null)
    setTone(item.tone || 'warm_professional')
    setIsRefineMode(true)
    setShowHistoryPicker(false)
    setStep(2)
  }, [])

  const canProceed = step === 1 ? !!template : (productName.trim() && productDesc.trim())

  return (
    <div className="page page-create">
      <div className="create-header">
        <h2 className="create-title">创作品牌故事</h2>
        <div className="step-indicator">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`step-dot ${step >= s.id ? 'step-dot--active' : ''} ${step > s.id ? 'step-dot--done' : ''}`}>
              <div className="step-dot-circle">
                {step > s.id ? <Icon name="check" size={12} /> : s.id}
              </div>
              <span className="step-dot-label">{s.label}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>
      </div>

      <div className="create-body">
        {step === 1 && (
          <div className="step-panel">
            <div className="step-panel-header">
              <h3>选择产品类型</h3>
              <p>不同类型会生成不同风格的品牌叙事</p>
            </div>
            <div className="template-grid">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`template-card ${template === t.id ? 'template-card--active' : ''}`}
                  onClick={() => setTemplate(t.id)}
                >
                  <span className="template-emoji">{t.icon}</span>
                  <span className="template-name">{t.name}</span>
                  <span className="template-desc">{t.desc}</span>
                  {template === t.id && (
                    <div className="template-check">
                      <Icon name="check" size={14} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {history && history.length > 0 && (
              <div className="refine-entry">
                <div className="refine-entry-divider"><span>或者</span></div>
                <button className="btn btn-outline btn-sm refine-entry-btn" onClick={() => setShowHistoryPicker(true)}>
                  <Icon name="star" size={14} /> 基于已有创作优化
                </button>
              </div>
            )}
            <div className="step-actions">
              <button className="btn btn-ghost" onClick={() => onNavigate('home')}>取消</button>
              <button className="btn btn-primary" disabled={!canProceed} onClick={() => setStep(2)}>
                下一步 <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-panel">
            <div className="step-panel-header">
              <h3>{isRefineMode ? '优化已有创作' : '描述你的产品'}</h3>
              <p>{isRefineMode ? '在已有内容基础上，通过AI指令进行优化迭代' : '越详细的描述，AI创作的内容越精准'}</p>
            </div>
            {isRefineMode && refineTarget && (
              <div className="refine-source-card">
                <div className="refine-source-label"><Icon name="star" size={12} /> 基于创作</div>
                <div className="refine-source-name">{refineTarget.productName}</div>
                <div className="refine-source-meta">
                  {refineTarget.currentVersion > 1 && <span>v{refineTarget.currentVersion}</span>}
                  <span>{new Date(refineTarget.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            )}
            <div className="form-card">
              <div className="form-group">
                <label className="form-label">产品名称 <span className="required">*</span></label>
                <div className="input-wrap">
                  <input
                    className={`input ${nameError ? 'input--error' : ''}`}
                    type="text"
                    value={productName}
                    onChange={(e) => { setProductName(e.target.value); setTouched(t => ({...t, name: true})) }}
                    onBlur={() => setTouched(t => ({...t, name: true}))}
                    placeholder="例如：智能手环、咖啡机、电动牙刷"
                    maxLength={50}
                  />
                  <CharCount current={productName.length} max={50} />
                </div>
                {nameError && <span className="form-error">{nameError}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">产品描述 <span className="required">*</span></label>
                <div className="input-wrap">
                  <textarea
                    className={`input textarea ${descError ? 'input--error' : ''}`}
                    value={productDesc}
                    onChange={(e) => { setProductDesc(e.target.value); setTouched(t => ({...t, desc: true})) }}
                    onBlur={() => setTouched(t => ({...t, desc: true}))}
                    placeholder="描述一下这个产品是做什么的，有什么特别之处..."
                    rows={4}
                    maxLength={500}
                  />
                  <CharCount current={productDesc.length} max={500} />
                </div>
                {descError && <span className="form-error">{descError}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">产品特点 <span className="form-label-hint">（选填，每行一个）</span></label>
                <textarea
                  className="input textarea"
                  value={productFeatures}
                  onChange={(e) => setProductFeatures(e.target.value)}
                  placeholder={"每行一个特点，例如：\n长续航\n防水设计\n轻便易携"}
                  rows={4}
                  maxLength={300}
                />
              </div>
              <div className="form-row">
                <div className="form-group form-group--half">
                  <label className="form-label">目标用户 <span className="form-label-hint">（选填）</span></label>
                  <input
                    className="input"
                    type="text"
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    placeholder="例如：25-35岁都市白领"
                    maxLength={50}
                  />
                </div>
                <div className="form-group form-group--half">
                  <label className="form-label">叙事语调</label>
                  <select className="input input-select" value={tone} onChange={(e) => setTone(e.target.value)}>
                    {TONES.map(t => (
                      <option key={t.id} value={t.id}>{t.name} — {t.desc}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {isRefineMode && (
              <div className="form-card refine-instruction-card">
                <div className="form-group">
                  <label className="form-label">优化指令 <span className="required">*</span></label>
                  <textarea
                    className="input textarea"
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    placeholder="描述你希望如何优化，例如：让品牌故事更有感染力、增加更多数据支撑、调整语调更专业..."
                    rows={4}
                    maxLength={500}
                  />
                  <CharCount current={refineInstruction.length} max={500} />
                </div>
              </div>
            )}
            {error && (
              <div className="alert">
                <span className="alert-icon">!</span>
                <span className="alert-text">{error}</span>
                <button className="btn btn-ghost btn-sm" onClick={handleSubmit}>
                  <Icon name="refresh" size={14} /> 重试
                </button>
              </div>
            )}
            <div className="step-actions">
              <button className="btn btn-ghost" onClick={() => { setIsRefineMode(false); setStep(1) }}>上一步</button>
              {isRefineMode && refineTarget ? (
                <button className="btn btn-primary" disabled={!refineInstruction.trim() || loading} onClick={handleRefineSubmit}>
                  <Icon name="star" size={16} /> {loading ? '优化中...' : '开始优化'}
                </button>
              ) : (
                <button className="btn btn-primary" disabled={!canProceed || loading} onClick={handleSubmit}>
                  <Icon name="sparkles" size={16} /> 开始创作
                </button>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-panel step-panel--loading">
            <div className="loading-scene">
              <div className="loading-orb">
                <div className="orb-ring" />
                <div className="orb-ring" />
                <div className="orb-core">
                  <Icon name="sparkles" size={28} />
                </div>
              </div>
              <h3 className="loading-title">AI正在创作中</h3>
              <p className="loading-stage">{progressLabel || '初始化工作流...'}</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              {progressStages.length > 0 && (
                <div className="loading-stages">
                  {progressStages.map((s, i) => (
                    <div key={i} className={`loading-stage-item loading-stage-item--${s.status}`}>
                      <span className="loading-stage-dot" />
                      <span className="loading-stage-label">{s.label}</span>
                      <span className="loading-stage-desc">{s.desc}</span>
                    </div>
                  ))}
                </div>
              )}
              {streamingText && (
                <div className="streaming-preview">
                  <div className="streaming-preview-header">
                    <Icon name="book" size={12} /> 品牌故事实时预览
                  </div>
                  <div className="streaming-preview-content">
                    {streamingText}
                    <span className="streaming-cursor">▌</span>
                  </div>
                </div>
              )}
              <p className="loading-hint">通常需要20-40秒，请耐心等待</p>
            </div>
          </div>
        )}
      </div>

      {showHistoryPicker && (
        <div className="modal-overlay" onClick={() => setShowHistoryPicker(false)}>
          <div className="modal-content modal-content--lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>选择已有创作</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowHistoryPicker(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-hint">选择一条已有的创作记录，在它的基础上进行优化迭代</p>
              <div className="history-picker-list">
                {(history || []).slice(0, 20).map((h) => (
                  <button
                    key={h.id}
                    className="history-picker-item"
                    onClick={() => handleSelectHistory(h)}
                  >
                    <div className="history-picker-icon">
                      {TEMPLATES.find(t => t.id === h.template)?.icon || '📝'}
                    </div>
                    <div className="history-picker-body">
                      <div className="history-picker-name">{h.productName}</div>
                      <div className="history-picker-meta">
                        <span>{new Date(h.createdAt).toLocaleDateString('zh-CN')}</span>
                        {h.result?.brandStory?.wordCount > 0 && <span>{h.result.brandStory.wordCount}字</span>}
                        {h.currentVersion > 1 && <span>v{h.currentVersion}</span>}
                      </div>
                    </div>
                  </button>
                ))}
                {(!history || history.length === 0) && (
                  <div className="history-picker-empty">暂无创作记录</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
