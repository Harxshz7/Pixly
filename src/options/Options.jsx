import React, { useState, useEffect } from 'react'
import { getAllSettings, saveAllSettings } from '../lib/storage/settings.js'
import { AI_PROVIDERS, DEFAULT_MODELS } from '../lib/utils/constants.js'

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

export default function Options() {
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState(AI_PROVIDERS.ANTHROPIC)
  const [model, setModel] = useState(DEFAULT_MODELS[AI_PROVIDERS.ANTHROPIC])
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showKey, setShowKey] = useState(false)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const settings = await getAllSettings()
      setApiKey(settings.apiKey)
      setProvider(settings.aiProvider)
      setModel(settings.aiModel)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleProviderChange(newProvider) {
    setProvider(newProvider)
    // Reset to default model for the new provider
    setModel(DEFAULT_MODELS[newProvider] || '')
  }

  async function handleSave() {
    try {
      await saveAllSettings({
        apiKey: apiKey.trim(),
        aiProvider: provider,
        aiModel: model,
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
      <div style={styles.container}>
        <div style={styles.loading}>Loading settings...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <div>
            <h1 style={styles.title}>Pixly Settings</h1>
            <p style={styles.subtitle}>Configure your AI provider and API key</p>
          </div>
        </div>

        {/* Provider Selection */}
        <div style={styles.field}>
          <label style={styles.label}>AI Provider</label>
          <div style={styles.radioGroup}>
            {PROVIDER_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  ...styles.radioOption,
                  ...(provider === opt.value ? styles.radioOptionActive : {}),
                }}
              >
                <input
                  type="radio"
                  name="provider"
                  value={opt.value}
                  checked={provider === opt.value}
                  onChange={() => handleProviderChange(opt.value)}
                  style={styles.radioInput}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div style={styles.field}>
          <label style={styles.label}>Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={styles.select}
          >
            {currentProvider?.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div style={styles.field}>
          <label style={styles.label}>API Key</label>
          <div style={styles.keyInputWrapper}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === AI_PROVIDERS.ANTHROPIC ? 'sk-ant-...' : 'sk-...'}
              style={styles.input}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={styles.showBtn}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p style={styles.hint}>
            Your API key stays in your browser and is never sent anywhere except the AI provider's API.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          style={{
            ...styles.saveBtn,
            ...(saved ? styles.saveBtnSaved : {}),
          }}
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>

        {/* Info */}
        <div style={styles.info}>
          <p>
            <strong>Get an API key:</strong>
          </p>
          {provider === AI_PROVIDERS.ANTHROPIC ? (
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              console.anthropic.com → API Keys
            </a>
          ) : (
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              platform.openai.com → API Keys
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0f0f11',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    background: '#1a1a1e',
    border: '1px solid #2a2a2e',
    borderRadius: 12,
    padding: 32,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#e8e8ec',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#9393a0',
    margin: 0,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#e8e8ec',
    marginBottom: 8,
  },
  radioGroup: {
    display: 'flex',
    gap: 8,
  },
  radioOption: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: '#242428',
    border: '1px solid #2a2a2e',
    borderRadius: 8,
    color: '#9393a0',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  radioOptionActive: {
    borderColor: '#6366f1',
    color: '#e8e8ec',
    background: 'rgba(99, 102, 241, 0.12)',
  },
  radioInput: {
    display: 'none',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    background: '#242428',
    border: '1px solid #2a2a2e',
    borderRadius: 8,
    color: '#e8e8ec',
    fontSize: 13,
    fontFamily: '"SF Mono", "Fira Code", Menlo, monospace',
    outline: 'none',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: '#242428',
    border: '1px solid #2a2a2e',
    borderRadius: 8,
    color: '#e8e8ec',
    fontSize: 13,
    fontFamily: '"SF Mono", "Fira Code", Menlo, monospace',
    outline: 'none',
  },
  keyInputWrapper: {
    display: 'flex',
    gap: 8,
  },
  showBtn: {
    padding: '10px 14px',
    background: '#242428',
    border: '1px solid #2a2a2e',
    borderRadius: 8,
    color: '#9393a0',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  hint: {
    fontSize: 11,
    color: '#6b6b78',
    marginTop: 6,
    lineHeight: 1.5,
  },
  saveBtn: {
    width: '100%',
    padding: '12px 24px',
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
    transition: 'background 0.15s',
  },
  saveBtnSaved: {
    background: '#22c55e',
  },
  info: {
    marginTop: 24,
    padding: 16,
    background: '#242428',
    borderRadius: 8,
    fontSize: 13,
    color: '#9393a0',
    lineHeight: 1.6,
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none',
  },
  loading: {
    color: '#9393a0',
    fontSize: 14,
  },
}

// Inject basic styles for select option elements
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  select option {
    background: #242428;
    color: #e8e8ec;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0f0f11; }
`
document.head.appendChild(styleSheet)
