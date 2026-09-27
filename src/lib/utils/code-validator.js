// Pixly Phase 2 — Code Validation Utility
// Lightweight syntax and structure validator for generated code.

/**
 * Validate generated code for balanced brackets, tags, and structure.
 *
 * @param {string} code - The generated code string
 * @param {string} format - The code format ('react-tailwind' | 'html-css' | 'vue' | 'flutter')
 * @returns {{ isValid: boolean, reason?: string }} Validation result
 */
export function validateGeneratedCode(code, format) {
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return { isValid: false, reason: 'Code output is empty.' }
  }

  const trimmed = code.trim()

  // 1. Bracket balancing test
  const bracketCheck = checkBalancedBrackets(trimmed)
  if (!bracketCheck.isValid) {
    return bracketCheck
  }

  // 2. Format-specific validation rules
  if (format === 'vue') {
    // Vue SFC must contain <template> tag or template block if code blocks are used
    if (trimmed.includes('<template') && !trimmed.includes('</template>')) {
      return { isValid: false, reason: 'Vue SFC missing closing </template> tag.' }
    }
    if (trimmed.includes('<script') && !trimmed.includes('</script>')) {
      return { isValid: false, reason: 'Vue SFC missing closing </script> tag.' }
    }
    if (trimmed.includes('<style') && !trimmed.includes('</style>')) {
      return { isValid: false, reason: 'Vue SFC missing closing </style> tag.' }
    }
  }

  if (format === 'html-css' || format === 'html') {
    const htmlPart = extractHtmlPart(trimmed)
    if (htmlPart) {
      const tagCheck = checkBalancedTags(htmlPart)
      if (!tagCheck.isValid) {
        return tagCheck
      }
    }
  }

  if (format === 'react-tailwind') {
    // Check for common JSX issue: using class="..." instead of className="..."
    if (/\bclass="[^"]*"/.test(trimmed) && !trimmed.includes('className=')) {
      // Warning or mild invalid, but let's check for unclosed JSX tags
      const tagCheck = checkBalancedTags(trimmed)
      if (!tagCheck.isValid) {
        return tagCheck
      }
    }
  }

  return { isValid: true }
}

/**
 * Check if parentheses, square brackets, and curly braces are balanced.
 */
function checkBalancedBrackets(code) {
  const stack = []
  const opening = ['(', '{', '[']
  const closing = [')', '}', ']']
  const matches = { ')': '(', '}': '{', ']': '[' }

  // Strip string content and comments to avoid false positives inside strings
  const cleaned = code
    .replace(/\/\*[\s\S]*?\*\//g, '') // multiline comments
    .replace(/\/\/.*/g, '') // single line comments
    .replace(/<!--[\s\S]*?-->/g, '') // html comments
    .replace(/(`(?:[^`\\]|\\.)*`)|('(?:[^'\\]|\\.)*')|("(?:[^"\\]|\\.)*")/g, '""') // string literals

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    if (opening.includes(char)) {
      stack.push(char)
    } else if (closing.includes(char)) {
      if (stack.length === 0 || stack.pop() !== matches[char]) {
        return { isValid: false, reason: `Unbalanced bracket '${char}' detected.` }
      }
    }
  }

  if (stack.length > 0) {
    return { isValid: false, reason: `Unclosed bracket '${stack.pop()}' detected.` }
  }

  return { isValid: true }
}

/**
 * Check balanced HTML/XML tags in a string.
 */
function checkBalancedTags(html) {
  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
    'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  ])

  // Regex to match HTML tags
  const tagRegex = /<\/?([a-zA-Z0-9-]+)(?:\s+[^>]*?)?(\/?)>/g
  const stack = []
  let match

  while ((match = tagRegex.exec(html)) !== null) {
    const [fullTag, tagName, selfClosing] = match
    const lowerName = tagName.toLowerCase()

    // Skip comments or doctype
    if (fullTag.startsWith('<!--') || fullTag.startsWith('<!')) continue

    // Void or self-closing tags
    if (selfClosing === '/' || voidElements.has(lowerName)) continue

    if (fullTag.startsWith('</')) {
      // Closing tag
      if (stack.length === 0) {
        return { isValid: false, reason: `Unexpected closing tag </${tagName}>.` }
      }
      const last = stack.pop()
      if (last.toLowerCase() !== lowerName) {
        return { isValid: false, reason: `Mismatched HTML tag: expected </${last}> but found </${tagName}>.` }
      }
    } else {
      // Opening tag
      stack.push(tagName)
    }
  }

  if (stack.length > 0) {
    return { isValid: false, reason: `Unclosed HTML tag <${stack.pop()}>.` }
  }

  return { isValid: true }
}

function extractHtmlPart(text) {
  const match = text.match(/```html\n([\s\S]*?)```/)
  return match ? match[1] : text
}
