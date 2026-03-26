import apiClient from './axios.config';
import type {
  MotoCliente,
  ServicioMotoList,
  ServicioMotoDetail,
  ServicioCreatePayload,
  ServicioUpdatePayload,
  AsignarMecanicoPayload,
  EntregarServicioPayload,
  SolicitudRefaccionExtra,
  SolicitudCreatePayload,
  ServicioListParams,
  TallerApiResponse,
  HistorialParams,
  HistorialResponse,
  ReporteTallerParams,
  ReporteTallerData,
} from '../types/taller.types';

const BASE = '/taller';

export const tallerService = {

  // ── Motos del cliente ──────────────────────────────────────────────────────

  listMotos(params?: { sede_id?: number; cliente_id?: number }): Promise<TallerApiResponse<MotoCliente[]>> {
    return apiClient.get(`${BASE}/motos-cliente/`, { params }).then(r => r.data);
  },

  getMoto(id: number): Promise<TallerApiResponse<MotoCliente>> {
    return apiClient.get(`${BASE}/motos-cliente/${id}/`).then(r => r.data);
  },

  // ── Servicios ──────────────────────────────────────────────────────────────

  listServicios(params?: ServicioListParams): Promise<ServicioMotoList[]> {
    return apiClient.get(`${BASE}/servicios/`, { params }).then(r => r.data?.data?.servicios ?? []);
  },

  getServicio(id: number): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.get(`${BASE}/servicios/${id}/`).then(r => r.data);
  },

  createServicio(payload: ServicioCreatePayload): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.post(`${BASE}/servicios/`, payload).then(r => r.data);
  },

  updateServicio(id: number, payload: ServicioUpdatePayload): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.put(`${BASE}/servicios/${id}/`, payload).then(r => r.data);
  },

  // ── Acciones de status ─────────────────────────────────────────────────────

  asignarMecanico(id: number, payload: AsignarMecanicoPayload): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.patch(`${BASE}/servicios/${id}/asignar/`, payload).then(r => r.data);
  },

  iniciarReparacion(id: number): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.patch(`${BASE}/servicios/${id}/iniciar/`).then(r => r.data);
  },

  marcarListaParaEntregar(id: number): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.patch(`${BASE}/servicios/${id}/listo/`).then(r => r.data);
  },

  autorizarDiagnostico(id: number): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.post(`${BASE}/servicios/${id}/autorizar/`).then(r => r.data);
  },

  cancelarOrden(id: number): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.post(`${BASE}/servicios/${id}/cancelar/`).then(r => r.data);
  },

  actualizarDiagnostico(id: number, data: { diagnostico_mecanico?: string; refacciones_requeridas?: string }): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.patch(`${BASE}/servicios/${id}/diagnostico/`, data).then(r => r.data);
  },

  submitDiagnostico(id: number): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.patch(`${BASE}/servicios/${id}/submit-diagnostico/`).then(r => r.data);
  },

  marcarEntregada(id: number): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.patch(`${BASE}/servicios/${id}/entregada/`).then(r => r.data);
  },

  entregarServicio(id: number, payload: EntregarServicioPayload): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.patch(`${BASE}/servicios/${id}/entregar/`, payload).then(r => r.data);
  },

  // ── Solicitudes de refacción extra ─────────────────────────────────────────

  listSolicitudes(params?: { servicio_id?: number; status?: string }): Promise<TallerApiResponse<SolicitudRefaccionExtra[]>> {
    return apiClient.get(`${BASE}/solicitudes-extra/`, { params }).then(r => r.data);
  },

  createSolicitud(payload: SolicitudCreatePayload): Promise<TallerApiResponse<SolicitudRefaccionExtra>> {
    return apiClient.post(`${BASE}/solicitudes-extra/`, payload).then(r => r.data);
  },

  aprobarSolicitud(id: number): Promise<TallerApiResponse<SolicitudRefaccionExtra>> {
    return apiClient.patch(`${BASE}/solicitudes-extra/${id}/aprobar/`).then(r => r.data);
  },

  rechazarSolicitud(id: number): Promise<TallerApiResponse<SolicitudRefaccionExtra>> {
    return apiClient.patch(`${BASE}/solicitudes-extra/${id}/rechazar/`).then(r => r.data);
  },

  // ── Imágenes de evidencia ──────────────────────────────────────────────────

  subirImagenes(servicioId: number, files: File[]): Promise<TallerApiResponse<any>> {
    const form = new FormData();
    files.forEach(f => form.append('imagenes', f));
    return apiClient.post(`${BASE}/servicios/${servicioId}/imagenes/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  eliminarImagen(servicioId: number, imagenId: number): Promise<TallerApiResponse<null>> {
    return apiClient.delete(`${BASE}/servicios/${servicioId}/imagenes/?imagen_id=${imagenId}`)
      .then(r => r.data);
  },

  // ── Historial / Archivado ──────────────────────────────────────────────────

  archivarOrdenes(sedeId?: number): Promise<TallerApiResponse<{ archivadas: number }>> {
    const body = sedeId ? { sede_id: sedeId } : {};
    return apiClient.post(`${BASE}/servicios/archivar/`, body).then(r => r.data);
  },

  listHistorial(params: HistorialParams = {}): Promise<TallerApiResponse<HistorialResponse>> {
    return apiClient.get(`${BASE}/servicios/historial/`, { params }).then(r => r.data);
  },

  // ── Vista cliente (por QR token) ────────────────────────────────────────────

  misServicios(): Promise<TallerApiResponse<ServicioMotoList[]>> {
    return apiClient.get(`${BASE}/mis-servicios/`).then(r => r.data);
  },

  miServicioDetalle(id: number): Promise<TallerApiResponse<ServicioMotoDetail>> {
    return apiClient.get(`${BASE}/mis-servicios/${id}/`).then(r => r.data);
  },

  // ── Reporte de Taller ──────────────────────────────────────────────────────

  getReporteTaller(params: ReporteTallerParams): Promise<TallerApiResponse<ReporteTallerData>> {
    return apiClient.get(`${BASE}/servicios/reporte/`, { params }).then(r => r.data);
  },
};
