"""
Catálogo de Servicios Models — MotoQFox
=========================================
CategoriaServicio  — categorías de servicios del taller
CatalogoServicio   — servicios disponibles con precio base y duración estimada
CatalogoServicioRefaccion — refacciones requeridas/opcionales por servicio
PrecioServicioSede — override de precio por sede
"""
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models


# Validador compartido para nombres con letras, acentos, ñ, espacios y guiones
_nombre_validator = RegexValidator(
    regex=r'^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-]+$',
    message='Solo se permiten letras y espacios.',
)


# ─────────────────────────────────────────────────────────────────────────────
#  CATEGORÍA DE SERVICIO
# ─────────────────────────────────────────────────────────────────────────────

class CategoriaServicio(models.Model):
    nombre = models.CharField(
        max_length=100,
        unique=True,
        validators=[_nombre_validator],
        verbose_name='Nombre',
    )
    descripcion = models.TextField(blank=True, default='', verbose_name='Descripción')
    activo = models.BooleanField(default=True, verbose_name='Activo')

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Categoría de Servicio'
        verbose_name_plural = 'Categorías de Servicios'

    def __str__(self):
        return self.nombre


# ─────────────────────────────────────────────────────────────────────────────
#  CATÁLOGO DE SERVICIO
# ─────────────────────────────────────────────────────────────────────────────

class CatalogoServicio(models.Model):
    nombre = models.CharField(
        max_length=200,
        unique=True,
        validators=[_nombre_validator],
        verbose_name='Nombre',
    )
    descripcion = models.TextField(blank=True, default='', verbose_name='Descripción')
    precio_base = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='Precio base del servicio en MXN (opcional)',
        verbose_name='Precio base',
    )
    duracion_estimada_minutos = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Duración estimada en minutos (opcional)',
        verbose_name='Duración estimada (min)',
    )
    categoria = models.ForeignKey(
        CategoriaServicio,
        on_delete=models.PROTECT,
        related_name='servicios',
        verbose_name='Categoría',
    )
    activo = models.BooleanField(default=True, verbose_name='Activo')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='servicios_catalogo_creados',
        verbose_name='Creado por',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado en')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado en')

    class Meta:
        ordering = ['categoria', 'nombre']
        verbose_name = 'Servicio del Catálogo'
        verbose_name_plural = 'Catálogo de Servicios'

    def __str__(self):
        precio = f'${self.precio_base}' if self.precio_base is not None else 'Sin precio'
        return f"{self.nombre} ({precio})"


# ─────────────────────────────────────────────────────────────────────────────
#  REFACCIONES DEL SERVICIO
# ─────────────────────────────────────────────────────────────────────────────

class CatalogoServicioRefaccion(models.Model):
    servicio = models.ForeignKey(
        CatalogoServicio,
        on_delete=models.CASCADE,
        related_name='refacciones',
        verbose_name='Servicio',
    )
    producto = models.ForeignKey(
        'inventory.Producto',
        on_delete=models.PROTECT,
        related_name='en_servicios',
        verbose_name='Producto',
    )
    cantidad = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Cantidad',
    )
    es_opcional = models.BooleanField(
        default=False,
        help_text='Si es True, la refacción es opcional y no bloquea la disponibilidad del servicio',
        verbose_name='Es opcional',
    )

    class Meta:
        unique_together = ('servicio', 'producto')
        ordering = ['es_opcional', 'producto__name']
        verbose_name = 'Refacción del Servicio'
        verbose_name_plural = 'Refacciones del Servicio'

    def __str__(self):
        return f"{self.producto.name} x{self.cantidad}"


# ─────────────────────────────────────────────────────────────────────────────
#  PRECIO DE SERVICIO POR SEDE
# ─────────────────────────────────────────────────────────────────────────────

class PrecioServicioSede(models.Model):
    servicio = models.ForeignKey(
        CatalogoServicio,
        on_delete=models.CASCADE,
        related_name='precios_sede',
        verbose_name='Servicio',
    )
    sede = models.ForeignKey(
        'branches.Sede',
        on_delete=models.CASCADE,
        related_name='precios_servicio',
        verbose_name='Sede',
    )
    precio_override = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Precio override',
    )
    activo = models.BooleanField(default=True, verbose_name='Activo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado en')

    class Meta:
        unique_together = ('servicio', 'sede')
        verbose_name = 'Precio de Servicio por Sede'
        verbose_name_plural = 'Precios de Servicios por Sede'

    def __str__(self):
        return f"{self.servicio.nombre} - {self.sede} (${self.precio_override})"
