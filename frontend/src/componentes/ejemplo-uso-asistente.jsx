/**
 * Ejemplo de Uso: Componente Asistente IA
 * 
 * Este archivo muestra cómo integrar el componente AsistenteIA
 * en la aplicación principal del cotizador.
 */

import { useState } from 'react';
import AsistenteIA from './AsistenteIA';

const EjemploUsoAsistente = () => {
  const [configuracion, setConfiguracion] = useState({
    procesador: null,
    placa_madre: null,
    ram: [],
    almacenamiento: null,
    gpu: null,
    fuente: null,
    case: null
  });

  /**
   * Maneja la aplicación de una recomendación de IA
   * Esta función se llama cuando el usuario acepta la recomendación
   */
  const manejarAplicarRecomendacion = (componentesRecomendados) => {
    console.log('Aplicando recomendación:', componentesRecomendados);
    
    // Actualizar la configuración con los componentes recomendados
    setConfiguracion(prev => ({
      ...prev,
      ...componentesRecomendados
    }));

    // Aquí podrías agregar lógica adicional:
    // - Validar compatibilidad de los componentes recomendados
    // - Navegar a la página de resumen
    // - Mostrar notificación de éxito
    // - Etc.
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Cotizador de PC - Ejemplo con Asistente IA
        </h1>

        {/* Configuración actual */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Configuración Actual
          </h2>
          
          <div className="space-y-2">
            {Object.entries(configuracion).map(([categoria, componente]) => {
              // Manejar arrays (RAM)
              if (Array.isArray(componente)) {
                return (
                  <div key={categoria} className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 w-32">
                      {categoria.toUpperCase()}:
                    </span>
                    <span className="text-gray-600">
                      {componente.length > 0
                        ? componente.map(c => c.nombre).join(', ')
                        : 'No seleccionado'}
                    </span>
                  </div>
                );
              }

              // Componentes individuales
              return (
                <div key={categoria} className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 w-32">
                    {categoria.toUpperCase()}:
                  </span>
                  <span className="text-gray-600">
                    {componente ? componente.nombre : 'No seleccionado'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            ¿Necesitas ayuda?
          </h3>
          <p className="text-blue-800 mb-4">
            Haz click en el botón "Ayuda IA" en la esquina inferior derecha
            para obtener recomendaciones personalizadas basadas en tus necesidades.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            <li>El asistente te hará preguntas sobre tu presupuesto</li>
            <li>Te preguntará para qué usarás la computadora</li>
            <li>Puede preguntar sobre preferencias de marca</li>
            <li>Después de 3-5 preguntas, generará una recomendación</li>
            <li>Podrás aplicar la recomendación con un solo click</li>
          </ul>
        </div>

        {/* Componente Asistente IA */}
        <AsistenteIA onAplicarRecomendacion={manejarAplicarRecomendacion} />
      </div>
    </div>
  );
};

export default EjemploUsoAsistente;

