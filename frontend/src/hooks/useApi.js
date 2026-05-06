import { useState, useCallback } from 'react'
import { ApiError } from '../services/api'

export function useApi(apiFn, { onSuccess, onError } = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn(...args)
      onSuccess?.(result)
      return result
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError(err.message, 0, 'UNKNOWN')
      setError(apiErr)
      onError?.(apiErr)
      throw apiErr
    } finally {
      setLoading(false)
    }
  }, [apiFn, onSuccess, onError])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
  }, [])

  return { loading, error, execute, reset }
}
