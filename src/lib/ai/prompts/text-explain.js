// Pixly Phase 1 — Text Explanation Prompt

/**
 * Build a prompt for explaining selected text
 * @param {string} text - The selected text from the page
 * @param {string|null} pageUrl - Optional page URL for context
 * @param {string|null} pageTitle - Optional page title for context
 * @returns {object} Prompt object with system and messages
 */
export function buildTextExplainPrompt(text, pageUrl = null, pageTitle = null) {
  let contextNote = ''
  if (pageUrl || pageTitle) {
    contextNote = `\n\nContext: This text was found on "${pageTitle || 'a webpage'}" (${pageUrl || ''}).`
  }

  return {
    system: `You are Pixly, an expert design and content analyst. When a user shares selected text from a webpage, you provide a clear, concise explanation of what it is and what it does.

Your response should include:
1. **What it is** — A brief identification (e.g., a headline, a button label, a navigation item, body copy, etc.)
2. **Purpose** — What role this text plays in the UI or content
3. **Design insight** — A brief note on why this text was likely chosen (tone, clarity, CTA effectiveness, etc.)

Keep responses under 150 words. Use markdown formatting. Be direct and helpful.`,

    messages: [
      {
        role: 'user',
        content: `Here is the selected text from a webpage:${contextNote}\n\n---\n${text}\n---`,
      },
    ],
  }
}
