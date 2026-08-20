/**
 * Pixly — Background Service Worker
 *
 * Handles:
 * - Context menu clicks (right-click explain / analyze) — handled directly here
 * - Keyboard shortcuts (Ctrl+Shift+X → draw box, Ctrl+Shift+P → open side panel)
 * - AI API requests via callAI()
 * - Screenshot capture
 */

import { CONTEXT_MENU_IDS } from '../lib/utils/constants.js'
import { callAI } from '../lib/ai/client.js'
import { imageUrlToDataUrl, compressImage } from '../lib/capture/image-utils.js'
import { captureRegion } from '../lib/capture/screenshot.js'
import { isConfigured } from '../lib/storage/settings.js'
import {
  ACTIONS,
  sendToSidePanel,
  sendToTab,
  onAction,
} from '../lib/utils/messaging.js'

// ─── Context Menu Setup ───────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.EXPLAIN_SELECTION,
    title: 'Pixly: Explain selected text',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.ANALYZE_IMAGE,
    title: 'Pixly: Analyze this image',
    contexts: ['image'],
  })
})

// ─── Keyboard Shortcut Handler ───────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'draw-box') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      try {
        await chrome.sidePanel.open({ tabId: tab.id })
      } catch (e) {}
      sendToTab(tab.id, ACTIONS.START_DRAW_BOX)
    }
  }
})

// ─── Context Menu Click Handler (direct — no relay through content script) ────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return

  const configured = await isConfigured()
  if (!configured) {
    chrome.runtime.openOptionsPage()
    return
  }

  switch (info.menuItemId) {
    case CONTEXT_MENU_IDS.EXPLAIN_SELECTION: {
      if (info.selectionText) {
        try {
          await chrome.sidePanel.open({ tabId: tab.id })
        } catch (e) {}
        runAnalysis('explain-text', { type: 'explain-text', text: info.selectionText })
      }
      break
    }

    case CONTEXT_MENU_IDS.ANALYZE_IMAGE: {
      if (info.srcUrl) {
        try {
          await chrome.sidePanel.open({ tabId: tab.id })
        } catch (e) {}

        // Fetch and compress the image
        let dataUrl
        if (info.srcUrl.startsWith('data:')) {
          dataUrl = info.srcUrl
        } else {
          dataUrl = await imageUrlToDataUrl(info.srcUrl)
        }
        dataUrl = await compressImage(dataUrl)

        const altText = info.mediaType === 'image' ? info.selectionText : null
        runAnalysis('analyze-image', {
          type: 'analyze-image',
          imageBase64: dataUrl,
          meta: { imageUrl: info.srcUrl, altText },
        })
      }
      break
    }
  }
})

// ─── Content Script Message Handler ──────────────────────────────────────────

onAction(ACTIONS.ANALYZE_TEXT, async (payload) => {
  const { text, pageUrl, pageTitle } = payload
  await openSidePanel()
  runAnalysis('explain-text', {
    type: 'explain-text',
    text,
    meta: { pageUrl, pageTitle },
  })
})

onAction(ACTIONS.ANALYZE_BOX, async (payload) => {
  const { region } = payload
  await openSidePanel()
  const dataUrl = await captureRegion(region)
  runAnalysis('screenshot-area', {
    type: 'screenshot-area',
    imageBase64: dataUrl,
  })
})

// ─── Analysis Runner ─────────────────────────────────────────────────────────

/**
 * Run an AI analysis and stream results to the side panel.
 * Sends LOADING → RESULT_READY | RESULT_ERROR.
 */
async function runAnalysis(action, aiParams) {
  sendToSidePanel(ACTIONS.LOADING, { action })

  try {
    let fullResult = ''
    for await (const token of callAI(aiParams)) {
      fullResult += token
    }

    sendToSidePanel(ACTIONS.RESULT_READY, { result: fullResult, action })
  } catch (err) {
    sendToSidePanel(ACTIONS.RESULT_ERROR, { error: err.message, action })
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

async function openSidePanel() {
  const tab = await getActiveTab()
  if (tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id })
    } catch (e) {}
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab || null
}

// ─── Extension Icon Click → Open Side Panel ──────────────────────────────────

chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id })
    } catch (e) {}
  }
})
