// Pixly Phase 2 — Flutter Code Generator
// Takes structured analysis and produces a prompt for Flutter/Dart widget generation.

import { formatAnalysisContext } from './html-css.js'

/**
 * Build a prompt for generating a Flutter widget from structured UI analysis.
 *
 * @param {object} analysis - The structured analysis object
 * @returns {object} Prompt object with system and messages
 */
export function buildFlutterPrompt(analysis) {
  const context = formatAnalysisContext(analysis)

  return {
    system: `You are Pixly, a senior Flutter developer. Generate a Flutter/Dart widget that recreates the analyzed UI section.

Rules:
- Use a StatelessWidget with a build method
- Use Material widgets (Container, Column, Row, Text, etc.)
- Map the provided color palette to Color constants
- Use the spacing scale for EdgeInsets and SizedBox values
- Use the border radius values for BorderRadius
- Include the shadow definitions via BoxShadow
- Use appropriate TextTheme for typography
- Do NOT use external packages — only flutter/material.dart

Output format — return the code in a single code block:
\`\`\`dart
// Flutter widget
\`\`\`

Be concise but complete.`,

    messages: [
      {
        role: 'user',
        content: `Recreate this UI as a Flutter widget.\n\n${context}`,
      },
    ],
  }
}
