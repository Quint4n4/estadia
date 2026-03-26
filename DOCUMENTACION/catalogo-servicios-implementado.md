# Módulo Catálogo de Servicios — Implementación Completada

## Resumen de la implementación

Se implementó el módulo `catalogo_servicios` que permite gestionar servicios de taller (ej. cambio de aceite, afinación) con precio base, duración estimada, categorías y refacciones requeridas. Los servicios pueden venderse desde el POS igual que productos físicos, con descuento automático de stock de refacciones al momento de la venta.

---

## Comandos para correr las migraciones

Ejecutar en orden desde `C:\MyPoint\myPoint\backend` con el venv activado:

```bash
python manage.py makemigrations catalogo_servicios
python manage.py makemigrations sales --name="add_servicio_to_ventaitem"
python manage.py migrate
```

---

## Endpoints del API (todos con prefijo `/api/catalogo-servicios/`)

| Método | URL | Descripción | Roles permitidos |
|--------|-----|-------------|-----------------|
| GET | `/api/catalogo-servicios/` | Listar servicios (paginado, filtros: activo, search, categoria) | Todos autenticados |
| POST | `/api/catalogo-servicios/` | Crear nuevo servicio | ADMINISTRATOR |
| GET | `/api/catalogo-servicios/<id>/` | Detalle de un servicio con refacciones | Todos autenticados |
| PATCH | `/api/catalogo-servicios/<id>/` | Actualizar servicio (partial) | ADMINISTRATOR |
| DELETE | `/api/catalogo-servicios/<id>/` | Soft-delete (activo=False) | ADMINISTRATOR |
| POST | `/api/catalogo-servicios/<id>/toggle-activo/` | Activar/desactivar servicio | ADMINISTRATOR |
| GET | `/api/catalogo-servicios/<id>/disponibilidad/?sede_id=N` | Disponibilidad de refacciones en una sede | Todos autenticados |
| GET | `/api/catalogo-servicios/disponibilidad-sede/?sede_id=N` | Disponibilidad de todos los servicios activos en una sede | Todos autenticados |
| GET | `/api/catalogo-servicios/<id>/precios-sede/` | Listar overrides de precio por sede | ADMINISTRATOR |
| POST | `/api/catalogo-servicios/<id>/precios-sede/` | Crear o actualizar precio override por sede | ADMINISTRATOR |
| GET | `/api/catalogo-servicios/categorias/` | Listar categorías de servicio | Todos autenticados |
| POST | `/api/catalogo-servicios/categorias/` | Crear categoría | ADMINISTRATOR |
| GET | `/api/catalogo-servicios/categorias/<id>/` | Detalle de categoría | Todos autenticados |
| PATCH | `/api/catalogo-servicios/categorias/<id>/` | Actualizar categoría | ADMINISTRATOR |
| DELETE | `/api/catalogo-servicios/categorias/<id>/` | Soft-delete de categoría | ADMINISTRATOR |

---

## Archivos creados

### Backend

- `backend/catalogo_servicios/__init__.py`
- `backend/catalogo_servicios/apps.py`
- `backend/catalogo_servicios/models.py`
- `backend/catalogo_servicios/validators.py`
- `backend/catalogo_servicios/serializers.py`
- `backend/catalogo_servicios/permissions.py`
- `backend/catalogo_servicios/views.py`
- `backend/catalogo_servicios/urls.py`
- `backend/catalogo_servicios/admin.py`
- `backend/catalogo_servicios/migrations/__init__.py`

### Frontend

- `frontend/src/types/catalogo-servicios.types.ts`
- `frontend/src/api/catalogo-servicios.service.ts`
- `frontend/src/components/admin/servicios/CategoriaServicioModal.tsx`
- `frontend/src/components/admin/servicios/RefaccionesFormSection.tsx`
- `frontend/src/components/admin/servicios/ServicioFormModal.tsx`
- `frontend/src/components/admin/servicios/CatalogoServiciosList.tsx`

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/config/settings.py` | Agregado `'catalogo_servicios'` a `INSTALLED_APPS` |
| `backend/config/urls.py` | Agregado `path('api/catalogo-servicios/', include('catalogo_servicios.urls'))` |
| `backend/sales/models.py` | Agregado campo `tipo` (PRODUCTO/SERVICIO) y FK `catalogo_servicio` a `VentaItem` |
| `backend/sales/serializers.py` | `VentaItemCreateSerializer` y `VentaCreateSerializer` extendidos para soportar servicios; desconteo de refacciones al vender |
| `frontend/src/types/sales.types.ts` | `CartItem` y `VentaItemPayload` extendidos con `tipo` y `catalogo_servicio_id` |
| `frontend/src/components/cashier/POSView.tsx` | Agregada pestaña "Servicios" con `ServiciosTab` que consume `getDisponibilidadTodos` |
| `frontend/src/components/cashier/PaymentModal.tsx` | Soporte para ítems tipo SERVICIO en el carrito y en el ticket de éxito |

---

## Correcciones realizadas durante QA

### BUG 1 — `admin.py`: campo `nombre` inexistente en Producto (backend)

**Archivo:** `backend/catalogo_servicios/admin.py`

**Problema:** `CatalogoServicioRefaccionAdmin.search_fields` y `ordering` referenciaban `producto__nombre`, pero el modelo `inventory.Producto` usa el campo `name` (no `nombre`). Esto habría causado un `FieldError` al abrir la página de admin.

**Corrección:**
- `producto__nombre` → `producto__name` en `search_fields`
- `producto__nombre` → `producto__name` en `ordering`

---

### BUG 2 — `catalogo-servicios.types.ts`: campos incorrectos en `RefaccionServicio.producto` (frontend)

**Archivo:** `frontend/src/types/catalogo-servicios.types.ts`

**Problema:** La interfaz `RefaccionServicio.producto` declaraba los campos `nombre`, `codigo` y `precio_unitario`. Sin embargo, el serializer de backend `_ProductoRefaccionSerializer` retorna los campos `name`, `sku` y `price` (nombres del modelo `inventory.Producto`). El desajuste habría causado que los datos de refacciones se mostraran como `undefined` en el modal de edición.

**Corrección:**
- `nombre` → `name`
- `codigo` → `sku`
- `precio_unitario` → `price`

---

### BUG 3 — `ServicioFormModal.tsx`: uso de campo renombrado `producto.nombre` (frontend)

**Archivo:** `frontend/src/components/admin/servicios/ServicioFormModal.tsx`

**Problema:** Al construir el mapa `productoNames` para el modo edición, se accedía a `r.producto.nombre`. Tras la corrección del BUG 2, el campo correcto es `r.producto.name`. Esto habría dejado el buscador de refacciones vacío en modo edición.

**Corrección:**
- `r.producto.nombre` → `r.producto.name`

---

### BUG 4 — `catalogo-servicios.service.ts`: extracción incorrecta de la respuesta del API (frontend)

**Archivo:** `frontend/src/api/catalogo-servicios.service.ts`

**Problema:** Todos los métodos del servicio usaban `.then(r => r.data)`, devolviendo el objeto completo de la respuesta `{ success, data, message }` en lugar de extraer únicamente el campo `data`. Las funciones declaraban tipos de retorno como `CategoriaServicio[]` o `CatalogoServicioDetail`, pero en realidad retornaban el wrapper completo. Esto causaba:
- `getCategorias()`: retornaba `{ success, data: [...] }` en vez de `CategoriaServicio[]`, rompiendo `categorias.map(...)` en los selectores.
- `createCategoria()`/`updateCategoria()`: retornaban el wrapper en vez del objeto creado, por lo que `onSave(result)` pasaba datos incorrectos.
- `getServicioDetail()`, `createServicio()`, `updateServicio()`: misma situación.
- `getDisponibilidad()`, `getDisponibilidadTodos()`, `getPreciosSede()`, `setPrecioSede()`: misma situación.

**Corrección:** Se cambió `.then(r => r.data)` por `.then(r => r.data.data)` en todos los métodos donde el backend envuelve la respuesta en `{ success, data: <payload> }`. El método `toggleActivoServicio` y `deleteCategoria`/`deleteServicio` conservan `.then(r => r.data)` porque retornan el objeto completo o `void`.

---

### BUG 5 — `CatalogoServiciosList.tsx`: parsing incorrecto de la respuesta paginada (frontend)

**Archivo:** `frontend/src/components/admin/servicios/CatalogoServiciosList.tsx`

**Problema:** El handler de `getServicios()` intentaba leer `data.results` y `data.count` (estructura de DRF `PageNumberPagination`). El backend de este proyecto devuelve una estructura personalizada: `{ success, data: { servicios: [...], pagination: { total, page, page_size, total_pages } } }`. Esto causaba que la lista siempre mostrara vacío.

**Corrección:** Se actualizó el handler para leer `response.data.servicios` y los campos de `response.data.pagination` según la estructura real del backend.

---

## Cómo crear un servicio (flujo completo)

### 1. Crear una categoría de servicio (administrador)

Desde el panel de administración, sección **Catálogo de Servicios**, usar el botón **Nueva Categoría** o el modal integrado dentro del formulario de servicio.

```
POST /api/catalogo-servicios/categorias/
Body: { "nombre": "Mantenimiento General", "descripcion": "Servicios de mantenimiento rutinario" }
```

### 2. Crear el servicio

Desde el panel de administración → **Catálogo de Servicios** → botón **+ Nuevo Servicio**, o bien:

```
POST /api/catalogo-servicios/
Body: {
  "nombre": "Cambio de Aceite",
  "descripcion": "Cambio de aceite de motor con filtro",
  "precio_base": 250.00,
  "duracion_estimada_minutos": 30,
  "categoria": 1,
  "refacciones": [
    { "producto": 42, "cantidad": 1, "es_opcional": false },
    { "producto": 15, "cantidad": 1, "es_opcional": true }
  ]
}
```

Las refacciones `es_opcional: false` bloquean la disponibilidad si no hay stock. Las `es_opcional: true` no bloquean pero se descuentan del stock si están en inventario.

### 3. Verificar disponibilidad en una sede

```
GET /api/catalogo-servicios/<id>/disponibilidad/?sede_id=1
```

Devuelve `disponible: true/false` y el detalle de stock por refacción.

### 4. Configurar precio override por sede (opcional)

Si una sede cobra diferente del precio base:

```
POST /api/catalogo-servicios/<id>/precios-sede/
Body: { "sede": 2, "precio_override": 300.00 }
```

> Nota: El POS actual usa `precio_base` del servicio. La lógica de aplicar el `precio_override` según sede debe implementarse en el frontend del POS cuando se carguen los servicios.

### 5. Vender desde la caja (POS)

El cajero abre el POS, cambia a la pestaña **Servicios**, ve los servicios activos agrupados por categoría con indicador de disponibilidad. Al hacer clic en un servicio disponible, se agrega al carrito como ítem tipo `SERVICIO`. Al confirmar la venta:

- Se crea `VentaItem` con `tipo=SERVICIO` y `catalogo_servicio_id`.
- Se descuenta automáticamente el stock de todas las refacciones requeridas (`es_opcional=False`) en la sede correspondiente.
- El stock se descuenta con `select_for_update` para evitar condiciones de carrera.

---

## Notas para el desarrollador

### Migraciones

El módulo agrega modelos nuevos (`CategoriaServicio`, `CatalogoServicio`, `CatalogoServicioRefaccion`, `PrecioServicioSede`) y modifica `VentaItem` en `sales` (nuevos campos `tipo` y `catalogo_servicio`). Correr ambas migraciones antes de iniciar el servidor.

### Permiso `EsAdministrador`

La clase `EsAdministrador` en `permissions.py` verifica `request.user.role == 'ADMINISTRATOR'`. El campo del modelo `CustomUser` es `role` (confirmado en `users/models.py`). No usar `rol`.

### Campo `is_active` vs `activo`

- El modelo `Sede` (branches) usa `is_active`.
- Los modelos propios del módulo (`CategoriaServicio`, `CatalogoServicio`, `PrecioServicioSede`) usan `activo`.
- El modelo `Producto` (inventory) usa `is_active`.
- Tener cuidado de no mezclar estos nombres en filtros ORM.

### Circular imports en `sales/serializers.py`

La importación `from catalogo_servicios.models import CatalogoServicio` a nivel de módulo en `sales/serializers.py` es intencional y segura porque `VentaItem` ya tiene un FK a `catalogo_servicios.CatalogoServicio`. La importación de `CatalogoServicioRefaccion` se hace de forma lazy dentro de los métodos `validate()` y `create()` para mayor seguridad.

### Partial PATCH de refacciones

Al hacer PATCH de un servicio, si el campo `refacciones` no se incluye en el body, las refacciones existentes **no se modifican**. Solo si se incluye `"refacciones": [...]` (incluso vacío) se reemplazan las existentes. Esto está implementado correctamente en `CatalogoServicioCreateSerializer.update()`.

### Disponibilidad en el POS

La vista `DisponibilidadTodosServiciosView` retorna `CatalogoServicioListSerializer` data + campo `disponible` agregado manualmente. El tipo `DisponibilidadServicioItem` en el frontend extiende `CatalogoServicioList` con `disponible: boolean`, lo cual es consistente.

### Precio override por sede en el POS

El POS actual muestra `precio_base` del servicio. Si se requiere respetar el precio override por sede, se debe modificar `ServiciosTab` en `POSView.tsx` para que al llamar `getDisponibilidadTodos(sedeId)` también consulte los precios override, o bien modificar el backend para que `DisponibilidadTodosServiciosView` incluya el precio efectivo según sede en la respuesta.

### Admin de Django

El `CatalogoServicioRefaccionAdmin` tiene `autocomplete_fields = ['producto']` definido en el inline. Para que el autocompletado funcione, el `ProductoAdmin` en `inventory/admin.py` debe tener `search_fields` configurado (verificar que ya lo tiene).
