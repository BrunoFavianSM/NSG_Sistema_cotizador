/**
 * Ejemplo de Uso: ValidadorCompatibilidad
 * 
 * Este archivo muestra cómo integrar el componente ValidadorCompatibilidad
 * en el flujo de cotización.
 */

import { useState, useEffect } from 'react';
import ValidadorCompatibilidad from './ValidadorCompatibilidad';
import { validarCompatibilidad } from '../servicios/api';

const EjemploValidador = () => {
  const [componentesSeleccionados, setComponentesSeleccionados] = useState({
    procesador: null,
    placa_madre: null,
    ram: [],
    almacenamiento: null,
    gpu: null,
    fuente: null,
    case: null
  });

  const [resultadoValidacion, setResultadoValidacion] = useState(null);
  const [validando, setValidando] = useState(false);

  // Validar automáticamente cuando cambian los componentes
  useEffect(() => {
    const validarConfiguracion = async () => {
      // Solo validar si hay al menos 2 componentes seleccionados
      const componentesConValor = Object.values(componentesSeleccionados).filter(
        c => c !== null && (Array.isArray(c) ? c.length > 0 : true)
      );

      if (componentesConValor.length < 2) {
        setResultadoValidacion(null);
        return;
      }

      setValidando(true);

      try {
        const resultado = await validarCompatibilidad(componentesSeleccionados);
        setResultadoValidacion(resultado);
      } catch (error) {
        console.error('Error al validar compatibilidad:', error);
        setResultadoValidacion({
          compatible: false,
          errores: ['Error al validar la configuración. Intenta nuevamente.'],
          advertencias: []
        });
      } finally {
        setValidando(false);
      }
    };

    validarConfiguracion();
  }, [componentesSeleccionados]);

  // Ejemplo de selección de componentes
  const seleccionarProcesador = () => {
    setComponentesSeleccionados(prev => ({
      ...prev,
      procesador: {
        id: 1,
        nombre: 'AMD Ryzen 5 5600X',
        socket: 'AM4',
        tdp: 65
      }
    }));
  };

  const seleccionarPlacaMadre = () => {
    setComponentesSeleccionados(prev => ({
      ...prev,
      placa_madre: {
        id: 2,
        nombre: 'ASUS ROG Strix B550-F',
        socket: 'AM4',
        ram_type: 'DDR4',
        form_factor: 'ATX'
      }
    }));
  };

  const seleccionarPlacaIncompatible = () => {
    setComponentesSeleccionados(prev => ({
      ...prev,
      placa_madre: {
        id: 3,
        nombre: 'MSI Z690 Pro',
        socket: 'LGA1700', // Incompatible con AM4
        ram_type: 'DDR5',
        form_factor: 'ATX'
      }
    }));
  };

  const seleccionarFuenteInsuficiente = () => {
    setComponentesSeleccionados(prev => ({
      ...prev,
      gpu: {
        id: 4,
        nombre: 'NVIDIA RTX 4090',
        tdp: 450
      },
      fuente: {
        id: 5,
        nombre: 'Corsair 500W',
        wattage: 500
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Ejemplo: Validador de Compatibilidad</h1>

      {/* Botones de ejemplo */}
      <div className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold mb-3">Acciones de Prueba:</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={seleccionarProcesador}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Seleccionar Procesador (AM4)
          </button>
          <button
            onClick={seleccionarPlacaMadre}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Seleccionar Placa Compatible (AM4)
          </button>
          <button
            onClick={seleccionarPlacaIncompatible}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Seleccionar Placa Incompatible (LGA1700)
          </button>
          <button
            onClick={seleccionarFuenteInsuficiente}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Seleccionar GPU + Fuente Insuficiente
          </button>
        </div>
      </div>

      {/* Estado de validación */}
      {validando && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">Validando compatibilidad...</p>
        </div>
      )}

      {/* Componente ValidadorCompatibilidad */}
      <ValidadorCompatibilidad
        resultadoValidacion={resultadoValidacion}
        mostrar={true}
        className="mb-6"
      />

      {/* Componentes seleccionados */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Componentes Seleccionados:</h3>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(componentesSeleccionados, null, 2)}
        </pre>
      </div>

      {/* Resultado de validación */}
      {resultadoValidacion && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Resultado de Validación:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(resultadoValidacion, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EjemploValidador;

