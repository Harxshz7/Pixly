import React, { useEffect } from 'react'

export const FORMATS = [
  { id: 'react-tailwind', label: 'React + Tailwind' },
  { id: 'html-css', label: 'HTML + CSS' },
  { id: 'vue', label: 'Vue' },
  { id: 'flutter', label: 'Flutter' },
]

export const SESSION_FORMAT_KEY = 'pixly_session_code_format'

/**
 * Get current session format or fallback to default.
 */
export function getSessionFormat(fallback = 'react-tailwind') {
  try {
    const saved = sessionStorage.getItem(SESSION_FORMAT_KEY)
    if (saved && FORMATS.some((f) => f.id === saved)) {
      return saved
    }
  } catch {}
  return fallback
}

/**
 * Set current session format.
 */
export function setSessionFormat(formatId) {
  try {
    sessionStorage.setItem(SESSION_FORMAT_KEY, formatId)
  } catch {}
}

/**
 * FormatSelector — segmented control for selecting code output framework.
 * Persists selection per-session in sessionStorage.
 */
export default function FormatSelector({ selected, onSelect }) {
  const currentFormat = selected || getSessionFormat()

  useEffect(() => {
    if (selected) {
      setSessionFormat(selected)
    }
  }, [selected])

  const handleSelect = (fmtId) => {
    setSessionFormat(fmtId)
    if (onSelect) {
      onSelect(fmtId)
    }
  }

  return (
    <div className="format-selector">
      {FORMATS.map((fmt) => (
        <button
          key={fmt.id}
          type="button"
          className={`format-btn ${currentFormat === fmt.id ? 'format-btn-active' : ''}`}
          onClick={() => handleSelect(fmt.id)}
        >
          {fmt.label}
        </button>
      ))}
    </div>
  )
}
