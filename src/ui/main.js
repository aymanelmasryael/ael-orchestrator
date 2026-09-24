/* =========================================================================
   AEL Orchestrator · Main Entry
   ========================================================================= */

import { $, $$, esc } from "../shared/utils/format.js";
import { createAppState } from "./state.js";
import {
  renderStatusStrip, renderPresence, renderProviderGrid,
  renderRouterRules, renderCost, renderKeyList, renderCompareBadge
} from "./rendering.js";
import { log, clearLogs } from "./logging.js";
import { parseContract } from "../domain/contracts/parser.js";
import { compileTs, highlightTs } from "../domain/contracts/compiler.js";
import { renderDiags } from "../domain/contracts/diagnostics.js";
import { PROVIDERS, PROVIDER_IDS } from "../domain/models/Provider.js";
import { createIdentity, persistIdentity, createChannel, postMessage } from "../collaboration/channel.js";
import { createPeerMap, handleMessage, currentActivity, startHeartbeat, setupBeforeUnload } from "../collaboration/presence.js";
import { spawnDemoPeer } from "../collaboration/events.js";
import { compareProviders } from "../application/use-cases/CompareProviders.js";
import { routeAndRun } from "../application/use-cases/RouteRequest.js";
import { saveKey } from "../infrastructure/storage/SecureKeyStore.js";
import { resetLedger } from "../domain/services/CostService.js";
import { pushHistory } from "../infrastructure/storage/PromptHistory.js";
import { truncate } from "../shared/utils/format.js";

const { S } = createAppState();
let contract = parseContract(S.contractSrc);

const ME = createIdentity();
persistIdentity(ME);
const peers = createPeerMap();
const chan = createChannel();

const elements = {
  statusStrip: $("#statusStrip"),
  avatars: $("#avatars"),
  soloHint: $("#soloHint"),
  btnPeer: $("#btnPeer"),
  btnAbout: $("#btnAbout"),
  brandBtn: $("#brandBtn"),
  aboutModal: $("#aboutModal"),
  aboutClose: $("#aboutClose"),
  year: $("#year"),

  taskType: $("#taskType"),
  promptSrc: $("#promptSrc"),
  contractSrc: $("#contractSrc"),
  contractBadge: $("#contractBadge"),
  contractDiags: $("#contractDiags"),
  btnRecompile: $("#btnRecompile"),
  btnDemoMode: $("#btnDemoMode"),
  btnRunAll: $("#btnRunAll"),
  btnRouteAuto: $("#btnRouteAuto"),

  providerGrid: $("#providerGrid"),
  compareBadge: $("#compareBadge"),
  btnClearCompare: $("#btnClearCompare"),

  routerMode: $("#routerMode"),
  rulesList: $("#rulesList"),

  costTotal: $("#costTotal"),
  costBars: $("#costBars"),
  btnResetCost: $("#btnResetCost"),

  keyList: $("#keyList"),

  logStream: $("#logStream"),
  btnClearLogs: $("#btnClearLogs")
};

elements.promptSrc.value = S.promptSrc;
elements.contractSrc.value = S.contractSrc;
elements.taskType.value = S.taskType;
elements.routerMode.value = S.routerMode;

recompileContract();
renderAll();
log("sys", "AEL Orchestrator bootstrapped · multi-provider AI workbench", "orchestrator");
log("ok", `loaded ${PROVIDER_IDS.length} providers · running in DEMO mode (add API keys to go live)`, "orchestrator");
log("sys", "BroadcastChannel online — open a 2nd tab to collaborate", "collab");
log("sys", "workbench by Ayman Elmasry · aymanelmasry.com", "brand");

if (chan) {
  chan.onmessage = e => handleMessage(peers, ME, e.data, log, () => renderPresence(peers, ME, elements), applyRemotePatch);
}
startHeartbeat(peers, ME, m => postMessage(chan, m, ME), () => currentActivity(S, ME), () => renderPresence(peers, ME, elements));
setupBeforeUnload(m => postMessage(chan, m, ME));
postMessage(chan, { type: "hello", focus: null, activity: "observing" }, ME);

function recompileContract() {
  contract = parseContract(S.contractSrc);
  renderDiags(elements.contractDiags, contract.diags, `contract "${contract.name}" compiled · ${contract.fields.length} field(s)`);

  const badge = elements.contractBadge;
  if (contract.diags.length) {
    badge.textContent = contract.diags.length + " error" + (contract.diags.length > 1 ? "s" : "");
    badge.classList.add("err");
  } else {
    badge.textContent = "compiled · " + contract.fields.length + " fields";
    badge.classList.remove("err");
  }
}

function renderAll() {
  renderStatusStrip(S, elements.statusStrip);
  renderProviderGrid(S, elements.providerGrid);
  renderRouterRules(S, elements.rulesList);
  renderCost(S, { total: elements.costTotal, bars: elements.costBars });
  renderKeyList(S, elements.keyList);
  renderCompareBadge(S, elements.compareBadge);
  renderPresence(peers, ME, elements);
}

function onProviderUpdate(providerId, patch) {
  S.providerResults[providerId] = { ...S.providerResults[providerId], ...patch };
  renderProviderGrid(S, elements.providerGrid);
  renderCompareBadge(S, elements.compareBadge);
  renderCost(S, { total: elements.costTotal, bars: elements.costBars });
  renderStatusStrip(S, elements.statusStrip);
}

function applyRemotePatch(patch, who, color) {
  Object.assign(S, patch);
  if (patch.promptSrc != null) elements.promptSrc.value = patch.promptSrc;
  if (patch.contractSrc != null) { elements.contractSrc.value = patch.contractSrc; recompileContract(); }
  if (patch.taskType != null) elements.taskType.value = patch.taskType;
  if (patch.routerMode != null) elements.routerMode.value = patch.routerMode;
  renderAll();
  const pretty = Object.entries(patch).map(([k, v]) => `${k}=${truncate(String(v), 30)}`).join(", ");
  log("sys", `${who} updated ${pretty}`, "collab", who, color);
}

function broadcastPatch(patch) {
  postMessage(chan, { type: "state", patch }, ME);
}

elements.promptSrc.addEventListener("input", e => {
  S.promptSrc = e.target.value;
  broadcastPatch({ promptSrc: S.promptSrc });
});

elements.contractSrc.addEventListener("input", e => {
  S.contractSrc = e.target.value;
  recompileContract();
  broadcastPatch({ contractSrc: S.contractSrc });
});

elements.taskType.addEventListener("change", e => {
  S.taskType = e.target.value;
  broadcastPatch({ taskType: S.taskType });
  log("sys", `task type → ${S.taskType}`, "prompt");
});

elements.btnRecompile.addEventListener("click", () => {
  recompileContract();
  log("sys", "contract recompiled", "contract");
});

elements.btnDemoMode.addEventListener("click", () => {
  S.mockMode = !S.mockMode;
  log("sys", `mode → ${S.mockMode ? "DEMO (mock responses)" : "LIVE (real API calls)"}`, "orchestrator");
  renderStatusStrip(S, elements.statusStrip);
});

elements.btnRunAll.addEventListener("click", async () => {
  if (S.running) return;
  S.running = true;
  elements.btnRunAll.disabled = true;
  elements.btnRouteAuto.disabled = true;

  const request = buildRequest();
  const enabledIds = PROVIDER_IDS.filter(id => S.enabledProviders.has(id));

  log("sys", `running comparison on ${enabledIds.length} provider(s) · task=${request.task}`, "orchestrator");

  for (const id of enabledIds) {
    S.providerResults[id] = { status: "idle", text: "" };
  }
  renderProviderGrid(S, elements.providerGrid);

  pushHistory({ task: request.task, prompt: request.prompt, providers: enabledIds });

  await compareProviders(request, enabledIds, S.ledger, onProviderUpdate);

  S.running = false;
  elements.btnRunAll.disabled = false;
  elements.btnRouteAuto.disabled = false;
  log("ok", `comparison complete · session total ${fmtCostSafe(S.ledger.totalUsd)}`, "orchestrator");
  renderAll();
});

elements.btnRouteAuto.addEventListener("click", async () => {
  if (S.running) return;
  S.running = true;
  elements.btnRunAll.disabled = true;
  elements.btnRouteAuto.disabled = true;

  const request = buildRequest();

  try {
    const decision = await routeAndRun(request, S.routerMode, S.ledger, onProviderUpdate);
    S.lastRoutedTo = decision.providerId;
    log("ok", `auto-route complete · chose ${decision.provider.name}`, "router");
  } catch (err) {}

  S.running = false;
  elements.btnRunAll.disabled = false;
  elements.btnRouteAuto.disabled = false;
  renderAll();
});

elements.routerMode.addEventListener("change", e => {
  S.routerMode = e.target.value;
  broadcastPatch({ routerMode: S.routerMode });
  renderRouterRules(S, elements.rulesList);
  log("sys", `router mode → ${S.routerMode}`, "router");
});

elements.btnResetCost.addEventListener("click", () => {
  resetLedger(S.ledger);
  renderCost(S, { total: elements.costTotal, bars: elements.costBars });
  log("sys", "cost ledger reset", "cost");
});

elements.btnClearCompare.addEventListener("click", () => {
  for (const id of PROVIDER_IDS) {
    S.providerResults[id] = { status: "idle", text: "" };
  }
  renderProviderGrid(S, elements.providerGrid);
  renderCompareBadge(S, elements.compareBadge);
  log("sys", "comparison cleared", "orchestrator");
});

elements.btnClearLogs.addEventListener("click", clearLogs);

elements.providerGrid.addEventListener("click", e => {
  const toggle = e.target.closest("[data-toggle]");
  if (!toggle) return;
  const id = toggle.dataset.toggle;
  if (S.enabledProviders.has(id)) S.enabledProviders.delete(id);
  else S.enabledProviders.add(id);
  renderProviderGrid(S, elements.providerGrid);
  renderStatusStrip(S, elements.statusStrip);
  log("sys", `provider ${PROVIDERS[id].name} → ${S.enabledProviders.has(id) ? "enabled" : "disabled"}`, "orchestrator");
});

elements.keyList.addEventListener("input", e => {
  const id = e.target.dataset.key;
  if (!id) return;
  const val = e.target.value.trim();
  S.apiKeys[id] = val;
  saveKey(id, val);
  renderStatusStrip(S, elements.statusStrip);
  const statusEl = e.target.parentElement.querySelector(".key-status");
  if (statusEl) {
    statusEl.textContent = val ? "set" : "empty";
    statusEl.classList.toggle("ok", !!val);
  }
});

document.addEventListener("focusin", e => {
  const panel = e.target.closest("[data-panel]");
  const key = panel ? panel.dataset.panel : null;
  if (key !== ME.focus) {
    ME.focus = key;
    postMessage(chan, { type: "presence", focus: ME.focus, activity: currentActivity(S, ME) }, ME);
    renderPresence(peers, ME, elements);
  }
});

document.addEventListener("focusout", () => {
  setTimeout(() => {
    if (!document.activeElement || !document.activeElement.closest("[data-panel]")) {
      ME.focus = null;
      postMessage(chan, { type: "presence", focus: null, activity: currentActivity(S, ME) }, ME);
      renderPresence(peers, ME, elements);
    }
  }, 60);
});

elements.btnPeer.addEventListener("click", () => {
  spawnDemoPeer(peers, log, () => renderPresence(peers, ME, elements));
});

function openAbout() { elements.aboutModal.classList.add("open"); }
function closeAbout() { elements.aboutModal.classList.remove("open"); }
elements.btnAbout.addEventListener("click", openAbout);
elements.brandBtn.addEventListener("click", openAbout);
elements.aboutClose.addEventListener("click", closeAbout);
elements.aboutModal.addEventListener("click", e => { if (e.target === elements.aboutModal) closeAbout(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeAbout(); });
elements.year.textContent = new Date().getFullYear();

function buildRequest() {
  return {
    task: S.taskType,
    prompt: S.promptSrc,
    max_tokens: 512,
    temperature: 0.7,
    system: null
  };
}

function fmtCostSafe(x) {
  if (x < 0.0001) return "$" + x.toExponential(2);
  if (x < 1) return "$" + x.toFixed(4);
  return "$" + x.toFixed(3);
}