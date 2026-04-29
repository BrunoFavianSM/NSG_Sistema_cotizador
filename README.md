# NSG Cotizador

> **Propuesta de Solución de Innovación — Sistema de Cotización Automatizada para NSG Latinoamerica E.I.R.L.**

---

## Descripción del Proyecto

**NSG Cotizador** es una aplicación web inteligente diseñada para automatizar y optimizar el proceso de generación de cotizaciones de hardware y equipos informáticos. El sistema integra un **asistente de inteligencia artificial conversacional** que guía a los clientes en la configuración de su equipo ideal, validando compatibilidad técnica entre componentes y calculando precios precisos en tiempo real.

---

## El Problema que Soluciona

En el sector de venta de hardware informático, los vendedores enfrentan desafíos significativos:

- **Complejidad técnica**: Armar una cotización requiere conocimiento experto sobre compatibilidad entre componentes (sockets de CPU, chipsets, formatos de placa, consumo eléctrico, etc.).
- **Tiempo de respuesta**: Cada cotización manual puede tomar 30-60 minutos, retrasando la atención al cliente.
- **Errores humanos**: Incompatibilidades entre componentes generan devoluciones, reprocesos y pérdida de confianza del cliente.
- **Cálculos complejos**: Determinar precios finales incluyendo impuestos (IGV), fletes, embalajes y tipo de cambio es propenso a errores.
- **Experiencia del cliente**: Los clientes frecuentemente no saben qué componentes necesitan para sus casos de uso específicos (gaming, diseño, oficina).

**NSG Cotizador** aborda estos problemas mediante la automatización inteligente del proceso completo de cotización.

---

## Características Principales

### 1. Asistente IA Conversacional
- Guía al cliente mediante 3-5 preguntas estratégicas
- Recopila presupuesto, casos de uso y preferencias de marca
- Recomienda configuraciones óptimas basadas en necesidades reales
- Optimizado con Gemini Flash para máxima eficiencia de costos

### 2. Validador de Compatibilidad
- Verifica automáticamente compatibilidad entre CPU, motherboard, GPU, RAM y fuente de poder
- Alerta sobre incompatibilidades antes de generar la cotización
- Reduce errores técnicos y devoluciones

### 3. Cálculo Inteligente de Precios
- Cálculo automático de IGV (18%)
- Tipo de cambio USD/PEN configurable
- Gestión de costos de flete y embalaje
- Resumen financiero detallado para administradores

### 4. Gestión de Catálogo
- Administración completa de productos, marcas y categorías
- Importación masiva vía CSV
- Control de stock y disponibilidad
- Especificaciones técnicas normalizadas

### 5. Generación de Documentos
- PDF profesionales de cotización
- Historial de cotizaciones por cliente
- Exportación de datos para análisis

---

## Tecnologías Utilizadas

### Frontend
- **React 18** — Biblioteca de UI
- **Tailwind CSS** — Framework de estilos
- **Vite** — Build tool y dev server
- **Framer Motion** — Animaciones fluidas
- **React PDF** — Generación de documentos PDF

### Backend
- **Node.js** + **Express** — Servidor API REST
- **PostgreSQL** — Base de datos relacional
- **Google Gemini AI** — Modelo de lenguaje para el asistente
- **JWT** + **bcrypt** — Autenticación y seguridad
- **PDFKit** — Generación de documentos

### Seguridad y Calidad
- Encriptación AES-256 para datos sensibles
- Rate limiting y protección contra ataques
- Validación de inputs en frontend y backend
- Tests unitarios con Jest

---

## Estructura del Proyecto

```
NSG_Cotizador/
├── frontend/           # Aplicación React
│   ├── src/
│   │   ├── componentes/    # Componentes reutilizables
│   │   ├── paginas/        # Vistas principales
│   │   ├── servicios/      # Contratos de API
│   │   └── hooks/          # Custom React hooks
│   └── package.json
├── backend/            # Servidor Express
│   ├── src/
│   │   ├── controladores/  # Lógica de endpoints
│   │   ├── servicios/      # Lógica de negocio
│   │   ├── rutas/          # Definición de rutas
│   │   └── configuracion/  # Conexión a BD
│   └── package.json
├── base-datos/         # Schema SQL y migraciones
└── AGENTS.md           # Guía de desarrollo
```

---

## Instalación y Uso

### Requisitos Previos
- Node.js 18+
- PostgreSQL 14+
- Clave API de Google Gemini (para el asistente IA)

### Configuración

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd NSG_Cotizador
   ```

2. **Configurar Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Editar .env con tus credenciales
   npm install
   npm run seed  # Cargar datos de ejemplo
   npm run dev
   ```

3. **Configurar Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Acceder**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

---

## Capturas de Pantalla

*Próximamente*

---

## Impacto Esperado

- **Reducción del 70%** en tiempo de generación de cotizaciones
- **Eliminación del 95%** de errores de compatibilidad
- **Mejora en experiencia del cliente** con recomendaciones personalizadas
- **Centralización** del catálogo de productos y configuraciones
- **Escalabilidad** del proceso de ventas sin incremento lineal de personal

---

## Licencia

ISC — NSG Latinoamerica E.I.R.L.

---

## Contacto

Para más información sobre este proyecto de innovación, contactar a:
- **Empresa**: NSG Latinoamerica E.I.R.L.
- **Proyecto**: Sistema de Cotización Automatizada

---

> *Este proyecto fue desarrollado como propuesta de solución tecnológica innovadora para optimizar procesos de venta y atención al cliente en el sector de hardware informático.*
