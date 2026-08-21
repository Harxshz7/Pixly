import React, { useState, useEffect, useCallback } from 'react'
import { getHistory, clearHistory, searchHistory } from '../../lib/storage/history.js'
import SearchBar from './SearchBar.jsx'
import HistoryItem from './HistoryItem.jsx'

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'text', label: '📝 Text' },
  { key: 'image', label: '🖼️ Image' },
  { key: 'ui', label: '🎨 UI' },
]

/**
 * HistoryList — displays saved analysis results in reverse-chronological order.
 * Includes search, type filter, and clear-all.
 */
export default function HistoryList() {
  const [entries, setEntries] = useState([])
  const [filteredEntries, setFilteredEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [confirmClear, setConfirmClear] = useState(false)

  // Load history on mount
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getHistory()
      setEntries(data)
      setFilteredEntries(data)
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Search handler
  const handleSearch = useCallback(
    async (query) => {
      const results = await searchHistory(query)
      const filtered =
        typeFilter === 'all' ? results : results.filter((e) => e.type === typeFilter)
      setFilteredEntries(filtered)
    },
    [typeFilter]
  )

  // Type filter
  const handleTypeFilter = useCallback(
    async (key) => {
      setTypeFilter(key)
      const all = entries
      const filtered = key === 'all' ? all : all.filter((e) => e.type === key)
      setFilteredEntries(filtered)
    },
    [entries]
  )

  // Delete single entry
  const handleDeleteEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setFilteredEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // Clear all history
  const handleClearAll = useCallback(async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
      return
    }
    await clearHistory()
    setEntries([])
    setFilteredEntries([])
    setConfirmClear(false)
  }, [confirmClear])

  if (loading) {
    return (
      <div className="history-loading">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (entries.length === 0) {
    return null // Let EmptyState show instead
  }

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3 className="history-title">History</h3>
        <span className="history-count">{entries.length}</span>
        <button
          className={`history-clear-btn ${confirmClear ? 'history-clear-confirm' : ''}`}
          onClick={handleClearAll}
        >
          {confirmClear ? 'Confirm clear?' : 'Clear all'}
        </button>
      </div>

      <SearchBar onSearch={handleSearch} />

      <div className="history-type-filters">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`history-type-btn ${typeFilter === f.key ? 'history-type-active' : ''}`}
            onClick={() => handleTypeFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="history-list">
        {filteredEntries.length === 0 ? (
          <div className="history-empty">
            <p>No results match your search.</p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} onDelete={handleDeleteEntry} />
          ))
        )}
      </div>
    </div>
  )
}
