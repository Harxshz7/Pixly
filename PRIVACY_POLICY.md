# Privacy Policy for Pixly

**Effective Date:** October 1, 2026  
**Extension Name:** Pixly — AI Design Analyst & Code Generator  
**Public Policy URL:** https://raw.githubusercontent.com/Harxshz7/Pixly/main/PRIVACY_POLICY.md  
**Repository & Support:** https://github.com/Harxshz7/Pixly/issues  

---

## 1. Overview & Commitment to Privacy
Pixly is a developer and design utility built with a **100% local-first, zero-telemetry architecture**. We do not operate user accounts, cloud tracking servers, remote databases, or external analytics infrastructure. Pixly operates entirely under a **Bring Your Own Key (BYOK)** model where requests are dispatched directly from your browser to your chosen AI model provider (Anthropic or OpenAI).

---

## 2. Data Accessed by Pixly
Pixly accesses only data that you explicitly choose to analyze:
- **Selected Text:** Text that you highlight on a webpage and submit via the context menu ("Pixly: Explain selected text") or the floating explain action.
- **Selected Images:** Image URLs or image bitmap data that you explicitly submit via the context menu ("Pixly: Analyze this image").
- **Drawn Screen Regions:** The pixel area of the visible screen captured only when you trigger and draw a bounding box using the screen capture overlay (`Ctrl+Shift+X` / `Cmd+Shift+X`).

> **Note:** Pixly does **not** perform background page scanning, passive DOM tracking, keylogging, or ambient screen recording. It accesses page content solely upon explicit user action.

---

## 3. Data Transmission (Where Your Data Goes)
When you trigger an analysis or code generation request:
1. **Direct AI Provider API Calls:** Pixly constructs a structured prompt combining the user-selected content (text, image, or screenshot snippet) and system prompt instructions. This payload is transmitted over encrypted HTTPS directly to:
   - **Anthropic API:** `https://api.anthropic.com/v1/messages` (when configured to Claude models)
   - **OpenAI API:** `https://api.openai.com/v1/chat/completions` (when configured to GPT models)
2. **User API Key:** Your personal API key is sent directly in the HTTPS Authorization header to Anthropic or OpenAI. It is never transmitted through any proxy or intermediary server.
3. **No Third-Party Transmission:** Pixly never transmits any data, analytics, crash logs, or metadata to Pixly developers or any other third parties.

---

## 4. Local Storage & Zero Remote Telemetry
All user preferences, prompt templates, and history entries reside strictly within your browser's sandboxed local storage (`chrome.storage.local` and `sessionStorage`):

- **API Keys & Settings (`pixly_api_key`, `pixly_ai_provider`, `pixly_ai_model`, `pixly_theme`, `pixly_default_format`):** Saved locally to persist your preferences.
- **Analysis History & Favorites (`pixly_history`, `pixly_history_limit`):** Saved locally so you can review and export previous analyses and pinned favorites.
- **Custom Prompt Templates (`pixly_prompt_templates`, `pixly_template_failures`):** Saved locally so you can customize analysis and codegen prompt templates.
- **Local Event-Log Counters (`pixly_event_log`):** Pixly maintains a strictly local, in-browser rolling counter for basic feature usage diagnostics and failure recovery. **This local event log is 100% on-device and is NEVER transmitted over the network or shared with any telemetry/analytics backend.**
- **Session Framework Selection (`pixly_session_code_format`):** Ephemeral tab state in `sessionStorage` for the active side panel view.

---

## 5. Data Retention & Deletion (User Control)
You maintain total control over all data stored by Pixly:
- **Clear History:** You can delete individual history items or clear your entire analysis history at any time using the "Clear History" button in the side panel.
- **Remove API Keys:** You can modify or delete your stored API keys in the Pixly Settings panel.
- **Uninstalling Pixly:** Removing Pixly from `chrome://extensions` immediately and permanently purges all local storage entries, keys, history records, and templates from your device.

---

## 6. Permissions Justification
Pixly requests minimal permissions necessary for its core functionality:
- **`activeTab`:** Captures the visible screen area only when the user draws a selection box.
- **`storage`:** Persists user settings, API keys, custom templates, and analysis history locally.
- **`contextMenus`:** Adds right-click options to quickly analyze selected text and images.
- **`sidePanel`:** Displays the analysis interface and code generation tools alongside your browser tab.
- **`downloads`:** Allows exporting analysis reports and generated code as downloadable `.md` files.
- **`host_permissions` (`api.anthropic.com`, `api.openai.com`):** Direct HTTPS communication with your chosen AI provider.

---

## 7. Contact & Support
If you have questions, feedback, or security inquiries regarding Pixly or this Privacy Policy, please submit an issue on our GitHub repository:
- **GitHub Issues:** [https://github.com/Harxshz7/Pixly/issues](https://github.com/Harxshz7/Pixly/issues)
