/* =========================================================================
   Route Request Use-Case — pick the best provider and run it once
   ========================================================================= */

import { routeRequest } from "../../domain/services/RouterService.js";
import { getAdapter } from "./CompareProviders.js";
import { recordCost } from "../../domain/services/CostService.js";
import { MockAdapter } from "../../infrastructure/providers/MockAdapter.js";
import { log } from "../../ui/logging.js";
import { fmtMs, fmtCost } from "../../shared/utils/format.js";
import { PROVIDERS } from "../../domain/models/Provider.js";

export async function routeAndRun(request, mode, ledger, onUpdate) {
  const decision = routeRequest(request.task, mode);
  log("sys", `smart router → ${decision.reason}`, "router");

  const adapter = getAdapter(decision.providerId);
  const isMock = adapter instanceof MockAdapter;

  onUpdate(decision.providerId, { status: "running", mock: isMock });

  try {
    const result = await adapter.send(request, {
      onChunk: (chunk, acc) => onUpdate(decision.providerId, { status: "running", text: acc })
    });

    const cost = recordCost(ledger, decision.providerId, result.inputTokens, result.outputTokens);

    onUpdate(decision.providerId, {
      status: "done",
      text: result.text,
      latencyMs: result.latencyMs,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cost,
      mock: result.mock
    });

    log("ok",
      `routed → ${PROVIDERS[decision.providerId].name} · ${fmtMs(result.latencyMs)} · ${fmtCost(cost)}`,
      "router");

    return decision;
  } catch (err) {
    onUpdate(decision.providerId, { status: "error", error: err.message });
    log("err", `router failed on ${PROVIDERS[decision.providerId].name}: ${err.message}`, "router");
    throw err;
  }
}