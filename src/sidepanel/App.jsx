import React, { useState, useEffect, useCallback } from 'react'
import ResultView from './components/ResultView.jsx'
import LoadingState from './components/LoadingState.jsx'
import ErrorState from './components/ErrorState.jsx'
import EmptyState from './components/EmptyState.jsx'
import HistoryList from './components/HistoryList.jsx'
import ExportButton from './components/ExportButton.jsx'
import { ACTIONS, createMessage } from '../lib/utils/messaging.js'
import { getAllSettings } from '../lib/storage/settings.js'
import { saveToHistory, updateHistoryEntry } from '../lib/storage/history.js'

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

  // Phase 3 state
  const [historyId, setHistoryId] = useState(null) // ID of the current result in history
  const [defaultFormat, setDefaultFormat] = useState('html-css')
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0) // Force HistoryList to re-mount

  // Load settings on mount + apply theme
  useEffect(() => {
    getAllSettings().then((settings) => {
      setDefaultFormat(settings.defaultFormat || 'html-css')
      // Apply theme
      applyTheme(settings.theme || 'system')
    })
  }, [])

  function applyTheme(t) {
    if (t === 'system') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', t)
    }
  }

  // Listen for messages from background service worker
  useEffect(() => {
    const listener = (message) => {
      if (message.action === ACTIONS.LOADING) {
        setLoading(true)
        setLoadingAction(message.payload.action)
        setError(null)
      } else if (message.action === ACTIONS.RESULT_READY) {
        setLoading(false)
        setLoadingAction(null)
        setRawResult(message.payload.result)
        setRawResultAction(message.payload.action)
        setError(null)
        // Auto-save to history — determine type from action
        const historyType = message.payload.action === 'analyze-image' ? 'image' : 'text'
        autoSaveToHistory({
          type: historyType,
          snippet: (message.payload.result || '').slice(0, 120),
          result: message.payload.result,
          pageUrl: message.payload.pageUrl,
          pageTitle: message.payload.pageTitle,
        })
      } else if (message.action === ACTIONS.ANALYSIS_READY) {
        setLoading(false)
        setLoadingAction(null)
        setAnalysisData(message.payload.analysis)
        setCodeResult(null)
        setCodeFormat(defaultFormat)
        setVariationsData(null)
        setError(null)
        // Auto-save to history
        autoSaveToHistory({
          type: 'ui',
          snippet: message.payload.analysis?.style?.type
            ? `${message.payload.analysis.style.type} design`
            : 'UI analysis',
          analysis: message.payload.analysis,
        })
      } else if (message.action === ACTIONS.CODE_READY) {
        setCodeResult(message.payload.code)
        setCodeFormat(message.payload.format)
        // Update history entry with code
        if (historyId) {
          updateHistoryEntry(historyId, {
            codeResult: message.payload.code,
            codeFormat: message.payload.format,
          })
        }
      } else if (message.action === ACTIONS.VARIATIONS_READY) {
        setVariationsData(message.payload.variations)
        // Update history entry with variations
        if (historyId) {
          updateHistoryEntry(historyId, {
            variations: message.payload.variations,
          })
        }
      } else if (message.action === ACTIONS.RESULT_ERROR) {
        setLoading(false)
        setLoadingAction(null)
        setError(message.payload.error)
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [defaultFormat, historyId])

  async function autoSaveToHistory(entry) {
    try {
      const id = await saveToHistory(entry)
      setHistoryId(id)
    } catch (err) {
      console.error('Failed to save to history:', err)
    }
  }

  const openOptions = useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  const handleNewAnalysis = useCallback(() => {
    setRawResult(null)
    setRawResultAction(null)
    setAnalysisData(null)
    setCodeResult(null)
    setCodeFormat(defaultFormat)
    setVariationsData(null)
    setLoading(false)
    setLoadingAction(null)
    setError(null)
    setHistoryId(null)
    setHistoryRefreshKey((k) => k + 1)
  }, [defaultFormat])

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

  // Build current result for export
  const currentExportEntry = rawResult
    ? { type: 'text', result: rawResult, timestamp: Date.now() }
    : analysisData
    ? {
        type: 'ui',
        analysis: analysisData,
        codeResult,
        codeFormat,
        variations: variationsData,
        timestamp: Date.now(),
      }
    : null

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
          <div>
            <EmptyState onDrawBox={handleDrawBox} />
            {/* Show history below empty state */}
            <HistoryList key={historyRefreshKey} />
          </div>
        )}

        {state === 'loading' && (
          <LoadingState action={loadingAction} />
        )}

        {state === 'error' && (
          <ErrorState error={error} />
        )}

        {state === 'result' && (
          <div>
            <ResultView result={rawResult} action={rawResultAction} />
            <div className="result-actions">
              <ExportButton entry={currentExportEntry} />
            </div>
          </div>
        )}

        {state === 'analysis' && (
          <div>
            <ResultView
              analysis={analysisData}
              codeResult={codeResult}
              codeFormat={codeFormat}
              variations={variationsData}
              onFormatChange={handleFormatChange}
              onGenerateVariations={handleGenerateVariations}
            />
            <div className="result-actions">
              <ExportButton entry={currentExportEntry} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
