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
  assert.equal(noKey.state, 'NO_API_KEY')
  assert.equal(noKey.actionType, 'open-options')

  const invalidKey = classifyError('Anthropic API error: 401 unauthorized')
  assert.equal(invalidKey.type, 'invalid-api-key')
  assert.equal(invalidKey.state, 'INVALID_KEY')
  assert.equal(invalidKey.actionType, 'open-options')

  const rateLimit = classifyError('OpenAI API error: 429 rate limit exceeded')
  assert.equal(rateLimit.type, 'rate-limit')
  assert.equal(rateLimit.state, 'RATE_LIMITED')
  assert.equal(rateLimit.actionType, 'retry')
})

test('error-classifier: classifies network, malformed response, and unknown errors', () => {
  const networkErr = classifyError(new Error('TypeError: Failed to fetch'))
  assert.equal(networkErr.state, 'NETWORK_FAILURE')
  assert.equal(networkErr.actionType, 'retry')

  const malformedErr = classifyError(new SyntaxError('Unexpected token < in JSON at position 0'))
  assert.equal(malformedErr.state, 'MALFORMED_RESPONSE')
  assert.equal(malformedErr.actionType, 'retry')

  // Codegen validation failure object
  const codegenValidationFail = classifyError({ isValid: false, reason: 'Unclosed div tag' })
  assert.equal(codegenValidationFail.state, 'MALFORMED_RESPONSE')
  assert.equal(codegenValidationFail.actionType, 'retry')

  const unknownErr = classifyError('Some completely bizarre error')
  assert.equal(unknownErr.state, 'UNKNOWN')
  assert.equal(unknownErr.actionType, 'retry')
})

test('template-validator: validateTemplateByType pulls required variables from config map', () => {
  const { validateTemplateByType } = require('../src/lib/ai/template-validator.js')

  // Text requires {{selection}}
  const textInvalid = validateTemplateByType('text', 'Analyze this snippet without the variable.')
  assert.equal(textInvalid.isValid, false)
  assert.ok(textInvalid.errors.some((e) => e.includes('{{selection}}')))

  const textValid = validateTemplateByType('text', 'Analyze this snippet: {{selection}} for design clarity.')
  assert.equal(textValid.isValid, true)

  // Codegen requires {{context}} or {{analysis}}
  const codegenInvalid = validateTemplateByType('react-tailwind', 'Generate a React component with tailwind.')
  assert.equal(codegenInvalid.isValid, false)
  assert.ok(codegenInvalid.errors.some((e) => e.includes('{{context}}')))

  const codegenValidContext = validateTemplateByType('react-tailwind', 'Generate a React component from {{context}}.')
  assert.equal(codegenValidContext.isValid, true)

  const codegenValidAnalysis = validateTemplateByType('react-tailwind', 'Generate a React component from {{analysis}}.')
  assert.equal(codegenValidAnalysis.isValid, true)
})

test('prompt-templates: storage mock supports CRUD, versioned defaults, and fallback on failure', async () => {
  const {
    getTemplate,
    getAllTemplates,
    saveCustomTemplate,
    resetTemplate,
    recordTemplateFailure,
    recordTemplateSuccess,
    getFailedTemplates,
    TEMPLATES_STORAGE_KEY,
  } = require('../src/lib/storage/prompt-templates.js')

  // Setup chrome.storage.local mock
  const storageMap = {}
  global.chrome = {
    storage: {
      local: {
        get: (keys, cb) => {
          const res = {}
          for (const k of keys) {
            if (storageMap[k] !== undefined) res[k] = storageMap[k]
          }
          cb(res)
        },
        set: (items, cb) => {
          Object.assign(storageMap, items)
          if (cb) cb()
        },
      },
    },
  }

  // Initial read should return ship-time defaults
  const tmpl = await getTemplate('text')
  assert.equal(tmpl.type, 'text')
  assert.equal(tmpl.isCustom, false)
  assert.equal(tmpl.current, tmpl.default)
  assert.ok(tmpl.default.includes('{{selection}}'))

  // Validation blocks saving when missing required placeholders
  const invalidSave = await saveCustomTemplate('text', 'Custom prompt without placeholder.')
  assert.equal(invalidSave.success, false)
  assert.ok(invalidSave.errors.length > 0)

  // Valid save succeeds
  const customPromptText = 'You are Pixly. Please explain {{selection}} in great detail.'
  const validSave = await saveCustomTemplate('text', customPromptText)
  assert.equal(validSave.success, true)

  const updatedTmpl = await getTemplate('text')
  assert.equal(updatedTmpl.isCustom, true)
  assert.equal(updatedTmpl.current, customPromptText)
  assert.equal(updatedTmpl.activePrompt, customPromptText)
  assert.notEqual(updatedTmpl.current, updatedTmpl.default)

  // Consecutive failures threshold (3) triggers fallback to default
  await recordTemplateFailure('text')
  let tmplAfter1Fail = await getTemplate('text')
  assert.equal(tmplAfter1Fail.failureCount, 1)
  assert.equal(tmplAfter1Fail.isFallbackActive, false)
  assert.equal(tmplAfter1Fail.activePrompt, customPromptText)

  await recordTemplateFailure('text')
  await recordTemplateFailure('text')
  let tmplAfter3Fails = await getTemplate('text')
  assert.equal(tmplAfter3Fails.failureCount, 3)
  assert.equal(tmplAfter3Fails.isFallbackActive, true)
  // Safe fallback should return defaultPrompt as activePrompt
  assert.equal(tmplAfter3Fails.activePrompt, tmplAfter3Fails.default)

  const failedList = await getFailedTemplates()
  assert.ok(failedList.includes('text'))

  // Success resets failure count
  await recordTemplateSuccess('text')
  let tmplAfterSuccess = await getTemplate('text')
  assert.equal(tmplAfterSuccess.failureCount, 0)
  assert.equal(tmplAfterSuccess.isFallbackActive, false)

  // Reset restores current to default
  await resetTemplate('text')
  const resetTmpl = await getTemplate('text')
  assert.equal(resetTmpl.isCustom, false)
  assert.equal(resetTmpl.current, resetTmpl.default)

  // External corruption recovery test: if stored template fails validation, it falls back to default
  storageMap[TEMPLATES_STORAGE_KEY] = {
    version: 1,
    templates: {
      text: {
        customPrompt: 'Corrupted external value without tags',
        updatedAt: Date.now(),
      },
    },
  }

  const recoveredTmpl = await getTemplate('text')
  assert.equal(recoveredTmpl.isCustom, false)
  assert.equal(recoveredTmpl.activePrompt, recoveredTmpl.default)
})


