# Documento de Requisitos

## Introducción

El Sistema de Cotización Automatizada es una aplicación web full-stack que permite a los clientes de NSG Latinoamerica E.I.R.L. cotizar computadoras personalizadas de forma autónoma, validando compatibilidad de componentes y disponibilidad de stock en tiempo real. El sistema genera presupuestos formales en PDF con códigos únicos de validación y proporciona un panel administrativo para gestión de productos y precios.

## Glosario

- **Sistema_Cotizador**: El módulo público que permite a los clientes seleccionar componentes y generar cotizaciones
- **Motor_Compatibilidad**: El componente que valida la compatibilidad técnica entre componentes de hardware
- **Generador_PDF**: El componente que crea documentos de cotización en formato PDF
- **Panel_Administrativo**: La interfaz protegida para gestión de productos, stock y precios
- **Validador_Cotizaciones**: El componente que verifica la vigencia y validez de códigos de cotización
- **Asistente_IA**: El componente que integra APIs de IA para recomendar configuraciones personalizadas
- **Base_Datos**: La base de datos PostgreSQL que almacena productos, cotizaciones y usuarios
- **Cliente**: Usuario final que utiliza el sistema para cotizar computadoras
- **Administrador**: Personal de NSG Latinoamerica con acceso al Panel_Administrativo
- **Vendedor**: Personal de NSG Latinoamerica que valida cotizaciones en tienda
- **Componente**: Pieza de hardware (procesador, RAM, placa madre, etc.)
- **Socket**: Tipo de conexión física del procesador con la placa madre
- **Cotización**: Documento formal con detalle de componentes, precios y código único
- **Código_Único**: Identificador UUID o correlativo que identifica una cotización específica
- **Stock**: Cantidad disponible de un producto en inventario
- **Margen_Ganancia**: Porcentaje configurable aplicado al precio base para calcular precio final

## Requisitos

### Requisito 1: Gestión de Productos

**User Story:** Como Administrador, quiero gestionar el catálogo de productos, para mantener actualizada la información de componentes disponibles.

#### Acceptance Criteria

1. THE Panel_Administrativo SHALL permitir crear nuevos productos con nombre, categoría, socket, precio_base, stock y descripción_técnica
2. THE Panel_Administrativo SHALL permitir actualizar la información de productos existentes
3. THE Panel_Administrativo SHALL permitir eliminar productos del catálogo
4. THE Panel_Administrativo SHALL permitir visualizar todos los productos registrados
5. WHEN el Administrador actualiza el stock de un producto, THE Base_Datos SHALL registrar el nuevo valor inmediatamente

### Requisito 2: Control de Stock en Selección

**User Story:** Como Cliente, quiero ver solo componentes disponibles, para no seleccionar productos sin stock.

#### Acceptance Criteria

1. WHEN el Cliente accede al Sistema_Cotizador, THE Sistema_Cotizador SHALL consultar el stock actual en Base_Datos
2. IF el stock de un Componente es cero, THEN THE Sistema_Cotizador SHALL ocultar ese Componente de las opciones de selección
3. WHEN el stock de un Componente cambia a cero durante la sesión, THE Sistema_Cotizador SHALL actualizar la vista y remover ese Componente de las opciones disponibles

### Requisito 3: Validación de Compatibilidad de Componentes

**User Story:** Como Cliente, quiero que el sistema valide la compatibilidad entre componentes, para asegurar que mi configuración funcione correctamente.

#### Acceptance Criteria

1. WHEN el Cliente selecciona un procesador, THE Motor_Compatibilidad SHALL registrar el socket del procesador seleccionado
2. WHEN el Cliente procede a seleccionar placa madre, THE Motor_Compatibilidad SHALL filtrar y mostrar únicamente placas madre con socket compatible
3. THE Motor_Compatibilidad SHALL validar compatibilidad entre todos los componentes seleccionados antes de generar la cotización
4. IF existe incompatibilidad entre componentes, THEN THE Sistema_Cotizador SHALL mostrar un mensaje descriptivo del conflicto

### Requisito 4: Flujo de Selección Secuencial

**User Story:** Como Cliente, quiero seguir un proceso guiado de selección, para construir mi computadora paso a paso.

#### Acceptance Criteria

1. THE Sistema_Cotizador SHALL presentar las categorías en el orden: Procesador, Placa Madre, RAM, Almacenamiento, GPU, Fuente de Poder, Case
2. WHEN el Cliente completa la selección de una categoría, THE Sistema_Cotizador SHALL habilitar la siguiente categoría
3. THE Sistema_Cotizador SHALL permitir al Cliente regresar a categorías anteriores para modificar su selección
4. WHEN el Cliente modifica un Componente previamente seleccionado, THE Motor_Compatibilidad SHALL revalidar la compatibilidad de todos los componentes posteriores

### Requisito 5: Recomendaciones con Inteligencia Artificial

**User Story:** Como Cliente, quiero recibir recomendaciones personalizadas basadas en mi perfil de uso, para obtener una configuración óptima.

#### Acceptance Criteria

1. THE Sistema_Cotizador SHALL proporcionar un botón de "Ayuda IA" visible en la interfaz de selección
2. WHEN el Cliente activa "Ayuda IA", THE Sistema_Cotizador SHALL solicitar una descripción del perfil de uso
3. WHEN el Cliente proporciona su perfil, THE Asistente_IA SHALL enviar una consulta a la API de IA con el perfil del Cliente y el catálogo disponible
4. THE Asistente_IA SHALL recibir recomendaciones de la API de IA y presentarlas al Cliente con componentes específicos de Base_Datos
5. THE Asistente_IA SHALL recomendar únicamente componentes que existan en Base_Datos y tengan stock disponible

### Requisito 6: Cálculo de Precio Total

**User Story:** Como Administrador, quiero configurar el margen de ganancia, para controlar la rentabilidad de las cotizaciones.

#### Acceptance Criteria

1. THE Sistema_Cotizador SHALL calcular el precio total sumando los precios_base de todos los componentes seleccionados
2. THE Sistema_Cotizador SHALL aplicar el Margen_Ganancia configurable al precio total
3. THE Panel_Administrativo SHALL permitir al Administrador modificar el Margen_Ganancia
4. WHEN el Margen_Ganancia cambia, THE Sistema_Cotizador SHALL aplicar el nuevo margen a cotizaciones futuras sin afectar cotizaciones existentes

### Requisito 7: Generación de Presupuesto en PDF

**User Story:** Como Cliente, quiero descargar un presupuesto formal en PDF, para presentarlo en tienda o guardarlo para referencia.

#### Acceptance Criteria

1. WHEN el Cliente finaliza la selección de componentes, THE Generador_PDF SHALL crear un documento PDF con el presupuesto
2. THE Generador_PDF SHALL incluir el logo de NSG Latinoamerica en el PDF
3. THE Generador_PDF SHALL generar un Código_Único para la cotización
4. THE Generador_PDF SHALL incluir en el PDF: Código_Único, fecha de emisión, fecha de caducidad (3 días desde emisión), detalle técnico de cada Componente y precio total
5. THE Generador_PDF SHALL permitir al Cliente descargar el PDF inmediatamente
6. WHEN se genera el PDF, THE Base_Datos SHALL registrar la cotización con estado "Pendiente"

### Requisito 8: Almacenamiento de Cotizaciones

**User Story:** Como Sistema, necesito almacenar las cotizaciones generadas, para permitir su validación posterior.

#### Acceptance Criteria

1. WHEN se genera una cotización, THE Base_Datos SHALL crear un registro en la tabla cotizaciones con Código_Único, fecha_emision, fecha_validez y precio_total
2. THE Base_Datos SHALL crear registros en detalle_cotizacion para cada Componente incluido con su precio_unitario al momento de la cotización
3. THE Base_Datos SHALL asociar la cotización con el Cliente si este proporciona su correo electrónico
4. THE Base_Datos SHALL almacenar el estado de la cotización como "Pendiente" o "Completada"

### Requisito 9: Validación de Cotizaciones en Tienda

**User Story:** Como Vendedor, quiero validar cotizaciones de clientes, para verificar su vigencia y detectar cambios de precio.

#### Acceptance Criteria

1. THE Validador_Cotizaciones SHALL proporcionar una interfaz donde el Vendedor ingresa el Código_Único
2. WHEN el Vendedor ingresa un Código_Único, THE Validador_Cotizaciones SHALL buscar la cotización en Base_Datos
3. IF la cotización no existe, THEN THE Validador_Cotizaciones SHALL mostrar mensaje "Código de cotización no válido"
4. IF la fecha actual excede la fecha_validez, THEN THE Validador_Cotizaciones SHALL mostrar mensaje "Cotización caducada"
5. WHEN se encuentra una cotización válida, THE Validador_Cotizaciones SHALL comparar los precios actuales de cada Componente con los precios almacenados en detalle_cotizacion
6. THE Validador_Cotizaciones SHALL mostrar al Vendedor: detalle completo de componentes, precio original, precio actual de cada Componente y diferencia total si existe
7. THE Validador_Cotizaciones SHALL permitir al Vendedor marcar la cotización como "Completada"

### Requisito 10: Autenticación del Panel Administrativo

**User Story:** Como Administrador, quiero que el panel administrativo esté protegido, para evitar accesos no autorizados.

#### Acceptance Criteria

1. THE Panel_Administrativo SHALL requerir autenticación antes de permitir acceso
2. WHEN un usuario intenta acceder al Panel_Administrativo sin autenticación, THE Panel_Administrativo SHALL redirigir a la página de inicio de sesión
3. THE Panel_Administrativo SHALL validar credenciales contra Base_Datos
4. IF las credenciales son incorrectas, THEN THE Panel_Administrativo SHALL mostrar mensaje de error y no permitir acceso

### Requisito 11: Persistencia de Datos

**User Story:** Como Sistema, necesito almacenar datos de forma confiable, para garantizar la integridad de la información.

#### Acceptance Criteria

1. THE Base_Datos SHALL utilizar PostgreSQL como motor de base de datos relacional
2. THE Base_Datos SHALL implementar la tabla productos con columnas: id, nombre, categoria, socket, precio_base, stock, descripcion_tecnica
3. THE Base_Datos SHALL implementar la tabla usuarios_clientes con columnas: id, nombre, correo, historial_cotizaciones
4. THE Base_Datos SHALL implementar la tabla cotizaciones con columnas: id, codigo_unico, id_cliente, fecha_emision, fecha_validez, precio_total, estado
5. THE Base_Datos SHALL implementar la tabla detalle_cotizacion con columnas: id, id_cotizacion, id_producto, precio_unitario
6. THE Base_Datos SHALL establecer relaciones de clave foránea entre tablas para mantener integridad referencial

### Requisito 12: Interfaz de Usuario Responsiva

**User Story:** Como Cliente, quiero acceder al sistema desde cualquier dispositivo, para cotizar desde mi computadora o teléfono móvil.

#### Acceptance Criteria

1. THE Sistema_Cotizador SHALL utilizar Tailwind CSS para diseño de interfaces
2. THE Sistema_Cotizador SHALL adaptar la interfaz a diferentes tamaños de pantalla (móvil, tablet, escritorio)
3. THE Sistema_Cotizador SHALL mantener funcionalidad completa en todos los tamaños de pantalla

### Requisito 13: Experiencia de Usuario Mejorada

**User Story:** Como Cliente, quiero una interfaz fluida y con retroalimentación visual, para tener una experiencia agradable.

#### Acceptance Criteria

1. THE Sistema_Cotizador SHALL utilizar Framer Motion para animaciones de transición entre pasos
2. THE Sistema_Cotizador SHALL utilizar Sileo para mostrar notificaciones de éxito, error o información
3. WHEN el Cliente completa una acción, THE Sistema_Cotizador SHALL mostrar retroalimentación visual inmediata

### Requisito 14: Arquitectura Tecnológica

**User Story:** Como Desarrollador, necesito implementar el sistema con tecnologías específicas, para cumplir con los requisitos del proyecto de titulación.

#### Acceptance Criteria

1. THE Sistema_Cotizador SHALL implementar el backend con Node.js y Express
2. THE Sistema_Cotizador SHALL implementar el frontend con React utilizando sintaxis JSX
3. THE Sistema_Cotizador SHALL utilizar Vite como herramienta de construcción para el frontend
4. THE Sistema_Cotizador SHALL conectarse a Base_Datos PostgreSQL mediante un cliente de Node.js
5. THE Asistente_IA SHALL integrarse con API de Gemini o OpenAI para procesamiento de lenguaje natural

### Requisito 15: Historial de Cotizaciones del Cliente

**User Story:** Como Cliente registrado, quiero ver mis cotizaciones anteriores, para consultar presupuestos previos.

#### Acceptance Criteria

1. WHERE el Cliente proporciona su correo electrónico, THE Sistema_Cotizador SHALL asociar la cotización con el registro del Cliente en Base_Datos
2. WHERE el Cliente está registrado, THE Sistema_Cotizador SHALL mostrar el historial de cotizaciones previas
3. THE Sistema_Cotizador SHALL permitir al Cliente descargar nuevamente el PDF de cotizaciones anteriores
