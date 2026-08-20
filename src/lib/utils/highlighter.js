// Pixly Phase 2 — Lightweight Syntax Highlighter
// Regex-based highlighter for HTML, CSS, JSX, Vue, Dart code blocks.
// No external dependencies. Outputs HTML with <span> color classes.

/**
 * Escape HTML entities in code text.
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Apply regex-based highlighting to code text.
 * Returns HTML string with <span class="hl-*"> wrappers.
 *
 * @param {string} code - Raw code text
 * @param {string} lang - Language identifier: 'html' | 'css' | 'jsx' | 'vue' | 'dart'
 * @returns {string} Highlighted HTML
 */
export function highlightCode(code, lang = 'html') {
  if (!code) return ''

  let html = escapeHtml(code)

  switch (lang) {
    case 'html':
    case 'vue':
      html = highlightHtml(html)
      break
    case 'css':
      html = highlightCss(html)
      break
    case 'jsx':
      html = highlightJsx(html)
      break
    case 'dart':
      html = highlightDart(html)
      break
  }

  return html
}

function highlightHtml(html) {
  // Comments
  html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>')

  // Tags
  html = html.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="hl-tag">$2</span>')

  // Attributes
  html = html.replace(/\b([\w-]+)(=)/g, '<span class="hl-attr">$1</span>$2')

  // Strings (attribute values)
  html = html.replace(/(".*?")/g, '<span class="hl-string">$1</span>')

  return html
}

function highlightCss(html) {
  // Comments
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')

  // Selectors (lines that end with {)
  html = html.replace(/^([\.\#\w\-\:\[\]\=\"\*\>\+\~\,\s]+?)(\s*\{)/gm,
    '<span class="hl-tag">$1</span>$2')

  // Properties
  html = html.replace(/([\w-]+)(\s*:\s*)/g, '<span class="hl-attr">$1</span>$2')

  // Values (numbers with units)
  html = html.replace(/:\s*([\d.]+(?:px|em|rem|%|vh|vw|deg|ms|s))/g,
    ': <span class="hl-number">$1</span>')

  // Colors
  html = html.replace(/(#[0-9a-fA-F]{3,8})/g, '<span class="hl-string">$1</span>')

  // Strings
  html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>')

  return html
}

function highlightJsx(html) {
  // Comments
  html = html.replace(/(\/\/.*$)/gm, '<span class="hl-comment">$1</span>')
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')

  // Keywords
  html = html.replace(/\b(import|export|from|default|const|let|var|function|return|if|else|class|new|async|await|for|while|switch|case|break)\b/g,
    '<span class="hl-keyword">$1</span>')

  // JSX tags
  html = html.replace(/(&lt;\/?)([\w.]+)/g, '$1<span class="hl-tag">$2</span>')

  // Strings
  html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>')
  html = html.replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="hl-string">$1</span>')

  // Numbers
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')

  // Functions
  html = html.replace(/\b([\w]+)(\s*\()/g, '<span class="hl-func">$1</span>$2')

  return html
}

function highlightDart(html) {
  // Comments
  html = html.replace(/(\/\/.*$)/gm, '<span class="hl-comment">$1</span>')
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')

  // Keywords
  html = html.replace(/\b(import|export|class|extends|const|final|var|void|return|if|else|new|async|await|Widget|StatelessWidget|StatefulWidget|override|super|required|this)\b/g,
    '<span class="hl-keyword">$1</span>')

  // Strings
  html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>')

  // Numbers
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')

  // Annotations
  html = html.replace(/(@\w+)/g, '<span class="hl-attr">$1</span>')

  return html
}

/**
 * Detect language from a code fence string or file extension.
 */
export function detectLanguage(langStr) {
  if (!langStr) return 'html'
  const l = langStr.toLowerCase()
  if (l.includes('css')) return 'css'
  if (l.includes('jsx') || l.includes('react')) return 'jsx'
  if (l.includes('vue')) return 'vue'
  if (l.includes('dart') || l.includes('flutter')) return 'dart'
  return 'html'
}
