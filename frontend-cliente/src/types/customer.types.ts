export interface ClienteProfile {
  id:         number;
  email:      string;
  first_name: string;
  last_name:  string;
  telefono:   string;
  fecha_nac:  string | null;
  foto_url:   string;
  puntos:     number;
  qr_token:   string;
  created_at: string;
}

export interface AuthTokens {
  access:  string;
  refresh: string;
}

export interface VentaItem {
  id:          number;
  producto_id: number;
  producto_sku:  string;
  producto_name: string;
  quantity:    number;
  unit_price:  string;
  subtotal:    string;
}

export interface Venta {
  id:           number;
  sede_id:      number;
  sede_name:    string;
  cajero_name:  string;
  subtotal:     string;
  descuento:    string;
  total:        string;
  metodo_pago:  'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
  monto_pagado: string;
  cambio:       string;
  status:       'COMPLETADA' | 'CANCELADA';
  puntos_ganados: number;
  items:        VentaItem[];
  created_at:   string;
}

export interface MisComprasResponse {
  ventas:      Venta[];
  total:       number;
  page:        number;
  page_size:   number;
  total_pages: number;
}

// ── Módulo Taller — Seguimiento público ───────────────────────────────────────

export interface TimelineStep {
  status:     string;
  label:      string;
  fecha:      string | null;
  completado: boolean;
  activo:     boolean;
}

export interface SeguimientoData {
  folio:                   string;
  moto_display:            string;
  sede_nombre:             string;
  status:                  string;
  status_display:          string;
  pago_status:             string;
  pago_status_display:     string;
  descripcion:             string;
  fecha_recepcion:         string;
  fecha_entrega_estimada:  string | null;
  fecha_inicio:            string | null;
  fecha_listo:             string | null;
  fecha_entrega:           string | null;
  tiene_extra_pendiente:   boolean;
  diagnostico_listo?:      boolean;
  mano_de_obra:            string;
  total_refacciones:       string;
  total:                   string;
  timeline:                TimelineStep[];
}

// ── Módulo Taller ─────────────────────────────────────────────────────────────

export type ServicioStatus =
  | 'RECIBIDO'
  | 'EN_PROCESO'
  | 'COTIZACION_EXTRA'
  | 'LISTO'
  | 'ENTREGADO';

export type PagoStatus = 'PENDIENTE_PAGO' | 'PAGADO';

export interface MotoClienteMinimal {
  id:     number;
  marca:  string;
  modelo: string;
  anio:   number;
  placa:  string;
}

export interface ServicioMotoCliente {
  id:                     number;
  folio:                  string;
  sede_nombre:            string;
  moto_display:           string;
  moto:                   MotoClienteMinimal;
  descripcion_problema:   string;
  status:                 ServicioStatus;
  status_display:         string;
  pago_status:            PagoStatus;
  pago_status_display:    string;
  mecanico_nombre:        string | null;
  mano_de_obra:           string;
  total_refacciones:      string;
  total:                  string;
  fecha_recepcion:        string;
  fecha_entrega_estimada: string | null;
  fecha_inicio:           string | null;
  fecha_listo:            string | null;
  fecha_entrega:          string | null;
  tiene_extra_pendiente:  boolean;
  tiempo_recibido:        number;
}
