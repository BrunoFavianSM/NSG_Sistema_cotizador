# Guía de Instalación - Sistema de Cotización Automatizada

## Requisitos del Sistema

### Software Requerido
- **Node.js**: versión 18.x o superior
- **PostgreSQL**: versión 14.x o superior
- **npm**: versión 8.x o superior (incluido con Node.js)
- **Git**: para clonar el repositorio

### Requisitos de Hardware (Mínimos)
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disco**: 10 GB de espacio libre

## Instalación Paso a Paso

### 1. Instalar PostgreSQL

#### En Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### En Windows:
Descargar e instalar desde: https://www.postgresql.org/download/windows/

#### En macOS:
```bash
brew install postgresql@14
brew services start postgresql@14
```

### 2. Configurar Base de Datos

```bash
# Acceder a PostgreSQL (Windows)
psql -U postgres

# Acceder a PostgreSQL (Linux)
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE nsg_cotizaciones;
CREATE USER nsg_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE nsg_cotizaciones TO nsg_user;

# Salir de psql
\q
```

### 3. Ejecutar Schema SQL

El archivo `schema.sql` ha sido unificado y contiene toda la estructura necesaria (usuarios, catálogo híbrido normalizado, cotizaciones, etc.).

Permisos
```bash
# Desde la raíz del proyecto
psql -U postgres -d nsg_cotizaciones -c "GRANT ALL ON SCHEMA public TO nsg_user;"

psql -U postgres -d nsg_cotizaciones -c "GRANT CREATE ON SCHEMA public TO nsg_user;"
```

```bash
# Desde la raíz del proyecto
psql -U nsg_user -d nsg_cotizaciones -f base-datos/schema.sql
```

> [!IMPORTANT]
> Si tenías una versión anterior de la base de datos, se recomienda eliminarla y crearla de nuevo (`DROP DATABASE` / `CREATE DATABASE`) para asegurar que el nuevo esquema unificado se aplique correctamente sin conflictos.

Si solicita contraseña, ingresa la que configuraste en el paso anterior.

### 4. Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### 5. Configurar Variables de Entorno del Backend

```bash
cd backend

# En Windows:
copy ..\.env.example .env

# En Linux/macOS:
cp ../.env.example .env

# Editar .env con tus credenciales (usar un editor de texto o IDE)
```

Configurar las siguientes variables:

```bash
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nsg_cotizaciones
DB_USER=nsg_user
DB_PASSWORD=tu_password_seguro

# Seguridad - GENERAR VALORES ÚNICOS
JWT_SECRET=tu_secreto_jwt_minimo_32_caracteres_aleatorios
ENCRYPTION_KEY=tu_clave_hex_64_caracteres_para_aes256

# API de IA (obtener de Google AI Studio)
AI_API_KEY=tu_api_key_de_gemini

# Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Generar JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Generar ENCRYPTION_KEY:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Obtener API Key de Gemini:
1. Visitar: https://makersuite.google.com/app/apikey
2. Crear un nuevo proyecto
3. Generar API key
4. Copiar la clave en AI_API_KEY

### 6. Instalar y Configurar el Frontend

```bash
cd ../frontend
npm install

# Configurar variables de entorno (Opcional, preconfigurado en localhost)
# En Windows:
copy .env.example .env

# En Linux/macOS:
cp .env.example .env
```

### 7. Verificar Instalación

#### Iniciar Backend:
```bash
cd backend
npm start
```

Deberías ver:
```
✓ Conectado a PostgreSQL
🚀 Servidor corriendo en puerto 3000
```

#### Iniciar Frontend (en otra terminal):
```bash
cd frontend
npm run dev
```

Deberías ver:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 8. Acceder a la Aplicación

Abrir navegador en: http://localhost:5173

## Crear Usuario Administrador

Para acceder al panel administrativo, necesitas crear un usuario:

```bash
# Conectar a PostgreSQL
psql -U nsg_user -d nsg_cotizaciones

# Insertar administrador (la contraseña será hasheada por la aplicación)
# Por ahora, usar bcrypt manualmente o crear endpoint temporal
```

Script Node.js para crear admin:

```javascript
// crear-admin.js
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'nsg_cotizaciones',
  user: 'nsg_user',
  password: 'tu_password',
});

async function crearAdmin() {
  const username = 'admin';
  const password = 'admin123'; // Cambiar en producción
  const nombreCompleto = 'Administrador NSG';
  
  const passwordHash = await bcrypt.hash(password, 10);
  
  await pool.query(
    'INSERT INTO administradores (username, password_hash, nombre_completo) VALUES ($1, $2, $3)',
    [username, passwordHash, nombreCompleto]
  );
  
  console.log('✓ Administrador creado');
  console.log('Username:', username);
  console.log('Password:', password);
  
  pool.end();
}

crearAdmin();
```

Ejecutar:
```bash
cd backend
node scripts/crear-admin.js
```

## Datos de Prueba (Opcional)

Para poblar la base de datos con productos de ejemplo:

```bash
cd backend
node scripts/seed-datos-prueba.js
```

## Solución de Problemas

### Error: "role 'nsg_user' does not exist"
```bash
sudo -u postgres psql
CREATE USER nsg_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE nsg_cotizaciones TO nsg_user;
```

### Error: "database 'nsg_cotizaciones' does not exist"
```bash
sudo -u postgres psql
CREATE DATABASE nsg_cotizaciones;
```

### Error: "Cannot find module 'pg'"
```bash
cd backend
npm install
```

### Error: "ECONNREFUSED" al conectar a PostgreSQL
Verificar que PostgreSQL esté corriendo:
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Puerto 3000 o 5173 ya en uso
Cambiar puerto en:
- Backend: archivo `.env` → `PORT=3001`
- Frontend: archivo `vite.config.js` → `server.port: 5174`

## Verificación de Instalación

### Health Check del Backend
```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "estado": "ok",
  "baseDatos": "conectada"
}
```

### Verificar Conexión a Base de Datos
```bash
psql -U nsg_user -d nsg_cotizaciones -c "SELECT COUNT(*) FROM productos;"
```

## Próximos Pasos

1. Crear usuario administrador
2. Poblar base de datos con productos
3. Configurar margen de ganancia en panel admin
4. Probar flujo de cotización completo

## Soporte

Para problemas o dudas:
- Revisar logs del backend: `backend/logs/`
- Revisar consola del navegador (F12)
- Verificar variables de entorno en `.env`

## Desinstalación

```bash
# Eliminar base de datos
sudo -u postgres psql
DROP DATABASE nsg_cotizaciones;
DROP USER nsg_user;
\q

# Eliminar archivos del proyecto
cd ..
rm -rf sistema-cotizacion-nsg
```
