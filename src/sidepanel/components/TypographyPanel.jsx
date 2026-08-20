import React from 'react'

/**
 * TypographyPanel — displays font family and size hierarchy detected from the UI.
 */
export default function TypographyPanel({ typography }) {
  if (!typography) return null

  const { families = [], hierarchy = {} } = typography

  return (
    <div className="analysis-section">
      <h3 className="analysis-section-title">Typography</h3>

      {families.length > 0 && (
        <div className="typo-row">
          <span className="typo-label">Font Family</span>
          <span className="typo-value">
            {families.filter(Boolean).join(', ') || 'Unknown'}
          </span>
        </div>
      )}

      {Object.entries(hierarchy).map(([level, info]) => (
        <div key={level} className="typo-row">
          <span className="typo-label">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
          <span className="typo-value">
            {info.approximateSize || '?'} · {info.weight || '?'}
          </span>
        </div>
      ))}

      {typography.description && (
        <p className="analysis-note">{typography.description}</p>
      )}
    </div>
  )
}
