/**
 * Pixly — Content Script (Main)
 *
 * Orchestrates:
 * - Text selection handler (floating button)
 * - Draw box region selection
 * - Communication with background service worker
 * - Opening side panel with results
 */

import { initSelectionHandler } from './selection-handler.js'
import { activateDrawBox, deactivateDrawBox, isDrawBoxActive } from './draw-box.js'
import { MESSAGE_TYPES } from '../lib/utils/constants.js'

// ─── Initialize ──────────────────────────────────────────────────────────────

// Start the selection handler on page load
initSelectionHandler()

// Listen for the custom event from the selection floating button
document.addEventListener('pixly:explain-text', (e) => {
  handleExplainText(e.detail.text)
})

// ─── Message Listeners ────────────────────────────────────────────────────────

// Listen for messages from background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case MESSAGE_TYPES.START_DRAW_BOX:
      startDrawBox()
      sendResponse({ ok: true })
      break

    case MESSAGE_TYPES.SCREENSHOT_RESULT:
      // Result comes back from background — pass to side panel
      break
  }
})

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * Handle "Explain selected text" action
 */
function handleExplainText(text) {
  // Open side panel and send text for analysis
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.EXPLAIN_TEXT,
    text,
    pageUrl: window.location.href,
    pageTitle: document.title,
  })
}

/**
 * Handle "Analyze this image" action
 */
function handleAnalyzeImage(imageUrl, altText) {
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.ANALYZE_IMAGE,
    imageUrl,
    altText,
    pageUrl: window.location.href,
    pageTitle: document.title,
  })
}

/**
 * Start the draw box overlay for region selection
 */
function startDrawBox() {
  activateDrawBox(
    async (region) => {
      // User completed the selection
      // First open the side panel
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.OPEN_SIDE_PANEL,
      })

      // Then request screenshot of the region
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.SCREENSHOT_AREA,
        region,
        pageUrl: window.location.href,
        pageTitle: document.title,
      })
    },
    () => {
      // User cancelled
    }
  )
}

// ─── Context Menu Fallback ────────────────────────────────────────────────────

// Listen for context menu clicks dispatched from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'pixly:context-menu-click') {
    switch (message.menuItemId) {
      case 'pixly-explain-selection': {
        const text = window.getSelection()?.toString()?.trim()
        if (text) {
          handleExplainText(text)
        }
        break
      }
      case 'pixly-analyze-image': {
        if (message.imageUrl) {
          handleAnalyzeImage(message.imageUrl, message.altText)
        }
        break
      }
    }
    sendResponse({ ok: true })
  }
})
