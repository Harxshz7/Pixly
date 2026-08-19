import React, { useState, useEffect, useCallback } from 'react'
import ResultView from './components/ResultView.jsx'
import LoadingState from './components/LoadingState.jsx'
import { MESSAGE_TYPES } from '../lib/utils/constants.js'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState(null)
  const [result, setResult] = useState(null)
  const [resultAction, setResultAction] = useState(null)
  const [resultSource, setResultSource] = useState(null)
  const [error, setError] = useState(null)

  // Listen for messages from background service worker
  useEffect(() => {
    const listener = (message) => {
      if (message.type === MESSAGE_TYPES.AI_STREAM_START) {
        // Streaming is starting — show streaming state with partial result
        setLoading(false)
        setLoadingAction(null)
        setResult('')
        setResultAction(message.action)
        setResultSource(message.source)
        setError(null)
      } else if (message.type === MESSAGE_TYPES.AI_STREAM_TOKEN) {
        // Append token to the result
        setResult((prev) => prev + message.token)
      } else if (message.type === MESSAGE_TYPES.AI_STREAM_END) {
        // Streaming complete
        setLoading(false)
        setLoadingAction(null)
        setResult(message.result)
        setResultAction(message.action)
        setResultSource(message.source)
        setError(null)
      } else if (message.type === MESSAGE_TYPES.AI_RESULT) {
        // Non-streaming result (fallback)
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

  const openOptions = useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  const handleNewAnalysis = useCallback(() => {
    setResult(null)
    setResultAction(null)
    setResultSource(null)
    setError(null)
  }, [])

  // Determine current state
  const isStreaming = !loading && !error && resultAction !== null && (result === '' || result !== null)
  const state = loading ? 'loading' : error ? 'error' : result !== null ? 'result' : 'idle'

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
          {state === 'result' && (
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

      {/* Content — single area that switches by state */}
      <main className="app-content">
        {state === 'idle' && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h2>Waiting for selection</h2>
            <p>
              Select text on any page and click the ⚡ button, or right-click to use Pixly.
            </p>
          </div>
        )}

        {state === 'loading' && (
          <LoadingState action={loadingAction} />
        )}

        {state === 'error' && (
          <div className="error-state">
            <strong>Something went wrong</strong>
            {error}
          </div>
        )}          {state === 'result' && (
            <ResultView
              result={result}
              action={resultAction}
              source={resultSource}
              isStreaming={isStreaming}
            />
        )}
      </main>
    </div>
  )
}
