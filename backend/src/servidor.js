require('dotenv').config();

// Advertencia de inicio: modo automático de tipo de cambio
if (!process.env.APIS_NET_TOKEN) {
  console.warn('[ADVERTENCIA] APIS_NET_TOKEN no está definido. El modo automático de tipo de cambio no estará disponible.');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { pool } = require('./configuracion/baseDatos');

const app = express();
const PUERTO = process.env.PORT || 3000;

// Seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// ─────────────────────────────────────────────────────────────
// Rate limiting diferenciado por tipo de endpoint
//
// En desarrollo los límites se multiplican x20 para no bloquear
// el flujo de trabajo (hot-reload, navegación frecuente, etc.).
// En producción se aplican los límites reales.
//
// Criterios de diseño:
//   - Auth:        muy restrictivo → protección contra fuerza bruta
//   - Asistente:   restrictivo     → cada request llama a APIs externas (Gemini/NVIDIA)
//   - Cotizaciones: moderado       → genera PDFs/Excel, queries pesadas
//   - Productos:   permisivo       → lectura simple, bajo costo en BD
//   - General:     fallback razonable para el resto
// ─────────────────────────────────────────────────────────────
const esDev = process.env.NODE_ENV === 'development';
const devMultiplier = esDev ? 20 : 1;

const mensajeRateLimit = {
  message: 'Demasiadas solicitudes desde esta IP, intente más tarde',
};

/** Auth: 10 req / 15 min — protección contra fuerza bruta en login/registro/recuperación */
const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10 * devMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensajeRateLimit,
});

/** Asistente IA: 20 req / 15 min — cada llamada consume tokens de APIs externas */
const limitadorAsistente = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20 * devMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensajeRateLimit,
});

/** Cotizaciones: 60 req / 15 min — genera PDFs/Excel y hace queries complejas */
const limitadorCotizaciones = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60 * devMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensajeRateLimit,
});

/** Productos: 500 req / 15 min — lectura de catálogo, bajo costo */
const limitadorProductos = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500 * devMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensajeRateLimit,
});

/** General: fallback para el resto de endpoints (/configuracion, /dashboard, etc.) */
const limitadorGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300 * devMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensajeRateLimit,
});

/** Reintento IA: 10 req / 15 min — operación administrativa que reactiva la cola de enriquecimiento */
const limitadorReintento = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10 * devMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensajeRateLimit,
});

// Aplicar limitadores específicos antes del general (Express los evalúa en orden)
app.use('/api/auth', limitadorAuth);
app.use('/api/asistente', limitadorAsistente);
app.use('/api/cotizaciones', limitadorCotizaciones);
app.use('/api/productos', limitadorProductos);
app.use('/api/', limitadorGeneral);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/dashboard', require('./rutas/dashboard'));
// Favoritos debe registrarse antes de /api/productos para que Express no interprete
// "favoritos" como un parámetro de ruta de productos.
app.use('/api/productos/favoritos', require('./rutas/favoritos'));
app.use('/api/productos', require('./rutas/productos'));
app.use('/api/cotizaciones', require('./rutas/cotizaciones'));
app.use('/api/compatibilidad', require('./rutas/compatibilidad'));
// app.use('/api/ia', require('./rutas/ia'));           // movido a _asistente_legacy/back_3
app.use('/api/auth', require('./rutas/auth'));
app.use('/api/clientes', require('./rutas/clientes'));
app.use('/api/configuracion', require('./rutas/configuracion'));
app.use('/api/tipo-cambio', require('./rutas/tipoCambio'));
const rutasImportacion = require('./rutas/importacion');
rutasImportacion.setLimitadorReintento(limitadorReintento);
app.use('/api/importacion', rutasImportacion);
app.use('/api/notificaciones', require('./rutas/notificaciones'));
// app.use('/api/asistente', require('./rutas/rutasAsistente')); // movido a _asistente_legacy/back_3
app.use('/api/asistente', require('./asistente/rutasAsistente'));

// Recuperar productos pendientes de enriquecimiento IA al arrancar (diseño §4.5)
// No bloquea el inicio del servidor; fallo se registra como advertencia.
const servicioEnriquecimientoIA = require('./servicios/servicioEnriquecimientoIA');
const { ejecutarQuery } = require('./configuracion/baseDatos');
servicioEnriquecimientoIA.reactivarDesdeDB(ejecutarQuery).catch((err) =>
  console.warn('[EnriquecimientoIA] Cola pendiente no recuperada:', err.message)
);

// Servir imágenes subidas
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ estado: 'ok', baseDatos: 'conectada' });
  } catch (error) {
    res.status(500).json({ estado: 'error', baseDatos: 'desconectada' });
  }
});

// Manejo de errores centralizado
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      detalles: err.message
    });
  }
  
  // Errores de autenticación
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'No autorizado',
      detalles: err.message
    });
  }
  
  // Errores de base de datos
  if (err.code && err.code.startsWith('23')) { // PostgreSQL constraint errors
    return res.status(409).json({
      error: 'Error de integridad de datos',
      detalles: 'La operación viola restricciones de la base de datos'
    });
  }
  
  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    ruta: req.originalUrl
  });
});

// Solo iniciar el servidor si no estamos en modo test
if (require.main === module) {
  app.listen(PUERTO, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PUERTO}`);
  });

  // Precargar caché de embeddings (no bloquea el inicio del servidor)
  const { inicializarCacheProductos } = require('./asistente/inicializarCache');
  inicializarCacheProductos();
}

module.exports = app;
