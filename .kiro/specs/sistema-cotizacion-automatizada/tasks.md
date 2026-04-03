# Plan de Implementación: Sistema de Cotización Automatizada

## Resumen

Este plan implementa un sistema full-stack de cotización automatizada para NSG Latinoamerica E.I.R.L. que permite a los clientes configurar computadoras personalizadas con validación de compatibilidad en tiempo real, recomendaciones de IA, generación de PDFs con códigos de ticket, y panel administrativo para gestión de productos.

**Stack:** Node.js + Express (backend), React + Vite (frontend), PostgreSQL (base de datos)

**Características principales:**
- Validación de compatibilidad de componentes (socket, RAM, form factor, potencia)
- Sistema de tickets para reclamar cotizaciones en tienda
- Asistente IA conversacional con optimización de costos
- Generación dual de PDFs (cotización con precios + listado técnico)
- Gestión de stock con indicador "disponible a pedido"
- Seguridad robusta con encriptación AES-256 y JWT

## Tareas

- [x] 1. Configurar estructura del proyecto y base de datos
  - Crear estructura de carpetas backend/ y frontend/
  - Configurar package.json con dependencias necesarias
  - Implementar schema SQL completo en base-datos/schema.sql
  - Crear archivo de configuración de base de datos (baseDatos.js)
  - Configurar variables de entorno (.env.example)
  - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 14.1, 14.4_

- [x] 1.1 Escribir property test para integridad referencial
  - **Property 25: Integridad referencial**
  - **Valida: Requisitos 11.6**

- [x] 2. Implementar servicios core del backend
  - [x] 2.1 Crear servidor Express con middleware de seguridad
    - Implementar servidor.js con Express, Helmet, CORS, rate limiting
    - Configurar rutas base y health check
    - Implementar manejo centralizado de errores
    - _Requisitos: 14.1_

  - [x] 2.2 Implementar Motor de Compatibilidad
    - Crear servicioCompatibilidad.js con validación de socket
    - Implementar validación de tipo RAM
    - Implementar validación de form factor
    - Implementar cálculo de consumo eléctrico y validación de fuente
    - Implementar identificación de componentes a pedido
    - _Requisitos: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.3 Escribir property tests para Motor de Compatibilidad
    - **Property 5: Filtrado de placas madre por socket**
    - **Valida: Requisitos 3.2**
    - **Property 6: Validación detecta incompatibilidades**
    - **Valida: Requisitos 3.3, 3.4**
    - **Property 7: Configuraciones compatibles pasan validación**
    - **Valida: Requisitos 3.3**

  - [x] 2.4 Escribir unit tests para Motor de Compatibilidad
    - Test: Socket incompatible detectado
    - Test: Fuente insuficiente detectada
    - Test: Form factor incompatible
    - _Requisitos: 3.3, 3.4_

  - [x] 2.5 Implementar Generador de PDF dual
    - Crear servicioPDF.js con generación de PDF de cotización
    - Implementar generación de PDF de listado técnico
    - Incluir logo NSG, código ticket, fechas, componentes
    - Implementar tabla con disponibilidad (stock/a pedido)
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 2.6 Escribir property tests para Generador PDF
    - **Property 15: Generación de PDF produce documento válido**
    - **Valida: Requisitos 7.1**
    - **Property 17: PDF contiene información completa**
    - **Valida: Requisitos 7.4**

  - [x] 2.7 Implementar utilidades de seguridad
    - Crear encriptacion.js con funciones AES-256-CBC
    - Implementar sanitización de inputs con validator
    - Crear funciones de validación de datos
    - _Requisitos: 10.1, 10.2, 10.3, 10.4_

- [x] 3. Checkpoint - Validar servicios core
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [x] 4. Implementar gestión de productos (CRUD)
  - [x] 4.1 Crear controlador de productos
    - Implementar controladorProductos.js con endpoints CRUD
    - Implementar consulta de productos disponibles (stock > 0 O disponible_a_pedido)
    - Implementar filtrado por categoría y socket
    - Incluir middleware de autenticación para operaciones admin
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3_

  - [x] 4.2 Escribir property tests para gestión de productos
    - **Property 1: Creación de productos persiste todos los campos**
    - **Valida: Requisitos 1.1**
    - **Property 2: Actualización de productos modifica valores correctamente**
    - **Valida: Requisitos 1.2, 1.5**
    - **Property 3: Eliminación de productos los remueve de consultas**
    - **Valida: Requisitos 1.3**
    - **Property 4: Productos sin stock aparecen solo si son a pedido**
    - **Valida: Requisitos 2.2**

  - [x] 4.3 Crear rutas de productos
    - Implementar rutas/productos.js con GET, POST, PUT, DELETE
    - Configurar rate limiting específico
    - _Requisitos: 1.1, 1.2, 1.3, 1.4_

- [x] 5. Implementar sistema de autenticación
  - [x] 5.1 Crear servicio de autenticación
    - Implementar servicioAuth.js con login usando bcrypt
    - Implementar generación y verificación de JWT
    - Crear middleware de autenticación para rutas protegidas
    - _Requisitos: 10.1, 10.2, 10.3, 10.4_

  - [x] 5.2 Escribir property tests para autenticación
    - **Property 23: Rutas protegidas requieren autenticación**
    - **Valida: Requisitos 10.1**
    - **Property 24: Autenticación válida retorna token**
    - **Valida: Requisitos 10.3**

  - [x] 5.3 Crear rutas de autenticación
    - Implementar rutas/auth.js con login y verificación
    - Configurar rate limiting estricto para login
    - _Requisitos: 10.1, 10.3_

- [x] 6. Implementar Asistente IA conversacional
  - [x] 6.1 Crear servicio de IA con optimizaciones de costo
    - Implementar asistenteIA.js con integración a Gemini 1.5 Flash
    - Implementar iniciarConversacion con prompt optimizado
    - Implementar continuarConversacion con recopilación de contexto
    - Implementar actualizarContexto para extraer presupuesto y usos
    - Implementar filtrarProductosRelevantes (top 3 por categoría)
    - Implementar generarRecomendacion con validación de stock
    - Implementar cache de recomendaciones con NodeCache
    - Implementar fallback sin IA para errores
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 14.5_

  - [x] 6.2 Escribir property tests para Asistente IA
    - **Property 11: Recomendaciones IA solo productos disponibles**
    - **Valida: Requisitos 5.5**
    - **Property 12: Recomendaciones mapean a productos existentes**
    - **Valida: Requisitos 5.4**
    - **Property 27: Conversación IA recopila información**
    - **Valida: Requisitos 5.3**

  - [x] 6.3 Crear rutas de IA
    - Implementar rutas/ia.js con endpoints iniciar y continuar
    - Configurar rate limiting estricto (5 req/min)
    - _Requisitos: 5.1, 5.2_

- [x] 7. Checkpoint - Validar autenticación e IA
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [x] 8. Implementar sistema de cotizaciones
  - [x] 8.1 Crear controlador de cotizaciones
    - Implementar controladorCotizaciones.js con creación de cotización
    - Implementar generación de código ticket secuencial (NSG-YYYY-NNNN)
    - Implementar cálculo de precio total con margen configurable
    - Implementar persistencia en tablas cotizaciones y detalle_cotizacion
    - Implementar asociación condicional con cliente (por email)
    - Implementar consulta por código ticket
    - Implementar validación de cotización con comparación de precios
    - Implementar marcar cotización como reclamada
    - Implementar consulta de historial por cliente
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 7.3, 7.6, 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 15.1, 15.2, 15.3_

  - [x] 8.2 Escribir property tests para cotizaciones
    - **Property 13: Cálculo de precio total con margen**
    - **Valida: Requisitos 6.1, 6.2**
    - **Property 14: Margen no afecta cotizaciones existentes**
    - **Valida: Requisitos 6.4**
    - **Property 16: Código ticket es único y válido**
    - **Valida: Requisitos 7.3**
    - **Property 18: Persistencia completa de cotización**
    - **Valida: Requisitos 7.6, 8.1, 8.2**
    - **Property 19: Asociación condicional con cliente**
    - **Valida: Requisitos 8.3**
    - **Property 20: Estados de cotización son válidos**
    - **Valida: Requisitos 8.4**
    - **Property 21: Validación retorna comparación de precios**
    - **Valida: Requisitos 9.5, 9.6**
    - **Property 22: Marcar como reclamada actualiza estado**
    - **Valida: Requisitos 9.7**
    - **Property 26: Historial retorna todas las cotizaciones**
    - **Valida: Requisitos 15.2**
    - **Property 28: Código ticket es secuencial por año**
    - **Valida: Requisitos 7.3**

  - [x] 8.3 Escribir unit tests para cotizaciones
    - Test: Cotización caducada detectada
    - Test: Código inválido retorna error
    - Test: Comparación de precios correcta
    - _Requisitos: 9.3, 9.4, 9.5_

  - [x] 8.4 Crear rutas de cotizaciones
    - Implementar rutas/cotizaciones.js con POST, GET por código, PUT reclamar
    - Implementar GET historial por email
    - _Requisitos: 7.1, 9.1, 9.7, 15.2_

  - [x] 8.5 Crear rutas de compatibilidad
    - Implementar rutas/compatibilidad.js con POST validar
    - _Requisitos: 3.3_

- [x] 9. Implementar frontend - Estructura base
  - [x] 9.1 Configurar proyecto React con Vite
    - Inicializar proyecto con Vite
    - Instalar dependencias: Tailwind CSS, Framer Motion, Sileo, Axios
    - Configurar Tailwind CSS
    - Crear estructura de carpetas: componentes/, paginas/, servicios/, contexto/
    - _Requisitos: 12.1, 12.2, 12.3, 13.1, 13.2, 13.3, 14.2, 14.3_

  - [x] 9.2 Crear servicios de API
    - Implementar servicios/api.js con cliente Axios configurado
    - Crear funciones para todos los endpoints del backend
    - Implementar manejo de errores y tokens JWT
    - _Requisitos: 14.2_

  - [x] 9.3 Crear contexto global de aplicación
    - Implementar contexto/AppContext.jsx con estado global
    - Gestionar autenticación, productos, configuración seleccionada
    - _Requisitos: 14.2_

- [x] 10. Checkpoint - Validar backend completo
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [x] 11. Implementar frontend - Sistema Cotizador
  - [x] 11.1 Crear página principal de cotización
    - Implementar paginas/Cotizador.jsx con flujo secuencial
    - Implementar navegación entre pasos (Procesador → Placa → RAM → Almacenamiento → GPU → Fuente → Case)
    - Implementar habilitación condicional de pasos
    - Implementar navegación hacia atrás con revalidación
    - Usar Framer Motion para transiciones
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 13.1_

  - [x] 11.2 Escribir property tests para flujo secuencial
    - **Property 8: Habilitación secuencial de categorías**
    - **Valida: Requisitos 4.2**
    - **Property 9: Navegación hacia atrás permitida**
    - **Valida: Requisitos 4.3**
    - **Property 10: Modificación dispara revalidación**
    - **Valida: Requisitos 4.4**

  - [x] 11.3 Crear componente de selección de componentes
    - Implementar componentes/SelectorComponente.jsx
    - Mostrar solo productos con stock > 0 O disponible_a_pedido
    - Indicar disponibilidad (En Stock / A Pedido con días)
    - Filtrar por compatibilidad (socket, RAM type)
    - _Requisitos: 2.1, 2.2, 2.3, 3.2_

  - [x] 11.4 Crear componente de validación en tiempo real
    - Implementar componentes/ValidadorCompatibilidad.jsx
    - Mostrar errores de incompatibilidad con mensajes descriptivos
    - Mostrar advertencias (fuente ajustada, componentes a pedido)
    - _Requisitos: 3.3, 3.4_

  - [x] 11.5 Crear componente de resumen y precio
    - Implementar componentes/ResumenCotizacion.jsx
    - Mostrar lista de componentes seleccionados
    - Calcular y mostrar precio total con margen
    - Mostrar tiempo de entrega si hay componentes a pedido
    - _Requisitos: 6.1, 6.2_

  - [x] 11.6 Crear componente de Asistente IA
    - Implementar componentes/AsistenteIA.jsx con interfaz conversacional
    - Implementar botón "Ayuda IA" visible
    - Mostrar historial de conversación
    - Aplicar recomendación a configuración actual
    - Usar Sileo para notificaciones
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 13.2, 13.3_

  - [x] 11.7 Crear componente de generación de PDF
    - Implementar componentes/GeneradorPDF.jsx
    - Solicitar email opcional del cliente
    - Generar y descargar ambos PDFs (cotización + listado)
    - Mostrar código ticket generado
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 8.3_

- [x] 12. Implementar frontend - Panel Administrativo
  - [x] 12.1 Crear página de login
    - Implementar paginas/Login.jsx con formulario de autenticación
    - Validar credenciales y almacenar JWT
    - Redirigir a panel admin tras login exitoso
    - _Requisitos: 10.1, 10.2, 10.3_

  - [x] 12.2 Crear página de gestión de productos
    - Implementar paginas/AdminProductos.jsx con tabla de productos
    - Implementar formulario de creación/edición de productos
    - Implementar eliminación con confirmación
    - Implementar actualización de stock en tiempo real
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 12.3 Crear página de configuración
    - Implementar paginas/AdminConfiguracion.jsx
    - Permitir modificar margen de ganancia
    - Mostrar estadísticas de uso de IA (llamadas, costo estimado)
    - _Requisitos: 6.3_

  - [x] 12.4 Crear página de validación de cotizaciones
    - Implementar paginas/ValidadorCotizaciones.jsx
    - Implementar búsqueda por código ticket
    - Mostrar detalle completo con comparación de precios
    - Mostrar diferencia total y disponibilidad actual
    - Implementar botón para marcar como reclamada
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 12.5 Crear componente de protección de rutas
    - Implementar componentes/RutaProtegida.jsx
    - Verificar JWT antes de permitir acceso
    - Redirigir a login si no autenticado
    - _Requisitos: 10.1, 10.2_

- [x] 13. Checkpoint - Validar frontend completo
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [x] 14. Implementar página de historial de cliente
  - [x] 14.1 Crear página de historial
    - Implementar paginas/HistorialCliente.jsx
    - Solicitar email del cliente
    - Mostrar lista de cotizaciones previas
    - Permitir descargar PDFs de cotizaciones anteriores
    - _Requisitos: 15.1, 15.2, 15.3_

- [x] 15. Integración y pruebas end-to-end
  - [x] 15.1 Configurar datos de prueba
    - Crear script de seed para poblar base de datos
    - Insertar productos de ejemplo en todas las categorías
    - Crear usuario administrador de prueba
    - _Requisitos: 11.2, 11.3, 11.4, 11.5_

  - [x] 15.2 Probar flujo completo de cotización
    - Seleccionar componentes paso a paso
    - Validar compatibilidad en tiempo real
    - Generar cotización con PDFs
    - Validar cotización en panel admin
    - Marcar como reclamada
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 3.3, 7.1, 9.1, 9.7_

  - [x] 15.3 Probar flujo de IA conversacional
    - Iniciar conversación con IA
    - Responder preguntas sobre presupuesto y uso
    - Recibir recomendación personalizada
    - Aplicar recomendación y generar cotización
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 15.4 Probar gestión de productos
    - Crear, actualizar y eliminar productos
    - Verificar filtrado por stock y disponibilidad
    - Actualizar margen de ganancia
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 6.3_

  - [x] 15.5 Ejecutar suite completa de property tests
    - Ejecutar todos los property tests con fast-check
    - Verificar cobertura de código (objetivo: >80%)
    - Generar reporte de cobertura

- [x] 16. Checkpoint final - Validación completa del sistema
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [ ] 17. Preparar para despliegue
  - [ ] 17.1 Crear documentación de instalación
    - Documentar instalación de PostgreSQL
    - Documentar configuración de variables de entorno
    - Documentar proceso de build del frontend
    - _Requisitos: 11.1, 14.4_

  - [ ] 17.2 Configurar scripts de producción
    - Crear script de backup de base de datos
    - Configurar PM2 para gestión de procesos
    - Crear docker-compose.yml opcional
    - _Requisitos: 11.1_

  - [ ] 17.3 Implementar auditoría y logging
    - Crear triggers de auditoría en PostgreSQL
    - Implementar logging de acciones críticas
    - Configurar rotación de logs
    - _Requisitos: 11.6_

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de corrección
- Los unit tests validan ejemplos específicos y casos edge
- Todo el código debe estar en español (variables, funciones, comentarios)
- Usar queries parametrizadas para prevenir SQL injection
- Implementar rate limiting en todos los endpoints
- Encriptar datos sensibles (emails, teléfonos) con AES-256
- Optimizar costos de IA con cache, filtrado y prompts compactos

## Dependencias del Proyecto

**Backend:**
```json
{
  "express": "^4.18.2",
  "pg": "^8.11.0",
  "bcrypt": "^5.1.0",
  "jsonwebtoken": "^9.0.0",
  "pdfkit": "^0.13.0",
  "uuid": "^9.0.0",
  "helmet": "^7.0.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^6.7.0",
  "validator": "^13.9.0",
  "@google/generative-ai": "^0.1.0",
  "node-cache": "^5.1.2",
  "dotenv": "^16.0.3"
}
```

**Frontend:**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "vite": "^4.3.0",
  "tailwindcss": "^3.3.0",
  "framer-motion": "^10.12.0",
  "axios": "^1.4.0"
}
```

**Testing:**
```json
{
  "fast-check": "^3.10.0",
  "jest": "^29.5.0",
  "@testing-library/react": "^14.0.0"
}
```
