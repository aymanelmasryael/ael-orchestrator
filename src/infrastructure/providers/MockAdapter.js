/* =========================================================================
   Mock Adapter — realistic simulation, no API key needed
   ========================================================================= */

import { BaseAdapter } from "./BaseAdapter.js";

const CANNED = {
  general: [
    "Transformer attention is a mechanism that lets each word in a sentence look at every other word and decide how much to 'listen' to it. Imagine a busy meeting where everyone is speaking at once, but each person has a small earpiece that automatically amplifies the voices most relevant to them — that's attention. Instead of a fixed left-to-right reading order, the model weighs all positions in parallel. In one line: attention is learned, content-based routing of information between every pair of tokens.",
    "At its core, attention computes how relevant each token is to every other token by comparing learned query and key vectors, then uses those scores to blend value vectors. A helpful analogy is a library where your search query (Q) is matched against book titles (K), and you read the books (V) that score highest. This lets the model capture long-range dependencies without recurrence, at the cost of quadratic compute in sequence length."
  ],
  code: [
    "```python\nclass Attention(nn.Module):\n    def __init__(self, d_model, n_heads):\n        super().__init__()\n        self.d_model = d_model\n        self.n_heads = n_heads\n        self.d_head = d_model // n_heads\n        self.qkv = nn.Linear(d_model, 3 * d_model)\n        self.out = nn.Linear(d_model, d_model)\n\n    def forward(self, x, mask=None):\n        B, T, C = x.shape\n        qkv = self.qkv(x).reshape(B, T, 3, self.n_heads, self.d_head)\n        q, k, v = qkv.unbind(2)\n        # ... scaled dot-product attention ...\n        return self.out(attn_output)\n```\n\nThis implementation follows the standard multi-head attention pattern."
  ],
  summarize: [
    "The passage explains how transformer attention enables parallel, content-based routing between tokens. It contrasts this with recurrent models that process sequentially, and notes the quadratic compute cost as the main trade-off. Key takeaway: attention replaced recurrence with relevance."
  ],
  translate: [
    "This is a simulated translation. In a real call, the provider would return the translated text in the requested target language. The mock adapter returns a description instead so the workbench can be demonstrated without API keys."
  ],
  creative: [
    "Once upon a lattice of vectors, a token whispered to its neighbour. 'Do you know who I am?' The neighbour paused, computed a dot product, and replied: 'You are 0.87 relevant to me.' And so the sentence began to mean something. — Simulated creative output."
  ],
  analyze: [
    "Analysis summary (simulated):\n• Input length: moderate\n• Entropy estimate: 4.2 bits/token\n• Dominant theme: technical explanation\n• Suggested next action: request a deeper dive on the math."
  ]
};

export class MockAdapter extends BaseAdapter {
  async send(request, opts = {}) {
    const { onChunk, signal } = opts;
    const t0 = performance.now();

    const baseLatency = {
      "ultra-fast": 180,
      "very-fast": 320,
      fast: 520,
      medium: 880
    }[this.config.speedClass] || 500;

    const latency = baseLatency + Math.random() * 400;
    await sleep(latency * 0.25);

    const pool = CANNED[request.task] || CANNED.general;
    const fullText = pool[Math.floor(Math.random() * pool.length)];

    const chunks = chunkText(fullText, 24);
    let acc = "";
    for (const chunk of chunks) {
      if (signal && signal.aborted) throw new Error("aborted");
      acc += chunk;
      if (onChunk) onChunk(chunk, acc);
      await sleep(latency / chunks.length);
    }

    const inputTokens = this.estimateTokens((request.system || "") + request.prompt);
    const outputTokens = this.estimateTokens(fullText);
    const latencyMs = performance.now() - t0;

    return {
      text: fullText,
      inputTokens,
      outputTokens,
      latencyMs,
      mock: true
    };
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function chunkText(text, size) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + size + Math.floor(Math.random() * 12));
    out.push(text.slice(i, end));
    i = end;
  }
  return out;
}