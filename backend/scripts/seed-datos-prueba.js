/**
 * Script de Seed - Datos de Prueba
 * Sistema de Cotización Automatizada NSG
 * 
 * Requisitos: 11.2, 11.3, 11.4, 11.5
 * 
 * Este script puebla la base de datos con datos de prueba realistas:
 * - Usuario administrador de prueba
 * - Productos de ejemplo en todas las categorías
 * - Configuración inicial del sistema
 */

const path = require('path');
const envPath = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
require('dotenv').config({ path: path.resolve(__dirname, '..', envPath) });
const { pool } = require('../src/configuracion/baseDatos');
const { hashPassword } = require('../src/servicios/servicioAuth');

// Colores para logging
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(mensaje, color = 'reset') {
  console.log(`${colors[color]}${mensaje}${colors.reset}`);
}

/**
 * Limpia todas las tablas de la base de datos
 */
async function limpiarDatos(cliente) {
  log('\n🧹 Limpiando datos existentes...', 'yellow');
  
  await cliente.query('TRUNCATE TABLE detalle_cotizacion CASCADE');
  await cliente.query('TRUNCATE TABLE cotizaciones CASCADE');
  await cliente.query('TRUNCATE TABLE conversaciones_ia CASCADE');
  await cliente.query('TRUNCATE TABLE auditoria CASCADE');
  await cliente.query('TRUNCATE TABLE productos CASCADE');
  await cliente.query('TRUNCATE TABLE cuentas CASCADE');
  await cliente.query('TRUNCATE TABLE administradores CASCADE');
  
  // Reiniciar secuencias
  await cliente.query('ALTER SEQUENCE administradores_id_seq RESTART WITH 1');
  await cliente.query('ALTER SEQUENCE productos_id_seq RESTART WITH 1');
  await cliente.query('ALTER SEQUENCE cuentas_id_seq RESTART WITH 1');
  await cliente.query('ALTER SEQUENCE cotizaciones_id_seq RESTART WITH 1');
  
  log('✓ Datos limpiados correctamente', 'green');
}

/**
 * Crea el usuario administrador de prueba
 */
async function crearAdministrador(cliente) {
  log('\n👤 Creando usuario administrador...', 'blue');
  
  const passwordHash = await hashPassword('admin123');
  
  await cliente.query(
    `INSERT INTO administradores (username, password_hash, nombre_completo)
     VALUES ($1, $2, $3)`,
    ['admin@nsg.com', passwordHash, 'Administrador NSG']
  );
  
  log('✓ Usuario administrador creado', 'green');
  log('  Email: admin@nsg.com', 'reset');
  log('  Contraseña: admin123', 'reset');
}

/**
 * Inserta productos de prueba en todas las categorías
 */
async function insertarProductos(cliente) {
  log('\n📦 Insertando productos de prueba...', 'blue');
  
  // PROCESADORES
  log('  → Procesadores...', 'reset');
  const procesadores = [
    {
      nombre: 'Intel Core i9-13900K',
      categoria: 'procesador',
      socket: 'LGA1700',
      tdp: 125,
      precio_base: 2899.00,
      stock: 5,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: '24 núcleos (8P+16E), 32 hilos, hasta 5.8 GHz, 36MB cache'
    },
    {
      nombre: 'Intel Core i7-13700K',
      categoria: 'procesador',
      socket: 'LGA1700',
      tdp: 125,
      precio_base: 2199.00,
      stock: 8,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: '16 núcleos (8P+8E), 24 hilos, hasta 5.4 GHz, 30MB cache'
    },
    {
      nombre: 'Intel Core i5-13600K',
      categoria: 'procesador',
      socket: 'LGA1700',
      tdp: 125,
      precio_base: 1599.00,
      stock: 12,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 5,
      descripcion_tecnica: '14 núcleos (6P+8E), 20 hilos, hasta 5.1 GHz, 24MB cache'
    },
    {
      nombre: 'AMD Ryzen 9 7950X',
      categoria: 'procesador',
      socket: 'AM5',
      tdp: 170,
      precio_base: 3299.00,
      stock: 3,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 10,
      descripcion_tecnica: '16 núcleos, 32 hilos, hasta 5.7 GHz, 64MB cache L3'
    },
    {
      nombre: 'AMD Ryzen 7 7700X',
      categoria: 'procesador',
      socket: 'AM5',
      tdp: 105,
      precio_base: 1899.00,
      stock: 7,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: '8 núcleos, 16 hilos, hasta 5.4 GHz, 32MB cache L3'
    },
    {
      nombre: 'AMD Ryzen 5 7600X',
      categoria: 'procesador',
      socket: 'AM5',
      tdp: 105,
      precio_base: 1399.00,
      stock: 10,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 5,
      descripcion_tecnica: '6 núcleos, 12 hilos, hasta 5.3 GHz, 32MB cache L3'
    }
  ];
  
  for (const prod of procesadores) {
    await cliente.query(
      `INSERT INTO productos (nombre, categoria, socket, tdp, precio_base, stock, 
       disponible_a_pedido, tiempo_entrega_dias, descripcion_tecnica)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [prod.nombre, prod.categoria, prod.socket, prod.tdp, prod.precio_base, 
       prod.stock, prod.disponible_a_pedido, prod.tiempo_entrega_dias, prod.descripcion_tecnica]
    );
  }
  
  // PLACAS MADRE
  log('  → Placas Madre...', 'reset');
  const placasMadre = [
    {
      nombre: 'ASUS ROG STRIX Z790-E GAMING',
      categoria: 'placa_madre',
      socket: 'LGA1700',
      ram_type: 'DDR5',
      form_factor: 'ATX',
      precio_base: 2499.00,
      stock: 4,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 10,
      descripcion_tecnica: 'Chipset Z790, 4x DDR5, PCIe 5.0, WiFi 6E, 2.5G LAN'
    },
    {
      nombre: 'MSI MAG B760 TOMAHAWK',
      categoria: 'placa_madre',
      socket: 'LGA1700',
      ram_type: 'DDR5',
      form_factor: 'ATX',
      precio_base: 1299.00,
      stock: 6,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: 'Chipset B760, 4x DDR5, PCIe 4.0, 2.5G LAN'
    },
    {
      nombre: 'GIGABYTE B760M DS3H',
      categoria: 'placa_madre',
      socket: 'LGA1700',
      ram_type: 'DDR4',
      form_factor: 'mATX',
      precio_base: 699.00,
      stock: 10,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 5,
      descripcion_tecnica: 'Chipset B760, 4x DDR4, PCIe 4.0, Gigabit LAN'
    },
    {
      nombre: 'ASUS ROG STRIX X670E-E GAMING',
      categoria: 'placa_madre',
      socket: 'AM5',
      ram_type: 'DDR5',
      form_factor: 'ATX',
      precio_base: 2799.00,
      stock: 3,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 12,
      descripcion_tecnica: 'Chipset X670E, 4x DDR5, PCIe 5.0, WiFi 6E, 2.5G LAN'
    },
    {
      nombre: 'MSI B650 GAMING PLUS',
      categoria: 'placa_madre',
      socket: 'AM5',
      ram_type: 'DDR5',
      form_factor: 'ATX',
      precio_base: 1099.00,
      stock: 8,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: 'Chipset B650, 4x DDR5, PCIe 4.0, Gigabit LAN'
    }
  ];
  
  for (const prod of placasMadre) {
    await cliente.query(
      `INSERT INTO productos (nombre, categoria, socket, ram_type, form_factor, precio_base, 
       stock, disponible_a_pedido, tiempo_entrega_dias, descripcion_tecnica)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [prod.nombre, prod.categoria, prod.socket, prod.ram_type, prod.form_factor, 
       prod.precio_base, prod.stock, prod.disponible_a_pedido, prod.tiempo_entrega_dias, 
       prod.descripcion_tecnica]
    );
  }
  
  // MEMORIA RAM
  log('  → Memoria RAM...', 'reset');
  const memoriaRAM = [
    {
      nombre: 'Corsair Vengeance DDR5 32GB (2x16GB) 6000MHz',
      categoria: 'ram',
      ram_type: 'DDR5',
      precio_base: 899.00,
      stock: 15,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 5,
      descripcion_tecnica: '32GB (2x16GB), DDR5-6000, CL36, 1.35V'
    },
    {
      nombre: 'G.Skill Trident Z5 RGB DDR5 32GB (2x16GB) 6400MHz',
      categoria: 'ram',
      ram_type: 'DDR5',
      precio_base: 1099.00,
      stock: 8,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: '32GB (2x16GB), DDR5-6400, CL32, RGB, 1.40V'
    },
    {
      nombre: 'Kingston FURY Beast DDR5 16GB (2x8GB) 5200MHz',
      categoria: 'ram',
      ram_type: 'DDR5',
      precio_base: 499.00,
      stock: 20,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 3,
      descripcion_tecnica: '16GB (2x8GB), DDR5-5200, CL40, 1.25V'
    },
    {
      nombre: 'Corsair Vengeance RGB DDR4 32GB (2x16GB) 3600MHz',
      categoria: 'ram',
      ram_type: 'DDR4',
      precio_base: 599.00,
      stock: 18,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 3,
      descripcion_tecnica: '32GB (2x16GB), DDR4-3600, CL18, RGB, 1.35V'
    },
    {
      nombre: 'Kingston FURY Beast DDR4 16GB (2x8GB) 3200MHz',
      categoria: 'ram',
      ram_type: 'DDR4',
      precio_base: 299.00,
      stock: 25,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 2,
      descripcion_tecnica: '16GB (2x8GB), DDR4-3200, CL16, 1.35V'
    }
  ];
  
  for (const prod of memoriaRAM) {
    await cliente.query(
      `INSERT INTO productos (nombre, categoria, ram_type, precio_base, stock, 
       disponible_a_pedido, tiempo_entrega_dias, descripcion_tecnica)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [prod.nombre, prod.categoria, prod.ram_type, prod.precio_base, prod.stock, 
       prod.disponible_a_pedido, prod.tiempo_entrega_dias, prod.descripcion_tecnica]
    );
  }
  
  // ALMACENAMIENTO
  log('  → Almacenamiento...', 'reset');
  const almacenamiento = [
    {
      nombre: 'Samsung 990 PRO 2TB NVMe SSD',
      categoria: 'almacenamiento',
      precio_base: 1299.00,
      stock: 10,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: '2TB, NVMe PCIe 4.0, 7450/6900 MB/s lectura/escritura'
    },
    {
      nombre: 'WD Black SN850X 1TB NVMe SSD',
      categoria: 'almacenamiento',
      precio_base: 699.00,
      stock: 15,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 5,
      descripcion_tecnica: '1TB, NVMe PCIe 4.0, 7300/6300 MB/s lectura/escritura'
    },
    {
      nombre: 'Kingston NV2 500GB NVMe SSD',
      categoria: 'almacenamiento',
      precio_base: 299.00,
      stock: 20,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 3,
      descripcion_tecnica: '500GB, NVMe PCIe 4.0, 3500/2100 MB/s lectura/escritura'
    },
    {
      nombre: 'Seagate Barracuda 2TB HDD',
      categoria: 'almacenamiento',
      precio_base: 399.00,
      stock: 12,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 5,
      descripcion_tecnica: '2TB, 7200 RPM, SATA 6Gb/s, 256MB cache'
    },
    {
      nombre: 'WD Blue 1TB HDD',
      categoria: 'almacenamiento',
      precio_base: 249.00,
      stock: 0,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 10,
      descripcion_tecnica: '1TB, 7200 RPM, SATA 6Gb/s, 64MB cache'
    }
  ];
  
  for (const prod of almacenamiento) {
    await cliente.query(
      `INSERT INTO productos (nombre, categoria, precio_base, stock, 
       disponible_a_pedido, tiempo_entrega_dias, descripcion_tecnica)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [prod.nombre, prod.categoria, prod.precio_base, prod.stock, 
       prod.disponible_a_pedido, prod.tiempo_entrega_dias, prod.descripcion_tecnica]
    );
  }
  
  // TARJETAS GRÁFICAS (GPU)
  log('  → Tarjetas Gráficas...', 'reset');
  const gpus = [
    {
      nombre: 'NVIDIA GeForce RTX 4090 24GB',
      categoria: 'gpu',
      wattage: 450,
      precio_base: 9999.00,
      stock: 2,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 15,
      descripcion_tecnica: '24GB GDDR6X, 16384 CUDA cores, PCIe 4.0, 450W TDP'
    },
    {
      nombre: 'NVIDIA GeForce RTX 4080 16GB',
      categoria: 'gpu',
      wattage: 320,
      precio_base: 6999.00,
      stock: 4,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 10,
      descripcion_tecnica: '16GB GDDR6X, 9728 CUDA cores, PCIe 4.0, 320W TDP'
    },
    {
      nombre: 'NVIDIA GeForce RTX 4070 Ti 12GB',
      categoria: 'gpu',
      wattage: 285,
      precio_base: 4999.00,
      stock: 6,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: '12GB GDDR6X, 7680 CUDA cores, PCIe 4.0, 285W TDP'
    },
    {
      nombre: 'AMD Radeon RX 7900 XTX 24GB',
      categoria: 'gpu',
      wattage: 355,
      precio_base: 5999.00,
      stock: 3,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 12,
      descripcion_tecnica: '24GB GDDR6, 6144 Stream processors, PCIe 4.0, 355W TDP'
    },
    {
      nombre: 'AMD Radeon RX 7800 XT 16GB',
      categoria: 'gpu',
      wattage: 263,
      precio_base: 3299.00,
      stock: 5,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: '16GB GDDR6, 3840 Stream processors, PCIe 4.0, 263W TDP'
    },
    {
      nombre: 'NVIDIA GeForce RTX 4060 8GB',
      categoria: 'gpu',
      wattage: 115,
      precio_base: 1999.00,
      stock: 0,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 10,
      descripcion_tecnica: '8GB GDDR6, 3072 CUDA cores, PCIe 4.0, 115W TDP'
    }
  ];
  
  for (const prod of gpus) {
    await cliente.query(
      `INSERT INTO productos (nombre, categoria, wattage, precio_base, stock, 
       disponible_a_pedido, tiempo_entrega_dias, descripcion_tecnica)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [prod.nombre, prod.categoria, prod.wattage, prod.precio_base, prod.stock, 
       prod.disponible_a_pedido, prod.tiempo_entrega_dias, prod.descripcion_tecnica]
    );
  }
  
  // FUENTES DE PODER
  log('  → Fuentes de Poder...', 'reset');
  const fuentes = [
    {
      nombre: 'Corsair RM1000x 1000W 80+ Gold',
      categoria: 'fuente',
      wattage: 1000,
      precio_base: 999.00,
      stock: 8,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: '1000W, 80+ Gold, Modular, ATX 3.0, PCIe 5.0 ready'
    },
    {
      nombre: 'EVGA SuperNOVA 850 G6 850W 80+ Gold',
      categoria: 'fuente',
      wattage: 850,
      precio_base: 799.00,
      stock: 10,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 5,
      descripcion_tecnica: '850W, 80+ Gold, Full Modular, ATX 3.0'
    },
    {
      nombre: 'Thermaltake Toughpower GF1 750W 80+ Gold',
      categoria: 'fuente',
      wattage: 750,
      precio_base: 599.00,
      stock: 12,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 5,
      descripcion_tecnica: '750W, 80+ Gold, Full Modular, ATX'
    },
    {
      nombre: 'Cooler Master MWE 650W 80+ Bronze',
      categoria: 'fuente',
      wattage: 650,
      precio_base: 399.00,
      stock: 15,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 3,
      descripcion_tecnica: '650W, 80+ Bronze, Semi Modular, ATX'
    },
    {
      nombre: 'ASUS ROG Thor 1200W 80+ Platinum',
      categoria: 'fuente',
      wattage: 1200,
      precio_base: 1799.00,
      stock: 3,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 12,
      descripcion_tecnica: '1200W, 80+ Platinum, Full Modular, OLED display, RGB'
    }
  ];
  
  for (const prod of fuentes) {
    await cliente.query(
      `INSERT INTO productos (nombre, categoria, wattage, precio_base, stock, 
       disponible_a_pedido, tiempo_entrega_dias, descripcion_tecnica)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [prod.nombre, prod.categoria, prod.wattage, prod.precio_base, prod.stock, 
       prod.disponible_a_pedido, prod.tiempo_entrega_dias, prod.descripcion_tecnica]
    );
  }
  
  // GABINETES (CASES)
  log('  → Gabinetes...', 'reset');
  const cases = [
    {
      nombre: 'Lian Li O11 Dynamic EVO',
      categoria: 'case',
      form_factor: 'ATX',
      precio_base: 899.00,
      stock: 6,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 10,
      descripcion_tecnica: 'Mid Tower, ATX/mATX/Mini-ITX, Vidrio templado, USB-C'
    },
    {
      nombre: 'NZXT H510 Elite',
      categoria: 'case',
      form_factor: 'ATX',
      precio_base: 699.00,
      stock: 8,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: 'Mid Tower, ATX/mATX/Mini-ITX, Vidrio templado, RGB'
    },
    {
      nombre: 'Corsair 4000D Airflow',
      categoria: 'case',
      form_factor: 'ATX',
      precio_base: 549.00,
      stock: 10,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 5,
      descripcion_tecnica: 'Mid Tower, ATX/mATX/Mini-ITX, Panel mesh, USB 3.1'
    },
    {
      nombre: 'Cooler Master MasterBox Q300L',
      categoria: 'case',
      form_factor: 'mATX',
      precio_base: 299.00,
      stock: 12,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 5,
      descripcion_tecnica: 'Micro Tower, mATX/Mini-ITX, Acrílico, Compacto'
    },
    {
      nombre: 'Fractal Design Meshify 2',
      categoria: 'case',
      form_factor: 'ATX',
      precio_base: 799.00,
      stock: 0,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 15,
      descripcion_tecnica: 'Mid Tower, ATX/mATX/Mini-ITX, Panel mesh, USB-C, Silencioso'
    }
  ];
  
  for (const prod of cases) {
    await cliente.query(
      `INSERT INTO productos (nombre, categoria, form_factor, precio_base, stock, 
       disponible_a_pedido, tiempo_entrega_dias, descripcion_tecnica)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [prod.nombre, prod.categoria, prod.form_factor, prod.precio_base, prod.stock, 
       prod.disponible_a_pedido, prod.tiempo_entrega_dias, prod.descripcion_tecnica]
    );
  }
  
  log('✓ Productos insertados correctamente', 'green');
  
  // Contar productos por categoría
  const resultado = await cliente.query(
    'SELECT categoria, COUNT(*) as total FROM productos GROUP BY categoria ORDER BY categoria'
  );
  
  log('\n📊 Resumen de productos:', 'blue');
  resultado.rows.forEach(row => {
    log(`  ${row.categoria}: ${row.total} productos`, 'reset');
  });
}

/**
 * Función principal
 */
async function main(opciones = {}) {
  const { cerrarPool = true } = opciones;
  const cliente = await pool.connect();
  
  try {
    log('\n╔════════════════════════════════════════════╗', 'blue');
    log('║  SEED - Sistema de Cotización NSG          ║', 'blue');
    log('╚════════════════════════════════════════════╝', 'blue');
    
    await cliente.query('BEGIN');
    
    await limpiarDatos(cliente);
    await crearAdministrador(cliente);
    await insertarProductos(cliente);
    
    await cliente.query('COMMIT');
    
    log('\n✅ Seed completado exitosamente!', 'green');
    log('\n📝 Credenciales de acceso:', 'yellow');
    log('  Email: admin@nsg.com', 'reset');
    log('  Contraseña: admin123', 'reset');
    log('\n💡 Usa estas credenciales para iniciar sesión en el sistema', 'blue');
    
  } catch (error) {
    await cliente.query('ROLLBACK');
    log('\n❌ Error durante el seed:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    cliente.release();
    if (cerrarPool) {
      await pool.end();
    }
  }
}

module.exports = {
  main,
  limpiarDatos,
  crearAdministrador,
  insertarProductos
};

// Ejecutar script
if (require.main === module) {
  main();
}

