# Issues Pendientes — Auditoría 17 Marzo 2026

Issues identificados pero no resueltos aún. Ordenados por prioridad.

---

## PRIORIDAD ALTA — Este sprint

### Backend
- **VULN-004** `taller/views.py:112` — MotoClienteListView expone todas las motos sin filtro de sede
- **VULN-007** `inventory/views.py` — Múltiples vistas no filtran `is_active=True` (bypass soft delete)
- **VULN-012** `inventory/views.py:423` — Low stock filter no restringe por sede del usuario

### Frontend
- **ISSUE-002** `POSView.tsx:188` — `useEffect` con dependencias incompletas (`año` pero falta `selModelo`)
- **ISSUE-003** `POSView.tsx:92,161,170,197` — 8+ castings `as any` en llamadas API que ocultan errores de tipo

### Base de Datos
- **PERF-002** `inventory/serializers.py:186` — `get_total_stock()` loop Python → usar `Sum()` en DB
- **PERF-003** `sales/views.py:136` — Loop `select_for_update()` en cancelación (20 queries por venta)
- **PERF-007** Múltiples models — Índices faltantes en `Venta(sede,created_at)`, `AperturaCaja(cajero,status)`, `LoginAuditLog(email,timestamp)`

### UI/UX (mayor impacto operativo)
- **UX-001** — KPIs Dashboard Admin no muestran salud financiera (ingresos, ticket promedio, margen)
- **UX-010** — POSView ratio 50/50 muy estrecho en pantallas 1366px
- **UX-014** — PaymentModal no permite editar carrito antes de confirmar
- **UX-015** — Input efectivo sin validación en tiempo real
- **UX-031** — POSView no es responsive en tablet

---

## PRIORIDAD MEDIA — Próximo mes

### Backend
- **VULN-002** `inventory/views.py:217` — MarcaFabricanteListCreateView sin `is_active` filter
- **VULN-003** `sales/views.py:120` — Orden de `select_for_update()` incorrecto en cancelación
- **VULN-008** `sales/permissions.py:26` — Comparación de rol por string en lugar de property
- **VULN-009** `settings.py:200` — `CORS_ALLOWED_ORIGINS` hardcodeado, debe ser variable de entorno
- **VULN-013** `sales/serializers.py:57` — Sin `max_value` en campo `descuento`

### Frontend
- **ISSUE-006** `PedidoBodegaPanel.tsx` — Empty catch blocks silenciosos (3 instancias)
- **ISSUE-008** `PaymentModal.tsx:47` — `catch (err: any)` sin type narrowing
- **ISSUE-009** `CajaClosedScreen.tsx:50` — Mismo patrón sin type guard
- **ISSUE-010** `WorkerPanel.tsx:36` — Polling sin `AbortController` (memory leak potencial)
- **ISSUE-013** Múltiples archivos — 20+ `catch (err: any)` sin `axios.isAxiosError()` guard

### Base de Datos
- **PERF-004** `inventory/views.py:732` — Loop en auditoría dentro de `@transaction.atomic`
- **PERF-005** `sales/pdf_service.py:208` — Generación de PDF bloquea cierre de caja
- **PERF-006** `inventory/serializers.py` — `SerializerMethodField` counts sin `annotate()`
- **PERF-008** `inventory/serializers.py` — `select_related` faltante en vistas de compatibilidad

### UI/UX
- **UX-006** — Sin alerta si caja lleva >4h abierta (ControlCajasCard)
- **UX-011** — Debounce 350ms en POS se siente lento
- **UX-020** — WorkerPanel sin botón "Reconectar" cuando offline
- **UX-023** — BarChart de sedes colapsa con 8+ sedes
- **UX-026** — Inputs sin labels vinculados (falla WCAG)
- **UX-027** — Botones solo-icono sin `aria-label`
- **UX-033** — Error stock insuficiente sin sugerencia de acción al cajero

---

## PRIORIDAD BAJA — Backlog

- **VULN-010** SKU validation case-insensitive inconsistente
- **VULN-011** Sede filtering incompleto en taller (`pass # Sin restricción extra`)
- **UX-002** Sin LineChart de tendencias históricas en Dashboard Admin
- **UX-003** SedeCards sin ingresos del día ni status de cajas
- **UX-008** ReportesCajaView — tabla con muchas columnas, usar cards en tablet
- **UX-016** Botón `+` cantidad sin tooltip "Stock máximo alcanzado"
- **UX-017** Descuento sin toggle % vs $
- **UX-028** Contraste sidebar borderline WCAG
- **UX-029** Botones con padding inconsistente entre vistas
- **UX-030** Espaciado entre secciones sin escala sistemática

---

## Cómo usar este archivo

Cuando se resuelva un issue:
1. Moverlo de este archivo a `fixes-[fecha].md` con el detalle técnico
2. Actualizar `reporte-completo.md` cambiando `⏳ Pendiente` → `✅ RESUELTO`
3. Hacer commit con referencia al issue: `fix: VULN-004 filtro sede en MotoClienteListView`
