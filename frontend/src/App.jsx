import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import './App.css'

const API_BASE = ''

const TEMPLATES = [
  { id: 'tech', name: '科技产品', icon: '⚡', desc: '智能硬件、SaaS工具', color: '#1B4332' },
  { id: 'lifestyle', name: '生活方式', icon: '🌿', desc: '家居、美妆、食品', color: '#8B5E3C' },
  { id: 'health', name: '健康运动', icon: '💪', desc: '运动装备、健康食品', color: '#2D6A4F' },
  { id: 'education', name: '教育学习', icon: '📚', desc: '课程、工具、平台', color: '#6B4C8A' },
  { id: 'finance', name: '金融理财', icon: '💰', desc: '支付、投资、保险', color: '#8B6914' },
  { id: 'travel', name: '旅行出行', icon: '✈️', desc: '酒店、交通、攻略', color: '#1A5276' },
]

const TONES = [
  { id: 'warm_professional', name: '温暖专业', desc: '亲和力与专业感并重' },
  { id: 'inspiring', name: '激励鼓舞', desc: '充满力量与感染力' },
  { id: 'elegant', name: '优雅精致', desc: '高端品质与生活美学' },
  { id: 'playful', name: '活泼有趣', desc: '轻松幽默与年轻活力' },
  { id: 'trustworthy', name: '可靠信赖', desc: '稳重权威与安全感' },
]

const STEPS = [
  { id: 1, label: '选择模板' },
  { id: 2, label: '填写信息' },
  { id: 3, label: 'AI创作' },
  { id: 4, label: '查看结果' },
]

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initial
    } catch { return initial }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue]
}

function Icon({ name, size = 20, className = '' }) {
  const icons = {
    home: <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />,
    pen: <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />,
    clock: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    download: <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
    copy: <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />,
    check: <path d="M5 13l4 4L19 7" />,
    star: <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />,
    heart: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    bolt: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
    book: <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
    user: <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
    film: <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />,
    sparkles: <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />,
    trash: <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    arrow: <path d="M5 10l7-7m0 0l7 7m-7-7v18" />,
    refresh: <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
    x: <path d="M6 18L18 6M6 6l12 12" />,
    share: <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />,
    printer: <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />,
    shield: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    info: <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    file: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    bookmark: <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />,
    target: <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />,
    chart: <path d="M3 3v18h18M9 17V9m4 8V5m4 12v-4" />,
    eye: <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />,
    edit: <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    chevron: <path d="M15 19l-7-7 7-7" />,
    lightbulb: <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {icons[name]}
    </svg>
  )
}

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`toast toast--${type}`}>
      <Icon name={type === 'success' ? 'check' : type === 'error' ? 'x' : 'info'} size={16} />
      <span>{message}</span>
    </div>
  )
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-icon-wrap">
          <Icon name="trash" size={20} />
        </div>
        <h3 className="dialog-title">{title}</h3>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onCancel}>取消</button>
          <button className="btn btn-primary btn-danger" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  )
}

function CharCount({ current, max }) {
  const ratio = current / max
  return (
    <span className={`char-count ${ratio > 0.9 ? 'char-count--warn' : ''} ${ratio >= 1 ? 'char-count--over' : ''}`}>
      {current}/{max}
    </span>
  )
}

function QualityScore({ score, label }) {
  const clampedScore = Math.min(100, Math.max(0, score || 0))
  const getGrade = (s) => {
    if (s >= 90) return { grade: 'A', color: '#2D6A4F' }
    if (s >= 75) return { grade: 'B', color: '#1B4332' }
    if (s >= 60) return { grade: 'C', color: '#B8860B' }
    return { grade: 'D', color: '#9B2C2C' }
  }
  const { grade, color } = getGrade(clampedScore)
  return (
    <div className="quality-score">
      <div className="quality-score-ring">
        <svg viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-paper-cream)" strokeWidth="5" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${(clampedScore / 100) * 213.6} 213.6`}
            strokeLinecap="round" transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dasharray 1s var(--ease-out-expo)' }} />
        </svg>
        <div className="quality-score-value" style={{ color }}>{grade}</div>
      </div>
      {label && <div className="quality-score-label">{label}</div>}
    </div>
  )
}

function OnboardingGuide({ onClose }) {
  const [step, setStep] = useState(0)
  const guides = [
    { icon: 'sparkles', title: '欢迎使用 StoryForge', desc: 'AI驱动的品牌故事创作平台，帮你将产品特性转化为引人入胜的品牌叙事。' },
    { icon: 'pen', title: '三步完成创作', desc: '选择模板 → 填写产品信息 → AI自动生成，整个过程只需1分钟。' },
    { icon: 'book', title: '结构化结果展示', desc: '品牌故事、产品价值、用户画像、使用场景、传播建议，五大维度完整呈现。' },
  ]
  return (
    <div className="onboarding-overlay" onClick={onClose}>
      <div className="onboarding" onClick={e => e.stopPropagation()}>
        <button className="onboarding-close" onClick={onClose}>
          <Icon name="x" size={16} />
        </button>
        <div className="onboarding-icon-wrap">
          <Icon name={guides[step].icon} size={32} />
        </div>
        <h3 className="onboarding-title">{guides[step].title}</h3>
        <p className="onboarding-desc">{guides[step].desc}</p>
        <div className="onboarding-dots">
          {guides.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === step ? 'onboarding-dot--active' : ''} ${i < step ? 'onboarding-dot--done' : ''}`} />
          ))}
        </div>
        <div className="onboarding-actions">
          {step > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(step - 1)}>上一步</button>
          )}
          {step < guides.length - 1 ? (
            <button className="btn btn-primary btn-sm" onClick={() => setStep(step + 1)}>下一步</button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onClose}>开始使用</button>
          )}
        </div>
      </div>
    </div>
  )
}

function PageHome({ onNavigate, historyCount }) {
  return (
    <div className="page page-home">
      <section className="hero">
        <div className="hero-badge">
          <Icon name="sparkles" size={14} />
          <span>AI驱动</span>
        </div>
        <h1 className="hero-title">
          让每个产品<br /><span className="hero-title-accent">都有动人故事</span>
        </h1>
        <p className="hero-desc">
          基于先进AI技术，将产品特性转化为引人入胜的品牌叙事。
          从价值洞察到场景构建，一站式完成专业级品牌内容创作。
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('create')}>
            <Icon name="pen" size={18} />
            开始创作
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => onNavigate('history')}>
            <Icon name="clock" size={18} />
            历史记录
            {historyCount > 0 && <span className="badge">{historyCount}</span>}
          </button>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">5</span>
            <span className="hero-stat-label">创作阶段</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">6</span>
            <span className="hero-stat-label">行业模板</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">5</span>
            <span className="hero-stat-label">内容维度</span>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-label">核心能力</div>
        <div className="features-grid">
          {[
            { icon: 'bolt', title: '产品价值提炼', desc: '深度分析产品特性，提炼核心价值主张与差异化优势' },
            { icon: 'user', title: '用户画像洞察', desc: '构建精准用户画像，洞察痛点需求与情感驱动力' },
            { icon: 'film', title: '场景叙事构建', desc: '设计沉浸式使用场景，让用户身临其境感受产品价值' },
            { icon: 'book', title: '品牌故事创作', desc: '融合情感共鸣与品牌调性，创作打动人心的品牌叙事' },
          ].map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon-wrap">
                <Icon name={f.icon} size={22} />
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <div className="features-label">创作流程</div>
        <div className="steps-flow">
          {[
            { num: '01', title: '选择模板', desc: '根据产品类型选择创作风格' },
            { num: '02', title: '填写信息', desc: '输入产品名称、描述和特点' },
            { num: '03', title: 'AI创作', desc: '五阶段工作流自动生成内容' },
            { num: '04', title: '查看导出', desc: '浏览结构化结果并一键导出' },
          ].map((s, i) => (
            <div key={i} className="step-item" style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="step-num">{s.num}</div>
              <div className="step-content">
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
              {i < 3 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <div className="cta-card">
          <div className="cta-content">
            <h3>准备好创作你的品牌故事了吗？</h3>
            <p>只需三步，AI将为你生成专业的品牌叙事内容</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('create')}>
            <Icon name="pen" size={18} />
            立即开始
          </button>
        </div>
      </section>
    </div>
  )
}

function PageCreate({ onCreate, onNavigate }) {
  const [step, setStep] = useState(1)
  const [template, setTemplate] = useState(null)
  const [productName, setProductName] = useState('')
  const [productDesc, setProductDesc] = useState('')
  const [productFeatures, setProductFeatures] = useState('')
  const [targetUser, setTargetUser] = useState('')
  const [tone, setTone] = useState('warm_professional')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [progressStages, setProgressStages] = useState([])
  const [touched, setTouched] = useState({})

  const nameError = touched.name && !productName.trim() ? '请输入产品名称' : ''
  const descError = touched.desc && !productDesc.trim() ? '请输入产品描述' : ''

  const handleSubmit = async () => {
    if (!productName.trim() || !productDesc.trim()) {
      setTouched({ name: true, desc: true })
      return
    }
    setLoading(true)
    setError(null)
    setStep(3)
    setProgress(0)
    setProgressStages([])

    const stages = [
      { label: '产品价值分析', desc: '提炼核心价值主张' },
      { label: '用户需求洞察', desc: '构建精准用户画像' },
      { label: '场景构建设计', desc: '设计沉浸式使用场景' },
      { label: '故事叙事创作', desc: '融合情感与品牌调性' },
      { label: '内容优化完善', desc: '质量检测与优化' },
    ]
    let currentStage = 0
    setProgressLabel(stages[0].label)
    setProgressStages([{ ...stages[0], status: 'active' }])

    const stageTimer = setInterval(() => {
      currentStage++
      if (currentStage < stages.length) {
        setProgressLabel(stages[currentStage].label)
        setProgress(Math.round(((currentStage + 1) / stages.length) * 100))
        setProgressStages(prev => [
          ...prev.map(s => s.status === 'active' ? { ...s, status: 'done' } : s),
          { ...stages[currentStage], status: 'active' }
        ])
      }
    }, 5000)

    try {
      const features = productFeatures.split('\n').filter(f => f.trim())
      const response = await fetch(`${API_BASE}/api/story/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          productDesc,
          productFeatures: features,
          targetUser: targetUser || undefined,
          options: { tone }
        })
      })
      const data = await response.json()
      clearInterval(stageTimer)
      setProgress(100)
      setProgressLabel('创作完成')
      setProgressStages(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'done' } : s))

      if (data.success) {
        setTimeout(() => {
          onCreate({
            id: Date.now(),
            productName,
            productDesc,
            template,
            targetUser,
            tone,
            result: data.data,
            createdAt: new Date().toISOString(),
          })
          setStep(4)
        }, 600)
      } else {
        setError(data.error || '生成失败，请稍后重试')
        setStep(2)
      }
    } catch (err) {
      clearInterval(stageTimer)
      setError('网络连接失败，请检查后端服务是否运行')
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

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
            <div className="step-actions">
              <button className="btn btn-ghost" onClick={() => onNavigate('home')}>
                取消
              </button>
              <button className="btn btn-primary" disabled={!canProceed} onClick={() => setStep(2)}>
                下一步
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-panel">
            <div className="step-panel-header">
              <h3>描述你的产品</h3>
              <p>越详细的描述，AI创作的内容越精准</p>
            </div>
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
            {error && (
              <div className="alert">
                <span className="alert-icon">!</span>
                <span className="alert-text">{error}</span>
                <button className="btn btn-ghost btn-sm" onClick={handleSubmit}>
                  <Icon name="refresh" size={14} />
                  重试
                </button>
              </div>
            )}
            <div className="step-actions">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>
                上一步
              </button>
              <button className="btn btn-primary" disabled={!canProceed || loading} onClick={handleSubmit}>
                <Icon name="sparkles" size={16} />
                开始创作
              </button>
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
              <p className="loading-hint">通常需要20-40秒，请耐心等待</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function cleanStoryContent(content) {
  if (!content || typeof content !== 'string') return ''
  let cleaned = content
  cleaned = cleaned.replace(/" "(\s*" ")*/g, '')
  cleaned = cleaned.replace(/\s{3,}/g, '\n\n')
  const lines = cleaned.split('\n')
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) { result.push(''); continue }
    if (/^(但|却|直到|突然|并|在那一刻|他|她|它|我)$/.test(line) && i + 1 < lines.length) {
      lines[i + 1] = line + lines[i + 1]
      continue
    }
    const prevLine = result.length > 0 ? result[result.length - 1] : ''
    if (prevLine && line.length <= 4 && /^[^\s##\-*>]/.test(line) && !/^[0-9]+$/.test(line)) {
      result[result.length - 1] = prevLine + line
      continue
    }
    result.push(line)
  }
  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function renderMarkdownContent(content) {
  if (!content) return []
  const cleaned = cleanStoryContent(content)
  return cleaned.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return <h2 key={i} className="story-h2">{line.replace(/^#+\s*/, '')}</h2>
    if (line.startsWith('## ')) return <h3 key={i} className="story-h3">{line.replace(/^#+\s*/, '')}</h3>
    if (line.startsWith('### ')) return <h4 key={i} className="story-h4">{line.replace(/^#+\s*/, '')}</h4>
    if (line.startsWith('**') && line.endsWith('**')) return <h3 key={i} className="story-h3">{line.replace(/\*\*/g, '')}</h3>
    if (line.startsWith('- ')) return <li key={i} className="story-li">{line.replace('- ', '')}</li>
    if (line.trim() === '---') return <hr key={i} className="story-hr" />
    if (line.trim() === '') return null
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    if (parts.length > 1) {
      return <p key={i} className="story-p">{parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={j}>{part.slice(2, -2)}</strong>
        return part
      })}</p>
    }
    return <p key={i} className="story-p">{line}</p>
  })
}

function StoryViewer({ result, productName }) {
  const [activeTab, setActiveTab] = useState('story')
  const [toast, setToast] = useState(null)
  const contentRef = useRef(null)
  const [readingProgress, setReadingProgress] = useState(0)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      if (scrollHeight <= clientHeight) { setReadingProgress(0); return }
      setReadingProgress(Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)))
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [activeTab])

  const copyText = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => setToast('已复制到剪贴板')).catch(() => setToast('复制失败'))
  }, [])

  const exportJSON = useCallback(() => {
    const text = JSON.stringify(result, null, 2)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${productName}-品牌故事.json`
    a.click()
    URL.revokeObjectURL(url)
    setToast('已导出JSON文件')
  }, [result, productName])

  const exportMarkdown = useCallback(() => {
    const content = result?.brandStory?.content || ''
    if (!content) { setToast('暂无内容可导出'); return }
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${productName}-品牌故事.md`
    a.click()
    URL.revokeObjectURL(url)
    setToast('已导出Markdown文件')
  }, [result, productName])

  const handlePrint = useCallback(() => { window.print() }, [])

  const handleShare = useCallback(() => {
    const content = result?.brandStory?.content || ''
    if (navigator.share) {
      navigator.share({ title: `${productName} 品牌故事`, text: content.substring(0, 200) + '...' }).catch(() => {})
    } else {
      copyText(content)
    }
  }, [result, productName, copyText])

  const story = result?.brandStory
  const profile = result?.userProfile
  const scenarios = result?.scenarios || []
  const value = result?.productValue
  const distribution = result?.distribution
  const quality = result?.quality
  const emotionalConnections = result?.emotionalConnections

  const qualityScore = useMemo(() => {
    if (!quality) return null
    let score = 70
    if (quality.passed) score += 15
    if (story?.wordCount > 500) score += 5
    if (story?.wordCount > 800) score += 5
    if (emotionalConnections?.triggers?.length > 0) score += 5
    return Math.min(100, score)
  }, [quality, story, emotionalConnections])

  const readingTime = useMemo(() => {
    const content = story?.content || ''
    return Math.max(1, Math.round(content.length / 400))
  }, [story])

  const tabs = [
    { id: 'story', label: '品牌故事', icon: 'book' },
    { id: 'value', label: '产品价值', icon: 'star' },
    { id: 'profile', label: '用户画像', icon: 'user' },
    { id: 'scenarios', label: '使用场景', icon: 'film' },
    { id: 'distribution', label: '传播建议', icon: 'share' },
  ]

  return (
    <div className="story-viewer">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {readingProgress > 0 && readingProgress < 100 && (
        <div className="reading-progress">
          <div className="reading-progress-fill" style={{ width: `${readingProgress}%` }} />
        </div>
      )}

      <div className="viewer-toolbar">
        <div className="viewer-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`viewer-tab ${activeTab === t.id ? 'viewer-tab--active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="viewer-actions">
          <button className="icon-btn" title="分享" onClick={handleShare}>
            <Icon name="share" size={16} />
          </button>
          <button className="icon-btn" title="复制内容" onClick={() => copyText(story?.content || '')}>
            <Icon name="copy" size={16} />
          </button>
          <button className="icon-btn" title="导出Markdown" onClick={exportMarkdown}>
            <Icon name="file" size={16} />
          </button>
          <button className="icon-btn" title="导出JSON" onClick={exportJSON}>
            <Icon name="download" size={16} />
          </button>
          <button className="icon-btn" title="打印" onClick={handlePrint}>
            <Icon name="printer" size={16} />
          </button>
        </div>
      </div>

      <div className="viewer-content" ref={contentRef}>
        {activeTab === 'story' && (
          <div className="viewer-panel">
            {story ? (
              <>
                <div className="story-meta">
                  {story.wordCount > 0 && (
                    <span className="meta-chip"><Icon name="bolt" size={12} /> {story.wordCount} 字</span>
                  )}
                  <span className="meta-chip"><Icon name="clock" size={12} /> 约{readingTime}分钟阅读</span>
                  {story.emotionalResonance?.primary && (
                    <span className="meta-chip meta-chip--accent"><Icon name="heart" size={12} /> {story.emotionalResonance.primary}</span>
                  )}
                  {quality?.passed && (
                    <span className="meta-chip meta-chip--success"><Icon name="shield" size={12} /> 质量验证通过</span>
                  )}
                </div>
                {qualityScore && (
                  <div className="story-quality">
                    <QualityScore score={qualityScore} label="内容质量" />
                    <div className="story-quality-details">
                      <div className="quality-detail">
                        <span className="quality-detail-label">故事完整性</span>
                        <div className="quality-detail-bar">
                          <div className="quality-detail-fill" style={{ width: `${Math.min(100, qualityScore + 5)}%` }} />
                        </div>
                      </div>
                      <div className="quality-detail">
                        <span className="quality-detail-label">情感共鸣度</span>
                        <div className="quality-detail-bar">
                          <div className="quality-detail-fill quality-detail-fill--accent" style={{ width: `${Math.min(100, qualityScore - 5)}%` }} />
                        </div>
                      </div>
                      <div className="quality-detail">
                        <span className="quality-detail-label">品牌一致性</span>
                        <div className="quality-detail-bar">
                          <div className="quality-detail-fill quality-detail-fill--primary" style={{ width: `${Math.min(100, qualityScore)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <article className="story-article">
                  {renderMarkdownContent(story.content)}
                </article>
                {emotionalConnections?.triggers?.length > 0 && (
                  <div className="story-extras">
                    <h4 className="extras-title">情感触发点</h4>
                    <div className="extras-tags">
                      {emotionalConnections.triggers.map((t, i) => (
                        <span key={i} className="extras-tag">{typeof t === 'string' ? t : t.trigger || t.name || JSON.stringify(t)}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state"><Icon name="book" size={32} /><p>暂无品牌故事内容</p></div>
            )}
          </div>
        )}

        {activeTab === 'value' && (
          <div className="viewer-panel">
            {value ? (
              <div className="value-layout">
                <div className="value-hero-block">
                  <div className="value-hero-label">核心价值主张</div>
                  <div className="value-hero-text">{value.coreValue || ''}</div>
                  {value.extended && <div className="value-hero-sub">{value.extended}</div>}
                  {value.differentiation?.marketPosition && (
                    <div className="value-hero-position">
                      <Icon name="target" size={14} />
                      <span>{value.differentiation.marketPosition}</span>
                    </div>
                  )}
                </div>

                {value.differentiation?.uniquePoints?.length > 0 && (
                  <div className="value-section">
                    <h4 className="value-section-title">
                      <Icon name="star" size={14} className="section-title-icon" />
                      独特卖点
                    </h4>
                    <div className="value-unique-grid">
                      {value.differentiation.uniquePoints.map((p, i) => (
                        <div key={i} className="value-unique-card" style={{ animationDelay: `${i * 0.1}s` }}>
                          <div className="unique-card-index">{String(i + 1).padStart(2, '0')}</div>
                          <div className="unique-card-body">
                            <div className="unique-card-text">{typeof p === 'string' ? p : p.point || p.description || JSON.stringify(p)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {value.differentiation.competitiveAdvantage && (
                      <div className="value-advantage">
                        <div className="advantage-label">竞争优势</div>
                        <div className="advantage-text">{value.differentiation.competitiveAdvantage}</div>
                      </div>
                    )}
                  </div>
                )}

                {value.keyFeatures?.length > 0 && (
                  <div className="value-section">
                    <h4 className="value-section-title">
                      <Icon name="bolt" size={14} className="section-title-icon" />
                      核心功能价值
                    </h4>
                    <div className="feature-value-grid">
                      {value.keyFeatures.map((f, i) => (
                        <div key={i} className="feature-value-card" style={{ animationDelay: `${i * 0.08}s` }}>
                          <div className="fv-feature">{typeof f === 'string' ? f : f.feature}</div>
                          {typeof f !== 'string' && f.benefit && <div className="fv-benefit">{f.benefit}</div>}
                          {typeof f !== 'string' && f.scenario && <div className="fv-scenario"><Icon name="eye" size={12} />{f.scenario}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {value.keyBenefits && (
                  <div className="value-section">
                    <h4 className="value-section-title">
                      <Icon name="chart" size={14} className="section-title-icon" />
                      用户收益矩阵
                    </h4>
                    <div className="benefit-matrix">
                      {value.keyBenefits.functional?.length > 0 && (
                        <div className="benefit-column">
                          <div className="benefit-column-header benefit-column-header--func">
                            <Icon name="bolt" size={14} />
                            功能收益
                          </div>
                          <div className="benefit-items">
                            {value.keyBenefits.functional.map((b, i) => (
                              <div key={i} className="benefit-item benefit-item--func" style={{ animationDelay: `${i * 0.06}s` }}>
                                <Icon name="check" size={12} />
                                <span>{typeof b === 'string' ? b : b.benefit || b.description || JSON.stringify(b)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {value.keyBenefits.emotional?.length > 0 && (
                        <div className="benefit-column">
                          <div className="benefit-column-header benefit-column-header--emo">
                            <Icon name="heart" size={14} />
                            情感收益
                          </div>
                          <div className="benefit-items">
                            {value.keyBenefits.emotional.map((b, i) => (
                              <div key={i} className="benefit-item benefit-item--emo" style={{ animationDelay: `${i * 0.06}s` }}>
                                <Icon name="heart" size={12} />
                                <span>{typeof b === 'string' ? b : b.benefit || b.description || JSON.stringify(b)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {value.keyBenefits.social?.length > 0 && (
                        <div className="benefit-column">
                          <div className="benefit-column-header benefit-column-header--soc">
                            <Icon name="share" size={14} />
                            社交收益
                          </div>
                          <div className="benefit-items">
                            {value.keyBenefits.social.map((b, i) => (
                              <div key={i} className="benefit-item benefit-item--soc" style={{ animationDelay: `${i * 0.06}s` }}>
                                <Icon name="share" size={12} />
                                <span>{typeof b === 'string' ? b : b.benefit || b.description || JSON.stringify(b)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {value.painSolutions?.length > 0 && (
                  <div className="value-section">
                    <h4 className="value-section-title">
                      <Icon name="shield" size={14} className="section-title-icon" />
                      痛点解决方案
                    </h4>
                    <div className="pain-solution-grid">
                      {value.painSolutions.map((ps, i) => (
                        <div key={i} className="pain-solution-card" style={{ animationDelay: `${i * 0.08}s` }}>
                          <div className="ps-pain">
                            <span className="ps-pain-dot" />
                            <span className="ps-pain-text">{ps.pain}</span>
                            {ps.intensity && <span className={`ps-intensity ps-intensity--${ps.intensity === '高' ? 'high' : ps.intensity === '低' ? 'low' : 'mid'}`}>{ps.intensity}</span>}
                          </div>
                          <div className="ps-arrow">
                            <Icon name="arrow" size={14} />
                          </div>
                          <div className="ps-solution">
                            {ps.feature && <span className="ps-feature">{ps.feature}</span>}
                            <span className="ps-solution-text">{ps.solution}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state"><Icon name="star" size={32} /><p>暂无产品价值内容</p></div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="viewer-panel">
            {profile ? (
              <div className="profile-layout">
                <div className="persona-card">
                  <div className="persona-top">
                    <div className="persona-avatar">{(profile.persona?.name || 'U')[0]}</div>
                    <div className="persona-info">
                      <div className="persona-name">{profile.persona?.name || '未命名用户'}</div>
                      {profile.persona?.archetype && <span className="persona-badge">{profile.persona.archetype}</span>}
                    </div>
                  </div>
                  <p className="persona-desc">{profile.persona?.description || ''}</p>
                  {profile.persona?.quote && <blockquote className="persona-quote">"{profile.persona.quote}"</blockquote>}
                </div>

                {profile.demographics && Object.values(profile.demographics).some(v => v) && (
                  <div className="profile-section">
                    <h4 className="profile-section-title"><span className="section-dot section-dot--primary" />人口统计学特征</h4>
                    <div className="demo-grid">
                      {profile.demographics.ageRange && (
                        <div className="demo-item" style={{ animationDelay: '0s' }}>
                          <div className="demo-icon"><Icon name="user" size={16} /></div>
                          <div className="demo-content">
                            <div className="demo-label">年龄段</div>
                            <div className="demo-value">{profile.demographics.ageRange}</div>
                          </div>
                        </div>
                      )}
                      {profile.demographics.incomeRange && (
                        <div className="demo-item" style={{ animationDelay: '0.05s' }}>
                          <div className="demo-icon"><Icon name="chart" size={16} /></div>
                          <div className="demo-content">
                            <div className="demo-label">收入水平</div>
                            <div className="demo-value">{profile.demographics.incomeRange}</div>
                          </div>
                        </div>
                      )}
                      {profile.demographics.education && (
                        <div className="demo-item" style={{ animationDelay: '0.1s' }}>
                          <div className="demo-icon"><Icon name="book" size={16} /></div>
                          <div className="demo-content">
                            <div className="demo-label">教育程度</div>
                            <div className="demo-value">{profile.demographics.education}</div>
                          </div>
                        </div>
                      )}
                      {profile.demographics.location && (
                        <div className="demo-item" style={{ animationDelay: '0.15s' }}>
                          <div className="demo-icon"><Icon name="home" size={16} /></div>
                          <div className="demo-content">
                            <div className="demo-label">所在区域</div>
                            <div className="demo-value">{profile.demographics.location}</div>
                          </div>
                        </div>
                      )}
                      {profile.demographics.occupation && (
                        <div className="demo-item" style={{ animationDelay: '0.2s' }}>
                          <div className="demo-icon"><Icon name="edit" size={16} /></div>
                          <div className="demo-content">
                            <div className="demo-label">职业身份</div>
                            <div className="demo-value">{profile.demographics.occupation}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {profile.painPoints?.length > 0 && (
                  <div className="profile-section">
                    <h4 className="profile-section-title"><span className="section-dot section-dot--error" />用户痛点</h4>
                    <div className="pain-grid">
                      {profile.painPoints.map((p, i) => (
                        <div key={i} className="pain-item" style={{ animationDelay: `${i * 0.06}s` }}>
                          <div className="pain-label">{typeof p === 'string' ? p : p.pain || p.description || p.point || JSON.stringify(p)}</div>
                          <div className="pain-tags">
                            {typeof p !== 'string' && p.intensity && <span className="tag tag--error">{p.intensity}</span>}
                            {typeof p !== 'string' && p.frequency && <span className="tag tag--warn">{p.frequency}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.emotionalNeeds?.length > 0 && (
                  <div className="profile-section">
                    <h4 className="profile-section-title"><span className="section-dot section-dot--success" />需求偏好</h4>
                    <div className="need-grid">
                      {profile.emotionalNeeds.map((n, i) => (
                        <div key={i} className="need-item" style={{ animationDelay: `${i * 0.06}s` }}>
                          <div className="need-main">
                            <span className="need-label">{typeof n === 'string' ? n : n.need || n.description || n.emotion || JSON.stringify(n)}</span>
                            {typeof n !== 'string' && n.priority && <span className="tag tag--success">{n.priority}</span>}
                          </div>
                          {typeof n !== 'string' && n.manifestation && <div className="need-manifestation">{n.manifestation}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.motivationTriggers?.length > 0 && (
                  <div className="profile-section">
                    <h4 className="profile-section-title"><span className="section-dot section-dot--accent" />使用动机</h4>
                    <div className="motivation-grid">
                      {profile.motivationTriggers.map((m, i) => (
                        <div key={i} className="motivation-card" style={{ animationDelay: `${i * 0.08}s` }}>
                          <div className="motivation-trigger">
                            <Icon name="bolt" size={14} />
                            <span>{typeof m === 'string' ? m : m.trigger}</span>
                          </div>
                          {typeof m !== 'string' && m.context && <div className="motivation-context"><Icon name="eye" size={12} />{m.context}</div>}
                          {typeof m !== 'string' && m.action && <div className="motivation-action"><Icon name="arrow" size={12} />{m.action}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.behaviorPatterns && typeof profile.behaviorPatterns === 'object' && Object.keys(profile.behaviorPatterns).length > 0 && (
                  <div className="profile-section">
                    <h4 className="profile-section-title"><span className="section-dot section-dot--info" />行为习惯</h4>
                    <div className="behavior-grid">
                      {profile.behaviorPatterns.informationGathering && (
                        <div className="behavior-item" style={{ animationDelay: '0s' }}>
                          <div className="behavior-label">信息获取</div>
                          <div className="behavior-value">{profile.behaviorPatterns.informationGathering}</div>
                        </div>
                      )}
                      {profile.behaviorPatterns.decisionFactors && (
                        <div className="behavior-item" style={{ animationDelay: '0.05s' }}>
                          <div className="behavior-label">决策因素</div>
                          <div className="behavior-value">{profile.behaviorPatterns.decisionFactors}</div>
                        </div>
                      )}
                      {profile.behaviorPatterns.usageContext && (
                        <div className="behavior-item" style={{ animationDelay: '0.1s' }}>
                          <div className="behavior-label">使用场景</div>
                          <div className="behavior-value">{profile.behaviorPatterns.usageContext}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state"><Icon name="user" size={32} /><p>暂无用户画像内容</p></div>
            )}
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="viewer-panel">
            {scenarios.length > 0 ? (
              <div className="scenario-layout">
                {scenarios.map((s, i) => (
                  <div key={i} className="scenario-card" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="scenario-card-header">
                      <h4 className="scenario-card-title">{s.title}</h4>
                      <div className="scenario-card-meta">
                        {s.setting?.time && <span><Icon name="clock" size={12} />{s.setting.time}</span>}
                        {s.setting?.place && <span><Icon name="home" size={12} />{s.setting.place}</span>}
                      </div>
                    </div>

                    {s.character?.name && (
                      <div className="scenario-character">
                        <div className="scenario-char-avatar">{s.character.name[0]}</div>
                        <div className="scenario-char-info">
                          <div className="scenario-char-name">{s.character.name}{s.character.role ? ` · ${s.character.role}` : ''}</div>
                          {s.character.state && <div className="scenario-char-state">状态：{s.character.state}</div>}
                          {s.character.desire && <div className="scenario-char-desire">渴望：{s.character.desire}</div>}
                        </div>
                      </div>
                    )}

                    {s.setting?.atmosphere && <div className="scenario-atmosphere">{s.setting.atmosphere}</div>}

                    {s.plot && (
                      <div className="scenario-plot">
                        {s.plot.setup && <div className="plot-step"><div className="plot-label">背景</div><div className="plot-text">{s.plot.setup}</div></div>}
                        {s.plot.conflict && <div className="plot-step"><div className="plot-label plot-label--conflict">冲突</div><div className="plot-text">{s.plot.conflict}</div></div>}
                        {s.plot.climax && <div className="plot-step"><div className="plot-label plot-label--climax">产品介入</div><div className="plot-text">{s.plot.climax}</div></div>}
                        {s.plot.resolution && <div className="plot-step"><div className="plot-label plot-label--resolve">解决</div><div className="plot-text">{s.plot.resolution}</div></div>}
                        {s.plot.aftermath && <div className="plot-step"><div className="plot-label plot-label--aftermath">升华</div><div className="plot-text">{s.plot.aftermath}</div></div>}
                      </div>
                    )}

                    {s.operationFlow?.length > 0 && (
                      <div className="scenario-flow">
                        <div className="scenario-flow-title">操作流程</div>
                        <div className="flow-steps">
                          {s.operationFlow.map((step, j) => (
                            <div key={j} className="flow-step" style={{ animationDelay: `${j * 0.08}s` }}>
                              <div className="flow-step-num">{step.step}</div>
                              <div className="flow-step-body">
                                <div className="flow-step-phase">{step.phase}</div>
                                <div className="flow-step-action">{step.action}</div>
                              </div>
                              {j < s.operationFlow.length - 1 && <div className="flow-step-connector" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {s.emotionalArc?.length > 0 && (
                      <div className="scenario-emotion">
                        <div className="scenario-emotion-title">情感弧线</div>
                        <div className="emotion-track">
                          {s.emotionalArc.map((e, j) => (
                            <div key={j} className="emotion-node" style={{ animationDelay: `${j * 0.1}s` }}>
                              <div className="emotion-dot" />
                              <span className="emotion-label">{e}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {s.expectedEffect && (
                      <div className="scenario-effect">
                        <Icon name="check" size={14} />
                        <span>预期效果：{s.expectedEffect}</span>
                      </div>
                    )}

                    {s.productRole && (
                      <div className="scenario-product-role">
                        <Icon name="info" size={14} />
                        <span>产品角色：{s.productRole}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><Icon name="film" size={32} /><p>暂无场景内容</p></div>
            )}
          </div>
        )}

        {activeTab === 'distribution' && (
          <div className="viewer-panel">
            {distribution ? (
              <div className="distribution-layout">
                {distribution.channelSuggestions?.length > 0 && (
                  <div className="dist-section">
                    <h4 className="dist-section-title">推荐传播渠道</h4>
                    <div className="dist-channels">
                      {distribution.channelSuggestions.map((ch, i) => (
                        <div key={i} className="dist-channel" style={{ animationDelay: `${i * 0.08}s` }}>
                          <span className="dist-channel-name">{typeof ch === 'string' ? ch : ch.channel || ch.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {distribution.formatRecommendations?.length > 0 && (
                  <div className="dist-section">
                    <h4 className="dist-section-title">格式建议</h4>
                    <div className="dist-formats">
                      {distribution.formatRecommendations.map((f, i) => (
                        <div key={i} className="dist-format-card" style={{ animationDelay: `${i * 0.08}s` }}>
                          <div className="dist-format-name">{f.format || '通用'}</div>
                          <div className="dist-format-length">{f.length || '800-1200字'}</div>
                          <div className="dist-format-style">{f.style || '标准'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {emotionalConnections?.keyMessages?.length > 0 && (
                  <div className="dist-section">
                    <h4 className="dist-section-title">关键信息</h4>
                    <div className="dist-messages">
                      {emotionalConnections.keyMessages.map((m, i) => (
                        <div key={i} className="dist-message" style={{ animationDelay: `${i * 0.06}s` }}>
                          <Icon name="star" size={14} />
                          <span>{typeof m === 'string' ? m : m.message || m.content || JSON.stringify(m)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(!distribution.channelSuggestions?.length && !distribution.formatRecommendations?.length && !emotionalConnections?.keyMessages?.length) && (
                  <div className="empty-state"><Icon name="share" size={32} /><p>暂无传播建议</p></div>
                )}
              </div>
            ) : (
              <div className="empty-state"><Icon name="share" size={32} /><p>暂无传播建议</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PageResult({ record, onBack, onNew, onNavigate }) {
  return (
    <div className="page page-result">
      <div className="result-breadcrumb">
        <button className="breadcrumb-link" onClick={() => onNavigate('home')}>首页</button>
        <Icon name="chevron" size={12} className="breadcrumb-sep" />
        <button className="breadcrumb-link" onClick={onBack}>历史记录</button>
        <Icon name="chevron" size={12} className="breadcrumb-sep" />
        <span className="breadcrumb-current">{record.productName}</span>
      </div>
      <div className="result-header">
        <div className="result-header-left">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            <Icon name="chevron" size={14} className="icon-rotate-180" />
            返回列表
          </button>
          <div className="result-product-name">{record.productName}</div>
          <div className="result-meta">
            {new Date(record.createdAt).toLocaleDateString('zh-CN')} 创建
            {record.result?.brandStory?.wordCount > 0 && ` · ${record.result.brandStory.wordCount}字`}
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onNew}>
          <Icon name="pen" size={14} />
          新建创作
        </button>
      </div>
      <StoryViewer result={record.result} productName={record.productName} />
    </div>
  )
}

function PageHistory({ history, favorites, onToggleFavorite, onSelect, onDelete, onNavigate }) {
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    let list = history
    if (search) {
      list = list.filter(h => h.productName.toLowerCase().includes(search.toLowerCase()))
    }
    if (filter === 'favorites') {
      list = list.filter(h => favorites.includes(h.id))
    }
    return list
  }, [history, search, filter, favorites])

  const stats = useMemo(() => {
    const totalWords = history.reduce((sum, h) => sum + (h.result?.brandStory?.wordCount || 0), 0)
    return {
      total: history.length,
      totalWords,
      avgWords: history.length > 0 ? Math.round(totalWords / history.length) : 0,
      favCount: favorites.length,
    }
  }, [history, favorites])

  const handleDelete = useCallback((id) => {
    onDelete(id)
    setConfirmDelete(null)
  }, [onDelete])

  return (
    <div className="page page-history">
      {confirmDelete && (
        <ConfirmDialog
          title="删除确认"
          message="确定要删除这条创作记录吗？此操作不可撤销。"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      <div className="history-header">
        <h2 className="history-title">创作历史</h2>
      </div>

      {history.length > 0 && (
        <div className="history-stats">
          <div className="stat-card">
            <div className="stat-icon"><Icon name="book" size={18} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">创作总数</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Icon name="edit" size={18} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalWords > 1000 ? `${(stats.totalWords / 1000).toFixed(1)}k` : stats.totalWords}</div>
              <div className="stat-label">总字数</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Icon name="chart" size={18} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.avgWords}</div>
              <div className="stat-label">平均字数</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Icon name="bookmark" size={18} /></div>
            <div className="stat-info">
              <div className="stat-value">{stats.favCount}</div>
              <div className="stat-label">收藏数</div>
            </div>
          </div>
        </div>
      )}

      <div className="history-toolbar">
        <div className="history-search">
          <Icon name="target" size={14} className="search-icon" />
          <input
            className="input input-search"
            type="text"
            placeholder="搜索产品名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="history-filters">
          <button className={`filter-btn ${filter === 'all' ? 'filter-btn--active' : ''}`} onClick={() => setFilter('all')}>
            全部
          </button>
          <button className={`filter-btn ${filter === 'favorites' ? 'filter-btn--active' : ''}`} onClick={() => setFilter('favorites')}>
            <Icon name="bookmark" size={12} />
            收藏
          </button>
          {history.length > 0 && <span className="history-count">共 {filtered.length} 条</span>}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="history-list">
          {filtered.map((h, i) => (
            <div key={h.id} className="history-item" style={{ animationDelay: `${i * 0.05}s` }} onClick={() => onSelect(h)}>
              <div className="history-item-icon">
                {TEMPLATES.find(t => t.id === h.template)?.icon || '📝'}
              </div>
              <div className="history-item-body">
                <div className="history-item-name">{h.productName}</div>
                <div className="history-item-meta">
                  <span>{new Date(h.createdAt).toLocaleDateString('zh-CN')}</span>
                  <span>{new Date(h.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                  {h.result?.brandStory?.wordCount > 0 && <span>{h.result.brandStory.wordCount}字</span>}
                </div>
              </div>
              <button
                className={`icon-btn icon-btn--fav ${favorites.includes(h.id) ? 'icon-btn--fav-active' : ''}`}
                title={favorites.includes(h.id) ? '取消收藏' : '收藏'}
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(h.id) }}
              >
                <Icon name="bookmark" size={14} />
              </button>
              <button
                className="icon-btn icon-btn--danger"
                title="删除"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(h.id) }}
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="history-empty">
          <Icon name="clock" size={48} />
          <h3>{search || filter === 'favorites' ? '没有找到匹配的记录' : '暂无创作记录'}</h3>
          <p>{search || filter === 'favorites' ? '尝试其他筛选条件' : '开始你的第一次品牌故事创作'}</p>
          {!search && filter === 'all' && (
            <button className="btn btn-primary" onClick={() => onNavigate('create')}>
              <Icon name="pen" size={16} />
              开始创作
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function App() {
  const [page, setPage] = useState('home')
  const [history, setHistory] = useLocalStorage('brand-story-history', [])
  const [favorites, setFavorites] = useLocalStorage('brand-story-favorites', [])
  const [currentRecord, setCurrentRecord] = useState(null)
  const [globalToast, setGlobalToast] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('brand-story-onboarded') } catch { return true }
  })

  const showToast = useCallback((message, type = 'success') => {
    setGlobalToast({ message, type, key: Date.now() })
  }, [])

  const handleCreate = useCallback((record) => {
    setHistory(prev => [record, ...prev])
    setCurrentRecord(record)
    showToast('品牌故事创作完成！')
  }, [setHistory, showToast])

  const handleDelete = useCallback((id) => {
    setHistory(prev => prev.filter(h => h.id !== id))
    setFavorites(prev => prev.filter(f => f !== id))
    showToast('记录已删除')
  }, [setHistory, setFavorites, showToast])

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => {
      if (prev.includes(id)) {
        showToast('已取消收藏')
        return prev.filter(f => f !== id)
      }
      showToast('已收藏')
      return [...prev, id]
    })
  }, [setFavorites, showToast])

  const navigate = useCallback((target, data) => {
    if (target === 'result' && data) setCurrentRecord(data)
    setPage(target)
    window.scrollTo(0, 0)
  }, [])

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false)
    try { localStorage.setItem('brand-story-onboarded', 'true') } catch {}
  }, [])

  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'n' || e.key === 'N') { e.preventDefault(); navigate('create') }
        if (e.key === 'h' || e.key === 'H') { e.preventDefault(); navigate('history') }
      }
      if (e.key === 'Escape') {
        if (page !== 'home') navigate('home')
      }
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [navigate, page])

  return (
    <div className="app">
      {globalToast && <Toast key={globalToast.key} message={globalToast.message} type={globalToast.type} onClose={() => setGlobalToast(null)} />}
      {showOnboarding && <OnboardingGuide onClose={closeOnboarding} />}

      <nav className="nav">
        <div className="nav-inner">
          <button className="nav-brand" onClick={() => navigate('home')}>
            <div className="nav-brand-icon">
              <Icon name="bolt" size={16} />
            </div>
            <span className="nav-brand-text">StoryForge</span>
          </button>
          <div className="nav-links">
            <button className={`nav-link ${page === 'home' ? 'nav-link--active' : ''}`} onClick={() => navigate('home')}>
              <Icon name="home" size={16} />
              <span>首页</span>
            </button>
            <button className={`nav-link ${page === 'create' || page === 'result' ? 'nav-link--active' : ''}`} onClick={() => navigate('create')}>
              <Icon name="pen" size={16} />
              <span>创作</span>
            </button>
            <button className={`nav-link ${page === 'history' ? 'nav-link--active' : ''}`} onClick={() => navigate('history')}>
              <Icon name="clock" size={16} />
              <span>历史</span>
              {history.length > 0 && <span className="nav-badge">{history.length}</span>}
            </button>
          </div>
          <div className="nav-shortcuts" title="快捷键: Ctrl+N 新建, Ctrl+H 历史">
            <Icon name="lightbulb" size={14} />
          </div>
        </div>
      </nav>

      <main className="main">
        {page === 'home' && <PageHome onNavigate={navigate} historyCount={history.length} />}
        {page === 'create' && <PageCreate onCreate={handleCreate} onNavigate={navigate} />}
        {page === 'result' && currentRecord && (
          <PageResult
            record={currentRecord}
            onBack={() => navigate('history')}
            onNew={() => navigate('create')}
            onNavigate={navigate}
          />
        )}
        {page === 'history' && (
          <PageHistory
            history={history}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelect={(r) => navigate('result', r)}
            onDelete={handleDelete}
            onNavigate={navigate}
          />
        )}
      </main>

      <footer className="footer">
        <span>StoryForge · 品牌故事创作助手</span>
        <span>Powered by AI</span>
      </footer>
    </div>
  )
}

export default App