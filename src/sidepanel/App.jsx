import React, { useState, useEffect, useCallback } from 'react'
import ResultView from './components/ResultView.jsx'
import LoadingState from './components/LoadingState.jsx'
import { MESSAGE_TYPES } from '../lib/utils/constants.js'
import { isConfigured, getAllSettings } from '../lib/storage/settings.js'
import { aiComplete } from '../lib/ai/client.js'
import { buildTextExplainPrompt } from '../lib/ai/prompts/text-explain.js'
import { buildImageAnalyzePrompt, buildScreenshotAnalyzePrompt } from '../lib/ai/prompts/image-analyze.js'
import { buildUIRecreatePrompt } from '../lib/ai/prompts/ui-recreate.js'
import { imageUrlToDataUrl, compressImage } from '../lib/capture/image-utils.js'
import { captureVisibleTab } from '../lib/capture/screenshot.js'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState(null)
  const [result, setResult] = useState(null)
  const [resultAction, setResultAction] = useState(null)
  const [resultSource, setResultSource] = useState(null)
  const [error, setError] = useState(null)
  const [configured, setConfigured] = useState(true) // assume true until checked
  const [manualText, setManualText] = useState('')
  const [manualUrl, setManualUrl] = useState('')

  // Check configuration on mount
  useEffect(() => {
    checkConfig()
  }, [])

  // Listen for messages from background service worker
  useEffect(() => {
    const listener = (message) => {
      if (message.type === MESSAGE_TYPES.AI_RESULT) {
        setLoading(false)
        setLoadingAction(null)
        setResult(message.result)
        setResultAction(message.action)
        setResultSource(message.source)
        setError(null)
      } else if (message.type === MESSAGE_TYPES.AI_ERROR) {
        setLoading(false)
        setLoadingAction(null)
        setError(message.error)
      } else if (message.type === 'pixly:loading') {
        setLoading(true)
        setLoadingAction(message.action)
        setError(null)
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  async function checkConfig() {
    try {
      const settings = await isConfigured()
      setConfigured(settings)
    } catch {
      setConfigured(false)
    }
  }

  const openOptions = useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  const startDrawBox = useCallback(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: MESSAGE_TYPES.START_DRAW_BOX })
    }
  }, [])

  const handleManualSubmit = useCallback(async () => {
    if (!manualText.trim()) return

    setLoading(true)
    setLoadingAction('explain-text')
    setError(null)

    try {
      const prompt = buildTextExplainPrompt(manualText.trim())
      const result = await aiComplete(prompt)
      setLoading(false)
      setLoadingAction(null)
      setResult(result)
      setResultAction('explain-text')
      setResultSource({ type: 'text', content: manualText.trim() })
    } catch (err) {
      setLoading(false)
      setLoadingAction(null)
      setError(err.message)
    }
  }, [manualText])

  const handleScreenshotAnalyze = useCallback(async () => {
    setLoading(true)
    setLoadingAction('screenshot-area')
    setError(null)

    try {
      const screenshot = await captureVisibleTab()
      const compressed = await compressImage(screenshot)
      const prompt = buildScreenshotAnalyzePrompt()
      const result = await aiComplete(prompt, compressed)
      setLoading(false)
      setLoadingAction(null)
      setResult(result)
      setResultAction('screenshot-area')
      setResultSource({ type: 'screenshot' })
    } catch (err) {
      setLoading(false)
      setLoadingAction(null)
      setError(err.message)
    }
  }, [])

  const handleNewAnalysis = useCallback(() => {
    setResult(null)
    setResultAction(null)
    setResultSource(null)
    setError(null)
    setManualText('')
  }, [])

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Pixly
        </div>
        <div className="app-actions">
          {result && (
            <button className="btn-icon" onClick={handleNewAnalysis} title="New analysis">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
          <button className="btn-icon" onClick={openOptions} title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="app-content">
        {/* Not configured state */}
        {!configured && !loading && !result && (
          <div className="settings-prompt">
            <p>
              Add your API key to get started with Pixly.
            </p>
            <button className="btn btn-primary" onClick={openOptions}>
              Open Settings
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingState action={loadingAction} />}

        {/* Error */}
        {error && !loading && (
          <div className="error-state">
            <strong>Something went wrong</strong>
            {error}
          </div>
        )}

        {/* Result */}
        {!loading && result && (
          <ResultView
            result={result}
            action={resultAction}
            source={resultSource}
          />
        )}

        {/* Action buttons (shown when idle) */}
        {!loading && !result && configured && (
          <>
            <div className="action-buttons">
              <button className="action-btn" onClick={handleScreenshotAnalyze}>
                <div className="action-btn-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                Capture Page
              </button>

              <button className="action-btn" onClick={startDrawBox}>
                <div className="action-btn-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="5 3" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
                Draw Box
              </button>

              <button className="action-btn" onClick={() => document.getElementById('manual-input')?.focus()}>
                <div className="action-btn-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                </div>
                Paste Text
              </button>
            </div>

            {/* Manual text input */}
            <div style={{ marginTop: 8 }}>
              <textarea
                id="manual-input"
                className="btn-secondary"
                placeholder="Or paste text here to explain..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleManualSubmit()
                  }
                }}
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: 12,
                  background: 'var(--px-bg-secondary)',
                  border: '1px solid var(--px-border)',
                  borderRadius: 'var(--px-radius)',
                  color: 'var(--px-text)',
                  fontFamily: 'var(--px-font)',
                  fontSize: 13,
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              {manualText.trim() && (
                <button
                  className="btn btn-primary"
                  onClick={handleManualSubmit}
                  style={{ marginTop: 8, width: '100%' }}
                >
                  Explain Text
                </button>
              )}
            </div>

            {/* Instructions */}
            <div style={{
              marginTop: 16,
              padding: 12,
              background: 'var(--px-bg-secondary)',
              borderRadius: 'var(--px-radius)',
              fontSize: 12,
              color: 'var(--px-text-muted)',
              lineHeight: 1.6,
            }}>
              <strong style={{ color: 'var(--px-text-secondary)' }}>Quick actions:</strong>
              <br />
              • Select text on any page → click the ⚡ button
              <br />
              • Right-click → Pixly: Explain / Analyze
              <br />
              • Use Draw Box to capture a UI section
            </div>
          </>
        )}
      </main>
    </div>
  )
}
