"""
Catálogo de Servicios URL Configuration — MotoQFox
"""
from django.urls import path
from . import views

urlpatterns = [
    # Disponibilidad global (debe ir ANTES del <pk> para evitar conflicto)
    path('disponibilidad-sede/', views.DisponibilidadTodosServiciosView.as_view(), name='disponibilidad-sede'),

    # Catálogo principal
    path('', views.CatalogoServicioListCreateView.as_view(), name='catalogo-list-create'),
    path('<int:pk>/', views.CatalogoServicioDetailView.as_view(), name='catalogo-detail'),
    path('<int:pk>/toggle-activo/', views.ToggleActivoServicioView.as_view(), name='catalogo-toggle-activo'),
    path('<int:pk>/disponibilidad/', views.DisponibilidadServicioView.as_view(), name='catalogo-disponibilidad'),
    path('<int:pk>/precios-sede/', views.PrecioServicioSedeListCreateView.as_view(), name='catalogo-precios-sede'),

    # Categorías
    path('categorias/', views.CategoriaServicioListCreateView.as_view(), name='categoria-list-create'),
    path('categorias/<int:pk>/', views.CategoriaServicioDetailView.as_view(), name='categoria-detail'),
]
