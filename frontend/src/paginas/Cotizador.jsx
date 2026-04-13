import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AsistenteIA from '../componentes/AsistenteIA';
import EmptyState from '../componentes/feedback/EmptyState';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import SuccessState from '../componentes/feedback/SuccessState';
import { useToast } from '../componentes/feedback/ToastProvider';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';
import { etiquetaMonedaBase, formatearMoneda } from '../utilidades/moneda';

const PASOS = [
  { id: 'procesador', nombre: 'Procesador', categoria: 'procesador' },
  { id: 'placa_madre', nombre: 'Placa madre', categoria: 'placa_madre' },
  { id: 'ram', nombre: 'Memoria RAM', categoria: 'ram' },
  { id: 'almacenamiento', nombre: 'Almacenamiento', categoria: 'almacenamiento' },
  { id: 'gpu', nombre: 'Tarjeta grafica', categoria: 'gpu' },
  { id: 'fuente', nombre: 'Fuente de poder', categoria: 'fuente' },
  { id: 'case', nombre: 'Case', categoria: 'case' },
];

function esEmailValido(email) {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).trim().toLowerCase());
}

function normalizarTelefono(telefono) {
  return String(telefono || '')
    .replace(/[^\d+]/g, '')
    .trim();
}

function obtenerEstadoStock(producto) {
  if (producto.stock > 0) {
    return { label: `Stock ${producto.stock}`, className: 'bg-[color:rgba(48,209,88,0.15)] text-[var(--color-success)]' };
  }
  if (producto.disponible_a_pedido) {
    return { label: 'A pedido', className: 'bg-[color:rgba(255,214,10,0.15)] text-[var(--color-warning)]' };
  }
  return { label: 'Sin stock', className: 'bg-[color:rgba(255,69,58,0.15)] text-[var(--color-danger)]' };
}

function agruparRam(rams) {
  return rams.reduce((acc, ram) => {
    if (!acc[ram.id]) {
      acc[ram.id] = { producto: ram, cantidad: 1 };
    } else {
      acc[ram.id].cantidad += 1;
    }
    return acc;
  }, {});
}

function normalizarTexto(valor = '') {
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function obtenerTextoProducto(producto) {
  return `${producto?.nombre || ''} ${producto?.descripcion_tecnica || ''}`;
}

function extraerMarca(producto) {
  const nombre = String(producto?.nombre || '').trim();
  if (!nombre) return 'Otros';

  const marcasConocidas = [
    'be quiet!',
    'cooler master',
    'lian li',
    'g.skill',
    'wd',
    'western digital',
    'intel',
    'amd',
    'asus',
    'msi',
    'gigabyte',
    'asrock',
    'corsair',
    'kingston',
    'teamgroup',
    'crucial',
    'samsung',
    'seagate',
    'nvidia',
    'evga',
    'thermaltake',
    'seasonic',
    'nzxt',
    'fractal',
    'phanteks',
    'montech',
    'deepcool',
    'patriot',
  ];

  const normalizado = normalizarTexto(nombre);
  const marcaConocida = marcasConocidas.find((marca) => normalizado.startsWith(marca));
  if (marcaConocida) {
    if (marcaConocida === 'wd' || marcaConocida === 'western digital') return 'WD';
    if (marcaConocida === 'be quiet!') return 'be quiet!';
    if (marcaConocida === 'cooler master') return 'Cooler Master';
    if (marcaConocida === 'lian li') return 'Lian Li';
    if (marcaConocida === 'g.skill') return 'G.Skill';
    return marcaConocida.charAt(0).toUpperCase() + marcaConocida.slice(1);
  }

  const primeraPalabra = nombre.split(/\s+/)[0] || 'Otros';
  return primeraPalabra.replace(/[^\w!+.-]/g, '');
}

function extraerModeloProcesador(producto) {
  const texto = obtenerTextoProducto(producto);
  const matchCore = texto.match(/Core\s+i[3579]/i);
  if (matchCore) return matchCore[0].replace(/\s+/g, ' ');

  const matchRyzen = texto.match(/Ryzen\s+[3579]/i);
  if (matchRyzen) return matchRyzen[0].replace(/\s+/g, ' ');

  if (/threadripper/i.test(texto)) return 'Threadripper';
  if (/celeron/i.test(texto)) return 'Celeron';
  if (/pentium/i.test(texto)) return 'Pentium';

  return 'Otros modelos';
}

function extraerFrecuenciaRam(producto) {
  const texto = obtenerTextoProducto(producto);
  const match = texto.match(/(\d{4,5})\s*(?:mhz|mt\/s|mts)/i);
  return match ? `${match[1]} MHz` : 'No especificado';
}

function extraerCapacidadAlmacenamiento(producto) {
  const texto = obtenerTextoProducto(producto);
  const match = texto.match(/(\d+(?:\.\d+)?)\s*(TB|GB)/i);
  return match ? `${match[1]}${String(match[2]).toUpperCase()}` : 'No especificado';
}

function extraerTipoAlmacenamiento(producto) {
  const texto = normalizarTexto(obtenerTextoProducto(producto));
  if (texto.includes('m.2') || texto.includes('m2') || texto.includes('nvme')) return 'M.2 / NVMe';
  if (texto.includes('hdd') || texto.includes('rpm')) return 'HDD';
  if (texto.includes('ssd')) return 'SSD';
  return 'Otros';
}

function placaSoportaAlmacenamiento(placaMadre, productoAlmacenamiento) {
  if (!placaMadre) return true;
  const tipo = extraerTipoAlmacenamiento(productoAlmacenamiento);
  if (tipo !== 'M.2 / NVMe') return true;

  const textoPlaca = normalizarTexto(obtenerTextoProducto(placaMadre));
  if (!textoPlaca) return true;

  const noSoporta = /(sin m\.?2|sin nvme|no m\.?2|no nvme)/.test(textoPlaca);
  if (noSoporta) return false;

  const soporta = /(m\.?2|nvme|pcie)/.test(textoPlaca);
  if (soporta) return true;

  return true;
}

function extraerSerieGPU(producto) {
  const texto = normalizarTexto(obtenerTextoProducto(producto));
  const rtx = texto.match(/rtx\s*(\d{4})/);
  if (rtx) return `RTX ${rtx[1].charAt(0)}0`;

  const rx = texto.match(/rx\s*(\d{4})/);
  if (rx) return `RX ${rx[1].slice(0, 2)}00`;

  const gtx = texto.match(/gtx\s*(\d{3,4})/);
  if (gtx) return `GTX ${gtx[1].charAt(0)}00`;

  return 'Otras series';
}

function extraerPotenciaFuente(producto) {
  if (producto?.wattage) return `${producto.wattage} W`;
  const texto = obtenerTextoProducto(producto);
  const match = texto.match(/(\d{3,4})\s*w/i);
  return match ? `${match[1]} W` : 'No especificado';
}

function extraerValoresUnicos(lista) {
  return [...new Set(lista.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

function valorBooleano(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    const normalizado = valor.trim().toLowerCase();
    return ['1', 'si', 'true', 'yes', 'y'].includes(normalizado);
  }
  return false;
}

function StepIcon({ pasoId, className = 'h-4 w-4' }) {
  const baseProps = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
  };

  switch (pasoId) {
    case 'procesador':
      return (
        <svg {...baseProps}>
          <rect x="7" y="7" width="10" height="10" rx="2" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
        </svg>
      );
    case 'placa_madre':
      return (
        <svg {...baseProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <rect x="7" y="7" width="6" height="6" rx="1" />
          <path d="M16 7h1M16 10h1M16 13h1M8 16h8" />
        </svg>
      );
    case 'ram':
      return (
        <svg {...baseProps}>
          <rect x="2" y="8" width="20" height="8" rx="2" />
          <path d="M6 11h1M10 11h1M14 11h1M18 11h1M5 16v2M9 16v2M13 16v2M17 16v2" />
        </svg>
      );
    case 'almacenamiento':
      return (
        <svg {...baseProps}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="16.5" cy="12" r="1.5" />
          <path d="M7 12h5" />
        </svg>
      );
    case 'gpu':
      return (
        <svg {...baseProps}>
          <rect x="2" y="7" width="17" height="10" rx="2" />
          <circle cx="8.5" cy="12" r="2.2" />
          <path d="M19 10h3M19 14h3M5 17v2M9 17v2M13 17v2" />
        </svg>
      );
    case 'fuente':
      return (
        <svg {...baseProps}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="10" cy="12" r="3" />
          <path d="M15 9h3M15 12h3M15 15h3" />
        </svg>
      );
    case 'case':
      return (
        <svg {...baseProps}>
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <path d="M10 6h4M12 18v.01" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Cotizador() {
  const {
    configuracionSeleccionada,
    seleccionarComponente,
    agregarRAM,
    eliminarRAM,
    validarCompatibilidad,
    validacionCompatibilidad,
    calcularPrecioTotal,
    cargarProductos,
    productos,
    cargandoProductos,
    errorProductos,
    limpiarConfiguracion,
    autenticado,
    margenGanancia,
    calcularResumenFinanciero,
    monedaVista,
    formatearMontoSegunMonedaVista
  } = useAppContext();

  const navigate = useNavigate();
  const toast = useToast();

  const [pasoActual, setPasoActual] = useState(0);
  const [filtro, setFiltro] = useState('disponibles');
  const [filtrosPaso, setFiltrosPaso] = useState({
    procesadorMarca: 'all',
    procesadorModelo: 'all',
    placaMarca: 'all',
    ramMarca: 'all',
    ramFrecuencia: 'all',
    almacenamientoMarca: 'all',
    almacenamientoCapacidad: 'all',
    almacenamientoTipo: 'all',
    gpuMarca: 'all',
    gpuSerie: 'all',
    fuenteMarca: 'all',
    fuentePotencia: 'all',
    caseMarca: 'all',
  });
  const [generando, setGenerando] = useState(false);
  const [cotizacionGenerada, setCotizacionGenerada] = useState(null);
  const [errorGenerar, setErrorGenerar] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [intentoGenerar, setIntentoGenerar] = useState(false);

  const pasoInfo = PASOS[pasoActual];
  const total = calcularPrecioTotal();
  const resumenFinanciero = calcularResumenFinanciero();
  const esAdmin = autenticado === true;
  const nombreClienteLimpio = nombreCliente.trim();
  const emailClienteLimpio = emailCliente.trim().toLowerCase();
  const telefonoClienteLimpio = telefonoCliente.trim();
  const emailClienteEsValido = emailClienteLimpio ? esEmailValido(emailClienteLimpio) : false;
  const telefonoClienteEsValido = telefonoClienteLimpio ? normalizarTelefono(telefonoClienteLimpio).length >= 7 : true;
  const faltanDatosClientePublico = !esAdmin && (!nombreClienteLimpio || !emailClienteLimpio);
  const hayErrorNombreCliente = !esAdmin && intentoGenerar && !nombreClienteLimpio;
  const hayErrorEmailCliente = (!esAdmin && intentoGenerar && !emailClienteLimpio)
    || (emailClienteLimpio && !emailClienteEsValido);
  const hayErrorTelefonoCliente = telefonoClienteLimpio && !telefonoClienteEsValido;
  const datosClienteValidos = esAdmin
    ? (!emailClienteLimpio || emailClienteEsValido) && telefonoClienteEsValido
    : Boolean(nombreClienteLimpio && emailClienteEsValido && telefonoClienteEsValido);
  const procesadorTieneGraficosIntegrados = useMemo(() => {
    const procesador = configuracionSeleccionada.procesador;
    if (!procesador) return false;

    const camposBooleanos = [
      procesador.graficos_integrados,
      procesador.tiene_graficos_integrados,
      procesador.integrated_graphics,
      procesador.igpu,
      procesador.con_graficos,
    ];

    if (camposBooleanos.some((valor) => valorBooleano(valor))) return true;

    const texto = normalizarTexto(`${procesador.nombre || ''} ${procesador.descripcion_tecnica || ''}`);
    if (!texto.trim()) return false;

    const patronNegativo = /(sin\s+graficos?\s+integrados?|without integrated graphics|no\s+i?gpu)/;
    if (patronNegativo.test(texto)) return false;

    const patronIntegrados = /(graficos?\s+integrados?|integrated graphics|i?gpu|intel\s+uhd|intel\s+iris|radeon\s+graphics)/;
    return patronIntegrados.test(texto);
  }, [configuracionSeleccionada.procesador]);

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    const haySeleccion = Object.values(configuracionSeleccionada).some((valor) => {
      if (Array.isArray(valor)) return valor.length > 0;
      return valor !== null;
    });
    if (haySeleccion) validarCompatibilidad();
  }, [configuracionSeleccionada]);

  const pasoCompleto = (indicePaso) => {
    const paso = PASOS[indicePaso];
    const valor = configuracionSeleccionada[paso.id];
    if (paso.id === 'ram') return Array.isArray(valor) && valor.length > 0;
    if (paso.id === 'gpu' && procesadorTieneGraficosIntegrados) return true;
    return Boolean(valor);
  };

  const pasoHabilitado = (indicePaso) => {
    if (indicePaso === 0) return true;
    return pasoCompleto(indicePaso - 1);
  };

  const pasosCompletos = PASOS.filter((_, i) => pasoCompleto(i)).length;
  const configuracionCompleta = pasosCompletos === PASOS.length;

  const primerPasoPendiente = useMemo(
    () => PASOS.findIndex((_, indice) => !pasoCompleto(indice)),
    [configuracionSeleccionada]
  );

  const ramAgrupada = useMemo(
    () => agruparRam(configuracionSeleccionada.ram || []),
    [configuracionSeleccionada.ram]
  );

  const productosPasoBase = useMemo(() => {
    let lista = productos.filter((p) => p.categoria === pasoInfo.categoria);

    if (pasoInfo.id === 'placa_madre' && configuracionSeleccionada.procesador?.socket) {
      const socket = configuracionSeleccionada.procesador.socket;
      const compatibles = lista.filter((p) => !p.socket || p.socket === socket);
      if (compatibles.length > 0) lista = compatibles;
    }

    if (pasoInfo.id === 'ram' && configuracionSeleccionada.placa_madre?.ram_type) {
      const ramType = configuracionSeleccionada.placa_madre.ram_type;
      const compatibles = lista.filter((p) => !p.ram_type || p.ram_type === ramType);
      if (compatibles.length > 0) lista = compatibles;
    }

    if (pasoInfo.id === 'almacenamiento' && configuracionSeleccionada.placa_madre) {
      const compatibles = lista.filter((p) => placaSoportaAlmacenamiento(configuracionSeleccionada.placa_madre, p));
      if (compatibles.length > 0) lista = compatibles;
    }

    if (filtro === 'disponibles') {
      lista = lista.filter((p) => p.stock > 0 || p.disponible_a_pedido);
    }

    return lista;
  }, [productos, pasoInfo, configuracionSeleccionada, filtro]);

  const opcionesFiltrosPaso = useMemo(() => {
    switch (pasoInfo.id) {
      case 'procesador':
        return {
          marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)),
          modelos: extraerValoresUnicos(productosPasoBase.map(extraerModeloProcesador)),
        };
      case 'placa_madre':
        return { marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)) };
      case 'ram':
        return {
          marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)),
          frecuencias: extraerValoresUnicos(productosPasoBase.map(extraerFrecuenciaRam)),
        };
      case 'almacenamiento':
        return {
          marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)),
          capacidades: extraerValoresUnicos(productosPasoBase.map(extraerCapacidadAlmacenamiento)),
          tipos: extraerValoresUnicos(productosPasoBase.map(extraerTipoAlmacenamiento)),
        };
      case 'gpu':
        return {
          marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)),
          series: extraerValoresUnicos(productosPasoBase.map(extraerSerieGPU)),
        };
      case 'fuente':
        return {
          marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)),
          potencias: extraerValoresUnicos(productosPasoBase.map(extraerPotenciaFuente)),
        };
      case 'case':
        return { marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)) };
      default:
        return {};
    }
  }, [productosPasoBase, pasoInfo.id]);

  const productosFiltrados = useMemo(() => {
    let lista = [...productosPasoBase];
    const coincide = (valor, filtroActivo) => normalizarTexto(valor) === normalizarTexto(filtroActivo);

    switch (pasoInfo.id) {
      case 'procesador':
        if (filtrosPaso.procesadorMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.procesadorMarca));
        }
        if (filtrosPaso.procesadorModelo !== 'all') {
          lista = lista.filter((p) => coincide(extraerModeloProcesador(p), filtrosPaso.procesadorModelo));
        }
        break;
      case 'placa_madre':
        if (filtrosPaso.placaMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.placaMarca));
        }
        break;
      case 'ram':
        if (filtrosPaso.ramMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.ramMarca));
        }
        if (filtrosPaso.ramFrecuencia !== 'all') {
          lista = lista.filter((p) => coincide(extraerFrecuenciaRam(p), filtrosPaso.ramFrecuencia));
        }
        break;
      case 'almacenamiento':
        if (filtrosPaso.almacenamientoMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.almacenamientoMarca));
        }
        if (filtrosPaso.almacenamientoCapacidad !== 'all') {
          lista = lista.filter((p) => coincide(extraerCapacidadAlmacenamiento(p), filtrosPaso.almacenamientoCapacidad));
        }
        if (filtrosPaso.almacenamientoTipo !== 'all') {
          lista = lista.filter((p) => coincide(extraerTipoAlmacenamiento(p), filtrosPaso.almacenamientoTipo));
        }
        break;
      case 'gpu':
        if (filtrosPaso.gpuMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.gpuMarca));
        }
        if (filtrosPaso.gpuSerie !== 'all') {
          lista = lista.filter((p) => coincide(extraerSerieGPU(p), filtrosPaso.gpuSerie));
        }
        break;
      case 'fuente':
        if (filtrosPaso.fuenteMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.fuenteMarca));
        }
        if (filtrosPaso.fuentePotencia !== 'all') {
          lista = lista.filter((p) => coincide(extraerPotenciaFuente(p), filtrosPaso.fuentePotencia));
        }
        break;
      case 'case':
        if (filtrosPaso.caseMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.caseMarca));
        }
        break;
      default:
        break;
    }

    return lista;
  }, [productosPasoBase, pasoInfo.id, filtrosPaso]);

  const gruposProductos = useMemo(() => {
    if (pasoInfo.id === 'procesador') {
      const grupos = productosFiltrados.reduce((acc, producto) => {
        const modelo = extraerModeloProcesador(producto);
        if (!acc[modelo]) acc[modelo] = [];
        acc[modelo].push(producto);
        return acc;
      }, {});
      return Object.entries(grupos)
        .sort(([a], [b]) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
        .map(([titulo, items]) => ({ titulo, items }));
    }

    if (pasoInfo.id === 'almacenamiento') {
      const orden = ['M.2 / NVMe', 'SSD', 'HDD', 'Otros'];
      const grupos = productosFiltrados.reduce((acc, producto) => {
        const tipo = extraerTipoAlmacenamiento(producto);
        if (!acc[tipo]) acc[tipo] = [];
        acc[tipo].push(producto);
        return acc;
      }, {});
      return orden
        .filter((titulo) => Array.isArray(grupos[titulo]) && grupos[titulo].length > 0)
        .map((titulo) => ({ titulo, items: grupos[titulo] }));
    }

    return [{ titulo: null, items: productosFiltrados }];
  }, [productosFiltrados, pasoInfo.id]);

  const seleccionActual = configuracionSeleccionada[pasoInfo.id];
  const actualizarFiltroPaso = (clave, valor) => {
    setFiltrosPaso((prev) => ({ ...prev, [clave]: valor }));
  };

  const irAPaso = (indicePaso) => {
    if (!pasoHabilitado(indicePaso)) {
      toast.info('Paso bloqueado', 'Completa los pasos anteriores para avanzar.');
      return;
    }
    setPasoActual(indicePaso);
  };

  const irSiguiente = () => {
    if (!pasoCompleto(pasoActual)) {
      toast.warning('Falta seleccion', 'Selecciona un componente para continuar.');
      return;
    }
    if (pasoActual < PASOS.length - 1) setPasoActual((prev) => prev + 1);
  };

  const irAnterior = () => {
    if (pasoActual > 0) setPasoActual((prev) => prev - 1);
  };

  const seleccionarProducto = (producto) => {
    if (pasoInfo.id === 'ram') {
      agregarRAM(producto);
      return;
    }
    seleccionarComponente(pasoInfo.id, producto);
  };

  const resolverProducto = (entrada) => {
    if (!entrada) return null;
    const id = entrada.id ?? entrada.id_producto;
    if (id) {
      const encontradoPorId = productos.find((p) => Number(p.id) === Number(id));
      if (encontradoPorId) return encontradoPorId;
    }

    const nombre = String(entrada.nombre || '').toLowerCase().trim();
    if (!nombre) return null;
    return productos.find((p) => String(p.nombre || '').toLowerCase().trim() === nombre) || null;
  };

  const aplicarRecomendacionIA = (componentesRecomendados = {}) => {
    let cambios = 0;

    Object.entries(componentesRecomendados).forEach(([categoria, valor]) => {
      if (Array.isArray(valor) && categoria === 'ram') {
        valor.forEach((item) => {
          const producto = resolverProducto(item);
          if (producto) {
            agregarRAM(producto);
            cambios += 1;
          }
        });
        return;
      }

      const producto = resolverProducto(valor);
      if (producto && PASOS.some((paso) => paso.id === categoria)) {
        seleccionarComponente(categoria, producto);
        cambios += 1;
      }
    });

    if (cambios > 0) {
      toast.success('Recomendacion aplicada', `Se aplicaron ${cambios} componente(s) sugeridos.`);
    } else {
      toast.warning('Sin coincidencias', 'No se encontraron productos del catalogo para aplicar la recomendacion.');
    }
  };

  const quitarRam = (idProducto) => {
    let ultimoIndice = -1;
    (configuracionSeleccionada.ram || []).forEach((ram, index) => {
      if (ram.id === idProducto) ultimoIndice = index;
    });
    if (ultimoIndice >= 0) eliminarRAM(ultimoIndice);
  };

  const construirPayloadCotizacion = () => {
    const componentes = [];
    const pushComponente = (producto, cantidad = 1) => {
      if (!producto) return;
      componentes.push({ id_producto: producto.id, cantidad });
    };

    pushComponente(configuracionSeleccionada.procesador);
    pushComponente(configuracionSeleccionada.placa_madre);
    pushComponente(configuracionSeleccionada.almacenamiento);
    pushComponente(configuracionSeleccionada.gpu);
    pushComponente(configuracionSeleccionada.fuente);
    pushComponente(configuracionSeleccionada.case);

    Object.values(ramAgrupada).forEach((item) => pushComponente(item.producto, item.cantidad));

    const payload = { componentes };
    payload.margen_personalizado = Number(margenGanancia);
    if (nombreClienteLimpio) payload.nombre_cliente = nombreClienteLimpio;
    if (emailClienteLimpio) payload.email_cliente = emailClienteLimpio;
    if (telefonoClienteLimpio) payload.telefono_cliente = telefonoClienteLimpio;
    return payload;
  };

  const generarCotizacion = async () => {
    setIntentoGenerar(true);

    if (!configuracionCompleta) {
      if (primerPasoPendiente >= 0) setPasoActual(primerPasoPendiente);
      toast.warning('Configuracion incompleta', 'Completa todos los pasos antes de generar.');
      return;
    }

    if (validacionCompatibilidad.errores.length > 0) {
      toast.error('Incompatibilidades detectadas', 'Corrige los errores antes de continuar.');
      return;
    }

    if (!datosClienteValidos) {
      if (!esAdmin && faltanDatosClientePublico) {
        toast.warning('Datos incompletos', 'Ingresa nombre y correo para generar la cotizacion.');
      } else if (hayErrorEmailCliente) {
        toast.warning('Correo invalido', 'Corrige el correo del cliente para continuar.');
      } else if (hayErrorTelefonoCliente) {
        toast.warning('Telefono invalido', 'Ingresa un telefono valido o deja el campo vacio.');
      }
      return;
    }

    setGenerando(true);
    setErrorGenerar('');

    try {
      const respuesta = await api.crearCotizacion(construirPayloadCotizacion());
      setCotizacionGenerada(respuesta?.cotizacion || null);
      toast.success('Cotizacion generada', 'Ya puedes copiar el ticket o descargar el PDF.');
    } catch (error) {
      const mensaje = error?.mensaje || 'No se pudo generar la cotizacion.';
      setErrorGenerar(mensaje);
      toast.error('No se pudo generar', mensaje);
    } finally {
      setGenerando(false);
    }
  };

  const descargarPdf = () => {
    if (!cotizacionGenerada?.codigo_ticket) return;
    const urlPdf = api.obtenerUrlPdfCotizacion(cotizacionGenerada.codigo_ticket, monedaVista);
    const ventana = window.open(urlPdf, '_blank', 'noopener,noreferrer');
    if (!ventana) {
      toast.warning('Bloqueo de ventana', 'Permite pop-ups para abrir el PDF.');
      return;
    }
    toast.info('PDF abierto', 'Se abrio el archivo en una nueva pestana.');
  };

  const copiarTicket = async () => {
    if (!cotizacionGenerada?.codigo_ticket || !navigator.clipboard) {
      toast.error('No se pudo copiar', 'Tu navegador no permite copiar automaticamente.');
      return;
    }

    try {
      await navigator.clipboard.writeText(cotizacionGenerada.codigo_ticket);
      toast.success('Codigo copiado', 'El ticket esta en tu portapapeles.');
    } catch {
      toast.error('No se pudo copiar', 'Copia el codigo manualmente.');
    }
  };

  const nuevaCotizacion = () => {
    limpiarConfiguracion();
    setPasoActual(0);
    setCotizacionGenerada(null);
    setErrorGenerar('');
    setIntentoGenerar(false);
    setNombreCliente('');
    setEmailCliente('');
    setTelefonoCliente('');
    toast.info('Nuevo flujo', 'Empezaste una cotizacion nueva.');
  };

  const renderCampoFiltro = (id, label, value, onChange, options = [], allLabel = 'Todas') => (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-shadow duration-higNormal ease-hig focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        <option value="all">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );

  const renderFiltrosPaso = () => {
    switch (pasoInfo.id) {
      case 'procesador':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {renderCampoFiltro(
              'filtro-procesador-marca',
              'Marca',
              filtrosPaso.procesadorMarca,
              (valor) => actualizarFiltroPaso('procesadorMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-procesador-modelo',
              'Modelo',
              filtrosPaso.procesadorModelo,
              (valor) => actualizarFiltroPaso('procesadorModelo', valor),
              opcionesFiltrosPaso.modelos || [],
              'Todos'
            )}
          </div>
        );
      case 'placa_madre':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {renderCampoFiltro(
              'filtro-placa-marca',
              'Marca',
              filtrosPaso.placaMarca,
              (valor) => actualizarFiltroPaso('placaMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
          </div>
        );
      case 'ram':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {renderCampoFiltro(
              'filtro-ram-marca',
              'Marca',
              filtrosPaso.ramMarca,
              (valor) => actualizarFiltroPaso('ramMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-ram-frecuencia',
              'Frecuencia (MHz)',
              filtrosPaso.ramFrecuencia,
              (valor) => actualizarFiltroPaso('ramFrecuencia', valor),
              opcionesFiltrosPaso.frecuencias || [],
              'Todas'
            )}
          </div>
        );
      case 'almacenamiento':
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {renderCampoFiltro(
              'filtro-almacenamiento-marca',
              'Marca',
              filtrosPaso.almacenamientoMarca,
              (valor) => actualizarFiltroPaso('almacenamientoMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-almacenamiento-capacidad',
              'Almacenamiento',
              filtrosPaso.almacenamientoCapacidad,
              (valor) => actualizarFiltroPaso('almacenamientoCapacidad', valor),
              opcionesFiltrosPaso.capacidades || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-almacenamiento-tipo',
              'Tipo',
              filtrosPaso.almacenamientoTipo,
              (valor) => actualizarFiltroPaso('almacenamientoTipo', valor),
              opcionesFiltrosPaso.tipos || [],
              'Todos'
            )}
          </div>
        );
      case 'gpu':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {renderCampoFiltro(
              'filtro-gpu-marca',
              'Marca',
              filtrosPaso.gpuMarca,
              (valor) => actualizarFiltroPaso('gpuMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-gpu-serie',
              'Serie',
              filtrosPaso.gpuSerie,
              (valor) => actualizarFiltroPaso('gpuSerie', valor),
              opcionesFiltrosPaso.series || [],
              'Todas'
            )}
          </div>
        );
      case 'fuente':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {renderCampoFiltro(
              'filtro-fuente-marca',
              'Marca',
              filtrosPaso.fuenteMarca,
              (valor) => actualizarFiltroPaso('fuenteMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-fuente-potencia',
              'Potencia (W)',
              filtrosPaso.fuentePotencia,
              (valor) => actualizarFiltroPaso('fuentePotencia', valor),
              opcionesFiltrosPaso.potencias || [],
              'Todas'
            )}
          </div>
        );
      case 'case':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {renderCampoFiltro(
              'filtro-case-marca',
              'Marca',
              filtrosPaso.caseMarca,
              (valor) => actualizarFiltroPaso('caseMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">

      <header className="hidden surface-elevated p-6">
        <h1 className="text-3xl font-semibold text-[var(--color-text)]">Cotizador de PC</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Configura tu computadora paso a paso con validacion y total en tiempo real.</p>
      </header>

      <section className="surface-card space-y-3 p-4" aria-label="Pasos del cotizador">
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {PASOS.map((paso, indice) => {
            const activo = indice === pasoActual;
            const completo = pasoCompleto(indice);
            const habilitado = pasoHabilitado(indice);
            return (
              <li key={paso.id}>
                <button
                  type="button"
                  onClick={() => irAPaso(indice)}
                  disabled={!habilitado}
                  aria-current={activo ? 'step' : undefined}
                  aria-disabled={!habilitado}
                  className={`w-full min-h-11 rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm font-medium transition-colors duration-higNormal ease-hig ${activo
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]'
                    : completo
                      ? 'border-[color:rgba(48,209,88,0.35)] bg-[color:rgba(48,209,88,0.10)] text-[var(--color-text)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)]'
                    } ${!habilitado ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <span className="inline-flex items-center gap-2">
                    {completo ? (
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    ) : (
                      <StepIcon pasoId={paso.id} className="h-4 w-4 shrink-0" />
                    )}
                    <span>{paso.nombre}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={irAnterior}
            disabled={pasoActual === 0}
            className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={irSiguiente}
            disabled={pasoActual === PASOS.length - 1}
            className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="surface-elevated space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Paso {pasoActual + 1} de {PASOS.length}</p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{pasoInfo.nombre}</h2>
            </div>

            <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-1">
              <button
                type="button"
                onClick={() => setFiltro('disponibles')}
                aria-pressed={filtro === 'disponibles'}
                className={`min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-medium ${filtro === 'disponibles' ? 'bg-[var(--color-surface)] shadow-hig1' : 'text-[var(--color-text-muted)]'}`}
              >
                Disponibles
              </button>
              <button
                type="button"
                onClick={() => setFiltro('todos')}
                aria-pressed={filtro === 'todos'}
                className={`min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-medium ${filtro === 'todos' ? 'bg-[var(--color-surface)] shadow-hig1' : 'text-[var(--color-text-muted)]'}`}
              >
                Todos
              </button>
            </div>
          </div>

          {seleccionActual && pasoInfo.id !== 'ram' ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Seleccion actual</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{seleccionActual.nombre}</p>
            </div>
          ) : null}

          {pasoInfo.id === 'gpu' && procesadorTieneGraficosIntegrados ? (
            <div className="rounded-[var(--radius-md)] border border-[color:rgba(48,209,88,0.35)] bg-[color:rgba(48,209,88,0.10)] p-3 text-sm text-[var(--color-success)]">
              El procesador <span className="font-semibold">{configuracionSeleccionada.procesador?.nombre}</span> elegido cuenta con video integrado. Es opcional escoger una Tarjeta de Grafica.
            </div>
          ) : null}

          <section className="surface-card p-3" aria-label="Filtros de productos">
            {renderFiltrosPaso()}
          </section>

          {cargandoProductos ? (
            <div className="surface-card py-16">
              <LoadingSpinner label="Cargando productos..." />
            </div>
          ) : errorProductos ? (
            <ErrorState title="No se cargaron productos" description={errorProductos} onRetry={cargarProductos} />
          ) : productosFiltrados.length === 0 ? (
            <EmptyState
              title="Sin productos para este paso"
              description="Prueba con el filtro Todos o revisa el stock disponible."
              actionLabel="Ver todos"
              onAction={() => setFiltro('todos')}
            />
          ) : (
            <div className="space-y-5">
              {gruposProductos.map((grupo) => (
                <div key={grupo.titulo || 'grupo-unico'} className="space-y-3">
                  {grupo.titulo ? (
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{grupo.titulo}</h3>
                  ) : null}
                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {grupo.items.map((producto) => {
                      const esRam = pasoInfo.id === 'ram';
                      const seleccionado = esRam ? Boolean(ramAgrupada[producto.id]) : seleccionActual?.id === producto.id;
                      const estadoStock = obtenerEstadoStock(producto);
                      const cantidadRam = ramAgrupada[producto.id]?.cantidad || 0;
                      const maxRam = producto.stock > 0 ? producto.stock : 8;

                      return (
                        <motion.article key={producto.id} layout className={`surface-card flex h-full flex-col p-4 ${seleccionado ? 'ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-bg)]' : ''}`}>
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-base font-semibold text-[var(--color-text)]">{producto.nombre}</h3>
                            <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${estadoStock.className}`}>{estadoStock.label}</span>
                          </div>
                          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{producto.descripcion_tecnica ? `${producto.descripcion_tecnica.slice(0, 110)}...` : 'Sin descripcion tecnica.'}</p>

                          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                            <p className="text-2xl font-semibold text-[var(--color-accent-text)]">
                              {formatearMontoSegunMonedaVista({ montoUsd: producto.precio_base })}
                            </p>

                            {!esRam ? (
                              <button
                                type="button"
                                onClick={() => seleccionarProducto(producto)}
                                className={`min-h-11 rounded-[var(--radius-sm)] px-4 text-sm font-medium ${seleccionado ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]' : 'bg-[var(--color-surface-soft)] text-[var(--color-text)] hover:bg-[var(--color-accent-soft)]'}`}
                                aria-label={`${seleccionado ? 'Producto seleccionado' : 'Seleccionar'}: ${producto.nombre}`}
                              >
                                {seleccionado ? 'Seleccionado' : 'Seleccionar'}
                              </button>
                            ) : (
                              <div className="inline-flex max-w-full items-center gap-2 self-start rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-1">
                                <button
                                  type="button"
                                  onClick={() => quitarRam(producto.id)}
                                  disabled={cantidadRam === 0}
                                  className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-lg disabled:opacity-40"
                                  aria-label={`Quitar un modulo de ${producto.nombre}`}
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-sm font-semibold">{cantidadRam}</span>
                                <button
                                  type="button"
                                  onClick={() => seleccionarProducto(producto)}
                                  disabled={cantidadRam >= maxRam}
                                  className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-lg disabled:opacity-40"
                                  aria-label={`Agregar un modulo de ${producto.nombre}`}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <footer className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={irAnterior} disabled={pasoActual === 0} className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium disabled:opacity-50">Anterior</button>
            <p className="text-sm text-[var(--color-text-muted)]">
              {pasoInfo.id === 'gpu' && procesadorTieneGraficosIntegrados && !configuracionSeleccionada.gpu
                ? 'Paso opcional: puedes continuar sin Tarjeta grafica.'
                : pasoCompleto(pasoActual)
                  ? 'Paso completado.'
                  : 'Selecciona una opcion para continuar.'}
            </p>
            <button type="button" onClick={irSiguiente} disabled={pasoActual === PASOS.length - 1} className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white disabled:opacity-50">Siguiente</button>
          </footer>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="surface-elevated p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Asistente IA</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Solicita una configuracion sugerida segun tu uso y aplicala en un click.</p>
            <div className="mt-4">
              <AsistenteIA onAplicarRecomendacion={aplicarRecomendacionIA} className="!static !w-full !translate-x-0 !translate-y-0 !rounded-[var(--radius-md)] !justify-center" />
            </div>
          </section>

          <section className="surface-elevated p-5">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Total estimado</p>
            <p className="mt-1 text-3xl font-semibold text-[var(--color-success)]">
              {formatearMontoSegunMonedaVista({
                montoUsd: resumenFinanciero.total.usd,
                montoPen: resumenFinanciero.total.pen
              })}
            </p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{etiquetaMonedaBase(monedaVista)} • {pasosCompletos} de {PASOS.length} pasos completos</p>
            <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3 text-xs text-[var(--color-text-muted)]">
              <p>
                Subtotal neto: {formatearMontoSegunMonedaVista({
                  montoUsd: resumenFinanciero.subtotal_neto.usd,
                  montoPen: resumenFinanciero.subtotal_neto.pen
                })} / {monedaVista === 'USD'
                  ? formatearMoneda(resumenFinanciero.subtotal_neto.pen, 'PEN')
                  : formatearMoneda(resumenFinanciero.subtotal_neto.usd, 'USD')}
              </p>
              <p>
                IGV ({Number(resumenFinanciero.igv.porcentaje || 0).toFixed(2)}%): {formatearMontoSegunMonedaVista({
                  montoUsd: resumenFinanciero.igv.usd,
                  montoPen: resumenFinanciero.igv.pen
                })} / {monedaVista === 'USD'
                  ? formatearMoneda(resumenFinanciero.igv.pen, 'PEN')
                  : formatearMoneda(resumenFinanciero.igv.usd, 'USD')}
              </p>
              <p>
                Total: {formatearMontoSegunMonedaVista({
                  montoUsd: resumenFinanciero.total.usd,
                  montoPen: resumenFinanciero.total.pen
                })} / {monedaVista === 'USD'
                  ? formatearMoneda(resumenFinanciero.total.pen, 'PEN')
                  : formatearMoneda(resumenFinanciero.total.usd, 'USD')}
              </p>
            </div>
          </section>

          <section className="surface-elevated p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Compatibilidad</h3>
            {validacionCompatibilidad.errores.length > 0 ? (
              <ErrorState
                title="Incompatibilidades detectadas"
                description={validacionCompatibilidad.errores[0]}
              />
            ) : validacionCompatibilidad.advertencias.length > 0 ? (
              <div className="rounded-[var(--radius-sm)] border border-[color:rgba(255,214,10,0.45)] bg-[color:rgba(255,214,10,0.10)] px-3 py-2 text-sm text-[var(--color-warning)]">
                {validacionCompatibilidad.advertencias[0]}
              </div>
            ) : (
              <div className="rounded-[var(--radius-sm)] border border-[color:rgba(48,209,88,0.4)] bg-[color:rgba(48,209,88,0.10)] px-3 py-2 text-sm text-[var(--color-success)]">
                Configuracion valida.
              </div>
            )}
          </section>

          <section className="surface-elevated space-y-4 p-5" aria-label="Datos del cliente">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Datos del cliente</h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {esAdmin
                  ? 'Modo admin: estos datos son opcionales para generar la cotizacion.'
                  : 'Completa nombre y correo antes de generar la cotizacion. Telefono es opcional.'}
              </p>
            </div>

            <div className="space-y-3">
              <label htmlFor="nombre-cliente" className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Nombre completo {!esAdmin ? '(obligatorio)' : '(opcional)'}
                </span>
                <input
                  id="nombre-cliente"
                  type="text"
                  value={nombreCliente}
                  onChange={(event) => setNombreCliente(event.target.value)}
                  placeholder="Ingrese su nombre"
                  autoComplete="name"
                  aria-invalid={hayErrorNombreCliente ? 'true' : 'false'}
                  aria-describedby={hayErrorNombreCliente ? 'error-nombre-cliente' : undefined}
                  className={`min-h-11 rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-shadow duration-higNormal ease-hig focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${hayErrorNombreCliente ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                    }`}
                />
                {hayErrorNombreCliente ? (
                  <span id="error-nombre-cliente" className="text-xs text-[var(--color-danger)]">
                    El nombre es obligatorio para clientes.
                  </span>
                ) : null}
              </label>

              <label htmlFor="email-cliente" className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Correo {!esAdmin ? '(obligatorio)' : '(opcional)'}
                </span>
                <input
                  id="email-cliente"
                  type="email"
                  value={emailCliente}
                  onChange={(event) => setEmailCliente(event.target.value)}
                  placeholder="Ingrese su correo electronico"
                  autoComplete="email"
                  aria-invalid={hayErrorEmailCliente ? 'true' : 'false'}
                  aria-describedby={hayErrorEmailCliente ? 'error-email-cliente' : undefined}
                  className={`min-h-11 rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-shadow duration-higNormal ease-hig focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${hayErrorEmailCliente ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                    }`}
                />
                {hayErrorEmailCliente ? (
                  <span id="error-email-cliente" className="text-xs text-[var(--color-danger)]">
                    Ingresa un correo valido.
                  </span>
                ) : null}
              </label>

              <label htmlFor="telefono-cliente" className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Telefono (opcional)</span>
                <input
                  id="telefono-cliente"
                  type="tel"
                  value={telefonoCliente}
                  onChange={(event) => setTelefonoCliente(event.target.value)}
                  placeholder="Ingrese su numero de telefono"
                  autoComplete="tel"
                  aria-invalid={hayErrorTelefonoCliente ? 'true' : 'false'}
                  aria-describedby={hayErrorTelefonoCliente ? 'error-telefono-cliente' : undefined}
                  className={`min-h-11 rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-shadow duration-higNormal ease-hig focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${hayErrorTelefonoCliente ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                    }`}
                />
                {hayErrorTelefonoCliente ? (
                  <span id="error-telefono-cliente" className="text-xs text-[var(--color-danger)]">
                    El telefono debe tener al menos 7 digitos.
                  </span>
                ) : null}
              </label>
            </div>
          </section>

          <section className="surface-elevated space-y-4 p-5">
            <button
              type="button"
              onClick={generarCotizacion}
              disabled={!configuracionCompleta || generando || validacionCompatibilidad.errores.length > 0 || !datosClienteValidos}
              className="min-h-11 w-full rounded-[var(--radius-md)] bg-[var(--color-success-solid)] px-4 text-sm font-semibold text-[var(--color-on-success)] disabled:opacity-45"
            >
              {generando ? 'Generando cotizacion...' : 'Generar cotizacion'}
            </button>

            {errorGenerar ? (
              <ErrorState
                title="No se pudo generar"
                description={errorGenerar}
                onRetry={generarCotizacion}
                retryLabel="Reintentar"
              />
            ) : null}

            {cotizacionGenerada ? (
              <SuccessState
                title="Cotizacion lista"
                description={`Ticket ${cotizacionGenerada.codigo_ticket} - ${formatearMontoSegunMonedaVista({
                  montoUsd: cotizacionGenerada?.finanzas?.total?.usd ?? cotizacionGenerada.precio_total,
                  montoPen: cotizacionGenerada?.finanzas?.total?.pen
                })}`}
              >
                <div className="space-y-2">
                  <button type="button" onClick={copiarTicket} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium">Copiar codigo</button>
                  <button type="button" onClick={descargarPdf} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium">Descargar PDF</button>
                  {autenticado ? (
                    <button type="button" onClick={() => navigate('/historial')} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium">
                      Ver historial
                    </button>
                  ) : (
                    <button type="button" disabled aria-disabled="true" className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text-muted)] opacity-70">
                      Historial requiere sesión
                    </button>
                  )}
                  <button type="button" onClick={() => navigate(autenticado ? '/validar' : '/login')} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium">{autenticado ? 'Validar ticket' : 'Iniciar sesion para validar'}</button>
                  <button type="button" onClick={nuevaCotizacion} className="min-h-11 w-full rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 text-sm font-semibold text-white">Nueva cotizacion</button>
                </div>
              </SuccessState>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
