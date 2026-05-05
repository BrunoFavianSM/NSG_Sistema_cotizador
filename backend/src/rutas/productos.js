/**
 * Rutas de Productos — Arquitectura multi-tabla
 *
 * Define los endpoints para CRUD de productos y subida de imágenes.
 * Las rutas con :id ahora requieren :categoria para identificar la tabla.
 *
 * Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.5, 3.6, 3.7
 */

const express = require('express');
const router = express.Router();
const { verificarToken, verificarTokenAdmin, detectarUsuario } = require('../middleware/auth');
const uploadImagen = require('../middleware/multerImagen');
const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  subirImagenProducto,
  limpiarCatalogo,
  obtenerHistorialPrecios,
  buscarProductosCompatibles,
} = require('../controladores/controladorProductos');

// Rutas públicas con detección de usuario (strip de precios para invitados)
router.get('/', detectarUsuario, obtenerProductos);
// Búsqueda por compatibilidad — Req. 8.1, 8.2, 8.3, 8.4, 8.7, 8.8
// Debe registrarse antes de /:categoria/:id para evitar conflictos de parámetros
router.get('/buscar', detectarUsuario, buscarProductosCompatibles);
router.get('/:categoria/:id', detectarUsuario, obtenerProductoPorId);

// Historial de precios de un producto (solo admin) — Req. 3.4, 3.5, 3.6
router.get('/:id/historial-precios', verificarTokenAdmin, obtenerHistorialPrecios);

// Rutas protegidas (requieren autenticación de administrador)
router.post('/', verificarTokenAdmin, crearProducto);
router.put('/:categoria/:id', verificarTokenAdmin, actualizarProducto);
router.delete('/:categoria/:id', verificarTokenAdmin, eliminarProducto);
router.delete('/limpiar', verificarTokenAdmin, limpiarCatalogo);

// Subida de imagen de producto
router.post(
  '/:categoria/:id/imagen',
  verificarTokenAdmin,
  (req, res, next) => {
    uploadImagen.single('imagen')(req, res, (err) => {
      if (err) {
        if (err.codigo === 'TIPO_INVALIDO') {
          return res.status(400).json({ error: err.message });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'Imagen demasiado grande (máx 5 MB)' });
        }
        return next(err);
      }
      next();
    });
  },
  subirImagenProducto
);

module.exports = router;
