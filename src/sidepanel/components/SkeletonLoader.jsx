import React from 'react'

/**
 * SkeletonLoader — skeleton placeholders that match the shape of results
 * so the UI doesn't jump when results arrive.
 *
 * @param {string} [variant='text'] - 'text' | 'ui' | 'image'
 */
export default function SkeletonLoader({ variant = 'text' }) {
  if (variant === 'ui') {
    return (
      <div className="skeleton-loader">
        {/* Badge skeletons */}
        <div className="skeleton-row">
          <div className="skeleton skeleton-badge" />
          <div className="skeleton skeleton-badge" />
        </div>

        {/* Color palette skeleton */}
        <div className="skeleton-section">
          <div className="skeleton skeleton-title" style={{ width: 100 }} />
          <div className="skeleton-row">
            <div className="skeleton skeleton-circle" />
            <div className="skeleton skeleton-circle" />
            <div className="skeleton skeleton-circle" />
            <div className="skeleton skeleton-circle" />
            <div className="skeleton skeleton-circle" />
            <div className="skeleton skeleton-circle" />
          </div>
        </div>

        {/* Typography skeleton */}
        <div className="skeleton-section">
          <div className="skeleton skeleton-title" style={{ width: 90 }} />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" style={{ width: '60%' }} />
        </div>

        {/* Component list skeleton */}
        <div className="skeleton-section">
          <div className="skeleton skeleton-title" style={{ width: 110 }} />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" style={{ width: '70%' }} />
        </div>

        {/* Code block skeleton */}
        <div className="skeleton-section">
          <div className="skeleton skeleton-title" style={{ width: 100 }} />
          <div className="skeleton-row" style={{ gap: 4 }}>
            <div className="skeleton skeleton-tab" />
            <div className="skeleton skeleton-tab" />
            <div className="skeleton skeleton-tab" />
          </div>
          <div className="skeleton skeleton-code" />
        </div>

        <div className="skeleton-pulse-text">
          <div className="streaming-dot" />
          <span>Analyzing UI…</span>
        </div>
      </div>
    )
  }

  // Text / image skeleton
  return (
    <div className="skeleton-loader">
      {/* Badge skeleton */}
      <div className="skeleton-section">
        <div className="skeleton skeleton-badge" />
      </div>

      {/* Text content skeleton */}
      <div className="skeleton-section">
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" style={{ width: '90%' }} />
        <div className="skeleton skeleton-line" style={{ width: '75%' }} />
        <div className="skeleton skeleton-line" style={{ width: '85%' }} />
        <div className="skeleton skeleton-line" style={{ width: '60%' }} />
      </div>

      <div className="skeleton-section">
        <div className="skeleton skeleton-line" style={{ width: '95%' }} />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" style={{ width: '70%' }} />
      </div>

      <div className="skeleton-pulse-text">
        <div className="streaming-dot" />
        <span>{variant === 'image' ? 'Analyzing image…' : 'Analyzing text…'}</span>
      </div>
    </div>
  )
}
