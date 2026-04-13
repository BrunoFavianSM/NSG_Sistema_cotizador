/**
 * Servicio de Compatibilidad de Componentes
 * Valida compatibilidad tecnica entre componentes.
 */

class ServicioCompatibilidad {
  normalizarFormFactor(valor) {
    if (!valor) return null;
    const texto = String(valor).toLowerCase().replace(/\s+/g, '').replace('_', '-');

    if (texto.includes('mini-itx') || texto === 'itx') return 'Mini-ITX';
    if (texto.includes('micro-atx') || texto.includes('matx')) return 'Micro-ATX';
    if (texto === 'atx' || texto.includes('/atx') || texto.includes('atx/')) return 'ATX';

    return valor;
  }

  /**
   * @param {Object} componentes
   * @returns {{compatible:boolean, errores:string[], advertencias:string[]}}
   */
  validarConfiguracion(componentes) {
    const errores = [];
    const advertencias = [];

    // 1. Socket: Procesador <-> Placa Madre
    if (componentes.procesador && componentes.placa_madre) {
      if (componentes.procesador.socket !== componentes.placa_madre.socket) {
        errores.push(`X Socket incompatible: ${componentes.procesador.socket} vs ${componentes.placa_madre.socket}`);
      }
    }

    // 2. Tipo RAM: RAM <-> Placa Madre
    if (componentes.placa_madre && componentes.ram?.length > 0) {
      const tipoRAM = componentes.ram[0].ram_type;
      if (componentes.placa_madre.ram_type !== tipoRAM) {
        errores.push(`X RAM incompatible: Placa soporta ${componentes.placa_madre.ram_type}, seleccionado ${tipoRAM}`);
      }
    }

    // 3. Form Factor: Placa <-> Case
    if (componentes.placa_madre && componentes.case) {
      const soportados = this.parsearFormFactors(componentes.case.descripcion_tecnica);
      const formFactorPlaca = this.normalizarFormFactor(componentes.placa_madre.form_factor);

      if (!soportados.includes(formFactorPlaca)) {
        errores.push(`X Case no soporta ${formFactorPlaca}`);
      }
    }

    // 4. Potencia: Consumo <-> Fuente
    if (componentes.fuente) {
      const consumoTotal = this.calcularConsumoTotal(componentes);
      if (componentes.fuente.wattage < consumoTotal) {
        errores.push(`X Fuente insuficiente: requiere ${consumoTotal}W, tiene ${componentes.fuente.wattage}W`);
      } else if (componentes.fuente.wattage < consumoTotal * 1.2) {
        advertencias.push(`! Margen ajustado: recomendado ${Math.ceil(consumoTotal * 1.2)}W`);
      }
    }

    // 5. Componentes a pedido
    const aPedido = this.identificarComponentesAPedido(componentes);
    if (aPedido.length > 0) {
      const tiempoMax = Math.max(...aPedido.map((c) => c.tiempo_entrega_dias || 0));
      advertencias.push(`! Componentes a pedido: ${tiempoMax} días de entrega`);
    }

    return { compatible: errores.length === 0, errores, advertencias };
  }

  calcularConsumoTotal(componentes) {
    let total = 0;

    if (componentes.procesador?.tdp) total += componentes.procesador.tdp;
    if (componentes.gpu?.tdp) total += componentes.gpu.tdp;
    if (componentes.placa_madre) total += 50;
    if (componentes.ram) total += componentes.ram.length * 5;
    if (componentes.almacenamiento) total += 10;

    total += 20;
    return Math.ceil(total * 1.2);
  }

  identificarComponentesAPedido(componentes) {
    const aPedido = [];

    for (const comp of Object.values(componentes)) {
      if (Array.isArray(comp)) {
        aPedido.push(...comp.filter((c) => c.stock === 0 && c.disponible_a_pedido));
      } else if (comp?.stock === 0 && comp?.disponible_a_pedido) {
        aPedido.push(comp);
      }
    }

    return aPedido;
  }

  parsearFormFactors(descripcion) {
    const ff = [];
    const desc = String(descripcion || '').toLowerCase();

    if (desc.includes('mini-itx')) ff.push('Mini-ITX');
    if (desc.includes('micro-atx') || desc.includes('matx')) ff.push('Micro-ATX');

    const atxMatch = desc.match(/(?:^|\s|case\s)atx(?:\s|$|,|\/)/);
    if (atxMatch) ff.push('ATX');

    if (ff.includes('ATX')) {
      if (!ff.includes('Micro-ATX')) ff.push('Micro-ATX');
      if (!ff.includes('Mini-ITX')) ff.push('Mini-ITX');
    }

    return ff.length > 0 ? ff : ['ATX', 'Micro-ATX', 'Mini-ITX'];
  }

  filtrarPlacasPorSocket(placasMadre, socketProcesador) {
    if (!socketProcesador) return placasMadre;
    return placasMadre.filter((placa) => placa.socket === socketProcesador);
  }

  validarSocket(procesador, placaMadre) {
    if (!procesador || !placaMadre) return true;
    return procesador.socket === placaMadre.socket;
  }

  validarTipoRAM(placaMadre, modulosRAM) {
    if (!placaMadre || !modulosRAM || modulosRAM.length === 0) return true;
    const tipoRAM = modulosRAM[0].ram_type;
    return placaMadre.ram_type === tipoRAM;
  }

  validarFormFactor(placaMadre, caseGabinete) {
    if (!placaMadre || !caseGabinete) return true;
    const soportados = this.parsearFormFactors(caseGabinete.descripcion_tecnica);
    return soportados.includes(this.normalizarFormFactor(placaMadre.form_factor));
  }

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
