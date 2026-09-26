// Pixly Phase 3 — Baseline Event Log
// Local-only event counters stored in chrome.storage.local.
// No external network calls, no PII. For internal triage only.

const EVENT_LOG_KEY = 'pixly_event_log'

/**
 * Event names used throughout the app.
 */
export const EVENTS = {
  TEXT_ANALYZED: 'text_analyzed',
  IMAGE_ANALYZED: 'image_analyzed',
  BOX_ANALYZED: 'box_analyzed',
  CODE_GENERATED: 'code_generated',
  VARIATIONS_GENERATED: 'variations_generated',
  EXPORT_USED: 'export_used',
  FAVORITE_TOGGLED: 'favorite_toggled',
  HISTORY_CLEARED: 'history_cleared',
  ERROR_NO_API_KEY: 'error_no_api_key',
  ERROR_INVALID_KEY: 'error_invalid_key',
  ERROR_RATE_LIMIT: 'error_rate_limit',
  ERROR_NETWORK: 'error_network',
  ERROR_PARSE: 'error_parse',
  ERROR_UNKNOWN: 'error_unknown',
}

/**
 * Read the current event log from storage.
 * @returns {Promise<Object>} Event counters object
 */
async function readLog() {
  try {
    const result = await chrome.storage.local.get(EVENT_LOG_KEY)
    return result[EVENT_LOG_KEY] || {}
  } catch {
    return {}
  }
}

/**
 * Write the event log to storage.
 * @param {Object} log - Event counters object
 */
async function writeLog(log) {
  await chrome.storage.local.set({ [EVENT_LOG_KEY]: log })
}

/**
 * Increment a local event counter.
 * Fire-and-forget — never blocks the caller, never throws.
 *
 * @param {string} eventName - One of EVENTS
 */
export function logEvent(eventName) {
  // Fire-and-forget: don't await, don't block the caller
  readLog()
    .then((log) => {
      log[eventName] = (log[eventName] || 0) + 1
      log._lastUpdated = Date.now()
      return writeLog(log)
    })
    .catch(() => {
      // Silently ignore — telemetry must never break the app
    })
}

/**
 * Log an error event based on its classified type.
 * Maps error types from error-classifier to event names.
 *
 * @param {string} errorType - One of ERROR_TYPES from constants.js
 */
export function logError(errorType) {
  const errorEventMap = {
    'no-api-key': EVENTS.ERROR_NO_API_KEY,
    'invalid-api-key': EVENTS.ERROR_INVALID_KEY,
    'rate-limit': EVENTS.ERROR_RATE_LIMIT,
    network: EVENTS.ERROR_NETWORK,
    'parse-error': EVENTS.ERROR_PARSE,
    unknown: EVENTS.ERROR_UNKNOWN,
  }
  const event = errorEventMap[errorType] || EVENTS.ERROR_UNKNOWN
  logEvent(event)
}

/**
 * Get all event counters (for debugging / future dashboard).
 * @returns {Promise<Object>}
 */
export async function getEventLog() {
  return readLog()
}

/**
 * Reset all event counters.
 * @returns {Promise<void>}
 */
export async function resetEventLog() {
  await writeLog({})
}
