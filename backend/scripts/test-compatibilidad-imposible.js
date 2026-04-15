'use strict';

const { ejecutarQuery } = require('../src/configuracion/baseDatos');
const servicioCompatibilidad = require('../src/servicios/servicioCompatibilidad');

async function obtenerIdCategoria(nombre) {
  const r = await ejecutarQuery('SELECT id FROM categorias WHERE nombre = $1', [nombre]);
  if (r.rows.length) return r.rows[0].id;
  const c = await ejecutarQuery(
    'INSERT INTO categorias (nombre, es_componente_principal) VALUES ($1, $2) RETURNING id',
    [nombre, true]
  );
  return c.rows[0].id;
}

async function crearProductoBase({ codigo, nombre, categoria }) {
  const idCategoria = await obtenerIdCategoria(categoria);
  const marca = await ejecutarQuery(
    'INSERT INTO marcas (nombre) VALUES ($1) ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id',
    ['TEST_COMPAT']
  );

  const p = await ejecutarQuery(
    `INSERT INTO productos (
      id_categoria, id_marca, codigo_proveedor, nombre, precio_base, stock, disponible_a_pedido
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id`,
    [idCategoria, marca.rows[0].id, codigo, nombre, 100, 5, false]
  );
  return p.rows[0].id;
}

(async () => {
  const codigos = ['TEST-CPU-SOCKET', 'TEST-MB-SOCKET'];
  try {
    await ejecutarQuery('DELETE FROM detalle_cotizacion WHERE id_producto IN (SELECT id FROM productos WHERE codigo_proveedor = ANY($1::text[]))', [codigos]);
    await ejecutarQuery('DELETE FROM productos WHERE codigo_proveedor = ANY($1::text[])', [codigos]);

    const idCpu = await crearProductoBase({ codigo: codigos[0], nombre: 'CPU TEST LGA1700', categoria: 'procesador' });
    const idMb = await crearProductoBase({ codigo: codigos[1], nombre: 'MB TEST AM5', categoria: 'placa_madre' });

    await ejecutarQuery(
      `INSERT INTO specs_procesador (id_producto, socket, graficos_integrados, tdp_w)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id_producto) DO UPDATE SET socket = EXCLUDED.socket, graficos_integrados = EXCLUDED.graficos_integrados, tdp_w = EXCLUDED.tdp_w`,
      [idCpu, 'LGA1700', false, 125]
    );

    await ejecutarQuery(
      `INSERT INTO specs_placa_madre (id_producto, socket, ram_tipo, form_factor, m2_slots)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_producto) DO UPDATE SET socket = EXCLUDED.socket, ram_tipo = EXCLUDED.ram_tipo, form_factor = EXCLUDED.form_factor, m2_slots = EXCLUDED.m2_slots`,
      [idMb, 'AM5', 'DDR5', 'ATX', 2]
    );

    const resultado = await servicioCompatibilidad.validarConfiguracionConBD(
      {
        procesador: { id: idCpu },
        placa_madre: { id: idMb },
        ram: [],
        almacenamiento: null,
        gpu: null,
        fuente: null,
        case: null,
      },
      ejecutarQuery
    );

    const mensajeEsperado = 'Socket incompatible: LGA1700 vs AM5';
    const cumple = Array.isArray(resultado.errores) && resultado.errores.includes(mensajeEsperado);

    if (!cumple) {
      console.error('FALLO: No se obtuvo el mensaje exacto de socket.');
      console.error('Resultado:', resultado);
      process.exitCode = 1;
      return;
    }

    console.log('OK: El sistema detuvo la configuracion imposible con mensaje exacto de socket.');
    console.log('Mensaje:', mensajeEsperado);
  } catch (error) {
    console.error('FALLO en test de compatibilidad imposible:', error.message);
    process.exitCode = 1;
  } finally {
    await ejecutarQuery('DELETE FROM detalle_cotizacion WHERE id_producto IN (SELECT id FROM productos WHERE codigo_proveedor = ANY($1::text[]))', [codigos]).catch(() => {});
    await ejecutarQuery('DELETE FROM productos WHERE codigo_proveedor = ANY($1::text[])', [codigos]).catch(() => {});
  }
})();
