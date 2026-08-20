/**
 * Pixly — Background Service Worker
 *
 * Handles:
 * - Context menu clicks (right-click explain / analyze)
 * - AI API requests via callAI()
 * - Screenshot capture
 * - Side panel management
 */

import { MESSAGE_TYPES, CONTEXT_MENU_IDS } from '../lib/utils/constants.js'
import { callAI } from '../lib/ai/client.js'
import { imageUrlToDataUrl, compressImage } from '../lib/capture/image-utils.js'
import { captureRegion } from '../lib/capture/screenshot.js'
import { isConfigured } from '../lib/storage/settings.js'

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
      chrome.tabs.sendMessage(tab.id, {
        type: MESSAGE_TYPES.START_DRAW_BOX,
      })
    }
  }
})

// ─── Context Menu Click Handler ──────────────────────────────────────────────

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
        chrome.tabs.sendMessage(tab.id, {
          type: 'pixly:context-menu-click',
          menuItemId: info.menuItemId,
        })
      }
      break
    }

    case CONTEXT_MENU_IDS.ANALYZE_IMAGE: {
      if (info.srcUrl) {
        try {
          await chrome.sidePanel.open({ tabId: tab.id })
        } catch (e) {}
        chrome.tabs.sendMessage(tab.id, {
          type: 'pixly:context-menu-click',
          menuItemId: info.menuItemId,
          imageUrl: info.srcUrl,
          altText: info.mediaType === 'image' ? info.selectionText : null,
        })
      }
      break
    }
  }
})

// ─── Message Handler ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message }))
  return true
})

async function handleMessage(message, sender) {
  switch (message.type) {
    case MESSAGE_TYPES.EXPLAIN_TEXT:
      return handleExplainText(message)
    case MESSAGE_TYPES.ANALYZE_IMAGE:
      return handleAnalyzeImage(message)
    case MESSAGE_TYPES.RECREATE_UI:
      return handleRecreateUI(message)
    case MESSAGE_TYPES.OPEN_SIDE_PANEL:
      return handleOpenSidePanel(sender)
    case MESSAGE_TYPES.SCREENSHOT_AREA:
      return handleScreenshotArea(message, sender)
    default:
      return { error: `Unknown message type: ${message.type}` }
  }
}

// ─── Streaming Helper ────────────────────────────────────────────────────────

/**
 * Stream AI results to the side panel for a given action.
 * Opens the side panel, streams tokens, and signals completion or error.
 */
async function streamToSidePanel(action, source, aiParams) {
  const tab = await getActiveTab()
  if (tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id })
    } catch (e) {}
  }

  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.AI_STREAM_START,
    action,
    source,
  })

  try {
    let fullResult = ''
    for await (const token of callAI(aiParams)) {
      fullResult += token
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.AI_STREAM_TOKEN,
        token,
        action,
      })
    }

    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.AI_STREAM_END,
      result: fullResult,
      action,
      source,
    })
    return { ok: true }
  } catch (err) {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.AI_ERROR,
      error: err.message,
      action,
    })
    return { error: err.message }
  }
}

// ─── Action Handlers ─────────────────────────────────────────────────────────

async function handleExplainText(message) {
  const { text, pageUrl, pageTitle } = message
  const source = { type: 'text', content: text }

  return streamToSidePanel('explain-text', source, {
    type: 'explain-text',
    text,
    meta: { pageUrl, pageTitle },
  })
}

async function handleAnalyzeImage(message) {
  const { imageUrl, altText } = message
  const source = { type: 'image', url: imageUrl }

  // Fetch and compress the image
  let dataUrl
  if (imageUrl.startsWith('data:')) {
    dataUrl = imageUrl
  } else {
    dataUrl = await imageUrlToDataUrl(imageUrl)
  }
  dataUrl = await compressImage(dataUrl)

  return streamToSidePanel('analyze-image', source, {
    type: 'analyze-image',
    imageBase64: dataUrl,
    meta: { imageUrl, altText },
  })
}

async function handleRecreateUI(message) {
  const { dataUrl, description } = message
  const source = { type: 'screenshot' }

  return streamToSidePanel('recreate-ui', source, {
    type: 'recreate-ui',
    imageBase64: dataUrl,
    meta: { description },
  })
}

async function handleScreenshotArea(message) {
  const { region } = message
  const source = { type: 'screenshot', region }

  // Capture and crop the region
  const dataUrl = await captureRegion(region)

  return streamToSidePanel('screenshot-area', source, {
    type: 'screenshot-area',
    imageBase64: dataUrl,
  })
}

async function handleOpenSidePanel(sender) {
  if (sender.tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: sender.tab.id })
    } catch (e) {}
  }
  return { ok: true }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

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
