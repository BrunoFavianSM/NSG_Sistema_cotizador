const express = require('express');
const rateLimit = require('express-rate-limit');
const asistenteIA = require('../servicios/asistenteIA');
const { sanitizarInput } = require('../utilidades/sanitizacion');

const router = express.Router();

// Rate limiting estricto para IA (5 req/min para reducir costos)
const limitadorIA = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5,
  message: { error: 'Demasiadas peticiones a IA. Intenta en 1 minuto.' }
});

router.use(limitadorIA);

/**
 * POST /api/ia/iniciar
 * Inicia una nueva conversación con el asistente IA
 * 
 * Body: { mensajeInicial: string }
 * Response: { sesionId: string, pregunta: string, contexto: object }
 */
router.post('/iniciar', async (req, res) => {
  try {
    const { mensajeInicial } = req.body;

    // Validar entrada
    if (!mensajeInicial || typeof mensajeInicial !== 'string') {
      return res.status(400).json({ error: 'mensajeInicial es requerido' });
    }

    if (mensajeInicial.length < 5 || mensajeInicial.length > 500) {
      return res.status(400).json({ error: 'mensajeInicial debe tener entre 5 y 500 caracteres' });
    }

    // Sanitizar entrada
    const mensajeLimpio = sanitizarInput(mensajeInicial);

    // Iniciar conversación
    const resultado = await asistenteIA.iniciarConversacion(mensajeLimpio);

    res.json(resultado);
  } catch (error) {
    console.error('Error al iniciar conversación:', error);
    res.status(500).json({ 
      error: 'Error al iniciar conversación con IA',
      fallback: true 
    });
  }
});

/**
 * POST /api/ia/continuar
 * Continúa una conversación existente
 * 
 * Body: { sesionId: string, respuestaCliente: string }
 * Response: { completado: boolean, pregunta?: string, recomendacion?: object }
 */
router.post('/continuar', async (req, res) => {
  try {
    const { sesionId, respuestaCliente } = req.body;

    // Validar entrada
    if (!sesionId || typeof sesionId !== 'string') {
      return res.status(400).json({ error: 'sesionId es requerido' });
    }

    if (!respuestaCliente || typeof respuestaCliente !== 'string') {
      return res.status(400).json({ error: 'respuestaCliente es requerido' });
    }

    if (respuestaCliente.length < 1 || respuestaCliente.length > 500) {
      return res.status(400).json({ error: 'respuestaCliente debe tener entre 1 y 500 caracteres' });
    }

    // Sanitizar entrada
    const respuestaLimpia = sanitizarInput(respuestaCliente);

    // Continuar conversación
    const resultado = await asistenteIA.continuarConversacion(sesionId, respuestaLimpia);

    res.json(resultado);
  } catch (error) {
    console.error('Error al continuar conversación:', error);
    
    if (error.message === 'Sesión no encontrada') {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    res.status(500).json({ 
      error: 'Error al continuar conversación con IA',
      fallback: true 
    });
  }
});

/**
 * GET /api/ia/estadisticas
 * Obtiene estadísticas de uso de IA (solo para monitoreo)
 * 
 * Response: { llamadas: number, costoEstimado: string, promedioTokens: number, cacheSize: number }
 */
router.get('/estadisticas', (req, res) => {
  try {
    const stats = asistenteIA.obtenerEstadisticas();
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
