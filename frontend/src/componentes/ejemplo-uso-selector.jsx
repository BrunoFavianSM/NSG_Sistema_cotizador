/**
 * Ejemplo de Uso del SelectorComponente
 * 
 * Este archivo demuestra cómo integrar el SelectorComponente
 * en diferentes escenarios del cotizador.
 */

import { useState } from 'react';
import SelectorComponente from './SelectorComponente';

// ============================================
// EJEMPLO 1: Selección de Procesador
// ============================================
export const EjemploSeleccionProcesador = () => {
  const [productos] = useState([
    {
      id: 1,
      nombre: 'Intel Core i5-13400',
      categoria: 'procesador',
      socket: 'LGA1700',
      tdp: 65,
      precio_base: 850,
      stock: 5,
      disponible_a_pedido: false,
      descripcion_tecnica: '10 núcleos, 16 hilos, 4.6 GHz Turbo'
    },
    {
      id: 2,
      nombre: 'AMD Ryzen 5 5600X',
      categoria: 'procesador',
      socket: 'AM4',
      tdp: 65,
      precio_base: 750,
      stock: 0,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: '6 núcleos, 12 hilos, 4.6 GHz Boost'
    }
  ]);

  const [procesadorSeleccionado, setProcesadorSeleccionado] = useState(null);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Selecciona un Procesador</h2>
      
      <SelectorComponente
        categoria="procesador"
        productos={productos}
        seleccionActual={procesadorSeleccionado}
        onSeleccionar={setProcesadorSeleccionado}
      />

      {procesadorSeleccionado && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">
            Seleccionado: {procesadorSeleccionado.nombre}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// EJEMPLO 2: Selección de Placa Madre con Filtro de Socket
// ============================================
export const EjemploSeleccionPlacaMadre = () => {
  const [productos] = useState([
    {
      id: 3,
      nombre: 'ASUS ROG Strix B760',
      categoria: 'placa_madre',
      socket: 'LGA1700',
      ram_type: 'DDR5',
      form_factor: 'ATX',
      precio_base: 650,
      stock: 3,
      disponible_a_pedido: false,
      descripcion_tecnica: 'ATX, 4x DDR5, PCIe 5.0'
    },
    {
      id: 4,
      nombre: 'MSI B550 Gaming Plus',
      categoria: 'placa_madre',
      socket: 'AM4',
      ram_type: 'DDR4',
      form_factor: 'ATX',
      precio_base: 450,
      stock: 2,
      disponible_a_pedido: false,
      descripcion_tecnica: 'ATX, 4x DDR4, PCIe 4.0'
    }
  ]);

  // Simular procesador ya seleccionado
  const [procesadorSeleccionado] = useState({
    id: 1,
    socket: 'LGA1700'
  });

  const [placaMadreSeleccionada, setPlacaMadreSeleccionada] = useState(null);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Selecciona una Placa Madre</h2>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          Procesador seleccionado: Socket {procesadorSeleccionado.socket}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Solo se mostrarán placas madre compatibles
        </p>
      </div>

      <SelectorComponente
        categoria="placa_madre"
        productos={productos}
        seleccionActual={placaMadreSeleccionada}
        onSeleccionar={setPlacaMadreSeleccionada}
        filtrosCompatibilidad={{ socket: procesadorSeleccionado.socket }}
      />

      {placaMadreSeleccionada && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">
            Seleccionada: {placaMadreSeleccionada.nombre}
          </p>
          <p className="text-sm text-green-600">
            Socket: {placaMadreSeleccionada.socket} �o" Compatible
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// EJEMPLO 3: Selección Múltiple de RAM
// ============================================
export const EjemploSeleccionRAM = () => {
  const [productos] = useState([
    {
      id: 5,
      nombre: 'Corsair Vengeance DDR5 16GB',
      categoria: 'ram',
      ram_type: 'DDR5',
      precio_base: 180,
      stock: 10,
      disponible_a_pedido: false,
      descripcion_tecnica: '16GB, 5600MHz, CL36'
    },
    {
      id: 6,
      nombre: 'Kingston Fury DDR5 16GB',
      categoria: 'ram',
      ram_type: 'DDR5',
      precio_base: 170,
      stock: 8,
      disponible_a_pedido: false,
      descripcion_tecnica: '16GB, 5200MHz, CL40'
    },
    {
      id: 7,
      nombre: 'G.Skill Trident DDR4 16GB',
      categoria: 'ram',
      ram_type: 'DDR4',
      precio_base: 120,
      stock: 15,
      disponible_a_pedido: false,
      descripcion_tecnica: '16GB, 3200MHz, CL16'
    }
  ]);

  // Simular placa madre ya seleccionada
  const [placaMadreSeleccionada] = useState({
    id: 3,
    ram_type: 'DDR5'
  });

  const [ramSeleccionada, setRamSeleccionada] = useState([]);

  const calcularTotalRAM = () => {
    return ramSeleccionada.reduce((total, ram) => total + parseFloat(ram.precio_base), 0);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Selecciona Módulos de RAM</h2>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          Placa madre soporta: {placaMadreSeleccionada.ram_type}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Puedes seleccionar múltiples módulos
        </p>
      </div>

      <SelectorComponente
        categoria="ram"
        productos={productos}
        seleccionActual={ramSeleccionada}
        onSeleccionar={setRamSeleccionada}
        filtrosCompatibilidad={{ ramType: placaMadreSeleccionada.ram_type }}
        permitirMultiple={true}
      />

      {ramSeleccionada.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 font-semibold mb-2">
            {ramSeleccionada.length} módulo{ramSeleccionada.length !== 1 ? 's' : ''} seleccionado{ramSeleccionada.length !== 1 ? 's' : ''}
          </p>
          <ul className="text-sm text-green-700 space-y-1">
            {ramSeleccionada.map((ram, index) => (
              <li key={index}>�?� {ram.nombre}</li>
            ))}
          </ul>
          <p className="text-green-800 font-bold mt-2">
            Total: S/ {calcularTotalRAM().toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// EJEMPLO 4: Integración Completa con AppContext
// ============================================
export const EjemploIntegracionCompleta = () => {
  // En un caso real, esto vendría del AppContext
  const [configuracion, setConfiguracion] = useState({
    procesador: null,
    placa_madre: null,
    ram: []
  });

  const [productos] = useState([
    // Procesadores
    {
      id: 1,
      nombre: 'Intel Core i5-13400',
      categoria: 'procesador',
      socket: 'LGA1700',
      precio_base: 850,
      stock: 5,
      disponible_a_pedido: false
    },
    // Placas madre
    {
      id: 3,
      nombre: 'ASUS ROG Strix B760',
      categoria: 'placa_madre',
      socket: 'LGA1700',
      ram_type: 'DDR5',
      precio_base: 650,
      stock: 3,
      disponible_a_pedido: false
    },
    // RAM
    {
      id: 5,
      nombre: 'Corsair Vengeance DDR5 16GB',
      categoria: 'ram',
      ram_type: 'DDR5',
      precio_base: 180,
      stock: 10,
      disponible_a_pedido: false
    }
  ]);

  const [pasoActual, setPasoActual] = useState(0);

  const pasos = [
    { id: 'procesador', nombre: 'Procesador' },
    { id: 'placa_madre', nombre: 'Placa Madre' },
    { id: 'ram', nombre: 'RAM' }
  ];

  const obtenerFiltrosCompatibilidad = () => {
    const paso = pasos[pasoActual];
    
    if (paso.id === 'placa_madre' && configuracion.procesador) {
      return { socket: configuracion.procesador.socket };
    }
    
    if (paso.id === 'ram' && configuracion.placa_madre) {
      return { ramType: configuracion.placa_madre.ram_type };
    }
    
    return {};
  };

  const manejarSeleccion = (producto) => {
    const paso = pasos[pasoActual];
    setConfiguracion(prev => ({
      ...prev,
      [paso.id]: producto
    }));
  };

  const siguientePaso = () => {
    if (pasoActual < pasos.length - 1) {
      setPasoActual(pasoActual + 1);
    }
  };

  const pasoAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Cotizador Completo</h2>
      
      {/* Indicador de pasos */}
      <div className="mb-6 flex gap-2">
        {pasos.map((paso, index) => (
          <div
            key={paso.id}
            className={`
              px-4 py-2 rounded
              ${index === pasoActual
                ? 'bg-blue-600 text-white'
                : index < pasoActual
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
              }
            `}
          >
            {paso.nombre}
          </div>
        ))}
      </div>

      {/* Selector del paso actual */}
      <SelectorComponente
        categoria={pasos[pasoActual].id}
        productos={productos}
        seleccionActual={configuracion[pasos[pasoActual].id]}
        onSeleccionar={manejarSeleccion}
        filtrosCompatibilidad={obtenerFiltrosCompatibilidad()}
        permitirMultiple={pasos[pasoActual].id === 'ram'}
      />

      {/* Navegación */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={pasoAnterior}
          disabled={pasoActual === 0}
          className="px-4 py-2 bg-gray-600 text-white rounded disabled:bg-gray-300"
        >
          Anterior
        </button>
        <button
          onClick={siguientePaso}
          disabled={pasoActual === pasos.length - 1 || !configuracion[pasos[pasoActual].id]}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default {
  EjemploSeleccionProcesador,
  EjemploSeleccionPlacaMadre,
  EjemploSeleccionRAM,
  EjemploIntegracionCompleta
};

