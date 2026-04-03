/**
 * Tests simples para SelectorComponente
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SelectorComponente from './SelectorComponente';

describe('SelectorComponente - Tests Básicos', () => {
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
    }
  ];

  test('renderiza el componente correctamente', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
      />
    );

    expect(screen.getByText('Procesador')).toBeInTheDocument();
  });

  test('muestra solo productos disponibles', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
      />
    );

    // Debe mostrar productos con stock o a pedido
    expect(screen.getByText('Intel Core i5-13400')).toBeInTheDocument();
    expect(screen.getByText('AMD Ryzen 5 5600X')).toBeInTheDocument();

    // NO debe mostrar producto sin stock y no disponible a pedido
    expect(screen.queryByText('Intel Core i9-13900K')).not.toBeInTheDocument();
  });

  test('muestra indicadores de disponibilidad', () => {
    const onSeleccionar = jest.fn();

    render(
      <SelectorComponente
        categoria="procesador"
        productos={productosBase}
        seleccionActual={null}
        onSeleccionar={onSeleccionar}
      />
    );

    expect(screen.getByText(/En Stock \(5\)/)).toBeInTheDocument();
    expect(screen.getByText(/A Pedido \(7d\)/)).toBeInTheDocument();
  });
});
