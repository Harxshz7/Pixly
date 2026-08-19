import React from 'react'
import CopyButton from './CopyButton.jsx'

const ACTION_BADGES = {
  'explain-text': { label: 'Text Explanation', icon: '📝' },
  'analyze-image': { label: 'Image Analysis', icon: '🖼️' },
  'recreate-ui': { label: 'UI Recreation', icon: '🎨' },
  'screenshot-area': { label: 'Screenshot Analysis', icon: '📸' },
}

/**
 * Simple markdown-like renderer for AI output.
 * Converts basic markdown to React elements.
 */
function renderMarkdown(text) {
  if (!text) return null

  // Split into lines and process
  const lines = text.split('\n')
  const elements = []
  let inCodeBlock = false
  let codeLines = []
  let codeLanguage = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code block start/end
    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        )
        codeLines = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
        codeLanguage = line.trim().slice(3)
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<br key={`br-${i}`} />)
      continue
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i}>{inlineFormat(line.slice(4))}</h3>)
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i}>{inlineFormat(line.slice(3))}</h2>)
      continue
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i}>{inlineFormat(line.slice(2))}</h1>)
      continue
    }

    // List items
    if (line.match(/^[-*]\s/)) {
      elements.push(
        <li key={i}>{inlineFormat(line.slice(2))}</li>
      )
      continue
    }
    if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, '')
      elements.push(
        <li key={i}>{inlineFormat(content)}</li>
      )
      continue
    }

    // Regular paragraph
    elements.push(<p key={i}>{inlineFormat(line)}</p>)
  }

  return elements
}

/**
 * Process inline formatting: bold, italic, code, links
 */
function inlineFormat(text) {
  // Split by inline code backticks, bold markers, etc.
  const parts = []
  let remaining = text
  let keyCounter = 0

  // Process inline code first
  const codeRegex = /`([^`]+)`/g
  let lastIndex = 0
  let match

  const segments = []
  while ((match = codeRegex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: remaining.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'code', content: match[1] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < remaining.length) {
    segments.push({ type: 'text', content: remaining.slice(lastIndex) })
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', content: remaining })
  }

  return segments.map((seg) => {
    if (seg.type === 'code') {
      return <code key={keyCounter++}>{seg.content}</code>
    }
    // Bold
    return processBold(seg.content)
  })
}

function processBold(text) {
  const parts = []
  const regex = /\*\*([^*]+)\*\*/g
  let lastIndex = 0
  let match
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(<strong key={`b-${key++}`}>{match[1]}</strong>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

export default function ResultView({ result, action, source }) {
  const badge = ACTION_BADGES[action] || { label: 'Result', icon: '✨' }

  return (
    <div className="result-view">
      <div className="result-header">
        <span className="result-badge">
          {badge.icon} {badge.label}
        </span>
      </div>

      <div className="result-content">
        {renderMarkdown(result)}
      </div>

      <div className="result-actions">
        <CopyButton text={result} label="Copy" />
      </div>
    </div>
  )
}
