// Pixly Phase 2 — HTML+CSS Code Generator
// Takes structured analysis and produces a prompt for clean HTML/CSS generation.

/**
 * Build a prompt for generating HTML+CSS from structured UI analysis.
 *
 * @param {object} analysis - The structured analysis object
 * @returns {object} Prompt object with system and messages
 */
export function buildHtmlCssPrompt(analysis) {
  const context = formatAnalysisContext(analysis)

  return {
    system: `You are Pixly, a senior frontend developer. Generate clean, semantic HTML and CSS that recreates the analyzed UI section.

Rules:
- Output semantic HTML5 with modern CSS (flexbox/grid, CSS custom properties)
- Use clean, readable class names
- Include responsive considerations
- Match the visual design as closely as possible
- Add brief inline comments for non-obvious styling
- Do NOT use any CSS framework — pure HTML + CSS only
- Use the provided color palette and design tokens directly

Output format — return BOTH code blocks exactly:
\`\`\`html
<!-- HTML -->
\`\`\`

\`\`\`css
/* CSS */
\`\`\`

Be concise but complete. Focus on accuracy.`,

    messages: [
      {
        role: 'user',
        content: `Recreate this UI in HTML and CSS.\n\n${context}`,
      },
    ],
  }
}

/**
 * Format the analysis object into a readable context string for the prompt.
 * Exported for reuse by other generators.
 */
export function formatAnalysisContext(analysis) {
  const parts = []

  if (analysis.style) {
    parts.push(`Style: ${analysis.style.type}${analysis.style.description ? ` — ${analysis.style.description}` : ''}`)
  }

  if (analysis.colors?.length) {
    const swatches = analysis.colors.map((c) => c.hex).join(', ')
    parts.push(`Color palette: ${swatches}`)
  }

  if (analysis.typography) {
    const fam = analysis.typography.families?.join(', ') || 'unknown'
    parts.push(`Typography: ${fam}`)
    if (analysis.typography.hierarchy) {
      for (const [level, info] of Object.entries(analysis.typography.hierarchy)) {
        parts.push(`  ${level}: ${info.approximateSize || '?'} / ${info.weight || '?'}`)
      }
    }
  }

  if (analysis.tokens) {
    if (analysis.tokens.spacing?.scale) {
      parts.push(`Spacing scale: ${analysis.tokens.spacing.scale.join(', ')}px`)
    }
    if (analysis.tokens.radius?.values) {
      parts.push(`Border radius: ${analysis.tokens.radius.values.join(', ')}px`)
    }
    if (analysis.tokens.shadows?.length) {
      const shadows = analysis.tokens.shadows.map((s) => s.definition).join('; ')
      parts.push(`Shadows: ${shadows}`)
    }
  }

  if (analysis.components?.length) {
    parts.push('Components:')
    for (const comp of analysis.components) {
      parts.push(`  - ${comp.name} (${comp.type}) at ${comp.position || 'unknown'}${comp.description ? `: ${comp.description}` : ''}`)
    }
  }

  return parts.join('\n')
}
