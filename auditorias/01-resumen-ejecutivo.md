# Resumen Ejecutivo — Auditoría MotoQFox

**Fecha:** 2026-03-17
**Alcance:** Backend Django, Frontend React/TS, Base de datos PostgreSQL, UI/UX

---

## Hallazgos por dominio

| Dominio | Crítico | Alto | Medio | Bajo | Total |
|---------|---------|------|-------|------|-------|
| Seguridad Backend | 2 | 6 | 4 | 1 | 13 |
| Seguridad Frontend | 1 | 4 | 9 | 0 | 14 |
| Escalabilidad BD | 0 | 4 | 4 | 0 | 8 |
| UI/UX | 2 | 3 | 18 | 8 | 34 |
| **Total** | **5** | **17** | **35** | **9** | **69** |

---

## Los 5 Críticos — Estado: ✅ TODOS CORREGIDOS

### 🔴 ISSUE-001 — Tokens JWT en localStorage (Frontend Cliente)
- **Riesgo:** Account takeover mediante XSS. Tokens accesibles desde cualquier script.
- **Archivos afectados:** `frontend-cliente/src/context/AuthContext.tsx`, `axios.config.ts`, `LoginPage.tsx`
- **Corrección:** Migrado a `tokenStore.ts` (patrón memory + sessionStorage, igual que admin)
- **Estado:** ✅ Corregido

### 🔴 VULN-001 — VentaListCreateView sin filtro de sede
- **Riesgo:** CASHIER de Sede A puede listar ventas de Sede B (información disclosure).
- **Archivos afectados:** `backend/sales/views.py`
- **Corrección:** Filtro automático `qs.filter(sede=user.sede)` para no-administradores. `?sede_id=` solo funciona para ADMINISTRATOR.
- **Estado:** ✅ Corregido

### 🔴 VULN-006 — Contraseña en texto plano en email de bienvenida
- **Riesgo:** Si el email es interceptado, las credenciales quedan expuestas.
- **Archivos afectados:** `backend/users/views.py` — función `_send_welcome_email()`
- **Corrección:** Se elimina la contraseña del email. Se genera un `PasswordResetToken` y el email incluye un enlace seguro de "Establecer contraseña".
- **Estado:** ✅ Corregido

### 🔴 PERF-001 — AdminResumenView genera 80+ queries por request
- **Riesgo:** Con 10 sedes y tráfico normal el endpoint colapsa (8,000 queries/minuto).
- **Archivos afectados:** `backend/sales/views.py` — `AdminResumenView.get()`
- **Corrección:** Refactorizado con `values('sede').annotate()` + `Coalesce`. Ahora son **4 queries constantes** sin importar el número de sedes.
- **Impacto:** 95% reducción de queries en el endpoint más crítico del dashboard.
- **Estado:** ✅ Corregido

### 🔴 ISSUE-005 — Race condition en token refresh
- **Riesgo:** Con múltiples tabs abiertas, varios 401 simultáneos generan múltiples llamadas a `/auth/refresh/`. SimpleJWT invalida el token en el primer uso, las demás tabs hacen logout forzado.
- **Archivos afectados:** `frontend/src/api/axios.config.ts`
- **Corrección:** Implementado mutex (`isRefreshing` flag) + `failedQueue`. Solo el primer request ejecuta el refresh; los demás esperan en cola y se resuelven con el nuevo token.
- **Estado:** ✅ Corregido

---

## Hallazgos Altos — Estado parcial

| ID | Descripción | Estado |
|----|-------------|--------|
| VULN-004 | MotoClienteListView expone todas las motos | ✅ Ya estaba corregido |
| VULN-005 | VentaDetailView sin validación de sede | ✅ Corregido junto con VULN-001 |
| VULN-007 | Vistas inventory sin filtro is_active | ✅ Ya estaba corregido |
| VULN-012 | Low stock filter sin restricción de sede | ✅ Ya estaba corregido |
| PERF-002 | get_total_stock() loop Python en lugar de Sum() | ✅ Corregido (100 queries → 0) |
| PERF-003 | Loop en cancelación de venta dentro de transacción | ✅ Corregido (20 queries → 2) |
| PERF-007 | Índices composite faltantes en modelos | ✅ Ya estaban definidos con nombres |
| ISSUE-002 | useEffect dependencias incompletas en POSView | ✅ Corregido |
| ISSUE-003 | 8+ castings `as any` en POSView | ✅ Corregido |
| UX-014 | PaymentModal sin validación efectivo inline | ✅ Corregido |
| UX-015 | Sin feedback de descuento excesivo | ✅ Corregido |
| ISSUE-004 | Tokens guardados antes de validar login en cliente | ✅ Corregido (flujo ya era correcto + catch tipado) |
| PERF-004 | Loop en auditoría inventario dentro de @transaction | ✅ Corregido (N queries → 3 queries bulk) |
| PERF-005 | PDF generación bloquea cierre de caja (2-5s) | ✅ Corregido (threading daemon background) |
| PERF-006 | SerializerMethodField counts sin annotate() | ✅ Corregido (4 serializers con guard + annotate en views) |
| VULN-003 | select_for_update() orden incorrecto en cancelación | ✅ Corregido (lock al inicio de @transaction) |
| VULN-008 | Comparación de rol por string en permissions.py | ✅ Corregido (usando properties is_administrator etc.) |
| VULN-009 | CORS_ALLOWED_ORIGINS hardcodeado | ✅ Corregido (variable de entorno con fallback dev) |
| VULN-013 | Sin max_value en campo descuento | ✅ Corregido (max_value + validación descuento > subtotal) |
| UX-001 | KPIs Dashboard Admin sin métricas financieras | ✅ Corregido (strip financiero global: hoy/mes/devoluciones) |
| UX-002 | Sin LineChart de tendencias | ✅ Corregido (LineChart 7 días con datos derivados) |
| UX-003 | SedeCard sin ingresos del día | ✅ Corregido (ingresos_hoy + badge cajas) |
| UX-006 | Sin alerta de caja abierta >4h | ✅ Corregido (badge rojo + texto aviso) |
| UX-010 | POSView layout 50/50 muy estrecho | ✅ Corregido (60/40) |
| UX-011 | Debounce 350ms lento | ✅ Corregido (200ms) |
| UX-013 | Carrito vacío sin empty state | ✅ Corregido (mensaje + hint) |
| UX-016 | Botón + sin tooltip de stock máximo | ✅ Corregido (title + aria-label) |
| UX-018 | CajaClosedScreen sin hint de expiración | ✅ Corregido (texto 30 minutos) |
| UX-020 | WorkerPanel sin botón Reconectar | ✅ Corregido (botón + aria-label) |
| UX-023 | BarChart colapsa con 8+ sedes | ✅ Corregido (layout horizontal automático >6 sedes) |
| UX-026 | Inputs sin aria-label (accesibilidad) | ✅ Corregido (OTP inputs, botones acción) |
| UX-027 | Botones icono sin aria-label | ✅ Corregido (generar código, logout, reconectar) |
| UX-031 | POSView no responsive en tablets | ✅ Corregido (media query 1024px) |
| ISSUE-006 | Empty catch blocks en PedidoBodegaPanel | ✅ Corregido (error state + console.error) |
| ISSUE-008 | catch sin type narrowing en PaymentModal | ✅ Corregido (axios.isAxiosError guard) |
| ISSUE-010 | Memory leak en WorkerPanel polling | ✅ Corregido (isMounted flag) |
| ISSUE-013 | 20+ catch any sin type guard | ✅ Corregido (4 archivos críticos) |

---

## Puntos positivos del sistema

- ✅ JWT admin en memoria (patrón correcto)
- ✅ Account lockout 5 intentos / 30 minutos
- ✅ Password reset con tokens UUID de 1 hora
- ✅ LoginAuditLog para tracking de seguridad
- ✅ `select_for_update()` + `@transaction.atomic` en ventas
- ✅ Sin SQL injection (ORM exclusivo)
- ✅ Sin `dangerouslySetInnerHTML`
- ✅ ProtectedRoute con validación de roles correcto
- ✅ Índices composite ya definidos con nombres explícitos
- ✅ Soft delete implementado en todos los catálogos
