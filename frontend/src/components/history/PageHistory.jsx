import { useState, useMemo, useCallback } from 'react'
import { Icon, ConfirmDialog } from '../common'
import { TEMPLATES } from '../../constants'

export function PageHistory({ history, favorites, onToggleFavorite, onSelect, onDelete, onNavigate }) {
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    let list = history
    if (search) {
      list = list.filter(h => h.productName.toLowerCase().includes(search.toLowerCase()))
    }
    if (filter === 'favorites') {
      list = list.filter(h => favorites.includes(h.id) || h.isFavorite)
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
                className={`icon-btn icon-btn--fav ${favorites.includes(h.id) || h.isFavorite ? 'icon-btn--fav-active' : ''}`}
                title={favorites.includes(h.id) || h.isFavorite ? '取消收藏' : '收藏'}
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
