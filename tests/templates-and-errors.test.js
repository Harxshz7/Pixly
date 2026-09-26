// Pixly — Comprehensive Unit Tests
// Tests for Phase 3, Phase 4a, and Phase 4b functionality.

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  validateTemplate,
  interpolateTemplate,
  TEMPLATE_LIMITS,
} from '../src/lib/ai/template-validator.js'

import {
  DEFAULT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  CONSECUTIVE_FAILURE_THRESHOLD,
} from '../src/lib/storage/prompt-templates.js'

import { classifyError } from '../src/lib/utils/error-classifier.js'

test('template-validator: rejects empty or too short templates', () => {
  const emptyRes = validateTemplate('', ['{{selection}}'])
  assert.equal(emptyRes.isValid, false)
  assert.ok(emptyRes.errors.some((e) => e.includes('empty')))

  const shortRes = validateTemplate('Too short', ['{{selection}}'])
  assert.equal(shortRes.isValid, false)
  assert.ok(shortRes.errors.some((e) => e.includes('minimum')))
})

test('template-validator: enforces required placeholder variables', () => {
  const missingVarRes = validateTemplate(
    'This is a sufficiently long prompt that instructs Pixly to explain UI, but misses the tag.',
    ['{{selection}}']
  )
  assert.equal(missingVarRes.isValid, false)
  assert.ok(missingVarRes.errors.some((e) => e.includes('Missing required placeholder: {{selection}}')))

  const validRes = validateTemplate(
    'You are Pixly. Please explain the following target text: {{selection}} in detail.',
    ['{{selection}}']
  )
  assert.equal(validRes.isValid, true)
  assert.equal(validRes.errors.length, 0)
})

test('template-validator: safe interpolation of variables', () => {
  const template = 'Hello {{name}}, here is your {{item}}. {{optional}}'
  const result = interpolateTemplate(template, {
    name: 'Alice',
    item: 'Button',
  })
  assert.equal(result, 'Hello Alice, here is your Button. {{optional}}')

  // Support both key and {{key}} syntax
  const result2 = interpolateTemplate('Analysis: {{context}}', {
    '{{context}}': 'Style: Glassmorphism',
  })
  assert.equal(result2, 'Analysis: Style: Glassmorphism')
})

test('prompt-templates: all default templates are valid and have required placeholders', () => {
  const templateList = Object.values(DEFAULT_TEMPLATES)
  assert.ok(templateList.length >= 7, 'Expected at least 7 default templates')

  for (const tmpl of templateList) {
    assert.ok(tmpl.id, `Template missing id`)
    assert.ok(tmpl.label, `Template ${tmpl.id} missing label`)
    assert.ok(tmpl.description, `Template ${tmpl.id} missing description`)
    assert.ok(
      tmpl.category === TEMPLATE_CATEGORIES.ANALYSIS ||
      tmpl.category === TEMPLATE_CATEGORIES.CODEGEN,
      `Template ${tmpl.id} has invalid category`
    )

    const validation = validateTemplate(tmpl.defaultPrompt, tmpl.requiredVariables)
    assert.equal(
      validation.isValid,
      true,
      `Default template ${tmpl.id} failed validation: ${validation.errors.join(', ')}`
    )
  }
})

test('error-classifier: classifies image-too-large errors properly', () => {
  const err1 = classifyError('Payload too large: image exceeds limit')
  assert.equal(err1.type, 'image-too-large')
  assert.equal(err1.title, 'Image Too Large')

  const err2 = classifyError('Error 413: request entity too large')
  assert.equal(err2.type, 'image-too-large')

  const err3 = classifyError('image size exceeds max allowed')
  assert.equal(err3.type, 'image-too-large')
})

test('error-classifier: classifies api key and rate limit errors', () => {
  const noKey = classifyError('API key not configured. Open Pixly options to add your key.')
  assert.equal(noKey.type, 'no-api-key')

  const invalidKey = classifyError('Anthropic API error: 401 unauthorized')
  assert.equal(invalidKey.type, 'invalid-api-key')

  const rateLimit = classifyError('OpenAI API error: 429 rate limit exceeded')
  assert.equal(rateLimit.type, 'rate-limit')
})
