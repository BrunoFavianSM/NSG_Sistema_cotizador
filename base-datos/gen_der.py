# -*- coding: utf-8 -*-
"""Genera el DER (diagrama entidad-relacion) de la base nsg_cotizaciones en formato draw.io."""
import html

# (tabla, x, y, [(columna, tipo, marca)])  marca: PK / FK / PK,FK / ''
# Layout por zonas:
#   IZQUIERDA-ARRIBA : usuarios (cuentas + lo que la referencia)
#   CENTRO           : catalogo (categorias/marcas/etiquetas) + productos
#   DERECHA          : specs_* (1:1 con productos)
#   ABAJO            : cotizaciones, asistente IA, configuracion
tablas = {
    "cuentas": (40, 380, [
        ("id", "integer", "PK"), ("username", "varchar", ""), ("password_hash", "varchar", ""),
        ("correo_encrypted", "varchar", ""), ("correo_hash", "varchar", ""),
        ("nombre_completo", "varchar", ""), ("telefono_encrypted", "varchar", ""),
        ("telefono_hash", "varchar", ""), ("dni", "varchar", ""), ("rol", "varchar", ""),
        ("intentos_fallidos", "integer", ""), ("bloqueado_hasta", "timestamp", ""),
        ("token_recuperacion", "varchar", ""), ("estado", "varchar", ""),
        ("created_at", "timestamp", ""), ("updated_at", "timestamp", ""),
    ]),
    "categorias": (760, 40, [
        ("id", "integer", "PK"), ("nombre", "varchar", ""),
        ("es_componente_principal", "boolean", ""), ("created_at", "timestamp", ""),
        ("updated_at", "timestamp", ""),
    ]),
    "marcas": (1030, 40, [
        ("id", "integer", "PK"), ("nombre", "varchar", ""),
        ("created_at", "timestamp", ""), ("updated_at", "timestamp", ""),
    ]),
    "etiquetas": (1300, 40, [
        ("id", "integer", "PK"), ("nombre", "varchar", ""), ("orden", "integer", ""),
        ("created_at", "timestamp", ""),
    ]),
    "productos": (1030, 360, [
        ("id", "integer", "PK"), ("id_categoria", "integer", "FK"),
        ("id_marca", "integer", "FK"), ("id_etiqueta", "integer", "FK"),
        ("subcategoria", "varchar", ""), ("categoria_proveedor", "varchar", ""),
        ("codigo_proveedor", "varchar", ""), ("nombre", "varchar", ""),
        ("descripcion_general", "text", ""), ("precio_base", "numeric", ""),
        ("stock", "integer", ""), ("disponible_a_pedido", "boolean", ""),
        ("garantia", "varchar", ""), ("flete", "varchar", ""),
        ("imagen_url", "varchar", ""), ("imagen_path", "varchar", ""),
        ("estado_enriquecimiento", "varchar", ""),
        ("created_at", "timestamp", ""), ("updated_at", "timestamp", ""),
    ]),
    "specs_procesador": (1560, 360, [
        ("id_producto", "integer", "PK,FK"), ("socket", "varchar", ""),
        ("arquitectura", "varchar", ""), ("nucleos", "integer", ""), ("hilos", "integer", ""),
        ("frecuencia_base_ghz", "numeric", ""), ("frecuencia_boost_ghz", "numeric", ""),
        ("tdp_w", "integer", ""), ("graficos_integrados", "boolean", ""),
        ("ficha_tecnica", "jsonb", ""),
    ]),
    "specs_ram": (1560, 690, [
        ("id_producto", "integer", "PK,FK"), ("ram_tipo", "varchar", ""),
        ("capacidad_gb", "integer", ""), ("velocidad_mhz", "integer", ""),
        ("latencia", "varchar", ""), ("modulos", "varchar", ""),
        ("cantidad_modulos", "integer", ""), ("rgb", "boolean", ""),
        ("ficha_tecnica", "jsonb", ""),
    ]),
    "specs_almacenamiento": (1560, 1000, [
        ("id_producto", "integer", "PK,FK"), ("tipo_almacenamiento", "varchar", ""),
        ("capacidad_gb", "integer", ""), ("interfaz", "varchar", ""),
        ("form_factor", "varchar", ""), ("velocidad_lectura_mbps", "integer", ""),
        ("velocidad_escritura_mbps", "integer", ""), ("nvme_gen", "varchar", ""),
        ("ficha_tecnica", "jsonb", ""),
    ]),
    "specs_gpu": (1560, 1320, [
        ("id_producto", "integer", "PK,FK"), ("chipset", "varchar", ""),
        ("vram_gb", "integer", ""), ("vram_tipo", "varchar", ""), ("bus_bits", "integer", ""),
        ("boost_mhz", "integer", ""), ("tdp_w", "integer", ""), ("longitud_mm", "integer", ""),
        ("fuente_recomendada_w", "integer", ""), ("ficha_tecnica", "jsonb", ""),
    ]),
    "specs_placa_madre": (1900, 360, [
        ("id_producto", "integer", "PK,FK"), ("socket", "varchar", ""),
        ("chipset", "varchar", ""), ("form_factor", "varchar", ""), ("ram_tipo", "varchar", ""),
        ("max_ram_gb", "integer", ""), ("slots_ram", "integer", ""),
        ("pcie_version", "varchar", ""), ("m2_slots", "integer", ""),
        ("ficha_tecnica", "jsonb", ""),
    ]),
    "specs_fuente": (1900, 700, [
        ("id_producto", "integer", "PK,FK"), ("wattage", "integer", ""),
        ("certificacion", "varchar", ""), ("modular", "varchar", ""),
        ("form_factor", "varchar", ""), ("pcie_conectores", "integer", ""),
        ("sata_conectores", "integer", ""), ("ficha_tecnica", "jsonb", ""),
    ]),
    "specs_case": (1900, 1000, [
        ("id_producto", "integer", "PK,FK"), ("form_factor", "varchar", ""),
        ("compatibilidad_placa", "varchar", ""), ("max_gpu_mm", "integer", ""),
        ("max_cooler_mm", "integer", ""), ("ventiladores_incluidos", "integer", ""),
        ("color", "varchar", ""), ("panel_lateral", "varchar", ""),
        ("ficha_tecnica", "jsonb", ""),
    ]),
    "cotizaciones": (40, 980, [
        ("id", "integer", "PK"), ("codigo_unico", "uuid", ""),
        ("codigo_ticket", "varchar", ""), ("id_cliente", "integer", "FK"),
        ("id_vendedor", "integer", "FK"), ("fecha_emision", "timestamp", ""),
        ("fecha_validez", "timestamp", ""), ("precio_total", "numeric", ""),
        ("margen_aplicado", "numeric", ""), ("estado", "varchar", ""),
        ("moneda_base", "varchar", ""), ("subtotal_neto", "numeric", ""),
        ("igv_porcentaje", "numeric", ""), ("igv_monto", "numeric", ""),
        ("total_con_igv", "numeric", ""), ("tipo_cambio_referencia", "numeric", ""),
        ("total_con_igv_pen", "numeric", ""), ("cantidad_equipos", "integer", ""),
    ]),
    "detalle_cotizacion": (340, 980, [
        ("id", "integer", "PK"), ("id_cotizacion", "integer", "FK"),
        ("id_producto", "integer", "FK"), ("nombre_producto", "varchar", ""),
        ("categoria", "varchar", ""), ("descripcion_tecnica", "text", ""),
        ("precio_unitario", "numeric", ""), ("cantidad", "integer", ""),
        ("disponible_stock", "boolean", ""), ("costo_unitario_neto_usd", "numeric", ""),
        ("margen_aplicado", "numeric", ""), ("precio_unitario_neto_usd", "numeric", ""),
        ("igv_unitario_usd", "numeric", ""), ("precio_unitario_total_usd", "numeric", ""),
        ("tabla_producto", "varchar", ""),
    ]),
    "productos_favoritos": (660, 1320, [
        ("id", "integer", "PK"), ("id_usuario", "integer", "FK"),
        ("id_producto", "integer", "FK"), ("tabla_producto", "varchar", ""),
        ("fecha_agregado", "timestamp", ""),
    ]),
    "historial_precios_producto": (660, 980, [
        ("id", "integer", "PK"), ("id_producto", "integer", "FK"),
        ("id_usuario_admin", "integer", "FK"), ("tabla_producto", "varchar", ""),
        ("precio_anterior", "numeric", ""), ("precio_nuevo", "numeric", ""),
        ("fecha_cambio", "timestamp", ""),
    ]),
    "notificaciones_usuario": (40, 40, [  # zona usuarios, arriba de cuentas
        ("id", "integer", "PK"), ("id_usuario", "integer", "FK"), ("tipo", "varchar", ""),
        ("titulo", "varchar", ""), ("mensaje", "text", ""), ("leida", "boolean", ""),
        ("fecha_creacion", "timestamp", ""), ("datos_extra", "jsonb", ""),
    ]),
    "auditoria": (340, 40, [
        ("id", "integer", "PK"), ("id_usuario", "integer", "FK"),
        ("tabla_afectada", "varchar", ""), ("accion", "varchar", ""),
        ("id_registro", "integer", ""), ("datos_anteriores", "jsonb", ""),
        ("datos_nuevos", "jsonb", ""), ("ip_address", "varchar", ""),
        ("timestamp", "timestamp", ""),
    ]),
    "asistente_sesiones": (40, 1480, [
        ("id", "integer", "PK"), ("sesion_id", "uuid", "UQ"),
        ("usuario_id", "integer", "FK"), ("perfil_usuario", "varchar", ""),
        ("presupuesto_pen", "numeric", ""), ("estado", "varchar", ""),
        ("created_at", "timestamp", ""), ("updated_at", "timestamp", ""),
    ]),
    "asistente_configuraciones": (340, 1480, [
        ("id", "integer", "PK"), ("sesion_id", "uuid", "FK"),
        ("configuracion", "jsonb", ""), ("precio_total_usd", "numeric", ""),
        ("validada", "boolean", ""), ("intentos_validacion", "integer", ""),
        ("created_at", "timestamp", ""),
    ]),
    "asistente_mensajes": (640, 1480, [
        ("id", "integer", "PK"), ("sesion_id", "uuid", "FK"), ("rol", "varchar", ""),
        ("contenido", "text", ""), ("metadata", "jsonb", ""), ("created_at", "timestamp", ""),
    ]),
    "configuracion": (980, 1480, [
        ("id", "integer", "PK"), ("clave", "varchar", ""), ("valor", "varchar", ""),
        ("descripcion", "text", ""), ("updated_at", "timestamp", ""),
    ]),
}

# relaciones: (tabla_origen, col_origen, tabla_destino, etiqueta_cardinalidad)
# cardinalidad indicada como hijo:padre. specs son 1:1 (id_producto es PK)
relaciones = [
    ("productos", "id_categoria", "categorias", "N:1"),
    ("productos", "id_marca", "marcas", "N:1"),
    ("productos", "id_etiqueta", "etiquetas", "N:1"),
    ("specs_procesador", "id_producto", "productos", "1:1"),
    ("specs_ram", "id_producto", "productos", "1:1"),
    ("specs_almacenamiento", "id_producto", "productos", "1:1"),
    ("specs_gpu", "id_producto", "productos", "1:1"),
    ("specs_placa_madre", "id_producto", "productos", "1:1"),
    ("specs_fuente", "id_producto", "productos", "1:1"),
    ("specs_case", "id_producto", "productos", "1:1"),
    ("cotizaciones", "id_cliente", "cuentas", "N:1"),
    ("cotizaciones", "id_vendedor", "cuentas", "N:1"),
    ("detalle_cotizacion", "id_cotizacion", "cotizaciones", "N:1"),
    ("detalle_cotizacion", "id_producto", "productos", "N:1"),
    ("historial_precios_producto", "id_producto", "productos", "N:1"),
    ("historial_precios_producto", "id_usuario_admin", "cuentas", "N:1"),
    ("notificaciones_usuario", "id_usuario", "cuentas", "N:1"),
    ("auditoria", "id_usuario", "cuentas", "N:1"),
    ("productos_favoritos", "id_usuario", "cuentas", "N:1"),
    ("productos_favoritos", "id_producto", "productos", "N:1"),
    ("asistente_sesiones", "usuario_id", "cuentas", "N:1"),
    ("asistente_configuraciones", "sesion_id", "asistente_sesiones", "N:1"),
    ("asistente_mensajes", "sesion_id", "asistente_sesiones", "N:1"),
]

ROW_H = 26
HEADER_H = 30
WIDTH = 230

cells = []
cell_id = 2
ids = {}          # tabla -> id del swimlane
row_ids = {}      # (tabla, col) -> id de la fila


def esc(s):
    return html.escape(str(s), quote=True)


for tabla, (x, y, cols) in tablas.items():
    tid = "n%d" % cell_id
    cell_id += 1
    ids[tabla] = tid
    height = HEADER_H + ROW_H * len(cols)
    style = ("swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;"
             "horizontal=1;startSize=30;horizontalStack=0;resizeParent=1;resizeParentMax=0;"
             "collapsible=0;marginBottom=0;swimlaneFillColor=#FFFFFF;fillColor=#1A73E8;"
             "fontColor=#FFFFFF;strokeColor=#1A73E8;")
    cells.append(
        '<mxCell id="%s" value="%s" style="%s" vertex="1" parent="1">'
        '<mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>'
        % (tid, esc(tabla), style, x, y, WIDTH, height))
    for i, (col, tipo, marca) in enumerate(cols):
        rid = "%s_r%d" % (tid, i)
        row_ids[(tabla, col)] = rid
        prefix = ""
        fc = "#333333"
        if "PK" in marca:
            prefix = "\U0001F511 "  # llave
            fc = "#B8860B"
        elif marca in ("FK", "UQ"):
            prefix = ("\U0001F517 " if marca == "FK" else "◆ ")
            fc = "#1A73E8" if marca == "FK" else "#666666"
        label = "%s%s : %s" % (prefix, col, tipo)
        suf = ("  (%s)" % marca) if marca else ""
        rstyle = ("text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;"
                  "spacingLeft=8;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];"
                  "portConstraint=eastwest;fontColor=%s;" % fc)
        cells.append(
            '<mxCell id="%s" value="%s" style="%s" vertex="1" parent="%s">'
            '<mxGeometry y="%d" width="%d" height="%d" as="geometry"/></mxCell>'
            % (rid, esc(label + suf), rstyle, tid, HEADER_H + i * ROW_H, WIDTH, ROW_H))

# aristas
for origen, col, destino, card in relaciones:
    src = row_ids.get((origen, col), ids[origen])
    dst = ids[destino]
    eid = "e%d" % cell_id
    cell_id += 1
    estyle = ("edgeStyle=orthogonalEdgeStyle;fontSize=11;fontColor=#444444;html=1;"
              "endArrow=ERmany;startArrow=ERone;rounded=1;jettySize=auto;orthogonalLoop=1;"
              "labelBackgroundColor=#FFFFFF;strokeColor=#5A5A5A;strokeWidth=1.5;")
    cells.append(
        '<mxCell id="%s" value="%s" style="%s" edge="1" parent="1" source="%s" target="%s">'
        '<mxGeometry relative="1" as="geometry"/></mxCell>'
        % (eid, esc(card), estyle, src, dst))

xml = (
    '<mxfile host="app.diagrams.net">'
    '<diagram name="DER nsg_cotizaciones" id="der-nsg">'
    '<mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" '
    'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2300" pageHeight="1900" '
    'math="0" shadow="0">'
    '<root>'
    '<mxCell id="0"/>'
    '<mxCell id="1" parent="0"/>'
    + "".join(cells) +
    '</root></mxGraphModel></diagram></mxfile>'
)

with open("base-datos/DER-nsg_cotizaciones.drawio", "w", encoding="utf-8") as f:
    f.write(xml)

print("OK -> base-datos/DER-nsg_cotizaciones.drawio  (%d tablas, %d relaciones)"
      % (len(tablas), len(relaciones)))
