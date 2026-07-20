/* =========================================================
   Sembrar la colección "productos" en Firestore vía REST.
   Sin dependencias: usa fetch nativo de Node (>=18).

   Uso:
     node seed/seed.mjs

   Requiere que las reglas permitan escritura en /productos
   temporalmente (allow write: if true), o unas credenciales.
   Lee la config desde assets/js/firebase-config.js.
   ========================================================= */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

// --- API key y projectId desde firebase-config.js ---
const cfg = readFileSync(join(root, "assets/js/firebase-config.js"), "utf8");
const apiKey = cfg.match(/apiKey:\s*"([^"]+)"/)[1];
const projectId = cfg.match(/projectId:\s*"([^"]+)"/)[1];

const productos = JSON.parse(readFileSync(join(__dir, "productos.json"), "utf8"));

// --- Convierte un valor JS al formato tipado de Firestore REST ---
function toFsValue(v) {
  if (v === null) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number")
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsValue) } };
  if (typeof v === "object")
    return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toFsValue(x)])) } };
  throw new Error("Tipo no soportado: " + typeof v);
}

const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/productos?key=${apiKey}`;

let ok = 0;
for (const p of productos) {
  const body = JSON.stringify({ fields: toFsValue(p).mapValue.fields });
  const res = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  if (res.ok) { ok++; console.log("✓", p.nombre); }
  else { console.error("✗", p.nombre, res.status, (await res.text()).slice(0, 160)); }
}
console.log(`\nListo: ${ok}/${productos.length} productos creados en el proyecto "${projectId}".`);
