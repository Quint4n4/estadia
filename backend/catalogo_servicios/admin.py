from django.contrib import admin

from .models import (
    CatalogoServicio,
    CatalogoServicioRefaccion,
    CategoriaServicio,
    PrecioServicioSede,
)


# ─────────────────────────────────────────────────────────────────────────────
#  INLINE: Refacciones dentro de CatalogoServicio
# ─────────────────────────────────────────────────────────────────────────────

class CatalogoServicioRefaccionInline(admin.TabularInline):
    model = CatalogoServicioRefaccion
    extra = 1
    autocomplete_fields = ['producto']


class PrecioServicioSedeInline(admin.TabularInline):
    model = PrecioServicioSede
    extra = 0


# ─────────────────────────────────────────────────────────────────────────────
#  CATEGORÍA DE SERVICIO
# ─────────────────────────────────────────────────────────────────────────────

@admin.register(CategoriaServicio)
class CategoriaServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'activo')
    list_filter = ('activo',)
    search_fields = ('nombre',)
    ordering = ('nombre',)


# ─────────────────────────────────────────────────────────────────────────────
#  CATÁLOGO DE SERVICIO
# ─────────────────────────────────────────────────────────────────────────────

@admin.register(CatalogoServicio)
class CatalogoServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria', 'precio_base', 'duracion_estimada_minutos', 'activo', 'created_at')
    list_filter = ('activo', 'categoria')
    search_fields = ('nombre', 'descripcion')
    ordering = ('categoria', 'nombre')
    readonly_fields = ('created_at', 'updated_at', 'created_by')
    inlines = [CatalogoServicioRefaccionInline, PrecioServicioSedeInline]

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


# ─────────────────────────────────────────────────────────────────────────────
#  REFACCIÓN DEL SERVICIO
# ─────────────────────────────────────────────────────────────────────────────

@admin.register(CatalogoServicioRefaccion)
class CatalogoServicioRefaccionAdmin(admin.ModelAdmin):
    list_display = ('servicio', 'producto', 'cantidad', 'es_opcional')
    list_filter = ('es_opcional', 'servicio__categoria')
    search_fields = ('servicio__nombre', 'producto__name', 'producto__sku')
    ordering = ('servicio', 'es_opcional', 'producto__name')


# ─────────────────────────────────────────────────────────────────────────────
#  PRECIO DE SERVICIO POR SEDE
# ─────────────────────────────────────────────────────────────────────────────

@admin.register(PrecioServicioSede)
class PrecioServicioSedeAdmin(admin.ModelAdmin):
    list_display = ('servicio', 'sede', 'precio_override', 'activo', 'updated_at')
    list_filter = ('activo', 'sede')
    search_fields = ('servicio__nombre', 'sede__name')
    ordering = ('servicio', 'sede')
    readonly_fields = ('updated_at',)
