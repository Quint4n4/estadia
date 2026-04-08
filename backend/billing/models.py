"""
Billing Models — MotoQFox
==========================
ConfiguracionFiscalSede — commercial/fiscal info per sede used on printed tickets.
"""
from decimal import Decimal
from django.db import models


class ConfiguracionFiscalSede(models.Model):
    """
    Non-sensitive commercial information shown on printed receipts.
    One configuration per sede, managed by the administrator.
    """
    sede              = models.OneToOneField(
        'branches.Sede', on_delete=models.PROTECT,
        related_name='config_fiscal', verbose_name='Sede'
    )
    nombre_comercial  = models.CharField(max_length=200, verbose_name='Nombre comercial')
    nombre_legal      = models.CharField(max_length=300, blank=True, verbose_name='Razón social / Nombre legal')
    rfc               = models.CharField(max_length=13, blank=True, verbose_name='RFC')
    direccion         = models.TextField(blank=True, verbose_name='Dirección')
    telefono          = models.CharField(max_length=30, blank=True, verbose_name='Teléfono')
    email             = models.EmailField(blank=True, verbose_name='Email de contacto')
    logo_url          = models.CharField(max_length=500, blank=True, verbose_name='URL del logotipo')
    leyenda_ticket    = models.TextField(
        default='Gracias por su compra. Este documento no es una factura fiscal.',
        verbose_name='Leyenda del ticket'
    )
    iva_tasa          = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=Decimal('16.00'),
        verbose_name='Tasa de IVA (%)',
        help_text='Porcentaje de IVA aplicado en los tickets (ej. 16.00 para 16%)'
    )
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'billing_config_fiscal_sede'
        verbose_name = 'Configuración fiscal de sede'

    def __str__(self):
        return f'Config Fiscal — {self.sede.name}'
