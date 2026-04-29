# Estructura del Proyecto — NSG Cotizador

> Última actualización: 2026-04-22

---

## Estructura raíz

```
NSG_Cotizador/
├── .agents/              # Skills de agentes IA (HIG, etc.)
├── .claude/              # Contexto de diseño Apple HIG
├── .kiro/                # Specs, instrucciones y configuración Kiro
│   ├── specs/            # Specs activos del proyecto
│   └── INSTRUCCIONES_PROYECTO.md
├── .vscode/              # Configuración del editor
├── backend/              # Servidor Node.js / Express
├── base-datos/           # Schema SQL y migraciones
├── frontend/             # App React + Tailwind
├── _para_revision/       # Archivos no funcionales pendientes de eliminar
├── _tests/               # Todos los archivos de prueba
├── _basura/              # Logs temporales y carpetas generadas
├── AGENTS.md             # Reglas del proyecto para agentes
├── ESTRUCTURA_PROYECTO.md  # Este archivo
└── .env.example          # Variables de entorno de ejemplo
```

---

## Backend (`backend/`)

```
backend/
├── src/
│   ├── configuracion/
│   │   ├── baseDatos.js          # Conexión a PostgreSQL
│   │   └── catalogoProductos.js  # Catálogo de productos
│   ├── controladores/
│   │   ├── controladorAsistente.js
│   │   ├── controladorConfiguracion.js
│   │   ├── controladorCotizaciones.js
│   │   ├── controladorImportacion.js
│   │   ├── controladorProductos.js
│   │   └── controladorTipoCambio.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── multerCSV.js
│   │   └── multerImagen.js
│   ├── modelos/              # (vacío — modelos futuros)
│   ├── prompts/
│   │   ├── promptCorreccion.js
│   │   └── systemPrompt.js
│   ├── rutas/
│   │   ├── auth.js
│   │   ├── compatibilidad.js
│   │   ├── configuracion.js
│   │   ├── cotizaciones.js
│   │   ├── ia.js
│   │   ├── importacion.js
│   │   ├── productos.js
│   │   ├── rutasAsistente.js
│   │   └── tipoCambio.js
│   ├── servicios/
│   │   ├── asistenteIA.js
│   │   ├── servicioAuth.js
│   │   ├── servicioCompatibilidad.js
│   │   ├── servicioImportacion.js
│   │   ├── servicioLLM.js
│   │   ├── servicioMemoriaPerfil.js
│   │   ├── servicioNotificaciones.js
│   │   ├── servicioPDF.js
│   │   ├── servicioSemaforo.js
│   │   └── servicioValidacionAsistente.js
│   ├── utilidades/
│   │   ├── encriptacion.js
│   │   ├── sanitizacion.js
│   │   └── validacion.js
│   └── servidor.js           # Entry point del servidor
├── scripts/                  # Scripts de utilidad/setup
│   ├── configurar-pgpass.js
│   ├── crear-admin.js
│   ├── generar-clave-encriptacion.js
│   ├── generar-csv-maestro.js
│   ├── insertar-productos-ejemplo.js
│   ├── migrar-finanzas-fase1.js
│   └── seed-datos-prueba.js
├── uploads/                  # Archivos subidos (imágenes, CSV)
├── assets/                   # Assets del backend
├── .env                      # Variables de entorno (no commitear)
├── .env.test                 # Variables para tests
├── jest.config.js            # Configuración Jest
├── package.json
└── package-lock.json
```

---

## Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── componentes/
│   │   ├── accesibilidad/
│   │   │   └── AccessibilityProvider.jsx
│   │   ├── admin/
│   │   │   ├── AdminPageHeader.jsx
│   │   │   ├── FormSection.jsx
│   │   │   └── ProductForm.jsx
│   │   ├── AsistenteIA/
│   │   │   ├── BotonAsesorHumano.jsx
│   │   │   ├── ConfiguracionPropuesta.jsx
│   │   │   ├── MensajeAsistente.jsx
│   │   │   ├── MensajeUsuario.jsx
│   │   │   ├── QuickReplies.jsx
│   │   │   ├── RutaUpgrade.jsx
│   │   │   ├── SemaforoCapacidades.jsx
│   │   │   ├── TypingIndicator.jsx
│   │   │   └── ValidandoIndicador.jsx
│   │   ├── cotizador/
│   │   │   ├── ResumenFinancieroAdmin.jsx
│   │   │   ├── SeccionEmbalaje.jsx
│   │   │   └── SeccionFlete.jsx
│   │   ├── feedback/
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── SuccessState.jsx
│   │   │   └── ToastProvider.jsx
│   │   ├── layout/
│   │   │   └── AppShell.jsx
│   │   ├── ui/
│   │   │   ├── Badge.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── cn.js
│   │   │   ├── DataTable.jsx
│   │   │   ├── InputField.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── SelectField.jsx
│   │   │   ├── SwitchField.jsx
│   │   │   └── TextAreaField.jsx
│   │   ├── AsistenteIA.jsx       # Componente principal IA
│   │   ├── GeneradorPDF.jsx
│   │   ├── ResumenCotizacion.jsx
│   │   ├── RutaProtegida.jsx
│   │   ├── SelectorComponente.jsx
│   │   └── ValidadorCompatibilidad.jsx
│   ├── contexto/
│   │   └── AppContext.jsx
│   ├── hooks/
│   │   ├── useAsistenteIA.js
│   │   └── useExchangeRate.js
│   ├── paginas/
│   │   ├── AdminConfiguracion.jsx
│   │   ├── AdminProductos.jsx
│   │   ├── Cotizador.jsx
│   │   ├── HistorialCliente.jsx
│   │   ├── ImportarCSV.jsx
│   │   ├── Login.jsx
│   │   └── ValidadorCotizaciones.jsx
│   ├── servicios/
│   │   ├── api.js                # Contratos centralizados de API
│   │   └── asistente.js
│   ├── utilidades/
│   │   ├── calcularResumenFinancieroAdmin.js
│   │   └── moneda.js
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── theme.js
├── public/
├── dist/                         # Build de producción (generado)
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── babel.config.js
├── jest.config.js
├── package.json
└── package-lock.json
```

---

## Base de datos (`base-datos/`)

```
base-datos/
├── migraciones/      # Migraciones SQL versionadas
└── schema.sql        # Schema principal
```

---

## Tests (`_tests/`)

```
_tests/
├── frontend/
│   ├── componentes/  # Tests de componentes React
│   ├── paginas/      # Tests de páginas
│   ├── servicios/    # Tests de servicios API
│   ├── contexto/     # Tests de contexto
│   └── setupTests.js
└── backend/
    └── pruebas/      # Tests unitarios e integración del backend
```

---

## Para revisión (`_para_revision/`)

Archivos movidos que NO son parte del sistema funcional. Revisar cuáles eliminar definitivamente.

```
_para_revision/
├── REGISTRO_MOVIMIENTOS.md   # Ubicaciones originales de cada archivo
├── frontend-demos/           # Archivos ejemplo-uso-* y DEMO_*.md
├── frontend-misc/            # README, pdfx.json, lib experimental
├── backend-demos/            # demo-*.js y READMEs de servicios
├── backend-scripts/          # Scripts de test y README seed
├── backend-misc-README.md    # README original del backend
├── documentacion-tareas-historial/  # Historial de tareas completadas
├── tareas_realizadas/        # Resúmenes de tareas
├── docs/                     # Duplicado de documentacion-tareas
├── bd-respaldo-antiguo/      # Respaldo antiguo de BD
├── src-raiz/                 # src/ duplicado en raíz
├── dist-raiz/                # dist/ duplicado en raíz
├── public-raiz/              # public/ duplicado en raíz
├── resources-raiz/           # resources/ (logo)
├── Openrouter/               # Carpeta experimental
└── [archivos raíz varios]    # README, INSTALACION, package.json raíz, etc.
```

---

## Basura (`_basura/`)

Archivos generados automáticamente o temporales. Se pueden eliminar sin riesgo.

```
_basura/
├── backend-logs/     # debug_err.log, tmp_server_*.log
├── backend-scratch/  # Carpeta scratch vacía
└── backend-coverage/ # Reporte de cobertura (se regenera con tests)
```
