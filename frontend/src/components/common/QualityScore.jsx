export function QualityScore({ score, label, grade: externalGrade }) {
  const clampedScore = Math.min(100, Math.max(0, score || 0))
  const getGrade = (s) => {
    if (s >= 90) return { grade: 'A', color: '#2D6A4F' }
    if (s >= 75) return { grade: 'B', color: '#1B4332' }
    if (s >= 60) return { grade: 'C', color: '#B8860B' }
    return { grade: 'D', color: '#9B2C2C' }
  }
  const { grade: computedGrade, color } = getGrade(clampedScore)
  const grade = externalGrade || computedGrade
  return (
    <div className="quality-score">
      <div className="quality-score-ring">
        <svg viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-paper-cream)" strokeWidth="5" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${(clampedScore / 100) * 213.6} 213.6`}
            strokeLinecap="round" transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dasharray 1s var(--ease-out-expo)' }} />
        </svg>
        <div className="quality-score-value" style={{ color }}>{grade}</div>
      </div>
      {label && <div className="quality-score-label">{label}</div>}
    </div>
  )
}
