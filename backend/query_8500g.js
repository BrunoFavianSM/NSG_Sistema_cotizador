const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'nsg_cotizaciones', user: 'postgres', password: '123' });

pool.query(`
  SELECT 
    p.id,
    p.codigo_proveedor,
    p.nombre,
    p.descripcion_general,
    p.estado_enriquecimiento,
    sp.socket,
    sp.arquitectura,
    sp.nucleos,
    sp.hilos,
    sp.frecuencia_base_ghz,
    sp.frecuencia_boost_ghz,
    sp.tdp_w,
    sp.graficos_integrados
  FROM productos p
  LEFT JOIN specs_procesador sp ON sp.id_producto = p.id
  WHERE LOWER(p.nombre) LIKE '%8500g%'
     OR LOWER(p.descripcion_general) LIKE '%8500g%'
  ORDER BY p.id DESC
  LIMIT 10
`).then(r => {
  console.log(JSON.stringify(r.rows, null, 2));
  pool.end();
}).catch(e => {
  console.error(e.stack || e.message);
  pool.end();
});
