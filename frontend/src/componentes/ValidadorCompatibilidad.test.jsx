/**
 * Tests para ValidadorCompatibilidad
 * 
 * Valida que el componente muestre correctamente:
 * - Errores de incompatibilidad
 * - Advertencias
 * - Mensajes de éxito
 * - Animaciones y estilos
 */

import { describe, test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ValidadorCompatibilidad from './ValidadorCompatibilidad';

describe('ValidadorCompatibilidad', () => {
  test('no renderiza nada si no hay resultado de validación', () => {
    const { container } = render(<ValidadorCompatibilidad resultadoValidacion={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('no renderiza nada si mostrar es false', () => {
    const resultado = {
      compatible: false,
      errores: ['Error de prueba'],
      advertencias: []
    };
    const { container } = render(
      <ValidadorCompatibilidad resultadoValidacion={resultado} mostrar={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('no renderiza nada si no hay errores ni advertencias', () => {
    const resultado = {
      compatible: true,
      errores: [],
      advertencias: []
    };
    const { container } = render(<ValidadorCompatibilidad resultadoValidacion={resultado} />);
    expect(container.firstChild).toBeNull();
  });

  test('muestra errores de incompatibilidad correctamente', () => {
    const resultado = {
      compatible: false,
      errores: [
        '❌ Socket incompatible: AM5 vs LGA1700',
        '❌ Fuente insuficiente: requiere 500W, tiene 400W'
      ],
      advertencias: []
    };

    render(<ValidadorCompatibilidad resultadoValidacion={resultado} />);

    // Verificar título de errores
    expect(screen.getByText('Incompatibilidades Detectadas')).toBeInTheDocument();

    // Verificar que se muestran los errores
    expect(screen.getByText(/Socket incompatible: AM5 vs LGA1700/)).toBeInTheDocument();
    expect(screen.getByText(/Fuente insuficiente: requiere 500W, tiene 400W/)).toBeInTheDocument();

    // Verificar mensaje de ayuda
    expect(screen.getByText(/ajusta tu selección para resolver estas incompatibilidades/)).toBeInTheDocument();
  });

  test('muestra advertencias correctamente', () => {
    const resultado = {
      compatible: true,
      errores: [],
      advertencias: [
        '⚠️ Margen ajustado: recomendado 600W',
        '⚠️ Componentes a pedido: 7 días de entrega'
      ]
    };

    render(<ValidadorCompatibilidad resultadoValidacion={resultado} />);

    // Verificar título de advertencias
    expect(screen.getByText('Advertencias')).toBeInTheDocument();

    // Verificar que se muestran las advertencias
    expect(screen.getByText(/Margen ajustado: recomendado 600W/)).toBeInTheDocument();
    expect(screen.getByText(/Componentes a pedido: 7 días de entrega/)).toBeInTheDocument();

    // Verificar mensaje de ayuda
    expect(screen.getByText(/Tu configuración es compatible, pero considera estas recomendaciones/)).toBeInTheDocument();
  });

  test('muestra errores y advertencias simultáneamente', () => {
    const resultado = {
      compatible: false,
      errores: ['❌ Socket incompatible: AM5 vs LGA1700'],
      advertencias: ['⚠️ Margen ajustado: recomendado 600W']
    };

    render(<ValidadorCompatibilidad resultadoValidacion={resultado} />);

    // Verificar que ambos se muestran
    expect(screen.getByText('Incompatibilidades Detectadas')).toBeInTheDocument();
    expect(screen.getByText('Advertencias')).toBeInTheDocument();
    expect(screen.getByText(/Socket incompatible/)).toBeInTheDocument();
    expect(screen.getByText(/Margen ajustado/)).toBeInTheDocument();
  });

  test('aplica className personalizado', () => {
    const resultado = {
      compatible: false,
      errores: ['Error de prueba'],
      advertencias: []
    };

    const { container } = render(
      <ValidadorCompatibilidad
        resultadoValidacion={resultado}
        className="mi-clase-personalizada"
      />
    );

    expect(container.firstChild).toHaveClass('mi-clase-personalizada');
  });

  test('muestra múltiples errores en lista', () => {
    const resultado = {
      compatible: false,
      errores: [
        'Error 1',
        'Error 2',
        'Error 3'
      ],
      advertencias: []
    };

    render(<ValidadorCompatibilidad resultadoValidacion={resultado} />);

    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
    expect(screen.getByText('Error 3')).toBeInTheDocument();
  });

  test('muestra múltiples advertencias en lista', () => {
    const resultado = {
      compatible: true,
      errores: [],
      advertencias: [
        'Advertencia 1',
        'Advertencia 2',
        'Advertencia 3'
      ]
    };

    render(<ValidadorCompatibilidad resultadoValidacion={resultado} />);

    expect(screen.getByText('Advertencia 1')).toBeInTheDocument();
    expect(screen.getByText('Advertencia 2')).toBeInTheDocument();
    expect(screen.getByText('Advertencia 3')).toBeInTheDocument();
  });

  test('maneja resultado con arrays vacíos', () => {
    const resultado = {
      compatible: true,
      errores: [],
      advertencias: []
    };

    const { container } = render(<ValidadorCompatibilidad resultadoValidacion={resultado} />);
    expect(container.firstChild).toBeNull();
  });

  test('maneja resultado sin propiedades errores/advertencias', () => {
    const resultado = {
      compatible: true
    };

    const { container } = render(<ValidadorCompatibilidad resultadoValidacion={resultado} />);
    expect(container.firstChild).toBeNull();
  });

  test('usa estilos de Tailwind CSS correctos para errores', () => {
    const resultado = {
      compatible: false,
      errores: ['Error de prueba'],
      advertencias: []
    };

    const { container } = render(<ValidadorCompatibilidad resultadoValidacion={resultado} />);
    const errorDiv = container.querySelector('.bg-red-50');
    
    expect(errorDiv).toBeInTheDocument();
    expect(errorDiv).toHaveClass('border-l-4', 'border-red-500');
  });

  test('usa estilos de Tailwind CSS correctos para advertencias', () => {
    const resultado = {
      compatible: true,
      errores: [],
      advertencias: ['Advertencia de prueba']
    };

    const { container } = render(<ValidadorCompatibilidad resultadoValidacion={resultado} />);
    const warningDiv = container.querySelector('.bg-yellow-50');
    
    expect(warningDiv).toBeInTheDocument();
    expect(warningDiv).toHaveClass('border-l-4', 'border-yellow-500');
  });
});
