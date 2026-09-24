/* =========================================================================
   Compare Providers Use-Case
   ========================================================================= */

import { PROVIDERS } from "../../domain/models/Provider.js";
import { recordCost } from "../../domain/services/CostService.js";
import { MockAdapter } from "../../infrastructure/providers/MockAdapter.js";
import { OpenAIAdapter } from "../../infrastructure/providers/OpenAIAdapter.js";
import { AnthropicAdapter } from "../../infrastructure/providers/AnthropicAdapter.js";
import { GoogleAdapter } from "../../infrastructure/providers/GoogleAdapter.js";
import { GroqAdapter } from "../../infrastructure/providers/GroqAdapter.js";
import { loadKey } from "../../infrastructure/storage/SecureKeyStore.js";
import { log } from "../../ui/logging.js";
import { fmtMs, fmtCost } from "../../shared/utils/format.js";

const ADAPTERS = {
  openai: OpenAIAdapter,
  anthropic: AnthropicAdapter,
  google: GoogleAdapter,
  groq: GroqAdapter
};

export function getAdapter(providerId) {
  const config = PROVIDERS[providerId];
  if (!config) return null;
  const apiKey = loadKey(providerId);
  const AdapterClass = ADAPTERS[providerId];

  if (apiKey && AdapterClass) return new AdapterClass(providerId, config, apiKey);
  return new MockAdapter(providerId, config, apiKey);
}

export async function compareProviders(request, enabledIds, ledger, onUpdate) {
  const tasks = enabledIds.map(async (id) => {
    const adapter = getAdapter(id);
    if (!adapter) {
      onUpdate(id, { status: "error", error: "no adapter" });
      return;
    }

    const isMock = adapter instanceof MockAdapter;
    onUpdate(id, { status: "running", mock: isMock });
    log("info", `→ ${PROVIDERS[id].name}${isMock ? " (mock)" : ""} · ${request.prompt.length} chars`, "orchestrator");

    try {
      const result = await adapter.send(request, {
        onChunk: (chunk, acc) => {
          onUpdate(id, { status: "running", text: acc });
        }
      });

      const cost = recordCost(ledger, id, result.inputTokens, result.outputTokens);

      onUpdate(id, {
        status: "done",
        text: result.text,
        latencyMs: result.latencyMs,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cost,
        mock: result.mock
      });

      log("ok",
        `← ${PROVIDERS[id].name} · ${fmtMs(result.latencyMs)} · ${result.outputTokens} tokens · ${fmtCost(cost)}${isMock ? " (mock)" : ""}`,
        "orchestrator");
    } catch (err) {
      onUpdate(id, { status: "error", error: err.message });
      log("err", `${PROVIDERS[id].name}: ${err.message}`, "orchestrator");
    }
  });

  await Promise.all(tasks);
}

export { MockAdapter };