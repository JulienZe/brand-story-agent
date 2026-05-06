import { useState, useRef, useCallback } from 'react'
import { Icon } from '../common'
import * as api from '../../services/api'

function ColorSwatch({ color, index, selected, onSelect }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(color.hex).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div
      className={`color-swatch ${selected ? 'color-swatch--selected' : ''}`}
      onClick={() => onSelect(index)}
    >
      <div className="color-swatch-preview" style={{ backgroundColor: color.hex }}>
        <span className="color-swatch-ratio">{color.ratio}%</span>
      </div>
      <div className="color-swatch-info">
        <span className="color-swatch-hex">{color.hex}</span>
        <span className="color-swatch-rgb">rgb({color.r}, {color.g}, {color.b})</span>
      </div>
      <button className="color-swatch-copy" onClick={handleCopy} title="复制色值">
        {copied ? <Icon name="check" size={12} /> : <Icon name="copy" size={12} />}
      </button>
    </div>
  )
}

export function ColorExtractor({ brandName, onColorsExtracted }) {
  const [colors, setColors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)

  const extractColorsFromImage = useCallback((imageData) => {
    setLoading(true)
    setError(null)

    api.extractColors(imageData, brandName)
      .then((data) => {
        setColors(data)
        setSelectedIndex(-1)
        onColorsExtracted?.(data.map(c => c.hex))
      })
      .catch((err) => {
        setError(err.message || '色板提取失败')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [brandName, onColorsExtracted])

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const maxSize = 200
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const base64 = canvas.toDataURL('image/png')
        extractColorsFromImage(base64)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }, [extractColorsFromImage])

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) continue

        const reader = new FileReader()
        reader.onload = (ev) => {
          const img = new Image()
          img.onload = () => {
            const canvas = canvasRef.current
            if (!canvas) return

            const ctx = canvas.getContext('2d')
            const maxSize = 200
            const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
            canvas.width = Math.round(img.width * scale)
            canvas.height = Math.round(img.height * scale)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            const base64 = canvas.toDataURL('image/png')
            extractColorsFromImage(base64)
          }
          img.src = ev.target.result
        }
        reader.readAsDataURL(file)
        break
      }
    }
  }, [extractColorsFromImage])

  const handleSelect = useCallback((index) => {
    setSelectedIndex(prev => prev === index ? -1 : index)
  }, [])

  return (
    <div className="color-extractor" onPaste={handlePaste} tabIndex={0}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      <div className="color-extractor-header">
        <h3 className="color-extractor-title">
          <Icon name="sparkles" size={16} /> 品牌色板提取
        </h3>
        <p className="color-extractor-desc">上传品牌Logo或图片，自动提取品牌色板</p>
      </div>

      <div className="color-extractor-upload">
        <button
          className="color-extractor-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <Icon name="file" size={24} />
          <span>{loading ? '提取中...' : '上传图片'}</span>
          <span className="color-extractor-hint">支持拖拽、粘贴或点击上传</span>
        </button>
      </div>

      {error && (
        <div className="color-extractor-error">
          <Icon name="alert" size={14} /> {error}
        </div>
      )}

      {colors.length > 0 && (
        <div className="color-extractor-results">
          <div className="color-palette-preview">
            {colors.map((c, i) => (
              <div
                key={i}
                className={`palette-block ${selectedIndex === i ? 'palette-block--selected' : ''}`}
                style={{ backgroundColor: c.hex, flex: c.ratio }}
                onClick={() => handleSelect(i)}
                title={`${c.hex} (${c.ratio}%)`}
              />
            ))}
          </div>

          <div className="color-swatch-list">
            {colors.map((c, i) => (
              <ColorSwatch
                key={i}
                color={c}
                index={i}
                selected={selectedIndex === i}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {selectedIndex >= 0 && colors[selectedIndex] && (
            <div className="color-detail-panel">
              <div className="color-detail-preview" style={{ backgroundColor: colors[selectedIndex].hex }} />
              <div className="color-detail-info">
                <span className="color-detail-hex">{colors[selectedIndex].hex}</span>
                <span className="color-detail-rgb">RGB({colors[selectedIndex].r}, {colors[selectedIndex].g}, {colors[selectedIndex].b})</span>
                <span className="color-detail-ratio">占比 {colors[selectedIndex].ratio}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
