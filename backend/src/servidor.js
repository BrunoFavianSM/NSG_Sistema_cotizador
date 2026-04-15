require('dotenv').config();

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

// Rate limiting
const limitadorAPI = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, intente más tarde'
});
app.use('/api/', limitadorAPI);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/productos', require('./rutas/productos'));
app.use('/api/cotizaciones', require('./rutas/cotizaciones'));
app.use('/api/compatibilidad', require('./rutas/compatibilidad'));
app.use('/api/ia', require('./rutas/ia'));
app.use('/api/auth', require('./rutas/auth'));
app.use('/api/configuracion', require('./rutas/configuracion'));
app.use('/api/importacion', require('./rutas/importacion'));

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
}

module.exports = app;
