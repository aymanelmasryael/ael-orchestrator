/* =========================================================================
   Demo Peers
   ========================================================================= */

import { NAMES, COLORS, pick } from "./channel.js";

const DEMO_MESSAGES = [
  "profiled GPT-4o · 842ms · $0.0012",
  "compared 3 providers on code task",
  "switched router mode to quality",
  "checked Claude 3.5 on 4k-token prompt",
  "budget alert: session spent > $0.05",
  "cached prompt template v3",
  "routed summarization to Gemini Flash",
  "exported comparison results to JSON"
];

export function spawnDemoPeer(peers, logFn, renderPresenceFn) {
  const id = "demo-" + Math.random().toString(36).slice(2, 7);
  const p = {
    id, name: pick(NAMES) + "-" + Math.floor(Math.random() * 90 + 10),
    color: pick(COLORS), focus: null, activity: "idle",
    lastSeen: Date.now(), demo: true
  };
  peers.set(id, p);
  logFn("sys", `demo collaborator ${p.name} joined`, "collab", p.name, p.color);
  renderPresenceFn();

  const tick = () => {
    if (!peers.has(id)) return;
    p.focus = pick(["prompt", "compare", "router", "cost", "keys", null]);
    p.lastSeen = Date.now();
    if (Math.random() < 0.4) {
      logFn("info", pick(DEMO_MESSAGES), "collab", p.name, p.color);
    }
    renderPresenceFn();
    setTimeout(tick, 2600 + Math.random() * 4000);
  };
  setTimeout(tick, 1200);
}