import apiClient from './axios.config';
import type {
  CategoriaServicio,
  CategoriaServicioPayload,
  CatalogoServicioDetail,
  CatalogoServicioPayload,
  DisponibilidadServicio,
  DisponibilidadServicioItem,
  PrecioServicioSede,
  PrecioServicioSedePayload,
} from '../types/catalogo-servicios.types';

const BASE = '/catalogo-servicios';

export const catalogoServiciosService = {

  // ── Categorías ────────────────────────────────────────────────────────────

  getCategorias(): Promise<CategoriaServicio[]> {
    return apiClient.get(`${BASE}/categorias/`).then(r => r.data.data);
  },

  createCategoria(data: CategoriaServicioPayload): Promise<CategoriaServicio> {
    return apiClient.post(`${BASE}/categorias/`, data).then(r => r.data.data);
  },

  updateCategoria(id: number, data: Partial<CategoriaServicioPayload>): Promise<CategoriaServicio> {
    return apiClient.patch(`${BASE}/categorias/${id}/`, data).then(r => r.data.data);
  },

  deleteCategoria(id: number): Promise<void> {
    return apiClient.delete(`${BASE}/categorias/${id}/`).then(r => r.data);
  },

  // ── Catálogo de servicios ─────────────────────────────────────────────────

  getServicios(params?: { categoria?: number; activo?: boolean; search?: string; page?: number }): Promise<any> {
    return apiClient.get(`${BASE}/`, { params }).then(r => r.data);
  },

  getServicioDetail(id: number): Promise<CatalogoServicioDetail> {
    return apiClient.get(`${BASE}/${id}/`).then(r => r.data.data);
  },

  createServicio(data: CatalogoServicioPayload): Promise<CatalogoServicioDetail> {
    return apiClient.post(`${BASE}/`, data).then(r => r.data.data);
  },

  updateServicio(id: number, data: Partial<CatalogoServicioPayload>): Promise<CatalogoServicioDetail> {
    return apiClient.patch(`${BASE}/${id}/`, data).then(r => r.data.data);
  },

  deleteServicio(id: number): Promise<void> {
    return apiClient.delete(`${BASE}/${id}/`).then(r => r.data);
  },

  toggleActivoServicio(id: number): Promise<{ activo: boolean; mensaje: string }> {
    return apiClient.post(`${BASE}/${id}/toggle-activo/`).then(r => r.data);
  },

  // ── Disponibilidad ────────────────────────────────────────────────────────

  getDisponibilidad(servicioId: number, sedeId: number): Promise<DisponibilidadServicio> {
    return apiClient.get(`${BASE}/${servicioId}/disponibilidad/?sede_id=${sedeId}`).then(r => r.data.data);
  },

  getDisponibilidadTodos(sedeId: number): Promise<DisponibilidadServicioItem[]> {
    return apiClient.get(`${BASE}/disponibilidad-sede/?sede_id=${sedeId}`).then(r => r.data.data);
  },

  // ── Precios por sede ──────────────────────────────────────────────────────

  getPreciosSede(servicioId: number): Promise<PrecioServicioSede[]> {
    return apiClient.get(`${BASE}/${servicioId}/precios-sede/`).then(r => r.data.data);
  },

  setPrecioSede(servicioId: number, data: PrecioServicioSedePayload): Promise<PrecioServicioSede> {
    return apiClient.post(`${BASE}/${servicioId}/precios-sede/`, data).then(r => r.data.data);
  },
};
