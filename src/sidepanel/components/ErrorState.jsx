import React, { useCallback, useEffect } from 'react'
import { classifyError, ERROR_STATES } from '../../lib/errors/classifier.js'
import { logError } from '../../lib/telemetry/event-log.js'

const ERROR_ICONS = {
  [ERROR_STATES.NO_API_KEY]: '🔑',
  [ERROR_STATES.INVALID_KEY]: '⚠️',
  [ERROR_STATES.RATE_LIMITED]: '⏱️',
  [ERROR_STATES.NETWORK_FAILURE]: '🌐',
  [ERROR_STATES.MALFORMED_RESPONSE]: '🔧',
  [ERROR_STATES.IMAGE_TOO_LARGE]: '📐',
  [ERROR_STATES.UNKNOWN]: '❌',
}

/**
 * ErrorState — displays a classified error with an actionable message and button.
 *
 * @param {object} props
 * @param {Error|string|object} props.error - Raw or classified error
 * @param {Function} [props.onRetry] - Retry callback function
 */
export default function ErrorState({ error, onRetry }) {
  const classified = classifyError(error)
  const icon = ERROR_ICONS[classified.state] || '❌'

  // Log the classified error event
  useEffect(() => {
    logError(classified.state || classified.type)
  }, [classified.state, classified.type])

  const handleAction = useCallback(() => {
    if (classified.actionType === 'open-options') {
      if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
        chrome.runtime.openOptionsPage()
      }
    } else if (classified.actionType === 'retry' && onRetry) {
      onRetry()
    }
  }, [classified.actionType, onRetry])

  return (
    <div className="error-state">
      <div className="error-state-header">
        <span className="error-state-icon">{icon}</span>
        <strong className="error-state-title">{classified.title}</strong>
      </div>
      <p className="error-state-message">{classified.message}</p>
      {classified.actionType === 'open-options' && (
        <button className="btn btn-primary error-state-action" onClick={handleAction}>
          {classified.actionLabel || 'Open Settings'}
        </button>
      )}
      {classified.actionType === 'retry' && onRetry && (
        <button className="btn btn-secondary error-state-action" onClick={handleAction}>
          {classified.actionLabel || 'Try Again'}
        </button>
      )}
    </div>
  )
}

