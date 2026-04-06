require('dotenv').config();
const { ejecutarTransaccion, pool } = require('../src/configuracion/baseDatos');

const PRODUCTOS_EJEMPLO = [
  // Procesador (10)
  {
    nombre: 'AMD Ryzen 5 7600', categoria: 'procesador', socket: 'AM5', tdp: 65,
    precio_base: 850.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: '6 nucleos / 12 hilos, boost hasta 5.1 GHz, 32MB L3, incluye cooler Wraith Stealth.',
    imagen_url: 'https://www.amd.com/en/products/processors/desktop/ryzen/7000-series/amd-ryzen-5-7600.html'
  },
  {
    nombre: 'AMD Ryzen 5 7600X', categoria: 'procesador', socket: 'AM5', tdp: 105,
    precio_base: 980.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: '6 nucleos / 12 hilos, boost hasta 5.3 GHz, arquitectura Zen 4.',
    imagen_url: 'https://www.amd.com/en/products/processors/desktop/ryzen/7000-series/amd-ryzen-5-7600x.html'
  },
  {
    nombre: 'AMD Ryzen 7 7700X', categoria: 'procesador', socket: 'AM5', tdp: 105,
    precio_base: 1400.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 5,
    descripcion_tecnica: '8 nucleos / 16 hilos, boost hasta 5.4 GHz, 32MB L3.',
    imagen_url: 'https://www.amd.com/en/products/processors/desktop/ryzen/7000-series/amd-ryzen-7-7700x.html'
  },
  {
    nombre: 'AMD Ryzen 7 7800X3D', categoria: 'procesador', socket: 'AM5', tdp: 120,
    precio_base: 1890.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 5,
    descripcion_tecnica: '8 nucleos / 16 hilos, 3D V-Cache, alto rendimiento en gaming.',
    imagen_url: 'https://www.amd.com/en/products/processors/desktop/ryzen/7000-series/amd-ryzen-7-7800x3d.html'
  },
  {
    nombre: 'AMD Ryzen 9 7900X', categoria: 'procesador', socket: 'AM5', tdp: 170,
    precio_base: 2190.0, stock: 3, disponible_a_pedido: true, tiempo_entrega_dias: 6,
    descripcion_tecnica: '12 nucleos / 24 hilos, boost hasta 5.6 GHz, Zen 4.',
    imagen_url: 'https://www.amd.com/en/products/processors/desktop/ryzen/7000-series/amd-ryzen-9-7900x.html'
  },
  {
    nombre: 'Intel Core i5-14400F', categoria: 'procesador', socket: 'LGA1700', tdp: 65,
    precio_base: 980.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: '10 nucleos (6P+4E), 16 hilos, boost hasta 4.7 GHz, sin iGPU.',
    imagen_url: 'https://www.intel.com/content/www/us/en/products/sku/236783/intel-core-i5-processor-14400f-20m-cache-up-to-4-70-ghz/specifications.html'
  },
  {
    nombre: 'Intel Core i5-14600K', categoria: 'procesador', socket: 'LGA1700', tdp: 125,
    precio_base: 1450.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: '14 nucleos (6P+8E), 20 hilos, boost hasta 5.3 GHz.',
    imagen_url: 'https://www.intel.com/content/www/us/en/products/sku/236850/intel-core-i5-processor-14600k-24m-cache-up-to-5-30-ghz/specifications.html'
  },
  {
    nombre: 'Intel Core i7-14700K', categoria: 'procesador', socket: 'LGA1700', tdp: 125,
    precio_base: 2090.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 5,
    descripcion_tecnica: '20 nucleos (8P+12E), 28 hilos, boost hasta 5.6 GHz.',
    imagen_url: 'https://www.intel.com/content/www/us/en/products/sku/236846/intel-core-i7-processor-14700k-33m-cache-up-to-5-60-ghz/specifications.html'
  },
  {
    nombre: 'Intel Core i7-13700K', categoria: 'procesador', socket: 'LGA1700', tdp: 125,
    precio_base: 1890.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 5,
    descripcion_tecnica: '16 nucleos (8P+8E), 24 hilos, boost hasta 5.4 GHz.',
    imagen_url: 'https://www.intel.com/content/www/us/en/products/sku/230500/intel-core-i713700k-processor-30m-cache-up-to-5-40-ghz/specifications.html'
  },
  {
    nombre: 'Intel Core i9-14900K', categoria: 'procesador', socket: 'LGA1700', tdp: 125,
    precio_base: 2890.0, stock: 2, disponible_a_pedido: true, tiempo_entrega_dias: 7,
    descripcion_tecnica: '24 nucleos (8P+16E), 32 hilos, boost hasta 6.0 GHz.',
    imagen_url: 'https://www.intel.com/content/www/us/en/products/sku/236773/intel-core-i9-processor-14900k-36m-cache-up-to-6-00-ghz/specifications.html'
  },

  // Placa Madre (10)
  {
    nombre: 'MSI PRO B650M-A WIFI', categoria: 'placa_madre', socket: 'AM5', ram_type: 'DDR5', form_factor: 'mATX',
    precio_base: 820.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Chipset B650, 4 slots DDR5, PCIe 4.0, Wi-Fi integrado.',
    imagen_url: 'https://www.msi.com/Motherboard/PRO-B650M-A-WIFI'
  },
  {
    nombre: 'ASUS TUF GAMING B650-PLUS WIFI', categoria: 'placa_madre', socket: 'AM5', ram_type: 'DDR5', form_factor: 'ATX',
    precio_base: 1090.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 5,
    descripcion_tecnica: 'AM5 B650, DDR5, PCIe 4.0, LAN 2.5G y WiFi.',
    imagen_url: 'https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b650-plus-wifi/'
  },
  {
    nombre: 'Gigabyte B650 AORUS ELITE AX', categoria: 'placa_madre', socket: 'AM5', ram_type: 'DDR5', form_factor: 'ATX',
    precio_base: 1290.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 5,
    descripcion_tecnica: 'AM5 B650, DDR5, VRM robusto, WiFi 6E.',
    imagen_url: 'https://www.gigabyte.com/Motherboard/B650-AORUS-ELITE-AX'
  },
  {
    nombre: 'ASRock B650M Pro RS', categoria: 'placa_madre', socket: 'AM5', ram_type: 'DDR5', form_factor: 'mATX',
    precio_base: 760.0, stock: 6, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'AM5 mATX, DDR5, buen equilibrio costo/rendimiento.',
    imagen_url: 'https://www.asrock.com/mb/AMD/B650M%20Pro%20RS/index.asp'
  },
  {
    nombre: 'MSI MAG X670E TOMAHAWK WIFI', categoria: 'placa_madre', socket: 'AM5', ram_type: 'DDR5', form_factor: 'ATX',
    precio_base: 1790.0, stock: 3, disponible_a_pedido: true, tiempo_entrega_dias: 7,
    descripcion_tecnica: 'AM5 X670E, DDR5, PCIe 5.0, WiFi 6E.',
    imagen_url: 'https://www.msi.com/Motherboard/MAG-X670E-TOMAHAWK-WIFI'
  },
  {
    nombre: 'ASUS TUF GAMING B760-PLUS WIFI', categoria: 'placa_madre', socket: 'LGA1700', ram_type: 'DDR5', form_factor: 'ATX',
    precio_base: 980.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'B760, Intel 12/13/14 gen, DDR5, PCIe 5.0.',
    imagen_url: 'https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b760-plus-wifi/'
  },
  {
    nombre: 'MSI PRO B760M-A WIFI DDR4', categoria: 'placa_madre', socket: 'LGA1700', ram_type: 'DDR4', form_factor: 'mATX',
    precio_base: 760.0, stock: 6, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'B760 mATX con DDR4, WiFi y soporte Intel 12/13/14.',
    imagen_url: 'https://www.msi.com/Motherboard/PRO-B760M-A-WIFI-DDR4'
  },
  {
    nombre: 'Gigabyte B760M DS3H AX DDR4', categoria: 'placa_madre', socket: 'LGA1700', ram_type: 'DDR4', form_factor: 'mATX',
    precio_base: 690.0, stock: 7, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'B760 mATX DDR4, WiFi, PCIe 4.0.',
    imagen_url: 'https://www.gigabyte.com/Motherboard/B760M-DS3H-AX-DDR4'
  },
  {
    nombre: 'ASRock Z790 Pro RS', categoria: 'placa_madre', socket: 'LGA1700', ram_type: 'DDR5', form_factor: 'ATX',
    precio_base: 1320.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 5,
    descripcion_tecnica: 'Z790 ATX DDR5, overclock y expansion amplia.',
    imagen_url: 'https://www.asrock.com/mb/Intel/Z790%20Pro%20RS/index.asp'
  },
  {
    nombre: 'ASUS ROG STRIX Z790-F GAMING WIFI', categoria: 'placa_madre', socket: 'LGA1700', ram_type: 'DDR5', form_factor: 'ATX',
    precio_base: 2290.0, stock: 3, disponible_a_pedido: true, tiempo_entrega_dias: 7,
    descripcion_tecnica: 'Z790 premium DDR5, PCIe 5.0, WiFi 6E, VRM de alta gama.',
    imagen_url: 'https://www.asus.com/motherboards-components/motherboards/rog-strix/rog-strix-z790-f-gaming-wifi/'
  },

  // RAM (10)
  {
    nombre: 'Corsair Vengeance DDR5 32GB (2x16GB) 6000MHz', categoria: 'ram', ram_type: 'DDR5',
    precio_base: 520.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Kit 32GB DDR5 6000MT/s CL36, perfil EXPO/XMP.',
    imagen_url: 'https://www.corsair.com/us/en/p/memory/cmk32gx5m2d6000c36'
  },
  {
    nombre: 'G.Skill Trident Z5 Neo DDR5 32GB (2x16GB) 6000MHz', categoria: 'ram', ram_type: 'DDR5',
    precio_base: 580.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Kit DDR5 EXPO para AMD, 32GB CL30.',
    imagen_url: 'https://www.gskill.com/product/165/390/1665020252/F5-6000J3038F16GX2-TZ5N'
  },
  {
    nombre: 'Kingston FURY Beast DDR5 32GB (2x16GB) 5600MHz', categoria: 'ram', ram_type: 'DDR5',
    precio_base: 500.0, stock: 6, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Kit 32GB DDR5 5600MT/s para Intel/AMD.',
    imagen_url: 'https://www.kingston.com/en/memory/gaming/kingston-fury-beast-ddr5-memory'
  },
  {
    nombre: 'TeamGroup T-Force Delta RGB DDR5 32GB (2x16GB) 6400MHz', categoria: 'ram', ram_type: 'DDR5',
    precio_base: 640.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'DDR5 6400 RGB, orientada a alto rendimiento.',
    imagen_url: 'https://www.teamgroupinc.com/en/product/desktop-memory/t-force-delta-rgb-ddr5'
  },
  {
    nombre: 'Crucial Pro DDR5 32GB (2x16GB) 5600MHz', categoria: 'ram', ram_type: 'DDR5',
    precio_base: 470.0, stock: 6, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'DDR5 estable para productividad y gaming.',
    imagen_url: 'https://www.crucial.com/memory/ddr5'
  },
  {
    nombre: 'Kingston FURY Beast DDR4 16GB (2x8GB) 3200MHz', categoria: 'ram', ram_type: 'DDR4',
    precio_base: 210.0, stock: 7, disponible_a_pedido: true, tiempo_entrega_dias: 2,
    descripcion_tecnica: 'Kit 16GB DDR4 3200 CL16.',
    imagen_url: 'https://www.kingston.com/en/memory/gaming/kingston-fury-beast-ddr4-memory'
  },
  {
    nombre: 'Corsair Vengeance LPX DDR4 32GB (2x16GB) 3200MHz', categoria: 'ram', ram_type: 'DDR4',
    precio_base: 320.0, stock: 7, disponible_a_pedido: true, tiempo_entrega_dias: 2,
    descripcion_tecnica: 'Kit 32GB DDR4, bajo perfil, CL16.',
    imagen_url: 'https://www.corsair.com/us/en/p/memory/cmk32gx4m2e3200c16'
  },
  {
    nombre: 'G.Skill Ripjaws V DDR4 32GB (2x16GB) 3600MHz', categoria: 'ram', ram_type: 'DDR4',
    precio_base: 360.0, stock: 6, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'DDR4 3600 CL18 para plataformas AM4/LGA1700 DDR4.',
    imagen_url: 'https://www.gskill.com/product/165/184/1536051005/F4-3600C18D-32GVK'
  },
  {
    nombre: 'TeamGroup T-Force Vulcan Z DDR4 16GB (2x8GB) 3200MHz', categoria: 'ram', ram_type: 'DDR4',
    precio_base: 190.0, stock: 8, disponible_a_pedido: true, tiempo_entrega_dias: 2,
    descripcion_tecnica: 'Kit DDR4 3200 CL16 de entrada para gaming.',
    imagen_url: 'https://www.teamgroupinc.com/en/product/desktop-memory/t-force-vulcan-z-ddr4'
  },
  {
    nombre: 'Patriot Viper Steel DDR4 16GB (2x8GB) 3600MHz', categoria: 'ram', ram_type: 'DDR4',
    precio_base: 220.0, stock: 6, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'DDR4 3600 MHz para equipos de rendimiento medio/alto.',
    imagen_url: 'https://viper.patriotmemory.com/products/viper-steel-ddr4-performance-memory'
  },

  // Almacenamiento (10)
  {
    nombre: 'Samsung 990 PRO 1TB NVMe', categoria: 'almacenamiento',
    precio_base: 430.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 2,
    descripcion_tecnica: 'SSD M.2 NVMe PCIe 4.0, lectura hasta 7450 MB/s.',
    imagen_url: 'https://semiconductor.samsung.com/consumer-storage/internal-ssd/990-pro/'
  },
  {
    nombre: 'Samsung 980 PRO 2TB NVMe', categoria: 'almacenamiento',
    precio_base: 690.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'SSD PCIe 4.0 de alto rendimiento para gaming y trabajo.',
    imagen_url: 'https://semiconductor.samsung.com/consumer-storage/internal-ssd/980pro/'
  },
  {
    nombre: 'WD Black SN850X 1TB NVMe', categoria: 'almacenamiento',
    precio_base: 390.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 2,
    descripcion_tecnica: 'SSD NVMe PCIe 4.0, lectura hasta 7300 MB/s.',
    imagen_url: 'https://www.westerndigital.com/products/internal-drives/wd-black-sn850x-nvme-ssd'
  },
  {
    nombre: 'WD Blue SN580 1TB NVMe', categoria: 'almacenamiento',
    precio_base: 280.0, stock: 7, disponible_a_pedido: true, tiempo_entrega_dias: 2,
    descripcion_tecnica: 'SSD NVMe PCIe 4.0 orientado a productividad y gaming.',
    imagen_url: 'https://www.westerndigital.com/products/internal-drives/wd-blue-sn580-nvme-ssd'
  },
  {
    nombre: 'Crucial P3 Plus 1TB NVMe', categoria: 'almacenamiento',
    precio_base: 270.0, stock: 7, disponible_a_pedido: true, tiempo_entrega_dias: 2,
    descripcion_tecnica: 'M.2 NVMe PCIe 4.0 de buena relacion costo/rendimiento.',
    imagen_url: 'https://www.crucial.com/ssd/p3-plus/ct1000p3pssd8'
  },
  {
    nombre: 'Kingston NV2 1TB NVMe', categoria: 'almacenamiento',
    precio_base: 250.0, stock: 8, disponible_a_pedido: true, tiempo_entrega_dias: 2,
    descripcion_tecnica: 'SSD PCIe 4.0 economico para equipos de entrada/media.',
    imagen_url: 'https://www.kingston.com/en/ssd/nv2-nvme-pcie-ssd'
  },
  {
    nombre: 'Seagate Barracuda 2TB 7200RPM', categoria: 'almacenamiento',
    precio_base: 220.0, stock: 6, disponible_a_pedido: true, tiempo_entrega_dias: 2,
    descripcion_tecnica: 'HDD 3.5 SATA 2TB, 7200 RPM para almacenamiento masivo.',
    imagen_url: 'https://www.seagate.com/products/hard-drives/barracuda-hard-drive/'
  },
  {
    nombre: 'Seagate Barracuda 4TB 5400RPM', categoria: 'almacenamiento',
    precio_base: 340.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'HDD 4TB para bibliotecas multimedia y backups.',
    imagen_url: 'https://www.seagate.com/products/hard-drives/barracuda-hard-drive/'
  },
  {
    nombre: 'WD Blue 2TB HDD', categoria: 'almacenamiento',
    precio_base: 230.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Disco duro SATA 3.5 para uso general.',
    imagen_url: 'https://www.westerndigital.com/products/internal-drives/wd-blue-desktop-sata-hdd'
  },
  {
    nombre: 'Samsung 870 EVO 1TB SATA SSD', categoria: 'almacenamiento',
    precio_base: 310.0, stock: 6, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'SSD SATA 2.5 con alta fiabilidad para upgrade.',
    imagen_url: 'https://semiconductor.samsung.com/consumer-storage/internal-ssd/870evo/'
  },

  // GPU (10)
  {
    nombre: 'NVIDIA GeForce RTX 4060 8GB', categoria: 'gpu', tdp: 115,
    precio_base: 1450.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'GPU Ada Lovelace, 8GB GDDR6, DLSS 3, ideal para 1080p/1440p.',
    imagen_url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/'
  },
  {
    nombre: 'NVIDIA GeForce RTX 4060 Ti 8GB', categoria: 'gpu', tdp: 160,
    precio_base: 1950.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Excelente rendimiento en 1080p ultra y 1440p.',
    imagen_url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/'
  },
  {
    nombre: 'NVIDIA GeForce RTX 4070 SUPER 12GB', categoria: 'gpu', tdp: 220,
    precio_base: 2750.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 5,
    descripcion_tecnica: '12GB GDDR6X, DLSS 3.5, gran rendimiento 1440p.',
    imagen_url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/'
  },
  {
    nombre: 'NVIDIA GeForce RTX 4070 Ti SUPER 16GB', categoria: 'gpu', tdp: 285,
    precio_base: 3690.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 6,
    descripcion_tecnica: '16GB GDDR6X para cargas de gaming y creacion.',
    imagen_url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/'
  },
  {
    nombre: 'NVIDIA GeForce RTX 4080 SUPER 16GB', categoria: 'gpu', tdp: 320,
    precio_base: 5290.0, stock: 3, disponible_a_pedido: true, tiempo_entrega_dias: 7,
    descripcion_tecnica: 'GPU de gama alta para 4K y productividad avanzada.',
    imagen_url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/'
  },
  {
    nombre: 'AMD Radeon RX 7600 8GB', categoria: 'gpu', tdp: 165,
    precio_base: 1320.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Arquitectura RDNA 3, 8GB GDDR6, fuerte en 1080p.',
    imagen_url: 'https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7600.html'
  },
  {
    nombre: 'AMD Radeon RX 7700 XT 12GB', categoria: 'gpu', tdp: 245,
    precio_base: 2250.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 5,
    descripcion_tecnica: 'RDNA 3 para 1440p de alto rendimiento.',
    imagen_url: 'https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7700-xt.html'
  },
  {
    nombre: 'AMD Radeon RX 7800 XT 16GB', categoria: 'gpu', tdp: 263,
    precio_base: 2790.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 5,
    descripcion_tecnica: '16GB GDDR6, ideal para 1440p ultra.',
    imagen_url: 'https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7800-xt.html'
  },
  {
    nombre: 'AMD Radeon RX 7900 GRE 16GB', categoria: 'gpu', tdp: 260,
    precio_base: 3290.0, stock: 3, disponible_a_pedido: true, tiempo_entrega_dias: 6,
    descripcion_tecnica: 'Opcion de alto rendimiento para 1440p/4K.',
    imagen_url: 'https://www.amd.com/en/products/graphics/desktops/radeon/7000-series'
  },
  {
    nombre: 'AMD Radeon RX 7900 XTX 24GB', categoria: 'gpu', tdp: 355,
    precio_base: 5190.0, stock: 2, disponible_a_pedido: true, tiempo_entrega_dias: 7,
    descripcion_tecnica: '24GB GDDR6 para gaming 4K y tareas pesadas.',
    imagen_url: 'https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900-xtx.html'
  },

  // Fuente de Poder (10)
  {
    nombre: 'MSI MAG A650GL 650W 80+ Gold', categoria: 'fuente', wattage: 650,
    precio_base: 360.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: '650W, certificacion 80+ Gold, modular, ATX 3.0.',
    imagen_url: 'https://www.msi.com/Power-Supply/MAG-A650GL-PCIE5'
  },
  {
    nombre: 'Corsair RM750e 750W 80+ Gold', categoria: 'fuente', wattage: 750,
    precio_base: 450.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'ATX 3.0, certificacion Gold, modular completa.',
    imagen_url: 'https://www.corsair.com/us/en/p/psu/cp-9020262-na/rme-series-rm750e-fully-modular-low-noise-atx-power-supply'
  },
  {
    nombre: 'Seasonic Focus GX-850 850W 80+ Gold', categoria: 'fuente', wattage: 850,
    precio_base: 560.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Fuente 850W modular completa, alta eficiencia.',
    imagen_url: 'https://seasonic.com/focus-gx'
  },
  {
    nombre: 'Cooler Master MWE Gold V2 850W', categoria: 'fuente', wattage: 850,
    precio_base: 520.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: '850W 80+ Gold, modular para equipos gamer.',
    imagen_url: 'https://www.coolermaster.com/catalog/power-supplies/mwe-series/mwe-gold-850-v2/'
  },
  {
    nombre: 'Thermaltake Toughpower GF A3 750W', categoria: 'fuente', wattage: 750,
    precio_base: 470.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'ATX 3.0, 750W, certificacion 80+ Gold.',
    imagen_url: 'https://www.thermaltake.com/toughpower-gf-a3-gold-750w-tt-premium-edition.html'
  },
  {
    nombre: 'Gigabyte UD750GM 750W 80+ Gold', categoria: 'fuente', wattage: 750,
    precio_base: 430.0, stock: 6, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: '750W modular, protecciones electricas completas.',
    imagen_url: 'https://www.gigabyte.com/Power-Supply/GP-UD750GM'
  },
  {
    nombre: 'be quiet! Pure Power 12 M 750W', categoria: 'fuente', wattage: 750,
    precio_base: 540.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 5,
    descripcion_tecnica: 'Muy silenciosa, 80+ Gold, ATX 3.0.',
    imagen_url: 'https://www.bequiet.com/en/powersupply/4076'
  },
  {
    nombre: 'ASUS TUF Gaming 850W Gold', categoria: 'fuente', wattage: 850,
    precio_base: 620.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 5,
    descripcion_tecnica: '850W Gold, componentes militares y alta durabilidad.',
    imagen_url: 'https://www.asus.com/motherboards-components/power-supply-units/tuf-gaming/'
  },
  {
    nombre: 'EVGA SuperNOVA 1000 GT 1000W Gold', categoria: 'fuente', wattage: 1000,
    precio_base: 780.0, stock: 3, disponible_a_pedido: true, tiempo_entrega_dias: 6,
    descripcion_tecnica: '1000W para GPUs de alta gama, cableado modular.',
    imagen_url: 'https://www.evga.com/products/product.aspx?pn=220-GT-1000-X1'
  },
  {
    nombre: 'Corsair RM1000x Shift 1000W Gold', categoria: 'fuente', wattage: 1000,
    precio_base: 990.0, stock: 3, disponible_a_pedido: true, tiempo_entrega_dias: 6,
    descripcion_tecnica: 'Conectores laterales Shift, 80+ Gold, ATX 3.0.',
    imagen_url: 'https://www.corsair.com/us/en/p/psu/cp-9020253-na/rm1000x-shift-fully-modular-atx-power-supply'
  },

  // Case (10)
  {
    nombre: 'Corsair 4000D Airflow', categoria: 'case', form_factor: 'ATX',
    precio_base: 420.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Mid Tower de alto flujo, compatible ATX/mATX/Mini-ITX.',
    imagen_url: 'https://www.corsair.com/us/en/p/pc-cases/cc-9011200-ww/4000d-airflow-tempered-glass-mid-tower-atx-case-black'
  },
  {
    nombre: 'NZXT H5 Flow', categoria: 'case', form_factor: 'ATX',
    precio_base: 430.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Case ATX con panel frontal ventilado.',
    imagen_url: 'https://nzxt.com/product/h5-flow'
  },
  {
    nombre: 'Cooler Master MasterBox Q300L', categoria: 'case', form_factor: 'mATX',
    precio_base: 230.0, stock: 6, disponible_a_pedido: true, tiempo_entrega_dias: 2,
    descripcion_tecnica: 'Gabinete compacto mATX con buen flujo de aire.',
    imagen_url: 'https://www.coolermaster.com/catalog/cases/mini-tower/masterbox-q300l/'
  },
  {
    nombre: 'Lian Li Lancool 216', categoria: 'case', form_factor: 'ATX',
    precio_base: 520.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Case ATX airflow con ventiladores frontales de gran diametro.',
    imagen_url: 'https://lian-li.com/product/lancool-216/'
  },
  {
    nombre: 'Fractal Design Pop Air', categoria: 'case', form_factor: 'ATX',
    precio_base: 490.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Case ATX orientado a flujo de aire y limpieza visual.',
    imagen_url: 'https://www.fractal-design.com/products/cases/pop/pop-air/'
  },
  {
    nombre: 'Phanteks Eclipse G360A', categoria: 'case', form_factor: 'ATX',
    precio_base: 510.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Mid tower ATX con panel mallado y RGB frontal.',
    imagen_url: 'https://www.phanteks.com/Eclipse-G360A.html'
  },
  {
    nombre: 'Montech AIR 903 MAX', categoria: 'case', form_factor: 'ATX',
    precio_base: 420.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'ATX airflow con excelente relacion precio/prestaciones.',
    imagen_url: 'https://www.montechpc.com/en/products_detail.php?nid=370&s_ok2='
  },
  {
    nombre: 'DeepCool CH560', categoria: 'case', form_factor: 'ATX',
    precio_base: 540.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Case ATX con panel mesh y gran compatibilidad de cooling.',
    imagen_url: 'https://www.deepcool.com/products/Cases/fulltowercases/CH560-Mid-Tower-ATX-Case/2023/17309.shtml'
  },
  {
    nombre: 'ASUS Prime AP201', categoria: 'case', form_factor: 'mATX',
    precio_base: 430.0, stock: 5, disponible_a_pedido: true, tiempo_entrega_dias: 3,
    descripcion_tecnica: 'Case mATX compacto con paneles perforados para airflow.',
    imagen_url: 'https://www.asus.com/motherboards-components/cases/prime/asus-prime-ap201-microatx-case/'
  },
  {
    nombre: 'Thermaltake Divider 170 TG ARGB', categoria: 'case', form_factor: 'mATX',
    precio_base: 410.0, stock: 4, disponible_a_pedido: true, tiempo_entrega_dias: 4,
    descripcion_tecnica: 'Gabinete mATX con vidrio templado y ARGB.',
    imagen_url: 'https://www.thermaltake.com/divider-170-tg-argb-micro-chassis.html'
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
