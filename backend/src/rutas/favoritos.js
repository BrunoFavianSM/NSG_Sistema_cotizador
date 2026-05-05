/**
 * Rutas de Favoritos de Productos
 *
 * Todas las rutas requieren autenticación de usuario (admin o usuario registrado).
 *
 * GET    /api/productos/favoritos              → obtenerFavoritos
 * POST   /api/productos/favoritos              → agregarFavorito
 * DELETE /api/productos/favoritos/:idProducto  → eliminarFavorito
 *
 * Requisitos: 4.2
 */

const express = require('express');
const router = express.Router();
const { verificarTokenUsuario } = require('../middleware/auth');
const { obtenerFavoritos, agregarFavorito, eliminarFavorito } = require('../controladores/controladorFavoritos');

// Obtener lista de favoritos del usuario autenticado
router.get('/', verificarTokenUsuario, obtenerFavoritos);

// Agregar producto a favoritos
router.post('/', verificarTokenUsuario, agregarFavorito);

// Eliminar producto de favoritos
router.delete('/:idProducto', verificarTokenUsuario, eliminarFavorito);

module.exports = router;
