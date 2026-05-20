const { obtenerConfigIAEnriquecimiento } = require('./src/asistente/servicioConfigIA');
const { llamarNVIDIA } = require('./src/asistente/servicioLLM');
const { construirPromptEnriquecimiento, validarRespuestaIA } = require('./src/servicios/servicioEnriquecimientoIA');

const ejemplos = [
  {
    categoria: 'procesador',
    nombre: 'Procesador Intel Core i7-14700KF',
    descripcion_general: 'procesador intel core i7-14700kf 3.40/5.60ghz, 33mb intel smart cache, lga1700, 125w/',
    specs_faltantes: [
      { campo: 'socket', tipo: 'string' },
      { campo: 'cpu_nucleos', tipo: 'integer' },
      { campo: 'cpu_hilos', tipo: 'integer' },
      { campo: 'cpu_frecuencia_base_ghz', tipo: 'number' },
      { campo: 'cpu_frecuencia_boost_ghz', tipo: 'number' },
      { campo: 'cpu_tdp_w', tipo: 'integer' },
    ],
  },
  {
    categoria: 'placa_madre',
    nombre: 'Motherboard ASUS Prime B760M-A',
    descripcion_general: 'motherboard asus prime b760m-a chipset intel b760, lga1700, micro atx',
    specs_faltantes: [
      { campo: 'socket', tipo: 'string' },
      { campo: 'mb_chipset', tipo: 'string' },
      { campo: 'mb_form_factor', tipo: 'string' },
      { campo: 'mb_ram_tipo', tipo: 'string' },
    ],
  },
  {
    categoria: 'ram',
    nombre: 'Memoria Kingston Fury Beast 16GB DDR5-6000',
    descripcion_general: 'memoria kingston fury beast 16gb ddr5-6000mt/s, pc5-48000, cl36, 1.35v, 288-pin',
    specs_faltantes: [
      { campo: 'ram_tipo', tipo: 'string' },
      { campo: 'ram_capacidad_gb', tipo: 'integer' },
      { campo: 'ram_velocidad_mhz', tipo: 'integer' },
    ],
  },
  {
    categoria: 'almacenamiento',
    nombre: 'SSD Samsung 990 Pro 2TB',
    descripcion_general: 'unidad en estado solido samsung 990 pro 2tb m.2 2280, pcie gen 4.0 x4, nvme 2.0',
    specs_faltantes: [
      { campo: 'storage_tipo', tipo: 'string' },
      { campo: 'storage_capacidad_gb', tipo: 'integer' },
      { campo: 'storage_interfaz', tipo: 'string' },
    ],
  },
  {
    categoria: 'gpu',
    nombre: 'Tarjeta de video ASUS Dual RTX 5060 8GB',
    descripcion_general: 'tarjeta de video asus dual-rtx5060-o8g, 8gb gddr7, pcie gen 5.0',
    specs_faltantes: [
      { campo: 'gpu_chipset', tipo: 'string' },
      { campo: 'gpu_vram_gb', tipo: 'integer' },
    ],
  },
  {
    categoria: 'fuente',
    nombre: 'Fuente ASUS TUF Gaming 850W Gold',
    descripcion_general: 'fuente de alimentacion asus tuf gaming 850w gold, 80 plus gold, formato atx.',
    specs_faltantes: [
      { campo: 'psu_wattage', tipo: 'integer' },
      { campo: 'psu_certificacion', tipo: 'string' },
    ],
  },
  {
    categoria: 'case',
    nombre: 'Case ASUS A31 Plus Black',
    descripcion_general: 'case asus a31 plus case black',
    specs_faltantes: [
      { campo: 'case_form_factor', tipo: 'string' },
    ],
  },
];

(async () => {
  const configIA = await obtenerConfigIAEnriquecimiento();
  const configSoloNvidia = { ...configIA, prioridad_proveedores: ['nvidia'] };

  console.log('CONFIG:', JSON.stringify({
    prioridad: configSoloNvidia.prioridad_proveedores,
    nvidia_model: configSoloNvidia.nvidia_model,
    tiene_nvidia_key: !!configSoloNvidia.nvidia_api_key,
  }, null, 2));

  for (const ejemplo of ejemplos) {
    const { systemPrompt, mensajeActual } = construirPromptEnriquecimiento(ejemplo);
    const inicio = Date.now();
    try {
      const resultado = await llamarNVIDIA(systemPrompt, [], mensajeActual, configSoloNvidia);
      const duracionMs = Date.now() - inicio;
      const validado = validarRespuestaIA(JSON.stringify(resultado), ejemplo.categoria, ejemplo.specs_faltantes);
      console.log('\n=== ' + ejemplo.categoria.toUpperCase() + ' ===');
      console.log('descripcion:', ejemplo.descripcion_general);
      console.log('respuesta_cruda:', JSON.stringify(resultado));
      console.log('respuesta_validada:', JSON.stringify(validado));
      console.log('duracion_ms:', duracionMs);
    } catch (error) {
      const duracionMs = Date.now() - inicio;
      console.log('\n=== ' + ejemplo.categoria.toUpperCase() + ' ERROR ===');
      console.log('descripcion:', ejemplo.descripcion_general);
      console.log('error_nombre:', error.name);
      console.log('error_tipo:', error.tipo || 'sin_tipo');
      console.log('error_mensaje:', error.message);
      console.log('duracion_ms:', duracionMs);
    }
  }
})();
