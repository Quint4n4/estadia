import Dexie, { type Table } from 'dexie';
import type { CartItem, MetodoPago, VentaPayload } from '../types/sales.types';
import type { ServicioCreatePayload, EntregarServicioPayload, ServicioStatus } from '../types/taller.types';

// ── Tipos locales — POS ────────────────────────────────────────────────────────

export interface LocalVenta {
  localId:       string;      // UUID generado en el cliente
  serverId?:     number;      // ID del servidor (después de sincronizar)
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

export interface LocalProducto {
  id:             number;
  sku:            string;
  name:           string;
  price:          string;
  categoria_name: string | null;
  isActive:       boolean;
  cachedAt:       string;
}

// ── Tipos locales — Taller ─────────────────────────────────────────────────────

export interface LocalServicio {
  localId:        string;         // UUID cliente (servicios pendientes sin ID server)
  serverId?:      number;         // ID real post-sync
  sedeId:         number;
  clienteNombre?: string;
  motoDisplay?:   string;
  descripcion:    string;
  status:         ServicioStatus;
  pagoStatus:     'PENDIENTE_PAGO' | 'PAGADO';
  total?:         string;
  timestamp:      string;
  syncStatus:     'pending' | 'synced' | 'error';
  syncError?:     string;
  payload:        ServicioCreatePayload;
}

export interface LocalClienteTaller {
  id:       number;
  nombre:   string;
  email:    string;
  telefono: string;
  cachedAt: string;
}

export interface LocalMotoCliente {
  id:            number;
  clienteId:     number;
  marca:         string;
  modelo:        string;
  anio:          number;
  numero_serie:  string;
  placa:         string;
  color:         string;
  clienteNombre: string | null;
  cachedAt:      string;
}

export interface LocalAperturaCaja {
  id:            number;
  sedeId:        number;
  cajeroId:      number;
  fechaApertura: string;
  status:        'ABIERTA' | 'CERRADA';
  cachedAt:      string;
}

// ── SyncQueue genérico ─────────────────────────────────────────────────────────

export type SyncQueuePayload =
  | { tipo: 'venta';                  datos: VentaPayload }
  | { tipo: 'crear_servicio';         datos: ServicioCreatePayload;   localServicioId: string }
  | { tipo: 'entregar_servicio';      datos: EntregarServicioPayload; servicioId: number }
  | { tipo: 'actualizar_diagnostico'; datos: { diagnostico_mecanico?: string; refacciones_requeridas?: string }; servicioId: number }

export interface SyncQueueItem {
  id?:       number;   // autoincrement
  localId:   string;
  /** v2: campo tipado. v1 legacy: puede venir como `datos` (VentaPayload) */
  payload:   SyncQueuePayload;
  timestamp: number;
  intentos:  number;
  status:    'pending' | 'processing' | 'error';
}

// ── Base de datos ──────────────────────────────────────────────────────────────

class MotoQFoxDB extends Dexie {
  ventas!:          Table<LocalVenta,          string>;
  productos!:       Table<LocalProducto,       number>;
  syncQueue!:       Table<SyncQueueItem,       number>;
  servicios!:       Table<LocalServicio,       string>;
  clientes_taller!: Table<LocalClienteTaller,  number>;
  motos_cliente!:   Table<LocalMotoCliente,    number>;
  apertura_caja!:   Table<LocalAperturaCaja,   number>;

  constructor() {
    super('MotoQFoxDB');

    // v1: esquema original — NO modificar
    this.version(1).stores({
      ventas:    'localId, status, sedeId, timestamp',
      productos: 'id, sku, name, isActive',
      syncQueue: '++id, localId, status, timestamp',
    });

    // v2: tablas nuevas para taller + SyncQueueItem genérico
    this.version(2).stores({
      ventas:          'localId, status, sedeId, timestamp',
      productos:       'id, sku, name, isActive',
      syncQueue:       '++id, localId, status, timestamp',
      servicios:       'localId, syncStatus, sedeId, timestamp, serverId',
      clientes_taller: 'id, telefono',
      motos_cliente:   'id, clienteId',
      apertura_caja:   'id, sedeId, cajeroId, status',
    });
  }
}

export const db = new MotoQFoxDB();

// ── Helper: resolver payload de item legado (v1) o nuevo (v2) ─────────────────
export function resolvePayload(item: SyncQueueItem): SyncQueuePayload {
  if (item.payload) return item.payload;
  // Compatibilidad con items v1 que tenían campo `datos` en lugar de `payload`
  const legacy = item as unknown as { datos: VentaPayload };
  return { tipo: 'venta', datos: legacy.datos };
}
