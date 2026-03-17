---
name: react-typescript-audit
description: Audita el frontend React 19 + TypeScript de MotoQFox buscando problemas de seguridad, tipado incorrecto y malas prácticas. Úsala al revisar componentes, contextos, hooks o servicios. También al mencionar "frontend", "componente", "XSS", "tipos", "TypeScript".
allowed-tools: Read, Grep, Glob
---

# React + TypeScript Audit — MotoQFox

Analiza el frontend del proyecto. Reporta cada hallazgo con este formato:

**ISSUE-XXX** | Severidad: ALTA/MEDIA/BAJA | Archivo: `ruta:línea`
- Problema: descripción clara
- Evidencia: `fragmento de código`
- Fix: solución concreta

---

## 1. Seguridad — XSS y Datos

- Buscar `dangerouslySetInnerHTML` — si existe, verificar que el contenido está sanitizado
- Verificar que datos de usuario se renderizan como texto, no como HTML
- Confirmar que `eval()`, `Function()`, o `innerHTML` no se usan con datos externos
- Revisar que URLs construidas dinámicamente validan el protocolo (no `javascript:`)

## 2. Manejo de JWT en el Cliente

- Access token debe estar en `tokenStore` (memoria), nunca en `localStorage.setItem('token', ...)`
- Refresh token solo en `sessionStorage` — verificar que no hay copias en localStorage
- Confirmar que el token no se loguea en `console.log` ni se envía a servicios de analytics
- Verificar que `Authorization: Bearer` se construye desde tokenStore, no desde localStorage

## 3. Tipado TypeScript

- Buscar `any` explícito — cada `any` debe justificarse con un comentario
- Verificar que props de todos los componentes tienen interfaces definidas
- Confirmar que responses de API tienen tipos (`ApiResponse<T>`) y no se usan como `any`
- Revisar que los roles de usuario (`ADMINISTRATOR`, `ENCARGADO`, `WORKER`, `CASHIER`, `CUSTOMER`) son tipos literales, no strings libres
- Verificar que `useEffect` dependencies arrays están completos (sin warnings de exhaustive-deps)

## 4. Contextos y Estado Global

- Confirmar que `AuthContext` no expone el token directamente en el valor del contexto
- Verificar que al logout se limpia TODO el estado: tokenStore, sessionStorage, contextos
- Revisar que el polling del WorkerPanel (6s) se cancela correctamente en el cleanup de useEffect
- Confirmar que múltiples tabs no comparten estado de caja (sessionStorage por tab)

## 5. Manejo de Errores

- Verificar que errores de API se muestran al usuario sin exponer stack traces o detalles internos
- Confirmar que componentes críticos (POSView, PaymentModal) tienen error boundaries
- Revisar que llamadas a API tienen manejo de timeout y error de red
- Confirmar que 401 redirige al login correctamente (interceptor de Axios)

## 6. Rutas y Protección

- Verificar que `ProtectedRoute` valida el rol correctamente para cada ruta
- Confirmar que `/admin` solo ADMINISTRATOR, `/encargado` solo ENCARGADO, etc.
- Revisar que rutas públicas (`/login`, `/forgot-password`, `/reset-password`) no redirigen a datos privados
- Verificar que la restauración F5 (refresh token en sessionStorage) no expone rutas protegidas momentáneamente

## 7. Componentes del POS

- `POSView`: verificar que la búsqueda no envía requests con strings vacíos
- `PaymentModal`: confirmar que el monto no puede ser negativo o cero
- `CajaClosedScreen`: verificar que no permite operaciones sin caja abierta
- `SalesHistoryView`: confirmar paginación y que no carga toda la historia de una vez

## 8. Performance y Memory Leaks

- Buscar `setInterval`/`setTimeout` sin `clearInterval`/`clearTimeout` en cleanup
- Verificar que subscripciones y listeners se limpian en el return del useEffect
- Revisar que el polling de WorkerPanel usa `AbortController` o se cancela en unmount
- Confirmar que imágenes de productos tienen dimensiones definidas (evitar layout shift)

---

Al finalizar, genera un resumen con:
- Total de issues por severidad
- Los 3 más críticos a resolver primero
- Estado general del tipado: DÉBIL / ACEPTABLE / FUERTE
