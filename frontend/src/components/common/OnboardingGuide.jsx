import { useState } from 'react'
import { Icon } from './Icon'

export function OnboardingGuide({ onClose }) {
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
