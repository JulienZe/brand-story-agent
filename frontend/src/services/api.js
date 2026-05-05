import { API_BASE } from '../constants'

class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request(url, options = {}) {
  const { retries = 2, retryDelay = 1000, timeout = 60000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  fetchOptions.signal = controller.signal

  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: { 'Content-Type': 'application/json', ...fetchOptions.headers },
        ...fetchOptions,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.error || `请求失败 (${response.status})`,
          response.status,
          errorData.code
        )
      }

      const data = await response.json()
      if (data.success === false) {
        throw new ApiError(data.error || '操作失败', data.status, data.code)
      }
      return data.data !== undefined ? data.data : data
    } catch (err) {
      clearTimeout(timeoutId)
      lastError = err
      if (err.name === 'AbortError') {
        throw new ApiError('请求超时，请检查网络连接', 408, 'TIMEOUT')
      }
      if (err instanceof ApiError) {
        if (err.status >= 400 && err.status < 500) throw err
      }
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)))
      }
    }
  }
  throw lastError instanceof ApiError ? lastError : new ApiError(lastError.message || '网络连接失败', 0, 'NETWORK_ERROR')
}

export async function createStory({ productName, productDesc, productFeatures, targetUser, tone }) {
  return request('/api/story/quick', {
    method: 'POST',
    body: JSON.stringify({
      productName,
      productDesc,
      productFeatures,
      targetUser: targetUser || undefined,
      options: { tone }
    }),
    timeout: 120000,
    retries: 1,
  })
}

export async function fetchTemplates() {
  return request('/api/templates')
}

export async function validateContent(content) {
  return request('/api/validate', {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export async function checkHealth() {
  return request('/health', { retries: 0, timeout: 5000 })
}

export async function getStories({ search, favoritesOnly, limit, offset } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (favoritesOnly) params.set('favorites', 'true')
  if (limit) params.set('limit', limit)
  if (offset) params.set('offset', offset)
  const qs = params.toString()
  return request(`/api/stories${qs ? '?' + qs : ''}`, { retries: 1 })
}

export async function getStory(id) {
  return request(`/api/stories/${id}`, { retries: 1 })
}

export async function saveStory(record) {
  return request('/api/stories', {
    method: 'POST',
    body: JSON.stringify(record),
    retries: 0,
  })
}

export async function deleteStory(id) {
  return request(`/api/stories/${id}`, {
    method: 'DELETE',
    retries: 0,
  })
}

export async function toggleFavorite(id) {
  return request(`/api/stories/${id}/favorite`, {
    method: 'PATCH',
    retries: 0,
  })
}

export async function getFavorites() {
  return request('/api/favorites', { retries: 1 })
}

export async function getStoryVersions(id) {
  return request(`/api/stories/${id}/versions`, { retries: 1 })
}

export async function getStoryVersion(id, version) {
  return request(`/api/stories/${id}/versions/${version}`, { retries: 1 })
}

export async function updateStoryContent(id, result) {
  return request(`/api/stories/${id}/content`, {
    method: 'PATCH',
    body: JSON.stringify({ result }),
    retries: 0,
  })
}

export async function updateStoryRating(id, rating) {
  return request(`/api/stories/${id}/rating`, {
    method: 'PATCH',
    body: JSON.stringify({ rating }),
    retries: 0,
  })
}

export async function regenerateSection(id, section, instruction) {
  return request(`/api/stories/${id}/regenerate/section`, {
    method: 'POST',
    body: JSON.stringify({ section, instruction }),
    timeout: 120000,
    retries: 1,
  })
}

export async function refineStory(id, instruction, sections) {
  return request(`/api/stories/${id}/refine`, {
    method: 'POST',
    body: JSON.stringify({ instruction, sections }),
    timeout: 120000,
    retries: 1,
  })
}

export async function getDashboard() {
  return request('/api/dashboard', { retries: 1 })
}

export function createStorySSE({ productName, productDesc, productFeatures, targetUser, tone }, callbacks = {}) {
  const params = new URLSearchParams()
  params.set('productName', productName)
  params.set('productDesc', productDesc)
  if (targetUser) params.set('targetUser', targetUser)
  if (tone) params.set('tone', tone)
  if (productFeatures?.length) params.set('features', productFeatures.join(','))

  const url = `${API_BASE}/api/story/create/stream?${params.toString()}`
  const eventSource = new EventSource(url)

  eventSource.addEventListener('connected', (e) => {
    callbacks.onConnected?.(JSON.parse(e.data))
  })

  eventSource.addEventListener('stage:start', (e) => {
    callbacks.onStageStart?.(JSON.parse(e.data))
  })

  eventSource.addEventListener('stage:complete', (e) => {
    callbacks.onStageComplete?.(JSON.parse(e.data))
  })

  eventSource.addEventListener('stage:text', (e) => {
    callbacks.onStageText?.(JSON.parse(e.data))
  })

  eventSource.addEventListener('stage:error', (e) => {
    callbacks.onStageError?.(JSON.parse(e.data))
  })

  eventSource.addEventListener('complete', (e) => {
    const data = JSON.parse(e.data)
    callbacks.onComplete?.(data)
    eventSource.close()
  })

  eventSource.addEventListener('error', (e) => {
    if (e.data) {
      try { callbacks.onError?.(JSON.parse(e.data)) } catch { callbacks.onError?.({ error: 'SSE连接错误' }) }
    } else {
      callbacks.onError?.({ error: 'SSE连接中断' })
    }
    eventSource.close()
  })

  return eventSource
}

export { ApiError }
