/**
 * Pasos del tour de Configuración del sistema.
 */
export const pasosConfiguracion = [
  {
    popover: {
      title: 'Configuración del sistema',
      description:
        'Acá ajustás los parámetros globales que afectan a todo el cotizador.',
    },
  },
  {
    element: '[data-tour="config-financieros"]',
    popover: {
      title: 'Parámetros financieros',
      description:
        'Definí el margen de ganancia, el IGV y el tipo de cambio. Impactan en todos los precios.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="config-asistente"]',
    popover: {
      title: 'Asistente de IA',
      description:
        'Configurá el comportamiento y el modelo del asistente que ayuda a armar cotizaciones.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="config-claves"]',
    popover: {
      title: 'Claves API',
      description:
        'Acá se guardan las claves de los servicios de IA. Manejalas con cuidado: son datos sensibles.',
      side: 'top',
      align: 'start',
    },
  },
];

export default pasosConfiguracion;
