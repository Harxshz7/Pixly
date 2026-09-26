# Pixly
AI-powered text, image, and UI analysis directly in your browser.

## Features
- **Text Selection:** Highlight any text for instant AI design and content explanations.
- **Image Analysis:** Right-click images to extract visual characteristics, design tokens, and recreation prompts.
- **Draw-Box UI Capture:** Select screen areas to analyze layout, spacing scales, border radiuses, and shadow definitions.
- **Multi-Framework Code Generation:** Instant code output in React + Tailwind, Semantic HTML5/CSS, Vue 3 SFC, and Flutter widgets with zero-cost format switching.
- **History & Snippets:** Auto-saved local history, favorites pinning, search filter, and one-click Markdown export.
- **Custom Prompt Templates:** Customize system prompts for every analysis type with inline variable validation (`{{selection}}`, `{{image}}`, `{{context}}`) and automatic safe fallback.
- **Privacy First:** 100% local storage via `chrome.storage.local`. No telemetry servers or third-party tracking.

## Installation (Dev)
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Build the extension:
   ```bash
   npm run build
   ```
5. Open `chrome://extensions`
6. Enable **Developer mode**
7. Click **Load unpacked** and select the `dist/` directory

## Setup
1. Open the extension **Options** page.
2. Enter your API key (Anthropic or OpenAI).
*Note: Keys are stored locally via `chrome.storage.local` and never sent to external servers other than the API provider.*

## Usage
- **Text:** Select text on any page → Click the floating "Explain" button.
- **Image:** Right-click any image → Select "Analyze with Pixly" from the context menu.
- **UI/Layout:** Press the draw-box shortcut → Drag to select an area → Release to capture and analyze.

## Keyboard Shortcuts
| Action | Shortcut |
|---|---|
| Draw Box (Screen Capture) | `Ctrl+Shift+X` (Mac: `Cmd+Shift+X`) |
| Open Side Panel | `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) |

## Tech Stack
- **Extension Framework:** Chrome Manifest V3
- **Build Tool:** Vite + esbuild
- **UI:** React
- **AI Models:** Claude (Anthropic) / GPT-4o Vision (OpenAI)

## Roadmap
- [x] **Phase 1:** Capture (text, image, box), AI integration, side panel UI, shortcuts.
- [x] **Phase 2:** Advanced multi-framework code generation (React+Tailwind, HTML+CSS, Vue 3, Flutter), variations.
- [x] **Phase 3:** History auto-save, favorites, search, Markdown export, baseline event log.
- [x] **Phase 4a:** Error taxonomy, skeleton loading, manifest permission audit, privacy surface documentation.
- [x] **Phase 4b:** Custom prompt templates system (CRUD, validator, safe fallback on repeated failures).
- [x] **Ship Prep:** Store listing copy, privacy policy, manifest version 1.2.0, store-ready ZIP package.

## License
MIT
