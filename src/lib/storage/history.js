// Pixly Phase 3 — History Storage
// chrome.storage.local CRUD for saved analysis results.
// Each entry: { id, type, timestamp, snippet, thumbnail, snippet_or_thumbnail, result, analysis, codeResult, codeFormat, format, variations, favorited, favorite }

const HISTORY_KEY = 'pixly_history'
const DEFAULT_LIMIT = 50

/** Generate a short unique id */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/**
 * Get the current history limit from settings.
 * Falls back to DEFAULT_LIMIT if settings can't be read.
 */
export async function getHistoryLimit() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const result = await chrome.storage.local.get('pixly_history_limit')
      return result['pixly_history_limit'] ?? DEFAULT_LIMIT
    }
  } catch {}
  return DEFAULT_LIMIT
}

/**
 * Read raw history array from storage.
 */
async function readHistory() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const result = await chrome.storage.local.get(HISTORY_KEY)
      return result[HISTORY_KEY] || []
    }
  } catch {}
  return []
}

/**
 * Write the full history array to storage.
 */
async function writeHistory(entries) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [HISTORY_KEY]: entries })
  }
}

/**
 * Save a completed analysis result to history.
 * Fire-and-forget safe — never throws or blocks.
 * Caps non-favorited entries at the configured limit (FIFO eviction).
 *
 * FIFO Eviction Policy:
 * Favorited entries are pinned and excluded from FIFO eviction.
 * They do not count against the configured limit (e.g. 50 entries).
 * Oldest non-favorited entries are dropped once non-favorites exceed the limit.
 *
 * @param {object} entry
 * @param {string} entry.type - 'text' | 'image' | 'box' | 'ui'
 * @param {string} [entry.snippet] - Short text snippet or alt text for collapsed view
 * @param {string} [entry.thumbnail] - Base64 data URL thumbnail for image/UI types
 * @param {string} [entry.snippet_or_thumbnail] - Alias for snippet or thumbnail
 * @param {string} [entry.result] - Raw markdown result (Phase 1)
 * @param {object} [entry.analysis] - Structured analysis object (Phase 2)
 * @param {string} [entry.codeResult] - Generated code string (Phase 2)
 * @param {string} [entry.codeFormat] - Format used for code generation
 * @param {string} [entry.format] - Alias for codeFormat
 * @param {Array} [entry.variations] - Variations array (Phase 2)
 * @param {string} [entry.pageUrl] - Source page URL
 * @param {string} [entry.pageTitle] - Source page title
 * @param {boolean} [entry.favorited] - Favorite flag
 * @returns {Promise<string>} The new entry's id
 */
export async function saveToHistory(entry) {
  try {
    const id = entry.id || generateId()
    const isFav = Boolean(entry.favorited ?? entry.favorite ?? false)
    const snippetVal = entry.snippet || (typeof entry.snippet_or_thumbnail === 'string' && !entry.snippet_or_thumbnail.startsWith('data:') ? entry.snippet_or_thumbnail : '')
    const thumbnailVal = entry.thumbnail || (typeof entry.snippet_or_thumbnail === 'string' && entry.snippet_or_thumbnail.startsWith('data:') ? entry.snippet_or_thumbnail : null)

    const record = {
      id,
      type: entry.type || 'text',
      timestamp: entry.timestamp || Date.now(),
      snippet: snippetVal,
      thumbnail: thumbnailVal,
      snippet_or_thumbnail: entry.snippet_or_thumbnail || snippetVal || thumbnailVal,
      result: entry.result || null,
      analysis: entry.analysis || null,
      codeResult: entry.codeResult || null,
      codeFormat: entry.codeFormat || entry.format || null,
      format: entry.format || entry.codeFormat || null,
      variations: entry.variations || null,
      pageUrl: entry.pageUrl || null,
      pageTitle: entry.pageTitle || null,
      favorited: isFav,
      favorite: isFav,
    }

    const entries = await readHistory()
    entries.unshift(record)

    // Enforce limit — drop oldest non-favorited entries
    const limit = await getHistoryLimit()
    const favorites = entries.filter((e) => e.favorited || e.favorite)
    const nonFavorites = entries.filter((e) => !(e.favorited || e.favorite))

    if (nonFavorites.length > limit) {
      nonFavorites.length = limit
    }

    const merged = [...favorites, ...nonFavorites]
    merged.sort((a, b) => b.timestamp - a.timestamp)

    await writeHistory(merged)
    return id
  } catch (err) {
    console.error('saveToHistory error:', err)
    return entry?.id || generateId()
  }
}

/**
 * Update an existing history entry by id.
 * Useful for saving code generation or variations after the initial save.
 *
 * @param {string} id
 * @param {object} fields - Partial fields to merge
 */
export async function updateHistoryEntry(id, fields) {
  try {
    const entries = await readHistory()
    const idx = entries.findIndex((e) => e.id === id)
    if (idx === -1) return false
    Object.assign(entries[idx], fields)
    if (fields.format && !fields.codeFormat) entries[idx].codeFormat = fields.format
    if (fields.codeFormat && !fields.format) entries[idx].format = fields.codeFormat
    if (fields.favorited !== undefined) entries[idx].favorite = fields.favorited
    if (fields.favorite !== undefined) entries[idx].favorited = fields.favorite
    await writeHistory(entries)
    return true
  } catch {
    return false
  }
}

/**
 * Toggle the favorite flag on a history entry.
 * Favorites are pinned to the top and excluded from FIFO eviction.
 *
 * @param {string} id
 * @returns {Promise<boolean|null>} New favorite state, or null if not found
 */
export async function toggleFavorite(id) {
  try {
    const entries = await readHistory()
    const idx = entries.findIndex((e) => e.id === id)
    if (idx === -1) return null
    const currentState = Boolean(entries[idx].favorited ?? entries[idx].favorite)
    const newState = !currentState
    entries[idx].favorited = newState
    entries[idx].favorite = newState
    await writeHistory(entries)
    return newState
  } catch {
    return null
  }
}

/**
 * Get all history entries, sorted with favorites first (pinned) then newest first.
 *
 * @param {boolean} [pinnedFavorites=false] - Whether to sort favorites to the top
 * @returns {Promise<Array>}
 */
export async function getHistory(pinnedFavorites = false) {
  const entries = await readHistory()
  if (!pinnedFavorites) return entries
  return [...entries].sort((a, b) => {
    const aFav = Boolean(a.favorited || a.favorite)
    const bFav = Boolean(b.favorited || b.favorite)
    if (aFav && !bFav) return -1
    if (!aFav && bFav) return 1
    return (b.timestamp || 0) - (a.timestamp || 0)
  })
}

/**
 * Get a single history entry by id.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getHistoryEntry(id) {
  const entries = await readHistory()
  return entries.find((e) => e.id === id) || null
}

/**
 * Delete a single history entry by id.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteHistoryEntry(id) {
  try {
    const entries = await readHistory()
    const filtered = entries.filter((e) => e.id !== id)
    if (filtered.length === entries.length) return false
    await writeHistory(filtered)
    return true
  } catch {
    return false
  }
}

/**
 * Clear all history.
 */
export async function clearHistory() {
  await writeHistory([])
}

/**
 * Search history entries by matching query against snippet, result, pageUrl, or pageTitle.
 * Simple case-insensitive substring match, debounced externally.
 *
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchHistory(query) {
  const entries = await readHistory()
  if (!query || !query.trim()) return entries
  const q = query.toLowerCase().trim()
  return entries.filter((e) => {
    const searchable = [
      e.snippet,
      e.snippet_or_thumbnail,
      e.result,
      e.codeResult,
      e.pageUrl,
      e.pageTitle,
      e.analysis?.style?.type,
      e.analysis?.style?.description,
      e.analysis?.components?.map((c) => c.name).join(' '),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return searchable.includes(q)
  })
}

/**
 * Get history count.
 * @returns {Promise<number>}
 */
export async function getHistoryCount() {
  const entries = await readHistory()
  return entries.length
}

