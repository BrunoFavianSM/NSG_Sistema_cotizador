# Sistema de Cotización Automatizada - NSG Latinoamerica E.I.R.L.

Sistema web full-stack para cotización automatizada de computadoras personalizadas con validación de compatibilidad, recomendaciones de IA y generación de presupuestos en PDF.

## Estructura del Proyecto

```
sistema-cotizacion-nsg/
├── backend/                    # Servidor Node.js + Express
│   ├── src/
│   │   ├── configuracion/      # Configuración de base de datos
│   │   ├── controladores/      # Lógica de peticiones HTTP
│   │   ├── servicios/          # Lógica de negocio
│   │   ├── modelos/            # Modelos de datos
│   │   ├── rutas/              # Definición de endpoints
│   │   ├── middleware/         # Middleware de Express
│   │   ├── utilidades/         # Funciones auxiliares
│   │   └── servidor.js         # Punto de entrada del servidor
│   ├── pruebas/                # Tests unitarios y property-based
│   ├── assets/                 # Recursos (logos, imágenes)
│   └── package.json
│
├── frontend/                   # Aplicación React + Vite
│   ├── src/
│   │   ├── componentes/        # Componentes React reutilizables
│   │   ├── paginas/            # Páginas principales
│   │   ├── servicios/          # Servicios de API
│   │   └── contexto/           # Context API para estado global
│   ├── public/                 # Archivos estáticos
│   └── package.json
│
├── base-datos/                 # Scripts SQL
│   └── schema.sql              # Schema completo de PostgreSQL
│
└── .env.example                # Plantilla de variables de entorno
```

## Tecnologías

### Backend
- **Node.js 18+** - Runtime de JavaScript
- **Express** - Framework web
- **PostgreSQL 14+** - Base de datos relacional
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas
- **PDFKit** - Generación de PDFs
- **Google Gemini API** - Inteligencia artificial

### Frontend
- **React 18+** - Librería de UI
- **Vite** - Build tool
- **Tailwind CSS** - Framework de estilos
- **Framer Motion** - Animaciones
- **Axios** - Cliente HTTP

### Testing
- **Jest** - Framework de testing
- **fast-check** - Property-based testing

## Instalación

### Requisitos Previos
- Node.js 18 o superior
- PostgreSQL 14 o superior
- npm o yarn

### 1. Configurar Base de Datos

```bash
# Instalar PostgreSQL
sudo apt install postgresql

# Crear base de datos
sudo -u postgres psql
CREATE DATABASE nsg_cotizaciones;
CREATE USER nsg_user WITH PASSWORD 'secure_password';
GRANT ALL ON DATABASE nsg_cotizaciones TO nsg_user;
\q

# Ejecutar schema
psql -U nsg_user -d nsg_cotizaciones -f base-datos/schema.sql
```

### 2. Configurar Backend

```bash
cd backend
npm install
cp ../.env.example .env
# Editar .env con tus credenciales
npm start
```

### 3. Configurar Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variables de Entorno

Copiar `.env.example` y configurar:

```bash
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nsg_cotizaciones
DB_USER=nsg_user
DB_PASSWORD=tu_password

# Seguridad
JWT_SECRET=tu_secreto_jwt_minimo_32_caracteres
ENCRYPTION_KEY=tu_clave_encriptacion_64_caracteres_hex

# API de IA
AI_API_KEY=tu_api_key_de_gemini

# Servidor
PORT=3000
FRONTEND_URL=http://localhost:5173
```

## Características Principales

### 1. Sistema de Cotización
- Selección guiada de componentes paso a paso
- Validación de compatibilidad en tiempo real
- Control de stock y productos a pedido
- Cálculo automático de precios con margen configurable

### 2. Motor de Compatibilidad
- Validación de socket procesador-placa madre
- Validación de tipo de RAM
- Validación de form factor placa-case
- Cálculo de consumo eléctrico y validación de fuente

### 3. Asistente de IA
- Conversación natural para entender necesidades
- Recomendaciones personalizadas basadas en presupuesto y uso
- Solo recomienda productos disponibles
- Optimizado para reducir costos de API

### 4. Generación de PDFs
- PDF de cotización con precios y código ticket
- PDF de listado técnico sin precios
- Códigos únicos para validación en tienda
- Vigencia de 3 días

### 5. Panel Administrativo
- Gestión completa de productos (CRUD)
- Actualización de stock en tiempo real
- Configuración de margen de ganancia
- Validación de cotizaciones con comparación de precios
- Sistema de tickets para reclamar pedidos

### 6. Seguridad
- Autenticación con JWT
- Contraseñas hasheadas con bcrypt
- Encriptación AES-256 para datos sensibles
- Rate limiting en endpoints
- Prevención de SQL injection
- Sanitización de inputs

## Scripts Disponibles

### Backend
```bash
npm start          # Iniciar servidor
npm run dev        # Modo desarrollo con nodemon
npm test           # Ejecutar tests
npm run test:coverage  # Tests con cobertura
```

### Frontend
```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build para producción
npm run preview    # Preview del build
npm test           # Ejecutar tests
```

## API Endpoints

### Productos
- `GET /api/productos` - Listar productos disponibles
- `POST /api/productos` - Crear producto (admin)
- `PUT /api/productos/:id` - Actualizar producto (admin)
- `DELETE /api/productos/:id` - Eliminar producto (admin)

### Cotizaciones
- `POST /api/cotizaciones` - Crear cotización
- `GET /api/cotizaciones/:codigoTicket` - Consultar cotización
- `PUT /api/cotizaciones/:codigoTicket/reclamar` - Marcar como reclamada
- `GET /api/cotizaciones/cliente/:email` - Historial del cliente

### Compatibilidad
- `POST /api/compatibilidad/validar` - Validar configuración

### IA
- `POST /api/ia/iniciar` - Iniciar conversación
- `POST /api/ia/continuar` - Continuar conversación

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/verificar` - Verificar token

## Testing

El proyecto utiliza un enfoque dual de testing:

### Unit Tests
Prueban casos específicos y edge cases:
```bash
npm test
```

### Property-Based Tests
Validan propiedades universales con fast-check:
```bash
npm test -- --testPathPattern=property
```

## Despliegue

### Producción con PM2
```bash
npm install -g pm2
pm2 start src/servidor.js --name nsg-backend
pm2 startup
pm2 save
```

### Docker (Opcional)
```bash
docker-compose up -d
```

## Contribución

Este proyecto es parte de un trabajo de titulación para NSG Latinoamerica E.I.R.L.

## Licencia

ISC

## Contacto

NSG Latinoamerica E.I.R.L.
