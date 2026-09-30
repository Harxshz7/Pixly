// Pixly Phase 4b — Template Validator
// Guards against broken, truncated, or unsafe prompt templates.
// Pure functions with no external dependencies.

export const TEMPLATE_LIMITS = {
  MIN_LENGTH: 30,
  MAX_LENGTH: 8000,
}

/**
 * Small config map defining required placeholder variables per analysis/template type.
 */
export const REQUIRED_VARIABLES_BY_TYPE = {
  text: ['{{selection}}'],
  image: ['{{image}}'],
  'ui-analysis': ['{{image}}'],
  'react-tailwind': ['{{context}}'],
  'html-css': ['{{context}}'],
  vue: ['{{context}}'],
  flutter: ['{{context}}'],
}

/**
 * Get required placeholder variables for a given template type.
 * @param {string} type - Template/analysis type
 * @returns {string[]} Array of required placeholder variables
 */
export function getRequiredVariables(type) {
  return REQUIRED_VARIABLES_BY_TYPE[type] || []
}

/**
 * Validate a template prompt before saving.
 *
 * @param {string} promptText - The prompt text to validate
 * @param {string[]} requiredVariables - Array of required placeholder variables (e.g. ['{{selection}}'])
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
export function validateTemplate(promptText, requiredVariables = []) {
  const errors = []
  const warnings = []

  if (typeof promptText !== 'string' || !promptText.trim()) {
    errors.push('Prompt template cannot be empty.')
    return { isValid: false, errors, warnings }
  }

  const trimmed = promptText.trim()

  if (trimmed.length < TEMPLATE_LIMITS.MIN_LENGTH) {
    errors.push(
      `Prompt is too short (minimum ${TEMPLATE_LIMITS.MIN_LENGTH} characters, currently ${trimmed.length}).`
    )
  }

  if (trimmed.length > TEMPLATE_LIMITS.MAX_LENGTH) {
    errors.push(
      `Prompt exceeds maximum limit of ${TEMPLATE_LIMITS.MAX_LENGTH} characters (currently ${trimmed.length}).`
    )
  }

  // Validate required placeholder variables
  for (const variable of requiredVariables) {
    // Support {{analysis}} as an alias for {{context}} in codegen templates
    if (variable === '{{context}}') {
      if (!promptText.includes('{{context}}') && !promptText.includes('{{analysis}}')) {
        errors.push(`Missing required placeholder: {{context}} or {{analysis}}`)
      }
    } else if (!promptText.includes(variable)) {
      errors.push(`Missing required placeholder: ${variable}`)
    }
  }

  // Helpful warnings (non-blocking)
  if (!promptText.toLowerCase().includes('pixly')) {
    warnings.push('Template does not mention "Pixly" as the persona.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate a template prompt using the required variables defined for its type.
 *
 * @param {string} type - Analysis/template type ID
 * @param {string} promptText - The prompt text to validate
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
export function validateTemplateByType(type, promptText) {
  const requiredVars = getRequiredVariables(type)
  return validateTemplate(promptText, requiredVars)
}

/**
 * Interpolate placeholder variables into a template string safely.
 *
 * @param {string} template - The template string containing {{variable}} placeholders
 * @param {Record<string, string>} variables - Key-value map of variable names to values
 * @returns {string} Interpolated string
 */
export function interpolateTemplate(template, variables = {}) {
  if (typeof template !== 'string') return ''

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    const fullTag = `{{${key}}}`
    if (Object.prototype.hasOwnProperty.call(variables, fullTag)) {
      return variables[fullTag] != null ? String(variables[fullTag]) : ''
    }
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return variables[key] != null ? String(variables[key]) : ''
    }
    return match // Keep untouched if not provided
  })
}
