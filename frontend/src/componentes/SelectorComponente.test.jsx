/**
 * Tests para SelectorComponente
 * 
 * Valida:
 * - Filtrado por disponibilidad (stock > 0 O disponible_a_pedido)
 * - Indicadores de disponibilidad correctos
 * - Filtrado por compatibilidad (socket, RAM type)
 * - Selección única y múltiple
 * - Búsqueda de productos
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SelectorComponente from './SelectorComponente';

describe('SelectorComponente', () => {
  // Productos de prueba
  const productosBase = [
    {
      id: 1,
      nombre: 'Intel Core i5-13400',
      categoria: 'procesador',
      socket: 'LGA1700',
      precio_base: 850,
      stock: 5,
      disponible_a_pedido: false,
      descripcion_tecnica: '10 núcleos, 16 hilos'
    },
    {
      id: 2,
      nombre: 'AMD Ryzen 5 5600X',
      categoria: 'procesador',
      socket: 'AM4',
      precio_base: 750,
      stock: 0,
      disponible_a_pedido: true,
      tiempo_entrega_dias: 7,
      descripcion_tecnica: '6 núcleos, 12 hilos'
    },
    {
      id: 3,
      nombre: 'Intel Core i9-13900K',
      categoria: 'procesador',
      socket: 'LGA1700',
      precio_base: 2500,
      stock: 0,
      disponible_a_pedido: false,
      descripcion_tecnica: '24 núcleos, 32 hilos'
    },
    {
      id: 4,
      nombre: 'ASUS ROG Strix B760',
      categoria: 'placa_madre',
      socket: 'LGA1700',
      ram_type: 'DDR5',
      precio_base: 650,
      stock: 3,
      disponible_a_pedido: false
    },
    {
      id: 5,
      nombre: 'Corsair Vengeance DDR5',
      categoria: 'ram',
      ram_type: 'DDR5',
      precio_base: 180,
      stock: 10,
      disponible_a_pedido: false
    }
  ];

  test('muestra solo productos con stock > 0 O disponible_a_pedido', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
      />
    );

    // Debe mostrar Intel i5 (stock: 5) y AMD Ryzen (a pedido)
    expect(screen.getByText('Intel Core i5-13400')).toBeInTheDocument();
    expect(screen.getByText('AMD Ryzen 5 5600X')).toBeInTheDocument();

    // NO debe mostrar Intel i9 (sin stock y no disponible a pedido)
    expect(screen.queryByText('Intel Core i9-13900K')).not.toBeInTheDocument();
  });

  test('muestra indicador "En Stock" para productos con stock', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
      />
    );

    // Verificar indicador de stock
    expect(screen.getByText(/En Stock \(5\)/)).toBeInTheDocument();
  });

  test('muestra indicador "A Pedido" con días de entrega', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
      />
    );

    // Verificar indicador de pedido
    expect(screen.getByText(/A Pedido \(7d\)/)).toBeInTheDocument();
  });

  test('filtra productos por socket compatible', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
        filtrosCompatibilidad={{ socket: 'LGA1700' }}
      />
    );

    // Solo debe mostrar Intel i5 (LGA1700)
    expect(screen.getByText('Intel Core i5-13400')).toBeInTheDocument();

    // NO debe mostrar AMD Ryzen (AM4)
    expect(screen.queryByText('AMD Ryzen 5 5600X')).not.toBeInTheDocument();

    // Verificar que se muestra el filtro activo
    expect(screen.getByText('Socket: LGA1700')).toBeInTheDocument();
  });

  test('filtra productos por tipo de RAM', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="ram"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
        filtrosCompatibilidad={{ ramType: 'DDR5' }}
      />
    );

    // Debe mostrar RAM DDR5
    expect(screen.getByText('Corsair Vengeance DDR5')).toBeInTheDocument();

    // Verificar filtro activo
    expect(screen.getByText('RAM: DDR5')).toBeInTheDocument();
  });

  test('permite selección única de producto', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
        permitirMultiple={false}
      />
    );

    // Hacer clic en un producto
    const producto = screen.getByText('Intel Core i5-13400');
    fireEvent.click(producto.closest('.selector-componente > div > div'));

    // Verificar que se llamó onSeleccionar con el producto
    expect(onSeleccionar).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        nombre: 'Intel Core i5-13400'
      })
    );
  });

  test('permite selección múltiple de productos (RAM)', () => {
    const onSeleccionar = jest.fn();
    const ramProductos = [
      {
        id: 5,
        nombre: 'Corsair Vengeance DDR5 16GB',
        categoria: 'ram',
        ram_type: 'DDR5',
        precio_base: 180,
        stock: 10,
        disponible_a_pedido: false
      },
      {
        id: 6,
        nombre: 'Kingston Fury DDR5 16GB',
        categoria: 'ram',
        ram_type: 'DDR5',
        precio_base: 170,
        stock: 8,
        disponible_a_pedido: false
      }
    ];

    const { rerender } = render(
      <SelectorComponente
        categoria="ram"
        productos={ramProductos}
        seleccionActual={[]}
        onSeleccionar={onSeleccionar}
        permitirMultiple={true}
      />
    );

    // Seleccionar primer módulo
    const producto1 = screen.getByText('Corsair Vengeance DDR5 16GB');
    fireEvent.click(producto1.closest('.selector-componente > div > div'));

    expect(onSeleccionar).toHaveBeenCalledWith([
      expect.objectContaining({ id: 5 })
    ]);

    // Simular que ahora hay un módulo seleccionado
    rerender(
      <SelectorComponente
        categoria="ram"
        productos={ramProductos}
        seleccionActual={[ramProductos[0]]}
        onSeleccionar={onSeleccionar}
        permitirMultiple={true}
      />
    );

    // Seleccionar segundo módulo
    const producto2 = screen.getByText('Kingston Fury DDR5 16GB');
    fireEvent.click(producto2.closest('.selector-componente > div > div'));

    expect(onSeleccionar).toHaveBeenCalledWith([
      expect.objectContaining({ id: 5 }),
      expect.objectContaining({ id: 6 })
    ]);
  });

  test('muestra mensaje cuando no hay productos disponibles', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={[]}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
      />
    );

    expect(screen.getByText('No hay productos disponibles')).toBeInTheDocument();
  });

  test('filtra productos por búsqueda de texto', async () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
      />
    );

    // Buscar "Intel"
    const inputBusqueda = screen.getByPlaceholderText(/Buscar por nombre/);
    fireEvent.change(inputBusqueda, { target: { value: 'Intel' } });

    await waitFor(() => {
      expect(screen.getByText('Intel Core i5-13400')).toBeInTheDocument();
      expect(screen.queryByText('AMD Ryzen 5 5600X')).not.toBeInTheDocument();
    });
  });

  test('muestra indicador de carga', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={[]}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
        cargando={true}
      />
    );

    expect(screen.getByText('Cargando productos...')).toBeInTheDocument();
  });

  test('muestra contador de productos disponibles', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
      />
    );

    // Debe mostrar 2 disponibles (Intel i5 y AMD Ryzen)
    expect(screen.getByText('2 disponibles')).toBeInTheDocument();
  });

  test('resalta producto seleccionado', () => {
    const onSeleccionar = jest.fn();
    const productoSeleccionado = productosBase[0];

    const { container } = render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={productoSeleccionado}
        onSeleccionar={onSeleccionar}
      />
    );

    // Verificar que el producto seleccionado tiene clases de resaltado
    const tarjetaSeleccionada = container.querySelector('.border-blue-500.bg-blue-50');
    expect(tarjetaSeleccionada).toBeInTheDocument();
    expect(tarjetaSeleccionada).toHaveTextContent('Intel Core i5-13400');
  });

  test('muestra especificaciones técnicas del producto', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
      />
    );

    // Verificar que se muestran las especificaciones
    expect(screen.getByText(/10 núcleos, 16 hilos/)).toBeInTheDocument();
    expect(screen.getByText(/Socket:/)).toBeInTheDocument();
  });

  test('muestra precio formateado correctamente', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
      />
    );

    // Verificar formato de precio
    expect(screen.getByText('S/ 850.00')).toBeInTheDocument();
    expect(screen.getByText('S/ 750.00')).toBeInTheDocument();
  });

  test('muestra información de selección múltiple', () => {
    const onSeleccionar = jest.fn();
    const ramSeleccionada = [productosBase[4]];

    render(
      <SelectorComponente
        categoria="ram"
        productos={productosBase}
        seleccionActual={ramSeleccionada}
        onSeleccionar={onSeleccionar}
        permitirMultiple={true}
      />
    );

    expect(screen.getByText('1 módulo de RAM seleccionado')).toBeInTheDocument();
  });

  test('permite deseleccionar en modo múltiple', () => {
    const onSeleccionar = jest.fn();
    const ramSeleccionada = [productosBase[4]];

    render(
      <SelectorComponente
        categoria="ram"
        productos={productosBase}
        seleccionActual={ramSeleccionada}
        onSeleccionar={onSeleccionar}
        permitirMultiple={true}
      />
    );

    // Hacer clic en el producto ya seleccionado para deseleccionar
    const producto = screen.getByText('Corsair Vengeance DDR5');
    fireEvent.click(producto.closest('.selector-componente > div > div'));

    // Debe llamar con array vacío
    expect(onSeleccionar).toHaveBeenCalledWith([]);
  });
});

