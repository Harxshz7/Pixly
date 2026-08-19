// Pixly Phase 1 — Settings storage
// Wraps chrome.storage.local for persisting user settings

import { STORAGE_KEYS, AI_PROVIDERS, DEFAULT_MODELS } from '../utils/constants.js'

/**
 * Get a setting value
 */
export async function getSetting(key) {
  const result = await chrome.storage.local.get(key)
  return result[key] ?? null
}

/**
 * Set a setting value
 */
export async function setSetting(key, value) {
  await chrome.storage.local.set({ [key]: value })
}

/**
 * Remove a setting
 */
export async function removeSetting(key) {
  await chrome.storage.local.remove(key)
}

/**
 * Get all Pixly settings
 */
export async function getAllSettings() {
  const keys = Object.values(STORAGE_KEYS)
  const result = await chrome.storage.local.get(keys)
  return {
    apiKey: result[STORAGE_KEYS.API_KEY] || '',
    aiProvider: result[STORAGE_KEYS.AI_PROVIDER] || AI_PROVIDERS.ANTHROPIC,
    aiModel: result[STORAGE_KEYS.AI_MODEL] || DEFAULT_MODELS[AI_PROVIDERS.ANTHROPIC],
  }
}

/**
 * Save all settings at once
 */
export async function saveAllSettings({ apiKey, aiProvider, aiModel }) {
  const updates = {}
  if (apiKey !== undefined) updates[STORAGE_KEYS.API_KEY] = apiKey
  if (aiProvider !== undefined) {
    updates[STORAGE_KEYS.AI_PROVIDER] = aiProvider
    // Auto-set default model when provider changes if no custom model
    if (aiModel === undefined) {
      updates[STORAGE_KEYS.AI_MODEL] = DEFAULT_MODELS[aiProvider] || ''
    }
  }
  if (aiModel !== undefined) updates[STORAGE_KEYS.AI_MODEL] = aiModel
  await chrome.storage.local.set(updates)
}

/**
 * Check if API key is configured
 */
export async function isConfigured() {
  const key = await getSetting(STORAGE_KEYS.API_KEY)
  return !!key
}
