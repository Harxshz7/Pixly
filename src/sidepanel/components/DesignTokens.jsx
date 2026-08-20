import React, { useState, useCallback } from 'react'
import { copyToClipboard } from '../../lib/utils/clipboard.js'

/**
 * DesignTokens — grouped display of spacing, radius, and shadow values.
 * Each value is independently copyable.
 */
export default function DesignTokens({ tokens }) {
  const [copiedValue, setCopiedValue] = useState(null)

  const handleCopy = useCallback(async (value) => {
    const success = await copyToClipboard(value)
    if (success) {
      setCopiedValue(value)
      setTimeout(() => setCopiedValue(null), 1500)
    }
  }, [])

  if (!tokens) return null

  return (
    <div className="analysis-section">
      <h3 className="analysis-section-title">Design Tokens</h3>

      {/* Spacing */}
      {tokens.spacing && tokens.spacing.scale && (
        <div className="token-group">
          <span className="token-group-label">Spacing</span>
          <div className="token-values">
            {tokens.spacing.scale.map((val, i) => (
              <button
                key={i}
                className="token-chip"
                onClick={() => handleCopy(`${val}px`)}
                title={`${val}px — click to copy`}
              >
                {copiedValue === `${val}px` ? '✓' : `${val}px`}
              </button>
            ))}
          </div>
          {tokens.spacing.description && (
            <span className="token-note">{tokens.spacing.description}</span>
          )}
        </div>
      )}

      {/* Border Radius */}
      {tokens.radius && tokens.radius.values && (
        <div className="token-group">
          <span className="token-group-label">Border Radius</span>
          <div className="token-values">
            {tokens.radius.values.map((val, i) => (
              <button
                key={i}
                className="token-chip"
                onClick={() => handleCopy(`${val}px`)}
                title={`${val}px — click to copy`}
              >
                {copiedValue === `${val}px` ? '✓' : `${val}px`}
              </button>
            ))}
          </div>
          {tokens.radius.description && (
            <span className="token-note">{tokens.radius.description}</span>
          )}
        </div>
      )}

      {/* Shadows */}
      {tokens.shadows && tokens.shadows.length > 0 && (
        <div className="token-group">
          <span className="token-group-label">Shadows</span>
          {tokens.shadows.map((shadow, i) => (
            <button
              key={i}
              className="token-shadow"
              onClick={() => handleCopy(shadow.definition)}
              title="Click to copy CSS"
            >
              <code className="token-shadow-code">
                {copiedValue === shadow.definition ? 'Copied!' : shadow.definition}
              </code>
              {shadow.description && (
                <span className="token-shadow-desc">{shadow.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
