/**
 * Tests para Componente RutaProtegida
 * 
 * Valida:
 * - Redirección a login cuando no está autenticado
 * - Renderizado de children cuando está autenticado
 * - Mostrar loading mientras verifica autenticación
 * - Verificación de token JWT
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RutaProtegida from './RutaProtegida';
import { AppProvider } from '../contexto/AppContext';

// Mock del contexto
const mockContextValue = {
  autenticado: false,
  cargandoAuth: false,
  usuario: null,
  login: jest.fn(),
  logout: jest.fn()
};

jest.mock('../contexto/AppContext', () => ({
  ...jest.requireActual('../contexto/AppContext'),
  useAppContext: () => mockContextValue
}));

// Mock de api
jest.mock('../servicios/api', () => ({
  obtenerUsuarioActual: jest.fn(),
  verificarToken: jest.fn(),
  logout: jest.fn(),
  login: jest.fn()
}));

// Componente de prueba protegido
const ComponenteProtegido = () => (
  <div>
    <h1>Panel Administrativo</h1>
    <p>Contenido protegido</p>
  </div>
);

// Componente de login simulado
const PaginaLogin = () => (
  <div>
    <h1>Login</h1>
    <p>Por favor inicia sesión</p>
  </div>
);

// Helper para renderizar con router
const renderConRouter = (ui) => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PaginaLogin />} />
        <Route path="/admin" element={ui} />
      </Routes>
    </BrowserRouter>
  );
};

describe('RutaProtegida', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock context
    mockContextValue.autenticado = false;
    mockContextValue.cargandoAuth = false;
    mockContextValue.usuario = null;
  });

  describe('Requisito 10.1: Requerir autenticación', () => {
    test('debe redirigir a /login cuando no está autenticado', () => {
      mockContextValue.autenticado = false;
      mockContextValue.cargandoAuth = false;

      // Renderizar en ruta /admin
      window.history.pushState({}, 'Admin', '/admin');
      
      renderConRouter(
        <RutaProtegida>
          <ComponenteProtegido />
        </RutaProtegida>
      );

      // Debe mostrar la página de login
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Por favor inicia sesión')).toBeInTheDocument();
      
      // No debe mostrar el contenido protegido
      expect(screen.queryByText('Panel Administrativo')).not.toBeInTheDocument();
      expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
    });

    test('debe renderizar children cuando está autenticado', () => {
      mockContextValue.autenticado = true;
      mockContextValue.cargandoAuth = false;
      mockContextValue.usuario = { username: 'admin', nombre_completo: 'Administrador' };

      window.history.pushState({}, 'Admin', '/admin');

      renderConRouter(
        <RutaProtegida>
          <ComponenteProtegido />
        </RutaProtegida>
      );

      // Debe mostrar el contenido protegido
      expect(screen.getByText('Panel Administrativo')).toBeInTheDocument();
      expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
      
      // No debe mostrar la página de login
      expect(screen.queryByText('Por favor inicia sesión')).not.toBeInTheDocument();
    });
  });

  describe('Requisito 10.2: Validar JWT', () => {
    test('debe mostrar loading mientras verifica autenticación', () => {
      mockContextValue.autenticado = false;
      mockContextValue.cargandoAuth = true;

      window.history.pushState({}, 'Admin', '/admin');

      renderConRouter(
        <RutaProtegida>
          <ComponenteProtegido />
        </RutaProtegida>
      );

      // Debe mostrar el mensaje de loading
      expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument();
      
      // No debe mostrar ni login ni contenido protegido
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Panel Administrativo')).not.toBeInTheDocument();
    });

    test('debe verificar token antes de permitir acceso', () => {
      // Simular que hay token pero no está autenticado aún
      mockContextValue.autenticado = false;
      mockContextValue.cargandoAuth = true;

      window.history.pushState({}, 'Admin', '/admin');

      const { rerender } = renderConRouter(
        <RutaProtegida>
          <ComponenteProtegido />
        </RutaProtegida>
      );

      // Inicialmente debe mostrar loading
      expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument();

      // Simular que la verificación completó exitosamente
      mockContextValue.autenticado = true;
      mockContextValue.cargandoAuth = false;
      mockContextValue.usuario = { username: 'admin' };

      rerender(
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PaginaLogin />} />
            <Route 
              path="/admin" 
              element={
                <RutaProtegida>
                  <ComponenteProtegido />
                </RutaProtegida>
              } 
            />
          </Routes>
        </BrowserRouter>
      );

      // Ahora debe mostrar el contenido protegido
      expect(screen.getByText('Panel Administrativo')).toBeInTheDocument();
    });

    test('debe redirigir a login si token es inválido', () => {
      // Simular verificación fallida
      mockContextValue.autenticado = false;
      mockContextValue.cargandoAuth = false;
      mockContextValue.usuario = null;

      window.history.pushState({}, 'Admin', '/admin');

      renderConRouter(
        <RutaProtegida>
          <ComponenteProtegido />
        </RutaProtegida>
      );

      // Debe redirigir a login
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.queryByText('Panel Administrativo')).not.toBeInTheDocument();
    });
  });

  describe('Casos edge', () => {
    test('debe manejar múltiples children', () => {
      mockContextValue.autenticado = true;
      mockContextValue.cargandoAuth = false;

      window.history.pushState({}, 'Admin', '/admin');

      renderConRouter(
        <RutaProtegida>
          <div>
            <h1>Título 1</h1>
            <h2>Título 2</h2>
            <p>Párrafo</p>
          </div>
        </RutaProtegida>
      );

      expect(screen.getByText('Título 1')).toBeInTheDocument();
      expect(screen.getByText('Título 2')).toBeInTheDocument();
      expect(screen.getByText('Párrafo')).toBeInTheDocument();
    });

    test('debe funcionar con componentes complejos', () => {
      mockContextValue.autenticado = true;
      mockContextValue.cargandoAuth = false;

      const ComponenteComplejo = () => (
        <div>
          <header>Header</header>
          <main>
            <section>Sección 1</section>
            <section>Sección 2</section>
          </main>
          <footer>Footer</footer>
        </div>
      );

      window.history.pushState({}, 'Admin', '/admin');

      renderConRouter(
        <RutaProtegida>
          <ComponenteComplejo />
        </RutaProtegida>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Sección 1')).toBeInTheDocument();
      expect(screen.getByText('Sección 2')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    test('debe preservar props de children', () => {
      mockContextValue.autenticado = true;
      mockContextValue.cargandoAuth = false;

      const ComponenteConProps = ({ titulo, descripcion }) => (
        <div>
          <h1>{titulo}</h1>
          <p>{descripcion}</p>
        </div>
      );

      window.history.pushState({}, 'Admin', '/admin');

      renderConRouter(
        <RutaProtegida>
          <ComponenteConProps 
            titulo="Mi Título" 
            descripcion="Mi Descripción" 
          />
        </RutaProtegida>
      );

      expect(screen.getByText('Mi Título')).toBeInTheDocument();
      expect(screen.getByText('Mi Descripción')).toBeInTheDocument();
    });
  });

  describe('Integración con AppContext', () => {
    test('debe reaccionar a cambios en autenticación', () => {
      mockContextValue.autenticado = true;
      mockContextValue.cargandoAuth = false;

      window.history.pushState({}, 'Admin', '/admin');

      const { rerender } = renderConRouter(
        <RutaProtegida>
          <ComponenteProtegido />
        </RutaProtegida>
      );

      // Inicialmente autenticado
      expect(screen.getByText('Panel Administrativo')).toBeInTheDocument();

      // Simular logout
      mockContextValue.autenticado = false;
      mockContextValue.usuario = null;

      rerender(
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PaginaLogin />} />
            <Route 
              path="/admin" 
              element={
                <RutaProtegida>
                  <ComponenteProtegido />
                </RutaProtegida>
              } 
            />
          </Routes>
        </BrowserRouter>
      );

      // Debe redirigir a login
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.queryByText('Panel Administrativo')).not.toBeInTheDocument();
    });
  });
});

