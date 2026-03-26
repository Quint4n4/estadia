"""
Taller Models — MotoQFox
=========================
MotoCliente     — moto registrada de un cliente (puede ser walk-in sin cuenta)
ServicioMoto    — orden de servicio con cotización y seguimiento de estados
ServicioItem    — líneas del ticket (refacción, mano de obra, refacción extra)
SolicitudRefaccionExtra — solicitud de pieza extra por mecánico durante el servicio
"""
import uuid

from django.db import models
from django.db import transaction
from django.utils import timezone
from django.db.models import F


# ─────────────────────────────────────────────────────────────────────────────
#  MOTO DEL CLIENTE
# ─────────────────────────────────────────────────────────────────────────────

class MotoCliente(models.Model):
    """
    Moto registrada en el sistema. Puede estar vinculada a un ClienteProfile
    (cliente con cuenta) o ser un registro walk-in (cliente=null).
    """
    cliente = models.ForeignKey(
        'customers.ClienteProfile',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='motos',
        verbose_name='Cliente'
    )
    marca   = models.CharField(max_length=100, verbose_name='Marca')
    modelo  = models.CharField(max_length=100, verbose_name='Modelo')
    año     = models.SmallIntegerField(verbose_name='Año')
    numero_serie = models.CharField(max_length=100, blank=True, default='', verbose_name='Número de serie')
    placa   = models.CharField(max_length=20, blank=True, default='', verbose_name='Placa')
    color   = models.CharField(max_length=50, blank=True, default='', verbose_name='Color')
    notas   = models.TextField(blank=True, default='', verbose_name='Notas')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'taller_motos_cliente'
        ordering = ['-created_at']
        verbose_name = 'Moto del cliente'
        verbose_name_plural = 'Motos de clientes'

    def __str__(self):
        return f'{self.marca} {self.modelo} {self.año} — {self.placa or "sin placa"}'


# ─────────────────────────────────────────────────────────────────────────────
#  SERVICIO MOTO (Orden de servicio)
# ─────────────────────────────────────────────────────────────────────────────

class ServicioMoto(models.Model):

    class Status(models.TextChoices):
        RECIBIDO             = 'RECIBIDO',             'Recibido'
        EN_DIAGNOSTICO       = 'EN_DIAGNOSTICO',       'En diagnóstico'
        EN_PROCESO           = 'EN_PROCESO',           'En proceso'
        COTIZACION_EXTRA     = 'COTIZACION_EXTRA',     'Cotización extra pendiente'
        LISTA_PARA_ENTREGAR  = 'LISTA_PARA_ENTREGAR',  'Lista para entregar'
        CANCELADO            = 'CANCELADO',            'Cancelada'
        LISTO                = 'LISTO',                'Lista para entregar'
        ENTREGADO            = 'ENTREGADO',            'Entregado'

    class PagoStatus(models.TextChoices):
        PENDIENTE_PAGO = 'PENDIENTE_PAGO', 'Pendiente de pago'
        PAGADO         = 'PAGADO',         'Pagado'

    class MetodoPago(models.TextChoices):
        EFECTIVO      = 'EFECTIVO',      'Efectivo'
        TARJETA       = 'TARJETA',       'Tarjeta'
        TRANSFERENCIA = 'TRANSFERENCIA', 'Transferencia'

    # Identificación
    folio  = models.CharField(max_length=25, unique=True, verbose_name='Folio')
    sede   = models.ForeignKey(
        'branches.Sede', on_delete=models.PROTECT,
        related_name='servicios', verbose_name='Sede'
    )

    # Cliente y moto
    cliente = models.ForeignKey(
        'customers.ClienteProfile',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='servicios',
        verbose_name='Cliente'
    )
    moto = models.ForeignKey(
        MotoCliente,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='servicios',
        verbose_name='Moto'
    )
    descripcion    = models.TextField(verbose_name='Descripción del servicio')
    es_reparacion  = models.BooleanField(default=False, verbose_name='Es reparación')

    # Personal asignado
    cajero = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.PROTECT,
        related_name='servicios_recibidos',
        verbose_name='Cajero / Recepcionista'
    )
    mecanico = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='servicios_asignados',
        verbose_name='Mecánico'
    )
    asignado_por = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='servicios_asignados_por',
        verbose_name='Asignado por'
    )

    # Estado
    status      = models.CharField(
        max_length=20, choices=Status.choices,
        default=Status.RECIBIDO, verbose_name='Estado'
    )
    pago_status = models.CharField(
        max_length=20, choices=PagoStatus.choices,
        default=PagoStatus.PENDIENTE_PAGO, verbose_name='Estado de pago'
    )

    # Montos
    mano_de_obra       = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Mano de obra')
    total_refacciones  = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Total refacciones')
    total              = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Total')

    # Pago (se llena al entregar)
    metodo_pago  = models.CharField(
        max_length=15, choices=MetodoPago.choices,
        null=True, blank=True, verbose_name='Método de pago'
    )
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Monto pagado')
    cambio       = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Cambio')

    # Checklist de recepción (lista de strings con los ítems marcados)
    checklist_recepcion = models.JSONField(default=list, blank=True, verbose_name='Checklist de recepción')

    # Notificación al cliente
    cliente_notificado = models.BooleanField(default=False, verbose_name='Cliente notificado')

    # Diagnóstico del mecánico
    diagnostico_mecanico    = models.TextField(blank=True, default='', verbose_name='Diagnóstico del mecánico')
    refacciones_requeridas  = models.TextField(blank=True, default='', verbose_name='Refacciones requeridas')
    diagnostico_listo = models.BooleanField(
        default=False,
        verbose_name='Diagnóstico enviado a recepción',
        help_text='El mecánico marcó el diagnóstico como completo y listo para autorizar',
    )

    # Notas internas (solo visible para el taller)
    notas_internas = models.TextField(blank=True, default='', verbose_name='Notas internas')

    # Timestamps de estados
    fecha_recepcion          = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de recepción')
    fecha_entrega_estimada   = models.DateField(null=True, blank=True, verbose_name='Entrega estimada')
    fecha_inicio             = models.DateTimeField(null=True, blank=True, verbose_name='Inicio de trabajo')
    fecha_listo              = models.DateTimeField(null=True, blank=True, verbose_name='Trabajo terminado')
    fecha_entrega            = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de entrega')

    # Token de seguimiento público
    tracking_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        verbose_name='Token de seguimiento público',
    )

    # Archivado en historial
    archivado       = models.BooleanField(default=False, db_index=True, verbose_name='Archivado en historial')
    fecha_archivado = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de archivado')
    archivado_por   = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='ordenes_archivadas',
        verbose_name='Archivado por'
    )
    venta = models.ForeignKey(
        'sales.Venta', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='servicios_taller',
        verbose_name='Venta registrada',
    )

    class Meta:
        db_table = 'taller_servicios'
        ordering = ['-fecha_recepcion']
        verbose_name = 'Servicio'
        verbose_name_plural = 'Servicios'

    def __str__(self):
        return f'{self.folio} — {self.get_status_display()}'

    @classmethod
    def generar_folio(cls, sede_id):
        """Genera un folio único por sede y día: SVC-YYYYMMDD-NNNN"""
        from django.utils import timezone
        hoy = timezone.localdate()
        count = cls.objects.filter(
            sede_id=sede_id,
            fecha_recepcion__date=hoy
        ).count()
        return f"SVC-{hoy:%Y%m%d}-{count + 1:04d}"

    def recalcular_totales(self):
        """Recalcula total_refacciones y total desde los ServicioItems aprobados."""
        from django.db.models import Sum
        total_ref = self.items.filter(
            tipo__in=['REFACCION', 'EXTRA'],
            aprobado=True
        ).aggregate(t=Sum('subtotal'))['t'] or 0
        self.total_refacciones = total_ref
        self.total = self.mano_de_obra + total_ref
        self.save(update_fields=['total_refacciones', 'total'])


# ─────────────────────────────────────────────────────────────────────────────
#  IMAGEN DE EVIDENCIA
# ─────────────────────────────────────────────────────────────────────────────

class ServicioImagen(models.Model):
    """Fotografías de evidencia tomadas al recibir la moto."""
    servicio    = models.ForeignKey(
        ServicioMoto, on_delete=models.CASCADE,
        related_name='imagenes', verbose_name='Servicio'
    )
    imagen      = models.ImageField(upload_to='taller/imagenes/%Y/%m/', verbose_name='Imagen')
    descripcion = models.CharField(max_length=200, blank=True, default='', verbose_name='Descripción')
    subida_por  = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='imagenes_taller', verbose_name='Subida por'
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'taller_servicio_imagenes'
        ordering = ['created_at']
        verbose_name = 'Imagen de servicio'
        verbose_name_plural = 'Imágenes de servicio'

    def __str__(self):
        return f'{self.servicio.folio} — imagen {self.id}'


# ─────────────────────────────────────────────────────────────────────────────
#  SERVICIO ITEM (líneas del ticket)
# ─────────────────────────────────────────────────────────────────────────────

class ServicioItem(models.Model):

    class Tipo(models.TextChoices):
        REFACCION  = 'REFACCION',  'Refacción cotizada'
        MANO_OBRA  = 'MANO_OBRA',  'Mano de obra'
        EXTRA      = 'EXTRA',      'Refacción extra'

    servicio       = models.ForeignKey(
        ServicioMoto, on_delete=models.CASCADE,
        related_name='items', verbose_name='Servicio'
    )
    tipo           = models.CharField(max_length=15, choices=Tipo.choices, verbose_name='Tipo')
    descripcion    = models.CharField(max_length=200, verbose_name='Descripción')
    producto       = models.ForeignKey(
        'inventory.Producto',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='servicio_items',
        verbose_name='Producto'
    )
    cantidad       = models.IntegerField(default=1, verbose_name='Cantidad')
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Precio unitario')
    subtotal       = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Subtotal')
    aprobado       = models.BooleanField(
        default=True,
        verbose_name='Aprobado',
        help_text='False para ítems EXTRA hasta que el cliente los autorice'
    )
    created_by     = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='servicio_items_creados',
        verbose_name='Creado por'
    )
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'taller_servicio_items'
        ordering = ['created_at']
        verbose_name = 'Ítem de servicio'
        verbose_name_plural = 'Ítems de servicio'

    def save(self, *args, **kwargs):
        self.subtotal = self.precio_unitario * self.cantidad
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.servicio.folio} — {self.descripcion} x{self.cantidad}'


# ─────────────────────────────────────────────────────────────────────────────
#  SOLICITUD DE REFACCIÓN EXTRA
# ─────────────────────────────────────────────────────────────────────────────

class SolicitudRefaccionExtra(models.Model):

    class Status(models.TextChoices):
        PENDIENTE  = 'PENDIENTE',  'Pendiente de autorización'
        APROBADA   = 'APROBADA',   'Aprobada'
        RECHAZADA  = 'RECHAZADA',  'Rechazada'

    servicio      = models.ForeignKey(
        ServicioMoto, on_delete=models.CASCADE,
        related_name='solicitudes_extra',
        verbose_name='Servicio'
    )
    mecanico      = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.PROTECT,
        related_name='solicitudes_extra_creadas',
        verbose_name='Mecánico'
    )
    producto      = models.ForeignKey(
        'inventory.Producto',
        on_delete=models.PROTECT,
        related_name='solicitudes_extra',
        verbose_name='Producto'
    )
    cantidad      = models.IntegerField(verbose_name='Cantidad')
    motivo        = models.TextField(verbose_name='Motivo / Justificación')
    status        = models.CharField(
        max_length=15, choices=Status.choices,
        default=Status.PENDIENTE, verbose_name='Estado'
    )
    respondido_por = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='solicitudes_extra_respondidas',
        verbose_name='Respondido por'
    )
    created_at    = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de solicitud')
    respondido_at = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de respuesta')

    class Meta:
        db_table = 'taller_solicitudes_extra'
        ordering = ['-created_at']
        verbose_name = 'Solicitud de refacción extra'
        verbose_name_plural = 'Solicitudes de refacción extra'

    def __str__(self):
        return f'{self.servicio.folio} — {self.producto.name} x{self.cantidad} [{self.get_status_display()}]'
