// Pixly Phase 2 — Variations Generator
// Produces 2-3 alternative recreation prompts from structured analysis.

import { formatAnalysisContext } from './html-css.js'

/**
 * Build a prompt for generating 2-3 alternative recreation variations.
 *
 * @param {object} analysis - The structured analysis object
 * @returns {object} Prompt object with system and messages
 */
export function buildVariationsPrompt(analysis) {
  const context = formatAnalysisContext(analysis)

  return {
    system: `You are Pixly, a creative UI/UX designer. Given the structured analysis of a UI section, produce 2-3 alternative recreation prompts. Each variation should approach the design from a different angle.

Return ONLY valid JSON — no markdown, no code fences.

The JSON must match this schema:
{
  "variations": [
    {
      "title": "Short descriptive title",
      "approach": "pixel-accurate|inspired-redesign|simplified|minimalist|bold-color",
      "description": "1-2 sentences explaining the creative direction",
      "prompt": "A detailed prompt that could be given to an AI to generate this variation of the UI"
    }
  ]
}

Include exactly 3 variations:
1. One that is a pixel-accurate clone of the original
2. One that is an inspired-by redesign with a fresh take
3. One that is a simplified/minimalist version

Each prompt should be detailed enough for an AI code generator to produce the UI.`,

    messages: [
      {
        role: 'user',
        content: `Generate 3 alternative recreation variations for this UI.\n\n${context}`,
      },
    ],
  }
}
