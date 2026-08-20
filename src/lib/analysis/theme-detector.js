// Pixly Phase 2 — Theme Detector
// Determines dark/light mode from a cropped image using average luminance.
// Deterministic, no AI cost. Works in service worker (OffscreenCanvas).

import { luminance } from './color-extractor.js'

/**
 * Convert a data URL to a Blob (service-worker safe)
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
 * Detect whether an image has a dark or light theme.
 * Uses average luminance of the image pixels.
 *
 * @param {string} dataUrl - Base64 data URL of the cropped image
 * @returns {Promise<{ mode: 'dark' | 'light', luminance: number }>}
 */
export async function detectTheme(dataUrl) {
  const bitmap = await createImageBitmap(dataUrlToBlob(dataUrl))

  // Sample at reduced resolution for performance
  const sampleWidth = Math.min(bitmap.width, 100)
  const sampleHeight = Math.min(bitmap.height, 100)

  const canvas = new OffscreenCanvas(sampleWidth, sampleHeight)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, sampleWidth, sampleHeight)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
  const pixels = imageData.data

  let totalLuminance = 0
  let count = 0

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]

    if (a < 128) continue

    totalLuminance += luminance(r, g, b)
    count++
  }

  const avgLuminance = count > 0 ? totalLuminance / count : 0.5

  return {
    mode: avgLuminance < 0.4 ? 'dark' : 'light',
    luminance: Math.round(avgLuminance * 100) / 100,
  }
}
