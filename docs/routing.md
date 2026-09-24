# Smart Router

## Purpose

The smart router picks the best provider for a given task and optimization mode, avoiding the need to try all providers manually.

## Rules Table

Defined in `src/domain/services/RouterService.js`:

| Task | balanced | quality | speed | cost |
|------|----------|---------|-------|------|
| general | openai | anthropic | groq | google |
| code | anthropic | anthropic | groq | openai |
| summarize | google | anthropic | groq | google |
| translate | openai | openai | groq | google |
| creative | anthropic | anthropic | groq | openai |
| analyze | openai | anthropic | groq | google |

## Scoring Formula

For each provider and mode, `scoreProvider()` returns a score in `[0, 1]`:

- **Quality score**: `very-high = 1.0`, `high = 0.8`, `medium = 0.6`
- **Speed score**: `ultra-fast = 1.0`, `very-fast = 0.85`, `fast = 0.7`, `medium = 0.5`
- **Cost score**: `1 - min(1, (priceIn + priceOut) / 20)`
- **Balanced**: average of all three

## Extending the Router

### Add a new task type

```javascript
const RULES = {
  // ...existing
  math: { quality: "anthropic", speed: "groq", cost: "openai", balanced: "openai" }
};
```

### Add a new optimization mode

```javascript
export const ROUTER_MODES = [
  // ...existing
  { id: "privacy", label: "Privacy", desc: "Prefer local / EU providers" }
];
```

Then update `scoreProvider()` to handle the new mode.

## Future: Learned Routing

A production-grade orchestrator would:

1. Log every request → response pair with quality/feedback signal
2. Train a small model that predicts "best provider" from task features
3. Fall back to the static rules table for cold start

This is **not implemented** in the current workbench — it uses a deterministic rules table.