  /* =========================================================
   Usa las mismas credenciales que script.js del formulario
   de recepción (mismo proyecto de Supabase).
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

const ESTADOS = [
  "Pendiente de revisión",
  "En diagnóstico",
  "Esperando repuestos",
  "En reparación",
  "Listo para entrega",
  "Entregado",
  "Cancelado",
];

const ESTADO_CLASS = {
  "Pendiente de revisión": "badge--pendiente",
  "En diagnóstico": "badge--proceso",
  "Esperando repuestos": "badge--espera",
  "En reparación": "badge--proceso",
  "Listo para entrega": "badge--listo",
  "Entregado": "badge--entregado",
  "Cancelado": "badge--cancelado",
};

let ordenes = [];
let ordenSeleccionada = null;

const listaOrdenesEl = document.getElementById("listaOrdenes");
const detalleEl = document.getElementById("detalle");
const buscadorEl = document.getElementById("buscador");
const filtroEstadoEl = document.getElementById("filtroEstado");

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
  const estadoFiltro = filtroEstadoEl.value;

  const filtradas = ordenes.filter((o) => {
    const coincideTexto =
      !texto ||
      (o.nombre_cliente || "").toLowerCase().includes(texto) ||
      (o.numero_ticket || "").toLowerCase().includes(texto) ||
      (o.marca_modelo || "").toLowerCase().includes(texto);
    const coincideEstado = !estadoFiltro || (o.estado_reparacion || "Pendiente de revisión") === estadoFiltro;
    return coincideTexto && coincideEstado;
  });

  if (filtradas.length === 0) {
    listaOrdenesEl.innerHTML = `<p class="empty-orders">No hay órdenes que coincidan.</p>`;
    return;
  }

  listaOrdenesEl.innerHTML = filtradas
    .map((o) => {
      const estado = o.estado_reparacion || "Pendiente de revisión";
      const badgeClass = ESTADO_CLASS[estado] || "badge--pendiente";
      const activa = ordenSeleccionada && ordenSeleccionada.id === o.id ? "is-active" : "";
      return `
        <div class="order-card ${activa}" data-id="${o.id}">
          <div class="order-card__top">
            <span class="order-card__folio">${o.numero_ticket || ""}</span>
            <span class="badge ${badgeClass}">${estado}</span>
          </div>
          <div class="order-card__cliente">${o.nombre_cliente || "(sin nombre)"}</div>
          <div class="order-card__equipo">${o.tipo_equipo || ""} · ${o.marca_modelo || ""}</div>
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
filtroEstadoEl.addEventListener("change", renderLista);

/* ---------------------------------------------------------
   Selección y detalle de una orden
--------------------------------------------------------- */
function seleccionarOrden(orden) {
  ordenSeleccionada = orden;
  renderLista();
  renderDetalle();
  cargarRepuestos(orden.id);
}

function renderDetalle() {
  const o = ordenSeleccionada;
  const opcionesEstado = ESTADOS.map(
    (e) => `<option value="${e}" ${e === (o.estado_reparacion || ESTADOS[0]) ? "selected" : ""}>${e}</option>`
  ).join("");
  const fechaCreacion = o.created_at ? new Date(o.created_at).toLocaleString() : "—";

  let galeriaFotos = "";
  if (o.fotos) {
    const urls = o.fotos.split(",").map(u => u.trim()).filter(u => u);
    if (urls.length > 0) {
      galeriaFotos = `
        <div class="panel-section" style="padding: 16px 24px;">
          <h3 style="margin: 0 0 12px; font-size: 0.85rem; color: var(--muted);">FOTOS DE RECEPCIÓN (Clic para ampliar)</h3>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            ${urls.map(url => `<a href="${url}" target="_blank"><img src="${url}" style="width: 85px; height: 85px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);"></a>`).join("")}
          </div>
        </div>
      `;
    }
  }

  detalleEl.innerHTML = `
    <div class="detail__head">
      <div>
        <h2>${o.nombre_cliente || "(sin nombre)"}</h2>
        <span class="sub">${o.tipo_equipo || ""} · ${o.marca_modelo || ""}</span>
      </div>
      <span class="detail__folio">${o.numero_ticket || ""}</span>
    </div>

    <div class="client-strip">
      <div><span>Fecha de recepción</span>${fechaCreacion}</div>
      <div><span>Teléfono</span>${o.telefono || "—"}</div>
      <div><span>Correo</span>${o.correo || "—"}</div>
      <div><span>N.º de serie</span>${o.numero_serie || "—"}</div>
      <div><span>Especificaciones</span>${o.especificaciones || "—"}</div>
      <div><span>Estado físico reportado</span>${o.estado_fisico || "—"}</div>
    </div>

    ${galeriaFotos}

    <form class="panel-section" id="formFlujo">
      <h3>Control de flujo</h3>
      <div class="field-grid">
        <div class="field">
          <label for="tipoServicio">Tipo de servicio</label>
          <select id="tipoServicio">
            <option value="" ${!o.tipo_servicio ? "selected" : ""} disabled>Selecciona</option>
            <option value="Preventivo" ${o.tipo_servicio === "Preventivo" ? "selected" : ""}>Preventivo</option>
            <option value="Correctivo" ${o.tipo_servicio === "Correctivo" ? "selected" : ""}>Correctivo</option>
            <option value="Diagnóstico" ${o.tipo_servicio === "Diagnóstico" ? "selected" : ""}>Diagnóstico</option>
            <option value="Actualización de software" ${o.tipo_servicio === "Actualización de software" ? "selected" : ""}>Actualización de software</option>
            <option value="Respaldo de datos" ${o.tipo_servicio === "Respaldo de datos" ? "selected" : ""}>Respaldo de datos</option>
          </select>
        </div>
        <div class="field">
          <label for="estadoReparacion">Estado de la reparación</label>
          <select id="estadoReparacion">${opcionesEstado}</select>
        </div>

        <div class="field full">
          <label for="descripcionFalla">Descripción de la falla reportada</label>
          <textarea id="descripcionFalla" rows="2">${o.descripcion_falla || ""}</textarea>
        </div>

        <div class="field full">
          <label for="diagnosticoTecnico">Diagnóstico técnico</label>
          <textarea id="diagnosticoTecnico" rows="2">${o.diagnostico_tecnico || ""}</textarea>
        </div>

        <div class="field">
          <label for="tecnicoAsignado">Técnico asignado</label>
          <input type="text" id="tecnicoAsignado" value="${o.tecnico_asignado || ""}">
        </div>
        <div class="field">
          <label for="plazoAbandono">Plazo de abandono (días)</label>
          <input type="number" id="plazoAbandono" min="0" value="${o.plazo_abandono_dias ?? 30}">
        </div>

        <div class="field">
          <label for="fechaEstimada">Fecha estimada de entrega</label>
          <input type="date" id="fechaEstimada" value="${o.fecha_estimada_entrega || ""}">
        </div>
        <div class="field">
          <label for="fechaReal">Fecha y hora real de entrega</label>
          <input type="datetime-local" id="fechaReal" value="${o.fecha_real_entrega ? new Date(new Date(o.fecha_real_entrega).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ""}">
        </div>

        <div class="field full">
          <label style="display:flex;align-items:center;gap:8px;font-weight:500;">
            <input type="checkbox" id="esRetrabajo" style="width:16px;height:16px;" ${o.es_retrabajo ? "checked" : ""}>
            Es un retrabajo (el equipo regresó por la misma falla)
          </label>
        </div>
      </div>

      <div class="save-row">
        <button type="submit" class="btn-primary" id="btnGuardarFlujo">Guardar cambios</button>
        <span class="status-msg" id="estadoGuardadoFlujo"></span>
      </div>
    </form>

    <section class="panel-section">
      <h3>Repuestos usados en esta orden</h3>
      <table>
        <thead>
          <tr>
            <th>Código</th><th>Descripción</th><th>Cant.</th><th>Costo</th><th>Proveedor</th><th></th>
          </tr>
        </thead>
        <tbody id="tablaRepuestos"></tbody>
      </table>
      <div id="repuestosVacio" class="repuestos-empty" hidden>Aún no se ha registrado ningún repuesto para esta orden.</div>

      <form class="add-repuesto" id="formRepuesto">
        <div class="field">
          <label>Codigo</label>
          <input type="text" id="rCodigo" placeholder="Ej. SSD-480">
        </div>
        <div class="field">
          <label>Descripcin</label>
          <input type="text" id="rDescripcion" placeholder="Ej. disco SSD 480GB">
        </div>
        <div class="field">
          <label>Cantidad</label>
          <input type="number" id="rCantidad" min="1" value="1">
        </div>
        <div class="field">
          <label>Costo</label>
          <input type="number" id="rCosto" min="0" step="0.01" placeholder="0.00">
        </div>
        <div class="field">
          <label>Proveedor</label>
          <input type="text" id="rProveedor" placeholder="Opcional">
        </div>
        <button type="submit" class="btn-primary">Agregar</button>
      </form>

      <div class="total-row">
        Total en repuestos: <strong id="totalRepuestos">Q0.00</strong>
      </div>
      <span class="status-msg" id="estadoGuardadoRepuesto"></span>
    </section>
  `;

  document.getElementById("formFlujo").addEventListener("submit", guardarFlujo);
  document.getElementById("formRepuesto").addEventListener("submit", agregarRepuesto);
  document.getElementById("estadoReparacion").addEventListener("change", (e) => {
    if (e.target.value === "Entregado") {
      const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      document.getElementById("fechaReal").value = localNow;
    }
  });
}

/* ---------------------------------------------------------
   Guardar campos de control de flujo
--------------------------------------------------------- */
async function guardarFlujo(event) {
  event.preventDefault();
  const btn = document.getElementById("btnGuardarFlujo");
  const status = document.getElementById("estadoGuardadoFlujo");
  btn.disabled = true;
  status.textContent = "Guardando…";
  status.className = "status-msg";

  const cambios = {
    tipo_servicio: document.getElementById("tipoServicio").value || null,
    estado_reparacion: document.getElementById("estadoReparacion").value,
    descripcion_falla: document.getElementById("descripcionFalla").value.trim(),
    diagnostico_tecnico: document.getElementById("diagnosticoTecnico").value.trim(),
    tecnico_asignado: document.getElementById("tecnicoAsignado").value.trim(),
    plazo_abandono_dias: Number(document.getElementById("plazoAbandono").value) || 0,
    fecha_estimada_entrega: document.getElementById("fechaEstimada").value || null,
    fecha_real_entrega: document.getElementById("fechaReal").value ? new Date(document.getElementById("fechaReal").value).toISOString() : null,
    es_retrabajo: document.getElementById("esRetrabajo").checked,
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
   Repuestos: cargar, agregar, eliminar
--------------------------------------------------------- */
async function cargarRepuestos(ordenId) {
  const tbody = document.getElementById("tablaRepuestos");
  const vacio = document.getElementById("repuestosVacio");
  if (!tbody) return;

  const { data, error } = await supabaseClient
    .from("repuestos_usados")
    .select("*")
    .eq("orden_id", ordenId)
    .order("creado_en", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  renderRepuestos(data || []);
}

function renderRepuestos(repuestos) {
  const tbody = document.getElementById("tablaRepuestos");
  const vacio = document.getElementById("repuestosVacio");
  if (!tbody) return;

  if (repuestos.length === 0) {
    tbody.innerHTML = "";
    vacio.hidden = false;
  } else {
    vacio.hidden = true;
    tbody.innerHTML = repuestos
      .map(
        (r) => `
        <tr data-id="${r.id}">
          <td class="mono">${r.codigo_refaccion || "—"}</td>
          <td>${r.descripcion || "—"}</td>
          <td>${r.cantidad ?? 1}</td>
          <td>${r.costo_adquisicion != null ? "Q" + Number(r.costo_adquisicion).toFixed(2) : "—"}</td>
          <td>${r.proveedor || "—"}</td>
          <td><button type="button" class="del-btn" data-id="${r.id}">Eliminar</button></td>
        </tr>`
      )
      .join("");

    tbody.querySelectorAll(".del-btn").forEach((btn) => {
      btn.addEventListener("click", () => eliminarRepuesto(Number(btn.getAttribute("data-id"))));
    });
  }

  const total = repuestos.reduce((sum, r) => sum + (Number(r.costo_adquisicion) || 0) * (Number(r.cantidad) || 1), 0);
  const totalEl = document.getElementById("totalRepuestos");
  if (totalEl) totalEl.textContent = "Q" + total.toFixed(2);
}

async function agregarRepuesto(event) {
  event.preventDefault();
  const status = document.getElementById("estadoGuardadoRepuesto");
  status.textContent = "Guardando…";
  status.className = "status-msg";

  const nuevo = {
    orden_id: ordenSeleccionada.id,
    codigo_refaccion: document.getElementById("rCodigo").value.trim(),
    descripcion: document.getElementById("rDescripcion").value.trim(),
    cantidad: Number(document.getElementById("rCantidad").value) || 1,
    costo_adquisicion: document.getElementById("rCosto").value
      ? Number(document.getElementById("rCosto").value)
      : null,
    proveedor: document.getElementById("rProveedor").value.trim(),
  };

  const { error } = await supabaseClient.from("repuestos_usados").insert([nuevo]);

  if (error) {
    console.error(error);
    status.textContent = "No se pudo agregar el repuesto.";
    status.className = "status-msg err";
    return;
  }

  status.textContent = "Repuesto agregado.";
  status.className = "status-msg ok";
  document.getElementById("formRepuesto").reset();
  document.getElementById("rCantidad").value = 1;
  cargarRepuestos(ordenSeleccionada.id);
}

async function eliminarRepuesto(id) {
  const { error } = await supabaseClient.from("repuestos_usados").delete().eq("id", id);
  if (error) {
    console.error(error);
    return;
  }
  cargarRepuestos(ordenSeleccionada.id);
}

/* ---------------------------------------------------------
   Arranque
--------------------------------------------------------- */
cargarOrdenes();
