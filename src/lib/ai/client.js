// Pixly Phase 1 — AI Client
// Unified wrapper for Anthropic Claude and OpenAI GPT APIs

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
 * Send a request to Anthropic Claude API
 */
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

/**
 * Send a request to OpenAI API
 */
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

/**
 * Build messages array handling images for both providers
 */
function buildMessages(prompt, imageDataUrl = null) {
  if (!imageDataUrl) {
    return prompt.messages
  }

  // Inject image into the last user message
  const messages = prompt.messages.map((m, i) => {
    if (i === prompt.messages.length - 1 && m.role === 'user') {
      // For Anthropic, the image is a separate content block
      return m // image handling happens at provider level
    }
    return m
  })

  return messages
}

/**
 * Main AI call — dispatches to the configured provider
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

  // Build messages array
  const messages = []

  if (prompt.system) {
    messages.push({ role: 'system', content: prompt.system })
  }

  for (const msg of prompt.messages) {
    if (msg.role === 'user' && imageDataUrl) {
      // Multi-modal user message with image
      if (provider === AI_PROVIDERS.ANTHROPIC) {
        messages.push({
          role: 'user',
          content: [
            toAnthropicImagePart(imageDataUrl),
            { type: 'text', text: msg.content },
          ],
        })
      } else {
        // OpenAI
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

  if (provider === AI_PROVIDERS.ANTHROPIC) {
    return callAnthropic(apiKey, model, messages)
  } else {
    return callOpenAI(apiKey, model, messages)
  }
}

/**
 * Get current provider info (for UI display)
 */
export async function getProviderInfo() {
  const { apiKey, provider, model } = await getSettings()
  return { apiKey: !!apiKey, provider, model }
}
