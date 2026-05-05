export function CharCount({ current, max }) {
  const ratio = current / max
  return (
    <span className={`char-count ${ratio > 0.9 ? 'char-count--warn' : ''} ${ratio >= 1 ? 'char-count--over' : ''}`}>
      {current}/{max}
    </span>
  )
}
