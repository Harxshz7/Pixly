// Pixly Phase 2 — React + Tailwind Code Generator
// Takes structured analysis and produces a prompt for React + Tailwind generation.

import { formatAnalysisContext } from './html-css.js'

/**
 * Build a prompt for generating React + Tailwind from structured UI analysis.
 *
 * @param {object} analysis - The structured analysis object
 * @returns {object} Prompt object with system and messages
 */
export function buildReactTailwindPrompt(analysis) {
  const context = formatAnalysisContext(analysis)

  return {
    system: `You are Pixly, a senior React developer. Generate a React component using Tailwind CSS that recreates the analyzed UI section.

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

    messages: [
      {
        role: 'user',
        content: `Recreate this UI as a React + Tailwind component.\n\n${context}`,
      },
    ],
  }
}
