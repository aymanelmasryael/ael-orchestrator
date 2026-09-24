/* =========================================================================
   Peer Presence
   ========================================================================= */

export function createPeerMap() { return new Map(); }

export function currentActivity(state, me) {
  if (state.running) return "running comparison";
  if (me.focus === "prompt") return "editing prompt";
  if (me.focus === "keys") return "managing API keys";
  if (me.focus === "router") return "tuning router";
  return "observing";
}

export function handleMessage(peers, me, m, logFn, renderPresenceFn, applyRemotePatchFn) {
  if (!m || m.from === me.id) return;

  if (m.type === "bye") {
    peers.delete(m.from);
    renderPresenceFn();
    return;
  }

  if (m.type === "presence" || m.type === "hello") {
    const existing = peers.get(m.from);
    peers.set(m.from, {
      id: m.from, name: m.name, color: m.color, focus: m.focus || null,
      activity: m.activity || "idle", lastSeen: Date.now(), demo: false
    });
    if (!existing && m.type === "hello") {
      logFn("sys", `peer ${m.name} joined the session`, "collab");
    }
    renderPresenceFn();
    return;
  }

  if (m.type === "state") { applyRemotePatchFn(m.patch, m.name, m.color); return; }
  if (m.type === "log")   { logFn(m.level || "info", m.msg, m.src || "peer", m.name, m.color); return; }
}

export function startHeartbeat(peers, me, postFn, getActivityFn, renderPresenceFn) {
  setInterval(() => {
    postFn({ type: "presence", focus: me.focus, activity: getActivityFn() });
    const now = Date.now();
    let dirty = false;
    for (const [id, p] of peers) {
      if (!p.demo && now - p.lastSeen > 5200) { peers.delete(id); dirty = true; }
    }
    if (dirty) renderPresenceFn();
  }, 1600);
}

export function setupBeforeUnload(postFn) {
  window.addEventListener("beforeunload", () => postFn({ type: "bye" }));
}