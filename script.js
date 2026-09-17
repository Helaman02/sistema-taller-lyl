/* =========================================================
   1) CONFIGURACIÓN DE SUPABASE
   Reemplaza estos dos valores con los de tu propio proyecto
   (Supabase → Project Settings → API).
   ========================================================= */
const SUPABASE_URL = "https://riirajoptvdcosrvpoug.supabase.co";       // ej: https://abcxyz.supabase.co
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

/* Nombre del bucket de Storage para las fotos (opcional, ver README) */
const STORAGE_BUCKET = "fotos-equipos";

/* =========================================================
   2) NÚMERO DE ORDEN (solo visual/referencia para el cliente)
   ========================================================= */
const numeroTicket = "LL-" + Date.now().toString().slice(-6);
document.getElementById("numeroTicket").textContent = numeroTicket;

/* =========================================================
   3) RESALTAR SECCIÓN ACTIVA EN EL PANEL LATERAL
   ========================================================= */
const steps = document.querySelectorAll(".steps__item");
const sections = document.querySelectorAll(".section");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute("id");
      steps.forEach((step) => {
        step.classList.toggle("is-active", step.getAttribute("href") === "#" + id);
      });
    });
  },
  { rootMargin: "-30% 0px -60% 0px" }
);

sections.forEach((section) => observer.observe(section));
if (steps[0]) steps[0].classList.add("is-active");

/* =========================================================
   4) ENVÍO DEL FORMULARIO
   ========================================================= */
const form = document.getElementById("formOrden");
const btnSubmit = document.getElementById("btnSubmit");
const formStatus = document.getElementById("formStatus");

function setStatus(message, type) {
  formStatus.textContent = message;
  formStatus.className = "form-status" + (type ? " is-" + type : "");
}

async function subirFotos(files) {
  if (!files || files.length === 0) return [];
  const urls = [];
  for (const file of files) {
    const path = `${numeroTicket}/${Date.now()}-${file.name}`;
    const { error } = await supabaseClient.storage.from(STORAGE_BUCKET).upload(path, file);
    if (error) {
      console.warn("No se pudo subir una foto (revisa el bucket de Storage):", error.message);
      continue;
    }
    const { data } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  btnSubmit.disabled = true;
  setStatus("Guardando orden…", null);

  const accesorios = Array.from(
    form.querySelectorAll('input[name="accesorios"]:checked')
  ).map((el) => el.value);

  const accesoriosOtro = form.accesoriosOtro.value.trim();
  if (accesoriosOtro) accesorios.push(accesoriosOtro);

  const fotos = form.fotos.files;
  let fotoUrls = [];
  try {
    fotoUrls = await subirFotos(fotos);
  } catch (e) {
    console.warn("Fotos omitidas:", e);
  }

  const payload = {
    numero_ticket: numeroTicket,
    nombre_cliente: form.nombreCliente.value.trim(),
    telefono: form.telefono.value.trim(),
    correo: form.correo.value.trim(),
    direccion: form.direccion.value.trim(),
    tipo_equipo: form.tipoEquipo.value,
    marca_modelo: form.marcaModelo.value.trim(),
    numero_serie: form.numeroSerie.value.trim(),
    especificaciones: form.especificaciones.value.trim(),
    contrasena: form.contrasena.value.trim(),
    accesorios: accesorios.join(", "),
    estado_fisico: form.estadoFisico.value.trim(),
    descripcion_falla: form.descripcionFalla.value.trim(),
    fotos: fotoUrls.join(", "),
  };

  const { error } = await supabaseClient.from("ordenes_servicio").insert([payload]);

  btnSubmit.disabled = false;

  if (error) {
    console.error(error);
    setStatus("No se pudo guardar la orden. Intenta de nuevo.", "error");
    return;
  }

  setStatus("Orden " + numeroTicket + " registrada correctamente.", "success");
  form.reset();

  // 1. MOSTRAR LA VENTANA Y EL VIDEO
  const modal = document.getElementById("modalExito");
  const video = document.getElementById("videoExito");
  if (modal && video) {
    modal.classList.add("is-visible");
    video.currentTime = 0; 
    video.play();
  }
}); // <-- AQUÍ TERMINA LA FUNCIÓN DE GUARDAR

// 2. CERRAR LA VENTANA CON EL BOTÓN ACEPTAR
const btnCerrar = document.getElementById("btnCerrarModal");
if (btnCerrar) {
  btnCerrar.addEventListener("click", () => {
    document.getElementById("modalExito").classList.remove("is-visible");
    const video = document.getElementById("videoExito");
    if (video) video.pause();
  });
}

/* =========================================================
   ANIMACIÓN DE INICIO (PANTALLA DE CARGA x10)
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const pantallaCarga = document.getElementById("pantallaCarga");
  const videoIntro = document.getElementById("videoIntro");

  if (pantallaCarga && videoIntro) {
    // Acelerar el video a velocidad x10
    videoIntro.playbackRate = 10.0;

    // Cuando el video termine, oculta la pantalla
    videoIntro.addEventListener("ended", () => {
      pantallaCarga.classList.add("oculto");
    });

    // Seguro anti-fallos ajustado a 1 segundo (ultrarrápido)
    setTimeout(() => {
      if (!pantallaCarga.classList.contains("oculto")) {
        pantallaCarga.classList.add("oculto");
      }
    }, 1000); 
  }
});
