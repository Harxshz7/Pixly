import React, { useState, useCallback, useEffect, useRef } from 'react'
import { debounce } from '../../lib/utils/search.js'

/**
 * SearchBar — debounced text input for filtering history.
 * Calls onSearch(query) after a short delay.
 */
export default function SearchBar({ onSearch, placeholder = 'Search history…' }) {
  const [value, setValue] = useState('')
  const debouncedSearch = useRef(null)

  // Create debounced search on mount
  useEffect(() => {
    debouncedSearch.current = debounce((q) => {
      if (onSearch) onSearch(q)
    }, 200)
    return () => {
      if (debouncedSearch.current) debouncedSearch.current.cancel()
    }
  }, [onSearch])

  const handleChange = useCallback((e) => {
    const val = e.target.value
    setValue(val)
    if (debouncedSearch.current) debouncedSearch.current(val)
  }, [])

  const handleClear = useCallback(() => {
    setValue('')
    if (onSearch) onSearch('')
    if (debouncedSearch.current) debouncedSearch.current.cancel()
  }, [onSearch])

  return (
    <div className="search-bar">
      <svg
        className="search-bar-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        className="search-bar-input"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {value && (
        <button className="search-bar-clear" onClick={handleClear} title="Clear search">
          ×
        </button>
      )}
    </div>
  )
}
