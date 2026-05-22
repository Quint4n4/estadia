"""
Customers Models — MotoQFox
============================
ClienteProfile — extends CustomUser (role=CUSTOMER) with loyalty & QR data
"""
import uuid
from django.db import models


class ClienteProfile(models.Model):
    """
    One-to-one extension of CustomUser (role=CUSTOMER).
    Stores contact info, QR token and loyalty points.
    """
    usuario     = models.OneToOneField(
        'users.CustomUser', on_delete=models.PROTECT,
        related_name='cliente_profile', verbose_name='Usuario'
    )
    telefono    = models.CharField(max_length=20, blank=True, default='', verbose_name='Teléfono')
    fecha_nac   = models.DateField(null=True, blank=True, verbose_name='Fecha de nacimiento')
    qr_token    = models.UUIDField(default=uuid.uuid4, unique=True, verbose_name='Token QR')
    foto_url    = models.CharField(max_length=500, blank=True, default='', verbose_name='URL de foto')
    puntos      = models.PositiveIntegerField(default=0, verbose_name='Puntos acumulados')
    created_at  = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de registro')

    class Meta:
        db_table = 'customers_perfiles'
        ordering = ['-created_at']
        verbose_name = 'Perfil de cliente'
        verbose_name_plural = 'Perfiles de clientes'

    def __str__(self):
        return f'{self.usuario.get_full_name()} — {self.puntos} pts'


class EmailLog(models.Model):
    """Registro de cada correo enviado por el sistema (para el panel de recepción)."""

    class Tipo(models.TextChoices):
        TICKET_VENTA    = 'TICKET_VENTA',    'Ticket de venta'
        TICKET_SERVICIO = 'TICKET_SERVICIO', 'Ticket de servicio'
        ESTATUS         = 'ESTATUS',         'Aviso de estatus'
        RECEPCION       = 'RECEPCION',       'Recepción / seguimiento'
        LISTO           = 'LISTO',           'Moto lista'
        CREDENCIALES    = 'CREDENCIALES',    'Credenciales'
        RESET           = 'RESET',           'Restablecer contraseña'
        OTRO            = 'OTRO',             'Otro'

    destinatario = models.EmailField(max_length=254, verbose_name='Destinatario (real)')
    asunto       = models.CharField(max_length=300, verbose_name='Asunto')
    tipo         = models.CharField(max_length=20, choices=Tipo.choices, default=Tipo.OTRO, verbose_name='Tipo')
    cliente      = models.ForeignKey(
        'customers.ClienteProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='correos', verbose_name='Cliente',
    )
    enviado      = models.BooleanField(default=False, verbose_name='Enviado')
    error        = models.CharField(max_length=1000, blank=True, default='', verbose_name='Error')
    html         = models.TextField(blank=True, default='', verbose_name='Cuerpo HTML')
    texto        = models.TextField(blank=True, default='', verbose_name='Cuerpo texto')
    contexto     = models.JSONField(default=dict, blank=True, verbose_name='Contexto (para reenviar)')
    created_at   = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de envío')

    class Meta:
        db_table = 'customers_email_log'
        ordering = ['-created_at']
        verbose_name = 'Registro de correo'
        verbose_name_plural = 'Registro de correos'
        indexes = [
            models.Index(fields=['destinatario', 'created_at'], name='emaillog_dest_fecha_idx'),
            models.Index(fields=['cliente', 'created_at'],      name='emaillog_cli_fecha_idx'),
        ]

    def __str__(self):
        estado = 'OK' if self.enviado else 'FALLÓ'
        return f'[{estado}] {self.get_tipo_display()} → {self.destinatario}'
