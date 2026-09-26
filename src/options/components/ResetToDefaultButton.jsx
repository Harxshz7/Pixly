// Pixly Phase 4b — ResetToDefaultButton
// Safe two-click confirmation button for reverting prompt templates to default.

import React, { useState, useEffect } from 'react'

export default function ResetToDefaultButton({
  onReset,
  disabled = false,
  className = '',
  label = 'Reset to Default',
}) {
  const [confirming, setConfirming] = useState(false)

  // Reset confirmation state after 3 seconds of inactivity
  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  const handleClick = (e) => {
    e.preventDefault()
    if (!confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    onReset()
  }

  return (
    <button
      type="button"
      className={`template-reset-btn ${confirming ? 'template-reset-btn-confirming' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      title={confirming ? 'Click again to confirm reset to default' : 'Revert to default prompt'}
    >
      {confirming ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Confirm Reset?
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}
