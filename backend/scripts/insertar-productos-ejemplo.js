require('dotenv').config();
const { ejecutarTransaccion, pool } = require('../src/configuracion/baseDatos');

const PRODUCTOS_EJEMPLO = [
  // Procesador
  {
    nombre: 'AMD Ryzen 5 7600',
    categoria: 'procesador',
    socket: 'AM5',
    tdp: 65,
    precio_base: 850.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 3,
    descripcion_tecnica: '6 nucleos / 12 hilos, boost hasta 5.1 GHz, 32MB L3, incluye cooler Wraith Stealth.',
    imagen_url: 'https://www.amd.com/en/products/processors/desktop/ryzen/7000-series/amd-ryzen-5-7600.html'
  },
  {
    nombre: 'Intel Core i5-14400F',
    categoria: 'procesador',
    socket: 'LGA1700',
    tdp: 65,
    precio_base: 980.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 3,
    descripcion_tecnica: '10 nucleos (6P+4E), 16 hilos, boost hasta 4.7 GHz, sin graficos integrados.',
    imagen_url: 'https://www.intel.com/content/www/us/en/products/sku/236783/intel-core-i5-processor-14400f-20m-cache-up-to-4-70-ghz/specifications.html'
  },
  {
    nombre: 'AMD Ryzen 7 7700X',
    categoria: 'procesador',
    socket: 'AM5',
    tdp: 105,
    precio_base: 1400.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 5,
    descripcion_tecnica: '8 nucleos / 16 hilos, boost hasta 5.4 GHz, 32MB L3, arquitectura Zen 4.',
    imagen_url: 'https://www.amd.com/en/products/processors/desktop/ryzen/7000-series/amd-ryzen-7-7700x.html'
  },

  // Placa Madre
  {
    nombre: 'MSI PRO B650M-A WIFI',
    categoria: 'placa_madre',
    socket: 'AM5',
    ram_type: 'DDR5',
    form_factor: 'Micro-ATX',
    precio_base: 820.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Chipset B650, 4 slots DDR5, PCIe 4.0, Wi-Fi integrado, formato mATX.',
    imagen_url: 'https://www.msi.com/Motherboard/PRO-B650M-A-WIFI'
  },
  {
    nombre: 'ASUS TUF GAMING B760-PLUS WIFI',
    categoria: 'placa_madre',
    socket: 'LGA1700',
    ram_type: 'DDR5',
    form_factor: 'ATX',
    precio_base: 980.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Chipset B760, soporte Intel 12/13/14 gen, DDR5, PCIe 5.0, LAN 2.5G.',
    imagen_url: 'https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b760-plus-wifi/'
  },
  {
    nombre: 'Gigabyte B550M DS3H',
    categoria: 'placa_madre',
    socket: 'AM4',
    ram_type: 'DDR4',
    form_factor: 'Micro-ATX',
    precio_base: 520.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Chipset B550, DDR4, doble M.2, LAN Gigabit, ideal para Ryzen serie 3000/5000.',
    imagen_url: 'https://www.gigabyte.com/Motherboard/B550M-DS3H-rev-1x'
  },

  // RAM
  {
    nombre: 'Corsair Vengeance DDR5 32GB (2x16GB) 6000MHz',
    categoria: 'ram',
    ram_type: 'DDR5',
    precio_base: 520.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Kit 32GB DDR5 6000MT/s CL36, perfil EXPO/XMP para plataformas modernas.',
    imagen_url: 'https://www.corsair.com/us/en/p/memory/cmk32gx5m2d6000c36'
  },
  {
    nombre: 'Kingston FURY Beast DDR4 16GB (2x8GB) 3200MHz',
    categoria: 'ram',
    ram_type: 'DDR4',
    precio_base: 210.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 2,
    descripcion_tecnica: 'Kit 16GB DDR4 3200MT/s CL16, voltaje 1.35V, disipador de bajo perfil.',
    imagen_url: 'https://www.kingston.com/en/memory/gaming/kingston-fury-beast-ddr4-memory'
  },
  {
    nombre: 'G.Skill Ripjaws S5 DDR5 32GB (2x16GB) 6000MHz',
    categoria: 'ram',
    ram_type: 'DDR5',
    precio_base: 500.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Kit DDR5 32GB, 6000MT/s, baja latencia, optimizado para Intel XMP 3.0.',
    imagen_url: 'https://www.gskill.com/product/165/377/1649234723/F5-6000J3238F16GX2-RS5K'
  },

  // Almacenamiento
  {
    nombre: 'Samsung 990 PRO 1TB NVMe',
    categoria: 'almacenamiento',
    precio_base: 430.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 2,
    descripcion_tecnica: 'SSD M.2 NVMe PCIe 4.0, lectura hasta 7450 MB/s, escritura hasta 6900 MB/s.',
    imagen_url: 'https://semiconductor.samsung.com/consumer-storage/internal-ssd/990-pro/'
  },
  {
    nombre: 'WD Black SN850X 1TB NVMe',
    categoria: 'almacenamiento',
    precio_base: 390.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 2,
    descripcion_tecnica: 'SSD M.2 NVMe PCIe 4.0, lectura hasta 7300 MB/s, ideal para gaming.',
    imagen_url: 'https://www.westerndigital.com/products/internal-drives/wd-black-sn850x-nvme-ssd'
  },
  {
    nombre: 'Seagate Barracuda 2TB 7200RPM',
    categoria: 'almacenamiento',
    precio_base: 220.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 2,
    descripcion_tecnica: 'Disco duro 3.5 pulgadas, 2TB SATA, 7200RPM, cache 256MB.',
    imagen_url: 'https://www.seagate.com/products/hard-drives/barracuda-hard-drive/'
  },

  // GPU
  {
    nombre: 'NVIDIA GeForce RTX 4060 8GB',
    categoria: 'gpu',
    tdp: 115,
    precio_base: 1450.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 4,
    descripcion_tecnica: 'GPU Ada Lovelace, 8GB GDDR6, DLSS 3, ideal para 1080p/1440p.',
    imagen_url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/'
  },
  {
    nombre: 'AMD Radeon RX 7600 8GB',
    categoria: 'gpu',
    tdp: 165,
    precio_base: 1320.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Arquitectura RDNA 3, 8GB GDDR6, buen rendimiento en 1080p alto.',
    imagen_url: 'https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7600.html'
  },
  {
    nombre: 'NVIDIA GeForce RTX 4070 SUPER 12GB',
    categoria: 'gpu',
    tdp: 220,
    precio_base: 2750.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 5,
    descripcion_tecnica: '12GB GDDR6X, DLSS 3.5, gran rendimiento en 1440p ultra y 4K con escalado.',
    imagen_url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/'
  },

  // Fuente de Poder
  {
    nombre: 'Corsair RM750e 750W 80+ Gold',
    categoria: 'fuente',
    wattage: 750,
    precio_base: 450.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Fuente ATX 3.0, certificacion 80+ Gold, modular completa, 750W.',
    imagen_url: 'https://www.corsair.com/us/en/p/psu/cp-9020262-na/rme-series-rm750e-fully-modular-low-noise-atx-power-supply'
  },
  {
    nombre: 'MSI MAG A650GL 650W 80+ Gold',
    categoria: 'fuente',
    wattage: 650,
    precio_base: 360.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 3,
    descripcion_tecnica: '650W, certificacion 80+ Gold, cableado modular, soporte ATX 3.0.',
    imagen_url: 'https://www.msi.com/Power-Supply/MAG-A650GL-PCIE5'
  },
  {
    nombre: 'Seasonic Focus GX-850 850W 80+ Gold',
    categoria: 'fuente',
    wattage: 850,
    precio_base: 560.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Fuente 850W, certificacion Gold, modular completa, alta eficiencia y estabilidad.',
    imagen_url: 'https://seasonic.com/focus-gx'
  },

  // Case
  {
    nombre: 'Corsair 4000D Airflow',
    categoria: 'case',
    form_factor: 'ATX',
    precio_base: 420.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Mid Tower con alto flujo de aire, compatible ATX, Micro-ATX y Mini-ITX.',
    imagen_url: 'https://www.corsair.com/us/en/p/pc-cases/cc-9011200-ww/4000d-airflow-tempered-glass-mid-tower-atx-case-black'
  },
  {
    nombre: 'NZXT H5 Flow',
    categoria: 'case',
    form_factor: 'ATX',
    precio_base: 430.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Gabinete mid-tower con panel frontal ventilado, soporte ATX y refrigeracion mejorada.',
    imagen_url: 'https://nzxt.com/product/h5-flow'
  },
  {
    nombre: 'Cooler Master MasterBox Q300L',
    categoria: 'case',
    form_factor: 'Micro-ATX',
    precio_base: 230.0,
    stock: 5,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 2,
    descripcion_tecnica: 'Case compacto mATX con paneles magneticos de polvo y buena gestion de cables.',
    imagen_url: 'https://www.coolermaster.com/catalog/cases/mini-tower/masterbox-q300l/'
  }
];

async function insertarProductosEjemplo() {
  const resumen = await ejecutarTransaccion(async (cliente) => {
    let insertados = 0;
    let existentes = 0;

    for (const producto of PRODUCTOS_EJEMPLO) {
      const existe = await cliente.query(
        'SELECT id FROM productos WHERE nombre = $1 AND categoria = $2 LIMIT 1',
        [producto.nombre, producto.categoria]
      );

      if (existe.rows.length > 0) {
        existentes++;
        continue;
      }

      await cliente.query(
        `INSERT INTO productos (
          nombre, categoria, socket, ram_type, form_factor, wattage, tdp,
          precio_base, stock, disponible_a_pedido, tiempo_entrega_dias,
          descripcion_tecnica, imagen_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13
        )`,
        [
          producto.nombre,
          producto.categoria,
          producto.socket || null,
          producto.ram_type || null,
          producto.form_factor || null,
          producto.wattage || null,
          producto.tdp || null,
          producto.precio_base,
          producto.stock,
          producto.disponible_a_pedido,
          producto.tiempo_entrega_dias,
          producto.descripcion_tecnica || null,
          producto.imagen_url || null
        ]
      );
      insertados++;
    }

    const conteo = await cliente.query(
      `SELECT categoria, COUNT(*)::int AS total
       FROM productos
       WHERE categoria IN ('procesador','placa_madre','ram','almacenamiento','gpu','fuente','case')
       GROUP BY categoria
       ORDER BY categoria`
    );

    return {
      insertados,
      existentes,
      porCategoria: conteo.rows
    };
  });

  return resumen;
}

async function main() {
  try {
    const resultado = await insertarProductosEjemplo();
    console.log('Carga de productos ejemplo completada.');
    console.log(`Insertados: ${resultado.insertados}`);
    console.log(`Ya existentes: ${resultado.existentes}`);
    console.table(resultado.porCategoria);
  } catch (error) {
    console.error('Error al insertar productos ejemplo:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  PRODUCTOS_EJEMPLO,
  insertarProductosEjemplo
};
