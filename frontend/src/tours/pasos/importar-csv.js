/**
 * Pasos del tour de Importación masiva (CSV).
 *
 * Es un flujo lineal: subir el archivo -> previsualizar -> ver resultado. La
 * previsualización y el resultado aparecen recién después de cargar un archivo,
 * así que esos pasos se descartan si todavía no existen en pantalla. El botón de
 * ayuda permite reabrir la guía en cualquier etapa para explicar lo que se ve.
 */
export const pasosImportarCsv = [
  {
    popover: {
      title: 'Importar catálogo CSV',
      description:
        'Acá cargás muchos productos de una sola vez con un archivo CSV de Deltron. Es un proceso de tres pasos.',
    },
  },
  {
    element: '[data-tour="csv-zona"]',
    popover: {
      title: '1. Subí el archivo',
      description:
        'Arrastrá tu archivo CSV acá, o tocá para elegirlo. Es el primer paso.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="csv-preview"]',
    popover: {
      title: '2. Revisá la previsualización',
      description:
        'Antes de confirmar, acá ves cómo quedaron las filas detectadas. Revisá que todo esté bien.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="csv-resultado"]',
    popover: {
      title: '3. Resultado',
      description:
        'Al finalizar, acá ves cuántos productos se importaron y si hubo algún error.',
      side: 'top',
      align: 'start',
    },
  },
];

export default pasosImportarCsv;
