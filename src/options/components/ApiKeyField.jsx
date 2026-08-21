import React, { useState, useCallback } from 'react'

/**
 * ApiKeyField — masked input for API key with show/hide and test connection.
 */
export default function ApiKeyField({ value, onChange, provider }) {
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // 'success' | 'error' | null

  const handleTest = useCallback(async () => {
    if (!value || testing) return
    setTesting(true)
    setTestResult(null)

    try {
      const endpoint =
        provider === 'openai'
          ? 'https://api.openai.com/v1/models'
          : 'https://api.anthropic.com/v1/models'

      const headers =
        provider === 'openai'
          ? { Authorization: `Bearer ${value}` }
          : { 'x-api-key': value, 'anthropic-version': '2023-06-01' }

      const response = await fetch(endpoint, { method: 'GET', headers })
      setTestResult(response.ok ? 'success' : 'error')
    } catch {
      setTestResult('error')
    } finally {
      setTesting(false)
      setTimeout(() => setTestResult(null), 3000)
    }
  }, [value, testing, provider])

  const placeholder =
    provider === 'openai' ? 'sk-...' : 'sk-ant-...'

  return (
    <div className="field-group">
      <label className="field-label">API Key</label>
      <div className="api-key-row">
        <input
          type={showKey ? 'text' : 'password'}
          className="field-input field-input-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="field-btn"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? 'Hide' : 'Show'}
        </button>
        <button
          type="button"
          className={`field-btn field-btn-test ${
            testResult === 'success' ? 'field-btn-success' :
            testResult === 'error' ? 'field-btn-error' : ''
          }`}
          onClick={handleTest}
          disabled={testing || !value}
        >
          {testing ? '…' : testResult === 'success' ? '✓ OK' : testResult === 'error' ? '✕ Fail' : 'Test'}
        </button>
      </div>
      <p className="field-hint">
        Your key stays in your browser and is only sent to the AI provider.
      </p>
    </div>
  )
}
