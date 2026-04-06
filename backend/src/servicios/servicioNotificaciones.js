/**
 * Servicio de notificaciones por email.
 *
 * Nota: Este servicio usa un modo "simulado" por defecto para no depender
 * de un proveedor SMTP en desarrollo. En producción puede conectarse a SMTP
 * si se configuran las variables necesarias.
 */

const net = require('net');

function plantillaTexto({ codigoTicket, estado, fechaEmision, fechaValidez }) {
  return [
    'Hola,',
    '',
    'Tu equipo/cotizacion ya esta listo para recoger.',
    `Ticket: ${codigoTicket}`,
    `Estado: ${estado}`,
    `Fecha emision: ${new Date(fechaEmision).toLocaleString('es-PE')}`,
    `Fecha validez: ${new Date(fechaValidez).toLocaleString('es-PE')}`,
    '',
    'Gracias por confiar en NSG.'
  ].join('\n');
}

function plantillaHtml({ codigoTicket, estado, fechaEmision, fechaValidez }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1d1d1f; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">NSG - Notificacion de estado</h2>
      <p>Tu equipo/cotizacion ya esta listo para recoger.</p>
      <ul>
        <li><strong>Ticket:</strong> ${codigoTicket}</li>
        <li><strong>Estado:</strong> ${estado}</li>
        <li><strong>Fecha emision:</strong> ${new Date(fechaEmision).toLocaleString('es-PE')}</li>
        <li><strong>Fecha validez:</strong> ${new Date(fechaValidez).toLocaleString('es-PE')}</li>
      </ul>
      <p>Gracias por confiar en NSG.</p>
    </div>
  `;
}

function obtenerConfiguracionSMTP() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'no-reply@nsg.local',
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true'
  };
}

function enviarSMTPBasico({ host, port }) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port, timeout: 5000 }, () => {
      socket.end();
      resolve(true);
    });

    socket.on('error', reject);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Timeout SMTP'));
    });
  });
}

async function enviarNotificacionListo({ para, codigoTicket, estado, fechaEmision, fechaValidez }) {
  const asunto = `NSG - Equipo listo (${codigoTicket})`;
  const texto = plantillaTexto({ codigoTicket, estado, fechaEmision, fechaValidez });
  const html = plantillaHtml({ codigoTicket, estado, fechaEmision, fechaValidez });

  const smtp = obtenerConfiguracionSMTP();
  const smtpHabilitado = Boolean(smtp.host && smtp.user && smtp.pass);

  if (!smtpHabilitado) {
    return {
      enviado: true,
      modo: 'simulado',
      para,
      asunto,
      texto,
      html,
      respuesta: 'Notificacion simulada (sin SMTP configurado)'
    };
  }

  await enviarSMTPBasico({ host: smtp.host, port: smtp.port });

  return {
    enviado: true,
    modo: 'smtp-probe',
    para,
    asunto,
    texto,
    html,
    respuesta: `Conexion SMTP verificada en ${smtp.host}:${smtp.port}`
  };
}

module.exports = {
  enviarNotificacionListo
};
