# Mejoras del Módulo de Taller

Análisis técnico y plan de tareas para las mejoras solicitadas al flujo del taller.

---

## Mejora 1 — Filtrado de marcas y modelos en nueva orden

### Problema actual
En `NuevoServicioModal.tsx` los campos `marca`, `modelo` y `año` son inputs de texto libre. Esto genera errores tipográficos ("Honday", "kawasaki", "Z400 2024") que ensucian la base de datos y dificultan reportes y búsquedas.

### Solución propuesta
Implementar un selector jerárquico en cascada:
1. **Marca** → dropdown con las marcas que circulan en México (lista estática en frontend)
2. **Modelo** → dropdown filtrado según la marca seleccionada (lista estática por marca)
3. **Año** → input numérico con validación de rango (1990 – año actual)

La lista de marcas/modelos vivirá en un archivo de constantes (`src/constants/motosCatalog.ts`) para no requerir backend adicional. Si en el futuro se quiere extender, puede migrarse a un endpoint.

### Marcas a incluir (mercado mexicano)
Honda, Yamaha, Kawasaki, Suzuki, Italika, Bajaj, TVS, Vento, Carabela, Islo, AKT, UM Motorcycles, Maverick, KTM, Royal Enfield, Dinamo, Benelli, Kymco, Harley-Davidson, BMW Motorrad, Triumph, Ducati, Aprilia.

### Archivos impactados
| Archivo | Cambio |
|---|---|
| `frontend/src/constants/motosCatalog.ts` | **NUEVO** — catálogo estático de marcas y modelos |
| `frontend/src/components/taller/NuevoServicioModal.tsx` | Reemplazar inputs de texto por selects en cascada |

### Tareas
- [ ] **T1.1** Crear `src/constants/motosCatalog.ts` con la estructura `{ marca: string; modelos: string[] }[]` y al menos 20 marcas con sus modelos más comunes en México.
- [ ] **T1.2** En `NuevoServicioModal.tsx` (paso `NUEVA_MOTO`): reemplazar el input `marca` por un `<select>` que carga desde el catálogo.
- [ ] **T1.3** Reemplazar el input `modelo` por un `<select>` que se filtra dinámicamente al cambiar la marca. Si la marca tiene modelos, se muestra select; si el modelo no está en la lista, habilitar un campo "Otro modelo" para captura libre.
- [ ] **T1.4** Validar que el campo `año` acepte solo valores entre 1990 y el año actual.
- [ ] **T1.5** Mantener compatibilidad con motos existentes (si la moto ya está registrada en el sistema se muestra como está, sin forzar re-selección).

---

## Mejora 2 — Precio automático por tipo de servicio y cotización extra

### Problema actual

**2a — Precio automático:**
Al seleccionar un servicio del catálogo (`CatalogoServicio`) en el modal, el precio (`precio_base` o el override por sede via `PrecioServicioSede`) **no se aplica automáticamente** al campo `manoDeObra`. El usuario lo tiene que escribir manualmente.

**2b — Cotización extra:**
El status `COTIZACION_EXTRA` ya existe en el modelo y el flujo ya funciona en backend (el mecánico solicita una refacción extra → la orden pasa a COTIZACION_EXTRA → recepción aprueba/rechaza). Sin embargo, el modal de detalle (`ServicioDetalleModal.tsx`) no muestra claramente:
- Las solicitudes de cotización extra pendientes
- El costo adicional acumulado (ítems tipo `EXTRA`)
- Un resumen financiero que diferencie: mano de obra base + refacciones originales + extras aprobados

### Solución propuesta

**2a — Precio automático:**
- Al seleccionar un servicio del catálogo, consultar si existe un `PrecioServicioSede` para esa sede.
- Si existe → usar `precio_override`; si no → usar `precio_base`.
- Si el servicio no tiene precio (`precio_base = null`) → dejar `manoDeObra` en blanco con un mensaje: _"El precio se definirá en el diagnóstico"_.
- El campo `manoDeObra` seguirá siendo editable para ajustes.

**2b — Cotización extra (ServicioDetalleModal):**
- Agregar sección **"Cotizaciones extra"** en el modal de detalle, visible cuando `status === 'COTIZACION_EXTRA'` o cuando `solicitudes_extra.length > 0`.
- Mostrar tabla con: producto solicitado, cantidad, motivo, estado (Pendiente / Aprobada / Rechazada).
- Para recepción: botones Aprobar / Rechazar por solicitud.
- **Resumen financiero** al pie del modal:
  - Mano de obra: `$X`
  - Refacciones originales: `$X`
  - Extras aprobados: `$X`
  - **Total: `$X`**

### Archivos impactados
| Archivo | Cambio |
|---|---|
| `frontend/src/components/taller/NuevoServicioModal.tsx` | Auto-llenar precio al seleccionar servicio del catálogo |
| `frontend/src/api/catalogo-servicios.service.ts` | Agregar llamada a `PrecioServicioSede` si no existe |
| `frontend/src/components/taller/ServicioDetalleModal.tsx` | Sección de cotización extra + resumen financiero desglosado |
| `frontend/src/api/taller.service.ts` | Verificar que `aprobarSolicitud` / `rechazarSolicitud` existen (ya existen) |

### Tareas
- [ ] **T2.1** En `NuevoServicioModal.tsx`: al seleccionar un servicio del catálogo, llamar a `GET /api/catalogo-servicios/<id>/` para obtener `precio_base`. Opcionalmente, consultar `PrecioServicioSede` por `sede_id` para obtener el override.
- [ ] **T2.2** Si el precio obtenido es válido, rellenarlo automáticamente en el campo `manoDeObra` y marcar el campo con un indicador visual ("precio del catálogo"). El campo permanece editable.
- [ ] **T2.3** Si `precio_base` es null, mostrar un badge/aviso: _"Sin precio en catálogo — se definirá en diagnóstico"_ y dejar `manoDeObra` vacío.
- [ ] **T2.4** En `ServicioDetalleModal.tsx`: agregar sección **"Cotización extra"** que muestre `solicitudes_extra` con sus campos (producto, cantidad, motivo, status).
- [ ] **T2.5** Para rol cajero/encargado y status `COTIZACION_EXTRA`: mostrar botones **Aprobar** / **Rechazar** por cada solicitud pendiente, llamando a `tallerService.aprobarSolicitud(id)` / `rechazarSolicitud(id)`.
- [ ] **T2.6** Agregar bloque de **Resumen financiero desglosado** al pie del modal: mano de obra, refacciones originales (`items` tipo REFACCION), extras aprobados (`items` tipo EXTRA), y total.
- [ ] **T2.7** Actualizar el total visible del modal en tiempo real cuando se aprueba o rechaza una solicitud extra (llamar `onUpdated` tras aprobar/rechazar).

---

## Mejora 3 — Jefe de mecánico puede tomar órdenes

### Problema actual
`AsignarMecanicoView` en `views.py` (línea 293) filtra al asignado con `role='MECANICO'`. Esto impide que el jefe de mecánicos (`role='JEFE_MECANICO'`) se asigne a sí mismo una orden, lo cual es necesario cuando el taller tiene poco personal.

### Solución propuesta
Modificar `AsignarMecanicoView` para que:
- Si el `mecanico_id` enviado corresponde al propio usuario jefe, se permita la asignación (auto-asignación).
- Si corresponde a otro usuario, ese usuario debe tener `role='MECANICO'` (comportamiento actual).
- Agregar campo `es_jefe_asignado` (o simplemente confiar en el rol) en el serializer de respuesta para que el frontend pueda distinguirlo si es necesario.

En el frontend, el dropdown de selección de mecánico en `ServicioDetalleModal.tsx` (que carga desde `usersService`) debe incluir al propio jefe en la lista.

### Archivos impactados
| Archivo | Cambio |
|---|---|
| `backend/taller/views.py` | `AsignarMecanicoView` — permitir auto-asignación del jefe |
| `frontend/src/components/taller/ServicioDetalleModal.tsx` | Incluir al jefe en la lista de mecánicos asignables |

### Tareas
- [ ] **T3.1** En `backend/taller/views.py`, `AsignarMecanicoView.patch()` (línea ~293): cambiar la validación de rol para que acepte `role IN ('MECANICO', 'JEFE_MECANICO')`, pero solo si el usuario con `JEFE_MECANICO` es el mismo que hace la solicitud (auto-asignación) o si es un ADMINISTRATOR.
- [ ] **T3.2** Asegurarse de que la validación de `sede` siga aplicando (el jefe solo puede asignarse en su propia sede).
- [ ] **T3.3** En `frontend/src/components/taller/ServicioDetalleModal.tsx`: la lista que carga los mecánicos disponibles (actualmente filtra `role='MECANICO'`) debe incluir también usuarios con `role='JEFE_MECANICO'` de la misma sede.
- [ ] **T3.4** En la tarjeta kanban del `JefeMecanicoPanel`, mostrar un indicador visual diferente cuando el propio jefe es el mecánico asignado (ej.: badge "Jefe" en lugar del nombre de mecánico).

---

## Mejora 4 — Panel del mecánico: rediseño visual + diagnóstico con solicitud de refacciones

### Problema actual

**4a — Visual:**
El `MecanicoPanel.tsx` muestra un grid de tarjetas con estilos en línea (inline styles). Es funcional pero visualmente denso y poco jerarquizado. Las acciones rápidas (botones) están en la tarjeta misma mezclados con la información.

**4b — Diagnóstico bloqueado:**
Actualmente un mecánico puede crear `SolicitudRefaccionExtra` solo durante `EN_PROCESO` o `COTIZACION_EXTRA` (validado en `SolicitudRefaccionExtraCreateSerializer`, línea 116). Durante `EN_DIAGNOSTICO` no puede solicitar refacciones adicionales, lo que obliga al flujo: iniciar reparación → solicitar refacción, cuando debería ser posible solicitar desde el diagnóstico.

**4c — Orden no sale de diagnóstico sin autorización:**
El flujo actual permite al mecánico hacer clic en "Iniciar reparación" (→ `EN_PROCESO`) sin que recepción autorice. Se requiere que si el mecánico detecta fallas adicionales durante el diagnóstico, la orden quede bloqueada en `COTIZACION_EXTRA` hasta que recepción autorice el presupuesto.

### Solución propuesta

**4a — Rediseño visual:**
- Organizar las tarjetas con secciones claras: cabecera (moto + folio), cuerpo (descripción + mecánico asignado), pie (estado + acción principal).
- Separar visualmente las acciones según el estado: usar un único botón de acción principal prominente por tarjeta, con color semántico (azul = acción neutra, verde = completar, naranja = atención).
- Agregar una barra superior con resumen numérico: "X en proceso · X en diagnóstico · X listos para entregar".

**4b — Solicitud de refacciones durante diagnóstico:**
- Modificar `SolicitudRefaccionExtraCreateSerializer` en backend para que también permita la solicitud cuando `status='EN_DIAGNOSTICO'`.
- Al crear la solicitud en diagnóstico, el servicio transiciona a `COTIZACION_EXTRA` (mismo comportamiento que en EN_PROCESO).
- Agregar botón **"+ Solicitar refacción"** en las tarjetas/modal cuando `status === 'EN_DIAGNOSTICO'`.

**4c — Bloqueo en diagnóstico hasta autorización:**
- La transición `EN_DIAGNOSTICO → EN_PROCESO` vía `IniciarReparacionView` seguirá disponible cuando no hay solicitudes pendientes.
- Si hay solicitudes pendientes (`tiene_extra_pendiente = true`), el botón "Iniciar reparación" se deshabilita con tooltip: _"Espera que recepción autorice las refacciones solicitadas"_.
- Esto es validación solo en frontend (el backend ya bloquea con `COTIZACION_EXTRA`).

### Archivos impactados
| Archivo | Cambio |
|---|---|
| `frontend/src/pages/MecanicoPanel.tsx` | Rediseño visual completo de tarjetas + barra de resumen |
| `backend/taller/serializers.py` | `SolicitudRefaccionExtraCreateSerializer` — permitir status `EN_DIAGNOSTICO` |
| `backend/taller/views.py` | `SolicitudRefaccionExtraListView.post()` — transicionar a `COTIZACION_EXTRA` también desde `EN_DIAGNOSTICO` |
| `frontend/src/pages/MecanicoPanel.tsx` | Botón solicitar refacción disponible en `EN_DIAGNOSTICO` |
| `frontend/src/pages/MecanicoPanel.tsx` | Deshabilitar "Iniciar reparación" si hay solicitudes pendientes |

### Tareas
- [ ] **T4.1** **Backend** — `serializers.py`, `SolicitudRefaccionExtraCreateSerializer` (línea ~116): agregar `'EN_DIAGNOSTICO'` a los estados permitidos para crear solicitudes.
- [ ] **T4.2** **Backend** — `views.py`, `SolicitudRefaccionExtraListView.post()` (línea ~656): asegurar que la transición a `COTIZACION_EXTRA` también aplica cuando el servicio viene de `EN_DIAGNOSTICO`.
- [ ] **T4.3** **Frontend** — `MecanicoPanel.tsx`: agregar barra de resumen numérico al tope del contenido con conteos por estado.
- [ ] **T4.4** **Frontend** — `MecanicoPanel.tsx`: rediseñar tarjetas con secciones claras (cabecera / cuerpo / pie), jerarquía tipográfica, y botón de acción único prominente.
- [ ] **T4.5** **Frontend** — `MecanicoPanel.tsx`: mostrar el botón **"+ Solicitar refacción"** también cuando `status === 'EN_DIAGNOSTICO'`.
- [ ] **T4.6** **Frontend** — `MecanicoPanel.tsx`: deshabilitar el botón **"Iniciar reparación"** (y mostrar tooltip) cuando `tiene_extra_pendiente === true`.
- [ ] **T4.7** **Frontend** — `MecanicoPanel.tsx`: agregar estado `ENTREGADO` en el panel para mostrarlo sin acción (solo lectura, con indicador visual de completado).

---

## Resumen de impacto por capa

### Backend
| Archivo | Mejoras que lo modifican |
|---|---|
| `backend/taller/views.py` | M3 (auto-asignación jefe), M4 (diagnóstico → COTIZACION_EXTRA) |
| `backend/taller/serializers.py` | M4 (permitir solicitud en EN_DIAGNOSTICO) |

### Frontend
| Archivo | Mejoras que lo modifican |
|---|---|
| `frontend/src/constants/motosCatalog.ts` | M1 (nuevo archivo) |
| `frontend/src/components/taller/NuevoServicioModal.tsx` | M1 (selects en cascada), M2a (precio automático) |
| `frontend/src/components/taller/ServicioDetalleModal.tsx` | M2b (cotización extra + resumen), M3 (jefe en dropdown) |
| `frontend/src/pages/MecanicoPanel.tsx` | M4 (rediseño visual + diagnóstico) |

### Sin cambios de backend necesarios
- M1: solo frontend (catálogo estático)
- M2b: el backend ya tiene los endpoints `aprobarSolicitud` / `rechazarSolicitud`
- M3 frontend: incluir jefe en lista de mecánicos

---

## Orden de implementación sugerido

```
M3 backend (T3.1, T3.2)           ← cambio pequeño, alto impacto
M1 (T1.1 → T1.5)                  ← independiente, no rompe nada existente
M4 backend (T4.1, T4.2)           ← habilita el flujo de diagnóstico correcto
M2a (T2.1 → T2.3)                 ← mejora UX al crear órdenes
M2b (T2.4 → T2.7)                 ← requiere M4 backend para solicitudes en diagnóstico
M3 frontend (T3.3, T3.4)          ← requiere M3 backend
M4 frontend (T4.3 → T4.7)         ← último, rediseño visual
```
