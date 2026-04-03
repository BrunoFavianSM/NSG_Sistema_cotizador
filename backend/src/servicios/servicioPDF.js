const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Servicio de Generación de PDFs Dual
 * Genera dos tipos de documentos:
 * 1. PDF de Cotización: Con precios y código ticket
 * 2. PDF de Listado Técnico: Solo especificaciones (sin precios)
 */
class ServicioPDF {
  /**
   * Genera PDF de cotización con precios
   * @param {Object} datos - Datos de la cotización
   * @param {string} datos.codigoTicket - Código ticket (NSG-YYYY-NNNN)
   * @param {string} datos.codigoUnico - UUID de la cotización
   * @param {Date} datos.fechaEmision - Fecha de emisión
   * @param {Date} datos.fechaValidez - Fecha de caducidad
   * @param {Array} datos.componentes - Lista de componentes
   * @param {number} datos.precioTotal - Precio total con margen
   * @returns {Promise<Buffer>} Buffer del PDF generado
   */
  async generarPDFCotizacion(datos) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Logo (si existe)
      const rutaLogo = path.join(__dirname, '../../assets/logo-nsg.png');
      if (fs.existsSync(rutaLogo)) {
        doc.image(rutaLogo, 50, 45, { width: 100 });
      }

      // Encabezado
      doc.fontSize(20).font('Helvetica-Bold')
         .text('NSG Latinoamerica E.I.R.L.', 200, 50, { align: 'right' });
      doc.fontSize(10).font('Helvetica')
         .text('Soluciones en Tecnología', 200, 75, { align: 'right' });

      doc.moveTo(50, 120).lineTo(550, 120).stroke();
      doc.moveDown(2);

      // Título
      doc.fontSize(16).font('Helvetica-Bold')
         .text('COTIZACIÓN DE COMPUTADORA', { align: 'center' });
      doc.moveDown();

      // Código Ticket (grande y visible)
      doc.fontSize(10).text('Código de Ticket:', 50);
      doc.fontSize(14).fillColor('blue')
         .text(datos.codigoTicket, 180);
      
      // Código UUID (pequeño)
      doc.fillColor('black').fontSize(7)
         .text(`UUID: ${datos.codigoUnico}`, 50);

      // Fechas
      doc.fontSize(10).moveDown();
      doc.text(`Emisión: ${this.formatearFecha(datos.fechaEmision)}`, 50);
      doc.fillColor('red').font('Helvetica-Bold')
         .text(`Caducidad: ${this.formatearFecha(datos.fechaValidez)}`, 50);
      doc.fillColor('black').font('Helvetica').moveDown(2);

      // Tabla de componentes
      this.agregarTabla(doc, datos.componentes, true);

      // Total
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold')
         .text('PRECIO TOTAL:', 350);
      doc.fontSize(16).fillColor('green')
         .text(`S/ ${datos.precioTotal.toFixed(2)}`, 480, doc.y - 15, { align: 'right' });

      // Instrucciones
      doc.fillColor('black').fontSize(9).font('Helvetica').moveDown(2);
      doc.text('CÓMO RECLAMAR:', { underline: true });
      doc.fontSize(8).moveDown(0.5);
      doc.text(`1. Visita nuestra tienda`);
      doc.text(`2. Presenta código: ${datos.codigoTicket}`);
      doc.text(`3. Validaremos disponibilidad y precios`);
      doc.text(`4. Componentes "A Pedido" se solicitan al confirmar`);

      // Footer
      doc.fontSize(8).text('\nVálido por 3 días. Precios sujetos a cambio.', { align: 'center' });

      doc.end();
    });
  }

  /**
   * Genera PDF de listado técnico (sin precios)
   * @param {string} codigoTicket - Código ticket de referencia
   * @param {Array} componentes - Lista de componentes
   * @returns {Promise<Buffer>} Buffer del PDF generado
   */
  async generarPDFListado(codigoTicket, componentes) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Logo (si existe)
      const rutaLogo = path.join(__dirname, '../../assets/logo-nsg.png');
      if (fs.existsSync(rutaLogo)) {
        doc.image(rutaLogo, 50, 45, { width: 100 });
      }

      // Encabezado
      doc.fontSize(20).font('Helvetica-Bold')
         .text('NSG Latinoamerica E.I.R.L.', 200, 50, { align: 'right' });
      doc.fontSize(10).font('Helvetica')
         .text('Soluciones en Tecnología', 200, 75, { align: 'right' });

      doc.moveTo(50, 120).lineTo(550, 120).stroke();
      doc.moveDown(2);

      // Título
      doc.fontSize(16).font('Helvetica-Bold')
         .text('LISTADO TÉCNICO DE COMPONENTES', { align: 'center' });
      doc.fontSize(10).font('Helvetica')
         .text(`Referencia: ${codigoTicket}`, { align: 'center' });
      doc.moveDown(2);

      // Tabla de componentes (sin precios)
      this.agregarTabla(doc, componentes, false);

      // Footer
      doc.fontSize(8).moveDown()
         .text('Documento solo para referencia técnica', { align: 'center' });

      doc.end();
    });
  }

  /**
   * Agrega tabla de componentes al PDF
   * @param {PDFDocument} doc - Documento PDF
   * @param {Array} componentes - Lista de componentes
   * @param {boolean} incluirPrecios - Si se deben incluir precios
   */
  agregarTabla(doc, componentes, incluirPrecios) {
    // Encabezados de tabla
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Categoría', 50);
    doc.text('Producto', 140);
    doc.text('Disponibilidad', 350);
    if (incluirPrecios) doc.text('Precio', 480);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Filas de componentes
    doc.fontSize(8).font('Helvetica');
    componentes.forEach((comp, i) => {
      // Fondo alternado para mejor legibilidad
      if (i % 2 === 0) {
        doc.rect(50, doc.y - 3, 500, 20).fillAndStroke('#f9f9f9', '#f9f9f9');
      }
      
      doc.fillColor('black');
      doc.text(this.formatearCategoria(comp.categoria), 50, doc.y, { width: 80 });
      doc.text(comp.nombre, 140, doc.y - 8, { width: 200 });
      
      // Disponibilidad con color
      const disp = comp.stock > 0 ? 'En Stock' : 
                   comp.disponibleAPedido ? `A Pedido (${comp.tiempoEntregaDias}d)` : 'No Disp.';
      doc.fillColor(comp.stock > 0 ? 'green' : 'orange')
         .text(disp, 350, doc.y - 8);
      
      // Precio (solo si incluirPrecios es true)
      if (incluirPrecios) {
        doc.fillColor('black')
           .text(`S/ ${comp.precioBase.toFixed(2)}`, 480, doc.y - 8);
      }
      
      doc.moveDown();
    });
  }

  /**
   * Formatea fecha a formato legible en español
   * @param {Date} fecha - Fecha a formatear
   * @returns {string} Fecha formateada
   */
  formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  }

  /**
   * Formatea nombre de categoría para mostrar
   * @param {string} cat - Categoría interna
   * @returns {string} Categoría formateada
   */
  formatearCategoria(cat) {
    const mapa = {
      procesador: 'Procesador',
      placa_madre: 'Placa Madre',
      ram: 'RAM',
      almacenamiento: 'Almacenamiento',
      gpu: 'GPU',
      fuente: 'Fuente',
      case: 'Case'
    };
    return mapa[cat] || cat;
  }
}

module.exports = new ServicioPDF();
