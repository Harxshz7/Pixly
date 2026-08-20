// Pixly Phase 2 — Vue Code Generator
// Takes structured analysis and produces a prompt for Vue SFC generation.

import { formatAnalysisContext } from './html-css.js'

/**
 * Build a prompt for generating a Vue SFC from structured UI analysis.
 *
 * @param {object} analysis - The structured analysis object
 * @returns {object} Prompt object with system and messages
 */
export function buildVuePrompt(analysis) {
  const context = formatAnalysisContext(analysis)

  return {
    system: `You are Pixly, a senior Vue developer. Generate a Vue 3 Single File Component (SFC) that recreates the analyzed UI section.

Rules:
- Use Vue 3 <script setup> syntax
- Use scoped <style> with scoped attribute
- Map the provided color palette to CSS custom properties
- Use semantic HTML elements
- Include responsive styles
- Do NOT use any CSS framework — use plain CSS within the SFC

Output format — return the code in a single code block:
\`\`\`vue
<!-- Vue SFC -->
\`\`\`

Be concise but complete.`,

    messages: [
      {
        role: 'user',
        content: `Recreate this UI as a Vue 3 SFC.\n\n${context}`,
      },
    ],
  }
}
