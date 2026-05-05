import { Icon } from '../common/Icon'

export function PageHome({ onNavigate, historyCount }) {
  return (
    <div className="page page-home">
      <section className="hero">
        <div className="hero-badge">
          <Icon name="sparkles" size={14} />
          <span>AI驱动</span>
        </div>
        <h1 className="hero-title">
          让每个产品<br /><span className="hero-title-accent">都有动人故事</span>
        </h1>
        <p className="hero-desc">
          基于先进AI技术，将产品特性转化为引人入胜的品牌叙事。
          从价值洞察到场景构建，一站式完成专业级品牌内容创作。
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('create')}>
            <Icon name="pen" size={18} />
            开始创作
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => onNavigate('history')}>
            <Icon name="clock" size={18} />
            历史记录
            {historyCount > 0 && <span className="badge">{historyCount}</span>}
          </button>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">5</span>
            <span className="hero-stat-label">创作阶段</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">6</span>
            <span className="hero-stat-label">行业模板</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">5</span>
            <span className="hero-stat-label">内容维度</span>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-label">核心能力</div>
        <div className="features-grid">
          {[
            { icon: 'bolt', title: '产品价值提炼', desc: '深度分析产品特性，提炼核心价值主张与差异化优势' },
            { icon: 'user', title: '用户画像洞察', desc: '构建精准用户画像，洞察痛点需求与情感驱动力' },
            { icon: 'film', title: '场景叙事构建', desc: '设计沉浸式使用场景，让用户身临其境感受产品价值' },
            { icon: 'book', title: '品牌故事创作', desc: '融合情感共鸣与品牌调性，创作打动人心的品牌叙事' },
          ].map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon-wrap">
                <Icon name={f.icon} size={22} />
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <div className="features-label">创作流程</div>
        <div className="steps-flow">
          {[
            { num: '01', title: '选择模板', desc: '根据产品类型选择创作风格' },
            { num: '02', title: '填写信息', desc: '输入产品名称、描述和特点' },
            { num: '03', title: 'AI创作', desc: '五阶段工作流自动生成内容' },
            { num: '04', title: '查看导出', desc: '浏览结构化结果并一键导出' },
          ].map((s, i) => (
            <div key={i} className="step-item" style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="step-num">{s.num}</div>
              <div className="step-content">
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
              {i < 3 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <div className="cta-card">
          <div className="cta-content">
            <h3>准备好创作你的品牌故事了吗？</h3>
            <p>只需三步，AI将为你生成专业的品牌叙事内容</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('create')}>
            <Icon name="pen" size={18} />
            立即开始
          </button>
        </div>
      </section>
    </div>
  )
}
