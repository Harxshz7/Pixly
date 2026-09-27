import React, { useState, useCallback } from 'react'
import { highlightCode, detectLanguage } from '../../lib/utils/highlighter.js'
import { copyToClipboard } from '../../lib/utils/clipboard.js'
import { validateGeneratedCode } from '../../lib/utils/code-validator.js'

/**
 * Parse code string into one or more code blocks if markdown fences are present.
 *
 * @param {string} code - Raw code string from AI
 * @param {string} defaultFormat - Selected framework format
 * @returns {Array<{ label: string, lang: string, code: string }>}
 */
export function parseCodeBlocks(code, defaultFormat) {
  if (!code) return []

  const fenceRegex = /```(\w*)\n([\s\S]*?)```/g
  const blocks = []
  let match

  while ((match = fenceRegex.exec(code)) !== null) {
    const rawLang = match[1]?.trim() || ''
    const content = match[2]?.trim() || ''
    if (content) {
      blocks.push({
        label: rawLang ? rawLang.toUpperCase() : defaultFormat.toUpperCase(),
        lang: detectLanguage(rawLang || defaultFormat),
        code: content,
      })
    }
  }

  // If no markdown fences found, treat entire string as single block
  if (blocks.length === 0 && code.trim()) {
    blocks.push({
      label: defaultFormat.toUpperCase(),
      lang: detectLanguage(defaultFormat),
      code: code.trim(),
    })
  }

  return blocks
}

/**
 * CodeBlock Component — Syntax-highlighted display, clipboard buttons (single & copy-all),
 * and lightweight syntax validation fallback with retry button.
 */
export default function CodeBlock({ code, format, onRetry }) {
  const [copiedMap, setCopiedMap] = useState({})
  const [copiedAll, setCopiedAll] = useState(false)

  const handleCopySingle = useCallback(async (text, index) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedMap((prev) => ({ ...prev, [index]: true }))
      setTimeout(() => {
        setCopiedMap((prev) => ({ ...prev, [index]: false }))
      }, 2000)
    }
  }, [])

  const handleCopyAll = useCallback(async () => {
    if (!code) return
    const success = await copyToClipboard(code)
    if (success) {
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    }
  }, [code])

  if (!code) {
    return (
      <div className="code-loading">
        <span className="spinner">⏳</span> Generating framework code...
      </div>
    )
  }

  // Validate code quality before rendering syntax-highlighted blocks
  const validation = validateGeneratedCode(code, format)

  if (!validation.isValid) {
    return (
      <div className="code-validation-failure">
        <div className="validation-alert">
          <div className="validation-alert-text">
            <span className="validation-alert-icon">⚠️</span>
            <span>
              <strong>Syntax validation issue:</strong> {validation.reason}
            </span>
          </div>
          {onRetry && (
            <button type="button" className="btn-retry" onClick={onRetry}>
              🔄 Retry generation
            </button>
          )}
        </div>
        <div className="code-block-wrapper raw-fallback">
          <div className="code-block-header">
            <span className="code-lang-tag">RAW OUTPUT</span>
            <button
              type="button"
              className="code-copy-btn"
              onClick={handleCopyAll}
              title="Copy raw text"
            >
              {copiedAll ? '✓ Copied' : 'Copy raw'}
            </button>
          </div>
          <pre className="code-block plain-text">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    )
  }

  const blocks = parseCodeBlocks(code, format)
  const isMultiBlock = blocks.length > 1

  return (
    <div className="code-display-container">
      {isMultiBlock && (
        <div className="multi-block-header">
          <span className="multi-block-title">{blocks.length} Code Files</span>
          <button
            type="button"
            className="code-copy-all-btn"
            onClick={handleCopyAll}
            title="Copy all code blocks"
          >
            {copiedAll ? '✓ Copied All' : '📋 Copy All'}
          </button>
        </div>
      )}

      {blocks.map((block, idx) => (
        <div key={idx} className="code-block-wrapper">
          <div className="code-block-header">
            <span className="code-lang-tag">{block.label}</span>
            <button
              type="button"
              className="code-copy-btn"
              onClick={() => handleCopySingle(block.code, idx)}
              title={`Copy ${block.label}`}
            >
              {copiedMap[idx] ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre className="code-block">
            <code
              dangerouslySetInnerHTML={{
                __html: highlightCode(block.code, block.lang),
              }}
            />
          </pre>
        </div>
      ))}
    </div>
  )
}
