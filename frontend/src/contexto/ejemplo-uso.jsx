/**
 * Ejemplos de uso del AppContext
 * 
 * Este archivo muestra cómo usar el contexto global en diferentes escenarios
 */

import { useAppContext } from './AppContext';
import { useState, useEffect } from 'react';

// ============================================
// EJEMPLO 1: Login de Administrador
// ============================================
function EjemploLogin() {
  const { login, autenticado, usuario, cargandoAuth } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const resultado = await login(username, password);
    if (resultado.exito) {
      console.log('Login exitoso');
    } else {
      alert(resultado.error);
    }
  };

  if (cargandoAuth) return <div>Verificando autenticación...</div>;

  return (
    <div>
      {autenticado ? (
        <div>
          <p>Bienvenido {usuario.username}</p>
        </div>
      ) : (
        <div>
          <input 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="Usuario"
          />
          <input 
            type="password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Contraseña"
          />
          <button onClick={handleLogin}>Iniciar Sesión</button>
        </div>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 2: Cargar y Mostrar Productos
// ============================================
function EjemploProductos() {
  const { 
    productos, 
    cargandoProductos, 
    errorProductos,
    cargarProductos,
    obtenerProductosPorCategoria 
  } = useAppContext();

  useEffect(() => {
    cargarProductos();
  }, []);

  if (cargandoProductos) return <div>Cargando productos...</div>;
  if (errorProductos) return <div>Error: {errorProductos}</div>;

  const procesadores = obtenerProductosPorCategoria('procesador');

  return (
    <div>
      <h2>Procesadores Disponibles</h2>
      {procesadores.map(proc => (
        <div key={proc.id}>
          <h3>{proc.nombre}</h3>
          <p>Precio: S/ {proc.precio_base}</p>
          <p>Stock: {proc.stock > 0 ? proc.stock : 'A pedido'}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// EJEMPLO 3: Selector de Componentes
// ============================================
function EjemploSelectorComponentes() {
  const { 
    productos,
    configuracionSeleccionada,
    seleccionarComponente,
    obtenerProductosPorCategoria,
    cargarProductos
  } = useAppContext();

  useEffect(() => {
    cargarProductos();
  }, []);

  const procesadores = obtenerProductosPorCategoria('procesador');

  const handleSeleccionar = (procesador) => {
    seleccionarComponente('procesador', procesador);
  };

  return (
    <div>
      <h2>Selecciona un Procesador</h2>
      {procesadores.map(proc => (
        <div 
          key={proc.id}
          onClick={() => handleSeleccionar(proc)}
          style={{
            border: configuracionSeleccionada.procesador?.id === proc.id 
              ? '2px solid blue' 
              : '1px solid gray',
            padding: '10px',
            margin: '5px',
            cursor: 'pointer'
          }}
        >
          <h3>{proc.nombre}</h3>
          <p>S/ {proc.precio_base}</p>
        </div>
      ))}

      {configuracionSeleccionada.procesador && (
        <div>
          <h3>Seleccionado:</h3>
          <p>{configuracionSeleccionada.procesador.nombre}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 4: Gestión de RAM (múltiple)
// ============================================
function EjemploGestionRAM() {
  const { 
    configuracionSeleccionada,
    agregarRAM,
    eliminarRAM,
    obtenerProductosPorCategoria,
    cargarProductos
  } = useAppContext();

  useEffect(() => {
    cargarProductos();
  }, []);

  const memorias = obtenerProductosPorCategoria('ram');

  return (
    <div>
      <h2>Agregar Memoria RAM</h2>
      
      <div>
        <h3>Disponibles:</h3>
        {memorias.map(ram => (
          <div key={ram.id}>
            <span>{ram.nombre} - S/ {ram.precio_base}</span>
            <button onClick={() => agregarRAM(ram)}>Agregar</button>
          </div>
        ))}
      </div>

      <div>
        <h3>Seleccionadas:</h3>
        {configuracionSeleccionada.ram.map((ram, index) => (
          <div key={index}>
            <span>{ram.nombre}</span>
            <button onClick={() => eliminarRAM(index)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EJEMPLO 5: Resumen y Precio Total
// ============================================
function EjemploResumenCotizacion() {
  const { 
    configuracionSeleccionada,
    calcularPrecioTotal,
    configuracionCompleta,
    margenGanancia
  } = useAppContext();

  const precioTotal = calcularPrecioTotal();
  const completa = configuracionCompleta();

  return (
    <div>
      <h2>Resumen de Configuración</h2>
      
      <div>
        <p>Procesador: {configuracionSeleccionada.procesador?.nombre || 'No seleccionado'}</p>
        <p>Placa Madre: {configuracionSeleccionada.placa_madre?.nombre || 'No seleccionado'}</p>
        <p>RAM: {configuracionSeleccionada.ram.length} módulos</p>
        <p>Almacenamiento: {configuracionSeleccionada.almacenamiento?.nombre || 'No seleccionado'}</p>
        <p>GPU: {configuracionSeleccionada.gpu?.nombre || 'No seleccionado'}</p>
        <p>Fuente: {configuracionSeleccionada.fuente?.nombre || 'No seleccionado'}</p>
        <p>Case: {configuracionSeleccionada.case?.nombre || 'No seleccionado'}</p>
      </div>

      <div>
        <h3>Precio Total: S/ {precioTotal.toFixed(2)}</h3>
        <p>Margen aplicado: {margenGanancia}%</p>
      </div>

      {completa ? (
        <button>Generar Cotización</button>
      ) : (
        <p>Completa todos los componentes para continuar</p>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 6: Validación de Compatibilidad
// ============================================
function EjemploValidacionCompatibilidad() {
  const { 
    validacionCompatibilidad,
    validarCompatibilidad,
    configuracionSeleccionada
  } = useAppContext();

  const handleValidar = async () => {
    await validarCompatibilidad();
  };

  return (
    <div>
      <h2>Validación de Compatibilidad</h2>
      
      <button onClick={handleValidar}>Validar Configuración</button>

      {validacionCompatibilidad.errores.length > 0 && (
        <div style={{ color: 'red' }}>
          <h3>Errores:</h3>
          {validacionCompatibilidad.errores.map((error, i) => (
            <p key={i}>{error}</p>
          ))}
        </div>
      )}

      {validacionCompatibilidad.advertencias.length > 0 && (
        <div style={{ color: 'orange' }}>
          <h3>Advertencias:</h3>
          {validacionCompatibilidad.advertencias.map((adv, i) => (
            <p key={i}>{adv}</p>
          ))}
        </div>
      )}

      {validacionCompatibilidad.compatible && (
        <div style={{ color: 'green' }}>
          <p>✓ Configuración compatible</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 7: Aplicar Configuración desde IA
// ============================================
function EjemploAplicarConfiguracionIA() {
  const { aplicarConfiguracion } = useAppContext();

  const handleAplicarRecomendacion = () => {
    // Supongamos que recibimos esta recomendación de la IA
    const recomendacionIA = {
      procesador: { id: 1, nombre: 'Intel i5-12400', precio_base: 500 },
      placa_madre: { id: 2, nombre: 'ASUS B660M', precio_base: 300 },
      ram: [
        { id: 3, nombre: 'Corsair 8GB DDR4', precio_base: 100 },
        { id: 4, nombre: 'Corsair 8GB DDR4', precio_base: 100 }
      ],
      almacenamiento: { id: 5, nombre: 'SSD 500GB', precio_base: 150 },
      gpu: { id: 6, nombre: 'RTX 3060', precio_base: 1200 },
      fuente: { id: 7, nombre: '650W 80+ Bronze', precio_base: 200 },
      case: { id: 8, nombre: 'Case ATX', precio_base: 150 }
    };

    aplicarConfiguracion(recomendacionIA);
    alert('Configuración aplicada desde IA');
  };

  return (
    <div>
      <h2>Recomendación de IA</h2>
      <button onClick={handleAplicarRecomendacion}>
        Aplicar Recomendación
      </button>
    </div>
  );
}

// ============================================
// EJEMPLO 8: Limpiar Configuración
// ============================================
function EjemploLimpiarConfiguracion() {
  const { limpiarConfiguracion, configuracionSeleccionada } = useAppContext();

  const tieneComponentes = Object.values(configuracionSeleccionada).some(
    comp => comp !== null && (Array.isArray(comp) ? comp.length > 0 : true)
  );

  return (
    <div>
      <h2>Limpiar Configuración</h2>
      {tieneComponentes ? (
        <button onClick={limpiarConfiguracion}>
          Limpiar Todo
        </button>
      ) : (
        <p>No hay componentes seleccionados</p>
      )}
    </div>
  );
}

export {
  EjemploLogin,
  EjemploProductos,
  EjemploSelectorComponentes,
  EjemploGestionRAM,
  EjemploResumenCotizacion,
  EjemploValidacionCompatibilidad,
  EjemploAplicarConfiguracionIA,
  EjemploLimpiarConfiguracion
};
