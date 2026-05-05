export function cleanStoryContent(content) {
  if (!content || typeof content !== 'string') return ''
  let cleaned = content
  cleaned = cleaned.replace(/" "(\s*" ")*/g, '')
  cleaned = cleaned.replace(/\s{3,}/g, '\n\n')
  const lines = cleaned.split('\n')
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) { result.push(''); continue }
    if (/^(但|却|直到|突然|并|在那一刻|他|她|它|我)$/.test(line) && i + 1 < lines.length) {
      lines[i + 1] = line + lines[i + 1]
      continue
    }
    const prevLine = result.length > 0 ? result[result.length - 1] : ''
    if (prevLine && line.length <= 4 && /^[^\s##\-*>]/.test(line) && !/^[0-9]+$/.test(line)) {
      result[result.length - 1] = prevLine + line
      continue
    }
    result.push(line)
  }
  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function renderMarkdownContent(content) {
  if (!content) return []
  const cleaned = cleanStoryContent(content)
  return cleaned.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return { type: 'h2', text: line.replace(/^#+\s*/, ''), key: i }
    if (line.startsWith('## ')) return { type: 'h3', text: line.replace(/^#+\s*/, ''), key: i }
    if (line.startsWith('### ')) return { type: 'h4', text: line.replace(/^#+\s*/, ''), key: i }
    if (line.startsWith('**') && line.endsWith('**')) return { type: 'h3', text: line.replace(/\*\*/g, ''), key: i }
    if (line.startsWith('- ')) return { type: 'li', text: line.replace('- ', ''), key: i }
    if (line.trim() === '---') return { type: 'hr', key: i }
    if (line.trim() === '') return { type: 'empty', key: i }
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    if (parts.length > 1) {
      return {
        type: 'p-bold',
        parts: parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) return { bold: true, text: part.slice(2, -2), key: j }
          return { bold: false, text: part, key: j }
        }),
        key: i
      }
    }
    return { type: 'p', text: line, key: i }
  })
}

export function exportJSON(data, filename) {
  const text = JSON.stringify(data, null, 2)
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportMarkdown(content, filename) {
  if (!content) return false
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.md`
  a.click()
  URL.revokeObjectURL(url)
  return true
}

export function buildFullMarkdown(result, productName) {
  if (!result) return ''
  const lines = []
  lines.push(`# ${productName} 品牌文档`)
  lines.push('')

  if (result.productValue) {
    const v = result.productValue
    lines.push('## 产品价值')
    lines.push('')
    if (v.coreValue) lines.push(`**核心价值主张**: ${v.coreValue}`)
    if (v.extended) lines.push(v.extended)
    lines.push('')
    if (v.differentiation?.competitiveAdvantage) {
      lines.push(`**竞争优势**: ${v.differentiation.competitiveAdvantage}`)
    }
    if (v.differentiation?.marketPosition) {
      lines.push(`**市场定位**: ${v.differentiation.marketPosition}`)
    }
    if (v.differentiation?.uniquePoints?.length) {
      lines.push('')
      lines.push('### 独特卖点')
      v.differentiation.uniquePoints.forEach(p => {
        lines.push(`- ${typeof p === 'string' ? p : p.point || p.description || JSON.stringify(p)}`)
      })
    }
    if (v.keyFeatures?.length) {
      lines.push('')
      lines.push('### 核心功能价值')
      v.keyFeatures.forEach(f => {
        if (typeof f === 'string') { lines.push(`- ${f}`) }
        else { lines.push(`- **${f.feature}**: ${f.benefit || ''}`) }
      })
    }
    if (v.painSolutions?.length) {
      lines.push('')
      lines.push('### 痛点解决方案')
      v.painSolutions.forEach(ps => {
        lines.push(`- 痛点: ${ps.pain} → 方案: ${ps.solution}`)
      })
    }
    lines.push('')
  }

  if (result.userProfile) {
    const p = result.userProfile
    lines.push('## 用户画像')
    lines.push('')
    if (p.persona?.name) lines.push(`**用户名称**: ${p.persona.name}`)
    if (p.persona?.archetype) lines.push(`**用户原型**: ${p.persona.archetype}`)
    if (p.persona?.description) lines.push(p.persona.description)
    if (p.persona?.quote) lines.push(`> "${p.persona.quote}"`)
    if (p.painPoints?.length) {
      lines.push('')
      lines.push('### 用户痛点')
      p.painPoints.forEach(pt => {
        lines.push(`- ${typeof pt === 'string' ? pt : pt.pain || pt.description || JSON.stringify(pt)}`)
      })
    }
    if (p.emotionalNeeds?.length) {
      lines.push('')
      lines.push('### 需求偏好')
      p.emotionalNeeds.forEach(n => {
        lines.push(`- ${typeof n === 'string' ? n : n.need || n.description || JSON.stringify(n)}`)
      })
    }
    if (p.motivationTriggers?.length) {
      lines.push('')
      lines.push('### 使用动机')
      p.motivationTriggers.forEach(m => {
        lines.push(`- ${typeof m === 'string' ? m : m.trigger || JSON.stringify(m)}`)
      })
    }
    lines.push('')
  }

  if (result.scenarios?.length) {
    lines.push('## 使用场景')
    lines.push('')
    result.scenarios.forEach((s, i) => {
      lines.push(`### 场景${i + 1}: ${s.title || ''}`)
      if (s.character?.name) lines.push(`**角色**: ${s.character.name}${s.character.role ? ` · ${s.character.role}` : ''}`)
      if (s.setting?.time || s.setting?.place) {
        lines.push(`**场景**: ${[s.setting.time, s.setting.place].filter(Boolean).join('，')}`)
      }
      if (s.plot?.setup) lines.push(`- 背景: ${s.plot.setup}`)
      if (s.plot?.conflict) lines.push(`- 冲突: ${s.plot.conflict}`)
      if (s.plot?.climax) lines.push(`- 产品介入: ${s.plot.climax}`)
      if (s.plot?.resolution) lines.push(`- 解决: ${s.plot.resolution}`)
      if (s.expectedEffect) lines.push(`**预期效果**: ${s.expectedEffect}`)
      lines.push('')
    })
  }

  if (result.brandStory?.content) {
    lines.push('## 品牌故事')
    lines.push('')
    lines.push(result.brandStory.content)
    lines.push('')
  }

  return lines.join('\n')
}

export function exportPDF(productName) {
  document.title = `${productName}_品牌文档`
  window.print()
}
