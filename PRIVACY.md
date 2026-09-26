# Pixly — Privacy Surface Summary

## Data That Leaves the Machine

Pixly makes API calls to **one** external service at a time, chosen by the user:

- **Anthropic API** (`https://api.anthropic.com/v1/messages`) — when using Claude models
- **OpenAI API** (`https://api.openai.com/v1/chat/completions`) — when using GPT models

These calls include:
- The user's API key (stored locally, never sent elsewhere)
- Selected text, image data URLs, or screenshot regions that the user explicitly chooses to analyze
- System prompts for analysis/code generation (no user PII)

**No other network requests are made.** There is no analytics service, no crash reporting, no telemetry server.

## Data Stored Locally

All data is stored via `chrome.storage.local` and never leaves the device:

| Data | Storage Key | Purpose |
|------|-------------|---------|
| API key | `pixly_api_key` | Authenticates with AI provider |
| Provider/model | `pixly_ai_provider`, `pixly_ai_model` | User's chosen AI configuration |
| Analysis history | `pixly_history` | Past results (text, images, UI analyses) |
| Settings | `pixly_default_format`, `pixly_theme`, `pixly_history_limit` | User preferences |
| Event counters | `pixly_event_log` | Local-only feature-usage counters (no PII, never transmitted) |

## What Is Never Collected or Transmitted

- No browsing history or URLs (beyond what the user explicitly analyzes)
- No personal information
- No cookies or session tokens
- No telemetry sent to any server
- Event log counters are stored locally only and contain no identifying information
