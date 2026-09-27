import test from 'node:test'
import assert from 'node:assert/strict'

import {
  formatAnalysisContext,
  getReactTailwindPrompt,
  getHtmlCssPrompt,
  getVuePrompt,
  getFlutterPrompt,
} from '../src/lib/ai/prompts/codegen-prompts.js'

import { generateReactTailwind } from '../src/lib/generators/react-tailwind.js'
import { generateHtmlCss } from '../src/lib/generators/html-css.js'
import { generateVue } from '../src/lib/generators/vue.js'
import { generateFlutter } from '../src/lib/generators/flutter.js'

import { validateGeneratedCode, parseCodeBlocks } from '../src/lib/utils/code-validator.js'

const sampleAnalysis = {
  style: { type: 'Glassmorphism', confidence: 'high', description: 'Translucent card' },
  theme: { mode: 'dark' },
  colors: [
    { hex: '#0f172a', role: 'background' },
    { hex: '#38bdf8', role: 'primary' },
  ],
  typography: {
    families: ['Inter', 'sans-serif'],
    hierarchy: {
      heading: { approximateSize: '24px', weight: 'bold' },
      body: { approximateSize: '14px', weight: 'regular' },
    },
  },
  tokens: {
    spacing: { scale: [4, 8, 16, 24] },
    radius: { values: [8, 16] },
    shadows: [{ definition: '0 4px 12px rgba(0,0,0,0.2)' }],
  },
  components: [
    { name: 'Card Container', type: 'container', position: 'center', description: 'Glass card' },
    { name: 'Submit Button', type: 'button', position: 'bottom', description: 'Primary action button' },
  ],
}

test('codegen-prompts: formats analysis context string correctly', () => {
  const context = formatAnalysisContext(sampleAnalysis)
  assert.ok(context.includes('Glassmorphism'))
  assert.ok(context.includes('dark'))
  assert.ok(context.includes('#0f172a'))
  assert.ok(context.includes('Inter'))
  assert.ok(context.includes('Card Container'))
})

test('generators: each framework generator accepts structured analysis and creates tuned prompts', async () => {
  const reactPrompt = getReactTailwindPrompt(sampleAnalysis)
  assert.ok(reactPrompt.system.includes('Tailwind'))
  assert.ok(reactPrompt.messages[0].content.includes('#38bdf8'))

  const htmlPrompt = getHtmlCssPrompt(sampleAnalysis)
  assert.ok(htmlPrompt.system.includes('HTML5'))
  assert.ok(htmlPrompt.system.includes('CSS custom properties'))

  const vuePrompt = getVuePrompt(sampleAnalysis)
  assert.ok(vuePrompt.system.includes('Vue 3'))
  assert.ok(vuePrompt.system.includes('<script setup>'))

  const flutterPrompt = getFlutterPrompt(sampleAnalysis)
  assert.ok(flutterPrompt.system.includes('Flutter'))
  assert.ok(flutterPrompt.system.includes('package:flutter/material.dart'))

  // Verify generator functions return prompt objects when no AI runner passed
  const reactRes = await generateReactTailwind(sampleAnalysis)
  assert.ok(reactRes.system)

  const htmlRes = await generateHtmlCss(sampleAnalysis)
  assert.ok(htmlRes.system)

  const vueRes = await generateVue(sampleAnalysis)
  assert.ok(vueRes.system)

  const flutterRes = await generateFlutter(sampleAnalysis)
  assert.ok(flutterRes.system)
})

test('code-validator: validates balanced code and detects syntax errors', () => {
  // Valid React JSX code
  const validReact = `
export default function Component() {
  return (
    <div className="bg-slate-900 p-4 rounded-lg shadow-lg">
      <h1 className="text-xl font-bold text-sky-400">Title</h1>
      <button className="bg-sky-500 text-white px-4 py-2 rounded">Click</button>
    </div>
  )
}
  `
  assert.equal(validateGeneratedCode(validReact, 'react-tailwind').isValid, true)

  // Invalid code with unbalanced brackets
  const unbalancedReact = `
export default function Component() {
  return (
    <div className="bg-slate-900">
      <h1>Title</h1>
  )
}
  `
  assert.equal(validateGeneratedCode(unbalancedReact, 'react-tailwind').isValid, false)

  // Unclosed Vue template tag
  const malformedVue = `
<template>
  <div>
    <h1>Unclosed SFC</h1>
</template>
  `
  assert.equal(validateGeneratedCode(malformedVue, 'vue').isValid, false)

  // Valid Vue SFC
  const validVue = `
<template>
  <div className="card">
    <h1>Valid Vue SFC</h1>
  </div>
</template>

<script setup>
// logic
</script>

<style scoped>
.card { color: red; }
</style>
  `
  assert.equal(validateGeneratedCode(validVue, 'vue').isValid, true)
})

test('CodeBlock: parses single and multiple code blocks correctly', () => {
  const multiBlockCode = `
Here is the implementation:

\`\`\`html
<div class="card">
  <h2>Header</h2>
</div>
\`\`\`

\`\`\`css
.card {
  background: #111;
}
\`\`\`
  `

  const blocks = parseCodeBlocks(multiBlockCode, 'html-css')
  assert.equal(blocks.length, 2)
  assert.equal(blocks[0].label, 'HTML')
  assert.equal(blocks[0].code.includes('<div class="card">'), true)
  assert.equal(blocks[1].label, 'CSS')
  assert.equal(blocks[1].code.includes('.card {'), true)

  const singleBlockCode = `
\`\`\`jsx
export default function App() { return <div>Hello</div> }
\`\`\`
  `
  const singleBlocks = parseCodeBlocks(singleBlockCode, 'react-tailwind')
  assert.equal(singleBlocks.length, 1)
  assert.equal(singleBlocks[0].label, 'JSX')
})
