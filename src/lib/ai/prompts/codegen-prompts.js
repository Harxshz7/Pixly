// Pixly Phase 2 — Codegen Prompts
// Framework-tuned prompt templates to reduce common code generation failure modes.

/**
 * Format the structured analysis object into a comprehensive prompt context.
 *
 * @param {object} analysis - The structured analysis object
 * @returns {string} Formatted context string
 */
export function formatAnalysisContext(analysis) {
  if (!analysis) return 'No UI analysis available.'
  const parts = []

  if (analysis.style) {
    parts.push(`Design Style: ${analysis.style.type}${analysis.style.description ? ` (${analysis.style.description})` : ''}`)
  }

  if (analysis.theme) {
    parts.push(`Theme Mode: ${analysis.theme.mode || 'light'}`)
  }

  if (analysis.colors?.length) {
    const swatches = analysis.colors.map((c) => `${c.role || 'color'}: ${c.hex}`).join(', ')
    parts.push(`Color Palette: ${swatches}`)
  }

  if (analysis.typography) {
    const fam = analysis.typography.families?.join(', ') || 'sans-serif'
    parts.push(`Typography Families: ${fam}`)
    if (analysis.typography.hierarchy) {
      for (const [level, info] of Object.entries(analysis.typography.hierarchy)) {
        if (info) {
          parts.push(`  ${level}: size ${info.approximateSize || 'normal'}, weight ${info.weight || 'regular'}`)
        }
      }
    }
  }

  if (analysis.tokens) {
    if (analysis.tokens.spacing?.scale?.length) {
      parts.push(`Spacing Scale: ${analysis.tokens.spacing.scale.join(', ')}px`)
    }
    if (analysis.tokens.radius?.values?.length) {
      parts.push(`Border Radius: ${analysis.tokens.radius.values.join(', ')}px`)
    }
    if (analysis.tokens.shadows?.length) {
      const shadows = analysis.tokens.shadows.map((s) => s.definition).filter(Boolean).join('; ')
      if (shadows) parts.push(`Shadow Tokens: ${shadows}`)
    }
  }

  if (analysis.components?.length) {
    parts.push('UI Components Detected:')
    for (const comp of analysis.components) {
      parts.push(`  - ${comp.name} (${comp.type || 'element'}) at ${comp.position || 'layout'}: ${comp.description || ''}`)
    }
  }

  return parts.join('\n')
}

/**
 * Build prompt object for React + Tailwind generator.
 */
export function getReactTailwindPrompt(analysis) {
  const context = formatAnalysisContext(analysis)
  return {
    system: `You are Pixly, a senior React frontend developer. Generate clean, usable, framework-specific React + Tailwind CSS code based on the UI analysis.

Strict Quality Guidelines:
- Return a single default-exported functional component in JSX format.
- Do NOT import React (assume modern JSX transform enabled).
- Use ONLY standard, valid Tailwind CSS v3 utility classes or valid arbitrary value syntax (e.g. bg-[#1e293b], rounded-[12px], shadow-[0_4px_12px_rgba(0,0,0,0.1)]).
- Never hallucinate non-existent utility classes (e.g. do NOT use classes like "font-subheading", "btn-primary", "card-shadow", "flex-center").
- Ensure all JSX tags, parentheses, and curly braces are perfectly balanced and self-closing tags are closed (e.g. <img />, <input />).
- Map the provided color palette, typography hierarchy, border radii, and spacing to appropriate Tailwind classes.
- Use semantic HTML elements (header, main, section, nav, button, input, h1-h6, p).

Output format — return code in a single JSX code block:
\`\`\`jsx
export default function UIComponent() {
  return (
    // Component code
  )
}
\`\`\``,
    messages: [
      {
        role: 'user',
        content: `Generate a production-ready React + Tailwind component for this analyzed UI:\n\n${context}`,
      },
    ],
  }
}

/**
 * Build prompt object for HTML + CSS generator.
 */
export function getHtmlCssPrompt(analysis) {
  const context = formatAnalysisContext(analysis)
  return {
    system: `You are Pixly, a senior frontend developer. Generate clean, semantic HTML5 and modern vanilla CSS that accurately recreates the analyzed UI.

Strict Quality Guidelines:
- Return BOTH clean HTML5 and vanilla CSS code blocks.
- Use semantic HTML tags (header, main, section, nav, button, input, h1-h6, p). Ensure all HTML tags are strictly closed and balanced.
- Do NOT use any external CSS framework — pure HTML5 and modern CSS (flexbox, CSS grid, CSS custom properties).
- Define CSS custom properties in :root for colors, font families, and border radii matching the analysis tokens.
- Ensure selector names are valid and all CSS rules have balanced braces {}.

Output format — return BOTH code blocks exactly as formatted below:
\`\`\`html
<!-- HTML -->
\`\`\`

\`\`\`css
/* CSS */
\`\`\``,
    messages: [
      {
        role: 'user',
        content: `Generate production-ready HTML5 and CSS for this analyzed UI:\n\n${context}`,
      },
    ],
  }
}

/**
 * Build prompt object for Vue 3 SFC generator.
 */
export function getVuePrompt(analysis) {
  const context = formatAnalysisContext(analysis)
  return {
    system: `You are Pixly, a senior Vue.js developer. Generate a clean Vue 3 Single File Component (SFC) based on the analyzed UI.

Strict Quality Guidelines:
- Structure as a standard Vue 3 Single File Component with <template>, <script setup>, and <style scoped> blocks.
- <template> must contain semantic, valid HTML markup with perfectly balanced opening and closing tags.
- <script setup> must contain modern Vue 3 composition API code (import refs/reactive if stateful component, or clean script setup).
- <style scoped> must contain plain CSS scoped specifically to this component, mapping color palette and design tokens to CSS custom properties.
- Do NOT use third-party UI libraries or CSS frameworks — pure Vue 3 + scoped CSS.

Output format — return code in a single vue code block:
\`\`\`vue
<template>
  <!-- Component template -->
</template>

<script setup>
// Component logic
</script>

<style scoped>
/* Scoped styles */
</style>
\`\`\``,
    messages: [
      {
        role: 'user',
        content: `Generate a production-ready Vue 3 SFC for this analyzed UI:\n\n${context}`,
      },
    ],
  }
}

/**
 * Build prompt object for Flutter generator.
 */
export function getFlutterPrompt(analysis) {
  const context = formatAnalysisContext(analysis)
  return {
    system: `You are Pixly, a senior Flutter developer. Generate a clean, idiomatic Flutter/Dart widget tree based on the analyzed UI.

Strict Quality Guidelines:
- Use a StatelessWidget or StatefulWidget named UIComponent.
- Import ONLY 'package:flutter/material.dart' — do not import non-existent or external packages.
- Use standard, valid Flutter Material widgets (Container, Column, Row, Text, SizedBox, Padding, Card, Icon, ElevatedButton, etc.).
- Map colors to Color(0xFF...) hex values from the color palette.
- Map spacing scale to EdgeInsets.all(), EdgeInsets.symmetric(), or SizedBox(height/width).
- Ensure all Dart syntax, widget constructor arguments, parentheses, and brackets are perfectly balanced and valid.

Output format — return code in a single dart code block:
\`\`\`dart
import 'package:flutter/material.dart';

class UIComponent extends StatelessWidget {
  const UIComponent({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
\`\`\``,
    messages: [
      {
        role: 'user',
        content: `Generate a production-ready Flutter widget for this analyzed UI:\n\n${context}`,
      },
    ],
  }
}
