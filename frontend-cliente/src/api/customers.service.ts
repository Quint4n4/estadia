import axios from 'axios';
import apiClient from './axios.config';
import type { ClienteProfile, AuthTokens, MisComprasResponse, ServicioMotoCliente, SeguimientoData } from '../types/customer.types';

// Cliente público sin headers de auth (para endpoints que no requieren autenticación)
const publicClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

interface RegisterPayload {
  first_name: string;
  last_name:  string;
  email:      string;
  password:   string;
  telefono?:  string;
  fecha_nac?: string | null;
}

interface LoginPayload {
  email:    string;
  password: string;
}

export const customersService = {
  async register(payload: RegisterPayload): Promise<{ tokens: AuthTokens; profile: ClienteProfile }> {
    const r = await apiClient.post('/customers/registro/', payload);
    return r.data.data;
  },

  async login(payload: LoginPayload): Promise<{ access: string; refresh: string }> {
    const r = await apiClient.post('/auth/token/', {
      email:    payload.email,
      password: payload.password,
    });
    return r.data;
  },

  async getPerfil(): Promise<ClienteProfile> {
    const r = await apiClient.get('/customers/perfil/');
    return r.data.data;
  },

  async updatePerfil(data: Partial<ClienteProfile>): Promise<ClienteProfile> {
    const r = await apiClient.patch('/customers/perfil/', data);
    return r.data.data;
  },

  async getMiQR(): Promise<{ qr_token: string; qr_base64: string }> {
    const r = await apiClient.get('/customers/mi-qr/');
    return r.data.data;
  },

  async getMisCompras(page = 1, pageSize = 20): Promise<MisComprasResponse> {
    const r = await apiClient.get('/customers/mis-compras/', {
      params: { page, page_size: pageSize },
    });
    return r.data.data;
  },

  // ── Taller ──────────────────────────────────────────────────────────────────

  async getMisServicios(): Promise<ServicioMotoCliente[]> {
    const r = await apiClient.get('/taller/mis-servicios/');
    return r.data.data;
  },

  async getMiServicio(id: number): Promise<ServicioMotoCliente> {
    const r = await apiClient.get(`/taller/mis-servicios/${id}/`);
    return r.data.data;
  },

  // ── Seguimiento público (sin auth) ──────────────────────────────────────────

  async getSeguimiento(token: string): Promise<{ success: boolean; data: SeguimientoData }> {
    const r = await publicClient.get(`/taller/seguimiento/${token}/`);
    return r.data;
  },
};
