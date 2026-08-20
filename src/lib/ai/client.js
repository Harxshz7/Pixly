// Pixly Phase 1 — AI Client
// Single entry point: callAI() picks the right prompt template and calls the configured provider's API.
// Supports streaming, text-only, and vision requests. Works in service workers (no DOM deps).

import {
  AI_PROVIDERS,
  API_ENDPOINTS,
  DEFAULT_MODELS,
  STORAGE_KEYS,
} from '../utils/constants.js'
import { buildTextExplainPrompt } from './prompts/text-explain.js'
import {
  buildImageAnalyzePrompt,
  buildScreenshotAnalyzePrompt,
} from './prompts/image-analyze.js'
import { buildUIRecreatePrompt } from './prompts/ui-recreate.js'

// ─── Prompt Router ───────────────────────────────────────────────────────────

/**
 * Map of action types to their prompt builder functions.
 * Each builder receives (text, meta) and returns a prompt object.
 */
const PROMPT_BUILDERS = {
  'explain-text': (text, meta) =>
    buildTextExplainPrompt(text, meta?.pageUrl, meta?.pageTitle),
  'analyze-image': (_text, meta) =>
    buildImageAnalyzePrompt(meta?.imageUrl, meta?.altText),
  'recreate-ui': (_text, meta) => buildUIRecreatePrompt(meta?.description),
  'screenshot-area': () => buildScreenshotAnalyzePrompt(),
}

// ─── Settings ────────────────────────────────────────────────────────────────

async function getSettings() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.API_KEY,
    STORAGE_KEYS.AI_PROVIDER,
    STORAGE_KEYS.AI_MODEL,
  ])
  return {
    apiKey: result[STORAGE_KEYS.API_KEY] || '',
    provider: result[STORAGE_KEYS.AI_PROVIDER] || AI_PROVIDERS.ANTHROPIC,
    model:
      result[STORAGE_KEYS.AI_MODEL] ||
      DEFAULT_MODELS[AI_PROVIDERS.ANTHROPIC],
  }
}

// ─── Message Building ────────────────────────────────────────────────────────

function buildMessages(prompt, imageDataUrl, provider) {
  const messages = []

  if (prompt.system) {
    messages.push({ role: 'system', content: prompt.system })
  }

  for (const msg of prompt.messages) {
    if (msg.role === 'user' && imageDataUrl) {
      if (provider === AI_PROVIDERS.ANTHROPIC) {
        messages.push({
          role: 'user',
          content: [
            toAnthropicImagePart(imageDataUrl),
            { type: 'text', text: msg.content },
          ],
        })
      } else {
        messages.push({
          role: 'user',
          content: [
            toOpenAIImagePart(imageDataUrl),
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

function toAnthropicImagePart(dataUrl) {
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!match) throw new Error('Invalid data URL format')
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: `image/${match[1]}`,
      data: match[2],
    },
  }
}

function toOpenAIImagePart(dataUrl) {
  return {
    type: 'image_url',
    image_url: { url: dataUrl },
  }
}

// ─── SSE Parser ──────────────────────────────────────────────────────────────

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

// ─── Provider Streamers ──────────────────────────────────────────────────────

async function* streamAnthropic(apiKey, model, messages, maxTokens = 4096) {
  const systemMessage = messages.find((m) => m.role === 'system')
  const nonSystemMessages = messages.filter((m) => m.role !== 'system')

  const body = {
    model,
    max_tokens: maxTokens,
    stream: true,
    messages: nonSystemMessages,
  }

  if (systemMessage) {
    body.system = systemMessage.content
  }

  const response = await fetch(API_ENDPOINTS[AI_PROVIDERS.ANTHROPIC], {
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
    throw new Error(
      error.error?.message || `Anthropic API error: ${response.status}`
    )
  }

  for await (const { event, data } of parseSSE(response)) {
    if (event === 'content_block_delta') {
      try {
        const parsed = JSON.parse(data)
        if (parsed.delta?.type === 'text_delta') {
          yield parsed.delta.text
        }
      } catch {
        // Skip malformed JSON
      }
    } else if (event === 'message_stop') {
      break
    }
  }
}

async function* streamOpenAI(apiKey, model, messages, maxTokens = 4096) {
  const response = await fetch(API_ENDPOINTS[AI_PROVIDERS.OPENAI], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      error.error?.message || `OpenAI API error: ${response.status}`
    )
  }

  for await (const { data } of parseSSE(response)) {
    if (data === '[DONE]') break

    try {
      const parsed = JSON.parse(data)
      const content = parsed.choices?.[0]?.delta?.content
      if (content) {
        yield content
      }
    } catch {
      // Skip malformed JSON
    }
  }
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Single entry point for all AI requests.
 * Picks the right prompt template based on `type`, calls the configured provider's API,
 * and streams text tokens back as an async generator.
 *
 * @param {object} params
 * @param {string} params.type - Action type: 'explain-text' | 'analyze-image' | 'recreate-ui' | 'screenshot-area'
 * @param {string} [params.text=''] - Text content for text-based requests (e.g. selected text)
 * @param {string|null} [params.imageBase64=null] - Base64 data URL for vision requests
 * @param {object} [params.meta={}] - Additional context for prompt building (pageUrl, pageTitle, imageUrl, altText, description)
 * @yields {string} Text tokens as they arrive from the API
 * @throws {Error} If API key is not configured, model is missing, or type is unknown
 */
export async function* callAI({ type, text = '', imageBase64 = null, meta = {} }) {
  const { apiKey, provider, model } = await getSettings()

  if (!apiKey) {
    throw new Error(
      'API key not configured. Open Pixly options to add your key.'
    )
  }

  if (!model) {
    throw new Error(
      'No model selected. Open Pixly options to configure your model.'
    )
  }

  const buildPrompt = PROMPT_BUILDERS[type]
  if (!buildPrompt) {
    throw new Error(`Unknown action type: ${type}`)
  }

  const prompt = buildPrompt(text, meta)
  const messages = buildMessages(prompt, imageBase64, provider)

  if (provider === AI_PROVIDERS.ANTHROPIC) {
    yield* streamAnthropic(apiKey, model, messages)
  } else {
    yield* streamOpenAI(apiKey, model, messages)
  }
}

/**
 * Get current provider info (for UI display)
 */
export async function getProviderInfo() {
  const { apiKey, provider, model } = await getSettings()
  return { apiKey: !!apiKey, provider, model }
}
