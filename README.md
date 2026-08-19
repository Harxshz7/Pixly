# Pixly
AI-powered text, image, and UI analysis directly in your browser.

## Features
**Phase 1: MVP**
- **Text Selection:** Highlight any text for instant AI explanations.
- **Image Analysis:** Right-click images to extract details or generate descriptions.
- **Draw-Box UI Capture:** Select screen areas to analyze layouts, recreate UI code, or extract design tokens.

## Demo
![Pixly Demo - Text Selection](placeholder-text-demo.png)
![Pixly Demo - Draw Box](placeholder-box-demo.png)

## Installation (Dev)
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Open `chrome://extensions`
5. Enable **Developer mode**
6. Click **Load unpacked** and select the `dist/` directory

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
| Draw Box (Screen Capture) | `Ctrl+Shift+X` |
| Open Side Panel | `Ctrl+Shift+P` |

## Tech Stack
- **Extension Framework:** Chrome Manifest V3
- **Build Tool:** Vite
- **UI:** React
- **Logic:** Vanilla JS content scripts
- **AI Models:** Claude / GPT-4o Vision

## Project Structure
```text
pixly/
├── public/          # Static assets & icons
├── src/
│   ├── background/  # Service worker, routing
│   ├── content/     # Injected scripts, draw box
│   ├── sidepanel/   # React UI
│   ├── options/     # Settings UI
│   ├── lib/         # AI wrappers, utils, generators
│   └── shared/      # Shared types & shortcuts
└── dist/            # Compiled output
```

## Roadmap
- [ ] **Phase 2:** Advanced code generation (React, Vue, Tailwind, Flutter).
- [ ] **Phase 3:** Save history and manage snippets locally.
- [ ] **Phase 4:** Custom prompt management.

## License
MIT
