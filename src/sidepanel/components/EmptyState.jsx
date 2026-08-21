import React from 'react'

/**
 * EmptyState — friendly placeholder shown when side panel opens
 * with no active result and no history yet.
 */
export default function EmptyState({ onDrawBox }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
      <h2>Welcome to Pixly</h2>
      <p>
        Select text and click the ⚡ button, right-click an image, or draw a box to get started.
      </p>
      <div className="empty-state-tips">
        <div className="empty-state-tip">
          <span className="empty-state-tip-icon">📝</span>
          <span>Select text → Click ⚡</span>
        </div>
        <div className="empty-state-tip">
          <span className="empty-state-tip-icon">🖼️</span>
          <span>Right-click image → Analyze</span>
        </div>
        <div className="empty-state-tip">
          <span className="empty-state-tip-icon">🎨</span>
          <span>Draw box → Full UI analysis</span>
        </div>
      </div>
      {onDrawBox && (
        <button className="btn btn-primary draw-box-btn" onClick={onDrawBox} style={{ marginTop: 20 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="4 2" />
          </svg>
          Draw Box
          <span className="shortcut-hint">Ctrl+Shift+X</span>
        </button>
      )}
    </div>
  )
}
