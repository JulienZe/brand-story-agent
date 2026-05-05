export function Skeleton({ width, height, radius, className }) {
  return (
    <div
      className={`skeleton ${className || ''}`}
      style={{ width: width || '100%', height: height || '16px', borderRadius: radius || 'var(--radius-md)' }}
    />
  )
}

export function SkeletonCard({ lines = 3, hasAvatar }) {
  return (
    <div className="skeleton-card">
      {hasAvatar && (
        <div className="skeleton-card-header">
          <Skeleton width="40px" height="40px" radius="50%" />
          <div className="skeleton-card-header-text">
            <Skeleton width="120px" height="14px" />
            <Skeleton width="80px" height="12px" />
          </div>
        </div>
      )}
      <div className="skeleton-card-body">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            height="14px"
            width={i === lines - 1 ? '60%' : '100%'}
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonStory() {
  return (
    <div className="skeleton-story">
      <div className="skeleton-story-meta">
        <Skeleton width="60px" height="24px" radius="var(--radius-full)" />
        <Skeleton width="80px" height="24px" radius="var(--radius-full)" />
        <Skeleton width="100px" height="24px" radius="var(--radius-full)" />
      </div>
      <Skeleton width="70%" height="28px" />
      <Skeleton width="100%" height="16px" />
      <Skeleton width="100%" height="16px" />
      <Skeleton width="90%" height="16px" />
      <Skeleton width="100%" height="16px" />
      <Skeleton width="75%" height="16px" />
      <div style={{ height: '8px' }} />
      <Skeleton width="50%" height="22px" />
      <Skeleton width="100%" height="16px" />
      <Skeleton width="95%" height="16px" />
      <Skeleton width="85%" height="16px" />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard">
      <Skeleton width="200px" height="32px" />
      <div className="skeleton-dashboard-stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-dashboard-stat">
            <Skeleton width="40px" height="40px" radius="var(--radius-lg)" />
            <div>
              <Skeleton width="60px" height="12px" />
              <Skeleton width="40px" height="24px" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton width="100%" height="200px" radius="var(--radius-lg)" />
    </div>
  )
}

export function PageTransition({ children, show }) {
  return (
    <div className={`page-transition ${show ? 'page-transition--visible' : ''}`}>
      {children}
    </div>
  )
}
