# Módulo Taller — Registro de Cambios

> **Fecha de implementación:** 2026-03-16
> **Desarrollado por:** Claude (Anthropic) + Emanuel Real Gamboa
> **Ramas afectadas:** `main` (monorepo)

---

## Resumen ejecutivo

Se implementó un módulo completo de **servicios de taller de motos** en tres fases:

| Fase | Alcance | Estado |
|------|---------|--------|
| Fase 1 — Backend (app `taller`) | Modelos, API REST, permisos | ✅ Completo |
| Fase 2 — Frontend Admin | Paneles cajero, jefe mecánico, mecánico | ✅ Completo |
| Fase 3 — Frontend Cliente (PWA) | Seguimiento de servicios desde la app | ✅ Completo |

---

## FASE 1 — Backend: App `taller`

### Roles nuevos (`users/models.py`)

Se agregaron dos valores al `TextChoices` de `CustomUser.Role`:

```python
JEFE_MECANICO = 'JEFE_MECANICO', 'Jefe de Mecánicos'
MECANICO      = 'MECANICO',      'Mecánico'
```

**Reglas:** ambos roles requieren `sede` asignada (no pueden tener `sede=null`).

---

### Permisos nuevos (`users/permissions.py`)

| Clase | Permite acceso a |
|-------|----------------|
| `IsJefeMecanicoOrAbove` | JEFE_MECANICO, ENCARGADO, ADMINISTRATOR |
| `IsMecanicoOrAbove` | MECANICO, JEFE_MECANICO, ENCARGADO, ADMINISTRATOR |

---

### Configuración (`config/settings.py` y `config/urls.py`)

```python
# settings.py — INSTALLED_APPS
'taller',

# urls.py
path('api/taller/', include('taller.urls')),
```

---

### Modelos nuevos (`taller/models.py`)

#### `MotoCliente`
| Campo | Tipo | Notas |
|-------|------|-------|
| `cliente` | FK → ClienteProfile | null=True (walk-in sin cuenta) |
| `marca` | CharField(100) | requerido |
| `modelo` | CharField(100) | requerido |
| `anio` | SmallIntegerField | |
| `placa` | CharField(20) | blank |
| `color` | CharField(50) | blank |
| `notas` | TextField | blank |
| `created_at` | auto_now_add | |

#### `ServicioMoto`
| Campo | Tipo | Notas |
|-------|------|-------|
| `folio` | CharField(20) UNIQUE | auto: `SVC-YYYYMMDD-NNNN` |
| `sede` | FK → Sede | |
| `cliente` | FK → ClienteProfile | null=True |
| `moto` | FK → MotoCliente | null=True |
| `descripcion_problema` | TextField | |
| `cajero` | FK → CustomUser | quien recibe |
| `mecanico` | FK → CustomUser | null=True, asignado por jefe |
| `asignado_por` | FK → CustomUser | null=True |
| `status` | CharField choices | ver tabla de estados |
| `pago_status` | CharField choices | PENDIENTE_PAGO / PAGADO |
| `mano_de_obra` | Decimal(10,2) | cotización inicial |
| `total_refacciones` | Decimal(10,2) | suma items REFACCION+EXTRA |
| `total` | Decimal(10,2) | mano_de_obra + total_refacciones |
| `metodo_pago` | CharField | null=True, se llena al entregar |
| `monto_pagado` | Decimal | null=True |
| `cambio` | Decimal | null=True |
| `cliente_notificado` | BooleanField | default=False |
| `notas_internas` | TextField | blank |
| `fecha_entrega_estimada` | DateField | null=True |
| `fecha_recepcion` | auto_now_add | |
| `fecha_inicio` | null=True | cuando mecánico empieza |
| `fecha_listo` | null=True | cuando mecánico termina |
| `fecha_entrega` | null=True | cuando cajero entrega |

**Estados del servicio:**

| Status | Quién lo cambia | Acción |
|--------|----------------|--------|
| `RECIBIDO` | Cajero (al crear) | Moto ingresó al taller |
| `EN_PROCESO` | Jefe (al asignar) | Mecánico trabajando |
| `COTIZACION_EXTRA` | Mecánico (solicita pieza) | Esperando autorización del cliente |
| `LISTO` | Mecánico | Listo + email al cliente |
| `ENTREGADO` | Cajero | Cobrado y entregado |

#### `ServicioItem`
| Campo | Tipo | Notas |
|-------|------|-------|
| `servicio` | FK → ServicioMoto | |
| `tipo` | choices | REFACCION / MANO_OBRA / EXTRA |
| `descripcion` | CharField(200) | |
| `producto` | FK → Producto | null=True |
| `cantidad` | IntegerField | default=1 |
| `precio_unitario` | Decimal(10,2) | |
| `subtotal` | Decimal(10,2) | |
| `aprobado` | BooleanField | default=True; False para EXTRA hasta aprobación |
| `created_by` | FK → CustomUser | |

#### `SolicitudRefaccionExtra`
| Campo | Tipo | Notas |
|-------|------|-------|
| `servicio` | FK → ServicioMoto | |
| `mecanico` | FK → CustomUser | |
| `producto` | FK → Producto | |
| `cantidad` | IntegerField | |
| `motivo` | TextField | |
| `status` | choices | PENDIENTE / APROBADA / RECHAZADA |
| `respondido_por` | FK → CustomUser | null=True |
| `created_at` | auto_now_add | |
| `respondido_at` | null=True | |

---

### Endpoints (`taller/urls.py`)

```
# Órdenes de servicio
POST   /api/taller/servicios/                       Cajero crea orden
GET    /api/taller/servicios/                       Lista paginada (filtros: status, fecha, sede_id)
GET    /api/taller/servicios/<id>/                  Detalle completo
PUT    /api/taller/servicios/<id>/                  Editar (solo status=RECIBIDO)
PATCH  /api/taller/servicios/<id>/asignar/          Jefe asigna mecánico → EN_PROCESO
PATCH  /api/taller/servicios/<id>/listo/            Mecánico termina → LISTO + email
PATCH  /api/taller/servicios/<id>/entregar/         Cajero cobra → ENTREGADO

# Solicitudes de refacción extra
POST   /api/taller/solicitudes-extra/               Mecánico solicita pieza
GET    /api/taller/solicitudes-extra/               Lista por servicio/sede
PATCH  /api/taller/solicitudes-extra/<id>/aprobar/  Cajero aprueba → agrega a ticket + stock
PATCH  /api/taller/solicitudes-extra/<id>/rechazar/ Cajero rechaza

# Motos del cliente
GET    /api/taller/motos-cliente/                   Lista motos (filtros: sede_id, cliente_id)
POST   /api/taller/motos-cliente/                   Crear moto
GET    /api/taller/motos-cliente/<id>/              Detalle
PUT    /api/taller/motos-cliente/<id>/              Editar

# App cliente (CUSTOMER autenticado)
GET    /api/taller/mis-servicios/                   Servicios del cliente autenticado
GET    /api/taller/mis-servicios/<id>/              Detalle
```

**Respuesta de `GET /servicios/`** (paginada, única en el módulo):
```json
{
  "success": true,
  "data": {
    "servicios": [...],
    "pagination": { "total": 12, "page": 1, "page_size": 20, "total_pages": 1 }
  }
}
```

**Lógica clave:**
- **Folio único:** `SVC-YYYYMMDD-NNNN`, se calcula por sede+fecha
- **Aprobar refacción:** usa `@transaction.atomic` + `select_for_update()` + `F('quantity') - cantidad` para decrementar stock atómicamente (igual que ventas)
- **Marcar listo:** envía email con `send_mail()` via Gmail SMTP ya configurado
- **Walk-in:** se puede crear servicio sin cliente registrado (`cliente=null`)

---

## FASE 2 — Frontend Admin (`frontend/`)

### Archivos modificados

#### `src/types/auth.types.ts`
```typescript
// Antes:
role: 'ADMINISTRATOR' | 'ENCARGADO' | 'WORKER' | 'CASHIER' | 'CUSTOMER'

// Después:
role: 'ADMINISTRATOR' | 'ENCARGADO' | 'JEFE_MECANICO' | 'MECANICO' | 'WORKER' | 'CASHIER' | 'CUSTOMER'
```

#### `src/utils/roleUtils.ts`
```typescript
case 'JEFE_MECANICO':  return '/jefe-mecanico';
case 'MECANICO':       return '/mecanico';
```

#### `src/pages/CashierPanel.tsx`
- Nuevo tipo de sección: `'pos' | 'history' | 'servicios'`
- Botón "Taller / Servicios" en el sidebar (ícono Wrench)
- Renderiza `<ServiciosView sedeId={sedeId} />` cuando la sección activa es `'servicios'`

#### `src/components/admin/UserFormModal.tsx`
- `JEFE_MECANICO` y `MECANICO` agregados al array `ROLES`
- Ambos incluidos en `SEDE_REQUIRED` (obligan a seleccionar sede)

#### `src/components/admin/UsersList.tsx`
- `ROLE_LABELS` extendido con `JEFE_MECANICO: 'Jefe Mecánicos'` y `MECANICO: 'Mecánico'`
- Dropdown de filtro incluye los dos roles nuevos

#### `src/styles/DashboardPage.css`
```css
/* Nuevas clases de badge agregadas: */
.role-badge.role-encargado      { background: #faf5ff; color: #805ad5; }
.role-badge.role-jefe_mecanico  { background: #ebf8ff; color: #2b6cb0; }
.role-badge.role-mecanico       { background: #e6fffa; color: #276749; }
```

#### `src/App.tsx`
```tsx
<Route path="/jefe-mecanico" element={
  <ProtectedRoute allowedRoles={['JEFE_MECANICO']}><JefeMecanicoPanel /></ProtectedRoute>
} />
<Route path="/mecanico" element={
  <ProtectedRoute allowedRoles={['MECANICO']}><MecanicoPanel /></ProtectedRoute>
} />
```

---

### Archivos nuevos

#### `src/types/taller.types.ts`
Tipos TypeScript para todo el módulo:
- `ServicioStatus`, `PagoStatus`, `ItemTipo`, `SolicitudStatus`, `MetodoPago`
- `MotoCliente`, `MotoClienteMinimal`
- `ServicioItem`, `SolicitudRefaccionExtra`
- `ServicioMotoList`, `ServicioMotoDetail`
- Payloads: `ServicioCreatePayload`, `ServicioUpdatePayload`, `AsignarMecanicoPayload`, `EntregarServicioPayload`, `SolicitudCreatePayload`
- `ServicioListParams`, `TallerApiResponse<T>`

#### `src/api/taller.service.ts`
Servicio Axios con todos los endpoints:
```typescript
tallerService.listMotos(params)          // GET /motos-cliente/
tallerService.getMoto(id)
tallerService.listServicios(params)      // → retorna ServicioMotoList[] directamente
tallerService.getServicio(id)
tallerService.createServicio(payload)
tallerService.updateServicio(id, payload)
tallerService.asignarMecanico(id, payload)
tallerService.marcarListo(id)
tallerService.entregarServicio(id, payload)
tallerService.listSolicitudes(params)
tallerService.createSolicitud(payload)
tallerService.aprobarSolicitud(id)
tallerService.rechazarSolicitud(id)
tallerService.misServicios()
tallerService.miServicioDetalle(id)
```
> **Nota importante:** `listServicios` extrae el array directamente con
> `r.data?.data?.servicios ?? []` porque el backend usa paginación anidada.
> Todos los demás métodos retornan el envelope `TallerApiResponse<T>` completo.

#### `src/components/taller/ServiciosView.tsx`
- Vista de lista de servicios activos de la sede
- Filtros por status (Todos / Recibidos / En proceso / Cotización extra / Listos)
- Tarjetas con borde de color según status
- Alerta naranja si hay `tiene_extra_pendiente`
- Botón "Nuevo Servicio" → abre `NuevoServicioModal`
- Click en tarjeta → abre `ServicioDetalleModal`

#### `src/components/taller/NuevoServicioModal.tsx`
Modal de 3 secciones con UI mejorada:
1. **Datos de la moto** — marca*, modelo*, año, placa, color
2. **Detalles del servicio** — descripción*, mano de obra ($), entrega estimada, notas internas
3. **Pago al recibir** — checkbox de pago adelantado; si activo → botones de método de pago (Efectivo / Tarjeta / Transferencia)

Diseño: header oscuro con gradiente, tarjetas con icono de sección, transición visual en la sección de pago.

#### `src/components/taller/ServicioDetalleModal.tsx`
- Detalle completo del servicio con timeline de estados
- Tabla de items del ticket (mano de obra + refacciones + extras)
- Totales y estado de pago
- **Acciones por rol:**
  - JEFE_MECANICO: dropdown de mecánicos + botón "Asignar mecánico"
  - MECANICO: botón "✓ Marcar como listo"
  - CASHIER: si COTIZACION_EXTRA → botones Aprobar/Rechazar; si LISTO → formulario de cobro

#### `src/pages/JefeMecanicoPanel.tsx`
- Layout: sidebar con logo + sede + logout
- Área principal: Kanban de 4 columnas (RECIBIDO | EN_PROCESO | COTIZACION_EXTRA | LISTO)
- Polling cada 20 segundos
- Click en tarjeta → `ServicioDetalleModal`

#### `src/pages/MecanicoPanel.tsx`
- Layout tablet-friendly: grid de tarjetas grandes
- Muestra solo servicios asignados al mecánico autenticado
- Acciones rápidas inline: "✓ Listo" y "+ Refacción"
- `SolicitudModal` inline para solicitar piezas extra
- Polling cada 12 segundos

---

## FASE 3 — Frontend Cliente PWA (`frontend-cliente/`)

### Archivos modificados

#### `src/types/customer.types.ts`
```typescript
// Tipos nuevos agregados:
type ServicioStatus = 'RECIBIDO' | 'EN_PROCESO' | 'COTIZACION_EXTRA' | 'LISTO' | 'ENTREGADO'
type PagoStatus = 'PENDIENTE_PAGO' | 'PAGADO'

interface MotoClienteMinimal { marca, modelo, anio, placa, color }

interface ServicioMotoCliente {
  id, folio, status, status_display
  pago_status, pago_status_display
  moto_display, moto: MotoClienteMinimal
  sede_nombre
  descripcion_problema
  mano_de_obra, total_refacciones, total
  tiene_extra_pendiente
  fecha_recepcion, fecha_inicio, fecha_listo, fecha_entrega, fecha_entrega_estimada
}
```

#### `src/api/customers.service.ts`
```typescript
getMisServicios(): Promise<ServicioMotoCliente[]>
  // GET /taller/mis-servicios/ → extrae r.data.data (array)
getMiServicio(id: number): Promise<ServicioMotoCliente>
  // GET /taller/mis-servicios/<id>/ → extrae r.data.data
```

#### `src/components/BottomNav.tsx`
- Tab "Cupones" reemplazado por **"Taller"** (ícono `Wrench`, ruta `/taller`)

#### `src/App.tsx`
```tsx
// Rutas nuevas dentro de MainLayout (requieren autenticación):
<Route path="/taller"     element={<MisServiciosPage />} />
<Route path="/taller/:id" element={<DetalleServicioPage />} />
```

#### `src/pages/HomePage.tsx`
- Nuevo estado `lastServicio: ServicioMotoCliente | null`
- Carga en paralelo con `Promise.allSettled`: compras + servicios
- Muestra tarjeta "Servicio en taller" solo si hay un servicio activo (status ≠ ENTREGADO)
- Borde de color según status + alerta naranja si `tiene_extra_pendiente`

---

### Archivos nuevos

#### `src/pages/MisServiciosPage.tsx`
- Lista de todos los servicios del cliente
- Separados en secciones **"Activos"** e **"Historial"** (entregados)
- Componente `ServicioCard` con:
  - Borde izquierdo de color por status
  - Badge de status con color de fondo
  - Badge naranja "⚠ Cotización" si tiene extra pendiente
  - Folio, moto (display), sede, fecha, total
- Estado vacío con ícono y mensaje informativo

#### `src/pages/DetalleServicioPage.tsx`
- Recibe el servicio via `location.state.srv` (navegación desde lista) o lo carga por ID
- **Línea de tiempo visual** con 5 pasos:
  - ✅ Verde (`CheckCircle`) = paso completado
  - 🔵 Punto azul = paso activo (con descripción)
  - ⚪ Gris (`Circle`) = paso pendiente
  - `COTIZACION_EXTRA` se muestra solo si es el estado actual
- Fecha de cada paso completado (fecha_recepcion, fecha_inicio, fecha_listo, fecha_entrega)
- **Alerta amarilla** si `tiene_extra_pendiente` con instrucción de ir a caja
- Sección "Tu moto": display, placa, sede, fecha estimada
- Sección "Problema reportado": descripción del problema
- Sección "Resumen de costos": mano de obra / refacciones / total + badge de pago

---

## Bug corregido durante implementación

**Error:** `TypeError: servicios.filter is not a function` y `servicios.map is not a function`
en `JefeMecanicoPanel`, `MecanicoPanel` y `ServiciosView`.

**Causa raíz:** El endpoint `GET /api/taller/servicios/` utiliza paginación y retorna:
```json
{ "success": true, "data": { "servicios": [...], "pagination": {...} } }
```
A diferencia del resto de endpoints del sistema que retornan `data: [...]` directamente.

`taller.service.ts` retornaba `r.data` (el envelope completo), y los componentes
hacían `setServicios(res.data)` obteniendo el objeto `{servicios, pagination}` en lugar del array.

**Fix:** `listServicios` extrae el array en la capa de servicio:
```typescript
// taller.service.ts
listServicios(params?): Promise<ServicioMotoList[]> {
  return apiClient.get(`${BASE}/servicios/`, { params })
    .then(r => r.data?.data?.servicios ?? []);
}
// Componentes simplemente reciben el array:
const data = await tallerService.listServicios(params);
setServicios(data);
```

---

## Migraciones

El usuario ejecuta manualmente:
```bash
cd backend
python manage.py makemigrations taller
python manage.py migrate
```

Tablas creadas:
- `taller_motos_cliente`
- `taller_servicios`
- `taller_servicio_items`
- `taller_solicitudes_extra`

---

## Flujo completo del sistema

```
[Cliente llega al taller]
        ↓
[Cajero: CashierPanel → tab "Taller / Servicios"]
[Crea nueva orden: NuevoServicioModal]
  → Registra moto + problema + mano de obra
  → status = RECIBIDO, pago_status = PENDIENTE_PAGO (o PAGADO si paga adelantado)
        ↓
[JefeMecanicoPanel: Kanban]
[Ve la orden en columna RECIBIDO]
[Abre ServicioDetalleModal → asigna mecánico]
  → status = EN_PROCESO
        ↓
[MecanicoPanel: grid de servicios]
[Ve su servicio asignado]
[Si necesita pieza extra → SolicitudModal]
  → status = COTIZACION_EXTRA
  → Cliente ve en app: "Pendiente tu aprobación"
        ↓
[Cajero: ServicioDetalleModal → Aprobar/Rechazar]
  → APROBADA: agrega item al ticket + decrementa stock atómicamente
  → status vuelve a EN_PROCESO
        ↓
[Mecánico: "✓ Marcar como listo"]
  → status = LISTO
  → Se envía email al cliente
        ↓
[Cliente llega, muestra QR]
[Cajero: ServicioDetalleModal → formulario de cobro]
  → Selecciona método de pago + monto
  → pago_status = PAGADO, status = ENTREGADO
        ↓
[Cliente ve en app: ✅ Entregada]
```
