from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


BASE = Path(__file__).resolve().parents[1]
SALIDA = BASE / "entregables" / "diagrama-secuencia-nsg-cotizador.png"


def fuente(tamano, negrita=False):
    candidatos = [
        r"C:\Windows\Fonts\segoeuib.ttf" if negrita else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if negrita else r"C:\Windows\Fonts\arial.ttf",
    ]
    for ruta in candidatos:
        if Path(ruta).exists():
            return ImageFont.truetype(ruta, tamano)
    return ImageFont.load_default()


def ajustar_texto(draw, texto, font, ancho):
    palabras = texto.split()
    lineas = []
    actual = ""
    for palabra in palabras:
        candidato = palabra if not actual else f"{actual} {palabra}"
        if draw.textbbox((0, 0), candidato, font=font)[2] <= ancho:
            actual = candidato
        else:
            if actual:
                lineas.append(actual)
            actual = palabra
    if actual:
        lineas.append(actual)
    return lineas


def texto_centrado(draw, caja, texto, font, fill, max_lineas=2):
    x1, y1, x2, y2 = caja
    lineas = ajustar_texto(draw, texto, font, x2 - x1 - 24)[:max_lineas]
    alto = len(lineas) * (font.size + 5) - 5
    y = y1 + ((y2 - y1) - alto) / 2
    for linea in lineas:
        w = draw.textbbox((0, 0), linea, font=font)[2]
        draw.text((x1 + ((x2 - x1) - w) / 2, y), linea, font=font, fill=fill)
        y += font.size + 5


def flecha(draw, x1, y1, x2, y2, color="#323130", dashed=False, grosor=3):
    if dashed:
        largo = x2 - x1
        pasos = max(1, int(abs(largo) / 22))
        for i in range(pasos):
            a = x1 + (largo * i / pasos)
            b = x1 + (largo * (i + 0.55) / pasos)
            draw.line((a, y1, b, y2), fill=color, width=grosor)
    else:
        draw.line((x1, y1, x2, y2), fill=color, width=grosor)
    direccion = 1 if x2 >= x1 else -1
    draw.polygon(
        [
            (x2, y2),
            (x2 - direccion * 13, y2 - 7),
            (x2 - direccion * 13, y2 + 7),
        ],
        fill=color,
    )


def etiqueta_mensaje(draw, x1, x2, y, texto, font, color):
    ancho = abs(x2 - x1) - 22
    lineas = ajustar_texto(draw, texto, font, ancho)[:2]
    y_texto = y - 31
    x_min = min(x1, x2)
    for linea in lineas:
        w = draw.textbbox((0, 0), linea, font=font)[2]
        draw.text((x_min + (abs(x2 - x1) - w) / 2, y_texto), linea, font=font, fill=color)
        y_texto += font.size + 3


def activacion(draw, x, y1, y2, fill="#ffffff", outline="#605e5c"):
    draw.rounded_rectangle((x - 10, y1, x + 10, y2), radius=4, fill=fill, outline=outline, width=2)


def main():
    SALIDA.parent.mkdir(parents=True, exist_ok=True)

    W, H = 2200, 1920
    img = Image.new("RGB", (W, H), "#f7f7f8")
    d = ImageDraw.Draw(img)

    f18b = fuente(38, True)
    f14b = fuente(28, True)
    f12b = fuente(24, True)
    f11 = fuente(22)
    f10 = fuente(20)
    f9 = fuente(18)

    # Encabezado.
    d.rectangle((0, 0, W, 88), fill="#1f2937")
    d.text((40, 22), "Diagrama de Secuencias - Sistema NSG Cotizador", font=f18b, fill="#ffffff")
    d.text((40, 62), "Flujo coherente de cotizacion asistida, validacion tecnica y generacion de proforma", font=f10, fill="#d1d5db")

    participantes = [
        ("Cliente / vendedor", "#eef2ff"),
        ("Frontend React", "#ecfdf5"),
        ("Backend Express", "#eff6ff"),
        ("Motor de IA", "#f5f3ff"),
        ("PostgreSQL", "#fff7ed"),
        ("PDF / Notificacion", "#fef2f2"),
    ]
    fase_col_w = 270
    xs = [fase_col_w + 130, fase_col_w + 450, fase_col_w + 780, fase_col_w + 1110, fase_col_w + 1430, fase_col_w + 1770]
    top = 135
    box_w = 220
    box_h = 74
    line_top = top + box_h
    line_bottom = H - 250

    for (nombre, color), x in zip(participantes, xs):
        d.rounded_rectangle((x - box_w / 2, top, x + box_w / 2, top + box_h), radius=8, fill=color, outline="#c8c6c4", width=2)
        texto_centrado(d, (x - box_w / 2, top, x + box_w / 2, top + box_h), nombre, f12b, "#111827")
        d.line((x, line_top, x, line_bottom), fill="#c7c9d1", width=2)

    # Bandas de fases.
    fases = [
        (245, 465, "Inicio y captura de necesidad", "#eef2ff"),
        (500, 875, "Catalogo, reglas de negocio y validacion", "#ecfdf5"),
        (910, 1240, "Asistencia IA y configuracion recomendada", "#f5f3ff"),
        (1275, 1505, "Persistencia, documento y respuesta final", "#fff7ed"),
    ]
    for y1, y2, titulo, color in fases:
        d.rounded_rectangle((34, y1, W - 34, y2), radius=8, fill=color, outline="#e5e7eb")
        d.rounded_rectangle((48, y1 + 18, fase_col_w - 30, y1 + 88), radius=8, fill="#ffffff", outline="#d1d5db")
        texto_centrado(d, (48, y1 + 18, fase_col_w - 30, y1 + 88), titulo, f10, "#374151", max_lineas=3)

    # Redibujar lifelines sobre bandas.
    for x in xs:
        d.line((x, line_top, x, line_bottom), fill="#9ca3af", width=2)

    mensajes = [
        (xs[0], xs[1], 300, "1. Ingresa necesidad, presupuesto y preferencias", False),
        (xs[1], xs[2], 380, "2. Solicita catalogo y configuracion inicial", False),
        (xs[2], xs[4], 450, "3. Consulta productos, stock, precios y especificaciones", False),
        (xs[4], xs[2], 545, "4. Retorna catalogo filtrado y datos tecnicos", True),
        (xs[2], xs[1], 625, "5. Devuelve opciones disponibles para seleccion", True),
        (xs[1], xs[2], 705, "6. Envia componentes seleccionados para validar", False),
        (xs[2], xs[4], 780, "7. Verifica sockets, RAM, potencia, stock y reglas", False),
        (xs[4], xs[2], 850, "8. Retorna compatibilidad, advertencias y costos base", True),
        (xs[2], xs[3], 980, "9. Solicita recomendacion o ajuste si falta informacion", False),
        (xs[3], xs[4], 1060, "10. Recupera contexto, sesiones y especificaciones", False),
        (xs[4], xs[3], 1135, "11. Entrega datos semanticos y configuracion previa", True),
        (xs[3], xs[2], 1210, "12. Responde configuracion recomendada y justificacion", True),
        (xs[2], xs[4], 1335, "13. Registra cliente, cotizacion y detalle", False),
        (xs[2], xs[5], 1415, "14. Genera PDF tecnico/comercial y prepara aviso", False),
        (xs[5], xs[2], 1490, "15. Retorna URL/archivo y estado de notificacion", True),
        (xs[2], xs[1], 1565, "16. Entrega ticket, resumen financiero y documentos", True),
        (xs[1], xs[0], 1635, "17. Muestra proforma, validacion y descarga", True),
    ]

    for x1, x2, y, texto, retorno in mensajes:
        color = "#6b7280" if retorno else "#111827"
        etiqueta_mensaje(d, x1, x2, y, texto, f9, color)
        flecha(d, x1 + (15 if x2 > x1 else -15), y, x2 - (15 if x2 > x1 else -15), y, color=color, dashed=retorno, grosor=3)

    # Activaciones principales.
    activaciones = [
        (xs[1], 335, 1645, "#ffffff"),
        (xs[2], 390, 1580, "#ffffff"),
        (xs[4], 440, 860, "#fffaf0"),
        (xs[3], 968, 1220, "#faf5ff"),
        (xs[5], 1404, 1502, "#fff1f2"),
    ]
    for x, y1, y2, color in activaciones:
        activacion(d, x, y1, y2, fill=color)

    # Fragmento alternativo de incompatibilidad.
    alt_y = 878
    d.rounded_rectangle((fase_col_w + 110, alt_y, fase_col_w + 1015, alt_y + 82), radius=8, fill="#ffffff", outline="#f59e0b", width=3)
    d.text((352, alt_y + 12), "alt: Si la combinacion no es compatible", font=f12b, fill="#92400e")
    d.text(
        (352, alt_y + 47),
        "El backend devuelve errores/advertencias; el frontend solicita ajustes antes de generar la cotizacion.",
        font=f9,
        fill="#78350f",
    )

    # Nota de coherencia.
    d.rounded_rectangle((40, H - 118, W - 40, H - 34), radius=8, fill="#ffffff", outline="#d1d5db")
    nota = (
        "Criterio aplicado: el diagrama representa el flujo real del sistema documentado: React consulta API Express; "
        "Express centraliza reglas de compatibilidad, precios, catalogo y seguridad; PostgreSQL persiste productos, "
        "clientes, cotizaciones y sesiones; el motor IA interviene como apoyo cuando se requiere recomendacion; PDF/notificacion se generan al final."
    )
    lineas = ajustar_texto(d, nota, f9, W - 130)
    y = H - 102
    for linea in lineas[:3]:
        d.text((64, y), linea, font=f9, fill="#374151")
        y += 22

    img.save(SALIDA, quality=95)
    print(str(SALIDA))


if __name__ == "__main__":
    main()
