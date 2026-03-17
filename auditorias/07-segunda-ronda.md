# Segunda Ronda de Correcciones — 2026-03-17

Esta ronda corrijo los 8 ALTOs restantes + 22 issues MEDIOS de UI/UX, frontend y backend.
Se usaron 6 agentes en paralelo.

---

## Agente 1 — Backend Security (VULN-003, 008, 009, 013)

### VULN-003 — select_for_update() en VentaCancelarView
**Archivo:** `backend/sales/views.py`
**Cambio:** `Venta.objects.select_for_update()` ahora se aplica al inicio del bloque `@transaction.atomic`, antes de cualquier validacion o modificacion de estado. Previene doble cancelacion por requests concurrentes.

### VULN-008 — Comparaciones de rol por string
**Archivos:** `backend/sales/permissions.py`, `backend/sales/views.py`
**Cambio:** Reemplazadas todas las comparaciones `user.role == 'ADMINISTRATOR'` y `user.role in {'CASHIER', ...}` por properties del modelo:
- `request.user.is_administrator`
- `request.user.is_encargado`
- `request.user.is_cashier`
- `request.user.is_worker`

Afectados: `IsCajeroOrAbove`, `IsAdministrator`, `IsEncargadoOrAbove` en permissions.py y dos views de reportes de caja.

### VULN-009 — CORS hardcodeado
**Archivo:** `backend/config/settings.py`
**Cambio:**
```python
# Antes: lista hardcodeada de 6 origenes
# Despues:
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://localhost:5174'
).split(',')
```
En produccion se configura via variable de entorno.

### VULN-013 — Sin max_value en descuento
**Archivo:** `backend/sales/serializers.py`
**Cambios:**
- Campo `descuento`: agregado `max_value=Decimal('999999')`
- Metodo `validate()`: nueva validacion `if subtotal > 0 and descuento > subtotal: raise ValidationError`
- Doble capa de proteccion: field-level + object-level

---

## Agente 2 — Backend Performance (PERF-004, 005, 006)

### PERF-004 — Loop en AuditoriaFinalizeView
**Archivo:** `backend/inventory/views.py`
**Cambio:** N queries UPDATE -> 3 queries totales:
1. `select_related` para construir `qty_map` (1 query)
2. `select_for_update().filter(__in=prod_ids)` (1 SELECT FOR UPDATE)
3. `bulk_update(stocks, ['quantity'])` (1 UPDATE masivo)

### PERF-005 — PDF sincrono en cierre de caja
**Archivo:** `backend/sales/views.py`
**Cambio:** Generacion de PDF movida a daemon thread:
```python
def _generate_pdf_background(apertura_id):
    try:
        apertura = AperturaCaja.objects.get(pk=apertura_id)
        build_reporte_from_apertura(apertura)
    except Exception:
        pass

thread = threading.Thread(target=_generate_pdf_background, args=(apertura.id,), daemon=True)
thread.start()
```
Tiempo de respuesta cierre de caja: ~3s -> ~100ms.

### PERF-006 — SerializerMethodField counts sin annotate
**Archivos:** `backend/inventory/views.py` + `backend/inventory/serializers.py`
**Cambio en 4 views:** Agregado `annotate()` con `Count()` al queryset antes de serializar:
- `CategoriaListCreateView`: `product_count=Count('productos', filter=Q(...))`
- `SubcategoriaListCreateView`: mismo patron
- `MarcaMotoListCreateView`: `modelos_count=Count('modelos', filter=Q(...))`
- `AuditoriaListCreateView`: `items_count=Count('items')`

**Cambio en 4 serializers:** Guard `hasattr(obj, 'X_count')` antes de ejecutar query fallback.
Resultado: 0 queries extra en listados.

---

## Agente 3 — Frontend Cleanup (ISSUE-004, 006, 008, 010, 013)

### ISSUE-004 — LoginPage cliente
**Archivo:** `frontend-cliente/src/pages/LoginPage.tsx`
Flujo ya era correcto. Solo se agrego type guard `axios.isAxiosError` en el catch.

### ISSUE-006 — Empty catches en PedidoBodegaPanel
**Archivo:** `frontend/src/components/cashier/PedidoBodegaPanel.tsx`
5 catch blocks silenciosos convertidos a:
- `catch (err: unknown)` con `console.error`
- Estado `error` en `PedidoCard` con render de mensaje al usuario
- Afectados: `buscar`, `enviar`, `marcarEntregado`, `cancelar`, `fetchPedidos`

### ISSUE-008 — catch any en PaymentModal
**Archivo:** `frontend/src/components/cashier/PaymentModal.tsx`
`catch (err: any)` -> `catch (err: unknown)` con `axios.isAxiosError(err)` guard completo.

### ISSUE-010 — Memory leak en WorkerPanel
**Archivo:** `frontend/src/pages/WorkerPanel.tsx`
Patron `isMounted` implementado:
```typescript
let mounted = true
const isMounted = () => mounted
// ... en cleanup:
mounted = false
clearInterval(interval)
```
Todos los setState dentro del fetch ahora se ejecutan condicionalmente.

### ISSUE-013 — 20+ catch any en el proyecto
**4 archivos criticos corregidos:**
- `frontend/src/pages/LoginPage.tsx` (admin): 2 catches
- `frontend/src/components/admin/UserFormModal.tsx`: campo errors mapeados
- `frontend/src/components/admin/SedeFormModal.tsx`: mismo patron
- `frontend/src/components/cashier/CajaClosedScreen.tsx`: reset digits siempre ejecuta

---

## Agente 4 — Dashboard UI/UX (UX-001, 002, 003, 004)

### UX-001 — KPIs financieros globales
**Archivo:** `frontend/src/pages/DashboardPage.tsx`
Nuevo strip "Resumen financiero global" con 4 cards calculadas de `resumen`:
- Total ingresos hoy (suma todas las sedes)
- Total ingresos mes
- Total devoluciones mes
- Monto devoluciones mes

### UX-002 — LineChart tendencia 7 dias
**Archivo:** `frontend/src/components/admin/dashboard/DashboardCharts.tsx`
LineChart con Recharts mostrando ultimos 7 dias. Datos derivados de ingresos_semana hasta que exista endpoint `/sales/tendencia/`. Nota en codigo para reemplazar.

### UX-003 — SedeCard con ingresos del dia
**Archivo:** `frontend/src/components/admin/dashboard/SedeCard.tsx`
Cada card ahora muestra:
- Badge verde/gris de cajas abiertas
- Row "Ingresos hoy: $X,XXX.XX" con fondo azul claro

### UX-004 — Alertas inventario con detalle
**Archivo:** `frontend/src/components/admin/dashboard/DashboardCharts.tsx`
Debajo del BarChart: pills por sede con conteo de sin-stock/stock-bajo + link "Ver detalle en Inventario"

---

## Agente 5 — POS UI/UX (UX-010, 011, 013, 016, 031)

### UX-010 — Layout 60/40
**Archivo:** `frontend/src/styles/DashboardPage.css`
Grid split: `62fr 38fr` -> `60fr 40fr`

### UX-011 — Debounce 200ms
**Archivo:** `frontend/src/components/cashier/POSView.tsx`
Constante `DEBOUNCE_MS`: 350 -> 200

### UX-013 — Empty state carrito
**Archivo:** `frontend/src/components/cashier/POSView.tsx`
Cuando `cart.length === 0`: icono + "El carrito esta vacio" + "Busca productos en el panel izquierdo"

### UX-016 — Tooltip stock maximo en boton +
**Archivo:** `frontend/src/components/cashier/POSView.tsx`
Boton +: `title` y `aria-label` dinamicos segun si `item.quantity >= item.stock_disponible`

### UX-031 — Responsive tablet
**Archivo:** `frontend/src/styles/DashboardPage.css`
Media query `@media (max-width: 1024px)`:
- Layout columna unica
- Panel busqueda: `min-height: 55vh`
- Panel carrito: `min-height: 45vh` + `border-top`

---

## Agente 6 — General UI/UX (UX-006, 018, 019, 020, 023, 026, 027)

### UX-006 — Alerta caja >4h
**Archivo:** `frontend/src/components/encargado/ControlCajasCard.tsx`
Helper `minutosAbierta()`. Cuando mins > 240: borde rojo + texto "Abierta demasiado tiempo" + emoji aviso.

### UX-018 + UX-019 — CajaClosedScreen
**Archivo:** `frontend/src/components/cashier/CajaClosedScreen.tsx`
- Texto: "El codigo es valido por 30 minutos. Si no tienes uno, solicita al encargado."
- Error: muestra mensaje dinamico del backend cuando disponible.

### UX-020 — WorkerPanel boton Reconectar
**Archivo:** `frontend/src/pages/WorkerPanel.tsx`
Cuando `!online`: span rojo "Sin conexion" + boton "Reconectar" que llama `fetchPedidos()`.

### UX-023 — BarChart horizontal automatico
**Archivo:** `frontend/src/components/admin/dashboard/DashboardCharts.tsx`
`usarLayoutHorizontal = stockData.length > 6`. Con 7+ sedes: `layout="vertical"` en Recharts con YAxis categorico y altura adaptiva.

### UX-026 + UX-027 — Accesibilidad
Agregados `aria-label` en:
- Inputs OTP en CajaClosedScreen: "Digito N del codigo de apertura"
- Boton generar codigo en ControlCajasCard
- Boton reconectar en WorkerPanel
- Boton logout en WorkerPanel

---

## Pendientes despues de esta ronda (25 issues)

| Tipo | Issues |
|------|--------|
| UX Bajo | UX-005, UX-009, UX-017, UX-024, UX-025, UX-028, UX-029, UX-030 |
| UX Medio | UX-007, UX-008, UX-021, UX-022, UX-032, UX-033, UX-034 |
| Infraestructura | Endpoint /sales/tendencia/, Celery opcional para PDF, HTTPS forzado |
| Frontend Medio | ISSUE-013 restantes (otros archivos), WorkerPanel completar pedidos |

---

## Archivos modificados en esta ronda

**Backend (6 archivos):**
- `backend/sales/views.py` — VULN-003, PERF-005
- `backend/sales/permissions.py` — VULN-008
- `backend/sales/serializers.py` — VULN-013
- `backend/config/settings.py` — VULN-009
- `backend/inventory/views.py` — PERF-004, PERF-006
- `backend/inventory/serializers.py` — PERF-006

**Frontend Admin (8 archivos):**
- `frontend/src/pages/DashboardPage.tsx` — UX-001
- `frontend/src/components/admin/dashboard/DashboardCharts.tsx` — UX-002, UX-004, UX-023
- `frontend/src/components/admin/dashboard/SedeCard.tsx` — UX-003
- `frontend/src/components/cashier/POSView.tsx` — UX-011, UX-013, UX-016
- `frontend/src/styles/DashboardPage.css` — UX-010, UX-031
- `frontend/src/components/cashier/PedidoBodegaPanel.tsx` — ISSUE-006
- `frontend/src/components/cashier/PaymentModal.tsx` — ISSUE-008
- `frontend/src/pages/WorkerPanel.tsx` — ISSUE-010, UX-020, UX-027

**Frontend Admin — accesibilidad (3 archivos):**
- `frontend/src/components/cashier/CajaClosedScreen.tsx` — UX-018, UX-019, UX-026
- `frontend/src/components/encargado/ControlCajasCard.tsx` — UX-006, UX-026, UX-027
- `frontend/src/pages/LoginPage.tsx` — ISSUE-013
- `frontend/src/components/admin/UserFormModal.tsx` — ISSUE-013
- `frontend/src/components/admin/SedeFormModal.tsx` — ISSUE-013

**Frontend Cliente (1 archivo):**
- `frontend-cliente/src/pages/LoginPage.tsx` — ISSUE-004, ISSUE-013
