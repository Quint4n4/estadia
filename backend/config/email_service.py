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


def send_email(to, subject, html, text=None, attachments=None) -> bool:
    """
    Envía un correo con Resend.

    Args:
        to:          str o lista de str con los destinatarios.
        subject:     asunto del correo.
        html:        cuerpo HTML.
        text:        cuerpo de texto plano (opcional, recomendado).
        attachments: lista de dicts {"filename": str, "content": <base64 str>}.
                     Usa attachment_from_bytes() para construirlos.

    Returns:
        True si se envió, False si se omitió (sin API key) o falló.
        Nunca lanza excepción: el correo nunca debe tumbar una operación de negocio.
    """
    api_key = getattr(settings, 'RESEND_API_KEY', '')
    if not api_key:
        print(f'[EMAIL] RESEND_API_KEY no configurado — se omite el correo: "{subject}"')
        return False

    # SEGURIDAD (staging/pruebas): si EMAIL_OVERRIDE_TO está configurado, TODOS los
    # correos se redirigen a esa dirección, para NUNCA escribirle a un cliente real
    # con mensajes de prueba. En producción esta variable se deja vacía.
    override = os.environ.get('EMAIL_OVERRIDE_TO', '').strip()
    if override:
        destino_original = to if isinstance(to, str) else ', '.join(to)
        to = override
        subject = f'[PRUEBA→{destino_original}] {subject}'

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
        print(f'[EMAIL] Enviado a {payload["to"]}: "{subject}"')
        return True
    except Exception as exc:
        print(f'[EMAIL ERROR] No se pudo enviar "{subject}": {exc}')
        return False


def attachment_from_bytes(filename: str, raw_bytes: bytes) -> dict:
    """Construye un attachment para Resend a partir de bytes (p. ej. un PDF en memoria)."""
    return {
        'filename': filename,
        'content':  base64.b64encode(raw_bytes).decode('utf-8'),
    }
