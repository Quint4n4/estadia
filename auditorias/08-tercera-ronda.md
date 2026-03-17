# Tercera Ronda de Correcciones — 2026-03-17

Esta ronda resuelve los 13 issues MEDIOS pendientes.
Se usaron 5 agentes en paralelo.

---

## Agente 1 — Auth + TypeScript (UX-034, ISSUE-013 resto)

### UX-034 — Redirect automatico al expirar sesion
**Archivos:** `frontend/src/api/axios.config.ts`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/pages/LoginPage.tsx`

**Cambios:**
- `axios.config.ts`: antes de `window.location.href = '/login'` en ambas ramas de fallo (sin refresh token + refresh fallido), se guarda `sessionStorage.setItem('session_expired_msg', 'Tu sesion expiro...')`
- `AuthContext.tsx`: `logout()` ahora hace redirect a `/login` + guarda el mensaje
- `LoginPage.tsx`: nuevo `useEffect` en mount que lee y muestra `session_expired_msg` en el banner de error, luego lo limpia

**Beneficio:** Usuario siempre sabe por que fue deslogueado. Sin pantallas rotas por sesion expirada.

### ISSUE-013 resto — catch tipados
**Archivos corregidos:**
- `frontend/src/components/admin/inventory/InventoryEntryForm.tsx`: catch tipado con `axios.isAxiosError`
- `frontend/src/components/admin/inventory/MotoCatalogView.tsx`: 2 catches en ModeloFormModal y MarcaFormModal
- `ProductsList.tsx`, `ProductDetailModal.tsx`, `CategoriesList.tsx`: ya usaban bare catch sin binding (correcto)

---

## Agente 2 — EncargadoPanel (UX-007, UX-008, UX-032)

### UX-007 — KPIs de sede en EncargadoPanel
**Archivo:** `frontend/src/pages/EncargadoPanel.tsx`

Nuevo componente `SedeKpiStrip` que llama a `salesService.adminResumen()`, filtra por `sedeId` del encargado y muestra 4 cards:
- Ingresos hoy (MXN)
- Ingresos del mes (MXN)
- Devoluciones hoy (rojo si > 0)
- Cajas activas (verde si > 0)

Grid responsive con `repeat(auto-fill, minmax(160px, 1fr))`. Falla silenciosamente si el endpoint no responde.

### UX-008 — Reportes caja como cards en tablet
**Archivos:** `frontend/src/components/encargado/ReportesCajaView.tsx` + `DashboardPage.css`

Doble representacion:
- Desktop (>1200px): tabla existente (`reportes-tabla`)
- Tablet/movil (<1200px): cards con cajero, horario, total neto, badges ventas/canceladas, boton PDF (`reportes-cards`)

CSS: alternancia `display: none/block` segun breakpoint.

### UX-032 — Tabla DashboardCharts scroll horizontal
**Archivo:** `frontend/src/components/admin/dashboard/DashboardCharts.tsx`

Tabla "Ingresos por sede":
- Contenedor: agregado `WebkitOverflowScrolling: 'touch'` (el `overflowX: 'auto'` ya existia)
- Tabla: agregado `minWidth: '600px'`

---

## Agente 3 — POS fixes (UX-012, UX-017, UX-033)

### UX-012 — Boton "Limpiar filtros" siempre visible
**Archivo:** `frontend/src/components/cashier/POSView.tsx`

- Boton ahora siempre renderizado (sin condicional)
- `disabled` y `opacity: 0.4` cuando no hay nada seleccionado
- Texto cambiado a "Limpiar filtros"
- Comentario explicito para no resetear `selCategoria` al cambiar marca

### UX-017 — Toggle $ vs % en descuento
**Archivo:** `frontend/src/components/cashier/POSView.tsx`

- Estado separado: `descuentoInput` (valor crudo) + `descuentoTipo: 'MXN' | 'PCT'`
- Derivado `descuento` convierte PCT a pesos: `subtotal * input / 100`
- Boton toggle `$` / `%` junto al input
- Al cambiar tipo se resetea `descuentoInput` a 0
- El valor que llega a `PaymentModal` siempre es en pesos

### UX-033 — Error stock con sugerencia de accion
**Archivo:** `frontend/src/components/cashier/PaymentModal.tsx`

- Tipo de `error` cambiado a `string | React.ReactNode`
- Detecta `isStockError` por keywords "stock" / "inventario"
- Si es error de stock: muestra mensaje + boton "Revisar carrito" que llama `onClose()`
- Si es otro error: comportamiento anterior

---

## Agente 4 — WorkerPanel (UX-021, UX-022)

### UX-021 — Scroll interno en cards de pedidos
**Archivos:** `frontend/src/pages/WorkerPanel.tsx` + `frontend/src/styles/WorkerPanel.css`

- Contenedor de items: `maxHeight: '280px'`, `overflowY: 'auto'`, `WebkitOverflowScrolling: 'touch'`
- Si pedido tiene >5 items: indicador "N items en total — desplazate para ver mas"
- CSS: `scroll-behavior: smooth` en `.worker-card-items`

### UX-022 — Marcar pedido como completado
**Archivos:** `frontend/src/pages/WorkerPanel.tsx` + `frontend/src/styles/WorkerPanel.css`

Estados nuevos:
- `completados: Set<number>` — pedidos completados (se filtran del grid)
- `completando: Set<number>` — pedidos en vuelo (boton deshabilitado)

Funcion `marcarCompletado(id)`:
- Llama `pedidosService.marcarEntregado(id)` (PATCH /pedidos/id/ con `{ status: 'ENTREGADO' }`)
- Mueve a completados localmente aunque la API falle (no bloquea al worker)

Secciones nuevas:
- Boton verde "Marcar completado" al final de cada card
- Seccion "Completados hoy" debajo del grid (lista con icono verde, hora)
- Estado vacio "Todo entregado!" con CheckCircle cuando todos estan completados

CSS nuevo: `.worker-btn-completar`, `.worker-completados-section`, `.worker-completado-*`

---

## Agente 5 — Misc (UX-019, endpoint tendencia, UX-028)

### UX-028 — Contraste sidebar
**Archivo:** `frontend/src/styles/DashboardPage.css`

Texto del sidebar cambiado a blanco puro `#ffffff`:
- `.sidebar` base: `#e2e8f0` → `#ffffff`
- `.sidebar-nav-item`: `#a0aec0` → `#ffffff`
- `.sidebar-nav-item.active`: background `rgba(255,255,255,0.2)`, color `#ffffff`
- `.sidebar-user-name`: `#e2e8f0` → `#ffffff`
- `.sidebar-user-role`: `#718096` → `rgba(255,255,255,0.7)`

Contraste WCAG AA ahora cumplido (>4.5:1).

### UX-019 — Error OTP diferencia expirado vs invalido
**Archivos:** `backend/sales/views.py` + `frontend/src/components/cashier/CajaClosedScreen.tsx`

Backend (`AbrirCajaView`):
- Separadas las validaciones en 2 queries:
  1. Buscar codigo por valor + sede
  2. Si existe, verificar expiracion por separado
- Mensaje especifico: "Codigo invalido. Verifica los digitos e intenta de nuevo."
- Mensaje especifico: "Codigo expirado. Solicita un nuevo codigo al encargado."

Frontend: fallback generico actualizado a "Codigo invalido. Intenta de nuevo."

### Endpoint /sales/tendencia/ con datos reales
**Archivos backend:** `sales/views.py` + `sales/urls.py`
**Archivos frontend:** `sales.types.ts` + `sales.service.ts` + `DashboardCharts.tsx`

Backend — `VentasTendenciaView`:
```python
# GET /sales/tendencia/?dias=7
# Devuelve: [{ fecha: 'dd/mm', dia: 'Lun', total: 1234.50, ventas: 12 }]
# Incluye dias sin ventas (total: 0)
```

Frontend:
- Tipo `TendenciaPoint` agregado a `sales.types.ts`
- Funcion `getTendencia(dias = 7)` en `sales.service.ts`
- `DashboardCharts.tsx`: eliminada `buildTendenciaData()` derivada, reemplazada por `useEffect` con llamada real al endpoint
- LineChart solo renderiza cuando `tendencia.length > 0`

---

## Archivos modificados en esta ronda

**Backend (2 archivos):**
- `backend/sales/views.py` — VentasTendenciaView + AbrirCajaView mensajes especificos
- `backend/sales/urls.py` — ruta tendencia/

**Frontend Admin (10 archivos):**
- `frontend/src/api/axios.config.ts` — session_expired_msg
- `frontend/src/contexts/AuthContext.tsx` — logout redirect
- `frontend/src/pages/LoginPage.tsx` — mostrar mensaje expiracion
- `frontend/src/pages/EncargadoPanel.tsx` — SedeKpiStrip
- `frontend/src/components/encargado/ReportesCajaView.tsx` — cards tablet
- `frontend/src/components/admin/dashboard/DashboardCharts.tsx` — tabla scroll + tendencia real
- `frontend/src/components/cashier/POSView.tsx` — limpiar YMM + toggle descuento
- `frontend/src/components/cashier/PaymentModal.tsx` — error stock accionable
- `frontend/src/components/cashier/CajaClosedScreen.tsx` — fallback error actualizado
- `frontend/src/pages/WorkerPanel.tsx` — scroll cards + marcar completado

**Frontend Admin — tipos/servicios (2 archivos):**
- `frontend/src/types/sales.types.ts` — TendenciaPoint
- `frontend/src/api/sales.service.ts` — getTendencia

**Frontend Admin — estilos (2 archivos):**
- `frontend/src/styles/DashboardPage.css` — sidebar contraste + reportes responsive
- `frontend/src/styles/WorkerPanel.css` — worker-btn-completar + worker-completados

**Frontend Admin — inventory (2 archivos):**
- `frontend/src/components/admin/inventory/InventoryEntryForm.tsx` — catch tipado
- `frontend/src/components/admin/inventory/MotoCatalogView.tsx` — 2 catches tipados

---

## Estado post tercera ronda

| Prioridad | Total | Corregidos | Pendientes |
|-----------|-------|-----------|------------|
| Critico   | 5     | 5 (100%)   | 0          |
| Alto      | 17    | 17 (100%)  | 0          |
| Medio     | 35    | 35 (100%)  | 0          |
| Bajo      | 12    | 0          | 12         |
| Total     | 69    | 57 (83%)   | 12         |
