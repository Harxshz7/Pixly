// Pixly Phase 2 — Flutter Code Generator
// Takes structured analysis and produces Flutter widget code or prompt template.

import { getFlutterPrompt } from '../ai/prompts/codegen-prompts.js'

/**
 * Build a prompt object for Flutter generation.
 *
 * @param {object} analysis - The structured analysis object
 * @returns {object} Prompt object with system and messages
 */
export function buildFlutterPrompt(analysis) {
  return getFlutterPrompt(analysis)
}

/**
 * Primary generator function for Flutter/Dart.
 * Takes structured analysis object and returns generated code as a string (via AI runner if provided).
 *
 * @param {object} analysis - The structured analysis object
 * @param {object} [options] - Optional execution options / AI runner override
 * @returns {Promise<string>|object} Generated code string or prompt object
 */
export async function generateFlutter(analysis, options = {}) {
  if (options.aiRunner && typeof options.aiRunner === 'function') {
    const prompt = getFlutterPrompt(analysis)
    return await options.aiRunner(prompt)
  }
  return getFlutterPrompt(analysis)
}

export default generateFlutter
