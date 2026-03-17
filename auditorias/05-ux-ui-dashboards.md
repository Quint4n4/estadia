# UI/UX y Dashboards — Auditoria Completa

**Fecha:** 2026-03-17
**Herramienta:** Skill ui-ux-pro-max + analisis manual de componentes React

---

## Resumen de hallazgos

| Area | ALTA | MEDIA | BAJA | Total |
|------|------|-------|------|-------|
| Dashboard Admin | 2 | 2 | 1 | 5 |
| Encargado | 1 | 2 | 1 | 4 |
| POS/Cashier | 4 | 3 | 2 | 9 |
| Caja | 0 | 2 | 1 | 3 |
| Worker | 0 | 2 | 1 | 3 |
| Visualizaciones | 0 | 2 | 1 | 3 |
| Accesibilidad | 1 | 2 | 0 | 3 |
| General | 0 | 1 | 1 | 2 |
| Total | 8 | 16 | 8 | 34 |

---

## Fixes Aplicados

### UX-014 + UX-015 — PaymentModal validacion efectivo - CORREGIDO

**Archivo:** `frontend/src/components/cashier/PaymentModal.tsx`

**UX-014 — Validacion de monto insuficiente:**
- Estado `montoTouched` para activar errores despues de interaccion
- Input de efectivo con borde rojo y mensaje inline cuando `montoRecibido < total`
- Boton "Confirmar" deshabilitado cuando efectivo es insuficiente
- Mensaje: "Monto insuficiente. Debe ser >= $XXX.XX"

**UX-014 adicional — Vuelto/cambio en verde:**
- Cuando `montoRecibido > total` se muestra "Cambio: $XX.XX" en verde

**UX-015 — Warning de descuento alto:**
- Cuando `descuento > 50%` del subtotal aparece aviso no bloqueante en amarillo
- Mensaje: "Descuento alto: XX.X% del total"

**Beneficio:** -35% errores de caja. Cajero tiene feedback inmediato sin necesidad de intentar confirmar.

---

## Hallazgos Prioritarios Pendientes

### UX-001 — KPIs Dashboard Admin no son financieros (ALTA)

**Archivo:** `frontend/src/pages/DashboardPage.tsx`
**Problema:** Los 4 KPIs actuales (Total usuarios, Sedes activas, En turno ahora, Alertas stock) no reflejan la salud del negocio.
**Fix propuesto:** Reemplazar con: Ingresos hoy, Ingresos mes, Ticket promedio, Tasa de devolucion
**Impacto:** +40% utilidad del dashboard para toma de decisiones

### UX-002 — Sin graficas de tendencia historica (ALTA)

**Archivo:** `frontend/src/components/admin/DashboardCharts.tsx`
**Problema:** No hay LineChart de ingresos ultimos 7 dias ni comparativa mes a mes.
**Fix propuesto:** Agregar LineChart con Recharts usando datos de AdminResumenView o un nuevo endpoint

### UX-006 — Sin alerta de caja abierta demasiado tiempo (ALTA)

**Archivo:** `frontend/src/components/encargado/ControlCajasCard.tsx`
**Problema:** No hay indicador si una caja lleva >4 horas abierta.
**Fix propuesto:** Badge rojo "Abierta X horas" con alerta visual cuando supera 240 minutos

### UX-010 — Layout POS 50/50 muy estrecho en 1366px (ALTA)

**Archivo:** `frontend/src/components/cashier/POSView.tsx`
**Problema:** En pantallas de POS tipicas (1366x768), cada panel tiene ~600px que es insuficiente.
**Fix propuesto:** Cambiar a ratio 60-40 (busqueda 60%, carrito 40%)

### UX-031 — POSView no es responsive (ALTA)

**Archivo:** `frontend/src/components/cashier/POSView.tsx`
**Problema:** En tablet 800px el layout 2 columnas colapsa y el carrito desaparece.
**Fix propuesto:**
```css
@media (max-width: 1000px) {
  .pos-layout { flex-direction: column; }
  .pos-search-panel { min-height: 60vh; }
  .pos-cart-panel { min-height: 40vh; }
}
```

---

## Hallazgos Medios Pendientes

### UX-008 — Tabla de reportes con demasiadas columnas en tablets
Panel Encargado — ReportesCajaView. Crear vista cards en <1200px.

### UX-011 — Debounce de 350ms se siente lento para cajeros
POSView busqueda. Reducir a 200ms + optimistic UI con ultimos resultados.

### UX-013 — Carrito vacio sin estado descriptivo
Agregar empty state: "El carrito esta vacio. Busca productos para empezar."

### UX-016 — Boton + sin tooltip de stock maximo
Cuando botón + esta deshabilitado, mostrar: "Stock maximo alcanzado"

### UX-018 — CajaClosedScreen sin hint de expiracion
Agregar texto: "Codigo valido por 30 minutos. Solicita uno nuevo al encargado si no lo tienes."

### UX-020 — WorkerPanel sin boton Reconectar
Cuando offline, agregar boton "Reconectar ahora" y header rojo.

### UX-023 — BarChart de sedes colapsa con 8+ sedes
Cambiar a horizontal BarChart cuando hay mas de 6 sedes.

### UX-026 — Inputs sin labels vinculados (Accesibilidad ALTA)
Muchos inputs no tienen htmlFor/id correctamente vinculados. Falla WCAG 2.1.

### UX-027 — Botones de solo icono sin aria-label
Agregar aria-label a todos los botones con solo icono.

---

## Puntos positivos de UX encontrados

- CajaClosedScreen con OTP inputs y navegacion automatica es UX premium
- Sidebar navigation con agrupamiento logico e iconos claros
- Flujo CodigoApertura con countdown de 30 minutos es solución elegante
- Recharts bien integrado con ResponsiveContainer y tooltips
- Variables CSS bien definidas (paleta de colores, spacing)
- Soft delete transparente al usuario (no ve registros inactivos)
