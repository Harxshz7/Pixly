// Pixly Phase 4b — Template Editor
// Full editor for an individual prompt template with live validation,
// character count, required variable badges, and recovery to defaults.

import React, { useState, useEffect, useRef } from 'react'
import { validateTemplate, TEMPLATE_LIMITS } from '../../lib/ai/template-validator.js'
import ResetToDefaultButton from './ResetToDefaultButton.jsx'

export default function TemplateEditor({ template, onSave, onReset }) {
  const [text, setText] = useState(template.activePrompt || '')
  const [errors, setErrors] = useState([])
  const [warnings, setWarnings] = useState([])
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const textareaRef = useRef(null)

  // Sync state whenever the selected template changes
  useEffect(() => {
    setText(template.activePrompt || '')
    const validation = validateTemplate(
      template.activePrompt || '',
      template.requiredVariables || []
    )
    setErrors(validation.errors)
    setWarnings(validation.warnings)
    setSavedSuccess(false)
  }, [template.id, template.activePrompt])

  const handleTextChange = (e) => {
    const newText = e.target.value
    setText(newText)
    const validation = validateTemplate(newText, template.requiredVariables || [])
    setErrors(validation.errors)
    setWarnings(validation.warnings)
    setSavedSuccess(false)
  }

  // Insert a variable placeholder into the textarea at the cursor position
  const handleInsertVariable = (varName) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = text.substring(0, start)
    const after = text.substring(end)
    const updated = `${before}${varName}${after}`

    setText(updated)
    const validation = validateTemplate(updated, template.requiredVariables || [])
    setErrors(validation.errors)
    setWarnings(validation.warnings)

    // Restore cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus()
      const newPos = start + varName.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleSave = async () => {
    const validation = validateTemplate(text, template.requiredVariables || [])
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setSaving(true)
    try {
      const res = await onSave(template.id, text)
      if (res.success) {
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 2500)
      } else if (res.errors) {
        setErrors(res.errors)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    await onReset(template.id)
    setText(template.defaultPrompt)
    const validation = validateTemplate(
      template.defaultPrompt,
      template.requiredVariables || []
    )
    setErrors(validation.errors)
    setWarnings(validation.warnings)
  }

  const isModified = text !== (template.customPrompt || template.defaultPrompt)
  const isDefault = !template.isCustom && text === template.defaultPrompt
  const charCount = text.length
  const lineCount = text ? text.split('\n').length : 0

  return (
    <div className="template-editor">
      {/* Header with Title and Badges */}
      <div className="template-editor-header">
        <div>
          <div className="template-editor-title-row">
            <h3 className="template-editor-title">{template.label}</h3>
            {template.isCustom ? (
              <span className="badge badge-custom">Customized</span>
            ) : (
              <span className="badge badge-default">Default</span>
            )}
            {template.isFallbackActive && (
              <span className="badge badge-warning">Fallback Active</span>
            )}
          </div>
          <p className="template-editor-desc">{template.description}</p>
        </div>
      </div>

      {/* Fallback Warning Banner if 3+ consecutive failures occurred */}
      {template.isFallbackActive && (
        <div className="template-fallback-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="template-fallback-text">
            <strong>Repeated Malformed Responses:</strong> This custom template has failed{' '}
            {template.failureCount} consecutive times. Safe fallback to the default prompt is currently active.
          </div>
          <ResetToDefaultButton
            onReset={handleReset}
            label="Restore Default"
            className="template-reset-btn-compact"
          />
        </div>
      )}

      {/* Variable Placeholders Bar */}
      <div className="template-variables-section">
        <span className="template-vars-label">Placeholders (click to insert):</span>
        <div className="template-vars-list">
          {template.requiredVariables?.map((v) => (
            <button
              key={v}
              type="button"
              className="var-chip var-chip-required"
              onClick={() => handleInsertVariable(v)}
              title="Required placeholder variable"
            >
              <span>{v}</span>
              <span className="var-chip-tag">required</span>
            </button>
          ))}
          {template.optionalVariables?.map((v) => (
            <button
              key={v}
              type="button"
              className="var-chip var-chip-optional"
              onClick={() => handleInsertVariable(v)}
              title="Optional placeholder variable"
            >
              <span>{v}</span>
              <span className="var-chip-tag">optional</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="template-textarea-wrapper">
        <textarea
          ref={textareaRef}
          className={`template-textarea ${errors.length > 0 ? 'template-textarea-error' : ''}`}
          value={text}
          onChange={handleTextChange}
          rows={14}
          placeholder="Enter system prompt template..."
          spellCheck="false"
        />

        {/* Live Metrics Toolbar */}
        <div className="template-editor-footer-info">
          <span className="template-metric">
            {charCount} / {TEMPLATE_LIMITS.MAX_LENGTH} characters
          </span>
          <span className="template-metric-divider">•</span>
          <span className="template-metric">{lineCount} lines</span>
          {errors.length > 0 && (
            <span className="template-error-pill">{errors.length} error{errors.length > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Validation Errors & Warnings */}
      {errors.length > 0 && (
        <div className="template-validation-errors">
          {errors.map((err, i) => (
            <div key={i} className="template-error-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && errors.length === 0 && (
        <div className="template-validation-warnings">
          {warnings.map((warn, i) => (
            <div key={i} className="template-warning-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="template-editor-actions">
        <button
          type="button"
          className={`template-save-btn ${savedSuccess ? 'template-save-btn-success' : ''}`}
          onClick={handleSave}
          disabled={saving || errors.length > 0 || (!isModified && template.isCustom)}
        >
          {saving ? 'Saving…' : savedSuccess ? '✓ Template Saved' : 'Save Template'}
        </button>

        {template.isCustom && (
          <ResetToDefaultButton
            onReset={handleReset}
            disabled={saving}
          />
        )}
      </div>
    </div>
  )
}
