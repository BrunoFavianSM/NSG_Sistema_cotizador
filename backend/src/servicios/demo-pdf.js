/**
 * Script de demostración del Generador de PDF Dual
 * Genera PDFs de ejemplo para verificar funcionalidad
 */

const servicioPDF = require('./servicioPDF');
const fs = require('fs');
const path = require('path');

const componentesEjemplo = [
  {
    categoria: 'procesador',
    nombre: 'AMD Ryzen 5 5600X 6-Core 3.7GHz',
    stock: 5,
    disponibleAPedido: false,
    precioBase: 899.00
  },
  {
    categoria: 'placa_madre',
    nombre: 'ASUS TUF Gaming B550M-PLUS WiFi',
    stock: 3,
    disponibleAPedido: false,
    precioBase: 549.00
  },
  {
    categoria: 'ram',
    nombre: 'Corsair Vengeance RGB 16GB (2x8GB) DDR4 3200MHz',
    stock: 0,
    disponibleAPedido: true,
    tiempoEntregaDias: 7,
    precioBase: 299.00
  },
  {
    categoria: 'almacenamiento',
    nombre: 'Kingston NV2 500GB NVMe PCIe 4.0',
    stock: 10,
    disponibleAPedido: false,
    precioBase: 189.00
  },
  {
    categoria: 'gpu',
    nombre: 'NVIDIA GeForce RTX 3060 12GB GDDR6',
    stock: 2,
    disponibleAPedido: false,
    precioBase: 1899.00
  },
  {
    categoria: 'fuente',
    nombre: 'Cooler Master MWE 650W 80+ Bronze',
    stock: 8,
    disponibleAPedido: false,
    precioBase: 279.00
  },
  {
    categoria: 'case',
    nombre: 'NZXT H510 Flow ATX Mid Tower',
    stock: 4,
    disponibleAPedido: false,
    precioBase: 399.00
  }
];

async function generarPDFsDemo() {
  console.log('🔧 Generando PDFs de demostración...\n');

  try {
    // Datos de cotización
    const datosCotizacion = {
      codigoTicket: 'NSG-2024-0001',
      codigoUnico: '550e8400-e29b-41d4-a716-446655440000',
      fechaEmision: new Date(),
      fechaValidez: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 días
      componentes: componentesEjemplo,
      precioTotal: 4513.00
    };

    // Generar PDF de Cotización
    console.log('📄 Generando PDF de Cotización (con precios)...');
    const pdfCotizacion = await servicioPDF.generarPDFCotizacion(datosCotizacion);
    
    const rutaCotizacion = path.join(__dirname, '../../assets/cotizacion-ejemplo.pdf');
    fs.writeFileSync(rutaCotizacion, pdfCotizacion);
    console.log(`✅ PDF de Cotización guardado: ${rutaCotizacion}`);
    console.log(`   Tamaño: ${(pdfCotizacion.length / 1024).toFixed(2)} KB\n`);

    // Generar PDF de Listado Técnico
    console.log('📋 Generando PDF de Listado Técnico (sin precios)...');
    const pdfListado = await servicioPDF.generarPDFListado(
      datosCotizacion.codigoTicket,
      componentesEjemplo
    );
    
    const rutaListado = path.join(__dirname, '../../assets/listado-tecnico-ejemplo.pdf');
    fs.writeFileSync(rutaListado, pdfListado);
    console.log(`✅ PDF de Listado guardado: ${rutaListado}`);
    console.log(`   Tamaño: ${(pdfListado.length / 1024).toFixed(2)} KB\n`);

    // Resumen
    console.log('📊 Resumen de generación:');
    console.log(`   - Código Ticket: ${datosCotizacion.codigoTicket}`);
    console.log(`   - Componentes: ${componentesEjemplo.length}`);
    console.log(`   - Precio Total: S/ ${datosCotizacion.precioTotal.toFixed(2)}`);
    console.log(`   - Componentes a pedido: ${componentesEjemplo.filter(c => c.disponibleAPedido).length}`);
    console.log('\n✨ PDFs generados exitosamente!');

  } catch (error) {
    console.error('❌ Error al generar PDFs:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generarPDFsDemo();
}

module.exports = { generarPDFsDemo };
