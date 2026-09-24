# Security Model

## Threat Model

| Asset | Threat | Mitigation |
|-------|--------|------------|
| API keys | XSS reading `sessionStorage` | Keys cleared on tab close; no `localStorage` for keys |
| API keys | Third-party JS exfiltration | Zero external scripts — no CDN, no analytics |
| API keys | Server-side leakage | **No AEL backend exists** — keys go directly to providers |
| Prompt content | Eavesdropping | HTTPS enforced by browser + providers |
| Session token | Replay | BroadcastChannel is same-origin only |

## Key Storage

Keys are stored in `sessionStorage` under the prefix `ael-orch-key-<providerId>`:

```javascript
sessionStorage.setItem("ael-orch-key-openai", "sk-...");
```

**Why sessionStorage?**
- Cleared automatically when the tab/window closes
- Not shared with other tabs
- Not persisted to disk (unlike localStorage)
- Simpler to audit than IndexedDB

**Why not localStorage?** Because API keys are sensitive and should not survive a browser restart without re-confirmation.

## No Backend

**AEL Orchestrator has no backend.** All API calls go **directly from the browser** to the provider's API:

```
Browser → fetch() → https://api.openai.com
                  → https://api.anthropic.com
                  → https://generativelanguage.googleapis.com
                  → https://api.groq.com
```

There is no proxy server, no logging middleware, and no analytics.

## CORS Notes

Some providers require explicit CORS headers for browser calls:

- **OpenAI**: Allows browser calls with API key.
- **Anthropic**: Requires the header `anthropic-dangerous-direct-browser-access: true` (already set in the adapter).
- **Google**: Allows browser calls with API key in query string.
- **Groq**: Allows browser calls with Bearer token.

⚠️ **For production apps**, always proxy API calls through your own backend so keys never touch the client.

## Reporting a Vulnerability

Email **security@aymanelmasry.com** — do not open public issues for security findings.