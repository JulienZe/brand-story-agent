import { useState, useRef, useCallback, useEffect } from 'react'
import { Icon } from '../common'
import * as api from '../../services/api'

const PLATFORMS = [
  { id: 'xiaohongshu', name: '小红书', icon: '📕', ratio: '3:4', width: 750, height: 1000, style: 'lifestyle' },
  { id: 'wechat', name: '公众号头图', icon: '📱', ratio: '2.35:1', width: 900, height: 383, style: 'editorial' },
  { id: 'douyin', name: '抖音封面', icon: '🎵', ratio: '9:16', width: 720, height: 1280, style: 'dynamic' },
  { id: 'weibo', name: '微博配图', icon: '💬', ratio: '16:9', width: 900, height: 506, style: 'bold' },
  { id: 'moments', name: '朋友圈', icon: '👥', ratio: '1:1', width: 800, height: 800, style: 'minimal' },
]

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 27, g: 67, b: 50 }
}

function renderSocialCard(canvas, config) {
  const ctx = canvas.getContext('2d')
  const { platform, colorPalette, backgroundImage } = config
  const platformConfig = PLATFORMS.find(p => p.id === platform) || PLATFORMS[0]

  canvas.width = platformConfig.width
  canvas.height = platformConfig.height

  const primary = colorPalette?.[0] || '#1B4332'
  const secondary = colorPalette?.[1] || '#2D6A4F'
  const accent = colorPalette?.[2] || '#BC8A3F'
  const primaryRgb = hexToRgb(primary)
  const { width, height } = canvas

  if (backgroundImage) {
    const img = new Image()
    img.onload = () => {
      const scale = Math.max(width / img.width, height / img.height)
      const drawW = img.width * scale
      const drawH = img.height * scale
      ctx.drawImage(img, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH)

      ctx.fillStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.55)`
      ctx.fillRect(0, 0, width, height)
      renderCardText(ctx, config, platformConfig, primary, accent, width, height)
    }
    img.src = backgroundImage
  } else {
    switch (platformConfig.style) {
      case 'lifestyle': {
        const warmGrad = ctx.createLinearGradient(0, 0, width, height)
        warmGrad.addColorStop(0, primary)
        warmGrad.addColorStop(0.5, secondary)
        warmGrad.addColorStop(1, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.7)`)
        ctx.fillStyle = warmGrad
        ctx.fillRect(0, 0, width, height)
        ctx.globalAlpha = 0.06
        ctx.beginPath()
        ctx.arc(width * 0.7, height * 0.3, 200, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.globalAlpha = 1
        break
      }
      case 'editorial':
        ctx.fillStyle = primary
        ctx.fillRect(0, 0, width, height)
        ctx.fillStyle = `rgba(255,255,255,0.04)`
        ctx.fillRect(width * 0.6, 0, width * 0.4, height)
        break
      case 'dynamic': {
        const dynGrad = ctx.createLinearGradient(0, 0, 0, height)
        dynGrad.addColorStop(0, '#0D1117')
        dynGrad.addColorStop(0.6, primary)
        dynGrad.addColorStop(1, secondary)
        ctx.fillStyle = dynGrad
        ctx.fillRect(0, 0, width, height)
        ctx.globalAlpha = 0.08
        ctx.beginPath()
        ctx.arc(width * 0.5, height * 0.3, 300, 0, Math.PI * 2)
        ctx.fillStyle = accent
        ctx.fill()
        ctx.globalAlpha = 1
        break
      }
      case 'bold':
        ctx.fillStyle = primary
        ctx.fillRect(0, 0, width, height)
        ctx.strokeStyle = accent
        ctx.lineWidth = 4
        ctx.strokeRect(20, 20, width - 40, height - 40)
        break
      case 'minimal': {
        const minGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.6)
        minGrad.addColorStop(0, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.12)`)
        minGrad.addColorStop(1, '#FFFEF9')
        ctx.fillStyle = minGrad
        ctx.fillRect(0, 0, width, height)
        break
      }
      default:
        ctx.fillStyle = primary
        ctx.fillRect(0, 0, width, height)
    }

    renderCardText(ctx, config, platformConfig, primary, accent, width, height)
  }
}

function renderCardText(ctx, config, platformConfig, primary, accent, width, height) {
  const { title, subtitle, brandName } = config
  const isLight = platformConfig.style === 'minimal'
  const textColor = isLight ? primary : '#ffffff'
  const subtextColor = isLight ? `rgba(${hexToRgb(primary).r}, ${hexToRgb(primary).g}, ${hexToRgb(primary).b}, 0.7)` : 'rgba(255,255,255,0.75)'

  ctx.textBaseline = 'top'

  if (brandName) {
    ctx.font = `600 ${Math.max(12, Math.round(width / 50))}px "Source Sans 3", sans-serif`
    ctx.fillStyle = accent
    ctx.textAlign = 'left'
    ctx.fillText(brandName.toUpperCase(), 30, 25)
  }

  if (title) {
    const titleSize = Math.max(20, Math.round(width / 20))
    ctx.font = `700 ${titleSize}px "Playfair Display", Georgia, serif`
    ctx.fillStyle = textColor
    ctx.textAlign = platformConfig.style === 'editorial' ? 'left' : 'center'

    const titleX = platformConfig.style === 'editorial' ? 30 : width / 2
    const titleY = brandName ? 55 : height * 0.3
    const maxW = width - 60

    const lines = []
    let line = ''
    for (const char of title) {
      if (ctx.measureText(line + char).width > maxW) {
        lines.push(line)
        line = char
      } else {
        line += char
      }
    }
    lines.push(line)

    lines.forEach((l, i) => {
      ctx.fillText(l, titleX, titleY + i * (titleSize + 6))
    })
  }

  if (subtitle) {
    const subSize = Math.max(14, Math.round(width / 55))
    ctx.font = `300 ${subSize}px "Source Sans 3", sans-serif`
    ctx.fillStyle = subtextColor
    ctx.textAlign = 'center'
    const subY = height - 60
    const maxSubW = width - 80

    let subLine = subtitle
    if (ctx.measureText(subLine).width > maxSubW) {
      subLine = subLine.substring(0, Math.round(maxSubW / ctx.measureText('字').width)) + '...'
    }
    ctx.fillText(subLine, width / 2, subY)
  }

  ctx.strokeStyle = accent
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(width / 2 - 20, height - 25)
  ctx.lineTo(width / 2 + 20, height - 25)
  ctx.stroke()
}

export function SocialCardBuilder({ brandName, colorPalette, onCardGenerated }) {
  const [activePlatform, setActivePlatform] = useState('xiaohongshu')
  const [title, setTitle] = useState(() => brandName || '')
  const [subtitle, setSubtitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState(null)
  const canvasRef = useRef(null)

  const handleRender = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    renderSocialCard(canvas, {
      platform: activePlatform,
      title,
      subtitle,
      brandName,
      colorPalette,
      backgroundImage,
    })
  }, [activePlatform, title, subtitle, brandName, colorPalette, backgroundImage])

  useEffect(() => {
    handleRender()
  }, [handleRender])

  const handleGenerateBg = useCallback(async () => {
    setGenerating(true)
    try {
      const platform = PLATFORMS.find(p => p.id === activePlatform)
      const result = await api.generateImage({
        prompt: `Social media cover image for ${brandName}, ${platform?.style} style, ${(colorPalette || []).join(', ')} color scheme, no text, high quality, ${platform?.ratio} aspect ratio`,
        negativePrompt: 'text, words, letters, watermark, blurry, low resolution',
        width: platform?.width,
        height: platform?.height,
        brandName,
        assetType: 'social-card',
        title: `${brandName} - ${platform?.name}图卡`,
      })

      if (result.imageData) {
        setBackgroundImage(result.imageData)
      }
    } catch (err) {
      console.error('图卡背景生成失败:', err)
    } finally {
      setGenerating(false)
    }
  }, [activePlatform, brandName, colorPalette])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `${brandName || 'brand'}-${activePlatform}-card.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [brandName, activePlatform])

  const handleSaveAsset = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL('image/png')
    const platform = PLATFORMS.find(p => p.id === activePlatform)
    try {
      await api.createBrandAsset(brandName, {
        assetType: 'social-card',
        title: `${brandName} - ${platform?.name}图卡`,
        imageData,
        config: { platform: activePlatform, title, subtitle },
        tags: ['social-card', activePlatform],
      })
      onCardGenerated?.()
    } catch (err) {
      console.error('保存失败:', err)
    }
  }, [brandName, activePlatform, title, subtitle, onCardGenerated])

  const currentPlatform = PLATFORMS.find(p => p.id === activePlatform)

  return (
    <div className="social-card-builder">
      <div className="social-card-header">
        <h3 className="social-card-title">
          <Icon name="share" size={16} /> 社交媒体图卡
        </h3>
        <p className="social-card-desc">一键生成多平台社交媒体封面图</p>
      </div>

      <div className="social-card-body">
        <div className="social-card-controls">
          <div className="social-platform-tabs">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                className={`social-platform-tab ${activePlatform === p.id ? 'social-platform-tab--active' : ''}`}
                onClick={() => { setActivePlatform(p.id); setBackgroundImage(null) }}
              >
                <span className="social-platform-icon">{p.icon}</span>
                <span className="social-platform-name">{p.name}</span>
              </button>
            ))}
          </div>

          {currentPlatform && (
            <div className="social-platform-meta">
              <span className="social-meta-item">比例: {currentPlatform.ratio}</span>
              <span className="social-meta-item">尺寸: {currentPlatform.width}×{currentPlatform.height}</span>
            </div>
          )}

          <div className="social-card-form">
            <div className="poster-form-group">
              <label className="poster-control-label">标题</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入图卡标题"
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
          </div>

          <div className="social-card-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleGenerateBg}
              disabled={generating}
            >
              <Icon name="sparkles" size={14} />
              {generating ? '生成中...' : 'AI生成背景'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleDownload}>
              <Icon name="download" size={14} /> 下载图卡
            </button>
            {brandName && (
              <button className="btn btn-ghost btn-sm" onClick={handleSaveAsset}>
                <Icon name="bookmark" size={14} /> 保存到资产
              </button>
            )}
          </div>
        </div>

        <div className="social-card-preview">
          <div className="social-canvas-wrap" style={{
            maxWidth: currentPlatform?.width && currentPlatform?.height
              ? `${Math.min(400, 400 * currentPlatform.width / currentPlatform.height)}px`
              : '400px',
            aspectRatio: currentPlatform ? `${currentPlatform.width}/${currentPlatform.height}` : '3/4',
          }}>
            <canvas ref={canvasRef} className="social-canvas" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
