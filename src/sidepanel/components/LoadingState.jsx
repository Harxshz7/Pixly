import React from 'react'
import SkeletonLoader from './SkeletonLoader.jsx'

const ACTION_VARIANTS = {
  'explain-text': 'text',
  'analyze-image': 'image',
  'ui-analysis-full': 'ui',
  'recreate-ui': 'ui',
  'screenshot-area': 'ui',
}

const ACTION_LABELS = {
  'explain-text': 'Analyzing text…',
  'analyze-image': 'Analyzing image…',
  'recreate-ui': 'Generating UI code…',
  'screenshot-area': 'Analyzing screenshot…',
  'ui-analysis-full': 'Analyzing UI…',
}

/**
 * LoadingState — shows a skeleton loader matching the expected result shape.
 */
export default function LoadingState({ action = null }) {
  const variant = ACTION_VARIANTS[action] || 'text'
  const label = ACTION_LABELS[action] || 'Processing…'

  return (
    <div className="loading-state">
      <SkeletonLoader variant={variant} />
      <p className="loading-state-label">{label}</p>
    </div>
  )
}
