/**
 * Pixly — Content Script (Main)
 *
 * Orchestrates:
 * - Text selection handler (floating button)
 * - Draw box region selection
 * - Communication with background service worker
 */

import { initSelectionHandler } from './selection-handler.js'
import { activateDrawBox } from './draw-box.js'
import { sendToBackground, onAction, ACTIONS } from '../lib/utils/messaging.js'

// ─── Initialize ──────────────────────────────────────────────────────────────

initSelectionHandler()

// Listen for the custom event from the selection floating button
document.addEventListener('pixly:request-explain', (e) => {
  sendToBackground(ACTIONS.ANALYZE_TEXT, {
    text: e.detail.text,
    pageUrl: window.location.href,
    pageTitle: document.title,
  })
})

// ─── Listen for Draw Box command from background ─────────────────────────────

onAction(ACTIONS.START_DRAW_BOX, () => {
  activateDrawBox(
    (region) => {
      sendToBackground(ACTIONS.ANALYZE_BOX, {
        region,
        pageUrl: window.location.href,
        pageTitle: document.title,
      })
    },
    () => {
      // User cancelled
    }
  )
})
