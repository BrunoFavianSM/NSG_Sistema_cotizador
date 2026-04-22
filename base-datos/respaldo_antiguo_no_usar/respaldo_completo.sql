--
-- PostgreSQL database dump
--

\restrict QIzhMulKcvdbOk1RwCe3eDE8drCL1nXjCJPyrp33EpaWJcWlNvNLDwa5mBxvicP

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: actualizar_updated_at(); Type: FUNCTION; Schema: public; Owner: nsg_user
--

CREATE FUNCTION public.actualizar_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_updated_at() OWNER TO nsg_user;

--
-- Name: generar_codigo_ticket(); Type: FUNCTION; Schema: public; Owner: nsg_user
--

CREATE FUNCTION public.generar_codigo_ticket() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  anio INTEGER;
  seq_name VARCHAR;
  nuevo_numero BIGINT;
  nuevo_codigo VARCHAR;
BEGIN
  anio := EXTRACT(YEAR FROM CURRENT_DATE);
  seq_name := 'seq_ticket_' || anio;

  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = seq_name) THEN
    EXECUTE format('CREATE SEQUENCE %I START 1', seq_name);
  END IF;

  EXECUTE format('SELECT nextval(%L)', seq_name) INTO nuevo_numero;
  nuevo_codigo := 'NSG-' || anio || '-' || LPAD(nuevo_numero::TEXT, 4, '0');
  RETURN nuevo_codigo;
END;
$$;


ALTER FUNCTION public.generar_codigo_ticket() OWNER TO nsg_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: administradores; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.administradores (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    nombre_completo character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.administradores OWNER TO nsg_user;

--
-- Name: administradores_id_seq; Type: SEQUENCE; Schema: public; Owner: nsg_user
--

CREATE SEQUENCE public.administradores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.administradores_id_seq OWNER TO nsg_user;

--
-- Name: administradores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nsg_user
--

ALTER SEQUENCE public.administradores_id_seq OWNED BY public.administradores.id;


--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.auditoria (
    id integer NOT NULL,
    tabla_afectada character varying(50) NOT NULL,
    accion character varying(20) NOT NULL,
    id_registro integer,
    id_usuario integer,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    ip_address character varying(45),
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.auditoria OWNER TO nsg_user;

--
-- Name: auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: nsg_user
--

CREATE SEQUENCE public.auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_id_seq OWNER TO nsg_user;

--
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nsg_user
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre character varying(60) NOT NULL,
    es_componente_principal boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.categorias OWNER TO nsg_user;

--
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: nsg_user
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_id_seq OWNER TO nsg_user;

--
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nsg_user
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- Name: configuracion; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.configuracion (
    id integer NOT NULL,
    clave character varying(50) NOT NULL,
    valor character varying(255) NOT NULL,
    descripcion text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.configuracion OWNER TO nsg_user;

--
-- Name: configuracion_id_seq; Type: SEQUENCE; Schema: public; Owner: nsg_user
--

CREATE SEQUENCE public.configuracion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.configuracion_id_seq OWNER TO nsg_user;

--
-- Name: configuracion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nsg_user
--

ALTER SEQUENCE public.configuracion_id_seq OWNED BY public.configuracion.id;


--
-- Name: conversaciones_ia; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.conversaciones_ia (
    id integer NOT NULL,
    sesion_id uuid DEFAULT gen_random_uuid() NOT NULL,
    contexto_cliente jsonb NOT NULL,
    historial_mensajes jsonb NOT NULL,
    estado character varying(20) DEFAULT 'activa'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.conversaciones_ia OWNER TO nsg_user;

--
-- Name: conversaciones_ia_id_seq; Type: SEQUENCE; Schema: public; Owner: nsg_user
--

CREATE SEQUENCE public.conversaciones_ia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversaciones_ia_id_seq OWNER TO nsg_user;

--
-- Name: conversaciones_ia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nsg_user
--

ALTER SEQUENCE public.conversaciones_ia_id_seq OWNED BY public.conversaciones_ia.id;


--
-- Name: cotizaciones; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.cotizaciones (
    id integer NOT NULL,
    codigo_unico uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo_ticket character varying(20) NOT NULL,
    id_cliente integer,
    fecha_emision timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_validez timestamp without time zone NOT NULL,
    moneda_base character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    subtotal_neto numeric(12,2) DEFAULT 0 NOT NULL,
    igv_porcentaje numeric(5,2) DEFAULT 18 NOT NULL,
    igv_monto numeric(12,2) DEFAULT 0 NOT NULL,
    total_con_igv numeric(12,2) DEFAULT 0 NOT NULL,
    tipo_cambio_referencia numeric(10,4) DEFAULT 1 NOT NULL,
    subtotal_neto_pen numeric(12,2) DEFAULT 0 NOT NULL,
    igv_monto_pen numeric(12,2) DEFAULT 0 NOT NULL,
    total_con_igv_pen numeric(12,2) DEFAULT 0 NOT NULL,
    precio_total numeric(10,2) NOT NULL,
    margen_aplicado numeric(5,2) NOT NULL,
    estado character varying(20) DEFAULT 'Pendiente'::character varying NOT NULL,
    fecha_reclamacion timestamp without time zone,
    id_vendedor integer,
    notas_vendedor text,
    CONSTRAINT check_estado_valido CHECK (((estado)::text = ANY ((ARRAY['Pendiente'::character varying, 'Completada'::character varying, 'Caducada'::character varying, 'Reclamada'::character varying])::text[]))),
    CONSTRAINT check_precio_total_positive CHECK ((precio_total > (0)::numeric))
);


ALTER TABLE public.cotizaciones OWNER TO nsg_user;

--
-- Name: cotizaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: nsg_user
--

CREATE SEQUENCE public.cotizaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cotizaciones_id_seq OWNER TO nsg_user;

--
-- Name: cotizaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nsg_user
--

ALTER SEQUENCE public.cotizaciones_id_seq OWNED BY public.cotizaciones.id;


--
-- Name: detalle_cotizacion; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.detalle_cotizacion (
    id integer NOT NULL,
    id_cotizacion integer NOT NULL,
    id_producto integer NOT NULL,
    tabla_producto character varying(60) DEFAULT 'productos'::character varying NOT NULL,
    nombre_producto character varying(200) NOT NULL,
    categoria character varying(50) NOT NULL,
    descripcion_tecnica text,
    costo_unitario_neto_usd numeric(12,2) DEFAULT 0 NOT NULL,
    margen_aplicado numeric(5,2) DEFAULT 0 NOT NULL,
    precio_unitario_neto_usd numeric(12,2) DEFAULT 0 NOT NULL,
    igv_unitario_usd numeric(12,2) DEFAULT 0 NOT NULL,
    precio_unitario_total_usd numeric(12,2) DEFAULT 0 NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    cantidad integer DEFAULT 1 NOT NULL,
    disponible_stock boolean NOT NULL,
    CONSTRAINT check_cantidad_positive CHECK ((cantidad > 0)),
    CONSTRAINT check_precio_unitario_positive CHECK ((precio_unitario > (0)::numeric))
);


ALTER TABLE public.detalle_cotizacion OWNER TO nsg_user;

--
-- Name: detalle_cotizacion_id_seq; Type: SEQUENCE; Schema: public; Owner: nsg_user
--

CREATE SEQUENCE public.detalle_cotizacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_cotizacion_id_seq OWNER TO nsg_user;

--
-- Name: detalle_cotizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nsg_user
--

ALTER SEQUENCE public.detalle_cotizacion_id_seq OWNED BY public.detalle_cotizacion.id;


--
-- Name: marcas; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.marcas (
    id integer NOT NULL,
    nombre character varying(120) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.marcas OWNER TO nsg_user;

--
-- Name: marcas_id_seq; Type: SEQUENCE; Schema: public; Owner: nsg_user
--

CREATE SEQUENCE public.marcas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.marcas_id_seq OWNER TO nsg_user;

--
-- Name: marcas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nsg_user
--

ALTER SEQUENCE public.marcas_id_seq OWNED BY public.marcas.id;


--
-- Name: notificaciones_cotizacion; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.notificaciones_cotizacion (
    id integer NOT NULL,
    id_cotizacion integer NOT NULL,
    tipo character varying(50) DEFAULT 'listo_recojo'::character varying NOT NULL,
    email_destino character varying(320) NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    payload jsonb,
    respuesta jsonb,
    mensaje_error text,
    fecha_intento timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_envio timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_notificacion_estado CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'enviada'::character varying, 'fallida'::character varying])::text[])))
);


ALTER TABLE public.notificaciones_cotizacion OWNER TO nsg_user;

--
-- Name: notificaciones_cotizacion_id_seq; Type: SEQUENCE; Schema: public; Owner: nsg_user
--

CREATE SEQUENCE public.notificaciones_cotizacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificaciones_cotizacion_id_seq OWNER TO nsg_user;

--
-- Name: notificaciones_cotizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nsg_user
--

ALTER SEQUENCE public.notificaciones_cotizacion_id_seq OWNED BY public.notificaciones_cotizacion.id;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    id_categoria integer NOT NULL,
    id_marca integer,
    subcategoria character varying(40),
    categoria_proveedor character varying(200),
    codigo_proveedor character varying(100) NOT NULL,
    nombre character varying(320) NOT NULL,
    descripcion_general text,
    precio_base numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    disponible_a_pedido boolean DEFAULT false NOT NULL,
    garantia character varying(100),
    flete character varying(100),
    imagen_url character varying(500),
    imagen_path character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT productos_precio_base_check CHECK (((precio_base > (0)::numeric) AND (precio_base <= (100000)::numeric))),
    CONSTRAINT productos_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.productos OWNER TO nsg_user;

--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: nsg_user
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO nsg_user;

--
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nsg_user
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- Name: specs_almacenamiento; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.specs_almacenamiento (
    id_producto integer NOT NULL,
    tipo_almacenamiento character varying(40),
    capacidad_gb integer,
    interfaz character varying(40),
    form_factor character varying(30),
    velocidad_lectura_mbps integer,
    velocidad_escritura_mbps integer,
    nvme_gen character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.specs_almacenamiento OWNER TO nsg_user;

--
-- Name: specs_case; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.specs_case (
    id_producto integer NOT NULL,
    form_factor character varying(30),
    compatibilidad_placa character varying(60),
    max_gpu_mm integer,
    max_cooler_mm integer,
    ventiladores_incluidos integer,
    color character varying(40),
    panel_lateral character varying(60),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.specs_case OWNER TO nsg_user;

--
-- Name: specs_fuente; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.specs_fuente (
    id_producto integer NOT NULL,
    wattage integer,
    certificacion character varying(30),
    modular character varying(30),
    form_factor character varying(30),
    pcie_conectores integer,
    sata_conectores integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.specs_fuente OWNER TO nsg_user;

--
-- Name: specs_gpu; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.specs_gpu (
    id_producto integer NOT NULL,
    chipset character varying(120),
    vram_gb integer,
    vram_tipo character varying(30),
    bus_bits integer,
    boost_mhz integer,
    tdp_w integer,
    longitud_mm integer,
    fuente_recomendada_w integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.specs_gpu OWNER TO nsg_user;

--
-- Name: specs_placa_madre; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.specs_placa_madre (
    id_producto integer NOT NULL,
    socket character varying(50),
    chipset character varying(80),
    form_factor character varying(30),
    ram_tipo character varying(30),
    max_ram_gb integer,
    slots_ram integer,
    pcie_version character varying(20),
    m2_slots integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.specs_placa_madre OWNER TO nsg_user;

--
-- Name: specs_procesador; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.specs_procesador (
    id_producto integer NOT NULL,
    socket character varying(50),
    arquitectura character varying(80),
    nucleos integer,
    hilos integer,
    frecuencia_base_ghz numeric(4,2),
    frecuencia_boost_ghz numeric(4,2),
    tdp_w integer,
    graficos_integrados boolean,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.specs_procesador OWNER TO nsg_user;

--
-- Name: specs_ram; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.specs_ram (
    id_producto integer NOT NULL,
    ram_tipo character varying(30),
    capacidad_gb integer,
    velocidad_mhz integer,
    latencia character varying(20),
    modulos character varying(30),
    cantidad_modulos integer,
    rgb boolean,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.specs_ram OWNER TO nsg_user;

--
-- Name: usuarios_clientes; Type: TABLE; Schema: public; Owner: nsg_user
--

CREATE TABLE public.usuarios_clientes (
    id integer NOT NULL,
    nombre character varying(100),
    correo character varying(300) NOT NULL,
    correo_hash character varying(64),
    telefono character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios_clientes OWNER TO nsg_user;

--
-- Name: usuarios_clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: nsg_user
--

CREATE SEQUENCE public.usuarios_clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_clientes_id_seq OWNER TO nsg_user;

--
-- Name: usuarios_clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nsg_user
--

ALTER SEQUENCE public.usuarios_clientes_id_seq OWNED BY public.usuarios_clientes.id;


--
-- Name: administradores id; Type: DEFAULT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.administradores ALTER COLUMN id SET DEFAULT nextval('public.administradores_id_seq'::regclass);


--
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);


--
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- Name: configuracion id; Type: DEFAULT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.configuracion ALTER COLUMN id SET DEFAULT nextval('public.configuracion_id_seq'::regclass);


--
-- Name: conversaciones_ia id; Type: DEFAULT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.conversaciones_ia ALTER COLUMN id SET DEFAULT nextval('public.conversaciones_ia_id_seq'::regclass);


--
-- Name: cotizaciones id; Type: DEFAULT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.cotizaciones ALTER COLUMN id SET DEFAULT nextval('public.cotizaciones_id_seq'::regclass);


--
-- Name: detalle_cotizacion id; Type: DEFAULT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.detalle_cotizacion ALTER COLUMN id SET DEFAULT nextval('public.detalle_cotizacion_id_seq'::regclass);


--
-- Name: marcas id; Type: DEFAULT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.marcas ALTER COLUMN id SET DEFAULT nextval('public.marcas_id_seq'::regclass);


--
-- Name: notificaciones_cotizacion id; Type: DEFAULT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.notificaciones_cotizacion ALTER COLUMN id SET DEFAULT nextval('public.notificaciones_cotizacion_id_seq'::regclass);


--
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- Name: usuarios_clientes id; Type: DEFAULT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.usuarios_clientes ALTER COLUMN id SET DEFAULT nextval('public.usuarios_clientes_id_seq'::regclass);


--
-- Data for Name: administradores; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.administradores (id, username, password_hash, nombre_completo, created_at) FROM stdin;
1	admin@nsg.com	$2b$10$BeaikSwBWfGGgGwtI0ysMu0EomTglIR6tGSXc.m/PoQqhwvIKFGaW	Admin	2026-04-15 17:00:20.96201
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.auditoria (id, tabla_afectada, accion, id_registro, id_usuario, datos_anteriores, datos_nuevos, ip_address, "timestamp") FROM stdin;
\.


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.categorias (id, nombre, es_componente_principal, created_at) FROM stdin;
1	procesador	t	2026-04-15 16:49:46.434864
2	placa_madre	t	2026-04-15 16:49:46.434864
3	ram	t	2026-04-15 16:49:46.434864
4	almacenamiento	t	2026-04-15 16:49:46.434864
5	gpu	t	2026-04-15 16:49:46.434864
6	fuente	t	2026-04-15 16:49:46.434864
7	case	t	2026-04-15 16:49:46.434864
8	perifericos	f	2026-04-15 16:49:46.434864
9	audio	f	2026-04-15 16:49:46.434864
10	software	f	2026-04-15 16:49:46.434864
11	almacenamiento_externo	f	2026-04-15 16:49:46.434864
12	energia	f	2026-04-15 16:49:46.434864
13	monitor	f	2026-04-15 16:49:46.434864
14	refrigeracion	f	2026-04-15 16:49:46.434864
15	conectividad	f	2026-04-15 16:49:46.434864
16	mouse	f	2026-04-15 16:49:46.434864
17	teclado	f	2026-04-15 16:49:46.434864
18	webcam	f	2026-04-15 16:49:46.434864
19	auricular	f	2026-04-15 16:49:46.434864
20	parlante	f	2026-04-15 16:49:46.434864
21	ups	f	2026-04-15 16:49:46.434864
22	estabilizador	f	2026-04-15 16:49:46.434864
23	cooler_aire	f	2026-04-15 16:49:46.434864
24	cooler_liquido	f	2026-04-15 16:49:46.434864
25	mousepad	f	2026-04-15 16:49:46.434864
\.


--
-- Data for Name: configuracion; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.configuracion (id, clave, valor, descripcion, updated_at) FROM stdin;
1	margen_ganancia_default	20	Porcentaje de margen por defecto para cotizaciones	2026-04-15 16:49:46.434864
2	tasa_igv	18	Porcentaje de IGV aplicado al precio neto	2026-04-15 16:49:46.434864
3	tipo_cambio_usd_pen	3.75	Tipo de cambio referencial USD a PEN	2026-04-15 16:49:46.434864
\.


--
-- Data for Name: conversaciones_ia; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.conversaciones_ia (id, sesion_id, contexto_cliente, historial_mensajes, estado, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cotizaciones; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.cotizaciones (id, codigo_unico, codigo_ticket, id_cliente, fecha_emision, fecha_validez, moneda_base, subtotal_neto, igv_porcentaje, igv_monto, total_con_igv, tipo_cambio_referencia, subtotal_neto_pen, igv_monto_pen, total_con_igv_pen, precio_total, margen_aplicado, estado, fecha_reclamacion, id_vendedor, notas_vendedor) FROM stdin;
\.


--
-- Data for Name: detalle_cotizacion; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.detalle_cotizacion (id, id_cotizacion, id_producto, tabla_producto, nombre_producto, categoria, descripcion_tecnica, costo_unitario_neto_usd, margen_aplicado, precio_unitario_neto_usd, igv_unitario_usd, precio_unitario_total_usd, precio_unitario, cantidad, disponible_stock) FROM stdin;
\.


--
-- Data for Name: marcas; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.marcas (id, nombre, created_at) FROM stdin;
1	acer	2026-04-15 17:02:11.054651
2	biwin	2026-04-15 17:02:11.132667
3	hiksemi	2026-04-15 17:02:11.140441
4	kingston	2026-04-15 17:02:11.150527
5	samsung	2026-04-15 17:02:11.200571
6	sandisk	2026-04-15 17:02:11.212522
7	seagate	2026-04-15 17:02:11.225111
8	teamgroup	2026-04-15 17:02:11.229013
9	toshiba - storage	2026-04-15 17:02:11.256331
10	western digital	2026-04-15 17:02:11.270631
11	lenovo - idea	2026-04-15 17:02:11.343971
12	lenovo - thinkpad	2026-04-15 17:02:11.345584
13	logitech	2026-04-15 17:02:11.3495
14	teros	2026-04-15 17:02:11.350976
15	landbyte	2026-04-15 17:02:11.361682
16	advance computer corp	2026-04-15 17:02:11.379345
17	asus	2026-04-15 17:02:11.384263
18	cooler master	2026-04-15 17:02:11.391643
19	msi	2026-04-15 17:02:11.400002
20	d-link	2026-04-15 17:02:11.436742
21	cdp chicago digital power	2026-04-15 17:02:11.454558
22	elise	2026-04-15 17:02:11.460536
23	tripp-lite	2026-04-15 17:02:11.488089
24	asrock	2026-04-15 17:02:11.491651
25	gigabyte	2026-04-15 17:02:11.523486
26	pny technologies	2026-04-15 17:02:11.674352
27	xfx	2026-04-15 17:02:11.678753
28	amd-advanced micro device	2026-04-15 17:02:11.701544
29	hp comercial	2026-04-15 17:02:11.707575
30	lg electronics	2026-04-15 17:02:11.736323
31	epson	2026-04-15 17:02:11.781797
32	intel corp	2026-04-15 17:02:12.145089
33	intel oem	2026-04-15 17:02:12.173032
34	a-data	2026-04-15 17:02:12.188366
35	corsair	2026-04-15 17:02:12.19894
36	lenovo - storage	2026-04-15 17:02:12.280734
37	patriot	2026-04-15 17:02:12.283898
38	predator	2026-04-15 17:02:12.286257
39	pccooler	2026-04-15 17:02:12.321034
40	bit defender	2026-04-15 17:02:12.3379
41	eset	2026-04-15 17:02:12.350483
42	kaspersky	2026-04-15 17:02:12.370544
43	microsoft oem	2026-04-15 17:02:12.398747
\.


--
-- Data for Name: notificaciones_cotizacion; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.notificaciones_cotizacion (id, id_cotizacion, tipo, email_destino, estado, payload, respuesta, mensaje_error, fecha_intento, fecha_envio, created_at) FROM stdin;
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.productos (id, id_categoria, id_marca, subcategoria, categoria_proveedor, codigo_proveedor, nombre, descripcion_general, precio_base, stock, disponible_a_pedido, garantia, flete, imagen_url, imagen_path, created_at, updated_at) FROM stdin;
1	4	1	\N	ssd 2.5 sata	ssdacbl9bwwa102	unidad de estado solido acer sa100, 240gb, 2.5&#8243;, sata lll (6gb/s)	\N	47.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.10926	2026-04-15 17:02:11.10926
2	4	1	\N	ssd 2.5 sata	ssdacbl9bwwa103	unidad de estado solido acer sa100, 480gb, 2.5&#8243;, sata lll (6gb/s)	\N	80.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.12636	2026-04-15 17:02:11.12636
3	4	1	\N	ssd m.2 nvme	ssdacbl9bwwa119	unidad en estado solido (ssd) acer fa100 m.2 pcienvme	\N	85.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:11.130117	2026-04-15 17:02:11.130117
4	4	2	\N	ssd 2.5 sata	ssd2tbwm100	disco solido ssd biwin m100 2 tb sata iii 2.5, 550 mb/s 500 mb/s	\N	170.00	6	f	\N	\N	\N	\N	2026-04-15 17:02:11.13344	2026-04-15 17:02:11.13344
5	4	2	\N	ssd 2.5 sata	ssd256gbwm100	unidad en estado solido (ssd) biwin m100, 256gb, sata iii (6.0gb/s), 2.5	\N	48.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.135967	2026-04-15 17:02:11.135967
6	4	2	\N	ssd 2.5 sata	ssd512gbwm100	unidad en estado solido biwin m100, 512gb, sata 6gb/s, 2.5	\N	75.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.138157	2026-04-15 17:02:11.138157
7	4	3	\N	ssd m.2 nvme	ssdhsfutlit512	unidad de estado solido hiksemi future lite, 512 gb, m.2 2280, gen 4.0 x 4, 6320 mb/s	\N	84.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.141321	2026-04-15 17:02:11.141321
8	4	3	\N	ssd 2.5 sata	ssdhswaves1024	unidad de estado solido hiksemi hs-ssd wave (s),1024gb, sata iii, 2.5, 550 mb/s	\N	136.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.144101	2026-04-15 17:02:11.144101
9	4	3	\N	ssd 2.5 sata	ssdhswaves256	unidad en estado solido (ssd) hiksemi hs-ssd-wave(s) 256gb, 2.5, sata iii	\N	47.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.146667	2026-04-15 17:02:11.146667
10	4	3	\N	ssd 2.5 sata	ssdhswaves512	unidad en estado solido (ssd) hiksemi hs-ssd-wave(s) 512gb, 2.5, sata iii	\N	76.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.148556	2026-04-15 17:02:11.148556
11	4	4	\N	ssd m.2 nvme	ssdktnv3sm32000	ssd kingston nv3 pcie 4.0 nvme de 2 tb	\N	260.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.1513	2026-04-15 17:02:11.1513
12	4	4	\N	ssd m.2 nvme	ssdktnv3sm3500	ssd kingston nv3 pcie 4.0 nvme de 500 gb	\N	89.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.152959	2026-04-15 17:02:11.152959
13	4	4	\N	ssd 2.5 sata	ssdktsa400s240g	unidad de estado solido kingston a400, 240gb, sata 6gb/s, 2.5, 7mm, tlc.	\N	51.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.155073	2026-04-15 17:02:11.155073
14	4	4	\N	ssd 2.5 sata	ssdktsa400s480g	unidad de estado solido kingston a400, 480gb, sata 6gb/s, 2.5, 7mm.	\N	99.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.158047	2026-04-15 17:02:11.158047
15	4	4	\N	ssd 2.5 sata	ssdktsa400s960g	unidad de estado solido kingston a400, 960gb, sata 6.0 gb/s, 2.5, 7mm.	\N	121.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.160559	2026-04-15 17:02:11.160559
16	4	4	\N	ssd m.2 nvme	ssdktsnv3m1000	unidad en estado solido kingston 1000gb nv3 pcie 4.0 nvme m.2 ssd	\N	140.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.163394	2026-04-15 17:02:11.163394
17	4	4	\N	ssd m.2 nvme	ssdktsnv3m2000	unidad en estado solido kingston 2000gb nv3 pcie 4.0 nvme m.2 ssd	\N	237.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.165505	2026-04-15 17:02:11.165505
18	4	4	\N	ssd m.2 nvme	ssdktsnv3m4000	unidad en estado solido kingston 4000gb nv3 pcie 4.0 nvme m.2 ssd	\N	405.00	19	f	\N	\N	\N	\N	2026-04-15 17:02:11.167491	2026-04-15 17:02:11.167491
19	4	4	\N	ssd m.2 nvme	ssdktsnv3m500	unidad en estado solido kingston 500gb nv3 pcie 4.0 nvme m.2 ssd	\N	98.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.169336	2026-04-15 17:02:11.169336
20	4	4	\N	ssd 2.5 sata	ssdktdc600m1920	unidad en estado solido kingston dc600m 1920gb, sata rev. 3.0 (6gb/seg), 2.5	\N	653.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.170936	2026-04-15 17:02:11.170936
21	4	4	\N	ssd 2.5 sata	ssdktdc600m3840	unidad en estado solido kingston dc600m 3840gb, sata rev. 3.0 (6gb/seg), 2.5	\N	1500.00	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.17308	2026-04-15 17:02:11.17308
22	4	4	\N	ssd 2.5 sata	ssdktdc600m480	unidad en estado solido kingston dc600m 480gb, sata rev. 3.0 (6gb/seg), 2.5	\N	266.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:11.175202	2026-04-15 17:02:11.175202
23	4	4	\N	ssd 2.5 sata	ssdktdc600m7680	unidad en estado solido kingston dc600m 7680gb, sata rev. 3.0 (6gb/seg), 2.5	\N	2100.00	18	f	\N	\N	\N	\N	2026-04-15 17:02:11.177642	2026-04-15 17:02:11.177642
24	4	4	\N	ssd 2.5 sata	ssdktdc600m960	unidad en estado solido kingston dc600m 960gb, sata rev. 3.0 (6gb/seg), 2.5	\N	373.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.179439	2026-04-15 17:02:11.179439
25	4	4	\N	ssd m.2 nvme	ssdktsfyrsk1000	unidad en estado solido kingston fury renegade 1tb, m.2 2280 pcie 4.0 x4 nvme.	\N	272.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.181231	2026-04-15 17:02:11.181231
26	4	4	\N	ssd m.2 nvme	ssdktsfyrdk2000	unidad en estado solido kingston fury renegade 2tb, m.2 2280 pcie 4.0 x4 nvme.	\N	455.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.182888	2026-04-15 17:02:11.182888
27	4	4	\N	ssd m.2 nvme	ssdktsfyrdk4000	unidad en estado solido kingston fury renegade 4tb, m.2 2280 pcie 4.0 x4 nvme.	\N	856.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.184507	2026-04-15 17:02:11.184507
28	4	4	\N	ssd m.2 nvme	ssdktsfyr2s1t0	unidad en estado solido kingston fury renegade g5, 1024gb, m.2 2280, nvme pcie 5.0 x4	\N	360.00	7	f	\N	\N	\N	\N	2026-04-15 17:02:11.186346	2026-04-15 17:02:11.186346
29	4	4	\N	ssd m.2 nvme	ssdktsfyr2s2t0	unidad en estado solido kingston fury renegade g5, 2048gb, m.2 2280, nvme pcie 5.0 x4	\N	490.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.188588	2026-04-15 17:02:11.188588
30	4	4	\N	ssd m.2 nvme	ssdktsfyr2s4t0	unidad en estado solido kingston fury renegade g5, 4096gb, m.2 2280, nvme pcie 5.0 x4	\N	895.00	9	f	\N	\N	\N	\N	2026-04-15 17:02:11.190173	2026-04-15 17:02:11.190173
31	4	4	\N	ssd m.2 nvme	ssdkt3000m1024	unidad en estado solido kingston kc3000, 1024gb, m.2 2280 pcie gen 4.0 nvme	\N	174.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.192468	2026-04-15 17:02:11.192468
32	4	4	\N	ssd m.2 nvme	ssdkt3000m4096	unidad en estado solido kingston kc3000, 4096gb, m.2 2280 pcie gen 4.0 nvme	\N	662.00	6	f	\N	\N	\N	\N	2026-04-15 17:02:11.194704	2026-04-15 17:02:11.194704
33	4	4	\N	ssd 2.5 sata	ssdktskc600256g	unidad en estado solido kingston kc600, 256gb, sata 6.0 gbps, 2.5, 7mm.	\N	54.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.196679	2026-04-15 17:02:11.196679
34	4	4	\N	ssd 2.5 sata	ssdktskc600512g	unidad en estado solido kingston kc600, 512gb, sata 6.0 gbps, 2.5, 7mm.	\N	89.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.198275	2026-04-15 17:02:11.198275
35	4	5	\N	ssd 2.5 sata	ssdsm870evo500e	unidad en estado solido samsung 870 evo 500gb, 2.5, sata 6gb/s	\N	171.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.201407	2026-04-15 17:02:11.201407
36	4	5	\N	ssd m.2 nvme	ssdsm9100pro1tb	unidad en estado solido samsung 9100 pro 1tb m.2 2280, pcie 5.0 x4 nvme 2.0	\N	277.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.20342	2026-04-15 17:02:11.20342
37	4	5	\N	ssd m.2 nvme	ssdsm990evop2tb	unidad en estado solido samsung 990 evo plus 2tb m.2 2280, pcie 4.0 x4 / 5.0 x2 nvme	\N	326.50	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.205727	2026-04-15 17:02:11.205727
38	4	5	\N	ssd m.2 nvme	ssdsm990pro1tb	unidad en estado solido samsung 990 pro 1tb m.2 2280, pcie gen 4.0 x4, nvme 2.0	\N	208.00	6	f	\N	\N	\N	\N	2026-04-15 17:02:11.208028	2026-04-15 17:02:11.208028
39	4	5	\N	ssd m.2 nvme	ssdsm990pro2tb	unidad en estado solido samsung 990 pro 2tb m.2 2280, pcie gen 4.0 x4, nvme 2.0	\N	398.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.210626	2026-04-15 17:02:11.210626
40	4	6	\N	ssd m.2 nvme	ssdwds100t4g0e	unidad en estado solido wd green sn3000 nvme 1tb m.2 2280, pcie gen 4.0 x4, nvme	\N	310.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.213563	2026-04-15 17:02:11.213563
41	4	6	\N	ssd m.2 nvme	ssdwds500g4g0e	unidad en estado solido wd green sn3000 nvme 500gb m.2 2280, pcie gen 4.0 x4, nvme[@@	\N	165.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.217369	2026-04-15 17:02:11.217369
42	4	6	\N	ssd m.2 nvme	ssdwds200t3g0c	unidad en estado solido western digital green sn350 nvme 2tb m.2 2280, pcie gen3 x4[@	\N	205.50	12	f	\N	\N	\N	\N	2026-04-15 17:02:11.219458	2026-04-15 17:02:11.219458
43	4	6	\N	ssd 2.5 sata	ssdwds100t3g0a	unidad en estado solido western digital green, wds100t3g0a, 1tb, sata 6gb/s, 2.5, 7m	\N	97.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.22121	2026-04-15 17:02:11.22121
44	4	6	\N	ssd m.2 nvme	ssdwds400t4x0e	unidad ssd western digital wd_black sn7100 nvme -4 tb	\N	486.00	10	f	\N	\N	\N	\N	2026-04-15 17:02:11.223095	2026-04-15 17:02:11.223095
45	4	7	\N	disco duro 3.5 sata	hdist8000dm004	disco duro seagate barracuda st8000dm004, 8tb, sata 6.0 gb/s, 5400 rpm, 3.5.	\N	221.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.226073	2026-04-15 17:02:11.226073
46	4	8	\N	ssd 2.5 sata	ssd1ttgcx2s6g	unidad de estado solido teamgroup cx2, 1tb, sata 6.0 gb/s, 2.5, ecc, dc +5v	\N	120.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.22975	2026-04-15 17:02:11.22975
47	4	8	\N	ssd 2.5 sata	ssdtgt253x6256g	unidad de estado solido teamgroup cx2, 256gb, sata 6.0 gb/s, 2.5, ecc, dc +5v	\N	46.55	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.231561	2026-04-15 17:02:11.231561
48	4	8	\N	ssd 2.5 sata	ssdtgt253x6512g	unidad de estado solido teamgroup cx2, 512gb, sata 6.0 gb/s, 2.5, ecc, dc +5v	\N	85.52	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.233339	2026-04-15 17:02:11.233339
49	4	8	\N	ssd 2.5 sata	ssdtg256ggx2	unidad de estado solido teamgroup gx2 256gb, sata6.0 gbps, 2.5, 7mm.	\N	46.55	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.234984	2026-04-15 17:02:11.234984
50	4	8	\N	ssd m.2 nvme	ssd500gtgmp44l	unidad de estado solido teamgroup mp44l 500gb, m.2, pci-e 4.0 x4 con nvme 1.4	\N	102.65	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.236527	2026-04-15 17:02:11.236527
51	4	8	\N	ssd m.2 nvme	ssd1ttgnv5000p4	unidad de estado solido teamgroup nv5000 m.2 pcie4.0 ssd m.2 1tb, pcie gen4x4 con nvm	\N	157.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.238371	2026-04-15 17:02:11.238371
52	4	8	\N	ssd m.2 nvme	ssd2ttgnv5000m2	unidad de estado solido teamgroup nv5000 m.2 pcie4.0 ssd m.2 2tb, pcie gen4x4 con nvm	\N	197.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.240161	2026-04-15 17:02:11.240161
53	4	8	\N	ssd m.2 nvme	ssd1ttgmp33fp60	unidad en estado solido mp33 m.2 pcie ssd, 1tb, dc +3.3v	\N	166.65	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.242718	2026-04-15 17:02:11.242718
54	4	8	\N	ssd m.2 nvme	ssd256tfmp33m24	unidad en estado solido mp33 m.2 pcie ssd, 256gb,dc +3.3v	\N	62.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.244631	2026-04-15 17:02:11.244631
55	4	8	\N	ssd 2.5 sata	ssd1ttfvulcanz	unidad en estado solido t-force vulcan z, 1tb, sata 6gb/s, 2.5, negro, dc +5v	\N	120.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.246063	2026-04-15 17:02:11.246063
56	4	8	\N	ssd 2.5 sata	ssd256gtfvuclz	unidad en estado solido t-force vulcan z, 256gb, sata 6gb/s, 2.5, negro, dc +5v	\N	51.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.247668	2026-04-15 17:02:11.247668
57	4	8	\N	ssd m.2 sata	ssd1ttgms30m2s3	unidad en estado solido teamgroup 1tb ms30 m.2 2280 sata iii 6gb/s	\N	129.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.249247	2026-04-15 17:02:11.249247
58	4	8	\N	ssd m.2 sata	ssd512gtgms30m2	unidad en estado solido teamgroup 512gb ms30 m.2 2280 sata iii 6gb/s	\N	75.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.250775	2026-04-15 17:02:11.250775
59	4	8	\N	ssd m.2 nvme	ssd500gtgnv50p4	unidad en estado solido teamgroup nv5000, 500gb m.2 pcie ssd, 4,500 mb/s	\N	100.34	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.252318	2026-04-15 17:02:11.252318
60	4	8	\N	ssd m.2 sata	ssd256tgms30m2s	unidad en estado solido tg ms30 m.2 2280 256gb sata iii 6gb/s	\N	58.25	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.25402	2026-04-15 17:02:11.25402
61	4	9	\N	disco duro 3.5 sata	hdtowg51cxzsta	disco duro toshiba n300 nas, 12tb, sata 6.0gb/s, 7200rpm, 512mb cache, 3.5.	\N	234.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.257103	2026-04-15 17:02:11.257103
62	4	9	\N	disco duro 3.5 sata	hdtowg51exzsta	disco duro toshiba n300 nas, 14tb, sata 6.0gb/s, 7200rpm, 512mb cache, 3.5.	\N	254.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.261416	2026-04-15 17:02:11.261416
63	4	9	\N	disco duro 3.5 sata	hditon300p14tb	disco duro toshiba n300 pro, 14tb nas, sata 6.0gb/s, 7200rpm, 512mb cache, 3.5.	\N	299.00	7	f	\N	\N	\N	\N	2026-04-15 17:02:11.263356	2026-04-15 17:02:11.263356
64	4	9	\N	disco duro 3.5 sata	hditon300p16tb	disco duro toshiba n300 pro, 16tb nas, sata 6.0gb/s, 7200rpm, 512mb cache, 3.5.	\N	305.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.264921	2026-04-15 17:02:11.264921
65	4	9	\N	disco duro 3.5 sata	hdtowg51jxzsta	disco duro toshiba n300, 18tb, sata 6.0 gb/s, 7200rpm, 512mb cache, 3.5	\N	324.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.266618	2026-04-15 17:02:11.266618
66	4	9	\N	disco duro 3.5 sata	hditos3002tb	disco duro toshiba surveillance s300, 2tb sata 6.0gb/s, 5400rpm, 128mb cache, 3.5.[@	\N	73.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.26848	2026-04-15 17:02:11.26848
67	4	10	\N	disco duro 3.5 sata	hdiwd20ezbx	disco duro western digital blue wd20ezbx, 2tb, sata 6gb/s, 3.5 7200rpm, cache 256mb[	\N	76.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.271334	2026-04-15 17:02:11.271334
68	4	10	\N	disco duro 3.5 sata	hdiwd100efgx	disco duro western digital nas wd red plus 10 tb 3.5 sata / 260 mb/s / 7200 rpm	\N	264.00	20	f	\N	\N	\N	\N	2026-04-15 17:02:11.272967	2026-04-15 17:02:11.272967
69	4	10	\N	disco duro 3.5 sata	hdiwd8002purp	disco duro western digital purple pro, 8 tb, sata, 256mb cache, 7200rpm, 3.5	\N	244.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.274676	2026-04-15 17:02:11.274676
70	4	10	\N	disco duro 3.5 sata	hdiwd120efgx	disco duro western digital red plus nas wd120efgx, 12tb, sata, 7200rpm, 3.5, cache 5	\N	294.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.276739	2026-04-15 17:02:11.276739
71	4	10	\N	disco duro 3.5 sata	hdiwd80efpx	disco duro western digital red plus nas, wd80efpx8tb sata 6gb/s 5640rpm 3.5 256mb ca	\N	232.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.278248	2026-04-15 17:02:11.278248
72	4	10	\N	disco duro 3.5 sata	hdiwd60efpx	disco duro western digital red plus wd60efpx, 6tb, sata, 5400rpm, 3.5, cache 256mb[@	\N	173.00	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.28042	2026-04-15 17:02:11.28042
73	4	10	\N	disco duro 3.5 sata	hdiwd122kfbx	disco duro western digital red pro nas, wd122kfbx12tb sata 6gb/s 7200rpm 3.5 512mb c	\N	322.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.282019	2026-04-15 17:02:11.282019
74	4	10	\N	disco duro 3.5 sata	hdiwd142kfgx	disco duro western digital red pro nas, wd142kfgx14tb sata 6gb/s 7200rpm 3.5 512mb c	\N	348.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.283869	2026-04-15 17:02:11.283869
75	4	10	\N	disco duro 3.5 sata	hdiwd181purp	disco duro western digital wd purple pro 18tb, sata, 7200 rpm, 3.5, 512mb cache	\N	460.00	9	f	\N	\N	\N	\N	2026-04-15 17:02:11.285767	2026-04-15 17:02:11.285767
76	4	10	\N	disco duro 3.5 sata	hdiwd11purz	disco duro western digital wd purple, 1tb, sata 6.0 gb/s, 5400 rpm, 64mb cache, 3.5.	\N	78.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.287374	2026-04-15 17:02:11.287374
77	4	10	\N	disco duro 3.5 sata	hdiwd64purz	disco duro western digital wd purple, 6tb, sata 6.0 gb/s, 5400 rpm, 256mb cache, 3.5	\N	173.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.289416	2026-04-15 17:02:11.289416
78	4	10	\N	disco duro 3.5 sata	hdiwd40efzz	hd wd 4tb red plus sata 5400	\N	117.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.291352	2026-04-15 17:02:11.291352
79	11	4	almac_externo	mem flash, usb drive	accdtmc3g2128g	memoria flash kingston datatraveler micro unidad flash usb ultrapequeéo con metal pre	\N	18.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.294238	2026-04-15 17:02:11.294238
80	11	4	almac_externo	mem flash, usb drive	accdtmc3g2256g	memoria flash kingston datatraveler micro unidad flash usb ultrapequeéo con metal pre	\N	35.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.295235	2026-04-15 17:02:11.295235
81	11	4	almac_externo	mem flash, usb drive	accdtmc3g264gb	memoria flash kingston datatraveler micro unidad flash usb ultrapequeéo con metal pre	\N	14.39	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.296172	2026-04-15 17:02:11.296172
82	11	4	almac_externo	mem flash, usb drive	acckcu2l647ln	memoria flash usb datatraveler exodia m, 64gb, usb 3.2 gen 1 (tipo-a) neon pink (rosa	\N	5.45	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.297028	2026-04-15 17:02:11.297028
83	11	4	almac_externo	mem flash, usb drive	acckcu2l647lp	memoria flash usb datatraveler exodia m, 64gb, usb 3.2 gen 1 (tipo-a) neon purple (mo	\N	5.45	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.297788	2026-04-15 17:02:11.297788
84	11	4	almac_externo	mem flash, usb drive	acdtduo3cg3128	memoria flash usb kingston 128gb datatraveler microduo 3c 200mb/s dual usb-a + usb-c[	\N	24.95	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.298667	2026-04-15 17:02:11.298667
85	11	4	almac_externo	mem flash, usb drive	acdtduo3cg3256	memoria flash usb kingston 256gb datatraveler microduo 3c 200mb/s dual usb-a + usb-c[	\N	39.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:11.299553	2026-04-15 17:02:11.299553
86	11	4	almac_externo	mem flash, usb drive	acckdt70256gb	memoria flash usb kingston datatraveler 70, 256gbusb-c 3.2 gen 1	\N	20.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.300909	2026-04-15 17:02:11.300909
87	11	4	almac_externo	mem flash, usb drive	acktdt7064gb	memoria flash usb kingston datatraveler 70, 64gb,usb-c 3.2 gen1, presentacién en colg	\N	5.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.301807	2026-04-15 17:02:11.301807
88	11	4	almac_externo	mem flash, usb drive	acktdtx128gb	memoria flash usb kingston datatraveler exodia 128gb, usb 3.2 gen 1, color amarillo.[	\N	8.49	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.302643	2026-04-15 17:02:11.302643
89	11	4	almac_externo	mem flash, usb drive	acktdtx256gb	memoria flash usb kingston datatraveler exodia 256gb, usb 3.2 gen 1, color rojo.	\N	20.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.303541	2026-04-15 17:02:11.303541
90	11	4	almac_externo	mem flash, usb drive	acktdtx64gb	memoria flash usb kingston datatraveler exodia 64gb, usb 3.2 gen 1	\N	5.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.304288	2026-04-15 17:02:11.304288
91	11	4	almac_externo	mem flash, usb drive	ackcu2g647gb	memoria flash usb kingston datatraveler exodia 64gb, usb 3.2 gen 1, color azul.	\N	5.45	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.305114	2026-04-15 17:02:11.305114
92	11	4	almac_externo	mem flash, usb drive	acktdtxm128gb	memoria flash usb kingston datatraveler exodia m,128gb, usb 3.2 gen 1, rojo	\N	8.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.305979	2026-04-15 17:02:11.305979
93	11	4	almac_externo	mem flash, usb drive	acktdtxm256gb	memoria flash usb kingston datatraveler exodia m,256gb, usb 3.2 gen 1, azul	\N	20.01	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.306901	2026-04-15 17:02:11.306901
94	11	4	almac_externo	mem flash, usb drive	acktdtxm64gb	memoria flash usb kingston datatraveler exodia m,64gb, usb 3.2 gen 1, azul	\N	5.35	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.309076	2026-04-15 17:02:11.309076
95	11	4	almac_externo	mem flash, usb drive	acktdtxs512gby	memoria flash usb kingston datatraveler exodia s,512gb, interfaz: usb 3.2 gen 1, amar	\N	42.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.310302	2026-04-15 17:02:11.310302
96	11	4	almac_externo	mem flash, usb drive	acktdtxs64gbb	memoria flash usb kingston datatraveler exodia s,64gb, interfaz: usb 3.2 gen 1, negro	\N	5.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.311243	2026-04-15 17:02:11.311243
97	11	4	almac_externo	mem flash, usb drive	acktdtx64gbw	memoria flash usb kingston datatraveler exodia, 64gb, usb 3.2 gen 1, blanco	\N	5.45	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.311997	2026-04-15 17:02:11.311997
98	11	4	almac_externo	mem flash, usb drive	acktdtkn64gb	memoria flash usb kingston datatraveler kyson, 64gb, usb 3.2 gen 1, plata	\N	10.96	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.312762	2026-04-15 17:02:11.312762
99	11	4	almac_externo	mem flash, usb drive	acdtse9g3128gb	memoria flash usb kingston datatraveler se9 g3, 128gb, usb 3.2 gen 1 (tipo-a)	\N	19.87	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.313576	2026-04-15 17:02:11.313576
100	11	4	almac_externo	mem flash, usb drive	acdtse9g3256gb	memoria flash usb kingston datatraveler se9 g3, 256gb, usb 3.2 gen 1 (tipo-a)	\N	27.19	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.314461	2026-04-15 17:02:11.314461
101	11	4	almac_externo	mem flash, usb drive	acdtse9g3512gb	memoria flash usb kingston datatraveler se9 g3, 512gb, usb 3.2 gen 1 (tipo-a)	\N	64.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.315216	2026-04-15 17:02:11.315216
102	11	4	almac_externo	mem flash, usb drive	ackdtse9g364gb	memoria flash usb kingston datatraveler se9 g3, 64gb, usb 3.2 gen 1 (tipo-a)	\N	11.97	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.316621	2026-04-15 17:02:11.316621
103	11	4	almac_externo	disco solido externo(ssd)	essdspsd512gb	unidad en estado sélido dual portatil kingston 512gb, interfaz usb-a, usb-c, usb 3.2	\N	140.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.317968	2026-04-15 17:02:11.317968
104	11	4	almac_externo	disco solido externo(ssd)	ssdktxs10001tb	unidad en estado sélido externa kingston xs1000, 1tb, usb 3.2 gen 2 tipo-c	\N	134.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.318983	2026-04-15 17:02:11.318983
105	11	4	almac_externo	disco solido externo(ssd)	ssdktxs1000r1tb	unidad en estado sélido externa kingston xs1000, 1tb, usb 3.2 gen 2 tipo-c, color roj	\N	134.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.319934	2026-04-15 17:02:11.319934
106	11	4	almac_externo	disco solido externo(ssd)	ssdktxs10002tb	unidad en estado sélido externa kingston xs1000, 2tb, usb 3.2 gen 2 tipo-c	\N	231.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.320957	2026-04-15 17:02:11.320957
107	11	4	almac_externo	disco solido externo(ssd)	ssdktxs1000r2tb	unidad en estado sélido externa kingston xs1000, 2tb, usb 3.2 gen 2 tipo-c, color roj	\N	231.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.321888	2026-04-15 17:02:11.321888
108	11	4	almac_externo	disco solido externo(ssd)	ssdktxs20001000	unidad en estado sélido externa kingston xs2000, 1tb, usb 3.2 gen 2x2 tipo-c	\N	162.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.322889	2026-04-15 17:02:11.322889
109	11	4	almac_externo	disco solido externo(ssd)	ssdktxs20002000	unidad en estado sélido externa kingston xs2000, 2tb, usb 3.2 gen 2x2 tipo-c	\N	275.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.323875	2026-04-15 17:02:11.323875
110	11	4	almac_externo	disco solido externo(ssd)	ssdktxs20004000	unidad en estado sélido externa kingston xs2000, 4tb, usb 3.2 gen 2x2 tipo-c	\N	476.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.324973	2026-04-15 17:02:11.324973
111	11	4	almac_externo	disco solido externo(ssd)	ssdktxs2000500	unidad en estado sélido externa kingston xs2000, 500gb, usb 3.2 gen 2x2 tipo-c	\N	130.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.325918	2026-04-15 17:02:11.325918
112	11	4	almac_externo	mem flash, usb drive	acktdtkn256gb	unidad flash usb kingston datatraveler kyson, 256gb, interfaz: usb 3.2 gen 1	\N	35.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.326884	2026-04-15 17:02:11.326884
113	11	4	almac_externo	mem flash, usb drive	acktdtkn512gb	unidad flash usb kingston datatraveler kyson, 512gb, interfaz: usb 3.2 gen 1	\N	64.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.327731	2026-04-15 17:02:11.327731
114	11	6	almac_externo	mem flash, usb drive	ac128gusbsdcz50	memoria flash usb sandisk cruzer blade , 128gb, usb 2.0, presentacién en colgador.[@@	\N	11.00	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.329287	2026-04-15 17:02:11.329287
115	11	6	almac_externo	mem flash, usb drive	ac16gbusbcz50w	memoria flash usb sandisk cruzer blade, 16gb, usb2.0.	\N	7.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.330124	2026-04-15 17:02:11.330124
116	11	6	almac_externo	mem flash, usb drive	accsdcz410032g	memoria flash usb sandisk ultra shift, 32gb, usb 3.2 gen 1, color lila	\N	5.65	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.331	2026-04-15 17:02:11.331
117	11	6	almac_externo	disco solido externo(ssd)	ssdsdssde301t00	ssd portétil sandisk fortnite peely edition, 1 tb, usb 3.2 gen 2, proteccién contra c	\N	220.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.331831	2026-04-15 17:02:11.331831
118	11	6	almac_externo	mem flash, usb drive	acsdczis128g	unidad flash sandisk usb smurfs, 128 gb, usb 3.2 gen 1,usb-a, hasta 130 mb/s	\N	12.20	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.33268	2026-04-15 17:02:11.33268
119	11	7	almac_externo	disco duro externo 2.5	hdestgx1000400	disco duro externo portatil seagate stgx1000400, 1tb, 2.5, usb 3.0 superspeed	\N	69.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.333638	2026-04-15 17:02:11.333638
120	11	7	almac_externo	disco duro externo 2.5	hdestgx2000400	disco duro externo portatil seagate stgx2000400, 2tb, usb 3.0, negro	\N	95.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.334429	2026-04-15 17:02:11.334429
121	11	7	almac_externo	disco duro externo 2.5	hdestgx4000400	disco duro externo portatil seagate stgx4000400, 4tb, usb 3.0, negro	\N	140.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.335189	2026-04-15 17:02:11.335189
122	11	7	almac_externo	disco duro externo 2.5	hdestgx5000400	disco duro externo portatil seagate stgx5000400, 5tb, usb 3.0, negro	\N	168.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.335991	2026-04-15 17:02:11.335991
123	11	9	almac_externo	disco duro externo 2.5	hde2tbtohdtb420	disco duro externo toshiba canvio basic, 2tb, usb3.0, 2.5, negro.	\N	76.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.336732	2026-04-15 17:02:11.336732
124	11	9	almac_externo	disco duro externo 2.5	hd1tbtohdtb410	disco duro externo toshiba canvio basics, 1 tb, usb 3.0, 2.5, negro.	\N	60.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.337685	2026-04-15 17:02:11.337685
125	11	9	almac_externo	disco duro externo 2.5	hd4tbto440xk3aa	disco duro externo toshiba canvio basics, 4tb, usb 3.0.	\N	120.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.339125	2026-04-15 17:02:11.339125
126	11	9	almac_externo	disco duro externo 2.5	hddhdtp310xk3aa	disco duro externo toshiba canvio ready 1tb, usb 3.0/2.0, plug & play, negro	\N	61.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.340378	2026-04-15 17:02:11.340378
127	11	9	almac_externo	disco duro externo 2.5	hd4toca40xw3ca	disco duro externo toshiba portétil canvio advance, 4 tb, usb 3.0 / 2.0, color: blanc	\N	122.00	17	f	\N	\N	\N	\N	2026-04-15 17:02:11.341469	2026-04-15 17:02:11.341469
128	11	9	almac_externo	disco duro externo 2.5	hd1toca10xr3aa	hd ext canvio advance 1tb - rd	\N	64.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.342524	2026-04-15 17:02:11.342524
129	9	11	auricular	audio, auricular c/mic	mmlengxd1e71385	auriculares estereo con microfono lenovo 110, interfaz usb tipo-a, color cloud grey (	\N	29.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.344731	2026-04-15 17:02:11.344731
130	9	12	auricular	audio, auricular c/mic	acclen4xd1j7735	auriculares internos lenovo con cable usb-c	\N	9.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.346355	2026-04-15 17:02:11.346355
131	9	12	auricular	audio, auricular c/mic	acclen4xd1r3139	auriculares lenovo tws (edicién x9)	\N	53.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.347337	2026-04-15 17:02:11.347337
132	9	12	auricular	audio, auricular c/mic	mmlen4xd1p83425	auriculares stereo con micréfono lenovo gen 2, interfaz usb-a	\N	23.10	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.348565	2026-04-15 17:02:11.348565
133	9	13	auricular	audio, auricular c/mic	mmmclogstheh112	auriculares estereo (on-ear) con microfono logitech h390, interfaz usb-a, color negro	\N	21.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.350163	2026-04-15 17:02:11.350163
134	9	14	auricular	audio, auricular c/mic	mmhwte8038n	audéfono inalémbricos teros te-8038n, usb-c, negro titanium	\N	18.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.351905	2026-04-15 17:02:11.351905
135	9	14	auricular	audio, auricular c/mic	mmhwte8038ne	audéfono inalémbricos teros te-8038ne, usb-c, natural titanium	\N	18.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.352757	2026-04-15 17:02:11.352757
136	9	14	auricular	audio, auricular c/mic	mmhwte8038rs	audéfono inalémbricos teros te-8038rs, usb-c, rose titanium	\N	18.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.353705	2026-04-15 17:02:11.353705
137	9	14	auricular	audio, auricular c/mic	mmhwte8038w	audéfono inalémbricos teros te-8038w, usb-c, blanco titanium	\N	18.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.354675	2026-04-15 17:02:11.354675
138	9	14	auricular	audio, auricular c/mic	mmhwte8039c	audéfono teros te-8039cs, usb, negro	\N	14.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.355691	2026-04-15 17:02:11.355691
139	9	14	auricular	audio, auricular c/mic	mmtwshte80712rs	audéfonos inalémbricos teros te-80712rs, bluetooth, carga tipo c, rose titanium	\N	10.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.356702	2026-04-15 17:02:11.356702
140	9	14	auricular	audio, auricular c/mic	mmtwshte80712w	audéfonos inalémbricos teros te-80712w, bluetooth, carga tipo c, blanco titanium	\N	10.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.357866	2026-04-15 17:02:11.357866
141	9	14	auricular	audio, auricular c/mic	accte8074gr	audéfonos teros te-8074gr, bluetooth, tws, rosa/dorado	\N	9.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.358932	2026-04-15 17:02:11.358932
142	9	14	auricular	audio, auricular c/mic	accte8074n	audéfonos teros te-8074n, bluetooth, tws, negro	\N	9.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.359851	2026-04-15 17:02:11.359851
143	9	15	parlante	audio, parlante inalambrc	mmsplbbv310gr	parlante inalémbrico landbyte bv310, bluetooth, iluminacién led, recargable.	\N	13.50	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.362389	2026-04-15 17:02:11.362389
144	9	14	parlante	audio, parlante inalambrc	mmspte6018r	parlante inalémbrico merry christmas teros te-6018r, bluetooth 5.3, tipo usb-c, color	\N	6.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.363416	2026-04-15 17:02:11.363416
145	9	14	parlante	audio, parlante inalambrc	mmspte6047n	parlante inalémbrico teros te6047n, 20w, bt: 5.3,iluminacién rgb, color negro	\N	20.59	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.364388	2026-04-15 17:02:11.364388
146	9	14	parlante	audio, parlante inalambrc	mmvp6049or	parlante inalémbrico teros vibes vb-6049, 60w, bt5.3, 4000 mah, usb, luces led, orang	\N	32.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.365163	2026-04-15 17:02:11.365163
147	9	14	parlante	audio, parlante inalambrc	mmvp6049blk	parlante inalémbrico teros vibes vb-6049blk, 60w,bt 5.3, 4000 mah, usb, luces led, ne	\N	32.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.366231	2026-04-15 17:02:11.366231
148	9	14	parlante	audio, parlante inalambrc	mmspte6013n	parlante karaoke inalémbrico teros te-6013n, bt 5.4, 10w, usb, iluminacién led	\N	11.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.36709	2026-04-15 17:02:11.36709
149	9	14	parlante	audio, parlante inalambrc	mmspte6045b	parlante teros te-6045b, color azul, 60 w	\N	40.50	8	f	\N	\N	\N	\N	2026-04-15 17:02:11.368035	2026-04-15 17:02:11.368035
150	9	14	parlante	audio, parlante inalambrc	mmspte6045g	parlante teros te-6045g, color verde militar camuflado, 60 w	\N	41.00	6	f	\N	\N	\N	\N	2026-04-15 17:02:11.368985	2026-04-15 17:02:11.368985
151	9	14	parlante	audio, parlante inalambrc	mmspte6045n	parlante teros te-6045n, color negro, 60 w	\N	41.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.369806	2026-04-15 17:02:11.369806
152	9	14	parlante	audio, parlante inalambrc	mmspte6046bm	parlante teros ultra te-6046bm, bt 5.3, rgb, tws,color azul militar camuflado	\N	24.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.370821	2026-04-15 17:02:11.370821
153	9	14	parlante	audio, parlante inalambrc	mmspte6046m	parlante teros ultra te-6046m, bt 5.3, rgb, tws, color marrén militar camuflado	\N	24.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.371719	2026-04-15 17:02:11.371719
154	9	14	parlante	audio, parlante inalambrc	mmspte6046b	parlante ultra te-6046b, color azul, 40w	\N	24.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.372517	2026-04-15 17:02:11.372517
155	9	14	parlante	audio, parlante inalambrc	mmspte6046g	parlante ultra te-6046g, color verde militar camuflado, 40 w	\N	24.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.373391	2026-04-15 17:02:11.373391
156	9	14	parlante	audio, parlante inalambrc	mmspte6046n	parlante ultra te-6046n, color negro, 40 w	\N	24.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.37468	2026-04-15 17:02:11.37468
157	9	9	parlante	audio, parlante inalambrc	zzmmspte6046nto	zzparlant te6046n 40w(toshiba)	\N	999.00	10	f	\N	\N	\N	\N	2026-04-15 17:02:11.375777	2026-04-15 17:02:11.375777
158	9	10	parlante	audio, parlante inalambrc	zzte6046nm	parlante teros te6046n bt 40w	\N	999.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.376839	2026-04-15 17:02:11.376839
159	7	16	\N	cases atx	csatxadv1154n	csatxadv1154nno se debe transferir a ninguna sucursal, case para ensamblaje de comput	\N	1000.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.380101	2026-04-15 17:02:11.380101
160	7	17	\N	cases sin fuente p/gamers	csasa31pbkargb	case asus a31 plus case black	\N	74.70	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.385064	2026-04-15 17:02:11.385064
161	7	17	\N	cases sin fuente p/gamers	csasa31pwtargb	case asus a31 plus case white	\N	74.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.387022	2026-04-15 17:02:11.387022
162	7	17	\N	cases sin fuente p/gamers	csaspa401wobe	case asus proart pa401 wood edition beige - tempered glass panel	\N	109.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.389618	2026-04-15 17:02:11.389618
163	7	18	\N	cases micro atx	cscme301kgnns00	case cooler master elite 301, minitower, negro, atx, usb 3.2 gen 1 tipo-c / tipo-a, a	\N	48.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.394285	2026-04-15 17:02:11.394285
164	7	18	\N	cases sin fuente p/gamers	cscmh500kgnns00	case cooler master haf 500 mid tower case	\N	101.00	13	f	\N	\N	\N	\N	2026-04-15 17:02:11.396752	2026-04-15 17:02:11.396752
165	7	18	\N	cases sin fuente p/gamers	cscmmb520kgnns0	case cooler master masterbox 520 mesh argb atx pccase	\N	54.78	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.39861	2026-04-15 17:02:11.39861
166	7	19	\N	cases sin fuente p/gamers	csmsforge120aaf	case msi mag forge 120a airflow, mid tower	\N	50.00	11	f	\N	\N	\N	\N	2026-04-15 17:02:11.400526	2026-04-15 17:02:11.400526
167	7	19	\N	cases sin fuente p/gamers	csmsforge321raf	case msi mag forge 321r airflow, mid tower	\N	54.10	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.402267	2026-04-15 17:02:11.402267
168	7	19	\N	cases sin fuente p/gamers	csmspano110rpzn	case msi mag pano 110r pz, mini-itx, micro-atx, atx, mid tower	\N	64.70	2	f	\N	\N	\N	\N	2026-04-15 17:02:11.403655	2026-04-15 17:02:11.403655
169	7	19	\N	cases sin fuente p/gamers	csmsvx300rafpzn	case msi mpg velox 300r airflow pz / black, mid-tower, mini-itx, micro-atx, atx, *eat	\N	122.00	13	f	\N	\N	\N	\N	2026-04-15 17:02:11.40542	2026-04-15 17:02:11.40542
170	7	19	\N	cases sin fuente p/gamers	csmsvx300rafpzw	case msi mpg velox 300r airflow pz / white, mid-tower, mini-itx, micro-atx, atx, *eat	\N	122.00	5	f	\N	\N	\N	\N	2026-04-15 17:02:11.406891	2026-04-15 17:02:11.406891
171	7	14	\N	cases sin fuente p/gamers	csatxte1174n	case gamer teros te-1174n, mid tower, usb 3.0 / usb 2.0, audio, ventilador argb, negr	\N	34.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.409792	2026-04-15 17:02:11.409792
172	7	14	\N	cases sin fuente p/gamers	csm00bkte1314g	case gamer teros te-1314g, mid tower, usb 3.0 / usb 2.0, audio, ventilador argb, negr	\N	38.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.411997	2026-04-15 17:02:11.411997
173	7	14	\N	cases sin fuente p/gamers	csm00whte1316g	case gamer teros te-1316g, mid tower, usb 3.0 / usb 2.0, audio, ventilador argb, blan	\N	39.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.413286	2026-04-15 17:02:11.413286
174	7	14	\N	cases atx ver2.0 s/fuente	csm45bkte1319g	case gamer teros te-1319g, mid tower, 450w, usb 3.0 / 2.0, audio, negro	\N	30.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.414595	2026-04-15 17:02:11.414595
175	7	14	\N	cases sin fuente p/gamers	csa00bkte1321g	case gamer teros te-1321g, mid tower, usb 3.0 / usb 2.0, audio, ventilador rgb, negro	\N	27.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.416112	2026-04-15 17:02:11.416112
176	7	14	\N	cases sin fuente p/gamers	csatxte1175n	case gamer teros te1175n, mid tower, negro, usb 3.0, usb 2.0, audio.	\N	34.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.417378	2026-04-15 17:02:11.417378
177	7	14	\N	cases sin fuente p/gamers	csa00bkte1323g	case sin fuente gamer teros te-1323g, itx, m-atx,atx, 3.5 y 2.5, negro	\N	27.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.418971	2026-04-15 17:02:11.418971
178	7	14	\N	cases sin fuente p/gamers	csa00whte1329g	case sin fuente gamer teros te-1329g, itx, m-atx,atx, 3.5 y 2.5, blanco	\N	28.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.420937	2026-04-15 17:02:11.420937
179	7	14	\N	cases micro atx	css25bkte1032s	case teros te-1032s, slim, 250 w, usb 3.2 / usb 2.0, audio hd, dvd, negro	\N	24.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.42245	2026-04-15 17:02:11.42245
180	7	14	\N	cases micro atx	csm25bkte1033s	case teros te-1033s, mini tower atx, 250 w, usb 3.0 / 2.0, audio hd, negro	\N	17.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.424035	2026-04-15 17:02:11.424035
181	7	14	\N	cases micro atx	csm25bkte1034s	case teros te-1034s, mini tower atx, 250 w, usb 3.0 / 2.0, audio hd, negro	\N	17.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.426312	2026-04-15 17:02:11.426312
182	7	14	\N	cases micro atx	csm25bkte1035s	case teros te-1035s, mini tower atx, 250 w, usb 3.0 / 2.0, audio hd, negro	\N	17.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.42846	2026-04-15 17:02:11.42846
183	7	14	\N	cases atx ver2.0	csa25bkte1036s	case teros te-1036s, factor de forma atx, 250 w, usb 3.0 / 2.0, audio, negro.	\N	20.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.430113	2026-04-15 17:02:11.430113
184	7	14	\N	cases atx ver2.0	csa25bkte1037s	case teros te-1037s, factor de forma atx, 250 w, usb 3.0 / 2.0, audio, negro.	\N	20.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.431731	2026-04-15 17:02:11.431731
185	7	14	\N	cases atx ver2.0	csa25bkte1038s	case teros te-1038s, factor de forma atx, 250 w, usb 3.0 / 2.0, audio, negro.	\N	22.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.433001	2026-04-15 17:02:11.433001
186	7	14	\N	cases micro atx	css25bkte1039s	case teros te-1039s, slim, 250 w, usb 3.0 / usb 2.0, audio hd, dvd, negro	\N	24.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.4345	2026-04-15 17:02:11.4345
187	15	20	conectividad	red wifi adaptadores usb	adusbac13u	adaptador d-link usb ac1300 wi-fi 5 ac13u	\N	12.27	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.437446	2026-04-15 17:02:11.437446
188	15	20	conectividad	red wifi adaptadores usb	adpusbax9u	adaptador usb d-link ax9u ax900, wi-fi 6 certificado (802.11ax)	\N	12.30	13	f	\N	\N	\N	\N	2026-04-15 17:02:11.438573	2026-04-15 17:02:11.438573
189	15	20	conectividad	red wifi adaptadores usb	adusbdlkax18u	adaptador usb d-link wi-fi 6 ax1800 ax18u	\N	15.61	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.439625	2026-04-15 17:02:11.439625
190	15	20	conectividad	red wifi router-adsl	nwdle15	e15 ax1500 wi-fi 6 ai range ex	\N	26.95	20	f	\N	\N	\N	\N	2026-04-15 17:02:11.441803	2026-04-15 17:02:11.441803
191	15	20	conectividad	red wifi router-adsl	nwdlg403	router d-link 4g smart n300 g403, 4 x lan 10/100 mbps, 1 x wan 10/100 mbps	\N	50.67	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.443336	2026-04-15 17:02:11.443336
192	15	20	conectividad	red wifi router-adsl	nwdlm15	router d-link ax1500 mesh, 1 x puerto gigabit ethernet lan/1 x puerto gigabit etherne	\N	63.68	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.444538	2026-04-15 17:02:11.444538
193	15	20	conectividad	red wifi router-adsl	nwdlm15-1	router d-link ax1500 mesh, 1 x puerto gigabit ethernet lan/1 x puerto gigabit etherne	\N	36.31	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.445518	2026-04-15 17:02:11.445518
194	15	20	conectividad	red wifi router-adsl	nwdlm15-3	router d-link ax1500 mesh, 1 x puerto gigabit ethernet lan/1 x puerto gigabit etherne	\N	92.14	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.446373	2026-04-15 17:02:11.446373
195	15	20	conectividad	red wifi router-adsl	rtdldir-2150	router d-link dir-2150 wi-fi gigabit ac2100	\N	33.48	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.447071	2026-04-15 17:02:11.447071
196	15	20	conectividad	red wifi router-adsl	nwdlrtr32	router d-link eagle pro ai ax3200 smart / 2,4/5ghz / 4 antenas ext. doble banda	\N	44.49	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.447862	2026-04-15 17:02:11.447862
197	15	20	conectividad	red wifi router-adsl	rtdlkg403c	router d-link g403c 4g lte con wi-fi 4 a 300 mbps	\N	50.41	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.448565	2026-04-15 17:02:11.448565
198	15	20	conectividad	red wifi router-adsl	rtdlkg530	router d-link g530 5g nr ax3000 wi-fi 6	\N	183.73	20	f	\N	\N	\N	\N	2026-04-15 17:02:11.449413	2026-04-15 17:02:11.449413
199	15	20	conectividad	red wifi router-adsl	nwdlm30	router d-link m30 smart mesh wi-fi 6 ax3000 de doble banda	\N	46.78	9	f	\N	\N	\N	\N	2026-04-15 17:02:11.45027	2026-04-15 17:02:11.45027
200	15	20	conectividad	red wifi router-adsl	nwdlrtm32-3	router d-link mesh eagle pro ai ax3200 / m32-3 / 2.4/5ghz / pack 3 unids.	\N	119.12	11	f	\N	\N	\N	\N	2026-04-15 17:02:11.451824	2026-04-15 17:02:11.451824
201	15	20	conectividad	red wifi router-adsl	nwdlrtr15	router d-link r15 ax1500 wi-fi 6 ai / 2.4/5ghz / 4 antenas externas	\N	32.53	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.452649	2026-04-15 17:02:11.452649
202	15	20	conectividad	red wifi router-adsl	nwdlrtr12	router d-link smart ac1200 r12, 4 x lan 10/100/1000mbps, 1 x wan 10/100/1000mbps, 2.4	\N	25.82	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.453428	2026-04-15 17:02:11.453428
203	12	21	estabilizador	estabilizador de tension	psstravr3008ip	estabilizador automatico cdp r-avr 3008i, capacidad: 3000va / 1500w, 220vac	\N	43.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.455168	2026-04-15 17:02:11.455168
204	12	21	estabilizador	estabilizador de tension	pscdravr1008i	estabilizador automatico de voltaje con supresionde picos cdp ravr1008i, 900va/450wat	\N	8.70	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.456189	2026-04-15 17:02:11.456189
205	12	21	estabilizador	estabilizador de tension	pscdpr-ss5i	regleta (supresor de picos) cdp r-ss5i, 220v, 1250w / 2200w	\N	3.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.457112	2026-04-15 17:02:11.457112
206	12	21	estabilizador	estabilizador de tension	pssravr5008i	regulador automatico de voltaje con supresion de picos cdp r-avr5008i, 5000va / 2500w	\N	62.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.458494	2026-04-15 17:02:11.458494
207	12	21	estabilizador	estabilizador de tension	psstravr2408ip	regulador de voltaje cdp r-avr 2408i, 2400va, 1200w, 220v, 8 tomacorrientes.	\N	34.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.459546	2026-04-15 17:02:11.459546
208	12	22	estabilizador	estabilizador de tension	psstie1042s	estabilizador de voltaje elise - fase fes-10, estado sélido, potencia: 1kva = 1000va[	\N	29.00	21	f	consultar	\N	\N	\N	2026-04-15 17:02:11.461128	2026-04-15 17:02:11.461128
209	12	22	estabilizador	estabilizador de tension	psstie1042xs-n	estabilizador elise - fase fxe-10, sélido, 1.0kva, 4 tomas a 220vac, 1 toma by-pass.[	\N	29.00	21	f	consultar	\N	\N	\N	2026-04-15 17:02:11.461996	2026-04-15 17:02:11.461996
210	12	22	estabilizador	estabilizador de tension	psstie60	estabilizador elise - ieda power safe lcr60-4.5%,solido, monofésico, 6.0kva.	\N	340.00	7	f	\N	\N	\N	\N	2026-04-15 17:02:11.463276	2026-04-15 17:02:11.463276
211	12	22	estabilizador	estabilizador de tension	psstielcr10k45	estabilizador elise ieda poder safe lcr10k-4.5%, solido, 10kva, 220v, bornes de salid	\N	870.00	6	f	\N	\N	\N	\N	2026-04-15 17:02:11.464001	2026-04-15 17:02:11.464001
212	12	22	estabilizador	estabilizador de tension	psstie1042	estabilizador monofasico elise ieda poder safe, lcr10-4.5%, solido, 1kva, 220vac, 4 t	\N	54.80	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.464989	2026-04-15 17:02:11.464989
213	12	22	estabilizador	estabilizador de tension	psstie2042	estabilizador monofasico elise ieda poder safe, lcr20-4.5%, solido, 2kva, 220vac, 4 t	\N	124.00	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.465814	2026-04-15 17:02:11.465814
214	12	22	estabilizador	estabilizador de tension	psstie30	estabilizador monofasico elise ieda poder safe, lcr30-4.5%, solido, 3kva, 220vac, 6 t	\N	134.50	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.466607	2026-04-15 17:02:11.466607
215	12	22	estabilizador	estabilizador de tension	pstransftamf15	transformador de aislamiento monofésico 1.5kva	\N	157.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.467595	2026-04-15 17:02:11.467595
216	12	22	estabilizador	estabilizador de tension	pstransftamf10	transformador de aislamiento monofésico 1kva	\N	147.00	7	f	\N	\N	\N	\N	2026-04-15 17:02:11.468443	2026-04-15 17:02:11.468443
217	12	14	estabilizador	estabilizador de tension	pste7180n	estabilizador de voltaje teros te-7180 avr1200va / 600w 184-276 vac	\N	12.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.469651	2026-04-15 17:02:11.469651
218	12	10	estabilizador	estabilizador de tension	zzte7180m	estabilizad te7180n avr-1200va	\N	999.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.470555	2026-04-15 17:02:11.470555
219	12	21	ups	ups interactivo	psli504	ups cdp li504i - standby con bateria de litio (lifepo4) de 12.8v / 51.2wh, 500va / 25	\N	48.00	10	f	\N	\N	\N	\N	2026-04-15 17:02:11.471298	2026-04-15 17:02:11.471298
220	12	21	ups	ups interactivo	upscdprupr1008	ups cdp r-upr1008i, interactivo, 1000va, 500w, 220vca / 50/60hz (ajuste automético)[@	\N	49.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.472553	2026-04-15 17:02:11.472553
221	12	21	ups	ups interactivo	cdupsrsmart1010	ups interactivo cdp (chicago digital power) r-smart 1010i, 1000va / 500w	\N	66.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.473278	2026-04-15 17:02:11.473278
222	12	21	ups	ups interactivo	upscdpsmart121i	ups interactivo cdp (chicago digital power) r-smart 1210i, 1200va/720w	\N	106.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.474266	2026-04-15 17:02:11.474266
223	12	21	ups	ups interactivo	upcdpsmart1510i	ups interactivo cdp (chicago digital power) r-smart 1510i, 1500va/900w	\N	134.00	10	f	\N	\N	\N	\N	2026-04-15 17:02:11.475449	2026-04-15 17:02:11.475449
224	12	21	ups	ups interactivo	suprsmart2010ip	ups interactivo cdp (chicago digital power) r-smart 2010i, 2000va/1200w	\N	162.00	16	f	\N	\N	\N	\N	2026-04-15 17:02:11.476843	2026-04-15 17:02:11.476843
225	12	21	ups	ups interactivo	psupsrsmart75	ups interactivo cdp (chicago digital power) r-smart 751i, 750va / 375w	\N	55.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.477686	2026-04-15 17:02:11.477686
226	12	22	ups	ups interactivo	upstips-1050led	lénea de ups elise interactivo ips-1050-led: 1050va/ 600 w	\N	102.70	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.478517	2026-04-15 17:02:11.478517
227	12	22	ups	ups interactivo	upstips-1500led	lénea de ups elise interactivo ips-1500-led: 1500va/ 900 w	\N	141.90	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.479349	2026-04-15 17:02:11.479349
228	12	22	ups	ups interactivo	upsips-650-led	lénea de ups elise interactivo ips-650-led: 650 va/ 360 w	\N	54.40	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.480175	2026-04-15 17:02:11.480175
229	12	22	ups	ups interactivo	upstips-850-led	lénea de ups elise interactivo ips-850-led: 850 va/ 480 w	\N	70.10	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.481039	2026-04-15 17:02:11.481039
230	12	22	ups	ups interactivo	psaur850lcdusb	ups interactivo elise @fase, aur-850-lcd-usb, 850va / 480w, puerto inteligente usb-hi	\N	77.90	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.482036	2026-04-15 17:02:11.482036
231	12	22	ups	ups interactivo	psaur1000lcdusb	ups interactivo elise fase, aur-1000-lcd-usb, 1000 va / 600 w, puerto inteligente usb	\N	114.80	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.48287	2026-04-15 17:02:11.48287
232	12	22	ups	ups interactivo	psaur1200lcdusb	ups interactivo elise fase, aur-1200-lcd-usb, 1200 va / 600 w, puerto inteligente usb	\N	124.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.483761	2026-04-15 17:02:11.483761
233	12	22	ups	ups interactivo	psaur1500lcdusb	ups interactivo elise fase, aur-1500-lcd-usb, 1500 va / 900 w, puerto inteligente usb	\N	151.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.484563	2026-04-15 17:02:11.484563
234	12	22	ups	ups interactivo	uspelaur2200lc	ups interactivo elise fase, aur-2200-lcd-usb, 2200va / 1200w, puerto inteligente usb-	\N	163.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.485186	2026-04-15 17:02:11.485186
235	12	22	ups	ups interactivo	upselpbox-850	ups interactivo elise serie power box, 850va / 480w, puerto inteligente usb-hid.	\N	64.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.48594	2026-04-15 17:02:11.48594
236	12	22	ups	ups interactivo	pspbox650	ups interactivo elise serie power pbox-650, 650va, 360w	\N	55.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.486859	2026-04-15 17:02:11.486859
237	12	23	ups	ups interactivo	pstlomnivsx1500	ups tripp-lite omnivsx1500, interactivo, 1500va, 900w, 230v, 8 tomas c13.	\N	131.00	12	f	\N	\N	\N	\N	2026-04-15 17:02:11.488787	2026-04-15 17:02:11.488787
238	12	23	ups	ups interactivo	psuptlsmx1500lc	ups tripp-lite smx1500lcdt, interactivo, 1500va, 900w, 220v, 8 tomas c13.	\N	180.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.489663	2026-04-15 17:02:11.489663
239	6	24	\N	cases, fuente para gaming	psarpg-1000g	fuente de alimentacién asrock pg-1000g, 1000w, atx, 80 plus gold.	\N	139.00	7	f	\N	\N	\N	\N	2026-04-15 17:02:11.492524	2026-04-15 17:02:11.492524
240	6	24	\N	cases, fuente para gaming	psarpg-850g	fuente de alimentacién asrock pg-850g, 850w, atx,80 plus gold.	\N	104.70	10	f	\N	\N	\N	\N	2026-04-15 17:02:11.496048	2026-04-15 17:02:11.496048
241	6	24	\N	cases, fuente para gaming	psarsl-1000g	fuente de alimentacién asrock sl-1000g, 1000w, atx, 80 plus gold.	\N	94.70	5	f	\N	\N	\N	\N	2026-04-15 17:02:11.497726	2026-04-15 17:02:11.497726
242	6	24	\N	cases, fuente para gaming	psarsl-650g	fuente de alimentacién asrock sl-650g, 650w, atx,80 plus gold.	\N	75.75	14	f	\N	\N	\N	\N	2026-04-15 17:02:11.499301	2026-04-15 17:02:11.499301
243	6	24	\N	cases, fuente para gaming	psarsl-750g	fuente de alimentacién asrock sl-750g, 750w, atx,80 plus gold.	\N	80.20	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.500767	2026-04-15 17:02:11.500767
244	6	24	\N	cases, fuente para gaming	psarsl-850gw	fuente de alimentacién asrock sl-850gw, 850w, atx, 80 plus gold.	\N	105.75	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.502148	2026-04-15 17:02:11.502148
245	6	24	\N	cases, fuente para gaming	psarsl-1000gw	fuente de alimentacién asrock, 1000w, atx, 80 plus gold.	\N	118.00	11	f	\N	\N	\N	\N	2026-04-15 17:02:11.503666	2026-04-15 17:02:11.503666
246	6	24	\N	cases, fuente para gaming	psarcl-650b	fuente de alimentacién asrock, 650w, atx, 80 plusbronze.	\N	51.25	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.505443	2026-04-15 17:02:11.505443
247	6	24	\N	cases, fuente para gaming	psarpg-1300g	fuente de alimentacién asrock, pg-1300g, 1300w, atx, 80 plus gold.	\N	153.75	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.508406	2026-04-15 17:02:11.508406
248	6	24	\N	cases, fuente certificada	psarsl-1200gw	fuente de alimentacién asrock, sl-1200gw, 1200w, atx, 80 plus gold.	\N	133.70	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.51007	2026-04-15 17:02:11.51007
249	6	24	\N	cases, fuente para gaming	psartc-1300t	fuente de alimentacién asrock, tc-1300t, 1300w, atx, 80 plus titanium.	\N	305.00	10	f	\N	\N	\N	\N	2026-04-15 17:02:11.511421	2026-04-15 17:02:11.511421
250	6	24	\N	cases, fuente para gaming	psartc-1650t	fuente de alimentacién asrock, tc-1650t, 1650w, atx, 80 plus titanium.	\N	398.00	5	f	\N	\N	\N	\N	2026-04-15 17:02:11.513056	2026-04-15 17:02:11.513056
251	6	17	\N	cases, fuente para gaming	psasap-750g	fuente de alimentacién asus ap-750g gold, 80 plus, 750 w, formato atx.	\N	81.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.514629	2026-04-15 17:02:11.514629
252	6	17	\N	cases, fuente para gaming	psastufgmg850g	fuente de alimentacién asus tuf gaming 850w gold,80 plus gold, formato atx.	\N	108.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.516223	2026-04-15 17:02:11.516223
253	6	17	\N	cases, fuente para gaming	psastufgm1000gn	fuente de alimentacién tuf gaming 1000w gold, 80 plus gold, formato atx.	\N	127.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.517613	2026-04-15 17:02:11.517613
254	6	17	\N	cases, fuente para gaming	psasrt1000pgmn	psu as rog strix 1000p gm 80+p	\N	175.00	8	f	\N	\N	\N	\N	2026-04-15 17:02:11.519079	2026-04-15 17:02:11.519079
255	6	17	\N	cases, fuente para gaming	psasrt1000pgmw	psu as rog strix 1000p gm 80+p	\N	186.50	10	f	\N	\N	\N	\N	2026-04-15 17:02:11.520905	2026-04-15 17:02:11.520905
256	6	17	\N	cases, fuente para gaming	psastufgmg750g	psu as tuf-gaming-750g 80+g	\N	90.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.522141	2026-04-15 17:02:11.522141
257	6	25	\N	cases, fuente para gaming	psgbae1000pmpg5	fuente de alimentacién gigabyte gp-ae1000pm pg5, 1000w, 80 plus platinum, formato atx	\N	144.50	7	f	\N	\N	\N	\N	2026-04-15 17:02:11.524246	2026-04-15 17:02:11.524246
258	6	25	\N	cases, fuente para gaming	psgbae850pmpg5i	fuente de alimentacién gigabyte gp-ae850pm pg5 ice, 850w, 80 plus platinum, formato a	\N	123.60	7	f	\N	\N	\N	\N	2026-04-15 17:02:11.526463	2026-04-15 17:02:11.526463
259	6	25	\N	cases, fuente para gaming	psgbae850pmpg5	fuente de alimentacién gigabyte gp-ae850pm pg5, 850w, 80 plus platinum, formato atx.[	\N	121.50	14	f	\N	\N	\N	\N	2026-04-15 17:02:11.528226	2026-04-15 17:02:11.528226
260	6	25	\N	cases, fuente para gaming	psgbud1300gmpg5	fuente de alimentacién gigabyte gp-ud1300gm p, 1300w, 80 plus gold certified, formato	\N	176.00	5	f	\N	\N	\N	\N	2026-04-15 17:02:11.529589	2026-04-15 17:02:11.529589
261	6	25	\N	cases, fuente para gaming	psgbp550ssice	fuente de alimentacién gigabyte p550ss ice , 550w, 80 plus silver, formato atx.	\N	34.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.530986	2026-04-15 17:02:11.530986
262	6	25	\N	cases, fuente para gaming	psgbp550ss	fuente de alimentacién gigabyte p550ss, 550w, 80 plus silver, formato atx.	\N	33.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.532546	2026-04-15 17:02:11.532546
263	6	25	\N	cases, fuente certificada	psgbp650gpg5	fuente de alimentacién gigabyte p650g pcie 5.1, 650w, atx, 80 plus gold.	\N	44.30	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.534268	2026-04-15 17:02:11.534268
264	6	25	\N	cases, fuente para gaming	psgbp650ss	fuente de alimentacién gigabyte p650ss , 650w, 80plus siver, formato atx.	\N	41.25	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.536819	2026-04-15 17:02:11.536819
265	6	25	\N	cases, fuente para gaming	psgbp650ssice	fuente de alimentacién gigabyte p650ss ice , 650w, atx, 80 plus silver.	\N	44.25	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.539019	2026-04-15 17:02:11.539019
266	6	25	\N	cases, fuente para gaming	psgbud1600pmpg5	fuente de alimentacién gigabyte ud1600pm pg5 ai top, 80 plus platinum, 1600w, formato	\N	290.00	15	f	\N	\N	\N	\N	2026-04-15 17:02:11.540864	2026-04-15 17:02:11.540864
267	6	25	\N	cases, fuente para gaming	psgbud750gmpg5	fuente de alimentacién gigabyte ud750gm pg5, 750w, 80 plus gold certified, formato at	\N	75.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.543182	2026-04-15 17:02:11.543182
268	6	25	\N	cases, fuente para gaming	psgbud850gmpg5w	fuente de alimentacién gigabyte ud850gm pg5w, 850w, 80 plus gold, formato atx.	\N	96.85	17	f	\N	\N	\N	\N	2026-04-15 17:02:11.545264	2026-04-15 17:02:11.545264
269	6	25	\N	cases, fuente para gaming	psgbud1000gmp5w	mb gb ud1000gm pg5 ice 80+g	\N	101.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.547545	2026-04-15 17:02:11.547545
270	6	25	\N	cases, fuente para gaming	psgbud750gmpg5w	mb gb ud750gm pg5 ice 80+g	\N	75.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.549174	2026-04-15 17:02:11.549174
271	6	14	\N	cases, fuente certificada	psua10bkte1328g	fuente de alimentacién gamer teros te-1328g, formato atx, 1000w 80 plus gold 155-240v	\N	73.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.551096	2026-04-15 17:02:11.551096
272	6	14	\N	cases, fuente para gaming	psua850bte1320s	fuente de alimentacién teros te-1320s, formato atx, 850w 80 plus platinum, 110-240v[@	\N	59.00	16	f	\N	\N	\N	\N	2026-04-15 17:02:11.55289	2026-04-15 17:02:11.55289
273	6	14	\N	cases, fuente para	psua25bkte1324s	fuente de alimentacién teros te-1324s, formato atx, 250w, 115v / 230v	\N	9.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.554532	2026-04-15 17:02:11.554532
274	6	14	\N	cases, fuente certificada	psua10bkte132-b	psu gm atx 1000w te1328 bk	\N	64.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:11.55613	2026-04-15 17:02:11.55613
275	5	24	\N	video, pci exp radeon gam	vd16arrx907xtsd	tarjeta de video amd radeon rx 9070 xt steel legend dark 16gb, 16 gb gddr6, pci-e 5.0	\N	767.00	10	f	\N	\N	\N	\N	2026-04-15 17:02:11.560314	2026-04-15 17:02:11.560314
276	5	24	\N	video, pci exp radeon gam	vd16arrx906xtcl	tarjeta de video asrock amd radeon rx 9060 xt challenger 16gb oc, 16 gb gddr6, pci-e	\N	472.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.565899	2026-04-15 17:02:11.565899
277	5	24	\N	video, pci exp radeon gam	vd16arrx906xtsl	tarjeta de video asrock amd radeon rx 9060 xt steel legend 16gb oc, 16 gb gddr6, pci-	\N	496.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.568171	2026-04-15 17:02:11.568171
278	5	24	\N	video, pci exp radeon gam	vd8garrx906xtsl	tarjeta de video asrock amd radeon rx 9060 xt steel legend 8gb oc, 8 gb gddr6, pci-e	\N	342.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.570325	2026-04-15 17:02:11.570325
279	5	24	\N	video, pci exp radeon gam	vd16arrx9070cl	tarjeta de video asrock amd radeon rx 9070 challenger 16gb, 16gb gddr6, pci-e 5.0 x16	\N	685.00	8	f	\N	\N	\N	\N	2026-04-15 17:02:11.571837	2026-04-15 17:02:11.571837
280	5	24	\N	video, pci exp radeon gam	vd16arrx907xtsl	tarjeta de video asrock amd radeon rx 9070 xt steel legend 16 gb , 16 gb gddr6, pci-e	\N	767.00	18	f	\N	\N	\N	\N	2026-04-15 17:02:11.573202	2026-04-15 17:02:11.573202
281	5	24	\N	video, pci exp radeon gam	vd16arrx9070xmh	tarjeta de video asrock amd radeoné rx 9070 xt monster hunter wilds, 16gb gddr6, pcie	\N	771.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:11.575705	2026-04-15 17:02:11.575705
282	5	24	\N	video, pci exp intel gam	vd6gara380cli	tarjeta de video asrock intel arc a380 challengeritx 6gb oc, 6 gb gddr6, pci-e 4.0[@@	\N	143.25	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.578451	2026-04-15 17:02:11.578451
283	5	24	\N	video, pci exp intel gam	vd10arb570cl	tarjeta de video asrock intel arc b570 challenger10gb oc, 10 gb gddr6, pci-e 4.0	\N	251.21	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.57987	2026-04-15 17:02:11.57987
284	5	24	\N	video, pci exp intel gam	vd12arb580cl	tarjeta de video asrock intel arc b580 challenger12gb oc, 12 gb gddr6, pci-e 4.0	\N	303.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.582138	2026-04-15 17:02:11.582138
285	5	17	\N	video, pci exp nvidia gam	vd6gasrtx3050do	tarjeta de video asus dual geforce rtx 3050 oc edition 6gb gddr6, pci-e 4.0	\N	216.00	5	f	\N	\N	\N	\N	2026-04-15 17:02:11.584162	2026-04-15 17:02:11.584162
286	5	17	\N	video, pci exp nvidia gam	vd8gasrtx5060ev	tarjeta de video asus dual-rtx5060-o8g-evo, 8 gb gddr7, pcie gen 5.0	\N	370.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.586249	2026-04-15 17:02:11.586249
287	5	17	\N	video, pci exp nvidia gam	vd8gasrtx5060do	tarjeta de video asus dual-rtx5060-o8g, 8gb gddr7, pcie gen 5.0	\N	375.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.588114	2026-04-15 17:02:11.588114
288	5	17	\N	video, pci exp nvidia gam	vd16asrtx506toe	tarjeta de video asus dual-rtx5060ti-o16g-evo, 16gb gddr7, pcie gen 5.0	\N	638.00	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.590096	2026-04-15 17:02:11.590096
289	5	17	\N	video, pci exp nvidia gam	vd8gasrtx506tdo	tarjeta de video asus dual-rtx5060ti-o8g, 8 gb gddr7, pcie gen 5.0	\N	391.45	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.592473	2026-04-15 17:02:11.592473
290	5	17	\N	video, pci exp radeon gam	vd16asrx906xtd	tarjeta de video asus dual-rx9060xt-16g, 16 gb gddr6, pci-e 5.0	\N	496.25	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.594853	2026-04-15 17:02:11.594853
291	5	17	\N	video, pci exp nvidia gam	vd8gasrtx5060po	tarjeta de video asus prime-rtx5060-o8g, 8 gb gddr7, pcie gen 5.0	\N	384.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.596523	2026-04-15 17:02:11.596523
292	5	17	\N	video, pci exp radeon gam	vd16asrx9070xtp	tarjeta de video asus prime-rx9070xt-o16g, 16 gb gddr6, pci-e 5.0	\N	756.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.597797	2026-04-15 17:02:11.597797
293	5	17	\N	video, pci exp nvidia gam	vd16asrtx5080no	tarjeta de video asus rtx5080-o16g-noctua, 16gb gddr7, pcie gen 5.0	\N	1765.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.599205	2026-04-15 17:02:11.599205
294	5	25	\N	video, pci exp nvidia gam	vd12gbrtx5070am	tarjeta de video gigabyte aorus geforce rtx 5070 master 12g, 12 gb gddr7, pcie gen 5.	\N	903.00	20	f	\N	\N	\N	\N	2026-04-15 17:02:11.601806	2026-04-15 17:02:11.601806
295	5	25	\N	video, pci exp radeon gam	vd16gbrx9070xte	tarjeta de video gigabyte aorus radeon rx 9070 xtelite 16g , 16 gb gddr6, pci-e 5.0[@	\N	880.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.603257	2026-04-15 17:02:11.603257
296	5	25	\N	video, pci exp nvidia gam	vd2ggbgvn1030d4	tarjeta de video gigabyte geforce gt 1030 (gv-n1030d4-2gl), 2gb ddr4, pci express 3.0	\N	87.00	16	f	\N	\N	\N	\N	2026-04-15 17:02:11.604734	2026-04-15 17:02:11.604734
297	5	25	\N	video, pci exp nvidia gam	vd8ggbrtx5050go	tarjeta de video gigabyte geforce rtx 5050 gamingoc 8g, 8 gb gddr6, pcie gen 5.0	\N	334.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.605943	2026-04-15 17:02:11.605943
298	5	25	\N	video, pci exp nvidia gam	vd8ggbrtx5050w2	tarjeta de video gigabyte geforce rtx 5050 windforce oc 8g, 8 gb gddr6, pcie gen 5.0[	\N	320.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.60787	2026-04-15 17:02:11.60787
299	5	25	\N	video, pci exp nvidia gam	vd8ggbrtx5050v2	tarjeta de video gigabyte geforce rtx 5050 windforce oc v2 8g, 8gb gddr6, pcie 5.0[@@	\N	322.66	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.610533	2026-04-15 17:02:11.610533
300	5	25	\N	video, pci exp nvidia gam	vd8ggbrtx5060ao	tarjeta de video gigabyte geforce rtx 5060 aero oc 8g, 8 gb gddr7, pcie gen 5.0	\N	413.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.612279	2026-04-15 17:02:11.612279
301	5	25	\N	video, pci exp nvidia gam	vd8ggbrtx5060ei	tarjeta de video gigabyte geforce rtx 5060 eagle oc ice 8g, 8 gb gddr7, pcie gen 5.0[	\N	369.49	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.614726	2026-04-15 17:02:11.614726
302	5	25	\N	video, pci exp nvidia gam	vd8ggbrtx5060go	tarjeta de video gigabyte geforce rtx 5060 gamingoc 8g, 8 gb gddr7, pcie gen 5.0	\N	386.75	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.617209	2026-04-15 17:02:11.617209
303	5	25	\N	video, pci exp nvidia gam	vd8ggbrtx506tem	tarjeta de video gigabyte geforce rtx 5060 ti eagle max oc 8g, 8 gb gddr7, pcie 5.0[@	\N	478.00	9	f	\N	\N	\N	\N	2026-04-15 17:02:11.619177	2026-04-15 17:02:11.619177
304	5	25	\N	video, pci exp nvidia gam	vd8ggbrtx506teo	tarjeta de video gigabyte geforce rtx 5060 ti eagle oc 8g, 8 gb gddr7, pcie gen 5.0[@	\N	452.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.621425	2026-04-15 17:02:11.621425
305	5	25	\N	video, pci exp nvidia gam	vd16gbrtx506tei	tarjeta de video gigabyte geforce rtx 5060 ti eagle oc ice 16g, 16 gb gddr7, pcie 5.0	\N	593.82	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.623148	2026-04-15 17:02:11.623148
306	5	25	\N	video, pci exp nvidia gam	vd8ggbrtx506tio	tarjeta de video gigabyte geforce rtx 5060 ti eagle oc ice 8g, 8 gb gddr7, pcie gen 5	\N	448.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.625134	2026-04-15 17:02:11.625134
307	5	25	\N	video, pci exp nvidia gam	vd8ggbrtx506tgo	tarjeta de video gigabyte geforce rtx 5060 ti gaming oc 8g, 8 gb gddr7, pcie gen 5.0[	\N	474.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.627392	2026-04-15 17:02:11.627392
308	5	25	\N	video, pci exp nvidia gam	vd8ggbrtx506tw2	tarjeta de video gigabyte geforce rtx 5060 ti windforce oc 8g, 8 gb gddr7, pcie gen 5	\N	406.19	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.630054	2026-04-15 17:02:11.630054
309	5	25	\N	video, pci exp nvidia gam	vd8ggbrtx5060wm	tarjeta de video gigabyte geforce rtx 5060 windforce max oc 8g, 8 gb gddr7, pcie gen	\N	370.00	18	f	\N	\N	\N	\N	2026-04-15 17:02:11.631354	2026-04-15 17:02:11.631354
310	5	25	\N	video, pci exp nvidia gam	vd12gbrtx5070ei	tarjeta de video gigabyte geforce rtx 5070 eagle oc ice sff 12, 12 gb gddr7, pcie gen	\N	748.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.633342	2026-04-15 17:02:11.633342
311	5	25	\N	video, pci exp nvidia gam	vd12gbrtx5070eo	tarjeta de video gigabyte geforce rtx 5070 eagle oc sff 12g, 12 gb gddr7, pcie gen 5.	\N	737.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.63461	2026-04-15 17:02:11.63461
312	5	25	\N	video, pci exp nvidia gam	vd12gbrtx5070go	tarjeta de video gigabyte geforce rtx 5070 gamingoc 12g, 12 gb gddr7, pcie gen 5.0[@@	\N	775.00	19	f	\N	\N	\N	\N	2026-04-15 17:02:11.636036	2026-04-15 17:02:11.636036
313	5	25	\N	video, pci exp nvidia gam	vd16gbrtx507twf	tarjeta de video gigabyte geforce rtx 5070 ti windforce oc v2 16g, 16gb gddr7 pcie ge	\N	1064.37	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.63755	2026-04-15 17:02:11.63755
314	5	25	\N	video, pci exp nvidia gam	vd32gbrtx5090w3	tarjeta de video gigabyte geforce rtx 5090 windforce oc 32g, 32 gb gddr7, pcie gen 5.	\N	3093.51	5	f	\N	\N	\N	\N	2026-04-15 17:02:11.638904	2026-04-15 17:02:11.638904
315	5	25	\N	video, pci express nvidia	vd2gbgt1030d4gl	tarjeta de video gigabyte nvidia geforce gt 1030,2gb ddr4 64-bit, low profile.	\N	107.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.640482	2026-04-15 17:02:11.640482
316	5	25	\N	video, pci exp radeon gam	vd8ggbrx7600gmo	tarjeta de video gigabyte radeon rx 7600 gaming oc 8g, 8 gb gddr6, pci-e 4.0	\N	331.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.642326	2026-04-15 17:02:11.642326
317	5	25	\N	video, pci exp radeon gam	vd12gbrx7700xtg	tarjeta de video gigabyte radeon rx 7700 xt gaming oc 12g, 12gb gddr6, pci-e 4.0	\N	436.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.64519	2026-04-15 17:02:11.64519
318	5	25	\N	video, pci exp radeon gam	vd8ggbrx906xtgo	tarjeta de video gigabyte radeon rx 9060 xt gaming oc 8g, 8 gb gddr6, pci-e 5.0	\N	384.89	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.646685	2026-04-15 17:02:11.646685
319	5	25	\N	video, pci exp radeon gam	vd16gbrx9070go	tarjeta de video gigabyte radeon rx 9070 gaming oc 16g, 16 gb gddr6, pci-e 5.0	\N	706.78	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.647887	2026-04-15 17:02:11.647887
320	5	19	\N	video, pci exp nvidia gam	vd6gmsrtx3050lp	tarjeta de video msi geforce rtx 3050 lp 6g oc, 6gb gddr6, pci-express gen 4.0	\N	221.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.649143	2026-04-15 17:02:11.649143
321	5	19	\N	video, pci exp nvidia gam	vd6gmsrtx3050v2	tarjeta de video msi geforce rtx 3050 ventus 2x 6g oc, 6gb gddr6, pci-express gen 4.0	\N	221.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.650367	2026-04-15 17:02:11.650367
322	5	19	\N	video, pci exp nvidia gam	vd8gmsrtx5050go	tarjeta de video msi geforce rtx 5050 8g gaming oc, 8 gb gddr6, pcie 5.0	\N	324.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.652107	2026-04-15 17:02:11.652107
323	5	19	\N	video, pci exp nvidia gam	vd8gmsrtx5060cy	tarjeta de video msi geforce rtx 5060 8g cyclone oc, 8 gb gddr7, pcie 5.0	\N	350.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.653723	2026-04-15 17:02:11.653723
324	5	19	\N	video, pci exp nvidia gam	vd8gmsrtx5060go	tarjeta de video msi geforce rtx 5060 8g gaming oc, 8 gb gddr7, pcie 5.0	\N	404.97	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.655234	2026-04-15 17:02:11.655234
325	5	19	\N	video, pci exp nvidia gam	vd8gmsrtx5060gt	tarjeta de video msi geforce rtx 5060 8g gaming trio oc, 8 gb gddr7, pcie 5.0	\N	415.82	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.656819	2026-04-15 17:02:11.656819
326	5	19	\N	video, pci exp nvidia gam	vd8gmsrtx5060s2	tarjeta de video msi geforce rtx 5060 8g shadow 2x oc, 8 gb gddr7, pcie 5.0	\N	355.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.659205	2026-04-15 17:02:11.659205
327	5	19	\N	video, pci exp nvidia gam	vd8gmsrtx506v2w	tarjeta de video msi geforce rtx 5060 8g ventus 2x oc white, 8gb gddr7, pcie 5.0 x16	\N	368.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.661331	2026-04-15 17:02:11.661331
328	5	19	\N	video, pci exp nvidia gam	vd8gmsrtx506tv2	tarjeta de video msi geforce rtx 5060 ti 8g ventus 2x oc plus, 8 gb gddr7, pcie gen 5	\N	426.89	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.663451	2026-04-15 17:02:11.663451
329	5	19	\N	video, pci exp nvidia gam	vd12msrtx5070v3	tarjeta de video msi geforce rtx 5070 12g ventus 3x oc, 12 gb gddr7, pcie 5.0	\N	664.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.66496	2026-04-15 17:02:11.66496
330	5	19	\N	video, pci exp nvidia gam	vd16msrtx5080gt	tarjeta de video msi geforce rtx 5080 16g gaming trio oc, 16gb gddr7, pcie gen 5.0[@@	\N	1511.00	10	f	\N	\N	\N	\N	2026-04-15 17:02:11.666664	2026-04-15 17:02:11.666664
331	5	19	\N	video, pci exp nvidia gam	vd12msrtx507wml	tarjeta de video msi geforce rtx5070 12g wow midnight ligth edition oc, 12gb gddr7, p	\N	800.00	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.668523	2026-04-15 17:02:11.668523
332	5	19	\N	video, pci exp nvidia gam	vd12msrtx507wmv	tarjeta de video msi geforce rtx5070 12g wow midnight void edition oc, 12 gb gddr7, p	\N	800.00	5	f	\N	\N	\N	\N	2026-04-15 17:02:11.670294	2026-04-15 17:02:11.670294
333	5	19	\N	video, pci exp nvidia gam	vd8gmsrtx506ts2	tarjeta de video msi geforce rtxé 5060 ti 8g shadow 2x oc plus, 8 gb gddr7, pcie gen	\N	414.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.672217	2026-04-15 17:02:11.672217
334	5	26	\N	video, pci exp nvidia gam	vd8gpyrtx506tdo	tarjeta de video pny geforce rtx 5060 ti oc, 8gb gddr7, pci express 5.0 x8	\N	410.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.675193	2026-04-15 17:02:11.675193
335	5	26	\N	video, pci exp nvidia gam	vd8gpyrtx5060do	tarjeta de video pny geforce rtx5060 dual fan gpu, 8gb gddr7, pcie gen 5	\N	350.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.676923	2026-04-15 17:02:11.676923
336	5	27	\N	video, pci exp radeon gam	vd16xfrx906xtm3	tarjeta de video xfx mercury amd radeon rx 9060 xt oc gaming edition, 16gb gddr6, pci	\N	503.75	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.679353	2026-04-15 17:02:11.679353
337	5	27	\N	video, pci exp radeon gam	vd16xfrx9070xtr	tarjeta de video xfx mercury amd radeon rx 9070xtoc gaming edition, 16gb gddr6, pci-e	\N	830.66	5	f	\N	\N	\N	\N	2026-04-15 17:02:11.680542	2026-04-15 17:02:11.680542
338	5	27	\N	video, pci exp radeon gam	vd16xfrx9070xtm	tarjeta de video xfx mercury amd radeon rx 9070xtoc magnetic air, 16 gb gddr6, pci-e	\N	866.34	5	f	\N	\N	\N	\N	2026-04-15 17:02:11.68198	2026-04-15 17:02:11.68198
339	5	27	\N	video, pci exp radeon gam	vd16xfrx907xtmw	tarjeta de video xfx mercury amd radeon rx 9070xtoc white gaming edition,16gb ddr6, p	\N	836.23	6	f	\N	\N	\N	\N	2026-04-15 17:02:11.683255	2026-04-15 17:02:11.683255
340	5	27	\N	video, pci exp radeon gam	vd16xfrx9070qgn	tarjeta de video xfx quicksilver amd radeon rx 9070 oc gaming edit, 16 gb gddr6, pci-	\N	648.50	16	f	\N	\N	\N	\N	2026-04-15 17:02:11.685435	2026-04-15 17:02:11.685435
341	5	27	\N	video, pci exp radeon gam	vd8gxfrx7600ss	tarjeta de video xfx speedster swft 210 amd radeon rx 7600, 8 gb gddr6 pci express 4.	\N	294.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.687229	2026-04-15 17:02:11.687229
342	5	27	\N	video, pci exp radeon gam	vd16xfrx906xtn3	tarjeta de video xfx swift amd radeon rx 9060 xt oc triple fan gaming, 16gb gddr6, pc	\N	491.36	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.688811	2026-04-15 17:02:11.688811
343	5	27	\N	video, pci exp radeon gam	vd16xfrx906xtw3	tarjeta de video xfx swift amd radeon rx 9060 xt oc white triple fan gaming edition 1	\N	498.12	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.690417	2026-04-15 17:02:11.690417
344	5	27	\N	video, pci exp radeon gam	vd16xfrx9070xt3	tarjeta de video xfx swift amd radeon rx 9070xt triple fan gaming, 16 gb gddr6, pci-e	\N	783.83	12	f	\N	\N	\N	\N	2026-04-15 17:02:11.692556	2026-04-15 17:02:11.692556
345	5	27	\N	video, pci exp radeon gam	vd16xfrx9070xtw	tarjeta de video xfx swift amd radeon rx 9070xt white triple fan gaming, 16gb ddr6, p	\N	789.40	6	f	\N	\N	\N	\N	2026-04-15 17:02:11.694303	2026-04-15 17:02:11.694303
346	13	16	monitor	monitor plano 23	mo238adv2454am	mon adv 24\\'' fhd 120hz 1ms ft	\N	96.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.696196	2026-04-15 17:02:11.696196
347	13	16	monitor	monitor plano 27	mo27adv2755am	mon adv 27\\'' fhd 144hz 1ms ft	\N	96.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.696955	2026-04-15 17:02:11.696955
348	13	16	monitor	monitor curvo 23	mon236cadv2452s	monitor curvo advance adv-2452s, 23.6 fhd va, 100hz, 1ms, hdmi, dp, parlante, negro[	\N	76.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.697715	2026-04-15 17:02:11.697715
349	13	16	monitor	monitor curvo 27	mon27cadv2751s	monitor curvo advance adv-2751s, 27 fhd va, 100hz, 1ms, hdmi, dp, parlantes, negro[@	\N	95.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.698287	2026-04-15 17:02:11.698287
350	13	16	monitor	monitor plano 21.45	mon215fadv2152s	monitor plano advance adv-2152s 21.5 fhd ips 100hz 1ms hdmi dp vga parlantes negro[@	\N	56.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.699009	2026-04-15 17:02:11.699009
351	13	16	monitor	monitor plano 23	mon238fadv2454s	monitor plano advance adv-2454s 23.8 fhd ips 144hz 1ms hdmi dp audio out parlantes n	\N	82.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.699786	2026-04-15 17:02:11.699786
352	13	16	monitor	monitor plano 27	mon27fadv2755s	monitor plano advance adv-2755s, 27 fhd ips, 144hz, 1ms, hdmi, dp, audio out	\N	96.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.700579	2026-04-15 17:02:11.700579
353	13	28	monitor	monitor gaming curvo 31.5	zzmonterte3215g	zz monitor gam teros by amd	\N	999.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.702248	2026-04-15 17:02:11.702248
354	13	17	monitor	monitor plano 21.45	mo22asvt229h-b	mon 21.5 as vt229h tactil fhd	\N	176.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.703055	2026-04-15 17:02:11.703055
355	13	17	monitor	monitores tft 24 - 28	mo27asbe27acsbk	mon 27 as be27acsbk 2k ips	\N	316.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.704941	2026-04-15 17:02:11.704941
356	13	17	monitor	monitor gaming plano 25	mo24asvg249q5a	monitor plano asus tuf gaming vg249q5a 23.8 fhd/ips/hdmix2/dp/earphone-out/parlante(	\N	110.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.705797	2026-04-15 17:02:11.705797
357	13	17	monitor	monitor plano 21.45	mo22asvt229h	monitor plano multitactil asus vt229h, 21.5 fhd ips (1920x1080) /hdmi x1/vga x1	\N	188.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.706584	2026-04-15 17:02:11.706584
358	13	29	monitor	monitor plano 21.45	zzmonte2130c	mon te 21.5 fhd 100hz 5ms (hp)	\N	9999.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:11.708839	2026-04-15 17:02:11.708839
359	13	29	monitor	monitor plano 21.45	monhpb0bn7utaba	monitor full hd de la serie hp 3 pro de 21.5 pulgadas - 322ph, fhd/ips/hdmi/dp/vga[@@	\N	126.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.710204	2026-04-15 17:02:11.710204
360	13	29	monitor	monitor plano 27	monhpb0cg3utaba	monitor full hd de la serie hp 3 pro de 27 pulgadas - 327pf, fhd/ips/hdmi/vga/display	\N	169.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.711299	2026-04-15 17:02:11.711299
361	13	29	monitor	monitor plano 23	monhp169l0aaaba	monitor hp e24mv g4, 23.8 fhd (1920x1080) ips, hdmi/vga/dp/usb-a 3.1 gen 1(4)	\N	218.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.712172	2026-04-15 17:02:11.712172
362	13	29	monitor	monitor plano 23	monhp6n6e6aaaba	monitor hp e24t g5 touch, 23.8é fhd ips(1920x1080) dp / hdmi / usb-a x4 / usb-b	\N	293.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.71285	2026-04-15 17:02:11.71285
363	13	29	monitor	monitor plano 23	monhp8y2f7aaaba	monitor hp wuxga de la serie hp 7 pro 24 - 724puwuxga/ips/hdmi/dp/usb-c/usb-a/rj-45[	\N	333.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.713708	2026-04-15 17:02:11.713708
364	13	29	monitor	monitor plano 21.45	monhp9u5b0utaba	monitor plano hp serie 3 pro 322pf, 21.5 wled/fhd/ips/100hz/antirreflectante/hdmi/dp	\N	120.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.714728	2026-04-15 17:02:11.714728
365	13	29	monitor	monitor plano 23	monhp9u5c1aaaba	monitor plano hp serie 3 pro 324pv, 23.8 wled/fhd/va/100hz/antirreflectante/hdmi/vga	\N	123.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.715634	2026-04-15 17:02:11.715634
366	13	29	monitor	monitor plano 23	monhp9d9l6utaba	monitor plano hp serie 5 pro 524pf 23.8 wled/fhd/ips/antirreflectante/hdmi/dp/usb-a/	\N	184.90	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.716556	2026-04-15 17:02:11.716556
367	13	29	monitor	monitor plano 23	monhp8x534aaaba	monitor plano hp serie 7 pro 24- 724pn, wuxga/ips/antirreflectante/hdmi/dp/usb-a/usb	\N	363.00	15	f	\N	\N	\N	\N	2026-04-15 17:02:11.71753	2026-04-15 17:02:11.71753
368	13	29	monitor	monitor plano 23	monhp9u5j5utaba	monitor plano hp series 3 pro 324pf, 23.8é fhd ips (1920x1080@100hz) dp / hdmi/ vga[@	\N	129.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.718895	2026-04-15 17:02:11.718895
369	13	11	monitor	monitor plano 23	monle67ddkac6la	monitor plano lenovo l24-4c, 23.8 (1920 x 1080) wled fhd ips, 144hz, hdmi, vga	\N	107.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.719718	2026-04-15 17:02:11.719718
370	13	11	monitor	monitor plano 21.45	monle67d5kac6la	monitor plano lenovo l24-4e, 21.5 (1920x1080) wled fhd ips, 100hz, hdmi, vga	\N	75.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.720993	2026-04-15 17:02:11.720993
371	13	11	monitor	monitor plano 23	monle68c2kac1la	monitor plano lenovo l24-4e,23.8 (1920 x 1080) wled fhd ips, hdmi, vga	\N	91.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.721821	2026-04-15 17:02:11.721821
372	13	11	monitor	monitor plano 27	monle67dekac1la	monitor plano lenovo l27-4c, 27 (1920x1080) wledfhd ips,144 hz, hdmi, vga	\N	130.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.722477	2026-04-15 17:02:11.722477
373	13	11	monitor	monitor plano 27	monle68cdkac1la	monitor plano lenovo l27-4e, 27(1920x1080) wled fhd ips, 100hz, hdmi, vga	\N	104.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.723323	2026-04-15 17:02:11.723323
374	13	12	monitor	monitor curvo 34	monle64b4gar1la	monitor curvo lenovo thinkvision p40wd-40, 39.7/2500r/wled/wuhd/ips/hdmi/dp/dp-out/r	\N	1096.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.724453	2026-04-15 17:02:11.724453
375	13	12	monitor	monitor plano 21.45	monle64c9mar6la	monitor lenovo thinkvision e22-40, 21.5 1920x1080 wled ips, hdmi/dp/vga color raven	\N	122.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.725298	2026-04-15 17:02:11.725298
376	13	12	monitor	monitor plano 27	monle64bcmar4la	monitor lenovo thinkvision e27-40, 27 wled/fhd/ips/hdmi x1/dp x1/vga x1/parlantes: 2	\N	137.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.726352	2026-04-15 17:02:11.726352
377	13	12	monitor	monitor plano 27	monlen63dfkar4l	monitor lenovo thinkvision s27i-30, 27 wled ips fhd (1920 x 1080), hdmi x2/vga x1[@@	\N	157.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.727075	2026-04-15 17:02:11.727075
378	13	12	monitor	monitor plano 21.45	monle63b0mar6la	monitor lenovo thinkvision t22i-30, 21.5 1920x1080 wled ips hdmi/dp/vga color raven	\N	141.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.728104	2026-04-15 17:02:11.728104
379	13	12	monitor	monitor plano 23	monle64a4marxla	monitor lenovo thinkvision t24-40 23.8 wled ips hdmix1/dpx1/vgax1/usb-ax3/usb-bx1/us	\N	153.00	7	f	\N	\N	\N	\N	2026-04-15 17:02:11.728762	2026-04-15 17:02:11.728762
380	13	12	monitor	monitor plano 23	monle62c5gar1la	monitor lenovo thinkvision t24t-20, 23.8 1920x1080 wled ips hdmi/dp/usb-c 3.2 gen 1[	\N	303.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.729374	2026-04-15 17:02:11.729374
381	13	12	monitor	monitor plano 31.5	monle63d3gar1la	monitor lenovo thinkvision t32h-30, 31.5 wled ips, hdmi x1/dp x1/usb-c x1/usb-a x4/r	\N	369.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.730012	2026-04-15 17:02:11.730012
382	13	12	monitor	monitor plano 23	monle64bamar1la	monitor plano lenovo thinkvision e24-40, 23.8 wled fhd ips/hdmi/dp/vga/parlantes (2w	\N	129.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.730775	2026-04-15 17:02:11.730775
383	13	12	monitor	monitor plano 23	monle64b2gar1la	monitor plano lenovo thinkvision p24q-40, 23.8 qhd/ips/hdmi/dp/dp-out/usb-a/usb-b/us	\N	234.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.73151	2026-04-15 17:02:11.73151
384	13	12	monitor	monitor plano 27	monle64a7gar6la	monitor plano lenovo thinkvision p27q-40, 27 2k qhd fast ips, hdmi, dp, usb	\N	266.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.732314	2026-04-15 17:02:11.732314
385	13	12	monitor	monitor plano 23	monle64b5kar1la	monitor plano lenovo thinkvision s24-4e, 23.8 wled fhd ips/hdmi/vga	\N	88.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.733084	2026-04-15 17:02:11.733084
386	13	12	monitor	monitor plano 27	monle64bekar1la	monitor plano lenovo thinkvision s27-4e, 27 wled/fhd/ips/hdmi/vga	\N	133.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.733917	2026-04-15 17:02:11.733917
387	13	12	monitor	monitor plano 27	monle64a5mar6la	monitor plano lenovo thinkvision t27-40, 27 wledfhd ips/hdmi/dp/vga/usb-c/usb-b/usb-	\N	210.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.734622	2026-04-15 17:02:11.734622
388	13	12	monitor	monitor plano 27	monle64b8uar1la	monitor plano lenovo thinkvision t27qd-4v, 27 wled qhd/ips/hdmi/dp/dp-out/usb-c/rj45	\N	345.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.735431	2026-04-15 17:02:11.735431
389	13	30	monitor	monitor plano 27	mon27lg27g440ab	mon led 27 ips fhd 240hz pivot	\N	168.00	6	f	\N	\N	\N	\N	2026-04-15 17:02:11.736833	2026-04-15 17:02:11.736833
390	13	30	monitor	monitor curvo 31.5	monlg32g600a	mon lg 32 gam ips 180hz pivot	\N	214.50	8	f	\N	\N	\N	\N	2026-04-15 17:02:11.737558	2026-04-15 17:02:11.737558
391	13	30	monitor	monitor curvo 34	mon34lg34u650ab	monitor curvo lg 34u650a-b.awf, 34 uwqhd ips, 100hz, 5ms, hdmi, dp, usb-c, parlantes	\N	395.90	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.738593	2026-04-15 17:02:11.738593
392	13	30	monitor	monitor gaming plano 23	mon24lg24g411ab	monitor gaming lg ultragear g4, 23.8é fhd/ips/144hz/hdmi/dp/headphone-out	\N	88.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.739962	2026-04-15 17:02:11.739962
393	13	30	monitor	monitor gaming plano 27	mon27lg27g610ab	monitor gaming lg ultragear g6, 27é qhd/ips/200hz/1ms (gtg)/hdmi x2/dp/headphone-out[	\N	209.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.741744	2026-04-15 17:02:11.741744
394	13	30	monitor	monitor curvo 34	mon34lg34g600ab	monitor gaming lg ultragear g6, 34é curvo/wqhd/va/160hz/1ms mbr/hdmi x2/dp/headphone-	\N	322.40	18	f	\N	\N	\N	\N	2026-04-15 17:02:11.742832	2026-04-15 17:02:11.742832
395	13	30	monitor	monitor gaming plano 27	mon27lg27g411a	monitor lg 27g411a-b, 27é/fhd/ips/144hz/hdmi/dp/usb/headphones-out (3-polos, solo son	\N	112.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.743675	2026-04-15 17:02:11.743675
396	13	30	monitor	monitor plano 27	mov27lg27us500	monitor lg 27us500-w plano 27é uhd 4k ips / hdmi x2 / dp / audio-out	\N	208.70	17	f	\N	\N	\N	\N	2026-04-15 17:02:11.744558	2026-04-15 17:02:11.744558
397	13	30	monitor	monitor plano 27	mon27lg27u411ab	monitor lg 27é fhd/ips/120hz/hdmi/vga/headphone-out	\N	106.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.745272	2026-04-15 17:02:11.745272
398	13	30	monitor	monitor plano 34	mon34lg34u511ab	monitor lg 34u511a-b, 34é/wfhd/ips/100hz/hdmi/dp/headphones-out (3-polos, solo sonido	\N	230.30	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.746106	2026-04-15 17:02:11.746106
399	13	30	monitor	monitor gaming plano 31.5	mov32lg32gs75q	monitor lg gaming 31.5 ultragear qhd ips (2560x1440), 180hz, hdmix2/dpx1/headphone-o	\N	309.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.746852	2026-04-15 17:02:11.746852
400	13	30	monitor	monitor plano 23	mon24lg24u411ab	monitor plano lg 24u411a-b, 23.8 fhd ips, 120hz ,5ms,hdmi, vga,headphone out	\N	79.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.747534	2026-04-15 17:02:11.747534
401	13	30	monitor	monitor plano 27	mon27lg27u631a	monitor plano lg 27u631a-b, 27 qhd ips,100 hz, hdmi, hdr10, hdr, usb-c: 15w	\N	144.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.74836	2026-04-15 17:02:11.74836
402	13	30	monitor	monitor plano 29	mon29lg29u531aw	monitor ultrawide lg 29u531a-w, 29 wfhd ips,100 hz, hdmi,dp, hdr10, hdr, usb-c	\N	199.40	13	f	\N	\N	\N	\N	2026-04-15 17:02:11.749125	2026-04-15 17:02:11.749125
403	13	19	monitor	monitor gaming curvo 27	mo27msmag276cxf	monitor curvo gaming msi mag 276cxf, 27 fhd, 1500r, rapid va, 280hz, hdmi x2/dp x1/h	\N	121.00	8	f	\N	\N	\N	\N	2026-04-15 17:02:11.749873	2026-04-15 17:02:11.749873
404	13	19	monitor	monitor gaming curvo 31.5	mo32msmag32c6x	monitor curvo gaming msi mag 32c6x, 31.5 fhd, 1500r, va, 250hz(oc), hdmi x2/dp x1/hp	\N	165.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.750841	2026-04-15 17:02:11.750841
405	13	19	monitor	monitor gaming curvo 27	mo27ms275cqfe18	monitor curvo msi mag 275cqf e18, 27 wqhd rapid va, 180hz, hdmi x2/dp x1/headphone-o	\N	140.85	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.751657	2026-04-15 17:02:11.751657
406	13	19	monitor	monitor gaming curvo 25	mo24msmag242c	monitor msi mag 242c curvo (1500r) 23.6é, fhd va,hdmi / dp / headphone-out	\N	94.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.75252	2026-04-15 17:02:11.75252
407	13	19	monitor	monitor gaming plano 25	mo24ms245fx24	monitor plano gamer msi mag 245f x24, 23.8 fhd ips, 240hz, 0.5ms, dp, hdmi, headphon	\N	109.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.75351	2026-04-15 17:02:11.75351
408	13	19	monitor	monitor gaming plano 23	mo24msg242le14	monitor plano gaming msi g242l e14, 23.8 fhd ips, hdmi ,dp, 144 hz, 1 ms, color negr	\N	68.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.754379	2026-04-15 17:02:11.754379
409	13	19	monitor	monitor gaming plano 27	mo27ms272fx24	monitor plano gaming msi mag 272f x24, 27 fhd ips, 240hz, 0.5ms, hdmi, dp, headphone	\N	126.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.755544	2026-04-15 17:02:11.755544
410	13	19	monitor	monitor gaming plano 27	mo27ms272qpwqdo	monitor plano msi mag 272qpw qd-oled x28, 26.5 wqhd/oled/hdmi x2/dp/tipo-c/headphone	\N	555.00	5	f	\N	\N	\N	\N	2026-04-15 17:02:11.756263	2026-04-15 17:02:11.756263
411	13	19	monitor	monitor plano 25	mo24msmp243le14	monitor plano msi pro mp243l e14, 23.8 fhd/ips/hdmi x1/vga x1	\N	71.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.757119	2026-04-15 17:02:11.757119
412	13	19	monitor	monitor plano 27	mo27msmp273le14	monitor plano msi pro mp273l e14, 27/144hz/fhd(1920x1080)/ips/hdmi/vga	\N	85.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.758151	2026-04-15 17:02:11.758151
413	13	19	monitor	monitor gaming plano 27	mo27msmp275pge1	monitor plano msi pro mp275pg e14, 27 fhd ips, hdmi, dp, headphone out	\N	108.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.759328	2026-04-15 17:02:11.759328
414	13	5	monitor	monitor gaming plano 23	zzmonsmls24dg30	mon plano gmg sam ody - le con	\N	199.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.760318	2026-04-15 17:02:11.760318
415	13	5	monitor	monitor gaming plano 27	monsmls27dg612s	monitor plano gaming samsung odyssey oled g6, 27qhd, 240hz, hdmi, dp	\N	636.44	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.76128	2026-04-15 17:02:11.76128
416	13	5	monitor	monitor plano 21.45	monsmls22d400ga	monitor plano samsung essential monitor s4, 22 fhd ips, 100hz, hdmi, dp	\N	104.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.76204	2026-04-15 17:02:11.76204
417	13	14	monitor	monitor gaming curvo 34	mon34cte3412gm	monitor 34\\'\\'wqhd 180hz+mochi	\N	225.80	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.762897	2026-04-15 17:02:11.762897
418	13	14	monitor	monitor plano 23	mon238fte2416cs	monitor corp. teros te-2416cs 23.8 qhd ips 100hz1ms hdmi dp parlantes audio out céma	\N	173.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.763646	2026-04-15 17:02:11.763646
419	13	14	monitor	monitor gaming curvo 27	mon27cte2767g	monitor curvo gaming teros te-2767g 27 qhd va 180hz 1ms hdmi dp audio out negro	\N	159.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.764297	2026-04-15 17:02:11.764297
420	13	14	monitor	monitor gaming curvo 31.5	mon315cte3219g	monitor curvo gaming teros te-3219g, 31.5 fhd va, 240 hz, 1ms, hdmi, dp, audio out[@	\N	172.00	17	f	\N	\N	\N	\N	2026-04-15 17:02:11.764948	2026-04-15 17:02:11.764948
421	13	14	monitor	monitor gaming curvo 34	mon34cte3412g	monitor curvo gaming teros te-3412g ,34 uwqhd va, 180hz, 1ms, hdmi, dp, audio out[@@	\N	242.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.76619	2026-04-15 17:02:11.76619
422	13	14	monitor	monitor curvo 23	mon238cte2402s	monitor curvo teros te-2402s 23.8 fhd va 100hz 1ms hdmi vga	\N	77.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.767013	2026-04-15 17:02:11.767013
423	13	14	monitor	monitor curvo 23	mon238cte2403s	monitor curvo teros te-2403s, 23.8 fhd va, 144hz, 1ms, hdmi, dp, earphone out	\N	82.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.767695	2026-04-15 17:02:11.767695
424	13	14	monitor	monitor curvo 27	mon27cte2734s	monitor curvo teros te-2734s, va fhd (1920 x 1080), 144hz, 1ms, hdmi, dp, audio out[@	\N	102.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.768419	2026-04-15 17:02:11.768419
425	13	14	monitor	monitor plano 27	mon27fte2715cs	monitor plano corporativo teros te-2715cs, qhd ips, 100hz, hdmi, dp, audio out, cémar	\N	237.00	6	f	\N	\N	\N	\N	2026-04-15 17:02:11.769187	2026-04-15 17:02:11.769187
426	13	14	monitor	monitor gaming plano 25	mon245fte2475g	monitor plano gaming teros te-2475g 24.5 fhd va 180hz 1ms hdmi dp audio out negro[@@	\N	76.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.770028	2026-04-15 17:02:11.770028
427	13	14	monitor	monitor gaming plano 27	mon27fte2754g	monitor plano gaming teros te-2754g, 27 qhd ips,200hz, 1ms, hdmi, dp, audio out	\N	156.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.770947	2026-04-15 17:02:11.770947
428	13	14	monitor	monitor gaming plano 27	mon27fte2769g	monitor plano gaming teros te-2769g, 27 qhd ips,180 hz, 1ms, hdmi, dp, audio	\N	116.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.772135	2026-04-15 17:02:11.772135
429	13	14	monitor	monitor plano 18.5 - 19.5	mon195fte1915s	monitor plano teros te-1915s 19.5 hd+ tn 75hz 5ms hdmi vga parlantes	\N	45.99	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.773043	2026-04-15 17:02:11.773043
430	13	14	monitor	monitor plano 18.5 - 19.5	mon195fte1916s	monitor plano teros te-1916s, 19.5 hd tn, 75 hz,5ms, hdmi, vga, audio out, parlantes	\N	45.99	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.774403	2026-04-15 17:02:11.774403
431	13	14	monitor	monitor plano 21.45	mon215fte2128s	monitor plano teros te-2128s 21.5 fhd ips 100hz 1ms hdmi vga	\N	50.90	19	f	\N	\N	\N	\N	2026-04-15 17:02:11.775353	2026-04-15 17:02:11.775353
432	13	14	monitor	monitor plano 23	mon238fte2415s	monitor plano teros te-2415s, 23.8 fhd ips, 120hz, 1ms, hdmi, dp, parlantes	\N	63.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.776302	2026-04-15 17:02:11.776302
433	13	14	monitor	monitor plano 23	mon238fte2417s	monitor plano teros te-2417s 23.8 fhd ips 144hz 1ms hdmi dp parlantes audio out	\N	80.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.777314	2026-04-15 17:02:11.777314
434	13	14	monitor	monitor plano 23	mon24fte2419cs	monitor plano teros te-2419cs 24 wuxga ips 75hz 5ms hdmi vga	\N	52.80	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.77811	2026-04-15 17:02:11.77811
435	13	14	monitor	monitor plano 23	mon24fte2420cs	monitor plano teros te-2420cs, 24 wuxga ips, 100hz, 5ms, hdmi, vga, negro	\N	56.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.778974	2026-04-15 17:02:11.778974
436	13	14	monitor	monitor plano 27	mon27fte2714s	monitor plano teros te-2714s, 27 fhd ips, 144hz,1ms, hdmi,dp, audio out, parlantes[@	\N	100.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.77978	2026-04-15 17:02:11.77978
437	8	16	mouse	mouse inalambrico	mswbladv1238s	mouse inalémbrico adv-1238s, usb, 3 botones, azul	\N	4.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.78085	2026-04-15 17:02:11.78085
438	8	31	mouse	mouse inalambrico	zzmouseepson	mouse wireless epson	\N	999.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.782512	2026-04-15 17:02:11.782512
439	8	29	mouse	mouse inalambrico	mmshp4e407utabm	hp 235 slim wireless mouse	\N	11.95	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.7833	2026-04-15 17:02:11.7833
440	8	11	mouse	mouse para gamers	mslengy51m74265	mouse lenovo m210 rgb gaming, interfaz usb, sensor optico paw3333 de hasta 8000 dpi[@	\N	15.60	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.784054	2026-04-15 17:02:11.784054
441	8	12	mouse	mouse usb	aclen4y51d20850	mouse compacto lenovo thinkpad, interfaz usb-c	\N	11.99	11	f	\N	\N	\N	\N	2026-04-15 17:02:11.784831	2026-04-15 17:02:11.784831
442	8	12	mouse	mouse inalambrico	mslen4x30m56888	mouse inalémbrico thinkpad essential (conexién inalémbrica de 2.4ghz a través de nano	\N	12.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.786361	2026-04-15 17:02:11.786361
443	8	12	mouse	mouse usb	mslen4y50r20863	mouse lenovo essential, sensor optico (1600dpi), usb, ergonomico, ambidiestro, color	\N	12.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.787156	2026-04-15 17:02:11.787156
444	8	12	mouse	mouse inalambrico	mssle4y51j62544	mouse lenovo profesional, recargable, inalambrico(bluetooth)	\N	39.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.787931	2026-04-15 17:02:11.787931
445	8	12	mouse	mouse inalambrico	aclen4y51d20849	mouse lenovo thinkpad essential inalambrico con receptor usb tipo-c, color negro	\N	19.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.788698	2026-04-15 17:02:11.788698
446	8	13	mouse	mouse inalambrico	msmusblogm280bl	mouse éptico inalémbrico logitech m280, 1000 dpi,receptor usb, 2.4ghz, azul.	\N	19.00	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.789558	2026-04-15 17:02:11.789558
447	8	13	mouse	mouse inalambrico	msmusblogm280gr	mouse éptico inalémbrico logitech m280, 1000 dpi,receptor usb, 2.4ghz, gris	\N	18.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.790661	2026-04-15 17:02:11.790661
448	8	14	mouse	mouse para gamers	mscbkte1232g	mouse gamer teros te-1232g, dpi hasta 7200, rgb, 7 botones, éptico, negro	\N	5.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.791875	2026-04-15 17:02:11.791875
449	8	14	mouse	mouse para gamers	mscbkte1233g	mouse gamer teros te-1233g, dpi hasta 7200, rgb,7botones, usb, negro	\N	5.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.79318	2026-04-15 17:02:11.79318
450	8	14	mouse	mouse inalambrico	mswbkte1230cs	mouse inalémbrico dual teros te-1230cs, 3 botones, 1200dpi	\N	5.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.794146	2026-04-15 17:02:11.794146
451	8	14	mouse	mouse inalambrico	mswbkte1228s	mouse inalémbrico teros te-1228s, 6 botones, 2.4ghz, usb, color negro	\N	3.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.79494	2026-04-15 17:02:11.79494
452	8	14	mouse	mouse inalambrico	mswbkte1231s	mouse inalémbrico teros te-1231s, 2.4ghz, bt 5.0,4 botones, usb, negro	\N	5.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.795648	2026-04-15 17:02:11.795648
453	8	14	mouse	mouse inalambrico	mswpkte1234s	mouse inalémbrico teros te-1234s, 2.4ghz, 6 botones, usb, rosado	\N	3.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.796368	2026-04-15 17:02:11.796368
454	8	14	mouse	mouse inalambrico	mswblte1235s	mouse inalémbrico teros te-1235s, 2.4ghz, 6 botones, usb, color azul	\N	3.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.797225	2026-04-15 17:02:11.797225
455	8	14	mouse	mouse inalambrico	mswbkte1236s	mouse inalémbrico teros te-1236s, rgb, blanco, 6 botones con rueda	\N	9.10	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.797964	2026-04-15 17:02:11.797964
456	8	14	mouse	mouse inalambrico	mswdbkte1237s	mouse inalémbrico teros te-1237s, bt 5.0, 2.4ghz,usb, color negro	\N	5.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.798959	2026-04-15 17:02:11.798959
457	8	14	mouse	mouse inalambrico	mswdpplte1239s	mouse inalémbrico teros te-1239s, 2.4ghz, 4 botones, usb, color purple	\N	5.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.799761	2026-04-15 17:02:11.799761
458	8	14	mouse	mouse inalambrico	mswdblte1240s	mouse inalémbrico teros te-1240s, 2.4ghz, 4 botones, usb, color azul	\N	5.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.800536	2026-04-15 17:02:11.800536
459	8	14	mouse	mouse inalambrico	mswpplte1224s	mouse éptico inalémbrico teros te-1224s, 1000 dpi, receptor usb, 4 botones	\N	4.00	14	f	\N	\N	\N	\N	2026-04-15 17:02:11.80139	2026-04-15 17:02:11.80139
460	8	14	mouse	mouse usb	mswpkte1221s	mouse éptico teros te-1221s, 1000 dpi, usb, 3 botones	\N	1.28	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.802293	2026-04-15 17:02:11.802293
461	8	14	mouse	mouse usb	mscbkte1222s	mouse éptico teros te-1222s, 800-1200-1600 dpi, usb, 4 botones	\N	2.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.803287	2026-04-15 17:02:11.803287
462	8	14	mouse	mouse usb	mscwhte1225s	mouse éptico teros te-1225s, 800-1200-1600 dpi, usb, 4 botones, color blanco	\N	2.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.804275	2026-04-15 17:02:11.804275
463	8	14	mouse	mouse usb	mscpkte1226s	mouse éptico teros te-1226s, 800-1200-1600 dpi, usb, 4 botones, color rosado	\N	2.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.80518	2026-04-15 17:02:11.80518
464	8	14	mouse	mouse usb	mscgnte1227s	mouse éptico teros te-1227s, 800-1200-1600 dpi, usb, 4 botones, color verde	\N	2.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.805919	2026-04-15 17:02:11.805919
465	8	14	mouse	mouse usb	mscbkte1229s	mouse éptico teros te-1229s, usb, 4 botones, negro	\N	2.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.806616	2026-04-15 17:02:11.806616
466	8	10	mouse	mouse inalambrico	zzte1237sm	mouse wireless te1237 black	\N	999.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.807667	2026-04-15 17:02:11.807667
467	8	17	mousepad	mouse pad/mat, accesorios	acmsasmikunc19	mousepad asus tuf gaming p1 hatsune miku edition 90mp04c0-bpaa00	\N	16.95	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.809049	2026-04-15 17:02:11.809049
468	8	14	mousepad	mouse pad/mat, accesorios	accmpbkte3012g	mouse pad gamer teros te-3012g, multicolor	\N	5.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.810244	2026-04-15 17:02:11.810244
469	8	14	mousepad	mouse pad/mat, accesorios	accmpbkte3015s	mouse pad teros te-3015s, negro	\N	2.83	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.811896	2026-04-15 17:02:11.811896
470	8	14	mousepad	mouse pad/mat, accesorios	accmpbkte3017s	mouse pad teros te-3017s, negro	\N	2.10	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.812806	2026-04-15 17:02:11.812806
471	8	14	mousepad	mouse pad/mat, accesorios	accmpbkte3018s	mousepad teros te-3018s, diseéo impreso	\N	2.10	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.813618	2026-04-15 17:02:11.813618
472	8	14	mousepad	mouse pad/mat, accesorios	accmpbkte3019s	mousepad teros te-3019s, diseéo impreso	\N	2.10	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.814831	2026-04-15 17:02:11.814831
473	8	16	teclado	teclado usb	kbusbadv628-b	teclado advance kb-628, espaéol, multimedia, internet, conexién usb, negro.	\N	1000.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.815629	2026-04-15 17:02:11.815629
474	8	17	teclado	teclado para gamers	kbastufk3g2miku	teclado asus tuf gaming k3 gen ii hatsune miku edition, usb, rgb	\N	87.01	2	f	\N	\N	\N	\N	2026-04-15 17:02:11.816382	2026-04-15 17:02:11.816382
475	8	14	teclado	teclado+mouse kit inalamb	kbmswbkte4071s	kit teclado y mouse teros te-4071s, inalémbrico, 2.4 ghz, acabado elegante, negro, es	\N	6.20	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.81714	2026-04-15 17:02:11.81714
476	8	14	teclado	teclado+mouse combo kit	kbmscbkte5010cs	kit teclado y mouse teros te-5010cs, usb, 1000-2000 dpi, 4 botones, 105, tecla fn, ne	\N	6.40	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.817899	2026-04-15 17:02:11.817899
477	8	14	teclado	teclado+mouse combo kit	kbmscbkte5012s	kit teclado y mouse teros te-5012s, usb, 1000 dpi, 3 botones, 105 + 8 teclas, negro[@	\N	4.40	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.818754	2026-04-15 17:02:11.818754
478	8	14	teclado	teclado para gamers	kbcbkte4072g	teclado gamer teros te-4072g, rgb, usb, negro	\N	5.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.819589	2026-04-15 17:02:11.819589
479	8	14	teclado	teclado para gamers	kbcbkte4074g	teclado gamer teros te-4074g, rgb, usb 2.0, negro	\N	15.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.820516	2026-04-15 17:02:11.820516
480	8	14	teclado	teclado inalambrico	kbwbkte4075s	teclado inalémbrico plegable teros te-4075s, bt 3.0, gris	\N	14.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.821262	2026-04-15 17:02:11.821262
481	8	14	teclado	teclado inalambrico	kbte4064n	teclado inalémbrico teros te-4064n, 2.4 ghz, bluetooth 3.0 / 5.2, 80 teclas, negro[@@	\N	9.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.822049	2026-04-15 17:02:11.822049
482	8	14	teclado	teclado inalambrico	kbwwhte4070s	teclado inalémbrico teros te-4070s, 2.4 ghz, bluetooth 3.0 / 5.2, 80 teclas, blanco[@	\N	9.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.822739	2026-04-15 17:02:11.822739
483	8	14	teclado	teclado inalambrico	kbwbkte4074cs	teclado inalémbrico teros te-4074cs, 2.4ghz, usb,negro	\N	8.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.82343	2026-04-15 17:02:11.82343
484	8	14	teclado	teclado usb	kbte4065n	teclado lavable teros te-4065n, ipx7, usb, negro	\N	9.80	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.824555	2026-04-15 17:02:11.824555
485	8	14	teclado	teclado para gamers	kbcbkte4068g	teclado mecénico te-4068g, retroiluminacién rainbow, usb 2.0, espaéol, color negro[@@	\N	15.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.825684	2026-04-15 17:02:11.825684
486	8	10	teclado	teclado+mouse kit inalamb	zzte5011csm	kit teclado+mouse w te5011cs	\N	999.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.826558	2026-04-15 17:02:11.826558
487	8	12	webcam	camara, webcam	acclen4xc1q4495	camara web lenovo fhd (1920x1080@30 fps), interfaz: usb 2.0 tipo-a, color negro	\N	47.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.827324	2026-04-15 17:02:11.827324
488	8	13	webcam	camara, webcam	cwlogitebrio300	camara web logitech brio 300, megapéxeles de cémara: 2mp, usb-c, microfono mono	\N	43.50	19	f	\N	\N	\N	\N	2026-04-15 17:02:11.8281	2026-04-15 17:02:11.8281
489	8	14	webcam	camara, webcam	mmte9072	webcam teros te-9072, 2k, micréfono incorporado, usb 2.0	\N	13.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.828936	2026-04-15 17:02:11.828936
490	8	14	webcam	camara, webcam	mmte9073n	webcam teros te-9073n, 4k, micréfono incorporado,usb 2.0	\N	26.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.830194	2026-04-15 17:02:11.830194
495	2	24	\N	mb ci9 s1700 ddr5 gaming	mbarb760mpglnwf	ASRock B760M PG Lightning WiFi	Placa base Micro-ATX robusta, enfocada en la serie Phantom Gaming. Cuenta con un diseño de VRM mejorado con disipadores de aluminio para gestionar procesadores Intel de 12.ª, 13.ª y 14.ª generación. Incluye Wi-Fi 6E y Bluetooth integrados, además de una ranura PCIe reforzada (Steel Slot) para tarjetas gráficas pesadas.	105.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.841746	2026-04-16 17:47:00.216575
497	2	24	\N	mb ci9 s1700 ddr4	mbarb760mcd4blk	ASRock B760M-C/D4	Placa base básica enfocada en estabilidad para oficinas. Su principal característica es el uso de memoria DDR4, lo que permite reutilizar módulos de RAM de equipos anteriores o reducir significativamente el costo total del ensamble. Es una placa sencilla, con disipadores mínimos y conectividad estándar, diseñada para procesadores Intel Core de 12.ª, 13.ª y 14.ª generación.	1870.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.845588	2026-04-16 18:06:00.933521
502	2	24	\N	mb cu9 s1851 ddr5	mbarh810m-xwifi	motherboard asrock h810m-x wifi, chipset intel h810, lga 1851, 1xvga, 1xhdmi, 1xdp, m	\N	93.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.853172	2026-04-15 17:02:11.853172
501	2	24	\N	mb ci9 s1700 ddr5	mbarh610hdvm2d5	ASRock H610M-HDV/M.2+ D5	Placa base extremadamente básica. Utiliza componentes estándar, VRM sin disipación activa (o muy mínima), y conectividad limitada. Es compatible con procesadores Intel de 12.ª, 13.ª y 14.ª generación, pero su arquitectura está restringida para evitar cargas de trabajo pesadas.	60.00	11	f	\N	\N	\N	\N	2026-04-15 17:02:11.851798	2026-04-16 18:11:44.036342
507	2	17	\N	mb socket am5 amd gaming	mbasb650maywwf	ASUS B650M-AYW WiFi	Placa base compacta de nivel básico. Incluye conectividad inalámbrica (WiFi 6) y LAN de 2.5 Gb, características vitales en 2026. Su diseño de VRM es modesto, enfocado en procesadores de consumo eficiente, y prescinde de extras estéticos para reducir el costo al usuario final, manteniendo la calidad de construcción característica de ASUS.	113.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.863283	2026-04-16 18:24:46.240975
508	2	17	\N	mb cu9 s1851 ddr5 gaming	mbasb860maywgwf	ASUS B860M-AYW Gaming WiFi	Placa base equilibrada con diseño robusto para procesadores Intel Core Ultra. Cuenta con disipación mejorada en las zonas críticas de energía (VRM), soporte para memoria DDR5 de alta frecuencia, conectividad WiFi 6E/7 y un conjunto de E/S versátil. Es una opción fiable para estaciones de desarrollo que requieren estabilidad bajo cargas de trabajo prolongadas.	128.28	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.864711	2026-04-16 18:26:03.71924
510	2	17	\N	mb socket am4 amd gaming	mbasb550m-kargb	ASUS Prime B550M-K ARGB	Placa de gama de entrada/media para la plataforma AM4. Soporta procesadores Ryzen 3000, 4000 y 5000. Incluye soporte para iluminación ARGB, es una plataforma madura con excelente soporte de controladores y compatibilidad. Sus componentes son básicos, sin disipadores complejos en VRM, orientada a equipos de costo-efectivo.	71.26	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.867739	2026-04-16 18:28:41.366288
513	2	17	\N	mb ci9 s1700 ddr5	mbasb760aax6ii	ASUS Prime B760M-A AX6 II	Placa de gama media con excelente equilibrio. Incluye disipación VRM robusta, soporte para DDR5 de alta velocidad y conectividad Wi-Fi 6 integrada. Es una plataforma madura y estable, ideal para entornos de oficina, desarrollo administrativo y automatización de procesos donde la fiabilidad es la prioridad.	127.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.872203	2026-04-16 18:32:49.938604
516	2	17	\N	mb ci9 s1700 ddr5	mbasb760m-k	ASUS Prime B760M-K	Placa de gama básica con arquitectura enfocada en la compatibilidad con memorias DDR5 modernas. Carece de disipadores en las fases de poder (VRM), por lo que está diseñada para procesadores Intel de consumo eficiente (series 12.ª, 13.ª y 14.ª). Es una opción pragmática para entornos de oficina donde se requiere tecnología de memoria reciente sin un costo elevado.	89.00	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.8783	2026-04-16 18:42:29.505507
518	2	17	\N	mb ci9 s1700 ddr5	mbash610m-kd5	ASUS Prime H610M-K	Es la placa base más simplificada del ecosistema Intel. Carece de disipadores en las fases de poder (VRM), tiene opciones limitadas de conectividad y está restringida a memorias DDR4. Su diseño es funcional y compacto, pensado para procesadores Intel de 12.ª, 13.ª y 14.ª generación con consumo base (65W).	63.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.882055	2026-04-16 18:44:32.336915
521	2	17	\N	mb cu9 s1851 ddr5	mbasz890-pwifi	ASUS Prime Z890-P WIFI	Plataforma de alto rendimiento con diseño sobrio y profesional. Incluye un sistema de entrega de energía (VRM) de alta eficiencia con disipadores masivos, soporte para memorias DDR5 de alta frecuencia y tecnología de E/S de última generación. Es una base robusta para estaciones de trabajo, virtualización y análisis de datos.	236.00	20	f	\N	\N	\N	\N	2026-04-15 17:02:11.887219	2026-04-16 18:50:57.772899
525	2	17	\N	mb socket am5 amd gaming	mbasb650eegmgwf	ASUS ROG STRIX B650E-E GAMING WIFI	Placa base de alto rendimiento diseñada para la plataforma AM5. Destaca por su arquitectura PCIe 5.0 completa para tarjetas gráficas y almacenamiento SSD NVMe de última generación. Incorpora un sistema de alimentación de 16+2 fases, conectividad Wi-Fi 6E, LAN 2.5 Gb y múltiples puertos USB 3.2 Gen 2x2. Su diseño térmico avanzado con disipadores de gran tamaño asegura un rendimiento estable incluso bajo cargas de trabajo extremas.	303.50	6	f	\N	\N	\N	\N	2026-04-15 17:02:11.894765	2026-04-18 09:29:30.482516
527	2	17	\N	mb socket am5 amd gaming	mbasb850-egmgwf	ASUS ROG STRIX B850-E GAMING WIFI	Placa base de categoría entusiasta para la plataforma AM5, diseñada para maximizar el ancho de banda con soporte nativo PCIe 5.0 en gráficos y almacenamiento. Incorpora un sistema de alimentación de 18+2+2 fases para un overclocking estable, conectividad de última generación con Wi-Fi 7, LAN 2.5 Gb y puertos USB4 (40Gbps). Su diseño incluye disipadores térmicos de gran tamaño y el ecosistema ROG para un control preciso de la temperatura y el rendimiento	352.23	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.897853	2026-04-18 09:36:09.894899
530	2	17	\N	mb socket am5 amd gaming	mbasx870-agmgfw	ASUS ROG STRIX X870-A GAMING WIFI	Placa base de alto rendimiento optimizada para la arquitectura Zen 5 de AMD. Destaca por su conectividad de vanguardia que incluye dos puertos USB4 (40Gbps), Wi-Fi 7 y LAN 2.5 Gb. Incorpora un sistema de alimentación de 16+2+2 fases y disipadores térmicos de gran tamaño con acabados en blanco/plata. Ofrece soporte nativo para PCIe 5.0 tanto en almacenamiento como en gráficos, garantizando la máxima compatibilidad con componentes de próxima generación	300.41	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.902951	2026-04-18 09:41:04.982492
533	2	17	\N	mb cu9 s1851 ddr5 gaming	mbasz890-fgmg-b	ASUS ROG STRIX Z890-F GAMING WIFI	Placa base ATX de gama alta diseñada para maximizar el potencial de los procesadores Intel Core Ultra (Serie 2). Incorpora un sistema de alimentación de 16+1+2+2 fases, soporte para memoria DDR5 de alta velocidad y conectividad inalámbrica Wi-Fi 7. Cuenta con puertos Thunderbolt 4 (USB4), Intel 2.5 Gb Ethernet y ranuras M.2 con disipadores térmicos integrados. Es la plataforma ideal para usuarios que buscan el máximo rendimiento del chipset Z890 con una estética sobria y agresiva.	381.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.907492	2026-04-18 09:46:23.594965
537	2	17	\N	mb socket am5 amd gaming	mbasb650m-pwifi	ASUS TUF GAMING B650M-PLUS WIFI	Placa base Micro-ATX de alto rendimiento diseñada sobre la plataforma AM5. Combina la durabilidad de grado militar con una entrega de energía de 12+2 fases, optimizada para los procesadores Ryzen más recientes. Cuenta con conectividad Wi-Fi 6, Ethernet de 2.5 Gb y soporte para almacenamiento M.2 PCIe 5.0. Incluye un ecosistema de refrigeración avanzado con disipadores de VRM ampliados y tecnología de cancelación de ruido con IA para una experiencia profesional completa.	177.50	5	f	\N	\N	\N	\N	2026-04-15 17:02:11.915124	2026-04-18 09:52:31.454375
558	2	25	\N	mb socket am4 amd gaming	mbgbb550maoelax	motherboard gigabyte b550m aorus elite ax, chipset amd b550, socket am4, matx	\N	87.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.950673	2026-04-15 17:02:11.950673
563	2	25	\N	mb socket am5 amd gaming	mbgbb650aoraxv2	motherboard gigabyte b650 aorus elite ax v2, chipset amd b650, socket amd am5, atx[@@	\N	182.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.960114	2026-04-15 17:02:11.960114
564	2	25	\N	mb socket am5 amd gaming	mbgbb650eagleax	motherboard gigabyte b650 eagle ax, chipset amd b650, socket amd am5, atx	\N	142.00	10	f	\N	\N	\N	\N	2026-04-15 17:02:11.961752	2026-04-15 17:02:11.961752
565	2	25	\N	mb socket am5 amd gaming	mbgbb650gmxaxv2	motherboard gigabyte b650 gaming x ax v2, chipsetamd b650, socket amd am5, atx	\N	150.25	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.963793	2026-04-15 17:02:11.963793
566	2	25	\N	mb socket am5 amd gaming	mbgbb650maelaxi	motherboard gigabyte b650m aorus elite ax ice, chipset amd b650, socket amd am5, matx	\N	168.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:11.965456	2026-04-15 17:02:11.965456
567	2	25	\N	mb socket am5 amd	mbgbb650md3hpax	motherboard gigabyte b650m d3hp ax, chipset amd b650, socket amd am5, matx	\N	108.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.966981	2026-04-15 17:02:11.966981
568	2	25	\N	mb socket am5 amd	mbgbb650md3hp	motherboard gigabyte b650m d3hp, chipset amd b650, socket amd am5, matx	\N	95.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.968703	2026-04-15 17:02:11.968703
569	2	25	\N	mb socket am5 amd	mbgbb650mds3hg1	motherboard gigabyte b650m ds3h, chipset amd b650, socket amd am5, matx	\N	179.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.970265	2026-04-15 17:02:11.970265
570	2	25	\N	mb socket am5 amd gaming	mbgbb650mgmgpwf	motherboard gigabyte b650m gaming plus wifi, chipset amd b650, socket amd am5, matx[@	\N	127.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.971521	2026-04-15 17:02:11.971521
571	2	25	\N	mb socket am5 amd	mbgbb650mk	motherboard gigabyte b650m k, am5, ddr5, hdmi, dp, hd audio.	\N	104.00	18	f	\N	\N	\N	\N	2026-04-15 17:02:11.973003	2026-04-15 17:02:11.973003
572	2	25	\N	mb ci9 s1700 ddr5	mbgbb760ds3h	motherboard gigabyte b760 ds3h, chipset intel b760, lga1700, atx	\N	115.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:11.974817	2026-04-15 17:02:11.974817
573	2	25	\N	mb ci9 s1700 ddr4	mbgbb760md3hpd4	motherboard gigabyte b760m d3hp ddr4, chipset intel b760, lga1700, matx	\N	83.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.976643	2026-04-15 17:02:11.976643
574	2	25	\N	mb ci9 s1700 ddr5	mbgbb760md3hpd5	motherboard gigabyte b760m d3hp, chipset intel b760, lga1700, micro atx	\N	89.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.978033	2026-04-15 17:02:11.978033
575	2	25	\N	mb ci9 s1700 ddr4	mbgbb760mds3hax	motherboard gigabyte b760m ds3h ax ddr4 (rev. 1.0), chipset intel b760, lga1700, matx	\N	113.25	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.979529	2026-04-15 17:02:11.979529
576	2	25	\N	mb ci9 s1700 ddr5	mbgbb760mds3hg5	motherboard gigabyte b760m ds3h gen5, chipset intel b760, lga1700, matx	\N	110.00	11	f	\N	\N	\N	\N	2026-04-15 17:02:11.981026	2026-04-15 17:02:11.981026
577	2	25	\N	mb ci9 s1700 ddr5	mbgbb760med5	motherboard gigabyte b760m e (rev. 1.0) chipset intel b760, lga1700, micro atx	\N	83.60	0	f	\N	\N	\N	\N	2026-04-15 17:02:11.98252	2026-04-15 17:02:11.98252
578	2	25	\N	mb ci9 s1700 ddr4 gaming	mbgbb760mgpd4	motherboard gigabyte b760m gaming plus wifi ddr4,chipset intel b760, lga1700, matx[@@	\N	94.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.984502	2026-04-15 17:02:11.984502
579	2	25	\N	mb ci9 s1700 ddr4	mbgbb760mhd4	motherboard gigabyte b760m h ddr4, chipset intel b760, lga1700, matx	\N	74.00	9	f	\N	\N	\N	\N	2026-04-15 17:02:11.985794	2026-04-15 17:02:11.985794
580	2	25	\N	mb socket am5 amd gaming	mbgbb840maewf6e	motherboard gigabyte b840m aorus elite wifi6e, chipset amd b840, socket amd am5, micr	\N	147.10	16	f	\N	\N	\N	\N	2026-04-15 17:02:11.987622	2026-04-15 17:02:11.987622
581	2	25	\N	mb socket am5 amd	mbgbb840mds3h	motherboard gigabyte b840m ds3h, chipset amd b840, socket amd am5, matx	\N	106.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.989329	2026-04-15 17:02:11.989329
582	2	25	\N	mb socket am5 amd	mbgbb840mh	motherboard gigabyte b840m h, chipset amd b840, socket amd am5, matx	\N	74.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.991329	2026-04-15 17:02:11.991329
540	2	17	\N	mb socket am5 amd gaming	mbasb850pluswf	ASUS TUF GAMING B850-PLUS WIFI	Placa base ATX diseñada para ofrecer una base ultra resistente en la arquitectura AM5. Incorpora componentes de grado militar, una solución de alimentación mejorada y refrigeración integral para maximizar el desempeño de los procesadores AMD Ryzen de última generación. Destaca por su conectividad de vanguardia con Wi-Fi 7, soporte nativo para USB4 y ranuras para almacenamiento PCIe 5.0. Es la plataforma ideal para usuarios que buscan estabilidad absoluta en entornos de carga constante y tecnologías de red de alta velocidad.	218.10	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.920178	2026-04-18 10:05:02.508759
544	2	17	\N	mb cu9 s1851 ddr5 gaming	mbasz890plwifi	ASUS TUF GAMING Z890-PLUS WIFI	Placa base ATX de gama entusiasta diseñada para la arquitectura Intel Core Ultra. Construida con componentes de grado militar y un sistema de alimentación de 14+1+2+2 fases, ofrece una estabilidad superior para tareas de computación intensiva. Incorpora conectividad de última generación con Wi-Fi 7, LAN de 2.5 Gb y puertos Thunderbolt 4 (USB4). Incluye salidas de video HDMI 2.1 y DisplayPort 1.4, además de un avanzado ecosistema térmico con disipadores de gran tamaño para todas las unidades M.2 y el VRM	299.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.927312	2026-04-18 10:11:51.259698
555	2	25	\N	mb socket am4 amd gaming	mbgbb550aoelax2	GIGABYTE B550 AORUS ELITE AX V2 (rev. 1.0)	Placa base ATX de la línea premium AORUS, diseñada con una solución de alimentación digital de 12+2 fases para maximizar el potencial de los procesadores Ryzen. Incorpora conectividad Wi-Fi 6 y Bluetooth 5, además de una LAN de 2.5 Gb para transferencias de datos ultrarrápidas. Destaca por su avanzado diseño térmico con disipadores de superficie ampliada y protección M.2 Thermal Guard. Incluye audio de alta fidelidad con condensadores WIMA y la tecnología Q-Flash Plus para actualizaciones de BIOS simplificadas.	140.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.944691	2026-04-18 10:17:43.519473
560	2	25	\N	mb socket am4 amd gaming	mbgbb550mgmxwf6	GIGABYTE B550M GAMING X WIFI (rev. 1.x)	Placa base Micro-ATX diseñada con un enfoque en el rendimiento térmico y la estabilidad. Cuenta con un diseño de VRM digital de 10+3 fases con disipadores de calor MOSFET de cobertura amplia para asegurar la durabilidad de los procesadores Ryzen de alto desempeño. Incorpora conectividad de vanguardia con Wi-Fi 6 (802.11ax) y Bluetooth integrados, además de soporte para almacenamiento NVMe PCIe 4.0. Incluye tecnologías exclusivas como RGB Fusion 2.0 y el sistema Q-Flash Plus para actualizaciones de BIOS simplificadas, siendo ideal para equipos potentes que requieren una huella de espacio reducida.	95.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.954798	2026-04-18 10:50:08.718396
549	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbb860meapwf6	GIGABYTE B860M EAGLE WIFI	Placa base enfocada en el segmento de entrada-media para Intel Core Ultra. Su diseño "Eagle" prioriza la durabilidad y una gestión térmica más eficiente mediante disipadores de mayor superficie. Incluye Wi-Fi 6E/7 y componentes de alta calidad (Ultra Durable) para garantizar estabilidad en ciclos de trabajo prolongados.	150.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.934683	2026-04-18 11:10:48.24114
583	2	25	\N	mb socket am5 amd gaming	mbgbb850aewf7i	motherboard gigabyte b850 aorus elite wifi7 ice, chipset amd b850, socket amd am5, at	\N	203.00	12	f	\N	\N	\N	\N	2026-04-15 17:02:11.99309	2026-04-15 17:02:11.99309
584	2	25	\N	mb socket am5 amd gaming	mbgbb850aewf7	motherboard gigabyte b850 aorus elite wifi7, chipset amd b850, socket amd am5, atx[@@	\N	190.00	11	f	\N	\N	\N	\N	2026-04-15 17:02:11.994546	2026-04-15 17:02:11.994546
585	2	25	\N	mb socket am5 amd gaming	mbgbb850gmgwf6	motherboard gigabyte b850 gaming wifi6, chipset amd b850, socket amd am5, atx	\N	151.00	15	f	\N	\N	\N	\N	2026-04-15 17:02:11.995599	2026-04-15 17:02:11.995599
586	2	25	\N	mb socket am5 amd gaming	mbgbb850maew6ei	motherboard gigabyte b850m aorus elite wifi6e ice, chipset amd b850, socket amd am5,	\N	179.00	10	f	\N	\N	\N	\N	2026-04-15 17:02:11.996739	2026-04-15 17:02:11.996739
587	2	25	\N	mb socket am5 amd gaming	mbgbb850maewf7p	motherboard gigabyte b850m aorus elite wifi7 ice-p, chipset amd b850, socket amd am5,	\N	184.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.997917	2026-04-15 17:02:11.997917
588	2	25	\N	mb socket am5 amd gaming	mbgbb850md3hp	motherboard gigabyte b850m d3hp, chipset amd b850, socket amd am5, matx	\N	118.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.000597	2026-04-15 17:02:12.000597
589	2	25	\N	mb socket am5 amd gaming	mbgbb850mewf6ei	motherboard gigabyte b850m eagle wifi6e ice, chipset amd b850, socket amd am5, atx[@@	\N	147.50	16	f	\N	\N	\N	\N	2026-04-15 17:02:12.002277	2026-04-15 17:02:12.002277
590	2	25	\N	mb socket am5 amd gaming	mbgbb850meawf6e	motherboard gigabyte b850m eagle wifi6e, chipset amd b850, socket amd am5, matx	\N	145.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.003641	2026-04-15 17:02:12.003641
591	2	25	\N	mb ci9 s1700 ddr5 gaming	mbgbb860maewf6e	motherboard gigabyte b860m aorus elite wifi6e, chipset intel b860, lga1851, hdmi, dp,	\N	177.50	8	f	\N	\N	\N	\N	2026-04-15 17:02:12.005015	2026-04-15 17:02:12.005015
592	2	25	\N	mb cu9 s1851 ddr5	mbgbb860md3hp	motherboard gigabyte b860m d3hp, chipset intel b860, lga 1851, hdmi, dp, matx	\N	102.50	16	f	\N	\N	\N	\N	2026-04-15 17:02:12.006479	2026-04-15 17:02:12.006479
593	2	25	\N	mb cu9 s1851 ddr5	mbgbb860ds3h	motherboard gigabyte b860m ds3h, chipset intel b860, lga 1851, 1 x hdmi, 2 x dp, matx	\N	118.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.008767	2026-04-15 17:02:12.008767
594	2	25	\N	mb cu9 s1851 ddr5	mbgbb860me	motherboard gigabyte b860m e, chipset intel b860,lga 1851, hdmi, dp, matx	\N	96.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.012318	2026-04-15 17:02:12.012318
595	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbb860meawf6v	motherboard gigabyte b860m eagle wifi6 v2, chipset intel b860, lga 1851, hdmi, dp, ma	\N	125.25	10	f	\N	\N	\N	\N	2026-04-15 17:02:12.015025	2026-04-15 17:02:12.015025
596	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbb860mgmgwf6	motherboard gigabyte b860m gaming wifi6, chipset intel b860, lga 1851, hdmi, dp, matx	\N	130.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.016211	2026-04-15 17:02:12.016211
597	2	25	\N	mb cu9 s1851 ddr5	mbgbb860mk	motherboard gigabyte b860m k, chipset intel b860,lga 1851, hdmi, matx	\N	93.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.017578	2026-04-15 17:02:12.017578
598	2	25	\N	mb ci9 s1700 ddr4	mbgbh610mkd4	motherboard gigabyte h610m k ddr4 (rev. 1.0) chipset intel h610, lga1700, micro atx[@	\N	56.75	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.018911	2026-04-15 17:02:12.018911
599	2	25	\N	mb ci9 s1700 ddr5	mbgbh610mkv2d5	motherboard gigabyte h610m k v2, chipset intel h610, lga1700, micro atx	\N	59.55	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.020118	2026-04-15 17:02:12.020118
600	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbh810mgmgwf6	motherboard gigabyte h810m gaming wifi6, chipset intel h810, lga 1851, micro-atx	\N	100.60	6	f	\N	\N	\N	\N	2026-04-15 17:02:12.02148	2026-04-15 17:02:12.02148
601	2	25	\N	mb cu9 s1851 ddr5	mbgbh810mk	motherboard gigabyte h810m k, chipset intel h810,lga 1851, micro-atx	\N	77.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.022816	2026-04-15 17:02:12.022816
602	2	25	\N	mb socket am5 amd gaming	mbgbx870aelwf7i	motherboard gigabyte x870 aorus elite wifi7 ice, chipset amd x870, socket amd am5, at	\N	246.75	4	f	\N	\N	\N	\N	2026-04-15 17:02:12.024336	2026-04-15 17:02:12.024336
603	2	25	\N	mb socket am5 amd gaming	mbgbx870aeltwf7	motherboard gigabyte x870 aorus elite wifi7, chipset amd x870, socket amd am5, atx[@@	\N	250.00	7	f	\N	\N	\N	\N	2026-04-15 17:02:12.026403	2026-04-15 17:02:12.026403
604	2	25	\N	mb socket am5 amd gaming	mbgbx870eagwf7	motherboard gigabyte x870 eagle wifi7, chipset amd x870, socket amd am5, atx	\N	203.00	15	f	\N	\N	\N	\N	2026-04-15 17:02:12.027779	2026-04-15 17:02:12.027779
605	2	25	\N	mb socket am5 amd gaming	mbgbx870gmgxwf7	motherboard gigabyte x870 gaming x wifi7, chipsetamd x870, socket amd am5, atx	\N	214.80	2	f	\N	\N	\N	\N	2026-04-15 17:02:12.029127	2026-04-15 17:02:12.029127
606	2	25	\N	mb socket am5 amd gaming	mbgbx870eaewf7w	motherboard gigabyte x870e aorus elite wifi7, chipset amd x870e, socket amd am5, atx[	\N	282.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:12.030697	2026-04-15 17:02:12.030697
607	2	25	\N	mb socket am5 amd gaming	mbgbx870eaeltxi	motherboard gigabyte x870e aorus elite x3d ice, chipset amd x870e, socket amd am5, at	\N	327.50	1	f	\N	\N	\N	\N	2026-04-15 17:02:12.03203	2026-04-15 17:02:12.03203
608	2	25	\N	mb socket am5 amd gaming	mbgbx870eaopri	motherboard gigabyte x870e aorus pro ice, chipsetamd x870e, socket amd am5, atx	\N	328.00	3	f	\N	\N	\N	\N	2026-04-15 17:02:12.03319	2026-04-15 17:02:12.03319
609	2	25	\N	mb socket am5 amd gaming	mbgbx870maewf7i	motherboard gigabyte x870m aorus elite wifi7 ice,chipset amd x870, socket amd am5, m-	\N	211.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:12.034371	2026-04-15 17:02:12.034371
610	2	25	\N	mb socket am5 amd gaming	mbgbx870maelwf7	motherboard gigabyte x870m aorus elite wifi7, chipset amd x870, socket amd am5, matx[	\N	208.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.035408	2026-04-15 17:02:12.035408
611	2	25	\N	mb ci9 s1700 ddr5 gaming	mbgbz790aoeltax	motherboard gigabyte z790 aorus elite ax (rev. 1.0), chipset intel z790, lga1700, atx	\N	242.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.03655	2026-04-15 17:02:12.03655
612	2	25	\N	mb ci9 s1700 ddr5 gaming	mbgbz790eagleax	motherboard gigabyte z790 eagle ax (rev. 1.0), chipset intel z790, lga1700, atx	\N	170.00	8	f	\N	\N	\N	\N	2026-04-15 17:02:12.03775	2026-04-15 17:02:12.03775
613	2	25	\N	mb ci9 s1700 ddr5 gaming	mbgbz790maelaxi	motherboard gigabyte z790m aorus elite ax ice, chipset intel z790, lga1700, matx	\N	209.50	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.039529	2026-04-15 17:02:12.039529
614	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbz890aerog	motherboard gigabyte z890 aero g, chipset intel z890, lga 1851, hdmi, atx	\N	294.00	8	f	\N	\N	\N	\N	2026-04-15 17:02:12.041444	2026-04-15 17:02:12.041444
615	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbz890aelwf7	motherboard gigabyte z890 aorus elite wifi7, chipset intel z890, lga 1851, atx	\N	259.00	14	f	\N	\N	\N	\N	2026-04-15 17:02:12.043379	2026-04-15 17:02:12.043379
616	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbz890aormstr	motherboard gigabyte z890 aorus master, chipset intel z890, lga 1851, atx	\N	479.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:12.045239	2026-04-15 17:02:12.045239
617	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbz890aproice	motherboard gigabyte z890 aorus pro ice, chipset intel z890, lga 1851, matx	\N	338.00	6	f	\N	\N	\N	\N	2026-04-15 17:02:12.047133	2026-04-15 17:02:12.047133
618	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbz890eagwf7	motherboard gigabyte z890 eagle wifi7, chipset intel z890, lga 1851, dp, atx	\N	219.00	10	f	\N	\N	\N	\N	2026-04-15 17:02:12.048694	2026-04-15 17:02:12.048694
619	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbz890gmgxwf7	motherboard gigabyte z890 gaming x wifi7, chipsetintel z890, lga 1851, dp, atx	\N	202.00	14	f	\N	\N	\N	\N	2026-04-15 17:02:12.050211	2026-04-15 17:02:12.050211
620	2	25	\N	mb cu9 s1851 ddr5	mbgbz890udwf6e	motherboard gigabyte z890 ud wifi6e, chipset intel z890, lga 1851, dp, atx	\N	220.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.051716	2026-04-15 17:02:12.051716
621	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbz890maewf7	motherboard gigabyte z890m aorus elite wifi7, chipset intel z890, lga 1851, matx	\N	225.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:12.05342	2026-04-15 17:02:12.05342
622	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbz890maewf7i	motherboard gigabytez890m aorus elite wifi7 ice, chipset intel z890, lga 1851, matx[@	\N	223.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:12.055122	2026-04-15 17:02:12.055122
623	2	19	\N	mb socket am4 amd	mbmsb550mprvdwf	motherboard msi b550m pro-vdh wifi, amd b550, am4socket, vga, hdmi, dp, usb 3.2 gen1[	\N	81.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.056587	2026-04-15 17:02:12.056587
624	2	19	\N	mb socket am4 amd	mbmsb550mprovdh	motherboard msi b550m pro-vdh, amd b550, am4 socket, vga, hdmi, dp	\N	72.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.058843	2026-04-15 17:02:12.058843
625	2	19	\N	mb socket am4 amd	mbmsb550m-apro	motherboard msi b550m-a pro, amd b550, am4, ddr4,hdmi, dvi-d, lan, usb 3.2 gen1, m-at	\N	64.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.061477	2026-04-15 17:02:12.061477
626	2	19	\N	mb socket am5 amd gaming	mbmsb650gmgplwf	motherboard msi b650 gaming plus wifi, chipset amd b650, socket amd am5, atx	\N	171.00	9	f	\N	\N	\N	\N	2026-04-15 17:02:12.063453	2026-04-15 17:02:12.063453
627	2	19	\N	mb ci9 s1700 ddr5 gaming	mbmsb760mgmgpwf	motherboard msi b760m gaming plus wifi, chipset intel b760, lga1700, hdmi, dp, matx[@	\N	134.50	6	f	\N	\N	\N	\N	2026-04-15 17:02:12.065035	2026-04-15 17:02:12.065035
628	2	19	\N	mb socket am5 amd gaming	mbmsb840mgmwf6e	motherboard msi b840m gaming wifi6e, chipset amd b840, socket amd am5, matx	\N	108.50	19	f	\N	\N	\N	\N	2026-04-15 17:02:12.066328	2026-04-15 17:02:12.066328
629	2	19	\N	mb socket am5 amd gaming	mbmsb850gmgplwf	motherboard msi b850 gaming plus wifi, chipset amd b850, socket amd am5, atx	\N	189.50	14	f	\N	\N	\N	\N	2026-04-15 17:02:12.067607	2026-04-15 17:02:12.067607
630	2	19	\N	mb cu9 s1851 ddr5 gaming	mbmsb860gmgpwf	motherboard msi b860 gaming plus wifi, chipset intel b860, lga 1851, hdmi, dp, atx[@@	\N	180.00	13	f	\N	\N	\N	\N	2026-04-15 17:02:12.069104	2026-04-15 17:02:12.069104
631	2	19	\N	mb socket am5 amd gaming	mbmsx870ethkwf	motherboard msi mag x870e tomahawk wifi, chipset amd x870e, socket amd am5, atx	\N	290.00	6	f	\N	\N	\N	\N	2026-04-15 17:02:12.070993	2026-04-15 17:02:12.070993
632	2	19	\N	mb socket am5 amd gaming	mbmsb650iedgewf	motherboard msi mpg b650i edge wifi, chipset amd b650, socket amd am5, mini-itx	\N	237.50	11	f	\N	\N	\N	\N	2026-04-15 17:02:12.072448	2026-04-15 17:02:12.072448
633	2	19	\N	mb socket am5 amd gaming	mbmsx870ecarbwf	motherboard msi mpg x870e carbon wifi, chipset amd x870e, socket amd am5, atx	\N	432.00	6	f	\N	\N	\N	\N	2026-04-15 17:02:12.074284	2026-04-15 17:02:12.074284
634	2	19	\N	mb socket am5 amd	mbmsb650m-p	motherboard msi pro b650m-p, chipset amd b650, socket amd am5, matx	\N	102.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:12.076208	2026-04-15 17:02:12.076208
635	2	19	\N	mb ci9 s1700 ddr5	mbmsb760m-awifi	motherboard msi pro b760m-a wifi, chipset intel b760, lga1700, hdmi x2, dp x2, matx[@	\N	101.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.078009	2026-04-15 17:02:12.078009
636	2	19	\N	mb ci9 s1700 ddr5	mbmsb760m-e	motherboard msi pro b760m-e, chipset intel b760, lga1700, hdmi, vga, matx	\N	86.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.079528	2026-04-15 17:02:12.079528
637	2	19	\N	mb ci9 s1700 ddr5	mbmsb760m-g	motherboard msi pro b760m-g, chipset intel b760, lga1700, hdmi, dp, vga, matx	\N	75.65	3	f	\N	\N	\N	\N	2026-04-15 17:02:12.08116	2026-04-15 17:02:12.08116
638	2	19	\N	mb ci9 s1700 ddr4	mbmsb760m-pddr4	motherboard msi pro b760m-p ddr4, chipset intel b760, lga1700, hdmi, dp, vga, matx.[@	\N	76.55	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.082672	2026-04-15 17:02:12.082672
639	2	19	\N	mb ci9 s1700 ddr5	mbmsb760m-pddr5	motherboard msi pro b760m-p, chipset intel b760, lga1700, hdmi, dp, vga, matx	\N	90.50	4	f	\N	\N	\N	\N	2026-04-15 17:02:12.083893	2026-04-15 17:02:12.083893
645	2	19	\N	mb ci9 s1700 ddr4	mbmsb760m-ed4	motherboard msi pro pro b760m-e ddr4, chipset intel b760, lga1700, hdmi, vga, matx.[@	\N	73.85	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.093831	2026-04-15 17:02:12.093831
655	1	28	\N	cpu amd ryzen 5 sam5 7xxx	cpam5r57600x	AMD Ryzen 5 7600X	Versión desbloqueada de alto rendimiento fabricada en 5nm. A diferencia del 7600 estándar, el "X" opera con un TDP más elevado, permitiendo mayores frecuencias sostenidas de fábrica. Está diseñado para usuarios que buscan maximizar la tasa de cuadros en juegos y el desempeño en aplicaciones de productividad, aprovechando al máximo la plataforma AM5, DDR5 y PCIe 5.0.	207.75	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.112776	2026-04-16 16:39:02.539301
658	1	28	\N	cpu amd ryzen 5 sam5 9xxx	cpam5r59600x	AMD Ryzen 5 9600X	Basado en el nodo de 4nm de TSMC, este procesador representa un salto generacional enfocado en la eficiencia energética y el rendimiento por ciclo (IPC). A pesar de tener un TDP base menor que su predecesor (el 7600X), ofrece una potencia superior en gaming y tareas mononúcleo. Mantiene el soporte nativo para PCIe 5.0, memorias DDR5 y añade mejoras significativas en instrucciones AVX-512 para inteligencia artificial.	215.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.117783	2026-04-16 16:43:01.314528
661	1	28	\N	cpu amd ryzen 7 sam4 5xxx	cpam4r75700x	AMD Ryzen 7 5700X	Procesador de 8 núcleos diseñado bajo una arquitectura multi-chip (chiplet). A diferencia de las APUs (como el 5700G), este modelo incluye 32 MB de caché L3, lo que aumenta drásticamente el rendimiento en juegos y aplicaciones sensibles a la latencia de memoria. Es compatible con PCIe 4.0, permitiendo aprovechar al máximo tarjetas gráficas y unidades SSD NVMe de última generación.	190.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.123928	2026-04-16 16:45:41.468469
663	1	28	\N	cpu amd ryzen 7 sam5 7xxx	cpam5r77700x	AMD Ryzen 7 7700X	Basado en el nodo de 5nm de TSMC, este procesador equilibra el rendimiento de alto nivel en productividad y gaming. Incorpora un diseño de chiplet con un I/O Die de 6nm que añade soporte para DDR5 y PCIe 5.0. Ofrece un rendimiento multihilo contundente gracias a su frecuencia turbo elevada, siendo una opción muy equilibrada para tareas pesadas como compilación de software, virtualización y edición.	300.50	19	f	\N	\N	\N	\N	2026-04-15 17:02:12.12805	2026-04-16 16:47:36.774555
649	2	19	\N	mb socket am5 amd gaming	mbmsx670egmplwf	MSI X670E Gaming Plus WiFi	Plataforma de alto rendimiento con un diseño de VRM muy robusto (disipadores masivos) para soportar procesadores Ryzen 7000/8000/9000 bajo carga intensiva. Ofrece un ancho de banda masivo para almacenamiento y tarjetas de expansión, con un enfoque en durabilidad a largo plazo.	221.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:12.099252	2026-04-16 18:48:39.86701
646	2	19	\N	mb socket am5 amd gaming	mbmsx870-pwifi	MSI PRO X870-P WIFI	Placa base de la serie profesional diseñada para maximizar la productividad con procesadores AMD Ryzen. Incluye soporte nativo para USB4 (40Gbps), conectividad inalámbrica Wi-Fi 7 y LAN 5G. Su diseño térmico extendido y el sistema de alimentación Duet Rail de 14+2+1 fases aseguran un rendimiento estable bajo cargas de trabajo pesadas, siendo una plataforma eficiente y preparada para el futuro del almacenamiento PCIe 5.0.	229.00	10	f	\N	\N	\N	\N	2026-04-15 17:02:12.095075	2026-04-18 09:23:45.044935
642	2	19	\N	mb ci9 s1700 ddr4	mbmsh610m-addr4	MSI PRO H610M-A DDR4	Placa base Micro-ATX de la serie profesional diseñada para ofrecer estabilidad y eficiencia en entornos de trabajo. Soporta procesadores Intel Core de hasta 14.ª generación y memoria DDR4 de hasta 3200 MHz. Destaca por incluir múltiples salidas de video (HDMI, DisplayPort y VGA), lo que facilita la implementación de estaciones multimonitor sin necesidad de una tarjeta gráfica dedicada. Cuenta con tecnología Steel Armor para proteger la ranura PCIe y un diseño térmico optimizado para un funcionamiento continuo.	59.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.088591	2026-04-18 09:48:34.936413
675	1	32	\N	cpu ci5 14xxx s1700	cpili514400ft	proc int cor i5-14400f 2.50 oe	\N	168.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.145563	2026-04-15 17:02:12.145563
676	1	32	\N	cpu ci3 12xxx s1700	cpili312100	procesador intel core i3-12100 3.3 / 4.3ghz 12mb intel smart caché, lga1700, intel 7(	\N	192.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.146766	2026-04-15 17:02:12.146766
679	1	32	\N	cpu ci7 12xxx s1700	cpili712700	procesador intel core i7-12700 2.10/4.90ghz, 25mbsmartcaché, lga1700, 65w, intel 7(10	\N	408.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.151456	2026-04-15 17:02:12.151456
697	1	33	\N	cpu ci5 14xxx s1700	cpiti514400t	procesador intel core i5-14400 2.50/4.70ghz, 20 mb intel smart caché, lga1700, 65w/14	\N	217.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.18243	2026-04-15 17:02:12.18243
698	1	33	\N	cpu ci5 14xxx s1700	cpiti514400ft	procesador intel core i5-14400f 2.50/4.70ghz, 20 mb intel smart caché, lga1700, 65w/1	\N	168.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.184251	2026-04-15 17:02:12.184251
699	1	33	\N	cpu ci7 12xxx s1700	cpiti712700t	procesador intel core i7-12700 2.10/4.90ghz, 25mbsmartcaché, lga1700, 65w, intel 7(10	\N	396.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.186194	2026-04-15 17:02:12.186194
700	3	34	\N	mem ddr4 3200 pc4-25600	me16xp320sgambk	memoria adata xpg gammix d20 16gb ddr4-3200mhz pc4-25600, cl16, 1.35v, 288-pines	\N	127.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.188941	2026-04-15 17:02:12.188941
701	3	34	\N	mem ddr4 3200 pc4-25600	me8gxp320sgambk	memoria adata xpg gammix d20 8gb ddr4-3200mhz pc4-25600, cl16, 1.35v, 288-pines	\N	67.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.193628	2026-04-15 17:02:12.193628
702	3	34	\N	mem ddr5 5600 pc5-44800	me8gxp560slabbk	memoria u-dimm adata xpg lancer blade 8gb ddr5-5600mhz pc5-44800, cl46, 1.1v, 288-pin	\N	113.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.195578	2026-04-15 17:02:12.195578
703	3	2	\N	mem ddr5 6000 pc5-48000	me64bwdw100rgbn	memoria udimm biwin black opal dw100 rgb, 64gb (2x32gb) ddr5-6000, pc5-48000, cl30, 1	\N	902.00	9	f	\N	\N	\N	\N	2026-04-15 17:02:12.197346	2026-04-15 17:02:12.197346
677	1	32	\N	cpu ci5 12xxx s1700	cpili512400t	Intel Core i5-12400	2.50&#x2F;4.40ghz 18mbsmartcaché, lga1700, 117w	269.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.1482	2026-04-15 18:11:45.091848
684	1	32	\N	cpu ci9 12xxx s1700	cpili912900kf	Intel Core i9-12900KF	Versión desbloqueada (K) y sin gráficos integrados (F) de la arquitectura Alder Lake. Cuenta con 8 P-cores y 8 E-cores, ofreciendo una base potente para estaciones de trabajo de alto rendimiento que utilizan tarjetas gráficas dedicadas.	389.00	13	f	\N	\N	\N	\N	2026-04-15 17:02:12.158832	2026-04-16 17:14:00.854385
665	1	28	\N	cpu amd ryzen 7 sam5 8xxx	cpam5r78700f	AMD Ryzen 7 8700F	Basado en la arquitectura móvil "Phoenix", este procesador de 4nm ofrece 8 núcleos Zen 4 de alto rendimiento y una caché L3 reducida (16 MB) en comparación con los modelos de la serie 7000 (Raphael). La "F" en el nombre indica que la unidad gráfica integrada ha sido deshabilitada. Es una opción eficiente en consumo, ideal para configuraciones compactas donde la potencia bruta de CPU es necesaria pero se utilizará siempre una GPU discreta.	210.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.131397	2026-04-16 16:49:43.645594
667	1	28	\N	cpu amd ryzen 7 sam5 9xxx	cpam5r79700x	AMD Ryzen 7 9700X	Fabricado en 4nm (núcleos) y 6nm (I/O Die), representa un salto significativo en IPC (instrucciones por ciclo) frente a la serie 7000. Destaca por su eficiencia térmica líder, permitiendo un rendimiento de alto nivel con un consumo base contenido. Soporta nativamente DDR5 y PCIe 5.0, ofreciendo una plataforma robusta para aplicaciones de cálculo pesado, desarrollo, virtualización e IA gracias a sus instrucciones AVX-512 mejoradas.	320.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.134127	2026-04-16 16:51:44.61029
670	1	28	\N	cpu amd ryzen 9 sam5 7xxx	cpam5r97900x	AMD Ryzen 9 7900X	Basado en el nodo de 5nm (CPU) y 6nm (I/O Die), este procesador está diseñado para el segmento entusiasta y profesional. Con 12 núcleos de alto rendimiento, es una bestia en multitarea, compilación, edición de video y renderizado. Incluye soporte para DDR5 y PCIe 5.0, y al igual que otros Zen 4, es compatible con el conjunto de instrucciones AVX-512, lo cual es un plus considerable si tus proyectos de Big Data requieren inferencia de modelos de Machine Learning.	354.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.137901	2026-04-16 16:54:14.73342
673	1	28	\N	cpu amd ryzen 9 sam5 9xxx	cpam5r99950x	AMD Ryzen 9 9950X	Basado en el proceso de 4nm, este procesador es la cima del rendimiento multihilo en el mercado de consumo. Cuenta con 16 núcleos de alto rendimiento y 80 MB de caché total (L2+L3). Diseñado para tareas críticas, ofrece un salto de IPC (Instrucciones por Ciclo) que lo coloca por encima de cualquier otro procesador de 16 núcleos en tareas de compilación, simulación, procesamiento de Big Data e inferencia de modelos de IA.	560.00	12	f	\N	\N	\N	\N	2026-04-15 17:02:12.142245	2026-04-16 16:56:43.17799
678	1	32	\N	cpu ci5 12xxx s1700	cpili512400f	Intel Core i5-12400F	Procesador de 6 núcleos basado en la arquitectura Alder Lake (10nm / "Intel 7"). Al igual que el modelo estándar, cuenta exclusivamente con núcleos de alto rendimiento (P-cores), eliminando los gráficos integrados para ofrecer una opción más económica para sistemas con GPU dedicada.	195.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.149894	2026-04-16 17:02:52.439621
680	1	32	\N	cpu ci7 14xxx s1700	cpili714700f	Intel Core i7-14700F	Procesador de 20 núcleos basado en la arquitectura Raptor Lake Refresh (10nm / "Intel 7"). Utiliza una estructura híbrida con 8 P-cores para alto rendimiento y 12 E-cores para tareas en segundo plano. Es la versión sin gráficos integrados del i7-14700, diseñada para configuraciones con tarjeta gráfica dedicada.	327.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.153125	2026-04-16 17:07:07.230934
682	1	32	\N	cpu ci7 14xxx s1700	cpili714700kf	Intel Core i7-14700KF	Versión desbloqueada (K) y sin gráficos integrados (F) de la arquitectura Raptor Lake Refresh. Diseñado para máximo rendimiento mediante overclocking manual, cuenta con 8 P-cores y 12 E-cores, ideal para estaciones de trabajo y gaming de alta gama que requieren una GPU externa.	350.00	12	f	\N	\N	\N	\N	2026-04-15 17:02:12.155912	2026-04-16 17:09:53.126569
687	1	32	\N	cpu ci9 14xxx s1700	cpili914900k	Intel Core i9-14900K	Versión desbloqueada (K) de la arquitectura Raptor Lake Refresh. Es el buque insignia para entusiastas, combinando 8 núcleos de rendimiento (P-cores) y 16 núcleos de eficiencia (E-cores). Ofrece la mayor frecuencia turbo de fábrica en su segmento para tareas de alto impacto, compilación, renderizado y carga pesada de IA.	505.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.163333	2026-04-16 17:18:26.674789
689	1	32	\N	cpu ci9 14xxx s1700	cpili914900ks	Intel Core i9-14900KS	Edición especial "Binned" (seleccionada) de la arquitectura Raptor Lake Refresh. Es el procesador de consumo más rápido del mundo en frecuencia de reloj de fábrica, diseñado específicamente para entusiastas del extreme overclocking y estaciones de trabajo de máximo desempeño.	706.85	3	f	\N	\N	\N	\N	2026-04-15 17:02:12.166027	2026-04-16 17:20:56.080552
692	1	32	\N	cpu cu9 2xx s1851	cpilu9285	Intel Core Ultra 9 285	El buque insignia de la arquitectura Arrow Lake-S. Utiliza un diseño de tiles/chiplets avanzados. Integra 8 P-cores (Lion Cove) y 16 E-cores (Skymont), eliminando el Hyper-Threading para maximizar la eficiencia y reducir la latencia térmica. Incluye una NPU dedicada de alto rendimiento para IA local.	588.66	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.170944	2026-04-16 17:26:29.719545
704	3	35	\N	mem ddr5 6400 pc5-51200	me32cox5m2b642x	memoria udimm corsair vengeance 32gb (2x16gb) ddr5-6400 pc5-51200, cl36, 1.35v, gris[	\N	366.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.199565	2026-04-15 17:02:12.199565
705	3	35	\N	mem ddr4 3200 pc4-25600	me8gcox4m1e3200	memoria udimm corsair vengeance lpx 8gb (1x8gb) ddr4-3200 pc4-25600, cl16, 1.35v, bla	\N	66.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.201329	2026-04-15 17:02:12.201329
706	3	35	\N	mem ddr5 6000 pc5-48000	me64cvx5m2d600k	memoria udimm corsair vengeance rgb 64gb (2x32gb)ddr5-6000 pc5-48000, cl40, 1.35v, bl	\N	782.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.203157	2026-04-15 17:02:12.203157
707	3	3	\N	mem ddr4 3200 pc4-25600	me16hsarm32und4	memoria hiksemi armor 16gb ddr4-3200mhz pc4-25600, cl18, 1.35v, udimm, negro	\N	110.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.204337	2026-04-15 17:02:12.204337
708	3	3	\N	mem ddr4 3200 pc4-25600	me8ghsarm32und4	memoria hiksemi armor 8gb ddr4-3200mhz pc4-25600,cl18, 1.35v, udimm, negro	\N	65.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.20564	2026-04-15 17:02:12.20564
709	3	3	\N	mem sodimm ddr4 2666	me16hshiks26z1	memoria sodimm hiksemi 16gb ddr4-2666mhz pc4-21300, cl19, 1.2v, 260-pines	\N	80.33	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.20761	2026-04-15 17:02:12.20761
710	3	3	\N	mem sodimm ddr4 3200	me16hshiks32z1	memoria sodimm hiksemi 16gb ddr4-3200mhz pc4-25600, cl22, 1.2v	\N	95.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.209614	2026-04-15 17:02:12.209614
711	3	3	\N	mem sodimm ddr3 1600	me4ghshiks16z1	memoria sodimm hiksemi 4gb ddr3-1600mhz pc3-12800, cl11, 1.35v	\N	10.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.211522	2026-04-15 17:02:12.211522
712	3	3	\N	mem sodimm ddr4 2666	me8ghshiks26z1	memoria sodimm hiksemi 8gb ddr4-2666mhz pc4-21300, cl19, 1.2v	\N	41.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.212763	2026-04-15 17:02:12.212763
713	3	3	\N	mem sodimm ddr4 3200	me8ghshiks32z1	memoria sodimm hiksemi 8gb ddr4-3200mhz pc4-25600, cl22, 1.2v	\N	46.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.214137	2026-04-15 17:02:12.214137
714	3	3	\N	mem ddr5 4800 pc5-38400	me16hsarm48und5	memoria udimm hiksemi future 16gb ddr5-4800mhz pc5-38400, 1.1v, 288-pines	\N	179.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.215277	2026-04-15 17:02:12.215277
715	3	4	\N	mem ddr5 6400 pc5-51200	me32kf564c32rsa	memoria dimm kingston fury 32gb ddr5-6400mt/s pc5-51200, 2rx8, cl32, 1.4v, 288-pin[@@	\N	427.35	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.21642	2026-04-15 17:02:12.21642
716	3	4	\N	mem ddr5 6400 pc5-51200	me16kf564c32bbe	memoria dimm kingston fury beast 16gb ddr5-6400mt/s, pc5-51200, cl32, 1.1v, 288-pin,	\N	211.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.217833	2026-04-15 17:02:12.217833
717	3	4	\N	mem ddr5 6000 pc5-48000	me32kf560c36brg	memoria dimm kingston fury beast 32gb ddr5-6000, pc5-48000 cl36, 2rx8, 1.35v, 288-pin	\N	409.61	7	f	\N	\N	\N	\N	2026-04-15 17:02:12.219188	2026-04-15 17:02:12.219188
718	3	4	\N	mem ddr5 6400 pc5-51200	me16kf564c32brg	memoria dimm kingston fury beast, 16gb ddr5-6400,pc5-51200 cl32, 1rx8, 1.4v, 288-pin,	\N	219.08	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.220677	2026-04-15 17:02:12.220677
719	3	4	\N	mem ddr5 6400 pc5-51200	me32kf564c32rwa	memoria dimm kingston fury renegade, 32gb ddr5-6400, pc5-51200, cl32, 2rx8, 1.4v, 288	\N	427.35	10	f	\N	\N	\N	\N	2026-04-15 17:02:12.221946	2026-04-15 17:02:12.221946
720	3	4	\N	mem ddr5 5600 pc5-44800	me16kcp556us8	memoria kingston 16gb, ddr5-5600 mt/s, pc5-44800,cl46, 1.1v, 288-pin, 1rx8, non-ecc[@	\N	201.06	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.223749	2026-04-15 17:02:12.223749
721	3	4	\N	mem ddr4 3200 pc4-25600	me8gkvr32n22s6	memoria kingston 8gb ddr4-3200 mt/s, pc4-25600, cl22, 1.2v, 288-pin, non-ecc	\N	75.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.225553	2026-04-15 17:02:12.225553
722	3	4	\N	mem ddr5 5600 pc5-44800	me16gkf556c40bb	memoria kingston fury beast 16gb ddr5-5600mt/s, pc5-44800, cl40, 1.25v, 288-pin, dimm	\N	199.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.227411	2026-04-15 17:02:12.227411
723	3	4	\N	mem ddr5 6000 pc5-48000	me16kf560c36bbe	memoria kingston fury beast 16gb ddr5-6000mt/s, pc5-48000, cl36, 1.35v, 288-pin	\N	205.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.228966	2026-04-15 17:02:12.228966
724	3	4	\N	mem ddr5 6000 pc5-48000	me16kf560c36bbr	memoria kingston fury beast 16gb ddr5-6000mt/s, pc5-48000, cl36, 1.35v, 288-pin, rgb[	\N	208.55	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.230329	2026-04-15 17:02:12.230329
725	3	4	\N	mem ddr4 3200 pc4-25600	me32kf432c16bb2	memoria kingston fury beast 32gb ddr4-3200mt/s pc4-25600, cl16, 1.35v, 288-pin, rgb,	\N	284.00	17	f	\N	\N	\N	\N	2026-04-15 17:02:12.231734	2026-04-15 17:02:12.231734
726	3	4	\N	mem ddr5 5600 pc5-44800	me8gkf556c40bf	memoria kingston fury beast 8gb ddr5-5600mt/s, pc5-44800, cl40, 1.25v, 288-pin, non-e	\N	113.42	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.23335	2026-04-15 17:02:12.23335
727	3	4	\N	mem ddr4 3200 pc4-25600	me8gkf432c16bb2	memoria kingston fury beast rgb black 8gb ddr4-3200 mt/s, pc4-25600, cl16, 1.35v, non	\N	83.37	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.234764	2026-04-15 17:02:12.234764
728	3	4	\N	mem ddr4 3200 pc4-25600	me16kf432c16bb2	memoria kingston fury beast rgb black, 16gb ddr4 3200 mt/s, pc4-25600, cl16, 1.35v.[@	\N	146.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.236102	2026-04-15 17:02:12.236102
729	3	4	\N	mem ddr4 3600 pc4-28800	me16kf436c18bb2	memoria kingston fury beast rgb black, 16gb, ddr4-3600mt/s, pc4-28800, cl18, 1.35v,no	\N	144.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.23828	2026-04-15 17:02:12.23828
730	3	4	\N	mem ddr5 5600 pc5-44800	me16kf556c36bwe	memoria kingston fury beast, 16gb ddr5 -5600mt/s,cl36, 1.25 v	\N	200.57	2	f	\N	\N	\N	\N	2026-04-15 17:02:12.239435	2026-04-15 17:02:12.239435
731	3	4	\N	mem ddr4 3200 pc4-25600	me16gkf432c16b1	memoria kingston fury beast, 16gb, ddr4, 3200 mhz, pc4-25600, cl16, 1.35v.	\N	132.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.24108	2026-04-15 17:02:12.24108
732	3	4	\N	mem ddr4 3600 pc4-28800	me8gkf436c17bb8	memoria kingston fury beast, 8gb, ddr4 3600 mt/s,pc4-28800, cl17, 1.35v.	\N	110.10	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.243538	2026-04-15 17:02:12.243538
733	3	4	\N	mem ddr4 3200 pc4-25600	me8gkf432c16bb8	memoria kingston fury beast, 8gb, ddr4-3200mt/s, pc4-25600, cl16, 1.35v,288-pines, xm	\N	73.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.244784	2026-04-15 17:02:12.244784
734	3	4	\N	mem ddr5 7200 pc5-57600	me16kf572c38rwa	memoria kingston fury renegade, 16gb ddr5-7200mt/s, cl38, 1.45v, rgb	\N	224.51	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.24592	2026-04-15 17:02:12.24592
735	3	4	\N	mem ddr5 7200 pc5-57600	me16kf572c38rsa	memoria kingston fury renegade, 16gb ddr5-7200mt/s, cl38,1.45v, rgb	\N	224.51	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.247065	2026-04-15 17:02:12.247065
736	3	4	\N	mem ddr5 6400 pc5-51200	me16gkf564c32ra	memoria kingston fury renegade, 16gb, ddr5 6400 mhz, pc5-51200, cl32, 1.4v, rgb.	\N	219.08	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.249321	2026-04-15 17:02:12.249321
737	3	4	\N	mem ddr5 6000 pc5-48000	me16kf560c36bwr	memoria kingston fury, 16gb, ddr5-6000 mt/s, pc5-48000, cl36, 1.35v, rgb.	\N	208.55	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.250823	2026-04-15 17:02:12.250823
738	3	4	\N	mem sodimm ddr5 6400	me32kvr64v52bd8	memoria kingston valueram, 32gb ddr5-6400mt/s, cl52, 1.1v	\N	400.32	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.252177	2026-04-15 17:02:12.252177
739	3	4	\N	mem sodimm ddr5 6400	me8gkvr64v52bs6	memoria kingston valueram, 8gb ddr5-6400mt/s, cl52, 1.1v	\N	114.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.253506	2026-04-15 17:02:12.253506
740	3	4	\N	mem ddr5 7600 pc5-60800	me16kf576c38rsa	memoria ram kingston kf576c38rsa-16, 16gb ddr5-7600 mhz, cl38, 1.45v	\N	233.51	2	f	\N	\N	\N	\N	2026-04-15 17:02:12.255145	2026-04-15 17:02:12.255145
741	3	4	\N	mem sodimm ddr5 5600	me16kcp556ss85	memoria so-dimm kingston 16gb ddr5-5600mt/s, pc5-44800, cl46, 1.1v, 262-pin, non-ecc[	\N	205.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:12.256474	2026-04-15 17:02:12.256474
742	3	4	\N	mem sodimm ddr5 6400	me16kvr64v52bs8	memoria so-dimm kingston 16gb ddr5-6400mt/s, pc5-51200, cl52, 1.1v, 262-pin, 1rx8, no	\N	204.94	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.258484	2026-04-15 17:02:12.258484
743	3	4	\N	mem sodimm ddr5 5600	me32kcp556sd8	memoria so-dimm kingston 32gb ddr5-5600mt/s, pc5-44800, cl46, 1.1v, 262-pin, non-ecc[	\N	397.13	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.261253	2026-04-15 17:02:12.261253
744	3	4	\N	mem sodimm ddr5 5600	me32kvr56s46bd8	memoria so-dimm kingston 32gb ddr5-5600mt/s, pc5-44800, cl46, 1.1v, 262-pin, non-ecc[	\N	397.13	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.262731	2026-04-15 17:02:12.262731
745	3	4	\N	mem sodimm ddr5 4800	me16gkf548s38ib	memoria so-dimm kingston fury impact 16gb ddr5-4800mt/s, pc5-38400, cl38, 1.1v, 262-p	\N	180.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.264177	2026-04-15 17:02:12.264177
746	3	4	\N	mem sodimm ddr5 5600	me16gkf556s40ib	memoria so-dimm kingston fury impact 16gb ddr5-5600mt/s, pc5-44800, cl40, 1.1v, 262-p	\N	204.11	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.265593	2026-04-15 17:02:12.265593
747	3	4	\N	mem sodimm ddr5 5600	me16kvr56s46bs8	memoria sodimm kingston 16gb ddr5-5600mt/s, pc5-44800, cl46, 1.1v, 262-pin, 1rx8, non	\N	201.06	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.267362	2026-04-15 17:02:12.267362
748	3	4	\N	mem sodimm ddr4 3200	me16gkf432s2ib2	memoria sodimm kingston hyper impact, 16gb, ddr4 3200 mt/s, pc4-25600, cl20, 1.2v.[@@	\N	125.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.268833	2026-04-15 17:02:12.268833
749	3	4	\N	mem sodimm ddr4 3200	me16kcp432ss816	memoria sodimm kingston kcp432ss8/16, 16gb, ddr4-3200mt/s, cl22, 1.2v, 260-pin, non-e	\N	142.82	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.270084	2026-04-15 17:02:12.270084
750	3	4	\N	mem sodimm ddr4 3200	me8gkcp432ss8	memoria sodimm kingston kcp432ss8/8, 8gb, ddr4-3200mhz, cl22, 1rx8, 1.2v, 260-pin, no	\N	76.21	12	f	\N	\N	\N	\N	2026-04-15 17:02:12.271581	2026-04-15 17:02:12.271581
751	3	4	\N	mem sodimm ddr4 3200	me16kvr32s22sod	memoria sodimm kingston kvr32s22d8/16, 16gb ddr4-3200mt/s, cl22, 1.2v, 260-pin, non-e	\N	142.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.275868	2026-04-15 17:02:12.275868
752	3	4	\N	mem sodimm ddr4 3200	me8gkvr32s22s88	memoria sodimm kingston, 8gb ddr4-3200mt/s pc4-25600, cl22, 1.2v, 2rx8, 260-pin, non-	\N	76.21	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.277725	2026-04-15 17:02:12.277725
753	3	4	\N	mem ddr4 3200 pc4-25600	me16ktl-ts432e	memoria udimm kingston 16gb ddr4-3200 mhz (pc4-25600), cl22, 1.20v, 288-pines, ecc[@@	\N	210.00	3	f	\N	\N	\N	\N	2026-04-15 17:02:12.279404	2026-04-15 17:02:12.279404
754	3	36	\N	mem sodimm ddr4 2400	zzmelen70m60573	mem ram 4g le 2.40g sodimm dr4	\N	18.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.281334	2026-04-15 17:02:12.281334
755	3	36	\N	mem sodimm ddr4 2666	zzmelen70r38789	mem ram 4g le 2.66g sodimm dr4	\N	18.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.282525	2026-04-15 17:02:12.282525
756	3	37	\N	mem ddr5 5600 pc5-44800	me16pasl560081h	memoria udimm patriot signature line premium ddr516gb (1x16gb) pc5-44800, cl46, 1.1v	\N	198.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.28466	2026-04-15 17:02:12.28466
757	3	38	\N	mem ddr5 6000 pc5-48000	me32prbl9bwr378	memoria u-dimm predator vesta ii rgb, 32gb (2x16gb) ddr5-6000mhz, pc5-48000, cl32, 1.	\N	441.00	18	f	\N	\N	\N	\N	2026-04-15 17:02:12.286761	2026-04-15 17:02:12.286761
758	3	38	\N	mem ddr5 6000 pc5-48000	me32prbl9bwr379	memoria u-dimm predator vesta ii rgb, 32gb (2x16gb) ddr5-6000mhz, pc5-48000, cl32, 1.	\N	441.00	14	f	\N	\N	\N	\N	2026-04-15 17:02:12.288134	2026-04-15 17:02:12.288134
759	3	8	\N	mem ddr5 5600 pc5-44800	me8gtfv5600hc40	mem ram 8g tf vulcan 5.60g dr5	\N	101.44	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.289963	2026-04-15 17:02:12.289963
760	3	8	\N	mem sodimm ddr4 3200	me16gtg3200c22s	memoria so-dimm teamgroup elite, 16gb ddr4-3200mhz (pc4-25600) 1.2v, cl22	\N	97.39	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.292511	2026-04-15 17:02:12.292511
761	3	8	\N	mem sodimm ddr4 3200	me8gtg3200c22s1	memoria so-dimm teamgroup elite, 8gb ddr4-3200mhz(pc4-25600) 1.2v, cl22	\N	62.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.295593	2026-04-15 17:02:12.295593
762	3	8	\N	mem ddr4 3200 pc4-25600	me16tgd416g3200	memoria teamgroup elite 16gb, ddr4-3200 mhz, 1.2v, cl22-22-22-52	\N	123.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.29702	2026-04-15 17:02:12.29702
763	3	8	\N	mem ddr3 1600 pc3-12800	me8gtg1600c1101	memoria teamgroup elite 8gb (1x8gb) ddr3-1600mhz pc3-12800, cl11, 1.35v	\N	27.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.298392	2026-04-15 17:02:12.298392
764	3	8	\N	mem ddr4 3200 pc4-25600	me16gtchc22dc01	memoria teamgroup t-create classic ddr4, 16gb (2x8gb) ddr4-3200mhz, cl-22, 1.2v	\N	138.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.29982	2026-04-15 17:02:12.29982
765	3	8	\N	mem ddr4 3600 pc4-28800	me16gtf3600hcdw	memoria teamgroup t-force delta rgb 16gb (2 x 8gb) ddr4-3600mhz, cl18, 1.35v, rgb, bl	\N	119.63	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.30106	2026-04-15 17:02:12.30106
766	3	8	\N	mem ddr4 3600 pc4-28800	me16gtf3600hcd2	memoria teamgroup t-force delta rgb 16gb (2 x 8gb) ddr4-3600mhz, cl18, 1.35v, rgb, ne	\N	124.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:12.302198	2026-04-15 17:02:12.302198
767	3	8	\N	mem ddr5 6000 pc5-48000	me8gtfv6000hc38	memoria teamgroup t-force vulcan 8gb (1x8gb) ddr5-6000mhz, cl38, 1.25v	\N	107.26	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.303365	2026-04-15 17:02:12.303365
768	3	8	\N	mem ddr5 5600 pc5-44800	me16tfv5600hc36	memoria teamgroup t-force vulcan ddr5 16gb ddr5-5600 mhz, cl36, 1.2v	\N	231.86	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.304763	2026-04-15 17:02:12.304763
769	3	8	\N	mem ddr5 5600 pc5-44800	me16tfva5600hcn	memoria teamgroup vulcan&#945; ddr5, 16gb (1x16gb) ddr5-5600mhz pc5-44800, cl40, 1.2v	\N	229.56	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.305931	2026-04-15 17:02:12.305931
770	3	8	\N	mem ddr5 7600 pc5-60800	me32tfxa7600hc3	memoria teamgroup xtreem argb ddr5 32gb (2x16gb) ddr5-7600mhz, pc5-60800, cl36, 1.4v[	\N	664.29	10	f	\N	\N	\N	\N	2026-04-15 17:02:12.308219	2026-04-15 17:02:12.308219
771	3	8	\N	mem sodimm ddr3 1600	me4gtgd3l4g1600	memoria tg elite sodimm ddr3 4gb ddr3-1600 mhz, cl-11, 1.35v	\N	10.39	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.310915	2026-04-15 17:02:12.310915
772	3	8	\N	mem ddr4 3200 pc4-25600	me8gtfyd48g32tf	memoria tg t-force vulcan tuf, 8gb ddr4-3200 mhz,cl16, 1.35v	\N	72.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.312794	2026-04-15 17:02:12.312794
773	3	14	\N	mem ddr4 3200 pc4-25600	me16tet32un4c16	mem ram 16g te tit 3.20ghz dr4	\N	114.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.314393	2026-04-15 17:02:12.314393
774	3	14	\N	mem ddr4 3200 pc4-25600	me8gtet32un4c22	memoria ram teros titan 8gb ddr4-3200mhz, pc4-25600, cl17/cl16, 1.2/1.35v, negro	\N	65.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.31591	2026-04-15 17:02:12.31591
775	14	16	cooler_aire	fan cooler cpu	accfanidis40tx	fan-cooler is-40-xt black	\N	100.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.318229	2026-04-15 17:02:12.318229
776	14	33	cooler_aire	fan cooler cpu	acincoolm23901	fan cooler intel rm1 lga1700	\N	12.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:12.319184	2026-04-15 17:02:12.319184
777	14	19	cooler_aire	fan cooler cpu	acmsmagcfaa13n	fan cooler msi mag cf aa13	\N	14.65	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.320235	2026-04-15 17:02:12.320235
778	14	39	cooler_aire	fan cooler cpu	accfanpccpldex4	fan-cooler para cpu pccooler paladin ex400, 120mm, 180w, 4-pin pwm, 12vdc, color negr	\N	21.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.321875	2026-04-15 17:02:12.321875
779	14	14	cooler_aire	fan cooler cpu	accpute8161n	cooler para procesador teros te-8161n, intel, tdp90w méx, aire	\N	4.70	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.323104	2026-04-15 17:02:12.323104
780	14	14	cooler_aire	fan cooler cpu	accpute8162n	cooler para procesador teros te-8162n, intel y amd, tdp 150w méx, aire	\N	15.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.324047	2026-04-15 17:02:12.324047
781	14	14	cooler_aire	fan cooler cpu	accpute8165n	fan cooler para procesador teros te-8165n intel yamd tdp 130w méx aire	\N	10.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.325093	2026-04-15 17:02:12.325093
782	14	14	cooler_aire	fan cooler cpu	accpute8166n	fan cooler para procesador teros te-8166n intel yamd tdp 200w méx aire	\N	24.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:12.326627	2026-04-15 17:02:12.326627
783	14	24	cooler_liquido	cooler liquido cpu 360	acarpg360lcd	liq cool ar pg gaming 360 lcd	\N	187.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:12.327644	2026-04-15 17:02:12.327644
784	14	18	cooler_liquido	cooler liquido cpu 280	accmmlwd24ma18p	refrigeracion léquida cooler master masterliquid 240l core argb, numero de ventilador	\N	53.20	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.328794	2026-04-15 17:02:12.328794
785	14	18	cooler_liquido	cooler liquido cpu 360	accmmlwd36ma18p	refrigeracion léquida cooler master masterliquid 360l core ii argb, num.de ventilador	\N	77.00	19	f	\N	\N	\N	\N	2026-04-15 17:02:12.329644	2026-04-15 17:02:12.329644
786	14	19	cooler_liquido	cooler liquido cpu 240	acmscorlqa13240	refrigeracion léquida msi mag coreliquid a13 240 / black / cantidad de ventiladores:	\N	52.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.330434	2026-04-15 17:02:12.330434
787	14	19	cooler_liquido	cooler liquido cpu 240	acmscorlqa1324w	refrigeracion léquida msi mag coreliquid a13 240 white / cantidad de ventiladores: 2[	\N	55.60	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.33132	2026-04-15 17:02:12.33132
788	14	19	cooler_liquido	cooler liquido cpu 240	acmscorlqe240w	refrigeracion léquida msi mag coreliquid e240 / cantidad de ventiladores: 2, color bl	\N	86.00	3	f	\N	\N	\N	\N	2026-04-15 17:02:12.332249	2026-04-15 17:02:12.332249
789	14	19	cooler_liquido	cooler liquido cpu 360	acmscorlqa13360	refrigerador léquido de cpu msi mag coreliquid a13 360	\N	59.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.33321	2026-04-15 17:02:12.33321
790	14	19	cooler_liquido	cooler liquido cpu 360	acmscorlqc360v2	refrigerador léquido de cpu msi mag coreliquid c360 v2	\N	71.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.333997	2026-04-15 17:02:12.333997
791	14	19	cooler_liquido	cooler liquido cpu 360	acmscorlqc3602w	refrigerador léquido de cpu msi mag coreliquid c360 v2 white (3-fans)	\N	72.30	6	f	\N	\N	\N	\N	2026-04-15 17:02:12.334933	2026-04-15 17:02:12.334933
792	14	14	cooler_liquido	cooler liquido cpu 120	accpute8163n	cooler para procesador teros te-8163n, intel y amd, tdp 155w méx, léquida	\N	30.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.33585	2026-04-15 17:02:12.33585
793	14	14	cooler_liquido	cooler liquido cpu 240	accpute8164n	cooler para procesador teros te-8164n, intel y amd, tdp 265w méx, 24, léquida	\N	42.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.33665	2026-04-15 17:02:12.33665
794	10	40	antivirus	software, antivirus	swb11010058	bd ant plus 1+1pc 12m	\N	10.30	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.338636	2026-04-15 17:02:12.338636
795	10	40	antivirus	software, antivirus	swb11010054	bd antivirus plus 1pc 12m	\N	3.50	1	f	\N	\N	\N	\N	2026-04-15 17:02:12.339794	2026-04-15 17:02:12.339794
796	10	40	antivirus	software, antivirus	swb11020059	bd internet security 1pc 12m	\N	4.25	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.340768	2026-04-15 17:02:12.340768
797	10	40	antivirus	software, antivirus	swb11010062	bd plus 1 pc 12m caja 2x1	\N	11.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.343149	2026-04-15 17:02:12.343149
798	10	40	antivirus	software, antivirus	swb11010063	bd plus 3 pcs 12m	\N	21.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.344034	2026-04-15 17:02:12.344034
799	10	40	antivirus	software, antivirus	swb11030033	bd total sec 3 disp 12m	\N	28.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.344774	2026-04-15 17:02:12.344774
800	10	40	antivirus	software, antivirus	swb11030034	bd total sec 5 disp 12m	\N	29.29	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.345421	2026-04-15 17:02:12.345421
801	10	40	antivirus	software, antivirus	swb11030029	bd total sec prem vpn 5pc 12m	\N	37.50	9	f	\N	\N	\N	\N	2026-04-15 17:02:12.346115	2026-04-15 17:02:12.346115
802	10	40	antivirus	software, antivirus	swb11010059	software bitdefender antivirus plus, licencia para 3 pcs, por 12 meses	\N	16.70	18	f	\N	\N	\N	\N	2026-04-15 17:02:12.34717	2026-04-15 17:02:12.34717
803	10	40	antivirus	software, antivirus	swb11020057	software bitdefender internet security, licencia para 1pc+1 adicional, 12 meses	\N	14.95	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.348754	2026-04-15 17:02:12.348754
804	10	40	antivirus	software, antivirus	swb11020058	software bitdefender internet security, licencia para 3 pcs, 12 meses	\N	19.61	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.349666	2026-04-15 17:02:12.349666
805	10	41	antivirus	software, antivirus	sws11030194	blister eset file server	\N	49.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.351107	2026-04-15 17:02:12.351107
806	10	41	antivirus	software, antivirus	swnodv11030111	eset 2020 multidevice 10pc 13m	\N	300.00	7	f	\N	\N	\N	\N	2026-04-15 17:02:12.351904	2026-04-15 17:02:12.351904
807	10	41	antivirus	software, antivirus	sws11010227	eset ant nod32 1pc (2x1)+1mg	\N	24.00	9	f	\N	\N	\N	\N	2026-04-15 17:02:12.352816	2026-04-15 17:02:12.352816
808	10	41	antivirus	software, antivirus	sws11010225	eset antivirus nod 32 2025 5pc	\N	47.60	5	f	\N	\N	\N	\N	2026-04-15 17:02:12.353673	2026-04-15 17:02:12.353673
809	10	41	antivirus	software, antivirus	sws11010233	eset antivirus nod 32 2x1 bts	\N	25.88	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.354372	2026-04-15 17:02:12.354372
810	10	41	antivirus	software, antivirus	sws11010224	eset antivirus nod32 2025 3pc	\N	32.50	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.355067	2026-04-15 17:02:12.355067
811	10	41	antivirus	software, antivirus	sws11030200	eset h essen 1 pc (2x1) + 1 mg	\N	25.60	1	f	\N	\N	\N	\N	2026-04-15 17:02:12.355952	2026-04-15 17:02:12.355952
812	10	41	antivirus	software, antivirus	sws11030202	eset home premium 1 pc 30% off	\N	20.50	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.357565	2026-04-15 17:02:12.357565
813	10	41	antivirus	software, antivirus	sws11030191	eset home sec esen 2025 3pc 1y	\N	32.30	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.359118	2026-04-15 17:02:12.359118
814	10	41	antivirus	software, antivirus	sws11030220	eset home sec essen 2x1 bts	\N	25.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.360095	2026-04-15 17:02:12.360095
815	10	41	antivirus	software, antivirus	sws11030204	eset home sec prem 1pc 30%off	\N	20.20	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.361058	2026-04-15 17:02:12.361058
816	10	41	antivirus	software, antivirus	sws11030221	eset home security premium bts	\N	23.89	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.361806	2026-04-15 17:02:12.361806
817	10	41	antivirus	software, antivirus	sws11030192	eset hsec essen 2025 6d 13m	\N	52.50	4	f	\N	\N	\N	\N	2026-04-15 17:02:12.362788	2026-04-15 17:02:12.362788
818	10	41	antivirus	software, antivirus	sws11010214	eset nod 32 edicion infamous 1	\N	20.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.363466	2026-04-15 17:02:12.363466
819	10	41	antivirus	software, antivirus	sws11030193	eset sec essencial 10pc 14m	\N	63.40	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.364167	2026-04-15 17:02:12.364167
820	10	41	antivirus	software, antivirus	sws11030214	eset sec essential 10 pc 14m	\N	65.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.364882	2026-04-15 17:02:12.364882
821	10	41	antivirus	software, antivirus	sws11030187	eset small busines sec 15pc 1y	\N	150.70	5	f	\N	\N	\N	\N	2026-04-15 17:02:12.365555	2026-04-15 17:02:12.365555
822	10	41	antivirus	software, antivirus	sws11030188	eset small busines sec 20pc 1y	\N	201.37	3	f	\N	\N	\N	\N	2026-04-15 17:02:12.366154	2026-04-15 17:02:12.366154
823	10	41	antivirus	software, antivirus	sws11030189	eset small busines sec 25 1y	\N	251.30	4	f	\N	\N	\N	\N	2026-04-15 17:02:12.366748	2026-04-15 17:02:12.366748
824	10	41	antivirus	software, antivirus	sws11030186	eset small bussine sec 10pc 1y	\N	108.00	8	f	\N	\N	\N	\N	2026-04-15 17:02:12.367391	2026-04-15 17:02:12.367391
825	10	41	antivirus	software, antivirus	sws11030185	eset small bussines sec 5pc 1y	\N	87.40	10	f	\N	\N	\N	\N	2026-04-15 17:02:12.368067	2026-04-15 17:02:12.368067
826	10	41	antivirus	software, antivirus	swnods11030160	eset smart sec premium 2023 1p	\N	26.60	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.369099	2026-04-15 17:02:12.369099
827	10	41	antivirus	software, antivirus	sws11030169	software eset home security ultimate para 5 pcs, edicion especial (licencia de 13 mes	\N	75.50	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.369851	2026-04-15 17:02:12.369851
828	10	42	antivirus	kaspersky esd consumo	swkl1042ddafs1	antivirus kaspersky plus, para 1 pc, lic 1 aéo, producto virtual.	\N	26.55	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.371246	2026-04-15 17:02:12.371246
829	10	42	antivirus	kaspersky esd consumo	swkl1042ddkfs1	antivirus kaspersky plus, para 10 pcs, lic 1 aéo,producto virtual.	\N	54.36	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.372308	2026-04-15 17:02:12.372308
830	10	42	antivirus	kaspersky esd consumo	swkl1042ddcfs1	antivirus kaspersky plus, para 3 pcs, lic 1 aéo, producto virtual.	\N	34.13	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.373222	2026-04-15 17:02:12.373222
831	10	42	antivirus	kaspersky esd consumo	swkl1042ddefs1	antivirus kaspersky plus, para 5 pcs, lic 1 aéo, producto virtual.	\N	41.72	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.374214	2026-04-15 17:02:12.374214
832	10	42	antivirus	kaspersky esd consumo	swkl1047ddcfs1	antivirus kaspersky premium, para 3 pcs, lic 1 aéo, producto virtual.	\N	37.93	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.37528	2026-04-15 17:02:12.37528
833	10	42	antivirus	kaspersky esd consumo	swkl1047ddefs	antivirus kaspersky premium, para 5 pcs, lic 1 aéo, producto virtual.	\N	52.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.376322	2026-04-15 17:02:12.376322
834	10	42	antivirus	kaspersky esd consumo	swkl1041ddafs1	antivirus kaspersky standard, para 1 pc, lic 1 aéo, producto virtual.	\N	18.96	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.377186	2026-04-15 17:02:12.377186
835	10	42	antivirus	kaspersky esd consumo	swkl1041ddkfs1	antivirus kaspersky standard, para 10 pcs, lic 1 aéo, producto virtual.	\N	48.04	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.378085	2026-04-15 17:02:12.378085
836	10	42	antivirus	kaspersky esd consumo	swkl1041ddcfs1	antivirus kaspersky standard, para 3 pcs, lic 1 aéo, producto virtual.	\N	26.55	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.378863	2026-04-15 17:02:12.378863
837	10	42	antivirus	kaspersky esd consumo	swkl1041ddefs1	antivirus kaspersky standard, para 5 pcs, lic 1 aéo, producto virtual.	\N	34.13	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.379562	2026-04-15 17:02:12.379562
838	10	42	antivirus	software, antivirus	swkl1042d5afsa	kaspersky plus 1pc 1y	\N	24.00	14	f	\N	\N	\N	\N	2026-04-15 17:02:12.380233	2026-04-15 17:02:12.380233
839	10	42	antivirus	software, antivirus	swkl1042d5cfsa	kaspersky plus 3pc 1y	\N	34.00	12	f	\N	\N	\N	\N	2026-04-15 17:02:12.380911	2026-04-15 17:02:12.380911
840	10	42	antivirus	software, antivirus	swkl1042d5efsa	kaspersky plus 5pc 1y	\N	35.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:12.381727	2026-04-15 17:02:12.381727
841	10	42	antivirus	software, antivirus	swkl1042d5cfs	kaspersky plus edition, para unos 3 dispositivos,licencia de 1 aéo	\N	34.00	12	f	\N	\N	\N	\N	2026-04-15 17:02:12.382409	2026-04-15 17:02:12.382409
842	10	42	antivirus	software, antivirus	swkl1047d5afsa	kaspersky premium 1pc 1y	\N	25.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:12.383109	2026-04-15 17:02:12.383109
843	10	42	antivirus	software, antivirus	swkl1047d5cfsa	kaspersky premium 3pc 1y	\N	29.80	20	f	\N	\N	\N	\N	2026-04-15 17:02:12.383913	2026-04-15 17:02:12.383913
844	10	42	antivirus	software, antivirus	swkl1047d5efsa	kaspersky premium 5pc 1y	\N	35.70	9	f	\N	\N	\N	\N	2026-04-15 17:02:12.384737	2026-04-15 17:02:12.384737
845	10	42	antivirus	kaspersky esd consumo	swkl4541ddefr	kaspersky small office securit	\N	300.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.385515	2026-04-15 17:02:12.385515
846	10	42	antivirus	software, antivirus	swkl1041d5kfsa	kaspersky standar 10pc 1y	\N	37.46	18	f	\N	\N	\N	\N	2026-04-15 17:02:12.386235	2026-04-15 17:02:12.386235
847	10	42	antivirus	software, antivirus	swkl1041d5afsa	kaspersky standar 1pc 1y	\N	16.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:12.387072	2026-04-15 17:02:12.387072
848	10	42	antivirus	software, antivirus	swkl1041d5efsa	kaspersky standar 5pc 1y	\N	26.70	14	f	\N	\N	\N	\N	2026-04-15 17:02:12.387976	2026-04-15 17:02:12.387976
849	10	42	antivirus	kaspersky esd consumo	swkl1041ddafs9	kaspersky standard latam 1-dvc	\N	999.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.38884	2026-04-15 17:02:12.38884
850	10	42	antivirus	kaspersky esd consumo	swkl1987ddefs	ksec2 latam 5-dvc 1-user 1y	\N	18.64	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.389693	2026-04-15 17:02:12.389693
851	10	42	antivirus	kaspersky esd business	swkl4541ddkfs	software kaspersky small office security, para 10pcs+1 serv, lic 1 aéo, producto virt	\N	148.94	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.390762	2026-04-15 17:02:12.390762
852	10	42	antivirus	kaspersky esd business	swkl4541ddmfs	software kaspersky small office security, para 15pcs, licencia 1 aéo, producto virtua	\N	181.53	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.392781	2026-04-15 17:02:12.392781
853	10	42	antivirus	kaspersky esd business	swkl4541ddnfs	software kaspersky small office security, para 20pcs, licencia 1 aéo, producto virtua	\N	198.36	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.39372	2026-04-15 17:02:12.39372
854	10	42	antivirus	kaspersky esd business	swkl4541ddpfs	software kaspersky small office security, para 25pcs, licencia 1 aéo, producto virtua	\N	223.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.394549	2026-04-15 17:02:12.394549
855	10	42	antivirus	kaspersky esd business	swkl4541ddefs	software kaspersky small office security, para 5 pcs+1 serv, lic 1 aéo, producto virt	\N	65.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.395314	2026-04-15 17:02:12.395314
856	10	42	antivirus	kaspersky esd business	swkl4541ddqfs	software kaspersky small office security, para 50pcs, licencia 1 aéo, producto virtua	\N	490.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.396115	2026-04-15 17:02:12.396115
857	10	11	antivirus	software, antivirus	zzlenb11010054	bundle lenovo blister	\N	999.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.39705	2026-04-15 17:02:12.39705
858	10	11	antivirus	kaspersky esd consumo	zzlenkl1041ddaf	kaspersky standar 1pc 1y (len)	\N	666.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.397786	2026-04-15 17:02:12.397786
859	10	43	antivirus	software, antivirus	zzdb11911005	bd total security 5pcs 12m	\N	666.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.399459	2026-04-15 17:02:12.399459
860	10	43	antivirus	kaspersky esd consumo	zzkl1042ddefs	kaspersky plus 2022 5_device	\N	666.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.400386	2026-04-15 17:02:12.400386
861	10	43	antivirus	kaspersky esd consumo	zzzkl4541ddefs	ksp small office 1y 5pc 1srv	\N	999.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.401399	2026-04-15 17:02:12.401399
862	10	10	antivirus	software, antivirus	zzb11010054m	bd antivirus plus 1pc 12m	\N	999.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:12.402113	2026-04-15 17:02:12.402113
863	10	10	antivirus	software, antivirus	zzb11020059m	bd internet security 1pc 12m	\N	999.00	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.402835	2026-04-15 17:02:12.402835
864	10	16	office	ms office	mstadvt5d01896	software microsoft office home and business 2013,espaéol, dvd.	\N	205.98	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.403733	2026-04-15 17:02:12.403733
865	10	43	office	ms esd office 365	msesdspp-00005	licenciamiento virtual (esd) microsoft 365 apps for business	\N	82.41	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.404421	2026-04-15 17:02:12.404421
866	10	43	office	ms esd office 365	msesdklq-00219	licenciamiento virtual (esd) microsoft 365 business standard	\N	124.87	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.405096	2026-04-15 17:02:12.405096
867	10	43	office	ms esd office 365	msesdep232295	licenciamiento virtual (esd) microsoft 365 familia (licencia de 12 meses / 1 a 6 usua	\N	70.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.405707	2026-04-15 17:02:12.405707
868	10	43	office	ms esd office 365	msesdep232316	licenciamiento virtual (esd) microsoft 365 personal (licencia de 12 meses / 1 usuario	\N	56.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.406404	2026-04-15 17:02:12.406404
869	10	43	office	ms esd office	msep206800	office home 2024 all retail	\N	105.66	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.407325	2026-04-15 17:02:12.407325
870	10	43	office	ms esd office	msep206608	office home and business 2024	\N	193.44	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.408261	2026-04-15 17:02:12.408261
871	10	16	windows	ms windows business	mstfqc-01268	microsoft windows 7 pro latam advance (fqc-01268)	\N	156.40	0	f	\N	\N	\N	\N	2026-04-15 17:02:12.40936	2026-04-15 17:02:12.40936
872	10	43	windows	ms windows business	msfqc10553	sistema operativo microsoft windows 11 pro 64-bitspanish latam oem dvd	\N	138.87	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.410263	2026-04-15 17:02:12.410263
873	10	43	windows	ms windows consumer	mstkw900657	sistema operativo microsoft windows home 11, 64 bits, espaéol, 1pk, dsp oem dvd.	\N	112.00	20	f	\N	\N	\N	\N	2026-04-15 17:02:12.411037	2026-04-15 17:02:12.411037
874	10	43	windows	ms esd windows consumer	msesdkw900664	sistema operativo microsoft windows home 11, 64-bits all languages pk lic online dwnl	\N	120.71	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.411761	2026-04-15 17:02:12.411761
875	10	43	windows	ms esd windows business	msesdfqc10572	sistema operativo microsoft windows pro 11, 64-bits all languages pk lic online dwnld	\N	184.46	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.412392	2026-04-15 17:02:12.412392
662	1	28	\N	cpu amd ryzen 7 sam4 5xxx	cpam4nr75800xt	AMD Ryzen 7 5800XT	Revisión de alto rendimiento de la arquitectura Zen 3 de 7nm. Se diferencia del 5800X original por un incremento en las frecuencias de reloj gracias a un mejor "binning" (selección de silicio de mayor calidad). Mantiene los 32 MB de caché L3 y soporte para PCIe 4.0, posicionándose como una de las opciones definitivas para exprimir el rendimiento mononúcleo y multihilo en plataformas AM4.	215.00	15	f	\N	\N	\N	\N	2026-04-15 17:02:12.126065	2026-04-16 16:46:41.256303
664	1	28	\N	cpu amd ryzen 7 sam5 7xxx	cpam5r77800x3d	AMD Ryzen 7 7800X3D	Basado en la arquitectura Zen 4, este modelo integra la innovadora tecnología 3D V-Cache, que añade 64 MB de caché L3 apilada verticalmente (totalizando 96 MB de caché L3). Este diseño reduce drásticamente las latencias de memoria y maximiza el rendimiento en juegos y aplicaciones sensibles a la carga de datos. Es compatible con DDR5 y PCIe 5.0, ofreciendo una base de alto rendimiento y longevidad en la plataforma AM5.	399.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.129804	2026-04-16 16:48:36.151169
666	1	28	\N	cpu amd ryzen 7 sam5 8xxx	cpam5sr78700g	AMD Ryzen 7 8700G	Procesador de alto rendimiento fabricado en 4nm. Es una solución "todo en uno" que combina 8 núcleos Zen 4 con la arquitectura gráfica RDNA 3. Destaca por incluir un acelerador de IA dedicado (Ryzen AI) con hasta 39 TOPS totales de procesamiento. Al ser un diseño monolítico, optimiza el consumo y la latencia, aunque está limitado a PCIe 4.0 y posee 16 MB de caché L3.	217.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.132747	2026-04-16 16:50:41.330355
652	1	28	\N	cpu amd ryzen 5 sam4 5xxx	cpam4r55500	AMD Ryzen 5 5500	CPU de escritorio fabricado en 7nm con 16 MB de caché L3. Al utilizar un diseño monolítico, optimiza la latencia interna pero está limitado a conectividad PCIe 3.0. Es una solución de alto rendimiento para multitarea y juegos que maximiza la eficiencia energética en la plataforma AM4.	90.15	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.103873	2026-04-16 16:35:11.343973
653	1	28	\N	cpu amd ryzen 5 sam4 5xxx	cpam4r55600gt	AMD Ryzen 5 5600GT	APU de sobremesa construida bajo el proceso de 7nm. Combina una CPU de 6 núcleos con una solución gráfica integrada potente para su segmento. Al igual que otros modelos "Cezanne", está limitada a la interfaz PCIe 3.0, pero ofrece una frecuencia de boost ligeramente superior al modelo 5600G, optimizando el rendimiento gráfico en tareas de oficina, multimedia y juegos ligeros sin necesidad de una tarjeta dedicada.	234.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.108803	2026-04-16 16:36:48.191102
654	1	28	\N	cpu amd ryzen 5 sam5 7xxx	cpam5r57600	AMD Ryzen 5 7600	Procesador de alto rendimiento fabricado en 5nm (TSMC). Es el corazón de la nueva plataforma AM5, lo que implica soporte nativo para memorias DDR5 y conectividad PCIe 5.0. A diferencia de sus predecesores de 65W, esta generación incluye gráficos básicos integrados en el I/O die, ideales para tareas de diagnóstico o uso de oficina sin necesidad de una GPU externa.	186.90	20	f	\N	\N	\N	\N	2026-04-15 17:02:12.111317	2026-04-16 16:38:04.542783
656	1	28	\N	cpu amd ryzen 5 sam5 8xxx	cpam5r58500g	AMD Ryzen 5 8500G	APU de sobremesa fabricada en 4nm. Utiliza una configuración híbrida con dos núcleos Zen 4 de alto rendimiento y cuatro núcleos Zen 4c optimizados para eficiencia. Esta arquitectura busca equilibrar el consumo energético y el desempeño en un formato monolítico, ideal para equipos compactos que no requieren una GPU dedicada. Incluye soporte para memoria DDR5 y PCIe 4.0.	129.15	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.113982	2026-04-16 16:40:30.220739
657	1	28	\N	cpu amd ryzen 5 sam5 8xxx	cpam5r58600g	AMD Ryzen 5 8600G	APU de alto rendimiento fabricada en 4nm. A diferencia de los modelos sin "G", esta integra una unidad de procesamiento neuronal (NPU) Ryzen AI y gráficos Radeon 760M, lo que la convierte en una solución muy capaz para tareas de IA, edición de contenido y gaming en 1080p sin GPU dedicada. Utiliza memoria DDR5 y está limitada a conectividad PCIe 4.0.	158.15	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.115904	2026-04-16 16:41:49.560062
659	1	28	\N	cpu amd ryzen 7 sam4 5xxx	cpam4nr75700	AMD Ryzen 7 5700	Procesador de 8 núcleos basado en el diseño monolítico "Cezanne" (originalmente diseñado como APU, pero con los gráficos desactivados). Al carecer del diseño de chiplets de la serie Vermeer (como el 5700X), cuenta con 16 MB de caché L3 y está limitado a conectividad PCIe 3.0. Es una opción sólida para productividad multihilo a un costo contenido.	133.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.119571	2026-04-16 16:44:04.589659
660	1	28	\N	cpu amd ryzen 7 sam4 5xxx	cpam4r75700g	AMD Ryzen 7 5700G	APU insignia de la serie 5000 fabricada en 7nm. Utiliza un diseño monolítico que integra 8 núcleos de alto rendimiento y una de las soluciones gráficas integradas más sólidas de su generación. Debido a su arquitectura, cuenta con 16 MB de caché L3 y está limitado a PCIe 3.0, siendo ideal para estaciones de trabajo compactas o sistemas de juegos sin tarjeta de video dedicada.	177.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.121825	2026-04-16 16:44:52.445026
668	1	28	\N	cpu amd ryzen 7 sam5 9xxx	cpam5r79800x3d	AMD Ryzen 7 9800X3D	Basado en el proceso de 4nm, es el sucesor directo del legendario 7800X3D. Combina la eficiencia de la arquitectura Zen 5 con la segunda generación de tecnología 3D V-Cache, sumando un total de 96 MB de caché L3. Este diseño optimiza drásticamente la latencia en gaming y aplicaciones de alta carga de datos, permitiendo frecuencias base significativamente más altas que sus predecesores sin comprometer la estabilidad térmica.	459.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.135508	2026-04-16 16:52:36.148005
550	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbz890aewf7i	GIGABYTE Z890 AORUS ELITE WIFI7 ICE	Placa base tope de gama para la arquitectura Arrow Lake. Construida con un VRM de grado entusiasta (Twin Digital VRM) para soportar el overclocking y el máximo rendimiento de procesadores Intel Core Ultra 9. Integra Wi-Fi 7, disipadores Thermal Guard de alta cobertura y un sistema de ensamblaje EZ-Latch sin herramientas para todo (GPU, M.2, disipadores).	246.50	6	f	\N	\N	\N	\N	2026-04-15 17:02:11.936264	2026-04-18 11:50:50.562858
546	2	25	\N	mb socket am5 amd	mbgbb840md3hpw6	GIGABYTE B760M D3HP	Placa base Micro-ATX orientada a durabilidad. Incluye el sistema Q-Flash Plus (para actualizar BIOS sin CPU) y conectores de alta velocidad. Es una placa sólida de "gama de entrada-media" para Intel, diseñada para entornos de oficina donde se necesita fiabilidad, múltiples puertos de salida de video y soporte para memoria DDR5.	116.49	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.930363	2026-04-18 11:09:50.442126
545	2	25	\N	mb ci9 s1700 ddr5	mbgbb760ds3hwfg	GIGABYTE B760M DS3H AX DDR5	Placa base Micro-ATX versátil, diseñada para la serie 12.ª, 13.ª y 14.ª de Intel. Destaca por su robusta conectividad, incluyendo Wi-Fi 6E y Bluetooth 5.3 integrados. Cuenta con disipadores térmicos en el área de VRM para mantener la estabilidad bajo carga constante y ranuras PCIe reforzadas. Es una opción muy utilizada para estaciones de trabajo que requieren fiabilidad sin complicaciones.	128.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.928819	2026-04-18 11:10:07.438802
669	1	28	\N	cpu amd ryzen 9 sam4 5xxx	cpam4r95900xt	AMD Ryzen 9 5900XT	Basado en la arquitectura Zen 3 de 7nm, este procesador es una joya de densidad para el socket AM4, ofreciendo 16 núcleos y 32 hilos. Incluye 64 MB de caché L3 y soporte para PCIe 4.0. Es esencialmente una versión de mayor conteo de núcleos diseñada para tareas de alta exigencia multihilo, siendo la opción definitiva para quienes poseen una placa base AM4 y necesitan máxima capacidad de cómputo sin migrar a la plataforma AM5.	377.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.136733	2026-04-16 16:53:25.677322
671	1	28	\N	cpu amd ryzen 9 sam5 9xxx	cpam5r99900x	AMD Ryzen 9 9900X	Fabricado sobre el nodo de 4nm, el 9900X ofrece un equilibrio superior entre eficiencia energética y capacidad multihilo. A diferencia de su predecesor (7900X de 170W), este modelo opera con un TDP de 120W, logrando un rendimiento equivalente o superior gracias al incremento en IPC de la arquitectura Zen 5. Es una opción de alta gama ideal para estaciones de trabajo que requieren potencia constante en virtualización, compilación de software a gran escala y análisis de datos.	398.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.139162	2026-04-16 16:55:00.661519
672	1	28	\N	cpu amd ryzen 9 sam5 9xxx	cpam5r9900x3d	AMD Ryzen 9 9900X3D	Diseñado en el nodo de 4nm, este modelo integra la 2ª Generación de 3D V-Cache, sumando un total de 140 MB de caché total (L2+L3). A diferencia de los modelos X3D de 8 núcleos, este procesador está diseñado para quienes necesitan un rendimiento híbrido: el mejor desempeño en gaming gracias a su caché masiva y una potencia bruta excepcional en productividad gracias a sus 12 núcleos físicos.	573.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:12.140512	2026-04-16 16:55:48.589559
674	1	28	\N	cpu amd ryzen 9 sam5 9xxx	cpam5r99950x3d	AMD Ryzen 9 9950X3D	La culminación de la arquitectura Zen 5 de 4nm con la tecnología 3D V-Cache de segunda generación. A diferencia de los modelos X, este integra un total de 144 MB de caché total (L2+L3). Su diseño asimétrico de los CCD (un chip con caché y otro enfocado a mayor frecuencia) permite una gestión dinámica de cargas de trabajo pesadas, asegurando que cada tarea obtenga exactamente lo que necesita: velocidad de reloj o caché masiva.	663.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.143776	2026-04-16 16:57:41.335329
694	1	33	\N	cpu ci3 12xxx s1700	cpiti312100t	Intel Core i3-12100	Basado en una arquitectura monolítica, es una opción sumamente eficiente para plataformas de bajo presupuesto. Ofrece un excelente desempeño single-core para su segmento, lo que lo hace muy ágil en aplicaciones de escritorio, navegación web y tareas administrativas. Admite tanto DDR4 (3200 MT/s) como DDR5 (4800 MT/s).	171.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.175948	2026-04-16 16:59:30.061915
693	1	33	\N	cpu ci7 14xxx s1700	cpiti714700t	Intel Core i7-14700	Basado en la arquitectura híbrida Raptor Lake Refresh (10nm / "Intel 7"). Combina núcleos de rendimiento (P-cores) para tareas pesadas y núcleos de eficiencia (E-cores) para procesos en segundo plano, maximizando el rendimiento por vatio en aplicaciones de productividad profesional.	417.00	15	f	\N	\N	\N	\N	2026-04-15 17:02:12.17395	2026-04-16 17:05:59.118579
681	1	32	\N	cpu ci7 14xxx s1700	cpili714700k	Intel Core i7-14700K	Versión desbloqueada (K) de la arquitectura Raptor Lake Refresh. Diseñado para entusiastas, permite el overclocking de núcleos y memoria. Integra 8 P-cores y 12 E-cores, optimizados para un rendimiento máximo en productividad, compilación y tareas creativas pesadas.	372.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.154397	2026-04-16 17:08:33.184688
683	1	32	\N	cpu ci9 12xxx s1700	cpili912900k	Intel Core i9-12900K	El primer procesador de consumo de Intel con arquitectura híbrida a gran escala. Combina 8 núcleos de rendimiento (P-cores) y 8 núcleos de eficiencia (E-cores). Diseñado para máxima productividad y entusiastas del overclocking.	419.00	2	f	\N	\N	\N	\N	2026-04-15 17:02:12.157091	2026-04-16 17:13:01.731563
685	1	32	\N	cpu ci9 14xxx s1700	cpili914900	Intel Core i9-14900	Procesador insignia de la arquitectura Raptor Lake Refresh (10nm / "Intel 7") en su versión bloqueada. Combina 8 núcleos de rendimiento (P-cores) y 16 núcleos de eficiencia (E-cores), alcanzando una frecuencia de hasta 5.8 GHz. Diseñado para ofrecer máximo rendimiento en cargas de trabajo profesionales sin la necesidad de overclocking manual.	606.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.160587	2026-04-16 17:16:17.653084
686	1	32	\N	cpu ci9 14xxx s1700	cpili914900f	Intel Core i9-14900F	Procesador de 24 núcleos basado en la arquitectura Raptor Lake Refresh (10nm / "Intel 7"). Utiliza una configuración híbrida masiva para maximizar la multitarea profesional, eliminando los gráficos integrados para reducir costos en estaciones de trabajo con GPU dedicada.	565.83	19	f	\N	\N	\N	\N	2026-04-15 17:02:12.161948	2026-04-16 17:17:22.002892
688	1	32	\N	cpu ci9 14xxx s1700	cpili914900kf	Intel Core i9-14900KF	Versión desbloqueada (K) y sin gráficos integrados (F) de la arquitectura Raptor Lake Refresh. Es el procesador de consumo más potente de la plataforma LGA 1700, combinando 8 P-cores y 16 E-cores para un rendimiento multihilo masivo y una frecuencia de hasta 6.0 GHz en aplicaciones que requieren alta velocidad.	480.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.164407	2026-04-16 17:19:53.20076
690	1	32	\N	cpu cu5 2xx s1851	cpilu5225	Intel Core Ultra 5 225	Procesador de arquitectura Arrow Lake-S con diseño modular (tiles/chiplets). Elimina el Hyper-Threading para priorizar núcleos físicos puros, mejorando la eficiencia térmica y la latencia. Incluye una NPU dedicada para aceleración de tareas de IA local, optimizada para cargas de trabajo de productividad moderna.	178.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.167635	2026-04-16 17:23:45.508917
691	1	32	\N	cpu cu7 2xx s1851	cpilu7265	Intel Core Ultra 7 265	Procesador de 20 núcleos basado en la arquitectura Arrow Lake-S con diseño modular (chiplets). Utiliza núcleos de rendimiento (Lion Cove) y núcleos de eficiencia (Skymont), eliminando el Hyper-Threading para mayor precisión en la gestión térmica. Incluye una NPU avanzada para tareas de IA local y soporte exclusivo para memoria DDR5.	359.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.1693	2026-04-16 17:25:00.07364
491	2	16	\N	mb socket i c/cpu intel	mbadvi713620h	Advance MTDK (Core i7-13620H)	Placa base compacta de formato Mini-ITX que incluye el procesador Intel Core i7-13620H (arquitectura Raptor Lake). Es una solución eficiente y de bajo perfil ideal para equipos de oficina, señalización digital o estaciones de desarrollo compactas donde el espacio es limitado. Al no permitir cambio de CPU, se enfoca en durabilidad y practicidad para entornos profesionales.	289.00	4	f	\N	\N	\N	\N	2026-04-15 17:02:11.831904	2026-04-16 17:38:04.670058
492	2	24	\N	mb socket am4 amd	mbara520m-hdv	ASRock A520M-HDV	Placa base compacta y económica diseñada para tareas de oficina, estudio o gaming ligero. Utiliza el chipset A520, que no permite overclocking del procesador. Es una placa de "fase de energía básica", ideal para CPUs de hasta 65W o 95W. Su diseño es muy minimalista, enfocándose en la estabilidad fundamental.	46.65	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.835766	2026-04-16 17:40:39.074638
493	2	24	\N	mb socket am4 amd gaming	mbarb550pg4ac	ASRock B550 Phantom Gaming 4/ac	Placa base ATX de gama media con chipset B550. Incluye soporte para PCIe 4.0 tanto en la ranura de expansión principal como en el slot M.2 principal. Cuenta con una fase de energía (VRM) mejorada, disipadores de calor para los componentes críticos y conectividad Wi-Fi (ac) integrada. Es una placa versátil diseñada para usuarios que buscan un equilibrio entre rendimiento, expansión y durabilidad.	79.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.837783	2026-04-16 17:42:41.868489
494	2	24	\N	mb socket am5 amd	mbarb650mhm2p	ASRock B650M-H/M.2+	Placa base compacta (Micro-ATX) diseñada para la eficiencia y el soporte de tecnologías de nueva generación. Aunque es de gama de entrada en el ecosistema AM5, destaca por incluir un slot Blazing M.2 (Gen5), permitiendo almacenamiento de ultra alta velocidad. Es ideal para ensambles compactos que requieren la potencia de los procesadores Ryzen actuales.	90.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.839593	2026-04-16 17:44:10.607405
506	2	17	\N	mb socket am5 amd gaming	mbasb650mayww-b	ASUS B650M-AYW WiFi	Placa base Micro-ATX diseñada para el ecosistema AM5. Incluye conectividad inalámbrica WiFi 6 y Bluetooth, facilitando la instalación en entornos de oficina sin cableado estructurado. Destaca por incluir un slot M.2 PCIe 5.0 para almacenamiento de ultra alta velocidad. Su diseño de VRM está optimizado para mantener temperaturas estables bajo cargas de trabajo sostenidas, ideales para procesos administrativos y de desarrollo de software.	108.90	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.861855	2026-04-16 17:48:44.576447
551	2	25	\N	mb cu9 s1851 ddr5 gaming	mbgbz890mtaitop	Gigabyte Z890 AORUS MASTER AI TOP	Placa de grado entusiasta/servidor de escritorio. Cuenta con un sistema de energía (VRM) de 20+1+2 fases para una estabilidad eléctrica absoluta. Destaca por su conectividad 10GbE LAN, Wi-Fi 7, y su enfoque en "IA TOP" con herramientas de gestión térmica y de overclocking asistidas por IA integrada en BIOS.	620.00	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.937842	2026-04-16 18:01:39.241138
552	2	25	\N	mb cu9 s1851 ddr5	mbgbz890axaitop	Gigabyte Z890 AORUS XTREME AI TOP	La placa "buque insignia" definitiva. Cuenta con un sistema de alimentación 20+1+2 fases con disipadores de tecnología NanoCarbon para una transferencia de calor ultra eficiente. Incluye pantalla LCD integrada para monitoreo en tiempo real, conectividad dual Thunderbolt 5, 10GbE LAN y Wi-Fi 7. Es una plataforma diseñada para romper récords y manejar cargas de trabajo de IA generativa de forma nativa.	945.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.939456	2026-04-16 18:02:39.910694
496	2	24	\N	mb ci9 s1700 ddr5 gaming	mbarb760mpgrtwf	ASRock B760M PG Riptide WiFi	Placa base Micro-ATX robusta enfocada en alto rendimiento. Cuenta con un diseño de fases de alimentación (VRM) de 12+1+1 para estabilidad térmica. Incluye Wi-Fi 6E, puerto LAN Dragon 2.5GbE y soporte para PCIe 5.0, lo cual es una gran ventaja competitiva en esta gama. Su diseño térmico es superior, ideal para mantener componentes fríos bajo cargas de trabajo prolongadas.	114.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.843637	2026-04-16 18:04:35.995648
498	2	24	\N	mb socket am5 amd gaming	mbarb850prors	ASRock B850 Pro RS	Placa ATX robusta con diseño de fases de poder optimizado (Dr.MOS). Incluye disipadores integrales para los slots M.2 y el área de VRM. Destaca por su conectividad PCIe 5.0 tanto en la ranura de expansión principal como en el slot M.2 principal, ofreciendo una base sólida para hardware de nueva generación. Es parte de la serie "Pro RS", conocida por su estética plata/negra y su durabilidad probada en entornos de trabajo.	181.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.847026	2026-04-16 18:07:41.204319
499	2	24	\N	mb socket am5 amd	mbarb850m-xr20	ASRock B850M-X R2.0	Placa Micro-ATX diseñada para máxima velocidad de datos. A pesar de su tamaño, incluye soporte para PCIe 5.0 tanto en la ranura de expansión (GPU) como en el almacenamiento (M.2), lo cual es impresionante para este segmento. Utiliza un diseño de 6+1+1 fases de energía con componentes Dr.MOS, enfocado en eficiencia y durabilidad para las series Ryzen 7000, 8000 y 9000.	111.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.84853	2026-04-16 18:09:05.888686
500	2	24	\N	mb socket am5 amd	mbarb850mxwfr20	ASRock B850M-X WiFi R2.0	Es una plataforma Micro-ATX compacta que no sacrifica rendimiento. Incluye soporte para tecnologías de última generación (Gen5 en SSD y PCIe). Sus fases de poder con Dr.MOS garantizan una entrega de energía estable, y la inclusión de WiFi de alta velocidad la libera de la dependencia del cableado Ethernet, ideal para reorganizar puestos de trabajo en Mente Oasis sin complicaciones.	114.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.850323	2026-04-16 18:10:18.319183
503	2	24	\N	mb cu9 s1851 ddr5	mbarh810m-x	ASRock H810M-X	Placa base esencial diseñada para la plataforma Intel Arrow Lake. Ofrece conectividad corporativa completa (VGA/HDMI/DP y LAN 2.5GbE). Cuenta con un diseño de fases de energía básico sin disipación activa, optimizado para cargas de trabajo administrativas estándar y no para procesamiento intensivo.	84.80	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.854983	2026-04-16 18:17:53.765013
504	2	24	\N	mb socket lga4677 xeon	mbarw790wsr20	ASRock W790 WS R2.0	Plataforma de grado servidor para cargas de trabajo críticas. Cuenta con una arquitectura de alimentación 20+2+1 fases diseñada para procesadores Xeon de hasta 56 núcleos. Incluye soporte para memoria ECC (Error Correction Code), doble puerto 10GbE LAN, y una capacidad de expansión PCIe 5.0 masiva. Es una placa orientada a la estabilidad 24/7, virtualización, renderizado profesional y entrenamiento de modelos de IA a gran escala.	525.00	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.856391	2026-04-16 18:21:15.828255
505	2	24	\N	mb cu9 s1851 ddr5 gaming	mbarz890prorswf	ASRock Z890 Pro RS WiFi	Placa base ATX de gama media-alta diseñada para el máximo rendimiento de la plataforma Intel Core Ultra. Cuenta con un robusto sistema de alimentación VRM con disipadores extendidos, soporte nativo para PCIe 5.0 en GPU y almacenamiento, conectividad Wi-Fi 7 integrada y un diseño optimizado para estabilidad en estaciones de trabajo y desarrollo.	213.00	15	f	\N	\N	\N	\N	2026-04-15 17:02:11.859228	2026-04-16 18:23:12.550437
509	2	17	\N	mb socket am5 amd	mbasa620m-k	ASUS Prime A620M-K	Es la opción más básica de la serie Prime. Cuenta con una construcción minimalista, ausencia de disipadores en las fases de poder (VRM) y una conectividad muy medida. Ideal para procesadores de bajo consumo, ya que el chipset A620 no permite overclocking y está optimizado para flujos de trabajo administrativos convencionales.	68.10	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.866165	2026-04-16 18:27:30.042248
547	2	25	\N	mb socket am5 amd gaming	mbgbb850maewf6e	GIGABYTE B850M AORUS ELITE AX	Placa base Micro-ATX premium de la serie AORUS. Diseñada con un VRM masivo y disipadores térmicos avanzados (Thermal Guard) para soportar procesadores de alto TDP. Incluye conectividad Wi-Fi 7, puerto Ethernet 2.5GbE y soporte nativo para PCIe 5.0 tanto en GPU como en almacenamiento M.2. Es una placa orientada a la máxima durabilidad y rendimiento a largo plazo.	173.50	16	f	\N	\N	\N	\N	2026-04-15 17:02:11.931773	2026-04-18 11:10:20.189604
548	2	25	\N	mb cu9 s1851 ddr5	mbgbb860mds3hwf	GIGABYTE B860M DS3H AX	Placa base Micro-ATX de nueva generación para procesadores Intel Core Ultra. Destaca por incluir un slot M.2 Gen5, soporte completo para DDR5 de alta frecuencia y conectividad inalámbrica Wi-Fi 6E/7. Su diseño está optimizado para la eficiencia energética de la plataforma Arrow Lake, ofreciendo una base estable para entornos profesionales.	139.40	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.933207	2026-04-18 11:10:32.559503
511	2	17	\N	mb socket am5 amd	mbasb650m-aii	ASUS Prime B650M-A II	Placa de gama media con un diseño robusto y disipadores de VRM integrados. Ofrece 4 slots de memoria, lo que permite mayor escalabilidad. Destaca por su conectividad avanzada (incluyendo header USB tipo C frontal) y su capacidad para manejar procesadores Ryzen de alto rendimiento bajo cargas de trabajo constantes.	109.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.869309	2026-04-16 18:30:28.420847
512	2	17	\N	mb socket am5 amd	mbasb650m-f	ASUS Prime B650M-F	Placa de gama de entrada con arquitectura esencial. Presenta un diseño simplificado, VRM sin disipación activa y una conectividad básica. Es la opción más accesible para entrar en la plataforma AM5, pero está restringida en cuanto a escalabilidad de memoria y capacidad de almacenamiento comparado con modelos superiores de la serie B650.	75.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.870861	2026-04-16 18:31:24.059159
514	2	17	\N	mb ci9 s1700 ddr5	mbasb760m-a	ASUS Prime B760M-A	Placa de gama media esencial, diseñada para ofrecer estabilidad y funcionalidad en entornos de oficina y estaciones de desarrollo. Incluye disipación en las fases de poder (VRM) para un desempeño térmico adecuado bajo carga. Soporta procesadores Intel de 12.ª, 13.ª y 14.ª generación, brindando una plataforma madura y fiable	96.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.873474	2026-04-16 18:33:45.166665
651	2	19	\N	mb socket am5 amd gaming	mbmsx870egmgpwf	MSI X870E Gaming Plus WiFi	Plataforma de gama alta diseñada para máxima estabilidad y ancho de banda. Incluye un sistema de alimentación (VRM) masivo con disipación extendida, conectividad WiFi 7, puertos USB4 (40Gb/s) y una construcción multicapa de grado servidor para integridad de señales de alta velocidad. Es la base definitiva para estaciones de cómputo intensivo.	255.25	9	f	\N	\N	\N	\N	2026-04-15 17:02:12.101607	2026-04-16 18:37:05.102087
650	2	19	\N	mb socket am5 amd gaming	mbmsx870gmgplwf	MSI X870 Gaming Plus WiFi	Placa de gama alta optimizada para la nueva generación de procesadores AMD. Cuenta con un robusto VRM con disipadores extendidos, conectividad Wi-Fi 7 de alta eficiencia y puertos USB4 nativos. Diseñada para ofrecer una plataforma estable y escalable, eliminando cuellos de botella en almacenamiento de alta velocidad y periféricos de última generación.	249.00	13	f	\N	\N	\N	\N	2026-04-15 17:02:12.100387	2026-04-16 18:39:00.660691
515	2	17	\N	mb ci9 s1700 ddr4	mbasb760m-kd4	ASUS Prime B760M-K D4	Placa de gama básica con arquitectura simplificada. No incluye disipadores en las fases de poder (VRM), lo que la hace ideal para procesadores de bajo consumo (TDP 65W). Ofrece conectividad esencial, prescindiendo de extras estéticos o de alta gama, enfocándose puramente en la funcionalidad básica para entornos de oficina.	77.25	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.875899	2026-04-16 18:41:21.088686
517	2	17	\N	mb socket am5 amd gaming	mbasb850m-awifi	ASUS Prime B850M-A WiFi	Plataforma de gama media-alta con un sistema de alimentación optimizado para los procesadores Ryzen más recientes. Destaca por su conectividad inalámbrica de última generación (WiFi 7 o 6E), disipadores de calor dedicados en el VRM para estabilidad térmica y soporte completo para las velocidades de memoria DDR5 más exigentes.	147.00	8	f	\N	\N	\N	\N	2026-04-15 17:02:11.880426	2026-04-16 18:43:23.887245
519	2	17	\N	mb cu9 s1851 ddr5	mbasprh810m-e	ASUS Prime H810M-E	Es la solución base para la nueva arquitectura. Cuenta con un diseño térmico pasivo simplificado (sin disipadores robustos sobre los VRM), conectividad enfocada a lo esencial y soporte para memorias DDR5, lo cual es su mayor ventaja frente a las generaciones anteriores que dependían de DDR4.	86.61	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.883653	2026-04-16 18:45:35.634654
520	2	17	\N	mb socket am5 amd gaming	mbasx870-pwifi	ASUS Prime X870-P WiFi	Plataforma de alto rendimiento con diseño sobrio y profesional. Integra disipadores de VRM masivos y eficiente refrigeración para SSDs M.2. Destaca por su conectividad de vanguardia incluyendo USB4, Wi-Fi 7 y una construcción de alta durabilidad, diseñada para mantener el rendimiento bajo cargas de trabajo pesadas y constantes.	230.24	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.885349	2026-04-16 18:47:10.128851
522	2	17	\N	mb ci9 s1700 ddr4	mbash610m-ct2d4	ASUS Pro H610M-CT2 D4-CSM	Placa de gama básica con arquitectura simplificada. A diferencia de las series comerciales, esta placa está construida con componentes de mayor tolerancia para funcionar en ambientes de oficina de forma ininterrumpida. Carece de disipadores en los VRM y utiliza tecnología DDR4 económica.	66.00	5	f	\N	\N	\N	\N	2026-04-15 17:02:11.88882	2026-04-16 18:53:21.595416
523	2	17	\N	mb cu9 s1851 ddr5 gaming	mbasmaxz890hero	ASUS ROG Maximus Z890 Hero	Placa base de gama entusiasta para procesadores Intel Core Ultra (Serie 2). Destaca por su sistema de alimentación de 22+1+2+2 fases, conectividad Thunderbolt 4 dual, Wi-Fi 7 integrado y soporte para almacenamiento PCIe 5.0. Incluye soluciones térmicas avanzadas y optimización mediante IA para overclocking y gestión de redes	619.00	6	f	\N	\N	\N	\N	2026-04-15 17:02:11.890469	2026-04-18 09:16:28.219728
648	2	19	\N	mb cu9 s1851 ddr5	mbmsz890-pwifi	MSI PRO Z890-P WIFI	Placa base de la serie profesional diseñada para procesadores Intel Core Ultra (Serie 2). Integra un sistema de alimentación Duet Rail de 14+1+1+1 fases, soporte para memoria DDR5 de alta velocidad y conectividad de red avanzada con Wi-Fi 7 y LAN 5G. Incluye puertos Thunderbolt 4 (USB4), salidas de video HDMI 2.1 / DisplayPort 1.4 y blindaje térmico M.2 Shield Frozr para optimizar el rendimiento de almacenamiento persistente	200.00	17	f	\N	\N	\N	\N	2026-04-15 17:02:12.097758	2026-04-18 09:19:45.479533
647	2	19	\N	mb socket am5 amd	mbmsx870epwfpro	MSI PRO X870E-P WIFI	Placa base profesional de alto rendimiento basada en el chipset premium X870E. Ofrece soporte nativo para procesadores AMD Ryzen de última generación, con conectividad USB4 de hasta 40Gbps, Wi-Fi 7 y LAN 5G. Cuenta con un diseño de alimentación de 14+2+1 fases y ranuras M.2 con disipación térmica Shield Frozr, garantizando la máxima estabilidad en flujos de trabajo intensos y transferencia de datos ultrarrápida.	230.25	15	f	\N	\N	\N	\N	2026-04-15 17:02:12.09653	2026-04-18 09:22:07.684742
644	2	19	\N	mb cu9 s1851 ddr5	mbmsh810m-bpro	MSI PRO H810M-B	Placa base Micro-ATX esencial de la serie profesional, diseñada para los nuevos procesadores Intel Core Ultra (Serie 2). Ofrece una plataforma estable y eficiente con soporte para memoria DDR5, salidas de video HDMI y DisplayPort para configuraciones multimonitor, y tecnología Core Boost para optimizar el suministro de energía. Es la solución ideal para ensambles corporativos que buscan la última tecnología de socket con un presupuesto optimizado.	79.70	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.092247	2026-04-18 09:25:39.246339
643	2	19	\N	mb ci9 s1700 ddr4	mbmsh610m-sddr4	MSI PRO H610M-S DDR4	Placa base Micro-ATX esencial diseñada para entornos profesionales y de oficina. Compatible con procesadores Intel Core de 12.ª, 13.ª y 14.ª generación, ofrece soporte para memoria DDR4 de hasta 3200 MHz, tecnología Core Boost para una entrega de energía estable y conectividad de almacenamiento NVMe. Incluye salidas de video para flujos de trabajo multimonitor y un diseño de PCB optimizado para mayor durabilidad.	57.50	5	f	\N	\N	\N	\N	2026-04-15 17:02:12.090464	2026-04-18 09:27:05.915067
524	2	17	\N	mb socket am4 amd gaming	mbasb550fgmgwf2	ASUS ROG STRIX B550-F GAMING WIFI II	Placa base ATX de alto rendimiento para procesadores AMD Ryzen series 3000, 4000G y 5000. Incorpora un robusto sistema de alimentación de 12+2 fases, conectividad Wi-Fi 6E integrada, Intel 2.5 Gb Ethernet y audio premium ROG SupremeFX. Diseñada para ofrecer estabilidad térmica y soporte para almacenamiento de alta velocidad mediante PCIe 4.0.	152.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.892758	2026-04-18 09:28:14.830195
526	2	17	\N	mb socket am5 amd gaming	mbasb850-agmgwf	ASUS ROG STRIX B850-A GAMING WIFI	Placa base de alto rendimiento diseñada para procesadores AMD Ryzen de última generación. Destaca por su estética 'Strix' y su conectividad avanzada que incluye Wi-Fi 7 y puertos USB4 nativos. Incorpora un robusto sistema de fases de poder y disipadores térmicos optimizados para garantizar la estabilidad de los componentes PCIe 5.0. Es la plataforma ideal para usuarios que buscan tecnologías de vanguardia y alta velocidad de transferencia en un formato equilibrado.	261.72	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.896345	2026-04-18 09:34:29.853247
528	2	17	\N	mb cu9 s1851 ddr5 gaming	mbasb860-agmgwf	ASUS ROG STRIX B860-A GAMING WIFI	Placa base ATX de alto rendimiento optimizada para procesadores Intel Core Ultra (Serie 2). Presenta una estética distintiva en color blanco y plata, característica de la serie 'Strix-A'. Incluye soporte para memoria DDR5 de alta velocidad, conectividad inalámbrica Wi-Fi 7, y ranuras de expansión PCIe 5.0. Está equipada con un robusto sistema de fases de poder y disipadores térmicos M.2 Shield, garantizando estabilidad y eficiencia para usuarios avanzados y creadores de contenido.	230.24	18	f	\N	\N	\N	\N	2026-04-15 17:02:11.899572	2026-04-18 09:37:29.80418
529	2	17	\N	mb cu9 s1851 ddr5 gaming	mbasb860-fgmgwf	ASUS ROG STRIX B860-F GAMING WIFI	Placa base ATX de alto nivel diseñada para la arquitectura Intel Core Ultra (Serie 2). Ofrece una entrega de energía optimizada y refrigeración integral para maximizar el rendimiento de los nuevos procesadores. Cuenta con conectividad Wi-Fi 7, Intel 2.5 Gb Ethernet, y puertos USB de alta velocidad. Su diseño destaca por el ecosistema ROG con iluminación Aura Sync y soluciones de montaje sencillo como el Q-Release para la tarjeta de video	252.17	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.901639	2026-04-18 09:39:16.292126
531	2	17	\N	mb socket am5 amd gaming	mbasx870eegmgwf	ASUS ROG STRIX X870E-E GAMING WIFI	Placa base de gama entusiasta diseñada para procesadores AMD Ryzen serie 9000. Equipada con un sistema de alimentación masivo de 18+2+2 fases, ofrece una estabilidad superior para overclocking y cargas de trabajo intensas. Destaca por su conectividad ultrarrápida con dos puertos USB4, Wi-Fi 7 y LAN de 5 Gb. Incluye soluciones térmicas avanzadas para sus 5 ranuras M.2 y funciones exclusivas de ROG para la optimización del rendimiento mediante IA	471.44	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.904296	2026-04-18 09:43:19.770078
532	2	17	\N	mb cu9 s1851 ddr5 gaming	mbasz890-egmgwf	ASUS ROG STRIX Z890-E GAMING WIFI	Placa base de alto rendimiento diseñada para procesadores Intel Core Ultra (Serie 2). Cuenta con un robusto sistema de alimentación de 18+1+2+2 fases, soporte para memorias DDR5 de alta frecuencia y conectividad de vanguardia con Wi-Fi 7 y LAN de 5 Gb. Incluye puertos Thunderbolt 4, salidas HDMI 2.1 y DisplayPort 1.4, además de disipadores térmicos masivos para las unidades M.2, garantizando el máximo desempeño en tareas de computación intensiva y gaming entusiasta.	461.00	15	f	\N	\N	\N	\N	2026-04-15 17:02:11.905912	2026-04-18 09:44:48.718643
534	2	17	\N	mb cu9 s1851 ddr5 gaming	mbasz890-fgmgwf	ASUS ROG STRIX Z890-F GAMING WIFI	Placa base ATX de gama alta diseñada para procesadores Intel Core Ultra (Serie 2). Incorpora un sistema de alimentación de 16+1+2+2 fases y soporte para memoria DDR5 de alta frecuencia. Destaca por su conectividad de vanguardia con Wi-Fi 7, puertos Thunderbolt 4 y Intel 2.5 Gb Ethernet. Incluye disipadores térmicos optimizados para ranuras M.2 PCIe 5.0, salidas de video HDMI 2.1 / DisplayPort 1.4 y funciones exclusivas de ROG para la gestión inteligente del rendimiento y la refrigeración	388.12	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.909382	2026-04-18 09:47:24.599854
535	2	17	\N	mb socket am5 amd gaming	mbasa620m-pwifi	ASUS TUF GAMING A620M-PLUS WIFI	Placa base Micro-ATX diseñada para ofrecer una base sólida y duradera en la plataforma AM5. Incorpora componentes de grado militar TUF, una solución de alimentación mejorada y un sistema de refrigeración integral. Cuenta con conectividad Wi-Fi 6, soporte para memoria DDR5 de alta velocidad y ranuras M.2 PCIe 4.0. Es la plataforma perfecta para ensambles eficientes que buscan la longevidad del socket de AMD con una excelente relación calidad-precio y estabilidad garantizada.	126.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.911404	2026-04-18 09:49:42.518192
536	2	17	\N	mb socket am4 amd gaming	mbasb550tfplwf2	ASUS TUF GAMING B550-PLUS WIFI II	Placa base ATX de alta durabilidad construida con componentes de grado militar y una solución de alimentación de 8+2 fases DrMOS. Ofrece soporte para PCIe 4.0, proporcionando velocidades de transferencia ultrarrápidas para las últimas GPU y SSDs. Viene equipada con Wi-Fi 6, Bluetooth 5.2, y LAN de 2.5 Gb. Su diseño térmico incluye disipadores para VRM y M.2, además de la tecnología de cancelación de ruido con IA exclusiva de ASUS para comunicaciones más claras.	141.43	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.913128	2026-04-18 09:51:29.417413
538	2	17	\N	mb ci9 s1700 ddr5 gaming	mbasb760tfgmpwf	ASUS TUF GAMING B760-PLUS WIFI	Placa base ATX diseñada para ofrecer una durabilidad excepcional en la plataforma Intel. Equipada con una solución de alimentación de 12+1 fases DrMOS y componentes de grado militar, garantiza un rendimiento estable para procesadores de alto nivel. Destaca por su conectividad avanzada con Wi-Fi 6, Ethernet de 2.5 Gb y puertos USB 3.2 Gen 2x2 Type-C. Incluye soporte para PCIe 5.0 en la ranura de gráficos y disipadores térmicos optimizados para mantener las unidades M.2 en temperaturas ideales.	161.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.916719	2026-04-18 09:54:59.373594
539	2	17	\N	mb ci9 s1700 ddr5 gaming	mbasb760mplwf2	ASUS TUF GAMING B760M-PLUS WIFI II	Placa base de alta durabilidad con certificación de grado militar, diseñada para procesadores Intel de última generación. La revisión 'WiFi II' destaca por integrar Wi-Fi 6E, ofreciendo acceso a la banda de 6 GHz para conexiones inalámbricas más rápidas y con menos interferencias. Incluye un sistema de alimentación de 12+1 fases, soporte para memorias DDR5 de alta frecuencia y tecnología SafeSlot Core+ para soportar tarjetas gráficas pesadas. Es la solución ideal para estaciones de trabajo potentes que requieren estabilidad en entornos de red saturados.	173.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.918439	2026-04-18 10:03:53.857771
541	2	17	\N	mb socket am5 amd gaming	mbasb850m-plwf	ASUS TUF GAMING B850M-PLUS WIFI	Placa base Micro-ATX diseñada para la plataforma AM5, combinando durabilidad de grado militar con tecnologías de próxima generación. Equipada con un sistema de alimentación robusto y disipadores térmicos ampliados, garantiza la estabilidad de los procesadores Ryzen más exigentes. Destaca por su conectividad de vanguardia que incluye Wi-Fi 7, soporte para USB4 y almacenamiento M.2 PCIe 5.0. Es la opción ideal para estaciones de trabajo compactas que requieren máxima fiabilidad y las velocidades de transferencia más altas del mercado.	202.83	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.922072	2026-04-18 10:06:08.721113
641	2	19	\N	mb socket am5 amd	mbmsb840m-pwf6p	MSI PRO B840M-P WIFI6E	Placa base de la serie profesional de MSI diseñada para maximizar la productividad con procesadores AMD Ryzen en socket AM5. Ofrece una base estable y eficiente con soporte para memoria DDR5 y tecnologías de red de última generación, incluyendo Wi-Fi 6E para acceso a la banda de 6 GHz. Cuenta con una robusta entrega de energía, ranuras Steel Armor para mayor durabilidad y un completo panel de conexiones que facilita el despliegue de periféricos de alta velocidad. Es la solución ideal para flotas de equipos de oficina que requieren longevidad y rendimiento confiable.	120.00	5	f	\N	\N	\N	\N	2026-04-15 17:02:12.087019	2026-04-18 10:08:13.639918
542	2	17	\N	mb cu9 s1851 ddr5 gaming	mbasb860-plwf	ASUS TUF GAMING B860-PLUS WIFI	Placa base ATX de alta resistencia diseñada para la nueva arquitectura de Intel. Incorpora componentes de grado militar TUF y un sistema de alimentación de 12+1+1 fases para garantizar estabilidad bajo carga pesada. Destaca por su conectividad avanzada con Wi-Fi 7, Ethernet de 2.5 Gb y puertos USB4 (40Gbps). Incluye salidas de video HDMI 2.1 y DisplayPort 1.4, además de un diseño térmico optimizado con disipadores de gran tamaño para las unidades M.2, ideal para estaciones de trabajo que requieren fiabilidad constante.	197.35	3	f	\N	\N	\N	\N	2026-04-15 17:02:11.923514	2026-04-18 10:09:15.848013
543	2	17	\N	mb cu9 s1851 ddr5 gaming	mbasb860m-plwf	ASUS TUF GAMING B860M-PLUS WIFI	Placa base Micro-ATX diseñada para la nueva arquitectura de Intel, combinando resistencia de grado militar con tecnologías de vanguardia. Equipada con un sistema de alimentación robusto y disipadores térmicos optimizados, garantiza estabilidad para los procesadores Intel Core Ultra. Destaca por su conectividad Wi-Fi 7, puerto Ethernet 2.5 Gb y soporte nativo para USB4. Incluye salidas de video HDMI 2.1 y DisplayPort 1.4, ofreciendo una plataforma compacta pero sumamente potente para estaciones de trabajo profesionales y gaming de alto nivel.	191.87	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.925115	2026-04-18 10:10:28.639472
553	2	25	\N	mb socket am4 amd	mbgba520mkv2	GIGABYTE A520M K V2 (rev. 1.0)	Placa base Micro-ATX diseñada para ofrecer una plataforma estable y duradera para procesadores AMD Ryzen. Cuenta con un diseño de VRM digital de 4+2 fases para garantizar la eficiencia energética y la longevidad de los componentes. Incluye una ranura M.2 de alta velocidad, LAN de GbE con gestión de ancho de banda y tecnología Smart Fan 5 para un control térmico optimizado. Es la solución ideal para configuraciones corporativas y de productividad que buscan un rendimiento confiable con un presupuesto optimizado.	43.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.941051	2026-04-18 10:15:04.923936
554	2	25	\N	mb socket am5 amd	mbgba620ms2h	GIGABYTE A620M S2H (rev. 1.0)	Placa base Micro-ATX esencial para la plataforma AM5, diseñada para ofrecer eficiencia y estabilidad en tareas de productividad. Cuenta con un diseño de VRM digital de 5+2+2 fases, soporte para memoria DDR5 de alta frecuencia y tecnología Smart Fan 6 para una gestión térmica silenciosa. Incorpora la función Q-Flash Plus, que permite actualizar la BIOS sin necesidad de instalar el procesador o la memoria, facilitando el soporte para nuevas generaciones de CPUs Ryzen.	91.50	9	f	\N	\N	\N	\N	2026-04-15 17:02:11.94317	2026-04-18 10:16:34.678871
556	2	25	\N	mb socket am4 amd gaming	mbgbb550eagwf6	GIGABYTE B550 EAGLE WIFI6	Placa base ATX diseñada para ofrecer estabilidad y durabilidad en entornos de alto rendimiento. Equipada con un sistema de alimentación digital de 6+2 fases y disipadores térmicos ampliados, garantiza un funcionamiento fresco incluso bajo carga. Incorpora tecnología Wi-Fi 6 integrada para conexiones inalámbricas de alta velocidad y baja latencia, además de LAN Gigabit. Soporta PCIe 4.0 para aprovechar los SSD y tarjetas gráficas más veloces, e incluye el botón Q-Flash Plus para actualizaciones de BIOS sin necesidad de instalar componentes adicionales.	107.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.946038	2026-04-18 10:20:05.661757
557	2	25	\N	mb socket am4 amd gaming	mbgbb550gmgxv2	GIGABYTE B550 GAMING X V2 (rev. 1.0)	Placa base ATX diseñada para ofrecer un rendimiento equilibrado y duradero. Cuenta con un diseño de VRM digital de 10+3 fases que garantiza la estabilidad incluso con procesadores Ryzen de alto conteo de núcleos. Soporta la tecnología PCIe 4.0 para las últimas tarjetas gráficas y SSDs NVMe, permitiendo velocidades de transferencia superiores. Incluye LAN de alta velocidad, audio de alta fidelidad y la función Q-Flash Plus para actualizaciones de BIOS rápidas. Su diseño térmico está optimizado para mantener los componentes frescos durante jornadas de trabajo intensivas.	101.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.947401	2026-04-18 10:21:18.429697
559	2	25	\N	mb socket am4 amd	mbgbb550mds3hr2	GIGABYTE B550M DS3H AC (rev. 1.0/1.1/1.2/1.3)	Placa base Micro-ATX diseñada para maximizar la eficiencia y el rendimiento en la plataforma AM4. Cuenta con un diseño de VRM digital de 5+3 fases que asegura la estabilidad de los procesadores Ryzen. Destaca por ofrecer soporte nativo para PCIe 4.0, permitiendo velocidades de almacenamiento y gráficos de última generación. Incluye doble ranura M.2, LAN de alta velocidad con gestión de ancho de banda y la tecnología Q-Flash Plus, que facilita la actualización de la BIOS sin necesidad de instalar CPU o memoria, garantizando compatibilidad total con las series más recientes	78.50	1	f	\N	\N	\N	\N	2026-04-15 17:02:11.953236	2026-04-18 10:48:24.58421
561	2	25	\N	mb socket am4 amd	mbgbb550mk	GIGABYTE B550M K (rev. 1.0)	Placa base Micro-ATX diseñada para ofrecer una plataforma sólida y esencial para procesadores AMD Ryzen. A pesar de su diseño compacto y sencillo, ofrece soporte nativo para PCIe 4.0, permitiendo aprovechar la velocidad de las tarjetas gráficas y SSDs de última generación. Cuenta con un diseño de VRM digital eficiente, LAN de GbE con gestión de ancho de banda y tecnología Smart Fan 5. Incluye doble ranura M.2 para una expansión de almacenamiento versátil, siendo la solución perfecta para productividad corporativa y ensambles de oficina modernos	65.50	21	f	\N	\N	\N	\N	2026-04-15 17:02:11.956296	2026-04-18 10:58:29.608489
640	2	19	\N	mb socket am5 amd	mbmsb840m-bpro	MSI PRO B840M-B	Placa base de la serie profesional de MSI, diseñada para ofrecer un entorno de trabajo estable y eficiente con procesadores AMD Ryzen. Su diseño simplificado y robusto prioriza la longevidad de los componentes mediante tecnologías como Steel Armor para proteger la ranura de la tarjeta gráfica. Incluye soporte para memoria DDR5 de alta velocidad y almacenamiento NVMe PCIe 4.0, garantizando tiempos de carga rápidos en aplicaciones de oficina y desarrollo. Es la solución perfecta para despliegues corporativos que requieren la modernidad del socket AM5 con una gestión térmica y energética eficiente	73.00	21	f	\N	\N	\N	\N	2026-04-15 17:02:12.08542	2026-04-18 11:09:14.827557
562	2	25	\N	mb socket am5 amd gaming	mbgbb650aoraxic	GIGABYTE B650 AORUS ELITE AX ICE	Placa base ATX de edición premium con estética 'All-White', diseñada para ofrecer un rendimiento excepcional en la plataforma AM5. Cuenta con una solución de alimentación digital de 12+2+2 fases para una entrega de energía ultra estable. Destaca por su conectividad de vanguardia con Wi-Fi 6E, LAN de 2.5 Gb y soporte para almacenamiento M.2 PCIe 5.0. Incorpora disipadores térmicos de gran tamaño con tecnología M.2 Thermal Guard y el sistema EZ-Latch para una instalación sencilla de componentes, combinando un diseño visual único con la máxima durabilidad de la línea AORUS	184.50	8	f	\N	\N	\N	\N	2026-04-15 17:02:11.95815	2026-04-18 11:57:25.573479
\.


--
-- Data for Name: specs_almacenamiento; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.specs_almacenamiento (id_producto, tipo_almacenamiento, capacidad_gb, interfaz, form_factor, velocidad_lectura_mbps, velocidad_escritura_mbps, nvme_gen, created_at, updated_at) FROM stdin;
1	ssd_sata	240	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.122439	2026-04-15 17:02:11.122439
2	ssd_sata	480	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.128217	2026-04-15 17:02:11.128217
3	ssd_nvme	\N	NVME	M.2	\N	\N	\N	2026-04-15 17:02:11.131618	2026-04-15 17:02:11.131618
4	ssd_sata	2048	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.134889	2026-04-15 17:02:11.134889
5	ssd_sata	256	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.137108	2026-04-15 17:02:11.137108
6	ssd_sata	512	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.139397	2026-04-15 17:02:11.139397
7	ssd_nvme	512	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.142652	2026-04-15 17:02:11.142652
8	ssd_sata	1024	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.145503	2026-04-15 17:02:11.145503
9	ssd_sata	256	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.147607	2026-04-15 17:02:11.147607
10	ssd_sata	512	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.149541	2026-04-15 17:02:11.149541
11	ssd_nvme	2048	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.152132	2026-04-15 17:02:11.152132
12	ssd_nvme	500	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.153977	2026-04-15 17:02:11.153977
13	ssd_sata	240	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.156244	2026-04-15 17:02:11.156244
14	ssd_sata	480	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.159324	2026-04-15 17:02:11.159324
15	ssd_sata	960	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.162317	2026-04-15 17:02:11.162317
16	ssd_nvme	1000	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.164475	2026-04-15 17:02:11.164475
17	ssd_nvme	2000	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.166613	2026-04-15 17:02:11.166613
18	ssd_nvme	4000	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.168405	2026-04-15 17:02:11.168405
19	ssd_nvme	500	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.17014	2026-04-15 17:02:11.17014
20	ssd_sata	1920	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.172146	2026-04-15 17:02:11.172146
21	ssd_sata	3840	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.17417	2026-04-15 17:02:11.17417
22	ssd_sata	480	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.176459	2026-04-15 17:02:11.176459
23	ssd_sata	7680	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.178625	2026-04-15 17:02:11.178625
24	ssd_sata	960	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.180433	2026-04-15 17:02:11.180433
25	ssd_nvme	1024	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.182039	2026-04-15 17:02:11.182039
26	ssd_nvme	2048	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.183752	2026-04-15 17:02:11.183752
27	ssd_nvme	4096	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.185496	2026-04-15 17:02:11.185496
28	ssd_nvme	1024	NVME	M.2	\N	\N	GEN5	2026-04-15 17:02:11.18783	2026-04-15 17:02:11.18783
29	ssd_nvme	2048	NVME	M.2	\N	\N	GEN5	2026-04-15 17:02:11.189459	2026-04-15 17:02:11.189459
30	ssd_nvme	4096	NVME	M.2	\N	\N	GEN5	2026-04-15 17:02:11.191157	2026-04-15 17:02:11.191157
31	ssd_nvme	1024	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.193592	2026-04-15 17:02:11.193592
32	ssd_nvme	4096	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.195893	2026-04-15 17:02:11.195893
33	ssd_sata	256	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.197479	2026-04-15 17:02:11.197479
34	ssd_sata	512	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.199478	2026-04-15 17:02:11.199478
35	ssd_sata	500	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.202479	2026-04-15 17:02:11.202479
36	ssd_nvme	1024	NVME	M.2	\N	\N	GEN5	2026-04-15 17:02:11.204754	2026-04-15 17:02:11.204754
37	ssd_nvme	2048	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.20682	2026-04-15 17:02:11.20682
38	ssd_nvme	1024	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.209544	2026-04-15 17:02:11.209544
39	ssd_nvme	2048	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.211709	2026-04-15 17:02:11.211709
40	ssd_nvme	1024	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.216058	2026-04-15 17:02:11.216058
41	ssd_nvme	500	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.218301	2026-04-15 17:02:11.218301
42	ssd_nvme	2048	NVME	M.2	\N	\N	GEN3	2026-04-15 17:02:11.22036	2026-04-15 17:02:11.22036
43	ssd_sata	1024	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.22221	2026-04-15 17:02:11.22221
44	ssd_nvme	4096	NVME	M.2	\N	\N	\N	2026-04-15 17:02:11.224208	2026-04-15 17:02:11.224208
45	hdd	8192	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.228085	2026-04-15 17:02:11.228085
46	ssd_sata	1024	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.230693	2026-04-15 17:02:11.230693
47	ssd_sata	256	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.232443	2026-04-15 17:02:11.232443
48	ssd_sata	512	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.234282	2026-04-15 17:02:11.234282
49	ssd_sata	256	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.235793	2026-04-15 17:02:11.235793
50	ssd_nvme	500	NVME	M.2	\N	\N	\N	2026-04-15 17:02:11.237484	2026-04-15 17:02:11.237484
51	ssd_nvme	1024	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.239421	2026-04-15 17:02:11.239421
52	ssd_nvme	2048	NVME	M.2	\N	\N	GEN4	2026-04-15 17:02:11.241512	2026-04-15 17:02:11.241512
53	ssd_nvme	1024	NVME	M.2	\N	\N	\N	2026-04-15 17:02:11.24395	2026-04-15 17:02:11.24395
54	ssd_nvme	256	NVME	M.2	\N	\N	\N	2026-04-15 17:02:11.245388	2026-04-15 17:02:11.245388
55	ssd_sata	1024	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.246932	2026-04-15 17:02:11.246932
56	ssd_sata	256	SATA	2.5	\N	\N	\N	2026-04-15 17:02:11.248464	2026-04-15 17:02:11.248464
57	ssd_sata	1024	SATA	M.2	\N	\N	\N	2026-04-15 17:02:11.250013	2026-04-15 17:02:11.250013
58	ssd_sata	512	SATA	M.2	\N	\N	\N	2026-04-15 17:02:11.25161	2026-04-15 17:02:11.25161
59	ssd_nvme	500	NVME	M.2	\N	\N	\N	2026-04-15 17:02:11.253128	2026-04-15 17:02:11.253128
60	ssd_sata	256	SATA	M.2	\N	\N	\N	2026-04-15 17:02:11.255403	2026-04-15 17:02:11.255403
61	hdd	12288	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.258586	2026-04-15 17:02:11.258586
62	hdd	14336	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.262452	2026-04-15 17:02:11.262452
63	hdd	14336	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.264165	2026-04-15 17:02:11.264165
64	hdd	16384	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.265769	2026-04-15 17:02:11.265769
65	hdd	18432	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.267621	2026-04-15 17:02:11.267621
66	hdd	2048	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.269837	2026-04-15 17:02:11.269837
67	hdd	2048	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.272313	2026-04-15 17:02:11.272313
68	hdd	10240	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.273752	2026-04-15 17:02:11.273752
69	hdd	8192	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.275884	2026-04-15 17:02:11.275884
70	hdd	12288	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.277588	2026-04-15 17:02:11.277588
71	hdd	8192	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.279588	2026-04-15 17:02:11.279588
72	hdd	6144	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.281271	2026-04-15 17:02:11.281271
73	hdd	12288	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.282958	2026-04-15 17:02:11.282958
74	hdd	14336	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.28504	2026-04-15 17:02:11.28504
75	hdd	18432	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.286573	2026-04-15 17:02:11.286573
76	hdd	1024	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.288199	2026-04-15 17:02:11.288199
77	hdd	6144	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.290193	2026-04-15 17:02:11.290193
78	hdd	4096	SATA	\N	\N	\N	\N	2026-04-15 17:02:11.292493	2026-04-15 17:02:11.292493
\.


--
-- Data for Name: specs_case; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.specs_case (id_producto, form_factor, compatibilidad_placa, max_gpu_mm, max_cooler_mm, ventiladores_incluidos, color, panel_lateral, created_at, updated_at) FROM stdin;
159	ATX	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.381069	2026-04-15 17:02:11.381069
160	\N	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	black	\N	2026-04-15 17:02:11.386064	2026-04-15 17:02:11.386064
161	\N	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	white	\N	2026-04-15 17:02:11.387856	2026-04-15 17:02:11.387856
162	\N	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.390676	2026-04-15 17:02:11.390676
163	MICRO-ATX	MICRO-ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.395863	2026-04-15 17:02:11.395863
164	\N	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.397655	2026-04-15 17:02:11.397655
165	ATX	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.399336	2026-04-15 17:02:11.399336
166	\N	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.401612	2026-04-15 17:02:11.401612
167	\N	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.403008	2026-04-15 17:02:11.403008
168	MINI-ITX	MINI-ITX,MICRO-ATX,MINI-ITX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.404411	2026-04-15 17:02:11.404411
169	MINI-ITX	MINI-ITX,MICRO-ATX,MINI-ITX	\N	\N	\N	black	\N	2026-04-15 17:02:11.406227	2026-04-15 17:02:11.406227
170	MINI-ITX	MINI-ITX,MICRO-ATX,MINI-ITX	\N	\N	\N	white	\N	2026-04-15 17:02:11.408572	2026-04-15 17:02:11.408572
171	\N	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.411065	2026-04-15 17:02:11.411065
172	\N	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.412691	2026-04-15 17:02:11.412691
173	\N	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.413948	2026-04-15 17:02:11.413948
174	ATX	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.415278	2026-04-15 17:02:11.415278
175	\N	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.4168	2026-04-15 17:02:11.4168
176	\N	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.418114	2026-04-15 17:02:11.418114
177	MICRO-ATX	MICRO-ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.420186	2026-04-15 17:02:11.420186
178	MICRO-ATX	MICRO-ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	blanco	\N	2026-04-15 17:02:11.421777	2026-04-15 17:02:11.421777
179	MICRO-ATX	MICRO-ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.423173	2026-04-15 17:02:11.423173
180	MICRO-ATX	MICRO-ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.425276	2026-04-15 17:02:11.425276
181	MICRO-ATX	MICRO-ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.427411	2026-04-15 17:02:11.427411
182	MICRO-ATX	MICRO-ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.429374	2026-04-15 17:02:11.429374
183	ATX	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.431055	2026-04-15 17:02:11.431055
184	ATX	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.432317	2026-04-15 17:02:11.432317
185	ATX	ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.43368	2026-04-15 17:02:11.43368
186	MICRO-ATX	MICRO-ATX,MICRO-ATX,MINI-ITX	\N	\N	\N	negro	\N	2026-04-15 17:02:11.435471	2026-04-15 17:02:11.435471
\.


--
-- Data for Name: specs_fuente; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.specs_fuente (id_producto, wattage, certificacion, modular, form_factor, pcie_conectores, sata_conectores, created_at, updated_at) FROM stdin;
239	1000	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.493611	2026-04-15 17:02:11.493611
240	850	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.496908	2026-04-15 17:02:11.496908
241	1000	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.498521	2026-04-15 17:02:11.498521
242	650	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.500029	2026-04-15 17:02:11.500029
243	750	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.501452	2026-04-15 17:02:11.501452
244	850	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.502917	2026-04-15 17:02:11.502917
245	1000	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.5047	2026-04-15 17:02:11.5047
246	650	80 PLUS BRONZE	no_modular	ATX	\N	\N	2026-04-15 17:02:11.507397	2026-04-15 17:02:11.507397
247	1300	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.509404	2026-04-15 17:02:11.509404
248	1200	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.510862	2026-04-15 17:02:11.510862
249	1300	80 PLUS TITANIUM	no_modular	ATX	\N	\N	2026-04-15 17:02:11.512183	2026-04-15 17:02:11.512183
250	1650	80 PLUS TITANIUM	no_modular	ATX	\N	\N	2026-04-15 17:02:11.513882	2026-04-15 17:02:11.513882
251	750	80 PLUS	no_modular	ATX	\N	\N	2026-04-15 17:02:11.515555	2026-04-15 17:02:11.515555
252	850	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.516904	2026-04-15 17:02:11.516904
253	1000	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.518411	2026-04-15 17:02:11.518411
254	\N	\N	no_modular	\N	\N	\N	2026-04-15 17:02:11.519993	2026-04-15 17:02:11.519993
255	\N	\N	no_modular	\N	\N	\N	2026-04-15 17:02:11.521573	2026-04-15 17:02:11.521573
256	\N	\N	no_modular	\N	\N	\N	2026-04-15 17:02:11.522786	2026-04-15 17:02:11.522786
257	1000	80 PLUS PLATINUM	no_modular	ATX	\N	\N	2026-04-15 17:02:11.52566	2026-04-15 17:02:11.52566
258	850	80 PLUS PLATINUM	no_modular	\N	\N	\N	2026-04-15 17:02:11.527551	2026-04-15 17:02:11.527551
259	850	80 PLUS PLATINUM	no_modular	ATX	\N	\N	2026-04-15 17:02:11.528912	2026-04-15 17:02:11.528912
260	1300	80 PLUS GOLD	no_modular	\N	\N	\N	2026-04-15 17:02:11.530366	2026-04-15 17:02:11.530366
261	550	80 PLUS SILVER	no_modular	ATX	\N	\N	2026-04-15 17:02:11.53163	2026-04-15 17:02:11.53163
262	550	80 PLUS SILVER	no_modular	ATX	\N	\N	2026-04-15 17:02:11.533417	2026-04-15 17:02:11.533417
263	650	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.535827	2026-04-15 17:02:11.535827
264	650	80 PLUS	no_modular	ATX	\N	\N	2026-04-15 17:02:11.538042	2026-04-15 17:02:11.538042
265	650	80 PLUS SILVER	no_modular	ATX	\N	\N	2026-04-15 17:02:11.539957	2026-04-15 17:02:11.539957
266	1600	80 PLUS PLATINUM	no_modular	\N	\N	\N	2026-04-15 17:02:11.542127	2026-04-15 17:02:11.542127
267	750	80 PLUS GOLD	no_modular	\N	\N	\N	2026-04-15 17:02:11.544476	2026-04-15 17:02:11.544476
268	850	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.546494	2026-04-15 17:02:11.546494
269	\N	\N	no_modular	\N	\N	\N	2026-04-15 17:02:11.548428	2026-04-15 17:02:11.548428
270	\N	\N	no_modular	\N	\N	\N	2026-04-15 17:02:11.550308	2026-04-15 17:02:11.550308
271	1000	80 PLUS GOLD	no_modular	ATX	\N	\N	2026-04-15 17:02:11.552	2026-04-15 17:02:11.552
272	850	80 PLUS PLATINUM	no_modular	ATX	\N	\N	2026-04-15 17:02:11.553763	2026-04-15 17:02:11.553763
273	250	\N	no_modular	ATX	\N	\N	2026-04-15 17:02:11.55543	2026-04-15 17:02:11.55543
274	1000	\N	no_modular	ATX	\N	\N	2026-04-15 17:02:11.557182	2026-04-15 17:02:11.557182
\.


--
-- Data for Name: specs_gpu; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.specs_gpu (id_producto, chipset, vram_gb, vram_tipo, bus_bits, boost_mhz, tdp_w, longitud_mm, fuente_recomendada_w, created_at, updated_at) FROM stdin;
275	RX 9070	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.561768	2026-04-15 17:02:11.561768
276	RX 9060	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.567016	2026-04-15 17:02:11.567016
277	RX 9060	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.569292	2026-04-15 17:02:11.569292
278	RX 9060	8	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.571121	2026-04-15 17:02:11.571121
279	RX 9070	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.57253	2026-04-15 17:02:11.57253
280	RX 9070	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.57439	2026-04-15 17:02:11.57439
281	RX 9070	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.577436	2026-04-15 17:02:11.577436
282	ARC A380	6	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.579201	2026-04-15 17:02:11.579201
283	ARC B570	10	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.580962	2026-04-15 17:02:11.580962
284	ARC B580	12	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.583238	2026-04-15 17:02:11.583238
285	RTX 3050	6	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.585153	2026-04-15 17:02:11.585153
286	RTX5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.587213	2026-04-15 17:02:11.587213
287	RTX5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.589139	2026-04-15 17:02:11.589139
288	RTX5060	16	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.591062	2026-04-15 17:02:11.591062
289	RTX5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.594053	2026-04-15 17:02:11.594053
290	RX9060	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.595797	2026-04-15 17:02:11.595797
291	RTX5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.597228	2026-04-15 17:02:11.597228
292	RX9070	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.598407	2026-04-15 17:02:11.598407
293	RTX5080	16	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.600904	2026-04-15 17:02:11.600904
294	RTX 5070	12	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.602669	2026-04-15 17:02:11.602669
295	RX 9070	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.603908	2026-04-15 17:02:11.603908
296	\N	2	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:11.605393	2026-04-15 17:02:11.605393
297	RTX 5050	8	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.606649	2026-04-15 17:02:11.606649
298	RTX 5050	8	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.609572	2026-04-15 17:02:11.609572
299	RTX 5050	8	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.611522	2026-04-15 17:02:11.611522
300	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.613133	2026-04-15 17:02:11.613133
301	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.616275	2026-04-15 17:02:11.616275
302	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.618029	2026-04-15 17:02:11.618029
303	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.620202	2026-04-15 17:02:11.620202
304	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.622352	2026-04-15 17:02:11.622352
305	RTX 5060	16	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.624268	2026-04-15 17:02:11.624268
306	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.626322	2026-04-15 17:02:11.626322
307	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.629204	2026-04-15 17:02:11.629204
308	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.630757	2026-04-15 17:02:11.630757
309	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.632077	2026-04-15 17:02:11.632077
310	RTX 5070	12	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.634013	2026-04-15 17:02:11.634013
311	RTX 5070	12	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.635423	2026-04-15 17:02:11.635423
312	RTX 5070	12	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.636896	2026-04-15 17:02:11.636896
313	RTX 5070	16	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.638205	2026-04-15 17:02:11.638205
314	RTX 5090	32	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.639678	2026-04-15 17:02:11.639678
315	\N	2	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:11.64142	2026-04-15 17:02:11.64142
316	RX 7600	8	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.644523	2026-04-15 17:02:11.644523
317	RX 7700	12	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.646007	2026-04-15 17:02:11.646007
318	RX 9060	8	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.647346	2026-04-15 17:02:11.647346
319	RX 9070	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.648558	2026-04-15 17:02:11.648558
320	RTX 3050	6	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.649816	2026-04-15 17:02:11.649816
321	RTX 3050	6	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.651249	2026-04-15 17:02:11.651249
322	RTX 5050	8	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.653017	2026-04-15 17:02:11.653017
323	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.654584	2026-04-15 17:02:11.654584
324	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.656061	2026-04-15 17:02:11.656061
325	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.658101	2026-04-15 17:02:11.658101
326	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.660304	2026-04-15 17:02:11.660304
327	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.662773	2026-04-15 17:02:11.662773
328	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.664271	2026-04-15 17:02:11.664271
329	RTX 5070	12	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.665789	2026-04-15 17:02:11.665789
330	RTX 5080	16	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.66767	2026-04-15 17:02:11.66767
331	RTX5070	12	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.669524	2026-04-15 17:02:11.669524
332	RTX5070	12	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.671397	2026-04-15 17:02:11.671397
333	\N	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.673192	2026-04-15 17:02:11.673192
334	RTX 5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.676161	2026-04-15 17:02:11.676161
335	RTX5060	8	GDDR7	\N	\N	\N	\N	\N	2026-04-15 17:02:11.678055	2026-04-15 17:02:11.678055
336	RX 9060	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.680011	2026-04-15 17:02:11.680011
337	RX 9070	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.681364	2026-04-15 17:02:11.681364
338	RX 9070	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.682682	2026-04-15 17:02:11.682682
339	RX 9070	16	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:11.684694	2026-04-15 17:02:11.684694
340	RX 9070	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.686263	2026-04-15 17:02:11.686263
341	RX 7600	8	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.688057	2026-04-15 17:02:11.688057
342	RX 9060	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.689729	2026-04-15 17:02:11.689729
343	RX 9060	\N	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:11.691601	2026-04-15 17:02:11.691601
344	RX 9070	16	GDDR6	\N	\N	\N	\N	\N	2026-04-15 17:02:11.693579	2026-04-15 17:02:11.693579
345	RX 9070	16	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:11.695078	2026-04-15 17:02:11.695078
\.


--
-- Data for Name: specs_placa_madre; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.specs_placa_madre (id_producto, socket, chipset, form_factor, ram_tipo, max_ram_gb, slots_ram, pcie_version, m2_slots, created_at, updated_at) FROM stdin;
502	LGA 1851	H810M	\N	DDR5	\N	\N	\N	\N	2026-04-15 17:02:11.854142	2026-04-15 17:02:11.854142
558	AM4	B550M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.952533	2026-04-15 17:02:11.952533
563	AM5	B650	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.960965	2026-04-15 17:02:11.960965
564	AM5	B650	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.963041	2026-04-15 17:02:11.963041
565	AM5	B650	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.964557	2026-04-15 17:02:11.964557
566	AM5	B650M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.966244	2026-04-15 17:02:11.966244
567	AM5	B650M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.968011	2026-04-15 17:02:11.968011
568	AM5	B650M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.969551	2026-04-15 17:02:11.969551
569	AM5	B650M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.970935	2026-04-15 17:02:11.970935
570	AM5	B650M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.972322	2026-04-15 17:02:11.972322
571	AM5	B650M	\N	DDR5	\N	\N	\N	\N	2026-04-15 17:02:11.973774	2026-04-15 17:02:11.973774
572	LGA1700	B760	ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:11.975887	2026-04-15 17:02:11.975887
573	LGA1700	B760M	MICRO-ATX	DDR4	\N	\N	\N	\N	2026-04-15 17:02:11.977391	2026-04-15 17:02:11.977391
574	LGA1700	B760M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:11.978893	2026-04-15 17:02:11.978893
575	LGA1700	B760M	MICRO-ATX	DDR4	\N	\N	\N	\N	2026-04-15 17:02:11.980229	2026-04-15 17:02:11.980229
576	LGA1700	B760M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:11.981764	2026-04-15 17:02:11.981764
577	LGA1700	B760M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:11.983719	2026-04-15 17:02:11.983719
578	LGA1700	B760M	MICRO-ATX	DDR4	\N	\N	\N	\N	2026-04-15 17:02:11.985218	2026-04-15 17:02:11.985218
579	LGA1700	B760M	MICRO-ATX	DDR4	\N	\N	\N	\N	2026-04-15 17:02:11.986727	2026-04-15 17:02:11.986727
580	AM5	B840M	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:11.988617	2026-04-15 17:02:11.988617
581	AM5	B840M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.990134	2026-04-15 17:02:11.990134
582	AM5	B840M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.992346	2026-04-15 17:02:11.992346
583	AM5	B850	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:11.994021	2026-04-15 17:02:11.994021
584	AM5	B850	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.995121	2026-04-15 17:02:11.995121
585	AM5	B850	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:11.996167	2026-04-15 17:02:11.996167
586	AM5	B850M	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:11.99739	2026-04-15 17:02:11.99739
587	AM5	B850M	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:11.99983	2026-04-15 17:02:11.99983
588	AM5	B850M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.001468	2026-04-15 17:02:12.001468
589	AM5	B850M	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.002976	2026-04-15 17:02:12.002976
590	AM5	B850M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.004373	2026-04-15 17:02:12.004373
591	LGA1851	B860M	\N	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.00579	2026-04-15 17:02:12.00579
592	LGA 1851	B860M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.007383	2026-04-15 17:02:12.007383
593	LGA 1851	B860M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.011557	2026-04-15 17:02:12.011557
547	AM5	AMD B850	Micro-ATX	DDR5	192	4	PCIe 5.0 x16	3	2026-04-15 17:02:11.932539	2026-04-18 11:10:20.192697
549	LGA 1851	Intel B860	Micro-ATX	DDR5	192	4	PCIe 4.0 x16	3	2026-04-15 17:02:11.93532	2026-04-18 11:10:48.262314
550	LGA 1851	Intel Z890	ATX	DDR5	192	4	PCIe 5.0 x16	4	2026-04-15 17:02:11.937032	2026-04-18 11:50:50.602773
562	AM5	AMD B650	ATX	DDR5	192	4	PCIe 5.0	3	2026-04-15 17:02:11.95921	2026-04-18 11:57:25.585659
552	LGA 1851	Intel Z890	E-ATX	DDR5	192	4	PCIe 5.0 x16	5	2026-04-15 17:02:11.940224	2026-04-16 18:02:39.915744
496	LGA 1700	Intel B760	Micro-ATX	DDR5	192	4	PCIe 5.0 x16	3	2026-04-15 17:02:11.844751	2026-04-16 18:04:35.998011
497	LGA 1700	Intel B760	Micro-ATX	DDR4	128	4	PCIe 4.0 x16	2	2026-04-15 17:02:11.846421	2026-04-16 18:06:00.937168
493	AM4	AMD B550	ATX	DDR4	128	4	PCIe 4.0 x16	2	2026-04-15 17:02:11.838857	2026-04-16 17:42:41.920372
495	LGA 1700	Intel B760	Micro-ATX	DDR5	192	4	PCIe 4.0 x16	3	2026-04-15 17:02:11.842761	2026-04-16 17:47:00.219522
494	AM5	AMD B650	Micro-ATX	DDR5	192	2	PCIe 4.0 x16	2	2026-04-15 17:02:11.840544	2026-04-16 17:44:10.611052
498	AM5	AMD B850	ATX	DDR5	192	4	PCIe 5.0 x16	4	2026-04-15 17:02:11.847778	2026-04-16 18:07:41.207054
500	AM5	AMD B850	Micro-ATX	DDR5	128	2	PCIe 5.0 x16	2	2026-04-15 17:02:11.851074	2026-04-16 18:10:18.321392
501	LGA 1700	Intel H610	Micro-ATX	DDR5	96	2	PCIe 4.0 x16	1	2026-04-15 17:02:11.852549	2026-04-16 18:11:44.038867
507	AM5	AMD B650	Micro-ATX	DDR5	192	2	PCIe 4.0 x16	2	2026-04-15 17:02:11.86409	2026-04-16 18:24:46.254413
504	LGA 4677	Intel W790	E-ATX	DDR5	2048	8	PCIe 5.0 x16	4	2026-04-15 17:02:11.857205	2026-04-16 18:21:15.830857
505	LGA 1851	Intel Z890	ATX	DDR5	192	4	PCIe 5.0 x16	5	2026-04-15 17:02:11.860891	2026-04-16 18:23:12.553851
509	AM5	AMD A620	Micro-ATX	DDR5	96	2	PCIe 4.0 x16	1	2026-04-15 17:02:11.867039	2026-04-16 18:27:30.045718
510	AM4	AMD B550	Micro-ATX	DDR4	128	2	PCIe 4.0 x16	2	2026-04-15 17:02:11.868498	2026-04-16 18:28:41.368575
512	AM5	AMD B650	Micro-ATX	DDR5	96	2	PCIe 4.0 x16	1	2026-04-15 17:02:11.871591	2026-04-16 18:31:24.061882
513	LGA 1700	Intel B760	Micro-ATX	DDR5	192	4	PCIe 4.0 x16	3	2026-04-15 17:02:11.872853	2026-04-16 18:32:49.943693
516	LGA 1700	Intel B760	Micro-ATX	DDR5	96	2	PCIe 4.0 x16	2	2026-04-15 17:02:11.879519	2026-04-16 18:42:29.508037
515	LGA 1700	Intel B760	Micro-ATX	DDR4	64	2	PCIe 4.0 x16	2	2026-04-15 17:02:11.877214	2026-04-16 18:41:21.091199
517	AM5	AMD B850	Micro-ATX	DDR5	192	4	PCIe 5.0 x16	3	2026-04-15 17:02:11.881283	2026-04-16 18:43:23.88917
519	LGA 1851	Intel H810	Micro-ATX	DDR5	96	2	PCIe 4.0/5.0	1	2026-04-15 17:02:11.884524	2026-04-16 18:45:35.637285
520	AM5	AMD X870	ATX	DDR5	192	4	PCIe 5.0 x16	4	2026-04-15 17:02:11.88641	2026-04-16 18:47:10.133205
521	LGA 1851	Intel Z890	ATX	DDR5	192	4	PCIe 5.0 x16	4	2026-04-15 17:02:11.888122	2026-04-16 18:50:57.82438
525	AM5	AMD B650E	ATX	DDR5	192	4	PCIe 5.0	4	2026-04-15 17:02:11.89551	2026-04-18 09:29:30.533198
523	LGA 1851	Intel Z890	ATX	DDR5	192	4	PCIe 5.0	6	2026-04-15 17:02:11.891662	2026-04-18 09:16:28.233127
524	AM4	AMD B550	ATX	DDR4	128	4	PCIe 4.0	2	2026-04-15 17:02:11.894023	2026-04-18 09:28:14.834635
527	AM5	AMD B850	ATX	DDR5	192	4	PCIe 5.0	4	2026-04-15 17:02:11.898672	2026-04-18 09:36:09.903464
528	LGA 1851	Intel B860	ATX	DDR5	192	4	PCIe 5.0	3	2026-04-15 17:02:11.900902	2026-04-18 09:37:29.838643
530	AM5	AMD X870	ATX	DDR5	192	4	PCIe 5.0	4	2026-04-15 17:02:11.903628	2026-04-18 09:41:05.031479
531	AM5	AMD X870E	ATX	DDR5	192	4	PCIe 5.0	5	2026-04-15 17:02:11.905179	2026-04-18 09:43:19.821487
533	LGA 1851	Intel Z890	ATX	DDR5	192	4	PCIe 5.0	4	2026-04-15 17:02:11.908535	2026-04-18 09:46:23.647885
534	LGA 1851	Intel Z890	ATX	DDR5	192	4	PCIe 5.0	4	2026-04-15 17:02:11.910659	2026-04-18 09:47:24.602831
535	AM5	AMD A620	Micro-ATX	DDR5	192	4	PCIe 4.0	2	2026-04-15 17:02:11.912378	2026-04-18 09:49:42.569027
537	AM5	AMD B650	Micro-ATX	DDR5	192	4	PCIe 5.0	2	2026-04-15 17:02:11.916026	2026-04-18 09:52:31.507988
538	LGA 1700	Intel B760	ATX	DDR5	192	4	PCIe 5.0	3	2026-04-15 17:02:11.917656	2026-04-18 09:54:59.41822
540	AM5	AMD B850	ATX	DDR5	192	4	PCIe 5.0	3	2026-04-15 17:02:11.921201	2026-04-18 10:05:02.56129
541	AM5	AMD B850	Micro-ATX	DDR5	192	4	PCIe 5.0	2	2026-04-15 17:02:11.922775	2026-04-18 10:06:08.7274
542	LGA 1851	Intel B860	ATX	DDR5	192	4	PCIe 5.0	3	2026-04-15 17:02:11.924265	2026-04-18 10:09:15.902061
544	LGA 1851	Intel Z890	ATX	DDR5	192	4	PCIe 5.0	4	2026-04-15 17:02:11.928114	2026-04-18 10:11:51.310995
553	AM4	AMD A520	Micro-ATX	DDR4	64	2	PCIe 3.0	1	2026-04-15 17:02:11.942103	2026-04-18 10:15:04.992913
555	AM4	AMD B550	ATX	DDR4	128	4	PCIe 4.0	2	2026-04-15 17:02:11.945429	2026-04-18 10:17:43.569851
557	AM4	AMD B550	ATX	DDR4	128	4	PCIe 4.0	2	2026-04-15 17:02:11.949844	2026-04-18 10:21:18.434361
559	AM4	AMD B550	Micro-ATX	DDR4	128	4	PCIe 4.0	2	2026-04-15 17:02:11.954079	2026-04-18 10:48:24.602161
560	AM4	AMD B550	Micro-ATX	DDR4	128	4	PCIe 4.0	2	2026-04-15 17:02:11.955559	2026-04-18 10:50:08.769959
561	AM4	AMD B550	Micro-ATX	DDR4	128	4	PCIe 4.0	2	2026-04-15 17:02:11.957131	2026-04-18 10:58:29.660887
594	LGA 1851	B860M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.013148	2026-04-15 17:02:12.013148
595	LGA 1851	B860M	\N	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.015662	2026-04-15 17:02:12.015662
596	LGA 1851	B860M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.016936	2026-04-15 17:02:12.016936
597	LGA 1851	B860M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.018259	2026-04-15 17:02:12.018259
598	LGA1700	H610M	MICRO-ATX	DDR4	\N	\N	\N	\N	2026-04-15 17:02:12.019495	2026-04-15 17:02:12.019495
599	LGA1700	H610M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.020862	2026-04-15 17:02:12.020862
600	LGA 1851	H810M	ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.022198	2026-04-15 17:02:12.022198
601	LGA 1851	H810M	ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.023464	2026-04-15 17:02:12.023464
602	AM5	X870	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:12.025153	2026-04-15 17:02:12.025153
603	AM5	X870	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.027116	2026-04-15 17:02:12.027116
604	AM5	X870	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.028533	2026-04-15 17:02:12.028533
605	AM5	X870	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.029949	2026-04-15 17:02:12.029949
606	AM5	X870E	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.031364	2026-04-15 17:02:12.031364
607	AM5	X870E	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:12.032586	2026-04-15 17:02:12.032586
608	AM5	X870E	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.033802	2026-04-15 17:02:12.033802
609	AM5	X870M	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:12.034897	2026-04-15 17:02:12.034897
610	AM5	X870M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.035936	2026-04-15 17:02:12.035936
611	LGA1700	Z790	ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.037174	2026-04-15 17:02:12.037174
612	LGA1700	Z790	ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.03856	2026-04-15 17:02:12.03856
613	LGA1700	Z790	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.040437	2026-04-15 17:02:12.040437
614	LGA 1851	Z890	ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.042454	2026-04-15 17:02:12.042454
615	LGA 1851	Z890	ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.044264	2026-04-15 17:02:12.044264
616	LGA 1851	Z890	ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.046392	2026-04-15 17:02:12.046392
617	LGA 1851	Z890	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.047944	2026-04-15 17:02:12.047944
618	LGA 1851	Z890	ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.049427	2026-04-15 17:02:12.049427
619	LGA 1851	Z890	ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.051088	2026-04-15 17:02:12.051088
620	LGA 1851	Z890	ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.052714	2026-04-15 17:02:12.052714
621	LGA 1851	Z890	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.054243	2026-04-15 17:02:12.054243
622	LGA 1851	Z890	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.055882	2026-04-15 17:02:12.055882
623	AM4	B550M	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:12.057932	2026-04-15 17:02:12.057932
624	AM4	B550M	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:12.059999	2026-04-15 17:02:12.059999
625	AM4	B550M	\N	DDR4	\N	\N	\N	\N	2026-04-15 17:02:12.062672	2026-04-15 17:02:12.062672
626	AM5	B650	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.064368	2026-04-15 17:02:12.064368
627	LGA1700	B760M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.065741	2026-04-15 17:02:12.065741
628	AM5	B840M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.06694	2026-04-15 17:02:12.06694
629	AM5	B850	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.068254	2026-04-15 17:02:12.068254
630	LGA 1851	B860	ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.070264	2026-04-15 17:02:12.070264
631	AM5	X870E	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.071798	2026-04-15 17:02:12.071798
632	AM5	B650I	MINI-ITX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.073349	2026-04-15 17:02:12.073349
633	AM5	X870E	ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.075337	2026-04-15 17:02:12.075337
634	AM5	B650M	MICRO-ATX	\N	\N	\N	\N	\N	2026-04-15 17:02:12.077278	2026-04-15 17:02:12.077278
635	LGA1700	B760M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.078876	2026-04-15 17:02:12.078876
636	LGA1700	B760M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.08044	2026-04-15 17:02:12.08044
637	LGA1700	B760M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.081896	2026-04-15 17:02:12.081896
638	LGA1700	B760M	MICRO-ATX	DDR4	\N	\N	\N	\N	2026-04-15 17:02:12.083283	2026-04-15 17:02:12.083283
639	LGA1700	B760M	MICRO-ATX	DDR5	\N	\N	\N	\N	2026-04-15 17:02:12.08474	2026-04-15 17:02:12.08474
645	LGA1700	B760M	MICRO-ATX	DDR4	\N	\N	\N	\N	2026-04-15 17:02:12.094491	2026-04-15 17:02:12.094491
491	Integrado	Integrado	Mini-ITX	DDR4	64	2	PCIe 4.0	3	2026-04-15 17:02:11.832811	2026-04-16 17:38:04.725699
492	AM4	AMD A520	Micro-ATX	DDR4	64	2	PCIe 3.0 x16	1	2026-04-15 17:02:11.83668	2026-04-16 17:40:39.11874
506	AM5	AMD B650	Micro-ATX	DDR5	192	2	PCIe 4.0 x16	2	2026-04-15 17:02:11.862671	2026-04-16 17:48:44.58575
551	LGA 1851	Intel Z890	E-ATX	DDR5	192	4	PCIe 5.0 x16	5	2026-04-15 17:02:11.938694	2026-04-16 18:01:39.243295
499	AM5	AMD B850	Micro-ATX	DDR5	128	2	PCIe 5.0 x16	2	2026-04-15 17:02:11.849617	2026-04-16 18:09:05.890935
503	LGA 1851	Intel H810	Micro-ATX	DDR5	128	2	PCIe 4.0 x16	1	2026-04-15 17:02:11.855738	2026-04-16 18:17:53.768741
508	LGA 1851	Intel B860	Micro-ATX	DDR5	192	4	PCIe 4.0/5.0	3	2026-04-15 17:02:11.865446	2026-04-16 18:26:03.722449
511	AM5	AMD B650	Micro-ATX	DDR5	192	4	PCIe 4.0 x16	3	2026-04-15 17:02:11.870149	2026-04-16 18:30:28.422948
514	LGA 1700	Intel B760	Micro-ATX	DDR5	192	4	PCIe 4.0 x16	3	2026-04-15 17:02:11.874766	2026-04-16 18:33:45.175443
651	AM5	AMD X870E	ATX	DDR5	192	4	PCIe 5.0 x16	4	2026-04-15 17:02:12.102187	2026-04-16 18:37:05.107028
650	AM5	AMD X870	ATX	DDR5	192	4	PCIe 5.0 x16	4	2026-04-15 17:02:12.100963	2026-04-16 18:39:00.662868
518	LGA 1700	Intel H610	Micro-ATX	DDR4	64	2	PCIe 4.0 x16	1	2026-04-15 17:02:11.882935	2026-04-16 18:44:32.339473
649	AM5	AMD X670E	ATX	DDR5	192	4	PCIe 5.0 x16	4	2026-04-15 17:02:12.099867	2026-04-16 18:48:39.876734
643	LGA 1700	Intel H610	Micro-ATX	DDR4	64	2	PCIe 4.0	1	2026-04-15 17:02:12.091454	2026-04-18 09:27:05.920744
522	LGA 1700	Intel H610	Micro-ATX	DDR4	64	2	PCIe 4.0 x16	1	2026-04-15 17:02:11.889608	2026-04-16 18:53:21.649486
648	LGA 1851	Intel Z890	ATX	DDR5	256	4	PCIe 5.0	4	2026-04-15 17:02:12.098595	2026-04-18 09:19:45.532314
647	AM5	AMD X870E	ATX	DDR5	256	4	PCIe 5.0	4	2026-04-15 17:02:12.097209	2026-04-18 09:22:07.734428
646	AM5	AMD X870	ATX	DDR5	256	4	PCIe 5.0	3	2026-04-15 17:02:12.095816	2026-04-18 09:23:45.097052
644	LGA 1851	Intel H810	Micro-ATX	DDR5	96	2	PCIe 4.0	1	2026-04-15 17:02:12.093071	2026-04-18 09:25:39.252394
526	AM5	AMD B850	ATX	DDR5	192	4	PCIe 5.0	3	2026-04-15 17:02:11.897153	2026-04-18 09:34:29.907929
529	LGA 1851	Intel B860	ATX	DDR5	192	4	PCIe 5.0	4	2026-04-15 17:02:11.902357	2026-04-18 09:39:16.3436
532	LGA 1851	Intel Z890	ATX	DDR5	192	4	PCIe 5.0	5	2026-04-15 17:02:11.906644	2026-04-18 09:44:48.733175
642	LGA 1700	Intel H610	Micro-ATX	DDR4	64	2	PCIe 4.0	1	2026-04-15 17:02:12.089503	2026-04-18 09:48:34.988937
536	AM4	AMD B550	ATX	DDR4	128	4	PCIe 4.0	2	2026-04-15 17:02:11.914252	2026-04-18 09:51:29.467855
539	LGA 1700	Intel B760	Micro-ATX	DDR5	192	4	PCIe 5.0	3	2026-04-15 17:02:11.919273	2026-04-18 10:03:53.912609
641	AM5	AMD B840	Micro-ATX	DDR5	256	4	PCIe 4.0	2	2026-04-15 17:02:12.087909	2026-04-18 10:08:13.643448
543	LGA 1851	Intel B860	Micro-ATX	DDR5	192	4	PCIe 5.0	3	2026-04-15 17:02:11.926589	2026-04-18 10:10:28.690038
554	AM5	AMD A620	Micro-ATX	DDR5	96	2	PCIe 4.0	1	2026-04-15 17:02:11.943936	2026-04-18 10:16:34.684868
556	AM4	AMD B550	ATX	DDR4	128	4	PCIe 4.0	2	2026-04-15 17:02:11.946688	2026-04-18 10:20:05.670917
640	AM5	AMD B840	Micro-ATX	DDR5	128	2	PCIe 4.0	1	2026-04-15 17:02:12.08628	2026-04-18 11:09:14.843318
546	AM5	Intel B760	Micro-ATX	DDR5	192	4	PCIe 4.0 x16	2	2026-04-15 17:02:11.931098	2026-04-18 11:09:50.48101
545	LGA 1700	Intel B760	Micro-ATX	DDR5	192	4	PCIe 4.0 x16	2	2026-04-15 17:02:11.929602	2026-04-18 11:10:07.44119
548	LGA 1851	Intel B860	Micro-ATX	DDR5	192	4	PCIe 4.0 x16	3	2026-04-15 17:02:11.934069	2026-04-18 11:10:32.568588
\.


--
-- Data for Name: specs_procesador; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.specs_procesador (id_producto, socket, arquitectura, nucleos, hilos, frecuencia_base_ghz, frecuencia_boost_ghz, tdp_w, graficos_integrados, created_at, updated_at) FROM stdin;
675	\N	\N	\N	\N	\N	\N	\N	f	2026-04-15 17:02:12.146227	2026-04-15 17:02:12.146227
676	LGA1700	\N	\N	\N	4.30	\N	\N	f	2026-04-15 17:02:12.147565	2026-04-15 17:02:12.147565
679	LGA1700	\N	\N	\N	4.90	\N	\N	f	2026-04-15 17:02:12.152341	2026-04-15 17:02:12.152341
697	LGA1700	\N	\N	\N	4.70	\N	\N	f	2026-04-15 17:02:12.183461	2026-04-15 17:02:12.183461
698	LGA1700	\N	\N	\N	4.70	\N	\N	f	2026-04-15 17:02:12.185303	2026-04-15 17:02:12.185303
699	LGA1700	\N	\N	\N	4.90	\N	\N	f	2026-04-15 17:02:12.186945	2026-04-15 17:02:12.186945
693	LGA 1700	Raptor Lake Refresh	20	28	2.10	5.40	65	t	2026-04-15 17:02:12.175162	2026-04-16 17:05:59.170331
680	LGA 1700	Raptor Lake Refresh	20	28	2.10	5.40	65	f	2026-04-15 17:02:12.153812	2026-04-16 17:07:07.237313
681	LGA 1700	Raptor Lake Refresh	20	28	3.40	5.60	125	t	2026-04-15 17:02:12.155289	2026-04-16 17:08:33.233522
682	LGA 1700	Raptor Lake Refresh	20	28	3.40	5.60	125	f	2026-04-15 17:02:12.156541	2026-04-16 17:09:53.131841
652	AM4	Zen 3 (Cezanne)	6	12	3.60	4.20	65	f	2026-04-15 17:02:12.104567	2026-04-16 16:35:11.396197
683	LGA 1700	Alder Lake-S (10 nm / "Intel 7")	16	24	3.20	5.20	125	t	2026-04-15 17:02:12.158011	2026-04-16 17:13:01.78655
684	LGA 1700	Alder Lake-S (10 nm / "Intel 7")	16	24	3.20	5.20	125	f	2026-04-15 17:02:12.159798	2026-04-16 17:14:00.865723
685	LGA 1700	Raptor Lake Refresh	24	32	2.00	5.80	65	t	2026-04-15 17:02:12.161306	2026-04-16 17:16:17.694262
653	AM4	Zen 3 (Cezanne)	6	12	3.60	4.60	65	t	2026-04-15 17:02:12.110142	2026-04-16 16:36:48.242422
686	LGA 1700	Raptor Lake Refresh	24	32	2.00	5.80	65	f	2026-04-15 17:02:12.162748	2026-04-16 17:17:22.011331
687	LGA 1700	Raptor Lake Refresh	24	32	3.20	6.00	125	t	2026-04-15 17:02:12.163889	2026-04-16 17:18:26.726011
688	LGA 1700	Raptor Lake Refresh	24	32	3.20	6.00	125	f	2026-04-15 17:02:12.165109	2026-04-16 17:19:53.210183
689	LGA 1700	Raptor Lake Refresh	24	32	3.20	6.20	150	t	2026-04-15 17:02:12.166851	2026-04-16 17:20:56.131025
690	LGA 1851	Arrow Lake-S (Proceso TSMC para tiles principales)	10	10	3.30	4.70	65	t	2026-04-15 17:02:12.168486	2026-04-16 17:23:45.513515
691	LGA 1851	Arrow Lake-S (proceso avanzado de TSMC)	20	20	2.40	5.40	125	t	2026-04-15 17:02:12.170249	2026-04-16 17:25:00.124411
692	LGA 1851	Arrow Lake-S (Proceso avanzado de TSMC para tiles principales)	24	24	2.50	5.70	125	t	2026-04-15 17:02:12.172083	2026-04-16 17:26:29.770657
677	LGA 1700	\N	\N	\N	4.40	\N	65	f	2026-04-15 17:02:12.149178	2026-04-15 18:11:45.14056
654	AM5	Zen 4 (Raphael)	6	12	3.80	5.10	65	t	2026-04-15 17:02:12.11211	2026-04-16 16:38:04.548737
655	AM5	Zen 4 (Raphael)	6	12	4.70	5.30	105	t	2026-04-15 17:02:12.113396	2026-04-16 16:39:02.548054
656	AM5	Zen 4 (2 núcleos) + Zen 4c (4 núcleos) - "Phoenix 2"	6	12	3.50	5.00	65	t	2026-04-15 17:02:12.114801	2026-04-16 16:40:30.230881
657	AM5	Zen 4 (Phoenix)	6	12	4.30	5.00	65	t	2026-04-15 17:02:12.116882	2026-04-16 16:41:49.565333
658	AM5	Zen 5 (Granite Ridge)	6	12	3.90	5.40	65	t	2026-04-15 17:02:12.118669	2026-04-16 16:43:01.368145
659	AM4	Zen 3 (Cezanne)	8	16	3.70	4.60	65	f	2026-04-15 17:02:12.120386	2026-04-16 16:44:04.595502
660	AM4	Zen 3 (Cezanne)	8	16	3.80	4.60	65	t	2026-04-15 17:02:12.122788	2026-04-16 16:44:52.451191
661	AM4	Zen 3 (Vermeer)	8	16	3.40	4.60	65	f	2026-04-15 17:02:12.125081	2026-04-16 16:45:41.520636
662	AM4	Zen 3 (Vermeer)	8	16	3.80	4.80	105	f	2026-04-15 17:02:12.12719	2026-04-16 16:46:41.272475
663	AM5	Zen 4 (Raphael)	8	16	4.50	5.40	105	t	2026-04-15 17:02:12.129105	2026-04-16 16:47:36.778844
664	AM5	Zen 4 (Raphael)	8	16	4.20	5.00	120	t	2026-04-15 17:02:12.130637	2026-04-16 16:48:36.164397
665	AM5	Zen 4 (Phoenix)	8	16	4.10	5.00	65	f	2026-04-15 17:02:12.13215	2026-04-16 16:49:43.698262
666	AM5	Zen 4 (Phoenix)	8	16	4.20	5.10	65	t	2026-04-15 17:02:12.133488	2026-04-16 16:50:41.363337
667	AM5	Zen 5 (Granite Ridge)	8	16	3.80	5.50	65	t	2026-04-15 17:02:12.134821	2026-04-16 16:51:44.615298
668	AM5	Zen 5 (Granite Ridge)	8	16	4.70	5.20	120	t	2026-04-15 17:02:12.136218	2026-04-16 16:52:36.152986
669	AM4	Zen 3 (Vermeer)	16	32	3.30	4.80	105	f	2026-04-15 17:02:12.137352	2026-04-16 16:53:25.689738
670	AM5	Zen 4 (Raphael)	12	24	4.70	5.60	170	t	2026-04-15 17:02:12.138551	2026-04-16 16:54:14.737956
671	AM5	Zen 5 (Granite Ridge)	12	24	4.40	5.60	120	t	2026-04-15 17:02:12.139766	2026-04-16 16:55:00.71147
672	AM5	Zen 5 (Granite Ridge)	12	24	4.50	5.40	120	t	2026-04-15 17:02:12.141487	2026-04-16 16:55:48.597734
673	AM5	Zen 5 (Granite Ridge)	16	32	4.30	5.70	170	t	2026-04-15 17:02:12.143119	2026-04-16 16:56:43.185251
674	AM5	Zen 5 (Granite Ridge)	16	32	4.40	5.50	144	t	2026-04-15 17:02:12.14451	2026-04-16 16:57:41.352253
694	LGA 1700	Alder Lake (Intel 7 / 10nm)	4	8	3.30	4.30	60	t	2026-04-15 17:02:12.177911	2026-04-16 16:59:30.068821
678	LGA 1700	Alder Lake-S (10 nm / "Intel 7")	6	12	2.50	4.40	65	f	2026-04-15 17:02:12.150728	2026-04-16 17:02:52.442924
\.


--
-- Data for Name: specs_ram; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.specs_ram (id_producto, ram_tipo, capacidad_gb, velocidad_mhz, latencia, modulos, cantidad_modulos, rgb, created_at, updated_at) FROM stdin;
700	DDR4	16	3200	\N	\N	\N	\N	2026-04-15 17:02:12.189989	2026-04-15 17:02:12.189989
701	DDR4	8	3200	\N	\N	\N	\N	2026-04-15 17:02:12.194661	2026-04-15 17:02:12.194661
702	DDR5	8	5600	\N	\N	\N	\N	2026-04-15 17:02:12.196536	2026-04-15 17:02:12.196536
703	DDR5	64	\N	\N	\N	2	\N	2026-04-15 17:02:12.19819	2026-04-15 17:02:12.19819
704	DDR5	32	\N	\N	\N	2	\N	2026-04-15 17:02:12.200559	2026-04-15 17:02:12.200559
705	DDR4	8	\N	\N	\N	1	\N	2026-04-15 17:02:12.202213	2026-04-15 17:02:12.202213
706	DDR5	64	\N	\N	\N	2	\N	2026-04-15 17:02:12.203824	2026-04-15 17:02:12.203824
707	DDR4	16	3200	\N	\N	\N	\N	2026-04-15 17:02:12.205014	2026-04-15 17:02:12.205014
708	DDR4	8	3200	\N	\N	\N	\N	2026-04-15 17:02:12.206588	2026-04-15 17:02:12.206588
709	DDR4	16	2666	\N	\N	\N	\N	2026-04-15 17:02:12.208698	2026-04-15 17:02:12.208698
710	DDR4	16	3200	\N	\N	\N	\N	2026-04-15 17:02:12.210695	2026-04-15 17:02:12.210695
711	DDR3	4	1600	\N	\N	\N	\N	2026-04-15 17:02:12.212267	2026-04-15 17:02:12.212267
712	DDR4	8	2666	\N	\N	\N	\N	2026-04-15 17:02:12.213461	2026-04-15 17:02:12.213461
713	DDR4	8	3200	\N	\N	\N	\N	2026-04-15 17:02:12.214713	2026-04-15 17:02:12.214713
714	DDR5	16	4800	\N	\N	\N	\N	2026-04-15 17:02:12.215889	2026-04-15 17:02:12.215889
715	DDR5	32	\N	\N	\N	\N	\N	2026-04-15 17:02:12.217212	2026-04-15 17:02:12.217212
716	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.218559	2026-04-15 17:02:12.218559
717	DDR5	32	\N	\N	\N	\N	\N	2026-04-15 17:02:12.219984	2026-04-15 17:02:12.219984
718	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.221384	2026-04-15 17:02:12.221384
719	DDR5	32	\N	\N	\N	\N	\N	2026-04-15 17:02:12.222829	2026-04-15 17:02:12.222829
720	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.224805	2026-04-15 17:02:12.224805
721	DDR4	8	\N	\N	\N	\N	\N	2026-04-15 17:02:12.226733	2026-04-15 17:02:12.226733
722	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.228275	2026-04-15 17:02:12.228275
723	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.229745	2026-04-15 17:02:12.229745
724	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.231124	2026-04-15 17:02:12.231124
725	DDR4	32	\N	\N	\N	\N	\N	2026-04-15 17:02:12.232737	2026-04-15 17:02:12.232737
726	DDR5	8	\N	\N	\N	\N	\N	2026-04-15 17:02:12.234133	2026-04-15 17:02:12.234133
727	DDR4	8	\N	\N	\N	\N	\N	2026-04-15 17:02:12.235471	2026-04-15 17:02:12.235471
728	DDR4	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.237582	2026-04-15 17:02:12.237582
729	DDR4	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.238912	2026-04-15 17:02:12.238912
730	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.240118	2026-04-15 17:02:12.240118
731	DDR4	16	3200	\N	\N	\N	\N	2026-04-15 17:02:12.24239	2026-04-15 17:02:12.24239
732	DDR4	8	\N	\N	\N	\N	\N	2026-04-15 17:02:12.244218	2026-04-15 17:02:12.244218
733	DDR4	8	\N	\N	\N	\N	\N	2026-04-15 17:02:12.245391	2026-04-15 17:02:12.245391
734	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.246518	2026-04-15 17:02:12.246518
735	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.248367	2026-04-15 17:02:12.248367
736	DDR5	16	6400	\N	\N	\N	\N	2026-04-15 17:02:12.250137	2026-04-15 17:02:12.250137
737	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.251647	2026-04-15 17:02:12.251647
738	DDR5	32	\N	\N	\N	\N	\N	2026-04-15 17:02:12.25287	2026-04-15 17:02:12.25287
739	DDR5	8	\N	\N	\N	\N	\N	2026-04-15 17:02:12.254387	2026-04-15 17:02:12.254387
740	DDR5	16	7600	\N	\N	\N	\N	2026-04-15 17:02:12.255859	2026-04-15 17:02:12.255859
741	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.257405	2026-04-15 17:02:12.257405
742	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.259965	2026-04-15 17:02:12.259965
743	DDR5	32	\N	\N	\N	\N	\N	2026-04-15 17:02:12.262154	2026-04-15 17:02:12.262154
744	DDR5	32	\N	\N	\N	\N	\N	2026-04-15 17:02:12.263486	2026-04-15 17:02:12.263486
745	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.264986	2026-04-15 17:02:12.264986
746	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.266771	2026-04-15 17:02:12.266771
747	DDR5	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.268073	2026-04-15 17:02:12.268073
748	DDR4	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.269518	2026-04-15 17:02:12.269518
749	DDR4	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.270849	2026-04-15 17:02:12.270849
750	DDR4	8	3200	\N	\N	\N	\N	2026-04-15 17:02:12.274524	2026-04-15 17:02:12.274524
751	DDR4	16	\N	\N	\N	\N	\N	2026-04-15 17:02:12.276919	2026-04-15 17:02:12.276919
752	DDR4	8	\N	\N	\N	\N	\N	2026-04-15 17:02:12.278583	2026-04-15 17:02:12.278583
753	DDR4	16	3200	\N	\N	\N	\N	2026-04-15 17:02:12.280203	2026-04-15 17:02:12.280203
754	DDR4	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:12.281922	2026-04-15 17:02:12.281922
755	DDR4	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:12.283266	2026-04-15 17:02:12.283266
756	DDR5	16	\N	\N	\N	1	\N	2026-04-15 17:02:12.285565	2026-04-15 17:02:12.285565
757	DDR5	32	6000	\N	\N	2	\N	2026-04-15 17:02:12.287487	2026-04-15 17:02:12.287487
758	DDR5	32	6000	\N	\N	2	\N	2026-04-15 17:02:12.289029	2026-04-15 17:02:12.289029
759	DDR5	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:12.291126	2026-04-15 17:02:12.291126
760	DDR4	16	3200	\N	\N	\N	\N	2026-04-15 17:02:12.29442	2026-04-15 17:02:12.29442
761	DDR4	8	3200	\N	\N	\N	\N	2026-04-15 17:02:12.296408	2026-04-15 17:02:12.296408
762	DDR4	16	3200	\N	\N	\N	\N	2026-04-15 17:02:12.297724	2026-04-15 17:02:12.297724
763	DDR3	8	1600	\N	\N	1	\N	2026-04-15 17:02:12.299145	2026-04-15 17:02:12.299145
764	DDR4	16	3200	\N	\N	2	\N	2026-04-15 17:02:12.300476	2026-04-15 17:02:12.300476
765	DDR4	16	3600	\N	\N	2	\N	2026-04-15 17:02:12.301686	2026-04-15 17:02:12.301686
766	DDR4	16	3600	\N	\N	2	\N	2026-04-15 17:02:12.30278	2026-04-15 17:02:12.30278
767	DDR5	8	6000	\N	\N	1	\N	2026-04-15 17:02:12.304135	2026-04-15 17:02:12.304135
768	DDR5	16	5600	\N	\N	\N	\N	2026-04-15 17:02:12.305381	2026-04-15 17:02:12.305381
769	DDR5	16	5600	\N	\N	1	\N	2026-04-15 17:02:12.306897	2026-04-15 17:02:12.306897
770	DDR5	32	7600	\N	\N	2	\N	2026-04-15 17:02:12.309605	2026-04-15 17:02:12.309605
771	DDR3	4	1600	\N	\N	\N	\N	2026-04-15 17:02:12.311864	2026-04-15 17:02:12.311864
772	DDR4	8	3200	\N	\N	\N	\N	2026-04-15 17:02:12.313643	2026-04-15 17:02:12.313643
773	DDR4	\N	\N	\N	\N	\N	\N	2026-04-15 17:02:12.315268	2026-04-15 17:02:12.315268
774	DDR4	8	3200	\N	\N	\N	\N	2026-04-15 17:02:12.317021	2026-04-15 17:02:12.317021
\.


--
-- Data for Name: usuarios_clientes; Type: TABLE DATA; Schema: public; Owner: nsg_user
--

COPY public.usuarios_clientes (id, nombre, correo, correo_hash, telefono, created_at) FROM stdin;
\.


--
-- Name: administradores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nsg_user
--

SELECT pg_catalog.setval('public.administradores_id_seq', 1, true);


--
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nsg_user
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 1, false);


--
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nsg_user
--

SELECT pg_catalog.setval('public.categorias_id_seq', 25, true);


--
-- Name: configuracion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nsg_user
--

SELECT pg_catalog.setval('public.configuracion_id_seq', 3, true);


--
-- Name: conversaciones_ia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nsg_user
--

SELECT pg_catalog.setval('public.conversaciones_ia_id_seq', 1, false);


--
-- Name: cotizaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nsg_user
--

SELECT pg_catalog.setval('public.cotizaciones_id_seq', 1, false);


--
-- Name: detalle_cotizacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nsg_user
--

SELECT pg_catalog.setval('public.detalle_cotizacion_id_seq', 1, false);


--
-- Name: marcas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nsg_user
--

SELECT pg_catalog.setval('public.marcas_id_seq', 43, true);


--
-- Name: notificaciones_cotizacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nsg_user
--

SELECT pg_catalog.setval('public.notificaciones_cotizacion_id_seq', 1, false);


--
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nsg_user
--

SELECT pg_catalog.setval('public.productos_id_seq', 875, true);


--
-- Name: usuarios_clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nsg_user
--

SELECT pg_catalog.setval('public.usuarios_clientes_id_seq', 1, false);


--
-- Name: administradores administradores_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_pkey PRIMARY KEY (id);


--
-- Name: administradores administradores_username_key; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_username_key UNIQUE (username);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_nombre_key; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_nombre_key UNIQUE (nombre);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: configuracion configuracion_clave_key; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_clave_key UNIQUE (clave);


--
-- Name: configuracion configuracion_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_pkey PRIMARY KEY (id);


--
-- Name: conversaciones_ia conversaciones_ia_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.conversaciones_ia
    ADD CONSTRAINT conversaciones_ia_pkey PRIMARY KEY (id);


--
-- Name: conversaciones_ia conversaciones_ia_sesion_id_key; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.conversaciones_ia
    ADD CONSTRAINT conversaciones_ia_sesion_id_key UNIQUE (sesion_id);


--
-- Name: cotizaciones cotizaciones_codigo_ticket_key; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_codigo_ticket_key UNIQUE (codigo_ticket);


--
-- Name: cotizaciones cotizaciones_codigo_unico_key; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_codigo_unico_key UNIQUE (codigo_unico);


--
-- Name: cotizaciones cotizaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_pkey PRIMARY KEY (id);


--
-- Name: detalle_cotizacion detalle_cotizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.detalle_cotizacion
    ADD CONSTRAINT detalle_cotizacion_pkey PRIMARY KEY (id);


--
-- Name: marcas marcas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_nombre_key UNIQUE (nombre);


--
-- Name: marcas marcas_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_pkey PRIMARY KEY (id);


--
-- Name: notificaciones_cotizacion notificaciones_cotizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.notificaciones_cotizacion
    ADD CONSTRAINT notificaciones_cotizacion_pkey PRIMARY KEY (id);


--
-- Name: productos productos_codigo_proveedor_key; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_codigo_proveedor_key UNIQUE (codigo_proveedor);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: specs_almacenamiento specs_almacenamiento_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_almacenamiento
    ADD CONSTRAINT specs_almacenamiento_pkey PRIMARY KEY (id_producto);


--
-- Name: specs_case specs_case_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_case
    ADD CONSTRAINT specs_case_pkey PRIMARY KEY (id_producto);


--
-- Name: specs_fuente specs_fuente_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_fuente
    ADD CONSTRAINT specs_fuente_pkey PRIMARY KEY (id_producto);


--
-- Name: specs_gpu specs_gpu_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_gpu
    ADD CONSTRAINT specs_gpu_pkey PRIMARY KEY (id_producto);


--
-- Name: specs_placa_madre specs_placa_madre_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_placa_madre
    ADD CONSTRAINT specs_placa_madre_pkey PRIMARY KEY (id_producto);


--
-- Name: specs_procesador specs_procesador_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_procesador
    ADD CONSTRAINT specs_procesador_pkey PRIMARY KEY (id_producto);


--
-- Name: specs_ram specs_ram_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_ram
    ADD CONSTRAINT specs_ram_pkey PRIMARY KEY (id_producto);


--
-- Name: usuarios_clientes usuarios_clientes_correo_hash_key; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.usuarios_clientes
    ADD CONSTRAINT usuarios_clientes_correo_hash_key UNIQUE (correo_hash);


--
-- Name: usuarios_clientes usuarios_clientes_correo_key; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.usuarios_clientes
    ADD CONSTRAINT usuarios_clientes_correo_key UNIQUE (correo);


--
-- Name: usuarios_clientes usuarios_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.usuarios_clientes
    ADD CONSTRAINT usuarios_clientes_pkey PRIMARY KEY (id);


--
-- Name: idx_cotizaciones_cliente; Type: INDEX; Schema: public; Owner: nsg_user
--

CREATE INDEX idx_cotizaciones_cliente ON public.cotizaciones USING btree (id_cliente);


--
-- Name: idx_cotizaciones_ticket; Type: INDEX; Schema: public; Owner: nsg_user
--

CREATE INDEX idx_cotizaciones_ticket ON public.cotizaciones USING btree (codigo_ticket);


--
-- Name: idx_detalle_cotizacion_id; Type: INDEX; Schema: public; Owner: nsg_user
--

CREATE INDEX idx_detalle_cotizacion_id ON public.detalle_cotizacion USING btree (id_cotizacion);


--
-- Name: idx_productos_categoria; Type: INDEX; Schema: public; Owner: nsg_user
--

CREATE INDEX idx_productos_categoria ON public.productos USING btree (id_categoria);


--
-- Name: idx_productos_codigo; Type: INDEX; Schema: public; Owner: nsg_user
--

CREATE INDEX idx_productos_codigo ON public.productos USING btree (codigo_proveedor);


--
-- Name: idx_productos_marca; Type: INDEX; Schema: public; Owner: nsg_user
--

CREATE INDEX idx_productos_marca ON public.productos USING btree (id_marca);


--
-- Name: idx_productos_nombre; Type: INDEX; Schema: public; Owner: nsg_user
--

CREATE INDEX idx_productos_nombre ON public.productos USING btree (nombre);


--
-- Name: idx_productos_stock; Type: INDEX; Schema: public; Owner: nsg_user
--

CREATE INDEX idx_productos_stock ON public.productos USING btree (stock);


--
-- Name: configuracion trigger_configuracion_updated_at; Type: TRIGGER; Schema: public; Owner: nsg_user
--

CREATE TRIGGER trigger_configuracion_updated_at BEFORE UPDATE ON public.configuracion FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: productos trigger_productos_updated_at; Type: TRIGGER; Schema: public; Owner: nsg_user
--

CREATE TRIGGER trigger_productos_updated_at BEFORE UPDATE ON public.productos FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: specs_almacenamiento trigger_specs_almacenamiento_updated_at; Type: TRIGGER; Schema: public; Owner: nsg_user
--

CREATE TRIGGER trigger_specs_almacenamiento_updated_at BEFORE UPDATE ON public.specs_almacenamiento FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: specs_case trigger_specs_case_updated_at; Type: TRIGGER; Schema: public; Owner: nsg_user
--

CREATE TRIGGER trigger_specs_case_updated_at BEFORE UPDATE ON public.specs_case FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: specs_fuente trigger_specs_fuente_updated_at; Type: TRIGGER; Schema: public; Owner: nsg_user
--

CREATE TRIGGER trigger_specs_fuente_updated_at BEFORE UPDATE ON public.specs_fuente FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: specs_gpu trigger_specs_gpu_updated_at; Type: TRIGGER; Schema: public; Owner: nsg_user
--

CREATE TRIGGER trigger_specs_gpu_updated_at BEFORE UPDATE ON public.specs_gpu FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: specs_placa_madre trigger_specs_placa_madre_updated_at; Type: TRIGGER; Schema: public; Owner: nsg_user
--

CREATE TRIGGER trigger_specs_placa_madre_updated_at BEFORE UPDATE ON public.specs_placa_madre FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: specs_procesador trigger_specs_procesador_updated_at; Type: TRIGGER; Schema: public; Owner: nsg_user
--

CREATE TRIGGER trigger_specs_procesador_updated_at BEFORE UPDATE ON public.specs_procesador FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: specs_ram trigger_specs_ram_updated_at; Type: TRIGGER; Schema: public; Owner: nsg_user
--

CREATE TRIGGER trigger_specs_ram_updated_at BEFORE UPDATE ON public.specs_ram FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: auditoria auditoria_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.administradores(id);


--
-- Name: cotizaciones cotizaciones_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.usuarios_clientes(id) ON DELETE SET NULL;


--
-- Name: cotizaciones cotizaciones_id_vendedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_id_vendedor_fkey FOREIGN KEY (id_vendedor) REFERENCES public.administradores(id);


--
-- Name: detalle_cotizacion detalle_cotizacion_id_cotizacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.detalle_cotizacion
    ADD CONSTRAINT detalle_cotizacion_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizaciones(id) ON DELETE CASCADE;


--
-- Name: detalle_cotizacion detalle_cotizacion_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.detalle_cotizacion
    ADD CONSTRAINT detalle_cotizacion_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE RESTRICT;


--
-- Name: notificaciones_cotizacion notificaciones_cotizacion_id_cotizacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.notificaciones_cotizacion
    ADD CONSTRAINT notificaciones_cotizacion_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizaciones(id) ON DELETE CASCADE;


--
-- Name: productos productos_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categorias(id);


--
-- Name: productos productos_id_marca_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_id_marca_fkey FOREIGN KEY (id_marca) REFERENCES public.marcas(id);


--
-- Name: specs_almacenamiento specs_almacenamiento_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_almacenamiento
    ADD CONSTRAINT specs_almacenamiento_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: specs_case specs_case_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_case
    ADD CONSTRAINT specs_case_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: specs_fuente specs_fuente_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_fuente
    ADD CONSTRAINT specs_fuente_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: specs_gpu specs_gpu_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_gpu
    ADD CONSTRAINT specs_gpu_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: specs_placa_madre specs_placa_madre_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_placa_madre
    ADD CONSTRAINT specs_placa_madre_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: specs_procesador specs_procesador_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_procesador
    ADD CONSTRAINT specs_procesador_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: specs_ram specs_ram_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nsg_user
--

ALTER TABLE ONLY public.specs_ram
    ADD CONSTRAINT specs_ram_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO nsg_user;


--
-- PostgreSQL database dump complete
--

\unrestrict QIzhMulKcvdbOk1RwCe3eDE8drCL1nXjCJPyrp33EpaWJcWlNvNLDwa5mBxvicP

