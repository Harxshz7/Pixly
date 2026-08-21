import React, { useState, useCallback } from 'react'
import { exportToMarkdown, downloadFile } from '../../lib/generators/markdown-export.js'

/**
 * ExportButton — exports a result as a .md file download.
 * Can be used on any individual result (current or from history).
 */
export default function ExportButton({ entry, small = false, className = '' }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = useCallback(async (e) => {
    e.stopPropagation()
    if (!entry || exporting) return

    setExporting(true)
    try {
      const markdown = exportToMarkdown(entry)
      const title = entry.pageTitle || entry.snippet || 'pixly-analysis'
      // Sanitize filename
      const safeName = title.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().slice(0, 60) || 'pixly-analysis'
      await downloadFile(markdown, safeName)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }, [entry, exporting])

  if (small) {
    return (
      <button
        className={`export-btn-small ${className}`}
        onClick={handleExport}
        disabled={exporting}
        title="Export as Markdown"
      >
        {exporting ? '…' : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
      </button>
    )
  }

  return (
    <button
      className={`btn btn-secondary export-btn ${className}`}
      onClick={handleExport}
      disabled={exporting}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {exporting ? 'Exporting…' : 'Export .md'}
    </button>
  )
}
