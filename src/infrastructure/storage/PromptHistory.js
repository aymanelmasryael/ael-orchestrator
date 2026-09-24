/* =========================================================================
   Prompt History — localStorage, capped at 50 entries
   ========================================================================= */

const HISTORY_KEY = "ael-orch-history";
const MAX_ENTRIES = 50;

export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch (_) { return []; }
}

export function pushHistory(entry) {
  const history = loadHistory();
  history.unshift({ ...entry, t: Date.now() });
  while (history.length > MAX_ENTRIES) history.pop();
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }
  catch (_) {}
  return history;
}

export function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); }
  catch (_) {}
}