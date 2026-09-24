/* =========================================================
   GENERADOR DE COMPROBANTE EN PDF TAMAÑO TICKET (80mm)
   Usa jsPDF (cargar el script de jsPDF antes que este archivo).
   Incluye únicamente datos del cliente y del equipo, sin costos.
   ========================================================= */

/* Logo de Accesorios L&L, ya comprimido y embebido como base64
   para que el ticket se genere sin depender de cargar logo.jpg
   por separado (evita problemas de tiempos de carga / CORS). */
const LOGO_LL_BASE64 =
  "data:image/jpeg;base64,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";

function generarTicketPDF(orden) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("No se pudo generar el PDF: falta cargar la librería jsPDF.");
    return;
  }
  const { jsPDF } = window.jspdf;

  const ANCHO_MM = 80;
  const MARGEN_MM = 5;
  const ANCHO_UTIL = ANCHO_MM - MARGEN_MM * 2;
  const LINEA_ALTO = 4.6;

  /* Paleta (a juego con el resto del sistema) */
  const NAVY = [15, 28, 46]; // #0f1c2e
  const TEXTO = [26, 36, 51]; // #1a2433
  const MUTED = [92, 107, 122]; // #5c6b7a
  const LINEA_SUAVE = [210, 216, 222];

  /* Convierte "DATOS DEL CLIENTE" en "D A T O S   D E L   C L I E N T E"
     para un efecto de título con espaciado, sin depender de setCharSpace
     (no disponible en todas las builds de jsPDF). */
  function espaciado(texto) {
    return String(texto).toUpperCase().split("").join(" ");
  }

  /* Dibuja todo el contenido sobre "doc" y regresa el alto (mm) usado.
     Se llama dos veces: una para medir y otra para generar el PDF final
     con el alto exacto (evita espacio en blanco sobrante). */
  function dibujarContenido(doc) {
    let y = 8;

    function centrado(texto, tam, color, negrita) {
      doc.setFont("helvetica", negrita ? "bold" : "normal");
      doc.setFontSize(tam);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(String(texto || ""), ANCHO_MM / 2, y, { align: "center" });
      y += LINEA_ALTO;
    }

    function lineaSolida(color, grosor) {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(grosor || 0.35);
      doc.setLineDashPattern([], 0);
      doc.line(MARGEN_MM, y, ANCHO_MM - MARGEN_MM, y);
      y += 3.2;
    }

    function lineaPunteada() {
      doc.setDrawColor(LINEA_SUAVE[0], LINEA_SUAVE[1], LINEA_SUAVE[2]);
      doc.setLineWidth(0.2);
      doc.setLineDashPattern([0.7, 0.9], 0);
      doc.line(MARGEN_MM, y, ANCHO_MM - MARGEN_MM, y);
      y += 3.6;
    }

    function tituloSeccion(texto) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.6);
      doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
      // Pequeño marcador de color antes del título
      doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.rect(MARGEN_MM, y - 2.4, 2, 2, "F");
      doc.text(espaciado(texto), MARGEN_MM + 3.6, y, { align: "left" });
      y += 4.6;
    }

    function campo(etiqueta, valor) {
      if (!valor) return;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.3);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(String(etiqueta).toUpperCase(), MARGEN_MM, y);
      y += 3.7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.3);
      doc.setTextColor(TEXTO[0], TEXTO[1], TEXTO[2]);
      const lineas = doc.splitTextToSize(String(valor), ANCHO_UTIL);
      doc.text(lineas, MARGEN_MM, y);
      y += lineas.length * LINEA_ALTO + 2;
    }

    /* ---------- Encabezado con logo ---------- */
    const logoAncho = 20;
    const logoAlto = 20 * (251 / 260); // proporción real del logo comprimido
    try {
      doc.addImage(
        LOGO_LL_BASE64,
        "JPEG",
        ANCHO_MM / 2 - logoAncho / 2,
        y,
        logoAncho,
        logoAlto
      );
    } catch (e) {
      console.warn("No se pudo dibujar el logo en el comprobante:", e);
    }
    y += logoAlto + 3;

    centrado("Accesorios L&L", 14.5, NAVY, true);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.2);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text("Recepción y servicio técnico", ANCHO_MM / 2, y, { align: "center" });
    y += LINEA_ALTO + 1.5;

    lineaSolida(NAVY, 0.6);
    y += 1;

    /* ---------- Folio y fecha ---------- */
    centrado("Orden " + (orden.numero_ticket || ""), 11.5, NAVY, true);
    const fecha = orden.created_at ? new Date(orden.created_at) : new Date();
    const fechaTexto = fecha.toLocaleString("es-GT", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    centrado(fechaTexto, 8, MUTED, false);
    y += 2;

    lineaPunteada();
    y += 2;

    /* ---------- Datos del cliente ---------- */
    tituloSeccion("Datos del cliente");
    campo("Cliente", orden.nombre_cliente);
    campo("Teléfono", orden.telefono);
    campo("Correo", orden.correo);
    campo("Dirección", orden.direccion);

    lineaPunteada();
    y += 2;

    /* ---------- Datos del equipo ---------- */
    tituloSeccion("Datos del equipo");
    campo("Tipo de equipo", orden.tipo_equipo);
    campo("Marca y modelo", orden.marca_modelo);
    campo("Número de serie", orden.numero_serie);
    campo("Especificaciones", orden.especificaciones);
    campo("Accesorios recibidos", orden.accesorios);
    campo("Motivo de ingreso", orden.descripcion_falla);
    campo("Estado físico al recibir", orden.estado_fisico);

    lineaSolida(LINEA_SUAVE, 0.3);
    y += 1;

    /* ---------- Pie ---------- */
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.6);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    const nota =
      "Conserve este comprobante. Es necesario para retirar el equipo.";
    const lineasNota = doc.splitTextToSize(nota, ANCHO_UTIL - 4);
    doc.text(lineasNota, ANCHO_MM / 2, y, { align: "center" });
    y += lineasNota.length * 3.9 + 3;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text("¡Gracias por su confianza!", ANCHO_MM / 2, y, { align: "center" });
    y += 6;

    return y;
  }

  /* 1) Medimos el contenido en un documento temporal muy alto */
  const docMedida = new jsPDF({ unit: "mm", format: [ANCHO_MM, 1000] });
  const altoNecesario = dibujarContenido(docMedida);

  /* 2) Generamos el documento final con el alto exacto (sin sobrar papel) */
  const docFinal = new jsPDF({ unit: "mm", format: [ANCHO_MM, altoNecesario] });
  dibujarContenido(docFinal);
  docFinal.setProperties({
    title: "Comprobante " + (orden.numero_ticket || ""),
  });

  /* Abrimos el PDF en una pestaña nueva (visor de Chrome), igual que la
     app de facturas: desde ahí se manda a imprimir con Ctrl+P / el ícono
     de impresora del visor. */
  const blobUrl = docFinal.output("bloburl");
  const ventana = window.open(blobUrl, "_blank");

  if (!ventana) {
    alert(
      "El navegador bloqueó la ventana emergente. Permite las ventanas emergentes para este sitio y vuelve a intentarlo."
    );
  }
}
