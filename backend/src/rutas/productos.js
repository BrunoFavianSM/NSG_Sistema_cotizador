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
const { verificarToken } = require('../middleware/auth');
const uploadImagen = require('../middleware/multerImagen');
const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  subirImagenProducto,
  limpiarCatalogo,
} = require('../controladores/controladorProductos');

// Rutas públicas (no requieren autenticación)
router.get('/', obtenerProductos);
router.get('/:categoria/:id', obtenerProductoPorId);

// Rutas protegidas (requieren autenticación de administrador)
router.post('/', verificarToken, crearProducto);
router.put('/:categoria/:id', verificarToken, actualizarProducto);
router.delete('/:categoria/:id', verificarToken, eliminarProducto);
router.delete('/limpiar', verificarToken, limpiarCatalogo);

// Subida de imagen de producto
router.post(
  '/:categoria/:id/imagen',
  verificarToken,
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
