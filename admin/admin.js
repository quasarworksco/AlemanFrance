/* =========================================================
   Panel Admin — Cars AlemanFrance
   - Login con Firebase Auth (email/contraseña)
   - Verifica admin en la colección admins/{uid}
   - CRUD de productos + bandeja de pedidos (ventas)
   ========================================================= */

import { firebaseConfig, COLECCION, cloudinaryUrl } from "../assets/js/firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc,
  deleteDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const CAT_LABEL = { vehiculos: "Vehículo", repuestos: "Repuesto", caravanas: "Caravana" };
const ICO = {
  box: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>',
  doc: '<svg class="icon" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
  warn: '<svg class="icon" viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>'
};
const ESTADOS = ["nuevo", "pagado", "enviado", "entregado", "cancelado"];
const IMG_FALLBACK = "https://res.cloudinary.com/demo/image/upload/w_800,h_500,c_fill/sample.jpg";

const fmt = (p, m = "USD") => p == null ? "Consultar"
  : new Intl.NumberFormat("es-ES", { style: "currency", currency: m, maximumFractionDigits: 0 }).format(p);

function toast(msg, type = "ok") {
  const t = $("#toast");
  t.textContent = msg; t.className = "toast " + type; t.hidden = false;
  clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 2800);
}

/* =================== AUTENTICACIÓN =================== */
onAuthStateChanged(auth, async (user) => {
  if (!user) return mostrar("login");
  try {
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (!adminDoc.exists()) {
      await signOut(auth);
      mostrar("login");
      loginError(`La cuenta ${user.email} no tiene permisos de administrador.`);
      return;
    }
    $("#userEmail").textContent = user.email;
    mostrar("app");
    cargarProductos();
    cargarPedidos();
  } catch (e) {
    console.error(e);
    loginError("No se pudo verificar el acceso. Revisa las reglas o tu conexión.");
    mostrar("login");
  }
});

function mostrar(vista) {
  $("#loading").hidden = true;
  $("#login").hidden = vista !== "login";
  $("#app").hidden   = vista !== "app";
}
function loginError(msg) {
  const el = $("#loginError");
  if (!msg) { el.hidden = true; return; }
  el.textContent = msg; el.hidden = false;
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError("");
  const btn = $("#loginBtn"); btn.disabled = true; btn.textContent = "Ingresando…";
  try {
    await signInWithEmailAndPassword(auth, $("#email").value.trim(), $("#password").value);
  } catch (err) {
    const map = {
      "auth/invalid-credential": "Correo o contraseña incorrectos.",
      "auth/invalid-email": "Correo no válido.",
      "auth/user-not-found": "No existe una cuenta con ese correo.",
      "auth/wrong-password": "Contraseña incorrecta.",
      "auth/too-many-requests": "Demasiados intentos. Inténtalo más tarde."
    };
    loginError(map[err.code] || ("Error: " + err.code));
  } finally {
    btn.disabled = false; btn.textContent = "Ingresar";
  }
});

$("#logoutBtn").addEventListener("click", () => signOut(auth));

/* =================== TABS =================== */
$$(".admin-tabs .tab").forEach(tab => tab.addEventListener("click", () => {
  $$(".admin-tabs .tab").forEach(t => t.classList.remove("is-active"));
  tab.classList.add("is-active");
  $$(".panel").forEach(p => p.hidden = p.dataset.panel !== tab.dataset.tab);
}));

/* =================== PRODUCTOS =================== */
function imgProd(p) {
  const src = p.imagenId ? cloudinaryUrl(p.imagenId) : (p.imagen ? cloudinaryUrl(p.imagen) : IMG_FALLBACK);
  return src;
}

async function cargarProductos() {
  const cont = $("#prodList");
  cont.innerHTML = `<div class="empty"><div class="spinner"></div></div>`;
  try {
    let snap;
    try { snap = await getDocs(query(collection(db, COLECCION), orderBy("nombre"))); }
    catch { snap = await getDocs(collection(db, COLECCION)); }
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    $("#prodCount").textContent = items.length;
    if (!items.length) {
      cont.innerHTML = `<div class="empty">${ICO.box}No hay productos. Crea el primero.</div>`;
      return;
    }
    cont.innerHTML = items.map(p => `
      <article class="padmin ${p.origen === "fr" ? "fr" : "de"}">
        <div class="padmin__media">
          <img src="${imgProd(p)}" alt="${esc(p.nombre)}" loading="lazy" onerror="this.src='${IMG_FALLBACK}'">
          <span class="padmin__tag">${CAT_LABEL[p.categoria] || "Producto"}<span class="flag flag--${p.origen === "fr" ? "fr" : "de"}"></span></span>
        </div>
        <div class="padmin__body">
          <h3>${esc(p.nombre)}</h3>
          <p>${esc(p.descripcion || "")}</p>
          <span class="padmin__price">${fmt(p.precio, p.moneda)}</span>
          <div class="padmin__actions">
            <button data-edit="${p.id}">Editar</button>
            <button class="del" data-del="${p.id}">Eliminar</button>
          </div>
        </div>
      </article>`).join("");

    // cache para edición
    cont._items = Object.fromEntries(items.map(p => [p.id, p]));
    $$("[data-edit]", cont).forEach(b => b.onclick = () => abrirModal(cont._items[b.dataset.edit]));
    $$("[data-del]", cont).forEach(b => b.onclick = () => borrarProducto(b.dataset.del, cont._items[b.dataset.del]?.nombre));
  } catch (e) {
    console.error(e);
    cont.innerHTML = `<div class="empty">${ICO.warn}Error al cargar productos.</div>`;
  }
}

/* ---- Modal producto ---- */
const modal = $("#prodModal");
function abrirModal(p = null) {
  $("#prodError").hidden = true;
  $("#modalTitle").textContent = p ? "Editar producto" : "Nuevo producto";
  $("#prodId").value        = p?.id || "";
  $("#f_nombre").value      = p?.nombre || "";
  $("#f_categoria").value   = p?.categoria || "vehiculos";
  $("#f_origen").value      = p?.origen || "de";
  $("#f_descripcion").value = p?.descripcion || "";
  $("#f_precio").value      = p?.precio ?? "";
  $("#f_moneda").value      = p?.moneda || "USD";
  $("#f_imagen").value      = p?.imagenId || p?.imagen || "";
  modal.hidden = false;
}
function cerrarModal() { modal.hidden = true; }
$("#nuevoProd").onclick = () => abrirModal();
$$("[data-close]", modal).forEach(el => el.onclick = cerrarModal);

$("#prodForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#prodError"); err.hidden = true;
  const btn = $("#saveProd"); btn.disabled = true; btn.textContent = "Guardando…";
  const id = $("#prodId").value;
  const imagen = $("#f_imagen").value.trim();
  const data = {
    nombre: $("#f_nombre").value.trim(),
    categoria: $("#f_categoria").value,
    origen: $("#f_origen").value,
    descripcion: $("#f_descripcion").value.trim(),
    precio: $("#f_precio").value === "" ? null : Number($("#f_precio").value),
    moneda: $("#f_moneda").value,
    // Si parece publicId de Cloudinary (sin http) lo guardamos como imagenId
    ...(imagen && !/^https?:\/\//i.test(imagen) ? { imagenId: imagen, imagen: null } : { imagen: imagen || null, imagenId: null }),
    updatedAt: serverTimestamp()
  };
  try {
    if (id) {
      await updateDoc(doc(db, COLECCION, id), data);
      toast("Producto actualizado");
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, COLECCION), data);
      toast("Producto creado");
    }
    cerrarModal();
    cargarProductos();
  } catch (ex) {
    console.error(ex);
    err.textContent = "No se pudo guardar. ¿Tu cuenta es admin y las reglas permiten escritura?";
    err.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = "Guardar";
  }
});

async function borrarProducto(id, nombre) {
  if (!confirm(`¿Eliminar "${nombre || "este producto"}"? Esta acción no se puede deshacer.`)) return;
  try {
    await deleteDoc(doc(db, COLECCION, id));
    toast("Producto eliminado");
    cargarProductos();
  } catch (e) {
    console.error(e);
    toast("No se pudo eliminar", "err");
  }
}

/* =================== PEDIDOS =================== */
let PEDIDOS = [];
let FILTRO_PED = "todos";

async function cargarPedidos() {
  const cont = $("#pedList");
  cont.innerHTML = `<div class="empty"><div class="spinner"></div></div>`;
  try {
    let snap;
    try { snap = await getDocs(query(collection(db, "pedidos"), orderBy("createdAt", "desc"))); }
    catch { snap = await getDocs(collection(db, "pedidos")); }
    PEDIDOS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const nuevos = PEDIDOS.filter(p => p.estado === "nuevo").length;
    const badge = $("#pedidosBadge");
    if (nuevos > 0) { badge.textContent = nuevos; badge.hidden = false; } else badge.hidden = true;
    pintarPedidos();
  } catch (e) {
    console.error(e);
    cont.innerHTML = `<div class="empty">${ICO.warn}Error al cargar pedidos.</div>`;
  }
}

function pintarPedidos() {
  const cont = $("#pedList");
  const lista = FILTRO_PED === "todos" ? PEDIDOS : PEDIDOS.filter(p => p.estado === FILTRO_PED);
  $("#pedCount").textContent = lista.length;
  if (!lista.length) {
    cont.innerHTML = `<div class="empty">${ICO.doc}No hay pedidos${FILTRO_PED !== "todos" ? " con este estado" : " todavía"}.</div>`;
    return;
  }
  cont.innerHTML = lista.map(pedidoHTML).join("");
  $$("[data-estado-sel]", cont).forEach(sel => sel.onchange = () => cambiarEstado(sel.dataset.estadoSel, sel.value));
}

function pedidoHTML(p) {
  const items = Array.isArray(p.items) ? p.items : [];
  const fecha = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString("es-ES") : "";
  const cli = p.cliente || {};
  return `
    <article class="ped">
      <div class="ped__head">
        <span class="ped__cliente">${esc(cli.nombre || "Cliente")}
          <span class="pill-estado e-${p.estado}">${p.estado}</span></span>
        <span class="ped__meta">${esc(cli.email || "")} ${cli.telefono ? "· " + esc(cli.telefono) : ""}</span>
        <span class="ped__meta">${fecha}</span>
        <ul class="ped__items">
          ${items.map(it => `<li>• ${it.cantidad || 1}× ${esc(it.nombre || "")} — ${fmt(it.precio, p.moneda)}</li>`).join("")}
        </ul>
      </div>
      <div class="ped__right">
        <span class="ped__total">${fmt(p.total, p.moneda)}</span>
        <select class="ped__estado" data-estado-sel="${p.id}">
          ${ESTADOS.map(e => `<option value="${e}" ${e === p.estado ? "selected" : ""}>${e}</option>`).join("")}
        </select>
      </div>
    </article>`;
}

async function cambiarEstado(id, estado) {
  try {
    await updateDoc(doc(db, "pedidos", id), { estado, updatedAt: serverTimestamp() });
    const ped = PEDIDOS.find(p => p.id === id); if (ped) ped.estado = estado;
    toast(`Pedido actualizado a "${estado}"`);
    const nuevos = PEDIDOS.filter(p => p.estado === "nuevo").length;
    const badge = $("#pedidosBadge");
    if (nuevos > 0) { badge.textContent = nuevos; badge.hidden = false; } else badge.hidden = true;
    pintarPedidos();
  } catch (e) {
    console.error(e);
    toast("No se pudo actualizar el estado", "err");
  }
}

$$("#filtrosEstado .chip").forEach(chip => chip.onclick = () => {
  $$("#filtrosEstado .chip").forEach(c => c.classList.remove("is-active"));
  chip.classList.add("is-active");
  FILTRO_PED = chip.dataset.estado;
  pintarPedidos();
});

/* =================== util =================== */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
