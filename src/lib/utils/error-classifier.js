// Pixly Phase 3 — Error Classifier
// Maps raw errors to structured error types with actionable messages.

import { ERROR_TYPES } from './constants.js'

/**
 * Classify an error into a structured error object.
 *
 * @param {Error|string} error
 * @returns {{ type: string, title: string, message: string, action?: { label: string, action: string } }}
 */
export function classifyError(error) {
  const message = error?.message || String(error) || 'Unknown error occurred'
  const lower = message.toLowerCase()

  // No API key
  if (lower.includes('api key not configured') || lower.includes('api key not set') || lower.includes('no api key')) {
    return {
      type: ERROR_TYPES.NO_API_KEY,
      title: 'API Key Required',
      message: 'Add your API key in Settings to use Pixly.',
      action: { label: 'Open Settings', action: 'open-options' },
    }
  }

  // Invalid / unauthorized API key (401)
  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('invalid api key') || lower.includes('authentication')) {
    return {
      type: ERROR_TYPES.INVALID_API_KEY,
      title: 'Invalid API Key',
      message: 'Your API key was rejected by the provider. Check your key in Settings.',
      action: { label: 'Open Settings', action: 'open-options' },
    }
  }

  // Rate limit (429)
  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) {
    return {
      type: ERROR_TYPES.RATE_LIMIT,
      title: 'Rate Limited',
      message: 'Too many requests. Wait a moment and try again.',
      action: null,
    }
  }

  // Network errors
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('econnrefused') || lower.includes('timeout') || lower.includes('networkerror')) {
    return {
      type: ERROR_TYPES.NETWORK,
      title: 'Network Error',
      message: 'Could not reach the AI provider. Check your internet connection.',
      action: null,
    }
  }

  // Parse / malformed response
  if (lower.includes('json') || lower.includes('parse') || lower.includes('malformed') || lower.includes('unexpected token')) {
    return {
      type: ERROR_TYPES.PARSE_ERROR,
      title: 'Unexpected Response',
      message: 'The AI returned an unexpected response. Try again.',
      action: null,
    }
  }

  // Unknown
  return {
    type: ERROR_TYPES.UNKNOWN,
    title: 'Something went wrong',
    message: message.length > 200 ? message.slice(0, 200) + '…' : message,
    action: null,
  }
}
