import React from 'react'
import CopyButton from './CopyButton.jsx'

const ACTION_BADGES = {
  'explain-text': { label: 'Text Explanation', icon: '📝' },
  'analyze-image': { label: 'Image Analysis', icon: '🖼️' },
  'recreate-ui': { label: 'UI Recreation', icon: '🎨' },
  'screenshot-area': { label: 'Screenshot Analysis', icon: '📸' },
}

/**
 * ResultView — displays raw AI response text + one-click Copy button.
 * No markdown rendering, no formatting libraries. Just plain text output.
 */
export default function ResultView({ result, action }) {
  const badge = ACTION_BADGES[action] || { label: 'Result', icon: '✨' }

  return (
    <div className="result-view">
      <div className="result-header">
        <span className="result-badge">
          {badge.icon} {badge.label}
        </span>
      </div>

      <div className="result-content">
        {result}
      </div>

      <div className="result-actions">
        <CopyButton text={result} label="Copy" />
      </div>
    </div>
  )
}
