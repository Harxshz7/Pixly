// Pixly Phase 3 — Markdown Export
// Converts a result object (analysis + code + variations) into clean Markdown.

/**
 * Export a result (or history entry) as a Markdown string.
 *
 * @param {object} entry - History entry or result object containing:
 *   @param {string} [entry.type] - 'text' | 'image' | 'ui'
 *   @param {string} [entry.result] - Raw Phase 1 markdown result
 *   @param {object} [entry.analysis] - Structured Phase 2 analysis
 *   @param {string} [entry.codeResult] - Generated code
 *   @param {string} [entry.codeFormat] - Code format used
 *   @param {Array} [entry.variations] - Variations array
 *   @param {string} [entry.pageUrl] - Source URL
 *   @param {string} [entry.pageTitle] - Source page title
 *   @param {number} [entry.timestamp] - When it was saved
 * @returns {string} Markdown string
 */
export function exportToMarkdown(entry) {
  const lines = []

  // Title
  const title = entry.pageTitle || entry.snippet || 'Pixly Analysis'
  lines.push(`# ${title}`)
  lines.push('')

  // Metadata
  const typeLabels = { text: 'Text Explanation', image: 'Image Analysis', ui: 'UI Analysis' }
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
    if (a.style) {
      lines.push('## Style')
      lines.push('')
      lines.push(`**${a.style.type}** (${a.style.confidence || 'medium'} confidence)`)
      if (a.style.description) lines.push(a.style.description)
      lines.push('')
    }

    // Theme
    if (a.theme) {
      lines.push('## Theme')
      lines.push('')
      lines.push(`Mode: **${a.theme.mode === 'dark' ? '🌙 Dark' : '☀️ Light'}** (luminance: ${a.theme.luminance})`)
      lines.push('')
    }

    // Colors
    if (a.colors && a.colors.length > 0) {
      lines.push('## Color Palette')
      lines.push('')
      lines.push('| Color | Hex | RGB | Coverage |')
      lines.push('|-------|-----|-----|----------|')
      for (const c of a.colors) {
        const rgb = c.rgb ? `rgb(${c.rgb.join(', ')})` : ''
        lines.push(`| ![](${c.hex}) | \`${c.hex}\` | ${rgb} | ${c.percentage || ''}% |`)
      }
      lines.push('')
    }

    // Typography
    if (a.typography) {
      lines.push('## Typography')
      lines.push('')
      if (a.typography.families && a.typography.families.length > 0) {
        lines.push(`**Font Family:** ${a.typography.families.filter(Boolean).join(', ')}`)
        lines.push('')
      }
      if (a.typography.hierarchy) {
        lines.push('| Level | Size | Weight |')
        lines.push('|-------|------|--------|')
        for (const [level, info] of Object.entries(a.typography.hierarchy)) {
          lines.push(`| ${level} | ${info.approximateSize || '?'} | ${info.weight || '?'} |`)
        }
        lines.push('')
      }
    }

    // Components
    if (a.components && a.components.length > 0) {
      lines.push('## Components')
      lines.push('')
      for (const comp of a.components) {
        lines.push(`- **${comp.name}** (${comp.type}) — ${comp.position || 'unknown'}`)
        if (comp.description) lines.push(`  ${comp.description}`)
      }
      lines.push('')
    }

    // Design Tokens
    if (a.tokens) {
      lines.push('## Design Tokens')
      lines.push('')

      if (a.tokens.spacing && a.tokens.spacing.scale) {
        lines.push(`**Spacing:** ${a.tokens.spacing.scale.map((v) => `${v}px`).join(', ')}`)
        if (a.tokens.spacing.description) lines.push(`_${a.tokens.spacing.description}_`)
        lines.push('')
      }

      if (a.tokens.radius && a.tokens.radius.values) {
        lines.push(`**Border Radius:** ${a.tokens.radius.values.map((v) => `${v}px`).join(', ')}`)
        if (a.tokens.radius.description) lines.push(`_${a.tokens.radius.description}_`)
        lines.push('')
      }

      if (a.tokens.shadows && a.tokens.shadows.length > 0) {
        lines.push('**Shadows:**')
        lines.push('')
        for (const s of a.tokens.shadows) {
          lines.push(`- \`${s.definition}\`${s.description ? ` — ${s.description}` : ''}`)
        }
        lines.push('')
      }
    }
  }

  // Code Output
  if (entry.codeResult) {
    const langMap = {
      'react-tailwind': 'jsx',
      'html-css': 'html',
      vue: 'vue',
      flutter: 'dart',
    }
    const lang = langMap[entry.codeFormat] || 'html'
    lines.push('## Code Output')
    lines.push('')
    lines.push(`_${entry.codeFormat || 'html-css'}_`)
    lines.push('')
    lines.push(`\`\`\`${lang}`)
    lines.push(entry.codeResult)
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
      if (v.description) lines.push(v.description)
      lines.push('')
      if (v.prompt) {
        lines.push('```')
        lines.push(v.prompt)
        lines.push('```')
      }
      lines.push('')
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
  // Try chrome.downloads API first (works in extension context)
  if (typeof chrome !== 'undefined' && chrome.downloads) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    try {
      await chrome.downloads.download({
        url,
        filename: `${filename}.md`,
        saveAs: true,
      })
      return
    } catch {
      // Fall through to data URL method
    }
  }

  // Fallback: data URL download (works in options page / side panel)
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
