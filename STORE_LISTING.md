# Pixly — Chrome Web Store Listing & Submission Specification

## 1. Store Listing Metadata

- **Extension Name:** Pixly — AI Design Analyst & Code Generator
- **Short Description (122 / 132 chars max):**
  `Analyze webpage UI elements and instantly generate clean code in React, Tailwind CSS, HTML/CSS, Vue 3, and Flutter with AI.`
- **Category Selection:** Developer Tools
- **Version:** 1.2.0
- **Primary Language:** English
- **Pricing & Distribution:** Free (BYOK — Bring Your Own Key for Anthropic Claude or OpenAI GPT)
- **Manifest Specification:** Manifest V3
- **Public Privacy Policy URL:** `https://raw.githubusercontent.com/Harxshz7/Pixly/main/PRIVACY_POLICY.md`
- **Support & Issues URL:** `https://github.com/Harxshz7/Pixly/issues`

---

## 2. Store Listing Description

```markdown
Turn any live web design into clean, production-grade frontend code with AI.

Pixly is a specialized developer companion engineered for frontend developers, UI/UX engineers, and design system architects. Select text, inspect image assets, or draw a bounding box around any live UI component to instantly extract visual design tokens, typography metrics, color palettes with WCAG contrast ratings, and production-ready framework code.

🚀 Key Capabilities:

• 📦 Hardware-Accelerated Bounding Box Capture: Draw a box around buttons, cards, forms, navigation bars, or hero sections to extract layout geometry, spacing scales, border radiuses, and shadow definitions.
• 🎨 Deterministic Palette & WCAG Analysis: Extracts color hex codes with semantic role mappings and computes automated WCAG 2.1 contrast ratios (AAA/AA pass status).
• ⚡ Multi-Target Framework Code Synthesis:
  - React 18 + Tailwind CSS v3 (modular JSX components with canonical utility classes)
  - Semantic HTML5 + Modern CSS (:root design tokens and modern flex/grid layouts)
  - Vue 3 SFC (Composition API with <script setup> and scoped styles)
  - Flutter Material 3 (Idiomatic Dart widget trees with structured layout constraints)
• 🔄 Zero-Cost Format Switching: Switch between React, Vue, HTML, and Flutter instantaneously from cached vision ASTs without re-querying the AI provider.
• 🛡️ Syntax Validation & Resilient Rendering: Built-in bracket and tag balancing parser prevents broken UI rendering, backed by raw fallback buffers and one-click structured retry.
• ✨ Instant Style Variations: Generate alternative design variants (Dark Mode, Minimalist, Glassmorphic, High Contrast) in one click.
• 🛠️ Customizable System Prompt Engine: Edit system prompts for every analysis mode with real-time variable validation ({{selection}}, {{image}}, {{context}}) and automatic safe fallback protection.
• 📂 Local History, Pinning & Markdown Export: Auto-saves analysis records locally with instant search, pinned favorites, and one-click export to structured Markdown (.md) reports.
• 🔒 100% Local-First & Zero-Telemetry: Your API keys, code snippets, and history never leave your machine. No telemetry servers, no third-party trackers, no middleman gateways. Direct TLS 1.3 calls to Anthropic or OpenAI only.

⌨️ Keyboard Shortcuts:
• Ctrl + Shift + X (Cmd + Shift + X on Mac) — Activate draw-box capture tool
• Ctrl + Shift + P (Cmd + Shift + P on Mac) — Toggle Pixly side panel

🔑 Bring Your Own Key (BYOK):
Pixly connects directly to your chosen AI provider without intermediaries:
- Anthropic Claude (claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus)
- OpenAI GPT (gpt-4o, gpt-4o-mini, gpt-4-turbo)

API keys are securely stored in sandboxed browser storage (chrome.storage.local) and sent directly to Anthropic/OpenAI via encrypted HTTPS headers.
```

---

## 3. Single-Purpose Compliance Statement

> "Pixly serves a single, dedicated purpose: analyzing webpage visual design elements and generating corresponding frontend code and style tokens using user-provided AI models."

---

## 4. Permissions Justification (For Chrome Web Store Developer Console)

Copy and paste these exact one-line justifications into the Chrome Web Store Developer Dashboard:

| Permission | Reviewer Justification |
|---|---|
| `activeTab` | Required to capture the visible screen area when the user draws a selection box around a webpage UI element. |
| `storage` | Required to save user preferences, API keys, custom prompt templates, and analysis history locally on the user's device. |
| `contextMenus` | Provides right-click context menu options to analyze selected text or right-clicked images directly from any webpage. |
| `sidePanel` | Displays the design analysis workbench, token inspector, and code generator in Chrome's side panel alongside the webpage. |
| `downloads` | Enables users to export and save their design analysis reports and generated code snippets as Markdown (.md) files. |

### Host Permissions Justification:
- `https://api.anthropic.com/*` — Required for direct, client-side HTTPS API requests to Anthropic Claude when the user selects Anthropic models.
- `https://api.openai.com/*` — Required for direct, client-side HTTPS API requests to OpenAI GPT when the user selects OpenAI models.

---

## 5. Security & Data Handling Compliance

- **No Remote Telemetry:** Pixly sends zero analytics, telemetry, or diagnostic tracking data to Pixly developers or any third parties.
- **Local Diagnostic Event-Log:** Local event counters reside exclusively in `chrome.storage.local` to enable local recovery and are never transmitted off-device.
- **User Right to Erasure:** Full history and cached tokens can be purged at any time from the side panel or by uninstalling the extension.
- **Public Policy Document:** Hosted at `https://raw.githubusercontent.com/Harxshz7/Pixly/main/PRIVACY_POLICY.md`.
