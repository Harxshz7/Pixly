import React from 'react'

const FORMATS = [
  { id: 'react-tailwind', label: 'React + Tailwind' },
  { id: 'html-css', label: 'HTML + CSS' },
  { id: 'vue', label: 'Vue' },
  { id: 'flutter', label: 'Flutter' },
]

/**
 * FormatSelector — toggle/dropdown for selecting output code format.
 */
export default function FormatSelector({ selected, onSelect }) {
  return (
    <div className="format-selector">
      {FORMATS.map((fmt) => (
        <button
          key={fmt.id}
          className={`format-btn ${selected === fmt.id ? 'format-btn-active' : ''}`}
          onClick={() => onSelect(fmt.id)}
        >
          {fmt.label}
        </button>
      ))}
    </div>
  )
}
