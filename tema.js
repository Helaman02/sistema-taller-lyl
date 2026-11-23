/* =========================================================
   Aplica el tema de fiesta definido en tema-config.js.
   No es necesario editar este archivo para nada: para
   cambiar o quitar el tema, edita solo tema-config.js.
   ========================================================= */
(function () {
  /* Fecha de Pascua (calendario gregoriano, algoritmo de Meeus/Jones/Butcher) */
  function calcularPascua(anio) {
    const a = anio % 19;
    const b = Math.floor(anio / 100);
    const c = anio % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(anio, mes - 1, dia);
  }

  function tercerDomingoDeJunio(anio) {
    const primero = new Date(anio, 5, 1);
    const primerDomingo = primero.getDay() === 0 ? 1 : 1 + (7 - primero.getDay());
    return new Date(anio, 5, primerDomingo + 14);
  }

  function dias(fecha, delta) {
    const r = new Date(fecha);
    r.setDate(r.getDate() + delta);
    return r;
  }

  function enRango(hoy, ini, fin) {
    return hoy >= ini && hoy <= fin;
  }

  /* Decide qué fiesta toca según la fecha de hoy ("" = ninguna) */
  function temaSegunFecha() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const hoy = new Date(anio, ahora.getMonth(), ahora.getDate());

    const pascua = calcularPascua(anio);
    const domingoPadre = tercerDomingoDeJunio(anio);

    if (enRango(hoy, new Date(anio, 11, 31), new Date(anio, 11, 31))) return "ano-nuevo";
    if (enRango(hoy, new Date(anio, 0, 1), new Date(anio, 0, 1))) return "ano-nuevo";
    if (enRango(hoy, new Date(anio, 1, 10), new Date(anio, 1, 14))) return "dia-del-carino";
    if (enRango(hoy, dias(pascua, -7), pascua)) return "semana-santa";
    if (enRango(hoy, new Date(anio, 4, 8), new Date(anio, 4, 10))) return "dia-de-la-madre";
    if (enRango(hoy, dias(domingoPadre, -2), domingoPadre)) return "dia-del-padre";
    if (enRango(hoy, new Date(anio, 8, 1), new Date(anio, 8, 15))) return "fiestas-patrias";
    if (enRango(hoy, new Date(anio, 9, 1), new Date(anio, 9, 31))) return "halloween";
    if (enRango(hoy, new Date(anio, 10, 1), new Date(anio, 10, 2))) return "dia-de-muertos";
    if (enRango(hoy, new Date(anio, 11, 1), new Date(anio, 11, 25))) return "navidad";
    return "";
  }

  /* Extras opcionales: si subes tema-navidad-full.css y .js al repositorio,
     la Navidad se ve "completa" (nieve, luces…). Si no existen, no pasa nada. */
  function cargarExtraNavidad() {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "tema-navidad-full.css";
    document.head.appendChild(css);

    const js = document.createElement("script");
    js.src = "tema-navidad-full.js";
    document.body.appendChild(js);
  }

  function aplicarTema() {
    let tema = typeof TEMA_ACTIVO !== "undefined" ? TEMA_ACTIVO : "";
    if (tema === "auto") tema = temaSegunFecha();
    if (!tema) return;
    document.body.classList.add("tema-" + tema);
    if (tema === "navidad") cargarExtraNavidad();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", aplicarTema);
  } else {
    aplicarTema();
  }
})();
