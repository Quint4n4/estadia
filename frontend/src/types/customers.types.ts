// ──────────────────────────────────────────────────────────────────────────────
// Módulo Customers — Tipos TypeScript
// ──────────────────────────────────────────────────────────────────────────────

export interface ClienteBusqueda {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  foto_url: string;
  puntos: number;
  qr_token: string;
}

export interface ClienteRegistroPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface ClienteProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  telefono: string;
  puntos: number;
  qr_token: string;
  created_at: string;
}
