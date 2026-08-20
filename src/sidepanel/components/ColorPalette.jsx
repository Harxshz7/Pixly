import React, { useState, useCallback } from 'react'
import { copyToClipboard } from '../../lib/utils/clipboard.js'

/**
 * ColorPalette — displays a row of color swatches with hex codes.
 * Click any swatch to copy its hex value.
 */
export default function ColorPalette({ colors = [] }) {
  const [copiedIndex, setCopiedIndex] = useState(null)

  const handleCopy = useCallback(async (hex, index) => {
    const success = await copyToClipboard(hex)
    if (success) {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    }
  }, [])

  if (!colors.length) return null

  return (
    <div className="analysis-section">
      <h3 className="analysis-section-title">Color Palette</h3>
      <div className="color-palette">
        {colors.map((color, i) => (
          <button
            key={i}
            className="color-swatch"
            onClick={() => handleCopy(color.hex, i)}
            title={`${color.hex} — click to copy`}
          >
            <div
              className="color-swatch-circle"
              style={{ background: color.hex }}
            />
            <span className="color-swatch-label">
              {copiedIndex === i ? 'Copied!' : color.hex}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
