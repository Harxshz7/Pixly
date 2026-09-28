# Pixly — Chrome Web Store Listing & Submission Guide

## 1. Store Metadata

- **Extension Name:** Pixly — AI Design Analyst & Code Generator
- **Short Description (max 132 chars):**
  Capture any webpage element, analyze visual styles, and instantly generate clean code in React, Tailwind, HTML/CSS, Vue, and Flutter.
- **Category:** Developer Tools
- **Version:** 1.2.0
- **Language:** English
- **Pricing:** Free (BYOK — Bring Your Own Key for Anthropic or OpenAI)
- **Manifest Version:** Manifest V3

---

## 2. Store Listing Description

```markdown
Turn any webpage design into clean, production-ready code with AI.

Pixly is the ultimate design-to-code companion for frontend developers, UI/UX designers, and product teams. Select text, capture an image, or draw a box around any UI section on any webpage to instantly extract design tokens, typography, style classifications, and framework-ready code.

### 🚀 Key Features

• 📦 Box Capture & Visual Extraction: Draw a box around any UI component (buttons, cards, navigation, forms, hero sections) to analyze layout, spacing scales, border radiuses, and shadow definitions.
• 🎨 Palette & Theme Extraction: Deterministically extracts color hex codes with contrast data and auto-detects light vs dark modes.
• ⚡ Multi-Framework Code Generation:
  - React + Tailwind CSS (functional components, clean JSX, standard Tailwind v3 utilities)
  - Semantic HTML5 + Modern CSS (:root custom properties and flex/grid layouts)
  - Vue 3 SFC (Composition API, <script setup>, scoped CSS)
  - Flutter (StatelessWidget/StatefulWidget, Material Design)
• 🔄 Zero-Cost Format Switching: Switch between React, Vue, HTML, and Flutter without re-running vision analysis.
• 🛡️ Syntax Validation & Resilient Code Display: Built-in bracket/tag balancing pass before rendering, with raw fallback and one-click retry for malformed outputs.
• ✨ Instant Design Variations: Generate alternative styles (Dark Mode, Minimalist, Glassmorphic, High Contrast) in one click.
• 🛠️ Customizable System Prompt Templates: Customize and fine-tune system prompts for every analysis type with live variable validation ({{selection}}, {{image}}, {{context}}) and automatic safe fallback.
• 📂 History, Favorites & Markdown Export: Auto-saves analysis history locally, pin your favorites to top, search past captures, and export full reports as Markdown (.md).
• 🔒 100% Private & Local-First: Your API keys and history never leave your machine. No telemetry servers, no third-party trackers, no analytics services. Direct HTTPS calls to Anthropic or OpenAI only.

### ⌨️ Keyboard Shortcuts

• Ctrl + Shift + X (Cmd + Shift + X on Mac) — Draw a box to capture and analyze
• Ctrl + Shift + P (Cmd + Shift + P on Mac) — Toggle Pixly side panel

### 🔑 Bring Your Own Key

Pixly connects directly to your chosen AI provider:
- Anthropic Claude (claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus)
- OpenAI GPT (gpt-4o, gpt-4o-mini, gpt-4-turbo)

Keys are securely stored in your local browser storage (`chrome.storage.local`).
```

---

## 3. Permissions Justification (For Chrome Web Store Developer Console)

Copy and paste these justifications directly into the Chrome Web Store Developer Dashboard:

| Permission | One-Line Justification |
|---|---|
| `activeTab` | Required to capture visible webpage regions selected by the user via the draw-box capture tool. |
| `storage` | Required to persist user preferences, API keys, analysis history, and prompt templates locally on the user's device. |
| `contextMenus` | Provides quick right-click context menu shortcuts ("Explain selected text" and "Analyze this image"). |
| `sidePanel` | Displays the Pixly analysis results and code generation workbench in Chrome's side panel alongside the webpage. |
| `downloads` | Allows users to export their structured design analysis and generated code as downloadable `.md` Markdown files. |

### Host Permissions Justification:
- `https://api.anthropic.com/*` — Direct API connection to Anthropic for users who select Claude models.
- `https://api.openai.com/*` — Direct API connection to OpenAI for users who select GPT models.

---

## 4. Single-Purpose Compliance Statement

> "Pixly serves a single, dedicated purpose: analyzing webpage visual design elements and generating corresponding frontend code and style tokens using user-provided AI models."

---

## 5. Privacy Compliance Summary

- Pixly does **NOT** collect browsing history.
- Pixly does **NOT** transmit telemetry or user analytics to any remote server.
- All configuration, history records, and custom templates are stored strictly in `chrome.storage.local`.
- Network calls are strictly made on-demand to the AI provider endpoint chosen and configured by the user.
- See `PRIVACY.md` for full privacy policy text.
