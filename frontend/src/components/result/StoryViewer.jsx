import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Icon, Toast, QualityScore } from '../common'
import { renderMarkdownContent, exportJSON, exportMarkdown } from '../../utils'

function StoryPanel({ story, emotionalConnections, quality, qualityScore, readingTime }) {
  return (
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
            {renderMarkdownContent(story.content).map((block) => {
              if (block.type === 'h2') return <h2 key={block.key} className="story-h2">{block.text}</h2>
              if (block.type === 'h3') return <h3 key={block.key} className="story-h3">{block.text}</h3>
              if (block.type === 'h4') return <h4 key={block.key} className="story-h4">{block.text}</h4>
              if (block.type === 'li') return <li key={block.key} className="story-li">{block.text}</li>
              if (block.type === 'hr') return <hr key={block.key} className="story-hr" />
              if (block.type === 'empty') return null
              if (block.type === 'p-bold') return <p key={block.key} className="story-p">{block.parts.map(p => p.bold ? <strong key={p.key}>{p.text}</strong> : p.text)}</p>
              return <p key={block.key} className="story-p">{block.text}</p>
            })}
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
  )
}

function ValuePanel({ value }) {
  return (
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
              <h4 className="value-section-title"><Icon name="star" size={14} className="section-title-icon" />独特卖点</h4>
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
              <h4 className="value-section-title"><Icon name="bolt" size={14} className="section-title-icon" />核心功能价值</h4>
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
              <h4 className="value-section-title"><Icon name="chart" size={14} className="section-title-icon" />用户收益矩阵</h4>
              <div className="benefit-matrix">
                {value.keyBenefits.functional?.length > 0 && (
                  <div className="benefit-column">
                    <div className="benefit-column-header benefit-column-header--func"><Icon name="bolt" size={14} />功能收益</div>
                    <div className="benefit-items">
                      {value.keyBenefits.functional.map((b, i) => (
                        <div key={i} className="benefit-item benefit-item--func" style={{ animationDelay: `${i * 0.06}s` }}>
                          <Icon name="check" size={12} /><span>{typeof b === 'string' ? b : b.benefit || b.description || JSON.stringify(b)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {value.keyBenefits.emotional?.length > 0 && (
                  <div className="benefit-column">
                    <div className="benefit-column-header benefit-column-header--emo"><Icon name="heart" size={14} />情感收益</div>
                    <div className="benefit-items">
                      {value.keyBenefits.emotional.map((b, i) => (
                        <div key={i} className="benefit-item benefit-item--emo" style={{ animationDelay: `${i * 0.06}s` }}>
                          <Icon name="heart" size={12} /><span>{typeof b === 'string' ? b : b.benefit || b.description || JSON.stringify(b)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {value.keyBenefits.social?.length > 0 && (
                  <div className="benefit-column">
                    <div className="benefit-column-header benefit-column-header--soc"><Icon name="share" size={14} />社交收益</div>
                    <div className="benefit-items">
                      {value.keyBenefits.social.map((b, i) => (
                        <div key={i} className="benefit-item benefit-item--soc" style={{ animationDelay: `${i * 0.06}s` }}>
                          <Icon name="share" size={12} /><span>{typeof b === 'string' ? b : b.benefit || b.description || JSON.stringify(b)}</span>
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
              <h4 className="value-section-title"><Icon name="shield" size={14} className="section-title-icon" />痛点解决方案</h4>
              <div className="pain-solution-grid">
                {value.painSolutions.map((ps, i) => (
                  <div key={i} className="pain-solution-card" style={{ animationDelay: `${i * 0.08}s` }}>
                    <div className="ps-pain">
                      <span className="ps-pain-dot" />
                      <span className="ps-pain-text">{ps.pain}</span>
                      {ps.intensity && <span className={`ps-intensity ps-intensity--${ps.intensity === '高' ? 'high' : ps.intensity === '低' ? 'low' : 'mid'}`}>{ps.intensity}</span>}
                    </div>
                    <div className="ps-arrow"><Icon name="arrow" size={14} /></div>
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
  )
}

function ProfilePanel({ profile }) {
  return (
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
                {profile.demographics.ageRange && <div className="demo-item" style={{ animationDelay: '0s' }}><div className="demo-icon"><Icon name="user" size={16} /></div><div className="demo-content"><div className="demo-label">年龄段</div><div className="demo-value">{profile.demographics.ageRange}</div></div></div>}
                {profile.demographics.incomeRange && <div className="demo-item" style={{ animationDelay: '0.05s' }}><div className="demo-icon"><Icon name="chart" size={16} /></div><div className="demo-content"><div className="demo-label">收入水平</div><div className="demo-value">{profile.demographics.incomeRange}</div></div></div>}
                {profile.demographics.education && <div className="demo-item" style={{ animationDelay: '0.1s' }}><div className="demo-icon"><Icon name="book" size={16} /></div><div className="demo-content"><div className="demo-label">教育程度</div><div className="demo-value">{profile.demographics.education}</div></div></div>}
                {profile.demographics.location && <div className="demo-item" style={{ animationDelay: '0.15s' }}><div className="demo-icon"><Icon name="home" size={16} /></div><div className="demo-content"><div className="demo-label">所在区域</div><div className="demo-value">{profile.demographics.location}</div></div></div>}
                {profile.demographics.occupation && <div className="demo-item" style={{ animationDelay: '0.2s' }}><div className="demo-icon"><Icon name="edit" size={16} /></div><div className="demo-content"><div className="demo-label">职业身份</div><div className="demo-value">{profile.demographics.occupation}</div></div></div>}
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
                    <div className="motivation-trigger"><Icon name="bolt" size={14} /><span>{typeof m === 'string' ? m : m.trigger}</span></div>
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
                {profile.behaviorPatterns.informationGathering && <div className="behavior-item" style={{ animationDelay: '0s' }}><div className="behavior-label">信息获取</div><div className="behavior-value">{profile.behaviorPatterns.informationGathering}</div></div>}
                {profile.behaviorPatterns.decisionFactors && <div className="behavior-item" style={{ animationDelay: '0.05s' }}><div className="behavior-label">决策因素</div><div className="behavior-value">{profile.behaviorPatterns.decisionFactors}</div></div>}
                {profile.behaviorPatterns.usageContext && <div className="behavior-item" style={{ animationDelay: '0.1s' }}><div className="behavior-label">使用场景</div><div className="behavior-value">{profile.behaviorPatterns.usageContext}</div></div>}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state"><Icon name="user" size={32} /><p>暂无用户画像内容</p></div>
      )}
    </div>
  )
}

function ScenarioPanel({ scenarios }) {
  return (
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
                        <div className="emotion-dot" /><span className="emotion-label">{e}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {s.expectedEffect && <div className="scenario-effect"><Icon name="check" size={14} /><span>预期效果：{s.expectedEffect}</span></div>}
              {s.productRole && <div className="scenario-product-role"><Icon name="info" size={14} /><span>产品角色：{s.productRole}</span></div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><Icon name="film" size={32} /><p>暂无场景内容</p></div>
      )}
    </div>
  )
}

function DistributionPanel({ distribution, emotionalConnections }) {
  return (
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
                    <Icon name="star" size={14} /><span>{typeof m === 'string' ? m : m.message || m.content || JSON.stringify(m)}</span>
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
  )
}

export function StoryViewer({ result, productName }) {
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

  const handleExportJSON = useCallback(() => {
    exportJSON(result, `${productName}-品牌故事`)
    setToast('已导出JSON文件')
  }, [result, productName])

  const handleExportMarkdown = useCallback(() => {
    const content = result?.brandStory?.content || ''
    if (!content) { setToast('暂无内容可导出'); return }
    exportMarkdown(content, `${productName}-品牌故事`)
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
            <button key={t.id} className={`viewer-tab ${activeTab === t.id ? 'viewer-tab--active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <Icon name={t.icon} size={15} />{t.label}
            </button>
          ))}
        </div>
        <div className="viewer-actions">
          <button className="icon-btn" title="分享" onClick={handleShare}><Icon name="share" size={16} /></button>
          <button className="icon-btn" title="复制内容" onClick={() => copyText(story?.content || '')}><Icon name="copy" size={16} /></button>
          <button className="icon-btn" title="导出Markdown" onClick={handleExportMarkdown}><Icon name="file" size={16} /></button>
          <button className="icon-btn" title="导出JSON" onClick={handleExportJSON}><Icon name="download" size={16} /></button>
          <button className="icon-btn" title="打印" onClick={handlePrint}><Icon name="printer" size={16} /></button>
        </div>
      </div>
      <div className="viewer-content" ref={contentRef}>
        {activeTab === 'story' && <StoryPanel story={story} emotionalConnections={emotionalConnections} quality={quality} qualityScore={qualityScore} readingTime={readingTime} />}
        {activeTab === 'value' && <ValuePanel value={value} />}
        {activeTab === 'profile' && <ProfilePanel profile={profile} />}
        {activeTab === 'scenarios' && <ScenarioPanel scenarios={scenarios} />}
        {activeTab === 'distribution' && <DistributionPanel distribution={distribution} emotionalConnections={emotionalConnections} />}
      </div>
    </div>
  )
}
