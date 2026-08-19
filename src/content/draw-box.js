/**
 * Pixly — Draw Box overlay
 * Lets users draw a rectangle on the page to select a region for screenshot analysis.
 * Runs as an injected script within the content script context.
 */

let overlay = null
let selectionBox = null
let startX = 0
let startY = 0
let isActive = false
let onComplete = null
let onCancel = null

/**
 * Activate the draw-box overlay
 * @param {Function} completeCallback - Called with { x, y, width, height } when selection is made
 * @param {Function} cancelCallback - Called when selection is cancelled
 */
export function activateDrawBox(completeCallback, cancelCallback) {
  if (isActive) return

  isActive = true
  onComplete = completeCallback
  onCancel = cancelCallback

  // Create overlay
  overlay = document.createElement('div')
  overlay.id = 'pixly-draw-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.25);
    z-index: 2147483647;
    cursor: crosshair;
    user-select: none;
    -webkit-user-select: none;
  `

  // Create selection box
  selectionBox = document.createElement('div')
  selectionBox.id = 'pixly-selection-box'
  selectionBox.style.cssText = `
    position: absolute;
    border: 2px solid #6366f1;
    background: rgba(99, 102, 241, 0.1);
    box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3);
    border-radius: 4px;
    display: none;
    pointer-events: none;
  `

  // Create instruction label
  const label = document.createElement('div')
  label.id = 'pixly-draw-label'
  label.textContent = 'Draw a box to select an area — Press Esc to cancel'
  label.style.cssText = `
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    pointer-events: none;
    z-index: 2147483647;
  `

  // Size indicator
  const sizeLabel = document.createElement('div')
  sizeLabel.id = 'pixly-size-label'
  sizeLabel.style.cssText = `
    position: absolute;
    background: #6366f1;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 11px;
    pointer-events: none;
    display: none;
    z-index: 2147483647;
    white-space: nowrap;
  `

  overlay.appendChild(selectionBox)
  overlay.appendChild(label)
  overlay.appendChild(sizeLabel)
  document.body.appendChild(overlay)

  // Event listeners
  overlay.addEventListener('mousedown', onMouseDown)
  overlay.addEventListener('mousemove', onMouseMove)
  overlay.addEventListener('mouseup', onMouseUp)
  document.addEventListener('keydown', onKeyDown, true)
}

function onMouseDown(e) {
  startX = e.clientX
  startY = e.clientY
  selectionBox.style.left = `${startX}px`
  selectionBox.style.top = `${startY}px`
  selectionBox.style.width = '0'
  selectionBox.style.height = '0'
  selectionBox.style.display = 'block'

  const sizeLabel = document.getElementById('pixly-size-label')
  if (sizeLabel) {
    sizeLabel.style.display = 'block'
  }
}

function onMouseMove(e) {
  if (!selectionBox || selectionBox.style.display === 'none') return

  const x = Math.min(e.clientX, startX)
  const y = Math.min(e.clientY, startY)
  const w = Math.abs(e.clientX - startX)
  const h = Math.abs(e.clientY - startY)

  selectionBox.style.left = `${x}px`
  selectionBox.style.top = `${y}px`
  selectionBox.style.width = `${w}px`
  selectionBox.style.height = `${h}px`

  const sizeLabel = document.getElementById('pixly-size-label')
  if (sizeLabel) {
    sizeLabel.textContent = `${w} × ${h}`
    sizeLabel.style.left = `${e.clientX + 12}px`
    sizeLabel.style.top = `${e.clientY + 12}px`
  }
}

function onMouseUp(e) {
  const x = Math.min(e.clientX, startX)
  const y = Math.min(e.clientY, startY)
  const w = Math.abs(e.clientX - startX)
  const h = Math.abs(e.clientY - startY)

  // Minimum size check
  if (w < 10 || h < 10) {
    cleanup()
    return
  }

  // Capture callbacks before cleanup nullifies them
  const complete = onComplete

  cleanup()

  // Convert to page coordinates (account for scroll)
  if (complete) {
    complete({
      x: x + window.scrollX,
      y: y + window.scrollY,
      width: w,
      height: h,
      // Also provide viewport-relative coords for screenshot cropping
      viewportX: x,
      viewportY: y,
    })
  }
}

function onKeyDown(e) {
  if (e.key === 'Escape') {
    cleanup()
    if (onCancel) onCancel()
  }
}

function cleanup() {
  isActive = false
  if (overlay) {
    overlay.removeEventListener('mousedown', onMouseDown)
    overlay.removeEventListener('mousemove', onMouseMove)
    overlay.removeEventListener('mouseup', onMouseUp)
    overlay.remove()
    overlay = null
  }
  document.removeEventListener('keydown', onKeyDown, true)
  selectionBox = null
  onComplete = null
  onCancel = null
}

/**
 * Check if draw box is currently active
 */
export function isDrawBoxActive() {
  return isActive
}

/**
 * Deactivate draw box externally
 */
export function deactivateDrawBox() {
  if (isActive) {
    cleanup()
    if (onCancel) onCancel()
  }
}
