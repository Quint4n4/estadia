"""
Serializers for Catálogo de Servicios — MotoQFox
==================================================
CategoriaServicioSerializer
CatalogoServicioRefaccionSerializer  (lectura)
CatalogoServicioRefaccionInputSerializer  (escritura)
CatalogoServicioListSerializer
CatalogoServicioDetailSerializer
CatalogoServicioCreateSerializer
DisponibilidadRefaccionSerializer
DisponibilidadServicioSerializer
PrecioServicioSedeSerializer
"""
from django.db import transaction
from rest_framework import serializers

from inventory.models import Producto
from branches.models import Sede
from .models import (
    CategoriaServicio,
    CatalogoServicio,
    CatalogoServicioRefaccion,
    PrecioServicioSede,
)
from .validators import validar_solo_letras


# ─────────────────────────────────────────────────────────────────────────────
#  CATEGORÍA DE SERVICIO
# ─────────────────────────────────────────────────────────────────────────────

class CategoriaServicioSerializer(serializers.ModelSerializer):
    total_servicios = serializers.SerializerMethodField()

    class Meta:
        model = CategoriaServicio
        fields = ('id', 'nombre', 'descripcion', 'activo', 'total_servicios')
        read_only_fields = ('id',)

    def get_total_servicios(self, obj):
        return obj.servicios.filter(activo=True).count()

    def validate_nombre(self, value):
        value = value.strip()
        validar_solo_letras(value)
        value = value.title()
        # Validar unicidad (excluir instancia actual en caso de update)
        qs = CategoriaServicio.objects.filter(nombre=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f'Ya existe una categoría con el nombre "{value}".'
            )
        return value


# ─────────────────────────────────────────────────────────────────────────────
#  REFACCIONES DEL CATÁLOGO — LECTURA
# ─────────────────────────────────────────────────────────────────────────────

class _ProductoRefaccionSerializer(serializers.ModelSerializer):
    """Sub-serializer de solo lectura para el producto anidado en una refacción."""

    class Meta:
        model = Producto
        fields = ('id', 'name', 'sku', 'price')
        read_only_fields = ('id', 'name', 'sku', 'price')


class CatalogoServicioRefaccionSerializer(serializers.ModelSerializer):
    """Serializer de lectura para CatalogoServicioRefaccion."""
    producto = _ProductoRefaccionSerializer(read_only=True)

    class Meta:
        model = CatalogoServicioRefaccion
        fields = ('id', 'producto', 'cantidad', 'es_opcional')
        read_only_fields = ('id', 'producto', 'cantidad', 'es_opcional')


# ─────────────────────────────────────────────────────────────────────────────
#  REFACCIONES DEL CATÁLOGO — ESCRITURA
# ─────────────────────────────────────────────────────────────────────────────

class CatalogoServicioRefaccionInputSerializer(serializers.Serializer):
    """Serializer de escritura para una refacción dentro de un servicio."""
    producto   = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.filter(is_active=True)
    )
    cantidad   = serializers.IntegerField(min_value=1)
    es_opcional = serializers.BooleanField(default=False)

    def validate_producto(self, value):
        if not value.is_active:
            raise serializers.ValidationError(
                f'El producto "{value.name}" no está activo.'
            )
        return value


# ─────────────────────────────────────────────────────────────────────────────
#  CATÁLOGO DE SERVICIO — LISTA (lectura compacta)
# ─────────────────────────────────────────────────────────────────────────────

class CatalogoServicioListSerializer(serializers.ModelSerializer):
    categoria     = serializers.SerializerMethodField()
    categoria_id  = serializers.IntegerField(read_only=True)
    total_refacciones = serializers.SerializerMethodField()

    class Meta:
        model = CatalogoServicio
        fields = (
            'id', 'nombre', 'descripcion', 'precio_base',
            'duracion_estimada_minutos', 'categoria', 'categoria_id',
            'activo', 'total_refacciones',
        )
        read_only_fields = (
            'id', 'nombre', 'descripcion', 'precio_base',
            'duracion_estimada_minutos', 'categoria', 'categoria_id',
            'activo', 'total_refacciones',
        )

    def get_categoria(self, obj):
        return obj.categoria.nombre if obj.categoria_id else None

    def get_total_refacciones(self, obj):
        return obj.refacciones.count()


# ─────────────────────────────────────────────────────────────────────────────
#  CATÁLOGO DE SERVICIO — DETALLE (lectura completa)
# ─────────────────────────────────────────────────────────────────────────────

class CatalogoServicioDetailSerializer(CatalogoServicioListSerializer):
    refacciones      = CatalogoServicioRefaccionSerializer(many=True, read_only=True)
    created_by_name  = serializers.SerializerMethodField()

    class Meta(CatalogoServicioListSerializer.Meta):
        fields = CatalogoServicioListSerializer.Meta.fields + (
            'refacciones', 'created_by_name', 'created_at', 'updated_at',
        )
        read_only_fields = fields

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return 'Sistema'


# ─────────────────────────────────────────────────────────────────────────────
#  CATÁLOGO DE SERVICIO — CREAR / ACTUALIZAR
# ─────────────────────────────────────────────────────────────────────────────

class CatalogoServicioCreateSerializer(serializers.ModelSerializer):
    categoria  = serializers.PrimaryKeyRelatedField(
        queryset=CategoriaServicio.objects.filter(activo=True)
    )
    refacciones = CatalogoServicioRefaccionInputSerializer(
        many=True, required=False, default=list
    )
    precio_base = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False, allow_null=True,
    )
    duracion_estimada_minutos = serializers.IntegerField(
        required=False, allow_null=True, min_value=1,
    )

    class Meta:
        model = CatalogoServicio
        fields = (
            'nombre', 'descripcion', 'precio_base',
            'duracion_estimada_minutos', 'categoria', 'refacciones',
        )

    def validate_nombre(self, value):
        value = value.strip()
        validar_solo_letras(value)
        value = value.title()
        # Validar unicidad (excluir instancia actual en caso de update)
        qs = CatalogoServicio.objects.filter(nombre=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f'Ya existe un servicio con el nombre "{value}".'
            )
        return value

    def validate_precio_base(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError('El precio debe ser mayor a cero.')
        return value

    def validate_refacciones(self, value):
        vistos = {}
        for item in value:
            producto = item['producto']
            if producto.id in vistos:
                raise serializers.ValidationError(
                    f'El producto {producto.name} aparece duplicado en la lista de refacciones.'
                )
            vistos[producto.id] = True
        return value

    @transaction.atomic
    def create(self, validated_data):
        refacciones_data = validated_data.pop('refacciones', [])
        servicio = CatalogoServicio.objects.create(
            **validated_data,
            created_by=self.context['request'].user,
        )
        if refacciones_data:
            CatalogoServicioRefaccion.objects.bulk_create([
                CatalogoServicioRefaccion(
                    servicio=servicio,
                    producto=r['producto'],
                    cantidad=r['cantidad'],
                    es_opcional=r.get('es_opcional', False),
                )
                for r in refacciones_data
            ])
        return servicio

    @transaction.atomic
    def update(self, instance, validated_data):
        refacciones_data = validated_data.pop('refacciones', None)

        # Actualizar campos simples
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si se proporcionaron refacciones, reemplazar las existentes
        if refacciones_data is not None:
            instance.refacciones.all().delete()
            if refacciones_data:
                CatalogoServicioRefaccion.objects.bulk_create([
                    CatalogoServicioRefaccion(
                        servicio=instance,
                        producto=r['producto'],
                        cantidad=r['cantidad'],
                        es_opcional=r.get('es_opcional', False),
                    )
                    for r in refacciones_data
                ])
        return instance


# ─────────────────────────────────────────────────────────────────────────────
#  DISPONIBILIDAD DE REFACCIÓN / SERVICIO (solo lectura, no ModelSerializer)
# ─────────────────────────────────────────────────────────────────────────────

class DisponibilidadRefaccionSerializer(serializers.Serializer):
    """Representa la disponibilidad de una refacción individual para un servicio."""
    producto_nombre = serializers.CharField()
    requerido       = serializers.IntegerField()
    en_stock        = serializers.IntegerField()
    suficiente      = serializers.BooleanField()
    es_opcional     = serializers.BooleanField()


class DisponibilidadServicioSerializer(serializers.Serializer):
    """Representa la disponibilidad global de un servicio dada la sede actual."""
    servicio_id     = serializers.IntegerField()
    servicio_nombre = serializers.CharField()
    disponible      = serializers.BooleanField()
    refacciones     = DisponibilidadRefaccionSerializer(many=True)


# ─────────────────────────────────────────────────────────────────────────────
#  PRECIO DE SERVICIO POR SEDE
# ─────────────────────────────────────────────────────────────────────────────

class PrecioServicioSedeSerializer(serializers.ModelSerializer):
    sede       = serializers.PrimaryKeyRelatedField(
        queryset=Sede.objects.filter(is_active=True)
    )
    sede_nombre = serializers.SerializerMethodField()

    class Meta:
        model = PrecioServicioSede
        fields = ('id', 'sede', 'sede_nombre', 'precio_override', 'activo')
        read_only_fields = ('id',)

    def get_sede_nombre(self, obj):
        return obj.sede.name

    def validate_precio_override(self, value):
        if value <= 0:
            raise serializers.ValidationError('El precio debe ser mayor a cero.')
        return value
