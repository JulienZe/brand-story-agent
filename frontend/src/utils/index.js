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
