import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Icon, QualityScore } from '../common'
import { renderMarkdownContent, exportJSON, exportMarkdown, buildFullMarkdown, exportPDF } from '../../utils'
import * as api from '../../services/api'

const SECTIONS = [
  { key: 'productValue', label: '产品价值', icon: 'star' },
  { key: 'userProfile', label: '用户画像', icon: 'user' },
  { key: 'scenarios', label: '使用场景', icon: 'eye' },
  { key: 'brandStory', label: '品牌故事', icon: 'book' },
]

function EditableText({ value, onChange, multiline, className }) {
  if (multiline) {
    return (
      <textarea
        className={`edit-textarea ${className || ''}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  return (
    <input
      className={`edit-input ${className || ''}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function RatingStars({ rating, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="rating-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className={`rating-star ${(hover || rating) >= n ? 'rating-star--active' : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function VersionHistory({ storyId, currentVersion, onRestore }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState([])

  useEffect(() => {
    let mounted = true
    api.getStoryVersions(storyId).then((data) => {
      if (mounted) {
        setVersions(data.versions || [])
        setLoading(false)
      }
    }).catch(() => setLoading(false))
    return () => { mounted = false }
  }, [storyId])

  const toggleSelect = (v) => {
    setSelectedVersions((prev) => {
      if (prev.includes(v.id)) return prev.filter((id) => id !== v.id)
      if (prev.length >= 2) return [prev[1], v.id]
      return [...prev, v.id]
    })
  }

  const changeTypeLabel = (type) => {
    const map = { create: '初始创作', edit: '内容编辑', regenerate: '重新生成', refine: '优化改进' }
    return map[type] || type
  }

  const changeTypeClass = (type) => {
    const map = { create: 'vtype--create', edit: 'vtype--edit', regenerate: 'vtype--regen', refine: 'vtype--refine' }
    return map[type] || ''
  }

  if (loading) return <div className="version-loading">加载版本历史...</div>

  return (
    <div className="version-history">
      <div className="version-header">
        <h4 className="version-title"><Icon name="clock" size={14} /> 版本历史</h4>
        {versions.length > 1 && (
          <button
            className={`btn btn-xs ${compareMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setCompareMode(!compareMode); setSelectedVersions([]) }}
          >
            <Icon name="eye" size={12} /> {compareMode ? '退出对比' : '版本对比'}
          </button>
        )}
      </div>
      <div className="version-list">
        {versions.map((v) => (
          <div
            key={v.id}
            className={`version-item ${v.version === currentVersion ? 'version-item--current' : ''} ${selectedVersions.includes(v.id) ? 'version-item--selected' : ''}`}
            onClick={() => compareMode ? toggleSelect(v) : null}
          >
            <div className="version-item-left">
              <span className="version-number">v{v.version}</span>
              <span className={`version-type ${changeTypeClass(v.changeType)}`}>{changeTypeLabel(v.changeType)}</span>
              {v.version === currentVersion && <span className="version-current-badge">当前</span>}
            </div>
            <div className="version-item-right">
              <span className="version-summary">{v.changeSummary || '-'}</span>
              <span className="version-time">{new Date(v.createdAt).toLocaleString('zh-CN')}</span>
            </div>
            {!compareMode && v.version !== currentVersion && (
              <button className="btn btn-xs btn-ghost version-restore" onClick={(e) => { e.stopPropagation(); onRestore(v) }}>
                恢复
              </button>
            )}
          </div>
        ))}
      </div>
      {compareMode && selectedVersions.length === 2 && (
        <VersionCompare
          storyId={storyId}
          v1={versions.find((v) => v.id === selectedVersions[0])}
          v2={versions.find((v) => v.id === selectedVersions[1])}
        />
      )}
    </div>
  )
}

function VersionCompare({ storyId, v1, v2 }) {
  const [data1, setData1] = useState(null)
  const [data2, setData2] = useState(null)

  useEffect(() => {
    api.getStoryVersion(storyId, v1.version).then(setData1).catch(() => {})
    api.getStoryVersion(storyId, v2.version).then(setData2).catch(() => {})
  }, [storyId, v1.version, v2.version])

  if (!data1 || !data2) return <div className="compare-loading">加载对比数据...</div>

  return (
    <div className="version-compare">
      <div className="compare-col">
        <div className="compare-col-header">v{v1.version} - {v1.changeSummary}</div>
        <pre className="compare-content">{JSON.stringify(data1.result, null, 2).substring(0, 2000)}</pre>
      </div>
      <div className="compare-col">
        <div className="compare-col-header">v{v2.version} - {v2.changeSummary}</div>
        <pre className="compare-content">{JSON.stringify(data2.result, null, 2).substring(0, 2000)}</pre>
      </div>
    </div>
  )
}

function RegenerateModal({ section, onClose, onConfirm }) {
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onConfirm(instruction)
      onClose()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>重新生成: {section.label}</h3>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="modal-label">优化指令（可选）</label>
          <textarea
            className="edit-textarea"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={`描述你希望如何改进${section.label}部分...`}
            rows={3}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>取消</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading}>
            {loading ? '生成中...' : '确认重新生成'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RefineModal({ onClose, onConfirm }) {
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!instruction.trim()) return
    setLoading(true)
    try {
      await onConfirm(instruction)
      onClose()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>优化改进</h3>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="modal-label">优化指令</label>
          <textarea
            className="edit-textarea"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="描述你希望如何优化内容，例如：让品牌故事更有感染力、增加更多数据支撑..."
            rows={4}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>取消</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading || !instruction.trim()}>
            {loading ? '优化中...' : '开始优化'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CHANNELS = [
  { id: 'wechat', name: '微信公众号', icon: '📱', format: '长图文', length: '1200-2000字', style: '深度叙事' },
  { id: 'xiaohongshu', name: '小红书', icon: '📕', format: '图文笔记', length: '300-800字', style: '场景种草' },
  { id: 'douyin', name: '抖音', icon: '🎵', format: '短视频脚本', length: '200-500字', style: '快节奏剧情' },
  { id: 'weibo', name: '微博', icon: '💬', format: '短图文', length: '100-300字', style: '话题互动' },
  { id: 'zhihu', name: '知乎', icon: '💡', format: '问答体', length: '1500-3000字', style: '专业分析' },
]

function ChannelAdaptModal({ result, productName, onClose, showToast }) {
  const [activeChannel, setActiveChannel] = useState('wechat')
  const [copied, setCopied] = useState(false)

  const adaptContent = (channelId, result, productName) => {
    const story = result?.brandStory?.content || ''
    const value = result?.productValue
    const profile = result?.userProfile
    const scenarios = result?.scenarios || []

    switch (channelId) {
      case 'wechat':
        return [
          `# ${productName}：${value?.coreValue || '让生活更美好'}`,
          '',
          value?.extended || '',
          '',
          '---',
          '',
          story,
          '',
          '---',
          '',
          scenarios.length > 0 ? `💡 **使用场景**：${scenarios[0]?.title || ''}` : '',
          scenarios[0]?.plot?.climax ? `→ ${scenarios[0].plot.climax}` : '',
        ].filter(Boolean).join('\n')

      case 'xiaohongshu':
        return [
          `✨ ${productName} | ${value?.coreValue || '好物推荐'}`,
          '',
          scenarios.length > 0 ? `📍 ${scenarios[0]?.title || ''}` : '',
          scenarios[0]?.character?.name ? `👤 ${scenarios[0].character.name}的真实体验` : '',
          '',
          (story || '').split('\n').filter(l => l.trim()).slice(0, 5).join('\n'),
          '',
          '---',
          value?.differentiation?.uniquePoints?.length
            ? '🌟 亮点：' + value.differentiation.uniquePoints.slice(0, 3).map(p => typeof p === 'string' ? p : p.point || p.description).join(' | ')
            : '',
          '',
          `#${productName} #好物推荐 #种草`,
        ].filter(Boolean).join('\n')

      case 'douyin':
        return [
          `【${productName}】短视频脚本`,
          '',
          scenarios.length > 0 ? `🎬 场景：${scenarios[0]?.title || ''}` : '',
          '',
          '📌 开头（3秒）',
          scenarios[0]?.plot?.conflict || '直击痛点，抓住注意力',
          '',
          '📌 产品展示（5秒）',
          scenarios[0]?.plot?.climax || `展示${productName}如何解决问题`,
          '',
          '📌 效果呈现（5秒）',
          scenarios[0]?.plot?.resolution || '展示使用后的改变',
          '',
          '📌 引导行动（2秒）',
          `点击了解更多 → ${productName}`,
        ].filter(Boolean).join('\n')

      case 'weibo':
        return [
          `【${productName}】${value?.coreValue || ''}`,
          '',
          (story || '').split('\n').filter(l => l.trim()).slice(0, 3).join(' '),
          '',
          value?.differentiation?.uniquePoints?.slice(0, 2).map(p =>
            `✅ ${typeof p === 'string' ? p : p.point || p.description}`
          ).join('\n') || '',
          '',
          `#${productName}# #品牌故事#`,
        ].filter(Boolean).join('\n')

      case 'zhihu':
        return [
          `为什么${profile?.persona?.name || '越来越多人'}选择${productName}？`,
          '',
          `作为${profile?.persona?.archetype || '用户'}，我来分享真实体验。`,
          '',
          '**核心价值**',
          value?.coreValue || '',
          value?.extended || '',
          '',
          '**差异化优势**',
          ...(value?.differentiation?.uniquePoints || []).map(p =>
            `- ${typeof p === 'string' ? p : p.point || p.description}`
          ),
          '',
          '**实际使用场景**',
          ...scenarios.slice(0, 2).map(s => `- ${s.title}：${s.plot?.resolution || s.expectedEffect || ''}`),
          '',
          '**总结**',
          story.split('\n').filter(l => l.trim()).slice(-3).join('\n'),
        ].filter(Boolean).join('\n')

      default:
        return story
    }
  }

  const handleCopy = () => {
    const content = adaptContent(activeChannel, result, productName)
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      showToast?.('已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => showToast?.('复制失败', 'error'))
  }

  const activeCh = CHANNELS.find(c => c.id === activeChannel)
  const adaptedContent = adaptContent(activeChannel, result, productName)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>多渠道内容适配</h3>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="channel-tabs">
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                className={`channel-tab ${activeChannel === ch.id ? 'channel-tab--active' : ''}`}
                onClick={() => setActiveChannel(ch.id)}
              >
                <span className="channel-tab-icon">{ch.icon}</span>
                <span className="channel-tab-name">{ch.name}</span>
              </button>
            ))}
          </div>
          {activeCh && (
            <div className="channel-meta">
              <span className="channel-meta-item">格式: {activeCh.format}</span>
              <span className="channel-meta-item">建议长度: {activeCh.length}</span>
              <span className="channel-meta-item">风格: {activeCh.style}</span>
            </div>
          )}
          <div className="channel-preview">
            <pre className="channel-preview-content">{adaptedContent}</pre>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>关闭</button>
          <button className="btn btn-primary btn-sm" onClick={handleCopy}>
            {copied ? '✓ 已复制' : '复制内容'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StoryPanel({ story, emotionalConnections, quality, qualityScore, contentScore, readingTime, editing, editedResult, onEditField }) {
  if (!story && !editing) return <div className="empty-state"><Icon name="book" size={32} /><p>暂无品牌故事内容</p></div>

  if (editing) {
    return (
      <div className="viewer-panel">
        <div className="edit-section">
          <label className="edit-label">故事内容</label>
          <textarea
            className="edit-textarea edit-textarea--story"
            value={editedResult?.brandStory?.content || ''}
            onChange={(e) => onEditField('brandStory.content', e.target.value)}
            rows={15}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="viewer-panel">
      <div className="story-meta">
        {story.wordCount > 0 && <span className="meta-chip"><Icon name="bolt" size={12} /> {story.wordCount} 字</span>}
        <span className="meta-chip"><Icon name="clock" size={12} /> 约{readingTime}分钟阅读</span>
        {story.emotionalResonance?.primary && <span className="meta-chip meta-chip--accent"><Icon name="heart" size={12} /> {story.emotionalResonance.primary}</span>}
        {quality?.passed && <span className="meta-chip meta-chip--success"><Icon name="shield" size={12} /> 质量验证通过</span>}
      </div>
      {qualityScore > 0 && (
        <div className="story-quality">
          <QualityScore score={qualityScore} label="内容质量" grade={contentScore?.grade} />
          <div className="story-quality-details">
            {contentScore?.dimensions ? Object.entries(contentScore.dimensions).map(([key, dim]) => (
              <div key={key} className="quality-detail">
                <span className="quality-detail-label">{dim.label}</span>
                <div className="quality-detail-bar">
                  <div
                    className={`quality-detail-fill ${key === 'emotional' ? 'quality-detail-fill--accent' : key === 'brand' ? 'quality-detail-fill--primary' : ''}`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
                <span className="quality-detail-value">{dim.score}</span>
              </div>
            )) : (
              <>
                <div className="quality-detail">
                  <span className="quality-detail-label">故事完整性</span>
                  <div className="quality-detail-bar"><div className="quality-detail-fill" style={{ width: `${Math.min(100, qualityScore + 5)}%` }} /></div>
                </div>
                <div className="quality-detail">
                  <span className="quality-detail-label">情感共鸣度</span>
                  <div className="quality-detail-bar"><div className="quality-detail-fill quality-detail-fill--accent" style={{ width: `${Math.min(100, qualityScore - 5)}%` }} /></div>
                </div>
                <div className="quality-detail">
                  <span className="quality-detail-label">品牌一致性</span>
                  <div className="quality-detail-bar"><div className="quality-detail-fill quality-detail-fill--primary" style={{ width: `${Math.min(100, qualityScore)}%` }} /></div>
                </div>
              </>
            )}
          </div>
          {contentScore?.suggestions?.length > 0 && (
            <div className="quality-suggestions">
              {contentScore.suggestions.map((s, i) => (
                <div key={i} className="quality-suggestion">
                  <span className="quality-suggestion-dim">{s.dimension}</span>
                  <span className="quality-suggestion-tip">{s.tip}</span>
                </div>
              ))}
            </div>
          )}
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
    </div>
  )
}

function ValuePanel({ value, editing, editedResult, onEditField }) {
  if (!value && !editing) return <div className="empty-state"><Icon name="star" size={32} /><p>暂无产品价值内容</p></div>

  if (editing) {
    const ev = editedResult?.productValue || {}
    return (
      <div className="viewer-panel">
        <div className="edit-section">
          <label className="edit-label">核心价值主张</label>
          <input className="edit-input" value={ev.coreValue || ''} onChange={(e) => onEditField('productValue.coreValue', e.target.value)} />
        </div>
        <div className="edit-section">
          <label className="edit-label">扩展描述</label>
          <textarea className="edit-textarea" value={ev.extended || ''} onChange={(e) => onEditField('productValue.extended', e.target.value)} rows={3} />
        </div>
        <div className="edit-section">
          <label className="edit-label">竞争优势</label>
          <input className="edit-input" value={ev.differentiation?.competitiveAdvantage || ''} onChange={(e) => onEditField('productValue.differentiation.competitiveAdvantage', e.target.value)} />
        </div>
        <div className="edit-section">
          <label className="edit-label">市场定位</label>
          <input className="edit-input" value={ev.differentiation?.marketPosition || ''} onChange={(e) => onEditField('productValue.differentiation.marketPosition', e.target.value)} />
        </div>
      </div>
    )
  }

  return (
    <div className="viewer-panel">
      <div className="value-layout">
        <div className="value-hero-block">
          <div className="value-hero-label">核心价值主张</div>
          <div className="value-hero-text">{value.coreValue || ''}</div>
          {value.extended && <div className="value-hero-sub">{value.extended}</div>}
          {value.differentiation?.marketPosition && (
            <div className="value-hero-position"><Icon name="target" size={14} /><span>{value.differentiation.marketPosition}</span></div>
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
    </div>
  )
}

function ProfilePanel({ profile, editing, editedResult, onEditField }) {
  if (!profile && !editing) return <div className="empty-state"><Icon name="user" size={32} /><p>暂无用户画像内容</p></div>

  if (editing) {
    const ep = editedResult?.userProfile || {}
    return (
      <div className="viewer-panel">
        <div className="edit-section">
          <label className="edit-label">用户名称</label>
          <input className="edit-input" value={ep.persona?.name || ''} onChange={(e) => onEditField('userProfile.persona.name', e.target.value)} />
        </div>
        <div className="edit-section">
          <label className="edit-label">用户原型</label>
          <input className="edit-input" value={ep.persona?.archetype || ''} onChange={(e) => onEditField('userProfile.persona.archetype', e.target.value)} />
        </div>
        <div className="edit-section">
          <label className="edit-label">用户描述</label>
          <textarea className="edit-textarea" value={ep.persona?.description || ''} onChange={(e) => onEditField('userProfile.persona.description', e.target.value)} rows={3} />
        </div>
        <div className="edit-section">
          <label className="edit-label">代表语录</label>
          <input className="edit-input" value={ep.persona?.quote || ''} onChange={(e) => onEditField('userProfile.persona.quote', e.target.value)} />
        </div>
      </div>
    )
  }

  return (
    <div className="viewer-panel">
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
    </div>
  )
}

function ScenarioPanel({ scenarios, editing, editedResult, onEditField }) {
  if ((!scenarios || scenarios.length === 0) && !editing) return <div className="empty-state"><Icon name="eye" size={32} /><p>暂无使用场景内容</p></div>

  if (editing) {
    const es = editedResult?.scenarios || []
    return (
      <div className="viewer-panel">
        {es.map((s, i) => (
          <div key={i} className="edit-section">
            <label className="edit-label">场景 {i + 1} 标题</label>
            <input className="edit-input" value={s.title || ''} onChange={(e) => onEditField(`scenarios.${i}.title`, e.target.value)} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="viewer-panel">
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
                {s.operationFlow.map((step, j) => (
                  <div key={j} className="flow-step">
                    <div className="flow-step-num">{step.step || j + 1}</div>
                    <div className="flow-step-body">
                      <div className="flow-step-phase">{step.phase}</div>
                      <div className="flow-step-action">{step.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {s.expectedEffect && <div className="scenario-effect"><Icon name="chart" size={14} /><span>{s.expectedEffect}</span></div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function StoryViewer({ result, productName, storyId, rating, currentVersion, onResultUpdate, onRatingChange, showToast }) {
  const [activeTab, setActiveTab] = useState('productValue')
  const [editing, setEditing] = useState(false)
  const [editedResult, setEditedResult] = useState(null)
  const [showVersions, setShowVersions] = useState(false)
  const [regenModal, setRegenModal] = useState(null)
  const [refineModal, setRefineModal] = useState(false)
  const [channelModal, setChannelModal] = useState(false)
  const [regenLoading, setRegenLoading] = useState(false)
  const saveTimerRef = useRef(null)

  const tabs = [
    { key: 'productValue', label: '产品价值', icon: 'star' },
    { key: 'userProfile', label: '用户画像', icon: 'user' },
    { key: 'scenarios', label: '使用场景', icon: 'eye' },
    { key: 'brandStory', label: '品牌故事', icon: 'book' },
  ]

  const story = result?.brandStory
  const value = result?.productValue
  const profile = result?.userProfile
  const scenarios = result?.scenarios || []
  const emotionalConnections = result?.emotionalConnections
  const quality = result?.quality
  const contentScore = result?.contentScore
  const qualityScore = contentScore?.total || quality?.score || 0
  const readingTime = Math.max(1, Math.ceil((story?.wordCount || 0) / 400))

  const handleEditField = useCallback((path, value) => {
    setEditedResult((prev) => {
      const next = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {}
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = value
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (!storyId || !editedResult) return
    try {
      const updated = await api.updateStoryContent(storyId, editedResult)
      onResultUpdate?.(updated)
      showToast?.('内容已保存')
    } catch (err) {
      showToast?.('保存失败: ' + err.message, 'error')
    }
  }, [storyId, editedResult, onResultUpdate, showToast])

  const handleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(handleSave, 2000)
  }, [handleSave])

  useEffect(() => {
    if (editing && editedResult) handleAutoSave()
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [editedResult, editing, handleAutoSave])

  const startEditing = () => {
    setEditedResult(JSON.parse(JSON.stringify(result)))
    setEditing(true)
  }

  const stopEditing = () => {
    setEditing(false)
    setEditedResult(null)
  }

  const handleRegenerate = async (section, instruction) => {
    if (!storyId) return
    setRegenLoading(true)
    try {
      const updated = await api.regenerateSection(storyId, section.key, instruction)
      onResultUpdate?.(updated)
      showToast?.(`${section.label}已重新生成`)
    } catch (err) {
      showToast?.('重新生成失败: ' + err.message, 'error')
    } finally {
      setRegenLoading(false)
    }
  }

  const handleRefine = async (instruction) => {
    if (!storyId) return
    try {
      const updated = await api.refineStory(storyId, instruction)
      onResultUpdate?.(updated)
      showToast?.('内容优化完成')
    } catch (err) {
      showToast?.('优化失败: ' + err.message, 'error')
    }
  }

  const handleRestore = async (version) => {
    if (!storyId) return
    try {
      const versionData = await api.getStoryVersion(storyId, version.version)
      const updated = await api.updateStoryContent(storyId, versionData.result)
      onResultUpdate?.(updated)
      showToast?.(`已恢复到 v${version.version}`)
    } catch (err) {
      showToast?.('恢复失败: ' + err.message, 'error')
    }
  }

  const handleRating = async (newRating) => {
    if (!storyId) return
    try {
      await api.updateStoryRating(storyId, newRating)
      onRatingChange?.(newRating)
      showToast?.('评分已更新')
    } catch (err) {
      showToast?.('评分失败: ' + err.message, 'error')
    }
  }

  const handleExportJSON = () => {
    exportJSON(result, `${productName}_品牌文档`)
  }

  const handleExportMD = () => {
    const md = buildFullMarkdown(result, productName)
    if (md) exportMarkdown(md, `${productName}_品牌文档`)
  }

  const handleExportPDF = () => {
    exportPDF(productName)
  }

  const handleCopyAll = () => {
    const text = [
      `# ${productName} 品牌文档`,
      '',
      '## 产品价值',
      result?.productValue?.coreValue || '',
      result?.productValue?.extended || '',
      '',
      '## 用户画像',
      result?.userProfile?.persona?.description || '',
      '',
      '## 品牌故事',
      result?.brandStory?.content || '',
    ].join('\n')
    navigator.clipboard.writeText(text).then(() => showToast?.('已复制到剪贴板')).catch(() => showToast?.('复制失败', 'error'))
  }

  const activeSection = SECTIONS.find((s) => s.key === activeTab)

  return (
    <div className="story-viewer">
      <div className="viewer-toolbar">
        <div className="viewer-toolbar-left">
          <div className="viewer-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`viewer-tab ${activeTab === tab.key ? 'viewer-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon name={tab.icon} size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="viewer-toolbar-right">
          <RatingStars rating={rating || 0} onChange={handleRating} />
          <div className="toolbar-divider" />
          {editing ? (
            <>
              <button className="btn btn-primary btn-xs" onClick={handleSave}><Icon name="check" size={12} /> 保存</button>
              <button className="btn btn-ghost btn-xs" onClick={stopEditing}>取消</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-xs" onClick={startEditing} title="编辑"><Icon name="edit" size={12} /> 编辑</button>
              <button className="btn btn-ghost btn-xs" onClick={() => setRegenModal(activeSection)} title="重新生成当前模块" disabled={regenLoading}>
                <Icon name="bolt" size={12} /> {regenLoading ? '生成中' : '重新生成'}
              </button>
              <button className="btn btn-ghost btn-xs" onClick={() => setRefineModal(true)} title="AI优化"><Icon name="star" size={12} /> 优化</button>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowVersions(!showVersions)} title="版本历史">
                <Icon name="clock" size={12} /> 版本{currentVersion ? `v${currentVersion}` : ''}
              </button>
              <div className="toolbar-divider" />
              <button className="btn btn-ghost btn-xs" onClick={handleCopyAll} title="复制全文"><Icon name="share" size={12} /> 复制</button>
              <button className="btn btn-ghost btn-xs" onClick={() => setChannelModal(true)} title="多渠道适配"><Icon name="share" size={12} /> 渠道适配</button>
              <button className="btn btn-ghost btn-xs" onClick={handleExportPDF} title="导出PDF"><Icon name="download" size={12} /> PDF</button>
              <button className="btn btn-ghost btn-xs" onClick={handleExportJSON} title="导出JSON"><Icon name="download" size={12} /> JSON</button>
              <button className="btn btn-ghost btn-xs" onClick={handleExportMD} title="导出Markdown"><Icon name="download" size={12} /> MD</button>
            </>
          )}
        </div>
      </div>

      {showVersions && storyId && (
        <VersionHistory storyId={storyId} currentVersion={currentVersion} onRestore={handleRestore} />
      )}

      <div className="viewer-content">
        {activeTab === 'productValue' && (
          <ValuePanel value={value} editing={editing} editedResult={editedResult} onEditField={handleEditField} />
        )}
        {activeTab === 'userProfile' && (
          <ProfilePanel profile={profile} editing={editing} editedResult={editedResult} onEditField={handleEditField} />
        )}
        {activeTab === 'scenarios' && (
          <ScenarioPanel scenarios={scenarios} editing={editing} editedResult={editedResult} onEditField={handleEditField} />
        )}
        {activeTab === 'brandStory' && (
          <StoryPanel
            story={story}
            emotionalConnections={emotionalConnections}
            quality={quality}
            qualityScore={qualityScore}
            contentScore={contentScore}
            readingTime={readingTime}
            editing={editing}
            editedResult={editedResult}
            onEditField={handleEditField}
          />
        )}
      </div>

      {regenModal && (
        <RegenerateModal
          section={regenModal}
          onClose={() => setRegenModal(null)}
          onConfirm={(instruction) => handleRegenerate(regenModal, instruction)}
        />
      )}

      {refineModal && (
        <RefineModal
          onClose={() => setRefineModal(false)}
          onConfirm={handleRefine}
        />
      )}

      {channelModal && (
        <ChannelAdaptModal
          result={result}
          productName={productName}
          onClose={() => setChannelModal(false)}
          showToast={showToast}
        />
      )}
    </div>
  )
}
