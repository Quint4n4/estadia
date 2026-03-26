"""
Taller Serializers — MotoQFox
"""
from rest_framework import serializers
from django.utils import timezone
from .models import MotoCliente, ServicioMoto, ServicioItem, SolicitudRefaccionExtra, ServicioImagen
from inventory.models import Producto, Stock


# ─────────────────────────────────────────────────────────────────────────────
#  IMAGEN DE EVIDENCIA
# ─────────────────────────────────────────────────────────────────────────────

class ServicioImagenSerializer(serializers.ModelSerializer):
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = ServicioImagen
        fields = ['id', 'imagen_url', 'descripcion', 'created_at']
        read_only_fields = ['id', 'imagen_url', 'created_at']

    def get_imagen_url(self, obj):
        request = self.context.get('request')
        if obj.imagen and request:
            return request.build_absolute_uri(obj.imagen.url)
        return obj.imagen.url if obj.imagen else None


# ─────────────────────────────────────────────────────────────────────────────
#  MOTO CLIENTE
# ─────────────────────────────────────────────────────────────────────────────

class MotoClienteSerializer(serializers.ModelSerializer):
    anio = serializers.IntegerField(source='año')

    class Meta:
        model = MotoCliente
        fields = ['id', 'cliente', 'marca', 'modelo', 'anio', 'numero_serie', 'placa', 'color', 'notas', 'created_at']
        read_only_fields = ['id', 'created_at']


class MotoClienteMinimalSerializer(serializers.ModelSerializer):
    """Versión compacta para incluir en servicios."""
    anio = serializers.IntegerField(source='año')

    class Meta:
        model = MotoCliente
        fields = ['id', 'marca', 'modelo', 'anio', 'numero_serie', 'placa', 'color']


# ─────────────────────────────────────────────────────────────────────────────
#  SERVICIO ITEM
# ─────────────────────────────────────────────────────────────────────────────

class ServicioItemSerializer(serializers.ModelSerializer):
    producto_name = serializers.CharField(source='producto.name', read_only=True, default=None)
    producto_sku  = serializers.CharField(source='producto.sku', read_only=True, default=None)

    class Meta:
        model = ServicioItem
        fields = [
            'id', 'tipo', 'descripcion',
            'producto', 'producto_name', 'producto_sku',
            'cantidad', 'precio_unitario', 'subtotal',
            'aprobado', 'created_at'
        ]
        read_only_fields = ['id', 'subtotal', 'created_at', 'producto_name', 'producto_sku']


class ServicioItemInputSerializer(serializers.Serializer):
    """Para agregar items al crear un servicio."""
    tipo            = serializers.ChoiceField(choices=['REFACCION', 'MANO_OBRA'])
    descripcion     = serializers.CharField(max_length=200)
    producto        = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.filter(is_active=True),
        required=False, allow_null=True
    )
    cantidad        = serializers.IntegerField(min_value=1, default=1)
    precio_unitario = serializers.DecimalField(max_digits=10, decimal_places=2)


# ─────────────────────────────────────────────────────────────────────────────
#  SOLICITUD REFACCIÓN EXTRA
# ─────────────────────────────────────────────────────────────────────────────

class SolicitudRefaccionExtraSerializer(serializers.ModelSerializer):
    producto_name = serializers.CharField(source='producto.name', read_only=True)
    producto_sku  = serializers.CharField(source='producto.sku', read_only=True)
    mecanico_name = serializers.CharField(source='mecanico.get_full_name', read_only=True)

    class Meta:
        model = SolicitudRefaccionExtra
        fields = [
            'id', 'servicio', 'mecanico', 'mecanico_name',
            'producto', 'producto_name', 'producto_sku',
            'cantidad', 'motivo', 'status',
            'respondido_por', 'created_at', 'respondido_at'
        ]
        read_only_fields = ['id', 'status', 'respondido_por', 'created_at', 'respondido_at',
                            'producto_name', 'producto_sku', 'mecanico_name']


class SolicitudRefaccionExtraCreateSerializer(serializers.ModelSerializer):
    """Mecánico crea solicitud de pieza extra."""

    class Meta:
        model = SolicitudRefaccionExtra
        fields = ['servicio', 'producto', 'cantidad', 'motivo']

    def validate(self, data):
        servicio = data['servicio']
        user = self.context['request'].user
        # Solo el mecánico asignado puede solicitar piezas extra
        if servicio.mecanico != user:
            raise serializers.ValidationError('Solo el mecánico asignado puede solicitar piezas extra.')
        if servicio.status not in ['EN_DIAGNOSTICO', 'EN_PROCESO', 'COTIZACION_EXTRA']:
            raise serializers.ValidationError(
                f'No se pueden solicitar piezas para un servicio en estado {servicio.get_status_display()}.'
            )
        return data


# ─────────────────────────────────────────────────────────────────────────────
#  SERVICIO MOTO — READ
# ─────────────────────────────────────────────────────────────────────────────

class ServicioMotoListSerializer(serializers.ModelSerializer):
    """Versión compacta para listas y Kanban."""
    moto_display          = serializers.SerializerMethodField()
    cajero_nombre         = serializers.CharField(source='cajero.get_full_name', read_only=True)
    mecanico_nombre       = serializers.CharField(source='mecanico.get_full_name', read_only=True, default=None)
    cliente_nombre        = serializers.SerializerMethodField()
    sede_nombre           = serializers.CharField(source='sede.nombre', read_only=True, default='')
    status_display        = serializers.CharField(source='get_status_display', read_only=True)
    pago_status_display   = serializers.CharField(source='get_pago_status_display', read_only=True)
    descripcion_problema  = serializers.CharField(source='descripcion', read_only=True)
    tiempo_recibido       = serializers.SerializerMethodField()
    tiene_extra_pendiente = serializers.SerializerMethodField()
    archivado             = serializers.BooleanField(read_only=True)
    fecha_archivado       = serializers.DateTimeField(read_only=True)
    archivado_por_nombre  = serializers.SerializerMethodField()

    class Meta:
        model = ServicioMoto
        fields = [
            'id', 'folio', 'sede_nombre', 'descripcion', 'descripcion_problema',
            'status', 'status_display', 'pago_status', 'pago_status_display',
            'moto_display', 'cliente_nombre', 'cajero_nombre', 'mecanico_nombre',
            'mano_de_obra', 'total_refacciones', 'total',
            'tiempo_recibido', 'tiene_extra_pendiente',
            'archivado', 'fecha_archivado', 'archivado_por_nombre',
            'fecha_recepcion', 'fecha_entrega_estimada',
            'fecha_inicio', 'fecha_listo', 'fecha_entrega',
            'cliente_notificado',
            'diagnostico_mecanico', 'refacciones_requeridas',
            'diagnostico_listo',
        ]

    def get_moto_display(self, obj):
        if obj.moto:
            return f'{obj.moto.marca} {obj.moto.modelo} {obj.moto.año}'
        return '—'

    def get_cliente_nombre(self, obj):
        if obj.cliente:
            return obj.cliente.usuario.get_full_name()
        return 'Walk-in'

    def get_tiempo_recibido(self, obj):
        delta = timezone.now() - obj.fecha_recepcion
        return int(delta.total_seconds() / 60)

    def get_tiene_extra_pendiente(self, obj):
        return obj.solicitudes_extra.filter(status='PENDIENTE').exists()

    def get_archivado_por_nombre(self, obj):
        if obj.archivado_por:
            return obj.archivado_por.get_full_name() or obj.archivado_por.username
        return None


class ServicioMotoDetailSerializer(serializers.ModelSerializer):
    """Detalle completo con ítems y solicitudes extra."""
    moto                  = MotoClienteMinimalSerializer(read_only=True)
    cajero_nombre         = serializers.CharField(source='cajero.get_full_name', read_only=True)
    mecanico_nombre       = serializers.CharField(source='mecanico.get_full_name', read_only=True, default=None)
    asignado_por_nombre   = serializers.CharField(source='asignado_por.get_full_name', read_only=True, default=None)
    sede_nombre           = serializers.CharField(source='sede.nombre', read_only=True, default='')
    status_display        = serializers.CharField(source='get_status_display', read_only=True)
    pago_status_display   = serializers.CharField(source='get_pago_status_display', read_only=True)
    descripcion_problema  = serializers.CharField(source='descripcion', read_only=True)
    cliente_nombre        = serializers.SerializerMethodField()
    cliente_email         = serializers.SerializerMethodField()
    moto_display          = serializers.SerializerMethodField()
    items                 = ServicioItemSerializer(many=True, read_only=True)
    solicitudes_extra     = SolicitudRefaccionExtraSerializer(many=True, read_only=True)
    imagenes              = ServicioImagenSerializer(many=True, read_only=True)

    class Meta:
        model = ServicioMoto
        fields = [
            'id', 'folio', 'sede', 'sede_nombre',
            'descripcion', 'descripcion_problema', 'notas_internas', 'es_reparacion',
            'status', 'status_display', 'pago_status', 'pago_status_display',
            'moto', 'moto_display', 'cliente', 'cliente_nombre', 'cliente_email',
            'cajero', 'cajero_nombre',
            'mecanico', 'mecanico_nombre',
            'asignado_por', 'asignado_por_nombre',
            'mano_de_obra', 'total_refacciones', 'total',
            'metodo_pago', 'monto_pagado', 'cambio',
            'cliente_notificado', 'checklist_recepcion',
            'diagnostico_mecanico', 'refacciones_requeridas',
            'diagnostico_listo',
            'fecha_recepcion', 'fecha_entrega_estimada',
            'fecha_inicio', 'fecha_listo', 'fecha_entrega',
            'items', 'solicitudes_extra', 'imagenes',
            'tracking_token',
        ]

    def get_moto_display(self, obj):
        if obj.moto:
            return f'{obj.moto.marca} {obj.moto.modelo} {obj.moto.año}'
        return '—'

    def get_cliente_nombre(self, obj):
        if obj.cliente:
            return obj.cliente.usuario.get_full_name()
        return 'Walk-in'

    def get_cliente_email(self, obj):
        if obj.cliente:
            return obj.cliente.usuario.email
        return None


# ─────────────────────────────────────────────────────────────────────────────
#  SERVICIO MOTO — CREATE
# ─────────────────────────────────────────────────────────────────────────────

class ServicioMotoCreateSerializer(serializers.Serializer):
    """
    Cajero crea una orden de servicio con cotización inicial.
    """
    sede        = serializers.IntegerField()
    cliente     = serializers.IntegerField(required=False, allow_null=True)  # ClienteProfile id
    moto        = serializers.IntegerField(required=False, allow_null=True)  # MotoCliente id existente
    # Si no hay moto existente, se crea inline
    moto_nueva  = MotoClienteSerializer(required=False, allow_null=True)
    descripcion = serializers.CharField()
    mano_de_obra = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    items       = ServicioItemInputSerializer(many=True, required=False, default=list)
    checklist_recepcion = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    es_reparacion          = serializers.BooleanField(required=False, default=False)
    fecha_entrega_estimada = serializers.DateField(required=False, allow_null=True)
    notas_internas         = serializers.CharField(required=False, allow_blank=True, default='')
    pago_status = serializers.ChoiceField(
        choices=['PENDIENTE_PAGO', 'PAGADO'],
        default='PENDIENTE_PAGO'
    )
    metodo_pago = serializers.ChoiceField(
        choices=['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'],
        required=False, allow_null=True
    )
    monto_pagado = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False, allow_null=True
    )

    def validate(self, data):
        from branches.models import Sede
        from customers.models import ClienteProfile
        try:
            Sede.objects.get(id=data['sede'], is_active=True)
        except Sede.DoesNotExist:
            raise serializers.ValidationError({'sede': 'Sede no encontrada o inactiva.'})

        if data.get('cliente'):
            try:
                ClienteProfile.objects.get(id=data['cliente'])
            except ClienteProfile.DoesNotExist:
                raise serializers.ValidationError({'cliente': 'Cliente no encontrado.'})

        if data.get('moto'):
            try:
                moto_obj = MotoCliente.objects.get(id=data['moto'])
            except MotoCliente.DoesNotExist:
                raise serializers.ValidationError({'moto': 'Moto no encontrada.'})

            # Verificar que la moto no tenga ya una orden activa
            orden_activa = ServicioMoto.objects.filter(
                moto=moto_obj
            ).exclude(status='ENTREGADO').first()
            if orden_activa:
                raise serializers.ValidationError({
                    'moto': (
                        f'Esta moto ya tiene una orden activa '
                        f'(Folio: {orden_activa.folio} — {orden_activa.get_status_display()}). '
                        f'No se puede crear una nueva orden hasta que sea entregada.'
                    )
                })

        if data.get('pago_status') == 'PAGADO' and not data.get('metodo_pago'):
            raise serializers.ValidationError({'metodo_pago': 'Se requiere método de pago si el servicio está pagado.'})

        return data

    def create(self, validated_data):
        from django.db import transaction
        from django.db.models import F
        from branches.models import Sede
        from customers.models import ClienteProfile
        from inventory.models import Stock

        with transaction.atomic():
            sede = Sede.objects.get(id=validated_data['sede'])
            cajero = self.context['request'].user

            # Moto: existente, nueva o None
            moto = None
            if validated_data.get('moto'):
                moto = MotoCliente.objects.get(id=validated_data['moto'])
            elif validated_data.get('moto_nueva'):
                moto_data = validated_data['moto_nueva']
                cliente_id = validated_data.get('cliente')
                cliente_profile = ClienteProfile.objects.get(id=cliente_id) if cliente_id else None
                moto = MotoCliente.objects.create(cliente=cliente_profile, **moto_data)

            # Cliente
            cliente = None
            if validated_data.get('cliente'):
                cliente = ClienteProfile.objects.get(id=validated_data['cliente'])

            # Generar folio
            folio = ServicioMoto.generar_folio(sede.id)

            # Calcular total refacciones desde items
            items_data = validated_data.get('items', [])
            total_ref = sum(
                (item['precio_unitario'] * item.get('cantidad', 1))
                for item in items_data
                if item['tipo'] == 'REFACCION'
            )
            mano_de_obra = validated_data['mano_de_obra']
            total = mano_de_obra + total_ref

            # Pago inicial
            pago_status = validated_data.get('pago_status', 'PENDIENTE_PAGO')
            metodo_pago = validated_data.get('metodo_pago')
            monto_pagado = validated_data.get('monto_pagado')
            cambio = None
            if pago_status == 'PAGADO' and monto_pagado is not None:
                cambio = monto_pagado - total

            servicio = ServicioMoto.objects.create(
                folio=folio,
                sede=sede,
                cliente=cliente,
                moto=moto,
                descripcion=validated_data['descripcion'],
                cajero=cajero,
                mano_de_obra=mano_de_obra,
                total_refacciones=total_ref,
                total=total,
                pago_status=pago_status,
                metodo_pago=metodo_pago,
                monto_pagado=monto_pagado,
                cambio=cambio,
                es_reparacion=validated_data.get('es_reparacion', False),
                checklist_recepcion=validated_data.get('checklist_recepcion', []),
                notas_internas=validated_data.get('notas_internas', ''),
                fecha_entrega_estimada=validated_data.get('fecha_entrega_estimada'),
            )

            # Crear ítems cotizados
            for item_data in items_data:
                ServicioItem.objects.create(
                    servicio=servicio,
                    tipo=item_data['tipo'],
                    descripcion=item_data['descripcion'],
                    producto=item_data.get('producto'),
                    cantidad=item_data.get('cantidad', 1),
                    precio_unitario=item_data['precio_unitario'],
                    subtotal=item_data['precio_unitario'] * item_data.get('cantidad', 1),
                    aprobado=True,
                    created_by=cajero,
                )

            # Si se paga en el momento, decrementar stock de refacciones
            if pago_status == 'PAGADO':
                for item_data in items_data:
                    if item_data['tipo'] == 'REFACCION' and item_data.get('producto'):
                        Stock.objects.select_for_update().filter(
                            producto=item_data['producto'],
                            sede=sede
                        ).update(quantity=F('quantity') - item_data.get('cantidad', 1))

        return servicio


# ─────────────────────────────────────────────────────────────────────────────
#  SERVICIO MOTO — UPDATE (edición de cotización, solo si RECIBIDO)
# ─────────────────────────────────────────────────────────────────────────────

class ServicioMotoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicioMoto
        fields = ['descripcion', 'mano_de_obra']

    def validate(self, data):
        if self.instance and self.instance.status != 'RECIBIDO':
            raise serializers.ValidationError(
                'Solo se puede editar la cotización si el servicio está en estado RECIBIDO.'
            )
        return data

    def update(self, instance, validated_data):
        instance.descripcion = validated_data.get('descripcion', instance.descripcion)
        instance.mano_de_obra = validated_data.get('mano_de_obra', instance.mano_de_obra)
        instance.total = instance.mano_de_obra + instance.total_refacciones
        instance.save(update_fields=['descripcion', 'mano_de_obra', 'total'])
        return instance


# ─────────────────────────────────────────────────────────────────────────────
#  ENTREGAR (cobro y cierre del servicio)
# ─────────────────────────────────────────────────────────────────────────────

class EntregarServicioSerializer(serializers.Serializer):
    metodo_pago  = serializers.ChoiceField(
        choices=['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'],
        required=False,
        allow_null=True,
    )
    monto_pagado = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        min_value=0,
        required=False,
        allow_null=True,
    )

    def validate(self, data):
        servicio = self.context['servicio']

        if servicio.status != ServicioMoto.Status.LISTO:
            raise serializers.ValidationError(
                'Solo se puede entregar un servicio que esté en estado LISTO.'
            )

        if servicio.pago_status == ServicioMoto.PagoStatus.PAGADO:
            # Ya pagado — no se requiere metodo_pago ni monto_pagado
            return data

        # Pendiente de pago — validar campos requeridos
        metodo_pago  = data.get('metodo_pago')
        monto_pagado = data.get('monto_pagado')

        if not metodo_pago:
            raise serializers.ValidationError({'metodo_pago': 'El método de pago es requerido.'})

        if monto_pagado is None:
            raise serializers.ValidationError({'monto_pagado': 'El monto recibido es requerido.'})

        if monto_pagado < servicio.total:
            raise serializers.ValidationError(
                {'monto_pagado': f'El monto recibido (${monto_pagado}) es menor al total (${servicio.total}).'}
            )

        return data


# ─────────────────────────────────────────────────────────────────────────────
#  ACTUALIZAR DIAGNÓSTICO (mecánico llena diagnóstico y refacciones)
# ─────────────────────────────────────────────────────────────────────────────

class ActualizarDiagnosticoSerializer(serializers.Serializer):
    diagnostico_mecanico   = serializers.CharField(required=False, allow_blank=True)
    refacciones_requeridas = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if not data.get('diagnostico_mecanico') and not data.get('refacciones_requeridas'):
            raise serializers.ValidationError(
                'Debes enviar al menos uno de: diagnostico_mecanico, refacciones_requeridas.'
            )
        return data

    def update(self, instance, validated_data):
        if 'diagnostico_mecanico' in validated_data:
            instance.diagnostico_mecanico = validated_data['diagnostico_mecanico']
        if 'refacciones_requeridas' in validated_data:
            instance.refacciones_requeridas = validated_data['refacciones_requeridas']
        instance.save(update_fields=[k for k in validated_data if k in ('diagnostico_mecanico', 'refacciones_requeridas')])
        return instance


# ─────────────────────────────────────────────────────────────────────────────
#  SEGUIMIENTO PÚBLICO (sin autenticación)
# ─────────────────────────────────────────────────────────────────────────────

class SeguimientoPublicoSerializer(serializers.ModelSerializer):
    """
    Datos mínimos expuestos públicamente para el seguimiento de una orden.
    NO incluye nombre de cliente, teléfono ni diagnóstico interno.
    """
    moto_display  = serializers.SerializerMethodField()
    sede_nombre   = serializers.CharField(source='sede.nombre', read_only=True)
    status_display      = serializers.CharField(source='get_status_display', read_only=True)
    pago_status_display = serializers.CharField(source='get_pago_status_display', read_only=True)
    tiene_extra_pendiente = serializers.SerializerMethodField()
    timeline      = serializers.SerializerMethodField()

    class Meta:
        model  = ServicioMoto
        fields = [
            'folio', 'moto_display', 'sede_nombre',
            'status', 'status_display',
            'pago_status', 'pago_status_display',
            'descripcion',
            'fecha_recepcion', 'fecha_entrega_estimada',
            'fecha_inicio', 'fecha_listo', 'fecha_entrega',
            'tiene_extra_pendiente',
            'mano_de_obra', 'total_refacciones', 'total',
            'timeline',
        ]

    def get_moto_display(self, obj):
        if obj.moto:
            return f'{obj.moto.marca} {obj.moto.modelo} {obj.moto.año}'
        return 'Sin moto registrada'

    def get_tiene_extra_pendiente(self, obj):
        return obj.solicitudes_extra.filter(status='PENDIENTE').exists()

    def get_timeline(self, obj):
        PASOS = [
            ('RECIBIDO',            'Moto recibida',       obj.fecha_recepcion),
            ('EN_DIAGNOSTICO',      'En diagnóstico',      obj.fecha_inicio),
            ('EN_PROCESO',          'En reparación',       obj.fecha_inicio),
            ('COTIZACION_EXTRA',    'Piezas adicionales',  None),
            ('LISTA_PARA_ENTREGAR', 'Lista para recoger',  obj.fecha_listo),
            ('LISTO',               'Lista para recoger',  obj.fecha_listo),
            ('ENTREGADO',           'Entregada',           obj.fecha_entrega),
        ]
        STATUS_ORDER = [
            'RECIBIDO', 'EN_DIAGNOSTICO', 'EN_PROCESO',
            'COTIZACION_EXTRA', 'LISTA_PARA_ENTREGAR', 'LISTO', 'ENTREGADO',
        ]
        current_idx = STATUS_ORDER.index(obj.status) if obj.status in STATUS_ORDER else 0

        # Reducir a pasos únicos visibles (sin duplicar LISTA_PARA_ENTREGAR/LISTO)
        vistos = set()
        pasos_visibles = []
        for st, label, fecha in PASOS:
            if label in vistos:
                continue
            vistos.add(label)
            paso_idx = STATUS_ORDER.index(st) if st in STATUS_ORDER else 0
            pasos_visibles.append({
                'status':     st,
                'label':      label,
                'fecha':      fecha,
                'completado': paso_idx <= current_idx,
                'activo':     st == obj.status or (st == 'LISTA_PARA_ENTREGAR' and obj.status == 'LISTO'),
            })

        return pasos_visibles
