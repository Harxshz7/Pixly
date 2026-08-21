import React, { useCallback } from 'react'
import { classifyError } from '../../lib/utils/error-classifier.js'

const ERROR_ICONS = {
  'no-api-key': '🔑',
  'invalid-api-key': '⚠️',
  'rate-limit': '⏱️',
  network: '🌐',
  'parse-error': '🔧',
  unknown: '❌',
}

/**
 * ErrorState — displays a classified error with an actionable message and optional button.
 */
export default function ErrorState({ error }) {
  const classified = classifyError(error)
  const icon = ERROR_ICONS[classified.type] || '❌'

  const handleAction = useCallback(() => {
    if (classified.action?.action === 'open-options') {
      chrome.runtime.openOptionsPage()
    }
  }, [classified])

  return (
    <div className="error-state">
      <div className="error-state-header">
        <span className="error-state-icon">{icon}</span>
        <strong className="error-state-title">{classified.title}</strong>
      </div>
      <p className="error-state-message">{classified.message}</p>
      {classified.action && (
        <button className="btn btn-primary error-state-action" onClick={handleAction}>
          {classified.action.label}
        </button>
      )}
    </div>
  )
}
