---
name: django-security-audit
description: Audita el backend Django/DRF de MotoQFox buscando vulnerabilidades de seguridad. Úsala cuando revises modelos, views, serializers, endpoints o configuración. También se activa al mencionar "seguridad", "audit", "vulnerabilidad" o "permisos".
allowed-tools: Read, Grep, Glob
---

# Django Security Audit — MotoQFox

Analiza el código Django/DRF del proyecto en busca de vulnerabilidades. Reporta cada hallazgo con este formato:

**VULN-XXX** | Severidad: ALTA/MEDIA/BAJA | Archivo: `ruta:línea`
- Problema: descripción clara
- Evidencia: `fragmento de código`
- Fix: solución concreta

---

## 1. Autenticación y Permisos

- Verificar que todos los ViewSets/APIViews tienen `permission_classes` explícito (nunca vacío)
- Comprobar que `IsEncargadoOrAbove` y `IsCajeroOrAbove` estén aplicados correctamente según el rol requerido
- Revisar que los endpoints de apertura/cierre de caja solo son accesibles por CASHIER+
- Confirmar que ningún endpoint sensible usa `AllowAny` sin justificación
- Verificar que `CodigoApertura` expira en 30 minutos y se valida la misma sede

## 2. JWT y Sesiones

- Access token debe vivir solo en memoria (tokenStore), nunca en localStorage
- Refresh token solo en sessionStorage (aislado por tab)
- Verificar que el logout invalida el refresh token en el backend
- Confirmar que `SIMPLE_JWT` tiene `ACCESS_TOKEN_LIFETIME` corto (< 15 min en producción)
- Revisar que `ROTATE_REFRESH_TOKENS = True` y `BLACKLIST_AFTER_ROTATION = True`

## 3. Operaciones de Stock y Transacciones

- Toda reducción/aumento de stock DEBE usar `select_for_update()` dentro de `@transaction.atomic`
- Buscar operaciones `F('quantity') -` que no estén protegidas con lock
- Verificar que la cancelación de venta restaura stock atómicamente
- Confirmar que no hay race conditions en apertura/cierre de caja

## 4. Validación de Inputs y Serializers

- Revisar que los serializers validan tipos, rangos y longitudes de campos
- Buscar `validated_data` usado directamente sin validación adicional donde sea necesario
- Verificar que IDs de sede en requests se validan contra la sede del usuario autenticado
- Confirmar que `CodigoApertura` de 6 dígitos se valida como entero, no como string libre

## 5. SQL y Queries

- Buscar uso de `.raw()` o `cursor.execute()` con interpolación de strings (SQL injection)
- Verificar que filtros por `request.user` están presentes en queries de datos sensibles
- Confirmar que endpoints de listado tienen paginación (`PageNumberPagination`)

## 6. Configuración de Django (settings)

- `DEBUG` debe ser `False` en producción
- `SECRET_KEY` no debe estar hardcodeada (usar variable de entorno)
- `ALLOWED_HOSTS` debe estar configurado correctamente
- `CORS_ALLOWED_ORIGINS` debe ser lista específica, no `CORS_ALLOW_ALL_ORIGINS = True`
- Verificar que `DATABASES` usa variables de entorno para credenciales

## 7. Exposición de Datos

- Verificar que los serializers no exponen campos sensibles (`password`, `last_login`, tokens)
- Confirmar que errores de API no filtran stack traces en producción
- Revisar que `LoginAuditLog` no registra contraseñas en texto plano

## 8. Soft Delete

- Confirmar que queries en Sedes, Productos, Categorías, Subcategorías filtran `is_active=True`
- Buscar queries que puedan retornar registros inactivos sin querer

---

Al finalizar, genera un resumen con:
- Total de vulnerabilidades por severidad
- Las 3 más críticas a resolver primero
- Estimación de riesgo general: BAJO / MEDIO / ALTO / CRÍTICO
