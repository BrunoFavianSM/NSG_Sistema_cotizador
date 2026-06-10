'use strict';

/**
 * Carga y valida las credenciales de Icecat.
 *
 * Fuente unica de configuracion: el .env del backend (backend/.env), cargado
 * via dotenv. NO se hardcodea ningun token ni se cae silenciosamente al shopname
 * demo (openIcecat-live), que tiene un catalogo recortado.
 */

const path = require('path');

// backend/.env  ->  desde scripts/poc-icecat/ son dos niveles arriba.
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  apiToken: process.env.ICECAT_API_TOKEN,
  contentToken: process.env.ICECAT_CONTENT_TOKEN,
  shopname: process.env.ICECAT_SHOPNAME,
  // app_key: obligatorio para acceder a fichas Full Icecat (StatusCode 9).
  // Los usuarios Open Icecat NO lo tienen; queda vacio hasta tener suscripcion Full.
  appKey: process.env.ICECAT_APP_KEY || '',
  lang: process.env.ICECAT_LANG || 'ES'
};

/**
 * Valida que las 3 credenciales obligatorias esten presentes.
 * Aborta el proceso con mensaje claro si falta alguna (fail-fast).
 */
function validarCredenciales() {
  const obligatorias = {
    ICECAT_API_TOKEN: config.apiToken,
    ICECAT_CONTENT_TOKEN: config.contentToken,
    ICECAT_SHOPNAME: config.shopname
  };

  const faltantes = Object.entries(obligatorias)
    .filter(([, valor]) => !valor || !String(valor).trim())
    .map(([clave]) => clave);

  if (faltantes.length > 0) {
    console.error('\n[ERROR] Faltan credenciales de Icecat en backend/.env:');
    faltantes.forEach((clave) => console.error('  - ' + clave));
    console.error('\nConfigura las 3 variables en backend/.env antes de correr el POC.');
    console.error('Usa el shopname de TU cuenta Icecat (catalogo full), NO el demo.\n');
    process.exit(1);
  }

  if (config.shopname.toLowerCase() === 'openicecat-live') {
    console.warn('\n[ADVERTENCIA] ICECAT_SHOPNAME=openIcecat-live es la cuenta DEMO');
    console.warn('con catalogo recortado. Muchos MPN no estaran. Usa tu cuenta propia.\n');
  }
}

module.exports = { config, validarCredenciales };
