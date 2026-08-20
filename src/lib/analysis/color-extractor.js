// Pixly Phase 2 — Color Palette Extractor
// Extracts 5-8 dominant colors directly from a cropped image via canvas pixel sampling.
// Deterministic, no AI cost. Works in service worker (OffscreenCanvas).

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
 * Reduce a color channel to N bits for quantization.
 * Reduces 8-bit (0-255) to fewer levels to group similar colors.
 */
function quantize(val, bits = 4) {
  const levels = 1 << bits
  const step = 256 / levels
  return Math.floor(val / step) * step + Math.floor(step / 2)
}

/**
 * Convert RGB to hex string
 */
function rgbToHex(r, g, b) {
  const toHex = (v) => Math.round(Math.max(0, Math.min(255, v)))
    .toString(16)
    .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Calculate relative luminance (WCAG 2.0 formula)
 * Returns value between 0 (black) and 1 (white)
 */
export function luminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Extract dominant colors from a base64 data URL image.
 * Uses canvas pixel sampling with color quantization.
 *
 * @param {string} dataUrl - Base64 data URL of the image
 * @param {number} [maxColors=8] - Maximum number of colors to return
 * @returns {Promise<Array<{ hex: string, rgb: [number,number,number], percentage: number }>>}
 */
export async function extractColors(dataUrl, maxColors = 8) {
  const bitmap = await createImageBitmap(dataUrlToBlob(dataUrl))

  // Sample at a reduced resolution for performance
  const sampleWidth = Math.min(bitmap.width, 200)
  const sampleHeight = Math.min(bitmap.height, 200)
  const scaleX = bitmap.width / sampleWidth
  const scaleY = bitmap.height / sampleHeight

  const canvas = new OffscreenCanvas(sampleWidth, sampleHeight)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, sampleWidth, sampleHeight)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
  const pixels = imageData.data
  const totalPixels = sampleWidth * sampleHeight

  // Quantize and count colors
  const colorMap = new Map()

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]

    // Skip transparent pixels
    if (a < 128) continue

    // Quantize to reduce similar colors into buckets
    const qr = quantize(r)
    const qg = quantize(g)
    const qb = quantize(b)
    const key = `${qr},${qg},${qb}`

    if (colorMap.has(key)) {
      const entry = colorMap.get(key)
      entry.count++
      // Accumulate actual RGB for more accurate average
      entry.rSum += r
      entry.gSum += g
      entry.bSum += b
    } else {
      colorMap.set(key, {
        count: 1,
        rSum: r,
        gSum: g,
        bSum: b,
      })
    }
  }

  // Sort by count, take top N
  const sorted = [...colorMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, maxColors)

  const totalColored = sorted.reduce((sum, [, e]) => sum + e.count, 0)

  const colors = sorted.map(([, entry]) => {
    const r = Math.round(entry.rSum / entry.count)
    const g = Math.round(entry.gSum / entry.count)
    const b = Math.round(entry.bSum / entry.count)
    return {
      hex: rgbToHex(r, g, b),
      rgb: [r, g, b],
      percentage: Math.round((entry.count / totalColored) * 100),
    }
  })

  return colors
}
