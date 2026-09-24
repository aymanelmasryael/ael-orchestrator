/* =========================================================================
   Google Gemini Adapter
   ========================================================================= */

import { BaseAdapter } from "./BaseAdapter.js";

export class GoogleAdapter extends BaseAdapter {
  async send(request, opts = {}) {
    if (!this.hasKey) throw new Error("Google API key not configured");

    const { onChunk, signal } = opts;
    const t0 = performance.now();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:${onChunk ? "streamGenerateContent" : "generateContent"}?key=${this.apiKey}${onChunk ? "&alt=sse" : ""}`;

    const body = {
      contents: [{
        role: "user",
        parts: [{ text: request.system ? `${request.system}\n\n${request.prompt}` : request.prompt }]
      }],
      generationConfig: {
        maxOutputTokens: request.max_tokens,
        temperature: request.temperature
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google ${res.status}: ${err.slice(0, 200)}`);
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
            const delta = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (delta) { text += delta; onChunk(delta, text); }
            if (json.usageMetadata) {
              inputTokens = json.usageMetadata.promptTokenCount || 0;
              outputTokens = json.usageMetadata.candidatesTokenCount || 0;
            }
          } catch (_) {}
        }
      }
    } else {
      const json = await res.json();
      text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      inputTokens = json.usageMetadata?.promptTokenCount || 0;
      outputTokens = json.usageMetadata?.candidatesTokenCount || 0;
    }

    return {
      text,
      inputTokens: inputTokens || this.estimateTokens(request.prompt),
      outputTokens: outputTokens || this.estimateTokens(text),
      latencyMs: performance.now() - t0
    };
  }
}