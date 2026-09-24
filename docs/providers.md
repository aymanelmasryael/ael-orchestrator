# Provider Adapters

## Adapter Interface

All adapters extend `BaseAdapter`:

```javascript
class BaseAdapter {
  constructor(providerId, config, apiKey) { ... }

  get hasKey() { return Boolean(this.apiKey); }

  async send(request, { onChunk, signal }) {
    // returns { text, inputTokens, outputTokens, latencyMs }
  }
}
```

## Request Shape

```javascript
{
  task: "general" | "code" | "summarize" | "translate" | "creative" | "analyze",
  prompt: string,
  max_tokens: number,
  temperature: number,
  system: string | null
}
```

## Adding a New Provider

### Step 1 — Add metadata

In `src/domain/models/Provider.js`:

```javascript
export const PROVIDERS = {
  // ...existing
  mistral: {
    id: "mistral",
    name: "Mistral",
    model: "mistral-large-latest",
    color: "#ff7000",
    priceIn: 2.00,
    priceOut: 6.00,
    speedClass: "fast",
    qualityClass: "high",
    tags: ["european", "code"]
  }
};
```

### Step 2 — Create the adapter

`src/infrastructure/providers/MistralAdapter.js`:

```javascript
import { BaseAdapter } from "./BaseAdapter.js";

export class MistralAdapter extends BaseAdapter {
  async send(request, { onChunk, signal } = {}) {
    if (!this.hasKey) throw new Error("Mistral API key not configured");

    const t0 = performance.now();
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          ...(request.system ? [{ role: "system", content: request.system }] : []),
          { role: "user", content: request.prompt }
        ],
        max_tokens: request.max_tokens,
        temperature: request.temperature
      }),
      signal
    });

    if (!res.ok) throw new Error(`Mistral ${res.status}`);
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || "";

    return {
      text,
      inputTokens: json.usage?.prompt_tokens || this.estimateTokens(request.prompt),
      outputTokens: json.usage?.completion_tokens || this.estimateTokens(text),
      latencyMs: performance.now() - t0
    };
  }
}
```

### Step 3 — Register the adapter

In `src/application/use-cases/CompareProviders.js`:

```javascript
import { MistralAdapter } from "../../infrastructure/providers/MistralAdapter.js";

const ADAPTERS = {
  openai: OpenAIAdapter,
  anthropic: AnthropicAdapter,
  google: GoogleAdapter,
  groq: GroqAdapter,
  mistral: MistralAdapter   // ← added
};
```

### Step 4 — Update the router (optional)

In `src/domain/services/RouterService.js`, add `mistral` to any rule you want.

## Streaming Support

If your provider supports SSE streaming, implement `onChunk(delta, accumulated)`:

```javascript
const reader = res.body.getReader();
const dec = new TextDecoder();
let buf = "";
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buf += dec.decode(value, { stream: true });
  // parse SSE lines from buf, call onChunk(delta, acc)
}
```

## Error Handling

Adapters should throw `Error` with a concise message. The calling use-case logs it and marks the provider card as `error`.