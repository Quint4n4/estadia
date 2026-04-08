// ──────────────────────────────────────────────────────────────────────────────
// Módulo Taller — Tipos TypeScript
// ──────────────────────────────────────────────────────────────────────────────

// ── Status ────────────────────────────────────────────────────────────────────

export type ServicioStatus =
  | 'RECIBIDO'
  | 'EN_DIAGNOSTICO'
  | 'EN_PROCESO'
  | 'COTIZACION_EXTRA'
  | 'LISTA_PARA_ENTREGAR'
  | 'CANCELADO'
  | 'LISTO'
  | 'ENTREGADO';

export type PagoStatus = 'PENDIENTE_PAGO' | 'PAGADO';

export type ItemTipo = 'REFACCION' | 'MANO_OBRA' | 'EXTRA';

export type SolicitudStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';

// ── Moto del cliente ──────────────────────────────────────────────────────────

export interface MotoCliente {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  numero_serie: string;
  placa: string;
  color: string;
  notas: string;
  cliente_nombre: string | null;
  created_at: string;
}

export interface MotoClienteMinimal {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  numero_serie: string;
  placa: string;
}

// ── Ítems de servicio ─────────────────────────────────────────────────────────

export interface ServicioItem {
  id: number;
  tipo: ItemTipo;
  tipo_display: string;
  producto: number | null;
  producto_nombre: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  aprobado: boolean;
}

// ── Solicitud de refacción extra ──────────────────────────────────────────────

export interface SolicitudRefaccionExtra {
  id: number;
  servicio: number;
  servicio_folio: string;
  mecanico: number;
  mecanico_nombre: string;
  producto: number;
  producto_nombre: string;
  cantidad: number;
  motivo: string;
  status: SolicitudStatus;
  status_display: string;
  respondido_por_nombre: string | null;
  created_at: string;
  updated_at: string;
}

// ── Servicio (lista / Kanban) ──────────────────────────────────────────────────

export interface ServicioMotoList {
  id: number;
  folio: string;
  sede_nombre: string;
  cliente_nombre: string;
  moto_display: string;
  cajero_nombre: string;
  mecanico_nombre: string | null;
  status: ServicioStatus;
  status_display: string;
  pago_status: PagoStatus;
  pago_status_display: string;
  mano_de_obra: string;
  total_refacciones: string;
  total: string;
  descripcion_problema: string;
  tiempo_recibido: number;         // minutos desde recepción
  tiene_extra_pendiente: boolean;
  fecha_recepcion: string;
  fecha_entrega_estimada: string | null;
  archivado?:            boolean;
  fecha_archivado?:      string | null;
  archivado_por_nombre?: string | null;
  diagnostico_listo?:    boolean;
}

// ── Servicio (detalle completo) ───────────────────────────────────────────────

export interface ServicioMotoDetail extends ServicioMotoList {
  cliente: number | null;
  cliente_email: string;
  moto: MotoClienteMinimal;
  es_reparacion: boolean;
  asignado_por_nombre: string | null;
  metodo_pago: MetodoPago | null;
  monto_pagado: string | null;
  cambio: string | null;
  fecha_inicio: string | null;
  fecha_listo: string | null;
  fecha_entrega: string | null;
  notas_internas: string;
  diagnostico_mecanico: string;
  refacciones_requeridas: string;
  checklist_recepcion: string[];
  imagenes: ServicioImagen[];
  items: ServicioItem[];
  solicitudes_extra: SolicitudRefaccionExtra[];
}

// ── Payloads de creación ──────────────────────────────────────────────────────

export interface MotoClienteInput {
  marca: string;
  modelo: string;
  anio: number;
  numero_serie: string;
  placa?: string;
  color?: string;
  notas?: string;
}

export interface ServicioItemInput {
  tipo: ItemTipo;
  producto?: number | null;
  descripcion?: string;
  cantidad: number;
  precio_unitario: string;
}

export interface ServicioImagen {
  id: number;
  imagen_url: string;
  descripcion: string;
  created_at: string;
}

export interface ServicioCreatePayload {
  sede?: number;
  cliente?: number | null;
  // Moto: puede ser ID existente o datos para crear nueva
  moto?: number | null;
  moto_nueva?: MotoClienteInput;
  descripcion: string;
  es_reparacion?: boolean;
  mano_de_obra: string;
  items?: ServicioItemInput[];
  checklist_recepcion?: string[];
  fecha_entrega_estimada?: string | null;
  notas_internas?: string;
  // Pago
  pago_status?: 'PENDIENTE_PAGO' | 'PAGADO';
  metodo_pago?: MetodoPago;
  monto_pagado?: string | null;
}

export interface ServicioUpdatePayload {
  descripcion_problema?: string;
  fecha_entrega_estimada?: string | null;
  notas_internas?: string;
  mano_de_obra?: string;
}

// ── Payloads de acciones ──────────────────────────────────────────────────────

export interface AsignarMecanicoPayload {
  mecanico_id: number;
}

export interface EntregarServicioPayload {
  metodo_pago: MetodoPago;
  monto_pagado: number;
}

export interface SolicitudCreatePayload {
  servicio: number;
  producto: number;
  cantidad: number;
  motivo: string;
}

// ── Filtros de lista ──────────────────────────────────────────────────────────

export interface ServicioListParams {
  sede_id?: number;
  status?: ServicioStatus | '';
  fecha_desde?: string;
  fecha_hasta?: string;
  include_entregado?: boolean;
  venta_id?: number;
  incluir_archivados?: boolean;
  folio?: string;
}

// ── Respuestas API ─────────────────────────────────────────────────────────────

export interface TallerApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface HistorialParams {
  fecha_desde?: string;   // YYYY-MM-DD
  fecha_hasta?: string;   // YYYY-MM-DD
  status?:      string;
  search?:      string;
  page?:        number;
  page_size?:   number;
  sede_id?:     number;
}

export interface HistorialResponse {
  servicios:  ServicioMotoList[];
  pagination: {
    total:       number;
    page:        number;
    page_size:   number;
    total_pages: number;
  };
}

// ── Reporte de Taller (EncargadoPanel) ────────────────────────────────────────

export interface ReporteTallerParams {
  fecha_desde: string;   // YYYY-MM-DD
  fecha_hasta: string;   // YYYY-MM-DD
  sede_id?:    number;
}

export interface ReporteTallerKpis {
  total_ordenes:          number;
  total_entregadas:       number;
  total_canceladas:       number;
  total_activas:          number;
  ingresos_totales:       string;   // Decimal como string
  ticket_promedio:        string;   // Decimal como string
  tiempo_promedio_horas:  number;
  tasa_cancelacion_pct:   number;
}

export interface ReportePeriodoItem {
  label:    string;
  ingresos: string;   // Decimal como string
  ordenes:  number;
}

export interface ReporteMecanicoItem {
  mecanico_id:            number;
  mecanico_nombre:        string;
  asignadas:              number;
  entregadas:             number;
  pct_completadas:        number;
  ingreso_generado:       string;   // Decimal como string
  tiempo_promedio_horas:  number;
}

export interface ReporteTipoItem {
  conteo:   number;
  ingresos: string;   // Decimal como string
}

export interface ReporteMetodoPagoItem {
  metodo: string;
  conteo: number;
  total:  string;   // Decimal como string
}

export interface ReporteTardiaItem {
  folio:             string;
  mecanico_nombre:   string;
  fecha_estimada:    string;
  fecha_entrega:     string;
  dias_retraso:      number;
}

export interface ReporteActivoStatusItem {
  status:         string;
  status_display: string;
  conteo:         number;
}

export interface ReporteTallerData {
  periodo: {
    desde: string;
    hasta: string;
  };
  kpis:                  ReporteTallerKpis;
  ingresos_por_periodo:  ReportePeriodoItem[];
  por_mecanico:          ReporteMecanicoItem[];
  por_tipo: {
    reparacion:    ReporteTipoItem;
    mantenimiento: ReporteTipoItem;
  };
  por_metodo_pago:       ReporteMetodoPagoItem[];
  ordenes_tardias:       ReporteTardiaItem[];
  activas_por_status:    ReporteActivoStatusItem[];
}
