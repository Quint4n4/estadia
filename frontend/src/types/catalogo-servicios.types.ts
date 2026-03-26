// ──────────────────────────────────────────────────────────────────────────────
// Módulo Catálogo de Servicios — Tipos TypeScript
// ──────────────────────────────────────────────────────────────────────────────

// ── Categorías de servicio ────────────────────────────────────────────────────

export interface CategoriaServicio {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  total_servicios: number;
}

export interface CategoriaServicioPayload {
  nombre: string;
  descripcion?: string;
}

// ── Refacciones vinculadas al catálogo ────────────────────────────────────────

export interface RefaccionServicio {
  id: number;
  producto: {
    id: number;
    name: string;
    sku: string;
    price: string;
  };
  cantidad: number;
  es_opcional: boolean;
}

export interface RefaccionInput {
  producto: number;
  cantidad: number;
  es_opcional: boolean;
}

// ── Catálogo de servicios (lista / detalle) ───────────────────────────────────

export interface CatalogoServicioList {
  id: number;
  nombre: string;
  descripcion: string;
  precio_base: string | null;
  duracion_estimada_minutos: number | null;
  categoria: string;
  categoria_id: number;
  activo: boolean;
  total_refacciones: number;
}

export interface CatalogoServicioDetail extends CatalogoServicioList {
  refacciones: RefaccionServicio[];
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface CatalogoServicioPayload {
  nombre: string;
  descripcion?: string;
  precio_base?: number | null;
  duracion_estimada_minutos?: number | null;
  categoria: number;
  refacciones: RefaccionInput[];
}

// ── Disponibilidad de refacciones ─────────────────────────────────────────────

export interface DisponibilidadRefaccion {
  producto_nombre: string;
  requerido: number;
  en_stock: number;
  suficiente: boolean;
  es_opcional: boolean;
}

export interface DisponibilidadServicio {
  servicio_id: number;
  servicio_nombre: string;
  disponible: boolean;
  refacciones: DisponibilidadRefaccion[];
}

export interface DisponibilidadServicioItem extends CatalogoServicioList {
  disponible: boolean;
}

// ── Precios por sede ──────────────────────────────────────────────────────────

export interface PrecioServicioSede {
  id?: number;
  sede: number;
  sede_nombre: string;
  precio_override: string;
  activo: boolean;
}

export interface PrecioServicioSedePayload {
  sede: number;
  precio_override: number | string;
  activo?: boolean;
}
