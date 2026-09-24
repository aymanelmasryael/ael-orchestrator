/* =========================================================================
   Contract DSL Parser
   Supports:  enum(a,b,c) sugar · = default @decorator · bare identifiers
   ========================================================================= */

const KNOWN_TYPES = ["string", "int", "float", "bool", "any", "json"];

export function parseContract(src) {
  const diags = [];
  const fields = [];
  let name = "Contract";
  let depth = 0;
  const lines = src.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\/\/.*$/, "").trim();
    if (!line) continue;

    if (depth === 0) {
      const m = line.match(/^contract\s+([A-Za-z_]\w*)\s*\{$/);
      if (!m) { diags.push({ line: i + 1, sev: "error", msg: "expected `contract <Name> {`" }); continue; }
      name = m[1]; depth = 1; continue;
    }
    if (line === "}") { depth = 0; continue; }
    const f = parseField(line, i + 1, diags);
    if (f) fields.push(f);
  }
  if (depth !== 0) diags.push({ line: lines.length, sev: "error", msg: "unclosed contract block — missing `}`" });
  if (!fields.length && !diags.length) diags.push({ line: 1, sev: "error", msg: "contract declares no fields" });
  return { name, fields, diags };
}

function parseField(line, ln, diags) {
  const m = line.match(/^([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*)\s*(\[\])?\s*(\?)?\s*(.*)$/);
  if (!m) { diags.push({ line: ln, sev: "error", msg: `cannot parse field: "${line}"` }); return null; }
  const [, fname, base, arr, opt, rest] = m;

  let actualType = base;
  const injectedDecos = [];

  // enum(a, b, c)  →  string @enum(a, b, c)
  if (base === "enum") {
    const em = rest.match(/^\(([^)]*)\)\s*(.*)$/);
    if (em) {
      const values = em[1].split(",").map(s => s.trim()).filter(Boolean);
      injectedDecos.push({ name: "enum", args: values });
      actualType = "string";
      return finishParseField(fname, actualType, !!arr, !!opt, em[2].trim(), injectedDecos, ln, diags);
    } else {
      diags.push({ line: ln, sev: "error", msg: `enum type requires parentheses: enum(a,b,c)` });
      return null;
    }
  }

  if (!KNOWN_TYPES.includes(base)) {
    diags.push({ line: ln, sev: "error", msg: `unknown type "${base}" (expected ${KNOWN_TYPES.join(" | ")})` });
  }

  return finishParseField(fname, actualType, !!arr, !!opt, rest, injectedDecos, ln, diags);
}

function finishParseField(fname, base, isArray, isOptional, rest, injectedDecos, ln, diags) {
  const field = {
    name: fname,
    type: base,
    array: isArray,
    optional: isOptional,
    decos: [...injectedDecos],
    def: undefined,
    line: ln
  };

  let decoPart = rest;
  const eq = rest.indexOf("=");

  if (eq >= 0) {
    const beforeEq = rest.slice(0, eq).trim();
    const afterEq  = rest.slice(eq + 1).trim();

    // Split default value from trailing decorators at first '@'
    const atIdx = afterEq.indexOf("@");
    const valueStr = atIdx >= 0 ? afterEq.slice(0, atIdx).trim() : afterEq;
    const decoStr  = atIdx >= 0 ? afterEq.slice(atIdx) : "";

    decoPart = (beforeEq + " " + decoStr).trim();

    if (/^-?\d+(\.\d+)?$/.test(valueStr)) {
      field.def = parseFloat(valueStr);
    } else if (valueStr === "true" || valueStr === "false") {
      field.def = valueStr === "true";
    } else if (valueStr === "null") {
      field.def = null;
    } else if (/^".*"$/.test(valueStr)) {
      field.def = valueStr.slice(1, -1);
    } else if (/^[A-Za-z_]\w*$/.test(valueStr)) {
      // Bare identifier (typical for enum defaults) → treat as string
      field.def = valueStr;
    } else {
      try { field.def = JSON.parse(valueStr); }
      catch (_) { diags.push({ line: ln, sev: "error", msg: `invalid default "${valueStr}"` }); }
    }
  }

  const re = /@(\w+)(?:\(([^)]*)\))?/g;
  let dm;
  while ((dm = re.exec(decoPart))) {
    const args = dm[2] ? dm[2].split(",").map(s => s.trim()).filter(Boolean) : [];
    field.decos.push({ name: dm[1], args });
  }

  return field;
}
