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
  CODEGEN_FRAMEWORK: (framework) => `codegen_${framework}_used`,
  ERROR_NO_API_KEY: 'error_no-api-key',
  ERROR_INVALID_KEY: 'error_invalid-api-key',
  ERROR_RATE_LIMIT: 'error_rate-limit',
  ERROR_NETWORK: 'error_network',
  ERROR_PARSE: 'error_parse-error',
  ERROR_UNKNOWN: 'error_unknown',
}

/**
 * Read the current event log from storage.
 * @returns {Promise<Object>} Event counters object
 */
async function readLog() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const result = await chrome.storage.local.get(EVENT_LOG_KEY)
      return result[EVENT_LOG_KEY] || {}
    }
  } catch {}
  return {}
}

/**
 * Write the event log to storage.
 * @param {Object} log - Event counters object
 */
async function writeLog(log) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [EVENT_LOG_KEY]: log })
  }
}

/**
 * Increment a local event counter.
 * Fire-and-forget — never blocks the caller, never throws.
 *
 * @param {string} eventName - Counter key (e.g. 'text_analyzed', 'codegen_react-tailwind_used')
 */
export function logEvent(eventName) {
  if (!eventName) return
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
 * Helper to log codegen usage by framework.
 *
 * @param {string} framework - 'react-tailwind' | 'html-css' | 'vue' | 'flutter'
 */
export function logCodegen(framework) {
  if (framework) {
    logEvent(`codegen_${framework}_used`)
  }
  logEvent(EVENTS.CODE_GENERATED)
}

/**
 * Log an error event based on its classified type.
 * Maps error types to event names e.g. error_rate-limit or error_unknown.
 *
 * @param {string} errorType - One of ERROR_TYPES
 */
export function logError(errorType) {
  const sanitized = (errorType || 'unknown').toString().trim()
  logEvent(`error_${sanitized}`)
}

/**
 * Get all event counters (for debugging / future triage).
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

