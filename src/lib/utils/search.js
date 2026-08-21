// Pixly Phase 3 — Client-side Search Utility
// Simple debounced search/filter over history entries. No AI calls.

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} ms - Delay in milliseconds
 * @returns {Function}
 */
export function debounce(fn, ms = 200) {
  let timer = null
  const debounced = (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, ms)
  }
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  return debounced
}

/**
 * Filter history entries by a search query.
 * Matches against snippet, result, pageUrl, pageTitle, analysis metadata.
 *
 * @param {Array} entries - History entries
 * @param {string} query - Search query
 * @returns {Array} Filtered entries
 */
export function filterEntries(entries, query) {
  if (!query || !query.trim()) return entries
  const q = query.toLowerCase().trim()
  return entries.filter((entry) => {
    const fields = [
      entry.snippet,
      entry.result,
      entry.pageUrl,
      entry.pageTitle,
      entry.analysis?.style?.type,
      entry.analysis?.style?.description,
      entry.analysis?.components?.map((c) => c.name).join(' '),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return fields.includes(q)
  })
}

/**
 * Group entries by type.
 * @param {Array} entries
 * @returns {Object} { text: [...], image: [...], ui: [...] }
 */
export function groupByType(entries) {
  const groups = { text: [], image: [], ui: [] }
  for (const entry of entries) {
    const key = entry.type || 'text'
    if (groups[key]) {
      groups[key].push(entry)
    } else {
      groups.text.push(entry)
    }
  }
  return groups
}

/**
 * Format a timestamp into a human-readable relative or absolute string.
 * @param {number} timestamp
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: days > 365 ? 'numeric' : undefined,
  })
}
