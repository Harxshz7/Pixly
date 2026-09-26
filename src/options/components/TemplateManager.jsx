// Pixly Phase 4b — Template Manager
// Manages system prompt templates, tabs by category, and coordinates editing/saving/resetting.

import React, { useState, useEffect, useCallback } from 'react'
import {
  getAllTemplates,
  saveCustomTemplate,
  resetTemplate,
  resetAllTemplates,
  TEMPLATE_CATEGORIES,
} from '../../lib/storage/prompt-templates.js'
import TemplateEditor from './TemplateEditor.jsx'
import ResetToDefaultButton from './ResetToDefaultButton.jsx'

export default function TemplateManager() {
  const [templates, setTemplates] = useState([])
  const [selectedId, setSelectedId] = useState('text')
  const [activeCategory, setActiveCategory] = useState(TEMPLATE_CATEGORIES.ANALYSIS)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const list = await getAllTemplates()
      setTemplates(list)
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSave = async (id, promptText) => {
    const res = await saveCustomTemplate(id, promptText)
    if (res.success) {
      await loadData()
      setNotification({ type: 'success', message: 'Template saved successfully.' })
      setTimeout(() => setNotification(null), 3000)
    }
    return res
  }

  const handleReset = async (id) => {
    await resetTemplate(id)
    await loadData()
    setNotification({ type: 'info', message: 'Template reverted to default.' })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleResetAll = async () => {
    await resetAllTemplates()
    await loadData()
    setNotification({ type: 'info', message: 'All templates reverted to defaults.' })
    setTimeout(() => setNotification(null), 3000)
  }

  if (loading) {
    return <div className="template-loading">Loading prompt templates…</div>
  }

  const filteredTemplates = templates.filter((t) => t.category === activeCategory)
  const selectedTemplate = templates.find((t) => t.id === selectedId) || templates[0]

  // Any templates currently in fallback mode?
  const failedTemplates = templates.filter((t) => t.isFallbackActive)
  const hasCustomizedTemplates = templates.some((t) => t.isCustom)

  return (
    <div className="template-manager">
      {/* Global Fallback Alert if any templates are failing */}
      {failedTemplates.length > 0 && (
        <div className="template-manager-alert">
          <div className="template-manager-alert-icon">⚠️</div>
          <div className="template-manager-alert-content">
            <strong>System Prompt Safety Fallback Active:</strong>
            <p>
              {failedTemplates.length} custom template(s) experienced repeated failures:{' '}
              {failedTemplates.map((t) => t.label).join(', ')}. Pixly is temporarily using default prompts for safety.
            </p>
          </div>
          <ResetToDefaultButton
            onReset={handleResetAll}
            label="Reset All Defaults"
            className="template-reset-btn-compact"
          />
        </div>
      )}

      {/* Global Notification Banner */}
      {notification && (
        <div className={`template-notification template-notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Category Tabs */}
      <div className="template-tabs-header">
        <div className="template-category-tabs">
          <button
            type="button"
            className={`template-cat-tab ${activeCategory === TEMPLATE_CATEGORIES.ANALYSIS ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(TEMPLATE_CATEGORIES.ANALYSIS)
              const first = templates.find((t) => t.category === TEMPLATE_CATEGORIES.ANALYSIS)
              if (first) setSelectedId(first.id)
            }}
          >
            Analysis & Vision ({templates.filter((t) => t.category === TEMPLATE_CATEGORIES.ANALYSIS).length})
          </button>
          <button
            type="button"
            className={`template-cat-tab ${activeCategory === TEMPLATE_CATEGORIES.CODEGEN ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(TEMPLATE_CATEGORIES.CODEGEN)
              const first = templates.find((t) => t.category === TEMPLATE_CATEGORIES.CODEGEN)
              if (first) setSelectedId(first.id)
            }}
          >
            Code Generators ({templates.filter((t) => t.category === TEMPLATE_CATEGORIES.CODEGEN).length})
          </button>
        </div>

        {hasCustomizedTemplates && (
          <ResetToDefaultButton
            onReset={handleResetAll}
            label="Reset All to Defaults"
            className="template-reset-btn-subtle"
          />
        )}
      </div>

      {/* Template Selector Sub-navigation */}
      <div className="template-selector-bar">
        {filteredTemplates.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`template-selector-item ${selectedId === t.id ? 'active' : ''}`}
            onClick={() => setSelectedId(t.id)}
          >
            <span className="template-selector-name">{t.label}</span>
            {t.isCustom && <span className="template-selector-dot" title="Customized" />}
            {t.isFallbackActive && <span className="template-selector-warn" title="Repeated failures" />}
          </button>
        ))}
      </div>

      {/* Active Template Editor */}
      {selectedTemplate && (
        <TemplateEditor
          key={selectedTemplate.id}
          template={selectedTemplate}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
