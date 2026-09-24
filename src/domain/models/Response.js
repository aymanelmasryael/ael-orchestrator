/* =========================================================================
   Response Model
   ========================================================================= */

export class ProviderResponse {
  constructor(providerId, text, inputTokens, outputTokens, latencyMs, meta = {}) {
    this.providerId = providerId;
    this.text = text;
    this.inputTokens = inputTokens;
    this.outputTokens = outputTokens;
    this.latencyMs = latencyMs;
    this.mock = meta.mock || false;
    this.error = meta.error || null;
    this.timestamp = Date.now();
  }

  get totalTokens() {
    return this.inputTokens + this.outputTokens;
  }

  get costUsd() {
    return this.inputCost + this.outputCost;
  }
}

export class ResponseAggregator {
  constructor() {
    this.responses = [];
  }

  add(response) {
    this.responses.push(response);
  }

  getAll() {
    return this.responses;
  }

  getByProvider(id) {
    return this.responses.find(r => r.providerId === id);
  }

  clear() {
    this.responses = [];
  }
}