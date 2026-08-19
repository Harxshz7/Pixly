// Pixly Phase 1 — Image Utilities
// Compatible with both content scripts and service workers (no document/FileReader)

import { MAX_IMAGE_SIZE, IMAGE_QUALITY, IMAGE_FORMAT } from '../utils/constants.js'

/**
 * Convert a Blob to a base64 data URL using arrayBuffer (service-worker safe)
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToBase64(blob) {
  return blob.arrayBuffer().then((buf) => {
    const bytes = new Uint8Array(buf)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    const mime = blob.type || IMAGE_FORMAT
    return `data:${mime};base64,${base64}`
  })
}

/**
 * Convert an image URL to a base64 data URL
 * @param {string} imageUrl - The image URL
 * @returns {Promise<string>} Base64 data URL
 */
export async function imageUrlToDataUrl(imageUrl) {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }
  const blob = await response.blob()
  return blobToBase64(blob)
}

/**
 * Compress an image if it exceeds max size.
 * Uses OffscreenCanvas — works in both content scripts and service workers.
 *
 * @param {string} dataUrl - Base64 data URL
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @returns {Promise<string>} Compressed data URL
 */
export async function compressImage(dataUrl, maxWidth = 1568, maxHeight = 1568) {
  // Decode the data URL into a bitmap
  const bitmap = await createImageBitmap(dataUrlToBlob(dataUrl))

  let { width, height } = bitmap

  // Scale down if needed
  if (width > maxWidth || height > maxHeight) {
    const scale = Math.min(maxWidth / width, maxHeight / height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  // Use OffscreenCanvas (available in both content scripts and service workers)
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await canvas.convertToBlob({ type: IMAGE_FORMAT, quality: IMAGE_QUALITY })

  // Check if still too large
  if (blob.size > MAX_IMAGE_SIZE) {
    const smaller = await canvas.convertToBlob({ type: IMAGE_FORMAT, quality: 0.5 })
    return blobToBase64(smaller)
  }

  return blobToBase64(blob)
}

/**
 * Convert a data URL to a Blob (service-worker safe, no FileReader)
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
 * Extract a region from a canvas as a data URL
 * @param {OffscreenCanvas|HTMLCanvasElement} canvas
 * @param {{ x: number, y: number, width: number, height: number }} region
 * @returns {Promise<string>} Data URL of the cropped region
 */
export async function extractRegion(canvas, region) {
  const cropped = new OffscreenCanvas(region.width, region.height)
  const ctx = cropped.getContext('2d')
  ctx.drawImage(
    canvas,
    region.x, region.y, region.width, region.height,
    0, 0, region.width, region.height
  )
  const blob = await cropped.convertToBlob({ type: IMAGE_FORMAT, quality: IMAGE_QUALITY })
  return blobToBase64(blob)
}

/**
 * Get the MIME type from a data URL
 */
export function getMimeType(dataUrl) {
  const match = dataUrl.match(/^data:(image\/\w+);/)
  return match ? match[1] : IMAGE_FORMAT
}
