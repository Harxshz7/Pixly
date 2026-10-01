# Pixly — Privacy Policy & Data Surface Specification

**Version:** 1.2.0  
**Effective Date:** October 1, 2026  
**Security Model:** Local-First / Zero-Telemetry / Bring Your Own Key (BYOK)  
**Public Policy URL:** https://raw.githubusercontent.com/Harxshz7/Pixly/main/PRIVACY_POLICY.md  

---

## 1. Architectural Privacy Guarantees

Pixly adheres to a zero-compromise, local-first runtime design. We believe frontend tools should never act as covert telemetry harvesters or middleman data sinks.

### Key Tenets:
1. **Direct Egress Only:** API requests travel over TLS 1.3 straight from your browser to Anthropic or OpenAI.
2. **Zero Remote Middlemen:** No Pixly-operated backend, proxy server, or logging cloud exists.
3. **No Passive Scraping:** Pixly touches zero DOM elements or viewport pixels unless you trigger an explicit capture.

---

## 2. Telemetry & Diagnostics Clarification

- Pixly contains **zero third-party tracking scripts** (no Google Analytics, no Segment, no Sentry, no Mixpanel).
- Pixly maintains a local `pixly_event_log` in `chrome.storage.local`. **This is a local-only rolling diagnostic buffer.** It tracks internal operational counts (e.g., capture events, code formatting switches) strictly to facilitate automated error recovery and custom template validation. It is **never** transmitted across the network.

---

## 3. Storage Schema & Data Residency

All user data resides in Chrome's sandboxed local profile storage (`chrome.storage.local`):

| Key | Type | Description |
|---|---|---|
| `pixly_api_key` | String | Encrypted local storage of Anthropic/OpenAI API key |
| `pixly_ai_provider` | String | Active provider selection (`anthropic` \| `openai`) |
| `pixly_ai_model` | String | Active model selection (e.g. `claude-3-5-sonnet`, `gpt-4o`) |
| `pixly_default_format` | String | Preferred export target (`react-tailwind`, `html-css`, `vue`, `flutter`) |
| `pixly_theme` | String | Workbench theme preference (`dark`, `light`, `system`) |
| `pixly_history_limit` | Number | Maximum records preserved in history (default: 50) |
| `pixly_history` | Array | Local cache of past captures, tokens, ASTs, and pinned favorites |
| `pixly_prompt_templates` | Object | User-defined prompt overrides with validation safeguards |
| `pixly_template_failures` | Object | Local circuit breaker tracking template compile failures |
| `pixly_event_log` | Array | 100% on-device operational event log |

---

## 4. Permissions Audit Summary

- **`activeTab`**: Limited strictly to active tab coordinate capture during user-initiated box-draw.
- **`storage`**: Persists keys, templates, and history records locally on-device.
- **`contextMenus`**: Adds right-click shortcuts to analyze images and text selections.
- **`sidePanel`**: Renders the persistent side panel workbench in Chrome 116+.
- **`downloads`**: Saves exported `.md` analysis reports and code bundles to disk.

---

## 5. Security Inquiries & Issues

Report any security questions or concerns directly to our GitHub repository:
- **GitHub Repository:** [https://github.com/Harxshz7/Pixly](https://github.com/Harxshz7/Pixly)
- **Issue Tracker:** [https://github.com/Harxshz7/Pixly/issues](https://github.com/Harxshz7/Pixly/issues)
