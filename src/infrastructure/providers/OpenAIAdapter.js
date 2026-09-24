/* =========================================================================
   OpenAI Adapter — real API calls
   ========================================================================= */

import { BaseAdapter } from "./BaseAdapter.js";

export class OpenAIAdapter extends BaseAdapter {
  async send(request, opts = {}) {
    if (!this.hasKey) throw new Error("OpenAI API key not configured");

    const { onChunk, signal } = opts;
    const t0 = performance.now();

    const body = {
      model: this.config.model,
      messages: [
        ...(request.system ? [{ role: "system", content: request.system }] : []),
        { role: "user", content: request.prompt }
      ],
      max_tokens: request.max_tokens,
      temperature: request.temperature,
      stream: Boolean(onChunk)
    };
    if (request.top_p != null) body.top_p = request.top_p;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body),
      signal
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`);
    }

    let text = "";
    let usage = null;

    if (onChunk) {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) { text += delta; onChunk(delta, text); }
            if (json.usage) usage = json.usage;
          } catch (_) {}
        }
      }
    } else {
      const json = await res.json();
      text = json.choices?.[0]?.message?.content || "";
      usage = json.usage;
    }

    const inputTokens = usage?.prompt_tokens || this.estimateTokens(request.prompt);
    const outputTokens = usage?.completion_tokens || this.estimateTokens(text);

    return { text, inputTokens, outputTokens, latencyMs: performance.now() - t0 };
  }
}