import React, { useState, useEffect, useCallback } from 'react'
import ResultView from './components/ResultView.jsx'
import LoadingState from './components/LoadingState.jsx'
import { ACTIONS, createMessage } from '../lib/utils/messaging.js'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState(null)
  const [error, setError] = useState(null)

  // Phase 1 state (raw text results)
  const [rawResult, setRawResult] = useState(null)
  const [rawResultAction, setRawResultAction] = useState(null)

  // Phase 2 state (structured analysis)
  const [analysisData, setAnalysisData] = useState(null)
  const [codeResult, setCodeResult] = useState(null)
  const [codeFormat, setCodeFormat] = useState('html-css')
  const [variationsData, setVariationsData] = useState(null)

  // Listen for messages from background service worker
  useEffect(() => {
    const listener = (message) => {
      if (message.action === ACTIONS.LOADING) {
        setLoading(true)
        setLoadingAction(message.payload.action)
        setError(null)
      } else if (message.action === ACTIONS.RESULT_READY) {
        // Phase 1: raw text result
        setLoading(false)
        setLoadingAction(null)
        setRawResult(message.payload.result)
        setRawResultAction(message.payload.action)
        setError(null)
      } else if (message.action === ACTIONS.ANALYSIS_READY) {
        // Phase 2: structured analysis
        setLoading(false)
        setLoadingAction(null)
        setAnalysisData(message.payload.analysis)
        setCodeResult(null)
        setVariationsData(null)
        setError(null)
      } else if (message.action === ACTIONS.CODE_READY) {
        // Phase 2: generated code for a format
        setCodeResult(message.payload.code)
        setCodeFormat(message.payload.format)
      } else if (message.action === ACTIONS.VARIATIONS_READY) {
        // Phase 2: generated variations
        setVariationsData(message.payload.variations)
      } else if (message.action === ACTIONS.RESULT_ERROR) {
        setLoading(false)
        setLoadingAction(null)
        setError(message.payload.error)
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  const openOptions = useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  const handleNewAnalysis = useCallback(() => {
    setRawResult(null)
    setRawResultAction(null)
    setAnalysisData(null)
    setCodeResult(null)
    setCodeFormat('html-css')
    setVariationsData(null)
    setLoading(false)
    setLoadingAction(null)
    setError(null)
  }, [])

  const handleDrawBox = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        chrome.tabs.sendMessage(
          tab.id,
          createMessage(ACTIONS.START_DRAW_BOX)
        )
      }
    } catch (err) {
      console.error('Failed to start draw box:', err)
    }
  }, [])

  const handleFormatChange = useCallback((format) => {
    setCodeFormat(format)
    setCodeResult(null)
    // Request code generation from background
    chrome.runtime.sendMessage(
      createMessage(ACTIONS.GENERATE_CODE, {
        format,
        analysis: analysisData,
      })
    )
  }, [analysisData])

  const handleGenerateVariations = useCallback(() => {
    setVariationsData(null)
    chrome.runtime.sendMessage(
      createMessage(ACTIONS.GENERATE_VARIATIONS, {
        analysis: analysisData,
      })
    )
  }, [analysisData])

  // Determine current state
  const hasAnalysis = analysisData !== null
  const hasRawResult = rawResult !== null
  const state = loading ? 'loading' : error ? 'error' : hasAnalysis ? 'analysis' : hasRawResult ? 'result' : 'idle'

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
          {(state === 'result' || state === 'analysis') && (
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
            <button
              className="btn btn-primary draw-box-btn"
              onClick={handleDrawBox}
              style={{ marginTop: 16 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="4 2" />
              </svg>
              Draw Box
              <span className="shortcut-hint">Ctrl+Shift+X</span>
            </button>
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
        )}

        {state === 'result' && (
          <ResultView result={rawResult} action={rawResultAction} />
        )}

        {state === 'analysis' && (
          <ResultView
            analysis={analysisData}
            codeResult={codeResult}
            codeFormat={codeFormat}
            variations={variationsData}
            onFormatChange={handleFormatChange}
            onGenerateVariations={handleGenerateVariations}
          />
        )}
      </main>
    </div>
  )
}
