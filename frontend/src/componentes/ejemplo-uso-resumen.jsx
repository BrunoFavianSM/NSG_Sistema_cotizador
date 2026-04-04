/**
 * Ejemplo de Uso: ResumenCotizacion
 * 
 * Este archivo muestra cómo usar el componente ResumenCotizacion
 * en diferentes escenarios.
 */

import { useState } from 'react';
import ResumenCotizacion from './ResumenCotizacion';
import { useAppContext } from '../contexto/AppContext';

// ============================================
// EJEMPLO 1: Uso Básico con Contexto
// ============================================
function EjemploBasico() {
  const { configuracionSeleccionada, margenGanancia } = useAppContext();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Resumen de tu Configuración</h1>
      
      <ResumenCotizacion
        configuracion={configuracionSeleccionada}
        margenGanancia={margenGanancia}
      />
    </div>
  );
}

// ============================================
// EJEMPLO 2: Mostrar Desglose de Margen (Admin)
// ============================================
function EjemploAdmin() {
  const { configuracionSeleccionada, margenGanancia } = useAppContext();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Vista Administrativa</h1>
      
      <ResumenCotizacion
        configuracion={configuracionSeleccionada}
        margenGanancia={margenGanancia}
        mostrarMargen={true} // Muestra el desglose del margen
      />
    </div>
  );
}

// ============================================
// EJEMPLO 3: Resumen en Sidebar
// ============================================
function EjemploSidebar() {
  const { configuracionSeleccionada, margenGanancia } = useAppContext();

  return (
    <aside className="w-80 bg-gray-50 p-4">
      <ResumenCotizacion
        configuracion={configuracionSeleccionada}
        margenGanancia={margenGanancia}
        className="sticky top-4" // Sticky sidebar
      />
    </aside>
  );
}

// ============================================
// EJEMPLO 4: Resumen con Configuración Manual
// ============================================
function EjemploManual() {
  const [configuracion] = useState({
    procesador: {
      id: 1,
      nombre: 'Intel Core i5-13400',
      precio_base: 850,
      stock: 5,
      descripcion_tecnica: '10 núcleos, 16 hilos, 4.6 GHz Turbo'
    },
    placa_madre: {
      id: 2,
      nombre: 'ASUS Prime B760M-A',
      precio_base: 450,
      stock: 3,
      descripcion_tecnica: 'Socket LGA1700, DDR5, Micro-ATX'
    },
    ram: [
      {
        id: 3,
        nombre: 'Corsair Vengeance 16GB DDR5',
        precio_base: 280,
        stock: 10
      },
      {
        id: 4,
        nombre: 'Corsair Vengeance 16GB DDR5',
        precio_base: 280,
        stock: 10
      }
    ],
    almacenamiento: {
      id: 5,
      nombre: 'Samsung 980 PRO 1TB NVMe',
      precio_base: 420,
      stock: 8
    },
    gpu: {
      id: 6,
      nombre: 'NVIDIA RTX 4060 Ti 8GB',
      precio_base: 1800,
      stock: 0,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 10
    },
    fuente: {
      id: 7,
      nombre: 'Corsair RM750e 750W 80+ Gold',
      precio_base: 380,
      stock: 5
    },
    case: {
      id: 8,
      nombre: 'NZXT H510 Flow',
      precio_base: 350,
      stock: 4
    }
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Configuración Personalizada</h1>
      
      <ResumenCotizacion
        configuracion={configuracion}
        margenGanancia={20}
      />
    </div>
  );
}

// ============================================
// EJEMPLO 5: Resumen en Modal
// ============================================
function EjemploModal() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const { configuracionSeleccionada, margenGanancia } = useAppContext();

  return (
    <>
      <button
        onClick={() => setMostrarModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Ver Resumen
      </button>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Resumen de Cotización</h2>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                �o.
              </button>
            </div>

            <ResumenCotizacion
              configuracion={configuracionSeleccionada}
              margenGanancia={margenGanancia}
            />

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cerrar
              </button>
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Generar Cotización
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// EJEMPLO 6: Resumen con Validación
// ============================================
function EjemploConValidacion() {
  const { 
    configuracionSeleccionada, 
    margenGanancia,
    configuracionCompleta,
    validacionCompatibilidad
  } = useAppContext();

  const puedeGenerarCotizacion = configuracionCompleta() && 
                                  validacionCompatibilidad.compatible;

  return (
    <div className="container mx-auto p-4">
      <ResumenCotizacion
        configuracion={configuracionSeleccionada}
        margenGanancia={margenGanancia}
      />

      <div className="mt-6">
        <button
          disabled={!puedeGenerarCotizacion}
          className={`
            w-full px-6 py-3 rounded-lg font-semibold
            ${puedeGenerarCotizacion
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {puedeGenerarCotizacion
            ? 'Generar Cotización'
            : 'Completa la configuración para continuar'
          }
        </button>
      </div>
    </div>
  );
}

// ============================================
// EJEMPLO 7: Comparación de Configuraciones
// ============================================
function EjemploComparacion() {
  const configuracion1 = {
    procesador: { id: 1, nombre: 'Intel i5', precio_base: 850, stock: 5 },
    placa_madre: { id: 2, nombre: 'ASUS B760', precio_base: 450, stock: 3 },
    ram: [{ id: 3, nombre: 'RAM 16GB', precio_base: 280, stock: 10 }],
    almacenamiento: { id: 4, nombre: 'SSD 1TB', precio_base: 420, stock: 8 },
    gpu: { id: 5, nombre: 'RTX 4060', precio_base: 1500, stock: 2 },
    fuente: { id: 6, nombre: 'PSU 650W', precio_base: 300, stock: 5 },
    case: { id: 7, nombre: 'Case ATX', precio_base: 250, stock: 4 }
  };

  const configuracion2 = {
    procesador: { id: 8, nombre: 'AMD Ryzen 7', precio_base: 1200, stock: 3 },
    placa_madre: { id: 9, nombre: 'MSI X670', precio_base: 650, stock: 2 },
    ram: [
      { id: 10, nombre: 'RAM 16GB', precio_base: 300, stock: 8 },
      { id: 11, nombre: 'RAM 16GB', precio_base: 300, stock: 8 }
    ],
    almacenamiento: { id: 12, nombre: 'SSD 2TB', precio_base: 750, stock: 5 },
    gpu: { id: 13, nombre: 'RTX 4070', precio_base: 2500, stock: 1 },
    fuente: { id: 14, nombre: 'PSU 850W', precio_base: 450, stock: 3 },
    case: { id: 15, nombre: 'Case Premium', precio_base: 400, stock: 2 }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Comparar Configuraciones</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Configuración Básica</h2>
          <ResumenCotizacion
            configuracion={configuracion1}
            margenGanancia={20}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Configuración Premium</h2>
          <ResumenCotizacion
            configuracion={configuracion2}
            margenGanancia={20}
          />
        </div>
      </div>
    </div>
  );
}

export {
  EjemploBasico,
  EjemploAdmin,
  EjemploSidebar,
  EjemploManual,
  EjemploModal,
  EjemploConValidacion,
  EjemploComparacion
};

