// Pixly Phase 1 — Clipboard utility

/**
 * Copy text to the clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Whether the copy was successful
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for environments where clipboard API is unavailable
    return fallbackCopy(text)
  }
}

/**
 * Fallback copy using a temporary textarea element
 */
function fallbackCopy(text) {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch {
    return false
  }
}

/**
 * Read text from the clipboard
 * @returns {Promise<string|null>} - Clipboard text or null on failure
 */
export async function readFromClipboard() {
  try {
    return await navigator.clipboard.readText()
  } catch {
    return null
  }
}
