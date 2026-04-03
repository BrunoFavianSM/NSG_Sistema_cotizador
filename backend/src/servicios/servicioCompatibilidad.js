/**
 * Servicio de Compatibilidad de Componentes
 * Valida la compatibilidad técnica entre componentes de hardware
 * 
 * Validaciones implementadas:
 * - Socket: Procesador <-> Placa Madre
 * - Tipo RAM: RAM <-> Placa Madre
 * - Form Factor: Placa Madre <-> Case
 * - Potencia: Consumo Total <-> Fuente de Poder
 * - Componentes a Pedido: Identificación y tiempo de entrega
 */

class ServicioCompatibilidad {
  /**
   * Valida la configuración completa de componentes
   * @param {Object} componentes - Objeto con componentes seleccionados
   * @returns {Object} { compatible: boolean, errores: string[], advertencias: string[] }
   */
  validarConfiguracion(componentes) {
    const errores = [];
    const advertencias = [];

    // 1. Socket: Procesador <-> Placa Madre
    if (componentes.procesador && componentes.placa_madre) {
      if (componentes.procesador.socket !== componentes.placa_madre.socket) {
        errores.push(
          `❌ Socket incompatible: ${componentes.procesador.socket} vs ${componentes.placa_madre.socket}`
        );
      }
    }

    // 2. Tipo RAM: RAM <-> Placa Madre
    if (componentes.placa_madre && componentes.ram?.length > 0) {
      const tipoRAM = componentes.ram[0].ram_type;
      if (componentes.placa_madre.ram_type !== tipoRAM) {
        errores.push(
          `❌ RAM incompatible: Placa soporta ${componentes.placa_madre.ram_type}, seleccionado ${tipoRAM}`
        );
      }
    }

    // 3. Form Factor: Placa <-> Case
    if (componentes.placa_madre && componentes.case) {
      const soportados = this.parsearFormFactors(componentes.case.descripcion_tecnica);
      if (!soportados.includes(componentes.placa_madre.form_factor)) {
        errores.push(
          `❌ Case no soporta ${componentes.placa_madre.form_factor}`
        );
      }
    }

    // 4. Potencia: Consumo <-> Fuente
    if (componentes.fuente) {
      const consumoTotal = this.calcularConsumoTotal(componentes);
      if (componentes.fuente.wattage < consumoTotal) {
        errores.push(
          `❌ Fuente insuficiente: requiere ${consumoTotal}W, tiene ${componentes.fuente.wattage}W`
        );
      } else if (componentes.fuente.wattage < consumoTotal * 1.2) {
        advertencias.push(
          `⚠️ Margen ajustado: recomendado ${Math.ceil(consumoTotal * 1.2)}W`
        );
      }
    }

    // 5. Componentes a pedido
    const aPedido = this.identificarComponentesAPedido(componentes);
    if (aPedido.length > 0) {
      const tiempoMax = Math.max(...aPedido.map(c => c.tiempo_entrega_dias || 0));
      advertencias.push(
        `⚠️ Componentes a pedido: ${tiempoMax} días de entrega`
      );
    }

    return { compatible: errores.length === 0, errores, advertencias };
  }

  /**
   * Calcula el consumo eléctrico total de la configuración
   * @param {Object} componentes - Componentes seleccionados
   * @returns {number} Consumo total en watts con margen del 20%
   */
  calcularConsumoTotal(componentes) {
    let total = 0;
    
    // TDP del procesador
    if (componentes.procesador?.tdp) {
      total += componentes.procesador.tdp;
    }
    
    // TDP de la GPU
    if (componentes.gpu?.tdp) {
      total += componentes.gpu.tdp;
    }
    
    // Placa madre: ~50W
    if (componentes.placa_madre) {
      total += 50;
    }
    
    // RAM: ~5W por módulo
    if (componentes.ram) {
      total += componentes.ram.length * 5;
    }
    
    // Almacenamiento: ~10W
    if (componentes.almacenamiento) {
      total += 10;
    }
    
    // Ventiladores y otros: ~20W
    total += 20;
    
    // Margen de seguridad del 20%
    return Math.ceil(total * 1.2);
  }

  /**
   * Identifica componentes que están disponibles solo a pedido
   * @param {Object} componentes - Componentes seleccionados
   * @returns {Array} Lista de componentes a pedido
   */
  identificarComponentesAPedido(componentes) {
    const aPedido = [];
    
    for (const comp of Object.values(componentes)) {
      if (Array.isArray(comp)) {
        // Para arrays (ej: RAM múltiple)
        aPedido.push(...comp.filter(c => c.stock === 0 && c.disponible_a_pedido));
      } else if (comp?.stock === 0 && comp?.disponible_a_pedido) {
        // Para componentes individuales
        aPedido.push(comp);
      }
    }
    
    return aPedido;
  }

  /**
   * Parsea los form factors soportados desde la descripción técnica del case
   * @param {string} descripcion - Descripción técnica del case
   * @returns {Array<string>} Lista de form factors soportados
   */
  parsearFormFactors(descripcion) {
    const ff = [];
    const desc = descripcion.toLowerCase();
    
    // Detectar Mini-ITX
    if (desc.includes('mini-itx')) {
      ff.push('Mini-ITX');
    }
    
    // Detectar Micro-ATX
    if (desc.includes('micro-atx')) {
      ff.push('Micro-ATX');
    }
    
    // Detectar ATX (palabra completa o seguida de espacio/puntuación)
    // Buscar "atx" que no sea parte de "micro-atx" o "mini-itx"
    const atxMatch = desc.match(/(?:^|\s|case\s)atx(?:\s|$|,)/);
    if (atxMatch) {
      ff.push('ATX');
    }
    
    // Si soporta ATX, también soporta los más pequeños (si no están ya)
    if (ff.includes('ATX')) {
      if (!ff.includes('Micro-ATX')) {
        ff.push('Micro-ATX');
      }
      if (!ff.includes('Mini-ITX')) {
        ff.push('Mini-ITX');
      }
    }
    
    // Default: ATX si no se especifica
    return ff.length > 0 ? ff : ['ATX'];
  }

  /**
   * Filtra placas madre compatibles con el socket del procesador
   * @param {Array} placasMadre - Lista de placas madre disponibles
   * @param {string} socketProcesador - Socket del procesador seleccionado
   * @returns {Array} Placas madre compatibles
   */
  filtrarPlacasPorSocket(placasMadre, socketProcesador) {
    if (!socketProcesador) {
      return placasMadre;
    }
    
    return placasMadre.filter(placa => placa.socket === socketProcesador);
  }

  /**
   * Valida solo la compatibilidad de socket entre procesador y placa madre
   * @param {Object} procesador - Procesador seleccionado
   * @param {Object} placaMadre - Placa madre seleccionada
   * @returns {boolean} true si son compatibles
   */
  validarSocket(procesador, placaMadre) {
    if (!procesador || !placaMadre) {
      return true; // No hay conflicto si falta alguno
    }
    
    return procesador.socket === placaMadre.socket;
  }

  /**
   * Valida solo la compatibilidad de tipo de RAM
   * @param {Object} placaMadre - Placa madre seleccionada
   * @param {Array} modulosRAM - Módulos de RAM seleccionados
   * @returns {boolean} true si son compatibles
   */
  validarTipoRAM(placaMadre, modulosRAM) {
    if (!placaMadre || !modulosRAM || modulosRAM.length === 0) {
      return true;
    }
    
    const tipoRAM = modulosRAM[0].ram_type;
    return placaMadre.ram_type === tipoRAM;
  }

  /**
   * Valida solo la compatibilidad de form factor
   * @param {Object} placaMadre - Placa madre seleccionada
   * @param {Object} caseGabinete - Case seleccionado
   * @returns {boolean} true si son compatibles
   */
  validarFormFactor(placaMadre, caseGabinete) {
    if (!placaMadre || !caseGabinete) {
      return true;
    }
    
    const soportados = this.parsearFormFactors(caseGabinete.descripcion_tecnica);
    return soportados.includes(placaMadre.form_factor);
  }

  /**
   * Valida solo la potencia de la fuente
   * @param {Object} componentes - Todos los componentes
   * @returns {Object} { suficiente: boolean, consumoTotal: number, wattajeFuente: number }
   */
  validarPotencia(componentes) {
    if (!componentes.fuente) {
      return { suficiente: true, consumoTotal: 0, wattajeFuente: 0 };
    }
    
    const consumoTotal = this.calcularConsumoTotal(componentes);
    const wattajeFuente = componentes.fuente.wattage;
    
    return {
      suficiente: wattajeFuente >= consumoTotal,
      consumoTotal,
      wattajeFuente
    };
  }
}

module.exports = new ServicioCompatibilidad();
