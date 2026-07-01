/**
 * Pasos del tour del Validador de cotizaciones.
 * El resultado solo aparece tras buscar un ticket; ese paso se descarta si aún
 * no hay una cotización en pantalla.
 */
export const pasosValidar = [
  {
    popover: {
      title: 'Validador de cotizaciones',
      description:
        'Acá verificás un ticket emitido y confirmás reclamaciones en tienda.',
    },
  },
  {
    element: '[data-tour="validador-buscar"]',
    popover: {
      title: 'Buscá el ticket',
      description:
        'Ingresá el código del ticket (por ejemplo NSG-2026-0001) para traer la cotización.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="validador-resultado"]',
    popover: {
      title: 'Resultado de la validación',
      description:
        'Acá comparás el precio original con el actual y ves la diferencia. Más abajo está el detalle completo.',
      side: 'bottom',
      align: 'start',
    },
  },
];

export default pasosValidar;
