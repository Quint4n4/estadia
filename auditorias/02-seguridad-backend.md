# Seguridad Backend — Auditoría Django/DRF

**Fecha:** 2026-03-17
**Archivos auditados:** sales/views.py, users/views.py, inventory/views.py, taller/views.py, sales/permissions.py, sales/serializers.py, settings.py

---

## Resumen

| Severidad | Cantidad |
|-----------|---------|
| ALTA | 2 |
| MEDIA | 8 |
| BAJA | 3 |
| **Total** | **13** |

---

## Vulnerabilidades ALTAS

### VULN-001 — VentaListCreateView sin filtro de sede ✅ CORREGIDO

**Archivo:** `backend/sales/views.py` líneas 59-83
**Riesgo:** CASHIER de Sede A puede listar y ver totales de ventas de Sede B pasando `?sede_id=X`.

**Antes:**
```python
def get(self, request):
    qs = Venta.objects.select_related(...)
    if sede_id:
        qs = qs.filter(sede_id=sede_id)
    # Sin validar que el usuario pertenezca a esa sede
```

**Después:**
```python
def get(self, request):
    qs = Venta.objects.select_related(...)
    user = request.user
    if not user.is_administrator:
        if user.sede is None:
            return Response({'success': False, 'message': 'Usuario sin sede asignada'}, status=403)
        qs = qs.filter(sede=user.sede)
    # ?sede_id= solo funciona para ADMINISTRATOR
    if sede_id and user.is_administrator:
        qs = qs.filter(sede_id=sede_id)
```

**Beneficio:** Aislamiento completo de datos entre sedes. Cumplimiento del principio de menor privilegio.

---

### VULN-006 — Contraseña en texto plano en email de bienvenida ✅ CORREGIDO

**Archivo:** `backend/users/views.py` función `_send_welcome_email()`
**Riesgo:** Si el servidor SMTP es comprometido o el email es interceptado, las credenciales del nuevo usuario quedan expuestas permanentemente.

**Antes:** El HTML del email incluía una fila `<tr><td>Contraseña</td><td>{{ plain_password }}</td></tr>`

**Después:**
1. El parámetro `plain_password` se ignora completamente
2. Se crea un `PasswordResetToken` con expiración de 1 hora
3. El email incluye un enlace seguro: `/reset-password?token=<uuid>`
4. El usuario establece su propia contraseña en el primer acceso

**Beneficio:** Las credenciales nunca se transmiten por email. Patrón estándar de seguridad (igual al password reset existente).

---

## Vulnerabilidades MEDIAS

### VULN-005 — VentaDetailView sin validación de sede ✅ CORREGIDO

**Archivo:** `backend/sales/views.py`
**Corrección aplicada junto con VULN-001:**
```python
if not user.is_administrator:
    if user.sede is None or venta.sede_id != user.sede_id:
        return Response({'success': False, 'message': 'No tienes permisos para acceder a esta venta'}, status=403)
```

---

### VULN-004 — MotoClienteListView sin restricción de sede ✅ YA ESTABA CORREGIDO

**Archivo:** `backend/taller/views.py` líneas 113-119
El código ya tenía implementado el filtro correcto:
```python
if not user.is_administrator and user.sede:
    qs = qs.filter(Q(cliente__usuario__sede=user.sede) | Q(cliente__isnull=True))
```

---

### VULN-007 — Vistas inventory sin filtro is_active ✅ YA ESTABA CORREGIDO

**Archivo:** `backend/inventory/views.py`
Todas las vistas de catálogo ya filtraban `is_active=True` por defecto:
- `CategoriaListCreateView`, `SubcategoriaListCreateView`, `MarcaFabricanteListCreateView`, `MarcaMotoListCreateView`, `ModeloMotoListCreateView`

---

### VULN-012 — Low stock filter sin restricción de sede ✅ YA ESTABA CORREGIDO

**Archivo:** `backend/inventory/views.py` líneas 432-441
Ya implementado con bifurcación por rol:
- ADMINISTRATOR: ve low stock de todas las sedes
- Otros: solo ve low stock de su sede

---

### VULN-003 — Orden de select_for_update() en cancelación de venta

**Archivo:** `backend/sales/views.py:136`
**Estado:** ⏳ Pendiente (bajo impacto real, patrón incorrecto)
**Fix:** Mover `select_for_update()` antes de modificar el estado de la venta dentro de la transacción.

---

## Vulnerabilidades BAJAS

### VULN-008 — Comparación de rol por string en permissions.py

**Archivo:** `backend/sales/permissions.py:26`
**Estado:** ⏳ Pendiente
**Fix:** Cambiar `request.user.role == 'ADMINISTRATOR'` por `request.user.is_administrator`

---

### VULN-009 — CORS_ALLOWED_ORIGINS hardcodeado

**Archivo:** `backend/config/settings.py`
**Estado:** ⏳ Pendiente (crítico en producción)
**Fix:**
```python
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
```

---

### VULN-013 — Sin max_value en campo descuento

**Archivo:** `backend/sales/serializers.py:57`
**Estado:** ⏳ Pendiente
**Fix:** Agregar `max_value=Decimal('999999')` y validar `descuento <= subtotal` en `validate()`

---

## Puntos positivos de seguridad encontrados

- JWT correctamente implementado (access en memoria, refresh en sessionStorage)
- Account lockout: 5 intentos fallidos = bloqueo 30 minutos
- Password reset con UUID tokens de 1 hora de vigencia
- LoginAuditLog con tracking completo de eventos
- Sin SQL injection (100% ORM, sin raw queries)
- Permisos granulares por rol en todos los endpoints
