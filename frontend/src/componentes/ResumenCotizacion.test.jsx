/**
 * Tests Unitarios para ResumenCotizacion
 * 
 * Valida:
 * - Renderizado de componentes seleccionados
 * - Cálculo correcto de precio base
 * - Aplicación correcta del margen de ganancia
 * - Detección de componentes a pedido
 * - Cálculo de tiempo de entrega
 * - Indicadores de disponibilidad
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumenCotizacion from './ResumenCotizacion';

describe('ResumenCotizacion', () => {
  // Datos de prueba
  const productoEnStock = {
    id: 1,
    nombre: 'Intel Core i5-13400',
    categoria: 'procesador',
    precio_base: 850.00,
    stock: 5,
    disponible_a_pedido: false,
    descripcion_tecnica: '10 núcleos, 16 hilos'
  };

  const productoAPedido = {
    id: 2,
    nombre: 'NVIDIA RTX 4070',
    categoria: 'gpu',
    precio_base: 2500.00,
    stock: 0,
    disponible_a_pedido: true,
    tiempo_entrega_dias: 10,
    descripcion_tecnica: '12GB GDDR6X'
  };

  const configuracionVacia = {
    procesador: null,
    placa_madre: null,
    ram: [],
    almacenamiento: null,
    gpu: null,
    fuente: null,
    case: null
  };

  test('no renderiza nada si no hay componentes seleccionados', () => {
    const { container } = render(
      <ResumenCotizacion configuracion={configuracionVacia} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renderiza componente seleccionado con nombre y precio', () => {
    const configuracion = {
      ...configuracionVacia,
      procesador: productoEnStock
    };

    render(<ResumenCotizacion configuracion={configuracion} />);

    expect(screen.getByText('Intel Core i5-13400')).toBeInTheDocument();
    // Verificar que el precio aparece (puede estar duplicado en subtotal y en el componente)
    const preciosElements = screen.getAllByText(/S\/ 850\.00/);
    expect(preciosElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Procesador')).toBeInTheDocument();
  });

  test('calcula precio base correctamente sumando todos los componentes', () => {
    const configuracion = {
      procesador: { ...productoEnStock, precio_base: 850 },
      placa_madre: { id: 2, nombre: 'Placa', precio_base: 500, stock: 1 },
      ram: [
        { id: 3, nombre: 'RAM 1', precio_base: 200, stock: 1 },
        { id: 4, nombre: 'RAM 2', precio_base: 200, stock: 1 }
      ],
      almacenamiento: { id: 5, nombre: 'SSD', precio_base: 300, stock: 1 },
      gpu: { id: 6, nombre: 'GPU', precio_base: 1500, stock: 1 },
      fuente: { id: 7, nombre: 'Fuente', precio_base: 250, stock: 1 },
      case: { id: 8, nombre: 'Case', precio_base: 200, stock: 1 }
    };

    render(<ResumenCotizacion configuracion={configuracion} margenGanancia={0} />);

    // Precio base: 850 + 500 + 200 + 200 + 300 + 1500 + 250 + 200 = 4000
    // Buscar el total (que es único y está en texto más grande)
    expect(screen.getByText('Total:')).toBeInTheDocument();
    const totalElements = screen.getAllByText('S/ 4000.00');
    expect(totalElements.length).toBeGreaterThan(0);
  });

  test('aplica margen de ganancia correctamente', () => {
    const configuracion = {
      ...configuracionVacia,
      procesador: { ...productoEnStock, precio_base: 1000 }
    };

    render(<ResumenCotizacion configuracion={configuracion} margenGanancia={20} />);

    // Precio base: 1000
    // Con margen 20%: 1000 * 1.20 = 1200
    expect(screen.getByText('S/ 1200.00')).toBeInTheDocument();
  });

  test('muestra desglose de margen cuando mostrarMargen es true', () => {
    const configuracion = {
      ...configuracionVacia,
      procesador: { ...productoEnStock, precio_base: 1000 }
    };

    render(
      <ResumenCotizacion 
        configuracion={configuracion} 
        margenGanancia={25} 
        mostrarMargen={true}
      />
    );

    // Subtotal
    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
    
    // Margen
    expect(screen.getByText(/Margen \(25%\):/)).toBeInTheDocument();
    expect(screen.getByText('S/ 250.00')).toBeInTheDocument();

    // Total
    expect(screen.getByText('S/ 1250.00')).toBeInTheDocument();
  });

  test('muestra indicador "En Stock" para productos con stock', () => {
    const configuracion = {
      ...configuracionVacia,
      procesador: productoEnStock
    };

    render(<ResumenCotizacion configuracion={configuracion} />);

    expect(screen.getByText('En Stock')).toBeInTheDocument();
  });

  test('muestra indicador "A Pedido" para productos sin stock', () => {
    const configuracion = {
      ...configuracionVacia,
      gpu: productoAPedido
    };

    render(<ResumenCotizacion configuracion={configuracion} />);

    const badges = screen.getAllByText('A Pedido');
    expect(badges.length).toBeGreaterThan(0);
  });

  test('muestra información de tiempo de entrega si hay componentes a pedido', () => {
    const configuracion = {
      ...configuracionVacia,
      gpu: productoAPedido
    };

    render(<ResumenCotizacion configuracion={configuracion} />);

    expect(screen.getByText('Tiempo de Entrega')).toBeInTheDocument();
    expect(screen.getByText(/10 días/)).toBeInTheDocument();
  });

  test('calcula tiempo máximo de entrega correctamente con múltiples componentes a pedido', () => {
    const configuracion = {
      ...configuracionVacia,
      gpu: { ...productoAPedido, tiempo_entrega_dias: 10 },
      almacenamiento: {
        id: 3,
        nombre: 'SSD',
        precio_base: 300,
        stock: 0,
        disponible_a_pedido: true,
        tiempo_entrega_dias: 15
      }
    };

    render(<ResumenCotizacion configuracion={configuracion} />);

    // Debe mostrar el tiempo máximo (15 días)
    expect(screen.getByText(/15 días/)).toBeInTheDocument();
    expect(screen.getByText(/2 componentes a pedido/)).toBeInTheDocument();
  });

  test('no muestra información de entrega si todos los componentes están en stock', () => {
    const configuracion = {
      ...configuracionVacia,
      procesador: productoEnStock,
      placa_madre: { ...productoEnStock, id: 2, nombre: 'Placa' }
    };

    render(<ResumenCotizacion configuracion={configuracion} />);

    expect(screen.queryByText('Tiempo de Entrega')).not.toBeInTheDocument();
  });

  test('renderiza múltiples módulos de RAM correctamente', () => {
    const configuracion = {
      ...configuracionVacia,
      ram: [
        { id: 1, nombre: 'RAM 8GB', precio_base: 200, stock: 1 },
        { id: 2, nombre: 'RAM 8GB', precio_base: 200, stock: 1 }
      ]
    };

    render(<ResumenCotizacion configuracion={configuracion} />);

    expect(screen.getByText('RAM #1')).toBeInTheDocument();
    expect(screen.getByText('RAM #2')).toBeInTheDocument();
  });

  test('muestra cantidad correcta de componentes seleccionados', () => {
    const configuracion = {
      procesador: productoEnStock,
      placa_madre: { ...productoEnStock, id: 2, nombre: 'Placa' },
      ram: [
        { id: 3, nombre: 'RAM 1', precio_base: 200, stock: 1 },
        { id: 4, nombre: 'RAM 2', precio_base: 200, stock: 1 }
      ],
      almacenamiento: null,
      gpu: null,
      fuente: null,
      case: null
    };

    render(<ResumenCotizacion configuracion={configuracion} />);

    // 2 componentes individuales + 2 RAM = 4 componentes
    expect(screen.getByText('4 componentes seleccionados')).toBeInTheDocument();
  });

  test('muestra nota sobre validez de la cotización', () => {
    const configuracion = {
      ...configuracionVacia,
      procesador: productoEnStock
    };

    render(<ResumenCotizacion configuracion={configuracion} />);

    expect(screen.getByText(/válida por 3 días/)).toBeInTheDocument();
  });

  test('muestra descripción técnica si está disponible', () => {
    const configuracion = {
      ...configuracionVacia,
      procesador: productoEnStock
    };

    render(<ResumenCotizacion configuracion={configuracion} />);

    expect(screen.getByText('10 núcleos, 16 hilos')).toBeInTheDocument();
  });

  test('aplica className personalizado', () => {
    const configuracion = {
      ...configuracionVacia,
      procesador: productoEnStock
    };

    const { container } = render(
      <ResumenCotizacion 
        configuracion={configuracion} 
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  test('maneja precios con decimales correctamente', () => {
    const configuracion = {
      ...configuracionVacia,
      procesador: { ...productoEnStock, precio_base: 849.99 }
    };

    render(<ResumenCotizacion configuracion={configuracion} margenGanancia={20} />);

    // Precio base: 849.99
    // Con margen 20%: 849.99 * 1.20 = 1019.988 �?^ 1019.99
    expect(screen.getByText('S/ 1019.99')).toBeInTheDocument();
  });

  test('usa tiempo de entrega por defecto (7 días) si no está especificado', () => {
    const configuracion = {
      ...configuracionVacia,
      gpu: {
        ...productoAPedido,
        tiempo_entrega_dias: null // Sin tiempo especificado
      }
    };

    render(<ResumenCotizacion configuracion={configuracion} />);

    expect(screen.getByText(/7 días/)).toBeInTheDocument();
  });

  test('formatea correctamente los nombres de categorías', () => {
    const configuracion = {
      procesador: { id: 1, nombre: 'CPU', precio_base: 100, stock: 1 },
      placa_madre: { id: 2, nombre: 'Mobo', precio_base: 100, stock: 1 },
      ram: [{ id: 3, nombre: 'RAM Module', precio_base: 100, stock: 1 }],
      almacenamiento: { id: 4, nombre: 'SSD', precio_base: 100, stock: 1 },
      gpu: { id: 5, nombre: 'Graphics Card', precio_base: 100, stock: 1 },
      fuente: { id: 6, nombre: 'PSU', precio_base: 100, stock: 1 },
      case: { id: 7, nombre: 'PC Case', precio_base: 100, stock: 1 }
    };

    render(<ResumenCotizacion configuracion={configuracion} />);

    expect(screen.getByText('Procesador')).toBeInTheDocument();
    expect(screen.getByText('Placa Madre')).toBeInTheDocument();
    expect(screen.getByText('RAM #1')).toBeInTheDocument();
    expect(screen.getByText('Almacenamiento')).toBeInTheDocument();
    expect(screen.getByText('Fuente de Poder')).toBeInTheDocument();
    // Verificar que los nombres de productos están presentes
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('Graphics Card')).toBeInTheDocument();
    expect(screen.getByText('PC Case')).toBeInTheDocument();
  });
});

