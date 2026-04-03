const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ejecutarQuery } = require('../configuracion/baseDatos');
const { v4: uuidv4 } = require('uuid');
const NodeCache = require('node-cache');

/**
 * Servicio de Asistente IA Conversacional
 * 
 * Implementa un flujo conversacional de 3-5 preguntas para recopilar:
 * - Presupuesto del cliente
 * - Usos principales (gaming, diseño, oficina, etc.)
 * - Preferencias de marca
 * 
 * Optimizaciones de costo:
 * - Usa gemini-1.5-flash (10x más barato que gemini-pro)
 * - Limita tokens de salida a 200
 * - Filtra productos por presupuesto (top 3 por categoría)
 * - Prompts compactos y optimizados
 * - Cache de recomendaciones (1 hora)
 * - Solo últimos 3 mensajes en historial
 * - Fallback sin IA para errores
 */
class AsistenteIA {
  constructor() {
    // Inicializar cliente de Gemini
    this.genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || '');
    
    // Usar gemini-1.5-flash para menor costo y mayor velocidad
    this.modelo = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200, // Limitar respuesta para reducir costo
        topP: 0.8,
        topK: 40
      }
    });

    // Cache de recomendaciones (1 hora de TTL)
    this.cacheRecomendaciones = new NodeCache({ stdTTL: 3600 });

    // Contadores para monitoreo
    this.contadorLlamadas = 0;
    this.costoEstimado = 0;
  }

  /**
   * Inicia una nueva conversación con el cliente
   * @param {string} mensajeInicial - Mensaje inicial del cliente
   * @returns {Promise<{sesionId: string, pregunta: string, contexto: object}>}
   */
  async iniciarConversacion(mensajeInicial) {
    const sesionId = uuidv4();
    const contexto = {
      mensajeInicial,
      presupuesto: null,
      usosPrincipales: [],
      preferencias: {},
      preguntasRealizadas: 0
    };

    // Prompt optimizado (corto y directo para reducir tokens)
    const prompt = `Experto hardware. Cliente: "${mensajeInicial}". 
Pregunta UNA cosa: presupuesto, uso o preferencia. Max 20 palabras. Español.`;

    try {
      const resultado = await this.modelo.generateContent(prompt);
      const pregunta = resultado.response.text();

      // Incrementar contadores
      this.contadorLlamadas++;
      this.costoEstimado += 0.00001; // Estimado por llamada

      // Guardar conversación en base de datos
      await ejecutarQuery(
        `INSERT INTO conversaciones_ia (sesion_id, contexto_cliente, historial_mensajes, estado)
         VALUES ($1, $2, $3, $4)`,
        [
          sesionId, 
          JSON.stringify(contexto), 
          JSON.stringify([
            { rol: 'cliente', mensaje: mensajeInicial },
            { rol: 'asistente', mensaje: pregunta }
          ]),
          'activa'
        ]
      );

      return { sesionId, pregunta, contexto };
    } catch (error) {
      console.error('Error al iniciar conversación con IA:', error);
      
      // Fallback sin IA
      const preguntaFallback = '¿Cuál es tu presupuesto aproximado para la computadora?';
      
      await ejecutarQuery(
        `INSERT INTO conversaciones_ia (sesion_id, contexto_cliente, historial_mensajes, estado)
         VALUES ($1, $2, $3, $4)`,
        [
          sesionId, 
          JSON.stringify(contexto), 
          JSON.stringify([
            { rol: 'cliente', mensaje: mensajeInicial },
            { rol: 'asistente', mensaje: preguntaFallback }
          ]),
          'activa'
        ]
      );

      return { sesionId, pregunta: preguntaFallback, contexto, fallback: true };
    }
  }

  /**
   * Continúa una conversación existente
   * @param {string} sesionId - ID de la sesión
   * @param {string} respuestaCliente - Respuesta del cliente
   * @returns {Promise<{completado: boolean, pregunta?: string, recomendacion?: object}>}
   */
  async continuarConversacion(sesionId, respuestaCliente) {
    // Obtener conversación de la base de datos
    const res = await ejecutarQuery(
      'SELECT contexto_cliente, historial_mensajes FROM conversaciones_ia WHERE sesion_id = $1',
      [sesionId]
    );

    if (res.rows.length === 0) {
      throw new Error('Sesión no encontrada');
    }

    const contexto = res.rows[0].contexto_cliente;
    const historial = res.rows[0].historial_mensajes;

    // Actualizar contexto con la respuesta del cliente
    this.actualizarContexto(contexto, respuestaCliente);
    historial.push({ rol: 'cliente', mensaje: respuestaCliente });

    // Verificar si tenemos información suficiente
    if (this.tieneInformacionSuficiente(contexto)) {
      // Generar recomendación final
      const productos = await this.obtenerProductosDisponibles();
      const recomendacion = await this.generarRecomendacion(contexto, productos);

      // Marcar conversación como completada
      await ejecutarQuery(
        `UPDATE conversaciones_ia 
         SET estado = 'completada', contexto_cliente = $1, historial_mensajes = $2, updated_at = CURRENT_TIMESTAMP
         WHERE sesion_id = $3`,
        [JSON.stringify(contexto), JSON.stringify(historial), sesionId]
      );

      return { completado: true, recomendacion };
    } else {
      // Generar siguiente pregunta
      const pregunta = await this.generarSiguientePregunta(contexto, historial);

      historial.push({ rol: 'asistente', mensaje: pregunta });
      contexto.preguntasRealizadas++;

      // Actualizar conversación
      await ejecutarQuery(
        `UPDATE conversaciones_ia 
         SET contexto_cliente = $1, historial_mensajes = $2, updated_at = CURRENT_TIMESTAMP
         WHERE sesion_id = $3`,
        [JSON.stringify(contexto), JSON.stringify(historial), sesionId]
      );

      return { completado: false, pregunta };
    }
  }

  /**
   * Actualiza el contexto del cliente extrayendo información de su respuesta
   * @param {object} contexto - Contexto actual
   * @param {string} respuesta - Respuesta del cliente
   */
  actualizarContexto(contexto, respuesta) {
    const lower = respuesta.toLowerCase();
    
    // Detectar presupuesto (números de 3-5 dígitos)
    const numeros = respuesta.match(/(\d{3,5})/g);
    if (numeros && !contexto.presupuesto) {
      contexto.presupuesto = {
        min: parseInt(numeros[0]),
        max: numeros[1] ? parseInt(numeros[1]) : parseInt(numeros[0]) * 1.2
      };
    }

    // Detectar usos principales
    const usos = {
      gaming: ['gaming', 'juegos', 'jugar', 'gamer', 'videojuegos'],
      diseño: ['diseño', 'photoshop', 'render', 'ilustración', 'gráfico'],
      video: ['video', 'edición', 'premiere', 'after effects', 'editar'],
      oficina: ['oficina', 'trabajo', 'excel', 'word', 'documentos'],
      programacion: ['programar', 'desarrollo', 'código', 'programación', 'developer']
    };

    for (const [uso, keywords] of Object.entries(usos)) {
      if (keywords.some(kw => lower.includes(kw))) {
        if (!contexto.usosPrincipales.includes(uso)) {
          contexto.usosPrincipales.push(uso);
        }
      }
    }

    // Detectar preferencias de marca
    if (lower.includes('intel')) contexto.preferencias.marcaProcesador = 'Intel';
    if (lower.includes('amd') && lower.includes('ryzen')) contexto.preferencias.marcaProcesador = 'AMD';
    if (lower.includes('nvidia') || lower.includes('geforce')) contexto.preferencias.marcaGPU = 'NVIDIA';
    if (lower.includes('radeon')) contexto.preferencias.marcaGPU = 'AMD';
  }

  /**
   * Verifica si tenemos información suficiente para generar recomendación
   * @param {object} contexto - Contexto actual
   * @returns {boolean}
   */
  tieneInformacionSuficiente(contexto) {
    return (contexto.presupuesto && contexto.usosPrincipales.length > 0) || 
           contexto.preguntasRealizadas >= 5;
  }

  /**
   * Genera la siguiente pregunta para el cliente
   * @param {object} contexto - Contexto actual
   * @param {array} historial - Historial de mensajes
   * @returns {Promise<string>}
   */
  async generarSiguientePregunta(contexto, historial) {
    try {
      // Solo últimos 3 mensajes para reducir tokens
      const ultimosMensajes = historial.slice(-3);
      const hist = ultimosMensajes.map(m => `${m.rol}: ${m.mensaje}`).join('\n');
      
      const faltante = [];
      if (!contexto.presupuesto) faltante.push('presupuesto');
      if (contexto.usosPrincipales.length === 0) faltante.push('uso');
      
      const prompt = `Conversación:
${hist}

Falta: ${faltante.join(', ')}. Pregunta UNA cosa. Max 20 palabras. Español.`;

      const resultado = await this.modelo.generateContent(prompt);
      
      // Incrementar contadores
      this.contadorLlamadas++;
      this.costoEstimado += 0.00001;

      return resultado.response.text();
    } catch (error) {
      console.error('Error al generar siguiente pregunta:', error);
      
      // Fallback sin IA
      if (!contexto.presupuesto) {
        return '¿Cuál es tu presupuesto aproximado?';
      }
      if (contexto.usosPrincipales.length === 0) {
        return '¿Para qué usarás principalmente la computadora?';
      }
      return '¿Tienes alguna preferencia de marca?';
    }
  }

  /**
   * Obtiene productos disponibles de la base de datos
   * @returns {Promise<array>}
   */
  async obtenerProductosDisponibles() {
    const res = await ejecutarQuery(
      'SELECT * FROM productos WHERE stock > 0 OR disponible_a_pedido = true ORDER BY categoria, precio_base'
    );
    return res.rows;
  }

  /**
   * Filtra productos relevantes para reducir tokens enviados a la IA
   * @param {array} productos - Lista completa de productos
   * @param {object} contexto - Contexto del cliente
   * @returns {array}
   */
  filtrarProductosRelevantes(productos, contexto) {
    let filtrados = productos;

    // Filtrar por presupuesto para reducir lista
    if (contexto.presupuesto) {
      const maxPorComponente = contexto.presupuesto.max / 4; // Estimado
      filtrados = filtrados.filter(p => p.precio_base <= maxPorComponente);
    }

    // Limitar a top 3 por categoría para reducir tokens
    const porCategoria = {};
    filtrados.forEach(p => {
      if (!porCategoria[p.categoria]) porCategoria[p.categoria] = [];
      porCategoria[p.categoria].push(p);
    });

    const relevantes = [];
    for (const cat in porCategoria) {
      const top3 = porCategoria[cat]
        .sort((a, b) => b.stock - a.stock) // Priorizar con stock
        .slice(0, 3);
      relevantes.push(...top3);
    }

    return relevantes;
  }

  /**
   * Genera recomendación personalizada usando IA
   * @param {object} contexto - Contexto del cliente
   * @param {array} productos - Productos disponibles
   * @returns {Promise<object>}
   */
  async generarRecomendacion(contexto, productos) {
    // Verificar cache primero
    const cacheKey = `rec_${contexto.presupuesto?.min}_${contexto.presupuesto?.max}_${contexto.usosPrincipales.sort().join('_')}`;
    const cached = this.cacheRecomendaciones.get(cacheKey);
    
    if (cached) {
      console.log('✓ Recomendación desde cache (sin costo IA)');
      return cached;
    }

    try {
      // Filtrar solo productos relevantes para reducir tokens
      const productosRelevantes = this.filtrarProductosRelevantes(productos, contexto);
      
      // Lista compacta (reducir tokens)
      const listaCompacta = productosRelevantes.map(p => 
        `${p.id}|${p.nombre}|${p.categoria}|${p.precio_base}|${p.socket||''}|${p.ram_type||''}|${p.stock>0?'S':'P'}`
      ).join('\n');

      // Prompt optimizado (corto para reducir costo)
      const prompt = `Cliente: S/${contexto.presupuesto?.min}-${contexto.presupuesto?.max}, ${contexto.usosPrincipales.join(',')}

Productos (ID|Nombre|Cat|Precio|Socket|RAM|Stock):
${listaCompacta}

JSON config compatible (socket y RAM deben coincidir):
{"procesador":ID,"placa_madre":ID,"ram":[ID],"almacenamiento":ID,"gpu":ID,"fuente":ID,"case":ID,"explicacion":"breve"}`;

      const resultado = await this.modelo.generateContent(prompt);
      
      // Incrementar contadores
      this.contadorLlamadas++;
      this.costoEstimado += 0.00001;

      // Extraer JSON de la respuesta
      const textoRespuesta = resultado.response.text();
      const jsonMatch = textoRespuesta.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta de IA');
      }

      const recomendacion = JSON.parse(jsonMatch[0]);
      
      // Validar recomendación
      const recomendacionValidada = await this.validarRecomendacion(recomendacion, productos);
      
      // Guardar en cache
      this.cacheRecomendaciones.set(cacheKey, recomendacionValidada);
      
      return recomendacionValidada;
    } catch (error) {
      console.error('Error al generar recomendación con IA:', error);
      
      // Fallback: recomendación básica sin IA
      return this.generarRecomendacionBasica(contexto, productos);
    }
  }

  /**
   * Valida que la recomendación de IA solo incluya productos disponibles
   * @param {object} rec - Recomendación de IA
   * @param {array} productos - Productos disponibles
   * @returns {Promise<object>}
   */
  async validarRecomendacion(rec, productos) {
    const mapa = new Map(productos.map(p => [p.id, p]));
    const validada = { 
      componentes: {}, 
      explicacion: rec.explicacion || 'Configuración recomendada', 
      advertencias: [] 
    };

    for (const [cat, id] of Object.entries(rec)) {
      if (['explicacion', 'advertencias'].includes(cat)) continue;
      
      if (Array.isArray(id)) {
        // Para arrays (ej: RAM)
        const productosValidos = id.filter(i => mapa.has(i)).map(i => mapa.get(i));
        validada.componentes[cat] = productosValidos;
        
        // Verificar advertencias para cada producto en el array
        productosValidos.forEach(prod => {
          if (prod.stock === 0 && prod.disponible_a_pedido) {
            validada.advertencias.push(`${prod.nombre}: A pedido (${prod.tiempo_entrega_dias} días)`);
          }
        });
      } else if (id && mapa.has(id)) {
        const prod = mapa.get(id);
        validada.componentes[cat] = prod;
        
        // Advertir si es a pedido
        if (prod.stock === 0 && prod.disponible_a_pedido) {
          validada.advertencias.push(`${prod.nombre}: A pedido (${prod.tiempo_entrega_dias} días)`);
        }
      }
    }

    return validada;
  }

  /**
   * Genera recomendación básica sin IA (fallback)
   * @param {object} contexto - Contexto del cliente
   * @param {array} productos - Productos disponibles
   * @returns {object}
   */
  generarRecomendacionBasica(contexto, productos) {
    const presupuesto = contexto.presupuesto?.max || 5000;
    const esGaming = contexto.usosPrincipales.includes('gaming');
    const esDiseño = contexto.usosPrincipales.includes('diseño');
    
    // Lógica simple basada en reglas
    const config = {
      componentes: {},
      explicacion: 'Configuración básica recomendada (sin IA)',
      advertencias: []
    };

    // Seleccionar procesador
    const procesadores = productos.filter(p => p.categoria === 'procesador' && p.precio_base < presupuesto * 0.25);
    if (procesadores.length > 0) {
      config.componentes.procesador = procesadores[0];
    }

    // Seleccionar placa madre compatible
    if (config.componentes.procesador) {
      const placas = productos.filter(p => 
        p.categoria === 'placa_madre' && 
        p.socket === config.componentes.procesador.socket &&
        p.precio_base < presupuesto * 0.15
      );
      if (placas.length > 0) {
        config.componentes.placa_madre = placas[0];
      }
    }

    // Seleccionar RAM compatible
    if (config.componentes.placa_madre) {
      const rams = productos.filter(p => 
        p.categoria === 'ram' && 
        p.ram_type === config.componentes.placa_madre.ram_type &&
        p.precio_base < presupuesto * 0.15
      );
      if (rams.length > 0) {
        config.componentes.ram = [rams[0]];
      }
    }

    // Seleccionar almacenamiento
    const almacenamientos = productos.filter(p => p.categoria === 'almacenamiento' && p.precio_base < presupuesto * 0.1);
    if (almacenamientos.length > 0) {
      config.componentes.almacenamiento = almacenamientos[0];
    }

    // Seleccionar GPU (si es gaming o diseño)
    if (esGaming || esDiseño) {
      const gpus = productos.filter(p => p.categoria === 'gpu' && p.precio_base < presupuesto * 0.35);
      if (gpus.length > 0) {
        config.componentes.gpu = gpus[0];
      }
    }

    // Seleccionar fuente
    const fuentes = productos.filter(p => p.categoria === 'fuente' && p.precio_base < presupuesto * 0.1);
    if (fuentes.length > 0) {
      config.componentes.fuente = fuentes[0];
    }

    // Seleccionar case
    const cases = productos.filter(p => p.categoria === 'case' && p.precio_base < presupuesto * 0.1);
    if (cases.length > 0) {
      config.componentes.case = cases[0];
    }

    return config;
  }

  /**
   * Obtiene estadísticas de uso de IA
   * @returns {object}
   */
  obtenerEstadisticas() {
    return {
      llamadas: this.contadorLlamadas,
      costoEstimado: this.costoEstimado.toFixed(4),
      promedioTokens: 500,
      cacheSize: this.cacheRecomendaciones.keys().length
    };
  }
}

// Exportar instancia única (singleton)
module.exports = new AsistenteIA();
