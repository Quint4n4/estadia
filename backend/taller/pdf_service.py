"""
PDF Report Generator for Historial de Taller — MotoQFox
Follows the same pattern as sales/pdf_service.py (reportlab).
"""
import io
from decimal import Decimal
from django.utils import timezone

# ── Color palette (same as sales/pdf_service.py) ─────────────────────────────
BLUE_DARK   = (0.118, 0.251, 0.686)   # #1E40AF
BLUE_LIGHT  = (0.231, 0.510, 0.965)   # #3B82F6
BLUE_BG     = (0.937, 0.965, 1.0)     # #EFF6FF
GRAY_DARK   = (0.067, 0.094, 0.153)   # #111827
GRAY_MID    = (0.420, 0.447, 0.502)   # #6B7280
GRAY_LIGHT  = (0.898, 0.906, 0.922)   # #E5E7EB
WHITE       = (1, 1, 1)
GREEN       = (0.086, 0.639, 0.290)   # #16A34A
RED         = (0.863, 0.149, 0.149)   # #DC2626
AMBER       = (0.851, 0.467, 0.024)   # #D97706


def _fmt(value) -> str:
    try:
        return f"${Decimal(str(value)):,.2f}"
    except Exception:
        return "$0.00"


def _fmt_date(value) -> str:
    """Returns first 10 chars of an ISO date string, or '—'."""
    if not value:
        return '—'
    return str(value)[:10]


def generate_reporte_taller_pdf(
    params: dict,
    servicios: list,
    kpis: dict,
    sede_nombre: str,
) -> io.BytesIO:
    """
    Generates a PDF report for the taller historial.

    params       — dict with 'fecha_desde' and 'fecha_hasta' (YYYY-MM-DD strings)
    servicios    — list of dicts from ServicioMotoListSerializer (already serialized)
    kpis         — dict: total, entregados, cancelados, ingresos, efectivo, tarjeta, transferencia
    sede_nombre  — string for the header

    Returns a BytesIO buffer ready for HttpResponse.
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        )
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    except ImportError:
        raise ImportError("reportlab no está instalado. Ejecuta: pip install reportlab")

    # ── reportlab color objects ───────────────────────────────────────────────
    rl_blue_dark  = colors.Color(*BLUE_DARK)
    rl_blue_light = colors.Color(*BLUE_LIGHT)
    rl_blue_bg    = colors.Color(*BLUE_BG)
    rl_gray_light = colors.Color(*GRAY_LIGHT)
    rl_gray_mid   = colors.Color(*GRAY_MID)
    rl_gray_dark  = colors.Color(*GRAY_DARK)
    rl_green      = colors.Color(*GREEN)
    rl_red        = colors.Color(*RED)
    rl_amber      = colors.Color(*AMBER)
    rl_white      = colors.white

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )
    W = letter[0] - 4 * cm  # usable width

    # ── Paragraph styles ──────────────────────────────────────────────────────
    def ps(name, **kw):
        return ParagraphStyle(name, **kw)

    title_s   = ps('T',  fontSize=18, textColor=rl_white,     alignment=TA_CENTER, fontName='Helvetica-Bold')
    sub_s     = ps('S',  fontSize=10, textColor=rl_white,     alignment=TA_CENTER, fontName='Helvetica')
    label_s   = ps('L',  fontSize=9,  textColor=rl_gray_mid,  fontName='Helvetica', spaceAfter=1)
    value_s   = ps('V',  fontSize=11, textColor=rl_gray_dark, fontName='Helvetica-Bold')
    section_s = ps('SE', fontSize=10, textColor=rl_blue_dark, fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=4)
    small_s   = ps('SM', fontSize=8,  textColor=rl_gray_dark, fontName='Helvetica')
    folio_s   = ps('F',  fontSize=8,  textColor=rl_gray_mid,  fontName='Courier')
    footer_s  = ps('FT', fontSize=7,  textColor=rl_gray_mid,  alignment=TA_CENTER)

    story = []

    # ── 1. Header ─────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph('MotoQFox', title_s),
        Paragraph('Historial de Taller', sub_s),
    ]]
    header_t = Table(header_data, colWidths=[W * 0.35, W * 0.65])
    header_t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), rl_blue_dark),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LEFTPADDING',   (0, 0), (-1, -1), 14),
    ]))
    story.append(header_t)
    story.append(Spacer(1, 0.4 * cm))

    # ── 2. Info block (sede, período, totales) ────────────────────────────────
    info_data = [
        [
            Paragraph('Sede', label_s),
            Paragraph('Período desde', label_s),
            Paragraph('Período hasta', label_s),
            Paragraph('Total servicios', label_s),
        ],
        [
            Paragraph(sede_nombre, value_s),
            Paragraph(params.get('fecha_desde', '—'), value_s),
            Paragraph(params.get('fecha_hasta', '—'), value_s),
            Paragraph(str(kpis.get('total', 0)), value_s),
        ],
    ]
    info_t = Table(info_data, colWidths=[W / 4] * 4)
    info_t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), rl_blue_bg),
        ('TOPPADDING',    (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING',   (0, 0), (-1, -1), 10),
        ('BOX',           (0, 0), (-1, -1), 0.5, rl_gray_light),
        ('INNERGRID',     (0, 0), (-1, -1), 0.25, rl_gray_light),
    ]))
    story.append(info_t)
    story.append(Spacer(1, 0.5 * cm))

    # ── 3. KPI summary table ──────────────────────────────────────────────────
    story.append(Paragraph('Resumen del período', section_s))
    summary_rows = [
        ['Concepto', 'Valor'],
        ['Servicios entregados',            str(kpis.get('entregados', 0))],
        ['Servicios cancelados',            str(kpis.get('cancelados', 0))],
        ['Cobrado en efectivo',             _fmt(kpis.get('efectivo', 0))],
        ['Cobrado con tarjeta',             _fmt(kpis.get('tarjeta', 0))],
        ['Cobrado por transferencia',       _fmt(kpis.get('transferencia', 0))],
        ['TOTAL INGRESOS',                  _fmt(kpis.get('ingresos', 0))],
    ]
    summary_t = Table(summary_rows, colWidths=[W * 0.65, W * 0.35])
    summary_t.setStyle(TableStyle([
        ('BACKGROUND',     (0, 0), (-1, 0),  rl_blue_dark),
        ('TEXTCOLOR',      (0, 0), (-1, 0),  rl_white),
        ('FONTNAME',       (0, 0), (-1, 0),  'Helvetica-Bold'),
        ('FONTSIZE',       (0, 0), (-1, 0),  9),
        ('ALIGN',          (1, 0), (1, -1),  'RIGHT'),
        ('FONTNAME',       (0, 1), (-1, -2), 'Helvetica'),
        ('FONTSIZE',       (0, 1), (-1, -2), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [rl_white, rl_blue_bg]),
        ('BACKGROUND',     (0, -1), (-1, -1), rl_blue_dark),
        ('TEXTCOLOR',      (0, -1), (-1, -1), rl_white),
        ('FONTNAME',       (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('TOPPADDING',     (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING',  (0, 0), (-1, -1), 7),
        ('LEFTPADDING',    (0, 0), (-1, -1), 10),
        ('BOX',            (0, 0), (-1, -1), 0.5, rl_gray_light),
        ('INNERGRID',      (0, 0), (-1, -1), 0.25, rl_gray_light),
    ]))
    story.append(summary_t)
    story.append(Spacer(1, 0.5 * cm))

    # ── 4. Service detail table ───────────────────────────────────────────────
    if servicios:
        story.append(Paragraph(f'Detalle de servicios ({len(servicios)})', section_s))

        STATUS_LABEL = {
            'RECIBIDO':            'Recibido',
            'EN_DIAGNOSTICO':      'En diagnóstico',
            'EN_PROCESO':          'En proceso',
            'COTIZACION_EXTRA':    'Cot. extra',
            'LISTA_PARA_ENTREGAR': 'Lista entregar',
            'CANCELADO':           'Cancelado',
            'LISTO':               'Listo',
            'ENTREGADO':           'Entregado',
        }

        rows = [[
            Paragraph('Folio',     folio_s),
            Paragraph('Recep.',    small_s),
            Paragraph('Entrega',   small_s),
            Paragraph('Moto',      small_s),
            Paragraph('Mecánico',  small_s),
            Paragraph('Estado',    small_s),
            Paragraph('Total',     small_s),
        ]]

        for sv in servicios:
            moto = str(sv.get('moto_display') or '—')
            if len(moto) > 20:
                moto = moto[:18] + '…'
            mecanico = str(sv.get('mecanico_nombre') or '—')
            if len(mecanico) > 18:
                mecanico = mecanico[:16] + '…'
            status_key = sv.get('status', '')
            status_label = STATUS_LABEL.get(status_key, status_key)

            rows.append([
                Paragraph(str(sv.get('folio', '')), folio_s),
                Paragraph(_fmt_date(sv.get('fecha_recepcion')), small_s),
                Paragraph(_fmt_date(sv.get('fecha_entrega')), small_s),
                Paragraph(moto, small_s),
                Paragraph(mecanico, small_s),
                Paragraph(status_label, small_s),
                Paragraph(_fmt(sv.get('total', 0)), small_s),
            ])

        col_w = [W * 0.13, W * 0.09, W * 0.09, W * 0.23, W * 0.18, W * 0.14, W * 0.14]
        detail_t = Table(rows, colWidths=col_w, repeatRows=1)

        style_cmds = [
            ('BACKGROUND',     (0, 0), (-1, 0),  rl_blue_light),
            ('TEXTCOLOR',      (0, 0), (-1, 0),  rl_white),
            ('FONTNAME',       (0, 0), (-1, 0),  'Helvetica-Bold'),
            ('FONTSIZE',       (0, 0), (-1, 0),  8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [rl_white, rl_blue_bg]),
            ('ALIGN',          (6, 0), (6, -1),  'RIGHT'),
            ('TOPPADDING',     (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING',  (0, 0), (-1, -1), 5),
            ('LEFTPADDING',    (0, 0), (-1, -1), 6),
            ('BOX',            (0, 0), (-1, -1), 0.5, rl_gray_light),
            ('INNERGRID',      (0, 0), (-1, -1), 0.25, rl_gray_light),
        ]
        detail_t.setStyle(TableStyle(style_cmds))
        story.append(detail_t)

    # ── 5. Footer ─────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.6 * cm))
    story.append(HRFlowable(width=W, color=rl_gray_light))
    story.append(Spacer(1, 0.2 * cm))
    gen_time = timezone.localtime(timezone.now()).strftime('%d/%m/%Y %H:%M:%S')
    story.append(Paragraph(
        f'Reporte generado el {gen_time} · MotoQFox Sistema de Gestión',
        footer_s,
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer
