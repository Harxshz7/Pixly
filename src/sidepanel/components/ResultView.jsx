import React, { useRef, useState, useCallback } from 'react'
import CopyButton from './CopyButton.jsx'
import ColorPalette from './ColorPalette.jsx'
import TypographyPanel from './TypographyPanel.jsx'
import ComponentBreakdown from './ComponentBreakdown.jsx'
import DesignTokens from './DesignTokens.jsx'
import FormatSelector from './FormatSelector.jsx'
import VariationsPanel from './VariationsPanel.jsx'
import { highlightCode, detectLanguage } from '../../lib/utils/highlighter.js'
import { copyToClipboard } from '../../lib/utils/clipboard.js'

const ACTION_BADGES = {
  'explain-text': { label: 'Text Explanation', icon: '📝' },
  'analyze-image': { label: 'Image Analysis', icon: '🖼️' },
  'recreate-ui': { label: 'UI Recreation', icon: '🎨' },
  'screenshot-area': { label: 'Screenshot Analysis', icon: '📸' },
  'ui-analysis-full': { label: 'UI Analysis', icon: '🔍' },
}

/**
 * Simple markdown-to-HTML renderer (no external deps).
 */
function renderMarkdown(text) {
  if (!text) return ''
  let html = text
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<pre class="md-code-block"><code>${escaped}</code></pre>`
  })
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  html = html.replace(/^---$/gm, '<hr />')
  html = html.replace(/\n\n/g, '</p><p>')
  html = html.replace(/\n/g, '<br />')
  if (!html.startsWith('<')) html = `<p>${html}</p>`
  return html
}

/**
 * Code block with syntax highlighting and copy button.
 */
function CodeBlock({ code, format }) {
  const [copied, setCopied] = useState(false)
  const lang = detectLanguage(format)

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(code)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [code])

  if (!code) return <div className="code-loading">Generating code...</div>

  return (
    <div className="code-block-wrapper">
      <button className="code-copy-btn" onClick={handleCopy} title="Copy code">
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <pre className="code-block">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code, lang) }} />
      </pre>
    </div>
  )
}

/**
 * ResultView — displays either raw text (Phase 1) or structured analysis (Phase 2).
 */
export default function ResultView({
  result,
  action,
  analysis,
  codeResult,
  codeFormat,
  variations,
  onFormatChange,
  onGenerateVariations,
}) {
  const contentRef = useRef(null)

  // Phase 2: Structured analysis view
  if (analysis) {
    return (
      <div className="result-view">
        {/* Badges row */}
        <div className="result-header">
          <div className="badges-row">
            {analysis.style && (
              <span className="badge badge-style">
                {analysis.style.type}
                {analysis.style.confidence && (
                  <span className="badge-confidence">{analysis.style.confidence}</span>
                )}
              </span>
            )}
            {analysis.theme && (
              <span className={`badge badge-theme badge-theme-${analysis.theme.mode}`}>
                {analysis.theme.mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </span>
            )}
          </div>
        </div>

        {/* Color palette */}
        <ColorPalette colors={analysis.colors} />

        {/* Component breakdown */}
        <ComponentBreakdown components={analysis.components} />

        {/* Typography */}
        <TypographyPanel typography={analysis.typography} />

        {/* Design tokens */}
        <DesignTokens tokens={analysis.tokens} />

        {/* Format selector + code output */}
        <div className="analysis-section">
          <h3 className="analysis-section-title">Code Output</h3>
          <FormatSelector selected={codeFormat} onSelect={onFormatChange} />
          <CodeBlock code={codeResult} format={codeFormat} />
        </div>

        {/* Variations */}
        <div className="analysis-section">
          {!variations && (
            <button
              className="btn btn-secondary variations-trigger"
              onClick={onGenerateVariations}
            >
              ✨ Generate Variations
            </button>
          )}
          {variations && <VariationsPanel variations={variations} />}
        </div>
      </div>
    )
  }

  // Phase 1: Raw text result view
  const badge = ACTION_BADGES[action] || { label: 'Result', icon: '✨' }
  const renderedContent = renderMarkdown(result)

  return (
    <div className="result-view">
      <div className="result-header">
        <span className="result-badge">
          {badge.icon} {badge.label}
        </span>
      </div>

      <div className="result-content" ref={contentRef}>
        <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
      </div>

      <div className="result-actions">
        <CopyButton text={result} label="Copy" />
      </div>
    </div>
  )
}
