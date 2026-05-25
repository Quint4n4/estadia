import type { Pagination } from './auth.types';

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
export type VentaStatus = 'COMPLETADA' | 'CANCELADA';

// ── Cart (local state only, never sent to API as-is) ─────────────────────────

export interface CartItem {
  producto_id:   number;
  producto_sku:  string;
  producto_name: string;
  unit_price:    number;   // price at time of adding to cart
  quantity:      number;
  subtotal:      number;   // unit_price * quantity
  stock_disponible: number; // stock at the cashier's sede
  tipo?: 'PRODUCTO' | 'SERVICIO';
  catalogo_servicio_id?: number;
}

// ── API payloads ──────────────────────────────────────────────────────────────

export interface VentaItemPayload {
  producto:            number | null;
  catalogo_servicio:   number | null;
  tipo:                'PRODUCTO' | 'SERVICIO';
  quantity:            number;
  unit_price:          number;
}

export interface VentaPayload {
  sede:         number;
  items:        VentaItemPayload[];
  descuento:    number;
  metodo_pago:  MetodoPago;
  monto_pagado: number;
  notas?:       string;
}

// ── API responses ─────────────────────────────────────────────────────────────

export interface VentaItem {
  id:            number;
  producto:      number;
  producto_name: string;
  producto_sku:  string;
  quantity:      number;
  unit_price:    string;
  subtotal:      string;
}

export interface Venta {
  id:           number;
  sede:         number;
  sede_name:    string;
  cajero:       number;
  cajero_name:  string;
  items:        VentaItem[];
  subtotal:         string;
  descuento:        string;
  total:            string;
  subtotal_sin_iva: string;
  iva_monto:        string;
  metodo_pago:      MetodoPago;
  monto_pagado: string;
  cambio:       string;
  status:       VentaStatus;
  notas:        string;
  created_at:   string;
  servicio_id:  number | null;
}

export interface VentaListResponse {
  success: boolean;
  data: { ventas: Venta[]; pagination: Pagination };
}

// ── Apertura de Caja ──────────────────────────────────────────────────────────

export interface CodigoAperturaResponse {
  codigo:        string;
  monto_inicial: string;
  expires_at:    string;
}

export interface AperturaCaja {
  id:                  number;
  sede:                number;
  cajero:              number;
  cajero_name:         string;
  autorizado_por_name: string;
  monto_inicial:       string;
  fecha_apertura:      string;
  fecha_cierre:        string | null;
  status:              'ABIERTA' | 'CERRADA';
}

// Corte de efectivo devuelto al cerrar la caja
export interface CorteCaja {
  monto_inicial:       string;
  efectivo_ventas:     string;
  efectivo_esperado:   string;
  efectivo_contado:    string | null;
  diferencia:          string | null;
  monto_tarjeta:       string;
  monto_transferencia: string;
}

export interface CerrarCajaResponse {
  success: boolean;
  message: string;
  data:    AperturaCaja;
  corte:   CorteCaja;
}

export interface MiEstadoCajaResponse {
  success: boolean;
  data: { tiene_caja_abierta: boolean; apertura: AperturaCaja | null };
}

// ── Admin resumen ─────────────────────────────────────────────────────────────

export interface CajaAbiertaInfo {
  cajero_name: string;
  desde:       string;
}

// ── Reportes ──────────────────────────────────────────────────────────────────

export interface VentaPorDia {
  fecha:    string;
  cantidad: number;
  monto:    string;
  costo?:    string;
  ganancia?: string;
}

export interface TopProducto {
  producto_name:  string;
  sku:            string;
  total_vendidos: number;
  monto_total:    string;
  costo_total?:   string;
  ganancia?:      string;
}

export interface ReportesData {
  ventas_por_dia: VentaPorDia[];
  top_productos:  TopProducto[];
  resumen: {
    total_ventas:        number;
    monto_total:         string;
    total_cancelaciones: number;
    monto_cancelaciones: string;
    // Ganancia (solo admin)
    costo_total?:        string;
    ganancia_total?:     string;
    margen_pct?:         string;
  };
}

export interface TendenciaPoint {
  fecha:  string;
  dia:    string;
  total:  number;
  ventas: number;
}

export interface SedeResumenVentas {
  sede_id:                number;
  sede_name:              string;
  ingresos_hoy:           string;
  ingresos_semana:        string;
  ingresos_mes:           string;
  ingresos_anio:          string;
  // Ganancia (ingresos − costo). Solo admin.
  costo_mes?:             string;
  ganancia_hoy?:          string;
  ganancia_semana?:       string;
  ganancia_mes?:          string;
  ganancia_anio?:         string;
  devoluciones_hoy:       number;
  devoluciones_mes:       number;
  monto_devoluciones_mes: string;
  cajas_abiertas:         CajaAbiertaInfo[];
}

// ── Dashboard Analytics ───────────────────────────────────────────────────────

export interface TopItem {
  nombre:   string;
  sku?:     string;
  cantidad: number;
  monto:    string;
}

export interface TopItemsData {
  productos: TopItem[];
  servicios: TopItem[];
}

export interface StockBajoItem {
  sku:      string;
  nombre:   string;
  cantidad: number;
  minimo:   number;
  sede:     string;
  sede_id:  number;
  alerta:   'SIN_STOCK' | 'BAJO';
}
