"""
Servicio de correo unificado — MotoQFox
=======================================
Único punto de envío de correo del sistema. Usa Resend vía HTTPS porque
Railway bloquea SMTP/587. Todos los módulos (ventas, taller, usuarios) deben
enviar correo a través de send_email() en lugar de django.core.mail.send_mail
o llamadas directas a resend.
"""
import base64
import os

from django.conf import settings


def send_email(to, subject, html, text=None, attachments=None, *,
               tipo='OTRO', cliente=None, contexto=None) -> bool:
    """
    Envía un correo con Resend y lo registra en EmailLog (panel de recepción).

    Args:
        to:          str o lista de str con los destinatarios.
        subject:     asunto del correo.
        html:        cuerpo HTML.
        text:        cuerpo de texto plano (opcional, recomendado).
        attachments: lista de dicts {"filename": str, "content": <base64 str>}.
        tipo:        categoría para el panel (TICKET_VENTA, ESTATUS, RESET, ...).
        cliente:     ClienteProfile asociado (opcional; si no, se vincula por correo).
        contexto:    dict con datos para reenviar (p. ej. {'venta_id': 5}).

    Returns:
        True si se envió, False si se omitió (sin API key) o falló.
        Nunca lanza excepción: el correo nunca debe tumbar una operación de negocio.
    """
    orig_to      = to if isinstance(to, str) else (', '.join(to) if to else '')
    orig_subject = subject

    api_key = getattr(settings, 'RESEND_API_KEY', '')
    if not api_key:
        print(f'[EMAIL] RESEND_API_KEY no configurado — se omite el correo: "{subject}"')
        _log_email(orig_to, orig_subject, tipo, cliente, False,
                   'RESEND_API_KEY no configurado', html, text, contexto)
        return False

    # SEGURIDAD (staging/pruebas): si EMAIL_OVERRIDE_TO está configurado, TODOS los
    # correos se redirigen a esa dirección, para NUNCA escribirle a un cliente real
    # con mensajes de prueba. En producción esta variable se deja vacía.
    override = os.environ.get('EMAIL_OVERRIDE_TO', '').strip()
    if override:
        to = override
        subject = f'[PRUEBA→{orig_to}] {subject}'

    enviado, error = False, ''
    try:
        import resend
        resend.api_key = api_key
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'MotoQFox <onboarding@resend.dev>')

        payload = {
            'from':    from_email,
            'to':      [to] if isinstance(to, str) else list(to),
            'subject': subject,
            'html':    html,
        }
        if text:
            payload['text'] = text
        if attachments:
            payload['attachments'] = attachments

        resend.Emails.send(payload)
        enviado = True
        print(f'[EMAIL] Enviado a {payload["to"]}: "{subject}"')
    except Exception as exc:
        error = str(exc)
        print(f'[EMAIL ERROR] No se pudo enviar "{subject}": {exc}')

    _log_email(orig_to, orig_subject, tipo, cliente, enviado, error, html, text, contexto)
    return enviado


def _log_email(destinatario, asunto, tipo, cliente, enviado, error, html, text, contexto):
    """Registra el correo en EmailLog. Nunca lanza (el registro no debe tumbar el envío)."""
    try:
        from customers.models import EmailLog, ClienteProfile
        cli = cliente
        if cli is None and destinatario:
            cli = ClienteProfile.objects.filter(usuario__email__iexact=destinatario).first()
        EmailLog.objects.create(
            destinatario=(destinatario or '')[:254],
            asunto=(asunto or '')[:300],
            tipo=tipo or 'OTRO',
            cliente=cli,
            enviado=bool(enviado),
            error=(error or '')[:1000],
            html=html or '',
            texto=text or '',
            contexto=contexto or {},
        )
    except Exception as exc:
        print(f'[EMAIL][LOG] No se pudo registrar el correo: {exc}')


def attachment_from_bytes(filename: str, raw_bytes: bytes) -> dict:
    """Construye un attachment para Resend a partir de bytes (p. ej. un PDF en memoria)."""
    return {
        'filename': filename,
        'content':  base64.b64encode(raw_bytes).decode('utf-8'),
    }


# ── Plantilla HTML de marca (correos a clientes) ─────────────────────────────

def branded_email(subtitle: str, body_html: str) -> str:
    """Envuelve el contenido en una tarjeta con la marca MotoQFox."""
    return f"""\
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;
                padding:28px 24px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;">
      <div style="text-align:center;margin-bottom:22px;">
        <div style="font-size:30px;line-height:1;">&#127949;&#65039;</div>
        <h1 style="color:#1a202c;font-size:22px;margin:6px 0 0;font-weight:800;">MotoQFox</h1>
        <p style="color:#718096;margin:4px 0 0;font-size:13px;">{subtitle}</p>
      </div>
      {body_html}
      <p style="color:#a0aec0;font-size:11px;text-align:center;margin-top:26px;line-height:1.6;">
        Este correo fue generado automáticamente por el sistema MotoQFox.<br>
        Por favor no respondas a este mensaje.
      </p>
    </div>"""


def email_button(text: str, url: str) -> str:
    """Botón de acción con estilo (degradado MotoQFox). Se omite si la URL no es absoluta."""
    if not url or not url.startswith('http'):
        return ''
    return f"""
    <div style="text-align:center;margin:26px 0;">
      <a href="{url}" style="background:linear-gradient(135deg,#667eea,#764ba2);color:#ffffff;
            padding:14px 30px;border-radius:10px;text-decoration:none;font-weight:700;
            font-size:15px;display:inline-block;">{text}</a>
    </div>
    <p style="color:#718096;font-size:12px;text-align:center;word-break:break-all;">
      O copia este enlace:<br><span style="color:#4c51bf;">{url}</span>
    </p>"""
