// ============================================================
//  AUTENTICACIÓN (reusa el patrón de siempre con Supabase)
//  Avisa a app.js con el evento "sesion-cambiada".
// ============================================================
const supa = supaClient;

const authZona   = document.getElementById("auth-zona");
const modal      = document.getElementById("auth-modal");
const modalCerrar= document.getElementById("auth-cerrar");
const form       = document.getElementById("auth-form");
const inEmail    = document.getElementById("auth-email");
const inPass     = document.getElementById("auth-pass");
const lblEmail   = document.querySelector('label[for="auth-email"]');
const lblPass    = document.querySelector('label[for="auth-pass"]');
const msg        = document.getElementById("auth-msg");
const titulo     = document.getElementById("auth-titulo");
const submitBtn  = document.getElementById("auth-submit");
const toggle     = document.getElementById("auth-toggle");
const reset      = document.getElementById("auth-reset");
const btnEmpezar = document.getElementById("btn-empezar");

let modo = "registro";

function abrirModal() {
  if (!SUPABASE_LISTO) { alert("⚙️ Falta conectar Supabase (config.js)."); return; }
  modal.classList.add("abierto"); msg.textContent = "";
}
function cerrarModal() { modal.classList.remove("abierto"); }

function setModo(nuevo) {
  modo = nuevo; msg.textContent = "";
  const esRec = modo === "recuperar";
  lblEmail.style.display = esRec ? "none" : "";
  inEmail.style.display  = esRec ? "none" : "";
  inEmail.required = !esRec;
  reset.style.display = modo === "login" ? "" : "none";
  if (modo === "registro") {
    titulo.textContent = "Crear cuenta"; submitBtn.textContent = "Registrarme";
    toggle.style.display = ""; toggle.innerHTML = "¿Ya tenés cuenta? <b>Iniciá sesión</b>";
  } else if (modo === "login") {
    titulo.textContent = "Iniciar sesión"; submitBtn.textContent = "Entrar";
    toggle.style.display = ""; toggle.innerHTML = "¿Sos nuevo? <b>Creá tu cuenta</b>";
  } else {
    titulo.textContent = "Nueva contraseña"; submitBtn.textContent = "Guardar contraseña";
    lblPass.textContent = "Contraseña nueva"; toggle.style.display = "none";
  }
}

async function enviar(e) {
  e.preventDefault();
  const email = inEmail.value.trim(), pass = inPass.value;
  msg.style.color = "var(--texto)"; msg.textContent = "Procesando…";
  try {
    if (modo === "registro") {
      const { data, error } = await supa.auth.signUp({ email, password: pass });
      if (error) throw error;
      if (data.session) { msg.style.color = "green"; msg.textContent = "✅ ¡Cuenta creada!"; setTimeout(cerrarModal, 800); }
      else { msg.style.color = "green"; msg.textContent = "✅ Revisá tu correo para confirmar."; }
    } else if (modo === "login") {
      const { error } = await supa.auth.signInWithPassword({ email, password: pass });
      if (error) throw error; cerrarModal();
    } else {
      const { error } = await supa.auth.updateUser({ password: pass });
      if (error) throw error; msg.style.color = "green"; msg.textContent = "✅ ¡Contraseña actualizada!"; setTimeout(cerrarModal, 1000);
    }
  } catch (err) { msg.style.color = "#dc2626"; msg.textContent = "⚠️ " + err.message; }
}

async function enviarReset() {
  const email = inEmail.value.trim();
  if (!email) { msg.style.color = "#dc2626"; msg.textContent = "Escribí tu correo arriba y tocá de nuevo."; return; }
  msg.style.color = "var(--texto)"; msg.textContent = "Enviando…";
  const { error } = await supa.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
  if (error) { msg.style.color = "#dc2626"; msg.textContent = "⚠️ " + error.message; return; }
  msg.style.color = "green"; msg.textContent = "📧 Te enviamos un correo. Revisá spam.";
}

function pintarAuth(sesion) {
  if (sesion && sesion.user) {
    const email = sesion.user.email;
    authZona.innerHTML = `
      <div class="user-wrap">
        <button id="avatar-btn" class="avatar-btn" type="button" title="${email}" aria-label="Tu cuenta">👤</button>
        <div id="user-menu" class="user-menu">
          <div class="user-menu-email">${email}</div>
          <button class="user-menu-item" id="btn-salir" type="button">🚪 Cerrar sesión</button>
        </div>
      </div>`;
    const avatar = document.getElementById("avatar-btn");
    const menu = document.getElementById("user-menu");
    avatar.addEventListener("click", (e) => { e.stopPropagation(); menu.classList.toggle("abierto"); });
    document.addEventListener("click", () => menu.classList.remove("abierto"));
    menu.addEventListener("click", (e) => e.stopPropagation());
    document.getElementById("btn-salir").addEventListener("click", async () => { await supa.auth.signOut(); });
  } else {
    authZona.innerHTML = `<button id="btn-cuenta" class="btn-cuenta" type="button">Ingresar</button>`;
    document.getElementById("btn-cuenta").addEventListener("click", () => { setModo("login"); abrirModal(); });
  }
}

if (SUPABASE_LISTO) {
  setModo("registro");
  form.addEventListener("submit", enviar);
  modalCerrar.addEventListener("click", cerrarModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
  toggle.addEventListener("click", () => setModo(modo === "registro" ? "login" : "registro"));
  reset.addEventListener("click", enviarReset);
  if (btnEmpezar) btnEmpezar.addEventListener("click", () => { setModo("registro"); abrirModal(); });

  const avisar = (sesion) => {
    pintarAuth(sesion);
    document.dispatchEvent(new CustomEvent("sesion-cambiada", { detail: { sesion } }));
  };
  supa.auth.getSession().then(({ data }) => avisar(data.session));
  supa.auth.onAuthStateChange((evento, sesion) => {
    if (evento === "PASSWORD_RECOVERY") { setModo("recuperar"); abrirModal(); }
    avisar(sesion);
  });
} else {
  pintarAuth(null);
}
