import React, { useState, useCallback, useEffect } from 'react'
import { getHistoryCount, clearHistory } from '../../lib/storage/history.js'

/**
 * HistorySettings — controls for history limit and clearing history.
 */
export default function HistorySettings({ value, onChange }) {
  const [count, setCount] = useState(0)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    getHistoryCount().then(setCount)
  }, [])

  const handleLimitChange = useCallback(
    (e) => {
      const val = parseInt(e.target.value, 10)
      if (!isNaN(val) && val >= 10 && val <= 200) {
        onChange(val)
      }
    },
    [onChange]
  )

  const handleClear = useCallback(async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 4000)
      return
    }
    await clearHistory()
    setCount(0)
    setConfirmClear(false)
  }, [confirmClear])

  return (
    <div className="field-group">
      <label className="field-label">History</label>

      {/* History count */}
      <p className="field-hint" style={{ marginBottom: 12 }}>
        {count === 0 ? 'No saved results' : `${count} saved result${count !== 1 ? 's' : ''}`}
      </p>

      {/* Limit slider */}
      <div className="history-limit-row">
        <label className="field-sublabel">Max entries</label>
        <div className="history-limit-input-row">
          <input
            type="range"
            min={10}
            max={200}
            step={10}
            value={value}
            onChange={handleLimitChange}
            className="history-limit-slider"
          />
          <input
            type="number"
            min={10}
            max={200}
            step={10}
            value={value}
            onChange={handleLimitChange}
            className="history-limit-number"
          />
        </div>
        <p className="field-hint">
          Oldest entries are removed when the limit is reached.
        </p>
      </div>

      {/* Clear all */}
      <button
        className={`btn btn-danger ${confirmClear ? 'btn-danger-confirm' : ''}`}
        onClick={handleClear}
        disabled={count === 0}
        style={{ marginTop: 12 }}
      >
        {confirmClear ? 'Confirm clear all history' : 'Clear all history'}
      </button>
    </div>
  )
}
