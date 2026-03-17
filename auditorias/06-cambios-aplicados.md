# Cambios Aplicados — Registro Tecnico

**Fecha:** 2026-03-17
**Total de archivos modificados:** 12
**Total de archivos creados:** 2

---

## Archivos CREADOS

### `frontend-cliente/src/utils/tokenStore.ts` (NUEVO)

**Razon:** El frontend cliente no tenia un modulo centralizado para manejo de tokens.
**Contenido:** Patron identico al tokenStore del frontend admin:
- `getAccessToken / setAccessToken / clearAccessToken` — memoria (no Storage)
- `getRefresh / setRefresh` — sessionStorage (por tab)
- `getProfile / setProfile` — sessionStorage (restauracion F5)
- `clear()` — limpia todo

**Beneficio para el sistema:** Tokens inaccesibles desde XSS. Comportamiento consistente entre frontends.

---

## Archivos MODIFICADOS

### `backend/sales/views.py`

**Cambio 1 — VULN-001 (VentaListCreateView)**
- Agregado bloque de filtro por sede para no-administradores
- Parametro `?sede_id=` restringido a ADMINISTRATOR
- VentaDetailView: agregada validacion de sede antes de retornar

**Cambio 2 — PERF-001 (AdminResumenView)**
- Eliminado loop de 8 queries por sede
- Implementado `values('sede').annotate()` con `Case/When` y `Coalesce`
- Imports agregados: `Q`, `DecimalField`, `Coalesce`, `from decimal import Decimal`
- Resultado: 81 queries -> 4 queries constantes

**Cambio 3 — PERF-003 (VentaCancelarView)**
- Eliminado loop N de `UPDATE` por item
- Implementado `qty_map` + `SELECT FOR UPDATE` con `__in` + `bulk_update`
- Resultado: 20 queries -> 2 queries por cancelacion

---

### `backend/users/views.py`

**Cambio — VULN-006 (_send_welcome_email)**
- Parametro `plain_password` ignorado (no transmitido)
- Creacion de `PasswordResetToken` con 1 hora de vigencia
- Email incluye enlace `/reset-password?token=<uuid>` en lugar de contraseña
- `FRONTEND_URL` leido de settings con fallback

---

### `backend/inventory/serializers.py`

**Cambio — PERF-002 (ProductoSerializer.get_total_stock)**
- Verificacion de atributo `total_stock` anotado antes de ejecutar query
- Fallback a `aggregate(Sum)` solo cuando se serializa un producto individual
- Resultado: 0 queries extra en listados (el total viene del annotate de la view)

---

### `backend/inventory/views.py`

**Cambio — PERF-002 (ProductoListCreateView)**
- Agregado `qs.annotate(total_stock=Coalesce(Sum('stock_items__quantity'), 0, ...))`
- Imports agregados: `Sum`, `IntegerField`, `Coalesce`

---

### `frontend/src/api/axios.config.ts`

**Cambio — ISSUE-005 (Race condition token refresh)**
- Variables de modulo: `isRefreshing: boolean`, `failedQueue: Array<{resolve, reject}>`
- Funcion `processQueue(error, token)` para drenar la cola
- Interceptor 401 refactorizado: primer request hace el refresh, los demas esperan en cola
- Garantia: solo 1 llamada a `/auth/refresh/` sin importar cuantos 401 simultaneos

---

### `frontend-cliente/src/context/AuthContext.tsx`

**Cambio — ISSUE-001 (localStorage -> tokenStore)**
- 8 referencias a `localStorage` reemplazadas por llamadas a `tokenStore`
- `loginWithTokens`: usa `tokenStore.setAccessToken`, `setRefresh`, `setProfile`
- `logout`: usa `tokenStore.clear()`
- F5 restore: lee de `tokenStore.getRefresh()` y `getProfile()`

---

### `frontend-cliente/src/api/axios.config.ts`

**Cambio — ISSUE-001 (interceptor actualizado)**
- Request interceptor: `localStorage.getItem('mqf_access')` -> `tokenStore.getAccessToken()`
- 401 interceptor: 3 `localStorage.removeItem()` -> `tokenStore.clear()`

---

### `frontend-cliente/src/pages/LoginPage.tsx`

**Cambio — ISSUE-001 (orden de guardado de tokens)**
- Tokens guardados via `tokenStore.setAccessToken()` para que el interceptor pueda hacer `getPerfil()`
- Flujo: POST login -> setAccessToken en memoria -> getPerfil() -> loginWithTokens() completo

---

### `frontend/src/components/cashier/POSView.tsx`

**Cambio 1 — ISSUE-002 (useEffect dependencias)**
- Removido `// eslint-disable-line`
- Array de dependencias: `[año]` -> `[año, selModelo, modelosFiltrados]`

**Cambio 2 — ISSUE-003 (castings as any)**
- `listProducts({...} as any)` -> `listProducts({...})` con `ProductoListParams`
- `listCategories({ is_active: true } as any)` -> sin cast
- `listMotoModels({...} as any)` -> sin cast
- `const params: Record<string, any>` -> `const params: ProductoListParams`
- `.filter(Boolean)` -> `.filter((i): i is CartItem => i !== null)`

---

### `frontend/src/components/cashier/PaymentModal.tsx`

**Cambio — UX-014 + UX-015 (validaciones inline)**
- Estado `montoTouched: boolean` para activar errores post-interaccion
- Derivados: `montoInsuficiente`, `descuentoPct`, `descuentoAlto`
- Input efectivo: borde rojo + mensaje error cuando `montoTouched && montoInsuficiente`
- Vuelto: mostrado en verde cuando `montoRecibido > total`
- Descuento: warning ambar cuando descuento > 50% del subtotal
- Boton confirmar: `disabled={loading || montoInsuficiente}`

---

## Modelos verificados (sin cambios necesarios)

Los siguientes modelos ya tenian los indices correctos con nombres explicitos:
- `sales/models.py`: Venta (4 indices), AperturaCaja (2 indices)
- `inventory/models.py`: Stock (2 indices)
- `users/models.py`: LoginAuditLog (2 indices)

Las vistas de inventario ya tenian filtros `is_active=True` y scope de sede correctos.
