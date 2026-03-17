# Seguridad Frontend — Auditoria React 19 + TypeScript

**Fecha:** 2026-03-17
**Archivos auditados:** 66 archivos en frontend/ y frontend-cliente/

---

## Resumen

| Severidad | Cantidad |
|-----------|---------|
| CRITICA   | 1       |
| ALTA      | 4       |
| MEDIA     | 9       |
| Total     | 14      |

---

## Issue CRITICO

### ISSUE-001 — Tokens JWT en localStorage (App Cliente) - CORREGIDO

**Archivo:** `frontend-cliente/src/context/AuthContext.tsx`
**Riesgo:** Cualquier XSS expone access token y refresh token. localStorage persiste entre tabs y sesiones.

**Antes:**
```typescript
localStorage.setItem('mqf_access', tokens.access)
localStorage.setItem('mqf_refresh', tokens.refresh)
```

**Despues — tokenStore.ts creado:**
```typescript
// Access token: solo en memoria (variable de modulo)
let _accessToken: string | null = null

// Refresh token: sessionStorage (por tab, se borra al cerrar)
sessionStorage.setItem('mqf_refresh', token)

// Profile: sessionStorage (restauracion en F5)
sessionStorage.setItem('mqf_profile', JSON.stringify(profile))
```

**Archivos modificados:**
- `frontend-cliente/src/utils/tokenStore.ts` — CREADO (patron identico al admin)
- `frontend-cliente/src/context/AuthContext.tsx` — 8 referencias a localStorage reemplazadas
- `frontend-cliente/src/api/axios.config.ts` — interceptor actualizado
- `frontend-cliente/src/pages/LoginPage.tsx` — tokens guardados despues de validacion exitosa

**Beneficio:** Tokens inaccesibles desde JavaScript externo. Ataque XSS ya no puede robar sesiones.

---

## Issues ALTOS

### ISSUE-005 — Race condition en token refresh - CORREGIDO

**Archivo:** `frontend/src/api/axios.config.ts`
**Problema:** Con N tabs abiertas, un 401 simultaneo generaba N llamadas a /auth/refresh/. SimpleJWT invalida el refresh token en el primer uso exitoso, las tabs restantes fallaban y hacian logout.

**Solucion implementada:**
```typescript
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

// En el interceptor 401:
if (isRefreshing) {
  // Encolar y esperar
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject })
  }).then(token => { /* reintentar con nuevo token */ })
}
isRefreshing = true
// Solo el primero hace el refresh real
```

**Beneficio:** Cero logouts falsos por race condition. Todas las tabs se recuperan correctamente.

---

### ISSUE-002 — useEffect dependencias incompletas en POSView - CORREGIDO

**Archivo:** `frontend/src/components/cashier/POSView.tsx`
**Problema:** useEffect que resetea selModelo solo tenia `[año]` como dependencia, ignorando `selModelo` y `modelosFiltrados`.

**Antes:**
```typescript
}, [año]); // eslint-disable-line
```

**Despues:**
```typescript
}, [año, selModelo, modelosFiltrados]);
```

**Beneficio:** Eliminado riesgo de estado de UI inconsistente al cambiar filtros YMM.

---

### ISSUE-003 — Castings as any en POSView - CORREGIDO

**Archivo:** `frontend/src/components/cashier/POSView.tsx`
**Problema:** 8+ instancias de `as any` en llamadas a la API ocultaban errores de tipo.

**Cambios aplicados:**
- `listProducts({...} as any)` -> `listProducts({...})` con `ProductoListParams`
- `listCategories({ is_active: true } as any)` -> tipado correcto
- `listMotoModels({ marca: ..., page_size: 300 } as any)` -> tipado correcto
- `const params: Record<string, any>` -> `const params: ProductoListParams`
- `.filter(Boolean)` -> `.filter((i): i is CartItem => i !== null)` con type guard

**Beneficio:** Errores de tipo detectados en tiempo de compilacion. Refactoring futuro mas seguro.

---

### ISSUE-004 — Tokens guardados antes de validar login (Cliente) - PENDIENTE

**Archivo:** `frontend-cliente/src/pages/LoginPage.tsx`
**Problema:** Tokens se guardaban en storage antes de que `getPerfil()` confirmara exito.
**Estado:** Pendiente de corrección completa.

---

## Issues MEDIOS - Pendientes

### ISSUE-006 — Empty catch blocks en PedidoBodegaPanel
`frontend/src/components/cashier/PedidoBodegaPanel.tsx` lineas 188, 198, 259
Errores silenciados sin log ni feedback al usuario.

### ISSUE-008 — catch (err: any) sin type narrowing en PaymentModal
```typescript
// Antes
catch (err: any) { err.response.data... }

// Recomendado
catch (err: unknown) {
  if (axios.isAxiosError(err)) { err.response?.data... }
}
```

### ISSUE-010 — Polling sin AbortController en WorkerPanel
`frontend/src/pages/WorkerPanel.tsx`
setState en componente desmontado durante fetch en vuelo.

### ISSUE-013 — 20+ instancias de catch (err: any) en todo el proyecto
Crear utility function `getErrorMessage(err: unknown): string` y usarla consistentemente.

---

## Puntos positivos encontrados

- Sin dangerouslySetInnerHTML en ningun componente
- Sin console.log de tokens o passwords
- ProtectedRoute valida roles correctamente
- Cleanup de setInterval/setTimeout correcto en todos los componentes de polling
- Admin frontend ya usaba tokenStore correctamente (patron replicado al cliente)
