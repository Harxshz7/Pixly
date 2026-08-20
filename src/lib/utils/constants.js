// Pixly Phase 1 — Constants

export const STORAGE_KEYS = {
  API_KEY: 'pixly_api_key',
  AI_PROVIDER: 'pixly_ai_provider', // 'anthropic' | 'openai'
  AI_MODEL: 'pixly_ai_model',
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
