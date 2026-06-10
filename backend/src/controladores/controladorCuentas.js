'use strict';

/**
 * Controlador de gestión de cuentas (solo admin).
 * El administrador tiene control total: listar, crear, editar (rol/estado/datos)
 * y eliminar cuentas (admin, vendedor, usuario). Único resguardo: no puede
 * auto-eliminarse ni quitarse a sí mismo el rol admin (evita autobloqueo).
 */

const { ejecutarQuery } = require('../configuracion/baseDatos');
const { encriptar, desencriptar, hashBusqueda } = require('../utilidades/encriptacion');
const { hashPassword } = require('../servicios/servicioAuth');

const ROLES_VALIDOS = ['admin', 'vendedor', 'usuario'];
const ESTADOS_VALIDOS = ['activa', 'pendiente_activacion'];

function descifrarSeguro(valor) {
  if (!valor) return null;
  try { return desencriptar(valor); } catch { return null; }
}

async function listarCuentas(req, res) {
  try {
    const { rows } = await ejecutarQuery(
      `SELECT id, username, nombre_completo, rol, estado, dni,
              correo_encrypted, telefono_encrypted, created_at
         FROM cuentas
        ORDER BY created_at DESC`
    );
    const cuentas = rows.map((c) => ({
      id: c.id,
      username: c.username,
      nombre_completo: c.nombre_completo,
      rol: c.rol,
      estado: c.estado,
      dni: c.dni,
      correo: descifrarSeguro(c.correo_encrypted),
      telefono: descifrarSeguro(c.telefono_encrypted),
      created_at: c.created_at,
    }));
    return res.json({ exito: true, cuentas });
  } catch (error) {
    console.error('Error al listar cuentas:', error);
    return res.status(500).json({ error: 'Error al listar cuentas', mensaje: 'No se pudieron recuperar las cuentas' });
  }
}

async function crearCuenta(req, res) {
  try {
    const { username, password, correo, nombre_completo, telefono, dni, rol } = req.body || {};

    if (!username || !password || !correo || !nombre_completo || !rol) {
      return res.status(400).json({ error: 'Datos inválidos', mensaje: 'username, password, correo, nombre_completo y rol son obligatorios' });
    }
    if (!ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido', mensaje: `rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}` });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Datos inválidos', mensaje: 'La contraseña debe tener al menos 8 caracteres' });
    }
    if (dni && !/^[0-9]{8,15}$/.test(String(dni).trim())) {
      return res.status(400).json({ error: 'Datos inválidos', mensaje: 'El DNI debe tener entre 8 y 15 dígitos' });
    }

    const correoNorm = String(correo).trim().toLowerCase();
    const correoHash = hashBusqueda(correoNorm);
    const existe = await ejecutarQuery('SELECT id FROM cuentas WHERE correo_hash = $1 OR username = $2', [correoHash, username.trim()]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'Cuenta duplicada', mensaje: 'Ya existe una cuenta con ese correo o username' });
    }

    const passwordHash = await hashPassword(password);
    const correoEncrypted = encriptar(correoNorm);
    const tel = telefono ? String(telefono).trim() : null;
    const telefonoEncrypted = tel ? encriptar(tel) : null;
    const telefonoHash = tel ? hashBusqueda(tel) : null;

    const insert = await ejecutarQuery(
      `INSERT INTO cuentas (username, password_hash, correo_encrypted, correo_hash, nombre_completo,
                            telefono_encrypted, telefono_hash, dni, rol, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'activa')
       RETURNING id, username, nombre_completo, rol, estado, dni`,
      [username.trim(), passwordHash, correoEncrypted, correoHash, nombre_completo.trim(),
       telefonoEncrypted, telefonoHash, dni ? String(dni).trim() : null, rol]
    );
    return res.status(201).json({ exito: true, cuenta: insert.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Cuenta duplicada', mensaje: 'username, correo o DNI ya en uso' });
    console.error('Error al crear cuenta:', error);
    return res.status(500).json({ error: 'Error al crear cuenta', mensaje: 'No se pudo crear la cuenta' });
  }
}

async function actualizarCuenta(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });

    const { nombre_completo, rol, estado, dni, password } = req.body || {};

    // Resguardo: el admin no puede quitarse a sí mismo el rol admin.
    if (req.usuario?.id === id && rol && rol !== 'admin') {
      return res.status(400).json({ error: 'Operación no permitida', mensaje: 'No puedes quitarte tu propio rol de administrador' });
    }

    const sets = [];
    const valores = [];
    let i = 1;
    if (nombre_completo !== undefined) { sets.push(`nombre_completo = $${i++}`); valores.push(String(nombre_completo).trim()); }
    if (rol !== undefined) {
      if (!ROLES_VALIDOS.includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
      sets.push(`rol = $${i++}`); valores.push(rol);
    }
    if (estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
      sets.push(`estado = $${i++}`); valores.push(estado);
    }
    if (dni !== undefined) {
      const d = dni ? String(dni).trim() : null;
      if (d && !/^[0-9]{8,15}$/.test(d)) return res.status(400).json({ error: 'DNI inválido' });
      sets.push(`dni = $${i++}`); valores.push(d);
    }
    if (password) {
      if (String(password).length < 8) return res.status(400).json({ error: 'Datos inválidos', mensaje: 'La contraseña debe tener al menos 8 caracteres' });
      sets.push(`password_hash = $${i++}`); valores.push(await hashPassword(password));
    }
    if (sets.length === 0) return res.status(400).json({ error: 'Sin cambios', mensaje: 'No hay campos para actualizar' });

    sets.push('updated_at = CURRENT_TIMESTAMP');
    valores.push(id);
    const upd = await ejecutarQuery(
      `UPDATE cuentas SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, username, nombre_completo, rol, estado, dni`,
      valores
    );
    if (upd.rows.length === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });
    return res.json({ exito: true, cuenta: upd.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Conflicto', mensaje: 'DNI o username ya en uso' });
    console.error('Error al actualizar cuenta:', error);
    return res.status(500).json({ error: 'Error al actualizar cuenta', mensaje: 'No se pudo actualizar la cuenta' });
  }
}

async function eliminarCuenta(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });
    if (req.usuario?.id === id) {
      return res.status(400).json({ error: 'Operación no permitida', mensaje: 'No puedes eliminar tu propia cuenta' });
    }
    const del = await ejecutarQuery('DELETE FROM cuentas WHERE id = $1 RETURNING id', [id]);
    if (del.rows.length === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });
    return res.json({ exito: true, mensaje: 'Cuenta eliminada' });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    return res.status(500).json({ error: 'Error al eliminar cuenta', mensaje: 'No se pudo eliminar la cuenta' });
  }
}

module.exports = { listarCuentas, crearCuenta, actualizarCuenta, eliminarCuenta };
