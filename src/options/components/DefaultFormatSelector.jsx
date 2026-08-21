import React from 'react'

const FORMATS = [
  { id: 'html-css', label: 'HTML + CSS', description: 'Semantic HTML with pure CSS' },
  { id: 'react-tailwind', label: 'React + Tailwind', description: 'JSX component with Tailwind utilities' },
  { id: 'vue', label: 'Vue', description: 'Vue 3 Single File Component' },
  { id: 'flutter', label: 'Flutter', description: 'Dart/Flutter widget' },
]

/**
 * DefaultFormatSelector — choose the default code output format.
 */
export default function DefaultFormatSelector({ value, onChange }) {
  return (
    <div className="field-group">
      <label className="field-label">Default Code Format</label>
      <p className="field-hint" style={{ marginBottom: 10 }}>
        Phase 2 analysis results will open with this format by default.
      </p>
      <div className="format-options">
        {FORMATS.map((fmt) => (
          <label
            key={fmt.id}
            className={`format-option ${value === fmt.id ? 'format-option-active' : ''}`}
          >
            <input
              type="radio"
              name="default-format"
              value={fmt.id}
              checked={value === fmt.id}
              onChange={() => onChange(fmt.id)}
              className="format-option-input"
            />
            <div className="format-option-content">
              <span className="format-option-label">{fmt.label}</span>
              <span className="format-option-desc">{fmt.description}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
