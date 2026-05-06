import { EnhancedContentGenerator } from './EnhancedContentGenerator.js'

const SCENE_PROMPT_TEMPLATE = `Based on the brand story content below, generate 3 image prompts for brand visual assets.

Brand: {brandName}
Story excerpt: {storyExcerpt}
Brand tone: {toneKeywords}
Brand colors: {colorPalette}

Generate 3 image prompts in the following categories:
1. SCENE IMAGE - A key scene from the story, showing the product in use
2. EMOTION IMAGE - An abstract or atmospheric image conveying the core emotion
3. PRODUCT IMAGE - A clean product showcase with lifestyle context

For each prompt, output JSON:
{
  "prompts": [
    {
      "type": "scene",
      "prompt": "English prompt for image generation, detailed, 50-100 words, no text/words in image",
      "negativePrompt": "blurry, low quality, text, watermark, logo, distorted",
      "aspectRatio": "16:9",
      "style": "photorealistic"
    },
    {
      "type": "emotion",
      "prompt": "...",
      "negativePrompt": "...",
      "aspectRatio": "1:1",
      "style": "artistic"
    },
    {
      "type": "product",
      "prompt": "...",
      "negativePrompt": "...",
      "aspectRatio": "4:5",
      "style": "commercial"
    }
  ]
}

Important rules:
- All prompts must be in English
- No text, words, letters in generated images
- Match brand color palette where possible
- Style should align with brand personality
- Each prompt should be specific and detailed enough for Stable Diffusion / FLUX`

const POSTER_PROMPT_TEMPLATE = `Generate a background image prompt for a brand poster.

Brand: {brandName}
Product: {productName}
Brand personality: {personality}
Brand colors: {colorPalette}
Poster style: {posterStyle}

Output JSON:
{
  "backgroundPrompt": "English prompt for poster background, abstract or scene-based, no text",
  "negativePrompt": "text, words, letters, blurry, low quality",
  "moodKeywords": ["keyword1", "keyword2", "keyword3"]
}`

export class ImagePromptBuilder {
  constructor(config = {}) {
    this.contentGenerator = new EnhancedContentGenerator(config)
  }

  async buildStoryImagePrompts({ brandName, storyContent, toneKeywords, colorPalette }) {
    const excerpt = this._extractExcerpt(storyContent, 500)
    const userPrompt = SCENE_PROMPT_TEMPLATE
      .replace('{brandName}', brandName || 'Unknown Brand')
      .replace('{storyExcerpt}', excerpt)
      .replace('{toneKeywords}', (toneKeywords || []).join(', ') || 'professional, warm')
      .replace('{colorPalette}', (colorPalette || []).join(', ') || 'blue, white')

    try {
      const result = await this.contentGenerator.generate(
        { system: 'You are a professional visual art director specializing in brand imagery. Always respond with valid JSON.', user: userPrompt },
        { expectJson: true }
      )

      if (result.prompts && Array.isArray(result.prompts)) {
        return this._validateAndFixPrompts(result.prompts, brandName, colorPalette)
      }
      return this._generateFallbackPrompts(brandName, excerpt, colorPalette)
    } catch (error) {
      console.warn('[ImagePromptBuilder] AI prompt generation failed:', error.message)
      return this._generateFallbackPrompts(brandName, excerpt, colorPalette)
    }
  }

  async buildPosterBackgroundPrompt({ brandName, productName, personality, colorPalette, posterStyle }) {
    const userPrompt = POSTER_PROMPT_TEMPLATE
      .replace('{brandName}', brandName || 'Brand')
      .replace('{productName}', productName || 'Product')
      .replace('{personality}', JSON.stringify(personality || {}))
      .replace('{colorPalette}', (colorPalette || []).join(', ') || 'blue, white')
      .replace('{posterStyle}', posterStyle || 'modern minimal')

    try {
      const result = await this.contentGenerator.generate(
        { system: 'You are a professional graphic designer. Always respond with valid JSON.', user: userPrompt },
        { expectJson: true }
      )

      if (result.backgroundPrompt) {
        return {
          backgroundPrompt: result.backgroundPrompt,
          negativePrompt: result.negativePrompt || 'text, blurry, low quality',
          moodKeywords: result.moodKeywords || ['modern', 'clean'],
        }
      }
      return this._fallbackPosterPrompt(brandName, colorPalette)
    } catch (error) {
      console.warn('[ImagePromptBuilder] Poster prompt generation failed:', error.message)
      return this._fallbackPosterPrompt(brandName, colorPalette)
    }
  }

  buildSocialCardPrompt({ brandName, platform, title, colorPalette }) {
    const platformConfigs = {
      xiaohongshu: { ratio: '3:4', style: 'lifestyle aesthetic, warm tones, cozy atmosphere' },
      wechat: { ratio: '2.35:1', style: 'professional editorial, clean layout, sophisticated' },
      douyin: { ratio: '9:16', style: 'dynamic, vibrant, eye-catching, trendy' },
      weibo: { ratio: '16:9', style: 'bold, impactful, modern design' },
      moments: { ratio: '1:1', style: 'minimalist, elegant, premium feel' },
    }

    const config = platformConfigs[platform] || platformConfigs.wechat
    const colors = (colorPalette || []).join(', ') || 'brand colors'

    return {
      prompt: `Social media cover image for ${brandName}, ${config.style}, featuring ${colors} color scheme, ${title || 'brand story'}, no text, high quality, ${config.ratio} aspect ratio`,
      negativePrompt: 'text, words, letters, watermark, blurry, low resolution, distorted',
      aspectRatio: config.ratio,
      style: config.style,
      platform,
    }
  }

  _extractExcerpt(storyContent, maxLen) {
    if (!storyContent) return ''
    if (typeof storyContent === 'object') {
      const parts = []
      if (storyContent.brandStory?.content) parts.push(storyContent.brandStory.content)
      if (storyContent.productValue?.coreValue) parts.push(storyContent.productValue.coreValue)
      if (storyContent.scenarios?.[0]?.title) parts.push(storyContent.scenarios[0].title)
      storyContent = parts.join('. ')
    }
    const text = String(storyContent).replace(/[#*_\n]/g, ' ').replace(/\s+/g, ' ').trim()
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text
  }

  _validateAndFixPrompts(prompts, brandName, colorPalette) {
    const validTypes = ['scene', 'emotion', 'product']
    const colors = (colorPalette || []).join(', ') || 'brand colors'

    return prompts.map((p, i) => ({
      type: validTypes.includes(p.type) ? p.type : validTypes[i] || 'scene',
      prompt: (p.prompt || `Professional brand photography for ${brandName}, ${colors}, high quality, no text`).substring(0, 300),
      negativePrompt: p.negativePrompt || 'blurry, low quality, text, watermark, distorted',
      aspectRatio: p.aspectRatio || (p.type === 'product' ? '4:5' : p.type === 'emotion' ? '1:1' : '16:9'),
      style: p.style || 'photorealistic',
    }))
  }

  _generateFallbackPrompts(brandName, excerpt, colorPalette) {
    const colors = (colorPalette || []).join(', ') || 'blue, white'
    return [
      {
        type: 'scene',
        prompt: `Cinematic scene depicting ${brandName} product in real-life usage, ${colors} color palette, warm lighting, professional photography, lifestyle context, no text`,
        negativePrompt: 'blurry, low quality, text, watermark, distorted',
        aspectRatio: '16:9',
        style: 'photorealistic',
      },
      {
        type: 'emotion',
        prompt: `Abstract atmospheric image conveying warmth and trust for ${brandName} brand, ${colors} gradient, soft bokeh, emotional connection, no text`,
        negativePrompt: 'blurry, low quality, text, watermark, distorted, harsh',
        aspectRatio: '1:1',
        style: 'artistic',
      },
      {
        type: 'product',
        prompt: `Clean product showcase for ${brandName}, ${colors} background, studio lighting, commercial photography, premium feel, no text`,
        negativePrompt: 'blurry, low quality, text, watermark, distorted, cluttered',
        aspectRatio: '4:5',
        style: 'commercial',
      },
    ]
  }

  _fallbackPosterPrompt(brandName, colorPalette) {
    const colors = (colorPalette || []).join(', ') || 'blue, white'
    return {
      backgroundPrompt: `Elegant abstract background for ${brandName} brand poster, ${colors} gradient, modern minimalist, premium texture, no text`,
      negativePrompt: 'text, words, letters, blurry, low quality',
      moodKeywords: ['modern', 'elegant', 'premium'],
    }
  }
}
