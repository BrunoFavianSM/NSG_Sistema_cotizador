/**
 * Ejemplos de Uso: GeneradorPDF
 * 
 * Este archivo muestra diferentes formas de usar el componente GeneradorPDF
 */

import { useState } from 'react';
import GeneradorPDF from './GeneradorPDF';
import { useAppContext } from '../contexto/AppContext';

// ============================================
// EJEMPLO 1: Uso Básico
// ============================================

export function EjemploBasico() {
  const configuracion = {
    procesador: { id: 1, nombre: 'Intel Core i5', precio_base: 1200 },
    placa_madre: { id: 2, nombre: 'ASUS B550', precio_base: 800 },
    ram: [{ id: 3, nombre: 'Corsair 16GB', precio_base: 400 }],
    almacenamiento: { id: 4, nombre: 'Samsung 1TB SSD', precio_base: 600 },
    gpu: { id: 5, nombre: 'RTX 3060', precio_base: 2500 },
    fuente: { id: 6, nombre: 'EVGA 650W', precio_base: 450 },
    case: { id: 7, nombre: 'NZXT H510', precio_base: 350 }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Ejemplo Básico</h2>
      <GeneradorPDF configuracion={configuracion} />
    </div>
  );
}

// ============================================
// EJEMPLO 2: Con Contexto Global
// ============================================

export function EjemploConContexto() {
  const { configuracionSeleccionada, margenGanancia } = useAppContext();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Con Contexto Global</h2>
      <GeneradorPDF 
        configuracion={configuracionSeleccionada}
        margenGanancia={margenGanancia}
      />
    </div>
  );
}

// ============================================
// EJEMPLO 3: Con Callbacks
// ============================================

export function EjemploConCallbacks() {
  const [ultimaCotizacion, setUltimaCotizacion] = useState(null);
  const [error, setError] = useState(null);

  const configuracion = {
    procesador: { id: 1, nombre: 'Intel Core i5', precio_base: 1200 },
    placa_madre: { id: 2, nombre: 'ASUS B550', precio_base: 800 },
    ram: [{ id: 3, nombre: 'Corsair 16GB', precio_base: 400 }],
    almacenamiento: { id: 4, nombre: 'Samsung 1TB SSD', precio_base: 600 },
    gpu: { id: 5, nombre: 'RTX 3060', precio_base: 2500 },
    fuente: { id: 6, nombre: 'EVGA 650W', precio_base: 450 },
    case: { id: 7, nombre: 'NZXT H510', precio_base: 350 }
  };

  const manejarExito = (cotizacion) => {
    console.log('Cotización generada:', cotizacion);
    setUltimaCotizacion(cotizacion);
    setError(null);
  };

  const manejarError = (err) => {
    console.error('Error al generar:', err);
    setError(err.message);
    setUltimaCotizacion(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Con Callbacks</h2>
      
      <GeneradorPDF 
        configuracion={configuracion}
        onExito={manejarExito}
        onError={manejarError}
      />

      {ultimaCotizacion && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-bold text-green-800 mb-2">Última Cotización:</h3>
          <p className="text-sm text-green-700">
            Código: {ultimaCotizacion.codigo_ticket}
          </p>
          <p className="text-sm text-green-700">
            Total: S/ {ultimaCotizacion.precio_total.toFixed(2)}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-bold text-red-800 mb-2">Error:</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 4: Con Margen Personalizado
// ============================================

export function EjemploMargenPersonalizado() {
  const [margen, setMargen] = useState(20);

  const configuracion = {
    procesador: { id: 1, nombre: 'Intel Core i5', precio_base: 1200 },
    placa_madre: { id: 2, nombre: 'ASUS B550', precio_base: 800 },
    ram: [{ id: 3, nombre: 'Corsair 16GB', precio_base: 400 }],
    almacenamiento: { id: 4, nombre: 'Samsung 1TB SSD', precio_base: 600 },
    gpu: { id: 5, nombre: 'RTX 3060', precio_base: 2500 },
    fuente: { id: 6, nombre: 'EVGA 650W', precio_base: 450 },
    case: { id: 7, nombre: 'NZXT H510', precio_base: 350 }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Con Margen Personalizado</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Margen de Ganancia: {margen}%
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={margen}
          onChange={(e) => setMargen(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <GeneradorPDF 
        configuracion={configuracion}
        margenGanancia={margen}
      />
    </div>
  );
}

// ============================================
// EJEMPLO 5: Integración Completa
// ============================================

export function EjemploIntegracionCompleta() {
  const { 
    configuracionSeleccionada, 
    margenGanancia,
    configuracionCompleta 
  } = useAppContext();

  const [historialCotizaciones, setHistorialCotizaciones] = useState([]);

  const manejarExito = (cotizacion) => {
    // Agregar al historial
    setHistorialCotizaciones(prev => [cotizacion, ...prev]);
    
    // Mostrar notificación
    console.log('Nueva cotización generada:', cotizacion.codigo_ticket);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Integración Completa</h2>
      
      {/* Verificar que la configuración esté completa */}
      {!configuracionCompleta() ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
          <p className="text-yellow-800">
            Completa la selección de todos los componentes para generar una cotización.
          </p>
        </div>
      ) : (
        <>
          {/* Botón de generación */}
          <GeneradorPDF 
            configuracion={configuracionSeleccionada}
            margenGanancia={margenGanancia}
            onExito={manejarExito}
          />

          {/* Historial de cotizaciones */}
          {historialCotizaciones.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Historial de Cotizaciones</h3>
              <div className="space-y-3">
                {historialCotizaciones.map((cot, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">
                          {cot.codigo_ticket}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(cot.fecha_emision).toLocaleString('es-PE')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          S/ {cot.precio_total.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cot.estado}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 6: Con Estilos Personalizados
// ============================================

export function EjemploEstilosPersonalizados() {
  const configuracion = {
    procesador: { id: 1, nombre: 'Intel Core i5', precio_base: 1200 },
    placa_madre: { id: 2, nombre: 'ASUS B550', precio_base: 800 },
    ram: [{ id: 3, nombre: 'Corsair 16GB', precio_base: 400 }],
    almacenamiento: { id: 4, nombre: 'Samsung 1TB SSD', precio_base: 600 },
    gpu: { id: 5, nombre: 'RTX 3060', precio_base: 2500 },
    fuente: { id: 6, nombre: 'EVGA 650W', precio_base: 450 },
    case: { id: 7, nombre: 'NZXT H510', precio_base: 350 }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Con Estilos Personalizados</h2>
      
      <GeneradorPDF 
        configuracion={configuracion}
        className="shadow-2xl hover:shadow-3xl"
      />
    </div>
  );
}

// ============================================
// EJEMPLO 7: Con Validación Previa
// ============================================

export function EjemploConValidacion() {
  const { 
    configuracionSeleccionada, 
    validacionCompatibilidad,
    validarCompatibilidad 
  } = useAppContext();

  const [validando, setValidando] = useState(false);

  const manejarGeneracion = async () => {
    setValidando(true);
    
    // Validar compatibilidad antes de generar
    const resultado = await validarCompatibilidad();
    
    setValidando(false);

    if (!resultado.compatible) {
      alert('La configuración tiene problemas de compatibilidad. Por favor, revísala antes de generar la cotización.');
      return;
    }

    // Si es compatible, el componente GeneradorPDF se encargará
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Con Validación Previa</h2>
      
      {validacionCompatibilidad.errores.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-bold text-red-800 mb-2">Errores de Compatibilidad:</h3>
          <ul className="list-disc list-inside text-sm text-red-700">
            {validacionCompatibilidad.errores.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {validacionCompatibilidad.advertencias.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">Advertencias:</h3>
          <ul className="list-disc list-inside text-sm text-yellow-700">
            {validacionCompatibilidad.advertencias.map((adv, index) => (
              <li key={index}>{adv}</li>
            ))}
          </ul>
        </div>
      )}

      <GeneradorPDF 
        configuracion={configuracionSeleccionada}
      />
    </div>
  );
}

export default {
  EjemploBasico,
  EjemploConContexto,
  EjemploConCallbacks,
  EjemploMargenPersonalizado,
  EjemploIntegracionCompleta,
  EjemploEstilosPersonalizados,
  EjemploConValidacion
};
