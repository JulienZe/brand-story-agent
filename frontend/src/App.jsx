import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { useLocalStorage, useToast } from './hooks'
import { Toast, OnboardingGuide } from './components/common'
import { Navbar, Footer } from './components/layout/Navbar'
import { PageHome } from './components/home/PageHome'
import { PageCreate } from './components/create/PageCreate'
import { PageResult } from './components/result/PageResult'
import { PageHistory } from './components/history/PageHistory'
import * as api from './services/api'

function App() {
  const [page, setPage] = useState('home')
  const [history, setHistory] = useLocalStorage('brand-story-history', [])
  const [favorites, setFavorites] = useLocalStorage('brand-story-favorites', [])
  const [currentRecord, setCurrentRecord] = useState(null)
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
      } catch {}
      try {
        const ids = await api.getFavorites()
        if (mounted && Array.isArray(ids)) setFavorites(ids)
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const handleCreate = useCallback((record) => {
    setHistory(prev => [record, ...prev])
    setCurrentRecord(record)
    showToast('品牌故事创作完成！')
    api.saveStory(record).catch(() => {})
  }, [setHistory, showToast])

  const handleDelete = useCallback(async (id) => {
    setHistory(prev => prev.filter(h => h.id !== id))
    setFavorites(prev => prev.filter(f => f !== id))
    showToast('记录已删除')
    try { await api.deleteStory(id) } catch {}
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
    try { await api.toggleFavorite(id) } catch {}
  }, [setFavorites, showToast])

  const navigate = useCallback((target, data) => {
    if (target === 'result' && data) setCurrentRecord(data)
    setPage(target)
    window.scrollTo(0, 0)
  }, [])

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false)
    try { localStorage.setItem('brand-story-onboarded', 'true') } catch {}
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
    <div className="app">
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onClose={hideToast} />}
      {showOnboarding && <OnboardingGuide onClose={closeOnboarding} />}

      <Navbar page={page} historyCount={history.length} onNavigate={navigate} />

      <main className="main">
        {page === 'home' && <PageHome onNavigate={navigate} historyCount={history.length} />}
        {page === 'create' && <PageCreate onCreate={handleCreate} onNavigate={navigate} />}
        {page === 'result' && currentRecord && (
          <PageResult
            record={currentRecord}
            onBack={() => navigate('history')}
            onNew={() => navigate('create')}
            onNavigate={navigate}
          />
        )}
        {page === 'history' && (
          <PageHistory
            history={history}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelect={(r) => navigate('result', r)}
            onDelete={handleDelete}
            onNavigate={navigate}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App
