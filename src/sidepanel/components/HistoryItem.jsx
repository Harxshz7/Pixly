import React, { useState, useCallback } from 'react'
import { formatTimestamp } from '../../lib/utils/search.js'
import { deleteHistoryEntry, toggleFavorite } from '../../lib/storage/history.js'
import { logEvent, EVENTS } from '../../lib/telemetry/event-log.js'
import ResultView from './ResultView.jsx'
import ExportButton from './ExportButton.jsx'

const TYPE_META = {
  text: { icon: '📝', label: 'Text' },
  image: { icon: '🖼️', label: 'Image' },
  ui: { icon: '🎨', label: 'UI' },
}

/**
 * HistoryItem — a single history entry.
 * Collapsed: type icon, snippet/thumbnail, timestamp.
 * Expanded: full result via ResultView.
 */
export default function HistoryItem({ entry, onDelete, onToggleFavorite }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const meta = TYPE_META[entry.type] || TYPE_META.text

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const handleDelete = useCallback(
    async (e) => {
      e.stopPropagation()
      if (!confirmDelete) {
        setConfirmDelete(true)
        setTimeout(() => setConfirmDelete(false), 3000)
        return
      }
      await deleteHistoryEntry(entry.id)
      setConfirmDelete(false)
      if (onDelete) onDelete(entry.id)
    },
    [entry.id, confirmDelete, onDelete]
  )

  const handleFavorite = useCallback(
    async (e) => {
      e.stopPropagation()
      const newState = await toggleFavorite(entry.id)
      if (newState !== null) {
        logEvent(EVENTS.FAVORITE_TOGGLED)
        if (onToggleFavorite) onToggleFavorite(entry.id, newState)
      }
    },
    [entry.id, onToggleFavorite]
  )

  // Build snippet text
  const snippet =
    entry.snippet ||
    entry.pageTitle ||
    (entry.analysis?.style?.type ? `${entry.analysis.style.type} design` : '') ||
    'Analysis result'

  return (
    <div className={`history-item ${expanded ? 'history-item-expanded' : ''}`}>
      <div className="history-item-header" onClick={handleToggle}>
        <span className="history-item-icon">{meta.icon}</span>
        <div className="history-item-info">
          <span className="history-item-snippet">{snippet}</span>
          <span className="history-item-meta">
            <span className="history-item-type">{meta.label}</span>
            <span className="history-item-time">{formatTimestamp(entry.timestamp)}</span>
            {entry.pageUrl && (
              <span className="history-item-url" title={entry.pageUrl}>
                {new URL(entry.pageUrl).hostname}
              </span>
            )}
          </span>
        </div>
        <div className="history-item-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`history-item-favorite ${entry.favorite ? 'history-item-favorite-active' : ''}`}
            onClick={handleFavorite}
            title={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {entry.favorite ? '★' : '☆'}
          </button>
          <ExportButton entry={entry} small />
          <button
            className={`history-item-delete ${confirmDelete ? 'history-item-delete-confirm' : ''}`}
            onClick={handleDelete}
            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
          >
            {confirmDelete ? '✓' : '×'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="history-item-body">
          {/* Thumbnail for image/UI types */}
          {entry.thumbnail && (
            <img
              className="history-item-thumbnail"
              src={entry.thumbnail}
              alt="Captured region"
            />
          )}
          <ResultView
            result={entry.result}
            action={entry.type === 'text' ? 'explain-text' : entry.type === 'image' ? 'analyze-image' : 'ui-analysis-full'}
            analysis={entry.analysis}
            codeResult={entry.codeResult}
            codeFormat={entry.codeFormat}
            variations={entry.variations}
          />
        </div>
      )}
    </div>
  )
}
