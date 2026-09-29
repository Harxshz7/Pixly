// Pixly Phase 3 — Markdown Export
// Converts a result object (analysis + code + variations) into clean Markdown.

/**
 * Export a result (or history entry) as a Markdown string.
 *
 * @param {object} entry - History entry or result object containing:
 *   @param {string} [entry.type] - 'text' | 'image' | 'ui' | 'box'
 *   @param {string} [entry.result] - Raw Phase 1 markdown result
 *   @param {object} [entry.analysis] - Structured Phase 2 analysis
 *   @param {string} [entry.codeResult] - Generated code
 *   @param {string} [entry.codeFormat] - Code format used
 *   @param {string} [entry.format] - Alias for codeFormat
 *   @param {Array} [entry.variations] - Variations array
 *   @param {string} [entry.pageUrl] - Source URL
 *   @param {string} [entry.pageTitle] - Source page title
 *   @param {number} [entry.timestamp] - When it was saved
 * @returns {string} Markdown string
 */
export function exportToMarkdown(entry = {}) {
  const lines = []

  // Title
  const title = entry.pageTitle || entry.snippet || 'Pixly Analysis'
  lines.push(`# ${title}`)
  lines.push('')

  // Metadata
  const typeLabels = { text: 'Text Explanation', image: 'Image Analysis', ui: 'UI Analysis', box: 'Box Capture' }
  lines.push(`**Type:** ${typeLabels[entry.type] || 'Analysis'}`)
  if (entry.timestamp) {
    lines.push(`**Date:** ${new Date(entry.timestamp).toLocaleString()}`)
  }
  if (entry.pageUrl) {
    lines.push(`**Source:** ${entry.pageUrl}`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')

  // Phase 1: Raw result
  if (entry.result && !entry.analysis) {
    lines.push(entry.result)
    lines.push('')
  }

  // Phase 2: Structured analysis sections
  if (entry.analysis) {
    const a = entry.analysis

    // Style
    if (a.style && (a.style.type || a.style.description)) {
      lines.push('## Style')
      lines.push('')
      if (a.style.type) {
        lines.push(`**${a.style.type}**${a.style.confidence ? ` (${a.style.confidence} confidence)` : ''}`)
      }
      if (a.style.description) {
        lines.push(a.style.description)
      }
      lines.push('')
    }

    // Theme
    if (a.theme && (a.theme.mode || a.theme.luminance !== undefined)) {
      lines.push('## Theme')
      lines.push('')
      const modeStr = a.theme.mode === 'dark' ? '🌙 Dark' : '☀️ Light'
      const lumStr = a.theme.luminance !== undefined ? ` (luminance: ${a.theme.luminance})` : ''
      lines.push(`Mode: **${modeStr}**${lumStr}`)
      lines.push('')
    }

    // Colors
    if (a.colors && a.colors.length > 0) {
      lines.push('## Colors')
      lines.push('')
      lines.push('| Color | Hex | RGB | Coverage |')
      lines.push('|---|---|---|---|')
      for (const c of a.colors) {
        const hex = c.hex || ''
        const rgb = c.rgb ? `rgb(${c.rgb.join(', ')})` : ''
        const cov = c.percentage !== undefined ? `${c.percentage}%` : (c.coverage !== undefined ? `${c.coverage}%` : '')
        lines.push(`| \`${hex}\` | \`${hex}\` | ${rgb} | ${cov} |`)
      }
      lines.push('')
    }

    // Typography
    const hasFamilies = a.typography?.families && a.typography.families.length > 0
    const hasHierarchy = a.typography?.hierarchy && Object.keys(a.typography.hierarchy).length > 0
    if (hasFamilies || hasHierarchy) {
      lines.push('## Typography')
      lines.push('')
      if (hasFamilies) {
        lines.push(`**Font Families:** ${a.typography.families.filter(Boolean).join(', ')}`)
        lines.push('')
      }
      if (hasHierarchy) {
        lines.push('| Level | Size | Weight |')
        lines.push('|---|---|---|')
        for (const [level, info] of Object.entries(a.typography.hierarchy)) {
          lines.push(`| ${level} | ${info?.approximateSize || info?.size || '?'} | ${info?.weight || '?'} |`)
        }
        lines.push('')
      }
    }

    // Components
    if (a.components && a.components.length > 0) {
      lines.push('## Components')
      lines.push('')
      for (const comp of a.components) {
        const name = comp.name || 'Component'
        const type = comp.type ? ` (${comp.type})` : ''
        const pos = comp.position ? ` — ${comp.position}` : ''
        lines.push(`- **${name}**${type}${pos}`)
        if (comp.description) lines.push(`  ${comp.description}`)
      }
      lines.push('')
    }

    // Design Tokens
    const hasSpacing = a.tokens?.spacing && (a.tokens.spacing.scale?.length > 0 || a.tokens.spacing.values?.length > 0)
    const hasRadius = a.tokens?.radius && (a.tokens.radius.values?.length > 0 || a.tokens.radius.scale?.length > 0)
    const hasShadows = a.tokens?.shadows && a.tokens.shadows.length > 0
    if (hasSpacing || hasRadius || hasShadows) {
      lines.push('## Tokens')
      lines.push('')

      if (hasSpacing) {
        const scale = a.tokens.spacing.scale || a.tokens.spacing.values || []
        lines.push(`**Spacing:** ${scale.map((v) => (typeof v === 'number' ? `${v}px` : v)).join(', ')}`)
        if (a.tokens.spacing.description) lines.push(`_${a.tokens.spacing.description}_`)
        lines.push('')
      }

      if (hasRadius) {
        const values = a.tokens.radius.values || a.tokens.radius.scale || []
        lines.push(`**Border Radius:** ${values.map((v) => (typeof v === 'number' ? `${v}px` : v)).join(', ')}`)
        if (a.tokens.radius.description) lines.push(`_${a.tokens.radius.description}_`)
        lines.push('')
      }

      if (hasShadows) {
        lines.push('**Shadows:**')
        lines.push('')
        for (const s of a.tokens.shadows) {
          const def = s.definition || s.value || s
          const desc = s.description ? ` — ${s.description}` : ''
          lines.push(`- \`${def}\`${desc}`)
        }
        lines.push('')
      }
    }
  }

  // Code Output
  const code = entry.codeResult
  if (code) {
    const format = entry.codeFormat || entry.format || 'html-css'
    const langMap = {
      'react-tailwind': 'jsx',
      'html-css': 'html',
      vue: 'vue',
      flutter: 'dart',
    }
    const lang = langMap[format] || 'html'
    lines.push('## Code')
    lines.push('')
    lines.push(`*Format: ${format}*`)
    lines.push('')
    lines.push(`\`\`\`${lang}`)
    lines.push(code)
    lines.push('```')
    lines.push('')
  }

  // Variations
  if (entry.variations && entry.variations.length > 0) {
    lines.push('## Variations')
    lines.push('')
    for (let i = 0; i < entry.variations.length; i++) {
      const v = entry.variations[i]
      lines.push(`### ${v.title || `Variation ${i + 1}`}`)
      lines.push('')
      if (v.approach) lines.push(`**Approach:** ${v.approach}`)
      if (v.description) lines.push(v.description)
      lines.push('')
      if (v.prompt) {
        lines.push('```')
        lines.push(v.prompt)
        lines.push('```')
        lines.push('')
      }
    }
  }

  lines.push('---')
  lines.push('*Exported by Pixly*')
  lines.push('')

  return lines.join('\n')
}

/**
 * Download a string as a file.
 * Uses chrome.downloads API if available, falls back to Blob + data URL.
 *
 * @param {string} content - File content
 * @param {string} filename - Filename (without extension)
 * @param {string} [mimeType='text/markdown'] - MIME type
 */
export async function downloadFile(content, filename, mimeType = 'text/markdown') {
  const safeFilename = `${filename.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().slice(0, 60) || 'pixly-export'}.md`

  // Try chrome.downloads API first (works in extension context)
  if (typeof chrome !== 'undefined' && chrome.downloads?.download) {
    try {
      const dataUrl = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content)
      await chrome.downloads.download({
        url: dataUrl,
        filename: safeFilename,
        saveAs: true,
      })
      return
    } catch {
      // Fall through to DOM fallback
    }
  }

  // Fallback: Blob URL download via hidden link
  if (typeof document !== 'undefined') {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = safeFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

