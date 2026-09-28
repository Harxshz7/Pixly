# Pixly 🎨⚡

> **AI-Powered Design Analyst & Multi-Framework Code Generator for Chrome**

Pixly is a modern Manifest V3 Chrome Extension that turns any webpage design element into clean, production-ready code. Select text, capture images, or draw a box around any UI section on any webpage to instantly extract design tokens, color palettes, typography hierarchies, and framework-specific code (React + Tailwind, HTML5/CSS, Vue 3, Flutter).

---

## ✨ Features

- **📦 Draw-Box Visual Capture:** Select any UI section (cards, buttons, navbars, forms, hero sections) on any webpage to analyze structure, layout, typography, and spacing scales.
- **⚡ Multi-Framework Code Generation:**
  - **React + Tailwind CSS:** Clean JSX functional components with strict Tailwind v3 utility classes.
  - **HTML5 & Modern CSS:** Semantic markup and `:root` CSS custom property design tokens.
  - **Vue 3 SFC:** Composition API with `<script setup>`, `<template>`, and `<style scoped>`.
  - **Flutter / Dart:** Idiomatic Material widget trees (`StatelessWidget`/`StatefulWidget`).
- **🔄 Zero-Cost Format Switching:** Switch between code generation targets without re-analyzing the captured image (cached vision analysis context).
- **🛡️ Syntax Validation & Safe Fallback:** Built-in bracket/tag balancing pass before rendering, with raw fallback and one-click retry for malformed outputs.
- **🎨 Design Tokens & Palette Extraction:** Color hex codes with role mappings, typography hierarchy, border radiuses, and shadow definitions.
- **✨ Design Variations:** Instantly generate alternative style variations (Dark Mode, Minimalist, Glassmorphism, High Contrast) for captured components.
- **📂 Local History & Snippet Management:** Auto-saves history locally with search filtering, pin-to-top favorites, and one-click Markdown report export.
- **🛠️ Custom System Prompt Templates:** Full CRUD editor for system prompts with template variable validation (`{{selection}}`, `{{image}}`, `{{context}}`) and automated safe fallback on repeated errors.
- **🔒 Privacy First & Local-Only:** BYOK (Bring Your Own Key). API keys and history never leave your machine; direct client-to-API requests to Anthropic or OpenAI only.

---

## 🏗️ Architecture & Project Structure

```
Pixly/
├── src/
│   ├── background/
│   │   └── service-worker.js         # MV3 Background service worker (streaming AI, handlers)
│   ├── content/
│   │   ├── box-capture.js            # Interactive region selection overlay
│   │   ├── text-highlighter.js       # Text selection floating action trigger
│   │   └── styles.css                # Content script styling
│   ├── lib/
│   │   ├── ai/                       # AI client, prompt templates, and validators
│   │   ├── analysis/                 # Color, typography, and token extractors
│   │   ├── generators/               # React, HTML/CSS, Vue, and Flutter generators
│   │   ├── storage/                  # Settings, history, and template storage adapters
│   │   ├── telemetry/                # Local circular buffer event log (0 telemetry servers)
│   │   └── utils/                    # Highlighters, clipboard, and messaging helpers
│   ├── sidepanel/
│   │   ├── App.jsx                   # Side panel root component
│   │   ├── components/               # UI components (ResultView, CodeBlock, FormatSelector, etc.)
│   │   └── styles/                   # Modern dark/light glassmorphic styling
│   └── options/                      # Settings & Prompt Template Management page
├── tests/                            # Node.js built-in test runner test suites
├── manifest.json                     # Chrome Manifest V3 configuration
├── vite.config.js                    # Multi-target Vite extension bundler
├── PRIVACY.md                        # Privacy policy & data surface documentation
└── STORE_LISTING.md                  # Chrome Web Store metadata & permission justifications
```

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
- Node.js (v18 or later)
- Google Chrome or any Chromium-based browser

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Harxshz7/Pixly.git
cd Pixly
npm install
```

### 3. Running Tests
Run the comprehensive unit test suite:
```bash
npm test
```

### 4. Build Extension
Compile the extension bundle into the `dist/` directory:
```bash
npm run build
```
*(For auto-rebuilding during development, use `npm run dev`)*

### 5. Load in Chrome
1. Navigate to `chrome://extensions` in your browser.
2. Enable **Developer mode** (toggle in top-right corner).
3. Click **Load unpacked** and select the `dist/` folder inside the Pixly project directory.

---

## ⚙️ Configuration & Setup

1. Click the Pixly extension icon in your Chrome toolbar or right-click and choose **Options**.
2. Under **AI Provider & Model**, select your preferred provider:
   - **Anthropic:** Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
   - **OpenAI:** GPT-4o, GPT-4o-mini, GPT-4 Turbo
3. Enter your API Key and click **Save Settings**.

> **Note:** API keys are stored in encrypted browser local storage (`chrome.storage.local`) and are only sent directly over HTTPS to the selected provider.

---

## 📖 How to Use

| Mode | How to Trigger | Description |
|---|---|---|
| **Draw-Box Capture** | Press `Ctrl+Shift+X` (Mac: `Cmd+Shift+X`) | Click and drag over any UI section to capture and generate framework code. |
| **Image Analysis** | Right-click any image → *"Analyze with Pixly"* | Extracts color palette, design style, and generates recreation code. |
| **Text Explanation** | Highlight text → Click the floating *"Explain"* button | Explains UX copy, typography, or design terminology. |
| **Side Panel** | Press `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) | Opens the main Pixly workbench and history drawer. |

---

## ⌨️ Keyboard Shortcuts

| Command | Windows / Linux | macOS | Description |
|---|---|---|---|
| **Draw Box Capture** | `Ctrl + Shift + X` | `Cmd + Shift + X` | Activate screen selection tool |
| **Toggle Side Panel** | `Ctrl + Shift + P` | `Cmd + Shift + P` | Open / focus Pixly side panel |

---

## 🛠️ Custom Prompt Templates

Pixly allows full customization of AI system prompts in **Options → Prompt Templates**:
- Customize prompts for Text Explanation, Image Analysis, UI Recreation, React+Tailwind, HTML+CSS, Vue, and Flutter.
- Real-time syntax checking ensures necessary placeholder variables (e.g. `{{context}}`, `{{selection}}`, `{{image}}`) are preserved.
- **Safe Fallback:** If a custom template fails repeatedly, Pixly automatically falls back to hardened default prompts to ensure uninterrupted workflow.

---

## 🔒 Privacy & Permissions

Pixly is built with a strict **privacy-first, zero-telemetry** architecture:
- No tracking servers, remote logging, or analytics.
- History and preferences are stored 100% on-device in `chrome.storage.local`.
- Permissions used: `activeTab` (for box capture), `storage` (local settings/history), `contextMenus` (right-click actions), `sidePanel` (workbench view), and `downloads` (Markdown export).

For the complete privacy disclosure, see [PRIVACY.md](PRIVACY.md).

---

## 🗺️ Roadmap & Progress

- [x] **Phase 1: Core Engine** — Text/image/box capture, streaming AI client, side panel UI, keyboard shortcuts.
- [x] **Phase 2: Multi-Framework Codegen** — React+Tailwind, HTML5/CSS, Vue 3, Flutter generators, prompt hardening, code validation & highlighter.
- [x] **Phase 3: History & Workflows** — Auto-save history, favorites pinning, search filtering, Markdown report export, design variations.
- [x] **Phase 4a: Robustness & Polish** — Classified error taxonomy, skeleton loaders, permissions audit, privacy documentation.
- [x] **Phase 4b: Template System** — Custom prompt template CRUD editor, variable validation, safe fallback recovery.
- [x] **Store Readiness (v1.2.0)** — Chrome Web Store listing metadata ([STORE_LISTING.md](STORE_LISTING.md)), privacy policy ([PRIVACY.md](PRIVACY.md)), production zip build.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
