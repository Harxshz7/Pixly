// Pixly Phase 4b — Prompt Templates Storage
// Handles CRUD, versioning, defaults recovery, and safe failure tracking.

import { validateTemplate } from '../ai/template-validator.js'

export const TEMPLATES_STORAGE_KEY = 'pixly_prompt_templates'
export const TEMPLATE_FAILURES_KEY = 'pixly_template_failures'
export const TEMPLATE_SCHEMA_VERSION = 1
export const CONSECUTIVE_FAILURE_THRESHOLD = 3

export const TEMPLATE_CATEGORIES = {
  ANALYSIS: 'analysis',
  CODEGEN: 'codegen',
}

/**
 * Canonical default prompt templates.
 * These are immutable defaults that are always recoverable.
 */
export const DEFAULT_TEMPLATES = {
  text: {
    id: 'text',
    label: 'Text Explanation',
    category: TEMPLATE_CATEGORIES.ANALYSIS,
    description: 'System prompt used when explaining selected text from any webpage.',
    requiredVariables: ['{{selection}}'],
    optionalVariables: ['{{context}}'],
    defaultPrompt: `You are Pixly, an expert design and content analyst. When a user shares selected text from a webpage, you provide a clear, concise explanation of what it is and what it does.

Selected text:
{{selection}}
{{context}}

Your response should include:
1. **What it is** — A brief identification (e.g., a headline, a button label, a navigation item, body copy, etc.)
2. **Purpose** — What role this text plays in the UI or content
3. **Design insight** — A brief note on why this text was likely chosen (tone, clarity, CTA effectiveness, etc.)

Keep responses under 150 words. Use markdown formatting. Be direct and helpful.`,
  },

  image: {
    id: 'image',
    label: 'Image Analysis',
    category: TEMPLATE_CATEGORIES.ANALYSIS,
    description: 'System prompt used for analyzing right-clicked images and captured regions.',
    requiredVariables: ['{{image}}'],
    optionalVariables: ['{{context}}'],
    defaultPrompt: `You are Pixly, an expert UI/UX and image analyst. The user has shared an image from a webpage for analysis.
Image reference: {{image}}
{{context}}

Your response should include:
1. **Description** — What the image shows (2-3 sentences)
2. **Purpose** — How this image is likely used in the UI (illustration, icon, product photo, background, etc.)
3. **Design notes** — Color palette impression, style, quality assessment
4. **Suggested prompts** — 2-3 AI image generation prompts that could recreate a similar image

Keep responses under 200 words. Use markdown formatting. Be specific and helpful.
If you are given a screenshot with UI elements, describe the layout, components, and design patterns visible.`,
  },

  'ui-analysis': {
    id: 'ui-analysis',
    label: 'Full UI Vision Analysis',
    category: TEMPLATE_CATEGORIES.ANALYSIS,
    description: 'Batched vision analysis extracting style, component breakdown, typography, and design tokens as JSON.',
    requiredVariables: ['{{image}}'],
    optionalVariables: [],
    defaultPrompt: `You are Pixly, an expert UI/UX designer and frontend developer. Analyze the provided screenshot of a UI element or section.
Target input: {{image}}

You must return ONLY valid JSON — no markdown, no code fences, no explanation text. Just the raw JSON object.

The JSON must match this exact schema:

{
  "style": {
    "type": "Glassmorphism|Neumorphism|3D/Skeuomorphic|Flat|Material|Brutalist|Minimal|Other",
    "confidence": "high|medium|low",
    "description": "Brief 1-sentence explanation of why this style was classified this way"
  },
  "components": [
    {
      "name": "e.g. Header, Primary Button, Input Field, Icon, Card, Badge, Avatar",
      "type": "container|button|input|icon|text|image|badge|divider|other",
      "position": "brief relative position description like 'top-left', 'center', 'bottom-right'",
      "description": "1 sentence about this component"
    }
  ],
  "typography": {
    "families": ["best guess font family or generic like 'sans-serif, geometric'", "fallback if multiple detected"],
    "hierarchy": {
      "heading": { "approximateSize": "e.g. 20-24px", "weight": "bold|semibold|medium|regular", "description": "" },
      "body": { "approximateSize": "e.g. 14-16px", "weight": "regular|medium", "description": "" },
      "caption": { "approximateSize": "e.g. 11-13px", "weight": "regular|medium", "description": "" }
    }
  },
  "tokens": {
    "spacing": {
      "scale": [4, 8, 12, 16, 24, 32],
      "description": "Estimated spacing scale in pixels based on visual gaps"
    },
    "radius": {
      "values": [0, 4, 8, 12, 16, 9999],
      "description": "Border-radius values detected"
    },
    "shadows": [
      { "definition": "e.g. 0 2px 8px rgba(0,0,0,0.1)", "description": "Where it's used" }
    ]
  }
}

Rules:
- Analyze the image carefully for visual patterns.
- For typography, give your best guess based on visual characteristics (weight, width, x-height).
- For tokens, estimate based on visual proportions — these are approximate.
- For components, identify all distinct interactive or structural elements.
- For style, pick the ONE primary style that best describes the overall design.
- All sizes and spacing are approximate pixel values.
- Return ONLY the JSON object, nothing else.`,
  },

  'react-tailwind': {
    id: 'react-tailwind',
    label: 'React + Tailwind Generator',
    category: TEMPLATE_CATEGORIES.CODEGEN,
    description: 'Generates clean React functional components styled with Tailwind CSS utility classes.',
    requiredVariables: ['{{context}}'],
    optionalVariables: [],
    defaultPrompt: `You are Pixly, a senior React developer. Generate a React component using Tailwind CSS that recreates the analyzed UI section.

Input UI Context:
{{context}}

Rules:
- Use a single functional component with JSX
- Use Tailwind utility classes for all styling
- Map the provided color palette to Tailwind color tokens where possible
- Include responsive classes (sm:, md:, lg:) where appropriate
- Use semantic HTML elements
- Export as default
- Do NOT import React (assume JSX transform)

Output format — return the code in a single code block:
\`\`\`jsx
// React + Tailwind component
\`\`\`

Be concise but complete.`,
  },

  'html-css': {
    id: 'html-css',
    label: 'HTML + CSS Generator',
    category: TEMPLATE_CATEGORIES.CODEGEN,
    description: 'Generates semantic HTML5 and vanilla modern CSS with custom properties.',
    requiredVariables: ['{{context}}'],
    optionalVariables: [],
    defaultPrompt: `You are Pixly, a senior frontend developer. Generate clean, semantic HTML and CSS that recreates the analyzed UI section.

Input UI Context:
{{context}}

Rules:
- Output semantic HTML5 with modern CSS (flexbox/grid, CSS custom properties)
- Use clean, readable class names
- Include responsive considerations
- Match the visual design as closely as possible
- Add brief inline comments for non-obvious styling
- Do NOT use any CSS framework — pure HTML + CSS only
- Use the provided color palette and design tokens directly

Output format — return BOTH code blocks exactly:
\`\`\`html
<!-- HTML -->
\`\`\`

\`\`\`css
/* CSS */
\`\`\`

Be concise but complete. Focus on accuracy.`,
  },

  vue: {
    id: 'vue',
    label: 'Vue 3 Generator',
    category: TEMPLATE_CATEGORIES.CODEGEN,
    description: 'Generates Vue 3 Single File Components (SFC) with <script setup> and scoped CSS.',
    requiredVariables: ['{{context}}'],
    optionalVariables: [],
    defaultPrompt: `You are Pixly, a senior Vue.js developer. Generate a Vue 3 Single File Component (SFC) using the Composition API that recreates the analyzed UI section.

Input UI Context:
{{context}}

Rules:
- Use Vue 3 Single File Component with <script setup> and <template>
- Use scoped CSS in a <style scoped> block (plain CSS, no preprocessors)
- Output clean, semantic template markup
- Match the visual design as closely as possible (colors, spacing, typography, shadows, borders)
- Use the provided color palette and design tokens directly in the scoped styles
- Do NOT use any component library or CSS framework — pure Vue 3 + CSS only

Output format — return the code in a single vue code block:
\`\`\`vue
<template>
  <!-- Component template -->
</template>

<script setup>
// Component logic if needed
</script>

<style scoped>
/* Scoped styles */
</style>
\`\`\`

Be concise but complete. Focus on accuracy.`,
  },

  flutter: {
    id: 'flutter',
    label: 'Flutter Generator',
    category: TEMPLATE_CATEGORIES.CODEGEN,
    description: 'Generates clean Flutter widgets using Material Design with appropriate layout and styling.',
    requiredVariables: ['{{context}}'],
    optionalVariables: [],
    defaultPrompt: `You are Pixly, a senior Flutter developer. Generate a Flutter widget that recreates the analyzed UI section.

Input UI Context:
{{context}}

Rules:
- Generate a single StatelessWidget or StatefulWidget class
- Use modern Flutter widgets (Container, Column, Row, Stack, Padding, etc.)
- Map colors from the analysis to Color(0xFF...) or Color.fromRGBO(...)
- Use TextStyle for typography, matching font sizes and weights from the analysis
- Include BoxDecoration for borders, border radius, and box shadows
- Self-contained: do NOT import external packages beyond 'package:flutter/material.dart'
- Keep the widget responsive where appropriate

Output format — return the code in a single dart code block:
\`\`\`dart
import 'package:flutter/material.dart';

// Flutter widget code
\`\`\`

Be concise but complete. Focus on accuracy.`,
  },
}

// ─── Storage Helpers ───────────────────────────────────────────────────────────

async function getRawStorage(keys) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve))
  }
  return {}
}

async function setRawStorage(items) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => chrome.storage.local.set(items, resolve))
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get all default templates as an array.
 */
export function getDefaultTemplates() {
  return Object.values(DEFAULT_TEMPLATES)
}

/**
 * Read the templates store from chrome.storage.local.
 */
export async function getTemplatesStore() {
  const result = await getRawStorage([TEMPLATES_STORAGE_KEY])
  const data = result[TEMPLATES_STORAGE_KEY]
  if (data && data.version === TEMPLATE_SCHEMA_VERSION && data.templates) {
    return data.templates
  }
  return {}
}

/**
 * Read failure counters for all templates.
 * @returns {Promise<Record<string, number>>}
 */
export async function getFailuresStore() {
  const result = await getRawStorage([TEMPLATE_FAILURES_KEY])
  return result[TEMPLATE_FAILURES_KEY] || {}
}

/**
 * Get a specific template by ID, including its active prompt and failure status.
 *
 * @param {string} id - Template ID
 * @returns {Promise<object|null>}
 */
export async function getTemplate(id) {
  const base = DEFAULT_TEMPLATES[id]
  if (!base) return null

  const [customStore, failuresStore] = await Promise.all([
    getTemplatesStore(),
    getFailuresStore(),
  ])

  const customEntry = customStore[id]
  const isCustom = Boolean(customEntry && customEntry.customPrompt)
  const failureCount = failuresStore[id] || 0
  const isFallbackActive = isCustom && failureCount >= CONSECUTIVE_FAILURE_THRESHOLD

  return {
    ...base,
    isCustom,
    updatedAt: customEntry?.updatedAt || null,
    customPrompt: customEntry?.customPrompt || null,
    // When fallback is active due to >= 3 repeated failures, use defaultPrompt safely
    activePrompt: isFallbackActive
      ? base.defaultPrompt
      : (customEntry?.customPrompt || base.defaultPrompt),
    failureCount,
    isFallbackActive,
  }
}

/**
 * Get all templates with their active state, custom status, and failure counts.
 *
 * @returns {Promise<Array<object>>}
 */
export async function getAllTemplates() {
  const [customStore, failuresStore] = await Promise.all([
    getTemplatesStore(),
    getFailuresStore(),
  ])

  return Object.values(DEFAULT_TEMPLATES).map((base) => {
    const customEntry = customStore[base.id]
    const isCustom = Boolean(customEntry && customEntry.customPrompt)
    const failureCount = failuresStore[base.id] || 0
    const isFallbackActive = isCustom && failureCount >= CONSECUTIVE_FAILURE_THRESHOLD

    return {
      ...base,
      isCustom,
      updatedAt: customEntry?.updatedAt || null,
      customPrompt: customEntry?.customPrompt || null,
      activePrompt: isFallbackActive
        ? base.defaultPrompt
        : (customEntry?.customPrompt || base.defaultPrompt),
      failureCount,
      isFallbackActive,
    }
  })
}

/**
 * Save a custom template. Validates required placeholder variables before saving.
 * Automatically clears failure counters on save.
 *
 * @param {string} id - Template ID
 * @param {string} promptText - The customized prompt text
 * @returns {Promise<{ success: boolean, errors?: string[] }>}
 */
export async function saveCustomTemplate(id, promptText) {
  const base = DEFAULT_TEMPLATES[id]
  if (!base) {
    return { success: false, errors: [`Unknown template ID: "${id}"`] }
  }

  const validation = validateTemplate(promptText, base.requiredVariables)
  if (!validation.isValid) {
    return { success: false, errors: validation.errors }
  }

  const customStore = await getTemplatesStore()
  customStore[id] = {
    customPrompt: promptText.trim(),
    updatedAt: Date.now(),
  }

  await setRawStorage({
    [TEMPLATES_STORAGE_KEY]: {
      version: TEMPLATE_SCHEMA_VERSION,
      templates: customStore,
    },
  })

  // Clear failure count upon editing/saving a template
  await clearTemplateFailures(id)

  return { success: true }
}

/**
 * Reset a single template back to its default prompt.
 *
 * @param {string} id - Template ID
 * @returns {Promise<boolean>}
 */
export async function resetTemplate(id) {
  const customStore = await getTemplatesStore()
  if (customStore[id]) {
    delete customStore[id]
    await setRawStorage({
      [TEMPLATES_STORAGE_KEY]: {
        version: TEMPLATE_SCHEMA_VERSION,
        templates: customStore,
      },
    })
  }

  await clearTemplateFailures(id)
  return true
}

/**
 * Reset all templates to defaults.
 *
 * @returns {Promise<boolean>}
 */
export async function resetAllTemplates() {
  await setRawStorage({
    [TEMPLATES_STORAGE_KEY]: {
      version: TEMPLATE_SCHEMA_VERSION,
      templates: {},
    },
    [TEMPLATE_FAILURES_KEY]: {},
  })
  return true
}

// ─── Failure Tracking & Safe Fallback ──────────────────────────────────────────

/**
 * Record a failure for a template. If failureCount reaches 3, safe fallback triggers.
 *
 * @param {string} id - Template ID
 * @returns {Promise<number>} Updated failure count
 */
export async function recordTemplateFailure(id) {
  if (!DEFAULT_TEMPLATES[id]) return 0

  const failures = await getFailuresStore()
  failures[id] = (failures[id] || 0) + 1

  await setRawStorage({ [TEMPLATE_FAILURES_KEY]: failures })
  return failures[id]
}

/**
 * Record a successful execution for a template, resetting its failure counter to 0.
 *
 * @param {string} id - Template ID
 */
export async function recordTemplateSuccess(id) {
  const failures = await getFailuresStore()
  if (failures[id]) {
    failures[id] = 0
    await setRawStorage({ [TEMPLATE_FAILURES_KEY]: failures })
  }
}

/**
 * Clear the failure count for a specific template.
 *
 * @param {string} id - Template ID
 */
export async function clearTemplateFailures(id) {
  const failures = await getFailuresStore()
  if (failures[id] !== undefined) {
    delete failures[id]
    await setRawStorage({ [TEMPLATE_FAILURES_KEY]: failures })
  }
}

/**
 * Get all template IDs that currently have repeated failures (>= 3).
 *
 * @returns {Promise<Array<string>>} List of template IDs with repeated failures
 */
export async function getFailedTemplates() {
  const failures = await getFailuresStore()
  const customStore = await getTemplatesStore()

  return Object.keys(failures).filter(
    (id) => Boolean(customStore[id]) && failures[id] >= CONSECUTIVE_FAILURE_THRESHOLD
  )
}
