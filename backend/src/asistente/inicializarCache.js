/**
 * Inicialización de caché de embeddings al arrancar el servidor.
 * Precarga los embeddings de productos para evitar el timeout
 * en la primera interacción del usuario.
 */
const servicioEmbeddings = require('./servicioEmbeddings');

const CACHE_INICIALIZADO_KEY = 'cache_embeddings_inicializado';

async function inicializarCacheProductos() {
  if (process.env.AGENT_PIPELINE_ENABLED === 'false') {
    console.info('[Cache Embeddings] Pipeline deshabilitado, omitiendo precarga');
    return;
  }

  if (!process.env.NVIDIA_API_KEY) {
    console.warn('[Cache Embeddings] NVIDIA_API_KEY no configurada, omitiendo precarga');
    return;
  }

  console.info('[Cache Embeddings] Precargando embeddings de productos...');

  try {
    const { ejecutarQuery } = require('../configuracion/baseDatos');

    // Obtener todos los productos
    const resultado = await ejecutarQuery(
      `SELECT p.id, p.nombre, c.nombre AS nombre_categoria, p.precio_base,
              p.stock, p.disponible_a_pedido
       FROM productos p
       INNER JOIN categorias c ON c.id = p.id_categoria
       WHERE p.stock > 0 OR p.disponible_a_pedido = TRUE
       ORDER BY p.id`
    );

    const productos = resultado.rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      nombre_categoria: r.nombre_categoria,
      precio_usd: r.precio_base ? Number(r.precio_base) : 0,
      stock: r.stock || 0,
      disponible_a_pedido: r.disponible_a_pedido || false,
    }));

    await servicioEmbeddings.obtenerEmbeddingsProductos(productos, ejecutarQuery);
    console.info(`[Cache Embeddings] Precarga completada: ${productos.length} productos`);
  } catch (error) {
    console.warn('[Cache Embeddings] Precarga falló (no crítico):', error.message);
  }
}

module.exports = { inicializarCacheProductos };