# Demo: ValidadorCompatibilidad

Este documento muestra cómo el componente `ValidadorCompatibilidad` se integra en el flujo de cotización.

## Flujo de Validación en Tiempo Real

```
Usuario selecciona Procesador (AM4)
    ↓
Usuario selecciona Placa Madre (AM4) ✓
    ↓
ValidadorCompatibilidad: No muestra nada (compatible)
    ↓
Usuario selecciona RAM (DDR4) ✓
    ↓
ValidadorCompatibilidad: No muestra nada (compatible)
    ↓
Usuario selecciona GPU (RTX 4090, 450W TDP)
    ↓
Usuario selecciona Fuente (500W)
    ↓
ValidadorCompatibilidad: ⚠️ "Margen ajustado: recomendado 600W"
```

## Ejemplo de Incompatibilidad

```
Usuario selecciona Procesador (AM4)
    ↓
Usuario selecciona Placa Madre (LGA1700) ✗
    ↓
ValidadorCompatibilidad: ❌ "Socket incompatible: AM4 vs LGA1700"
    ↓
Botón "Continuar" deshabilitado
```

## Integración con Cotizador.jsx

```jsx
import { useState, useEffect } from 'react';
import SelectorComponente from '../componentes/SelectorComponente';
import ValidadorCompatibilidad from '../componentes/ValidadorCompatibilidad';
import { validarCompatibilidad } from '../servicios/api';

function Cotizador() {
  const [paso, setPaso] = useState(0);
  const [componentes, setComponentes] = useState({
    procesador: null,
    placa_madre: null,
    ram: [],
    almacenamiento: null,
    gpu: null,
    fuente: null,
    case: null
  });
  const [validacion, setValidacion] = useState(null);

  // Validar automáticamente cuando cambian los componentes
  useEffect(() => {
    const validar = async () => {
      const seleccionados = Object.values(componentes).filter(
        c => c !== null && (Array.isArray(c) ? c.length > 0 : true)
      );

      if (seleccionados.length < 2) {
        setValidacion(null);
        return;
      }

      try {
        const resultado = await validarCompatibilidad(componentes);
        setValidacion(resultado);
      } catch (error) {
        console.error('Error al validar:', error);
      }
    };

    validar();
  }, [componentes]);

  const pasos = [
    { nombre: 'Procesador', categoria: 'procesador' },
    { nombre: 'Placa Madre', categoria: 'placa_madre' },
    { nombre: 'RAM', categoria: 'ram' },
    { nombre: 'Almacenamiento', categoria: 'almacenamiento' },
    { nombre: 'GPU', categoria: 'gpu' },
    { nombre: 'Fuente', categoria: 'fuente' },
    { nombre: 'Case', categoria: 'case' }
  ];

  const pasoActual = pasos[paso];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Cotizador de PC</h1>

      {/* Indicador de pasos */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {pasos.map((p, i) => (
            <div
              key={i}
              className={`flex-1 text-center ${
                i === paso ? 'font-bold text-blue-600' : 'text-gray-400'
              }`}
            >
              {p.nombre}
            </div>
          ))}
        </div>
      </div>

      {/* Validador de compatibilidad - Siempre visible */}
      <ValidadorCompatibilidad
        resultadoValidacion={validacion}
        mostrar={true}
        className="mb-6"
      />

      {/* Selector del paso actual */}
      <SelectorComponente
        categoria={pasoActual.categoria}
        productos={productos}
        seleccionActual={componentes[pasoActual.categoria]}
        onSeleccionar={(producto) => {
          setComponentes(prev => ({
            ...prev,
            [pasoActual.categoria]: producto
          }));
        }}
        filtrosCompatibilidad={obtenerFiltros(pasoActual.categoria, componentes)}
      />

      {/* Botones de navegación */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setPaso(paso - 1)}
          disabled={paso === 0}
          className="px-6 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Anterior
        </button>

        <button
          onClick={() => setPaso(paso + 1)}
          disabled={
            paso === pasos.length - 1 ||
            !componentes[pasoActual.categoria] ||
            (validacion && !validacion.compatible)
          }
          className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {paso === pasos.length - 1 ? 'Finalizar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}

function obtenerFiltros(categoria, componentes) {
  const filtros = {};

  // Filtrar placa madre por socket del procesador
  if (categoria === 'placa_madre' && componentes.procesador) {
    filtros.socket = componentes.procesador.socket;
  }

  // Filtrar RAM por tipo de la placa madre
  if (categoria === 'ram' && componentes.placa_madre) {
    filtros.ramType = componentes.placa_madre.ram_type;
  }

  return filtros;
}
```

## Casos de Uso

### 1. Configuración Compatible sin Advertencias

**Componentes:**
- Procesador: Ryzen 5 5600X (AM4, 65W TDP)
- Placa Madre: ASUS B550 (AM4, DDR4)
- RAM: Corsair 16GB DDR4
- GPU: RTX 3060 (170W TDP)
- Fuente: Corsair 650W

**Resultado:**
```javascript
{
  compatible: true,
  errores: [],
  advertencias: []
}
```

**UI:** No muestra nada (todo perfecto)

---

### 2. Configuración Compatible con Advertencias

**Componentes:**
- Procesador: Ryzen 9 5950X (AM4, 105W TDP)
- Placa Madre: ASUS B550 (AM4, DDR4)
- RAM: Corsair 32GB DDR4
- GPU: RTX 4090 (450W TDP)
- Fuente: Corsair 650W

**Resultado:**
```javascript
{
  compatible: true,
  errores: [],
  advertencias: [
    '⚠️ Margen ajustado: recomendado 750W'
  ]
}
```

**UI:** Panel amarillo con advertencia

---

### 3. Socket Incompatible

**Componentes:**
- Procesador: Intel i5-13400 (LGA1700)
- Placa Madre: ASUS B550 (AM4)

**Resultado:**
```javascript
{
  compatible: false,
  errores: [
    '❌ Socket incompatible: LGA1700 vs AM4'
  ],
  advertencias: []
}
```

**UI:** Panel rojo con error, botón "Siguiente" deshabilitado

---

### 4. RAM Incompatible

**Componentes:**
- Procesador: Intel i5-13400 (LGA1700)
- Placa Madre: MSI Z690 (LGA1700, DDR5)
- RAM: Corsair 16GB DDR4

**Resultado:**
```javascript
{
  compatible: false,
  errores: [
    '❌ RAM incompatible: Placa soporta DDR5, seleccionado DDR4'
  ],
  advertencias: []
}
```

**UI:** Panel rojo con error

---

### 5. Fuente Insuficiente

**Componentes:**
- Procesador: Ryzen 9 5950X (105W TDP)
- GPU: RTX 4090 (450W TDP)
- Fuente: Corsair 500W

**Resultado:**
```javascript
{
  compatible: false,
  errores: [
    '❌ Fuente insuficiente: requiere 650W, tiene 500W'
  ],
  advertencias: []
}
```

**UI:** Panel rojo con error

---

### 6. Múltiples Problemas

**Componentes:**
- Procesador: Intel i5-13400 (LGA1700)
- Placa Madre: ASUS B550 (AM4, DDR4)
- RAM: Corsair 16GB DDR5
- GPU: RTX 4090 (450W TDP)
- Fuente: Corsair 500W

**Resultado:**
```javascript
{
  compatible: false,
  errores: [
    '❌ Socket incompatible: LGA1700 vs AM4',
    '❌ RAM incompatible: Placa soporta DDR4, seleccionado DDR5',
    '❌ Fuente insuficiente: requiere 650W, tiene 500W'
  ],
  advertencias: []
}
```

**UI:** Panel rojo con 3 errores listados

---

### 7. Componentes a Pedido

**Componentes:**
- Procesador: Ryzen 9 7950X (stock: 0, a_pedido: true, 10 días)
- Placa Madre: ASUS X670E (stock: 2)
- RAM: G.Skill 64GB DDR5 (stock: 0, a_pedido: true, 7 días)

**Resultado:**
```javascript
{
  compatible: true,
  errores: [],
  advertencias: [
    '⚠️ Componentes a pedido: 10 días de entrega'
  ]
}
```

**UI:** Panel amarillo con advertencia de tiempo de entrega

---

## Beneficios

1. **Feedback Inmediato**: El usuario ve errores en tiempo real
2. **Prevención de Errores**: No puede avanzar con configuración incompatible
3. **Educativo**: Mensajes descriptivos explican por qué hay incompatibilidad
4. **UX Mejorada**: Colores y iconos claros (rojo = error, amarillo = advertencia)
5. **Transparencia**: Informa sobre componentes a pedido y tiempos de entrega

## Notas de Implementación

- La validación se ejecuta automáticamente con `useEffect`
- Solo valida si hay al menos 2 componentes seleccionados
- El botón "Siguiente" se deshabilita si `compatible === false`
- Las advertencias no bloquean el avance (solo informan)
- Los errores sí bloquean el avance (requieren corrección)
