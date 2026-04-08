# Estrategia Offline-First y PWA — MotoQFox

**Fase de implementación**: Fase 5 — ✅ Implementada
**Objetivo**: El POS funciona sin internet; sincroniza automáticamente al reconectar.

---

## Stack Técnico

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| `vite-plugin-pwa` | ^0.22 | Service Worker + manifest automático |
| `workbox` | (incluido) | Estrategias de caché por ruta |
| `dexie` | ^4 | IndexedDB tipado (ventas offline, caché de productos) |
| `workbox-window` | ^7 | Registro del SW desde React |
| React 19 + Vite 7 | — | Stack base del frontend |

---

## Archivos creados / modificados

| Archivo | Descripción |
|---------|-------------|
| `frontend/vite.config.ts` | `VitePWA` con manifest, íconos y Workbox runtimeCaching |
| `frontend/index.html` | Meta tags PWA (theme-color, apple-touch-icon, description) |
| `frontend/public/icon-192.png` | Ícono PWA 192×192 |
| `frontend/public/icon-512.png` | Ícono PWA 512×512 |
| `frontend/src/db/localDB.ts` | Dexie DB: tablas `ventas`, `productos`, `syncQueue` |
| `frontend/src/hooks/useNetworkStatus.ts` | Hook que detecta `online/offline/syncing` |
| `frontend/src/hooks/useRegistrarVenta.ts` | Hook que registra ventas (online → API, offline → IndexedDB) |
| `frontend/src/components/common/NetworkStatusBadge.tsx` | Badge visual de estado de red en el topbar |
| `frontend/src/pages/CashierPanel.tsx` | Integra badge + carga caché de productos al abrir caja |

---

## Arquitectura

```
ONLINE:
  Cajero → POSView → useRegistrarVenta → salesService → Django API → PostgreSQL
                                      ↓ (también)
                                  IndexedDB (caché de productos pre-cargado)

OFFLINE:
  Cajero → POSView → useRegistrarVenta → IndexedDB (LocalVenta + SyncQueueItem)
                                      ↓ (al reconectar)
                                  sincronizarPendientes() → Django API → PostgreSQL
```

---

## Schema de Base de Datos Local (Dexie)

```typescript
// frontend/src/db/localDB.ts

interface LocalVenta {
  localId:       string;      // UUID generado en cliente
  serverId?:     number;      // ID servidor post-sync
  sedeId:        number;
  items:         CartItem[];
  metodoPago:    MetodoPago;
  subtotal:      number;
  descuento:     number;
  total:         number;
  montoRecibido: number;
  cambio:        number;
  timestamp:     string;      // ISO 8601
  status:        'pending' | 'synced' | 'error';
  syncError?:    string;
}

interface LocalProducto {
  id:            number;
  sku:           string;
  name:          string;
  price:         string;
  categoria_name: string | null;
  isActive:      boolean;
  cachedAt:      string;
}

interface SyncQueueItem {
  id?:       number;          // autoincrement
  localId:   string;
  datos:     VentaPayload;    // payload exacto para reenviar al API
  timestamp: number;
  intentos:  number;          // máx 5, luego status='error'
  status:    'pending' | 'processing' | 'error';
}
```

---

## Hook: `useNetworkStatus`

```typescript
// frontend/src/hooks/useNetworkStatus.ts
const { status, isOnline, isOffline } = useNetworkStatus();
// status: 'online' | 'offline' | 'syncing'
```

---

## Hook: `useRegistrarVenta`

```typescript
// frontend/src/hooks/useRegistrarVenta.ts
const { registrarVenta, sincronizarPendientes } = useRegistrarVenta();

// Online → salesService.createVenta(payload) normal
// Offline → guarda en IndexedDB, retorna { success: true, offline: true }
// Al reconectar → sincronizarPendientes() se llama automáticamente
```

---

## Caché de productos

Al abrir la caja (`handleAbierta`), el `CashierPanel` llama `poblarCacheProductos()`:

```typescript
await inventoryService.listProducts({ is_active: true, page_size: 500, sede_id: sedeId });
await db.productos.bulkPut(productos.map(p => ({ ...p, cachedAt: now })));
```

Esto rellena `IndexedDB > productos` con hasta 500 productos de la sede. Si el POSView se adapta para leer de IndexedDB cuando `isOffline`, el catálogo sigue disponible sin red.

---

## Estrategia de Caché Workbox por Ruta

| Ruta | Estrategia | TTL | Descripción |
|------|-----------|-----|-------------|
| `/api/inventory/products/` | NetworkFirst | 1 hora | Catálogo de productos |
| `/api/branches/` | NetworkFirst | 24 horas | Config de sedes |
| `*.{js,css,html,png,svg}` | CacheFirst (precache) | Build hash | Assets del app |

---

## Flujo de Sincronización al Reconectar

```
[Internet regresa]
       │
       ▼
useNetworkStatus() → isOnline = true
       │
       ▼
useRegistrarVenta → useEffect detecta isOnline + pending > 0
       │
       ▼
sincronizarPendientes():
  Lee syncQueue WHERE status='pending'
  Por cada item:
    POST /api/sales/ventas/ con datos originales
    ├─ OK → venta.status='synced', syncQueue.delete()
    └─ Error → intentos++, si >= 5 → status='error'
       │
       ▼
NetworkStatusBadge actualiza contador cada 5s
```

---

## Resolución de Conflictos de Stock

Si al sincronizar el stock es insuficiente, el servidor retorna `400`. El hook marca la venta como `error` con `syncError` y el badge muestra `Sin conexión · N pendiente(s)`. Pendiente: UI para que el cajero resuelva conflictos manualmente (Fase 6).

---

## Datos que NUNCA van offline

- Reportes y gráficas del dashboard (requieren análisis del servidor)
- Historial completo de ventas (solo las del turno en caché)
- Auditorías de inventario (requieren datos precisos del servidor)
- Módulos de admin/encargado/mecánico (solo online)

---

## Verificación

```bash
# 1. Build de producción
cd frontend && npx vite build
# → genera dist/sw.js y dist/workbox-*.js

# 2. Preview
npm run preview
# → abrir en Chrome → barra de dirección muestra "Instalar app"

# 3. DevTools → Application → Manifest
# → íconos, nombre "MotoQFox POS", start_url "/cashier"

# 4. DevTools → Application → Service Workers
# → "activated and running"

# 5. DevTools → Network → Offline
# → registrar venta → se guarda localmente
# → badge muestra "Sin conexión · 1 pendiente"

# 6. Desactivar Offline
# → badge vuelve a "En línea"
# → venta se sincroniza automáticamente

# 7. DevTools → Application → IndexedDB → MotoQFoxDB
# → tablas: ventas, productos, syncQueue
```

---

## Instalación de dependencias

```bash
cd frontend
npm install dexie vite-plugin-pwa workbox-window
# (sharp es solo devDependency, para generar íconos PNG)
npm install --save-dev sharp
```
