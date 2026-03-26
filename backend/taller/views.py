"""
Taller Views — MotoQFox
========================
Endpoints para gestión de órdenes de servicio de taller.
"""
import uuid
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.db.models import F, Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import MotoCliente, ServicioMoto, ServicioItem, SolicitudRefaccionExtra, ServicioImagen
from .serializers import (
    MotoClienteSerializer,
    ServicioMotoListSerializer,
    ServicioMotoDetailSerializer,
    ServicioMotoCreateSerializer,
    ServicioMotoUpdateSerializer,
    SolicitudRefaccionExtraSerializer,
    SolicitudRefaccionExtraCreateSerializer,
    EntregarServicioSerializer,
    ServicioImagenSerializer,
    ActualizarDiagnosticoSerializer,
    SeguimientoPublicoSerializer,
)
from .permissions import (
    IsCajeroOrAbove,
    IsJefeMecanicoOrAbove,
    IsMecanicoOrAbove,
    IsTallerStaff,
)
from inventory.models import Stock
from customers.models import ClienteProfile


# ─────────────────────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _paginate(qs, request, default_size=20):
    try:
        page = max(1, int(request.query_params.get('page', 1)))
        page_size = min(100, max(1, int(request.query_params.get('page_size', default_size))))
    except (ValueError, TypeError):
        page, page_size = 1, default_size
    total = qs.count()
    start = (page - 1) * page_size
    items = qs[start:start + page_size]
    return items, {
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': max(1, -(-total // page_size)),
    }


def _notificar_cliente_listo(servicio):
    """Envía email al cliente cuando el servicio está listo."""
    if not servicio.cliente:
        return
    email = servicio.cliente.usuario.email
    nombre = servicio.cliente.usuario.get_full_name()
    moto_str = str(servicio.moto) if servicio.moto else 'su moto'
    try:
        send_mail(
            subject=f'[MotoQFox] Tu moto está lista — {servicio.folio}',
            message=(
                f'Hola {nombre},\n\n'
                f'Te informamos que {moto_str} ya está lista para ser recogida.\n\n'
                f'Folio de servicio: {servicio.folio}\n'
                f'Total a pagar: ${servicio.total}\n\n'
                f'Puedes presentar tu código QR en caja para agilizar el proceso.\n\n'
                f'¡Gracias por confiar en MotoQFox!'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )
        servicio.cliente_notificado = True
        servicio.save(update_fields=['cliente_notificado'])
    except Exception:
        pass


def _enviar_link_seguimiento(servicio, tracking_url: str):
    """Envía email al cliente con el link de seguimiento al crear la orden."""
    if not servicio.cliente:
        return
    email = servicio.cliente.usuario.email
    if not email:
        return
    nombre = servicio.cliente.usuario.get_full_name() or 'Cliente'
    moto_str = str(servicio.moto) if servicio.moto else 'tu moto'
    fecha_est = (
        servicio.fecha_entrega_estimada.strftime('%d/%m/%Y')
        if servicio.fecha_entrega_estimada else 'por confirmar'
    )
    try:
        send_mail(
            subject=f'[MotoQFox] Hemos recibido tu moto — {servicio.folio}',
            message=(
                f'Hola {nombre},\n\n'
                f'Confirmamos la recepción de {moto_str} en {servicio.sede.nombre}.\n\n'
                f'Folio: {servicio.folio}\n'
                f'Entrega estimada: {fecha_est}\n\n'
                f'Sigue el progreso de tu servicio en tiempo real aquí:\n'
                f'{tracking_url}\n\n'
                f'(No necesitas iniciar sesión, el link es exclusivo para tu orden)\n\n'
                f'¡Gracias por confiar en MotoQFox!'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )
    except Exception:
        pass


def _crear_venta_servicio(servicio, cajero, metodo_pago, monto_pagado):
    """
    Crea Venta + VentaItem en el módulo de ventas para reflejar el cobro
    de un servicio de taller en el corte del día.
    Debe llamarse dentro de transaction.atomic().
    """
    from decimal import Decimal
    from sales.models import Venta, VentaItem

    total  = servicio.total or Decimal('0')
    monto  = Decimal(str(monto_pagado)) if monto_pagado is not None else total
    cambio = max(monto - total, Decimal('0'))

    venta = Venta.objects.create(
        sede=servicio.sede,
        cajero=cajero,
        cliente=servicio.cliente if servicio.cliente else None,
        metodo_pago=metodo_pago or 'EFECTIVO',
        subtotal=total,
        descuento=Decimal('0'),
        total=total,
        monto_pagado=monto,
        cambio=cambio,
        status='COMPLETADA',
        notas=f'Servicio de taller — {servicio.folio}',
    )
    VentaItem.objects.create(
        venta=venta,
        tipo='SERVICIO',
        catalogo_servicio=servicio.catalogo_servicio if servicio.catalogo_servicio_id else None,
        quantity=1,
        unit_price=total,
        subtotal=total,
    )
    return venta


# ─────────────────────────────────────────────────────────────────────────────
#  MOTOS DEL CLIENTE
# ─────────────────────────────────────────────────────────────────────────────

class MotoClienteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Cajero puede ver motos de cualquier cliente (?cliente_id=X).
        Cliente ve solo las suyas.
        """
        user = request.user
        if user.is_customer:
            try:
                profile = ClienteProfile.objects.get(usuario=user)
                qs = MotoCliente.objects.filter(cliente=profile)
            except ClienteProfile.DoesNotExist:
                qs = MotoCliente.objects.none()
        else:
            cliente_id = request.query_params.get('cliente_id')
            if cliente_id:
                # Búsqueda explícita por cliente: no aplicar filtro de sede
                # (los clientes tienen sede=NULL y se excluirían incorrectamente)
                qs = MotoCliente.objects.filter(cliente_id=cliente_id)
            else:
                qs = MotoCliente.objects.all()
                if not user.is_administrator and user.sede:
                    # Filtro de sede solo en listado general (sin cliente_id)
                    qs = qs.filter(
                        Q(cliente__usuario__sede=user.sede) |
                        Q(cliente__isnull=True)
                    )

        serializer = MotoClienteSerializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data})

    def post(self, request):
        serializer = MotoClienteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'success': True, 'message': 'Moto registrada.', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class MotoClienteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_moto(self, pk):
        try:
            return MotoCliente.objects.get(pk=pk)
        except MotoCliente.DoesNotExist:
            return None

    def get(self, request, pk):
        moto = self._get_moto(pk)
        if not moto:
            return Response({'success': False, 'message': 'Moto no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'data': MotoClienteSerializer(moto).data})

    def put(self, request, pk):
        moto = self._get_moto(pk)
        if not moto:
            return Response({'success': False, 'message': 'Moto no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MotoClienteSerializer(moto, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'data': serializer.data})
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  SERVICIOS — LISTA Y CREACIÓN
# ─────────────────────────────────────────────────────────────────────────────

class ServicioListView(APIView):
    permission_classes = [IsTallerStaff]

    def get(self, request):
        user = request.user
        qs = ServicioMoto.objects.select_related(
            'moto', 'cliente__usuario', 'cajero', 'mecanico', 'sede'
        )

        # Filtro por sede
        if user.is_administrator:
            sede_id = request.query_params.get('sede_id')
            if sede_id:
                qs = qs.filter(sede_id=sede_id)
        elif user.sede:
            qs = qs.filter(sede=user.sede)

        # Excluir archivados por defecto
        incluir_archivados = request.query_params.get('incluir_archivados', 'false').lower() == 'true'
        if not incluir_archivados:
            qs = qs.filter(archivado=False)

        # Mecánico solo ve sus servicios asignados
        if user.is_mecanico:
            qs = qs.filter(mecanico=user)

        # Filtros opcionales
        estado = request.query_params.get('status')
        if estado:
            qs = qs.filter(status=estado)

        fecha_desde = request.query_params.get('fecha_desde')
        if fecha_desde:
            qs = qs.filter(fecha_recepcion__date__gte=fecha_desde)

        fecha_hasta = request.query_params.get('fecha_hasta')
        if fecha_hasta:
            qs = qs.filter(fecha_recepcion__date__lte=fecha_hasta)

        # Excluir ENTREGADO por defecto (salvo que se pida explícitamente)
        include_entregado = request.query_params.get('include_entregado', 'false').lower() == 'true'
        if not include_entregado and not estado:
            qs = qs.exclude(status='ENTREGADO')

        items, pagination = _paginate(qs, request)
        serializer = ServicioMotoListSerializer(items, many=True)
        return Response({
            'success': True,
            'data': {'servicios': serializer.data, 'pagination': pagination}
        })

    def post(self, request):
        if not (request.user.is_cashier or request.user.is_encargado or request.user.is_administrator):
            return Response(
                {'success': False, 'message': 'Solo cajeros y encargados pueden crear servicios.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = ServicioMotoCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            servicio = serializer.save()
            # Enviar link de seguimiento al cliente si tiene email
            frontend_url = getattr(settings, 'FRONTEND_CLIENTE_URL', 'http://localhost:5174')
            tracking_url = f'{frontend_url}/seguimiento/{servicio.tracking_token}'
            _enviar_link_seguimiento(servicio, tracking_url)
            # Si se pagó anticipadamente, registrar en ventas del día
            if servicio.pago_status == ServicioMoto.PagoStatus.PAGADO:
                try:
                    with transaction.atomic():
                        venta_obj = _crear_venta_servicio(
                            servicio=servicio,
                            cajero=request.user,
                            metodo_pago=servicio.metodo_pago or 'EFECTIVO',
                            monto_pagado=servicio.monto_pagado or servicio.total,
                        )
                        servicio.venta = venta_obj
                        servicio.save(update_fields=['venta'])
                except Exception:
                    pass
            return Response(
                {
                    'success': True,
                    'message': 'Servicio creado exitosamente.',
                    'data': ServicioMotoDetailSerializer(servicio).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  SERVICIOS — DETALLE, EDICIÓN Y ACCIONES
# ─────────────────────────────────────────────────────────────────────────────

class ServicioDetailView(APIView):
    permission_classes = [IsTallerStaff]

    def _get_servicio(self, pk):
        try:
            return ServicioMoto.objects.select_related(
                'moto', 'cliente__usuario', 'cajero', 'mecanico', 'sede'
            ).prefetch_related('items', 'solicitudes_extra').get(pk=pk)
        except ServicioMoto.DoesNotExist:
            return None

    def get(self, request, pk):
        servicio = self._get_servicio(pk)
        if not servicio:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'data': ServicioMotoDetailSerializer(servicio).data})

    def put(self, request, pk):
        """Editar cotización (solo si status=RECIBIDO, solo cajero/encargado/admin)."""
        if not (request.user.is_cashier or request.user.is_encargado or request.user.is_administrator):
            return Response({'success': False, 'message': 'Sin permisos.'}, status=status.HTTP_403_FORBIDDEN)
        servicio = self._get_servicio(pk)
        if not servicio:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServicioMotoUpdateSerializer(servicio, data=request.data, partial=True)
        if serializer.is_valid():
            servicio = serializer.save()
            return Response({'success': True, 'data': ServicioMotoDetailSerializer(servicio).data})
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class AsignarMecanicoView(APIView):
    """Jefe de mecánicos asigna un mecánico → status EN_PROCESO."""
    permission_classes = [IsJefeMecanicoOrAbove]

    def patch(self, request, pk):
        try:
            servicio = ServicioMoto.objects.get(pk=pk)
        except ServicioMoto.DoesNotExist:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if servicio.status != ServicioMoto.Status.RECIBIDO:
            return Response(
                {'success': False, 'message': f'No se puede asignar un mecánico a un servicio en estado {servicio.get_status_display()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        mecanico_id = request.data.get('mecanico_id')
        if not mecanico_id:
            return Response({'success': False, 'message': 'Se requiere mecanico_id.'}, status=status.HTTP_400_BAD_REQUEST)

        from users.models import CustomUser
        try:
            mecanico_id_int = int(mecanico_id)
        except (TypeError, ValueError):
            return Response({'success': False, 'message': 'mecanico_id inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        is_self_assignment = (mecanico_id_int == request.user.id)
        if is_self_assignment:
            # Auto-asignación: permitida si el usuario es JEFE_MECANICO o MECANICO
            allowed_roles = ['JEFE_MECANICO', 'MECANICO']
            try:
                mecanico = CustomUser.objects.get(
                    id=mecanico_id_int,
                    role__in=allowed_roles,
                    is_active=True,
                    sede=servicio.sede
                )
            except CustomUser.DoesNotExist:
                return Response(
                    {'success': False, 'message': 'No puedes auto-asignarte este servicio (rol insuficiente o sede distinta).'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Asignación a otro usuario: debe tener rol MECANICO
            try:
                mecanico = CustomUser.objects.get(
                    id=mecanico_id_int,
                    role='MECANICO',
                    is_active=True,
                    sede=servicio.sede
                )
            except CustomUser.DoesNotExist:
                return Response(
                    {'success': False, 'message': 'Mecánico no encontrado o no pertenece a esta sede.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        servicio.mecanico = mecanico
        servicio.asignado_por = request.user
        # Si es reparación → pasa a EN_DIAGNOSTICO primero; si es mantenimiento → EN_PROCESO directo
        if servicio.es_reparacion:
            servicio.status = ServicioMoto.Status.EN_DIAGNOSTICO
            servicio.save(update_fields=['mecanico', 'asignado_por', 'status'])
        else:
            servicio.status = ServicioMoto.Status.EN_PROCESO
            servicio.fecha_inicio = timezone.now()
            servicio.save(update_fields=['mecanico', 'asignado_por', 'status', 'fecha_inicio'])

        return Response({
            'success': True,
            'message': f'Servicio asignado a {mecanico.get_full_name()}.',
            'data': ServicioMotoDetailSerializer(servicio).data
        })


class IniciarReparacionView(APIView):
    """Mecánico/Jefe inicia la reparación: EN_DIAGNOSTICO → EN_PROCESO."""
    permission_classes = [IsMecanicoOrAbove]

    def patch(self, request, pk):
        try:
            servicio = ServicioMoto.objects.get(pk=pk)
        except ServicioMoto.DoesNotExist:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.is_mecanico and servicio.mecanico != request.user:
            return Response({'success': False, 'message': 'No eres el mecánico asignado.'}, status=status.HTTP_403_FORBIDDEN)

        if servicio.status != ServicioMoto.Status.EN_DIAGNOSTICO:
            return Response(
                {'success': False, 'message': 'El servicio no está en diagnóstico.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # El mecánico no puede iniciar sin autorización de recepción
        return Response(
            {'success': False, 'message': 'La reparación debe ser autorizada por recepción antes de iniciar.'},
            status=status.HTTP_403_FORBIDDEN,
        )


class SubmitDiagnosticoView(APIView):
    """
    PATCH — El mecánico señala que el diagnóstico está listo para que recepción autorice.
    Solo pone diagnostico_listo=True. NO cambia el status.
    Endpoint: /api/taller/servicios/<int:pk>/submit-diagnostico/
    """
    permission_classes = [IsMecanicoOrAbove]

    def patch(self, request, pk):
        try:
            servicio = ServicioMoto.objects.get(pk=pk)
        except ServicioMoto.DoesNotExist:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.is_mecanico and servicio.mecanico != request.user:
            return Response({'success': False, 'message': 'No eres el mecánico asignado.'}, status=status.HTTP_403_FORBIDDEN)

        if servicio.status != ServicioMoto.Status.EN_DIAGNOSTICO:
            return Response(
                {'success': False, 'message': 'El servicio no está en diagnóstico.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if servicio.diagnostico_listo:
            return Response({'success': False, 'message': 'El diagnóstico ya fue enviado a recepción.'}, status=status.HTTP_400_BAD_REQUEST)

        servicio.diagnostico_listo = True
        servicio.save(update_fields=['diagnostico_listo'])

        return Response({
            'success': True,
            'message': 'Diagnóstico enviado a recepción. Esperando autorización.',
            'data': ServicioMotoDetailSerializer(servicio).data,
        })


class AutorizarDiagnosticoView(APIView):
    """Cajero/Encargado autoriza el diagnóstico → pasa de EN_DIAGNOSTICO a EN_PROCESO."""
    permission_classes = [IsCajeroOrAbove]

    def post(self, request, pk):
        try:
            servicio = ServicioMoto.objects.get(pk=pk)
        except ServicioMoto.DoesNotExist:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if servicio.status != ServicioMoto.Status.EN_DIAGNOSTICO:
            return Response(
                {'success': False, 'message': 'El servicio no está en diagnóstico.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        servicio.status = ServicioMoto.Status.EN_PROCESO
        servicio.fecha_inicio = timezone.now()
        servicio.diagnostico_listo = False
        servicio.save(update_fields=['status', 'fecha_inicio', 'diagnostico_listo'])

        return Response({
            'success': True,
            'message': 'Diagnóstico autorizado. Servicio en proceso.',
            'data': ServicioMotoDetailSerializer(servicio).data
        })

    # Mantener compatibilidad con PATCH existente
    def patch(self, request, pk):
        return self.post(request, pk)


class CancelarOrdenView(APIView):
    """Cancela la orden desde cualquier estado no terminal → CANCELADO."""
    permission_classes = [IsCajeroOrAbove]

    # Estados terminales: no se puede cancelar desde aquí
    ESTADOS_TERMINALES = {
        ServicioMoto.Status.CANCELADO,
        ServicioMoto.Status.ENTREGADO,
        ServicioMoto.Status.LISTO,
    }

    def post(self, request, pk):
        try:
            servicio = ServicioMoto.objects.get(pk=pk)
        except ServicioMoto.DoesNotExist:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if servicio.status in self.ESTADOS_TERMINALES:
            return Response(
                {
                    'success': False,
                    'message': f'No se puede cancelar un servicio en estado {servicio.get_status_display()}.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        servicio.status = ServicioMoto.Status.CANCELADO
        servicio.save(update_fields=['status'])

        return Response({
            'success': True,
            'message': 'Orden cancelada.',
            'data': ServicioMotoDetailSerializer(servicio).data
        })

    # Mantener compatibilidad con PATCH existente
    def patch(self, request, pk):
        return self.post(request, pk)


class ActualizarDiagnosticoView(APIView):
    """Mecánico asignado / jefe / admin actualiza diagnóstico_mecanico y/o refacciones_requeridas."""
    permission_classes = [IsMecanicoOrAbove]

    def patch(self, request, pk):
        try:
            servicio = ServicioMoto.objects.get(pk=pk)
        except ServicioMoto.DoesNotExist:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # Mecánico solo puede editar si es el mecánico asignado
        if request.user.is_mecanico and servicio.mecanico != request.user:
            return Response(
                {'success': False, 'message': 'No eres el mecánico asignado a este servicio.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ActualizarDiagnosticoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        servicio = serializer.update(servicio, serializer.validated_data)

        return Response({
            'success': True,
            'message': 'Diagnóstico actualizado.',
            'data': ServicioMotoDetailSerializer(servicio).data
        })


class MarcarListaParaEntregarView(APIView):
    """Mecánico/Jefe marca el servicio listo: EN_PROCESO → LISTA_PARA_ENTREGAR."""
    permission_classes = [IsMecanicoOrAbove]

    def patch(self, request, pk):
        try:
            servicio = ServicioMoto.objects.get(pk=pk)
        except ServicioMoto.DoesNotExist:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.is_mecanico and servicio.mecanico != request.user:
            return Response({'success': False, 'message': 'No eres el mecánico asignado.'}, status=status.HTTP_403_FORBIDDEN)

        if servicio.status != ServicioMoto.Status.EN_PROCESO:
            return Response(
                {'success': False, 'message': f'El servicio está en estado {servicio.get_status_display()}, no en proceso.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        servicio.status = ServicioMoto.Status.LISTA_PARA_ENTREGAR
        servicio.save(update_fields=['status'])

        return Response({
            'success': True,
            'message': 'Servicio marcado como lista para entregar.',
            'data': ServicioMotoDetailSerializer(servicio).data
        })


class MarcarEntregadaView(APIView):
    """Cajero/Encargado confirma la moto entregada al mostrador: LISTA_PARA_ENTREGAR → LISTO."""
    permission_classes = [IsCajeroOrAbove]

    def patch(self, request, pk):
        try:
            servicio = ServicioMoto.objects.get(pk=pk)
        except ServicioMoto.DoesNotExist:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if servicio.status != ServicioMoto.Status.LISTA_PARA_ENTREGAR:
            return Response(
                {'success': False, 'message': f'El servicio está en estado {servicio.get_status_display()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        servicio.status = ServicioMoto.Status.LISTO
        servicio.fecha_listo = timezone.now()
        servicio.save(update_fields=['status', 'fecha_listo'])

        # Notificar al cliente
        _notificar_cliente_listo(servicio)

        return Response({
            'success': True,
            'message': 'Moto confirmada como entregada al área de entrega. Cliente notificado.',
            'data': ServicioMotoDetailSerializer(servicio).data
        })


class MarcarListoView(APIView):
    """[DEPRECADO] Alias de MarcarListaParaEntregarView para compatibilidad."""
    permission_classes = [IsMecanicoOrAbove]

    def patch(self, request, pk):
        return MarcarListaParaEntregarView().patch(request, pk)


class EntregarServicioView(APIView):
    """Cajero cobra y entrega la moto → status ENTREGADO."""
    permission_classes = [IsCajeroOrAbove]

    def patch(self, request, pk):
        try:
            servicio = ServicioMoto.objects.get(pk=pk)
        except ServicioMoto.DoesNotExist:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EntregarServicioSerializer(
            data=request.data,
            context={'servicio': servicio}
        )
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            servicio.status = ServicioMoto.Status.ENTREGADO
            servicio.fecha_entrega = timezone.now()

            if servicio.pago_status == ServicioMoto.PagoStatus.PENDIENTE_PAGO:
                # Primera vez que paga — cobrar, decrementar stock y marcar pagado
                metodo_pago  = serializer.validated_data.get('metodo_pago')
                monto_pagado = serializer.validated_data.get('monto_pagado', servicio.total)

                # Decrementar stock de refacciones aprobadas
                for item in servicio.items.filter(tipo__in=['REFACCION', 'EXTRA'], aprobado=True):
                    if item.producto:
                        Stock.objects.select_for_update().filter(
                            producto=item.producto,
                            sede=servicio.sede,
                        ).update(quantity=F('quantity') - item.cantidad)

                servicio.pago_status = ServicioMoto.PagoStatus.PAGADO
                servicio.metodo_pago = metodo_pago
                servicio.monto_pagado = monto_pagado
                servicio.cambio = monto_pagado - servicio.total

                # Registrar en ventas del día
                try:
                    venta_obj = _crear_venta_servicio(
                        servicio=servicio,
                        cajero=request.user,
                        metodo_pago=metodo_pago,
                        monto_pagado=monto_pagado,
                    )
                    servicio.venta = venta_obj
                except Exception:
                    pass  # No bloquear la entrega si falla el registro de venta

            else:
                # Ya fue pagado al crear la orden — registrar venta si aún no existe
                if not servicio.venta_id:
                    try:
                        venta_obj = _crear_venta_servicio(
                            servicio=servicio,
                            cajero=request.user,
                            metodo_pago=servicio.metodo_pago or 'EFECTIVO',
                            monto_pagado=servicio.monto_pagado or servicio.total,
                        )
                        servicio.venta = venta_obj
                    except Exception:
                        pass

            servicio.save(update_fields=[
                'status', 'fecha_entrega', 'pago_status',
                'metodo_pago', 'monto_pagado', 'cambio', 'venta',
            ])

        return Response({
            'success': True,
            'message': 'Servicio entregado y cobrado correctamente.',
            'data': ServicioMotoDetailSerializer(servicio).data
        })


class ServicioPorQRView(APIView):
    """Cajero busca el servicio activo de un cliente por su QR token."""
    permission_classes = [IsCajeroOrAbove]

    def get(self, request, token):
        try:
            uuid.UUID(str(token))
        except ValueError:
            return Response({'success': False, 'message': 'Token inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cliente = ClienteProfile.objects.get(qr_token=token)
        except ClienteProfile.DoesNotExist:
            return Response({'success': False, 'message': 'Cliente no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        servicios = ServicioMoto.objects.filter(
            cliente=cliente
        ).exclude(status='ENTREGADO').order_by('-fecha_recepcion')

        if not servicios.exists():
            return Response({
                'success': True,
                'message': 'El cliente no tiene servicios activos.',
                'data': {
                    'cliente_nombre': cliente.usuario.get_full_name(),
                    'cliente_email': cliente.usuario.email,
                    'servicios': []
                }
            })

        return Response({
            'success': True,
            'data': {
                'cliente_nombre': cliente.usuario.get_full_name(),
                'cliente_email': cliente.usuario.email,
                'servicios': ServicioMotoListSerializer(servicios, many=True).data
            }
        })


# ─────────────────────────────────────────────────────────────────────────────
#  SOLICITUDES DE REFACCIÓN EXTRA
# ─────────────────────────────────────────────────────────────────────────────

class SolicitudRefaccionExtraListView(APIView):
    permission_classes = [IsTallerStaff]

    def get(self, request):
        user = request.user
        qs = SolicitudRefaccionExtra.objects.select_related(
            'servicio', 'mecanico', 'producto', 'respondido_por'
        )

        if user.is_mecanico:
            qs = qs.filter(mecanico=user)
        elif not user.is_administrator and user.sede:
            qs = qs.filter(servicio__sede=user.sede)

        # Filtro por status
        estado = request.query_params.get('status')
        if estado:
            qs = qs.filter(status=estado)

        # Filtro por servicio
        servicio_id = request.query_params.get('servicio_id')
        if servicio_id:
            qs = qs.filter(servicio_id=servicio_id)

        serializer = SolicitudRefaccionExtraSerializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data})

    def post(self, request):
        """Mecánico solicita refacción extra → servicio pasa a COTIZACION_EXTRA."""
        if not (request.user.is_mecanico or request.user.is_jefe_mecanico):
            return Response(
                {'success': False, 'message': 'Solo mecánicos pueden solicitar refacciones extra.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = SolicitudRefaccionExtraCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            with transaction.atomic():
                solicitud = serializer.save(mecanico=request.user)
                # Cambiar status del servicio
                servicio = solicitud.servicio
                servicio.status = ServicioMoto.Status.COTIZACION_EXTRA
                servicio.save(update_fields=['status'])
            return Response(
                {
                    'success': True,
                    'message': 'Solicitud enviada. En espera de autorización del cliente.',
                    'data': SolicitudRefaccionExtraSerializer(solicitud).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class AprobarSolicitudView(APIView):
    """Cajero aprueba la solicitud → agrega item al ticket + decrementa stock."""
    permission_classes = [IsCajeroOrAbove]

    def patch(self, request, pk):
        try:
            solicitud = SolicitudRefaccionExtra.objects.select_related(
                'servicio__sede', 'producto', 'mecanico'
            ).get(pk=pk)
        except SolicitudRefaccionExtra.DoesNotExist:
            return Response({'success': False, 'message': 'Solicitud no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        if solicitud.status != 'PENDIENTE':
            return Response(
                {'success': False, 'message': f'Esta solicitud ya fue {solicitud.get_status_display().lower()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        servicio = solicitud.servicio

        with transaction.atomic():
            # Verificar stock
            stock = Stock.objects.select_for_update().filter(
                producto=solicitud.producto,
                sede=servicio.sede
            ).first()

            if not stock or stock.quantity < solicitud.cantidad:
                return Response(
                    {'success': False, 'message': 'Stock insuficiente para esta refacción.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Crear ítem en el ticket
            ServicioItem.objects.create(
                servicio=servicio,
                tipo='EXTRA',
                descripcion=solicitud.producto.name,
                producto=solicitud.producto,
                cantidad=solicitud.cantidad,
                precio_unitario=solicitud.producto.price,
                subtotal=solicitud.producto.price * solicitud.cantidad,
                aprobado=True,
                created_by=request.user,
            )

            # Decrementar stock
            Stock.objects.filter(
                producto=solicitud.producto,
                sede=servicio.sede
            ).update(quantity=F('quantity') - solicitud.cantidad)

            # Actualizar solicitud
            solicitud.status = 'APROBADA'
            solicitud.respondido_por = request.user
            solicitud.respondido_at = timezone.now()
            solicitud.save(update_fields=['status', 'respondido_por', 'respondido_at'])

            # Recalcular totales y volver a EN_PROCESO
            servicio.recalcular_totales()
            servicio.status = ServicioMoto.Status.EN_PROCESO
            servicio.save(update_fields=['status'])

        return Response({
            'success': True,
            'message': 'Refacción aprobada y agregada al ticket.',
            'data': SolicitudRefaccionExtraSerializer(solicitud).data
        })


class RechazarSolicitudView(APIView):
    """Cajero rechaza la solicitud → servicio vuelve a EN_PROCESO."""
    permission_classes = [IsCajeroOrAbove]

    def patch(self, request, pk):
        try:
            solicitud = SolicitudRefaccionExtra.objects.select_related('servicio').get(pk=pk)
        except SolicitudRefaccionExtra.DoesNotExist:
            return Response({'success': False, 'message': 'Solicitud no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        if solicitud.status != 'PENDIENTE':
            return Response(
                {'success': False, 'message': f'Esta solicitud ya fue {solicitud.get_status_display().lower()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            solicitud.status = 'RECHAZADA'
            solicitud.respondido_por = request.user
            solicitud.respondido_at = timezone.now()
            solicitud.save(update_fields=['status', 'respondido_por', 'respondido_at'])

            # Si no quedan solicitudes pendientes, volver a EN_PROCESO
            servicio = solicitud.servicio
            if not servicio.solicitudes_extra.filter(status='PENDIENTE').exists():
                servicio.status = ServicioMoto.Status.EN_PROCESO
                servicio.save(update_fields=['status'])

        return Response({
            'success': True,
            'message': 'Solicitud rechazada. El mecánico puede continuar sin esa refacción.',
            'data': SolicitudRefaccionExtraSerializer(solicitud).data
        })


# ─────────────────────────────────────────────────────────────────────────────
#  IMÁGENES DE EVIDENCIA
# ─────────────────────────────────────────────────────────────────────────────

class ServicioImagenesView(APIView):
    """Subir y listar imágenes de evidencia de un servicio."""
    permission_classes = [IsTallerStaff]

    def _get_servicio(self, pk):
        try:
            return ServicioMoto.objects.get(pk=pk)
        except ServicioMoto.DoesNotExist:
            return None

    def get(self, request, pk):
        servicio = self._get_servicio(pk)
        if not servicio:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        imagenes = servicio.imagenes.all()
        serializer = ServicioImagenSerializer(imagenes, many=True, context={'request': request})
        return Response({'success': True, 'data': serializer.data})

    def post(self, request, pk):
        servicio = self._get_servicio(pk)
        if not servicio:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        archivos = request.FILES.getlist('imagenes')
        if not archivos:
            return Response({'success': False, 'message': 'No se enviaron imágenes.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(archivos) > 10:
            return Response({'success': False, 'message': 'Máximo 10 imágenes por solicitud.'}, status=status.HTTP_400_BAD_REQUEST)

        creadas = []
        for archivo in archivos:
            img = ServicioImagen.objects.create(
                servicio=servicio,
                imagen=archivo,
                subida_por=request.user,
            )
            creadas.append(img)

        serializer = ServicioImagenSerializer(creadas, many=True, context={'request': request})
        return Response(
            {'success': True, 'message': f'{len(creadas)} imagen(es) guardada(s).', 'data': serializer.data},
            status=status.HTTP_201_CREATED
        )

    def delete(self, request, pk):
        """Eliminar una imagen específica (?imagen_id=X)."""
        imagen_id = request.query_params.get('imagen_id')
        if not imagen_id:
            return Response({'success': False, 'message': 'Se requiere imagen_id.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            imagen = ServicioImagen.objects.get(pk=imagen_id, servicio_id=pk)
        except ServicioImagen.DoesNotExist:
            return Response({'success': False, 'message': 'Imagen no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        imagen.imagen.delete(save=False)
        imagen.delete()
        return Response({'success': True, 'message': 'Imagen eliminada.'})


# ─────────────────────────────────────────────────────────────────────────────
#  ENDPOINTS PARA LA APP DEL CLIENTE (CUSTOMER role)
# ─────────────────────────────────────────────────────────────────────────────

class MisServiciosView(APIView):
    """Cliente autenticado ve sus propios servicios."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_customer:
            return Response({'success': False, 'message': 'Solo clientes pueden acceder.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            cliente = ClienteProfile.objects.get(usuario=request.user)
        except ClienteProfile.DoesNotExist:
            return Response({'success': False, 'message': 'Perfil de cliente no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        qs = ServicioMoto.objects.filter(cliente=cliente).select_related(
            'moto', 'sede'
        ).prefetch_related('items', 'solicitudes_extra')

        include_entregado = request.query_params.get('include_entregado', 'false').lower() == 'true'
        if not include_entregado:
            qs = qs.exclude(status='ENTREGADO')

        serializer = ServicioMotoListSerializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data})


class MiServicioDetailView(APIView):
    """Cliente ve el detalle de un servicio suyo."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if not request.user.is_customer:
            return Response({'success': False, 'message': 'Solo clientes pueden acceder.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            cliente = ClienteProfile.objects.get(usuario=request.user)
        except ClienteProfile.DoesNotExist:
            return Response({'success': False, 'message': 'Perfil no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            servicio = ServicioMoto.objects.get(pk=pk, cliente=cliente)
        except ServicioMoto.DoesNotExist:
            return Response({'success': False, 'message': 'Servicio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True,
            'data': ServicioMotoDetailSerializer(servicio).data
        })


# ─────────────────────────────────────────────────────────────────────────────
#  HISTORIAL / ARCHIVADO DE ÓRDENES
# ─────────────────────────────────────────────────────────────────────────────

class ArchivarOrdenesView(APIView):
    """
    POST — Archiva todas las órdenes activas (archivado=False) de la sede.
    Solo recepción/cajero puede hacerlo.
    Body JSON opcional: { "sede_id": <int> }  (admin puede especificar; otros usan su sede)
    """
    permission_classes = [IsCajeroOrAbove]

    def post(self, request):
        from django.utils import timezone as tz
        # Determinar sede
        if getattr(request.user, 'is_administrator', False) or request.user.role == 'ADMINISTRATOR':
            sede_id = request.data.get('sede_id') or getattr(request.user, 'sede_id', None)
        else:
            sede_id = getattr(request.user, 'sede_id', None)

        if not sede_id:
            return Response({'success': False, 'message': 'No se pudo determinar la sede.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = ServicioMoto.objects.filter(
            sede_id=sede_id,
            archivado=False,
            status__in=[ServicioMoto.Status.ENTREGADO, ServicioMoto.Status.CANCELADO],
        )
        count = qs.count()
        if count == 0:
            return Response({'success': True, 'message': 'No hay órdenes entregadas o canceladas para archivar.', 'data': {'archivadas': 0}})

        qs.update(
            archivado=True,
            fecha_archivado=tz.now(),
            archivado_por=request.user,
        )
        return Response({
            'success': True,
            'message': f'{count} orden(es) archivada(s) (entregadas y canceladas).',
            'data': {'archivadas': count},
        }, status=status.HTTP_200_OK)


class HistorialServiciosView(APIView):
    """
    GET — Lista órdenes archivadas (archivado=True) de la sede con filtros opcionales.
    Query params:
      - fecha_desde   (YYYY-MM-DD)
      - fecha_hasta   (YYYY-MM-DD)
      - status        (RECIBIDO|EN_DIAGNOSTICO|EN_PROCESO|LISTA_PARA_ENTREGAR|ENTREGADO|CANCELADO)
      - search        (folio, cliente, moto)
      - page / page_size
    """
    permission_classes = [IsTallerStaff]

    def get(self, request):
        if getattr(request.user, 'is_administrator', False) or request.user.role == 'ADMINISTRATOR':
            sede_id = request.query_params.get('sede_id') or getattr(request.user, 'sede_id', None)
            qs = ServicioMoto.objects.filter(archivado=True)
            if sede_id:
                qs = qs.filter(sede_id=sede_id)
        else:
            sede = getattr(request.user, 'sede', None)
            if not sede:
                return Response({'success': True, 'data': {'servicios': [], 'pagination': {}}})
            qs = ServicioMoto.objects.filter(archivado=True, sede=sede)

        # Filtro por fechas de archivado
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        if fecha_desde:
            qs = qs.filter(fecha_archivado__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_archivado__date__lte=fecha_hasta)

        # Filtro por status
        estado = request.query_params.get('status')
        if estado:
            qs = qs.filter(status=estado)

        # Búsqueda libre
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(folio__icontains=search) |
                Q(cliente__nombre__icontains=search) |
                Q(moto__marca__icontains=search) |
                Q(moto__modelo__icontains=search)
            )

        qs = qs.select_related('moto', 'cliente', 'mecanico', 'sede', 'archivado_por') \
               .order_by('-fecha_archivado', '-fecha_recepcion')

        items, pagination = _paginate(qs, request)
        serializer = ServicioMotoListSerializer(items, many=True, context={'request': request})
        return Response({
            'success': True,
            'data': {
                'servicios': serializer.data,
                'pagination': pagination,
            },
        })


# ─────────────────────────────────────────────────────────────────────────────
#  SEGUIMIENTO PÚBLICO (sin autenticación)
# ─────────────────────────────────────────────────────────────────────────────

class SeguimientoPublicoView(APIView):
    """
    GET público (sin autenticación) — devuelve el estado de una orden por su tracking_token.
    Endpoint: /api/taller/seguimiento/<uuid:token>/
    """
    permission_classes = [AllowAny]
    throttle_classes   = []  # Puedes agregar throttle si lo deseas

    def get(self, request, token):
        try:
            servicio = ServicioMoto.objects.select_related(
                'moto', 'sede', 'cliente'
            ).prefetch_related('solicitudes_extra').get(tracking_token=token)
        except (ServicioMoto.DoesNotExist, ValueError):
            return Response(
                {'success': False, 'message': 'Orden no encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SeguimientoPublicoSerializer(servicio)
        return Response({'success': True, 'data': serializer.data})


# ─────────────────────────────────────────────────────────────────────────────
#  REPORTE DE SERVICIOS (para EncargadoPanel)
# ─────────────────────────────────────────────────────────────────────────────

class ReporteTallerView(APIView):
    """
    GET — Reporte analítico de servicios del taller para el Encargado.
    Permiso: JEFE_MECANICO, ENCARGADO, ADMINISTRATOR.

    Query params obligatorios:
      - fecha_desde  (YYYY-MM-DD)
      - fecha_hasta  (YYYY-MM-DD)

    Query params opcionales:
      - sede_id  (int — admin puede especificar; otros usan su sede)
    """
    permission_classes = [IsJefeMecanicoOrAbove]

    def get(self, request):
        from datetime import date, timedelta
        from decimal import Decimal
        from django.db.models import Count, Sum, Avg, F, ExpressionWrapper, DurationField
        from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, Coalesce
        from django.db.models import Value

        # ── 1. Determinar sede ────────────────────────────────────────────────
        user = request.user
        if user.role == 'ADMINISTRATOR':
            sede_id = request.query_params.get('sede_id') or getattr(user, 'sede_id', None)
        else:
            sede_id = getattr(user, 'sede_id', None)

        if not sede_id:
            return Response(
                {'success': False, 'message': 'No se pudo determinar la sede.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── 2. Parsear fechas ─────────────────────────────────────────────────
        fecha_desde_str = request.query_params.get('fecha_desde')
        fecha_hasta_str = request.query_params.get('fecha_hasta')

        if not fecha_desde_str or not fecha_hasta_str:
            return Response(
                {'success': False, 'message': 'Los parámetros fecha_desde y fecha_hasta son obligatorios (YYYY-MM-DD).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            fecha_desde = date.fromisoformat(fecha_desde_str)
            fecha_hasta = date.fromisoformat(fecha_hasta_str)
        except ValueError:
            return Response(
                {'success': False, 'message': 'Formato de fecha inválido. Use YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if fecha_desde > fecha_hasta:
            return Response(
                {'success': False, 'message': 'fecha_desde no puede ser posterior a fecha_hasta.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── 3. Queryset base (todas las órdenes del período y sede) ───────────
        qs_base = ServicioMoto.objects.filter(
            sede_id=sede_id,
            fecha_recepcion__date__gte=fecha_desde,
            fecha_recepcion__date__lte=fecha_hasta,
        )

        # Subqueryset: solo ENTREGADO (para métricas financieras)
        qs_entregadas = qs_base.filter(status=ServicioMoto.Status.ENTREGADO)

        # ── 4. KPIs ───────────────────────────────────────────────────────────
        total_ordenes    = qs_base.count()
        total_entregadas = qs_entregadas.count()
        total_canceladas = qs_base.filter(status=ServicioMoto.Status.CANCELADO).count()
        total_activas    = qs_base.exclude(
            status__in=[ServicioMoto.Status.ENTREGADO, ServicioMoto.Status.CANCELADO]
        ).count()

        # Ingresos y ticket promedio (solo ENTREGADO)
        agg_financiero = qs_entregadas.aggregate(
            ingresos=Coalesce(Sum('total'), Value(Decimal('0'))),
            ticket_avg=Avg('total'),
        )
        ingresos_totales = agg_financiero['ingresos'] or Decimal('0')
        ticket_promedio  = agg_financiero['ticket_avg'] or Decimal('0')

        # Tiempo promedio de resolución (fecha_entrega - fecha_recepcion) en horas
        qs_tiempo = qs_entregadas.filter(fecha_entrega__isnull=False).annotate(
            duracion=ExpressionWrapper(
                F('fecha_entrega') - F('fecha_recepcion'),
                output_field=DurationField()
            )
        ).aggregate(avg_dur=Avg('duracion'))
        avg_dur = qs_tiempo['avg_dur']
        tiempo_promedio_horas = round(avg_dur.total_seconds() / 3600, 1) if avg_dur else 0.0

        # Tasa de cancelación
        tasa_cancelacion = round((total_canceladas / total_ordenes * 100), 1) if total_ordenes > 0 else 0.0

        kpis = {
            'total_ordenes': total_ordenes,
            'total_entregadas': total_entregadas,
            'total_canceladas': total_canceladas,
            'total_activas': total_activas,
            'ingresos_totales': str(ingresos_totales),
            'ticket_promedio': str(round(ticket_promedio, 2)),
            'tiempo_promedio_horas': tiempo_promedio_horas,
            'tasa_cancelacion_pct': tasa_cancelacion,
        }

        # ── 5. Ingresos por período ────────────────────────────────────────────
        dias_rango = (fecha_hasta - fecha_desde).days + 1

        if dias_rango <= 7:
            trunc_fn = TruncDay
            label_fmt = '%d %b'
        elif dias_rango <= 60:
            trunc_fn = TruncWeek
            label_fmt = 'Sem %d/%m'
        else:
            trunc_fn = TruncMonth
            label_fmt = '%b %Y'

        periodo_qs = (
            qs_entregadas
            .annotate(periodo=trunc_fn('fecha_recepcion'))
            .values('periodo')
            .annotate(
                ingresos=Coalesce(Sum('total'), Value(Decimal('0'))),
                ordenes=Count('id'),
            )
            .order_by('periodo')
        )

        ingresos_por_periodo = []
        for row in periodo_qs:
            p = row['periodo']
            label = p.strftime(label_fmt) if p else '—'
            ingresos_por_periodo.append({
                'label': label,
                'ingresos': str(row['ingresos']),
                'ordenes': row['ordenes'],
            })

        # ── 6. Por mecánico ────────────────────────────────────────────────────
        por_mecanico_raw = (
            qs_base
            .filter(mecanico__isnull=False)
            .values('mecanico__id', 'mecanico__first_name', 'mecanico__last_name')
            .annotate(
                asignadas=Count('id'),
                entregadas=Count('id', filter=Q(status=ServicioMoto.Status.ENTREGADO)),
                ingreso_generado=Coalesce(
                    Sum('total', filter=Q(status=ServicioMoto.Status.ENTREGADO)),
                    Value(Decimal('0'))
                ),
            )
            .order_by('-entregadas')
        )

        # Tiempo promedio por mecánico (segunda query para no complicar el GROUP BY)
        tiempos_mec = {}
        tiempos_qs = (
            qs_entregadas
            .filter(mecanico__isnull=False, fecha_entrega__isnull=False)
            .annotate(
                duracion=ExpressionWrapper(
                    F('fecha_entrega') - F('fecha_recepcion'),
                    output_field=DurationField()
                )
            )
            .values('mecanico__id')
            .annotate(avg_dur=Avg('duracion'))
        )
        for row in tiempos_qs:
            avg = row['avg_dur']
            tiempos_mec[row['mecanico__id']] = round(avg.total_seconds() / 3600, 1) if avg else 0.0

        por_mecanico = []
        for row in por_mecanico_raw:
            mec_id = row['mecanico__id']
            nombre = f"{row['mecanico__first_name']} {row['mecanico__last_name']}".strip()
            asignadas = row['asignadas']
            entregadas = row['entregadas']
            pct = round(entregadas / asignadas * 100, 1) if asignadas > 0 else 0.0
            por_mecanico.append({
                'mecanico_id': mec_id,
                'mecanico_nombre': nombre,
                'asignadas': asignadas,
                'entregadas': entregadas,
                'pct_completadas': pct,
                'ingreso_generado': str(row['ingreso_generado']),
                'tiempo_promedio_horas': tiempos_mec.get(mec_id, 0.0),
            })

        # ── 7. Por tipo (reparación vs mantenimiento) ──────────────────────────
        agg_rep = qs_entregadas.filter(es_reparacion=True).aggregate(
            conteo=Count('id'),
            ingresos=Coalesce(Sum('total'), Value(Decimal('0')))
        )
        agg_mant = qs_entregadas.filter(es_reparacion=False).aggregate(
            conteo=Count('id'),
            ingresos=Coalesce(Sum('total'), Value(Decimal('0')))
        )
        por_tipo = {
            'reparacion': {
                'conteo': agg_rep['conteo'],
                'ingresos': str(agg_rep['ingresos']),
            },
            'mantenimiento': {
                'conteo': agg_mant['conteo'],
                'ingresos': str(agg_mant['ingresos']),
            },
        }

        # ── 8. Por método de pago ──────────────────────────────────────────────
        metodos_raw = (
            qs_entregadas
            .values('metodo_pago')
            .annotate(
                conteo=Count('id'),
                total_cobrado=Coalesce(Sum('total'), Value(Decimal('0')))
            )
            .order_by('-total_cobrado')
        )
        por_metodo_pago = [
            {
                'metodo': row['metodo_pago'] or 'SIN_REGISTRAR',
                'conteo': row['conteo'],
                'total': str(row['total_cobrado']),
            }
            for row in metodos_raw
        ]

        # ── 9. Órdenes con entrega tardía ──────────────────────────────────────
        tardias_qs = (
            qs_entregadas
            .filter(
                fecha_entrega_estimada__isnull=False,
                fecha_entrega__isnull=False,
                fecha_entrega__date__gt=F('fecha_entrega_estimada'),
            )
            .select_related('mecanico')
            .order_by('-fecha_recepcion')[:20]
        )
        ordenes_tardias = []
        for s in tardias_qs:
            dias = (s.fecha_entrega.date() - s.fecha_entrega_estimada).days
            ordenes_tardias.append({
                'folio': s.folio,
                'mecanico_nombre': s.mecanico.get_full_name() if s.mecanico else '—',
                'fecha_estimada': str(s.fecha_entrega_estimada),
                'fecha_entrega': str(s.fecha_entrega.date()),
                'dias_retraso': dias,
            })

        # ── 10. Activas por status ─────────────────────────────────────────────
        activas_qs = (
            qs_base
            .exclude(status__in=[ServicioMoto.Status.ENTREGADO, ServicioMoto.Status.CANCELADO])
            .values('status')
            .annotate(conteo=Count('id'))
            .order_by('status')
        )
        STATUS_DISPLAY = {
            'RECIBIDO': 'Recibido',
            'EN_DIAGNOSTICO': 'En diagnóstico',
            'EN_PROCESO': 'En proceso',
            'COTIZACION_EXTRA': 'Cotización extra',
            'LISTA_PARA_ENTREGAR': 'Lista para entregar',
            'LISTO': 'Listo',
        }
        activas_por_status = [
            {
                'status': row['status'],
                'status_display': STATUS_DISPLAY.get(row['status'], row['status']),
                'conteo': row['conteo'],
            }
            for row in activas_qs
        ]

        # ── Respuesta final ────────────────────────────────────────────────────
        return Response({
            'success': True,
            'data': {
                'periodo': {
                    'desde': str(fecha_desde),
                    'hasta': str(fecha_hasta),
                },
                'kpis': kpis,
                'ingresos_por_periodo': ingresos_por_periodo,
                'por_mecanico': por_mecanico,
                'por_tipo': por_tipo,
                'por_metodo_pago': por_metodo_pago,
                'ordenes_tardias': ordenes_tardias,
                'activas_por_status': activas_por_status,
            }
        })
