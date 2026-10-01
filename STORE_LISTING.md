# Pixly — Chrome Web Store Listing & Submission Guide

## 1. Store Metadata

- **Extension Name:** Pixly — AI Design Analyst & Code Generator
- **Short Description (122 / 132 chars max):**
  `Analyze webpage UI elements and instantly generate clean code in React, Tailwind CSS, HTML/CSS, Vue 3, and Flutter with AI.`
- **Category:** Developer Tools
- **Version:** 1.2.0
- **Language:** English
- **Pricing:** Free (BYOK — Bring Your Own Key for Anthropic Claude or OpenAI GPT)
- **Manifest Version:** Manifest V3
- **Privacy Policy URL:** `https://raw.githubusercontent.com/Harxshz7/Pixly/main/PRIVACY_POLICY.md`
- **Support / Feedback URL:** `https://github.com/Harxshz7/Pixly/issues`

---

## 2. Store Listing Description

```markdown
Turn any webpage design into clean, production-ready frontend code with AI.

Pixly is a developer companion for frontend engineers, UI/UX designers, and product creators. Highlight text, right-click an image, or draw a box around any UI component on any webpage to instantly extract visual design tokens, typography scales, color palettes, and framework-ready code.

🚀 Key Features:

• 📦 Box Capture & Visual Extraction: Draw a box around any UI component (buttons, cards, navigation bars, forms, hero sections) to analyze layout, spacing scales, border radiuses, and shadow definitions.
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

⌨️ Keyboard Shortcuts:
• Ctrl + Shift + X (Cmd + Shift + X on Mac) — Draw a box to capture and analyze
• Ctrl + Shift + P (Cmd + Shift + P on Mac) — Open Pixly side panel

🔑 Bring Your Own Key (BYOK):
Pixly connects directly to your chosen AI provider:
- Anthropic Claude (claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus)
- OpenAI GPT (gpt-4o, gpt-4o-mini, gpt-4-turbo)

Keys are securely stored in your local browser storage (chrome.storage.local) and sent directly to Anthropic/OpenAI via encrypted HTTPS.
```

---

## 3. Single-Purpose Compliance Statement

> "Pixly serves a single, dedicated purpose: analyzing webpage visual design elements and generating corresponding frontend code and style tokens using user-provided AI models."

---

## 4. Permissions Justification (For Chrome Web Store Developer Console)

Copy and paste these exact one-line justifications into the Chrome Web Store Developer Dashboard:

| Permission | One-Line Justification |
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

## 5. Privacy & Data Handling Compliance

- **No Remote Telemetry:** Pixly sends zero analytics, telemetry, or diagnostic tracking data to Pixly developers or any third parties.
- **Local Event-Log:** Local usage event counters are stored entirely on-device in `chrome.storage.local` and never transmitted across the network.
- **Data Erasure:** History and cached data can be wiped at any time directly in the side panel or by uninstalling the extension.
- **Full Privacy Policy:** Available at `https://raw.githubusercontent.com/Harxshz7/Pixly/main/PRIVACY_POLICY.md`.
