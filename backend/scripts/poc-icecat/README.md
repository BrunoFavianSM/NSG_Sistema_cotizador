# POC Icecat - Exploracion de datos (4 x 7 = 28 productos)

Script **standalone** para validar la API de Icecat y **guardar los JSON crudos**
que devuelve para los 7 componentes principales del cotizador. NO toca el sistema
existente (backend, frontend, BD). El objetivo es solo explorar que datos llegan
para decidir mas adelante cuales usar.

## Que hace

1. Lee el CSV de Deltron (`backend/assets/DCW_20260407094705.csv`), clasifica
   productos en las 7 categorias, normaliza la marca y elige 4 por categoria.
2. Para cada producto: scrapea la ficha de Deltron -> extrae el MPN.
3. Consulta Icecat con `MPN + Marca` y guarda el **JSON completo** en su carpeta.
4. Genera `reporte.md` con el resumen de ejecucion (sin analisis de campos).

Cada componente queda en su **propia carpeta con su propio JSON** (no se mezcla).

## Requisitos previos

Configurar en `backend/.env` (NO aqui, NO inline):

```
ICECAT_API_TOKEN=tu_api_token
ICECAT_CONTENT_TOKEN=tu_content_token
ICECAT_SHOPNAME=tu_usuario_icecat   # cuenta propia (catalogo full), NO el demo
ICECAT_LANG=ES                      # opcional, por defecto ES
```

> Usar el shopname de **tu cuenta Icecat**. `openIcecat-live` es el demo con
> catalogo recortado: muchos MPN no estaran.

## Como correr (Windows / PowerShell)

```powershell
cd backend\scripts\poc-icecat
npm install

# 1) Seleccionar los 28 productos del CSV
node seleccionar-productos.js

# 2) Ejecutar el POC sobre los 28 (scrape Deltron + consulta Icecat, ~3-4 min)
node ejecutar-poc.js

# 3) Obtener UN ejemplo COMPLETO por categoria (cambia de codigo ante 403/404)
node obtener-ejemplos.js

# 4) HIBRIDO: Icecat primero; si da 403 (pago) o 404, scrapea specs de Deltron
node ejecutar-hibrido.js
```

`ejecutar-hibrido.js` hace UNA sola peticion a Deltron por producto (extrae MPN y,
si hace falta, las Especificaciones del mismo HTML). El JSON de Deltron sale con la
MISMA estructura que Icecat (`data.data.FeaturesGroups`), en espanol. Asi se cubren
los componentes que Icecat cobra o no tiene. Salida: `resultados/hibrido/`.

`obtener-ejemplos.js` recorre productos de cada categoria cambiando de codigo
hasta conseguir un response 200 con features. Prioriza marcas que estan en Open
Icecat (gratis). Guarda en `resultados/ejemplos/{categoria}/`.

> Procesador: NO se consigue en Open Icecat. Intel y AMD no publican en el
> catalogo gratis (todo da 403 / pago). Es una limitacion estructural.

## Salida

```
resultados/icecat-raw/
  01-procesador-intel-xxx/
    00-deltron-extraccion.json   # MPN extraido de Deltron
    01-icecat-response.json      # JSON COMPLETO de Icecat (lo que importa)
  ...
  reporte.md                     # resumen de ejecucion
```

## Notas

- Procesamiento **secuencial** (sin paralelismo) con delays para no bloquear Deltron.
- Si un producto falla, se loguea y se continua; no aborta el lote.
- Procesador, Fuente y Case tienen pocas marcas mainstream en el CSV: se completan
  los 4 con diversidad de modelo dentro de las marcas buenas.
