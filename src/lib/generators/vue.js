// Pixly Phase 2 — Vue Code Generator
// Takes structured analysis and produces Vue SFC code or prompt template.

import { getVuePrompt } from '../ai/prompts/codegen-prompts.js'

/**
 * Build a prompt object for Vue SFC generation.
 *
 * @param {object} analysis - The structured analysis object
 * @returns {object} Prompt object with system and messages
 */
export function buildVuePrompt(analysis) {
  return getVuePrompt(analysis)
}

/**
 * Primary generator function for Vue 3 SFC.
 * Takes structured analysis object and returns generated code as a string (via AI runner if provided).
 *
 * @param {object} analysis - The structured analysis object
 * @param {object} [options] - Optional execution options / AI runner override
 * @returns {Promise<string>|object} Generated code string or prompt object
 */
export async function generateVue(analysis, options = {}) {
  if (options.aiRunner && typeof options.aiRunner === 'function') {
    const prompt = getVuePrompt(analysis)
    return await options.aiRunner(prompt)
  }
  return getVuePrompt(analysis)
}

export default generateVue
