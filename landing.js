// ============================================================
//  LANDING interactiva: el carro baja por la carretera y las
//  tarjetas de "problemas que resolvemos" aparecen al hacer scroll.
// ============================================================
(function () {
  const viaje  = document.getElementById("viaje");
  const carro  = document.getElementById("carroRoad");
  const paradas = document.querySelectorAll(".parada");

  // Aparecer cada tarjeta cuando entra en pantalla
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.25 });
    paradas.forEach((p) => io.observe(p));
  } else {
    paradas.forEach((p) => p.classList.add("visible"));
  }

  // Mover el carro según cuánto hayas scrolleado dentro del "viaje"
  function moverCarro() {
    if (!viaje || !carro) return;
    const rect = viaje.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height || 1;
    let prog = (vh * 0.45 - rect.top) / total; // 0 arriba, 1 abajo
    prog = Math.min(Math.max(prog, 0), 1);
    carro.style.top = (prog * 100) + "%";
  }
  window.addEventListener("scroll", moverCarro, { passive: true });
  window.addEventListener("resize", moverCarro);
  moverCarro();

  // Segundo botón "Empezar gratis" (al final) abre el mismo modal
  const b2 = document.getElementById("btn-empezar-2");
  if (b2) b2.addEventListener("click", () => {
    if (typeof setModo === "function") setModo("registro");
    if (typeof abrirModal === "function") abrirModal();
  });
})();
