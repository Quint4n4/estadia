// ──────────────────────────────────────────────────────────────────────────────
// Módulo Taller — Tipos TypeScript
// ──────────────────────────────────────────────────────────────────────────────

// ── Status ────────────────────────────────────────────────────────────────────

export type ServicioStatus =
  | 'RECIBIDO'
  | 'EN_PROCESO'
  | 'COTIZACION_EXTRA'
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
}

// ── Servicio (detalle completo) ───────────────────────────────────────────────

export interface ServicioMotoDetail extends ServicioMotoList {
  cliente: number | null;
  moto: MotoClienteMinimal;
  asignado_por_nombre: string | null;
  metodo_pago: MetodoPago | null;
  fecha_inicio: string | null;
  fecha_listo: string | null;
  fecha_entrega: string | null;
  notas_internas: string;
  items: ServicioItem[];
  solicitudes_extra: SolicitudRefaccionExtra[];
}

// ── Payloads de creación ──────────────────────────────────────────────────────

export interface MotoClienteInput {
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
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

export interface ServicioCreatePayload {
  sede?: number;
  cliente?: number | null;
  // Moto: puede ser ID existente o datos para crear nueva
  moto_id?: number | null;
  moto_nueva?: MotoClienteInput;
  descripcion_problema: string;
  fecha_entrega_estimada?: string | null;
  notas_internas?: string;
  mano_de_obra: string;
  items?: ServicioItemInput[];
  // Pago inmediato opcional
  pagar_ahora?: boolean;
  metodo_pago?: MetodoPago;
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
}

// ── Respuestas API ─────────────────────────────────────────────────────────────

export interface TallerApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
