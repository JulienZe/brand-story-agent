import { Icon } from '../common/Icon'

export function Navbar({ page, historyCount, onNavigate }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <button className="nav-brand" onClick={() => onNavigate('home')}>
          <div className="nav-brand-icon">
            <Icon name="bolt" size={16} />
          </div>
          <span className="nav-brand-text">StoryForge</span>
        </button>
        <div className="nav-links">
          <button className={`nav-link ${page === 'home' ? 'nav-link--active' : ''}`} onClick={() => onNavigate('home')}>
            <Icon name="home" size={16} />
            <span>首页</span>
          </button>
          <button className={`nav-link ${page === 'create' || page === 'result' ? 'nav-link--active' : ''}`} onClick={() => onNavigate('create')}>
            <Icon name="pen" size={16} />
            <span>创作</span>
          </button>
          <button className={`nav-link ${page === 'history' ? 'nav-link--active' : ''}`} onClick={() => onNavigate('history')}>
            <Icon name="clock" size={16} />
            <span>历史</span>
            {historyCount > 0 && <span className="nav-badge">{historyCount}</span>}
          </button>
          <button className={`nav-link ${page === 'dashboard' ? 'nav-link--active' : ''}`} onClick={() => onNavigate('dashboard')}>
            <Icon name="chart" size={16} />
            <span>看板</span>
          </button>
        </div>
        <div className="nav-shortcuts" title="快捷键: Ctrl+N 新建, Ctrl+H 历史">
          <Icon name="lightbulb" size={14} />
        </div>
      </div>
    </nav>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <span>StoryForge · 品牌故事创作助手</span>
      <span>Powered by AI</span>
    </footer>
  )
}
