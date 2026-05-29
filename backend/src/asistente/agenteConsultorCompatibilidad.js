const servicioCompatibilidad = require('../servicios/servicioCompatibilidad');
const { buscarProductosMencionados, categoriaProducto, describirProducto, productosPorCategoria } = require('./utilidadesCatalogo');

function evaluarPareja(productos) {
  const componentes = {};
  for (const producto of productos) {
    const categoria = categoriaProducto(producto);
    if (categoria === 'procesador') componentes.procesador = producto;
    if (categoria === 'placa_madre') componentes.placa_madre = producto;
    if (categoria === 'ram') componentes.ram = [producto];
    if (categoria === 'gpu') componentes.gpu = producto;
    if (categoria === 'fuente') componentes.fuente = producto;
    if (categoria === 'case') componentes.case = producto;
    if (categoria === 'almacenamiento') componentes.almacenamiento = producto;
  }
  return servicioCompatibilidad.validarConfiguracion(componentes);
}

async function consultarCompatibilidad({ pregunta, productos = [] }) {
  const mencionados = buscarProductosMencionados(pregunta, productos, 4);

  if (mencionados.length < 2) {
    return {
      respuesta: 'Para validar compatibilidad necesito identificar al menos dos componentes concretos del catálogo. Indícame, por ejemplo, el procesador y la placa madre exactos.',
      quick_replies: ['Ver placas compatibles', 'Comparar componentes', 'Hablar con asesor'],
      requiere_asesor: false,
      productos_mencionados: mencionados,
    };
  }

  const validacion = evaluarPareja(mencionados);
  const lineas = [
    validacion.compatible
      ? 'Sí, los componentes identificados son compatibles según las reglas técnicas disponibles.'
      : 'No recomiendo esa combinación: hay incompatibilidades técnicas.',
    '',
    '**Componentes revisados:**',
    ...mencionados.map((producto) => `- ${describirProducto(producto)}`),
  ];

  if (validacion.errores.length > 0) {
    lineas.push('', '**Problemas:**', ...validacion.errores.map((error) => `- ${error}`));
  }
  if (validacion.advertencias.length > 0) {
    lineas.push('', '**Advertencias:**', ...validacion.advertencias.map((advertencia) => `- ${advertencia}`));
  }

  const placas = productosPorCategoria(productos, 'placa_madre', 3);
  if (!validacion.compatible && placas.length > 0) {
    lineas.push('', '**Alternativas a revisar:**', ...placas.map((producto) => `- ${producto.nombre}`));
  }

  return {
    respuesta: lineas.join('\n'),
    quick_replies: ['Comparar alternativas', 'Armar una PC compatible', 'Hablar con asesor'],
    requiere_asesor: false,
    productos_mencionados: mencionados,
  };
}

module.exports = {
  consultarCompatibilidad,
};
