from django.urls import path
from .views import (
    RegistroClienteView,
    MiPerfilView,
    MiQRView,
    MisComprasView,
    BuscarClienteView,
    ClientePorQRView,
    RecepcionClientesView,
    ClienteCorreosView,
    EditarCorreoClienteView,
    ReenviarCorreosView,
)

urlpatterns = [
    path('registro/',          RegistroClienteView.as_view()),
    path('perfil/',            MiPerfilView.as_view()),
    path('mi-qr/',             MiQRView.as_view()),
    path('mis-compras/',       MisComprasView.as_view()),
    path('buscar/',            BuscarClienteView.as_view()),
    path('por-qr/<uuid:token>/', ClientePorQRView.as_view()),

    # ── Recepción: panel de correos del cliente ──────────────────────────────
    path('recepcion/clientes/',                   RecepcionClientesView.as_view()),
    path('recepcion/clientes/<int:pk>/correos/',  ClienteCorreosView.as_view()),
    path('recepcion/clientes/<int:pk>/correo/',   EditarCorreoClienteView.as_view()),
    path('recepcion/clientes/<int:pk>/reenviar/', ReenviarCorreosView.as_view()),
]
