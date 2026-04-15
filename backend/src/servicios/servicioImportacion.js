'use strict';

const { resolverCategoria, esCategoriaPrincipal } = require('../configuracion/catalogoProductos');

const MAPA_CATEGORIAS = {
  'cpu amd ryzen': 'procesador',
  'cpu amd athlon': 'procesador',
  'cpu ci': 'procesador',
  'cpu cu': 'procesador',
  'mb ci9': 'placa_madre',
  'mb cu9': 'placa_madre',
  'mb socket am4': 'placa_madre',
  'mb socket am5': 'placa_madre',
  'mb socket i': 'placa_madre',
  'mb socket lga': 'placa_madre',
  'mem ddr4': 'ram',
  'mem ddr5': 'ram',
  'mem sodimm': 'ram',
  'mem ddr3': 'ram',
  'ssd 2.5 sata': 'almacenamiento',
  'ssd m.2 nvme': 'almacenamiento',
  'ssd m.2 sata': 'almacenamiento',
  'disco duro 3.5 sata': 'almacenamiento',
  'video, pci exp nvidia': 'gpu',
  'video, pci exp radeon': 'gpu',
  'video, pci exp intel': 'gpu',
  'video, pci express nvidia': 'gpu',
  'cases, fuente para gaming': 'fuente',
  'cases, fuente certificada': 'fuente',
  'cases, fuente para': 'fuente',
  'cases atx ver2.0': 'case',
  'cases atx ver2.0 s/fuente': 'case',
  'cases micro atx': 'case',
  'cases sin fuente p/gamers': 'case',
  'cases atx': 'case',
  'mouse usb': 'mouse',
  'mouse inalambrico': 'mouse',
  'mouse para gamers': 'mouse',
  'teclado usb': 'teclado',
  'teclado inalambrico': 'teclado',
  'teclado para gamers': 'teclado',
  'teclado+mouse combo kit': 'teclado',
  'teclado+mouse kit inalamb': 'teclado',
  'camara, webcam': 'webcam',
  'mouse pad/mat, accesorios': 'mousepad',
  'audio, auricular c/mic': 'auricular',
  'audio, parlante inalambrc': 'parlante',
  'ms windows business': 'software_windows',
  'ms windows consumer': 'software_windows',
  'ms esd windows business': 'software_windows',
  'ms esd windows consumer': 'software_windows',
  'ms esd office': 'software_office',
  'ms esd office 365': 'software_office',
  'ms office': 'software_office',
  'software, antivirus': 'software_antivirus',
  'kaspersky esd consumo': 'software_antivirus',
  'kaspersky esd business': 'software_antivirus',
  'disco duro externo 2.5': 'almacenamiento_externo',
  'disco solido externo(ssd)': 'almacenamiento_externo',
  'mem flash, usb drive': 'almacenamiento_externo',
  'ups interactivo': 'ups',
  'estabilizador de tension': 'estabilizador',
  'monitor plano': 'monitor',
  'monitor curvo': 'monitor',
  'monitor gaming plano': 'monitor',
  'monitor gaming curvo': 'monitor',
  'monitores tft': 'monitor',
  'fan cooler cpu': 'cooler_aire',
  'cooler liquido cpu': 'cooler_liquido',
  'red wifi adaptadores usb': 'conectividad',
  'red wifi router-adsl': 'conectividad',
};

const _CLAVES_ORDENADAS = Object.keys(MAPA_CATEGORIAS).sort((a, b) => b.length - a.length);

function mapearCategoria(categoriaCSV) {
  const normalizada = String(categoriaCSV || '').toLowerCase().trim();
  for (const clave of _CLAVES_ORDENADAS) {
    if (normalizada.startsWith(clave)) return MAPA_CATEGORIAS[clave];
  }
  return null;
}

function limpiarNombre(descripcion) {
  return normalizarTextoHumano(String(descripcion || '').split('[@@@]')[0]).replace(/\s+/g, ' ').trim();
}

function parsearStock(valor) {
  const v = String(valor == null ? '' : valor).trim();
  if (v === '>20') return { stock: 21, disponible_a_pedido: false };
  if (v === '') return { stock: 0, disponible_a_pedido: true };
  const n = parseInt(v, 10);
  if (!isNaN(n) && n >= 0) return { stock: n, disponible_a_pedido: false };
  return { stock: 0, disponible_a_pedido: true };
}

function parsearPrecio(valor) {
  const bruto = String(valor == null ? '' : valor).trim();
  if (!bruto) return NaN;
  const normalizado = bruto.replace(/\s+/g, '').replace(/,/g, '');
  if (!/^\d+(\.\d+)?$/.test(normalizado)) return NaN;
  return parseFloat(normalizado);
}

function parsearLineaCSV(linea) {
  const campos = [];
  let actual = '';
  let dentroComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (dentroComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        dentroComillas = !dentroComillas;
      }
    } else if (c === ',' && !dentroComillas) {
      campos.push(actual);
      actual = '';
    } else {
      actual += c;
    }
  }
  campos.push(actual);
  return campos;
}

function decodificarTextoCSV(buffer) {
  // Deltron suele venir en ANSI/Windows-1252. Si UTF-8 genera muchos �,
  // usamos latin1 para preservar tildes y caracteres especiales.
  const utf8 = buffer.toString('utf8');
  const reemplazosUtf8 = utf8.split('\uFFFD').length - 1;
  if (reemplazosUtf8 > 0) {
    return buffer.toString('latin1');
  }
  return utf8;
}

function normalizarTextoHumano(valor) {
  let texto = String(valor || '');
  if (!texto) return '';

  const reemplazos = [
    ['Ã¡', 'á'], ['Ã©', 'é'], ['Ã­', 'í'], ['Ã³', 'ó'], ['Ãº', 'ú'],
    ['Ã', 'Á'], ['Ã‰', 'É'], ['Ã', 'Í'], ['Ã“', 'Ó'], ['Ãš', 'Ú'],
    ['Ã±', 'ñ'], ['Ã‘', 'Ñ'], ['Ã¼', 'ü'], ['Ãœ', 'Ü'],
    ['Â¿', '¿'], ['Â¡', '¡'], ['Â°', '°'], ['Â', ''],
    ['ï¿½', 'é'], ['\uFFFD', 'é'],
  ];

  for (const [origen, destino] of reemplazos) {
    texto = texto.split(origen).join(destino);
  }

  return texto.normalize('NFC');
}

function parsearCSV(buffer) {
  const texto = decodificarTextoCSV(buffer).replace(/^\uFEFF/, '');
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length === 0) return [];

  const limpiar = (campo) => normalizarTextoHumano(String(campo || '').replace(/^"|"$/g, '').trim());
  const encabezado = parsearLineaCSV(lineas[0]).map((c) => limpiar(c).toLowerCase());
  const esCSVEstructurado = encabezado.includes('categoria') && encabezado.includes('codigo_proveedor');

  if (esCSVEstructurado) {
    const idx = {
      categoria: encabezado.indexOf('categoria'),
      subcategoria: encabezado.indexOf('subcategoria'),
      categoria_proveedor: encabezado.indexOf('categoria_proveedor'),
      codigo_proveedor: encabezado.indexOf('codigo_proveedor'),
      marca: encabezado.indexOf('marca'),
      nombre: encabezado.indexOf('nombre'),
      descripcion_general: encabezado.indexOf('descripcion_general'),
      stock: encabezado.indexOf('stock'),
      disponible_a_pedido: encabezado.indexOf('disponible_a_pedido'),
      precio_base: encabezado.indexOf('precio_base'),
      garantia: encabezado.indexOf('garantia'),
      socket: encabezado.indexOf('socket'),
      cpu_nucleos: encabezado.indexOf('cpu_nucleos'),
      cpu_hilos: encabezado.indexOf('cpu_hilos'),
      cpu_frecuencia_base_ghz: encabezado.indexOf('cpu_frecuencia_base_ghz'),
      cpu_frecuencia_boost_ghz: encabezado.indexOf('cpu_frecuencia_boost_ghz'),
      cpu_tdp_w: encabezado.indexOf('cpu_tdp_w'),
      cpu_graficos_integrados: encabezado.indexOf('cpu_graficos_integrados'),
      mb_chipset: encabezado.indexOf('mb_chipset'),
      mb_form_factor: encabezado.indexOf('mb_form_factor'),
      mb_ram_tipo: encabezado.indexOf('mb_ram_tipo'),
      mb_max_ram_gb: encabezado.indexOf('mb_max_ram_gb'),
      mb_m2_slots: encabezado.indexOf('mb_m2_slots'),
      mb_pcie_version: encabezado.indexOf('mb_pcie_version'),
      ram_tipo: encabezado.indexOf('ram_tipo'),
      ram_capacidad_gb: encabezado.indexOf('ram_capacidad_gb'),
      ram_velocidad_mhz: encabezado.indexOf('ram_velocidad_mhz'),
      ram_cantidad_modulos: encabezado.indexOf('ram_cantidad_modulos'),
      storage_tipo: encabezado.indexOf('storage_tipo'),
      storage_capacidad_gb: encabezado.indexOf('storage_capacidad_gb'),
      storage_interfaz: encabezado.indexOf('storage_interfaz'),
      storage_form_factor: encabezado.indexOf('storage_form_factor'),
      storage_nvme_gen: encabezado.indexOf('storage_nvme_gen'),
      gpu_chipset: encabezado.indexOf('gpu_chipset'),
      gpu_vram_gb: encabezado.indexOf('gpu_vram_gb'),
      gpu_vram_tipo: encabezado.indexOf('gpu_vram_tipo'),
      gpu_tdp_w: encabezado.indexOf('gpu_tdp_w'),
      gpu_longitud_mm: encabezado.indexOf('gpu_longitud_mm'),
      psu_wattage: encabezado.indexOf('psu_wattage'),
      psu_certificacion: encabezado.indexOf('psu_certificacion'),
      psu_modular: encabezado.indexOf('psu_modular'),
      psu_form_factor: encabezado.indexOf('psu_form_factor'),
      case_form_factor: encabezado.indexOf('case_form_factor'),
      case_color: encabezado.indexOf('case_color'),
      case_max_gpu_mm: encabezado.indexOf('case_max_gpu_mm'),
      case_compatibilidad_placa: encabezado.indexOf('case_compatibilidad_placa'),
    };

    return lineas
      .slice(1)
      .map((linea, indice) => {
        const campos = parsearLineaCSV(linea);
        const stock = limpiar(campos[idx.stock]);
        const pedido = limpiar(campos[idx.disponible_a_pedido]).toLowerCase();
        const stockRaw = stock === '' && (pedido === 'true' || pedido === '1') ? '' : stock;

        return {
          _fila: indice + 2,
          categoria: limpiar(campos[idx.categoria]),
          subcategoria: limpiar(campos[idx.subcategoria]),
          categoria_proveedor: limpiar(campos[idx.categoria_proveedor]),
          codigo: limpiar(campos[idx.codigo_proveedor]),
          nombre_descripcion: limpiar(campos[idx.nombre]),
          descripcion_general: limpiar(campos[idx.descripcion_general]),
          stock_raw: stockRaw,
          precio_usd_raw: limpiar(campos[idx.precio_base]),
          garantia: limpiar(campos[idx.garantia]),
          marca: limpiar(campos[idx.marca]),
          socket: limpiar(campos[idx.socket]),
          cpu_nucleos: limpiar(campos[idx.cpu_nucleos]),
          cpu_hilos: limpiar(campos[idx.cpu_hilos]),
          cpu_frecuencia_base_ghz: limpiar(campos[idx.cpu_frecuencia_base_ghz]),
          cpu_frecuencia_boost_ghz: limpiar(campos[idx.cpu_frecuencia_boost_ghz]),
          cpu_tdp_w: limpiar(campos[idx.cpu_tdp_w]),
          cpu_graficos_integrados: limpiar(campos[idx.cpu_graficos_integrados]),
          mb_chipset: limpiar(campos[idx.mb_chipset]),
          mb_form_factor: limpiar(campos[idx.mb_form_factor]),
          mb_ram_tipo: limpiar(campos[idx.mb_ram_tipo]),
          mb_max_ram_gb: limpiar(campos[idx.mb_max_ram_gb]),
          mb_m2_slots: limpiar(campos[idx.mb_m2_slots]),
          mb_pcie_version: limpiar(campos[idx.mb_pcie_version]),
          ram_tipo: limpiar(campos[idx.ram_tipo]),
          ram_capacidad_gb: limpiar(campos[idx.ram_capacidad_gb]),
          ram_velocidad_mhz: limpiar(campos[idx.ram_velocidad_mhz]),
          ram_cantidad_modulos: limpiar(campos[idx.ram_cantidad_modulos]),
          storage_tipo: limpiar(campos[idx.storage_tipo]),
          storage_capacidad_gb: limpiar(campos[idx.storage_capacidad_gb]),
          storage_interfaz: limpiar(campos[idx.storage_interfaz]),
          storage_form_factor: limpiar(campos[idx.storage_form_factor]),
          storage_nvme_gen: limpiar(campos[idx.storage_nvme_gen]),
          gpu_chipset: limpiar(campos[idx.gpu_chipset]),
          gpu_vram_gb: limpiar(campos[idx.gpu_vram_gb]),
          gpu_vram_tipo: limpiar(campos[idx.gpu_vram_tipo]),
          gpu_tdp_w: limpiar(campos[idx.gpu_tdp_w]),
          gpu_longitud_mm: limpiar(campos[idx.gpu_longitud_mm]),
          psu_wattage: limpiar(campos[idx.psu_wattage]),
          psu_certificacion: limpiar(campos[idx.psu_certificacion]),
          psu_modular: limpiar(campos[idx.psu_modular]),
          psu_form_factor: limpiar(campos[idx.psu_form_factor]),
          case_form_factor: limpiar(campos[idx.case_form_factor]),
          case_color: limpiar(campos[idx.case_color]),
          case_max_gpu_mm: limpiar(campos[idx.case_max_gpu_mm]),
          case_compatibilidad_placa: limpiar(campos[idx.case_compatibilidad_placa]),
        };
      })
      .filter((fila) => fila.codigo);
  }

  return lineas.map((linea, indice) => {
    const campos = parsearLineaCSV(linea);
    return {
      _fila: indice + 1,
      categoria_proveedor: limpiar(campos[0]),
      codigo: limpiar(campos[1]),
      nombre_descripcion: limpiar(campos[2]),
      stock_raw: String(campos[3] || '').trim(),
      precio_usd_raw: String(campos[4] || '').trim(),
      garantia: limpiar(campos[6]),
      marca: limpiar(campos[8]),
    };
  });
}

function normalizarSocket(texto) {
  const t = texto.toLowerCase();
  const match = t.match(/\b(am5|am4|am3\+?|lga\s?\d{3,4}|tr4|s?trx4|fm2\+?)\b/i);
  if (!match) return null;
  return match[1].toUpperCase().replace(/\s+/g, ' ');
}

function normalizarRamTipo(texto) {
  const t = texto.toLowerCase();
  const match = t.match(/\b(ddr5|ddr4|ddr3)\b/i);
  return match ? match[1].toUpperCase() : null;
}

function normalizarFormFactor(texto) {
  const t = texto.toLowerCase();
  if (t.includes('e-atx') || t.includes('eatx')) return 'E-ATX';
  if (t.includes('micro atx') || t.includes('m-atx') || t.includes('matx')) return 'MICRO-ATX';
  if (t.includes('mini itx') || t.includes('mini-itx')) return 'MINI-ITX';
  if (t.includes('atx')) return 'ATX';
  return null;
}

function extraerNumero(regex, texto) {
  const m = texto.match(regex);
  if (!m) return null;
  const valor = Number(m[1] || m[2]);
  return Number.isFinite(valor) ? valor : null;
}

function extraerFrecuencias(texto) {
  const matches = [...texto.matchAll(/(\d+(?:\.\d+)?)\s*ghz/gi)].map((m) => Number(m[1]));
  if (matches.length === 0) return { base: null, boost: null };
  if (matches.length === 1) return { base: matches[0], boost: null };
  return { base: Math.min(...matches), boost: Math.max(...matches) };
}

function extraerCapacidadGb(texto) {
  const tb = extraerNumero(/(\d+(?:\.\d+)?)\s*tb/i, texto);
  if (tb != null) return Math.round(tb * 1024);
  return extraerNumero(/(\d+)\s*gb/i, texto);
}

function extraerSpecs(categoria, nombre, categoriaProveedor) {
  const texto = `${nombre} ${categoriaProveedor}`;
  const textoLower = texto.toLowerCase();

  if (categoria === 'procesador') {
    const frec = extraerFrecuencias(textoLower);
    const graficosIntegrados = textoLower.includes(' sin graficos')
      ? false
      : (/\bi[3579]-\d{4,5}f\b/i.test(nombre) ? false : (textoLower.includes('radeon graphics') || /\bryzen\s*\d+\s*\d+g\b/i.test(textoLower) || textoLower.includes('intel uhd')));
    return {
      socket: normalizarSocket(texto),
      cpu_nucleos: extraerNumero(/(\d{1,2})\s*(?:cores?|nucleos?)/i, textoLower) || extraerNumero(/\b(\d{1,2})c\b/i, textoLower),
      cpu_hilos: extraerNumero(/(\d{1,2})\s*(?:threads?|hilos?)/i, textoLower) || extraerNumero(/\b(\d{1,2})t\b/i, textoLower),
      cpu_frecuencia_base_ghz: frec.base,
      cpu_frecuencia_boost_ghz: frec.boost,
      cpu_tdp_w: extraerNumero(/tdp\D{0,6}(\d{2,4})\s*w/i, textoLower) || extraerNumero(/(\d{2,4})\s*w\D{0,6}tdp/i, textoLower),
      cpu_graficos_integrados: graficosIntegrados,
    };
  }

  if (categoria === 'placa_madre') {
    return {
      socket: normalizarSocket(texto),
      mb_chipset: (texto.match(/\b([abxh]\d{3}[a-z]?|z\d{3}|b\d{2,3})\b/i) || [])[1]?.toUpperCase() || null,
      mb_form_factor: normalizarFormFactor(texto),
      mb_ram_tipo: normalizarRamTipo(texto),
      mb_max_ram_gb: extraerNumero(/(?:hasta|max)\s*(\d{2,4})\s*gb/i, textoLower),
      mb_m2_slots: extraerNumero(/(\d)\s*x?\s*m\.?2/i, textoLower) || (textoLower.includes('m.2') ? 1 : null),
      mb_pcie_version: (texto.match(/pcie\s*(\d(?:\.\d)?)/i) || [])[1] || null,
    };
  }

  if (categoria === 'ram') {
    const kit = textoLower.match(/(\d+)\s*x\s*(\d+)\s*gb/);
    const capacidad = kit ? Number(kit[1]) * Number(kit[2]) : extraerCapacidadGb(textoLower);
    return {
      ram_tipo: normalizarRamTipo(texto),
      ram_capacidad_gb: capacidad,
      ram_velocidad_mhz: extraerNumero(/(\d{3,5})\s*mhz/i, textoLower),
      ram_cantidad_modulos: kit ? Number(kit[1]) : null,
    };
  }

  if (categoria === 'almacenamiento') {
    const tipo = textoLower.includes('nvme') ? 'ssd_nvme' : (textoLower.includes('ssd') ? 'ssd_sata' : (textoLower.includes('hdd') || textoLower.includes('disco duro') ? 'hdd' : null));
    const nvmeGen = (textoLower.match(/gen\s*([345])/i) || textoLower.match(/pcie\s*([345])\.0/i) || [])[1] || null;
    return {
      storage_tipo: tipo,
      storage_capacidad_gb: extraerCapacidadGb(textoLower),
      storage_interfaz: textoLower.includes('nvme') ? 'NVME' : (textoLower.includes('sata') ? 'SATA' : null),
      storage_form_factor: textoLower.includes('m.2') ? 'M.2' : (textoLower.includes('2.5') ? '2.5"' : null),
      storage_nvme_gen: nvmeGen ? `GEN${nvmeGen}` : null,
    };
  }

  if (categoria === 'gpu') {
    const matchVram = texto.match(/(\d{1,2})\s*gb\s*(gddr\d\w*)/i);
    return {
      gpu_chipset: (texto.match(/(rtx\s*\d{3,4}|gtx\s*\d{3,4}|rx\s*\d{3,4}|arc\s*[a-z0-9]+)/i) || [])[1]?.toUpperCase().replace(/\s+/g, ' ') || null,
      gpu_vram_gb: matchVram ? Number(matchVram[1]) : extraerNumero(/(\d{1,2})\s*gb/i, textoLower),
      gpu_vram_tipo: matchVram ? matchVram[2].toUpperCase() : null,
      gpu_tdp_w: extraerNumero(/tdp\D{0,6}(\d{2,4})\s*w/i, textoLower),
      gpu_longitud_mm: extraerNumero(/(\d{3})\s*mm/i, textoLower),
    };
  }

  if (categoria === 'fuente') {
    let certificacion = null;
    const cert = texto.match(/80\s*plus\s*(bronze|gold|silver|platinum|titanium)?/i);
    if (cert) certificacion = `80 PLUS ${String(cert[1] || '').toUpperCase()}`.trim();
    return {
      psu_wattage: extraerNumero(/\b(\d{3,4})\s*w\b/i, textoLower),
      psu_certificacion: certificacion,
      psu_modular: textoLower.includes('full modular') ? 'full_modular' : (textoLower.includes('semi modular') ? 'semi_modular' : (textoLower.includes('modular') ? 'modular' : 'no_modular')),
      psu_form_factor: normalizarFormFactor(texto),
    };
  }

  if (categoria === 'case') {
    return {
      case_form_factor: normalizarFormFactor(texto),
      case_color: (texto.match(/\b(black|negro|white|blanco|gris|silver|plateado|red|rojo)\b/i) || [])[1]?.toLowerCase() || null,
      case_max_gpu_mm: extraerNumero(/(?:gpu|vga)[^0-9]{0,20}(\d{3})\s*mm/i, textoLower),
      case_compatibilidad_placa: [normalizarFormFactor(texto) || 'ATX', 'MICRO-ATX', 'MINI-ITX'].filter(Boolean).join(','),
    };
  }

  return {};
}

function construirRegistroNormalizado(fila) {
  const categoriaDirecta = String(fila.categoria || '').trim().toLowerCase();
  const subcategoriaDirecta = String(fila.subcategoria || '').trim().toLowerCase();
  const categoriaMapeada = mapearCategoria(fila.categoria_proveedor);
  const categoriaEntrada = categoriaDirecta || categoriaMapeada;
  if (!categoriaEntrada) return null;

  const destino = resolverCategoria(categoriaEntrada);
  if (!destino) return null;

  const precio = parsearPrecio(fila.precio_usd_raw);
  if (!Number.isFinite(precio) || precio <= 0 || precio > 100000) {
    return { error: `precio_usd invalido: "${fila.precio_usd_raw}"` };
  }

  const nombreLimpio = limpiarNombre(fila.nombre_descripcion);
  if (!nombreLimpio || nombreLimpio.length < 3 || nombreLimpio.includes('[@@@') || nombreLimpio.includes('@@@')) {
    return null;
  }

  const stockInfo = parsearStock(fila.stock_raw);
  const subcategoriaFinal = destino.subcategoria || subcategoriaDirecta || '';
  const specsDetectadas = extraerSpecs(destino.categoria, nombreLimpio, fila.categoria_proveedor || '');
  const specsDesdeCSV = {
    socket: fila.socket || null,
    cpu_nucleos: fila.cpu_nucleos || null,
    cpu_hilos: fila.cpu_hilos || null,
    cpu_frecuencia_base_ghz: fila.cpu_frecuencia_base_ghz || null,
    cpu_frecuencia_boost_ghz: fila.cpu_frecuencia_boost_ghz || null,
    cpu_tdp_w: fila.cpu_tdp_w || null,
    cpu_graficos_integrados: fila.cpu_graficos_integrados || null,
    mb_chipset: fila.mb_chipset || null,
    mb_form_factor: fila.mb_form_factor || null,
    mb_ram_tipo: fila.mb_ram_tipo || null,
    mb_max_ram_gb: fila.mb_max_ram_gb || null,
    mb_m2_slots: fila.mb_m2_slots || null,
    mb_pcie_version: fila.mb_pcie_version || null,
    ram_tipo: fila.ram_tipo || null,
    ram_capacidad_gb: fila.ram_capacidad_gb || null,
    ram_velocidad_mhz: fila.ram_velocidad_mhz || null,
    ram_cantidad_modulos: fila.ram_cantidad_modulos || null,
    storage_tipo: fila.storage_tipo || null,
    storage_capacidad_gb: fila.storage_capacidad_gb || null,
    storage_interfaz: fila.storage_interfaz || null,
    storage_form_factor: fila.storage_form_factor || null,
    storage_nvme_gen: fila.storage_nvme_gen || null,
    gpu_chipset: fila.gpu_chipset || null,
    gpu_vram_gb: fila.gpu_vram_gb || null,
    gpu_vram_tipo: fila.gpu_vram_tipo || null,
    gpu_tdp_w: fila.gpu_tdp_w || null,
    gpu_longitud_mm: fila.gpu_longitud_mm || null,
    psu_wattage: fila.psu_wattage || null,
    psu_certificacion: fila.psu_certificacion || null,
    psu_modular: fila.psu_modular || null,
    psu_form_factor: fila.psu_form_factor || null,
    case_form_factor: fila.case_form_factor || null,
    case_color: fila.case_color || null,
    case_max_gpu_mm: fila.case_max_gpu_mm || null,
    case_compatibilidad_placa: fila.case_compatibilidad_placa || null,
  };
  const specs = { ...specsDetectadas, ...Object.fromEntries(Object.entries(specsDesdeCSV).filter(([, v]) => String(v || '').trim() !== '')) };

  return {
    categoria: destino.categoria,
    subcategoria: subcategoriaFinal,
    categoria_proveedor: fila.categoria_proveedor || '',
    codigo_proveedor: String(fila.codigo || '').trim().toLowerCase(),
    marca: (fila.marca || '').trim(),
    nombre: nombreLimpio,
    descripcion_general: (fila.descripcion_general || '').trim(),
    stock: stockInfo.stock,
    disponible_a_pedido: stockInfo.disponible_a_pedido,
    precio_base: Number(precio.toFixed(2)),
    garantia: fila.garantia || '',
    flete: '',
    es_componente_principal: esCategoriaPrincipal(destino.categoria),
    ...specs,
  };
}

async function obtenerIdCategoria(db, nombre, cache) {
  if (cache.has(nombre)) return cache.get(nombre);
  const r = await db('SELECT id FROM categorias WHERE nombre = $1', [nombre]);
  if (r.rows.length > 0) {
    cache.set(nombre, r.rows[0].id);
    return r.rows[0].id;
  }
  const creado = await db('INSERT INTO categorias (nombre, es_componente_principal) VALUES ($1, $2) RETURNING id', [nombre, esCategoriaPrincipal(nombre)]);
  cache.set(nombre, creado.rows[0].id);
  return creado.rows[0].id;
}

async function obtenerIdMarca(db, nombre, cache) {
  const marca = String(nombre || '').trim();
  if (!marca) return null;
  const clave = marca.toLowerCase();
  if (cache.has(clave)) return cache.get(clave);

  const ins = await db(
    'INSERT INTO marcas (nombre) VALUES ($1) ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id',
    [marca]
  );
  const id = ins.rows[0].id;
  cache.set(clave, id);
  return id;
}

async function upsertSpecs(db, categoria, idProducto, registro) {
  const specsPorCategoria = {
    procesador: {
      tabla: 'specs_procesador',
      campos: {
        socket: registro.socket,
        nucleos: registro.cpu_nucleos,
        hilos: registro.cpu_hilos,
        frecuencia_base_ghz: registro.cpu_frecuencia_base_ghz,
        frecuencia_boost_ghz: registro.cpu_frecuencia_boost_ghz,
        tdp_w: registro.cpu_tdp_w,
        graficos_integrados: registro.cpu_graficos_integrados,
      },
    },
    placa_madre: {
      tabla: 'specs_placa_madre',
      campos: {
        socket: registro.socket,
        chipset: registro.mb_chipset,
        form_factor: registro.mb_form_factor,
        ram_tipo: registro.mb_ram_tipo,
        max_ram_gb: registro.mb_max_ram_gb,
        m2_slots: registro.mb_m2_slots,
        pcie_version: registro.mb_pcie_version,
      },
    },
    ram: {
      tabla: 'specs_ram',
      campos: {
        ram_tipo: registro.ram_tipo,
        capacidad_gb: registro.ram_capacidad_gb,
        velocidad_mhz: registro.ram_velocidad_mhz,
        cantidad_modulos: registro.ram_cantidad_modulos,
      },
    },
    almacenamiento: {
      tabla: 'specs_almacenamiento',
      campos: {
        tipo_almacenamiento: registro.storage_tipo,
        capacidad_gb: registro.storage_capacidad_gb,
        interfaz: registro.storage_interfaz,
        form_factor: registro.storage_form_factor,
        nvme_gen: registro.storage_nvme_gen,
      },
    },
    gpu: {
      tabla: 'specs_gpu',
      campos: {
        chipset: registro.gpu_chipset,
        vram_gb: registro.gpu_vram_gb,
        vram_tipo: registro.gpu_vram_tipo,
        tdp_w: registro.gpu_tdp_w,
        longitud_mm: registro.gpu_longitud_mm,
      },
    },
    fuente: {
      tabla: 'specs_fuente',
      campos: {
        wattage: registro.psu_wattage,
        certificacion: registro.psu_certificacion,
        modular: registro.psu_modular,
        form_factor: registro.psu_form_factor,
      },
    },
    case: {
      tabla: 'specs_case',
      campos: {
        form_factor: registro.case_form_factor,
        color: registro.case_color,
        max_gpu_mm: registro.case_max_gpu_mm,
        compatibilidad_placa: registro.case_compatibilidad_placa,
      },
    },
  };

  const definicion = specsPorCategoria[categoria];
  if (!definicion) return;

  const columnas = Object.keys(definicion.campos);
  const valores = columnas.map((c) => definicion.campos[c] ?? null);
  const placeholders = columnas.map((_, i) => `$${i + 2}`);
  const updates = columnas.map((c) => `${c} = EXCLUDED.${c}`).join(', ');

  await db(
    `INSERT INTO ${definicion.tabla} (id_producto, ${columnas.join(', ')})
     VALUES ($1, ${placeholders.join(', ')})
     ON CONFLICT (id_producto) DO UPDATE SET ${updates}`,
    [idProducto, ...valores]
  );
}

async function importar(filas, db) {
  let insertados = 0;
  let actualizados = 0;
  let omitidos = 0;
  let errores = 0;
  const detalle_errores = [];

  const cacheCategorias = new Map();
  const cacheMarcas = new Map();

  for (const fila of filas) {
    const registro = construirRegistroNormalizado(fila);
    if (!registro) {
      omitidos++;
      continue;
    }
    if (registro.error) {
      errores++;
      detalle_errores.push({ fila: fila._fila, mensaje: registro.error });
      continue;
    }

    try {
      const idCategoria = await obtenerIdCategoria(db, registro.categoria, cacheCategorias);
      const idMarca = await obtenerIdMarca(db, registro.marca, cacheMarcas);

      const upsertProducto = await db(
        `INSERT INTO productos (
          id_categoria, id_marca, subcategoria, categoria_proveedor, codigo_proveedor,
          nombre, descripcion_general, precio_base, stock, disponible_a_pedido, garantia, flete
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (codigo_proveedor) DO UPDATE SET
          id_categoria = EXCLUDED.id_categoria,
          id_marca = EXCLUDED.id_marca,
          subcategoria = EXCLUDED.subcategoria,
          categoria_proveedor = EXCLUDED.categoria_proveedor,
          nombre = EXCLUDED.nombre,
          descripcion_general = EXCLUDED.descripcion_general,
          precio_base = EXCLUDED.precio_base,
          stock = EXCLUDED.stock,
          disponible_a_pedido = EXCLUDED.disponible_a_pedido,
          garantia = EXCLUDED.garantia,
          flete = EXCLUDED.flete
        RETURNING id, (xmax = 0) AS es_insercion`,
        [
          idCategoria,
          idMarca,
          registro.subcategoria || null,
          registro.categoria_proveedor,
          registro.codigo_proveedor,
          registro.nombre,
          registro.descripcion_general || null,
          registro.precio_base,
          registro.stock,
          registro.disponible_a_pedido,
          registro.garantia || null,
          null,
        ]
      );

      const idProducto = upsertProducto.rows[0].id;
      if (registro.es_componente_principal) {
        await upsertSpecs(db, registro.categoria, idProducto, registro);
      }

      if (upsertProducto.rows[0].es_insercion) insertados++;
      else actualizados++;
    } catch (err) {
      errores++;
      detalle_errores.push({ fila: fila._fila, mensaje: err.message });
    }
  }

  return { insertados, actualizados, omitidos, errores, detalle_errores };
}

function normalizarFilasParaCSV(filas) {
  const resultado = [];
  for (const fila of filas) {
    const registro = construirRegistroNormalizado(fila);
    if (!registro || registro.error) continue;
    resultado.push(registro);
  }

  return resultado.sort((a, b) => {
    const c = a.categoria.localeCompare(b.categoria, 'es');
    if (c !== 0) return c;
    const s = (a.subcategoria || '').localeCompare(b.subcategoria || '', 'es');
    if (s !== 0) return s;
    const m = (a.marca || '').localeCompare(b.marca || '', 'es');
    if (m !== 0) return m;
    return a.nombre.localeCompare(b.nombre, 'es');
  });
}

module.exports = {
  MAPA_CATEGORIAS,
  mapearCategoria,
  limpiarNombre,
  parsearStock,
  parsearLineaCSV,
  parsearCSV,
  importar,
  normalizarFilasParaCSV,
};
