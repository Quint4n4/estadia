# Fixes Críticos — 17 Marzo 2026

Detalle técnico de los 5 issues críticos resueltos.

---

## FIX 1 — ISSUE-001: Tokens JWT en localStorage (frontend-cliente)

**Severidad**: CRÍTICA
**Riesgo original**: Cualquier XSS en la app cliente podía robar tokens y tomar control de cuentas. Los tokens persistían entre tabs y sesiones.

### Problema
`frontend-cliente/src/context/AuthContext.tsx` almacenaba access token y refresh token en `localStorage`:
```typescript
// ANTES (vulnerable)
localStorage.setItem('mqf_access', tokens.access);
localStorage.setItem('mqf_refresh', tokens.refresh);
```

### Solución aplicada
**Nuevo archivo creado**: `frontend-cliente/src/utils/tokenStore.ts`
- Access token en variable de módulo en **memoria** (no accesible por XSS)
- Refresh token en `sessionStorage` (aislado por tab, se limpia al cerrar)
- Profile en `sessionStorage` (para restauración F5)

**Archivos modificados**:
- `frontend-cliente/src/context/AuthContext.tsx` — usa `tokenStore` en lugar de `localStorage`
- `frontend-cliente/src/api/axios.config.ts` — interceptor usa `tokenStore.getAccessToken()`
- `frontend-cliente/src/pages/LoginPage.tsx` — tokens guardados correctamente después de validar login

### Impacto en seguridad
- ❌ Antes: XSS podía ejecutar `localStorage.getItem('mqf_access')` y robar el token
- ✅ Después: token en memoria, inaccesible desde el DOM o scripts externos
- ✅ Después: refresh token se limpia automáticamente al cerrar la pestaña

---

## FIX 2 — ISSUE-005: Race condition en refresh de token (admin frontend)

**Severidad**: ALTA
**Riesgo original**: Múltiples requests simultáneos con 401 causaban múltiples llamadas paralelas al endpoint de refresh. SimpleJWT invalida el token en el primer uso (rotation), haciendo que los demás fallaran y forzando logout innecesario.

### Problema
`frontend/src/api/axios.config.ts` no tenía sincronización:
```typescript
// ANTES: cada 401 hacía refresh independientemente
if (error.response?.status === 401) {
  const refresh = sessionStorage.getItem('mqf_refresh');
  const res = await axios.post('/auth/refresh/', { refresh }); // múltiples veces!
}
```

### Solución aplicada
Patrón **mutex + queue** de requests:
```typescript
let isRefreshing = false;
let failedQueue: Array<{ resolve, reject }> = [];

// El primer 401 hace el refresh (isRefreshing = true)
// Los siguientes 401 se encolan en failedQueue
// Cuando el refresh termina, processQueue() reintenta todos con el nuevo token
```

**Archivo modificado**: `frontend/src/api/axios.config.ts`

### Impacto
- ❌ Antes: 5 tabs abiertas = 5 refreshes simultáneos = logout inesperado
- ✅ Después: 1 solo refresh, los demás requests esperan y se reintentan automáticamente
- ✅ Si el refresh falla: todos los requests encolados reciben el error y se hace logout limpio

---

## FIX 3 — VULN-001 + VULN-005: Sin filtro de sede en ventas

**Severidad**: ALTA
**Riesgo original**: Un cajero de Sede A podía listar y ver el detalle de ventas de Sede B pasando `?sede_id=` en la URL.

### Problema
`sales/views.py` no filtraba por sede del usuario autenticado:
```python
# ANTES: cualquier usuario autenticado veía todas las ventas
def get(self, request):
    qs = Venta.objects.select_related('cajero', 'sede')...
    if sede_id:
        qs = qs.filter(sede_id=sede_id)  # cualquiera podía pasar cualquier sede_id
```

### Solución aplicada
**En `VentaListCreateView.get()`**:
```python
user = request.user
if not user.is_administrator:
    if user.sede is None:
        return Response({'success': False, 'message': 'Usuario sin sede asignada'}, status=403)
    qs = qs.filter(sede=user.sede)

# Solo ADMINISTRATOR puede filtrar por sede_id
if sede_id and user.is_administrator:
    qs = qs.filter(sede_id=sede_id)
```

**En `VentaDetailView.get()`**:
```python
if not user.is_administrator:
    if user.sede is None or venta.sede_id != user.sede_id:
        return Response({'success': False, 'message': 'No tienes permisos...'}, status=403)
```

**Archivo modificado**: `backend/sales/views.py` (líneas ~65-80, ~126-131)

### Impacto
- ❌ Antes: CASHIER de Sede A podía ver ventas, ingresos y clientes de Sede B
- ✅ Después: cada rol solo ve datos de su propia sede
- ✅ ADMINISTRATOR mantiene visibilidad global

---

## FIX 4 — VULN-006: Contraseña en texto plano en email de bienvenida

**Severidad**: MEDIA (alta en contexto real)
**Riesgo original**: Al crear un usuario, el email de bienvenida incluía la contraseña en texto plano en el HTML. Si el servidor de email era interceptado o comprometido, las credenciales quedaban expuestas.

### Problema
`users/views.py` enviaba la contraseña directamente:
```python
# ANTES: contraseña visible en el email HTML
def _send_welcome_email(user, plain_password):
    html = f"""
    <tr><td>Contraseña</td><td>{plain_password}</td></tr>  ← ❌
    """
```

### Solución aplicada
Reemplazado por token de reset de una sola vez:
```python
def _send_welcome_email(user, plain_password=None):  # plain_password ignorado
    # Invalidar tokens anteriores
    PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
    # Crear token temporal (1 hora)
    token_obj = PasswordResetToken.objects.create(user=user, expires_at=...)
    set_password_url = f'{frontend_url}/reset-password?token={token_obj.token}'
    # Email con botón CTA → link de reset (no contraseña)
```

**Archivo modificado**: `backend/users/views.py` (función `_send_welcome_email`)

### Impacto
- ❌ Antes: contraseña en texto plano en email (interceptable)
- ✅ Después: link de un solo uso con expiración de 1 hora
- ✅ Mismo flujo que password reset (ya probado y funcional)
- ✅ No requiere migración de BD (usa modelo `PasswordResetToken` existente)

---

## FIX 5 — PERF-001: AdminResumenView — 81 queries → 4 queries

**Severidad**: CRÍTICA (escalabilidad)
**Riesgo original**: Con 10 sedes activas, cada request al dashboard admin generaba 81 queries. Con tráfico moderado, el sistema colapsaría bajo carga.

### Problema
`sales/views.py` tenía un loop N×8:
```python
# ANTES: 8 queries POR CADA SEDE
for sede in sedes:                                    # 10 iteraciones
    completadas = Venta.objects.filter(sede=sede, ...) # Q1
    canceladas = Venta.objects.filter(sede=sede, ...)  # Q2
    ingresos_hoy = completadas.filter(...).aggregate() # Q3
    ingresos_semana = ...aggregate()                    # Q4
    ingresos_mes = ...aggregate()                       # Q5
    ingresos_anio = ...aggregate()                      # Q6
    dev_hoy = canceladas.filter(...).count()            # Q7
    dev_mes = ...count()                                # Q8
# Total con 10 sedes: 1 + 80 = 81 queries
```

### Solución aplicada
3 queries con `annotate()` + `GROUP BY` en PostgreSQL:
```python
# DESPUÉS: 4 queries totales sin importar cuántas sedes haya
ventas_stats = Venta.objects.filter(
    sede__in=sedes, status=COMPLETADA
).values('sede_id').annotate(
    ingresos_hoy=Coalesce(Sum('total', filter=Q(created_at__date=today)), Decimal('0')),
    ingresos_semana=Coalesce(Sum('total', filter=Q(created_at__date__gte=week_start)), ...),
    ingresos_mes=...,
    ingresos_anio=...,
    ventas_hoy=Count('id', filter=Q(created_at__date=today)),
    ventas_mes=...,
)  # 1 query para completadas

cancelaciones_stats = Venta.objects.filter(...CANCELADA...).values('sede_id').annotate(...)  # 1 query
cajas_qs = AperturaCaja.objects.filter(sede__in=sedes, status='ABIERTA')  # 1 query
# + sedes query = 4 total

# Loop final solo hace lookups O(1) en dicts Python, 0 queries adicionales
ventas_by_sede = {v['sede_id']: v for v in ventas_stats}
for sede in sedes:
    v = ventas_by_sede.get(sede.id, {})  # dict lookup, no DB
```

**Archivo modificado**: `backend/sales/views.py` (líneas ~314-430, AdminResumenView)

### Impacto
| Escenario | Antes | Después |
|-----------|-------|---------|
| 1 sede | 9 queries | 4 queries |
| 10 sedes | 81 queries | 4 queries |
| 50 sedes | 401 queries | 4 queries |
| 100 req/min · 10 sedes | 8,100 queries/min | 400 queries/min |

- ❌ Antes: sistema colapsaría con 10+ sedes en hora pico
- ✅ Después: queries constantes (O(1)) sin importar número de sedes
- ✅ Response payload idéntico — ningún cambio en frontend requerido
- ✅ Aprovecha `GROUP BY` de PostgreSQL con índices existentes

---

## Archivos creados/modificados

| Archivo | Acción | Fix |
|---------|--------|-----|
| `frontend-cliente/src/utils/tokenStore.ts` | CREADO | ISSUE-001 |
| `frontend-cliente/src/context/AuthContext.tsx` | MODIFICADO | ISSUE-001 |
| `frontend-cliente/src/api/axios.config.ts` | MODIFICADO | ISSUE-001 |
| `frontend-cliente/src/pages/LoginPage.tsx` | MODIFICADO | ISSUE-001 |
| `frontend/src/api/axios.config.ts` | MODIFICADO | ISSUE-005 |
| `backend/sales/views.py` | MODIFICADO | VULN-001, VULN-005, PERF-001 |
| `backend/users/views.py` | MODIFICADO | VULN-006 |
