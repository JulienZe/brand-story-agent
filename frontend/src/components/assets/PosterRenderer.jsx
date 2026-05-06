import { useState, useRef, useCallback, useEffect } from 'react'
import { Icon } from '../common'
import * as api from '../../services/api'

const POSTER_TEMPLATES = [
  {
    id: 'modern-minimal',
    name: '现代简约',
    desc: '简洁大气的品牌海报',
    layout: 'center',
    bgStyle: 'gradient',
    titleSize: 48,
    bodySize: 16,
    padding: 60,
  },
  {
    id: 'editorial',
    name: '杂志编辑',
    desc: '杂志风格的排版设计',
    layout: 'left',
    bgStyle: 'solid',
    titleSize: 42,
    bodySize: 15,
    padding: 80,
  },
  {
    id: 'bold-impact',
    name: '大胆冲击',
    desc: '视觉冲击力强的海报',
    layout: 'center',
    bgStyle: 'dark',
    titleSize: 56,
    bodySize: 18,
    padding: 50,
  },
  {
    id: 'elegant-soft',
    name: '优雅柔和',
    desc: '柔和色调的优雅设计',
    layout: 'center',
    bgStyle: 'soft',
    titleSize: 44,
    bodySize: 15,
    padding: 70,
  },
]

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 27, g: 67, b: 50 }
}

function renderPosterToCanvas(canvas, config) {
  const ctx = canvas.getContext('2d')
  const { width, height, template, colorPalette, backgroundImage } = config

  canvas.width = width
  canvas.height = height

  const primary = colorPalette?.[0] || '#1B4332'
  const secondary = colorPalette?.[1] || '#2D6A4F'
  const accent = colorPalette?.[2] || '#BC8A3F'
  const primaryRgb = hexToRgb(primary)

  if (backgroundImage) {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      ctx.fillStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.7)`
      ctx.fillRect(0, 0, width, height)
      renderTextContent(ctx, config, primary, accent, width, height)
    }
    img.src = backgroundImage
  } else {
    switch (template.bgStyle) {
      case 'gradient': {
        const grad = ctx.createLinearGradient(0, 0, width, height)
        grad.addColorStop(0, primary)
        grad.addColorStop(1, secondary)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, width, height)
        break
      }
      case 'solid':
        ctx.fillStyle = primary
        ctx.fillRect(0, 0, width, height)
        break
      case 'dark': {
        const darkGrad = ctx.createLinearGradient(0, 0, 0, height)
        darkGrad.addColorStop(0, '#0D1117')
        darkGrad.addColorStop(1, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`)
        ctx.fillStyle = darkGrad
        ctx.fillRect(0, 0, width, height)
        break
      }
      case 'soft': {
        const softGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7)
        softGrad.addColorStop(0, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)`)
        softGrad.addColorStop(1, '#FFFEF9')
        ctx.fillStyle = softGrad
        ctx.fillRect(0, 0, width, height)
        break
      }
      default:
        ctx.fillStyle = primary
        ctx.fillRect(0, 0, width, height)
    }

    renderDecorations(ctx, template, primaryRgb, accent, width, height)
    renderTextContent(ctx, config, primary, accent, width, height)
  }
}

function renderDecorations(ctx, template, primaryRgb, accent, width, height) {
  ctx.save()
  ctx.globalAlpha = 0.08

  switch (template.id) {
    case 'modern-minimal':
      ctx.beginPath()
      ctx.arc(width * 0.8, height * 0.2, 200, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(width * 0.15, height * 0.85, 120, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'editorial':
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.moveTo(80 + i * 20, 0)
        ctx.lineTo(80 + i * 20, height)
        ctx.stroke()
      }
      break
    case 'bold-impact':
      ctx.beginPath()
      ctx.arc(width * 0.5, height * 0.5, Math.max(width, height) * 0.4, 0, Math.PI * 2)
      ctx.fillStyle = accent
      ctx.globalAlpha = 0.06
      ctx.fill()
      break
    case 'elegant-soft':
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(width * (0.3 + i * 0.2), height * (0.3 + i * 0.15), 80 + i * 40, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.05)`
        ctx.globalAlpha = 0.12
        ctx.fill()
      }
      break
  }

  ctx.restore()
}

function renderTextContent(ctx, config, primary, accent, width, height) {
  const { template, title, subtitle, bodyText, brandName } = config
  const pad = template.padding
  const textColor = template.bgStyle === 'soft' ? primary : '#ffffff'
  const subtextColor = template.bgStyle === 'soft' ? `rgba(${hexToRgb(primary).r}, ${hexToRgb(primary).g}, ${hexToRgb(primary).b}, 0.7)` : 'rgba(255,255,255,0.8)'

  ctx.textBaseline = 'top'

  if (brandName) {
    ctx.font = `600 14px "Source Sans 3", sans-serif`
    ctx.fillStyle = accent
    const brandX = template.layout === 'left' ? pad : width / 2
    ctx.textAlign = template.layout === 'left' ? 'left' : 'center'
    ctx.letterSpacing = '3px'
    ctx.fillText(brandName.toUpperCase(), brandX, pad)
  }

  if (title) {
    const titleY = brandName ? pad + 40 : pad + 20
    ctx.font = `700 ${template.titleSize}px "Playfair Display", Georgia, serif`
    ctx.fillStyle = textColor
    const titleX = template.layout === 'left' ? pad : width / 2
    ctx.textAlign = template.layout === 'left' ? 'left' : 'center'

    const maxWidth = width - pad * 2
    const words = title.split('')
    let line = ''
    let lines = []
    for (const char of words) {
      const testLine = line + char
      if (ctx.measureText(testLine).width > maxWidth) {
        lines.push(line)
        line = char
      } else {
        line = testLine
      }
    }
    lines.push(line)

    lines.forEach((l, i) => {
      ctx.fillText(l, titleX, titleY + i * (template.titleSize + 8))
    })
  }

  if (subtitle) {
    const subtitleY = height * 0.45
    ctx.font = `400 ${template.bodySize + 2}px "Source Sans 3", sans-serif`
    ctx.fillStyle = subtextColor
    const subtitleX = template.layout === 'left' ? pad : width / 2
    ctx.textAlign = template.layout === 'left' ? 'left' : 'center'
    ctx.fillText(subtitle, subtitleX, subtitleY)
  }

  if (bodyText) {
    const bodyY = height * 0.55
    ctx.font = `300 ${template.bodySize}px "Source Sans 3", sans-serif`
    ctx.fillStyle = subtextColor
    const bodyX = template.layout === 'left' ? pad : width / 2
    ctx.textAlign = template.layout === 'left' ? 'left' : 'center'
    const maxBodyWidth = width - pad * 2

    const bodyLines = []
    let currentLine = ''
    for (const char of bodyText) {
      const testLine = currentLine + char
      if (ctx.measureText(testLine).width > maxBodyWidth) {
        bodyLines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    bodyLines.push(currentLine)

    const maxLines = Math.min(bodyLines.length, 6)
    bodyLines.slice(0, maxLines).forEach((l, i) => {
      ctx.fillText(l, bodyX, bodyY + i * (template.bodySize + 8))
    })
  }

  ctx.strokeStyle = accent
  ctx.lineWidth = 2
  ctx.beginPath()
  const lineY = height - pad - 20
  const lineStartX = template.layout === 'left' ? pad : width / 2 - 30
  const lineEndX = template.layout === 'left' ? pad + 60 : width / 2 + 30
  ctx.moveTo(lineStartX, lineY)
  ctx.lineTo(lineEndX, lineY)
  ctx.stroke()
}

export function PosterRenderer({ brandName, colorPalette, onPosterGenerated }) {
  const [selectedTemplate, setSelectedTemplate] = useState(POSTER_TEMPLATES[0])
  const [title, setTitle] = useState(() => brandName || '')
  const [subtitle, setSubtitle] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState(null)
  const canvasRef = useRef(null)

  const handleRender = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    renderPosterToCanvas(canvas, {
      width: 800,
      height: 1200,
      template: selectedTemplate,
      title,
      subtitle,
      bodyText,
      brandName,
      colorPalette,
      backgroundImage,
    })
  }, [selectedTemplate, title, subtitle, bodyText, brandName, colorPalette, backgroundImage])

  useEffect(() => {
    handleRender()
  }, [handleRender])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `${brandName || 'brand'}-poster.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [brandName])

  const handleGenerateBackground = useCallback(async () => {
    setGenerating(true)
    try {
      const result = await api.generateImage({
        prompt: `Elegant abstract background for ${brandName} brand poster, ${(colorPalette || []).join(', ')} color scheme, ${selectedTemplate.bgStyle} style, premium texture, no text, high quality`,
        negativePrompt: 'text, words, letters, blurry, low quality, watermark',
        width: 800,
        height: 1200,
        brandName,
        assetType: 'poster-bg',
        title: `${brandName} 海报背景`,
      })

      if (result.imageData) {
        setBackgroundImage(result.imageData)
      }
    } catch (err) {
      console.error('背景生成失败:', err)
    } finally {
      setGenerating(false)
    }
  }, [brandName, colorPalette, selectedTemplate])

  const handleSaveAsset = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL('image/png')
    try {
      await api.createBrandAsset(brandName, {
        assetType: 'poster',
        title: `${brandName} - ${selectedTemplate.name}海报`,
        imageData,
        config: { template: selectedTemplate.id, title, subtitle, bodyText },
        tags: ['poster', selectedTemplate.id],
      })
      onPosterGenerated?.()
    } catch (err) {
      console.error('保存失败:', err)
    }
  }, [brandName, selectedTemplate, title, subtitle, bodyText, onPosterGenerated])

  return (
    <div className="poster-renderer">
      <div className="poster-renderer-header">
        <h3 className="poster-renderer-title">
          <Icon name="printer" size={16} /> 品牌海报生成
        </h3>
        <p className="poster-renderer-desc">选择模板，自定义内容，一键生成品牌海报</p>
      </div>

      <div className="poster-renderer-body">
        <div className="poster-controls">
          <div className="poster-template-select">
            <label className="poster-control-label">海报模板</label>
            <div className="poster-template-grid">
              {POSTER_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`poster-template-card ${selectedTemplate.id === t.id ? 'poster-template-card--active' : ''}`}
                  onClick={() => setSelectedTemplate(t)}
                >
                  <div className="poster-template-preview" style={{
                    background: t.bgStyle === 'dark' ? '#0D1117' : t.bgStyle === 'soft' ? '#FFFEF9' : `linear-gradient(135deg, ${colorPalette?.[0] || '#1B4332'}, ${colorPalette?.[1] || '#2D6A4F'})`,
                  }}>
                    <span className="poster-template-icon">
                      {t.id === 'modern-minimal' ? '◇' : t.id === 'editorial' ? '▎' : t.id === 'bold-impact' ? '◆' : '○'}
                    </span>
                  </div>
                  <span className="poster-template-name">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="poster-form">
            <div className="poster-form-group">
              <label className="poster-control-label">标题</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入海报标题"
              />
            </div>
            <div className="poster-form-group">
              <label className="poster-control-label">副标题</label>
              <input
                className="input"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="输入副标题"
              />
            </div>
            <div className="poster-form-group">
              <label className="poster-control-label">正文</label>
              <textarea
                className="input textarea"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="输入海报正文内容"
                rows={4}
              />
            </div>
          </div>

          <div className="poster-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleGenerateBackground}
              disabled={generating}
            >
              <Icon name="sparkles" size={14} />
              {generating ? '生成中...' : 'AI生成背景'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleDownload}>
              <Icon name="download" size={14} /> 下载海报
            </button>
            {brandName && (
              <button className="btn btn-ghost btn-sm" onClick={handleSaveAsset}>
                <Icon name="bookmark" size={14} /> 保存到资产
              </button>
            )}
          </div>
        </div>

        <div className="poster-preview">
          <div className="poster-canvas-wrap">
            <canvas ref={canvasRef} className="poster-canvas" />
          </div>
        </div>
      </div>
    </div>
  )
}
