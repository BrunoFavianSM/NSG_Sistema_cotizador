# Documento de Diseño Técnico

## Overview

El Sistema de Cotización Automatizada es una aplicación web full-stack que permite a los clientes de NSG Latinoamerica E.I.R.L. configurar y cotizar computadoras personalizadas de manera autónoma. El sistema valida compatibilidad de componentes en tiempo real, verifica disponibilidad de stock, genera presupuestos formales en PDF con códigos únicos de validación, y proporciona un panel administrativo para gestión de productos y precios.

### Objetivos del Sistema

- Automatizar el proceso de cotización de computadoras personalizadas
- Validar compatibilidad técnica entre componentes de hardware
- Garantizar que solo se ofrezcan productos con stock disponible o a pedido
- Generar documentos formales de cotización con sistema de tickets
- Proporcionar recomendaciones inteligentes mediante IA conversacional
- Facilitar la validación de cotizaciones en tienda física mediante códigos ticket
- Mantener historial de cotizaciones por cliente
- Proteger datos sensibles con encriptación

### Alcance

El sistema cubre:
- Interfaz pública de cotización para clientes
- Panel administrativo protegido para gestión de productos
- Motor de validación de compatibilidad de hardware
- Generación de dos tipos de PDFs (cotización y listado técnico)
- Integración con APIs de IA con flujo conversacional
- Sistema de tickets para reclamar pedidos en tienda
- Gestión de stock en tiempo real con indicador "disponible a pedido"
- Seguridad robusta con encriptación de datos sensibles


## Architecture

### Arquitectura General

```
CAPA DE PRESENTACIÓN
├── Sistema Cotizador (React + Vite)
└── Panel Administrativo (React + Vite)
         ↓ HTTP/REST
CAPA DE APLICACIÓN (Node.js + Express)
├── API REST
├── Motor de Compatibilidad
├── Generador PDF (dual: cotización + listado)
├── Asistente IA Conversacional
├── Validador de Cotizaciones (sistema tickets)
└── Auth Service
         ↓ SQL
CAPA DE DATOS (PostgreSQL)
├── productos (con disponible_a_pedido)
├── cotizaciones (con codigo_ticket)
├── detalle_cotizacion
├── usuarios_clientes
├── administradores
└── conversaciones_ia
```

### Stack Tecnológico

**Frontend:** React 18+, Vite, Tailwind CSS, Framer Motion, Sileo, Axios  
**Backend:** Node.js 18+, Express, pg, jsonwebtoken, bcrypt, pdfkit, uuid  
**Base de Datos:** PostgreSQL 14+  
**APIs Externas:** Google Gemini API o OpenAI API  
**Seguridad:** Helmet, express-rate-limit, validator, crypto (AES-256)  
**Escalabilidad:** Redis (cache), Bull (queues), PM2 (process manager)


### Estructura de Carpetas (Nombres en Español)

```
sistema-cotizacion-nsg/
├── backend/
│   ├── src/
│   │   ├── configuracion/
│   │   │   └── baseDatos.js
│   │   ├── controladores/
│   │   │   ├── controladorProductos.js
│   │   │   ├── controladorCotizaciones.js
│   │   │   └── controladorAuth.js
│   │   ├── servicios/
│   │   │   ├── servicioCompatibilidad.js
│   │   │   ├── servicioPDF.js
│   │   │   └── asistenteIA.js
│   │   ├── modelos/
│   │   ├── rutas/
│   │   ├── middleware/
│   │   ├── utilidades/
│   │   └── servidor.js
│   └── pruebas/
├── frontend/
│   ├── src/
│   │   ├── componentes/
│   │   ├── paginas/
│   │   ├── servicios/
│   │   └── contexto/
│   └── public/
└── base-datos/
    └── schema.sql
```


## Components and Interfaces

### Endpoints API REST

```javascript
// Productos
GET    /api/productos
POST   /api/productos (admin)
PUT    /api/productos/:id (admin)
DELETE /api/productos/:id (admin)

// Cotizaciones
POST   /api/cotizaciones
GET    /api/cotizaciones/:codigoTicket
PUT    /api/cotizaciones/:codigoTicket/reclamar
GET    /api/cotizaciones/cliente/:email

// Compatibilidad
POST   /api/compatibilidad/validar

// IA Conversacional
POST   /api/ia/iniciar
POST   /api/ia/continuar

// Auth
POST   /api/auth/login
POST   /api/auth/verificar
```

### Componentes Clave

**1. Motor de Compatibilidad**
- Valida socket procesador-placa madre
- Valida tipo RAM con placa madre
- Valida form factor placa-case
- Calcula consumo eléctrico y valida fuente
- Identifica componentes a pedido

**2. Asistente IA Conversacional**
- Hace 3-5 preguntas para entender necesidades
- Recopila: presupuesto, uso, preferencias
- Genera recomendación personalizada
- Solo recomienda productos disponibles

**3. Generador PDF Dual**
- PDF Cotización: con precios y código ticket
- PDF Listado: solo especificaciones técnicas
- Incluye indicador stock/a pedido

**4. Validador de Cotizaciones**
- Busca por código ticket
- Compara precios actuales vs históricos
- Marca como reclamada en tienda


## Data Models

### Script SQL Completo (PostgreSQL)

```sql
-- ============================================
-- SCHEMA: Sistema de Cotización Automatizada
-- NSG Latinoamerica E.I.R.L.
-- ============================================

-- Tabla de Administradores
CREATE TABLE administradores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Usuarios Clientes
CREATE TABLE usuarios_clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  correo VARCHAR(100) UNIQUE NOT NULL, -- Encriptado
  telefono VARCHAR(20),                -- Encriptado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  socket VARCHAR(50),
  ram_type VARCHAR(20),
  form_factor VARCHAR(20),
  wattage INTEGER,
  tdp INTEGER,
  precio_base DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  disponible_a_pedido BOOLEAN DEFAULT false,
  tiempo_entrega_dias INTEGER,
  descripcion_tecnica TEXT,
  imagen_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_stock_positive CHECK (stock >= 0),
  CONSTRAINT check_precio_positive CHECK (precio_base > 0)
);

CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_stock ON productos(stock);
CREATE INDEX idx_productos_socket ON productos(socket);

-- Tabla de Configuración
CREATE TABLE configuracion (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(50) UNIQUE NOT NULL,
  valor VARCHAR(255) NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO configuracion (clave, valor, descripcion) 
VALUES ('margen_ganancia', '20', 'Porcentaje de margen de ganancia');

-- Tabla de Cotizaciones
CREATE TABLE cotizaciones (
  id SERIAL PRIMARY KEY,
  codigo_unico UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  codigo_ticket VARCHAR(20) UNIQUE NOT NULL,
  id_cliente INTEGER REFERENCES usuarios_clientes(id) ON DELETE SET NULL,
  fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_validez TIMESTAMP NOT NULL,
  precio_total DECIMAL(10, 2) NOT NULL,
  margen_aplicado DECIMAL(5, 2) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  fecha_reclamacion TIMESTAMP,
  id_vendedor INTEGER REFERENCES administradores(id),
  notas_vendedor TEXT,
  
  CONSTRAINT check_precio_total_positive CHECK (precio_total > 0),
  CONSTRAINT check_estado_valido CHECK (estado IN ('Pendiente', 'Completada', 'Caducada', 'Reclamada'))
);

CREATE INDEX idx_cotizaciones_codigo ON cotizaciones(codigo_unico);
CREATE INDEX idx_cotizaciones_ticket ON cotizaciones(codigo_ticket);
CREATE INDEX idx_cotizaciones_cliente ON cotizaciones(id_cliente);

-- Tabla de Detalle de Cotización
CREATE TABLE detalle_cotizacion (
  id SERIAL PRIMARY KEY,
  id_cotizacion INTEGER NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  id_producto INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  nombre_producto VARCHAR(200) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  descripcion_tecnica TEXT,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  disponible_stock BOOLEAN NOT NULL,
  
  CONSTRAINT check_precio_unitario_positive CHECK (precio_unitario > 0),
  CONSTRAINT check_cantidad_positive CHECK (cantidad > 0)
);

CREATE INDEX idx_detalle_cotizacion ON detalle_cotizacion(id_cotizacion);

-- Tabla de Conversaciones con IA
CREATE TABLE conversaciones_ia (
  id SERIAL PRIMARY KEY,
  sesion_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  contexto_cliente JSONB NOT NULL,
  historial_mensajes JSONB NOT NULL,
  estado VARCHAR(20) DEFAULT 'activa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Auditoría
CREATE TABLE auditoria (
  id SERIAL PRIMARY KEY,
  tabla_afectada VARCHAR(50) NOT NULL,
  accion VARCHAR(20) NOT NULL,
  id_registro INTEGER,
  id_usuario INTEGER REFERENCES administradores(id),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Triggers
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_configuracion_updated_at
  BEFORE UPDATE ON configuracion
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- Función para generar código ticket
CREATE OR REPLACE FUNCTION generar_codigo_ticket()
RETURNS VARCHAR AS $$
DECLARE
  anio INTEGER;
  ultimo_numero INTEGER;
  nuevo_numero INTEGER;
  nuevo_codigo VARCHAR;
BEGIN
  anio := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COALESCE(MAX(CAST(SPLIT_PART(codigo_ticket, '-', 3) AS INTEGER)), 0)
  INTO ultimo_numero
  FROM cotizaciones
  WHERE codigo_ticket LIKE 'NSG-' || anio || '-%';
  
  nuevo_numero := ultimo_numero + 1;
  nuevo_codigo := 'NSG-' || anio || '-' || LPAD(nuevo_numero::TEXT, 4, '0');
  
  RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;
```


### Archivo de Conexión a PostgreSQL

**backend/src/configuracion/baseDatos.js:**

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nsg_cotizaciones',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => console.log('✓ Conectado a PostgreSQL'));
pool.on('error', (err) => {
  console.error('Error en PostgreSQL:', err);
  process.exit(-1);
});

const ejecutarQuery = async (texto, parametros) => {
  const inicio = Date.now();
  try {
    const resultado = await pool.query(texto, parametros);
    const duracion = Date.now() - inicio;
    if (duracion > 1000) {
      console.warn(`Query lenta (${duracion}ms):`, texto);
    }
    return resultado;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
};

const ejecutarTransaccion = async (callback) => {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await callback(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
};

module.exports = { pool, ejecutarQuery, ejecutarTransaccion };
```

### Servidor Express

**backend/src/servidor.js:**

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PUERTO = process.env.PORT || 3000;

// Seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
const limitadorAPI = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limitadorAPI);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/productos', require('./rutas/productos'));
app.use('/api/cotizaciones', require('./rutas/cotizaciones'));
app.use('/api/compatibilidad', require('./rutas/compatibilidad'));
app.use('/api/ia', require('./rutas/ia'));
app.use('/api/auth', require('./rutas/auth'));

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ estado: 'ok', baseDatos: 'conectada' });
  } catch (error) {
    res.status(500).json({ estado: 'error' });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

app.listen(PUERTO, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PUERTO}`);
});
```


## Algoritmo de Validación de Compatibilidad

**backend/src/servicios/servicioCompatibilidad.js:**

```javascript
class ServicioCompatibilidad {
  validarConfiguracion(componentes) {
    const errores = [];
    const advertencias = [];

    // 1. Socket: Procesador <-> Placa Madre
    if (componentes.procesador && componentes.placa_madre) {
      if (componentes.procesador.socket !== componentes.placa_madre.socket) {
        errores.push(
          `❌ Socket incompatible: ${componentes.procesador.socket} vs ${componentes.placa_madre.socket}`
        );
      }
    }

    // 2. Tipo RAM: RAM <-> Placa Madre
    if (componentes.placa_madre && componentes.ram?.length > 0) {
      const tipoRAM = componentes.ram[0].ramType;
      if (componentes.placa_madre.ramType !== tipoRAM) {
        errores.push(`❌ RAM incompatible: Placa soporta ${componentes.placa_madre.ramType}, seleccionado ${tipoRAM}`);
      }
    }

    // 3. Form Factor: Placa <-> Case
    if (componentes.placa_madre && componentes.case) {
      const soportados = this.parsearFormFactors(componentes.case.descripcionTecnica);
      if (!soportados.includes(componentes.placa_madre.formFactor)) {
        errores.push(`❌ Case no soporta ${componentes.placa_madre.formFactor}`);
      }
    }

    // 4. Potencia: Consumo <-> Fuente
    if (componentes.fuente) {
      const consumoTotal = this.calcularConsumoTotal(componentes);
      if (componentes.fuente.wattage < consumoTotal) {
        errores.push(`❌ Fuente insuficiente: requiere ${consumoTotal}W, tiene ${componentes.fuente.wattage}W`);
      } else if (componentes.fuente.wattage < consumoTotal * 1.2) {
        advertencias.push(`⚠️ Margen ajustado: recomendado ${Math.ceil(consumoTotal * 1.2)}W`);
      }
    }

    // 5. Componentes a pedido
    const aPedido = this.identificarComponentesAPedido(componentes);
    if (aPedido.length > 0) {
      const tiempoMax = Math.max(...aPedido.map(c => c.tiempoEntregaDias || 0));
      advertencias.push(`⚠️ Componentes a pedido: ${tiempoMax} días de entrega`);
    }

    return { compatible: errores.length === 0, errores, advertencias };
  }

  calcularConsumoTotal(componentes) {
    let total = 0;
    if (componentes.procesador?.tdp) total += componentes.procesador.tdp;
    if (componentes.gpu?.tdp) total += componentes.gpu.tdp;
    if (componentes.placa_madre) total += 50;
    if (componentes.ram) total += componentes.ram.length * 5;
    if (componentes.almacenamiento) total += 10;
    total += 20; // Ventiladores
    return Math.ceil(total * 1.2); // +20% margen
  }

  identificarComponentesAPedido(componentes) {
    const aPedido = [];
    for (const comp of Object.values(componentes)) {
      if (Array.isArray(comp)) {
        aPedido.push(...comp.filter(c => c.stock === 0 && c.disponibleAPedido));
      } else if (comp?.stock === 0 && comp?.disponibleAPedido) {
        aPedido.push(comp);
      }
    }
    return aPedido;
  }

  parsearFormFactors(descripcion) {
    const ff = [];
    const desc = descripcion.toLowerCase();
    if (desc.includes('atx') && !desc.includes('micro')) ff.push('ATX');
    if (desc.includes('micro-atx')) ff.push('Micro-ATX');
    if (desc.includes('mini-itx')) ff.push('Mini-ITX');
    if (ff.includes('ATX') && !ff.includes('Micro-ATX')) ff.push('Micro-ATX', 'Mini-ITX');
    return ff.length > 0 ? ff : ['ATX'];
  }
}

module.exports = new ServicioCompatibilidad();
```


## Asistente IA Conversacional

**backend/src/servicios/asistenteIA.js:**

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ejecutarQuery } = require('../configuracion/baseDatos');
const { v4: uuidv4 } = require('uuid');

class AsistenteIA {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
    // Usar gemini-1.5-flash para menor costo y mayor velocidad
    this.modelo = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200, // Limitar respuesta para reducir costo
        topP: 0.8,
        topK: 40
      }
    });
  }

  async iniciarConversacion(mensajeInicial) {
    const sesionId = uuidv4();
    const contexto = {
      mensajeInicial,
      presupuesto: null,
      usosPrincipales: [],
      preferencias: {},
      preguntasRealizadas: 0
    };

    // Prompt optimizado (corto y directo para reducir tokens)
    const prompt = `Experto hardware. Cliente: "${mensajeInicial}". 
Pregunta UNA cosa: presupuesto, uso o preferencia. Max 20 palabras. Español.`;

    const resultado = await this.modelo.generateContent(prompt);
    const pregunta = resultado.response.text();

    await ejecutarQuery(
      `INSERT INTO conversaciones_ia (sesion_id, contexto_cliente, historial_mensajes)
       VALUES ($1, $2, $3)`,
      [sesionId, JSON.stringify(contexto), JSON.stringify([
        { rol: 'cliente', mensaje: mensajeInicial },
        { rol: 'asistente', mensaje: pregunta }
      ])]
    );

    return { sesionId, pregunta, contexto };
  }

  async continuarConversacion(sesionId, respuestaCliente) {
    const res = await ejecutarQuery(
      'SELECT contexto_cliente, historial_mensajes FROM conversaciones_ia WHERE sesion_id = $1',
      [sesionId]
    );

    if (res.rows.length === 0) throw new Error('Sesión no encontrada');

    const contexto = res.rows[0].contexto_cliente;
    const historial = res.rows[0].historial_mensajes;

    this.actualizarContexto(contexto, respuestaCliente);
    historial.push({ rol: 'cliente', mensaje: respuestaCliente });

    if (this.tieneInformacionSuficiente(contexto)) {
      // Generar recomendación final
      const productos = await this.obtenerProductosDisponibles();
      const recomendacion = await this.generarRecomendacion(contexto, productos);

      await ejecutarQuery(
        `UPDATE conversaciones_ia SET estado = 'completada', contexto_cliente = $1, 
         historial_mensajes = $2 WHERE sesion_id = $3`,
        [JSON.stringify(contexto), JSON.stringify(historial), sesionId]
      );

      return { completado: true, recomendacion };
    } else {
      // Siguiente pregunta
      const prompt = this.construirPromptSiguiente(contexto, historial);
      const resultado = await this.modelo.generateContent(prompt);
      const pregunta = resultado.response.text();

      historial.push({ rol: 'asistente', mensaje: pregunta });
      contexto.preguntasRealizadas++;

      await ejecutarQuery(
        `UPDATE conversaciones_ia SET contexto_cliente = $1, historial_mensajes = $2 WHERE sesion_id = $3`,
        [JSON.stringify(contexto), JSON.stringify(historial), sesionId]
      );

      return { completado: false, pregunta };
    }
  }

  actualizarContexto(contexto, respuesta) {
    const lower = respuesta.toLowerCase();
    
    // Detectar presupuesto
    const numeros = respuesta.match(/(\d{3,5})/g);
    if (numeros && !contexto.presupuesto) {
      contexto.presupuesto = {
        min: parseInt(numeros[0]),
        max: numeros[1] ? parseInt(numeros[1]) : parseInt(numeros[0]) * 1.2
      };
    }

    // Detectar usos
    const usos = {
      gaming: ['gaming', 'juegos', 'jugar'],
      diseño: ['diseño', 'photoshop', 'render'],
      video: ['video', 'edición', 'premiere'],
      oficina: ['oficina', 'trabajo', 'excel']
    };

    for (const [uso, keywords] of Object.entries(usos)) {
      if (keywords.some(kw => lower.includes(kw))) {
        if (!contexto.usosPrincipales.includes(uso)) {
          contexto.usosPrincipales.push(uso);
        }
      }
    }

    // Detectar preferencias
    if (lower.includes('intel')) contexto.preferencias.marcaProcesador = 'Intel';
    if (lower.includes('amd')) contexto.preferencias.marcaProcesador = 'AMD';
    if (lower.includes('nvidia')) contexto.preferencias.marcaGPU = 'NVIDIA';
  }

  tieneInformacionSuficiente(contexto) {
    return (contexto.presupuesto && contexto.usosPrincipales.length > 0) || 
           contexto.preguntasRealizadas >= 5;
  }

  async obtenerProductosDisponibles() {
    const res = await ejecutarQuery(
      'SELECT * FROM productos WHERE stock > 0 OR disponible_a_pedido = true'
    );
    return res.rows;
  }

  async generarRecomendacion(contexto, productos) {
    // Filtrar solo productos relevantes para reducir tokens
    const productosRelevantes = this.filtrarProductosRelevantes(productos, contexto);
    
    // Lista compacta (reducir tokens)
    const listaCompacta = productosRelevantes.map(p => 
      `${p.id}|${p.nombre}|${p.categoria}|${p.precio_base}|${p.socket||''}|${p.stock>0?'S':'P'}`
    ).join('\n');

    // Prompt optimizado (corto para reducir costo)
    const prompt = `Cliente: S/${contexto.presupuesto?.min}-${contexto.presupuesto?.max}, ${contexto.usosPrincipales.join(',')}

Productos (ID|Nombre|Cat|Precio|Socket|Stock):
${listaCompacta}

JSON config compatible:
{"procesador":ID,"placa_madre":ID,"ram":[ID],"almacenamiento":ID,"gpu":ID,"fuente":ID,"case":ID,"explicacion":"breve"}`;

    const resultado = await this.modelo.generateContent(prompt);
    const recomendacion = JSON.parse(resultado.response.text());
    
    return await this.validarRecomendacion(recomendacion, productos);
  }

  filtrarProductosRelevantes(productos, contexto) {
    // Filtrar por presupuesto para reducir lista
    if (contexto.presupuesto) {
      const maxPorComponente = contexto.presupuesto.max / 4; // Estimado
      productos = productos.filter(p => p.precio_base <= maxPorComponente);
    }

    // Limitar a top 3 por categoría para reducir tokens
    const porCategoria = {};
    productos.forEach(p => {
      if (!porCategoria[p.categoria]) porCategoria[p.categoria] = [];
      porCategoria[p.categoria].push(p);
    });

    const relevantes = [];
    for (const cat in porCategoria) {
      const top3 = porCategoria[cat]
        .sort((a, b) => b.stock - a.stock) // Priorizar con stock
        .slice(0, 3);
      relevantes.push(...top3);
    }

    return relevantes;
  }

  async validarRecomendacion(rec, productos) {
    const mapa = new Map(productos.map(p => [p.id, p]));
    const validada = { componentes: {}, explicacion: rec.explicacion, advertencias: [] };

    for (const [cat, id] of Object.entries(rec)) {
      if (['explicacion', 'advertencias'].includes(cat)) continue;
      
      if (Array.isArray(id)) {
        validada.componentes[cat] = id.filter(i => mapa.has(i)).map(i => mapa.get(i));
      } else if (id && mapa.has(id)) {
        const prod = mapa.get(id);
        validada.componentes[cat] = prod;
        if (prod.stock === 0 && prod.disponible_a_pedido) {
          validada.advertencias.push(`${prod.nombre}: A pedido (${prod.tiempo_entrega_dias}d)`);
        }
      }
    }

    return validada;
  }

  construirPromptSiguiente(contexto, historial) {
    // Solo últimos 3 mensajes para reducir tokens
    const ultimosMensajes = historial.slice(-3);
    const hist = ultimosMensajes.map(m => `${m.rol}: ${m.mensaje}`).join('\n');
    
    const faltante = [];
    if (!contexto.presupuesto) faltante.push('presupuesto');
    if (contexto.usosPrincipales.length === 0) faltante.push('uso');
    
    return `Conversación:
${hist}

Falta: ${faltante.join(', ')}. Pregunta UNA cosa. Max 20 palabras. Español.`;
  }
}

module.exports = new AsistenteIA();
```

### Optimizaciones de Costo de IA

**1. Usar Modelo Más Económico:**
- `gemini-1.5-flash` en lugar de `gemini-pro`
- Más rápido y 10x más barato
- Suficiente para recomendaciones de hardware

**2. Limitar Tokens de Salida:**
```javascript
generationConfig: {
  maxOutputTokens: 200, // Limitar respuesta
  temperature: 0.7
}
```

**3. Reducir Contexto:**
- Solo últimos 3 mensajes en historial
- Filtrar productos por presupuesto
- Top 3 por categoría (no enviar catálogo completo)
- Formato compacto: `ID|Nombre|Cat|Precio|Socket|Stock`

**4. Cache de Recomendaciones:**
```javascript
const cacheIA = new Map();

async function obtenerRecomendacionConCache(contexto, productos) {
  const cacheKey = JSON.stringify({
    presupuesto: contexto.presupuesto,
    usos: contexto.usosPrincipales.sort()
  });
  
  if (cacheIA.has(cacheKey)) {
    return cacheIA.get(cacheKey);
  }
  
  const recomendacion = await asistenteIA.generarRecomendacion(contexto, productos);
  cacheIA.set(cacheKey, recomendacion);
  
  // Limpiar cache después de 1 hora
  setTimeout(() => cacheIA.delete(cacheKey), 3600000);
  
  return recomendacion;
}
```

**5. Fallback sin IA:**
```javascript
async function obtenerRecomendacion(contexto, productos) {
  try {
    return await asistenteIA.generarRecomendacion(contexto, productos);
  } catch (error) {
    console.error('Error en IA, usando fallback:', error);
    // Recomendación básica sin IA (basada en reglas)
    return generarRecomendacionBasica(contexto, productos);
  }
}

function generarRecomendacionBasica(contexto, productos) {
  const presupuesto = contexto.presupuesto?.max || 5000;
  const esGaming = contexto.usosPrincipales.includes('gaming');
  
  // Lógica simple basada en reglas
  const config = {
    procesador: productos.find(p => p.categoria === 'procesador' && p.precio_base < presupuesto * 0.25),
    placa_madre: productos.find(p => p.categoria === 'placa_madre' && p.precio_base < presupuesto * 0.15),
    // ... etc
  };
  
  return { componentes: config, explicacion: 'Configuración básica recomendada' };
}
```

**Estimación de Costos:**
- gemini-1.5-flash: ~$0.00001 por request
- Con optimizaciones: ~500 tokens por recomendación
- 1000 recomendaciones/mes ≈ $0.50 USD
- Con cache: reducción del 40-60%




## Generador de PDF Dual

**backend/src/servicios/servicioPDF.js:**

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ServicioPDF {
  async generarPDFCotizacion(datos) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Logo
      const rutaLogo = path.join(__dirname, '../../assets/logo-nsg.png');
      if (fs.existsSync(rutaLogo)) {
        doc.image(rutaLogo, 50, 45, { width: 100 });
      }

      // Encabezado
      doc.fontSize(20).font('Helvetica-Bold')
         .text('NSG Latinoamerica E.I.R.L.', 200, 50, { align: 'right' });
      doc.fontSize(10).font('Helvetica')
         .text('Soluciones en Tecnología', 200, 75, { align: 'right' });

      doc.moveTo(50, 120).lineTo(550, 120).stroke();
      doc.moveDown(2);

      // Título
      doc.fontSize(16).font('Helvetica-Bold')
         .text('COTIZACIÓN DE COMPUTADORA', { align: 'center' });
      doc.moveDown();

      // Código Ticket (grande y visible)
      doc.fontSize(10).text('Código de Ticket:', 50);
      doc.fontSize(14).fillColor('blue')
         .text(datos.codigoTicket, 180);
      
      // Código UUID (pequeño)
      doc.fillColor('black').fontSize(7)
         .text(`UUID: ${datos.codigoUnico}`, 50);

      // Fechas
      doc.fontSize(10).moveDown();
      doc.text(`Emisión: ${this.formatearFecha(datos.fechaEmision)}`, 50);
      doc.fillColor('red').font('Helvetica-Bold')
         .text(`Caducidad: ${this.formatearFecha(datos.fechaValidez)}`, 50);
      doc.fillColor('black').font('Helvetica').moveDown(2);

      // Tabla de componentes
      this.agregarTabla(doc, datos.componentes, true);

      // Total
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold')
         .text('PRECIO TOTAL:', 350);
      doc.fontSize(16).fillColor('green')
         .text(`S/ ${datos.precioTotal.toFixed(2)}`, 480, doc.y - 15, { align: 'right' });

      // Instrucciones
      doc.fillColor('black').fontSize(9).font('Helvetica').moveDown(2);
      doc.text('CÓMO RECLAMAR:', { underline: true });
      doc.fontSize(8).moveDown(0.5);
      doc.text(`1. Visita nuestra tienda`);
      doc.text(`2. Presenta código: ${datos.codigoTicket}`);
      doc.text(`3. Validaremos disponibilidad y precios`);
      doc.text(`4. Componentes "A Pedido" se solicitan al confirmar`);

      // Footer
      doc.fontSize(8).text('\nVálido por 3 días. Precios sujetos a cambio.', { align: 'center' });

      doc.end();
    });
  }

  async generarPDFListado(componentes, codigoTicket) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(16).text('LISTADO TÉCNICO DE COMPONENTES', { align: 'center' });
      doc.fontSize(10).text(`Referencia: ${codigoTicket}`, { align: 'center' });
      doc.moveDown(2);

      this.agregarTabla(doc, componentes, false);

      doc.fontSize(8).moveDown()
         .text('Documento solo para referencia técnica', { align: 'center' });

      doc.end();
    });
  }

  agregarTabla(doc, componentes, incluirPrecios) {
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Categoría', 50);
    doc.text('Producto', 140);
    doc.text('Disponibilidad', 350);
    if (incluirPrecios) doc.text('Precio', 480);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(8).font('Helvetica');
    componentes.forEach((comp, i) => {
      if (i % 2 === 0) {
        doc.rect(50, doc.y - 3, 500, 20).fillAndStroke('#f9f9f9', '#f9f9f9');
      }
      
      doc.fillColor('black');
      doc.text(this.formatearCategoria(comp.categoria), 50, doc.y, { width: 80 });
      doc.text(comp.nombre, 140, doc.y - 8, { width: 200 });
      
      const disp = comp.stock > 0 ? 'En Stock' : 
                   comp.disponibleAPedido ? `A Pedido (${comp.tiempoEntregaDias}d)` : 'No Disp.';
      doc.fillColor(comp.stock > 0 ? 'green' : 'orange')
         .text(disp, 350, doc.y - 8);
      
      if (incluirPrecios) {
        doc.fillColor('black')
           .text(`S/ ${comp.precioBase.toFixed(2)}`, 480, doc.y - 8);
      }
      
      doc.moveDown();
    });
  }

  formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  formatearCategoria(cat) {
    const mapa = {
      procesador: 'Procesador',
      placa_madre: 'Placa Madre',
      ram: 'RAM',
      almacenamiento: 'Almacenamiento',
      gpu: 'GPU',
      fuente: 'Fuente',
      case: 'Case'
    };
    return mapa[cat] || cat;
  }
}

module.exports = new ServicioPDF();
```


## Seguridad

### Encriptación de Datos Sensibles

```javascript
// backend/src/utilidades/encriptacion.js
const crypto = require('crypto');

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes
const IV_LENGTH = 16;

function encriptar(texto) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encriptado = cipher.update(texto, 'utf8', 'hex');
  encriptado += cipher.final('hex');
  return iv.toString('hex') + ':' + encriptado;
}

function desencriptar(textoEncriptado) {
  const [ivHex, contenido] = textoEncriptado.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let desencriptado = decipher.update(contenido, 'hex', 'utf8');
  desencriptado += decipher.final('utf8');
  return desencriptado;
}

module.exports = { encriptar, desencriptar };
```

### Autenticación Segura

```javascript
// backend/src/servicios/servicioAuth.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class ServicioAuth {
  async login(username, password) {
    const res = await ejecutarQuery(
      'SELECT id, password_hash, nombre_completo FROM administradores WHERE username = $1',
      [username]
    );

    if (res.rows.length === 0) {
      return { exito: false, mensaje: 'Usuario no encontrado' };
    }

    const admin = res.rows[0];
    const passwordValido = await bcrypt.compare(password, admin.password_hash);

    if (!passwordValido) {
      return { exito: false, mensaje: 'Contraseña incorrecta' };
    }

    const token = jwt.sign(
      { id: admin.id, username, nombre: admin.nombre_completo },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return { exito: true, token };
  }

  async verificarToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }
}

module.exports = new ServicioAuth();
```

### Prevención de SQL Injection

```javascript
// ✅ SIEMPRE usar queries parametrizadas
const obtenerProducto = async (id) => {
  return await ejecutarQuery(
    'SELECT * FROM productos WHERE id = $1',
    [id] // Parámetro seguro
  );
};

// ❌ NUNCA concatenar strings
const obtenerProducto = async (id) => {
  return await ejecutarQuery(
    `SELECT * FROM productos WHERE id = '${id}'` // VULNERABLE
  );
};
```

### Sanitización de Inputs

```javascript
const validator = require('validator');

function sanitizarInput(input) {
  if (typeof input !== 'string') return '';
  let sanitizado = validator.escape(input);
  sanitizado = sanitizado.replace(/[<>]/g, '');
  return sanitizado.trim();
}

function validarEmail(email) {
  return validator.isEmail(email);
}

function validarProducto(datos) {
  const errores = [];
  
  if (!datos.nombre || datos.nombre.trim().length < 3) {
    errores.push({ campo: 'nombre', mensaje: 'Mínimo 3 caracteres' });
  }
  
  if (/<script|javascript:/i.test(datos.nombre)) {
    errores.push({ campo: 'nombre', mensaje: 'Caracteres no permitidos' });
  }
  
  if (isNaN(datos.precio_base) || datos.precio_base <= 0) {
    errores.push({ campo: 'precio_base', mensaje: 'Precio inválido' });
  }
  
  return errores;
}
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// API general
const limitadorAPI = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones'
});

// Login (prevenir fuerza bruta)
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

// IA (costoso)
const limitadorIA = rateLimit({
  windowMs: 60 * 1000,
  max: 5
});

app.use('/api/', limitadorAPI);
app.use('/api/auth/login', limitadorLogin);
app.use('/api/ia/', limitadorIA);
```

### Checklist de Seguridad

- [x] HTTPS obligatorio en producción
- [x] Contraseñas hasheadas con bcrypt (salt rounds = 10)
- [x] JWT con secreto fuerte (32+ caracteres)
- [x] Emails y teléfonos encriptados (AES-256-CBC)
- [x] SQL injection prevenido (queries parametrizadas)
- [x] XSS prevenido (sanitización de inputs)
- [x] Rate limiting configurado
- [x] CORS restrictivo
- [x] Helmet para headers de seguridad
- [x] Validación de tipos de archivo
- [x] Auditoría de acciones críticas
- [x] Logs sin datos sensibles


## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables por máquinas.*

### Property 1: Creación de productos persiste todos los campos

*Para cualquier* conjunto válido de datos de producto, crear un producto debe resultar en un registro en la base de datos que contenga exactamente esos valores.

**Validates: Requirements 1.1**

### Property 2: Actualización de productos modifica valores correctamente

*Para cualquier* producto existente y datos de actualización válidos, actualizar el producto debe resultar en que los valores consultados sean los nuevos valores.

**Validates: Requirements 1.2, 1.5**

### Property 3: Eliminación de productos los remueve de consultas

*Para cualquier* producto existente, después de eliminarlo, consultar todos los productos no debe incluir el producto eliminado.

**Validates: Requirements 1.3**

### Property 4: Productos sin stock aparecen solo si son a pedido

*Para cualquier* conjunto de productos, consultar productos disponibles debe retornar productos con stock > 0 O disponible_a_pedido = true.

**Validates: Requirements 2.2**

### Property 5: Filtrado de placas madre por socket

*Para cualquier* procesador con socket S, filtrar placas madre debe retornar únicamente placas con socket S.

**Validates: Requirements 3.2**

### Property 6: Validación detecta incompatibilidades

*Para cualquier* configuración con incompatibilidad conocida, la validación debe retornar compatible=false con errores descriptivos.

**Validates: Requirements 3.3, 3.4**

### Property 7: Configuraciones compatibles pasan validación

*Para cualquier* configuración donde todos los componentes son compatibles, la validación debe retornar compatible=true.

**Validates: Requirements 3.3**

### Property 8: Habilitación secuencial de categorías

*Para cualquier* paso N, después de seleccionar un componente válido, el paso N+1 debe quedar habilitado.

**Validates: Requirements 4.2**

### Property 9: Navegación hacia atrás permitida

*Para cualquier* paso N > 0, debe ser posible navegar a pasos anteriores.

**Validates: Requirements 4.3**

### Property 10: Modificación dispara revalidación

*Para cualquier* configuración parcial, modificar un componente debe disparar nueva validación.

**Validates: Requirements 4.4**

### Property 11: Recomendaciones IA solo productos disponibles

*Para cualquier* recomendación de IA, todos los productos deben tener stock > 0 O disponible_a_pedido = true.

**Validates: Requirements 5.5**

### Property 12: Recomendaciones mapean a productos existentes

*Para cualquier* recomendación de IA, todos los IDs deben existir en Base_Datos.

**Validates: Requirements 5.4**

### Property 13: Cálculo de precio total con margen

*Para cualquier* conjunto de componentes y margen M, precio total = (suma precios_base) × (1 + M/100).

**Validates: Requirements 6.1, 6.2**

### Property 14: Margen no afecta cotizaciones existentes

*Para cualquier* cotización con margen M1, si el margen cambia a M2, la cotización mantiene margen_aplicado = M1.

**Validates: Requirements 6.4**

### Property 15: Generación de PDF produce documento válido

*Para cualquier* configuración válida, generar PDF debe producir buffer no vacío.

**Validates: Requirements 7.1**

### Property 16: Código ticket es único y válido

*Para cualquier* cotización generada, codigo_ticket debe ser único y seguir formato NSG-YYYY-NNNN.

**Validates: Requirements 7.3**

### Property 17: PDF contiene información completa

*Para cualquier* cotización, el PDF debe contener: codigo_ticket, fechas, componentes, precios, disponibilidad.

**Validates: Requirements 7.4**

### Property 18: Persistencia completa de cotización

*Para cualquier* cotización generada, debe existir registro en cotizaciones y N registros en detalle_cotizacion (N = componentes).

**Validates: Requirements 7.6, 8.1, 8.2**

### Property 19: Asociación condicional con cliente

*Para cualquier* cotización, si hay email, id_cliente debe ser no nulo; si no hay email, debe ser null.

**Validates: Requirements 8.3**

### Property 20: Estados de cotización son válidos

*Para cualquier* cotización, estado debe ser: 'Pendiente', 'Completada', 'Caducada', o 'Reclamada'.

**Validates: Requirements 8.4**

### Property 21: Validación retorna comparación de precios

*Para cualquier* cotización válida, validarla debe retornar: componentes, precios originales, precios actuales, diferencia.

**Validates: Requirements 9.5, 9.6**

### Property 22: Marcar como reclamada actualiza estado

*Para cualquier* cotización Pendiente, marcarla como reclamada debe cambiar estado a 'Reclamada'.

**Validates: Requirements 9.7**

### Property 23: Rutas protegidas requieren autenticación

*Para cualquier* endpoint admin, petición sin token JWT válido debe retornar 401/403.

**Validates: Requirements 10.1**

### Property 24: Autenticación válida retorna token

*Para cualquier* credencial válida, autenticación debe retornar exito=true y token JWT válido.

**Validates: Requirements 10.3**

### Property 25: Integridad referencial

*Para cualquier* intento de insertar con FK inválida, la operación debe fallar.

**Validates: Requirements 11.6**

### Property 26: Historial retorna todas las cotizaciones

*Para cualquier* cliente con N cotizaciones, consultar historial debe retornar exactamente N.

**Validates: Requirements 15.2**

### Property 27: Conversación IA recopila información

*Para cualquier* sesión de IA, después de 3-5 turnos, el contexto debe contener presupuesto Y uso principal.

**Validates: Requirements 5.3**

### Property 28: Código ticket es secuencial por año

*Para cualquier* año, los códigos ticket deben ser secuenciales (NSG-2024-0001, NSG-2024-0002, ...).

**Validates: Requirements 7.3**


## Error Handling

### Tipos de Errores

**400 Bad Request:** Validación fallida, incompatibilidad de componentes  
**401 Unauthorized:** Token ausente o inválido  
**403 Forbidden:** Sin permisos  
**404 Not Found:** Producto/cotización no existe  
**409 Conflict:** Stock insuficiente, código duplicado  
**500 Internal Server Error:** Error de BD, API IA, generación PDF

### Manejo por Componente

```javascript
// Motor de Compatibilidad
try {
  const resultado = servicioCompatibilidad.validarConfiguracion(componentes);
  if (!resultado.compatible) {
    return res.status(400).json({ error: 'Incompatible', detalles: resultado.errores });
  }
} catch (error) {
  return res.status(500).json({ error: 'Error al validar' });
}

// Asistente IA (con fallback)
try {
  const recomendacion = await asistenteIA.generarRecomendacion(contexto, productos);
  return recomendacion;
} catch (error) {
  console.error('Error en IA:', error);
  return { error: 'IA no disponible', fallback: true };
}

// Generador PDF
try {
  const pdf = await servicioPDF.generarPDFCotizacion(datos);
  if (!pdf || pdf.length === 0) throw new Error('PDF vacío');
  return pdf;
} catch (error) {
  throw new Error('No se pudo generar PDF');
}
```

### Validaciones de Base de Datos

```javascript
function manejarErrorBD(error) {
  if (error.code === '23505') return { status: 409, mensaje: 'Registro duplicado' };
  if (error.code === '23503') return { status: 400, mensaje: 'Referencia inválida' };
  if (error.code === '23514') return { status: 400, mensaje: 'Constraint violado' };
  return { status: 500, mensaje: 'Error de base de datos' };
}
```


## Testing Strategy

### Enfoque Dual

**Unit Tests:** Ejemplos específicos, casos edge, errores  
**Property Tests:** Propiedades universales, 100+ iteraciones

Biblioteca: **fast-check** para Node.js y React

### Configuración de Property Tests

```javascript
const fc = require('fast-check');

/**
 * Feature: sistema-cotizacion-automatizada, Property 4: Productos sin stock aparecen solo si son a pedido
 */
test('Property 4: Disponibilidad correcta', () => {
  fc.assert(
    fc.property(
      fc.array(generadorProducto()),
      async (productos) => {
        await insertarProductosPrueba(productos);
        const disponibles = await obtenerProductosDisponibles();
        
        disponibles.forEach(p => {
          expect(p.stock > 0 || p.disponible_a_pedido).toBe(true);
        });
      }
    ),
    { numRuns: 100 }
  );
});

/**
 * Feature: sistema-cotizacion-automatizada, Property 13: Cálculo de precio con margen
 */
test('Property 13: Precio total correcto', () => {
  fc.assert(
    fc.property(
      fc.array(generadorComponente(), { minLength: 1, maxLength: 7 }),
      fc.integer({ min: 0, max: 100 }),
      (componentes, margen) => {
        const baseTotal = componentes.reduce((s, c) => s + c.precioBase, 0);
        const esperado = baseTotal * (1 + margen / 100);
        const calculado = calcularTotalConMargen(componentes, margen);
        
        expect(calculado).toBeCloseTo(esperado, 2);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Generadores (Arbitraries)

```javascript
const generadorProducto = () => fc.record({
  nombre: fc.string({ minLength: 5, maxLength: 100 }),
  categoria: fc.constantFrom('procesador', 'placa_madre', 'ram', 'almacenamiento', 'gpu', 'fuente', 'case'),
  socket: fc.constantFrom('AM5', 'LGA1700', 'AM4'),
  precioBase: fc.float({ min: 50, max: 5000 }),
  stock: fc.integer({ min: 0, max: 100 }),
  disponibleAPedido: fc.boolean()
});

const generadorMargen = () => fc.integer({ min: 0, max: 100 });
```

### Unit Tests Específicos

```javascript
describe('Motor de Compatibilidad', () => {
  test('Socket incompatible detectado', () => {
    const proc = { socket: 'AM5' };
    const placa = { socket: 'LGA1700' };
    expect(servicioCompatibilidad.validarSocket(proc, placa)).toBe(false);
  });

  test('Fuente insuficiente detectada', () => {
    const comps = {
      procesador: { tdp: 65 },
      gpu: { tdp: 250 },
      fuente: { wattage: 300 }
    };
    const res = servicioCompatibilidad.validarConfiguracion(comps);
    expect(res.compatible).toBe(false);
  });
});

describe('Validador de Cotizaciones', () => {
  test('Cotización caducada detectada', async () => {
    const cotizacionCaducada = await crearCotizacionCaducada();
    const res = await validadorCotizaciones.validarCotizacion(cotizacionCaducada.codigo_ticket);
    expect(res.valida).toBe(false);
    expect(res.mensaje).toContain('caducada');
  });
});
```

### Cobertura

**Objetivos:**
- Líneas: > 80%
- Funciones: > 85%
- Branches: > 75%
- Property tests: 100% de propiedades implementadas

**Áreas Críticas (> 90%):**
- Motor de compatibilidad
- Cálculo de precios
- Validación de cotizaciones
- Autenticación


## Escalabilidad

### Escalamiento Horizontal

**Backend Stateless:**
- JWT sin sesiones en memoria
- Múltiples instancias con load balancer
- Redis para cache compartido

**Load Balancer (Nginx):**
```nginx
upstream servidores_backend {
    least_conn;
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}

server {
    location /api {
        proxy_pass http://servidores_backend;
    }
}
```

### Caching con Redis

```javascript
const redis = require('redis');
const clienteRedis = redis.createClient();

async function obtenerProductosConCache() {
  const cached = await clienteRedis.get('productos:disponibles');
  if (cached) return JSON.parse(cached);
  
  const productos = await ejecutarQuery(
    'SELECT * FROM productos WHERE stock > 0 OR disponible_a_pedido = true'
  );
  
  await clienteRedis.setEx('productos:disponibles', 300, JSON.stringify(productos.rows));
  return productos.rows;
}

// Invalidar al actualizar
async function actualizarProducto(id, datos) {
  await ejecutarQuery('UPDATE productos SET ... WHERE id = $1', [id]);
  await clienteRedis.del('productos:disponibles');
}
```

### Database Replication

```javascript
// Pool para escrituras (master)
const poolEscritura = new Pool({ host: process.env.DB_MASTER_HOST });

// Pool para lecturas (replicas)
const poolLectura = new Pool({ host: process.env.DB_REPLICA_HOST });

async function ejecutarQuery(texto, params, esEscritura = false) {
  const pool = esEscritura ? poolEscritura : poolLectura;
  return await pool.query(texto, params);
}
```

### Plan de Escalamiento

| Fase | Configuración | Capacidad |
|------|---------------|-----------|
| 1 (0-6m) | 1 servidor | ~100 usuarios concurrentes |
| 2 (6-12m) | 2-3 servidores + Redis | ~500 usuarios |
| 3 (12m+) | 5+ servidores + Replicas | 1000+ usuarios |

### Optimizaciones Futuras

- Queue system (Bull) para PDFs pesados
- CDN para assets estáticos
- Elasticsearch para búsqueda avanzada
- WebSockets para actualizaciones en tiempo real
- Microservicios si es necesario


## Despliegue

### Instalación

**PostgreSQL:**
```bash
sudo apt install postgresql
sudo -u postgres psql
CREATE DATABASE nsg_cotizaciones;
CREATE USER nsg_user WITH PASSWORD 'secure_pass';
GRANT ALL ON DATABASE nsg_cotizaciones TO nsg_user;
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con credenciales
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
```

### Variables de Entorno

```bash
# Backend .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nsg_cotizaciones
DB_USER=nsg_user
DB_PASSWORD=secure_password
JWT_SECRET=min_32_caracteres_aleatorios
ENCRYPTION_KEY=64_caracteres_hex
AI_API_KEY=tu_api_key
FRONTEND_URL=https://cotizador.nsg.com
PORT=3000
```

### Producción con PM2

```bash
npm install -g pm2
pm2 start src/servidor.js --name nsg-backend
pm2 startup
pm2 save
```

### SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d cotizador.nsg-latinoamerica.com
```

### Docker (Opcional)

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: nsg_cotizaciones
      POSTGRES_USER: nsg_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./base-datos/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"

volumes:
  postgres_data:
```

### Backup

```bash
# Backup diario
pg_dump -U nsg_user nsg_cotizaciones > backup_$(date +%Y%m%d).sql

# Encriptar backup
gpg --symmetric --cipher-algo AES256 backup_20240115.sql

# Restaurar
psql -U nsg_user nsg_cotizaciones < backup_20240115.sql
```


## Decisiones de Diseño

### 1. PostgreSQL vs NoSQL
**Decisión:** PostgreSQL  
**Razón:** Relaciones complejas, integridad referencial, transacciones ACID, constraints nativos

### 2. JWT vs Sesiones
**Decisión:** JWT  
**Razón:** Stateless, escalable, no requiere almacenamiento de sesiones

### 3. Validación en Backend
**Decisión:** Lógica de compatibilidad en backend  
**Razón:** Seguridad (cliente no puede bypassear), consistencia, testing más fácil

### 4. Snapshot de Precios
**Decisión:** Almacenar precio_unitario en detalle_cotizacion  
**Razón:** Precios cambian, cotizaciones deben reflejar precios históricos, auditoría

### 5. UUID + Código Ticket
**Decisión:** Ambos códigos  
**Razón:** UUID para sistema interno (seguro), ticket corto para clientes (legible)

### 6. IA Conversacional
**Decisión:** Múltiples preguntas antes de recomendar  
**Razón:** Mejor contexto = mejores recomendaciones, experiencia personalizada

### 7. Disponible a Pedido
**Decisión:** Flag en productos + tiempo_entrega_dias  
**Razón:** No perder ventas por falta de stock temporal, transparencia con cliente

### 8. Dos PDFs
**Decisión:** PDF cotización + PDF listado  
**Razón:** Cliente puede compartir specs sin revelar precios, útil para comparar

### 9. Encriptación de Datos
**Decisión:** AES-256 para emails/teléfonos  
**Razón:** Proteger PII, cumplir con mejores prácticas de seguridad

### 10. Código en Español
**Decisión:** Variables, funciones, comentarios en español  
**Razón:** Equipo hispanohablante, mejor comprensión, mantenibilidad


## Flujos de Datos Principales

### Flujo de IA Conversacional

```
Cliente → "Necesito PC para gaming"
  ↓
IA → "¿Cuál es tu presupuesto?"
  ↓
Cliente → "Entre S/3000 y S/4000"
  ↓
IA → "¿Qué juegos jugarás?"
  ↓
Cliente → "Fortnite, Valorant, LOL"
  ↓
IA → "¿Preferencia de marca?"
  ↓
Cliente → "Lo mejor para mi presupuesto"
  ↓
IA → [Genera recomendación completa]
  ↓
Sistema → Valida stock y compatibilidad
  ↓
Cliente → Recibe configuración recomendada
```

### Flujo de Cotización con Tickets

```
Cliente → Selecciona componentes
  ↓
Sistema → Valida compatibilidad
  ↓
Sistema → Calcula precio con margen
  ↓
Sistema → Genera código ticket (NSG-2024-0001)
  ↓
Sistema → Crea registro en BD
  ↓
Sistema → Genera 2 PDFs (cotización + listado)
  ↓
Cliente → Descarga PDFs con código ticket
  ↓
Cliente → Va a tienda con código
  ↓
Vendedor → Ingresa código en sistema
  ↓
Sistema → Muestra PC armada + comparación precios
  ↓
Vendedor → Valida y marca como reclamada
  ↓
Sistema → Actualiza estado a 'Reclamada'
```

### Flujo de Validación en Tienda

```
Vendedor ingresa: NSG-2024-0001
  ↓
Sistema busca cotización
  ↓
¿Existe? → No: "Código inválido"
  ↓
¿Vigente? → No: "Cotización caducada" + opción recotizar
  ↓
Sistema compara precios actuales vs históricos
  ↓
Muestra:
- Componentes seleccionados
- Precios originales
- Precios actuales
- Diferencia total
- Disponibilidad (stock/a pedido)
  ↓
Vendedor confirma
  ↓
Sistema marca como 'Reclamada'
```


## Próximos Pasos

Una vez aprobado este diseño:

1. Crear documento de tareas (tasks.md)
2. Configurar entorno de desarrollo
3. Implementar schema de base de datos
4. Desarrollar servicios core (compatibilidad, PDF, IA)
5. Implementar property-based tests
6. Desarrollar frontend con componentes
7. Integrar servicios externos
8. Testing end-to-end
9. Despliegue en staging
10. Despliegue en producción

---

**Documento creado para:** NSG Latinoamerica E.I.R.L.  
**Proyecto:** Sistema de Cotización Automatizada  
**Versión:** 1.0  
**Fecha:** 2024

## Optimización de Costos de API de IA

### Estrategias de Reducción de Costos

**1. Modelo Económico:**
- Usar `gemini-1.5-flash` (10x más barato que gemini-pro)
- Suficiente calidad para recomendaciones de hardware
- Más rápido (mejor UX)

**2. Limitar Tokens:**
```javascript
generationConfig: {
  maxOutputTokens: 200,  // Limitar respuesta
  temperature: 0.7,
  topP: 0.8,
  topK: 40
}
```

**3. Prompts Compactos:**
```javascript
// ❌ Prompt largo (muchos tokens)
const prompt = `Eres un experto en hardware de computadoras...
[500 palabras de contexto]
Productos disponibles:
[Lista completa de 100 productos con descripciones]`;

// ✅ Prompt optimizado (pocos tokens)
const prompt = `Experto hardware. Cliente: S/${min}-${max}, ${usos}
Productos (ID|Nombre|Cat|Precio|Socket|Stock):
${top3PorCategoria}
JSON config compatible`;
```

**4. Filtrado Inteligente:**
```javascript
filtrarProductosRelevantes(productos, contexto) {
  // Solo productos dentro del presupuesto
  let filtrados = productos;
  
  if (contexto.presupuesto) {
    const maxPorComponente = contexto.presupuesto.max / 4;
    filtrados = filtrados.filter(p => p.precio_base <= maxPorComponente);
  }

  // Top 3 por categoría (21 productos en lugar de 100+)
  const porCategoria = {};
  filtrados.forEach(p => {
    if (!porCategoria[p.categoria]) porCategoria[p.categoria] = [];
    porCategoria[p.categoria].push(p);
  });

  const relevantes = [];
  for (const cat in porCategoria) {
    const top3 = porCategoria[cat]
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 3);
    relevantes.push(...top3);
  }

  return relevantes;
}
```

**5. Cache Agresivo:**
```javascript
const NodeCache = require('node-cache');
const cacheIA = new NodeCache({ stdTTL: 3600 }); // 1 hora

async function obtenerRecomendacionConCache(contexto, productos) {
  // Clave basada en presupuesto y usos (ignorar preferencias menores)
  const cacheKey = `ia_${contexto.presupuesto?.min}_${contexto.presupuesto?.max}_${contexto.usosPrincipales.sort().join('_')}`;
  
  const cached = cacheIA.get(cacheKey);
  if (cached) {
    console.log('✓ Recomendación desde cache (sin costo IA)');
    return cached;
  }
  
  const recomendacion = await asistenteIA.generarRecomendacion(contexto, productos);
  cacheIA.set(cacheKey, recomendacion);
  
  return recomendacion;
}
```

**6. Historial Limitado:**
```javascript
// Solo últimos 3 mensajes (no toda la conversación)
const ultimosMensajes = historial.slice(-3);
```

**7. Timeout y Reintentos:**
```javascript
async function llamarIAConTimeout(prompt, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const resultado = await this.modelo.generateContent(prompt, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return resultado;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Timeout en IA, usando fallback');
      return null; // Usar fallback
    }
    throw error;
  }
}
```

**8. Monitoreo de Uso:**
```javascript
let contadorLlamadasIA = 0;
let costoEstimado = 0;

async function generarRecomendacionConMonitoreo(contexto, productos) {
  const inicio = Date.now();
  
  try {
    const resultado = await asistenteIA.generarRecomendacion(contexto, productos);
    
    contadorLlamadasIA++;
    const tokensEstimados = 500; // Estimado
    costoEstimado += tokensEstimados * 0.00001; // Costo por token
    
    console.log(`IA: ${contadorLlamadasIA} llamadas, ~$${costoEstimado.toFixed(4)} gastado`);
    
    return resultado;
  } catch (error) {
    console.error('Error en IA:', error);
    throw error;
  }
}

// Endpoint para monitorear uso
app.get('/api/admin/ia-stats', middlewareAuth, (req, res) => {
  res.json({
    llamadas: contadorLlamadasIA,
    costoEstimado: costoEstimado.toFixed(4),
    promedioTokens: 500
  });
});
```

### Estimación de Costos

**Gemini 1.5 Flash:**
- Input: $0.075 / 1M tokens
- Output: $0.30 / 1M tokens
- Promedio por recomendación: ~500 tokens total
- Costo por recomendación: ~$0.0002 USD

**Con Optimizaciones:**
- Cache hit rate: 40-60%
- Costo efectivo: ~$0.0001 por recomendación
- 1000 recomendaciones/mes: ~$0.10 USD
- 10,000 recomendaciones/mes: ~$1.00 USD

**Comparación:**
- Sin optimizaciones: $5-10/mes para 1000 recomendaciones
- Con optimizaciones: $0.10-0.50/mes para 1000 recomendaciones
- Ahorro: 90-95%

