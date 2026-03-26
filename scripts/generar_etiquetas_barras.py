"""
Genera un PDF con etiquetas de código de barras para todos los productos activos.
Uso:
    cd C:/sistemaMotoQFox/backend
    python ../scripts/generar_etiquetas_barras.py

El PDF se guarda en: C:/sistemaMotoQFox/scripts/etiquetas_codigos_barras.pdf
"""
import os
import sys
import django

# ── Setup Django ──────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, '..', 'backend')
sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from inventory.models import Producto

# ── ReportLab imports ─────────────────────────────────────────────────────────
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode import code128
from reportlab.graphics import renderPDF
from reportlab.graphics.shapes import Drawing


# ── Configuración de etiqueta ─────────────────────────────────────────────────
ETIQUETA_W   = 70 * mm   # ancho etiqueta
ETIQUETA_H   = 38 * mm   # alto etiqueta
COLS         = 3          # columnas por página
MARGIN_X     = 10 * mm   # margen lateral de página
MARGIN_Y     = 15 * mm   # margen superior/inferior de página
GAP_X        = 4 * mm    # espacio horizontal entre etiquetas
GAP_Y        = 4 * mm    # espacio vertical entre etiquetas

PAGE_W, PAGE_H = A4


def draw_etiqueta(c: canvas.Canvas, x: float, y: float, producto: Producto):
    """Dibuja una etiqueta en la posición (x, y) — esquina inferior izquierda."""

    # Borde
    c.setStrokeColor(colors.HexColor('#CBD5E0'))
    c.setLineWidth(0.4)
    c.rect(x, y, ETIQUETA_W, ETIQUETA_H)

    # Nombre del producto (ajusta a 2 líneas si es largo)
    c.setFont('Helvetica-Bold', 6.5)
    c.setFillColor(colors.HexColor('#1A202C'))
    nombre = producto.name
    if len(nombre) > 36:
        nombre = nombre[:33] + '...'
    c.drawString(x + 3*mm, y + ETIQUETA_H - 6*mm, nombre)

    # SKU y precio
    c.setFont('Helvetica', 5.5)
    c.setFillColor(colors.HexColor('#4A5568'))
    sku_txt = f'SKU: {producto.sku}'
    precio_txt = f'${float(producto.price):,.2f} MXN'
    c.drawString(x + 3*mm,  y + ETIQUETA_H - 10.5*mm, sku_txt)
    c.drawRightString(x + ETIQUETA_W - 3*mm, y + ETIQUETA_H - 10.5*mm, precio_txt)

    # Código de barras Code128
    codigo = producto.codigo_barras or producto.sku
    barcode_h = 13 * mm
    barcode_w = ETIQUETA_W - 10 * mm

    try:
        barcode = code128.Code128(
            codigo,
            barWidth=0.8,
            barHeight=barcode_h,
            humanReadable=False,
        )
        bw = barcode.width
        bx = x + (ETIQUETA_W - bw) / 2
        by = y + 10 * mm
        barcode.drawOn(c, bx, by)
    except Exception:
        c.setFont('Helvetica', 5)
        c.setFillColor(colors.red)
        c.drawCentredString(x + ETIQUETA_W / 2, y + 14*mm, '[código inválido]')

    # Código legible debajo del barcode
    c.setFont('Helvetica', 5.5)
    c.setFillColor(colors.HexColor('#2D3748'))
    c.drawCentredString(x + ETIQUETA_W / 2, y + 5.5*mm, codigo)

    # Línea separadora entre nombre y barcode
    c.setStrokeColor(colors.HexColor('#E2E8F0'))
    c.setLineWidth(0.3)
    c.line(x + 3*mm, y + ETIQUETA_H - 12.5*mm, x + ETIQUETA_W - 3*mm, y + ETIQUETA_H - 12.5*mm)


def generar_pdf(output_path: str):
    productos = list(
        Producto.objects.filter(is_active=True)
        .select_related('categoria', 'subcategoria', 'marca_fabricante')
        .order_by('categoria__name', 'name')
    )

    if not productos:
        print('No hay productos activos en la base de datos.')
        return

    print(f'Generando etiquetas para {len(productos)} productos...')

    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle('Etiquetas Códigos de Barras — MotoQFox')
    c.setAuthor('MotoQFox Sistema')

    # Calcular posiciones de columnas
    col_positions = [
        MARGIN_X + i * (ETIQUETA_W + GAP_X)
        for i in range(COLS)
    ]

    # Calcular filas por página
    filas_por_pagina = int((PAGE_H - 2 * MARGIN_Y + GAP_Y) / (ETIQUETA_H + GAP_Y))
    etiquetas_por_pagina = COLS * filas_por_pagina

    for idx, producto in enumerate(productos):
        pos_en_pagina = idx % etiquetas_por_pagina

        # Nueva página
        if pos_en_pagina == 0 and idx > 0:
            c.showPage()

        fila = pos_en_pagina // COLS
        col  = pos_en_pagina % COLS

        x = col_positions[col]
        y = PAGE_H - MARGIN_Y - (fila + 1) * ETIQUETA_H - fila * GAP_Y

        draw_etiqueta(c, x, y, producto)

        if (idx + 1) % 50 == 0:
            print(f'  {idx + 1}/{len(productos)}...')

    c.save()
    print(f'\nPDF guardado en: {output_path}')
    print(f'Total etiquetas: {len(productos)}')
    print(f'Paginas: {-(-len(productos) // etiquetas_por_pagina)}')  # ceil division


if __name__ == '__main__':
    output = os.path.join(BASE_DIR, 'etiquetas_codigos_barras.pdf')
    generar_pdf(output)
