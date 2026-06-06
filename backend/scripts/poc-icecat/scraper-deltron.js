'use strict';

/**
 * Scraper liviano de la ficha de producto de Deltron.
 *
 * Dado el codigo del CSV, arma la URL de la ficha, descarga el HTML y extrae
 * el MPN (codigo de fabricante) con varios selectores redundantes.
 *
 * Una sola peticion GET por producto. El control de ritmo (delays) y la
 * tolerancia a fallos viven en el orquestador (ejecutar-poc.js).
 */

const axios = require('axios');

const URL_BASE = 'https://www.deltron.com.pe/modulos/productos/items/producto.php?item_number=';
const TIMEOUT_MS = 10000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'es-PE,es;q=0.9',
  Referer: 'https://www.deltron.com.pe/'
};

/**
 * Descarga el HTML de la ficha de un producto (una sola peticion).
 * Devuelve { html, status, url, error } sin lanzar excepcion.
 */
async function descargarHtmlDeltron(codigoDeltron) {
  const url = URL_BASE + encodeURIComponent(codigoDeltron);
  try {
    const { data: html, status } = await axios.get(url, {
      headers: HEADERS,
      timeout: TIMEOUT_MS,
      validateStatus: () => true
    });
    return { html: status >= 400 ? null : html, status, url };
  } catch (err) {
    return { html: null, status: null, url, error: err.code === 'ECONNABORTED' ? 'timeout' : (err.message || 'error_desconocido') };
  }
}

/**
 * Extrae el MPN (codigo de fabricante) y datos basicos desde un HTML ya descargado.
 */
function extraerMpnDeHtml(html, codigoDeltron) {
  // 3 selectores redundantes para maxima confiabilidad.
  const m1 = html.match(/<span class="product-price part-number"><b>([^<]+)<\/b>/);
  const m2 = html.match(/C[oó]digo de Fabricante:<\/b>\s*([A-Z0-9][^<]+?)</i);
  const m3 = html.match(/title-name-product[^>]*itemprop="name">([^<]+)</);
  const skuMatch = html.match(/itemprop="sku"[^>]*>([^<]+)</);

  const mpn = (m1 && m1[1]) || (m2 && m2[1] && m2[1].trim()) || null;

  return {
    codigo_consultado: codigoDeltron,
    sku_encontrado: skuMatch ? skuMatch[1].trim() : null,
    sku_coincide: skuMatch ? skuMatch[1].trim().toLowerCase() === codigoDeltron.toLowerCase() : false,
    mpn,
    mpn_metodo: m1 ? 'part-number' : m2 ? 'codigo-fabricante' : null,
    titulo_h1: m3 ? m3[1].trim() : null,
    timestamp: new Date().toISOString()
  };
}

async function fetchDeltron(codigoDeltron) {
  const { html, status, url, error } = await descargarHtmlDeltron(codigoDeltron);
  if (!html) {
    return { codigo_consultado: codigoDeltron, url, error: error || 'http_' + status, mpn: null, timestamp: new Date().toISOString() };
  }
  return Object.assign({ url }, extraerMpnDeHtml(html, codigoDeltron));
}

module.exports = { fetchDeltron, descargarHtmlDeltron, extraerMpnDeHtml };
