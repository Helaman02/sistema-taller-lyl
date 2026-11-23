/* =========================================================
   MENÚ DE 3 BARRAS — se agrega solo en cada pantalla.
   Para agregar o quitar un acceso del menú, edita la lista
   ITEMS_MENU de abajo (es el único lugar donde está).
   Debe cargarse ANTES que los demás scripts de la página
   (el botón "Cerrar sesión" del menú usa id="btnCerrarSesion",
   que los otros scripts ya conectan).
   ========================================================= */
(function () {
  const ITEMS_MENU = [
    { href: "index.html", texto: "📝 Nueva orden (Recepción)" },
    { href: "panel-tecnico.html", texto: "⚙️ Panel de taller" },
    { href: "panel-impresoras.html", texto: "🖨️ Panel de impresoras" },
    { href: "panel-entregados.html", texto: "✅ Equipos entregados" },
    { href: "panel-cobros.html", texto: "💵 Panel de cobros" },
    { href: "panel-kpis.html", texto: "📊 Indicadores (KPIs)" },
  ];

  const paginaActual = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  const items = ITEMS_MENU.map((it) => {
    const actual = it.href.toLowerCase() === paginaActual;
    return actual
      ? `<span class="menu-item is-current" aria-current="page">${it.texto}</span>`
      : `<a class="menu-item" href="${it.href}">${it.texto}</a>`;
  }).join("");

  document.body.classList.add("tiene-menu");
  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <button type="button" class="menu-btn" id="menuBtn" aria-label="Abrir menú" aria-expanded="false" aria-controls="menuDrawer">
      <span></span><span></span><span></span>
    </button>
    <div class="menu-overlay" id="menuOverlay"></div>
    <nav class="menu-drawer" id="menuDrawer" aria-label="Menú principal" aria-hidden="true">
      <div class="menu-drawer__head">
        <img src="logo.jpg" alt="">
        <div><strong>Accesorios L&amp;L</strong><small>Sistema de taller</small></div>
        <button type="button" class="menu-drawer__close" id="menuCerrar" aria-label="Cerrar menú">✕</button>
      </div>
      ${items}
      <button type="button" class="menu-drawer__logout" id="btnCerrarSesion">Cerrar sesión</button>
    </nav>`
  );

  const btn = document.getElementById("menuBtn");
  const overlay = document.getElementById("menuOverlay");
  const drawer = document.getElementById("menuDrawer");

  function abrir() {
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");
  }
  function cerrar() {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");
  }

  btn.addEventListener("click", () => (drawer.classList.contains("is-open") ? cerrar() : abrir()));
  overlay.addEventListener("click", cerrar);
  document.getElementById("menuCerrar").addEventListener("click", cerrar);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrar();
  });
})();
