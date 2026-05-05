import { useState, useEffect, useMemo } from 'react'
import { Icon, SkeletonDashboard } from '../common'
import * as api from '../../services/api'

export function PageDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    api.getDashboard()
      .then((data) => {
        if (mounted) setStats(data)
      })
      .catch((err) => {
        if (mounted) setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const dailyData = useMemo(() => {
    if (!stats?.usage?.daily) return []
    return stats.usage.daily.slice(-14)
  }, [stats])

  const maxDailyCount = useMemo(() => {
    if (dailyData.length === 0) return 1
    return Math.max(...dailyData.map(d => d.count), 1)
  }, [dailyData])

  if (loading) {
    return (
      <div className="page page-dashboard">
        <SkeletonDashboard />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page page-dashboard">
        <div className="dashboard-error">
          <Icon name="alert" size={32} />
          <h3>加载失败</h3>
          <p>{error}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>重试</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">数据看板</h2>
        <p className="dashboard-subtitle">创作统计与使用洞察</p>
      </div>

      <div className="dashboard-stats">
        <div className="dash-stat-card">
          <div className="dash-stat-icon"><Icon name="book" size={20} /></div>
          <div className="dash-stat-body">
            <div className="dash-stat-value">{stats?.totalStories || 0}</div>
            <div className="dash-stat-label">创作总数</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon"><Icon name="edit" size={20} /></div>
          <div className="dash-stat-body">
            <div className="dash-stat-value">{stats?.totalWords > 1000 ? `${(stats.totalWords / 1000).toFixed(1)}k` : stats?.totalWords || 0}</div>
            <div className="dash-stat-label">总字数</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon"><Icon name="star" size={20} /></div>
          <div className="dash-stat-body">
            <div className="dash-stat-value">{stats?.avgRating || 0}</div>
            <div className="dash-stat-label">平均评分</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon"><Icon name="bookmark" size={20} /></div>
          <div className="dash-stat-body">
            <div className="dash-stat-value">{stats?.favCount || 0}</div>
            <div className="dash-stat-label">收藏数</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><Icon name="chart" size={16} /> 创作趋势</h3>
            <span className="dash-card-hint">近14天</span>
          </div>
          <div className="dash-card-body">
            {dailyData.length > 0 ? (
              <div className="trend-chart">
                {dailyData.map((d, i) => (
                  <div key={i} className="trend-bar-group">
                    <div className="trend-bar-wrap">
                      <div
                        className="trend-bar"
                        style={{ height: `${(d.count / maxDailyCount) * 100}%` }}
                        title={`${d.date}: ${d.count}次`}
                      />
                    </div>
                    <span className="trend-label">{d.date.slice(-5)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dash-empty">暂无趋势数据</div>
            )}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h3><Icon name="bolt" size={16} /> AI调用统计</h3>
            <span className="dash-card-hint">近30天</span>
          </div>
          <div className="dash-card-body">
            {stats?.usage?.byProvider?.length > 0 ? (
              <div className="provider-list">
                {stats.usage.byProvider.map((p, i) => (
                  <div key={i} className="provider-item">
                    <div className="provider-info">
                      <span className="provider-name">{p.provider || 'Unknown'}</span>
                      <span className="provider-model">{p.model || ''}</span>
                    </div>
                    <div className="provider-stats">
                      <span className="provider-stat">{p.call_count}次调用</span>
                      <span className="provider-stat">{Math.round(p.total_input_tokens + p.total_output_tokens)} tokens</span>
                      {p.total_cost > 0 && <span className="provider-stat">¥{p.total_cost.toFixed(4)}</span>}
                    </div>
                    <div className="provider-bar-wrap">
                      <div
                        className="provider-bar"
                        style={{ width: `${Math.min(100, (p.call_count / Math.max(...stats.usage.byProvider.map(x => x.call_count))) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dash-empty">暂无AI调用数据</div>
            )}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h3><Icon name="clock" size={16} /> 最近创作</h3>
          </div>
          <div className="dash-card-body">
            {stats?.recentStories?.length > 0 ? (
              <div className="recent-list">
                {stats.recentStories.map((s, i) => (
                  <div key={i} className="recent-item">
                    <div className="recent-name">{s.product_name}</div>
                    <div className="recent-time">{new Date(s.created_at).toLocaleString('zh-CN')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dash-empty">暂无创作记录</div>
            )}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h3><Icon name="target" size={16} /> 模板分布</h3>
          </div>
          <div className="dash-card-body">
            {stats?.templateDist?.length > 0 ? (
              <div className="template-dist">
                {stats.templateDist.map((t, i) => (
                  <div key={i} className="template-dist-item">
                    <span className="template-dist-name">{t.template || '未分类'}</span>
                    <div className="template-dist-bar-wrap">
                      <div
                        className="template-dist-bar"
                        style={{ width: `${Math.min(100, (t.count / Math.max(...stats.templateDist.map(x => x.count))) * 100)}%` }}
                      />
                    </div>
                    <span className="template-dist-count">{t.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dash-empty">暂无模板数据</div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-cta">
        <button className="btn btn-primary" onClick={() => onNavigate('create')}>
          <Icon name="pen" size={16} /> 开始新创作
        </button>
        <button className="btn btn-ghost" onClick={() => onNavigate('history')}>
          <Icon name="clock" size={16} /> 查看历史
        </button>
      </div>
    </div>
  )
}
