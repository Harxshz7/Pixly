// Pixly Phase 3 — History Storage
// chrome.storage.local CRUD for saved analysis results.
// Each entry: { id, type, timestamp, snippet, thumbnail, result, analysis, codeResult, codeFormat, variations }

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
async function getHistoryLimit() {
  try {
    const result = await chrome.storage.local.get('pixly_history_limit')
    return result['pixly_history_limit'] ?? DEFAULT_LIMIT
  } catch {
    return DEFAULT_LIMIT
  }
}

/**
 * Read raw history array from storage.
 */
async function readHistory() {
  try {
    const result = await chrome.storage.local.get(HISTORY_KEY)
    return result[HISTORY_KEY] || []
  } catch {
    return []
  }
}

/**
 * Write the full history array to storage.
 */
async function writeHistory(entries) {
  await chrome.storage.local.set({ [HISTORY_KEY]: entries })
}

/**
 * Save a completed analysis result to history.
 * Caps the list at the configured limit (FIFO — oldest dropped).
 *
 * @param {object} entry
 * @param {string} entry.type - 'text' | 'image' | 'ui'
 * @param {string} [entry.snippet] - Short text snippet or alt text for collapsed view
 * @param {string} [entry.thumbnail] - Base64 data URL thumbnail for image/UI types (small, compressed)
 * @param {string} [entry.result] - Raw markdown result (Phase 1)
 * @param {object} [entry.analysis] - Structured analysis object (Phase 2)
 * @param {string} [entry.codeResult] - Generated code string (Phase 2)
 * @param {string} [entry.codeFormat] - Format used for code generation
 * @param {Array} [entry.variations] - Variations array (Phase 2)
 * @param {string} [entry.pageUrl] - Source page URL
 * @param {string} [entry.pageTitle] - Source page title
 * @returns {Promise<string>} The new entry's id
 */
export async function saveToHistory(entry) {
  const id = generateId()
  const record = {
    id,
    type: entry.type || 'text',
    timestamp: Date.now(),
    snippet: entry.snippet || '',
    thumbnail: entry.thumbnail || null,
    result: entry.result || null,
    analysis: entry.analysis || null,
    codeResult: entry.codeResult || null,
    codeFormat: entry.codeFormat || null,
    variations: entry.variations || null,
    pageUrl: entry.pageUrl || null,
    pageTitle: entry.pageTitle || null,
  }

  const entries = await readHistory()
  entries.unshift(record)

  // Enforce limit — drop oldest
  const limit = await getHistoryLimit()
  if (entries.length > limit) {
    entries.length = limit
  }

  await writeHistory(entries)
  return id
}

/**
 * Update an existing history entry by id.
 * Useful for saving code generation or variations after the initial save.
 *
 * @param {string} id
 * @param {object} fields - Partial fields to merge
 */
export async function updateHistoryEntry(id, fields) {
  const entries = await readHistory()
  const idx = entries.findIndex((e) => e.id === id)
  if (idx === -1) return false
  Object.assign(entries[idx], fields)
  await writeHistory(entries)
  return true
}

/**
 * Get all history entries, newest first.
 * @returns {Promise<Array>}
 */
export async function getHistory() {
  return readHistory()
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
  const entries = await readHistory()
  const filtered = entries.filter((e) => e.id !== id)
  if (filtered.length === entries.length) return false
  await writeHistory(filtered)
  return true
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
  if (!query || !query.trim()) return readHistory()
  const q = query.toLowerCase().trim()
  const entries = await readHistory()
  return entries.filter((e) => {
    const searchable = [
      e.snippet,
      e.result,
      e.pageUrl,
      e.pageTitle,
      e.analysis?.style?.type,
      e.analysis?.style?.description,
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
