# Architecture

## Layered Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Browser UI (index.html)                  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              Application State (src/ui/state.js)             │
│  • S: promptSrc, taskType, enabledProviders, providerResults │
│  • contract: parsed contract representation                  │
└──────────────────────────────────────────────────────────────┘
                              │
     ┌────────────────────────┼────────────────────────┐
     ▼                        ▼                        ▼
┌─────────────┐      ┌─────────────┐          ┌─────────────┐
│   DOMAIN    │      │ APPLICATION │          │COLLABORATION│
├─────────────┤      ├─────────────┤          ├─────────────┤
│ models/     │      │ Compare     │          │ channel     │
│  Provider   │      │  Providers  │          │ presence    │
│  Prompt     │      │ Route       │          │ events      │
│  Response   │      │ Request     │          │             │
│ services/   │      └─────────────┘          └─────────────┘
│  Router     │              │
│  Cost       │              │
│ contracts/  │              │
│  parser     │              │
│  compiler   │              │
│  validator  │              │
│  diagnostics│              │
└─────────────┘              │
                             ▼
              ┌───────────────────────────┐
              │   INFRASTRUCTURE          │
              ├───────────────────────────┤
              │ providers/                │
              │  BaseAdapter              │
              │  OpenAIAdapter            │
              │  AnthropicAdapter         │
              │  GoogleAdapter            │
              │  GroqAdapter              │
              │  MockAdapter              │
              │ storage/                  │
              │  SecureKeyStore           │
              │  PromptHistory            │
              └───────────────────────────┘
                             │
                             ▼
              ┌───────────────────────────┐
              │    EXTERNAL PROVIDERS     │
              │  OpenAI · Anthropic ·     │
              │  Google · Groq            │
              └───────────────────────────┘
```

## Module Responsibilities

### UI Layer (`src/ui/`)
| Module | Responsibility |
|--------|----------------|
| `main.js` | Bootstrap, event wiring, provider updates |
| `state.js` | Application state factory |
| `rendering.js` | Pure DOM rendering functions |
| `logging.js` | Log stream management |
| `styles.css` | All styles (design tokens + components) |

### Domain Layer (`src/domain/`)
| Module | Responsibility |
|--------|----------------|
| `models/Provider.js` | Provider metadata, pricing, capabilities |
| `models/Prompt.js` | Default prompt + contract templates |
| `models/Response.js` | Response aggregation helpers |
| `services/RouterService.js` | Smart router rules and scoring |
| `services/CostService.js` | Cost ledger and per-provider tracking |
| `contracts/parser.js` | Contract DSL → AST |
| `contracts/compiler.js` | AST → TypeScript interface |
| `contracts/validator.js` | Runtime validation against contract |
| `contracts/diagnostics.js` | Diagnostic rendering |

### Infrastructure Layer (`src/infrastructure/`)
| Module | Responsibility |
|--------|----------------|
| `providers/BaseAdapter.js` | Abstract base class |
| `providers/OpenAIAdapter.js` | OpenAI Chat Completions API |
| `providers/AnthropicAdapter.js` | Anthropic Messages API |
| `providers/GoogleAdapter.js` | Google Gemini API |
| `providers/GroqAdapter.js` | Groq (OpenAI-compatible) API |
| `providers/MockAdapter.js` | Simulated responses (no key) |
| `storage/SecureKeyStore.js` | sessionStorage-based key storage |
| `storage/PromptHistory.js` | localStorage-based history |

### Application Layer (`src/application/`)
| Module | Responsibility |
|--------|----------------|
| `use-cases/CompareProviders.js` | Orchestrate parallel provider calls |
| `use-cases/RouteRequest.js` | Auto-route to best provider |

### Collaboration Layer (`src/collaboration/`)
| Module | Responsibility |
|--------|----------------|
| `channel.js` | BroadcastChannel wrapper + identity |
| `presence.js` | Peer map, heartbeat, focus tracking |
| `events.js` | Demo peer simulation |

## Dependency Rule

```
ui/          ──→ application/ ──→ domain/  ──→ (no deps)
                     │
                     └──→ infrastructure/ ──→ (fetch, storage)
collaboration/ ──→ ui/logging.js only
```

- **Domain** imports nothing from UI or infrastructure
- **Application** imports from domain + infrastructure
- **UI** imports from application + domain
- **Infrastructure** imports from domain only

## Data Flow: Running a Comparison

```
User clicks [Run on All Providers]
         │
         ▼
main.js → buildRequest() → {task, prompt, max_tokens, temperature}
         │
         ▼
compareProviders(request, enabledIds, ledger, onUpdate)
         │
         ├──→ For each provider (parallel):
         │      getAdapter(id)
         │        ├─ if apiKey exists → real adapter
         │      	 └─ else → MockAdapter
         │      adapter.send(request, {onChunk})
         │        ├─ streaming chunks → onUpdate(id, {text})
         │      	 └─ final result → onUpdate(id, {done, ...})
         │      recordCost(ledger, id, inTok, outTok)
         │
         ▼
onUpdate → renderProviderGrid + renderCost + renderStatusStrip
         │
         ▼
log lines pushed to log stream + broadcast to peers
```

## Collaboration Protocol

**Message types** (via `BroadcastChannel("ael-orchestrator")`):

| Type | Payload | Frequency |
|------|---------|-----------|
| `hello` | `{focus, activity}` | On tab load |
| `presence` | `{focus, activity}` | Every 1.6s |
| `bye` | — | On tab unload |
| `state` | `{patch}` | On prompt/contract/router change |
| `log` | `{level, msg, src}` | On notable events |

**Peer timeout**: 5.2 seconds without heartbeat → removed.