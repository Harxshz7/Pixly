// Pixly Phase 1 — Screenshot capture via chrome.tabs.captureVisibleTab
// Compatible with service worker (no FileReader, no window)

/**
 * Convert a Blob to a base64 data URL (service-worker safe)
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToDataUrl(blob) {
  return blob.arrayBuffer().then((buf) => {
    const bytes = new Uint8Array(buf)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    const mime = blob.type || 'image/png'
    return `data:${mime};base64,${base64}`
  })
}

/**
 * Capture the current visible tab as a screenshot
 * Uses chrome.tabs.captureVisibleTab which requires the activeTab permission
 * @returns {Promise<string>} Data URL of the screenshot
 */
export async function captureVisibleTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve(dataUrl)
      }
    })
  })
}

/**
 * Capture the current active tab and crop to the given region
 * Uses OffscreenCanvas — works in service worker.
 *
 * @param {{ x: number, y: number, width: number, height: number }} region - Viewport coordinates
 * @returns {Promise<string>} Data URL of the cropped screenshot
 */
export async function captureRegion(region) {
  const fullScreenshot = await captureVisibleTab()

  // Decode the data URL into a blob, then into a bitmap
  const imgBlob = dataUrlToBlob(fullScreenshot)
  const bitmap = await createImageBitmap(imgBlob)

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  // Crop to the selected region
  const croppedCanvas = new OffscreenCanvas(
    Math.round(region.width),
    Math.round(region.height)
  )
  const croppedCtx = croppedCanvas.getContext('2d')
  croppedCtx.drawImage(
    canvas,
    Math.round(region.viewportX || region.x),
    Math.round(region.viewportY || region.y),
    Math.round(region.width),
    Math.round(region.height),
    0, 0,
    Math.round(region.width),
    Math.round(region.height)
  )

  const blob = await croppedCanvas.convertToBlob({ type: 'image/png' })
  return blobToDataUrl(blob)
}

/**
 * Convert a data URL to a Blob (service-worker safe)
 * @param {string} dataUrl
 * @returns {Blob}
 */
function dataUrlToBlob(dataUrl) {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!match) throw new Error('Invalid data URL format')
  const mime = match[1]
  const base64 = match[2]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

/**
 * Take a screenshot and return it (called from content script request)
 */
export async function handleScreenshotRequest(region = null) {
  if (region) {
    return captureRegion(region)
  }
  return captureVisibleTab()
}
