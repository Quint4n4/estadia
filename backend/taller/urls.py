"""
Taller URL Configuration — MotoQFox
"""
from django.urls import path
from . import views

urlpatterns = [
    # ── Motos del cliente ─────────────────────────────────────────────────────
    path('motos-cliente/',       views.MotoClienteListView.as_view(),   name='moto-cliente-list'),
    path('motos-cliente/<int:pk>/', views.MotoClienteDetailView.as_view(), name='moto-cliente-detail'),

    # ── Órdenes de servicio ───────────────────────────────────────────────────
    path('servicios/',              views.ServicioListView.as_view(),        name='servicio-list'),
    path('servicios/archivar/',     views.ArchivarOrdenesView.as_view(),     name='archivar-ordenes'),
    path('servicios/historial/',    views.HistorialServiciosView.as_view(),  name='historial-servicios'),
    path('servicios/reporte/',      views.ReporteTallerView.as_view(),       name='reporte-taller'),
    path('servicios/reporte-pdf/',  views.ReporteTallerPDFView.as_view(),    name='reporte-taller-pdf'),
    path('servicios/<int:pk>/',     views.ServicioDetailView.as_view(),      name='servicio-detail'),

    # Imágenes de evidencia
    path('servicios/<int:pk>/imagenes/', views.ServicioImagenesView.as_view(), name='servicio-imagenes'),

    # Ítems del servicio (agregar/eliminar durante EN_DIAGNOSTICO)
    path('servicios/<int:pk>/items/', views.ServicioItemsView.as_view(), name='servicio-items'),
    path('servicios/<int:pk>/items/<int:item_pk>/', views.ServicioItemsView.as_view(), name='servicio-item-delete'),

    # Transiciones de estado
    path('servicios/<int:pk>/asignar/',   views.AsignarMecanicoView.as_view(),         name='servicio-asignar'),
    path('servicios/<int:pk>/iniciar/',   views.IniciarReparacionView.as_view(),        name='servicio-iniciar'),
    path('servicios/<int:pk>/submit-diagnostico/', views.SubmitDiagnosticoView.as_view(), name='submit-diagnostico'),
    path('servicios/<int:pk>/autorizar/',   views.AutorizarDiagnosticoView.as_view(),   name='servicio-autorizar'),
    path('servicios/<int:pk>/cancelar/',   views.CancelarOrdenView.as_view(),           name='servicio-cancelar'),
    path('servicios/<int:pk>/diagnostico/', views.ActualizarDiagnosticoView.as_view(), name='servicio-diagnostico'),
    path('servicios/<int:pk>/listo/',     views.MarcarListaParaEntregarView.as_view(),  name='servicio-listo'),
    path('servicios/<int:pk>/entregada/', views.MarcarEntregadaView.as_view(),          name='servicio-entregada'),
    path('servicios/<int:pk>/entregar/',  views.EntregarServicioView.as_view(),         name='servicio-entregar'),

    # Búsqueda por QR del cliente
    path('servicios/por-qr/<uuid:token>/', views.ServicioPorQRView.as_view(), name='servicio-por-qr'),

    # ── Solicitudes de refacción extra ────────────────────────────────────────
    path('solicitudes-extra/',              views.SolicitudRefaccionExtraListView.as_view(), name='solicitud-extra-list'),
    path('solicitudes-extra/<int:pk>/aprobar/',  views.AprobarSolicitudView.as_view(),  name='solicitud-extra-aprobar'),
    path('solicitudes-extra/<int:pk>/rechazar/', views.RechazarSolicitudView.as_view(), name='solicitud-extra-rechazar'),

    # ── App cliente ───────────────────────────────────────────────────────────
    path('mis-servicios/',          views.MisServiciosView.as_view(),      name='mis-servicios'),
    path('mis-servicios/<int:pk>/', views.MiServicioDetailView.as_view(),  name='mi-servicio-detail'),

    # ── Seguimiento público (sin autenticación) ───────────────────────────────
    path('seguimiento/<uuid:token>/', views.SeguimientoPublicoView.as_view(), name='seguimiento-publico'),
]
