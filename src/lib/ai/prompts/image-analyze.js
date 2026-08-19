// Pixly Phase 1 — Image Analysis Prompt

/**
 * Build a prompt for analyzing an image (right-click context menu)
 * @param {string|null} imageUrl - The URL of the image being analyzed
 * @param {string|null} altText - Alt text if available
 * @returns {object} Prompt object with system and messages
 */
export function buildImageAnalyzePrompt(imageUrl = null, altText = null) {
  let imageContext = ''
  if (imageUrl) {
    imageContext += `\nImage URL: ${imageUrl}`
  }
  if (altText) {
    imageContext += `\nAlt text: "${altText}"`
  }

  return {
    system: `You are Pixly, an expert UI/UX and image analyst. The user has shared an image from a webpage for analysis.

Your response should include:
1. **Description** — What the image shows (2-3 sentences)
2. **Purpose** — How this image is likely used in the UI (illustration, icon, product photo, background, etc.)
3. **Design notes** — Color palette impression, style, quality assessment
4. **Suggested prompts** — 2-3 AI image generation prompts that could recreate a similar image

Keep responses under 200 words. Use markdown formatting. Be specific and helpful.

If you are given a screenshot with UI elements, describe the layout, components, and design patterns visible.`,

    messages: [
      {
        role: 'user',
        content: `Please analyze this image from a webpage.${imageContext}\n\nProvide a thorough analysis covering what the image shows, its purpose, design characteristics, and recreation prompts.`,
      },
    ],
  }
}

/**
 * Build a prompt for analyzing a captured screenshot (draw box feature)
 * @param {string} description - Any context about what area was captured
 * @returns {object} Prompt object with system and messages
 */
export function buildScreenshotAnalyzePrompt(description = '') {
  const contextNote = description
    ? `\nAdditional context: ${description}`
    : ''

  return {
    system: `You are Pixly, an expert UI/UX designer and frontend developer. The user has captured a screenshot of a specific area of a webpage.

Analyze the captured UI section and provide:
1. **Component identification** — What UI components are visible (buttons, cards, forms, navbars, etc.)
2. **Layout description** — How elements are arranged (flexbox, grid, spacing, alignment)
3. **Visual design** — Colors, typography, borders, shadows, rounded corners, etc.
4. **Recreation guide** — Step-by-step description of how to recreate this UI section

Keep responses concise but thorough. Use markdown formatting. Be specific about spacing, colors, and layout when possible.`,

    messages: [
      {
        role: 'user',
        content: `Please analyze this screenshot of a webpage section.${contextNote}\n\nProvide a detailed breakdown of the UI components, layout, visual design, and how to recreate it.`,
      },
    ],
  }
}
