/* =========================================================================
   Secure API Key Store — sessionStorage only, never sent to AEL servers
   ========================================================================= */

const KEY_PREFIX = "ael-orch-key-";

export function saveKey(providerId, apiKey) {
  try {
    if (apiKey) sessionStorage.setItem(KEY_PREFIX + providerId, apiKey);
    else sessionStorage.removeItem(KEY_PREFIX + providerId);
  } catch (_) {}
}

export function loadKey(providerId) {
  try { return sessionStorage.getItem(KEY_PREFIX + providerId) || ""; }
  catch (_) { return ""; }
}

export function loadAllKeys(providerIds) {
  const out = {};
  for (const id of providerIds) out[id] = loadKey(id);
  return out;
}

export function clearAllKeys(providerIds) {
  for (const id of providerIds) saveKey(id, "");
}

export function maskKey(key) {
  if (!key) return "";
  if (key.length <= 10) return "•".repeat(key.length);
  return key.slice(0, 6) + "…" + key.slice(-4);
}