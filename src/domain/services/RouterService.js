/* =========================================================================
   Smart Router — chooses the best provider per task
   ========================================================================= */

import { PROVIDERS, PROVIDER_IDS } from "../models/Provider.js";

const RULES = {
  general:   { quality: "anthropic", speed: "groq", cost: "google",  balanced: "openai" },
  code:      { quality: "anthropic", speed: "groq", cost: "openai",  balanced: "anthropic" },
  summarize: { quality: "anthropic", speed: "groq", cost: "google",  balanced: "google" },
  translate: { quality: "openai",    speed: "groq", cost: "google",  balanced: "openai" },
  creative:  { quality: "anthropic", speed: "groq", cost: "openai",  balanced: "anthropic" },
  analyze:   { quality: "anthropic", speed: "groq", cost: "google",  balanced: "openai" }
};

export const ROUTER_MODES = [
  { id: "balanced", label: "Balanced",      desc: "Balance quality, speed, and cost" },
  { id: "quality",  label: "Quality",       desc: "Prefer the highest-quality model" },
  { id: "speed",    label: "Speed",         desc: "Minimize latency" },
  { id: "cost",     label: "Cost",          desc: "Minimize spend per request" }
];

export function routeRequest(taskType, mode) {
  const taskRules = RULES[taskType] || RULES.general;
  const chosenId = taskRules[mode] || taskRules.balanced;
  const provider = PROVIDERS[chosenId];
  return {
    providerId: chosenId,
    provider,
    reason: `${mode} → "${taskType}" task → ${provider.name}`
  };
}

export function scoreProvider(providerId, mode) {
  const p = PROVIDERS[providerId];
  if (!p) return 0;

  const speedScore = { "ultra-fast": 1.0, "very-fast": 0.85, fast: 0.7, medium: 0.5 }[p.speedClass] || 0.5;
  const qualityScore = { "very-high": 1.0, high: 0.8, medium: 0.6 }[p.qualityClass] || 0.6;
  const costScore = 1 - Math.min(1, (p.priceIn + p.priceOut) / 20);

  switch (mode) {
    case "quality": return qualityScore;
    case "speed":   return speedScore;
    case "cost":    return costScore;
    default:        return (speedScore + qualityScore + costScore) / 3;
  }
}

export function getAllScores(mode) {
  return PROVIDER_IDS.map(id => ({
    id,
    name: PROVIDERS[id].name,
    score: scoreProvider(id, mode)
  })).sort((a, b) => b.score - a.score);
}