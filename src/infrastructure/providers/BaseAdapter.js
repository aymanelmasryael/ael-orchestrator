/* =========================================================================
   Base Provider Adapter
   ========================================================================= */

export class BaseAdapter {
  constructor(providerId, config, apiKey = null) {
    this.id = providerId;
    this.config = config;
    this.apiKey = apiKey;
  }

  get hasKey() {
    return Boolean(this.apiKey && this.apiKey.trim());
  }

  async send(request, opts = {}) {
    throw new Error("send() must be implemented by subclass");
  }

  estimateTokens(text) {
    return Math.max(1, Math.round((text || "").length / 4));
  }
}