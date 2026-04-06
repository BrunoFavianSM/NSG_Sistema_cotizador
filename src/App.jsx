import { useEffect, useState } from 'react'
import './App.css'

const navigationItems = [
  { id: 'resumen', label: 'Resumen', description: 'Vista general de la cotizacion' },
  { id: 'componentes', label: 'Componentes', description: 'Categorias y seleccion' },
  { id: 'cotizaciones', label: 'Cotizaciones', description: 'Seguimiento reciente' },
]

const activityItems = [
  { title: 'CPU Ryzen 7 8700G', detail: 'Compatible con placa AM5 y memoria DDR5', status: 'Listo' },
  { title: 'GPU RTX 4070 Super', detail: 'Stock confirmado para despacho en 24 horas', status: 'Stock' },
  { title: 'Fuente 750W Gold', detail: 'Margen seguro para upgrade futuro', status: 'Recomendado' },
]

function App() {
  const [activeSection, setActiveSection] = useState('resumen')
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'dark'
    }

    const savedTheme = window.localStorage.getItem('cotizador-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem('cotizador-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="sidebar__header">
          <p className="eyebrow">Cotizador</p>
          <h1>Panel comercial</h1>
          <p className="sidebar__summary">
            Navegacion fija para mantener el contexto incluso en pantallas largas.
          </p>
        </div>

        <nav className="sidebar__nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item${activeSection === item.id ? ' nav-item--active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              aria-pressed={activeSection === item.id}
            >
              <span className="nav-item__label">{item.label}</span>
              <span className="nav-item__detail">{item.description}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__profile">
            <div className="avatar" aria-hidden="true">
              NS
            </div>
            <div>
              <p className="profile__name">Equipo de ventas</p>
              <p className="profile__role">Sesion activa</p>
            </div>
          </div>
          <button type="button" className="logout-button">
            Cerrar sesion
          </button>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operacion</p>
            <h2>Configuracion de cotizacion</h2>
          </div>

          <div className="topbar__actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-pressed={theme === 'light'}
            >
              <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
              <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
            </button>
          </div>
        </header>

        <main className="main-content">
          <section className="hero-card" aria-labelledby="hero-title">
            <div>
              <p className="eyebrow">Resumen actual</p>
              <h3 id="hero-title">Sidebar fija y control de tema visibles durante todo el scroll</h3>
            </div>
            <p className="hero-card__copy">
              La estructura mantiene navegacion persistente, superficie limpia y acciones compactas
              con soporte para light y dark mode.
            </p>
          </section>

          <section className="metrics-grid" aria-label="Indicadores principales">
            <article className="metric-card">
              <span className="metric-card__label">Compatibilidad</span>
              <strong>98%</strong>
              <p>Sin conflictos detectados en la configuracion base.</p>
            </article>
            <article className="metric-card">
              <span className="metric-card__label">Tiempo estimado</span>
              <strong>3 min</strong>
              <p>Flujo optimizado para revisar, ajustar y enviar.</p>
            </article>
            <article className="metric-card">
              <span className="metric-card__label">Estado visual</span>
              <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong>
              <p>Preferencia persistida localmente para sesiones siguientes.</p>
            </article>
          </section>

          <section className="panel" aria-labelledby="activity-title">
            <div className="panel__heading">
              <div>
                <p className="eyebrow">Actividad</p>
                <h3 id="activity-title">Elementos recientes</h3>
              </div>
              <span className="panel__badge">Actualizado</span>
            </div>

            <div className="activity-list">
              {activityItems.map((item) => (
                <article key={item.title} className="activity-card">
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.detail}</p>
                  </div>
                  <span className="status-pill">{item.status}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="panel panel--spacious" aria-labelledby="notes-title">
            <div className="panel__heading">
              <div>
                <p className="eyebrow">Detalle</p>
                <h3 id="notes-title">Area de trabajo extensa</h3>
              </div>
            </div>
            <div className="long-copy">
              <p>
                Este bloque es intencionalmente alto para validar que la sidebar permanezca visible
                cuando la pagina crece y el usuario baja por contenido largo.
              </p>
              <p>
                Tambien se mantiene una barra superior compacta con el interruptor de tema dentro de
                un touch target amplio, focus visible y contraste suficiente para WCAG AA.
              </p>
              <p>
                El boton de cierre de sesion queda solo en la sidebar para evitar duplicacion y ruido
                visual dentro de la navbar.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
