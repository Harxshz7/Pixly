/**
 * Pixly — Background Service Worker
 *
 * Handles:
 * - Context menu clicks (right-click explain / analyze) — handled directly here
 * - Keyboard shortcuts (Ctrl+Shift+X → draw box, Ctrl+Shift+P → open side panel)
 * - AI API requests via callAI()
 * - Screenshot capture
 * - Phase 2: Full UI analysis pipeline + code generation + variations
 */

import { CONTEXT_MENU_IDS } from '../lib/utils/constants.js'
import { callAI } from '../lib/ai/client.js'
import { imageUrlToDataUrl, compressImage } from '../lib/capture/image-utils.js'
import { captureRegion } from '../lib/capture/screenshot.js'
import { isConfigured } from '../lib/storage/settings.js'
import { extractColors } from '../lib/analysis/color-extractor.js'
import { detectTheme } from '../lib/analysis/theme-detector.js'
import { buildReactTailwindPrompt } from '../lib/generators/react-tailwind.js'
import { buildHtmlCssPrompt } from '../lib/generators/html-css.js'
import { buildVuePrompt } from '../lib/generators/vue.js'
import { buildFlutterPrompt } from '../lib/generators/flutter.js'
import { buildVariationsPrompt } from '../lib/generators/variations.js'
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
  await runFullUIAnalysis(region)
})

// ─── Phase 2: On-demand Code Generation ──────────────────────────────────────

onAction(ACTIONS.GENERATE_CODE, async (payload) => {
  const { format, analysis } = payload

  const promptMap = {
    'react-tailwind': buildReactTailwindPrompt,
    'html-css': buildHtmlCssPrompt,
    vue: buildVuePrompt,
    flutter: buildFlutterPrompt,
  }

  const buildPrompt = promptMap[format]
  if (!buildPrompt) {
    sendToSidePanel(ACTIONS.RESULT_ERROR, {
      error: `Unknown format: ${format}`,
    })
    return
  }

  try {
    let fullResult = ''
    const prompt = buildPrompt(analysis)
    // We need to call the API directly since callAI expects a type in PROMPT_BUILDERS
    // Instead, use the low-level streaming functions
    const settings = await getSettings()
    const messages = buildMessagesFromPrompt(prompt, null, settings.provider)

    if (settings.provider === 'anthropic') {
      for await (const token of streamAnthropic(settings.apiKey, settings.model, messages)) {
        fullResult += token
      }
    } else {
      for await (const token of streamOpenAI(settings.apiKey, settings.model, messages)) {
        fullResult += token
      }
    }

    sendToSidePanel(ACTIONS.CODE_READY, { code: fullResult, format })
  } catch (err) {
    sendToSidePanel(ACTIONS.RESULT_ERROR, { error: err.message })
  }
})

onAction(ACTIONS.GENERATE_VARIATIONS, async (payload) => {
  const { analysis } = payload

  try {
    let fullResult = ''
    const prompt = buildVariationsPrompt(analysis)
    const settings = await getSettings()
    const messages = buildMessagesFromPrompt(prompt, null, settings.provider)

    if (settings.provider === 'anthropic') {
      for await (const token of streamAnthropic(settings.apiKey, settings.model, messages)) {
        fullResult += token
      }
    } else {
      for await (const token of streamOpenAI(settings.apiKey, settings.model, messages)) {
        fullResult += token
      }
    }

    // Parse the JSON response
    let variations = []
    try {
      // Strip markdown code fences if present
      const cleaned = fullResult.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      variations = parsed.variations || []
    } catch {
      // If JSON parsing fails, return the raw text as a single variation
      variations = [{ title: 'Result', approach: 'inspired-redesign', description: '', prompt: fullResult }]
    }

    sendToSidePanel(ACTIONS.VARIATIONS_READY, { variations })
  } catch (err) {
    sendToSidePanel(ACTIONS.RESULT_ERROR, { error: err.message })
  }
})

// ─── Full UI Analysis Pipeline (Phase 2) ─────────────────────────────────────

/**
 * Run the complete Phase 2 UI analysis pipeline:
 * 1. Deterministic extractors (color, theme) — instant, no API cost
 * 2. Batched AI vision call (style + components + typography + tokens)
 * 3. Merge into structured analysis object
 * 4. Send to side panel
 */
async function runFullUIAnalysis(region) {
  sendToSidePanel(ACTIONS.LOADING, { action: 'ui-analysis-full' })

  try {
    // Capture the region
    const dataUrl = await captureRegion(region)

    // Run deterministic extractors in parallel
    const [colors, theme] = await Promise.all([
      extractColors(dataUrl, 8),
      detectTheme(dataUrl),
    ])

    // Run batched AI vision call for style + components + typography + tokens
    let aiResult = {}
    try {
      let fullAiResult = ''
      for await (const token of callAI({
        type: 'ui-analysis-full',
        imageBase64: dataUrl,
      })) {
        fullAiResult += token
      }

      // Parse the JSON response
      const cleaned = fullAiResult.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
      aiResult = JSON.parse(cleaned)
    } catch (parseErr) {
      // If JSON parsing fails, use fallback
      aiResult = {
        style: { type: 'Other', confidence: 'low', description: 'Could not analyze style' },
        components: [],
        typography: { families: [], hierarchy: {} },
        tokens: { spacing: { scale: [] }, radius: { values: [] }, shadows: [] },
      }
    }

    // Merge into structured analysis object
    const analysis = {
      style: aiResult.style || { type: 'Other', confidence: 'low', description: '' },
      theme,
      colors,
      components: aiResult.components || [],
      typography: aiResult.typography || { families: [], hierarchy: {} },
      tokens: aiResult.tokens || { spacing: { scale: [] }, radius: { values: [] }, shadows: [] },
    }

    sendToSidePanel(ACTIONS.ANALYSIS_READY, { analysis })
  } catch (err) {
    sendToSidePanel(ACTIONS.RESULT_ERROR, { error: err.message })
  }
}

// ─── Analysis Runner (Phase 1 — text/image) ─────────────────────────────────

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

// ─── Low-level helpers for direct API calls ──────────────────────────────────

async function getSettings() {
  const result = await chrome.storage.local.get([
    'pixly_api_key',
    'pixly_ai_provider',
    'pixly_ai_model',
  ])
  const { AI_PROVIDERS, DEFAULT_MODELS } = await import('../lib/utils/constants.js')
  return {
    apiKey: result['pixly_api_key'] || '',
    provider: result['pixly_ai_provider'] || AI_PROVIDERS.ANTHROPIC,
    model: result['pixly_ai_model'] || DEFAULT_MODELS[AI_PROVIDERS.ANTHROPIC],
  }
}

function buildMessagesFromPrompt(prompt, imageDataUrl, provider) {
  const messages = []
  if (prompt.system) {
    messages.push({ role: 'system', content: prompt.system })
  }
  for (const msg of prompt.messages) {
    if (msg.role === 'user' && imageDataUrl) {
      if (provider === 'anthropic') {
        const match = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
        messages.push({
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: `image/${match[1]}`, data: match[2] } },
            { type: 'text', text: msg.content },
          ],
        })
      } else {
        messages.push({
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageDataUrl } },
            { type: 'text', text: msg.content },
          ],
        })
      }
    } else {
      messages.push(msg)
    }
  }
  return messages
}

// Re-use SSE parsing and streaming from client.js pattern
async function* parseSSE(response) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      let currentEvent = 'message'
      let currentData = ''
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          currentData = line.slice(6)
        } else if (line.trim() === '') {
          if (currentData) {
            yield { event: currentEvent, data: currentData }
            currentEvent = 'message'
            currentData = ''
          }
        }
      }
    }
    if (currentData) {
      yield { event: currentEvent, data: currentData }
    }
  } finally {
    reader.releaseLock()
  }
}

async function* streamAnthropic(apiKey, model, messages, maxTokens = 4096) {
  const systemMessage = messages.find((m) => m.role === 'system')
  const nonSystemMessages = messages.filter((m) => m.role !== 'system')
  const body = { model, max_tokens: maxTokens, stream: true, messages: nonSystemMessages }
  if (systemMessage) body.system = systemMessage.content

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`)
  }
  for await (const { event, data } of parseSSE(response)) {
    if (event === 'content_block_delta') {
      try {
        const parsed = JSON.parse(data)
        if (parsed.delta?.type === 'text_delta') yield parsed.delta.text
      } catch {}
    } else if (event === 'message_stop') {
      break
    }
  }
}

async function* streamOpenAI(apiKey, model, messages, maxTokens = 4096) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, stream: true }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`)
  }
  for await (const { data } of parseSSE(response)) {
    if (data === '[DONE]') break
    try {
      const parsed = JSON.parse(data)
      const content = parsed.choices?.[0]?.delta?.content
      if (content) yield content
    } catch {}
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
