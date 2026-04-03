# Demo: Página Cotizador

## Flujo de Usuario Completo

### Paso 1: Inicio - Selección de Procesador

```
┌─────────────────────────────────────────────────────────────┐
│                    Cotizador de PC                          │
│              Configura tu computadora paso a paso           │
└─────────────────────────────────────────────────────────────┘

Indicador de Pasos:
[1●] ─── [2○] ─── [3○] ─── [4○] ─── [5○] ─── [6○] ─── [7○]
Proc   Placa   RAM   Almac   GPU   Fuente  Case

┌─────────────────────────────────────────────────────────────┐
│ Procesador                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Intel Core   │  │ AMD Ryzen 5  │  │ Intel Core   │    │
│  │ i5-13400F    │  │ 5600X        │  │ i7-13700K    │    │
│  │              │  │              │  │              │    │
│  │ S/ 1,200.00  │  │ S/ 1,000.00  │  │ S/ 2,500.00  │    │
│  │ Stock: 5     │  │ Stock: 3     │  │ A pedido     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

[← Anterior]  Precio total: S/ 0.00  [Siguiente →]
(deshabilitado)                       (deshabilitado)
```

### Paso 2: Usuario Selecciona Procesador

```
┌─────────────────────────────────────────────────────────────┐
│ Procesador                                                  │
├─────────────────────────────────────────────────────────────┤
│ ✓ Selección actual:                                        │
│   Intel Core i5-13400F                                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Intel Core   │  │ AMD Ryzen 5  │  │ Intel Core   │    │
│  │ i5-13400F ✓  │  │ 5600X        │  │ i7-13700K    │    │
│  │ [SELECCIONADO]│  │              │  │              │    │
│  │ S/ 1,200.00  │  │ S/ 1,000.00  │  │ S/ 2,500.00  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘

[← Anterior]  Precio total: S/ 1,440.00  [Siguiente →]
(deshabilitado)    (con margen 20%)      (HABILITADO)
```

### Paso 3: Avanza a Placa Madre (Filtrada por Socket)

```
Indicador de Pasos:
[1✓] ─── [2●] ─── [3○] ─── [4○] ─── [5○] ─── [6○] ─── [7○]
Proc   Placa   RAM   Almac   GPU   Fuente  Case

┌─────────────────────────────────────────────────────────────┐
│ Placa Madre                                                 │
├─────────────────────────────────────────────────────────────┤
│ ℹ️ Mostrando solo placas compatibles con socket LGA1700    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ ASUS PRIME   │  │ MSI PRO      │  │ Gigabyte     │    │
│  │ B760M-A      │  │ B760M-A      │  │ Z790 AORUS   │    │
│  │ LGA1700      │  │ LGA1700      │  │ LGA1700      │    │
│  │ S/ 600.00    │  │ S/ 550.00    │  │ S/ 1,200.00  │    │
│  │ Stock: 8     │  │ Stock: 4     │  │ Stock: 2     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘

[← Anterior]  Precio total: S/ 1,440.00  [Siguiente →]
(HABILITADO)                              (deshabilitado)
```

### Paso 4: Selecciona Placa Madre

```
┌─────────────────────────────────────────────────────────────┐
│ Placa Madre                                                 │
├─────────────────────────────────────────────────────────────┤
│ ✓ Selección actual:                                        │
│   ASUS PRIME B760M-A                                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ ASUS PRIME   │  │ MSI PRO      │  │ Gigabyte     │    │
│  │ B760M-A ✓    │  │ B760M-A      │  │ Z790 AORUS   │    │
│  │ [SELECCIONADO]│  │ LGA1700      │  │ LGA1700      │    │
│  │ S/ 600.00    │  │ S/ 550.00    │  │ S/ 1,200.00  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘

[← Anterior]  Precio total: S/ 2,160.00  [Siguiente →]
(HABILITADO)      (1200 + 600) * 1.2     (HABILITADO)
```

### Paso 5: Selección de RAM (Múltiple)

```
Indicador de Pasos:
[1✓] ─── [2✓] ─── [3●] ─── [4○] ─── [5○] ─── [6○] ─── [7○]
Proc   Placa   RAM   Almac   GPU   Fuente  Case

┌─────────────────────────────────────────────────────────────┐
│ RAM                                                         │
├─────────────────────────────────────────────────────────────┤
│ ✓ Selección actual:                                        │
│   • Kingston Fury 16GB DDR4 3200MHz [Eliminar]            │
│   • Kingston Fury 16GB DDR4 3200MHz [Eliminar]            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Kingston     │  │ Corsair      │  │ G.Skill      │    │
│  │ Fury 16GB    │  │ Vengeance    │  │ Ripjaws      │    │
│  │ DDR4 3200MHz │  │ 32GB DDR4    │  │ 16GB DDR4    │    │
│  │ S/ 300.00    │  │ S/ 550.00    │  │ S/ 320.00    │    │
│  │ Stock: 12    │  │ Stock: 5     │  │ Stock: 8     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘

[← Anterior]  Precio total: S/ 2,880.00  [Siguiente →]
                (1200+600+300+300)*1.2
```

### Paso 6: Error de Compatibilidad Detectado

```
Indicador de Pasos:
[1✓] ─── [2✓] ─── [3✓] ─── [4✓] ─── [5✓] ─── [6●] ─── [7○]

┌─────────────────────────────────────────────────────────────┐
│ Fuente de Poder                                             │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ Problemas de compatibilidad:                            │
│   • Fuente insuficiente: requiere 520W, tiene 450W        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Corsair      │  │ EVGA 650W    │  │ Thermaltake  │    │
│  │ CV450 ❌     │  │ 80+ Gold ✓   │  │ 750W 80+     │    │
│  │ 450W         │  │ 650W         │  │ 750W         │    │
│  │ S/ 200.00    │  │ S/ 400.00    │  │ S/ 500.00    │    │
│  │ [INCOMPATIBLE]│  │ Stock: 6     │  │ Stock: 3     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Paso 7: Configuración Completa

```
Indicador de Pasos:
[1✓] ─── [2✓] ─── [3✓] ─── [4✓] ─── [5✓] ─── [6✓] ─── [7✓]
Proc   Placa   RAM   Almac   GPU   Fuente  Case

┌─────────────────────────────────────────────────────────────┐
│ Case                                                        │
├─────────────────────────────────────────────────────────────┤
│ ✓ Selección actual:                                        │
│   NZXT H510 Flow ATX Mid Tower                             │
├─────────────────────────────────────────────────────────────┤
│ ℹ️ Advertencias:                                            │
│   • Componentes a pedido: 7 días de entrega                │
└─────────────────────────────────────────────────────────────┘

[← Anterior]  Precio total: S/ 6,240.00  [Siguiente →]
                                          (deshabilitado)

┌─────────────────────────────────────────────────────────────┐
│                  [Generar Cotización]                       │
│                   (Botón verde grande)                      │
└─────────────────────────────────────────────────────────────┘
```

## Animaciones

### Transición entre Pasos
```
Paso 1 → Paso 2:
  Paso 1: opacity 1 → 0, x: 0 → -50 (sale por la izquierda)
  Paso 2: opacity 0 → 1, x: 50 → 0 (entra por la derecha)
  Duración: 300ms
```

### Tarjetas de Productos
```
Aparición escalonada:
  Tarjeta 1: delay 0ms
  Tarjeta 2: delay 50ms
  Tarjeta 3: delay 100ms
  ...
  
  Animación: opacity 0 → 1, y: 20 → 0
  Duración: 300ms por tarjeta
```

### Botón Finalizar
```
Aparición:
  opacity 0 → 1
  y: 20 → 0
  Duración: 400ms
```

## Estados Visuales

### Indicador de Pasos

| Estado | Visual | Descripción |
|--------|--------|-------------|
| Actual | 🔵 Azul con escala 110% | Paso en el que está el usuario |
| Completado | 🟢 Verde con ✓ | Paso completado, clickeable |
| Habilitado | ⚪ Gris claro | Paso disponible pero no completado |
| Deshabilitado | ⚫ Gris oscuro | Paso bloqueado, no clickeable |

### Tarjetas de Productos

| Estado | Borde | Fondo | Descripción |
|--------|-------|-------|-------------|
| Normal | Gris | Blanco | Producto no seleccionado |
| Hover | Azul | Blanco | Mouse sobre el producto |
| Seleccionado | Azul | Azul claro | Producto seleccionado |

### Disponibilidad

| Estado | Badge | Color |
|--------|-------|-------|
| En Stock | "Stock: X" | Verde |
| A Pedido | "A pedido" | Amarillo |
| Sin Stock | "Sin stock" | Rojo |

## Responsive Breakpoints

### Móvil (< 768px)
```
┌─────────────┐
│  Producto 1 │
├─────────────┤
│  Producto 2 │
├─────────────┤
│  Producto 3 │
└─────────────┘
1 columna
```

### Tablet (768px - 1024px)
```
┌──────────┬──────────┐
│ Prod. 1  │ Prod. 2  │
├──────────┼──────────┤
│ Prod. 3  │ Prod. 4  │
└──────────┴──────────┘
2 columnas
```

### Desktop (> 1024px)
```
┌────────┬────────┬────────┐
│ Prod 1 │ Prod 2 │ Prod 3 │
├────────┼────────┼────────┤
│ Prod 4 │ Prod 5 │ Prod 6 │
└────────┴────────┴────────┘
3 columnas
```

## Interacciones del Usuario

### Click en Producto
1. Usuario hace click en tarjeta de producto
2. Se llama a `manejarSeleccion(producto)`
3. Si es RAM: se agrega al array
4. Si es otro componente: se reemplaza la selección
5. Se actualiza el indicador visual
6. Se habilita el botón "Siguiente"
7. Se valida compatibilidad automáticamente

### Click en Paso Completado
1. Usuario hace click en círculo de paso completado
2. Se verifica que el paso esté habilitado
3. Se actualiza `pasoActual`
4. Se anima la transición al nuevo paso
5. Se mantienen las selecciones previas

### Click en Botón Siguiente
1. Usuario hace click en "Siguiente →"
2. Se verifica que el paso actual esté completo
3. Se incrementa `pasoActual`
4. Se anima la transición
5. Se cargan productos del nuevo paso
6. Se aplican filtros de compatibilidad

### Click en Botón Anterior
1. Usuario hace click en "← Anterior"
2. Se decrementa `pasoActual`
3. Se anima la transición
4. Se muestran las selecciones previas

## Validación de Compatibilidad

### Flujo de Validación
```
1. Usuario selecciona componente
   ↓
2. useEffect detecta cambio en configuracionSeleccionada
   ↓
3. Se llama a validarCompatibilidad()
   ↓
4. Backend valida:
   - Socket procesador-placa
   - Tipo RAM-placa
   - Form factor placa-case
   - Consumo-fuente
   ↓
5. Se actualiza validacionCompatibilidad
   ↓
6. Se muestran errores/advertencias en UI
```

### Tipos de Mensajes

**Errores (Bloquean cotización):**
- ❌ Socket incompatible: AM5 vs LGA1700
- ❌ RAM incompatible: Placa soporta DDR4, seleccionado DDR5
- ❌ Case no soporta Micro-ATX
- ❌ Fuente insuficiente: requiere 520W, tiene 450W

**Advertencias (No bloquean):**
- ⚠️ Margen ajustado: recomendado 600W
- ⚠️ Componentes a pedido: 7 días de entrega
- ℹ️ GPU de gama alta, considere mejor procesador

## Cálculo de Precio

### Fórmula
```
Precio Base = Suma de precios_base de todos los componentes
Precio Total = Precio Base × (1 + Margen / 100)

Ejemplo:
  Procesador: S/ 1,200
  Placa: S/ 600
  RAM: S/ 300 × 2 = S/ 600
  Almacenamiento: S/ 400
  GPU: S/ 1,500
  Fuente: S/ 400
  Case: S/ 200
  ─────────────────
  Base: S/ 4,900
  Margen 20%: S/ 980
  ─────────────────
  Total: S/ 5,880
```

### Actualización en Tiempo Real
- Se recalcula con cada selección
- Se muestra en la parte inferior central
- Formato: S/ X,XXX.XX (2 decimales)
- Color verde para destacar

## Conclusión

Este demo muestra el flujo completo de usuario desde la selección del primer componente hasta la generación de la cotización, incluyendo:

✅ Navegación secuencial intuitiva
✅ Validación de compatibilidad en tiempo real
✅ Mensajes claros de error y advertencia
✅ Animaciones suaves y profesionales
✅ Diseño responsive
✅ Cálculo de precio en tiempo real
✅ Indicadores visuales claros
