import React, { useState, useEffect, useCallback } from 'react'
import { getAllSettings, saveAllSettings } from '../lib/storage/settings.js'
import { AI_PROVIDERS, DEFAULT_MODELS } from '../lib/utils/constants.js'
import ApiKeyField from './components/ApiKeyField.jsx'
import DefaultFormatSelector from './components/DefaultFormatSelector.jsx'
import HistorySettings from './components/HistorySettings.jsx'

const PROVIDER_OPTIONS = [
  {
    value: AI_PROVIDERS.ANTHROPIC,
    label: 'Anthropic (Claude)',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ],
  },
  {
    value: AI_PROVIDERS.OPENAI,
    label: 'OpenAI (GPT)',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
    ],
  },
]

const THEME_OPTIONS = [
  { value: 'system', label: 'System', icon: '💻' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'light', label: 'Light', icon: '☀️' },
]

export default function Options() {
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState(AI_PROVIDERS.ANTHROPIC)
  const [model, setModel] = useState(DEFAULT_MODELS[AI_PROVIDERS.ANTHROPIC])
  const [defaultFormat, setDefaultFormat] = useState('html-css')
  const [theme, setTheme] = useState('system')
  const [historyLimit, setHistoryLimit] = useState(50)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  // Apply theme immediately when changed
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  async function loadSettings() {
    try {
      const settings = await getAllSettings()
      setApiKey(settings.apiKey)
      setProvider(settings.aiProvider)
      setModel(settings.aiModel)
      setDefaultFormat(settings.defaultFormat)
      setTheme(settings.theme)
      setHistoryLimit(settings.historyLimit)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  function applyTheme(t) {
    if (typeof document !== 'undefined') {
      if (t === 'system') {
        document.documentElement.removeAttribute('data-theme')
      } else {
        document.documentElement.setAttribute('data-theme', t)
      }
    }
  }

  function handleProviderChange(newProvider) {
    setProvider(newProvider)
    setModel(DEFAULT_MODELS[newProvider] || '')
  }

  async function handleSave() {
    try {
      await saveAllSettings({
        apiKey: apiKey.trim(),
        aiProvider: provider,
        aiModel: model,
        defaultFormat,
        theme,
        historyLimit,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  const currentProvider = PROVIDER_OPTIONS.find((p) => p.value === provider)

  if (loading) {
    return (
      <div className="options-container">
        <div className="options-loading">Loading settings…</div>
      </div>
    )
  }

  return (
    <div className="options-container">
      <div className="options-card">
        {/* Header */}
        <div className="options-header">
          <div className="options-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <h1 className="options-title">Pixly Settings</h1>
            <p className="options-subtitle">Configure your AI provider, defaults, and preferences</p>
          </div>
        </div>

        {/* ─── AI Provider Section ──────────────────────── */}
        <div className="options-section">
          <h2 className="options-section-title">AI Provider</h2>

          {/* Provider selection */}
          <div className="field-group">
            <label className="field-label">Provider</label>
            <div className="radio-group">
              {PROVIDER_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`radio-option ${provider === opt.value ? 'radio-option-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={opt.value}
                    checked={provider === opt.value}
                    onChange={() => handleProviderChange(opt.value)}
                    className="radio-input"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Model selection */}
          <div className="field-group">
            <label className="field-label">Model</label>
            <select
              className="field-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {currentProvider?.models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <ApiKeyField value={apiKey} onChange={setApiKey} provider={provider} />
        </div>

        {/* ─── Defaults Section ─────────────────────────── */}
        <div className="options-section">
          <h2 className="options-section-title">Defaults</h2>
          <DefaultFormatSelector value={defaultFormat} onChange={setDefaultFormat} />
        </div>

        {/* ─── Appearance Section ───────────────────────── */}
        <div className="options-section">
          <h2 className="options-section-title">Appearance</h2>
          <div className="field-group">
            <label className="field-label">Theme</label>
            <div className="theme-options">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`theme-option ${theme === opt.value ? 'theme-option-active' : ''}`}
                  onClick={() => setTheme(opt.value)}
                >
                  <span className="theme-option-icon">{opt.icon}</span>
                  <span className="theme-option-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── History Section ──────────────────────────── */}
        <div className="options-section">
          <h2 className="options-section-title">History</h2>
          <HistorySettings value={historyLimit} onChange={setHistoryLimit} />
        </div>

        {/* ─── Save Button ──────────────────────────────── */}
        <button
          className={`options-save-btn ${saved ? 'options-save-btn-saved' : ''}`}
          onClick={handleSave}
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>

        {/* ─── Info Footer ──────────────────────────────── */}
        <div className="options-info">
          <p>
            <strong>Get an API key:</strong>
          </p>
          {provider === AI_PROVIDERS.ANTHROPIC ? (
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="options-link"
            >
              console.anthropic.com → API Keys
            </a>
          ) : (
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="options-link"
            >
              platform.openai.com → API Keys
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// Inject base styles
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--px-bg, #0f0f11); }
  select option { background: var(--px-bg-card, #1a1a1e); color: var(--px-text, #e8e8ec); }
`
document.head.appendChild(styleSheet)
