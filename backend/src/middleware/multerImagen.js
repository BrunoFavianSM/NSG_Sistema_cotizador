'use strict';

/**
 * Middleware Multer — Imágenes de producto
 *
 * Almacena imágenes en disco (uploads/) con nombre aleatorio.
 * Acepta solo JPEG, PNG, WebP. Máximo 5 MB.
 *
 * Requisitos: 2.3, 2.4
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const almacenamientoImagen = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nombre = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, nombre);
  },
});

const filtroImagen = (_req, file, cb) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Tipo de archivo no permitido. Solo se aceptan JPEG, PNG y WebP.');
    error.codigo = 'TIPO_INVALIDO';
    cb(error);
  }
};

const uploadImagen = multer({
  storage: almacenamientoImagen,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: filtroImagen,
});

module.exports = uploadImagen;
