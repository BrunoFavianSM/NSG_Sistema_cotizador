'use strict';

/**
 * Cliente de la API live de Icecat.
 *
 * Consulta por MPN (ProductCode) + Marca (Brand), ambos obligatorios.
 * Devuelve el response COMPLETO sin filtrar: el POC guarda todo lo que Icecat
 * arroje para decidir mas adelante que datos usar.
 */

const axios = require('axios');
const { config } = require('./config');

const URL_API = 'https://live.icecat.biz/api';
const TIMEOUT_MS = 15000;

async function consultarIcecat({ mpn, marca, lang = config.lang }) {
  const params = new URLSearchParams({
    lang,
    shopname: config.shopname,
    ProductCode: mpn,
    Brand: marca
  });

  // app_key: requerido para fichas Full Icecat. Si esta vacio (cuenta Open),
  // Icecat devuelve 403 StatusCode 9 en los productos que no son Open.
  if (config.appKey) {
    params.set('app_key', config.appKey);
  }

  try {
    const respuesta = await axios.get(URL_API + '?' + params.toString(), {
      headers: {
        'api-token': config.apiToken,
        'content-token': config.contentToken
      },
      timeout: TIMEOUT_MS,
      validateStatus: () => true // capturar 4xx/5xx sin lanzar excepcion
    });

    return {
      ok: respuesta.status === 200,
      status: respuesta.status,
      consulta: { mpn, marca, lang },
      data: respuesta.data
    };
  } catch (err) {
    return {
      ok: false,
      status: null,
      consulta: { mpn, marca, lang },
      error: err.code === 'ECONNABORTED' ? 'timeout' : (err.message || 'error_desconocido')
    };
  }
}

/**
 * Genera variantes limpias de un MPN para reintentar SOLO cuando el original
 * dio 404. El original siempre va primero, asi no se arriesgan los MPN que ya
 * funcionan (muchos MPN reales empiezan con 2 letras + guion: GP-P650G, MZ-77E500E).
 */
function variantesMpn(mpn) {
  const variantes = [];
  const agregar = (v) => {
    const limpio = (v || '').trim();
    if (limpio && !variantes.includes(limpio)) variantes.push(limpio);
  };

  agregar(mpn); // 1) original (siempre primero)
  agregar(mpn.replace(/\s*\([^)]*\)/g, '')); // 2) sin parentesis: " (BULK)"
  agregar(mpn.replace(/^IN-/, '')); // 3) sin prefijo Deltron Intel "IN-"
  agregar(mpn.replace(/\s*\([^)]*\)/g, '').replace(/^IN-/, '')); // 4) combinadas
  agregar(mpn.split('/')[0]); // 5) ultimo recurso: antes del primer "/"

  return variantes;
}

/**
 * Consulta con fallback de variantes: prueba el MPN original y, si da 404,
 * va probando variantes limpias hasta encontrar el producto (200 o 403) o
 * agotar las opciones. Devuelve el resultado final + que variante se uso.
 */
async function consultarIcecatConVariantes({ mpn, marca, lang = config.lang, sleep }) {
  const variantes = variantesMpn(mpn);
  let ultimo = null;

  for (let i = 0; i < variantes.length; i++) {
    const candidato = variantes[i];
    const r = await consultarIcecat({ mpn: candidato, marca, lang });
    r.mpn_usado = candidato;
    r.mpn_original = mpn;
    r.variante_indice = i;
    ultimo = r;

    // Encontrado (con data o Full-only) -> no seguir probando.
    if (r.status === 200 || r.status === 403) return r;

    // Si quedan variantes por probar, respetar el ritmo entre requests.
    if (i < variantes.length - 1 && typeof sleep === 'function') {
      await sleep();
    }
  }

  return ultimo; // todas dieron 404 (o error)
}

module.exports = { consultarIcecat, consultarIcecatConVariantes, variantesMpn };
