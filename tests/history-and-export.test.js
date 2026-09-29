// Pixly Phase 3 — History, Search, Markdown Export, and Event Log Unit Tests
import test from 'node:test'
import assert from 'node:assert/strict'

// Setup mock chrome.storage.local for Node.js environment
const mockStorage = {}
globalThis.chrome = {
  storage: {
    local: {
      get: async (keys) => {
        if (typeof keys === 'string') {
          return { [keys]: mockStorage[keys] }
        }
        if (Array.isArray(keys)) {
          const res = {}
          for (const k of keys) res[k] = mockStorage[k]
          return res
        }
        return { ...mockStorage }
      },
      set: async (items) => {
        Object.assign(mockStorage, items)
      },
      remove: async (keys) => {
        const arr = Array.isArray(keys) ? keys : [keys]
        for (const k of arr) delete mockStorage[k]
      },
      clear: async () => {
        for (const k of Object.keys(mockStorage)) delete mockStorage[k]
      },
    },
  },
}

import {
  saveToHistory,
  getHistory,
  getHistoryEntry,
  updateHistoryEntry,
  toggleFavorite,
  deleteHistoryEntry,
  clearHistory,
  searchHistory,
  getHistoryCount,
  getHistoryLimit,
} from '../src/lib/storage/history.js'

import {
  debounce,
  filterEntries,
  groupByType,
  formatTimestamp,
} from '../src/lib/utils/search.js'

import { exportToMarkdown } from '../src/lib/generators/markdown-export.js'

import {
  logEvent,
  logCodegen,
  logError,
  getEventLog,
  resetEventLog,
  EVENTS,
} from '../src/lib/telemetry/event-log.js'

test('history.js: CRUD operations and fire-and-forget saving', async () => {
  await clearHistory()

  // 1. Save entry
  const id = await saveToHistory({
    type: 'text',
    snippet: 'Explain this CTA button',
    result: 'This is a high-contrast Call to Action button.',
    format: 'react-tailwind',
  })
  assert.ok(id, 'Should return generated id')

  // 2. Read entries
  const list = await getHistory()
  assert.equal(list.length, 1)
  assert.equal(list[0].id, id)
  assert.equal(list[0].type, 'text')
  assert.equal(list[0].snippet, 'Explain this CTA button')
  assert.equal(list[0].favorited, false)

  // 3. Get single entry
  const entry = await getHistoryEntry(id)
  assert.equal(entry.id, id)

  // 4. Update entry
  const updated = await updateHistoryEntry(id, {
    codeResult: '<button className="bg-blue-600 text-white">Click</button>',
    codeFormat: 'react-tailwind',
  })
  assert.equal(updated, true)
  const updatedEntry = await getHistoryEntry(id)
  assert.equal(updatedEntry.codeResult, '<button className="bg-blue-600 text-white">Click</button>')

  // 5. Delete entry
  const deleted = await deleteHistoryEntry(id)
  assert.equal(deleted, true)
  const emptyList = await getHistory()
  assert.equal(emptyList.length, 0)
})

test('history.js: FIFO eviction caps at limit while preserving favorites', async () => {
  await clearHistory()
  mockStorage['pixly_history_limit'] = 5 // set test limit to 5

  // Save 5 entries
  const ids = []
  for (let i = 1; i <= 5; i++) {
    const id = await saveToHistory({
      type: 'ui',
      snippet: `Entry ${i}`,
      timestamp: 1000 + i,
    })
    ids.push(id)
  }

  // Favorite entry 2
  await toggleFavorite(ids[1])

  // Save 3 more entries (total added: 8)
  for (let i = 6; i <= 8; i++) {
    await saveToHistory({
      type: 'ui',
      snippet: `Entry ${i}`,
      timestamp: 1000 + i,
    })
  }

  const currentHistory = await getHistory()
  // Favorited entry 2 MUST be preserved!
  const favEntry = currentHistory.find((e) => e.snippet === 'Entry 2')
  assert.ok(favEntry, 'Favorited entry must not be evicted')
  assert.equal(favEntry.favorited, true)

  // Oldest non-favorited entries (1, 3) should have been evicted
  assert.equal(currentHistory.find((e) => e.snippet === 'Entry 1'), undefined)
  assert.equal(currentHistory.find((e) => e.snippet === 'Entry 3'), undefined)

  // Recent entries 4, 5, 6, 7, 8 should exist
  assert.ok(currentHistory.find((e) => e.snippet === 'Entry 8'))
  assert.ok(currentHistory.find((e) => e.snippet === 'Entry 7'))
  assert.ok(currentHistory.find((e) => e.snippet === 'Entry 6'))

  // Reset limit
  delete mockStorage['pixly_history_limit']
})

test('history.js: toggleFavorite flips state and getHistory with pinnedFavorites', async () => {
  await clearHistory()

  const id1 = await saveToHistory({ snippet: 'Item 1', timestamp: 100 })
  const id2 = await saveToHistory({ snippet: 'Item 2', timestamp: 200 })

  const state1 = await toggleFavorite(id1)
  assert.equal(state1, true)

  const pinnedList = await getHistory(true)
  assert.equal(pinnedList[0].id, id1, 'Favorited item 1 must be pinned to the top')

  const state2 = await toggleFavorite(id1)
  assert.equal(state2, false)
})

test('history.js: searchHistory searches across snippets and analysis metadata', async () => {
  await clearHistory()

  await saveToHistory({
    type: 'ui',
    snippet: 'Landing page hero',
    analysis: {
      style: { type: 'Neumorphism', description: 'Soft shadows and rounded cards' },
      components: [{ name: 'HeroSection' }, { name: 'CTAButton' }],
    },
  })

  await saveToHistory({
    type: 'text',
    snippet: 'Privacy policy paragraph',
    result: 'We take security very seriously and encrypt all local storage.',
  })

  // Search by style type
  const res1 = await searchHistory('neumorphism')
  assert.equal(res1.length, 1)
  assert.equal(res1[0].snippet, 'Landing page hero')

  // Search by component name
  const res2 = await searchHistory('CTAButton')
  assert.equal(res2.length, 1)
  assert.equal(res2[0].snippet, 'Landing page hero')

  // Search by result text
  const res3 = await searchHistory('encrypt')
  assert.equal(res3.length, 1)
  assert.equal(res3[0].snippet, 'Privacy policy paragraph')

  // Empty query returns all
  const resAll = await searchHistory('')
  assert.equal(resAll.length, 2)
})

test('search.js: filterEntries, groupByType, and formatTimestamp', () => {
  const entries = [
    { type: 'text', snippet: 'Text note about typography', result: 'Inter font used' },
    { type: 'image', snippet: 'Image of pricing table', pageTitle: 'Pricing Page' },
    { type: 'box', snippet: 'Box capture of modal', analysis: { style: { type: 'Dark Glass' } } },
  ]

  // filterEntries
  const filtered = filterEntries(entries, 'pricing')
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].type, 'image')

  // groupByType (maps box to ui)
  const groups = groupByType(entries)
  assert.equal(groups.text.length, 1)
  assert.equal(groups.image.length, 1)
  assert.equal(groups.ui.length, 1)
  assert.equal(groups.ui[0].type, 'box')

  // formatTimestamp
  const now = Date.now()
  assert.equal(formatTimestamp(now - 10000), 'Just now')
  assert.equal(formatTimestamp(now - 5 * 60 * 1000), '5m ago')
  assert.equal(formatTimestamp(now - 3 * 3600 * 1000), '3h ago')
  assert.equal(formatTimestamp(now - 2 * 86400 * 1000), '2d ago')
})

test('search.js: debounce calls after delay and can be cancelled', async () => {
  let callCount = 0
  const debounced = debounce(() => {
    callCount++
  }, 50)

  debounced()
  debounced()
  debounced()
  assert.equal(callCount, 0, 'Should not be called synchronously')

  await new Promise((resolve) => setTimeout(resolve, 80))
  assert.equal(callCount, 1, 'Should be called exactly once after debounce duration')

  // Test cancellation
  debounced()
  debounced.cancel()
  await new Promise((resolve) => setTimeout(resolve, 80))
  assert.equal(callCount, 1, 'Cancelled call should not fire')
})

test('markdown-export.js: exports clean Markdown with only existing sections', () => {
  const fullEntry = {
    pageTitle: 'Dashboard Header',
    type: 'ui',
    timestamp: 1700000000000,
    pageUrl: 'https://example.com/dashboard',
    analysis: {
      style: { type: 'Bento Grid', confidence: 'high', description: 'Modern bento grid card layout.' },
      theme: { mode: 'dark', luminance: 0.12 },
      colors: [{ hex: '#1E293B', rgb: [30, 41, 59], percentage: 45 }],
      typography: {
        families: ['Inter', 'Roboto Mono'],
        hierarchy: {
          H1: { approximateSize: '32px', weight: '700' },
        },
      },
      components: [
        { name: 'StatCard', type: 'Card', position: 'top-left', description: 'Metrics summary card' },
      ],
      tokens: {
        spacing: { scale: [4, 8, 16, 24], description: '4px baseline' },
        radius: { values: [8, 16], description: 'Rounded md and lg' },
        shadows: [{ definition: '0 4px 6px -1px rgb(0 0 0 / 0.1)', description: 'Card elevation' }],
      },
    },
    codeResult: 'export default function StatCard() { return <div>1,234</div> }',
    codeFormat: 'react-tailwind',
    variations: [
      {
        title: 'Minimalist Light',
        approach: 'inspired-redesign',
        description: 'Clean monochrome redesign',
        prompt: 'Generate minimal variation',
      },
    ],
  }

  const md = exportToMarkdown(fullEntry)

  // Verify all sections are present
  assert.ok(md.includes('# Dashboard Header'))
  assert.ok(md.includes('**Type:** UI Analysis'))
  assert.ok(md.includes('**Source:** https://example.com/dashboard'))
  assert.ok(md.includes('## Style'))
  assert.ok(md.includes('**Bento Grid** (high confidence)'))
  assert.ok(md.includes('## Theme'))
  assert.ok(md.includes('🌙 Dark'))
  assert.ok(md.includes('## Colors'))
  assert.ok(md.includes('`#1E293B`'))
  assert.ok(md.includes('## Typography'))
  assert.ok(md.includes('Inter, Roboto Mono'))
  assert.ok(md.includes('## Components'))
  assert.ok(md.includes('**StatCard** (Card) — top-left'))
  assert.ok(md.includes('## Tokens'))
  assert.ok(md.includes('4px, 8px, 16px, 24px'))
  assert.ok(md.includes('## Code'))
  assert.ok(md.includes('```jsx'))
  assert.ok(md.includes('## Variations'))
  assert.ok(md.includes('### Minimalist Light'))

  // Verify partial result excludes missing sections
  const partialEntry = {
    snippet: 'Simple Text Explanation',
    type: 'text',
    result: 'This is a simple explanation with no code or components.',
  }

  const partialMd = exportToMarkdown(partialEntry)
  assert.ok(partialMd.includes('# Simple Text Explanation'))
  assert.ok(partialMd.includes('This is a simple explanation with no code or components.'))
  assert.equal(partialMd.includes('## Style'), false)
  assert.equal(partialMd.includes('## Colors'), false)
  assert.equal(partialMd.includes('## Tokens'), false)
  assert.equal(partialMd.includes('## Code'), false)
  assert.equal(partialMd.includes('## Variations'), false)
})

test('event-log.js: increments local counters with zero external calls', async () => {
  await resetEventLog()

  logEvent(EVENTS.TEXT_ANALYZED)
  logEvent(EVENTS.IMAGE_ANALYZED)
  logEvent(EVENTS.BOX_ANALYZED)
  logCodegen('react-tailwind')
  logCodegen('flutter')
  logEvent(EVENTS.EXPORT_USED)
  logError('rate-limit')
  logError('network')

  // Allow fire-and-forget async promises to complete
  await new Promise((resolve) => setTimeout(resolve, 50))

  const log = await getEventLog()
  assert.equal(log[EVENTS.TEXT_ANALYZED], 1)
  assert.equal(log[EVENTS.IMAGE_ANALYZED], 1)
  assert.equal(log[EVENTS.BOX_ANALYZED], 1)
  assert.equal(log['codegen_react-tailwind_used'], 1)
  assert.equal(log['codegen_flutter_used'], 1)
  assert.equal(log[EVENTS.CODE_GENERATED], 2)
  assert.equal(log[EVENTS.EXPORT_USED], 1)
  assert.equal(log['error_rate-limit'], 1)
  assert.equal(log['error_network'], 1)

  // Reset log
  await resetEventLog()
  const emptyLog = await getEventLog()
  assert.deepEqual(emptyLog, {})
})
