/* =========================================================
   Cars AlemanFrance — Lógica principal
   - Carga catálogo desde Firestore (con fallback a datos demo)
   - Optimiza imágenes con Cloudinary
   - Filtros por categoría, menú móvil, año dinámico
   ========================================================= */

import {
  firebaseConfig, COLECCION, firebaseListo, cloudinaryUrl
} from "./firebase-config.js";

const WHATSAPP = "18158217564";

/* ---------- Datos de demostración (fallback) ---------- */
/* categoria: "vehiculos" | "repuestos" | "caravanas" */
const DEMO = [
  {
    nombre: "Mercedes-Benz Clase S 580",
    categoria: "vehiculos",
    descripcion: "Sedán de lujo insignia, motor V8 biturbo, importado desde Stuttgart.",
    precio: 128000, moneda: "USD", origen: "de",
    imagen: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=70"
  },
  {
    nombre: "BMW X7 M60i",
    categoria: "vehiculos",
    descripcion: "SUV premium de tres filas, tracción xDrive y acabados exclusivos.",
    precio: 115000, moneda: "USD", origen: "de",
    imagen: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=70"
  },
  {
    nombre: "Porsche 911 Carrera S",
    categoria: "vehiculos",
    descripcion: "Deportivo europeo icónico, motor flat-6 turbo. Entrega documentada.",
    precio: 142000, moneda: "USD", origen: "de",
    imagen: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=70"
  },
  {
    nombre: "Bugatti — Motor W16 (reacondicionado)",
    categoria: "repuestos",
    descripcion: "Motor de alto desempeño certificado, ideal para restauraciones exclusivas.",
    precio: 89000, moneda: "USD", origen: "fr",
    imagen: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=70"
  },
  {
    nombre: "Caja de transmisión ZF 8HP automática",
    categoria: "repuestos",
    descripcion: "Componente de transmisión de 8 velocidades para gama alta alemana.",
    precio: 6400, moneda: "USD", origen: "de",
    imagen: "https://images.unsplash.com/photo-1537041373298-55c93da85485?auto=format&fit=crop&w=800&q=70"
  },
  {
    nombre: "ECU / Sistema electrónico especializado",
    categoria: "repuestos",
    descripcion: "Unidad de control electrónico programable para motores europeos.",
    precio: 2200, moneda: "USD", origen: "fr",
    imagen: "https://images.unsplash.com/photo-1591290619762-4b7e5c5b9a7b?auto=format&fit=crop&w=800&q=70"
  },
  {
    nombre: "Caravana Hymer B-Klasse ModernComfort",
    categoria: "caravanas",
    descripcion: "Casa rodante premium, totalmente equipada. Venta y alquiler disponible.",
    precio: 98000, moneda: "USD", origen: "de",
    imagen: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=800&q=70"
  },
  {
    nombre: "Autocaravana Pilote Galaxy (Francia)",
    categoria: "caravanas",
    descripcion: "Caravana de lujo francesa con diseño aerodinámico. Alquiler por temporada.",
    precio: 76000, moneda: "USD", origen: "fr",
    imagen: "https://images.unsplash.com/photo-1543465077-db45d34b88a5?auto=format&fit=crop&w=800&q=70"
  }
];

/* ---------- Utilidades ---------- */
const $  = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

const CAT_LABEL = { vehiculos: "Vehículo", repuestos: "Repuesto", caravanas: "Caravana" };

const fmtPrecio = (p, moneda = "USD") =>
  p == null ? "Consultar"
  : new Intl.NumberFormat("es-ES", { style: "currency", currency: moneda, maximumFractionDigits: 0 }).format(p);

function waLink(nombre) {
  const msg = `Hola Cars AlemanFrance, me interesa: ${nombre}. ¿Me dan más información y logística de importación?`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

function resolverImagen(prod) {
  // Acepta: imagen (URL directa) o imagenId (publicId de Cloudinary)
  if (prod.imagenId) return cloudinaryUrl(prod.imagenId);
  if (prod.imagen)   return cloudinaryUrl(prod.imagen);
  return "https://res.cloudinary.com/demo/image/upload/w_800,h_500,c_fill/sample.jpg";
}

/* ---------- Render ---------- */
function cardHTML(prod) {
  const img = resolverImagen(prod);
  const origen = prod.origen === "fr"
    ? '<span class="flag flag--fr" title="Origen Francia"></span>'
    : prod.origen === "de"
      ? '<span class="flag flag--de" title="Origen Alemania"></span>'
      : "";
  return `
    <article class="card glass" data-cat="${prod.categoria || "otros"}">
      <div class="card__media">
        <img src="${img}" alt="${prod.nombre}" loading="lazy"
             onerror="this.src='https://res.cloudinary.com/demo/image/upload/w_800,h_500,c_fill/sample.jpg'">
        <span class="card__badge">${CAT_LABEL[prod.categoria] || "Producto"}</span>
        <span class="card__origin">${origen}</span>
      </div>
      <div class="card__body">
        <h3 class="card__title">${prod.nombre}</h3>
        <p class="card__desc">${prod.descripcion || ""}</p>
        <div class="card__foot">
          <span class="card__price">${fmtPrecio(prod.precio, prod.moneda)}<small>Importación incluida</small></span>
          <a class="btn btn--wa card__wa" href="${waLink(prod.nombre)}" target="_blank" rel="noopener">Cotizar</a>
        </div>
      </div>
    </article>`;
}

let PRODUCTOS = [];
let FILTRO = "all";

function pintarCatalogo() {
  const cont = $("#catalog");
  const lista = FILTRO === "all" ? PRODUCTOS : PRODUCTOS.filter(p => p.categoria === FILTRO);
  if (!lista.length) {
    cont.innerHTML = `<p class="catalog__status glass">No hay productos en esta categoría por el momento.</p>`;
    return;
  }
  cont.innerHTML = lista.map(cardHTML).join("");
}

function setStatus(msg) {
  const el = $("#catalogStatus");
  if (!msg) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = msg;
}

/* ---------- Firestore ---------- */
async function cargarDesdeFirestore() {
  const [{ initializeApp }, { getFirestore, collection, getDocs, query, orderBy }] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")
  ]);

  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);

  let snap;
  try {
    snap = await getDocs(query(collection(db, COLECCION), orderBy("nombre")));
  } catch {
    // La colección puede no tener el campo para ordenar; reintenta sin orden.
    snap = await getDocs(collection(db, COLECCION));
  }
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function initCatalogo() {
  try {
    if (firebaseListo()) {
      PRODUCTOS = await cargarDesdeFirestore();
      if (!PRODUCTOS.length) {
        PRODUCTOS = DEMO;
        setStatus("Firestore conectado, pero la colección está vacía. Mostrando ejemplos.");
      } else {
        setStatus("");
      }
    } else {
      PRODUCTOS = DEMO;
      setStatus("Modo demostración · configura Firebase en assets/js/firebase-config.js para tu inventario real.");
    }
  } catch (err) {
    console.error("[Catálogo] Error al conectar con Firestore:", err);
    PRODUCTOS = DEMO;
    setStatus("No se pudo conectar con Firestore. Mostrando catálogo de demostración.");
  }
  pintarCatalogo();
}

/* ---------- Filtros ---------- */
function initFiltros() {
  $$("#filters .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      $$("#filters .chip").forEach(c => { c.classList.remove("is-active"); c.setAttribute("aria-selected", "false"); });
      chip.classList.add("is-active");
      chip.setAttribute("aria-selected", "true");
      FILTRO = chip.dataset.cat;
      pintarCatalogo();
    });
  });
}

/* ---------- Menú móvil ---------- */
function initMenu() {
  const toggle = $("#navToggle");
  const links  = $("#navLinks");
  toggle?.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$("#navLinks a").forEach(a => a.addEventListener("click", () => {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = new Date().getFullYear();
  initMenu();
  initFiltros();
  initCatalogo();
});
