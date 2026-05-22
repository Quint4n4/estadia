import apiClient from './axios.config';
import type {
  ClienteBusqueda,
  ClienteRegistroPayload,
  ClienteProfile,
} from '../types/customers.types';

export const customersService = {

  buscar(q: string): Promise<{ success: boolean; data: ClienteBusqueda[] }> {
    return apiClient.get('/customers/buscar/', { params: { q } }).then(r => r.data);
  },

  registrar(
    payload: ClienteRegistroPayload,
  ): Promise<{ success: boolean; data: { tokens: unknown; profile: ClienteProfile } }> {
    return apiClient.post('/customers/registro/', payload).then(r => r.data);
  },

  // ── Recepción: panel de correos del cliente ────────────────────────────────
  recepcionClientes(q: string): Promise<{ success: boolean; data: any[] }> {
    return apiClient.get('/customers/recepcion/clientes/', { params: { q } }).then(r => r.data);
  },
  clienteCorreos(id: number): Promise<{ success: boolean; data: any }> {
    return apiClient.get(`/customers/recepcion/clientes/${id}/correos/`).then(r => r.data);
  },
  editarCorreoCliente(id: number, email: string): Promise<{ success: boolean; data: any; message?: string }> {
    return apiClient.patch(`/customers/recepcion/clientes/${id}/correo/`, { email }).then(r => r.data);
  },
  reenviarCorreos(id: number, logId?: number): Promise<{ success: boolean; data: any; message?: string }> {
    return apiClient.post(
      `/customers/recepcion/clientes/${id}/reenviar/`,
      logId ? { log_id: logId } : {},
    ).then(r => r.data);
  },
};
