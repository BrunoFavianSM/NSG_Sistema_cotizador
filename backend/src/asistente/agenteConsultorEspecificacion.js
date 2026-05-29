const { normalizarTexto, productosPorCategoria } = require('./utilidadesCatalogo');

async function responderEspecificacion({ pregunta, productos = [] }) {
  const texto = normalizarTexto(pregunta);
  const lineas = [];

  if (texto.includes('ram')) {
    lineas.push('Para uso general, **16 GB de RAM** es el punto recomendado.');
    lineas.push('Para edición de video, streaming o multitarea pesada, conviene **32 GB**.');
    lineas.push('Para 3D/render avanzado, evalúa **64 GB** si el presupuesto lo permite.');
    const opciones = productosPorCategoria(productos, 'ram', 3);
    if (opciones.length > 0) {
      lineas.push('', '**Opciones del catálogo para revisar:**', ...opciones.map((p) => `- ${p.nombre}`));
    }
  } else if (texto.includes('fuente') || texto.includes('watt') || texto.includes('w')) {
    lineas.push('La fuente debe elegirse por consumo real más margen. Para PCs con GPU dedicada suele convenir **650W a 750W** como base segura.');
    lineas.push('Si usas GPU de gama alta, revisa **850W o más** y certificación 80+ confiable.');
  } else if (texto.includes('almacenamiento') || texto.includes('ssd') || texto.includes('nvme')) {
    lineas.push('Para una PC actual recomiendo **SSD NVMe** como disco principal.');
    lineas.push('Capacidad sugerida: **1 TB** para gaming/uso mixto; **2 TB** si trabajas con video o archivos pesados.');
  } else {
    lineas.push('Puedo orientarte sobre RAM, fuente, almacenamiento, GPU, procesador o compatibilidad entre componentes.');
    lineas.push('Dime el uso principal, presupuesto y el componente que quieres dimensionar.');
  }

  return {
    respuesta: lineas.join('\n'),
    quick_replies: ['Armar configuración', 'Comparar productos', 'Ver compatibilidad'],
    requiere_asesor: false,
  };
}

module.exports = {
  responderEspecificacion,
};
