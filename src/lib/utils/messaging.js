// Pixly Phase 1 — Unified Messaging
// Single message-passing convention through { action, payload } objects.

// ─── Actions ─────────────────────────────────────────────────────────────────

export const ACTIONS = {
  // Content → Background (requests)
  ANALYZE_TEXT: 'ANALYZE_TEXT',
  ANALYZE_IMAGE: 'ANALYZE_IMAGE',
  ANALYZE_BOX: 'ANALYZE_BOX',

  // Background → Side Panel (responses)
  LOADING: 'LOADING',
  RESULT_READY: 'RESULT_READY',
  ANALYSIS_READY: 'ANALYSIS_READY',
  CODE_READY: 'CODE_READY',
  VARIATIONS_READY: 'VARIATIONS_READY',
  RESULT_ERROR: 'RESULT_ERROR',

  // Side Panel → Background (on-demand)
  GENERATE_CODE: 'GENERATE_CODE',
  GENERATE_VARIATIONS: 'GENERATE_VARIATIONS',

  // Background → Content
  START_DRAW_BOX: 'START_DRAW_BOX',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Create a message object with the unified convention.
 * @param {string} action - One of ACTIONS
 * @param {object} [payload={}]
 * @returns {{ action: string, payload: object }}
 */
export function createMessage(action, payload = {}) {
  return { action, payload }
}

/**
 * Send a message from content script → background.
 */
export function sendToBackground(action, payload = {}) {
  return chrome.runtime.sendMessage(createMessage(action, payload))
}

/**
 * Send a message from background → side panel.
 */
export function sendToSidePanel(action, payload = {}) {
  return chrome.runtime.sendMessage(createMessage(action, payload))
}

/**
 * Send a message from background → content script in a specific tab.
 */
export function sendToTab(tabId, action, payload = {}) {
  return chrome.tabs.sendMessage(tabId, createMessage(action, payload))
}

/**
 * Listen for messages matching a specific action.
 * Returns a cleanup function to remove the listener.
 *
 * @param {string} action - One of ACTIONS
 * @param {(payload: object, sender: chrome.runtime.MessageSender) => void} handler
 * @returns {() => void} cleanup
 */
export function onAction(action, handler) {
  const listener = (message, sender) => {
    if (message.action === action) {
      handler(message.payload || {}, sender)
    }
  }
  chrome.runtime.onMessage.addListener(listener)
  return () => chrome.runtime.onMessage.removeListener(listener)
}
