import { useEffect } from 'react'
import { Icon } from './Icon'

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`toast toast--${type}`}>
      <Icon name={type === 'success' ? 'check' : type === 'error' ? 'x' : 'info'} size={16} />
      <span>{message}</span>
    </div>
  )
}
