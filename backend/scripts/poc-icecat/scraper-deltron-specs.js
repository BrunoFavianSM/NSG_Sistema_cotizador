'use strict';

/**
 * Scraper de la seccion "Especificaciones" de la ficha de Deltron.
 *
 * Se usa como FALLBACK cuando Icecat no tiene el producto (404) o lo cobra (403).
 * Devuelve un JSON con estructura tipo Icecat (GeneralInfo + FeaturesGroups) para
 * que sea intercambiable con las respuestas de la API.
 *
 * La tabla de specs (div#esp_tecnicas > #contenedorHtml > table[tbn="3"]) tiene:
 *   - Filas simples:  <td firCol="y">MARCA</td><td colspan="2">AMD</td>
 *   - Filas agrupadas: <td firCol="y" rowspan="N">NUCLEOS</td><td>SUBNOMBRE</td><td>VALOR</td>
 *                      + (N-1) filas siguientes con <td>SUBNOMBRE</td><td>VALOR</td>
 */

const axios = require('axios');

const URL_BASE = 'https://www.deltron.com.pe/modulos/productos/items/producto.php?item_number=';
const TIMEOUT_MS = 15000;

function decodificar(texto) {
  return (texto || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&aacute;/gi, 'á').replace(/&eacute;/gi, 'é').replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó').replace(/&uacute;/gi, 'ú').replace(/&ntilde;/gi, 'ñ')
    .replace(/&deg;/gi, '°').replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function celdasDeFila(trHtml) {
  const celdas = [];
  const re = /<td([^>]*)>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = re.exec(trHtml)) !== null) {
    const attrs = m[1] || '';
    const rowspanMatch = attrs.match(/rowspan\s*=\s*"?(\d+)"?/i);
    celdas.push({
      esFirCol: /firCol\s*=\s*"?y"?/i.test(attrs),
      rowspan: rowspanMatch ? parseInt(rowspanMatch[1], 10) : 1,
      texto: decodificar(m[2])
    });
  }
  return celdas;
}

/**
 * Parsea la tabla de especificaciones a una lista de grupos tipo Icecat.
 */
function parsearEspecificaciones(html) {
  const inicio = html.indexOf('id="esp_tecnicas"');
  if (inicio === -1) return [];

  // Tabla interna con los datos (tbn="3"); es la mas profunda, cierra en el primer </table>.
  const tbn3 = html.indexOf('tbn="3"', inicio);
  if (tbn3 === -1) return [];
  const fin = html.indexOf('</table>', tbn3);
  const tabla = html.slice(tbn3, fin === -1 ? undefined : fin);

  const filas = [];
  const reTr = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = reTr.exec(tabla)) !== null) {
    const celdas = celdasDeFila(m[1]);
    if (celdas.length) filas.push(celdas);
  }

  const generales = []; // pares clave-valor sueltos
  const grupos = [];
  let grupoActual = null;
  let subFilasRestantes = 0;

  for (const celdas of filas) {
    const primera = celdas[0];

    if (primera && primera.esFirCol) {
      const etiqueta = primera.texto;
      const resto = celdas.slice(1).filter((c) => c.texto !== '');

      if (primera.rowspan > 1 || resto.length >= 2) {
        // Grupo con sub-features.
        grupoActual = { nombre: etiqueta, features: [] };
        if (resto.length >= 2) {
          grupoActual.features.push({ nombre: resto[0].texto, valor: resto[1].texto });
        }
        grupos.push(grupoActual);
        subFilasRestantes = Math.max(0, primera.rowspan - 1);
      } else {
        // Fila simple clave-valor.
        if (resto.length >= 1) generales.push({ nombre: etiqueta, valor: resto[0].texto });
        grupoActual = null;
        subFilasRestantes = 0;
      }
    } else if (grupoActual && subFilasRestantes > 0) {
      // Sub-fila de continuacion del grupo actual.
      const noVacias = celdas.filter((c) => c.texto !== '');
      if (noVacias.length >= 2) {
        grupoActual.features.push({ nombre: noVacias[0].texto, valor: noVacias[1].texto });
      }
      subFilasRestantes--;
    }
  }

  // Estructura tipo Icecat: FeaturesGroups[].FeatureGroup.Name.Value + Features[].Feature.Name.Value + PresentationValue
  const featuresGroups = [];
  if (generales.length) {
    featuresGroups.push({
      FeatureGroup: { Name: { Value: 'General' } },
      Features: generales.map((g) => ({ Feature: { Name: { Value: g.nombre } }, PresentationValue: g.valor }))
    });
  }
  for (const grupo of grupos) {
    featuresGroups.push({
      FeatureGroup: { Name: { Value: grupo.nombre } },
      Features: grupo.features.map((f) => ({ Feature: { Name: { Value: f.nombre } }, PresentationValue: f.valor }))
    });
  }
  return featuresGroups;
}

function extraerDescripcion(html) {
  const i = html.indexOf('id="home"');
  if (i === -1) return '';
  const fin = html.indexOf('</div>', html.indexOf('<div', i + 1));
  return decodificar(html.slice(i, fin === -1 ? i + 1500 : fin)).slice(0, 500);
}

function extraerTitulo(html) {
  const m = html.match(/title-name-product[^>]*itemprop="name">([^<]+)</);
  return m ? decodificar(m[1]) : null;
}

/**
 * Construye la ficha tipo Icecat a partir de un HTML ya descargado.
 * Permite reutilizar la misma peticion que se uso para extraer el MPN
 * (una sola request por producto = mas gentil con Deltron).
 */
function construirFichaDeHtml(html, codigoDeltron, marca) {
  const featuresGroups = parsearEspecificaciones(html);
  const totalFeatures = featuresGroups.reduce((a, g) => a + g.Features.length, 0);

  // Estructura identica a la respuesta de Icecat: wrapper {ok,status,consulta,data}
  // y dentro data = { data: { GeneralInfo, FeaturesGroups }, msg, StatusCode }.
  return {
    ok: totalFeatures > 0,
    fuente: 'deltron-scraping',
    status: 200,
    consulta: { codigo: codigoDeltron, marca },
    data: {
      msg: 'OK',
      StatusCode: 0,
      source: 'deltron-scraping',
      data: {
        GeneralInfo: {
          Title: extraerTitulo(html),
          Brand: marca || null,
          BrandPartCode: codigoDeltron,
          SummaryDescription: { ShortSummaryDescription: extraerDescripcion(html) }
        },
        FeaturesGroups: featuresGroups
      }
    }
  };
}

/**
 * Devuelve la ficha de Deltron en formato tipo Icecat (hace su propia peticion).
 */
async function fetchDeltronSpecs(codigoDeltron, marca) {
  const url = URL_BASE + encodeURIComponent(codigoDeltron);
  try {
    const { data: html, status } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-PE,es;q=0.9',
        Referer: 'https://www.deltron.com.pe/'
      },
      timeout: TIMEOUT_MS,
      validateStatus: () => true
    });

    if (status >= 400) {
      return { ok: false, fuente: 'deltron-scraping', status, error: 'http_' + status, consulta: { codigo: codigoDeltron } };
    }

    return construirFichaDeHtml(html, codigoDeltron, marca);
  } catch (err) {
    return {
      ok: false,
      fuente: 'deltron-scraping',
      status: null,
      error: err.code === 'ECONNABORTED' ? 'timeout' : (err.message || 'error_desconocido'),
      consulta: { codigo: codigoDeltron }
    };
  }
}

module.exports = { fetchDeltronSpecs, construirFichaDeHtml, parsearEspecificaciones };
