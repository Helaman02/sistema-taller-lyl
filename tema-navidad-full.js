/* =========================================================
   NAVIDAD COMPLETA — luces, nieve y nieve acumulada.
   Solo actúa si <body> tiene la clase "tema-navidad".
   No necesitas editar este archivo.
   ========================================================= */
(function () {
  if (!document.body.classList.contains("tema-navidad")) return;
  if (document.getElementById("navidadLuces")) return;

  const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Luces ---------- */
  const COLORES = ["#e53935", "#43a047", "#fdd835", "#1e88e5", "#fb8c00"];
  const luces = document.createElement("div");
  luces.id = "navidadLuces";
  luces.className = "navidad-luces";
  luces.setAttribute("aria-hidden", "true");
  document.body.appendChild(luces);

  function pintarLuces() {
    luces.innerHTML = "";
    const cantidad = Math.max(8, Math.ceil(window.innerWidth / 34));
    for (let i = 0; i < cantidad; i++) {
      const foco = document.createElement("span");
      foco.style.setProperty("--c", COLORES[i % COLORES.length]);
      foco.style.animationDelay = (i % 5) * 0.35 + "s";
      luces.appendChild(foco);
    }
  }
  pintarLuces();

  let temporizador;
  window.addEventListener("resize", () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(pintarLuces, 200);
  });

  /* ---------- Nieve acumulada abajo ---------- */
  const suelo = document.createElement("div");
  suelo.className = "navidad-suelo";
  suelo.setAttribute("aria-hidden", "true");
  document.body.appendChild(suelo);

  /* ---------- Nieve cayendo ---------- */
  if (sinMovimiento) return;

  const SIMBOLOS = ["❄", "❅", "❆", "•"];
  const cantidadCopos = window.innerWidth < 700 ? 22 : 46;

  for (let i = 0; i < cantidadCopos; i++) {
    const copo = document.createElement("span");
    copo.className = "navidad-copo";
    copo.setAttribute("aria-hidden", "true");
    copo.textContent = SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)];
    copo.style.left = Math.random() * 100 + "vw";
    copo.style.fontSize = 10 + Math.random() * 14 + "px";
    copo.style.animationDuration = 9 + Math.random() * 11 + "s";
    copo.style.animationDelay = -Math.random() * 18 + "s";
    copo.style.setProperty("--dx", (Math.random() * 80 - 40).toFixed(0) + "px");
    document.body.appendChild(copo);
  }
})();
