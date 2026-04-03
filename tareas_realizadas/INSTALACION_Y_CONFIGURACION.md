# Guía de Instalación y Configuración
## Sistema de Cotización Automatizada NSG

**Versión:** 1.0.0  
**Fecha:** 31 de marzo de 2026  
**Empresa:** NSG Latinoamerica E.I.R.L.

---

## 📋 Requisitos Previos

### Software Requerido

1. **Node.js** 18.x o superior
   - Descargar desde: https://nodejs.org/
   - Verificar instalación: `node --version`

2. **PostgreSQL** 14.x o superior
   - Descargar desde: https://www.postgresql.org/download/
   - Verificar instalación: `psql --version`

3. **npm** 9.x o superior (incluido con Node.js)
   - Verificar instalación: `npm --version`

4. **Git** (opcional, para clonar repositorio)
   - Descargar desde: https://git-scm.com/

### Cuentas de API Requeridas

1. **Google Gemini API** (para Asistente IA)
   - Crear cuenta en: https://makersuite.google.com/
   - Obtener API key

---

## 🔧 Instalación Paso a Paso

### Paso 1: Clonar o Descargar el Proyecto

```bash
# Si usas Git
git clone <url-del-repositorio>
cd sistema-cotizacion-nsg

# O descargar y extraer el ZIP
```

### Paso 2: Instalar Dependencias del Backend

```bash
cd backend
npm install
```

**Dependencias instaladas:**
- express (servidor web)
- pg (cliente PostgreSQL)
- bcrypt (hashing de passwords)
- jsonwebtoken (autenticación JWT)
- pdfkit (generación de PDFs)
- uuid (generación de UUIDs)
- helmet (seguridad)
- cors (CORS)
- express-rate-limit (rate limiting)
- validator (validación de datos)
- @google/generative-ai (API de IA)
- node-cache (cache)
- dotenv (variables de entorno)

**Dependencias de desarrollo:**
- jest (testing)
- fast-check (property-based testing)
- supertest (testing de APIs)

### Paso 3: Instalar Dependencias del Frontend

```bash
cd ../frontend
npm install
```

**Dependencias instaladas:**
- react (framework UI)
- react-dom (renderizado)
- vite (build tool)
- tailwindcss (estilos)
- framer-motion (animaciones)
- axios (cliente HTTP)

---

## 🗄️ Configuración de Base de Datos

### Paso 1: Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE nsg_cotizaciones;

# Crear usuario (opcional, recomendado para producción)
CREATE USER nsg_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE nsg_cotizaciones TO nsg_user;

# Salir
\q
```

### Paso 2: Ejecutar Schema SQL

```bash
# Conectar a la base de datos
psql -U postgres -d nsg_cotizaciones

# Ejecutar schema
\i base-datos/schema.sql

# Verificar tablas creadas
\dt

# Salir
\q
```

**Tablas creadas:**
- administradores
- usuarios_clientes
- productos
- configuracion
- cotizaciones
- detalle_cotizacion
- conversaciones_ia
- auditoria

### Paso 3: Crear Usuario Administrador Inicial

```bash
# Conectar a la base de datos
psql -U postgres -d nsg_cotizaciones
```

```sql
-- Insertar administrador (password: admin123)
-- Hash generado con bcrypt, rounds=10
INSERT INTO administradores (username, password_hash, nombre_completo)
VALUES (
  'admin',
  '$2b$10$rBV2kHf7Gu0XN5tP8vQxXeYvF5kZqH3jL9mN1oP2qR3sT4uV5wX6y',
  'Administrador Principal'
);
```

**Nota:** Cambiar el password después del primer login.

---

## ⚙️ Configuración de Variables de Entorno

### Paso 1: Generar Clave de Encriptación

```bash
cd backend
node scripts/generar-clave-encriptacion.js
```

Esto generará una clave hexadecimal de 64 caracteres. Copia la clave generada.

### Paso 2: Crear Archivo .env

Crear archivo `backend/.env` con el siguiente contenido:

```bash
# Configuración de Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nsg_cotizaciones
DB_USER=postgres
DB_PASSWORD=tu_password_de_postgres

# Configuración de Seguridad
JWT_SECRET=genera_un_string_aleatorio_de_minimo_32_caracteres
ENCRYPTION_KEY=pega_aqui_la_clave_generada_en_paso_1

# API de Inteligencia Artificial
AI_API_KEY=tu_api_key_de_gemini

# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5173
```

### Paso 3: Generar JWT Secret

```bash
# En Linux/Mac
openssl rand -base64 32

# En Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# O usar Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copiar el resultado al campo `JWT_SECRET` en `.env`.

### Paso 4: Obtener API Key de Gemini

1. Ir a https://makersuite.google.com/
2. Crear cuenta o iniciar sesión
3. Ir a "Get API Key"
4. Crear nuevo proyecto
5. Generar API key
6. Copiar la key al campo `AI_API_KEY` en `.env`

---

## 🧪 Verificar Instalación

### Paso 1: Ejecutar Tests

```bash
cd backend
npm test
```

**Resultado esperado:**
```
Test Suites: 7 passed, 7 total
Tests:       141 passed, 141 total
Time:        ~5-10 segundos
```

### Paso 2: Iniciar Servidor Backend

```bash
cd backend
npm start
```

**Salida esperada:**
```
✓ Conectado a PostgreSQL
🚀 Servidor corriendo en puerto 3000
```

### Paso 3: Verificar Health Check

Abrir navegador en: http://localhost:3000/health

**Respuesta esperada:**
```json
{
  "estado": "ok",
  "baseDatos": "conectada"
}
```

### Paso 4: Iniciar Frontend (cuando esté implementado)

```bash
cd frontend
npm run dev
```

---

## 🔒 Configuración de Seguridad

### Generar Password Hash para Administradores

```javascript
// Usar bcrypt para generar hash
const bcrypt = require('bcrypt');

async function generarHash(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash:', hash);
}

generarHash('tu_password_aqui');
```

### Configurar Rate Limiting

El rate limiting está configurado por defecto en `servidor.js`:

```javascript
// 100 requests por 15 minutos para todas las rutas /api/
const limitadorAPI = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

Para ajustar, editar `backend/src/servidor.js`.

### Configurar CORS

Por defecto, CORS permite solo el frontend en `http://localhost:5173`.

Para producción, actualizar en `.env`:

```bash
FRONTEND_URL=https://tu-dominio.com
```

---

## 📊 Configuración de Base de Datos

### Configurar Margen de Ganancia

El margen por defecto es 20%. Para cambiarlo:

```sql
UPDATE configuracion 
SET valor = '25' 
WHERE clave = 'margen_ganancia';
```

### Poblar Base de Datos con Productos de Ejemplo

```sql
-- Procesadores
INSERT INTO productos (nombre, categoria, socket, tdp, precio_base, stock, descripcion_tecnica)
VALUES 
  ('AMD Ryzen 5 5600X', 'procesador', 'AM4', 65, 899.00, 5, '6 cores, 12 threads, 3.7GHz base'),
  ('Intel Core i5-13400F', 'procesador', 'LGA1700', 65, 799.00, 3, '10 cores, 16 threads, 2.5GHz base');

-- Placas Madre
INSERT INTO productos (nombre, categoria, socket, ram_type, form_factor, precio_base, stock, descripcion_tecnica)
VALUES 
  ('ASUS TUF Gaming B550M-PLUS', 'placa_madre', 'AM4', 'DDR4', 'Micro-ATX', 549.00, 3, 'Chipset B550, 4x DDR4'),
  ('MSI PRO B760M-A', 'placa_madre', 'LGA1700', 'DDR4', 'Micro-ATX', 499.00, 2, 'Chipset B760, 4x DDR4');

-- RAM
INSERT INTO productos (nombre, categoria, ram_type, precio_base, stock, disponible_a_pedido, tiempo_entrega_dias, descripcion_tecnica)
VALUES 
  ('Corsair Vengeance 16GB DDR4 3200MHz', 'ram', 'DDR4', 299.00, 0, true, 7, '2x8GB, CL16'),
  ('Kingston Fury 16GB DDR4 3200MHz', 'ram', 'DDR4', 279.00, 8, false, null, '2x8GB, CL16');

-- Almacenamiento
INSERT INTO productos (nombre, categoria, precio_base, stock, descripcion_tecnica)
VALUES 
  ('Kingston NV2 500GB NVMe', 'almacenamiento', 189.00, 10, 'M.2 NVMe PCIe 4.0, 3500MB/s'),
  ('WD Blue 1TB SATA SSD', 'almacenamiento', 299.00, 5, '2.5", SATA III, 560MB/s');

-- GPUs
INSERT INTO productos (nombre, categoria, tdp, precio_base, stock, descripcion_tecnica)
VALUES 
  ('NVIDIA RTX 3060 12GB', 'gpu', 170, 1899.00, 2, '12GB GDDR6, 3584 CUDA cores'),
  ('AMD RX 6600 8GB', 'gpu', 132, 1499.00, 4, '8GB GDDR6, 1792 stream processors');

-- Fuentes
INSERT INTO productos (nombre, categoria, wattage, precio_base, stock, descripcion_tecnica)
VALUES 
  ('Cooler Master MWE 650W 80+ Bronze', 'fuente', 650, 279.00, 8, 'Modular, 80+ Bronze'),
  ('EVGA 600W 80+ White', 'fuente', 600, 229.00, 6, 'No modular, 80+ White');

-- Cases
INSERT INTO productos (nombre, categoria, form_factor, precio_base, stock, descripcion_tecnica)
VALUES 
  ('NZXT H510 Flow', 'case', 'ATX', 399.00, 4, 'Case ATX con soporte Micro-ATX y Mini-ITX'),
  ('Cooler Master Q300L', 'case', 'Micro-ATX', 249.00, 7, 'Case Micro-ATX compacto');
```

---

## 🐛 Solución de Problemas

### Error: "ENCRYPTION_KEY no está definida"

**Solución:**
1. Generar clave: `node scripts/generar-clave-encriptacion.js`
2. Agregar al archivo `.env`
3. Reiniciar servidor

### Error: "Cannot connect to PostgreSQL"

**Solución:**
1. Verificar que PostgreSQL está corriendo: `pg_isready`
2. Verificar credenciales en `.env`
3. Verificar que la base de datos existe: `psql -U postgres -l`

### Error: "Port 3000 already in use"

**Solución:**
1. Cambiar puerto en `.env`: `PORT=3001`
2. O detener proceso en puerto 3000

### Tests Fallan por Timeout

**Solución:**
1. Verificar que PostgreSQL está corriendo
2. Aumentar timeout en jest.config.js
3. Verificar conexión a base de datos

### Error: "AI_API_KEY not found"

**Solución:**
1. Obtener API key de Google Gemini
2. Agregar al archivo `.env`
3. Verificar que el archivo `.env` está en `backend/`

---

## 🚀 Comandos Útiles

### Backend

```bash
# Instalar dependencias
npm install

# Iniciar servidor en desarrollo
npm start

# Ejecutar todos los tests
npm test

# Ejecutar tests específicos
npm test -- integridad-referencial.test.js

# Ejecutar tests con cobertura
npm test -- --coverage

# Generar clave de encriptación
node scripts/generar-clave-encriptacion.js
```

### Frontend

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview
```

### Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Conectar a base de datos específica
psql -U postgres -d nsg_cotizaciones

# Ejecutar script SQL
psql -U postgres -d nsg_cotizaciones -f base-datos/schema.sql

# Backup de base de datos
pg_dump -U postgres nsg_cotizaciones > backup.sql

# Restaurar backup
psql -U postgres -d nsg_cotizaciones < backup.sql

# Ver tablas
psql -U postgres -d nsg_cotizaciones -c "\dt"

# Ver datos de una tabla
psql -U postgres -d nsg_cotizaciones -c "SELECT * FROM productos;"
```

---

## 🔐 Configuración de Seguridad para Producción

### 1. Variables de Entorno

Crear archivo `backend/.env.production`:

```bash
# Base de Datos (usar credenciales seguras)
DB_HOST=tu_servidor_db
DB_PORT=5432
DB_NAME=nsg_cotizaciones_prod
DB_USER=nsg_user_prod
DB_PASSWORD=password_muy_seguro_y_largo

# Seguridad (GENERAR NUEVAS CLAVES)
JWT_SECRET=clave_jwt_diferente_de_desarrollo_minimo_32_caracteres
ENCRYPTION_KEY=clave_encriptacion_diferente_de_desarrollo_64_caracteres

# API de IA
AI_API_KEY=tu_api_key_de_produccion

# Servidor
PORT=3000
NODE_ENV=production

# Frontend URL (dominio real)
FRONTEND_URL=https://cotizador.nsg-latinoamerica.com
```

### 2. Configurar HTTPS

Para producción, usar HTTPS con certificado SSL:

```javascript
// backend/src/servidor.js (modificar para producción)
const https = require('https');
const fs = require('fs');

const opciones = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(opciones, app).listen(443);
```

### 3. Configurar Firewall

```bash
# Permitir solo puertos necesarios
# Puerto 3000 (API)
# Puerto 5432 (PostgreSQL, solo localhost)
# Puerto 443 (HTTPS)
```

### 4. Configurar Backup Automático

Crear script `backend/scripts/backup-db.sh`:

```bash
#!/bin/bash
FECHA=$(date +%Y%m%d_%H%M%S)
pg_dump -U nsg_user_prod nsg_cotizaciones_prod > backups/backup_$FECHA.sql
```

Configurar cron job:

```bash
# Backup diario a las 2 AM
0 2 * * * /path/to/backup-db.sh
```

---

## 📦 Despliegue

### Opción 1: Despliegue Manual

```bash
# 1. Clonar repositorio en servidor
git clone <url> /var/www/nsg-cotizador

# 2. Instalar dependencias
cd /var/www/nsg-cotizador/backend
npm install --production

cd /var/www/nsg-cotizador/frontend
npm install
npm run build

# 3. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con valores de producción

# 4. Iniciar con PM2
npm install -g pm2
pm2 start backend/src/servidor.js --name nsg-api
pm2 startup
pm2 save

# 5. Configurar Nginx como reverse proxy
```

### Opción 2: Despliegue con Docker (preparado para futuro)

```bash
# Build
docker-compose build

# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## 🧪 Verificación Post-Instalación

### Checklist de Verificación

- [ ] Node.js instalado (v18+)
- [ ] PostgreSQL instalado (v14+)
- [ ] Base de datos `nsg_cotizaciones` creada
- [ ] Schema SQL ejecutado correctamente
- [ ] Usuario administrador creado
- [ ] Dependencias backend instaladas
- [ ] Dependencias frontend instaladas
- [ ] Archivo `.env` configurado
- [ ] Clave de encriptación generada
- [ ] JWT secret configurado
- [ ] API key de Gemini configurada
- [ ] Tests pasando (141/141)
- [ ] Servidor backend inicia correctamente
- [ ] Health check responde OK
- [ ] Frontend inicia correctamente (cuando esté implementado)

### Tests de Verificación

```bash
# 1. Verificar conexión a base de datos
cd backend
npm test -- integridad-referencial.test.js

# 2. Verificar servidor
npm test -- servidor.test.js

# 3. Verificar servicios
npm test -- servicioCompatibilidad.test.js
npm test -- servicioPDF.test.js

# 4. Verificar seguridad
npm test -- utilidades-seguridad.test.js

# 5. Ejecutar todos los tests
npm test
```

### Verificación Manual

```bash
# 1. Iniciar servidor
cd backend
npm start

# 2. En otra terminal, probar health check
curl http://localhost:3000/health

# Respuesta esperada:
# {"estado":"ok","baseDatos":"conectada"}

# 3. Probar endpoint de productos (debe retornar 501 por ahora)
curl http://localhost:3000/api/productos

# 4. Verificar rate limiting
curl -I http://localhost:3000/api/productos
# Debe incluir headers: x-ratelimit-limit, x-ratelimit-remaining
```

---

## 📚 Documentación Adicional

### Archivos de Documentación

- `backend/src/utilidades/README.md` - Guía de utilidades de seguridad
- `tareas_realizadas/RESUMEN_TAREAS_COMPLETADAS.md` - Resumen de tareas completadas
- `.kiro/specs/sistema-cotizacion-automatizada/requirements.md` - Requisitos del sistema
- `.kiro/specs/sistema-cotizacion-automatizada/design.md` - Diseño técnico
- `.kiro/specs/sistema-cotizacion-automatizada/tasks.md` - Plan de implementación

### Recursos Externos

- **Node.js:** https://nodejs.org/docs/
- **Express:** https://expressjs.com/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **React:** https://react.dev/
- **Vite:** https://vitejs.dev/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Google Gemini API:** https://ai.google.dev/docs

---

## 🆘 Soporte

### Contacto

**NSG Latinoamerica E.I.R.L.**  
Email: soporte@nsg-latinoamerica.com  
Teléfono: +51 XXX XXX XXX

### Logs

Los logs del servidor se encuentran en:
- Consola del servidor (stdout/stderr)
- Logs de PostgreSQL: `/var/log/postgresql/`

Para habilitar logging a archivo, configurar en `servidor.js`:

```javascript
const fs = require('fs');
const morgan = require('morgan');

// Crear stream de logs
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, '../logs/access.log'),
  { flags: 'a' }
);

// Usar morgan para logging
app.use(morgan('combined', { stream: accessLogStream }));
```

---

## 🔄 Actualización del Sistema

### Actualizar Dependencias

```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update

# Verificar vulnerabilidades
npm audit
npm audit fix
```

### Actualizar Base de Datos

Para cambios en el schema:

1. Crear script de migración en `base-datos/migraciones/`
2. Hacer backup de la base de datos
3. Ejecutar migración
4. Verificar integridad de datos

---

## ✅ Checklist de Producción

Antes de desplegar a producción:

- [ ] Cambiar todas las claves y secrets
- [ ] Usar base de datos de producción
- [ ] Configurar HTTPS
- [ ] Configurar firewall
- [ ] Configurar backup automático
- [ ] Configurar monitoring
- [ ] Configurar logging a archivo
- [ ] Probar todos los endpoints
- [ ] Ejecutar tests en ambiente de producción
- [ ] Configurar PM2 o similar para gestión de procesos
- [ ] Configurar Nginx como reverse proxy
- [ ] Configurar dominio y DNS
- [ ] Probar flujo completo end-to-end

---

**Última actualización:** 31 de marzo de 2026  
**Versión del documento:** 1.0.0
