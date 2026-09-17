/* =========================================================
   Mismas credenciales que el resto del proyecto (mismo
   proyecto de Supabase).
   ========================================================= */
const SUPABASE_URL = "https://riirajoptvdcosrvpoug.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaXJham9wdHZkY29zcnZwb3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY0NTcsImV4cCI6MjEwNTE0MjQ1N30.xq2i26iv3RW9w89XmIUodMxjq3eJPg7z2USvByxUjP8";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =========================================================
   GUARDIA DE SESIÓN: si no hay sesión iniciada, manda al login
   ========================================================= */
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (!session) window.location.href = "login.html";
});
supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (!session) window.location.href = "login.html";
});
document.getElementById("btnCerrarSesion")?.addEventListener("click", () => {
  supabaseClient.auth.signOut().then(() => (window.location.href = "login.html"));
});

let ordenes = [];
let diasSeleccionados = 30;

const filtroPeriodoEl = document.getElementById("filtroPeriodo");

filtroPeriodoEl.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    filtroPeriodoEl.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    diasSeleccionados = Number(btn.getAttribute("data-dias"));
    calcularYRenderizar();
  });
});

async function cargarOrdenes() {
  const { data, error } = await supabaseClient
    .from("ordenes_servicio")
    .select("created_at, fecha_real_entrega, estado_reparacion, tipo_servicio, es_retrabajo");

  if (error) {
    console.error(error);
    document.getElementById("kpiMttrNota").textContent = "No se pudieron cargar los datos.";
    return;
  }

  ordenes = data || [];
  calcularYRenderizar();
}

function ordenesEnPeriodo() {
  if (!diasSeleccionados) return ordenes;
  const limite = Date.now() - diasSeleccionados * 24 * 60 * 60 * 1000;
  return ordenes.filter((o) => o.created_at && new Date(o.created_at).getTime() >= limite);
}

function calcularYRenderizar() {
  const enPeriodo = ordenesEnPeriodo();

  /* ---- MTTR ---- */
  const entregadas = enPeriodo.filter((o) => o.fecha_real_entrega);
  let mttrTexto = "—";
  let mttrNota = "Sin órdenes entregadas todavía en este periodo.";
  if (entregadas.length > 0) {
    const horasTotales = entregadas.reduce((sum, o) => {
      const horas = (new Date(o.fecha_real_entrega) - new Date(o.created_at)) / (1000 * 60 * 60);
      return sum + Math.max(horas, 0);
    }, 0);
    const horasProm = horasTotales / entregadas.length;
    if (horasProm >= 24) {
      mttrTexto = (horasProm / 24).toFixed(1) + " días";
    } else {
      mttrTexto = horasProm.toFixed(1) + " h";
    }
    mttrNota = `Sobre ${entregadas.length} orden${entregadas.length === 1 ? "" : "es"} entregada${entregadas.length === 1 ? "" : "s"}`;
  }
  document.getElementById("kpiMttr").textContent = mttrTexto;
  document.getElementById("kpiMttrNota").textContent = mttrNota;

  /* ---- Tasa de re-trabajos ---- */
  const totalPeriodo = enPeriodo.length;
  const retrabajos = enPeriodo.filter((o) => o.es_retrabajo).length;
  const tasa = totalPeriodo > 0 ? (retrabajos / totalPeriodo) * 100 : 0;
  document.getElementById("kpiRetrabajo").textContent = totalPeriodo > 0 ? tasa.toFixed(1) + "%" : "—";
  document.getElementById("kpiRetrabajoNota").textContent =
    totalPeriodo > 0 ? `${retrabajos} de ${totalPeriodo} órdenes` : "Sin órdenes en este periodo";

  /* ---- Totales ---- */
  document.getElementById("kpiTotal").textContent = totalPeriodo;
  document.getElementById("kpiEntregadas").textContent = entregadas.length;

  /* ---- Volumen por tipo de servicio ---- */
  renderVolumenTipos(enPeriodo);
}

function renderVolumenTipos(enPeriodo) {
  const cont = document.getElementById("volumenTipos");

  if (enPeriodo.length === 0) {
    cont.innerHTML = `<p class="empty-state">No hay órdenes registradas en este periodo.</p>`;
    return;
  }

  const conteos = {};
  enPeriodo.forEach((o) => {
    const tipo = o.tipo_servicio || "Sin clasificar";
    conteos[tipo] = (conteos[tipo] || 0) + 1;
  });

  const entradas = Object.entries(conteos).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entradas.map(([, n]) => n));

  cont.innerHTML = entradas
    .map(([tipo, n]) => {
      const pct = max > 0 ? (n / max) * 100 : 0;
      return `
        <div class="bar-row">
          <span class="bar-label">${tipo}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span class="bar-count">${n}</span>
        </div>`;
    })
    .join("");
}

cargarOrdenes();
