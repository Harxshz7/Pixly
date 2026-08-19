import React, { useRef, useEffect } from 'react'
import CopyButton from './CopyButton.jsx'

const ACTION_BADGES = {
  'explain-text': { label: 'Text Explanation', icon: '📝' },
  'analyze-image': { label: 'Image Analysis', icon: '🖼️' },
  'recreate-ui': { label: 'UI Recreation', icon: '🎨' },
  'screenshot-area': { label: 'Screenshot Analysis', icon: '📸' },
}

/**
 * Simple markdown-to-HTML renderer (no external deps).
 * Handles: bold, italic, code blocks, inline code, headings, lists, links, line breaks.
 */
function renderMarkdown(text) {
  if (!text) return ''

  let html = text

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<pre class="md-code-block"><code>${escaped}</code></pre>`
  })

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>')

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')

  // Unordered list items
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)

  // Ordered list items
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr />')

  // Line breaks → paragraphs (double newline)
  html = html.replace(/\n\n/g, '</p><p>')

  // Single newlines
  html = html.replace(/\n/g, '<br />')

  // Wrap in paragraph if not already
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`
  }

  return html
}

/**
 * ResultView — displays AI response with markdown rendering and Copy button.
 */
export default function ResultView({ result, action, isStreaming = false }) {
  const badge = ACTION_BADGES[action] || { label: 'Result', icon: '✨' }
  const contentRef = useRef(null)

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [result, isStreaming])

  const renderedContent = renderMarkdown(result)

  return (
    <div className="result-view">
      <div className="result-header">
        <span className="result-badge">
          {badge.icon} {badge.label}
        </span>
        {isStreaming && (
          <span className="streaming-indicator">
            <span className="streaming-dot" />
            Streaming...
          </span>
        )}
      </div>

      <div className="result-content" ref={contentRef}>
        <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
        {isStreaming && <span className="streaming-cursor">▊</span>}
      </div>

      <div className="result-actions">
        <CopyButton text={result} label="Copy" />
      </div>
    </div>
  )
}
