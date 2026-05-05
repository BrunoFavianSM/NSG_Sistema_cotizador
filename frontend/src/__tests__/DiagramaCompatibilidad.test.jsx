/**
 * Tests para DiagramaCompatibilidad
 *
 * Cubre: renderizado de nodos, colores de líneas según compatibilidad,
 * atributos ARIA.
 *
 * Valida Requisitos: 7.4, 7.5, 7.7
 */

import { render, screen } from '@testing-library/react';
import DiagramaCompatibilidad from '../componentes/cotizador/DiagramaCompatibilidad';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const procesador = { id: 1, nombre: 'Intel Core i9-13900K', socket: 'LGA1700' };
const placaMadre = { id: 2, nombre: 'ASUS ROG Z790', socket: 'LGA1700' };
const ram = [{ id: 3, nombre: 'Corsair 32GB DDR5' }];
const gpu = { id: 4, nombre: 'RTX 4090' };
const fuente = { id: 5, nombre: 'Corsair RM1000x' };

const configCompleta = { procesador, placa_madre: placaMadre, ram, gpu, fuente };
const configParcial = { procesador, placa_madre: null, ram: [], gpu: null, fuente: null };
const configVacia = { procesador: null, placa_madre: null, ram: [], gpu: null, fuente: null };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DiagramaCompatibilidad', () => {
  // ── Req. 7.2 — Visibilidad con al menos un componente ───────────────────

  it('no renderiza nada cuando no hay componentes seleccionados (Req. 7.2)', () => {
    const { container } = render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configVacia}
        incompatibilidades={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('no renderiza nada cuando configuracionSeleccionada es null', () => {
    const { container } = render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={null}
        incompatibilidades={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza el diagrama cuando hay al menos un componente seleccionado (Req. 7.2)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configParcial}
        incompatibilidades={[]}
      />
    );
    expect(screen.getByRole('region', { name: /diagrama de compatibilidad/i })).toBeInTheDocument();
  });

  it('renderiza el diagrama con configuración completa', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    expect(screen.getByRole('region', { name: /diagrama de compatibilidad/i })).toBeInTheDocument();
  });

  // ── Req. 7.7 — Atributos ARIA ────────────────────────────────────────────

  it('el SVG tiene role="img" (Req. 7.7)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('el SVG tiene aria-label descriptivo con los componentes seleccionados (Req. 7.7)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    const svg = screen.getByRole('img');
    const label = svg.getAttribute('aria-label');
    expect(label).toMatch(/CPU/i);
    expect(label).toMatch(/Motherboard/i);
  });

  it('el aria-label menciona "compatibles" cuando no hay incompatibilidades (Req. 7.7)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toMatch(/compatibles/i);
  });

  it('el aria-label menciona las incompatibilidades cuando existen (Req. 7.7)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={['Socket incompatible: CPU requiere AM5']}
      />
    );
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toMatch(/incompatibilidades detectadas/i);
  });

  // ── Req. 7.5 — Indicador de estado compatible ────────────────────────────

  it('muestra badge "Compatible" en el encabezado cuando no hay incompatibilidades (Req. 7.5)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    // El badge del encabezado tiene clase de color verde
    const badges = screen.getAllByText('Compatible');
    // Al menos uno debe ser el badge del encabezado (con clase de color verde)
    const badgeEncabezado = badges.find(
      (el) => el.closest('span') && el.closest('span').classList.contains('rounded-full')
    );
    expect(badgeEncabezado).toBeTruthy();
  });

  // ── Req. 7.4 — Indicador de estado incompatible ──────────────────────────

  it('muestra badge "Incompatible" en el encabezado cuando hay incompatibilidades (Req. 7.4)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={['Socket incompatible']}
      />
    );
    // El badge del encabezado tiene clase de color rojo
    const badges = screen.getAllByText('Incompatible');
    const badgeEncabezado = badges.find(
      (el) => el.closest('span') && el.closest('span').classList.contains('rounded-full')
    );
    expect(badgeEncabezado).toBeTruthy();
  });

  it('no muestra badge "Compatible" en el encabezado cuando hay incompatibilidades', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={['Socket incompatible']}
      />
    );
    // El badge del encabezado debe ser "Incompatible", no "Compatible"
    const badgesCompatible = screen.queryAllByText('Compatible');
    // Solo debe aparecer en la leyenda (sin clase rounded-full), no en el encabezado
    const badgeEncabezado = badgesCompatible.find(
      (el) => el.closest('span') && el.closest('span').classList.contains('rounded-full')
    );
    expect(badgeEncabezado).toBeFalsy();
  });

  // ── Leyenda ──────────────────────────────────────────────────────────────

  it('muestra la leyenda con los tres estados de línea', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    // La leyenda siempre muestra los 3 estados
    expect(screen.getAllByText('Compatible').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Incompatible').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sin seleccionar')).toBeInTheDocument();
  });

  // ── Encabezado ───────────────────────────────────────────────────────────

  it('muestra el encabezado "Compatibilidad visual"', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    expect(screen.getByText(/compatibilidad visual/i)).toBeInTheDocument();
  });

  // ── Colores de líneas (verificados via atributos SVG) ────────────────────

  it('las líneas entre componentes compatibles tienen stroke verde (#34C759) (Req. 7.5)', () => {
    const { container } = render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    // Buscar el SVG principal (el que tiene role="img" y viewBox)
    const svgPrincipal = container.querySelector('svg[role="img"]');
    const lineas = svgPrincipal.querySelectorAll('line');
    const lineasVerdes = Array.from(lineas).filter(
      (l) => l.getAttribute('stroke') === '#34C759'
    );
    // Con configuración completa y sin incompatibilidades, debe haber líneas verdes
    expect(lineasVerdes.length).toBeGreaterThan(0);
  });

  it('las líneas con incompatibilidad de socket tienen stroke rojo (#FF453A) (Req. 7.4)', () => {
    const { container } = render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={['socket incompatible']}
      />
    );
    // Buscar el SVG principal
    const svgPrincipal = container.querySelector('svg[role="img"]');
    const lineas = svgPrincipal.querySelectorAll('line');
    const lineasRojas = Array.from(lineas).filter(
      (l) => l.getAttribute('stroke') === '#FF453A'
    );
    expect(lineasRojas.length).toBeGreaterThan(0);
  });

  // ── Responsividad ────────────────────────────────────────────────────────

  it('el SVG principal tiene clase w-full para ser responsivo (Req. 7.9)', () => {
    const { container } = render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    // Buscar el SVG principal (el que tiene role="img")
    const svgPrincipal = container.querySelector('svg[role="img"]');
    expect(svgPrincipal).toHaveClass('w-full');
  });

  it('el SVG tiene viewBox definido para escalar correctamente', () => {
    const { container } = render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    const svgPrincipal = container.querySelector('svg[role="img"]');
    expect(svgPrincipal).toHaveAttribute('viewBox');
  });
});
