# Backend - Sistema de Cotización Automatizada

API REST construida con Node.js y Express para el sistema de cotización de NSG Latinoamerica.

## Estructura

```
backend/
├── src/
│   ├── configuracion/      # Configuración de base de datos
│   ├── controladores/      # Lógica de peticiones HTTP
│   ├── servicios/          # Lógica de negocio
│   │   ├── servicioCompatibilidad.js
│   │   ├── servicioPDF.js
│   │   ├── asistenteIA.js
│   │   └── servicioAuth.js
│   ├── modelos/            # Modelos de datos
│   ├── rutas/              # Definición de endpoints
│   ├── middleware/         # Middleware de Express
│   ├── utilidades/         # Funciones auxiliares
│   └── servidor.js         # Punto de entrada
├── pruebas/                # Tests
├── scripts/                # Scripts de utilidad
└── assets/                 # Recursos (logos, etc.)
```

## Instalación

```bash
npm install
cp ../.env.example .env
# Configurar variables en .env
npm start
```

## Scripts Disponibles

```bash
npm start              # Iniciar servidor
npm run dev            # Modo desarrollo con nodemon
npm test               # Ejecutar tests
npm run test:watch     # Tests en modo watch
npm run test:coverage  # Tests con cobertura
```

## Variables de Entorno

Ver `.env.example` para la lista completa. Las más importantes:

```bash
DB_HOST=localhost
DB_NAME=nsg_cotizaciones
DB_USER=nsg_user
DB_PASSWORD=tu_password
JWT_SECRET=tu_secreto_jwt
AI_API_KEY=tu_api_key_gemini
PORT=3000
```

## Endpoints API

### Productos
- `GET /api/productos` - Listar productos
- `POST /api/productos` - Crear producto (requiere auth)
- `PUT /api/productos/:id` - Actualizar producto (requiere auth)
- `DELETE /api/productos/:id` - Eliminar producto (requiere auth)

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

### Health Check
- `GET /health` - Estado del servidor

## Servicios Principales

### Motor de Compatibilidad
Valida la compatibilidad entre componentes:
- Socket procesador-placa madre
- Tipo de RAM
- Form factor placa-case
- Consumo eléctrico vs fuente

### Generador de PDF
Genera dos tipos de PDFs:
- Cotización con precios y código ticket
- Listado técnico sin precios

### Asistente IA
Conversación natural para recomendar configuraciones:
- Usa Gemini 1.5 Flash
- Optimizado para reducir costos
- Cache de recomendaciones

### Servicio de Autenticación
- Login con JWT
- Hash de contraseñas con bcrypt
- Middleware de protección de rutas

## Seguridad

- **JWT**: Tokens con expiración de 8 horas
- **bcrypt**: Hash de contraseñas con 10 salt rounds
- **Helmet**: Headers de seguridad
- **Rate Limiting**: Límites por endpoint
- **CORS**: Configurado para frontend específico
- **SQL Injection**: Queries parametrizadas
- **XSS**: Sanitización de inputs

## Testing

### Unit Tests
```bash
npm test
```

### Property-Based Tests
```bash
npm test -- --testPathPattern=property
```

### Cobertura
```bash
npm run test:coverage
```

Objetivos de cobertura:
- Líneas: > 80%
- Funciones: > 85%
- Branches: > 75%

## Utilidades

### Crear Administrador
```bash
node scripts/crear-admin.js
```

### Seed de Datos
```bash
node scripts/seed.js
```

## Logs

Los logs se guardan en:
- Consola (desarrollo)
- Archivos en `logs/` (producción)

## Despliegue

### Con PM2
```bash
npm install -g pm2
pm2 start src/servidor.js --name nsg-backend
pm2 startup
pm2 save
```

### Con Docker
```bash
docker build -t nsg-backend .
docker run -p 3000:3000 nsg-backend
```

## Troubleshooting

### Error de conexión a PostgreSQL
Verificar que PostgreSQL esté corriendo y las credenciales sean correctas.

### Error "Cannot find module"
```bash
npm install
```

### Puerto en uso
Cambiar `PORT` en `.env`

### Tests fallan
Verificar que exista `.env.test` con credenciales de base de datos de prueba.
