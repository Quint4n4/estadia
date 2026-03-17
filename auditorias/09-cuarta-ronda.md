# Cuarta Ronda de Correcciones — 2026-03-17

Esta ronda resuelve los 12 issues de prioridad BAJA pendientes.
Se usaron 3 agentes en paralelo.

---

## Agente 1 — CSS/Visual Polish (UX-005, UX-024, UX-029, UX-030)

### UX-030 — Sistema de espaciado 8px base
**Archivo:** `frontend/src/styles/DashboardPage.css`

Agregadas 6 variables CSS dentro del bloque `:root` existente:
- `--space-1: 8px`
- `--space-2: 16px`
- `--space-3: 24px`
- `--space-4: 32px`
- `--space-5: 40px`
- `--space-6: 48px`

El espaciado existente en `.dashboard-content` (28px) y `.section-container` (gap: 24px) ya era multiplo de 8px — no modificado.

### UX-005 — Jerarquía de títulos h2 uniformes
**Archivo:** `frontend/src/styles/DashboardPage.css`

Nueva clase `.dashboard-section-title`:
- `font-size: 18px`
- `font-weight: 600`
- `color: #1a202c`
- `margin-bottom: 16px`
- `letter-spacing: -0.3px`

Insertada después de `.section-subtitle`. Esta clase no existía previamente.

### UX-029 — Sistema de botones consistente
**Archivo:** `frontend/src/styles/DashboardPage.css`

Agregada clase `.btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 5px; }` como utilidad adicional.

Las clases `.btn-primary` (padding: 10px 20px) y `.btn-secondary` (padding: 10px 20px) ya existían con valores correctos y no fueron modificadas.

### UX-024 — Striping de filas en tablas de reportes
**Archivo:** `frontend/src/styles/DashboardPage.css`

Cuatro nuevas reglas al final del archivo:
- `.reportes-tabla tbody tr:nth-child(even)` — fondo `#f7fafc`
- `.reportes-tabla tbody tr:hover` — fondo `#ebf8ff` con `transition: 0.15s`
- `.sales-history-table tbody tr:nth-child(even)` — fondo `#f7fafc`
- `.sales-history-table tbody tr:hover` — fondo `#ebf8ff` con `transition: 0.15s`

---

## Agente 2 — UI Feedback (UX-009, UX-025)

### UX-009 — Toast de confirmación al descargar PDF
**Archivo:** `frontend/src/components/encargado/ReportesCajaView.tsx`

Nuevos estados: `toastMsg: string | null` + `toastVisible: boolean`

Helper `showToast(msg, duration)` que activa y auto-oculta el toast via `setTimeout`.

Tres estados del toast en `handleDownload`:
- Inicio: "Descargando PDF..." (azul, 60s — se sobreescribe al completar)
- Éxito: "PDF descargado correctamente ✓" (verde, 3 segundos)
- Error: "Error al descargar el PDF" (rojo, 4 segundos)

Toast renderizado como `position: fixed; bottom: 24px; right: 24px` con `zIndex: 9999` y sombra. Color dinámico según contenido del mensaje.

### UX-025 — Títulos dentro de gráficas Recharts
**Archivo:** `frontend/src/components/admin/dashboard/DashboardCharts.tsx`

**Ya estaba implementado.** Las 3 secciones de gráficas ya tenían elementos `<h4>` con clase `dashboard-chart-title`:
- LineChart: "Tendencia de ingresos — últimos 7 días"
- Tabla ingresos: "Ingresos por sede — {PERIODO}"
- BarChart alertas: "Alertas de inventario por sede"

No requirió cambios.

---

## Agente 3 — Infraestructura (VULN-008 resto, UX-017, CORS, HTTPS)

### VULN-008 resto — Comparaciones de rol por string en taller/pedidos

**`backend/pedidos/views.py`** — Sin comparaciones `user.role`. Usa `getattr(request.user, 'sede', None)`. Limpio.

**`backend/pedidos/permissions.py`** — No existe. Sin issues.

**`backend/taller/views.py`** — 9 comparaciones por string encontradas y corregidas:

| Original | Reemplazo |
|----------|-----------|
| `user.role == 'CUSTOMER'` (×2) | `user.is_customer` |
| `user.role == 'ADMINISTRATOR'` | `user.is_administrator` |
| `user.role == 'MECANICO'` (×3) | `user.is_mecanico` |
| `user.role not in ('ADMINISTRATOR',)` | `not user.is_administrator` |
| `user.role not in ('CASHIER', 'ENCARGADO', 'ADMINISTRATOR')` (×2) | `not (user.is_cashier or user.is_encargado or user.is_administrator)` |
| `user.role not in ('MECANICO', 'JEFE_MECANICO')` | `not (user.is_mecanico or user.is_jefe_mecanico)` |

Nota: `CustomUser.objects.get(role='MECANICO', ...)` en ORM filter — correctamente no modificado.

**`backend/taller/permissions.py`** — Usa `request.user.role in self.ALLOWED` (patrón DRF estándar con constante de clase). Aceptable, sin cambios.

### UX-017 — Umbral warning descuento: 50% → 30%
**Archivo:** `frontend/src/components/cashier/PaymentModal.tsx`

- Línea 54: `descuentoPct > 50` → `descuentoPct > 30`
- Comentario JSX inline actualizado de `> 50%` a `> 30%`

El warning ahora aparece cuando el descuento supera el 30% del subtotal (antes 50%).

### CORS prod — .env.example con configuración Railway
**Archivo creado:** `backend/.env.example`

Contiene todas las variables necesarias para producción:
- `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
- `DATABASE_URL` (PostgreSQL Railway)
- `CORS_ALLOWED_ORIGINS`
- `FRONTEND_URL`
- `EMAIL_*` (Gmail SMTP)
- Secciones opcionales para Sentry y Redis/Celery

Auditoría de `settings.py`: todas las variables críticas ya usaban `os.environ.get` / `django-environ`. Sin secretos hardcodeados.

### HTTPS — Documentación de despliegue Railway
**Archivo creado:** `backend/DEPLOYMENT.md`

Incluye:
- Pasos completos de despliegue en Railway (backend + frontend)
- Snippet Django para forzar HTTPS en producción (`SECURE_SSL_REDIRECT`, `SECURE_HSTS_*`, cookies seguras)
- Nota sobre PDF generation (threading daemon → Celery para alto volumen)
- Checklist pre-producción de 7 puntos

---

## Archivos modificados en esta ronda

**Frontend — estilos (1 archivo):**
- `frontend/src/styles/DashboardPage.css` — UX-005, UX-024, UX-029, UX-030

**Frontend — componentes (2 archivos):**
- `frontend/src/components/encargado/ReportesCajaView.tsx` — UX-009 toast PDF
- `frontend/src/components/cashier/PaymentModal.tsx` — UX-017 threshold 30%

**Backend (1 archivo):**
- `backend/taller/views.py` — VULN-008 resto (9 comparaciones por string)

**Archivos creados (2):**
- `backend/.env.example` — variables de entorno para Railway
- `backend/DEPLOYMENT.md` — guía de despliegue con HTTPS

---

## Estado post cuarta ronda — AUDITORIA COMPLETA

| Prioridad | Total | Corregidos | Pendientes |
|-----------|-------|-----------|------------|
| Critico   | 5     | 5 (100%)   | 0          |
| Alto      | 17    | 17 (100%)  | 0          |
| Medio     | 35    | 35 (100%)  | 0          |
| Bajo      | 12    | 12 (100%)  | 0          |
| **Total** | **69**| **69 (100%)** | **0**  |
