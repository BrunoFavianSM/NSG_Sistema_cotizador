import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexto/AppContext';
import { AccessibilityProvider } from './componentes/accesibilidad/AccessibilityProvider';
import AppShell from './componentes/layout/AppShell';
import LoadingSpinner from './componentes/feedback/LoadingSpinner';
import { ToastProvider } from './componentes/feedback/ToastProvider';
import Login from './paginas/Login';
import Cotizador from './paginas/Cotizador';
import ValidadorCotizaciones from './paginas/ValidadorCotizaciones';
import HistorialCliente from './paginas/HistorialCliente';
import AdminProductos from './paginas/AdminProductos';
import AdminConfiguracion from './paginas/AdminConfiguracion';
import ImportarCSV from './paginas/ImportarCSV';
import { THEME_STORAGE_KEY, applyThemeClass } from './theme';

function RutaProtegida({ children }) {
  const { autenticado, cargandoAuth } = useAppContext();

  if (cargandoAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-hig1">
        <LoadingSpinner label="Verificando autenticación..." />
      </div>
    );
  }

  return autenticado ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/cotizador" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cotizador" element={<Cotizador />} />
          <Route path="/historial" element={<RutaProtegida><HistorialCliente /></RutaProtegida>} />
          <Route path="/validar" element={<RutaProtegida><ValidadorCotizaciones /></RutaProtegida>} />
          <Route path="/admin" element={<Navigate to="/admin/productos" replace />} />
          <Route path="/admin/productos" element={<RutaProtegida><AdminProductos /></RutaProtegida>} />
          <Route path="/admin/configuracion" element={<RutaProtegida><AdminConfiguracion /></RutaProtegida>} />
          <Route path="/admin/importar-csv" element={<RutaProtegida><ImportarCSV /></RutaProtegida>} />
          <Route path="*" element={<Navigate to="/cotizador" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
    applyThemeClass(savedTheme);

    if (savedTheme !== 'system' || typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemThemeChange = () => applyThemeClass('system');

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', onSystemThemeChange);
    }

    mediaQuery.addListener(onSystemThemeChange);
    return () => mediaQuery.removeListener(onSystemThemeChange);
  }, []);

  return (
    <AppProvider>
      <AccessibilityProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AccessibilityProvider>
    </AppProvider>
  );
}
