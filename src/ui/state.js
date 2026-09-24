/* =========================================================================
   Application State
   ========================================================================= */

import { DEFAULT_PROMPT, DEFAULT_CONTRACT } from "../domain/models/Prompt.js";
import { PROVIDER_IDS } from "../domain/models/Provider.js";
import { parseContract } from "../domain/contracts/parser.js";
import { createCostLedger } from "../domain/services/CostService.js";
import { loadAllKeys } from "../infrastructure/storage/SecureKeyStore.js";

export function createAppState() {
  const S = {
    taskType: "general",
    promptSrc: DEFAULT_PROMPT,
    contractSrc: DEFAULT_CONTRACT,

    enabledProviders: new Set(PROVIDER_IDS),
    providerResults: {},
    mockMode: true,

    routerMode: "balanced",
    lastRoutedTo: null,

    apiKeys: loadAllKeys(PROVIDER_IDS),

    ledger: createCostLedger(),

    running: false
  };

  for (const id of PROVIDER_IDS) {
    S.providerResults[id] = { status: "idle", text: "" };
  }

  const contract = parseContract(S.contractSrc);

  return { S, contract };
}