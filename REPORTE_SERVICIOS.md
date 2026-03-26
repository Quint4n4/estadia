# 📊 Análisis: Módulo Reporte de Servicios — EncargadoPanel

> **Propósito de este documento:** Análisis completo por fases del módulo de reportes de taller
> para el panel del Encargado. No contiene código de implementación.
> Fecha de análisis: 26/03/2026

---

## 1. Contexto y Alcance

### ¿Qué existe actualmente?

El **EncargadoPanel** ya tiene 7 secciones:

| Sección actual | Componente | Grupo |
|---|---|---|
| dashboard | SedeKpiStrip + empleados + inventario | — |
| users | UsersList | — |
| products | ProductsList | Inventario |
| entries | EncargadoEntradasView | Inventario |
| audits | AuditView | Inventario |
| sales | EncargadoSalesView | **Ventas** |
| reportes-caja | ReportesCajaView | **Ventas** |

La sección **"Ventas"** (`EncargadoSalesView`) ya muestra reportes del POS (venta de productos). El encargado **no tiene visibilidad** de los servicios del taller.

### ¿Qué se necesita?

Un nuevo ítem de navegación **"Reporte Taller"** (grupo Ventas) que muestre un dashboard de análisis completo de todos los servicios realizados en la sede, con filtros por período.

### Modelo fuente de datos: `ServicioMoto`

Campos clave disponibles para reportes:

**Financieros:**
- `mano_de_obra` (Decimal) — ingreso por labor
- `total_refacciones` (Decimal) — ingreso por refacciones
- `total` (Decimal) — total de la orden
- `metodo_pago` (EFECTIVO / TARJETA / TRANSFERENCIA / null)
- `monto_pagado` (Decimal) — cobrado real
- `pago_status` (PENDIENTE_PAGO / PAGADO)

**Estado:**
- `status` — ciclo completo (RECIBIDO → EN_DIAGNOSTICO → EN_PROCESO → LISTA_PARA_ENTREGAR → LISTO → ENTREGADO / CANCELADO)
- `es_reparacion` (bool) — diferencia reparación de mantenimiento

**Personal:**
- `cajero` → nombre del recepcionista
- `mecanico` → nombre del mecánico asignado

**Tiempos:**
- `fecha_recepcion` — entrada
- `fecha_inicio` — cuando el mecánico arranca
- `fecha_listo` — cuando queda lista
- `fecha_entrega` — cuando se entrega al cliente
- `fecha_entrega_estimada` — fecha prometida

**Archivo:**
- `archivado` (bool) — separación órdenes activas/historial
- `fecha_archivado`

---

## 2. Decisiones de diseño

### 2.1 ¿Sobre qué datos reportar?

**Opción A — Solo órdenes archivadas (`archivado=True`)**
✅ Datos completos (todas tienen fecha_entrega)
✅ Coherente con el historial
❌ No muestra órdenes activas del día en curso

**Opción B — Todas las órdenes ENTREGADO + CANCELADO**
✅ Incluye el día actual (antes de archivar)
✅ Más preciso financieramente
❌ Duplica lógica con HistorialServiciosView

**Opción C — Todas las órdenes (cualquier status) filtradas por período**
✅ Vista más completa para el encargado
✅ Muestra pipeline activo también
❌ Más complejo, KPIs financieros solo aplican a ENTREGADO

**→ Decisión: Opción C** con KPIs financieros calculados solo sobre `status=ENTREGADO` y conteos generales sobre todas las órdenes del período.

### 2.2 ¿Período por defecto?

- **Filtro principal:** `fecha_desde` y `fecha_hasta` (por `fecha_recepcion`)
- **Preset rápido por defecto:** mes actual (del 1 al día de hoy)
- **Presets disponibles:** Hoy / Esta semana / Este mes / Mes anterior / Personalizado

### 2.3 ¿Agrupación temporal de la gráfica?

- Si período ≤ 7 días → agrupar por **día**
- Si período 8–60 días → agrupar por **semana**
- Si período > 60 días → agrupar por **mes**

---

## 3. Métricas y visualizaciones

### 3.1 KPIs superiores (tarjetas numéricas)

| KPI | Cálculo | Icono |
|---|---|---|
| Total órdenes | COUNT todas en período | 🔧 |
| Órdenes entregadas | COUNT donde status=ENTREGADO | ✅ |
| Órdenes canceladas | COUNT donde status=CANCELADO | ❌ |
| Ingresos totales | SUM(total) donde ENTREGADO | 💰 |
| Ticket promedio | AVG(total) donde ENTREGADO | 📊 |
| Tiempo prom. resolución | AVG(fecha_entrega - fecha_recepcion) donde ENTREGADO | ⏱️ |

### 3.2 Gráfica de ingresos por período

- **Tipo:** Barras verticales simples (sin librería externa, usando divs con altura proporcional)
- **Dato:** SUM(total) de órdenes ENTREGADO agrupado por día/semana/mes
- **Alternativa visible:** línea de conteo de órdenes (toggle)

> ⚠️ **Sin Chart.js ni Recharts** — el proyecto usa solo estilos inline. La gráfica se implementa con divs y CSS inline (barras proporcionales).

### 3.3 Desglose por mecánico

Tabla con columnas:
- Mecánico
- Órdenes asignadas
- Órdenes entregadas
- % completadas
- Ingreso generado
- Tiempo promedio

Ordenable por: órdenes entregadas (desc por defecto)

### 3.4 Desglose por tipo de servicio

| Tipo | Conteo | Ingreso | % del total |
|---|---|---|---|
| Reparación (`es_reparacion=True`) | N | $X | % |
| Mantenimiento (`es_reparacion=False`) | N | $X | % |

### 3.5 Desglose por método de pago

Tabla con: EFECTIVO / TARJETA / TRANSFERENCIA + montos

### 3.6 Órdenes con entrega tardía

Lista de órdenes donde `fecha_entrega > fecha_entrega_estimada` (si tienen estimada).
Columnas: Folio, Mecánico, Fecha prometida, Fecha real, Días de retraso.

### 3.7 Órdenes activas en este momento (resumen rápido)

Pequeño panel colapsable mostrando:
- Cuántas hay en cada status activo (no ENTREGADO/CANCELADO)
- No afecta los KPIs financieros

---

## 4. Arquitectura por fases

---

### FASE 1 — Backend: Nuevo endpoint de reporte

**Archivo:** `backend/taller/views.py`
**Archivo:** `backend/taller/urls.py`

**Nueva vista:** `ReporteTallerView`
**URL:** `GET /api/taller/reporte/`
**Permiso:** `IsAuthenticated` + rol `ENCARGADO` o `ADMINISTRATOR`

**Parámetros de query:**
```
fecha_desde   (date, obligatorio)
fecha_hasta   (date, obligatorio)
sede_id       (int, opcional — si no viene, usa sede del usuario)
```

**Respuesta JSON — estructura:**
```
{
  "periodo": { "desde": "...", "hasta": "..." },
  "kpis": {
    "total_ordenes": int,
    "total_entregadas": int,
    "total_canceladas": int,
    "total_activas": int,
    "ingresos_totales": decimal,
    "ticket_promedio": decimal,
    "tiempo_promedio_horas": float,
    "tasa_cancelacion_pct": float
  },
  "ingresos_por_periodo": [
    { "label": "26 Mar", "ingresos": decimal, "ordenes": int }
  ],
  "por_mecanico": [
    {
      "mecanico_id": int,
      "mecanico_nombre": str,
      "asignadas": int,
      "entregadas": int,
      "pct_completadas": float,
      "ingreso_generado": decimal,
      "tiempo_promedio_horas": float
    }
  ],
  "por_tipo": {
    "reparacion": { "conteo": int, "ingresos": decimal },
    "mantenimiento": { "conteo": int, "ingresos": decimal }
  },
  "por_metodo_pago": [
    { "metodo": "EFECTIVO", "conteo": int, "total": decimal }
  ],
  "ordenes_tardias": [
    {
      "folio": str,
      "mecanico_nombre": str,
      "fecha_estimada": date,
      "fecha_entrega": date,
      "dias_retraso": int
    }
  ],
  "activas_por_status": [
    { "status": str, "status_display": str, "conteo": int }
  ]
}
```

**Lógica de cálculo:**
- Filtro base: `sede=user.sede, fecha_recepcion__date__range=[desde, hasta]`
- KPIs financieros: subqueryset `status=ENTREGADO`
- Ingresos por período: agrupación dinámica con `TruncDay/TruncWeek/TruncMonth` según rango
- Por mecánico: `GROUP BY mecanico` + anotaciones Django (`Count`, `Avg`, `Sum`)
- Por tipo: dos queries simples con `filter(es_reparacion=True/False)`
- Por método de pago: `GROUP BY metodo_pago` en subqueryset ENTREGADO
- Órdenes tardías: `filter(fecha_entrega__gt=F('fecha_entrega_estimada'), fecha_entrega_estimada__isnull=False)`
- Activas: `exclude(status__in=['ENTREGADO','CANCELADO']).values('status').annotate(count=Count('id'))`

**Consideración de performance:**
La vista hace múltiples queries pero sobre un conjunto ya filtrado por sede y fecha. Para períodos cortos (< 3 meses) el performance será aceptable sin caché. Si se añaden índices en `fecha_recepcion` y `status`, la consulta es eficiente.

---

### FASE 2 — Frontend: Tipos y servicio API

**Archivo:** `frontend/src/types/taller.types.ts`

Nuevas interfaces a añadir:
- `ReporteTallerParams` — parámetros del request
- `ReporteTallerKpis` — objeto kpis
- `ReportePeriodo` — { label, ingresos, ordenes }
- `ReporteMecanico` — fila de tabla mecánicos
- `ReporteTardia` — fila de tabla tardías
- `ReporteTallerData` — respuesta completa

**Archivo:** `frontend/src/api/taller.service.ts`

Nuevo método: `getReporteTaller(params: ReporteTallerParams): Promise<ReporteTallerData>`

---

### FASE 3 — EncargadoPanel: Integrar nuevo ítem de navegación

**Archivo:** `frontend/src/pages/EncargadoPanel.tsx`

Cambios:
1. Añadir `'reporte-taller'` al tipo `Section`
2. Añadir ítem en `NAV_ITEMS` dentro del grupo **"Ventas"**:
   ```
   { key: 'reporte-taller', label: 'Reporte Taller', icon: '📊' }
   ```
3. Añadir `import ReporteTallerView from '../components/taller/ReporteTallerView'`
4. Añadir renderizado condicional en el body del panel

---

### FASE 4 — Componente principal: `ReporteTallerView`

**Archivo:** `frontend/src/components/taller/ReporteTallerView.tsx`

**Props:** `{ sedeId: number }`

**Estado interno:**
- `fechaDesde`, `fechaHasta` — strings ISO de fecha
- `preset` — 'hoy' | 'semana' | 'mes' | 'mes_anterior' | 'custom'
- `data: ReporteTallerData | null`
- `loading: boolean`
- `error: string | null`

**Secciones del componente:**

```
ReporteTallerView
│
├── [Barra de filtros]
│   ├── Botones preset rápido (Hoy / Esta semana / Este mes / Mes anterior)
│   ├── fecha_desde (date input)
│   ├── fecha_hasta (date input)
│   └── Botón "Generar reporte"
│
├── [KPI Cards — fila horizontal]
│   ├── Total órdenes
│   ├── Entregadas
│   ├── Canceladas
│   ├── Ingresos totales
│   ├── Ticket promedio
│   └── Tiempo prom. resolución
│
├── [Gráfica de ingresos]
│   ├── Toggle: Ingresos / Cantidad de órdenes
│   └── Barras proporcionales con labels (divs inline)
│
├── [Fila de dos columnas]
│   ├── [Tabla: Por mecánico]
│   │   └── Columnas: Mecánico | Asignadas | Entregadas | % | Ingresos | T.Prom
│   └── [Mini tabla: Por tipo y por pago]
│       ├── Reparación vs Mantenimiento (2 filas)
│       └── Efectivo / Tarjeta / Transferencia (3 filas)
│
├── [Panel colapsable: Órdenes activas ahora]
│   └── Badges por status con conteo
│
└── [Tabla: Órdenes con entrega tardía]  (solo si hay datos)
    └── Columnas: Folio | Mecánico | Prometida | Real | Días retraso
```

**Comportamiento:**
- Al cargar el componente, se establece preset "Este mes" y se dispara la carga automática
- Cambiar preset actualiza fechaDesde/fechaHasta automáticamente
- "Custom" habilita los inputs de fecha manual
- Botón "Generar reporte" dispara la query (no auto-refresh en custom)
- Loading: skeleton de tarjetas grises
- Error: banner rojo con mensaje

---

## 5. Estimación de trabajo

| Fase | Archivos modificados / creados | Complejidad |
|---|---|---|
| 1 — Backend endpoint | `views.py`, `urls.py` | 🟡 Media (cálculos con ORM) |
| 2 — Tipos y servicio | `taller.types.ts`, `taller.service.ts` | 🟢 Baja |
| 3 — Nav integration | `EncargadoPanel.tsx` | 🟢 Baja |
| 4 — Componente UI | `ReporteTallerView.tsx` (nuevo, ~500 líneas) | 🟡 Media |

**Total estimado:** 4 agentes en paralelo (uno por fase)

---

## 6. Dependencias y riesgos

### Dependencias
- Fase 2, 3, 4 dependen de que Fase 1 esté definida (ya lo está con el contrato JSON de arriba)
- Fase 4 depende de Fase 2 (tipos)
- Fase 3 es independiente de Fase 4 (solo agrega el nav item e importa el componente)

### Riesgos
| Riesgo | Mitigación |
|---|---|
| `fecha_recepcion` no tiene índice de BD → queries lentas en períodos largos | Agregar `db_index=True` en migración o usar `fecha_archivado` como fallback |
| Mecánicos sin órdenes en período no aparecen en tabla | Aceptable — solo mostramos los que tienen actividad |
| `metodo_pago=null` en órdenes ENTREGADO antiguas | Agrupar null como "Sin registrar" |
| Gráfica con muchas barras (período de 1 año) → overflows | Limitar a máx 52 barras; forzar agrupación mensual si >12 semanas |
| EncargadoPanel sin `sedeId` disponible como prop | Verificar cómo lo reciben `EncargadoSalesView` y `ReportesCajaView` — usar mismo patrón |

---

## 7. Lo que NO incluye esta versión (V1)

Para mantener el alcance manejable, la V1 **no incluye**:

- ❌ Exportar a PDF o Excel
- ❌ Comparativa vs período anterior (variación %)
- ❌ Filtro por mecánico específico
- ❌ Drill-down (click en barra → ver órdenes de ese día)
- ❌ Envío por correo del reporte
- ❌ Datos de inventario/refacciones desglosadas por tipo

Estas funciones pueden añadirse en V2 sin rediseñar la arquitectura.

---

## 8. Resumen ejecutivo

**¿Qué se construye?**
Un módulo de reporte de servicios de taller en el EncargadoPanel, accesible bajo el grupo "Ventas" del sidebar.

**¿Qué muestra?**
KPIs de rendimiento operativo y financiero del taller por período configurable: ingresos, órdenes, tiempo de resolución, rendimiento por mecánico, distribución por tipo de servicio y método de pago, y alertas de entregas tardías.

**¿Cuántos archivos?**
5 archivos modificados + 1 archivo nuevo (`ReporteTallerView.tsx`).

**¿Cuántos agentes en paralelo?**
4 (uno por fase).

---

*Documento de análisis — MotoQFox v1.0*
*Módulo: Reporte de Servicios / EncargadoPanel*
