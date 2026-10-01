# Pixly 🎨⚡

> **High-Performance AI-Powered Design Systems Analyst & Multi-Framework Code Synthesis Engine for Chrome (Manifest V3)**

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build & Test Status](https://img.shields.io/badge/Tests-21%20Passing-brightgreen.svg)](#-test-suite--quality-assurance)
[![Zero Telemetry](https://img.shields.io/badge/Telemetry-Zero%20(Local%20First)-success.svg)](PRIVACY_POLICY.md)

---

## 🏛️ Architectural Overview

Pixly is an engineering-grade Chrome extension engineered to bridge the gap between visual web inspection and production frontend code synthesis. Rather than relying on heavyweight cloud intermediaries or proprietary backend parsers, Pixly operates entirely **client-side in a sandboxed, local-first runtime**.

```mermaid
flowchart TB
    subgraph Browser Context
        A[Webpage DOM / Canvas] -->|User Selection / Bounding Box| B[Content Script Capture Layer]
        B -->|Message Port / Offscreen| C[Service Worker MV3 Orchestrator]
    end

    subgraph Client-Side Isolation Layer
        C -->|Local State & Cache| D[(chrome.storage.local)]
        C -->|Prompt Engine & Validator| E[Dynamic Prompt Compiler]
        E -->|BYOK Direct TLS 1.3| F[AI Provider: Anthropic / OpenAI]
    end

    subgraph Side Panel UI (React 18)
        F -->|Streamed SSE Chunks| G[AST / Token Parser & Sanitizer]
        G --> H[Multi-Target Code Synthesizer]
        H --> I[React + Tailwind]
        H --> J[HTML5 + CSS Variables]
        H --> K[Vue 3 SFC]
        H --> L[Flutter Material]
        G --> M[WCAG Contrast & Token Matrix]
    end
```

---

## ⚡ Core Engineering Capabilities

### 1. High-Fidelity Visual Extraction & Spatial Capture
- **Sub-Pixel Bounding Box Overlay:** Hardware-accelerated canvas overlay captures exact viewport coordinates with zero layout thrashing or page DOM pollution.
- **Context-Aware DOM Traversal:** Inspects computed styles, font stacks, pseudo-classes, flex/grid hierarchies, and spacing metrics.
- **Deterministic Color & Contrast Engine:** Extracts palette hex arrays, computes relative luminance under WCAG 2.1 specifications, and determines AAA/AA pass ratings for light/dark palettes.

### 2. Multi-Target Framework Synthesis Pipeline
- **React 18 + Tailwind CSS v3:** Generates modular functional components with typed props, accessible ARIA attributes, and canonical responsive utility classes.
- **Semantic HTML5 + Modern CSS:** Emits clean, accessible markup utilizing `:root` CSS custom properties, modern flexbox/grid layouts, and responsive clamps.
- **Vue 3 SFC:** Produces Single-File Components using the Composition API (`<script setup>`) with scoped styling.
- **Flutter Material 3:** Generates idiomatic Dart widget trees with structured layout constraints and Material 3 design tokens.
- **Zero-Cost Re-Targeting:** Synthesized AST analysis is cached in-memory, allowing instant switching between React, Vue, HTML, and Flutter without redundant vision model API calls.

### 3. Syntax Verification & Resilient Rendering Engine
- **Balanced Bracket & Tag Validator:** Pre-execution parser guarantees that streamed code blocks are structurally balanced before injecting into the syntax viewer.
- **Automated Fallback State Machine:** In the event of model formatting irregularities, Pixly seamlessly downgrades to a raw verified buffer and provides one-click structured retry.

### 4. Custom Prompt System & Safe Fallbacks
- **Live Variable Interpolation:** Custom prompts support runtime placeholders (`{{context}}`, `{{selection}}`, `{{image}}`) with syntax verification before execution.
- **Fault-Tolerant Circuit Breaker:** Repeated template compilation failures trigger an automated fallback to internally hardened, versioned system prompts to prevent UI lockup.

### 5. Local Storage Lifecycle & Memory Management
- **Deterministic FIFO / Pinned Eviction:** Storage records operate on an LRU/FIFO buffer with a configurable quota limit, safeguarding user-pinned favorites from automated garbage collection.
- **Zero-Telemetry Local Diagnostics:** Rolling operational event logs track performance and error codes purely in local memory (`chrome.storage.local`), ensuring zero external data leakage.

---

## 📂 Codebase Hierarchy

```
pixly/
├── src/
│   ├── background/
│   │   └── service-worker.js         # Manifest V3 background worker; handles streaming HTTPS requests
│   ├── content/
│   │   ├── box-capture.js            # Isolated viewport coordinate selection engine
│   │   ├── text-highlighter.js       # Contextual floating action bubble for selected text
│   │   └── content-styles.css        # Encapsulated capture overlay styling
│   ├── lib/
│   │   ├── ai/                       # Direct-to-provider HTTP clients, streaming SSE adapters
│   │   ├── analysis/                 # Deterministic color matrix, WCAG calculator, token extractors
│   │   ├── errors/                   # Classified error taxonomy & recovery advice engine
│   │   ├── generators/               # Framework-specific synthesis generators (React, Vue, HTML, Flutter)
│   │   ├── storage/                  # CRUD storage adapters with LRU/FIFO eviction strategies
│   │   ├── telemetry/                # 100% on-device diagnostic circular buffer (0 external pings)
│   │   └── utils/                    # Syntax validators, Markdown export formatter, debouncers
│   ├── sidepanel/
│   │   ├── App.jsx                   # React 18 side panel root application
│   │   ├── components/               # High-cohesion workbench components (ResultView, CodeBlock, HistoryList)
│   │   └── styles/                   # Modern dark/light glassmorphic design system
│   └── options/                      # Settings & Prompt Template Management interface
├── store-assets/                     # High-res Chrome Web Store screenshots, banners, and app icons
├── tests/                            # Comprehensive Node.js test suites
├── manifest.json                     # Production Manifest V3 definition
├── vite.config.js                    # Custom multi-target Vite/ESBuild bundling pipeline
├── PRIVACY_POLICY.md                 # Complete public privacy policy & data surface specification
└── STORE_LISTING.md                  # Chrome Web Store listing copy & permission justifications
```

---

## 🛠️ Local Development & Build Workflow

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm` (v9+)
- **Target Browser**: Google Chrome / Chromium (v116+ for Side Panel MV3 APIs)

### 1. Installation & Environment Setup
```bash
# Clone the repository
git clone https://github.com/Harxshz7/Pixly.git
cd Pixly

# Install dependencies
npm install
```

### 2. Execution & Testing
```bash
# Run unit and integration tests (21 suites verifying storage, codegen, error recovery)
npm test

# Production extension build (outputs to dist/)
npm run build

# Continuous watch build during active development
npm run dev
```

### 3. Loading the Unpacked Extension into Chrome
1. Navigate to `chrome://extensions/` in Chrome.
2. Toggle **Developer mode** in the upper right corner.
3. Click **Load unpacked** and select the [`dist/`](file:///c:/Users/harxs/OneDrive/Desktop/Pixly/dist) directory.
4. Click the extension puzzle icon and pin **Pixly** to your toolbar.

---

## 🔒 Security & Privacy Architecture

Pixly enforces a strict **Zero-Trust Client Boundary**:
- **Bring Your Own Key (BYOK):** Users provide their personal Anthropic or OpenAI API keys. Keys reside solely in `chrome.storage.local` and are transmitted strictly via encrypted TLS 1.3 direct API headers.
- **Zero Third-Party Dependencies in Runtime:** No analytics SDKs (Google Analytics, Mixpanel, Sentry, Datadog), no remote CDNs, and no external telemetry endpoints.
- **Strict Content Security Policy (CSP):** Prohibits `unsafe-eval` and restricts script execution strictly to local extension packages.

Review the comprehensive [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for full compliance specifications.

---

## 🧪 Test Suite & Quality Assurance

Pixly includes rigorous test coverage powered by Node.js's native test runner:
- **Code Generation & Prompt Compilation:** Validates prompt token counts and AST transformations.
- **Syntax Validator & Balance Checker:** Verifies tag matching, unclosed strings, and malformed JSX resilience.
- **Storage Lifecycle & Eviction:** Validates FIFO eviction behavior under tight quota constraints while retaining pinned favorites.
- **Error Classifier:** Verifies correct categorization of rate limits, network timeouts, image payload ceilings, and auth errors.

---

## 📄 License & Intellectual Property

Distributed under the **MIT License**. See `LICENSE` for details.
