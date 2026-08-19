/**
 * Pixly — Background Service Worker
 *
 * Handles:
 * - Context menu clicks (right-click explain / analyze)
 * - AI API requests
 * - Screenshot capture
 * - Side panel management
 */

import { MESSAGE_TYPES, CONTEXT_MENU_IDS } from '../lib/utils/constants.js'
import { aiComplete } from '../lib/ai/client.js'
import { buildTextExplainPrompt } from '../lib/ai/prompts/text-explain.js'
import { buildImageAnalyzePrompt, buildScreenshotAnalyzePrompt } from '../lib/ai/prompts/image-analyze.js'
import { buildUIRecreatePrompt } from '../lib/ai/prompts/ui-recreate.js'
import { imageUrlToDataUrl, compressImage } from '../lib/capture/image-utils.js'
import { captureVisibleTab } from '../lib/capture/screenshot.js'
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

// ─── Context Menu Click Handler ──────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return

  const configured = await isConfigured()
  if (!configured) {
    // Open options page
    chrome.runtime.openOptionsPage()
    return
  }

  switch (info.menuItemId) {
    case CONTEXT_MENU_IDS.EXPLAIN_SELECTION: {
      if (info.selectionText) {
        // Open side panel and send text for analysis
        try {
          await chrome.sidePanel.open({ tabId: tab.id })
        } catch (e) {
          // Side panel might already be open
        }
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
        } catch (e) {
          // Side panel might already be open
        }
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
  // Handle async messages
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message }))
  return true // keep channel open for async response
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

// ─── Action Handlers ─────────────────────────────────────────────────────────

async function handleExplainText(message) {
  const { text, pageUrl, pageTitle } = message

  // Open side panel
  const tab = await getActiveTab()
  if (tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id })
    } catch (e) {
      // Already open
    }

    // Notify side panel that we're starting
    chrome.runtime.sendMessage({
      type: 'pixly:loading',
      action: 'explain-text',
    })
  }

  try {
    const prompt = buildTextExplainPrompt(text, pageUrl, pageTitle)
    const result = await aiComplete(prompt)

    // Send result to side panel
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.AI_RESULT,
      result,
      action: 'explain-text',
      source: { type: 'text', content: text },
    })

    return { ok: true }
  } catch (err) {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.AI_ERROR,
      error: err.message,
      action: 'explain-text',
    })
    return { error: err.message }
  }
}

async function handleAnalyzeImage(message) {
  const { imageUrl, altText, pageUrl, pageTitle } = message

  const tab = await getActiveTab()
  if (tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id })
    } catch (e) {}

    chrome.runtime.sendMessage({
      type: 'pixly:loading',
      action: 'analyze-image',
    })
  }

  try {
    // Fetch and compress the image
    let dataUrl
    if (imageUrl.startsWith('data:')) {
      dataUrl = imageUrl
    } else {
      dataUrl = await imageUrlToDataUrl(imageUrl)
    }

    dataUrl = await compressImage(dataUrl)

    const prompt = buildImageAnalyzePrompt(imageUrl, altText)
    const result = await aiComplete(prompt, dataUrl)

    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.AI_RESULT,
      result,
      action: 'analyze-image',
      source: { type: 'image', url: imageUrl },
    })

    return { ok: true }
  } catch (err) {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.AI_ERROR,
      error: err.message,
      action: 'analyze-image',
    })
    return { error: err.message }
  }
}

async function handleRecreateUI(message) {
  const { dataUrl, description } = message

  const tab = await getActiveTab()
  if (tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id })
    } catch (e) {}

    chrome.runtime.sendMessage({
      type: 'pixly:loading',
      action: 'recreate-ui',
    })
  }

  try {
    const prompt = buildUIRecreatePrompt(description)
    const result = await aiComplete(prompt, dataUrl)

    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.AI_RESULT,
      result,
      action: 'recreate-ui',
      source: { type: 'screenshot' },
    })

    return { ok: true }
  } catch (err) {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.AI_ERROR,
      error: err.message,
      action: 'recreate-ui',
    })
    return { error: err.message }
  }
}

async function handleOpenSidePanel(sender) {
  if (sender.tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: sender.tab.id })
    } catch (e) {
      // Already open
    }
  }
  return { ok: true }
}

async function handleScreenshotArea(message, sender) {
  const { region, pageUrl, pageTitle } = message

  const tab = await getActiveTab()
  if (tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id })
    } catch (e) {}

    chrome.runtime.sendMessage({
      type: 'pixly:loading',
      action: 'screenshot-area',
    })
  }

  try {
    // Capture full visible tab
    const screenshotDataUrl = await captureVisibleTab()

    // Load the image to crop it
    const dataUrl = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = new OffscreenCanvas(
          Math.round(region.width),
          Math.round(region.height)
        )
        const ctx = canvas.getContext('2d')
        ctx.drawImage(
          img,
          region.viewportX, region.viewportY,
          region.width, region.height,
          0, 0,
          region.width, region.height
        )

        canvas.convertToBlob({ type: 'image/png' }).then((blob) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      }
      img.onerror = () => reject(new Error('Failed to load screenshot'))
      img.src = screenshotDataUrl
    })

    const prompt = buildScreenshotAnalyzePrompt()
    const result = await aiComplete(prompt, dataUrl)

    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.AI_RESULT,
      result,
      action: 'screenshot-area',
      source: { type: 'screenshot', region },
    })

    return { ok: true }
  } catch (err) {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.AI_ERROR,
      error: err.message,
      action: 'screenshot-area',
    })
    return { error: err.message }
  }
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
    } catch (e) {
      // Already open or no access
    }
  }
})
