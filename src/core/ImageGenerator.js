import { getAIConfig } from '../config/index.js'

const PROVIDERS = {
  siliconflow: {
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['stabilityai/stable-diffusion-3-5-large', 'black-forest-labs/FLUX.1-schnell', 'stabilityai/stable-diffusion-xl-base-1.0'],
    defaultModel: 'stabilityai/stable-diffusion-3-5-large',
  },
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['cogview-3-flash'],
    defaultModel: 'cogview-3-flash',
  },
}

export class ImageGenerator {
  constructor(config = {}) {
    this.provider = config.provider || 'siliconflow'
    this.apiKey = config.apiKey || process.env.SILICONFLOW_API_KEY || process.env.IMAGE_API_KEY
    this.model = config.model || PROVIDERS[this.provider]?.defaultModel
    this.timeout = config.timeout || 60000
  }

  async generate({ prompt, negativePrompt, width, height, seed }) {
    if (!this.apiKey) {
      return this._mockGenerate(prompt)
    }

    switch (this.provider) {
      case 'siliconflow':
        return this._generateSiliconFlow({ prompt, negativePrompt, width, height, seed })
      case 'zhipu':
        return this._generateZhipu({ prompt, width, height })
      default:
        return this._generateSiliconFlow({ prompt, negativePrompt, width, height, seed })
    }
  }

  async _generateSiliconFlow({ prompt, negativePrompt, width, height, seed }) {
    const providerConfig = PROVIDERS.siliconflow
    const model = this.model || providerConfig.defaultModel

    const body = {
      model,
      prompt,
      negative_prompt: negativePrompt || '',
      image_size: this._resolveSize(width, height),
      seed: seed || Math.floor(Math.random() * 2147483647),
      num_inference_steps: 20,
      guidance_scale: 7.5,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${providerConfig.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`SiliconFlow Image API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()

      if (data.images && data.images.length > 0) {
        const imageUrl = data.images[0].url
        const imageBase64 = await this._fetchImageAsBase64(imageUrl)
        return {
          success: true,
          imageData: imageBase64,
          prompt,
          model,
          provider: 'siliconflow',
          seed: data.seed || body.seed,
        }
      }

      throw new Error('No image returned from API')
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Image generation timed out')
      }
      throw error
    }
  }

  async _generateZhipu({ prompt, width, height }) {
    const providerConfig = PROVIDERS.zhipu
    const model = this.model || providerConfig.defaultModel

    const body = {
      model,
      prompt,
      size: this._resolveZhipuSize(width, height),
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${providerConfig.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Zhipu Image API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.data && data.data.length > 0) {
        const imageUrl = data.data[0].url
        const imageBase64 = await this._fetchImageAsBase64(imageUrl)
        return {
          success: true,
          imageData: imageBase64,
          prompt,
          model,
          provider: 'zhipu',
        }
      }

      throw new Error('No image returned from API')
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  async _fetchImageAsBase64(url) {
    try {
      const response = await fetch(url, { timeout: 30000 })
      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const contentType = response.headers.get('content-type') || 'image/png'
      return `data:${contentType};base64,${base64}`
    } catch {
      return url
    }
  }

  _mockGenerate(prompt) {
    const width = 800
    const height = 600
    const svg = this._generatePlaceholderSVG(prompt, width, height)
    const base64 = Buffer.from(svg).toString('base64')
    return {
      success: true,
      imageData: `data:image/svg+xml;base64,${base64}`,
      prompt,
      model: 'mock',
      provider: 'mock',
      isPlaceholder: true,
    }
  }

  _generatePlaceholderSVG(prompt, width, height) {
    const colors = ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2']
    const bg = colors[Math.floor(Math.random() * colors.length)]
    const accent = colors[Math.floor(Math.random() * colors.length)]
    const shortPrompt = prompt.substring(0, 60) + (prompt.length > 60 ? '...' : '')

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bg};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${accent};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" />
      <circle cx="${width * 0.3}" cy="${height * 0.4}" r="80" fill="rgba(255,255,255,0.1)" />
      <circle cx="${width * 0.7}" cy="${height * 0.6}" r="120" fill="rgba(255,255,255,0.05)" />
      <circle cx="${width * 0.5}" cy="${height * 0.5}" r="40" fill="rgba(255,255,255,0.15)" />
      <text x="${width / 2}" y="${height / 2 - 20}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="system-ui,sans-serif" font-size="18" font-weight="600">Brand Visual Asset</text>
      <text x="${width / 2}" y="${height / 2 + 15}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui,sans-serif" font-size="12">${shortPrompt}</text>
      <text x="${width / 2}" y="${height - 30}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-family="system-ui,sans-serif" font-size="10">Mock Preview - Configure API key for real generation</text>
    </svg>`
  }

  _resolveSize(width, height) {
    if (width && height) {
      const w = Math.min(Math.max(width, 256), 2048)
      const h = Math.min(Math.max(height, 256), 2048)
      return `${w}x${h}`
    }
    return '1024x1024'
  }

  _resolveZhipuSize(width, height) {
    const sizes = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440']
    if (width && height) {
      const ratio = width / height
      if (ratio > 1.5) return '1440x720'
      if (ratio > 1.1) return '1344x768'
      if (ratio < 0.7) return '720x1440'
      if (ratio < 0.9) return '768x1344'
    }
    return '1024x1024'
  }

  isAvailable() {
    return !!this.apiKey
  }

  getProviderInfo() {
    return {
      provider: this.provider,
      model: this.model,
      available: this.isAvailable(),
      supportedModels: PROVIDERS[this.provider]?.models || [],
    }
  }
}
