const { buscarProductosMencionados, categoriaProducto, precioProducto, productosPorCategoria } = require('./utilidadesCatalogo');

function compararCampo(label, a, b, campo) {
  const valorA = a?.[campo];
  const valorB = b?.[campo];
  if (valorA === undefined && valorB === undefined) return null;
  return `| ${label} | ${valorA ?? 'Sin dato'} | ${valorB ?? 'Sin dato'} |`;
}

async function compararProductos({ pregunta, productos = [] }) {
  let mencionados = buscarProductosMencionados(pregunta, productos, 2);

  if (mencionados.length < 2) {
    const categoriasProbables = ['gpu', 'procesador', 'ram'];
    for (const categoria of categoriasProbables) {
      const candidatos = productosPorCategoria(productos, categoria, 2);
      if (candidatos.length >= 2) {
        mencionados = candidatos;
        break;
      }
    }
  }

  if (mencionados.length < 2) {
    return {
      respuesta: 'Necesito dos productos del catálogo para compararlos. Indícame los nombres exactos, por ejemplo: “Compara RTX 4060 vs RX 7600”.',
      quick_replies: ['Armar una PC gaming', 'Preguntar compatibilidad', 'Hablar con asesor'],
      requiere_asesor: false,
    };
  }

  const [a, b] = mencionados;
  const filas = [
    '| Criterio | Opción A | Opción B |',
    '|---|---|---|',
    `| Producto | ${a.nombre} | ${b.nombre} |`,
    `| Categoría | ${categoriaProducto(a) || 'Sin dato'} | ${categoriaProducto(b) || 'Sin dato'} |`,
    `| Precio base | ${precioProducto(a) || 'Sin dato'} | ${precioProducto(b) || 'Sin dato'} |`,
    compararCampo('Socket', a, b, 'socket'),
    compararCampo('Tipo RAM', a, b, 'ram_type'),
    compararCampo('Form factor', a, b, 'form_factor'),
    compararCampo('TDP', a, b, 'tdp'),
    compararCampo('Potencia', a, b, 'wattage'),
  ].filter(Boolean);

  const ganadorPrecio = precioProducto(a) && precioProducto(b)
    ? (precioProducto(a) <= precioProducto(b) ? a : b)
    : null;

  const respuesta = [
    `Comparé estos productos del catálogo: **${a.nombre}** vs **${b.nombre}**.`,
    '',
    ...filas,
    '',
    ganadorPrecio
      ? `Si priorizas precio, conviene revisar primero **${ganadorPrecio.nombre}**.`
      : 'No tengo precio suficiente para decidir por relación precio/rendimiento.',
    'Para una recomendación final, dime el uso principal y presupuesto.',
  ];

  return {
    respuesta: respuesta.join('\n'),
    quick_replies: ['Recomiéndame según mi uso', 'Ver compatibilidad', 'Armar cotización'],
    requiere_asesor: false,
    productos_mencionados: mencionados,
  };
}

module.exports = {
  compararProductos,
};
