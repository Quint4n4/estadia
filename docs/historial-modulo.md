# Módulo de Historial de Servicios

## Objetivo
Crear un módulo separado de "Historial" en el panel de recepción donde queden almacenadas las órdenes de servicio al finalizar el día. El archivado es **manual** y ocurre al momento de cerrar caja. Las órdenes archivadas desaparecen de Taller/Servicios y pasan a Historial, organizadas por fecha.

---

## Reglas de negocio

| Condición | Comportamiento |
|-----------|---------------|
| Orden `ENTREGADO` al cerrar caja | Se archiva → desaparece de Taller/Servicios, aparece en Historial |
| Orden no entregada (cualquier estado activo) al cerrar caja | Se archiva también → aparece en Historial con su estado actual, desaparece de Taller/Servicios |
| El archivado ocurre siempre al cerrar caja | No hay archivado automático al entregar una orden |
| Las órdenes archivadas son de solo lectura | No se puede cambiar estado ni editar desde Historial |
| Se puede ver el detalle de una orden archivada | Modal de detalle en modo lectura |

---

## Arquitectura de la solución

### Decisión de diseño
No se crea un modelo nuevo. Se agregan 3 campos a `ServicioMoto` existente:
- `archivado` (BooleanField) — si la orden está en el historial
- `fecha_archivado` (DateTimeField) — cuándo fue archivada
- `archivado_por` (FK CustomUser) — quién cerró la caja

Esto evita duplicar datos y mantiene toda la trazabilidad en un solo modelo.

---

## Fases de implementación

---

### FASE 1 — Backend: Campos y migración
**Archivos:** `backend/taller/models.py`, nueva migración

**Cambios:**
1. Agregar a `ServicioMoto`:
   ```python
   archivado       = models.BooleanField(default=False, verbose_name='Archivado en historial')
   fecha_archivado = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de archivado')
   archivado_por   = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL,
                                        null=True, blank=True, related_name='ordenes_archivadas')
   ```
2. Generar y aplicar migración: `python manage.py makemigrations taller && python manage.py migrate`

---

### FASE 2 — Backend: Endpoint de archivado
**Archivos:** `backend/taller/views.py`, `backend/taller/urls.py`

**Nuevo endpoint:** `POST /api/taller/archivar/`

**Lógica:**
- Permisos: `CASHIER`, `ENCARGADO`, `ADMINISTRATOR`
- Toma todas las órdenes de la sede con `archivado=False` (sin importar estado)
- Las marca con `archivado=True`, `fecha_archivado=now()`, `archivado_por=request.user`
- Retorna: `{ success, archivadas: N, detalle: [folios] }`

**URL:** `path('archivar/', views.ArchivarOrdenesView.as_view(), name='archivar-ordenes')`

---

### FASE 3 — Backend: Endpoint de historial
**Archivos:** `backend/taller/views.py`, `backend/taller/urls.py`

**Nuevo endpoint:** `GET /api/taller/historial/`

**Parámetros de query:**
- `sede_id` — filtro por sede
- `fecha_desde` / `fecha_hasta` — rango de fecha de archivado
- `status` — filtro por estado final (ENTREGADO, CANCELADO, etc.)
- `page` / `page_size` — paginación

**Lógica:**
- Filtra `archivado=True`
- Ordena por `fecha_archivado DESC`
- Usa `ServicioMotoListSerializer` (ya incluye todos los campos necesarios)
- Agrupa en el serializer de respuesta por fecha de archivado (fecha local)

**URL:** `path('historial/', views.HistorialServiciosView.as_view(), name='historial-servicios')`

---

### FASE 4 — Backend: Modificar ServicioListView
**Archivos:** `backend/taller/views.py`

**Cambio:** En `ServicioListView.get()`, agregar al inicio del queryset:

```python
qs = qs.filter(archivado=False)  # Nunca mostrar archivadas en la vista activa
```

Así las órdenes archivadas desaparecen de Taller/Servicios sin afectar el historial.

---

### FASE 5 — Frontend: Tipos y API service
**Archivos:** `frontend/src/types/taller.types.ts`, `frontend/src/api/taller.service.ts`

**Tipos nuevos:**
```typescript
// En ServicioMotoList agregar:
archivado: boolean;
fecha_archivado: string | null;
archivado_por_nombre: string | null;

// Nuevo tipo para respuesta de archivado:
export interface ArchivarResponse {
  archivadas: number;
  detalle: string[];   // folios archivados
}

// Nuevo tipo para parámetros de historial:
export interface HistorialParams {
  sede_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  status?: ServicioStatus;
  page?: number;
  page_size?: number;
}
```

**Funciones nuevas en tallerService:**
```typescript
archivarOrdenes(sedeId: number): Promise<TallerApiResponse<ArchivarResponse>>
listHistorial(params?: HistorialParams): Promise<TallerApiResponse<{ servicios: ServicioMotoList[]; pagination: any }>>
```

---

### FASE 6 — Frontend: Componente HistorialServiciosView
**Archivo nuevo:** `frontend/src/components/taller/HistorialServiciosView.tsx`

**Estructura visual:**
```
┌─────────────────────────────────────────────────┐
│  📂 Historial de Servicios                      │
│  [Buscar...] [Desde: ___] [Hasta: ___] [Estado▼]│
├─────────────────────────────────────────────────┤
│  📅 25 mar 2026  (12 órdenes)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │Kawasaki  │ │Honda     │ │Italika   │         │
│  │Z400 2024 │ │CBR300R   │ │DM200     │         │
│  │ENTREGADO │ │CANCELADO │ │ENTREGADO │         │
│  │$1,200.00 │ │$0.00     │ │$600.00   │         │
│  └──────────┘ └──────────┘ └──────────┘         │
├─────────────────────────────────────────────────┤
│  📅 24 mar 2026  (8 órdenes)                    │
│  ...                                             │
└─────────────────────────────────────────────────┘
```

**Características:**
- Órdenes agrupadas por fecha de archivado (header de día)
- Cada grupo muestra: total de órdenes del día + suma recaudada
- Cards con: moto, cliente, estado, mecánico, total, método de pago
- Click en card abre `ServicioDetalleModal` en modo lectura (sin botones de acción)
- Filtros: búsqueda libre, rango de fechas, estado
- Paginación (carga más órdenes al hacer scroll o con botón)
- Estado vacío: "No hay órdenes en el historial para este rango de fechas"

---

### FASE 7 — Frontend: Integración en CashierPanel
**Archivo:** `frontend/src/pages/CashierPanel.tsx`

**Cambios:**
1. Agregar sección `'historial'` al sidebar (ícono de archivo 📂)
2. Renderizar `<HistorialServiciosView sedeId={sedeId} />` cuando `section === 'historial'`
3. Modificar el flujo de `handleCerrarCaja`:
   - Antes de cerrar caja → mostrar modal de confirmación con resumen:
     - "X órdenes activas serán archivadas"
     - "X órdenes entregadas hoy"
     - "X órdenes en proceso (quedarán guardadas en historial con su estado actual)"
   - Al confirmar → llamar `archivarOrdenes(sedeId)` → luego `cerrarCaja(aperturaId)`
   - Si archivar falla → mostrar error, NO cerrar caja

---

## Flujo completo

```
Fin del día → Cajero presiona "Cerrar Caja"
                      ↓
         Modal de confirmación:
         "Se archivarán N órdenes:
          - 5 entregadas hoy
          - 2 en proceso (quedan guardadas)"
                      ↓
              [Cancelar] / [Confirmar y cerrar]
                      ↓
         POST /api/taller/archivar/
         → ordenes.archivado = True
         → ordenes desaparecen de Taller/Servicios
                      ↓
         POST /api/sales/cierres/ (flujo existente)
         → caja cerrada
                      ↓
         Al día siguiente, Taller/Servicios limpio
         El Historial muestra las órdenes del día anterior
```

---

## Orden de implementación sugerido

| # | Fase | Dependencias | Archivos |
|---|------|-------------|---------|
| 1 | Backend modelo + migración | — | models.py |
| 2 | Backend endpoint archivar | Fase 1 | views.py, urls.py |
| 3 | Backend endpoint historial | Fase 1 | views.py, urls.py |
| 4 | Backend modificar ServicioListView | Fase 1 | views.py |
| 5 | Frontend tipos + service | Fase 2, 3 | taller.types.ts, taller.service.ts |
| 6 | Frontend HistorialServiciosView | Fase 5 | HistorialServiciosView.tsx (nuevo) |
| 7 | Frontend CashierPanel integración | Fase 5, 6 | CashierPanel.tsx |

**Paralelos posibles:**
- Fases 1-4 (backend) en un solo agente o dos agentes
- Fase 5 puede empezar al terminar Fases 2 y 3
- Fases 6 y 7 pueden ir en paralelo (archivo distinto)
