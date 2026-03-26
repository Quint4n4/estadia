"""
Catálogo de Servicios Views — MotoQFox
========================================
CategoriaServicioListCreateView
CategoriaServicioDetailView
CatalogoServicioListCreateView
CatalogoServicioDetailView
ToggleActivoServicioView
DisponibilidadServicioView
DisponibilidadTodosServiciosView
PrecioServicioSedeListCreateView
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from inventory.models import Stock
from .models import (
    CategoriaServicio,
    CatalogoServicio,
    PrecioServicioSede,
)
from .serializers import (
    CategoriaServicioSerializer,
    CatalogoServicioListSerializer,
    CatalogoServicioDetailSerializer,
    CatalogoServicioCreateSerializer,
    DisponibilidadServicioSerializer,
    PrecioServicioSedeSerializer,
)
from .permissions import EsAdministrador, EsAdministradorOEncargado


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _paginate(qs, request, default_size=20):
    try:
        page      = max(1, int(request.query_params.get('page', 1)))
        page_size = min(100, max(1, int(request.query_params.get('page_size', default_size))))
    except (ValueError, TypeError):
        page, page_size = 1, default_size
    total = qs.count()
    start = (page - 1) * page_size
    items = qs[start:start + page_size]
    return items, {
        'total':       total,
        'page':        page,
        'page_size':   page_size,
        'total_pages': max(1, -(-total // page_size)),
    }


def _not_found(entity='Recurso'):
    return Response(
        {'success': False, 'message': f'{entity} no encontrado'},
        status=status.HTTP_404_NOT_FOUND,
    )


def _calcular_disponibilidad(servicio, sede_id):
    """
    Devuelve (disponible: bool, refacciones_data: list).
    disponible es True solo si TODAS las refacciones no opcionales tienen stock suficiente.
    """
    refacciones_data = []
    disponible = True

    for ref in servicio.refacciones.select_related('producto').all():
        stock = Stock.objects.filter(
            producto=ref.producto, sede_id=sede_id
        ).first()
        en_stock = stock.quantity if stock else 0
        suficiente = en_stock >= ref.cantidad
        if not ref.es_opcional and not suficiente:
            disponible = False
        refacciones_data.append({
            'producto_nombre': ref.producto.name,
            'requerido':       ref.cantidad,
            'en_stock':        en_stock,
            'suficiente':      suficiente,
            'es_opcional':     ref.es_opcional,
        })

    return disponible, refacciones_data


# ─────────────────────────────────────────────────────────────────────────────
#  CATEGORÍAS DE SERVICIO
# ─────────────────────────────────────────────────────────────────────────────

class CategoriaServicioListCreateView(APIView):
    """
    GET  /api/catalogo-servicios/categorias/
    POST /api/catalogo-servicios/categorias/   (solo ADMINISTRATOR)
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [EsAdministrador()]
        return [IsAuthenticated()]

    def get(self, request):
        activo = request.query_params.get('activo', '').strip()
        if activo == 'true':
            qs = CategoriaServicio.objects.filter(activo=True)
        elif activo == 'false':
            qs = CategoriaServicio.objects.filter(activo=False)
        else:
            qs = CategoriaServicio.objects.all()
        return Response({
            'success': True,
            'data': CategoriaServicioSerializer(qs, many=True).data,
        })

    def post(self, request):
        s = CategoriaServicioSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(
                {'success': True, 'message': 'Categoría creada', 'data': s.data},
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {'success': False, 'message': 'Datos inválidos', 'errors': s.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


class CategoriaServicioDetailView(APIView):
    """
    GET    /api/catalogo-servicios/categorias/<pk>/
    PATCH  /api/catalogo-servicios/categorias/<pk>/   (solo ADMINISTRATOR)
    DELETE /api/catalogo-servicios/categorias/<pk>/   (soft-delete, solo ADMINISTRATOR)
    """
    def get_permissions(self):
        if self.request.method in ('PATCH', 'DELETE'):
            return [EsAdministrador()]
        return [IsAuthenticated()]

    def _get(self, pk):
        try:
            return CategoriaServicio.objects.get(pk=pk)
        except CategoriaServicio.DoesNotExist:
            return None

    def get(self, request, pk):
        cat = self._get(pk)
        if not cat:
            return _not_found('Categoría')
        return Response({'success': True, 'data': CategoriaServicioSerializer(cat).data})

    def patch(self, request, pk):
        cat = self._get(pk)
        if not cat:
            return _not_found('Categoría')
        s = CategoriaServicioSerializer(cat, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response({'success': True, 'message': 'Categoría actualizada', 'data': s.data})
        return Response(
            {'success': False, 'errors': s.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        cat = self._get(pk)
        if not cat:
            return _not_found('Categoría')
        cat.activo = False
        cat.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────────
#  CATÁLOGO DE SERVICIOS
# ─────────────────────────────────────────────────────────────────────────────

class CatalogoServicioListCreateView(APIView):
    """
    GET  /api/catalogo-servicios/
    POST /api/catalogo-servicios/   (solo ADMINISTRATOR)
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [EsAdministrador()]
        return [IsAuthenticated()]

    def get(self, request):
        qs = CatalogoServicio.objects.select_related('categoria').prefetch_related('refacciones')

        # Filtro ?activo=true/false (default: solo activos)
        activo = request.query_params.get('activo', 'true').strip()
        if activo == 'false':
            qs = qs.filter(activo=False)
        else:
            qs = qs.filter(activo=True)

        # Filtro ?search=texto
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(nombre__icontains=search)

        # Filtro ?categoria=id
        categoria_id = request.query_params.get('categoria', '').strip()
        if categoria_id:
            qs = qs.filter(categoria_id=categoria_id)

        items, pagination = _paginate(qs, request)
        return Response({
            'success': True,
            'data': {
                'servicios':  CatalogoServicioListSerializer(items, many=True).data,
                'pagination': pagination,
            },
        })

    def post(self, request):
        s = CatalogoServicioCreateSerializer(
            data=request.data, context={'request': request}
        )
        if s.is_valid():
            servicio = s.save()
            return Response(
                {
                    'success': True,
                    'message': 'Servicio creado exitosamente',
                    'data': CatalogoServicioDetailSerializer(servicio).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {'success': False, 'message': 'Datos inválidos', 'errors': s.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


class CatalogoServicioDetailView(APIView):
    """
    GET    /api/catalogo-servicios/<pk>/
    PATCH  /api/catalogo-servicios/<pk>/   (solo ADMINISTRATOR)
    DELETE /api/catalogo-servicios/<pk>/   (soft-delete, solo ADMINISTRATOR)
    """
    def get_permissions(self):
        if self.request.method in ('PATCH', 'DELETE'):
            return [EsAdministrador()]
        return [IsAuthenticated()]

    def _get(self, pk):
        try:
            return CatalogoServicio.objects.select_related('categoria').prefetch_related(
                'refacciones__producto'
            ).get(pk=pk)
        except CatalogoServicio.DoesNotExist:
            return None

    def get(self, request, pk):
        servicio = self._get(pk)
        if not servicio:
            return _not_found('Servicio')
        return Response({
            'success': True,
            'data': CatalogoServicioDetailSerializer(servicio).data,
        })

    def patch(self, request, pk):
        servicio = self._get(pk)
        if not servicio:
            return _not_found('Servicio')
        s = CatalogoServicioCreateSerializer(
            servicio, data=request.data, partial=True, context={'request': request}
        )
        if s.is_valid():
            s.save()
            return Response({
                'success': True,
                'message': 'Servicio actualizado',
                'data': CatalogoServicioDetailSerializer(self._get(pk)).data,
            })
        return Response(
            {'success': False, 'errors': s.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        servicio = self._get(pk)
        if not servicio:
            return _not_found('Servicio')
        servicio.activo = False
        servicio.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────────
#  TOGGLE ACTIVO
# ─────────────────────────────────────────────────────────────────────────────

class ToggleActivoServicioView(APIView):
    """POST /api/catalogo-servicios/<pk>/toggle-activo/  (solo ADMINISTRATOR)"""
    permission_classes = [EsAdministrador]

    def post(self, request, pk):
        try:
            servicio = CatalogoServicio.objects.get(pk=pk)
        except CatalogoServicio.DoesNotExist:
            return _not_found('Servicio')

        servicio.activo = not servicio.activo
        servicio.save()
        return Response({
            'activo':  servicio.activo,
            'mensaje': f"Servicio {'activado' if servicio.activo else 'desactivado'} correctamente.",
        })


# ─────────────────────────────────────────────────────────────────────────────
#  DISPONIBILIDAD DE UN SERVICIO EN UNA SEDE
# ─────────────────────────────────────────────────────────────────────────────

class DisponibilidadServicioView(APIView):
    """GET /api/catalogo-servicios/<pk>/disponibilidad/?sede_id=<id>"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        sede_id = request.query_params.get('sede_id', '').strip()
        if not sede_id:
            return Response(
                {'success': False, 'message': 'sede_id es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            servicio = CatalogoServicio.objects.get(pk=pk)
        except CatalogoServicio.DoesNotExist:
            return _not_found('Servicio')

        disponible, refacciones_data = _calcular_disponibilidad(servicio, sede_id)

        data = {
            'servicio_id':     servicio.id,
            'servicio_nombre': servicio.nombre,
            'disponible':      disponible,
            'refacciones':     refacciones_data,
        }
        serializer = DisponibilidadServicioSerializer(data)
        return Response({'success': True, 'data': serializer.data})


# ─────────────────────────────────────────────────────────────────────────────
#  DISPONIBILIDAD DE TODOS LOS SERVICIOS ACTIVOS EN UNA SEDE
# ─────────────────────────────────────────────────────────────────────────────

class DisponibilidadTodosServiciosView(APIView):
    """GET /api/catalogo-servicios/disponibilidad-sede/?sede_id=<id>"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sede_id = request.query_params.get('sede_id', '').strip()
        if not sede_id:
            return Response(
                {'success': False, 'message': 'sede_id es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        servicios = CatalogoServicio.objects.filter(activo=True).select_related(
            'categoria'
        ).prefetch_related('refacciones__producto')

        resultado = []
        for servicio in servicios:
            disponible, _ = _calcular_disponibilidad(servicio, sede_id)
            servicio_data = CatalogoServicioListSerializer(servicio).data
            servicio_data['disponible'] = disponible
            resultado.append(servicio_data)

        return Response({'success': True, 'data': resultado})


# ─────────────────────────────────────────────────────────────────────────────
#  PRECIOS POR SEDE
# ─────────────────────────────────────────────────────────────────────────────

class PrecioServicioSedeListCreateView(APIView):
    """
    GET  /api/catalogo-servicios/<pk>/precios-sede/   (solo ADMINISTRATOR)
    POST /api/catalogo-servicios/<pk>/precios-sede/   (solo ADMINISTRATOR)
    """
    permission_classes = [EsAdministrador]

    def _get_servicio(self, pk):
        try:
            return CatalogoServicio.objects.get(pk=pk)
        except CatalogoServicio.DoesNotExist:
            return None

    def get(self, request, pk):
        servicio = self._get_servicio(pk)
        if not servicio:
            return _not_found('Servicio')
        qs = PrecioServicioSede.objects.filter(servicio=servicio).select_related('sede')
        return Response({
            'success': True,
            'data': PrecioServicioSedeSerializer(qs, many=True).data,
        })

    def post(self, request, pk):
        servicio = self._get_servicio(pk)
        if not servicio:
            return _not_found('Servicio')

        s = PrecioServicioSedeSerializer(data=request.data)
        if not s.is_valid():
            return Response(
                {'success': False, 'errors': s.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sede = s.validated_data['sede']
        precio_override = s.validated_data['precio_override']
        activo = s.validated_data.get('activo', True)

        precio, created = PrecioServicioSede.objects.update_or_create(
            servicio=servicio,
            sede=sede,
            defaults={
                'precio_override': precio_override,
                'activo':          activo,
            },
        )
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        message = 'Precio creado' if created else 'Precio actualizado'
        return Response(
            {
                'success': True,
                'message': message,
                'data':    PrecioServicioSedeSerializer(precio).data,
            },
            status=http_status,
        )
