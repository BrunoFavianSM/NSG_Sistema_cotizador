const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'nsg_cotizaciones',
  user: 'postgres',
  password: '123',
});

const sql = `
SELECT
  p.id,
  c.nombre AS categoria,
  p.codigo_proveedor,
  p.nombre,
  p.estado_enriquecimiento,
  sp.socket AS cpu_socket,
  sp.nucleos,
  sp.hilos,
  sp.frecuencia_base_ghz,
  sp.frecuencia_boost_ghz,
  sp.tdp_w AS cpu_tdp,
  sp.graficos_integrados,
  sm.socket AS mb_socket,
  sm.chipset,
  sm.form_factor AS mb_form_factor,
  sm.ram_tipo AS mb_ram_tipo,
  sr.ram_tipo,
  sr.capacidad_gb,
  sr.velocidad_mhz,
  sg.chipset AS gpu_chipset,
  sg.vram_gb,
  sg.vram_tipo,
  sg.tdp_w AS gpu_tdp,
  sf.wattage,
  sf.certificacion,
  sc.form_factor AS case_form_factor,
  sc.compatibilidad_placa
FROM productos p
JOIN categorias c ON c.id = p.id_categoria
LEFT JOIN specs_procesador sp ON sp.id_producto = p.id
LEFT JOIN specs_placa_madre sm ON sm.id_producto = p.id
LEFT JOIN specs_ram sr ON sr.id_producto = p.id
LEFT JOIN specs_gpu sg ON sg.id_producto = p.id
LEFT JOIN specs_fuente sf ON sf.id_producto = p.id
LEFT JOIN specs_case sc ON sc.id_producto = p.id
WHERE p.codigo_proveedor IN (
  'cpam5r58500g',
  'mbarb550pg4ac',
  'me16tfv5600hc36',
  'vd8ggbrtx506tem',
  'psarpg-1000g',
  'csasa31pbkargb'
)
ORDER BY c.nombre, p.codigo_proveedor;
`;

pool.query(sql)
  .then((r) => {
    console.log(JSON.stringify(r.rows, null, 2));
    return pool.end();
  })
  .catch((e) => {
    console.error(e.stack || e.message);
    pool.end();
  });
