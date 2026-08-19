import React from 'react'

const ACTION_LABELS = {
  'explain-text': 'Analyzing text...',
  'analyze-image': 'Analyzing image...',
  'recreate-ui': 'Generating UI code...',
  'screenshot-area': 'Analyzing screenshot...',
}

export default function LoadingState({ action = null }) {
  return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <p>{ACTION_LABELS[action] || 'Processing...'}</p>
    </div>
  )
}
