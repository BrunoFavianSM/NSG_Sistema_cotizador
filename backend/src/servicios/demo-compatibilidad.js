/**
 * Script de demostración del Servicio de Compatibilidad
 * Muestra ejemplos de uso del motor de validación
 */

const servicioCompatibilidad = require('./servicioCompatibilidad');

console.log('=== DEMO: Motor de Compatibilidad ===\n');

// Ejemplo 1: Configuración Compatible
console.log('1. Configuración Compatible:');
const configCompatible = {
  procesador: { 
    nombre: 'AMD Ryzen 5 7600X',
    socket: 'AM5', 
    tdp: 105 
  },
  placa_madre: { 
    nombre: 'ASUS TUF Gaming B650',
    socket: 'AM5', 
    ram_type: 'DDR5', 
    form_factor: 'ATX' 
  },
  ram: [
    { nombre: 'Corsair Vengeance DDR5 16GB', ram_type: 'DDR5' },
    { nombre: 'Corsair Vengeance DDR5 16GB', ram_type: 'DDR5' }
  ],
  gpu: { 
    nombre: 'NVIDIA RTX 4060',
    tdp: 115 
  },
  almacenamiento: { 
    nombre: 'Samsung 980 Pro 1TB' 
  },
  fuente: { 
    nombre: 'Corsair RM750',
    wattage: 750 
  },
  case: { 
    nombre: 'NZXT H510',
    descripcion_tecnica: 'Case ATX con soporte para Micro-ATX y Mini-ITX' 
  }
};

const resultado1 = servicioCompatibilidad.validarConfiguracion(configCompatible);
console.log('Compatible:', resultado1.compatible);
console.log('Errores:', resultado1.errores);
console.log('Advertencias:', resultado1.advertencias);
console.log('Consumo estimado:', servicioCompatibilidad.calcularConsumoTotal(configCompatible), 'W\n');

// Ejemplo 2: Socket Incompatible
console.log('2. Socket Incompatible:');
const configSocketIncompatible = {
  procesador: { 
    nombre: 'Intel Core i5-13600K',
    socket: 'LGA1700', 
    tdp: 125 
  },
  placa_madre: { 
    nombre: 'ASUS TUF Gaming B650',
    socket: 'AM5', 
    ram_type: 'DDR5', 
    form_factor: 'ATX' 
  },
  fuente: { wattage: 650 }
};

const resultado2 = servicioCompatibilidad.validarConfiguracion(configSocketIncompatible);
console.log('Compatible:', resultado2.compatible);
console.log('Errores:', resultado2.errores);
console.log();

// Ejemplo 3: RAM Incompatible
console.log('3. RAM Incompatible:');
const configRAMIncompatible = {
  procesador: { socket: 'AM5', tdp: 105 },
  placa_madre: { 
    socket: 'AM5', 
    ram_type: 'DDR5', 
    form_factor: 'ATX' 
  },
  ram: [
    { ram_type: 'DDR4' }
  ],
  fuente: { wattage: 650 }
};

const resultado3 = servicioCompatibilidad.validarConfiguracion(configRAMIncompatible);
console.log('Compatible:', resultado3.compatible);
console.log('Errores:', resultado3.errores);
console.log();

// Ejemplo 4: Fuente Insuficiente
console.log('4. Fuente Insuficiente:');
const configFuenteInsuficiente = {
  procesador: { socket: 'AM5', tdp: 170 },
  placa_madre: { socket: 'AM5', ram_type: 'DDR5', form_factor: 'ATX' },
  gpu: { tdp: 320 },
  ram: [{}],
  almacenamiento: {},
  fuente: { wattage: 450 }
};

const resultado4 = servicioCompatibilidad.validarConfiguracion(configFuenteInsuficiente);
console.log('Compatible:', resultado4.compatible);
console.log('Errores:', resultado4.errores);
console.log('Consumo requerido:', servicioCompatibilidad.calcularConsumoTotal(configFuenteInsuficiente), 'W');
console.log('Fuente disponible: 450W\n');

// Ejemplo 5: Form Factor Incompatible
console.log('5. Form Factor Incompatible:');
const configFormFactorIncompatible = {
  procesador: { socket: 'AM5', tdp: 65 },
  placa_madre: { 
    socket: 'AM5', 
    ram_type: 'DDR5', 
    form_factor: 'ATX' 
  },
  case: { 
    descripcion_tecnica: 'Case Mini-ITX compacto' 
  },
  fuente: { wattage: 500 }
};

const resultado5 = servicioCompatibilidad.validarConfiguracion(configFormFactorIncompatible);
console.log('Compatible:', resultado5.compatible);
console.log('Errores:', resultado5.errores);
console.log();

// Ejemplo 6: Componentes a Pedido
console.log('6. Componentes a Pedido:');
const configAPedido = {
  procesador: { 
    socket: 'AM5', 
    tdp: 105,
    stock: 0,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 7
  },
  placa_madre: { 
    socket: 'AM5', 
    ram_type: 'DDR5', 
    form_factor: 'ATX',
    stock: 5
  },
  ram: [
    { 
      ram_type: 'DDR5',
      stock: 0,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 5
    }
  ],
  fuente: { wattage: 650 }
};

const resultado6 = servicioCompatibilidad.validarConfiguracion(configAPedido);
console.log('Compatible:', resultado6.compatible);
console.log('Advertencias:', resultado6.advertencias);
console.log('Componentes a pedido:', servicioCompatibilidad.identificarComponentesAPedido(configAPedido).length);
console.log();

// Ejemplo 7: Múltiples Errores
console.log('7. Múltiples Errores:');
const configMultiplesErrores = {
  procesador: { socket: 'LGA1700', tdp: 125 },
  placa_madre: { socket: 'AM5', ram_type: 'DDR5', form_factor: 'ATX' },
  ram: [{ ram_type: 'DDR4' }],
  gpu: { tdp: 350 },
  fuente: { wattage: 400 },
  case: { descripcion_tecnica: 'Case Mini-ITX' }
};

const resultado7 = servicioCompatibilidad.validarConfiguracion(configMultiplesErrores);
console.log('Compatible:', resultado7.compatible);
console.log('Errores encontrados:', resultado7.errores.length);
resultado7.errores.forEach((error, i) => {
  console.log(`  ${i + 1}. ${error}`);
});
console.log();

console.log('=== FIN DE LA DEMO ===');
