// Pixly Phase 1 — Image Utilities

import { MAX_IMAGE_SIZE, IMAGE_QUALITY, IMAGE_FORMAT } from '../utils/constants.js'

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
  return blobToDataUrl(blob)
}

/**
 * Convert a blob to a base64 data URL
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Compress an image if it exceeds max size
 * @param {string} dataUrl - Base64 data URL
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @returns {Promise<string>} Compressed data URL
 */
export async function compressImage(dataUrl, maxWidth = 1568, maxHeight = 1568) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img

      // Scale down if needed
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      const compressed = canvas.toDataURL(IMAGE_FORMAT, IMAGE_QUALITY)

      // Check if still too large
      const sizeInBytes = Math.round((compressed.length - `data:${IMAGE_FORMAT};base64,`.length) * 0.75)
      if (sizeInBytes > MAX_IMAGE_SIZE) {
        // Further compress
        const smaller = canvas.toDataURL(IMAGE_FORMAT, 0.5)
        resolve(smaller)
      } else {
        resolve(compressed)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image for compression'))
    img.src = dataUrl
  })
}

/**
 * Extract a region from a canvas as a data URL
 * @param {HTMLCanvasElement} canvas
 * @param {{ x: number, y: number, width: number, height: number }} region
 * @returns {string} Data URL of the cropped region
 */
export function extractRegion(canvas, region) {
  const cropped = document.createElement('canvas')
  cropped.width = region.width
  cropped.height = region.height
  const ctx = cropped.getContext('2d')
  ctx.drawImage(
    canvas,
    region.x, region.y, region.width, region.height,
    0, 0, region.width, region.height
  )
  return cropped.toDataURL(IMAGE_FORMAT, IMAGE_QUALITY)
}

/**
 * Get the MIME type from a data URL
 */
export function getMimeType(dataUrl) {
  const match = dataUrl.match(/^data:(image\/\w+);/)
  return match ? match[1] : IMAGE_FORMAT
}
