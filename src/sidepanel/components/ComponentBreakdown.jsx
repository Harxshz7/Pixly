import React from 'react'

const TYPE_ICONS = {
  container: '◻',
  button: '🔘',
  input: '📝',
  icon: '⭐',
  text: 'T',
  image: '🖼',
  badge: '🏷',
  divider: '—',
  other: '•',
}

/**
 * ComponentBreakdown — labeled list of UI sub-components identified within the box.
 */
export default function ComponentBreakdown({ components = [] }) {
  if (!components.length) return null

  return (
    <div className="analysis-section">
      <h3 className="analysis-section-title">Components</h3>
      <div className="component-list">
        {components.map((comp, i) => (
          <div key={i} className="component-item">
            <span className="component-icon">
              {TYPE_ICONS[comp.type] || '•'}
            </span>
            <div className="component-info">
              <span className="component-name">{comp.name}</span>
              <span className="component-meta">
                {comp.position && <span className="component-position">{comp.position}</span>}
                {comp.description && <span className="component-desc">{comp.description}</span>}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
