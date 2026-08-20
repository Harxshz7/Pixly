import React, { useState } from 'react'
import CopyButton from './CopyButton.jsx'

const APPROACH_LABELS = {
  'pixel-accurate': '🎯 Pixel-Accurate',
  'inspired-redesign': '✨ Inspired Redesign',
  simplified: '◻ Simplified',
  minimalist: '◻ Minimalist',
  'bold-color': '🎨 Bold Color',
}

/**
 * VariationsPanel — displays 2-3 alternative recreation prompts in a tabbed view.
 * Each variation is independently copyable.
 */
export default function VariationsPanel({ variations = [] }) {
  const [activeTab, setActiveTab] = useState(0)

  if (!variations.length) return null

  return (
    <div className="analysis-section">
      <h3 className="analysis-section-title">Variations</h3>

      <div className="variations-tabs">
        {variations.map((v, i) => (
          <button
            key={i}
            className={`variations-tab ${activeTab === i ? 'variations-tab-active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {APPROACH_LABELS[v.approach] || v.title || `Variation ${i + 1}`}
          </button>
        ))}
      </div>

      {variations[activeTab] && (
        <div className="variations-content">
          <p className="variations-description">
            {variations[activeTab].description}
          </p>
          <div className="variations-prompt-wrapper">
            <pre className="variations-prompt">
              {variations[activeTab].prompt}
            </pre>
          </div>
          <CopyButton
            text={variations[activeTab].prompt}
            label="Copy Prompt"
            className="btn btn-secondary variations-copy"
          />
        </div>
      )}
    </div>
  )
}
