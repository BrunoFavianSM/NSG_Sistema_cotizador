# Script de Seed - Datos de Prueba

Este script puebla la base de datos con datos de prueba realistas para el Sistema de Cotización Automatizada NSG.

## 📋 Requisitos

- PostgreSQL instalado y corriendo
- Base de datos creada con el schema (`base-datos/schema.sql`)
- Variables de entorno configuradas en `backend/.env`

## 🚀 Cómo Ejecutar

Desde el directorio `backend/`:

```bash
npm run seed
```

O directamente:

```bash
node scripts/seed-datos-prueba.js
```

## 📦 Datos Insertados

### Usuario Administrador

El script crea un usuario administrador de prueba:

- **Email**: `admin@nsg.com`
- **Contraseña**: `admin123`

⚠️ **IMPORTANTE**: Cambia estas credenciales en producción.

### Productos por Categoría

El script inserta productos realistas en todas las categorías:

#### 1. Procesadores (6 productos)
- Intel Core i9-13900K, i7-13700K, i5-13600K (Socket LGA1700)
- AMD Ryzen 9 7950X, Ryzen 7 7700X, Ryzen 5 7600X (Socket AM5)

#### 2. Placas Madre (5 productos)
- Compatible con sockets LGA1700 y AM5
- Soporte DDR4 y DDR5
- Form factors: ATX y mATX

#### 3. Memoria RAM (5 productos)
- DDR5: 6000MHz, 6400MHz, 5200MHz
- DDR4: 3600MHz, 3200MHz
- Capacidades: 16GB y 32GB

#### 4. Almacenamiento (5 productos)
- SSDs NVMe: Samsung 990 PRO, WD Black SN850X, Kingston NV2
- HDDs: Seagate Barracuda, WD Blue
- Capacidades: 500GB a 2TB

#### 5. Tarjetas Gráficas (6 productos)
- NVIDIA RTX 4090, 4080, 4070 Ti, 4060
- AMD Radeon RX 7900 XTX, RX 7800 XT
- TDP desde 115W hasta 450W

#### 6. Fuentes de Poder (5 productos)
- Potencias: 650W a 1200W
- Certificaciones: 80+ Bronze, Gold, Platinum
- Modulares y semi-modulares

#### 7. Gabinetes (5 productos)
- Form factors: ATX y mATX
- Marcas: Lian Li, NZXT, Corsair, Cooler Master, Fractal Design

## 🎯 Características de los Datos

### Datos Realistas
- Precios basados en el mercado actual
- Especificaciones técnicas completas
- Compatibilidad entre componentes

### Stock Variado
- Productos con stock disponible (2-25 unidades)
- Algunos productos con stock 0 pero disponibles a pedido
- Tiempos de entrega realistas (2-15 días)

### Compatibilidad
- Procesadores y placas madre con sockets compatibles
- RAM DDR4/DDR5 compatible con placas madre
- GPUs con diferentes consumos de potencia
- Fuentes con potencias adecuadas para diferentes configuraciones

## 🧹 Limpieza de Datos

El script **limpia automáticamente** todas las tablas antes de insertar datos nuevos:

- Elimina cotizaciones y detalles existentes
- Elimina productos existentes
- Elimina usuarios y administradores existentes
- Reinicia las secuencias de IDs

⚠️ **ADVERTENCIA**: Este script borra TODOS los datos existentes. No lo ejecutes en producción.

## 🔧 Configuración

El script utiliza las siguientes variables de entorno del archivo `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nsg_cotizaciones
DB_USER=postgres
DB_PASSWORD=tu_password
```

### Evitar Solicitud de Contraseña en Windows

Si PostgreSQL te pide la contraseña interactivamente, puedes configurar pgpass:

```bash
node scripts/configurar-pgpass.js
```

⚠️ **IMPORTANTE**: Después del desarrollo, elimina el archivo pgpass:
- Ubicación: `%APPDATA%\postgresql\pgpass.conf`
- Este archivo contiene contraseñas en texto plano
- Solo debe usarse en desarrollo local

## 📊 Salida del Script

El script muestra información detallada durante la ejecución:

```
╔════════════════════════════════════════════╗
║  SEED - Sistema de Cotización NSG          ║
╚════════════════════════════════════════════╝

🧹 Limpiando datos existentes...
✓ Datos limpiados correctamente

👤 Creando usuario administrador...
✓ Usuario administrador creado
  Email: admin@nsg.com
  Contraseña: admin123

📦 Insertando productos de prueba...
  → Procesadores...
  → Placas Madre...
  → Memoria RAM...
  → Almacenamiento...
  → Tarjetas Gráficas...
  → Fuentes de Poder...
  → Gabinetes...
✓ Productos insertados correctamente

📊 Resumen de productos:
  Almacenamiento: 5 productos
  Case: 5 productos
  Fuente: 5 productos
  GPU: 6 productos
  Placa Madre: 5 productos
  Procesador: 6 productos
  RAM: 5 productos

✅ Seed completado exitosamente!

📝 Credenciales de acceso:
  Email: admin@nsg.com
  Contraseña: admin123

💡 Usa estas credenciales para iniciar sesión en el sistema
```

## 🔍 Verificación

Después de ejecutar el script, puedes verificar los datos:

```sql
-- Contar productos por categoría
SELECT categoria, COUNT(*) as total 
FROM productos 
GROUP BY categoria 
ORDER BY categoria;

-- Ver administradores
SELECT id, username, nombre_completo 
FROM administradores;

-- Ver productos con stock bajo
SELECT nombre, categoria, stock, disponible_a_pedido 
FROM productos 
WHERE stock < 5 
ORDER BY stock;
```

## 🛠️ Personalización

Para modificar los datos de prueba:

1. Edita el archivo `scripts/seed-datos-prueba.js`
2. Modifica los arrays de productos en la función `insertarProductos()`
3. Ajusta precios, stock, o especificaciones según necesites
4. Ejecuta el script nuevamente

## 📝 Notas

- El script usa transacciones: si algo falla, todos los cambios se revierten
- Las contraseñas se hashean con bcrypt (10 rounds)
- Los productos incluyen compatibilidad para el validador del sistema
- Algunos productos tienen stock 0 para probar la funcionalidad "disponible a pedido"

## 🔗 Archivos Relacionados

- Schema de base de datos: `base-datos/schema.sql`
- Configuración de BD: `backend/src/configuracion/baseDatos.js`
- Servicio de autenticación: `backend/src/servicios/servicioAuth.js`
