// Pixly Phase 1 — Screenshot capture via chrome.tabCapture / scripting

import { MESSAGE_TYPES } from '../utils/constants.js'
import { sendToTab } from '../utils/messaging.js'

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
 * @param {{ x: number, y: number, width: number, height: number }} region - Page coordinates
 * @returns {Promise<string>} Data URL of the cropped screenshot
 */
export async function captureRegion(region) {
  // First, get the full page screenshot
  const fullScreenshot = await captureVisibleTab()

  // Then crop it using canvas in a content script or offscreen
  // Since we can't do canvas operations in the service worker, we send
  // the screenshot to the content script for cropping
  const activeTab = await getActiveTab()
  if (!activeTab) throw new Error('No active tab')

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = new OffscreenCanvas(img.width, img.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      // Account for device pixel ratio
      const dpr = window.devicePixelRatio || 1

      const croppedCanvas = new OffscreenCanvas(
        Math.round(region.width * dpr),
        Math.round(region.height * dpr)
      )
      const croppedCtx = croppedCanvas.getContext('2d')
      croppedCtx.drawImage(
        canvas,
        Math.round(region.x * dpr),
        Math.round(region.y * dpr),
        Math.round(region.width * dpr),
        Math.round(region.height * dpr),
        0, 0,
        Math.round(region.width * dpr),
        Math.round(region.height * dpr)
      )

      croppedCanvas.convertToBlob({ type: 'image/png' }).then((blob) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }
    img.onerror = () => reject(new Error('Failed to load screenshot'))
    img.src = fullScreenshot
  })
}

/**
 * Get the current active tab
 */
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab || null
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
