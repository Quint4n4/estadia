---
name: db-query-audit
description: Audita queries y modelos Django de MotoQFox para detectar problemas de escalabilidad, N+1 queries, índices faltantes y patrones que se romperán con volumen. Úsala al revisar modelos, managers, viewsets o cuando menciones "lento", "performance", "escala", "N+1", "índice".
allowed-tools: Read, Grep, Glob
---

# Database Query Audit — MotoQFox

Analiza los modelos y queries del ORM de Django en busca de problemas de escalabilidad. Reporta cada hallazgo con:

**PERF-XXX** | Impacto: ALTO/MEDIO/BAJO | Archivo: `ruta:línea`
- Problema: descripción
- Evidencia: `código`
- Fix: solución con código de ejemplo

---

## 1. N+1 Queries

- Buscar bucles `for item in queryset:` donde dentro se accede a relaciones FK o M2M
- Verificar que `VentaItem` con `Venta` usa `select_related('venta', 'producto')`
- Confirmar que listados de Stock usan `select_related('producto', 'sede')`
- Revisar `LoginAuditLog` y `AperturaCaja` que tienen FK a usuarios y sedes
- Buscar serializers anidados que generan queries adicionales sin `select_related`

## 2. select_related y prefetch_related

- Verificar que ViewSets que retornan listas tienen `.select_related()` en el queryset base
- Confirmar que relaciones M2M (fitment de productos, moto catalog) usan `prefetch_related`
- Revisar que el `get_queryset()` de cada ViewSet incluye las relaciones necesarias
- Buscar `.all()` o `.filter()` sin optimización en serializers anidados

## 3. Índices Faltantes

Verificar que estos campos tienen `db_index=True` o están en `indexes` del Meta:
- `CustomUser.email` (campo de login)
- `Stock.producto + sede` (búsqueda frecuente en POS)
- `Venta.sede + created_at` (reportes por sede y fecha)
- `AperturaCaja.cajero + status` (constraint unique + consulta frecuente)
- `CodigoApertura.sede + created_at` (validación de vigencia 30 min)
- `LoginAuditLog.user + timestamp` (SecurityView, audit log)
- `VentaItem.venta` (FK sin índice explícito)

## 4. Queries en Bucles (prohibido)

- Buscar `Model.objects.get()` o `.filter()` dentro de loops Python
- Verificar que la creación de `VentaItems` múltiples usa `bulk_create()`
- Confirmar que actualizaciones masivas de stock usan `bulk_update()` o `F()` expressions
- Revisar que `populate_catalog` usa `bulk_create` con `ignore_conflicts=True`

## 5. Paginación

- Verificar que TODOS los ListAPIViews tienen paginación configurada
- Confirmar que el POS no carga el catálogo completo (debe buscar con filtros)
- Revisar que `SalesHistoryView` y `ReportesCajaView` no retornan registros ilimitados
- Verificar que `MotoCatalogView` pagina por fabricante/año/modelo

## 6. Transacciones y Locks

- Confirmar que `select_for_update()` solo se usa dentro de `@transaction.atomic` (si no, es un error)
- Verificar que el lock de stock no hace lock de rows innecesarios (usar `select_for_update(of=('self',))`)
- Revisar que transacciones largas no incluyen operaciones externas (emails, APIs) dentro del bloque atómico
- Confirmar que `ReporteCaja` PDF se genera FUERA de la transacción de cierre

## 7. Aggregations y Counts

- Buscar `len(queryset)` — debe ser `queryset.count()`
- Buscar `queryset` evaluado para contar — debe usar `.count()` en DB
- Verificar que KPIs del Dashboard usan `aggregate()` y no Python para sumar
- Confirmar que `DashboardCharts` usa queries con `annotate` y no múltiples queries

## 8. Multi-sede y Escalabilidad Futura

- Verificar que TODOS los queries filtran por `sede` cuando el usuario no es ADMINISTRATOR
- Confirmar que no hay queries que carguen datos de todas las sedes para un ENCARGADO/CASHIER/WORKER
- Revisar que el modelo está preparado para particionado por sede en el futuro
- Verificar que `Turno` y `AperturaCaja` están correctamente aislados por sede

---

Al finalizar, genera un resumen con:
- Total de problemas por impacto
- Estimación de cuántos queries extras se generan por request en los endpoints más usados
- Recomendación: ¿el sistema aguanta 10 sedes con volumen moderado SIN cambios? ¿Con qué cambios?
