# Pixly — Privacy Policy & Data Surface Summary

**Effective Date:** September 28, 2026  
**Version:** 1.2.0

Pixly is designed from the ground up to be **100% private, local-first, and zero-telemetry**. We do not operate tracking servers, telemetry backends, or data collection infrastructure.

---

## 1. Data That Leaves Your Machine

Pixly connects directly and exclusively to the AI provider endpoint you configure (Bring Your Own Key — BYOK model):

- **Anthropic API** (`https://api.anthropic.com/v1/messages`) — when using Claude models
- **OpenAI API** (`https://api.openai.com/v1/chat/completions`) — when using GPT models

### What is transmitted during an analysis request:
1. **Your API Key:** Sent in HTTPS authorization headers directly to your selected AI provider (Anthropic or OpenAI). It is never sent to any intermediary server.
2. **User-Selected Content:**
   - Text explicitly selected and submitted via the floating "Explain" action.
   - Images explicitly chosen via the right-click "Analyze with Pixly" context menu.
   - Screen pixel regions explicitly selected using the Draw-Box capture overlay tool.
3. **System Prompts:** Standard or user-customized design analysis and code generation prompt instructions.

**No other network requests are ever made.** Pixly contains zero third-party analytics scripts, zero error tracking SDKs (e.g., Sentry), and zero external CDN trackers.

---

## 2. Data Stored Locally on Your Device

All configuration, history, and custom prompt templates are saved locally in `chrome.storage.local` and `sessionStorage`:

| Storage Key | Storage Scope | Purpose & Description |
|---|---|---|
| `pixly_api_key` | `chrome.storage.local` | Securely stored API key for Anthropic or OpenAI. |
| `pixly_ai_provider` | `chrome.storage.local` | User preference for AI provider (`anthropic` or `openai`). |
| `pixly_ai_model` | `chrome.storage.local` | Selected AI model (e.g., `claude-3-5-sonnet-20241022`, `gpt-4o`). |
| `pixly_default_format` | `chrome.storage.local` | Default code export format (`react-tailwind`, `html-css`, `vue`, `flutter`). |
| `pixly_theme` | `chrome.storage.local` | Side panel UI theme mode (`dark`, `light`, `system`). |
| `pixly_history_limit` | `chrome.storage.local` | User-configured maximum number of history items to keep (default: 50). |
| `pixly_history` | `chrome.storage.local` | Local records of past analyses, generated code, design tokens, and favorites. |
| `pixly_prompt_templates` | `chrome.storage.local` | Custom prompt templates created or modified by the user. |
| `pixly_template_failures` | `chrome.storage.local` | Local error counter tracking custom template failures for safe default fallback. |
| `pixly_event_log` | `chrome.storage.local` | Local circular buffer tracking feature counts (never transmitted off-device). |
| `pixly_session_code_format`| `sessionStorage` | Ephemeral active framework tab selection for the current browser session. |

---

## 3. Chrome Permissions & Why They Are Needed

| Permission | Justification |
|---|---|
| `activeTab` | Grants temporary access to capture only the visible viewport area when the user initiates a draw-box screen selection. |
| `storage` | Stores your API keys, preferences, prompt templates, and analysis history locally on your machine. |
| `contextMenus` | Adds convenient right-click context menu options to analyze images or explain text directly from any webpage. |
| `sidePanel` | Displays the interactive design analysis workbench, token explorer, and code editor in Chrome's side panel. |
| `downloads` | Enables one-click downloading of generated Markdown reports and code snippet files. |

---

## 4. What is NEVER Collected, Stored Remotely, or Transmitted

- ❌ No browsing history or visited URLs (outside of explicit analysis captures).
- ❌ No personally identifiable information (PII).
- ❌ No browser cookies, session identifiers, or storage tokens from websites you visit.
- ❌ No background screen recording or passive page listening.
- ❌ No analytics or telemetry sent to first-party or third-party servers.

---

## 5. Contact & Questions

If you have questions regarding this privacy policy, you can open an issue on the [Pixly GitHub Repository](https://github.com/Harxshz7/Pixly).
