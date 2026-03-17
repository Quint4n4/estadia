# Reporte UI/UX — Auditoría 17 Marzo 2026

34 hallazgos en 8 áreas. Todos pendientes de implementación.

---

## Dashboard Admin

| ID | Prioridad | Problema | Mejora propuesta |
|----|-----------|----------|-----------------|
| UX-001 | ALTA | KPIs muestran usuarios/sedes/alertas, no salud financiera | Agregar: Ingresos hoy, Ticket promedio, Margen, Tasa devoluciones |
| UX-002 | ALTA | Sin gráfica de tendencias históricas (últimos 7 días) | LineChart de Recharts con ingresos últimos 7 días + comparativa |
| UX-003 | MEDIA | SedeCards sin ingresos del día ni status de cajas | Agregar 2 líneas: ingresos hoy + cajas abiertas (verde/rojo) |
| UX-004 | MEDIA | Gráfica alertas inventario sin contexto de qué productos | Hacer gráfica clicable o agregar tabla de productos específicos |
| UX-005 | BAJA | Jerarquía visual débil entre secciones | Aumentar h2 "Sedes" a 24px, KPIs más compactos |

## Panel Encargado

| ID | Prioridad | Problema | Mejora propuesta |
|----|-----------|----------|-----------------|
| UX-006 | ALTA | Sin alerta si caja lleva >4h abierta | Columna "Abierta hace X min", badge rojo si >240min |
| UX-007 | MEDIA | Sin KPIs de sede en SedeOverview | Card con: Ingresos hoy, Ticket promedio, Devoluciones, % Margen |
| UX-008 | MEDIA | ReportesCajaView con muchas columnas — scroll en tablet | Cards en lugar de tabla en <1200px |
| UX-009 | BAJA | Descarga PDF sin confirmación post-descarga | Toast: "Reporte descargado: reporte_caja_Juan_2026-03-17.pdf" |

## POS (CashierPanel / POSView)

| ID | Prioridad | Problema | Mejora propuesta |
|----|-----------|----------|-----------------|
| UX-010 | ALTA | Ratio 50/50 muy estrecho en 1366px | Cambiar a 60/40 (búsqueda 60%, carrito 40%) |
| UX-011 | ALTA | Debounce 350ms se siente lento | Reducir a 200ms + mostrar últimos resultados mientras carga |
| UX-012 | ALTA | Búsqueda YMM — cambiar marca requiere limpiar todo | Permitir cambiar marca sin perder selección de categoría |
| UX-013 | MEDIA | Carrito vacío sin empty state | Agregar: icono + "El carrito está vacío. Busca productos..." |
| UX-014 | ALTA | PaymentModal no permite editar carrito | Hacer carrito editable dentro del modal |
| UX-015 | ALTA | Input efectivo sin validación en tiempo real | Error inline: "Monto insuficiente. Debe ser ≥ $XXX" (rojo) |
| UX-016 | MEDIA | Botón + cantidad disabled sin tooltip | Tooltip: "Stock máximo alcanzado" |
| UX-017 | BAJA | Descuento sin toggle % vs $ | Toggle + validación si desc > 30% del total |

## Caja Cerrada (CajaClosedScreen)

| ID | Prioridad | Problema | Mejora propuesta |
|----|-----------|----------|-----------------|
| UX-018 | MEDIA | Sin hint de expiración del código | Agregar: "Código válido por 30 minutos. Solicita uno nuevo al encargado." |
| UX-019 | BAJA | Error "Código incorrecto o expirado" no diferencia los casos | Backend devolver error específico: expirado vs inválido |

## Worker Panel

| ID | Prioridad | Problema | Mejora propuesta |
|----|-----------|----------|-----------------|
| UX-020 | MEDIA | Sin botón "Reconectar" cuando offline | Agregar botón + header rojo cuando sin conexión |
| UX-021 | MEDIA | Cards de pedidos muy largas con 10+ items | Scroll interno en card, limitar a 400px + "Ver 5 más" |
| UX-022 | BAJA | Sin botón "Marcar como completado" | Botón Completado → mover a "Completados hoy" |

## Gráficas y Visualizaciones

| ID | Prioridad | Problema | Mejora propuesta |
|----|-----------|----------|-----------------|
| UX-023 | MEDIA | BarChart de sedes colapsa labels con 8+ sedes | ResponsiveContainer adaptivo o BarChart horizontal |
| UX-024 | BAJA | Tablas sin striping visual consistente | Aplicar alternado usando variables CSS existentes |
| UX-025 | MEDIA | Gráficas sin títulos internos | Agregar `<Title>` dentro de `ResponsiveContainer` |

## Accesibilidad

| ID | Prioridad | Problema | Mejora propuesta |
|----|-----------|----------|-----------------|
| UX-026 | ALTA | Inputs sin labels vinculados | Todas las labels con `htmlFor` que coincida con `id` del input |
| UX-027 | MEDIA | Botones solo-icono sin `aria-label` | `<button aria-label="Abrir menú">` en todos los iconos |
| UX-028 | MEDIA | Contraste sidebar borderline (~5:1) | Cambiar text a #ffffff o primary a #003366 |

## Consistencia y Responsive

| ID | Prioridad | Problema | Mejora propuesta |
|----|-----------|----------|-----------------|
| UX-029 | MEDIA | Botones con padding y estilo inconsistente | Clase CSS base `.btn` con valores fijos |
| UX-030 | BAJA | Espaciado entre secciones sin escala sistemática | Variables CSS: 8px, 16px, 24px, 32px |
| UX-031 | ALTA | POSView no responsive en tablet | Media query: flex-column en <1000px |
| UX-032 | MEDIA | Tabla ingresos por sede — scroll horizontal en <1200px | CSS Grid auto-fit o mostrar solo columnas clave en móvil |
| UX-033 | ALTA | Error stock insuficiente sin sugerencia de acción | Mensaje: "Stock insuficiente de X. [Remover] o [Reducir cantidad]" |
| UX-034 | MEDIA | Sesión expirada sin redirección explícita | AuthContext guard que redirige a /login con toast |

---

## Notas positivas encontradas

- Paleta de colores bien definida con variables CSS
- Sidebar navigation con agrupamiento lógico
- CajaClosedScreen con OTP inputs — UX premium (benchmark)
- Recharts responsive con tooltips funcionales
- Flujo de caja con CodigoApertura y countdown elegante
- Componentes encapsulados y reutilizables
