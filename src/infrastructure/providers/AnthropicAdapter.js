/* =========================================================================
   Anthropic (Claude) Adapter
   ========================================================================= */

import { BaseAdapter } from "./BaseAdapter.js";

export class AnthropicAdapter extends BaseAdapter {
  async send(request, opts = {}) {
    if (!this.hasKey) throw new Error("Anthropic API key not configured");

    const { onChunk, signal } = opts;
    const t0 = performance.now();

    const body = {
      model: this.config.model,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
      ...(request.system ? { system: request.system } : {}),
      messages: [{ role: "user", content: request.prompt }],
      stream: Boolean(onChunk)
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify(body),
      signal
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`);
    }

    let text = "";
    let inputTokens = 0, outputTokens = 0;

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
          try {
            const json = JSON.parse(trimmed.slice(5).trim());
            if (json.type === "content_block_delta") {
              const delta = json.delta?.text;
              if (delta) { text += delta; onChunk(delta, text); }
            }
            if (json.type === "message_start") inputTokens = json.message?.usage?.input_tokens || 0;
            if (json.type === "message_delta") outputTokens = json.usage?.output_tokens || 0;
          } catch (_) {}
        }
      }
    } else {
      const json = await res.json();
      text = json.content?.[0]?.text || "";
      inputTokens = json.usage?.input_tokens || 0;
      outputTokens = json.usage?.output_tokens || 0;
    }

    return {
      text,
      inputTokens: inputTokens || this.estimateTokens(request.prompt),
      outputTokens: outputTokens || this.estimateTokens(text),
      latencyMs: performance.now() - t0
    };
  }
}