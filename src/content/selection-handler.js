/**
 * Pixly — Selection Handler
 * Listens for text selections on the page and provides a floating action button.
 */

let floatingBtn = null
let currentSelection = null

/**
 * Initialize the selection handler — call once on content script load
 */
export function initSelectionHandler() {
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('mousedown', handleMouseDown)

  // Handle keyboard selection (Shift+Arrow, Ctrl+A)
  document.addEventListener('keyup', (e) => {
    if (e.shiftKey || (e.key === 'a' && (e.ctrlKey || e.metaKey))) {
      setTimeout(checkSelection, 50)
    }
  })
}

function handleMouseDown() {
  // Hide floating button on new click
  hideFloatingButton()
}

function handleMouseUp(e) {
  // Delay to let selection finalize
  setTimeout(() => checkSelection(e), 10)
}

function checkSelection(e) {
  const selection = window.getSelection()
  const text = selection?.toString()?.trim()

  if (!text || text.length < 2) {
    hideFloatingButton()
    currentSelection = null
    return
  }

  // Don't show on input/textarea elements
  const activeEl = document.activeElement
  if (
    activeEl?.tagName === 'INPUT' ||
    activeEl?.tagName === 'TEXTAREA' ||
    activeEl?.isContentEditable
  ) {
    return
  }

  currentSelection = text

  // Get the selection bounding rect
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  showFloatingButton(rect, text)
}

function showFloatingButton(rect, selectedText) {
  hideFloatingButton()

  floatingBtn = document.createElement('div')
  floatingBtn.id = 'pixly-selection-btn'

  // Position below the selection
  const top = rect.bottom + window.scrollY + 8
  const left = rect.left + window.scrollX + rect.width / 2 - 16

  floatingBtn.style.cssText = `
    position: absolute;
    top: ${top}px;
    left: ${left}px;
    width: 32px;
    height: 32px;
    background: #6366f1;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 2147483646;
    transition: transform 0.15s ease, background 0.15s ease;
    animation: pixly-fade-in 0.15s ease;
  `

  // Lightning bolt icon (SVG)
  floatingBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  `

  floatingBtn.title = 'Pixly: Explain selected text'

  floatingBtn.addEventListener('mouseenter', () => {
    floatingBtn.style.transform = 'scale(1.1)'
    floatingBtn.style.background = '#4f46e5'
  })
  floatingBtn.addEventListener('mouseleave', () => {
    floatingBtn.style.transform = 'scale(1)'
    floatingBtn.style.background = '#6366f1'
  })

  floatingBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (currentSelection) {
      // Dispatch a custom event that the content script can listen to
      document.dispatchEvent(
        new CustomEvent('pixly:explain-text', {
          detail: { text: currentSelection },
        })
      )
    }
    hideFloatingButton()
  })

  document.body.appendChild(floatingBtn)
}

function hideFloatingButton() {
  if (floatingBtn && floatingBtn.parentNode) {
    floatingBtn.remove()
    floatingBtn = null
  }
}

/**
 * Get the current text selection
 */
export function getCurrentSelection() {
  const selection = window.getSelection()
  return selection?.toString()?.trim() || null
}

/**
 * Clean up event listeners
 */
export function destroySelectionHandler() {
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('mousedown', handleMouseDown)
  hideFloatingButton()
}
