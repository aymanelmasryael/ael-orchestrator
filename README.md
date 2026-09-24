<div align="center">

<img src="assets/logo.svg" alt="AEL Orchestrator" width="120" height="120">

# ⚡ AEL Orchestrator

**Multi-Provider AI Model Orchestration Workbench**
with type-safe prompt contracts, smart routing, and real-time cost tracking.

[![License: MIT](https://img.shields.io/badge/License-MIT-0074FF.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![Anthropic](https://img.shields.io/badge/Anthropic-d97757?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)
[![Google](https://img.shields.io/badge/Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

[**Live Demo**](https://aymanelmasryael.github.io/ael-orchestrator/) ·
[**Documentation**](docs/) ·
[**Report Bug**](https://github.com/aymanelmasryael/ael-orchestrator/issues)

</div>

---

## 📖 Overview

**AEL Orchestrator** is a dependency-free, browser-based workbench for
**orchestrating multiple LLM providers** in a single interface. Send one
prompt to GPT-4o, Claude 3.5, Gemini 1.5, and Llama 3.1 (via Groq)
**side-by-side**, compare latency, cost, and output quality, and let a
**smart router** pick the best model per task.

It ships with a **type-safe contract DSL** (reused from the AEL TF-Serving Lab)
that validates every request before it reaches a provider — so the orchestration
boundary is enforced at compile time **and** at runtime.

> The workbench includes a **Demo Mode** that runs entirely with simulated
> responses — so you can explore it live without any API keys.

---

## ✨ Features

### 🎯 Multi-Provider Orchestration
- **OpenAI** (GPT-4o mini)
- **Anthropic** (Claude 3.5 Sonnet)
- **Google** (Gemini 1.5 Flash)
- **Groq** (Llama 3.1 70B — ultra-fast)
- Enable/disable any provider with one click

### 📜 Type-Safe Prompt Contracts
- Custom DSL → TypeScript interface → Runtime validation
- Decorators: `@min`, `@max`, `@range`, `@pattern`, `@enum`, `@maxItems`
- Optional fields, defaults, arrays
- Live compiler diagnostics

### 🧠 Smart Router
- 4 optimization modes: **Balanced · Quality · Speed · Cost**
- Per-task routing rules (`code` → Claude, `fast` → Groq, etc.)
- Auto-route button sends to the single best provider

### 💰 Cost Tracking
- Real-time session cost ledger
- Per-provider breakdown with visual bars
- Cost per request, per token, per provider

### 🔐 Security-First API Keys
- Keys stored **only** in `sessionStorage` — never sent to AEL servers
- Input masked, status badge per provider
- Works **without keys** (mock mode) for safe public demos

### 👥 Real-Time Collaboration
- BroadcastChannel API — sync prompt, contract, router mode across tabs
- Peer presence with avatars and focus indicators
- Demo peer simulation for single-user testing

---

## 🚀 Quick Start

### Option 1: Open directly (demo mode)
```bash
git clone https://github.com/aymanelmasryael/ael-orchestrator.git
cd ael-orchestrator
open index.html
```

### Option 2: Local server (full collaboration)
```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

### Option 3: Use live API keys
1. Open the workbench
2. Go to the **API Keys** panel (right side)
3. Paste your keys for any provider
4. Switch off Demo Mode (`◈ demo` button in top-right of Prompt panel)
5. Press **Run on All Providers**

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser UI (index.html)                 │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                 Application State (src/ui/state.js)          │
└──────────────────────────────────────────────────────────────┘
                              │
     ┌────────────────────────┼────────────────────────┐
     ▼                        ▼                        ▼
┌─────────────┐      ┌─────────────┐          ┌─────────────┐
│  Domain     │      │ Application │          │Collaboration│
│  Layer      │      │ Use-Cases   │          │  Layer      │
├─────────────┤      ├─────────────┤          ├─────────────┤
│ models/     │      │ Compare     │          │ channel     │
│ services/   │      │ Providers   │          │ presence    │
│ contracts/  │      │ Route       │          │ events      │
└─────────────┘      └─────────────┘          └─────────────┘
     │                        │
     └────────────┬───────────┘
                  ▼
     ┌───────────────────────────┐
     │   Infrastructure Layer    │
     ├───────────────────────────┤
     │ providers/ (adapters)     │
     │ storage/ (keys, history)  │
     └───────────────────────────┘
```

For a detailed breakdown, see **[docs/architecture.md](docs/architecture.md)**.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**Architecture**](docs/architecture.md) | Module responsibilities, data flow, protocol |
| [**Providers**](docs/providers.md) | How to add a new provider adapter |
| [**Routing**](docs/routing.md) | Smart router rules and scoring |
| [**Security**](docs/security.md) | API key handling and threat model |
| [**Contract System**](docs/contract-system.md) | DSL grammar, decorators, validation |

---

## 📁 Project Structure

```
ael-orchestrator/
├── index.html
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── src/
│   ├── ui/                    # Entry point, state, rendering, logging
│   ├── domain/                # Models, services, contract DSL
│   ├── infrastructure/        # Provider adapters, key storage
│   ├── application/           # Use-cases (compare, route)
│   ├── collaboration/         # BroadcastChannel, presence
│   └── shared/                # Utilities
├── docs/                      # Technical documentation
└── assets/                    # Logo, provider icons
```

---

## 🧪 Experiments to Try

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Press **Run on All Providers** in Demo Mode | 4 mock responses in parallel |
| 2 | Compare latency between Groq and Anthropic | Groq is ~5x faster in mock |
| 3 | Switch router mode to **Cost** | Google Gemini is chosen |
| 4 | Add a real OpenAI key | Live response replaces mock |
| 5 | Open second tab | Peer avatar appears |
| 6 | Click **+ demo peer** | Simulated collaborator joins |
| 7 | Edit contract → introduce syntax error | Compiler diagnostic shown |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **UI** | HTML5, CSS3 (Grid + Custom Properties), Vanilla ES Modules |
| **Rendering** | DOM-based (no framework) |
| **Collaboration** | BroadcastChannel API |
| **Storage** | `sessionStorage` (keys), `localStorage` (history) |
| **Providers** | Native `fetch()` with SSE streaming |
| **Dependencies** | **Zero** — no npm, no bundler, no build step |

---

## 🔐 Security Notes

- **API keys never leave your browser** except to reach the AI provider directly.
- Keys are stored in `sessionStorage` — cleared when you close the tab.
- The workbench is 100% static; there is no AEL backend.
- Do **not** commit `.env` files with real keys. The `.env.example` is for reference only.

See **[docs/security.md](docs/security.md)** for the full threat model.

---

## 🤝 Contributing

Contributions are welcome! Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git checkout -b feat/gemini-2-adapter
git commit -m "feat(providers): add Gemini 2.0 Flash adapter"
git push origin feat/gemini-2-adapter
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE).

---

## 👤 Author

<div align="center">

**Ayman Elmasry**
*Visionary · AI Orchestrator · Brand Designer*
**Founder @ AEL Digital Studio**

📍 Dubai · Egypt · Kuwait

[![Website](https://img.shields.io/badge/Website-aymanelmasry.com-0074FF?style=for-the-badge)](https://www.aymanelmasry.com/)
[![Portfolio](https://img.shields.io/badge/Portfolio-aymanelmasry.me-0074FF?style=for-the-badge)](https://aymanelmasry.me/)
[![Email](https://img.shields.io/badge/Email-info@aymanelmasry.com-0074FF?style=for-the-badge)](mailto:info@aymanelmasry.com)

</div>

---

<div align="center">

**Made with ⚡ by AEL Digital Studio**

</div>