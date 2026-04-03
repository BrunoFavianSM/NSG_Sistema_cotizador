# Controladores

Este directorio contiene los controladores del sistema de cotización.

## Controlador de Productos

**Archivo:** `controladorProductos.js`

### Descripción

Maneja todas las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) de productos con validación completa, sanitización de inputs y control de acceso mediante autenticación JWT.

### Requisitos Implementados

- **1.1**: Crear nuevos productos
- **1.2**: Actualizar productos existentes
- **1.3**: Eliminar productos del catálogo
- **1.4**: Visualizar todos los productos
- **1.5**: Actualización de stock
- **2.1**: Consulta de stock actual
- **2.2**: Filtrado por disponibilidad (stock > 0 O disponible_a_pedido)
- **2.3**: Actualización dinámica de disponibilidad

### Endpoints

#### GET /api/productos

Obtiene todos los productos disponibles (stock > 0 O disponible_a_pedido = true).

**Query Parameters:**
- `categoria` (opcional): Filtra por categoría (procesador, placa_madre, ram, etc.)
- `socket` (opcional): Filtra por socket (AM5, LGA1700, etc.)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "cantidad": 2,
  "productos": [
    {
      "id": 1,
      "nombre": "Intel Core i7-13700K",
      "categoria": "procesador",
      "socket": "LGA1700",
      "tdp": 125,
      "precio_base": 450.00,
      "stock": 10,
      "disponible_a_pedido": false,
      "descripcion_tecnica": "...",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### GET /api/productos/:id

Obtiene un producto específico por ID.

**Parámetros:**
- `id`: ID del producto (entero positivo)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "producto": {
    "id": 1,
    "nombre": "Intel Core i7-13700K",
    ...
  }
}
```

**Errores:**
- `400`: ID inválido
- `404`: Producto no encontrado

#### POST /api/productos

Crea un nuevo producto. **Requiere autenticación de administrador.**

**Headers:**
```
Authorization: Bearer <token_jwt>
```

**Body:**
```json
{
  "nombre": "Intel Core i7-13700K",
  "categoria": "procesador",
  "socket": "LGA1700",
  "tdp": 125,
  "precio_base": 450.00,
  "stock": 10,
  "disponible_a_pedido": false,
  "tiempo_entrega_dias": null,
  "descripcion_tecnica": "Procesador de alto rendimiento",
  "imagen_url": "https://..."
}
```

**Campos requeridos:**
- `nombre`: String (3-200 caracteres)
- `categoria`: String (procesador, placa_madre, ram, almacenamiento, gpu, fuente, case)
- `precio_base`: Decimal positivo
- `stock`: Entero no negativo

**Campos opcionales según categoría:**
- `socket`: Requerido para procesador y placa_madre
- `ram_type`: Requerido para ram y placa_madre
- `form_factor`: Requerido para placa_madre y case
- `wattage`: Requerido para fuente
- `tdp`: Requerido para procesador y gpu

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Producto creado exitosamente",
  "producto": { ... }
}
```

**Errores:**
- `400`: Datos inválidos
- `401`: No autenticado
- `409`: Producto duplicado

#### PUT /api/productos/:id

Actualiza un producto existente. **Requiere autenticación de administrador.**

**Headers:**
```
Authorization: Bearer <token_jwt>
```

**Body:** (todos los campos son opcionales)
```json
{
  "precio_base": 500.00,
  "stock": 15,
  "disponible_a_pedido": true
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Producto actualizado exitosamente",
  "producto": { ... }
}
```

**Errores:**
- `400`: ID inválido o sin datos para actualizar
- `401`: No autenticado
- `404`: Producto no encontrado

#### DELETE /api/productos/:id

Elimina un producto. **Requiere autenticación de administrador.**

**Headers:**
```
Authorization: Bearer <token_jwt>
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Producto eliminado exitosamente",
  "producto": {
    "id": 1,
    "nombre": "Intel Core i7-13700K"
  }
}
```

**Errores:**
- `400`: ID inválido
- `401`: No autenticado
- `404`: Producto no encontrado
- `409`: Producto en uso (está en cotizaciones)

### Seguridad

1. **Queries Parametrizadas**: Todas las consultas SQL usan parámetros para prevenir SQL injection
2. **Sanitización**: Todos los inputs se sanitizan antes de procesarse
3. **Validación**: Validación completa de tipos y formatos
4. **Autenticación**: Operaciones admin requieren token JWT válido
5. **Manejo de Errores**: Errores específicos sin exponer detalles internos

### Validaciones

El controlador valida:
- IDs son enteros positivos
- Nombres tienen 3-200 caracteres
- Categorías son válidas
- Precios son positivos
- Stock es no negativo
- Campos específicos por categoría (socket, ram_type, etc.)
- Sin código malicioso en inputs

### Filtrado de Disponibilidad

El endpoint GET siempre filtra productos para mostrar solo:
- Productos con `stock > 0`, O
- Productos con `disponible_a_pedido = true`

Esto cumple con el Requisito 2.2: "Solo mostrar componentes disponibles".

### Ejemplos de Uso

**Obtener todos los procesadores disponibles:**
```bash
curl http://localhost:3000/api/productos?categoria=procesador
```

**Obtener placas madre compatibles con socket AM5:**
```bash
curl http://localhost:3000/api/productos?categoria=placa_madre&socket=AM5
```

**Crear un nuevo producto (requiere autenticación):**
```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "AMD Ryzen 7 7700X",
    "categoria": "procesador",
    "socket": "AM5",
    "tdp": 105,
    "precio_base": 380.00,
    "stock": 5
  }'
```

**Actualizar stock (requiere autenticación):**
```bash
curl -X PUT http://localhost:3000/api/productos/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"stock": 20}'
```

### Testing

El controlador tiene cobertura completa de tests:

**Unit Tests:** `backend/pruebas/controladorProductos.test.js`
- 19 tests unitarios
- Cobertura de todas las funciones
- Validación de errores y casos edge

**Integration Tests:** `backend/pruebas/integracion-productos.test.js`
- 12 tests de integración
- Validación de endpoints completos
- Verificación de requisitos

**Ejecutar tests:**
```bash
cd backend
npm test -- controladorProductos.test.js
npm test -- integracion-productos.test.js
```

### Dependencias

- `ejecutarQuery`: Función de base de datos con queries parametrizadas
- `validarProducto`, `validarId`: Funciones de validación
- `sanitizarObjeto`: Función de sanitización
- `verificarToken`: Middleware de autenticación JWT

### Notas de Implementación

1. **Actualización Dinámica**: El endpoint PUT construye la query dinámicamente solo con los campos proporcionados
2. **Protección de Integridad**: No permite eliminar productos que están en cotizaciones
3. **Trigger Automático**: La base de datos actualiza `updated_at` automáticamente
4. **Manejo de Errores**: Distingue entre errores de validación, BD y autenticación
