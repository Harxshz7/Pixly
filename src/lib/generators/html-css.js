// Pixly Phase 2 — HTML + CSS Code Generator
// Takes structured analysis and produces HTML + CSS code or prompt template.

import {
  getHtmlCssPrompt,
  formatAnalysisContext as formatContext,
} from '../ai/prompts/codegen-prompts.js'

export const formatAnalysisContext = formatContext

/**
 * Build a prompt object for HTML + CSS generation.
 *
 * @param {object} analysis - The structured analysis object
 * @returns {object} Prompt object with system and messages
 */
export function buildHtmlCssPrompt(analysis) {
  return getHtmlCssPrompt(analysis)
}

/**
 * Primary generator function for HTML + CSS.
 * Takes structured analysis object and returns generated code as a string (via AI runner if provided).
 *
 * @param {object} analysis - The structured analysis object
 * @param {object} [options] - Optional execution options / AI runner override
 * @returns {Promise<string>|object} Generated code string or prompt object
 */
export async function generateHtmlCss(analysis, options = {}) {
  if (options.aiRunner && typeof options.aiRunner === 'function') {
    const prompt = getHtmlCssPrompt(analysis)
    return await options.aiRunner(prompt)
  }
  return getHtmlCssPrompt(analysis)
}

export default generateHtmlCss
