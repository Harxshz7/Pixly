// Pixly Phase 2 — React + Tailwind Code Generator
// Takes structured analysis and produces React + Tailwind code or prompt template.

import { getReactTailwindPrompt } from '../ai/prompts/codegen-prompts.js'

/**
 * Build a prompt object for React + Tailwind generation.
 *
 * @param {object} analysis - The structured analysis object
 * @returns {object} Prompt object with system and messages
 */
export function buildReactTailwindPrompt(analysis) {
  return getReactTailwindPrompt(analysis)
}

/**
 * Primary generator function for React + Tailwind.
 * Takes structured analysis object and returns generated code as a string (via AI runner if provided).
 *
 * @param {object} analysis - The structured analysis object
 * @param {object} [options] - Optional execution options / AI runner override
 * @returns {Promise<string>|object} Generated code string or prompt object
 */
export async function generateReactTailwind(analysis, options = {}) {
  if (options.aiRunner && typeof options.aiRunner === 'function') {
    const prompt = getReactTailwindPrompt(analysis)
    return await options.aiRunner(prompt)
  }
  // If no runner passed, return prompt for callAI execution
  return getReactTailwindPrompt(analysis)
}

export default generateReactTailwind
