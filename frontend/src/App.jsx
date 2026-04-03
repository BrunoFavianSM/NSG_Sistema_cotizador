import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexto/AppContext'
import { useAppContext } from './contexto/AppContext'
import Login from './paginas/Login'
import Cotizador from './paginas/Cotizador'
import ValidadorCotizaciones from './paginas/ValidadorCotizaciones'
import HistorialCliente from './paginas/HistorialCliente'
import AdminProductos from './paginas/AdminProductos'
import AdminConfiguracion from './paginas/AdminConfiguracion'

function RutaProtegida({ children }) {
  const { autenticado, cargandoAuth } = useAppContext()
  if (cargandoAuth) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  return autenticado ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/cotizador" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cotizador" element={<Cotizador />} />
        <Route path="/validar" element={<ValidadorCotizaciones />} />
        <Route path="/historial" element={<HistorialCliente />} />
        <Route path="/admin/productos" element={<RutaProtegida><AdminProductos /></RutaProtegida>} />
        <Route path="/admin" element={<Navigate to="/admin/productos" replace />} />
        <Route path="/admin/configuracion" element={<RutaProtegida><AdminConfiguracion /></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
