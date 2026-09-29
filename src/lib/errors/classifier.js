// Pixly Phase 4a — Error Classifier
// Maps raw failures from any AI call (text, image, box, codegen) to fixed error states.

export const ERROR_STATES = {
  NO_API_KEY: 'NO_API_KEY',
  INVALID_KEY: 'INVALID_KEY',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK_FAILURE: 'NETWORK_FAILURE',
  MALFORMED_RESPONSE: 'MALFORMED_RESPONSE',
  IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
  UNKNOWN: 'UNKNOWN',
}

/**
 * Classify any error into a canonical error state with human-friendly title, message, and action.
 *
 * @param {Error|string|object} error - Raw error object, message, or validation failure
 * @returns {{ state: string, type: string, title: string, message: string, actionType: string, rawMessage: string }}
 */
export function classifyError(error) {
  if (!error) {
    return {
      state: ERROR_STATES.UNKNOWN,
      type: ERROR_STATES.UNKNOWN,
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Try again.',
      actionType: 'retry',
      rawMessage: '',
    }
  }

  // If already classified, normalize and return
  if (typeof error === 'object' && (error.state || error.type)) {
    const rawState = error.state || error.type
    // Map existing string types to canonical ERROR_STATES if needed
    const stateMap = {
      'no-api-key': ERROR_STATES.NO_API_KEY,
      'invalid-api-key': ERROR_STATES.INVALID_KEY,
      'rate-limit': ERROR_STATES.RATE_LIMITED,
      network: ERROR_STATES.NETWORK_FAILURE,
      'parse-error': ERROR_STATES.MALFORMED_RESPONSE,
      'image-too-large': ERROR_STATES.IMAGE_TOO_LARGE,
      unknown: ERROR_STATES.UNKNOWN,
    }
    const state = stateMap[rawState] || rawState
    if (Object.values(ERROR_STATES).includes(state)) {
      return getErrorDetails(state, error.message || error.rawMessage)
    }
  }

  // Handle codegen validation failure object { isValid: false, reason: ... }
  if (typeof error === 'object' && error.isValid === false) {
    return getErrorDetails(ERROR_STATES.MALFORMED_RESPONSE, error.reason || 'Code validation failed')
  }

  const rawMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error))
  const lower = rawMessage.toLowerCase()
  const status = error?.status || error?.statusCode || error?.code

  // 1. NO_API_KEY
  if (
    lower.includes('api key not configured') ||
    lower.includes('no api key') ||
    lower.includes('api key not set') ||
    lower.includes('missing api key') ||
    lower.includes('no_api_key')
  ) {
    return getErrorDetails(ERROR_STATES.NO_API_KEY, rawMessage)
  }

  // 2. INVALID_KEY (401)
  if (
    status === 401 ||
    lower.includes('401') ||
    lower.includes('unauthorized') ||
    lower.includes('invalid api key') ||
    lower.includes('invalid_api_key') ||
    lower.includes('authentication_error') ||
    lower.includes('incorrect api key')
  ) {
    return getErrorDetails(ERROR_STATES.INVALID_KEY, rawMessage)
  }

  // 3. RATE_LIMITED (429)
  if (
    status === 429 ||
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('rate_limit_error') ||
    lower.includes('too many requests') ||
    lower.includes('quota exceeded') ||
    lower.includes('resource_exhausted')
  ) {
    return getErrorDetails(ERROR_STATES.RATE_LIMITED, rawMessage)
  }

  // 4. IMAGE_TOO_LARGE (413 or size limit)
  if (
    status === 413 ||
    lower.includes('413') ||
    lower.includes('too large') ||
    lower.includes('payload too large') ||
    lower.includes('image size') ||
    lower.includes('max_image_size') ||
    lower.includes('exceeds max') ||
    lower.includes('request entity too large')
  ) {
    return getErrorDetails(ERROR_STATES.IMAGE_TOO_LARGE, rawMessage)
  }

  // 5. NETWORK_FAILURE
  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('networkerror') ||
    lower.includes('econnrefused') ||
    lower.includes('timeout') ||
    lower.includes('connection refused') ||
    lower.includes('load failed')
  ) {
    return getErrorDetails(ERROR_STATES.NETWORK_FAILURE, rawMessage)
  }

  // 6. MALFORMED_RESPONSE
  if (
    lower.includes('json') ||
    lower.includes('parse') ||
    lower.includes('malformed') ||
    lower.includes('unexpected token') ||
    lower.includes('syntaxerror') ||
    lower.includes('validation failure') ||
    lower.includes('unbalanced') ||
    lower.includes('truncated response')
  ) {
    return getErrorDetails(ERROR_STATES.MALFORMED_RESPONSE, rawMessage)
  }

  // 7. UNKNOWN fallback
  return getErrorDetails(ERROR_STATES.UNKNOWN, rawMessage)
}

function getErrorDetails(state, rawMessage = '') {
  switch (state) {
    case ERROR_STATES.NO_API_KEY:
      return {
        state: ERROR_STATES.NO_API_KEY,
        type: 'no-api-key', // backwards compatibility
        title: 'API Key Required',
        message: 'Add your API key in Settings to use Pixly.',
        actionType: 'open-options',
        actionLabel: 'Add API Key',
        rawMessage,
      }
    case ERROR_STATES.INVALID_KEY:
      return {
        state: ERROR_STATES.INVALID_KEY,
        type: 'invalid-api-key',
        title: 'Invalid API Key',
        message: 'Your API key was rejected by the provider. Check your key in Settings.',
        actionType: 'open-options',
        actionLabel: 'Check API Key',
        rawMessage,
      }
    case ERROR_STATES.RATE_LIMITED:
      return {
        state: ERROR_STATES.RATE_LIMITED,
        type: 'rate-limit',
        title: 'Rate Limited',
        message: "You've hit the provider's rate limit — try again in a moment.",
        actionType: 'retry',
        actionLabel: 'Try Again',
        rawMessage,
      }
    case ERROR_STATES.NETWORK_FAILURE:
      return {
        state: ERROR_STATES.NETWORK_FAILURE,
        type: 'network',
        title: 'Network Error',
        message: 'Check your connection and try again.',
        actionType: 'retry',
        actionLabel: 'Retry',
        rawMessage,
      }
    case ERROR_STATES.MALFORMED_RESPONSE:
      return {
        state: ERROR_STATES.MALFORMED_RESPONSE,
        type: 'parse-error',
        title: 'Unexpected Response',
        message: 'Got an unexpected response from the AI model.',
        actionType: 'retry',
        actionLabel: 'Try Again',
        rawMessage,
      }
    case ERROR_STATES.IMAGE_TOO_LARGE:
      return {
        state: ERROR_STATES.IMAGE_TOO_LARGE,
        type: 'image-too-large',
        title: 'Image Too Large',
        message: 'Try a smaller selection.',
        actionType: 'none',
        actionLabel: null,
        rawMessage,
      }
    case ERROR_STATES.UNKNOWN:
    default:
      return {
        state: ERROR_STATES.UNKNOWN,
        type: 'unknown',
        title: 'Something went wrong',
        message: rawMessage && rawMessage.length < 120 ? rawMessage : 'An unexpected error occurred. Try again.',
        actionType: 'retry',
        actionLabel: 'Try Again',
        rawMessage,
      }
  }
}
