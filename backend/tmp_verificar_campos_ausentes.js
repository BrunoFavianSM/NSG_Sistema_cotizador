require('dotenv').config();
const { ejecutarQuery, pool } = require('./src/configuracion/baseDatos');

(async () => {
  const codigos = ['cpam4r55500', 'mbarb550pg4ac', 'vd6gasrtx3050do', 'psasap-750g', 'csasa31pwtargb', 'ssd2tbwm100'];
  const sql = `
    SELECT
      p.codigo_proveedor,
      c.nombre AS categoria,
      p.estado_enriquecimiento,
      sp.arquitectura,
      sp.socket AS cpu_socket,
      sp.nucleos,
      sp.hilos,
      sp.frecuencia_base_ghz,
      sp.frecuencia_boost_ghz,
      sp.tdp_w AS cpu_tdp,
      pm.socket AS mb_socket,
      pm.chipset,
      pm.form_factor AS mb_form_factor,
      pm.ram_tipo AS mb_ram_tipo,
      pm.max_ram_gb,
      pm.m2_slots,
      pm.pcie_version,
      g.chipset AS gpu_chipset,
      g.vram_gb,
      g.vram_tipo,
      g.bus_bits,
      g.tdp_w AS gpu_tdp,
      g.longitud_mm,
      f.wattage,
      f.certificacion,
      f.modular,
      f.form_factor AS psu_form_factor,
      cs.form_factor AS case_form_factor,
      cs.max_gpu_mm,
      cs.compatibilidad_placa,
      a.tipo_almacenamiento,
      a.capacidad_gb,
      a.interfaz,
      a.form_factor AS storage_form_factor,
      a.nvme_gen,
      a.velocidad_lectura_mbps,
      a.velocidad_escritura_mbps
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.id_categoria
    LEFT JOIN specs_procesador sp ON sp.id_producto = p.id
    LEFT JOIN specs_placa_madre pm ON pm.id_producto = p.id
    LEFT JOIN specs_gpu g ON g.id_producto = p.id
    LEFT JOIN specs_fuente f ON f.id_producto = p.id
    LEFT JOIN specs_case cs ON cs.id_producto = p.id
    LEFT JOIN specs_almacenamiento a ON a.id_producto = p.id
    WHERE p.codigo_proveedor = ANY($1)
    ORDER BY p.codigo_proveedor
  `;

  const { rows } = await ejecutarQuery(sql, [codigos]);
  console.log(JSON.stringify(rows, null, 2));
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
