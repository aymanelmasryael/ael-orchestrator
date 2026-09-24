/* =========================================================================
   Log Stream
   ========================================================================= */

import { esc } from "../shared/utils/format.js";

let logCount = 0;
const MAX_LOGS = 300;

export function log(level, msg, src = "orchestrator", who = null, color = null) {
  const logStream = document.getElementById("logStream");
  if (!logStream) return;

  const el = document.createElement("div");
  el.className = "log-line " + level;
  const t = new Date().toTimeString().slice(0, 8);
  const whoHtml = who ? `<span class="who" style="color:${color || "#7dd3fc"}">${esc(who)}</span> ` : "";
  el.innerHTML = `<span class="t">${t}</span><span class="s">[${esc(src)}]</span><span class="m">${whoHtml}${esc(msg)}</span>`;
  logStream.appendChild(el);

  if (++logCount > MAX_LOGS) {
    logStream.removeChild(logStream.firstChild);
    logCount--;
  }
  logStream.scrollTop = logStream.scrollHeight;
}

export function clearLogs() {
  const logStream = document.getElementById("logStream");
  if (!logStream) return;
  logStream.innerHTML = "";
  logCount = 0;
}