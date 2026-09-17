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

const ESTADOS_PAGO = ["Pendiente", "Pagado parcialmente", "Pagado"];
const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia", "Enlace de pago"];

const ESTADO_PAGO_CLASS = {
  "Pendiente": "badge--pendiente",
  "Pagado parcialmente": "badge--parcial",
  "Pagado": "badge--pagado",
};

let ordenes = [];
let ordenSeleccionada = null;

const listaOrdenesEl = document.getElementById("listaOrdenes");
const detalleEl = document.getElementById("detalle");
const buscadorEl = document.getElementById("buscador");
const filtroEstadoPagoEl = document.getElementById("filtroEstadoPago");

/* ---------------------------------------------------------
   Utilidades de cálculo
--------------------------------------------------------- */
function calcular(o) {
  const revision = Number(o.costo_revision) || 0;
  const manoObra = Number(o.costo_mano_obra) || 0;
  const repuestos = Number(o.costo_repuestos) || 0;
  const impPorc = Number(o.impuesto_porcentaje) || 0;
  const anticipo = Number(o.anticipo) || 0;

  const subtotal = revision + manoObra + repuestos;
  const impMonto = subtotal * (impPorc / 100);
  const total = subtotal + impMonto;
  const saldo = total - anticipo;

  return { subtotal, impMonto, total, saldo };
}

function money(n) {
  return "Q" + (Number(n) || 0).toFixed(2);
}

/* ---------------------------------------------------------
   Carga inicial
--------------------------------------------------------- */
async function cargarOrdenes() {
  const { data, error } = await supabaseClient
    .from("ordenes_servicio")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    listaOrdenesEl.innerHTML = `<p class="empty-orders">No se pudieron cargar las órdenes.</p>`;
    console.error(error);
    return;
  }

  ordenes = data || [];
  renderLista();
}

function renderLista() {
  const texto = buscadorEl.value.trim().toLowerCase();
  const estadoFiltro = filtroEstadoPagoEl.value;

  const filtradas = ordenes.filter((o) => {
    const coincideTexto =
      !texto ||
      (o.nombre_cliente || "").toLowerCase().includes(texto) ||
      (o.numero_ticket || "").toLowerCase().includes(texto) ||
      (o.marca_modelo || "").toLowerCase().includes(texto);
    const coincideEstado = !estadoFiltro || (o.estado_pago || "Pendiente") === estadoFiltro;
    return coincideTexto && coincideEstado;
  });

  if (filtradas.length === 0) {
    listaOrdenesEl.innerHTML = `<p class="empty-orders">No hay órdenes que coincidan.</p>`;
    return;
  }

  listaOrdenesEl.innerHTML = filtradas
    .map((o) => {
      const estadoPago = o.estado_pago || "Pendiente";
      const badgeClass = ESTADO_PAGO_CLASS[estadoPago] || "badge--pendiente";
      const { total } = calcular(o);
      const activa = ordenSeleccionada && ordenSeleccionada.id === o.id ? "is-active" : "";
      return `
        <div class="order-card ${activa}" data-id="${o.id}">
          <div class="order-card__top">
            <span class="order-card__folio">${o.numero_ticket || ""}</span>
            <span class="badge ${badgeClass}">${estadoPago}</span>
          </div>
          <div class="order-card__cliente">${o.nombre_cliente || "(sin nombre)"}</div>
          <div class="order-card__total">Total: ${money(total)}</div>
        </div>`;
    })
    .join("");

  listaOrdenesEl.querySelectorAll(".order-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number(card.getAttribute("data-id"));
      const orden = ordenes.find((o) => o.id === id);
      seleccionarOrden(orden);
    });
  });
}

buscadorEl.addEventListener("input", renderLista);
filtroEstadoPagoEl.addEventListener("change", renderLista);

/* ---------------------------------------------------------
   Selección y detalle de una orden
--------------------------------------------------------- */
async function seleccionarOrden(orden) {
  ordenSeleccionada = orden;
  renderLista();
  await renderDetalle();
}

async function sugerirCostoRepuestos() {
  const { data, error } = await supabaseClient
    .from("repuestos_usados")
    .select("cantidad, costo_adquisicion")
    .eq("orden_id", ordenSeleccionada.id);

  if (error) {
    console.error(error);
    return;
  }

  const total = (data || []).reduce(
    (sum, r) => sum + (Number(r.costo_adquisicion) || 0) * (Number(r.cantidad) || 1),
    0
  );
  const input = document.getElementById("costoRepuestos");
  input.value = total.toFixed(2);
  actualizarResumen();
}

async function renderDetalle() {
  const o = ordenSeleccionada;

  const opcionesEstadoPago = ESTADOS_PAGO.map(
    (e) => `<option value="${e}" ${e === (o.estado_pago || "Pendiente") ? "selected" : ""}>${e}</option>`
  ).join("");

  const opcionesMetodoPago = METODOS_PAGO.map(
    (m) => `<option value="${m}" ${m === o.metodo_pago ? "selected" : ""}>${m}</option>`
  ).join("");

  detalleEl.innerHTML = `
    <div class="detail__head">
      <div>
        <h2>${o.nombre_cliente || "(sin nombre)"}</h2>
        <span class="sub">${o.tipo_equipo || ""} · ${o.marca_modelo || ""}</span>
      </div>
      <span class="detail__folio">${o.numero_ticket || ""}</span>
    </div>

    <form id="formCobro">
      <section class="panel-section">
        <h3>Costos</h3>
        <div class="field-grid">
          <div class="field">
            <label for="costoRevision">Costo de revisión / diagnóstico</label>
            <input type="number" id="costoRevision" min="0" step="0.01" value="${o.costo_revision ?? 0}">
          </div>
          <div class="field">
            <label for="costoManoObra">Costo de mano de obra</label>
            <input type="number" id="costoManoObra" min="0" step="0.01" value="${o.costo_mano_obra ?? 0}">
          </div>
          <div class="field full">
            <label for="costoRepuestos">Costo de repuestos (precio al cliente)</label>
            <input type="number" id="costoRepuestos" min="0" step="0.01" value="${o.costo_repuestos ?? 0}">
            <button type="button" class="sugerir-btn" id="btnSugerir">Sugerir desde repuestos registrados</button>
            <span class="hint">La sugerencia usa el costo de compra registrado en el panel de taller — ajústalo si le agregas margen de venta.</span>
          </div>
          <div class="field">
            <label for="impuestoPorcentaje">Impuesto (%)</label>
            <input type="number" id="impuestoPorcentaje" min="0" step="0.01" value="${o.impuesto_porcentaje ?? 0}">
          </div>
          <div class="field">
            <label for="anticipo">Anticipo / abonado</label>
            <input type="number" id="anticipo" min="0" step="0.01" value="${o.anticipo ?? 0}">
          </div>
        </div>
      </section>

      <section class="resumen">
        <h3>Resumen</h3>
        <div class="resumen__row"><span>Subtotal</span><span id="resSubtotal">${money(0)}</span></div>
        <div class="resumen__row"><span>Impuestos</span><span id="resImpuesto">${money(0)}</span></div>
        <div class="resumen__row total"><span>Total a pagar</span><span id="resTotal">${money(0)}</span></div>
        <div class="resumen__row"><span>Anticipo</span><span id="resAnticipo">${money(0)}</span></div>
        <div class="resumen__row saldo" id="resSaldoRow"><span>Saldo pendiente</span><span id="resSaldo">${money(0)}</span></div>
      </section>

      <section class="panel-section">
        <h3>Pago</h3>
        <div class="field-grid">
          <div class="field">
            <label for="metodoPago">Método de pago</label>
            <select id="metodoPago">
              <option value="" ${!o.metodo_pago ? "selected" : ""} disabled>Selecciona</option>
              ${opcionesMetodoPago}
            </select>
          </div>
          <div class="field">
            <label for="estadoPago">Estado de pago</label>
            <select id="estadoPago">${opcionesEstadoPago}</select>
          </div>
        </div>

        <div class="save-row">
          <button type="submit" class="btn-primary" id="btnGuardarCobro">Guardar cambios</button>
          <span class="status-msg" id="estadoGuardadoCobro"></span>
        </div>
      </section>
    </form>
  `;

  ["costoRevision", "costoManoObra", "costoRepuestos", "impuestoPorcentaje", "anticipo"].forEach((id) => {
    document.getElementById(id).addEventListener("input", actualizarResumen);
  });
  document.getElementById("btnSugerir").addEventListener("click", sugerirCostoRepuestos);
  document.getElementById("formCobro").addEventListener("submit", guardarCobro);

  actualizarResumen();
}

function leerCamposFormulario() {
  return {
    costo_revision: Number(document.getElementById("costoRevision").value) || 0,
    costo_mano_obra: Number(document.getElementById("costoManoObra").value) || 0,
    costo_repuestos: Number(document.getElementById("costoRepuestos").value) || 0,
    impuesto_porcentaje: Number(document.getElementById("impuestoPorcentaje").value) || 0,
    anticipo: Number(document.getElementById("anticipo").value) || 0,
  };
}

function actualizarResumen() {
  const valores = leerCamposFormulario();
  const { subtotal, impMonto, total, saldo } = calcular(valores);

  document.getElementById("resSubtotal").textContent = money(subtotal);
  document.getElementById("resImpuesto").textContent = money(impMonto);
  document.getElementById("resTotal").textContent = money(total);
  document.getElementById("resAnticipo").textContent = money(valores.anticipo);

  const saldoEl = document.getElementById("resSaldo");
  const saldoRow = document.getElementById("resSaldoRow");
  saldoEl.textContent = money(Math.max(saldo, 0));
  saldoRow.classList.toggle("saldada", saldo <= 0);
}

/* ---------------------------------------------------------
   Guardar
--------------------------------------------------------- */
async function guardarCobro(event) {
  event.preventDefault();
  const btn = document.getElementById("btnGuardarCobro");
  const status = document.getElementById("estadoGuardadoCobro");
  btn.disabled = true;
  status.textContent = "Guardando…";
  status.className = "status-msg";

  const cambios = {
    ...leerCamposFormulario(),
    metodo_pago: document.getElementById("metodoPago").value || null,
    estado_pago: document.getElementById("estadoPago").value,
  };

  const { error } = await supabaseClient
    .from("ordenes_servicio")
    .update(cambios)
    .eq("id", ordenSeleccionada.id);

  btn.disabled = false;

  if (error) {
    console.error(error);
    status.textContent = "No se pudo guardar. Intenta de nuevo.";
    status.className = "status-msg err";
    return;
  }

  Object.assign(ordenSeleccionada, cambios);
  const idx = ordenes.findIndex((o) => o.id === ordenSeleccionada.id);
  if (idx !== -1) ordenes[idx] = ordenSeleccionada;

  status.textContent = "Cambios guardados.";
  status.className = "status-msg ok";
  renderLista();
}

/* ---------------------------------------------------------
   Arranque
--------------------------------------------------------- */
cargarOrdenes();
