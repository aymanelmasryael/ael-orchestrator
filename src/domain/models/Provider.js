/* =========================================================================
   Provider Model
   ========================================================================= */

export const PROVIDERS = {
  openai: {
    id: "openai",
    name: "OpenAI",
    model: "gpt-4o-mini",
    color: "#10a37f",
    priceIn: 0.15,
    priceOut: 0.60,
    speedClass: "fast",
    qualityClass: "high",
    tags: ["reasoning", "code", "vision"]
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    model: "claude-3-5-sonnet",
    color: "#d97757",
    priceIn: 3.00,
    priceOut: 15.00,
    speedClass: "medium",
    qualityClass: "very-high",
    tags: ["reasoning", "code", "long-context"]
  },
  google: {
    id: "google",
    name: "Google",
    model: "gemini-1.5-flash",
    color: "#4285f4",
    priceIn: 0.075,
    priceOut: 0.30,
    speedClass: "very-fast",
    qualityClass: "high",
    tags: ["multimodal", "long-context", "cheap"]
  },
  groq: {
    id: "groq",
    name: "Groq",
    model: "llama-3.1-70b",
    color: "#f97316",
    priceIn: 0.59,
    priceOut: 0.79,
    speedClass: "ultra-fast",
    qualityClass: "high",
    tags: ["fastest", "open-weights"]
  }
};

export const PROVIDER_IDS = Object.keys(PROVIDERS);