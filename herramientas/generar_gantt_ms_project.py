from PIL import Image, ImageDraw, ImageFont
from pathlib import Path


BASE = Path(__file__).resolve().parents[1]
SALIDA = BASE / "entregables" / "diagrama-gantt-ms-project-nsg.png"


def fuente(tamano, negrita=False):
    candidatos = [
        r"C:\Windows\Fonts\segoeuib.ttf" if negrita else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if negrita else r"C:\Windows\Fonts\arial.ttf",
    ]
    for ruta in candidatos:
        if Path(ruta).exists():
            return ImageFont.truetype(ruta, tamano)
    return ImageFont.load_default()


def texto_ajustado(draw, xy, texto, font, fill, ancho_max, lineas_max=2, espacio=4):
    palabras = texto.split()
    lineas = []
    actual = ""
    for palabra in palabras:
        prueba = palabra if not actual else f"{actual} {palabra}"
        if draw.textbbox((0, 0), prueba, font=font)[2] <= ancho_max:
            actual = prueba
        else:
            if actual:
                lineas.append(actual)
            actual = palabra
    if actual:
        lineas.append(actual)
    lineas = lineas[:lineas_max]
    if len(lineas) == lineas_max and " ".join(lineas) != texto:
        while draw.textbbox((0, 0), lineas[-1] + "...", font=font)[2] > ancho_max and len(lineas[-1]) > 3:
            lineas[-1] = lineas[-1][:-1]
        lineas[-1] += "..."
    x, y = xy
    for i, linea in enumerate(lineas):
        draw.text((x, y + i * (font.size + espacio)), linea, font=font, fill=fill)


def barra(draw, x, y, w, h, color, borde=None, radio=6):
    draw.rounded_rectangle((x, y, x + w, y + h), radius=radio, fill=color, outline=borde or color)
    draw.rectangle((x, y, x + min(8, w), y + h), fill=color)


def main():
    SALIDA.parent.mkdir(parents=True, exist_ok=True)

    W, H = 2200, 1580
    img = Image.new("RGB", (W, H), "#f3f2f1")
    d = ImageDraw.Draw(img)

    f9 = fuente(18)
    f10 = fuente(20)
    f11 = fuente(22)
    f12 = fuente(24)
    f13b = fuente(26, True)
    f15b = fuente(30, True)
    f18b = fuente(36, True)

    # Ventana estilo Microsoft Project.
    d.rectangle((0, 0, W, 46), fill="#107c41")
    d.text((22, 10), "Project Professional - Diagrama de Gantt NSG Cotizador", font=f12, fill="white")
    d.text((W - 310, 11), "Guardar  Deshacer  Buscar", font=f10, fill="#e9f6ee")

    d.rectangle((0, 46, W, 104), fill="#ffffff")
    tabs = ["Archivo", "Tarea", "Recurso", "Proyecto", "Vista", "Formato"]
    x = 24
    for tab in tabs:
        color = "#107c41" if tab == "Tarea" else "#323130"
        d.text((x, 65), tab, font=f11, fill=color)
        x += 120
    d.line((0, 103, W, 103), fill="#d8d8d8", width=2)

    d.rectangle((0, 104, W, 190), fill="#fafafa")
    botones = [
        ("Modo", "Programacion manual"),
        ("Tareas", "Vincular / Hito"),
        ("Cronograma", "Semanas 1-10"),
        ("Datos", "Sistema + tesis"),
        ("Vista", "Gantt con escala semanal"),
    ]
    bx = 28
    for titulo, subtitulo in botones:
        d.rounded_rectangle((bx, 120, bx + 245, 176), radius=4, fill="#ffffff", outline="#d0d0d0")
        d.text((bx + 14, 127), titulo, font=f10, fill="#107c41")
        d.text((bx + 14, 150), subtitulo, font=f9, fill="#323130")
        bx += 268

    # Encabezado del proyecto.
    d.rectangle((0, 190, W, 255), fill="#ffffff")
    d.text((28, 204), "Implementacion del sistema semiautomatizado de cotizacion y catalogacion", font=f18b, fill="#242424")
    d.text((28, 237), "NSG LATINOAMERICA E.I.R.L. - Cronograma de 10 semanas basado en DocumentoTesis.docx y repositorio NSG_Cotizador", font=f10, fill="#605e5c")

    left = 28
    table_w = 830
    chart_x = left + table_w
    top = 300
    row_h = 52
    head_h = 76
    week_w = 112
    chart_w = week_w * 10
    right = chart_x + chart_w

    # Cabeceras.
    d.rectangle((left, top, right, top + head_h), fill="#ffffff", outline="#c8c6c4")
    d.rectangle((left, top, chart_x, top + head_h), fill="#f8f9fa", outline="#c8c6c4")
    columnas = [("ID", 38), ("Nombre de tarea", 78), ("Duracion", 555), ("Inicio", 660), ("Fin", 745)]
    for nombre, cx in columnas:
        d.text((left + cx, top + 25), nombre, font=f10, fill="#323130")
    for i in range(11):
        x = chart_x + i * week_w
        d.line((x, top, x, H - 94), fill="#e1dfdd", width=1)
    for i in range(10):
        x = chart_x + i * week_w
        d.text((x + 24, top + 14), f"S{i + 1}", font=f13b, fill="#323130")
        d.text((x + 21, top + 45), f"Semana {i + 1}", font=f9, fill="#605e5c")

    tareas = [
        (1, "Fase 1 - Analisis de requerimientos", 1, 2, "2 sem", "S1", "S2", "summary", "#107c41"),
        (2, "Entrevistas y diagnostico operativo con personal NSG", 1, 1, "1 sem", "S1", "S1", "task", "#4f9d69"),
        (3, "Reglas de negocio: margen, IGV, tipo de cambio y proforma", 1, 2, "2 sem", "S1", "S2", "task", "#4f9d69"),
        (4, "Criterios de compatibilidad tecnica: CPU, placa, RAM y fuente", 2, 2, "1 sem", "S2", "S2", "task", "#4f9d69"),
        (5, "Fase 2 - Diseno de la solucion", 3, 4, "2 sem", "S3", "S4", "summary", "#0078d4"),
        (6, "Modelo PostgreSQL: productos, specs, cotizaciones, cuentas e IA", 3, 3, "1 sem", "S3", "S3", "task", "#4094d6"),
        (7, "Prototipos React/Tailwind para cotizador, admin e historial", 3, 4, "2 sem", "S3", "S4", "task", "#4094d6"),
        (8, "Contratos API Express y arquitectura frontend-backend", 4, 4, "1 sem", "S4", "S4", "task", "#4094d6"),
        (9, "Fase 3 - Desarrollo del sistema", 5, 7, "3 sem", "S5", "S7", "summary", "#8764b8"),
        (10, "Backend: catalogo, cotizaciones, auth, configuracion y clientes", 5, 6, "2 sem", "S5", "S6", "task", "#9f7fd0"),
        (11, "Frontend: cotizador, selector, resumen, validacion, dashboard", 5, 6, "2 sem", "S5", "S6", "task", "#9f7fd0"),
        (12, "IA: Gemini/NVIDIA, embeddings, clasificador, reranker y sesiones", 6, 7, "2 sem", "S6", "S7", "task", "#9f7fd0"),
        (13, "PDF/Excel, importacion CSV, favoritos y notificaciones", 7, 7, "1 sem", "S7", "S7", "task", "#9f7fd0"),
        (14, "Fase 4 - Pruebas y aseguramiento de calidad", 8, 9, "2 sem", "S8", "S9", "summary", "#d83b01"),
        (15, "Pruebas unitarias de calculos, PDF/Excel y servicios API", 8, 8, "1 sem", "S8", "S8", "task", "#e07a3f"),
        (16, "Validacion de compatibilidad y flujo conversacional del asistente", 8, 9, "2 sem", "S8", "S9", "task", "#e07a3f"),
        (17, "Pruebas de UI, navegacion, permisos y estados de error", 9, 9, "1 sem", "S9", "S9", "task", "#e07a3f"),
        (18, "Fase 5 - Despliegue e implementacion", 10, 10, "1 sem", "S10", "S10", "summary", "#00a2ad"),
        (19, "Carga masiva inicial del catalogo y verificacion de stock", 10, 10, "1 sem", "S10", "S10", "task", "#38b7bf"),
        (20, "Capacitacion de usuarios y entrega formal en produccion", 10, 10, "1 sem", "S10", "S10", "milestone", "#00a2ad"),
    ]

    y0 = top + head_h
    d.rectangle((left, y0, right, y0 + len(tareas) * row_h), fill="#ffffff", outline="#c8c6c4")
    for idx, tarea in enumerate(tareas):
        y = y0 + idx * row_h
        fill = "#faf9f8" if idx % 2 == 0 else "#ffffff"
        d.rectangle((left, y, right, y + row_h), fill=fill)
        d.line((left, y + row_h, right, y + row_h), fill="#edebe9")
        for cx in [left + 64, left + 545, left + 645, left + 735, chart_x]:
            d.line((cx, y, cx, y + row_h), fill="#edebe9")

    for item in tareas:
        tid, nombre, inicio, fin, duracion, ini_txt, fin_txt, tipo, color = item
        y = y0 + (tid - 1) * row_h
        es_resumen = tipo == "summary"
        font = f10 if not es_resumen else f10
        font_b = fuente(20, True) if es_resumen else f10
        d.text((left + 16, y + 15), str(tid), font=f10, fill="#605e5c")
        indent = 15 if es_resumen else 34
        texto_ajustado(d, (left + 84 + indent, y + 9), nombre, font_b if es_resumen else font, "#242424", 435, 2, 2)
        d.text((left + 563, y + 15), duracion, font=f10, fill="#323130")
        d.text((left + 668, y + 15), ini_txt, font=f10, fill="#323130")
        d.text((left + 755, y + 15), fin_txt, font=f10, fill="#323130")

        if tipo == "milestone":
            cx = chart_x + (inicio - 0.5) * week_w
            cy = y + row_h / 2
            tam = 16
            d.polygon([(cx, cy - tam), (cx + tam, cy), (cx, cy + tam), (cx - tam, cy)], fill=color, outline="#00666b")
            d.text((cx + 24, cy - 12), "Entrega formal", font=f9, fill="#323130")
        else:
            x = chart_x + (inicio - 1) * week_w + 14
            w = (fin - inicio + 1) * week_w - 28
            h = 23 if es_resumen else 26
            by = y + 14
            barra(d, x, by, w, h, color, radio=5)
            if es_resumen:
                d.polygon([(x, by + h), (x + 14, by + h), (x + 14, by + h + 12)], fill="#323130")
                d.polygon([(x + w, by + h), (x + w - 14, by + h), (x + w - 14, by + h + 12)], fill="#323130")

    # Dependencias principales.
    def dep(origen_id, destino_id):
        origen = tareas[origen_id - 1]
        destino = tareas[destino_id - 1]
        y1 = y0 + (origen_id - 1) * row_h + row_h / 2
        y2 = y0 + (destino_id - 1) * row_h + row_h / 2
        x1 = chart_x + origen[3] * week_w - 12
        x2 = chart_x + (destino[2] - 1) * week_w + 14
        mid = x1 + 28
        d.line((x1, y1, mid, y1, mid, y2, x2, y2), fill="#605e5c", width=2)
        d.polygon([(x2, y2), (x2 - 8, y2 - 5), (x2 - 8, y2 + 5)], fill="#605e5c")

    for a, b in [(4, 5), (8, 9), (13, 14), (17, 18)]:
        dep(a, b)

    # Pie.
    foot_y = H - 86
    d.rectangle((0, foot_y, W, H), fill="#ffffff")
    d.line((0, foot_y, W, foot_y), fill="#d8d8d8", width=2)
    d.text((28, foot_y + 20), "Base documental: DocumentoTesis.docx, Plan de Implementacion de la Mejora, fases S1-S10.", font=f10, fill="#605e5c")
    d.text((28, foot_y + 48), "Base tecnica: React 18 + Tailwind + Vite, Node.js/Express, PostgreSQL, Gemini/NVIDIA, PDF/Excel, CSV, JWT y modulos reales del repositorio.", font=f10, fill="#605e5c")
    d.text((W - 360, foot_y + 38), "Vista: Diagrama de Gantt", font=f10, fill="#107c41")

    img.save(SALIDA, quality=95)
    print(str(SALIDA))


if __name__ == "__main__":
    main()
