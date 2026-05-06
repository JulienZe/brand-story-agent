import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { useLocalStorage, useToast } from './hooks'
import { Toast, OnboardingGuide, ErrorBoundary, Icon } from './components/common'
import { Navbar, Footer } from './components/layout/Navbar'
import { PageHome } from './components/home/PageHome'
import { PageCreate } from './components/create/PageCreate'
import { PageResult } from './components/result/PageResult'
import { PageHistory } from './components/history/PageHistory'
import { PageDashboard } from './components/dashboard/PageDashboard'
import { PageAssets } from './components/assets/PageAssets'
import * as api from './services/api'

function App() {
  const [page, setPage] = useState('home')
  const [history, setHistory] = useLocalStorage('brand-story-history', [])
  const [favorites, setFavorites] = useLocalStorage('brand-story-favorites', [])
  const [currentRecord, setCurrentRecord] = useState(null)
  const [refineTarget, setRefineTarget] = useState(null)
  const { toast, showToast, hideToast } = useToast()
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('brand-story-onboarded') } catch { return true }
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await api.getStories({ limit: 100 })
        if (mounted && data?.stories) {
          const mapped = data.stories.map(s => ({
            id: s.id,
            productName: s.productName,
            productDesc: s.productDesc,
            template: s.template,
            targetUser: s.targetUser,
            tone: s.tone,
            result: s.result,
            isFavorite: s.isFavorite,
            createdAt: s.createdAt,
          }))
          setHistory(mapped)
        }
      } catch (err) {
        console.error('加载故事列表失败:', err)
      }
      try {
        const ids = await api.getFavorites()
        if (mounted && Array.isArray(ids)) setFavorites(ids)
      } catch (err) {
        console.error('加载收藏列表失败:', err)
      }
    })()
    return () => { mounted = false }
  }, [setHistory, setFavorites])

  const handleCreate = useCallback((record) => {
    setHistory(prev => [record, ...prev])
    setCurrentRecord(record)
    showToast('品牌故事创作完成！')
    api.saveStory(record).catch((err) => {
      console.error('保存故事失败:', err)
    })
  }, [setHistory, showToast])

  const handleDelete = useCallback(async (id) => {
    setHistory(prev => prev.filter(h => h.id !== id))
    setFavorites(prev => prev.filter(f => f !== id))
    showToast('记录已删除')
    try { await api.deleteStory(id) } catch (err) {
      console.error('删除故事失败:', err)
    }
  }, [setHistory, setFavorites, showToast])

  const toggleFavorite = useCallback(async (id) => {
    let newIsFav
    setFavorites(prev => {
      if (prev.includes(id)) {
        showToast('已取消收藏')
        newIsFav = false
        return prev.filter(f => f !== id)
      }
      showToast('已收藏')
      newIsFav = true
      return [...prev, id]
    })
    setHistory(prev => prev.map(h => h.id === id ? { ...h, isFavorite: newIsFav } : h))
    try { await api.toggleFavorite(id) } catch (err) {
      console.error('切换收藏失败:', err)
    }
  }, [setFavorites, setHistory, showToast])

  const navigate = useCallback((target, data) => {
    if (target === 'result' && data) setCurrentRecord(data)
    if (target === 'create' && data) setRefineTarget(data)
    else if (target === 'create') setRefineTarget(null)
    setPage(target)
    window.scrollTo(0, 0)
  }, [])

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false)
    try { localStorage.setItem('brand-story-onboarded', 'true') } catch (err) {
      console.error('保存引导状态失败:', err)
    }
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
    <ErrorBoundary>
    <div className="app">
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onClose={hideToast} />}
      {showOnboarding && <OnboardingGuide onClose={closeOnboarding} />}

      <Navbar page={page} historyCount={history.length} onNavigate={navigate} />

      <main className="main">
        <ErrorBoundary fallback={(err, reset) => (
          <div className="error-page-fallback">
            <Icon name="alert" size={32} />
            <h3>页面加载出错</h3>
            <p>{err?.message || '未知错误'}</p>
            <button className="btn btn-primary btn-sm" onClick={reset}>重试</button>
          </div>
        )}>
        {page === 'home' && <PageHome onNavigate={navigate} historyCount={history.length} />}
        {page === 'create' && <PageCreate onCreate={handleCreate} onNavigate={navigate} history={history} refineTarget={refineTarget} />}
        {page === 'result' && currentRecord && (
          <PageResult
            record={currentRecord}
            onBack={() => navigate('history')}
            onNew={() => navigate('create')}
            onNavigate={navigate}
            onUpdateRecord={(updated) => {
              setCurrentRecord(updated)
              setHistory(prev => prev.map(h => h.id === updated.id ? updated : h))
            }}
            showToast={showToast}
          />
        )}
        {page === 'history' && (
          <PageHistory
            history={history}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelect={(r) => navigate('result', r)}
            onRefine={(r) => navigate('create', r)}
            onDelete={handleDelete}
            onNavigate={navigate}
          />
        )}
        {page === 'dashboard' && (
          <PageDashboard onNavigate={navigate} />
        )}
        {page === 'assets' && (
          <PageAssets onNavigate={navigate} showToast={showToast} />
        )}
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
    </ErrorBoundary>
  )
}

export default App
