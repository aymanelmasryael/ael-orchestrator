/* =========================================================================
   DOM Rendering
   ========================================================================= */

import { PROVIDERS, PROVIDER_IDS } from "../domain/models/Provider.js";
import { esc, fmtMs, fmtCost, fmtN, truncate } from "../shared/utils/format.js";
import { ROUTER_MODES } from "../domain/services/RouterService.js";
import { maskKey } from "../infrastructure/storage/SecureKeyStore.js";

const AVATAR_INITIALS = n => n.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase();

export function renderStatusStrip(S, el) {
  const active = PROVIDER_IDS.filter(id => S.providerResults[id].status === "running").length;
  const done = PROVIDER_IDS.filter(id => S.providerResults[id].status === "done").length;
  const keysConfigured = PROVIDER_IDS.filter(id => S.apiKeys[id]).length;

  el.innerHTML = `
    <div class="chip"><span class="lab">mode</span><b style="color:${S.mockMode ? "#fbbf24" : "#34d399"}">${S.mockMode ? "DEMO" : "LIVE"}</b></div>
    <div class="chip"><span class="lab">providers</span><b>${S.enabledProviders.size}/${PROVIDER_IDS.length}</b></div>
    <div class="chip"><span class="lab">keys</span><b style="color:${keysConfigured > 0 ? "#34d399" : "#fbbf24"}">${keysConfigured}/${PROVIDER_IDS.length}</b></div>
    <div class="chip"><span class="lab">running</span><b>${active}</b></div>
    <div class="chip"><span class="lab">done</span><b>${done}</b></div>
    <div class="chip"><span class="lab">session</span><b style="color:#34d399">${fmtCost(S.ledger.totalUsd)}</b></div>
  `;
}

export function renderPresence(peers, ME, elements) {
  const list = Array.from(peers.values());
  const all = [ME, ...list];
  elements.avatars.innerHTML = all.map(p => `
    <div class="avatar ${p === ME ? "self" : ""}" style="--c:${p.color}"
         title="${esc(p.name)}${p === ME ? " (you)" : ""} · ${esc(p.focus || p.activity || "idle")}">
      ${AVATAR_INITIALS(p.name)}
    </div>`).join("");

  elements.soloHint.textContent = list.length
    ? `${list.length} collaborator${list.length > 1 ? "s" : ""} live`
    : "solo session — open a 2nd tab to collaborate";

  document.querySelectorAll("[data-chips]").forEach(node => {
    const key = node.dataset.chips;
    const who = list.filter(p => p.focus === key);
    node.innerHTML = who.map(p =>
      `<div class="peer-chip" style="--c:${p.color}" title="${esc(p.name)}">${AVATAR_INITIALS(p.name)}</div>`
    ).join("");
    const panel = node.closest(".panel");
    if (panel) panel.classList.toggle("peer-focus", who.length > 0);
  });
}

export function renderProviderGrid(S, el) {
  el.innerHTML = PROVIDER_IDS.map(id => {
    const p = PROVIDERS[id];
    const r = S.providerResults[id];
    const enabled = S.enabledProviders.has(id);
    const statusClass = r.status === "idle" ? "" : r.status;

    const metrics = [];
    if (r.latencyMs != null) metrics.push(`<span class="pc-metric">latency <b>${fmtMs(r.latencyMs)}</b></span>`);
    if (r.outputTokens != null) metrics.push(`<span class="pc-metric">tok <b>${r.inputTokens || 0}→${r.outputTokens}</b></span>`);
    if (r.cost != null) metrics.push(`<span class="pc-metric">cost <b style="color:#34d399">${fmtCost(r.cost)}</b></span>`);
    if (r.mock) metrics.push(`<span class="pc-metric" style="color:#fbbf24">MOCK</span>`);

    let body;
    if (r.status === "idle") {
      body = `<span class="placeholder">${enabled ? "Ready — press Run to send prompt" : "Disabled"}</span>`;
    } else if (r.status === "running") {
      body = esc(r.text || "…") + `<span class="cursor"></span>`;
    } else if (r.status === "done") {
      body = esc(r.text);
    } else if (r.status === "error") {
      body = `<span style="color:#fda4af">⚠ ${esc(r.error)}</span>`;
    }

    return `
      <div class="provider-card ${statusClass}" data-pid="${id}">
        <div class="pc-toggle ${enabled ? "" : "off"}" data-toggle="${id}" title="Toggle provider">${enabled ? "●" : "○"}</div>
        <div class="pc-head">
          <div class="pc-logo" style="--c:${p.color}">${p.name[0]}</div>
          <div>
            <div class="pc-name">${p.name}</div>
            <div class="pc-model">${p.model}</div>
          </div>
          <div class="spacer"></div>
          <div class="pc-status ${statusClass}">${r.status}</div>
        </div>
        <div class="pc-body">${body}</div>
        <div class="pc-foot">${metrics.join("")}</div>
      </div>
    `;
  }).join("");
}

export function renderRouterRules(S, el) {
  const rules = ROUTER_MODES.map(m => `
    <div class="rule" style="${m.id === S.routerMode ? "border-color:rgba(0,116,255,.5);background:rgba(0,116,255,.05)" : ""}">
      <span class="k">${m.id}</span>
      <span class="v">${m.desc}</span>
    </div>
  `).join("");
  el.innerHTML = rules;
}

export function renderCost(S, els) {
  els.total.textContent = fmtCost(S.ledger.totalUsd);

  const entries = PROVIDER_IDS
    .map(id => ({ id, name: PROVIDERS[id].name, color: PROVIDERS[id].color, usd: S.ledger.byProvider[id] || 0 }))
    .filter(x => x.usd > 0)
    .sort((a, b) => b.usd - a.usd);

  const maxUsd = Math.max(0.000001, ...entries.map(e => e.usd));

  els.bars.innerHTML = entries.length
    ? entries.map(e => `
      <div class="cost-bar">
        <span class="name">${e.name}</span>
        <span class="track"><i style="width:${(e.usd / maxUsd * 100).toFixed(1)}%;background:${e.color}"></i></span>
        <span class="val">${fmtCost(e.usd)}</span>
      </div>
    `).join("")
    : `<div class="rule"><span class="k">no activity</span><span class="v">run a comparison to see costs</span></div>`;
}

export function renderKeyList(S, el) {
  el.innerHTML = PROVIDER_IDS.map(id => {
    const p = PROVIDERS[id];
    const val = S.apiKeys[id] || "";
    const ok = Boolean(val);
    return `
      <div class="key-row">
        <label><span class="dot-mini" style="--c:${p.color};background:${p.color}"></span>${p.name}</label>
        <div class="key-input-row">
          <input type="password" data-key="${id}" value="${esc(val)}" placeholder="sk-... (optional, mock will be used)" autocomplete="off">
          <span class="key-status ${ok ? "ok" : ""}">${ok ? "set" : "empty"}</span>
        </div>
      </div>
    `;
  }).join("");
}

export function renderCompareBadge(S, el) {
  const running = PROVIDER_IDS.filter(id => S.providerResults[id].status === "running").length;
  const done = PROVIDER_IDS.filter(id => S.providerResults[id].status === "done").length;
  const errors = PROVIDER_IDS.filter(id => S.providerResults[id].status === "error").length;

  if (running > 0) { el.textContent = `running ${running}…`; el.className = "badge running"; }
  else if (errors > 0) { el.textContent = `${done} done · ${errors} err`; el.className = "badge err"; }
  else if (done > 0) { el.textContent = `${done} done`; el.className = "badge"; }
  else { el.textContent = "idle"; el.className = "badge"; }
}