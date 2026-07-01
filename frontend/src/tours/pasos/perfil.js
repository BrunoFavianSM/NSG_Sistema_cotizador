/**
 * Pasos del tour de Mi cuenta (Perfil).
 */
export const pasosPerfil = [
  {
    popover: {
      title: 'Tu cuenta',
      description:
        'Desde acá gestionás tus datos, tu contraseña y el estado de tu cuenta.',
    },
  },
  {
    element: '[data-tour="perfil-datos"]',
    popover: {
      title: 'Datos personales',
      description:
        'Actualizá tu teléfono y tu correo. El nombre solo lo puede cambiar un administrador.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="perfil-password"]',
    popover: {
      title: 'Cambiar contraseña',
      description:
        'Cambiá tu contraseña cuando quieras. Vas a necesitar la actual para confirmar.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="perfil-baja"]',
    popover: {
      title: 'Dar de baja la cuenta',
      description:
        'Si necesitás cerrar tu cuenta, lo hacés desde acá. Es una acción importante, así que pide confirmación.',
      side: 'top',
      align: 'start',
    },
  },
];

export default pasosPerfil;
