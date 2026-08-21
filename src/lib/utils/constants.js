// Pixly Phase 3 — Constants

export const STORAGE_KEYS = {
  API_KEY: 'pixly_api_key',
  AI_PROVIDER: 'pixly_ai_provider', // 'anthropic' | 'openai'
  AI_MODEL: 'pixly_ai_model',
  DEFAULT_FORMAT: 'pixly_default_format', // 'react-tailwind' | 'html-css' | 'vue' | 'flutter'
  THEME: 'pixly_theme', // 'dark' | 'light' | 'system'
  HISTORY_LIMIT: 'pixly_history_limit', // number, default 50
}

export const AI_PROVIDERS = {
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai',
}

export const DEFAULT_MODELS = {
  [AI_PROVIDERS.ANTHROPIC]: 'claude-3-5-sonnet-20241022',
  [AI_PROVIDERS.OPENAI]: 'gpt-4o',
}

export const API_ENDPOINTS = {
  [AI_PROVIDERS.ANTHROPIC]: 'https://api.anthropic.com/v1/messages',
  [AI_PROVIDERS.OPENAI]: 'https://api.openai.com/v1/chat/completions',
}

export const AI_TYPES = {
  EXPLAIN_TEXT: 'explain-text',
  ANALYZE_IMAGE: 'analyze-image',
  RECREATE_UI: 'recreate-ui',
  SCREENSHOT_AREA: 'screenshot-area',
}

export const CONTEXT_MENU_IDS = {
  EXPLAIN_SELECTION: 'pixly-explain-selection',
  ANALYZE_IMAGE: 'pixly-analyze-image',
}

export const MAX_IMAGE_SIZE = 20 * 1024 * 1024 // 20MB
export const IMAGE_QUALITY = 0.85
export const IMAGE_FORMAT = 'image/png'

// Phase 3: Supported code formats
export const CODE_FORMATS = {
  REACT_TAILWIND: 'react-tailwind',
  HTML_CSS: 'html-css',
  VUE: 'vue',
  FLUTTER: 'flutter',
}

// Phase 3: Error classification types
export const ERROR_TYPES = {
  NO_API_KEY: 'no-api-key',
  INVALID_API_KEY: 'invalid-api-key',
  RATE_LIMIT: 'rate-limit',
  NETWORK: 'network',
  PARSE_ERROR: 'parse-error',
  UNKNOWN: 'unknown',
}
