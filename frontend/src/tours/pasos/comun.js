/**
 * Pasos compartidos entre todos los tours de página.
 */

/**
 * Paso final que señala el botón de ayuda del header, para que el usuario sepa
 * cómo volver a ver la guía cuando quiera. Se anexa automáticamente desde
 * useTour a cada tour de página.
 */
export const pasoVolverAVer = {
  element: '[data-tour="ayuda-tour"]',
  popover: {
    title: '¿Querés volver a verla?',
    description:
      'Cuando quieras, tocá este botón de ayuda y la guía de esta pantalla vuelve a aparecer.',
    side: 'bottom',
    align: 'end',
  },
};

export default pasoVolverAVer;
