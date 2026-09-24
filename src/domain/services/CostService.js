/* =========================================================================
   Cost Tracking Service
   ========================================================================= */

import { PROVIDERS } from "../models/Provider.js";

export function createCostLedger() {
  return {
    totalUsd: 0,
    byProvider: {},
    events: []
  };
}

export function recordCost(ledger, providerId, inputTokens, outputTokens) {
  const p = PROVIDERS[providerId];
  if (!p) return 0;

  const cost = (inputTokens / 1e6) * p.priceIn + (outputTokens / 1e6) * p.priceOut;

  ledger.totalUsd += cost;
  ledger.byProvider[providerId] = (ledger.byProvider[providerId] || 0) + cost;
  ledger.events.push({
    t: Date.now(),
    provider: providerId,
    in: inputTokens,
    out: outputTokens,
    usd: cost
  });

  if (ledger.events.length > 200) ledger.events.shift();
  return cost;
}

export function resetLedger(ledger) {
  ledger.totalUsd = 0;
  ledger.byProvider = {};
  ledger.events = [];
}