import { useState, useEffect, useCallback } from 'react'
import { Icon, Skeleton } from '../common'
import { ColorExtractor } from './ColorExtractor'
import { PosterRenderer } from './PosterRenderer'
import { SocialCardBuilder } from './SocialCardBuilder'
import * as api from '../../services/api'

const ASSET_TYPE_LABELS = {
  image: 'AI配图',
  poster: '品牌海报',
  'poster-bg': '海报背景',
  'social-card': '社交图卡',
  color: '色板',
}

const TABS = [
  { id: 'assets', name: '资产管理', icon: 'bookmark' },
  { id: 'extract', name: '色板提取', icon: 'sparkles' },
  { id: 'poster', name: '海报生成', icon: 'printer' },
  { id: 'social', name: '社交图卡', icon: 'share' },
]

function AssetCard({ asset, onDelete, onPreview }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(asset.id)
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = () => {
    if (!asset.imageData) return
    const link = document.createElement('a')
    link.download = `${asset.title || asset.id}.png`
    link.href = asset.imageData
    link.click()
  }

  return (
    <div className="asset-card">
      <div className="asset-card-preview" onClick={() => onPreview(asset)}>
        {asset.imageData ? (
          <img src={asset.imageData} alt={asset.title || '品牌资产'} className="asset-card-image" />
        ) : (
          <div className="asset-card-placeholder">
            <Icon name="file" size={24} />
          </div>
        )}
        <div className="asset-card-overlay">
          <Icon name="eye" size={16} />
        </div>
      </div>
      <div className="asset-card-info">
        <div className="asset-card-top">
          <span className="asset-card-type">{ASSET_TYPE_LABELS[asset.assetType] || asset.assetType}</span>
          <span className="asset-card-time">{new Date(asset.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
        <h4 className="asset-card-title">{asset.title || '未命名资产'}</h4>
        {asset.tags?.length > 0 && (
          <div className="asset-card-tags">
            {asset.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="asset-card-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="asset-card-actions">
        {asset.imageData && (
          <button className="icon-btn" onClick={handleDownload} title="下载">
            <Icon name="download" size={14} />
          </button>
        )}
        <button className="icon-btn icon-btn--danger" onClick={handleDelete} disabled={deleting} title="删除">
          <Icon name="trash" size={14} />
        </button>
      </div>
    </div>
  )
}

function AssetPreviewModal({ asset, onClose }) {
  if (!asset) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{asset.title || '资产预览'}</h3>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {asset.imageData && (
            <div className="asset-preview-image-wrap">
              <img src={asset.imageData} alt={asset.title} className="asset-preview-image" />
            </div>
          )}
          <div className="asset-preview-meta">
            <div className="asset-meta-row">
              <span className="asset-meta-label">类型</span>
              <span className="asset-meta-value">{ASSET_TYPE_LABELS[asset.assetType] || asset.assetType}</span>
            </div>
            {asset.prompt && (
              <div className="asset-meta-row">
                <span className="asset-meta-label">提示词</span>
                <span className="asset-meta-value">{asset.prompt}</span>
              </div>
            )}
            {asset.metadata?.model && (
              <div className="asset-meta-row">
                <span className="asset-meta-label">模型</span>
                <span className="asset-meta-value">{asset.metadata.model}</span>
              </div>
            )}
            {asset.metadata?.provider && (
              <div className="asset-meta-row">
                <span className="asset-meta-label">提供商</span>
                <span className="asset-meta-value">{asset.metadata.provider}</span>
              </div>
            )}
            <div className="asset-meta-row">
              <span className="asset-meta-label">创建时间</span>
              <span className="asset-meta-value">{new Date(asset.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {asset.imageData && (
            <button className="btn btn-primary btn-sm" onClick={() => {
              const link = document.createElement('a')
              link.download = `${asset.title || asset.id}.png`
              link.href = asset.imageData
              link.click()
            }}>
              <Icon name="download" size={14} /> 下载
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}

function BrandSelector({ brands, selectedBrand, onSelect, onCreate }) {
  return (
    <div className="brand-selector">
      <label className="poster-control-label">选择品牌</label>
      <div className="brand-selector-row">
        <select
          className="input"
          value={selectedBrand || ''}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">请选择品牌</option>
          {brands.map(b => (
            <option key={b.brandName} value={b.brandName}>{b.brandName}</option>
          ))}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={onCreate}>
          <Icon name="pen" size={14} /> 新建
        </button>
      </div>
    </div>
  )
}

function CreateBrandModal({ onClose, onCreated }) {
  const [brandName, setBrandName] = useState('')
  const [toneKeywords, setToneKeywords] = useState('')
  const [values, setValues] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!brandName.trim()) return
    setLoading(true)
    try {
      await api.createBrandDNA({
        brandName: brandName.trim(),
        toneKeywords: toneKeywords.split(',').map(s => s.trim()).filter(Boolean),
        values: values.split(',').map(s => s.trim()).filter(Boolean),
      })
      onCreated(brandName.trim())
      onClose()
    } catch (err) {
      console.error('创建品牌失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>新建品牌</h3>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="poster-form-group">
            <label className="poster-control-label">品牌名称 <span className="required">*</span></label>
            <input className="input" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="输入品牌名称" />
          </div>
          <div className="poster-form-group">
            <label className="poster-control-label">品牌调性关键词</label>
            <input className="input" value={toneKeywords} onChange={(e) => setToneKeywords(e.target.value)} placeholder="用逗号分隔，如：专业,温暖,可靠" />
          </div>
          <div className="poster-form-group">
            <label className="poster-control-label">品牌价值观</label>
            <input className="input" value={values} onChange={(e) => setValues(e.target.value)} placeholder="用逗号分隔，如：创新,品质,用户至上" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>取消</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={!brandName.trim() || loading}>
            {loading ? '创建中...' : '创建品牌'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PageAssets({ showToast }) {
  const [activeTab, setActiveTab] = useState('assets')
  const [brands, setBrands] = useState([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [assets, setAssets] = useState([])
  const [totalAssets, setTotalAssets] = useState(0)
  const [loading, setLoading] = useState(true)
  const [previewAsset, setPreviewAsset] = useState(null)
  const [showCreateBrand, setShowCreateBrand] = useState(false)
  const [filterType, setFilterType] = useState('')

  const currentBrand = brands.find(b => b.brandName === selectedBrand)
  const displayAssets = selectedBrand ? assets : []
  const displayTotal = selectedBrand ? totalAssets : 0
  const displayLoading = selectedBrand ? loading : false

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await api.getBrands()
        if (mounted) {
          setBrands(data)
          if (data.length > 0) {
            setSelectedBrand(prev => prev || data[0].brandName)
          }
        }
      } catch (err) {
        console.error('加载品牌列表失败:', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!selectedBrand) return

    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const data = await api.getBrandAssets(selectedBrand, { assetType: filterType || undefined })
        if (mounted) {
          setAssets(data.assets || [])
          setTotalAssets(data.total || 0)
        }
      } catch (err) {
        console.error('加载资产失败:', err)
        if (mounted) setAssets([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [selectedBrand, filterType])

  const refreshBrands = useCallback(async () => {
    try {
      const data = await api.getBrands()
      setBrands(data)
    } catch (err) {
      console.error('刷新品牌列表失败:', err)
    }
  }, [])

  const refreshAssets = useCallback(async () => {
    if (!selectedBrand) return
    try {
      const data = await api.getBrandAssets(selectedBrand, { assetType: filterType || undefined })
      setAssets(data.assets || [])
      setTotalAssets(data.total || 0)
    } catch (err) {
      console.error('刷新资产失败:', err)
    }
  }, [selectedBrand, filterType])

  const handleDeleteAsset = useCallback(async (id) => {
    try {
      await api.deleteBrandAsset(id)
      setAssets(prev => prev.filter(a => a.id !== id))
      setTotalAssets(prev => prev - 1)
      showToast?.('资产已删除')
    } catch {
      showToast?.('删除失败', 'error')
    }
  }, [showToast])

  const handleColorsExtracted = useCallback((colors) => {
    if (selectedBrand) {
      api.createBrandDNA({
        brandName: selectedBrand,
        colorPalette: colors,
      }).then(() => {
        refreshBrands()
        showToast?.('色板已保存到品牌')
      }).catch(() => {})
    }
  }, [selectedBrand, refreshBrands, showToast])

  const handleBrandCreated = useCallback((name) => {
    setSelectedBrand(name)
    refreshBrands()
    showToast?.('品牌创建成功')
  }, [refreshBrands, showToast])

  const handleAssetGenerated = useCallback(() => {
    refreshAssets()
    showToast?.('资产已保存')
  }, [refreshAssets, showToast])

  return (
    <div className="page page-assets">
      <div className="assets-header">
        <h2 className="assets-title">品牌视觉资产</h2>
        <p className="assets-subtitle">管理品牌色板、海报和社交媒体图卡</p>
      </div>

      <BrandSelector
        brands={brands}
        selectedBrand={selectedBrand}
        onSelect={setSelectedBrand}
        onCreate={() => setShowCreateBrand(true)}
      />

      {currentBrand && (
        <div className="brand-info-bar">
          <div className="brand-info-item">
            <span className="brand-info-label">调性</span>
            <div className="brand-info-tags">
              {currentBrand.toneKeywords?.map((k, i) => (
                <span key={i} className="brand-info-tag">{k}</span>
              )) || <span className="brand-info-empty">未设置</span>}
            </div>
          </div>
          <div className="brand-info-item">
            <span className="brand-info-label">色板</span>
            <div className="brand-color-chips">
              {currentBrand.colorPalette?.length > 0 ? (
                currentBrand.colorPalette.map((c, i) => (
                  <span key={i} className="brand-color-chip" style={{ backgroundColor: c }} title={c} />
                ))
              ) : (
                <span className="brand-info-empty">未提取</span>
              )}
            </div>
          </div>
          <div className="brand-info-item">
            <span className="brand-info-label">资产数</span>
            <span className="brand-info-value">{totalAssets}</span>
          </div>
        </div>
      )}

      <div className="assets-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`assets-tab ${activeTab === tab.id ? 'assets-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon} size={14} />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="assets-content">
        {activeTab === 'assets' && (
          <div className="assets-list-section">
            <div className="assets-list-header">
              <div className="assets-filter">
                <select className="input input-search" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="">全部类型</option>
                  {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <span className="assets-count">共 {displayTotal} 项</span>
            </div>

            {displayLoading ? (
              <div className="assets-loading"><Skeleton count={4} /></div>
            ) : displayAssets.length > 0 ? (
              <div className="assets-grid">
                {displayAssets.map(asset => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onDelete={handleDeleteAsset}
                    onPreview={setPreviewAsset}
                  />
                ))}
              </div>
            ) : (
              <div className="assets-empty">
                <Icon name="bookmark" size={32} />
                <p>{selectedBrand ? '暂无品牌资产，试试生成海报或图卡' : '请先选择品牌'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'extract' && (
          <ColorExtractor
            brandName={selectedBrand}
            onColorsExtracted={handleColorsExtracted}
          />
        )}

        {activeTab === 'poster' && (
          <PosterRenderer
            brandName={selectedBrand}
            colorPalette={currentBrand?.colorPalette}
            onPosterGenerated={handleAssetGenerated}
          />
        )}

        {activeTab === 'social' && (
          <SocialCardBuilder
            brandName={selectedBrand}
            colorPalette={currentBrand?.colorPalette}
            onCardGenerated={handleAssetGenerated}
          />
        )}
      </div>

      {previewAsset && (
        <AssetPreviewModal
          asset={previewAsset}
          onClose={() => setPreviewAsset(null)}
        />
      )}

      {showCreateBrand && (
        <CreateBrandModal
          onClose={() => setShowCreateBrand(false)}
          onCreated={handleBrandCreated}
        />
      )}
    </div>
  )
}
