/**
 * Pasos del tour del Cotizador.
 *
 * Los selectores apuntan a atributos `data-tour` colocados en la página, no a
 * clases de Tailwind (que cambian con cada ajuste de diseño). Cada paso explica
 * una zona de la pantalla en lenguaje claro y directo.
 *
 * El primer paso es un popover centrado de bienvenida (sin `element`).
 */
export const pasosCotizador = [
  {
    popover: {
      title: 'Te damos la bienvenida',
      description:
        'Este es el cotizador. En unos pocos pasos vas a armar una computadora completa y obtener su precio. Te mostramos lo principal. Si no querés verlo ahora, podés saltarlo.',
    },
  },
  {
    element: '[data-tour="cotizador-pasos"]',
    popover: {
      title: 'Armá tu PC por pasos',
      description:
        'Cada casilla es una pieza: procesador, placa, memoria, etc. Completá una y avanzá a la siguiente. Las que ya elegiste quedan marcadas en verde.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="cotizador-productos"]',
    popover: {
      title: 'Elegí cada componente',
      description:
        'Acá aparecen los productos del paso actual con su precio y stock. Tocá uno para agregarlo a tu configuración.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="cotizador-asistente"]',
    popover: {
      title: '¿No sabés qué elegir?',
      description:
        'Contale al asistente para qué vas a usar la PC y tu presupuesto. Te sugiere una configuración completa que podés aplicar con un clic.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="cotizador-cliente"]',
    popover: {
      title: 'Datos del cliente',
      description:
        'Completá los datos de contacto. Son necesarios para emitir la cotización y poder enviártela.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="cotizador-generar"]',
    popover: {
      title: 'Generá tu cotización',
      description:
        'Cuando tengas todos los componentes elegidos, este botón crea la cotización con el total final. ¡Listo!',
      side: 'left',
      align: 'start',
    },
  },
];

export default pasosCotizador;
