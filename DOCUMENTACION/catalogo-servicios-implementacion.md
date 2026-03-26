# Módulo: Catálogo de Servicios — Análisis e Implementación por Fases

## Resumen ejecutivo

Se creará un nuevo módulo llamado **`catalogo_servicios`** que permite al superadministrador definir un catálogo global de servicios de taller (cambio de aceite, ajuste de frenos, etc.), especificando exactamente qué refacciones del inventario consume cada servicio y en qué cantidad. Cuando el cajero vende un servicio desde la caja, el sistema descuenta automáticamente las refacciones correspondientes del inventario de la sede activa.

---

## Análisis de la implementación

### Problema que resuelve

Actualmente el sistema tiene dos flujos separados:
- **Caja (`sales`)**: vende productos físicos del inventario, descontando stock.
- **Taller (`taller`)**: registra órdenes de servicio manualmente, el mecánico agrega piezas y labor.

No existe un **catálogo predefinido de servicios** que pueda venderse desde caja y que automáticamente descuente las refacciones requeridas del inventario de la sede.

### Decisión de arquitectura

Se crea una nueva app Django **`catalogo_servicios`** (separada de `taller` y `sales`) para mantener responsabilidades claras:
- `catalogo_servicios` → define **qué es** un servicio y **qué consume**
- `sales` → registra **que se vendió** y ejecuta el **descuento de stock**
- `taller` → puede referenciar el catálogo cuando se abre una orden de taller formal

---

## Qué más se puede agregar al módulo (propuestas)

Además de la funcionalidad base, se proponen las siguientes mejoras que elevan el valor del módulo:

### 1. Categorías de Servicios (`CategoriaServicio`)
Agrupar servicios por tipo: Motor, Frenos, Sistema Eléctrico, Suspensión, Transmisión, Carrocería. Permite filtrar y organizar el catálogo conforme crece.

### 2. Duración estimada
Campo `duracion_estimada_minutos` en cada servicio. Útil para que el jefe de mecánicos pueda planificar carga de trabajo y para mostrar tiempos estimados al cliente.

### 3. Refacciones opcionales vs. requeridas
Campo `es_opcional` en `CatalogoServicioRefaccion`. Algunas refacciones solo se cambian si están en mal estado (ej: empaque de aceite). Las opcionales no bloquean la venta pero alertan al cajero.

### 4. Indicador de disponibilidad por sede
Endpoint que, dado un servicio y una sede, responde si hay stock suficiente de **todas** las refacciones requeridas. El cajero ve en tiempo real si puede ofrecer el servicio antes de cobrarlo.

### 5. Precio base + override por sede
El servicio tiene un `precio_base` global. Cada sede puede definir un `PrecioServicioSede` que sobreescribe el precio base. Útil para sedes con distintos costos operativos.

### 6. Activar / desactivar servicios
`activo` (BooleanField) con soft-delete. Un servicio desactivado no aparece en caja ni en taller pero conserva historial de ventas.

### 7. Paquetes de servicios (`PaqueteServicio`)
Agrupar varios servicios en un paquete con precio especial (ej: "Mantenimiento 3,000 km" = cambio de aceite + revisión de frenos + ajuste de cadena). Fase futura.

### 8. Integración con `ServicioMoto` (taller)
Cuando el jefe de mecánicos abre una orden de taller, puede seleccionar un servicio del catálogo y auto-poblar los `ServicioItem`. Evita captura manual repetitiva.

### 9. Historial y estadísticas
En el panel de admin, ver cuántas veces se ha vendido cada servicio, en qué sedes, y qué refacciones se han consumido. Apoya decisiones de compra de inventario.

### 10. Validación de stock al abrir caja
Al iniciar turno, el sistema puede mostrar un resumen de qué servicios **no** pueden ofrecerse hoy por falta de stock, para que el encargado haga pedidos a tiempo.

---

## Modelos nuevos (resumen)

```
CategoriaServicio
  - nombre (solo letras)
  - descripcion
  - activo

CatalogoServicio
  - nombre (único, solo letras/espacios)
  - descripcion
  - precio_base (solo números positivos)
  - duracion_estimada_minutos
  - categoria FK → CategoriaServicio
  - activo
  - created_by FK → User
  - timestamps

CatalogoServicioRefaccion  (tabla pivote)
  - servicio FK → CatalogoServicio
  - producto FK → inventory.Producto
  - cantidad (entero positivo)
  - es_opcional

PrecioServicioSede  (override de precio por sede)
  - servicio FK → CatalogoServicio
  - sede FK → branches.Sede
  - precio_override
  - activo
```

**Cambio en `sales`:**
- `VentaItem.tipo` agrega valor `'SERVICIO'`
- `VentaItem.catalogo_servicio` FK nullable → `CatalogoServicio`
- Al guardar, si `tipo == SERVICIO`, el serializer descuenta stock de cada refacción requerida

---

---

# FASE 1 — Backend: Nueva app, modelos y migraciones

**Agente responsable:** Backend Developer 1
**Archivos a crear/modificar:**

```
backend/
  catalogo_servicios/
    __init__.py
    apps.py
    models.py
    admin.py
    migrations/
      __init__.py
  config/settings.py      ← agregar 'catalogo_servicios' a INSTALLED_APPS
```

### Instrucciones detalladas

#### 1. Crear la app

```bash
cd backend
python manage.py startapp catalogo_servicios
```

#### 2. `catalogo_servicios/models.py`

Crear los siguientes modelos con exactamente estas reglas de validación:

**`CategoriaServicio`**
- `nombre`: `CharField(max_length=100, unique=True)` con `RegexValidator(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-]+$', 'Solo se permiten letras y espacios.')`. No se permiten números.
- `descripcion`: `TextField(blank=True)`
- `activo`: `BooleanField(default=True)`
- `__str__`: retorna `nombre`

**`CatalogoServicio`**
- `nombre`: `CharField(max_length=200, unique=True)` con el mismo `RegexValidator` de letras.
- `descripcion`: `TextField(blank=True)`
- `precio_base`: `DecimalField(max_digits=10, decimal_places=2)` con `MinValueValidator(0.01)`.
- `duracion_estimada_minutos`: `PositiveIntegerField(default=30)`
- `categoria`: `ForeignKey(CategoriaServicio, on_delete=PROTECT, related_name='servicios')`
- `activo`: `BooleanField(default=True)`
- `created_by`: `ForeignKey(settings.AUTH_USER_MODEL, on_delete=SET_NULL, null=True, related_name='servicios_creados')`
- `created_at`, `updated_at`: `auto_now_add` / `auto_now`
- `Meta`: `ordering = ['categoria', 'nombre']`

**`CatalogoServicioRefaccion`**
- `servicio`: `ForeignKey(CatalogoServicio, on_delete=CASCADE, related_name='refacciones')`
- `producto`: `ForeignKey('inventory.Producto', on_delete=PROTECT, related_name='en_servicios')`
- `cantidad`: `PositiveIntegerField(default=1)` con `MinValueValidator(1)`.
- `es_opcional`: `BooleanField(default=False)`
- `Meta`: `unique_together = ('servicio', 'producto')`. `ordering = ['es_opcional', 'producto__nombre']`

**`PrecioServicioSede`**
- `servicio`: `ForeignKey(CatalogoServicio, on_delete=CASCADE, related_name='precios_sede')`
- `sede`: `ForeignKey('branches.Sede', on_delete=CASCADE, related_name='precios_servicio')`
- `precio_override`: `DecimalField(max_digits=10, decimal_places=2)` con `MinValueValidator(0.01)`.
- `activo`: `BooleanField(default=True)`
- `Meta`: `unique_together = ('servicio', 'sede')`

#### 3. `config/settings.py`

Agregar `'catalogo_servicios'` a `INSTALLED_APPS`, después de `'taller'`.

#### 4. Generar y aplicar migración

```bash
python manage.py makemigrations catalogo_servicios
python manage.py migrate
```

#### 5. `catalogo_servicios/admin.py`

Registrar todos los modelos con `@admin.register` para poder crear datos de prueba desde `/admin/`.

#### Criterios de aceptación Fase 1
- [ ] `python manage.py migrate` corre sin errores
- [ ] Todos los modelos aparecen en `/admin/`
- [ ] El validador de `nombre` rechaza strings con números
- [ ] `precio_base < 0.01` lanza `ValidationError`
- [ ] `cantidad = 0` en `CatalogoServicioRefaccion` lanza `ValidationError`

---

# FASE 2 — Backend: Serializers y validaciones

**Agente responsable:** Backend Developer 2
**Prerequisito:** Fase 1 completa
**Archivos a crear:**

```
backend/catalogo_servicios/
  serializers.py
```

### Instrucciones detalladas

Seguir el patrón de serializers existente en `inventory/serializers.py` y `taller/serializers.py`.

#### `CategoriaServicioSerializer`
- Serializer de lectura y escritura.
- Validación de `nombre`: strip de espacios, capitalizar primera letra.
- Campo calculado `total_servicios` (count de servicios activos en esa categoría).

#### `CatalogoServicioRefaccionSerializer`
- Para lectura: incluir campos anidados del producto (`id`, `nombre`, `codigo`, unidad, precio_unitario).
- Para escritura (`CatalogoServicioRefaccionInputSerializer`): solo `producto` (id), `cantidad`, `es_opcional`.
- Validar que `producto.activo == True` al crear.

#### `CatalogoServicioListSerializer`
- Campos: `id`, `nombre`, `descripcion`, `precio_base`, `duracion_estimada_minutos`, `categoria` (nombre), `activo`, `total_refacciones` (count).
- Usado en el listado del admin (no incluye refacciones para optimizar).

#### `CatalogoServicioDetailSerializer`
- Todos los campos de `CatalogoServicioListSerializer` más la lista completa de `refacciones` (usando `CatalogoServicioRefaccionSerializer`).
- Campo calculado `created_by_name` (nombre completo del creador).

#### `CatalogoServicioCreateSerializer`
- Campos de escritura: `nombre`, `descripcion`, `precio_base`, `duracion_estimada_minutos`, `categoria`, `refacciones` (lista).
- `nombre`: validar con regex `^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\/]+$`. Error: `"El nombre solo puede contener letras y espacios."`. Hacer strip y title case.
- `precio_base`: validar `> 0`. Error: `"El precio debe ser mayor a cero."`.
- `refacciones`: lista de `CatalogoServicioRefaccionInputSerializer`. Validar que no haya productos duplicados en la lista.
- `create()`: usar `transaction.atomic()`. Crear el servicio, luego hacer `bulk_create` de las refacciones.
- `update()`: atomic. Actualizar campos del servicio, eliminar refacciones actuales y recrear con los nuevos datos.

#### `PrecioServicioSedeSerializer`
- Campos: `sede` (id + nombre), `precio_override`, `activo`.
- Validar `precio_override > 0`.

#### `DisponibilidadServicioSerializer`
- Solo para respuesta (read-only).
- Campos: `servicio_id`, `servicio_nombre`, `disponible` (bool), `refacciones` (lista con `producto_nombre`, `requerido`, `en_stock`, `suficiente`).

#### Patrón de validación de nombres (reutilizar en toda la app)

```python
# catalogo_servicios/validators.py
import re
from django.core.exceptions import ValidationError

def validar_solo_letras(value):
    pattern = r'^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-\/]+$'
    if not re.match(pattern, value.strip()):
        raise ValidationError('Este campo solo puede contener letras y espacios.')
```

#### Criterios de aceptación Fase 2
- [ ] `CatalogoServicioCreateSerializer` rechaza nombres con números
- [ ] `precio_base = -5` lanza error de validación
- [ ] Lista de refacciones con producto duplicado lanza error
- [ ] `create()` es atómico: si falla una refacción, no se guarda el servicio
- [ ] El serializer de disponibilidad retorna `disponible: false` si alguna refacción requerida tiene stock insuficiente

---

# FASE 3 — Backend: Views, URLs y permisos

**Agente responsable:** Backend Developer 3
**Prerequisito:** Fases 1 y 2 completas
**Archivos a crear/modificar:**

```
backend/catalogo_servicios/
  views.py
  urls.py
  permissions.py
backend/config/urls.py     ← registrar nueva app
```

### Instrucciones detalladas

Seguir el patrón de `inventory/views.py` y `taller/views.py`.

#### Permiso personalizado `EsAdministrador`

```python
# catalogo_servicios/permissions.py
class EsAdministrador(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.rol == 'ADMINISTRATOR'
```

#### Views a implementar

**`CategoriaServicioListCreateView`** — `GET /api/catalogo-servicios/categorias/`
- `GET`: retorna todas las categorías activas. Acceso: cualquier usuario autenticado (cajero necesita ver categorías para filtrar).
- `POST`: crea nueva categoría. Acceso: solo `ADMINISTRATOR`.

**`CategoriaServicioDetailView`** — `GET/PUT/PATCH/DELETE /api/catalogo-servicios/categorias/<pk>/`
- `GET`: detalle con sus servicios.
- `PUT/PATCH/DELETE`: solo `ADMINISTRATOR`. DELETE hace soft-delete (`activo=False`).

**`CatalogoServicioListCreateView`** — `GET/POST /api/catalogo-servicios/`
- `GET`: lista paginada. Parámetros de filtro: `?categoria=<id>`, `?activo=true/false`, `?search=<nombre>`. Retorna `CatalogoServicioListSerializer`. Acceso: autenticado.
- `POST`: crea servicio con sus refacciones. Acceso: solo `ADMINISTRATOR`. El campo `created_by` se asigna automáticamente desde `request.user`.

**`CatalogoServicioDetailView`** — `GET/PUT/PATCH/DELETE /api/catalogo-servicios/<pk>/`
- `GET`: detalle completo con refacciones. Acceso: autenticado.
- `PUT/PATCH`: actualiza. Acceso: `ADMINISTRATOR`.
- `DELETE`: soft-delete (`activo=False`). Acceso: `ADMINISTRATOR`.

**`ToggleActivoServicioView`** — `POST /api/catalogo-servicios/<pk>/toggle-activo/`
- Alterna `activo` del servicio. Acceso: `ADMINISTRATOR`.
- Retorna `{'activo': <nuevo_valor>, 'mensaje': '...'}`

**`DisponibilidadServicioView`** — `GET /api/catalogo-servicios/<pk>/disponibilidad/`
- Recibe `?sede_id=<id>` como query param (obligatorio).
- Para cada refacción del servicio, consulta `Stock.objects.get(producto=ref.producto, sede=sede)`.
- Retorna `DisponibilidadServicioSerializer`: si todas las refacciones **requeridas** tienen `stock.cantidad >= ref.cantidad` → `disponible: True`.
- Las opcionales se incluyen en la respuesta pero no afectan `disponible`.
- Acceso: `CASHIER`, `ENCARGADO`, `ADMINISTRATOR`.

**`DisponibilidadTodosServiciosView`** — `GET /api/catalogo-servicios/disponibilidad-sede/`
- Recibe `?sede_id=<id>`.
- Retorna lista de todos los servicios activos con su `disponible` calculado para esa sede.
- Acceso: `CASHIER`, `ENCARGADO`, `ADMINISTRATOR`.

**`PrecioServicioSedeView`** — `GET/POST /api/catalogo-servicios/<pk>/precios-sede/`
- Gestiona overrides de precio por sede para un servicio. Acceso: `ADMINISTRATOR`.

#### Registrar en `config/urls.py`

```python
path('api/catalogo-servicios/', include('catalogo_servicios.urls')),
```

#### URL patterns en `catalogo_servicios/urls.py`

```
GET/POST   /api/catalogo-servicios/                             → lista y creación
GET/PUT/PATCH/DELETE /api/catalogo-servicios/<pk>/             → detalle
POST       /api/catalogo-servicios/<pk>/toggle-activo/         → activar/desactivar
GET        /api/catalogo-servicios/<pk>/disponibilidad/        → stock check por sede
GET        /api/catalogo-servicios/disponibilidad-sede/        → todos los servicios por sede
GET/POST   /api/catalogo-servicios/<pk>/precios-sede/          → precios por sede
GET/POST   /api/catalogo-servicios/categorias/                 → categorías
GET/PUT/DELETE /api/catalogo-servicios/categorias/<pk>/        → detalle categoría
```

#### Criterios de aceptación Fase 3
- [ ] Un usuario con rol `CASHIER` puede hacer `GET` pero no `POST`/`PUT`/`DELETE`
- [ ] `GET /disponibilidad/?sede_id=1` retorna `disponible: false` cuando falta stock
- [ ] Crear servicio sin `refacciones` es válido (servicio de mano de obra pura)
- [ ] `DELETE` no elimina el registro, solo pone `activo=False`

---

# FASE 4 — Backend: Integración con ventas (stock decrement)

**Agente responsable:** Backend Developer 4
**Prerequisito:** Fases 1-3 completas
**Archivos a modificar:**

```
backend/sales/models.py
backend/sales/serializers.py
backend/sales/views.py
backend/sales/migrations/   ← nueva migración
```

### Instrucciones detalladas

#### 4.1 Modificar `VentaItem` en `sales/models.py`

Agregar nuevo valor al campo `tipo`:

```python
TIPO_CHOICES = [
    ('PRODUCTO', 'Producto'),
    ('SERVICIO', 'Servicio de catálogo'),   # ← NUEVO
]
```

Agregar campo FK nullable:

```python
catalogo_servicio = models.ForeignKey(
    'catalogo_servicios.CatalogoServicio',
    on_delete=models.PROTECT,
    null=True,
    blank=True,
    related_name='ventas_items'
)
```

#### 4.2 Modificar `VentaCreateSerializer` en `sales/serializers.py`

Localizar el método `create()` que actualmente hace `Stock.objects.select_for_update()` y decrementa stock para items de tipo `PRODUCTO`.

**Agregar lógica para tipo `SERVICIO`** dentro del mismo bloque `transaction.atomic()`:

```python
elif item_data['tipo'] == 'SERVICIO':
    servicio = item_data['catalogo_servicio']  # instancia de CatalogoServicio

    # Obtener todas las refacciones requeridas del servicio
    refacciones = servicio.refacciones.filter(es_opcional=False).select_related('producto')

    for ref in refacciones:
        stock = Stock.objects.select_for_update().get(
            producto=ref.producto,
            sede=venta.sede
        )
        if stock.cantidad < ref.cantidad:
            raise serializers.ValidationError(
                f"Stock insuficiente de '{ref.producto.nombre}' "
                f"para el servicio '{servicio.nombre}'. "
                f"Disponible: {stock.cantidad}, requerido: {ref.cantidad}."
            )
        stock.cantidad -= ref.cantidad
        stock.save()
```

**Reglas adicionales:**
- Si `tipo == 'SERVICIO'`, el campo `producto` es nullable (el item del carrito es el servicio, no un producto individual).
- El precio del `VentaItem` se toma de: `PrecioServicioSede` de la sede activa si existe, de lo contrario `CatalogoServicio.precio_base`.
- Validar que el `catalogo_servicio.activo == True` antes de crear el item.

#### 4.3 Validación de cancelación

En `VentaCancelarView` / lógica de cancelación: cuando se cancela una venta, si un `VentaItem.tipo == 'SERVICIO'`, restaurar el stock de **todas** las refacciones requeridas del servicio (operación inversa).

#### 4.4 Migración

```bash
python manage.py makemigrations sales --name="add_servicio_to_ventaitem"
python manage.py migrate
```

#### Criterios de aceptación Fase 4
- [ ] POST a `/api/sales/ventas/` con item tipo `SERVICIO` descuenta correctamente el stock de cada refacción
- [ ] Si alguna refacción no tiene stock, la venta completa falla (atomic) y el stock no se modifica
- [ ] Al cancelar una venta con servicios, el stock se restaura correctamente
- [ ] El precio del servicio respeta el override de sede si existe
- [ ] Un `VentaItem` de tipo `SERVICIO` puede tener `producto=null`

---

# FASE 5 — Frontend: Tipos TypeScript y servicio API

**Agente responsable:** Frontend Developer 1
**Prerequisito:** Fases 1-4 completas (o al menos la API documentada)
**Archivos a crear/modificar:**

```
frontend/src/types/
  catalogo-servicios.types.ts    ← NUEVO

frontend/src/api/
  catalogo-servicios.service.ts  ← NUEVO

frontend/src/types/sales.types.ts  ← modificar CartItem
```

### Instrucciones detalladas

#### `frontend/src/types/catalogo-servicios.types.ts`

Seguir exactamente el patrón de `taller.types.ts` e `inventory.types.ts`.

```typescript
export interface CategoriaServicio {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  total_servicios: number;
}

export interface RefaccionServicio {
  id: number;
  producto: {
    id: number;
    nombre: string;
    codigo: string;
    precio_unitario: string;
  };
  cantidad: number;
  es_opcional: boolean;
}

export interface CatalogoServicioList {
  id: number;
  nombre: string;
  descripcion: string;
  precio_base: string;
  duracion_estimada_minutos: number;
  categoria: string;        // nombre de la categoría
  categoria_id: number;
  activo: boolean;
  total_refacciones: number;
}

export interface CatalogoServicioDetail extends CatalogoServicioList {
  refacciones: RefaccionServicio[];
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface RefaccionInput {
  producto: number;      // id del producto
  cantidad: number;
  es_opcional: boolean;
}

export interface CatalogoServicioPayload {
  nombre: string;
  descripcion: string;
  precio_base: number;
  duracion_estimada_minutos: number;
  categoria: number;     // id de la categoría
  refacciones: RefaccionInput[];
}

export interface DisponibilidadRefaccion {
  producto_nombre: string;
  requerido: number;
  en_stock: number;
  suficiente: boolean;
  es_opcional: boolean;
}

export interface DisponibilidadServicio {
  servicio_id: number;
  servicio_nombre: string;
  disponible: boolean;
  refacciones: DisponibilidadRefaccion[];
}

export interface PrecioServicioSede {
  sede: number;
  sede_nombre: string;
  precio_override: string;
  activo: boolean;
}
```

#### Modificar `frontend/src/types/sales.types.ts`

Agregar a `CartItem`:
```typescript
tipo?: 'PRODUCTO' | 'SERVICIO';
catalogo_servicio_id?: number;
```

#### `frontend/src/api/catalogo-servicios.service.ts`

Seguir el patrón de `inventory.service.ts`. Usar el `axiosClient` configurado en `axios.config.ts`.

```typescript
// Funciones a implementar:

getCategorias(): Promise<CategoriaServicio[]>
createCategoria(data): Promise<CategoriaServicio>
updateCategoria(id, data): Promise<CategoriaServicio>

getServicios(params?: { categoria?: number; activo?: boolean; search?: string }): Promise<PaginatedResponse<CatalogoServicioList>>
getServicioDetail(id: number): Promise<CatalogoServicioDetail>
createServicio(data: CatalogoServicioPayload): Promise<CatalogoServicioDetail>
updateServicio(id: number, data: Partial<CatalogoServicioPayload>): Promise<CatalogoServicioDetail>
toggleActivoServicio(id: number): Promise<{ activo: boolean; mensaje: string }>

getDisponibilidad(servicioId: number, sedeId: number): Promise<DisponibilidadServicio>
getDisponibilidadTodos(sedeId: number): Promise<CatalogoServicioList & { disponible: boolean }[]>

getPreciosSede(servicioId: number): Promise<PrecioServicioSede[]>
setPrecioSede(servicioId: number, data: { sede: number; precio_override: number }): Promise<PrecioServicioSede>
```

#### Criterios de aceptación Fase 5
- [ ] Todos los tipos TypeScript compilan sin errores (`npm run build`)
- [ ] El servicio API maneja errores con el mismo patrón que los otros servicios (catch + re-throw)
- [ ] Los tipos coinciden exactamente con las respuestas del backend de Fase 3

---

# FASE 6 — Frontend: Panel de administrador — Componentes

**Agente responsable:** Frontend Developer 2
**Prerequisito:** Fase 5 completa
**Archivos a crear/modificar:**

```
frontend/src/components/admin/servicios/
  CatalogoServiciosList.tsx        ← tabla principal con filtros
  ServicioFormModal.tsx            ← modal creación/edición
  RefaccionesFormSection.tsx       ← sección de refacciones dentro del modal
  CategoriaServicioModal.tsx       ← modal para gestionar categorías
  ServicioDetailModal.tsx          ← modal de detalle con disponibilidad por sede

frontend/src/pages/DashboardPage.tsx   ← agregar sección al sidebar y routing
```

### Instrucciones detalladas

Seguir fielmente el patrón visual y de código de los componentes existentes en `frontend/src/components/admin/inventory/`. Reutilizar los mismos estilos Tailwind, los mismos patrones de modal y los mismos iconos de `lucide-react`.

#### `CatalogoServiciosList.tsx`

- Tabla con columnas: **Nombre**, **Categoría**, **Precio base**, **Duración**, **Refacciones**, **Estado** (badge activo/inactivo), **Acciones**.
- Barra de búsqueda por nombre (debounce 300ms).
- Filtro por categoría (select).
- Filtro por estado (Todos / Activos / Inactivos).
- Botón **"Nuevo Servicio"** → abre `ServicioFormModal` en modo creación.
- En cada fila: botón **ver**, **editar**, **toggle activo** (con confirmación).
- Estado vacío con mensaje amigable.

#### `ServicioFormModal.tsx`

Modal de dos secciones:

**Sección 1 — Información del servicio:**
- `nombre`: `<input type="text">` con validación en tiempo real: regex `/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-\/]+$/`. Mostrar mensaje de error rojo debajo si contiene números u caracteres especiales.
- `categoria`: `<select>` con opción de crear nueva categoría (abre `CategoriaServicioModal`).
- `descripcion`: `<textarea>`.
- `precio_base`: `<input type="number" min="0.01" step="0.01">`. Solo acepta números positivos. Mostrar error si es 0 o negativo.
- `duracion_estimada_minutos`: `<input type="number" min="1">`. Label: "Duración estimada (minutos)".

**Sección 2 — Refacciones (`RefaccionesFormSection.tsx`):**
- Lista dinámica de refacciones con botón **"+ Agregar refacción"**.
- Cada fila tiene: buscador de producto (search-as-you-type con `GET /api/inventory/productos/?search=X`), campo `cantidad` (input numérico), checkbox `es_opcional`, botón eliminar.
- Validación: producto no puede repetirse en la lista.
- Si la lista está vacía, mostrar nota informativa: "Este servicio no requiere refacciones (solo mano de obra)."

**Validación del formulario:**
- Usar la misma estrategia que `UserFormModal.tsx` y `ProductFormModal.tsx`: validar antes del submit, mostrar errores por campo.
- El botón "Guardar" se deshabilita si hay errores de validación.
- En modo edición, el modal pre-popula todos los campos.

#### `ServicioDetailModal.tsx`

- Muestra toda la info del servicio.
- Sección "Disponibilidad por sede": selector de sede → llama `getDisponibilidad()` → muestra tabla con refacciones, stock actual, stock requerido, semáforo (verde/rojo).

#### `CategoriaServicioModal.tsx`

- Modal simple con campo `nombre` (validación de solo letras) y `descripcion`.
- Lista las categorías existentes con botón de editar.

#### Agregar al `DashboardPage.tsx`

En el sidebar, agregar nueva sección **"Servicios"** con los mismos iconos de `lucide-react` que el resto. Estructura:

```
Servicios
  ├── Catálogo de Servicios    (icono: Wrench)
  └── Categorías de Servicios  (icono: Tag)
```

Agregar los casos en el `switch` que renderiza el contenido principal:
```typescript
case 'catalogo-servicios': return <CatalogoServiciosList />;
case 'categorias-servicios': return <CategoriaServicioModal />;
```

#### Criterios de aceptación Fase 6
- [ ] El campo `nombre` muestra error en tiempo real si se escribe un número
- [ ] El campo `precio_base` no permite valores negativos ni cero
- [ ] La búsqueda de productos en el formulario de refacciones funciona en tiempo real
- [ ] El modal de detalle muestra correctamente la disponibilidad por sede
- [ ] El sidebar tiene la nueva sección "Servicios" con los iconos correctos
- [ ] El diseño es consistente con el resto del panel admin (mismos colores, tamaños, tipografía)
- [ ] En móvil, el modal es responsive (igual que `ProductFormModal.tsx`)

---

# FASE 7 — Frontend: Integración en Caja (CashierPanel)

**Agente responsable:** Frontend Developer 3
**Prerequisito:** Fases 5 y 6 completas
**Archivos a modificar:**

```
frontend/src/components/cashier/POSView.tsx
frontend/src/components/cashier/PaymentModal.tsx
frontend/src/types/sales.types.ts
frontend/src/api/sales.service.ts
```

### Instrucciones detalladas

#### Modificar `POSView.tsx`

El componente actualmente tiene búsqueda de productos. Agregar:

1. **Tabs de modo** arriba del buscador: `[Productos]  [Servicios]`
   - Tab "Productos": comportamiento actual sin cambios.
   - Tab "Servicios": muestra grid de servicios disponibles.

2. **Grid de Servicios (tab activo = Servicios):**
   - Al montar el tab, llama `getDisponibilidadTodos(user.sede_id)` para obtener todos los servicios activos con su disponibilidad en la sede del cajero.
   - Cards por categoría: encabezado de categoría, luego las cards de servicios.
   - Cada card muestra: nombre del servicio, precio, duración, badge **"Disponible"** (verde) o **"Sin stock"** (rojo/gris).
   - Un servicio sin stock aún puede agregarse al carrito (el error se valida al confirmar la venta), pero mostrar advertencia visual.
   - Al hacer clic en una card → agrega al carrito con `tipo: 'SERVICIO'` y `catalogo_servicio_id: id`.

3. **Carrito (sin cambios estructurales):**
   - Los items de servicio se muestran igual que los de producto: nombre, precio, cantidad (generalmente 1, pero editable), subtotal.
   - La cantidad de un servicio controla cuántas veces se aplica el descuento de stock (x refacciones).

#### Modificar `PaymentModal.tsx`

- Mostrar sección separada en el resumen si hay servicios en el carrito: "Servicios incluidos: [nombre1], [nombre2]".
- No requiere cambios en la lógica de pago (el backend maneja todo).

#### Modificar `sales.service.ts` → `createVenta()`

Asegurarse de que el payload incluya `tipo` y `catalogo_servicio` cuando corresponda:

```typescript
items: cart.map(item => ({
  producto: item.tipo === 'PRODUCTO' ? item.producto_id : null,
  catalogo_servicio: item.tipo === 'SERVICIO' ? item.catalogo_servicio_id : null,
  tipo: item.tipo ?? 'PRODUCTO',
  cantidad: item.cantidad,
  precio_unitario: item.precio_unitario,
}))
```

#### Criterios de aceptación Fase 7
- [ ] El tab "Servicios" carga los servicios activos de la sede del cajero
- [ ] Los servicios con stock insuficiente se muestran con badge rojo
- [ ] Un servicio puede agregarse al carrito y procesarse como venta
- [ ] Al confirmar la venta, si el backend rechaza por stock, el error se muestra en pantalla (igual que con productos)
- [ ] El recibo/ticket generado incluye la línea del servicio con su precio

---

## Resumen de archivos totales por fase

| Fase | Archivos nuevos | Archivos modificados |
|------|----------------|---------------------|
| 1 | 6 (app completa + migración) | 1 (settings.py) |
| 2 | 2 (serializers.py, validators.py) | 0 |
| 3 | 2 (views.py, urls.py, permissions.py) | 1 (config/urls.py) |
| 4 | 1 (migración) | 2 (models.py, serializers.py sales) |
| 5 | 2 (types + service) | 1 (sales.types.ts) |
| 6 | 5 (componentes admin) | 1 (DashboardPage.tsx) |
| 7 | 0 | 3 (POSView, PaymentModal, sales.service) |

**Total: ~16 archivos nuevos, ~9 archivos modificados**

---

## Orden de ejecución recomendado

```
Fase 1 → Fase 2 → Fase 3 → Fase 4   (backend, secuencial)
                                ↓
                           Fase 5 → Fase 6 → Fase 7   (frontend, secuencial)
```

Las fases de backend deben completarse y probarse antes de iniciar el frontend. Cada fase tiene sus criterios de aceptación que el agente debe verificar antes de declararse completa.
