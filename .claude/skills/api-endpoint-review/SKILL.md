---
name: api-endpoint-review
description: Revisa los endpoints de la API de MotoQFox verificando consistencia de formato, métodos HTTP correctos, permisos, paginación y buenas prácticas REST. Úsala al revisar urls.py, viewsets, o cuando menciones "endpoint", "API", "REST", "consistencia", "respuesta".
allowed-tools: Read, Grep, Glob
---

# API Endpoint Review — MotoQFox

Revisa todos los endpoints del proyecto. Reporta cada problema con:

**API-XXX** | Severidad: ALTA/MEDIA/BAJA | Archivo: `ruta:línea`
- Problema: descripción
- Evidencia: `código`
- Fix: solución concreta

---

## 1. Formato de Response Consistente

Verificar que TODOS los endpoints retornan:
```json
{
  "success": true | false,
  "message": "opcional",
  "data": {} | [],
  "errors": {}
}
```
- Buscar `Response(serializer.data)` directo sin envolver en el formato del proyecto
- Verificar que errores de validación usan `{"success": false, "errors": ...}`
- Confirmar que respuestas 404 y 403 también siguen el formato del proyecto
- Revisar que no hay mezcla de formatos entre diferentes apps

## 2. Métodos HTTP Correctos

- GET: solo lectura, nunca modifica datos
- POST: creación de recursos nuevos
- PUT/PATCH: actualización (PUT completo, PATCH parcial)
- DELETE: eliminación (soft delete en este proyecto)
- Buscar acciones `@action` con método incorrecto (ej: `methods=['GET']` que modifica datos)
- Verificar que apertura/cierre de caja usan POST, no GET

## 3. Códigos de Estado HTTP

- 200: éxito general
- 201: recurso creado
- 400: error de validación del cliente
- 401: no autenticado
- 403: autenticado pero sin permiso
- 404: recurso no encontrado
- Buscar endpoints que devuelven 200 para errores (debería ser 4xx)
- Verificar que creaciones devuelven 201, no 200

## 4. Permisos por Endpoint

Verificar la matriz de permisos del proyecto:

| Acción | Permiso requerido |
|--------|------------------|
| Crear venta | `IsCajeroOrAbove` |
| Abrir caja | `IsCajeroOrAbove` |
| Cerrar caja | `IsCajeroOrAbove` |
| Generar código apertura | `IsEncargadoOrAbove` |
| Ver reportes caja | `IsEncargadoOrAbove` |
| CRUD usuarios | `IsAdministrator` |
| CRUD sedes | `IsAdministrator` |
| Ver pedidos bodega | `IsWorker` o superior |

- Confirmar que cada ViewSet/APIView tiene `permission_classes` definido
- Verificar que permisos no son más permisivos de lo necesario
- Revisar que acciones custom (`@action`) tienen permisos propios si difieren del ViewSet

## 5. Filtrado por Sede

- Verificar que ENCARGADO, WORKER y CASHIER solo ven datos de su propia sede
- Confirmar que `get_queryset()` filtra `sede=request.user.sede` para estos roles
- ADMINISTRATOR debe poder ver todo (sede=null)
- Buscar endpoints donde un usuario podría ver datos de otra sede pasando un ID en el request

## 6. Paginación

- Verificar que TODOS los endpoints de listado tienen paginación
- Confirmar que el page_size por defecto es razonable (máx 50-100 items)
- Revisar que endpoints del POS (búsqueda de productos) tienen límite estricto
- Confirmar que la respuesta de paginación incluye `count`, `next`, `previous`

## 7. Validación de Inputs

- Verificar que IDs en URL se validan como enteros positivos
- Confirmar que campos de fecha aceptan el formato correcto y no strings arbitrarios
- Revisar que `cantidad` en VentaItem no puede ser 0 o negativa
- Verificar que `precio` no puede ser negativo
- Confirmar que `CodigoApertura` de 6 dígitos se valida en el serializer

## 8. URLs y Convenciones REST

- Verificar que las URLs usan sustantivos en plural (`/ventas/`, `/productos/`)
- Confirmar que acciones anidadas son lógicas (`/ventas/{id}/cancelar/`)
- Revisar que no hay verbos en las URLs base (mal: `/crear-venta/`, bien: `POST /ventas/`)
- Verificar que `config/urls.py` tiene todas las apps registradas con su prefijo correcto

## 9. Endpoints de las Apps en Desarrollo

- `billing`: verificar que los endpoints placeholder retornan 501 Not Implemented, no 500
- `customers`: mismo que billing
- `pedidos`: verificar que WorkerPanel polling no genera errores si no hay datos

## 10. Documentación Implícita

- Verificar que cada ViewSet tiene `basename` definido en el router
- Confirmar que acciones custom tienen `url_name` descriptivo
- Revisar que los serializers tienen `help_text` en campos no obvios

---

Al finalizar, genera:
- Lista de endpoints SIN paginación
- Lista de endpoints con permisos potencialmente incorrectos
- Conteo de respuestas que no siguen el formato del proyecto
- Score de consistencia: INCONSISTENTE / PARCIAL / CONSISTENTE
