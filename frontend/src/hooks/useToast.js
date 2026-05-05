import { useState } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type, key: Date.now() })
  }
  const hideToast = () => setToast(null)
  return { toast, showToast, hideToast }
}
