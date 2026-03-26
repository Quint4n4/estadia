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
};
