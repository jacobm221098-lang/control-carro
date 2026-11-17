// ============================================================
//  TIPOS de mantenimiento + intervalos por defecto
//  km = cada cuántos kilómetros; meses = cada cuántos meses.
//  (Valores típicos; luego se pueden hacer configurables.)
// ============================================================
const TIPOS = {
  aceite:  { nombre: "Cambio de aceite", icono: "🛢️", km: 5000,  meses: 6  },
  llantas: { nombre: "Llantas",          icono: "🛞", km: 40000, meses: 48 },
  frenos:  { nombre: "Frenos",           icono: "🛑", km: 20000, meses: 24 },
  bujias:  { nombre: "Bujías",           icono: "⚡", km: 30000, meses: 36 },
  rtv:     { nombre: "Revisión Técnica", icono: "📋", km: null,  meses: 12 },
  otro:    { nombre: "Otro",             icono: "🔧", km: null,  meses: null },
};
const ORDEN_PROX = ["aceite", "llantas", "frenos", "bujias", "rtv"]; // "otro" no tiene alerta

// ---------- DOM ----------
const bienvenida = document.getElementById("bienvenida");
const appEl      = document.getElementById("app");
const selCarro   = document.getElementById("sel-carro");
const panelCarro = document.getElementById("panel-carro");
const carroNombre= document.getElementById("carro-nombre");
const carroPlaca = document.getElementById("carro-placa");
const inKm       = document.getElementById("in-km");
const proximosEl = document.getElementById("proximos");
const historialEl= document.getElementById("historial");

// Modales
const carroModal = document.getElementById("carro-modal");
const mantModal  = document.getElementById("mant-modal");
const mTipo      = document.getElementById("m-tipo");

// ---------- Estado ----------
let userId = null;
let carros = [];
let carroActual = null;
let mantenimientos = [];

const km = (n) => Number(n || 0).toLocaleString("es-CR");
const colones = (n) => "₡" + Number(n || 0).toLocaleString("es-CR");

// Opciones del tipo en el modal de mantenimiento
Object.keys(TIPOS).forEach((k) => {
  const o = document.createElement("option");
  o.value = k; o.textContent = `${TIPOS[k].icono} ${TIPOS[k].nombre}`;
  mTipo.appendChild(o);
});

// ============================================================
//  Sesión: mostrar app o bienvenida
// ============================================================
document.addEventListener("sesion-cambiada", (e) => {
  userId = e.detail.sesion?.user?.id || null;
  if (userId) {
    bienvenida.hidden = true; appEl.hidden = false;
    cargarCarros();
  } else {
    bienvenida.hidden = false; appEl.hidden = true;
    carros = []; carroActual = null;
  }
});

// ============================================================
//  Cargar carros del usuario
// ============================================================
async function cargarCarros() {
  const { data, error } = await supaClient.from("carros").select("*").order("created_at");
  if (error) { console.warn(error.message); return; }
  carros = data || [];

  selCarro.innerHTML = "";
  carros.forEach((c) => {
    const o = document.createElement("option");
    o.value = c.id; o.textContent = `${c.marca} ${c.modelo}${c.anio ? " " + c.anio : ""}`;
    selCarro.appendChild(o);
  });

  if (carros.length === 0) {
    panelCarro.hidden = true;
    proximosEl.innerHTML = "";
    historialEl.innerHTML = `<p class="vacio">Todavía no agregaste ningún carro. Dale a “+ Agregar carro”.</p>`;
    historialEl.parentElement && (historialEl.hidden = false);
    return;
  }
  const idPrevio = carroActual?.id;
  const sigue = carros.find((c) => c.id === idPrevio);
  await seleccionarCarro(sigue ? sigue.id : carros[0].id);
}

async function seleccionarCarro(id) {
  carroActual = carros.find((c) => c.id == id);
  if (!carroActual) return;
  selCarro.value = carroActual.id;
  panelCarro.hidden = false;
  carroNombre.textContent = `${carroActual.marca} ${carroActual.modelo}${carroActual.anio ? " " + carroActual.anio : ""}`;
  carroPlaca.textContent = carroActual.placa ? `Placa: ${carroActual.placa}` : "";
  inKm.value = carroActual.km_actual || 0;
  await cargarMantenimientos();
}
selCarro.addEventListener("change", () => seleccionarCarro(selCarro.value));

// ============================================================
//  Mantenimientos del carro
// ============================================================
async function cargarMantenimientos() {
  const { data } = await supaClient.from("mantenimientos").select("*").eq("carro_id", carroActual.id);
  mantenimientos = data || [];
  renderProximos();
  renderHistorial();
}

// Calcula el estado de UN tipo según el último registro
function estadoDe(tipoKey) {
  const t = TIPOS[tipoKey];
  const recs = mantenimientos.filter((m) => m.tipo === tipoKey).sort((a, b) => (b.km || 0) - (a.km || 0));
  const ultimo = recs[0];
  if (!ultimo) return { estado: "sin", texto: "Sin registro", det: "Registrá el primero" };

  if (t.km) {
    const prox = (ultimo.km || 0) + t.km;
    const faltan = prox - (carroActual.km_actual || 0);
    const det = `Último a los ${km(ultimo.km)} km · próximo a los ${km(prox)}`;
    if (faltan <= 0)          return { estado: "vencido", texto: `Vencido por ${km(-faltan)} km`, det };
    if (faltan <= t.km * 0.1) return { estado: "pronto",  texto: `Pronto: faltan ${km(faltan)} km`, det };
    return { estado: "ok", texto: `Faltan ${km(faltan)} km`, det };
  }
  if (t.meses) {
    const prox = new Date(ultimo.fecha); prox.setMonth(prox.getMonth() + t.meses);
    const dias = Math.round((prox - new Date()) / 86400000);
    const det = `Último: ${ultimo.fecha} · próximo: ${prox.toISOString().slice(0, 10)}`;
    if (dias <= 0)  return { estado: "vencido", texto: `Vencido hace ${Math.abs(dias)} días`, det };
    if (dias <= 30) return { estado: "pronto",  texto: `Faltan ${dias} días`, det };
    return { estado: "ok", texto: `En ~${Math.round(dias / 30)} meses`, det };
  }
  return { estado: "ok", texto: "Registrado", det: `Último: ${ultimo.fecha}` };
}

function renderProximos() {
  proximosEl.innerHTML = ORDEN_PROX.map((k) => {
    const t = TIPOS[k];
    const s = estadoDe(k);
    const emoji = s.estado === "vencido" ? "🔴" : s.estado === "pronto" ? "🟠" : s.estado === "ok" ? "🟢" : "⚪";
    return `
      <div class="prox-card ${s.estado}">
        <div class="prox-top">${t.icono} ${t.nombre}</div>
        <div class="prox-estado">${emoji} ${s.texto}</div>
        <div class="prox-det">${s.det}</div>
      </div>`;
  }).join("");
}

function renderHistorial() {
  if (mantenimientos.length === 0) {
    historialEl.innerHTML = `<p class="vacio">Sin mantenimientos registrados. Dale a “+ Registrar mantenimiento”.</p>`;
    return;
  }
  const orden = [...mantenimientos].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  historialEl.innerHTML = orden.map((m) => {
    const t = TIPOS[m.tipo] || TIPOS.otro;
    return `
      <div class="mant-item">
        <span class="mant-ico">${t.icono}</span>
        <div class="mant-info">
          <b>${t.nombre}</b>
          <div class="mant-meta">${m.fecha} · ${km(m.km)} km${m.nota ? " · " + m.nota : ""}</div>
        </div>
        ${m.costo ? `<span class="mant-costo">${colones(m.costo)}</span>` : ""}
        <button class="mant-borrar" data-id="${m.id}" type="button" title="Borrar">🗑</button>
      </div>`;
  }).join("");
}

// Borrar mantenimiento
historialEl.addEventListener("click", async (e) => {
  const b = e.target.closest(".mant-borrar");
  if (!b) return;
  if (!confirm("¿Borrar este registro?")) return;
  const { error } = await supaClient.from("mantenimientos").delete().eq("id", b.dataset.id);
  if (error) { alert("No se pudo borrar: " + error.message); return; }
  cargarMantenimientos();
});

// ============================================================
//  Actualizar kilómetros del carro
// ============================================================
document.getElementById("btn-km").addEventListener("click", async () => {
  const nuevo = Number(inKm.value);
  if (!(nuevo >= 0)) return;
  const { error } = await supaClient.from("carros").update({ km_actual: nuevo }).eq("id", carroActual.id);
  if (error) { alert("No se pudo actualizar: " + error.message); return; }
  carroActual.km_actual = nuevo;
  const c = carros.find((x) => x.id === carroActual.id); if (c) c.km_actual = nuevo;
  renderProximos();
});

// ============================================================
//  Modal: agregar carro
// ============================================================
const carroForm = document.getElementById("carro-form");
const carroMsg  = document.getElementById("carro-msg");
document.getElementById("btn-nuevo-carro").addEventListener("click", () => { carroModal.classList.add("abierto"); carroMsg.textContent = ""; });
document.getElementById("carro-cerrar").addEventListener("click", () => carroModal.classList.remove("abierto"));
carroModal.addEventListener("click", (e) => { if (e.target === carroModal) carroModal.classList.remove("abierto"); });

carroForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  carroMsg.textContent = "Guardando…";
  const f = e.target;
  const nuevo = {
    user_id: userId,
    marca: f.marca.value.trim(),
    modelo: f.modelo.value.trim(),
    anio: f.anio.value ? Number(f.anio.value) : null,
    placa: f.placa.value.trim() || null,
    km_actual: Number(f.km_actual.value),
  };
  const { data, error } = await supaClient.from("carros").insert(nuevo).select().single();
  if (error) { carroMsg.style.color = "#dc2626"; carroMsg.textContent = "⚠️ " + error.message; return; }
  f.reset();
  carroModal.classList.remove("abierto");
  carroActual = data;
  await cargarCarros();
});

// ============================================================
//  Modal: registrar mantenimiento
// ============================================================
const mantForm = document.getElementById("mant-form");
const mantMsg  = document.getElementById("mant-msg");
document.getElementById("btn-nuevo-mant").addEventListener("click", () => {
  mantModal.classList.add("abierto"); mantMsg.textContent = "";
  document.getElementById("m-fecha").value = new Date().toISOString().slice(0, 10);
  document.getElementById("m-km").value = carroActual?.km_actual || "";
});
document.getElementById("mant-cerrar").addEventListener("click", () => mantModal.classList.remove("abierto"));
mantModal.addEventListener("click", (e) => { if (e.target === mantModal) mantModal.classList.remove("abierto"); });

mantForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  mantMsg.textContent = "Guardando…";
  const f = e.target;
  const nuevo = {
    carro_id: carroActual.id,
    user_id: userId,
    tipo: f.tipo.value,
    fecha: f.fecha.value,
    km: Number(f.km.value),
    costo: f.costo.value ? Number(f.costo.value) : null,
    nota: f.nota.value.trim() || null,
  };
  const { error } = await supaClient.from("mantenimientos").insert(nuevo);
  if (error) { mantMsg.style.color = "#dc2626"; mantMsg.textContent = "⚠️ " + error.message; return; }
  f.reset();
  mantModal.classList.remove("abierto");
  // Si el km del mantenimiento es mayor al actual, actualizamos el carro
  if (nuevo.km > (carroActual.km_actual || 0)) {
    await supaClient.from("carros").update({ km_actual: nuevo.km }).eq("id", carroActual.id);
    carroActual.km_actual = nuevo.km; inKm.value = nuevo.km;
  }
  cargarMantenimientos();
});
