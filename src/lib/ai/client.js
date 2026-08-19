// Pixly Phase 1 — AI Client
// Unified wrapper for Anthropic Claude and OpenAI GPT APIs
// Supports both streaming and non-streaming modes

import {
  AI_PROVIDERS,
  API_ENDPOINTS,
  DEFAULT_MODELS,
  STORAGE_KEYS,
} from '../utils/constants.js'

/**
 * Get settings from chrome.storage.local
 */
async function getSettings() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.API_KEY,
    STORAGE_KEYS.AI_PROVIDER,
    STORAGE_KEYS.AI_MODEL,
  ])
  return {
    apiKey: result[STORAGE_KEYS.API_KEY] || '',
    provider: result[STORAGE_KEYS.AI_PROVIDER] || AI_PROVIDERS.ANTHROPIC,
    model: result[STORAGE_KEYS.AI_MODEL] || DEFAULT_MODELS[AI_PROVIDERS.ANTHROPIC],
  }
}

/**
 * Build the messages array from a prompt and optional image
 */
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

/**
 * Convert image to base64 data URL format for Anthropic
 */
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

/**
 * Convert image to base64 data URL format for OpenAI
 */
function toOpenAIImagePart(dataUrl) {
  return {
    type: 'image_url',
    image_url: { url: dataUrl },
  }
}

// ─── Non-streaming (original) ────────────────────────────────────────────────

async function callAnthropic(apiKey, model, messages, maxTokens = 4096) {
  const systemMessage = messages.find((m) => m.role === 'system')
  const nonSystemMessages = messages.filter((m) => m.role !== 'system')

  const body = {
    model,
    max_tokens: maxTokens,
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

  const data = await response.json()
  return data.content[0]?.text || ''
}

async function callOpenAI(apiKey, model, messages, maxTokens = 4096) {
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
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      error.error?.message || `OpenAI API error: ${response.status}`
    )
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

/**
 * Main AI call (non-streaming) — dispatches to the configured provider
 * @param {object} prompt - { system?: string, messages: Array<{role, content}> }
 * @param {string|null} imageDataUrl - Optional base64 data URL for image analysis
 * @returns {Promise<string>} AI response text
 */
export async function aiComplete(prompt, imageDataUrl = null) {
  const { apiKey, provider, model } = await getSettings()

  if (!apiKey) {
    throw new Error('API key not configured. Open Pixly options to add your key.')
  }

  if (!model) {
    throw new Error('No model selected. Open Pixly options to configure your model.')
  }

  const messages = buildMessages(prompt, imageDataUrl, provider)

  if (provider === AI_PROVIDERS.ANTHROPIC) {
    return callAnthropic(apiKey, model, messages)
  } else {
    return callOpenAI(apiKey, model, messages)
  }
}

// ─── Streaming ──────────────────────────────────────────────────────────────

/**
 * Parse SSE lines from a ReadableStream.
 * Yields { event, data } objects.
 */
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

    // Yield any remaining data in buffer
    if (currentData) {
      yield { event: currentEvent, data: currentData }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Stream from Anthropic API — yields text tokens as they arrive
 * @param {string} apiKey
 * @param {string} model
 * @param {Array} messages
 * @param {number} maxTokens
 * @yields {string} text tokens
 */
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

/**
 * Stream from OpenAI API — yields text tokens as they arrive
 * @param {string} apiKey
 * @param {string} model
 * @param {Array} messages
 * @param {number} maxTokens
 * @yields {string} text tokens
 */
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

/**
 * Streaming AI call — dispatches to the configured provider.
 * Returns an async generator that yields text tokens.
 *
 * @param {object} prompt - { system?: string, messages: Array<{role, content}> }
 * @param {string|null} imageDataUrl - Optional base64 data URL for image analysis
 * @returns {AsyncGenerator<string>} Yields text tokens as they arrive
 */
export async function* aiCompleteStream(prompt, imageDataUrl = null) {
  const { apiKey, provider, model } = await getSettings()

  if (!apiKey) {
    throw new Error('API key not configured. Open Pixly options to add your key.')
  }

  if (!model) {
    throw new Error('No model selected. Open Pixly options to configure your model.')
  }

  const messages = buildMessages(prompt, imageDataUrl, provider)

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
