import React, { useEffect, useState, useCallback, useRef } from 'react';
import { tallerService } from '../../api/taller.service';
import type { ServicioMotoList, ServicioStatus } from '../../types/taller.types';
import ServicioDetalleModal from './ServicioDetalleModal';

/* ── Props ────────────────────────────────────────────────────────────── */
interface Props {
  onOpenDetalle?: (servicioId: number) => void;
}

/* ── Configuración de estatus (igual que ServiciosView) ──────────────── */
const STATUS_LABEL: Record<ServicioStatus, string> = {
  RECIBIDO:            'Recibido',
  EN_DIAGNOSTICO:      'En diagnóstico',
  EN_PROCESO:          'En proceso',
  COTIZACION_EXTRA:    'Cotización extra',
  LISTA_PARA_ENTREGAR: 'Lista para entregar',
  LISTO:               'Lista para entregar',
  ENTREGADO:           'Entregado',
  CANCELADO:           'Cancelada',
};

interface StatusStyle {
  color: string;
  gradFrom: string;
  gradTo: string;
  dotColor: string;
}

const STATUS_STYLE: Record<ServicioStatus, StatusStyle> = {
  RECIBIDO:            { color: '#c05621', gradFrom: '#fffbeb', gradTo: '#fff7ed', dotColor: '#f6ad55' },
  EN_DIAGNOSTICO:      { color: '#6b46c1', gradFrom: '#faf5ff', gradTo: '#f3e8ff', dotColor: '#9f7aea' },
  EN_PROCESO:          { color: '#2b6cb0', gradFrom: '#ebf8ff', gradTo: '#e8f4ff', dotColor: '#63b3ed' },
  COTIZACION_EXTRA:    { color: '#b7791f', gradFrom: '#fffbeb', gradTo: '#fef3c7', dotColor: '#f6e05e' },
  LISTA_PARA_ENTREGAR: { color: '#2c7a7b', gradFrom: '#e6fffa', gradTo: '#ccfbf1', dotColor: '#38b2ac' },
  LISTO:               { color: '#276749', gradFrom: '#f0fff4', gradTo: '#dcfce7', dotColor: '#68d391' },
  ENTREGADO:           { color: '#553c9a', gradFrom: '#f3e8ff', gradTo: '#ede9fe', dotColor: '#805ad5' },
  CANCELADO:           { color: '#c53030', gradFrom: '#fff5f5', gradTo: '#fed7d7', dotColor: '#fc8181' },
};

const STATUS_CHIP_BG: Record<ServicioStatus, string> = {
  RECIBIDO:            '#c05621',
  EN_DIAGNOSTICO:      '#6b46c1',
  EN_PROCESO:          '#2b6cb0',
  COTIZACION_EXTRA:    '#b7791f',
  LISTA_PARA_ENTREGAR: '#2c7a7b',
  LISTO:               '#276749',
  ENTREGADO:           '#553c9a',
  CANCELADO:           '#c53030',
};

/* ── Icono de motocicleta (SVG inline) ───────────────────────────────── */
const BikeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M8 17.5h7" />
    <path d="M8 17.5L12 8l3 4 2-4" />
    <path d="M12 8h4" />
    <path d="M19 8l-1 9.5" />
  </svg>
);

/* ── Formateador de fecha de archivado ───────────────────────────────── */
function formatFechaArchivado(fechaIso: string): string {
  try {
    const d = new Date(fechaIso);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return fechaIso;
  }
}

/** Extrae solo la parte "YYYY-MM-DD" de un string ISO para agrupar */
function toDateKey(fechaIso: string): string {
  return fechaIso.slice(0, 10);
}

/* ── Tarjeta de historial ────────────────────────────────────────────── */
interface CardProps {
  srv: ServicioMotoList;
  onClick: () => void;
}

const HistorialCard: React.FC<CardProps> = ({ srv, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const st = STATUS_STYLE[srv.status];
  const chipBg = STATUS_CHIP_BG[srv.status];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        background: '#fff',
        padding: 20,
        cursor: 'pointer',
        boxShadow: hovered
          ? '0 8px 24px rgba(0,0,0,.12)'
          : '0 1px 4px rgba(0,0,0,.06)',
        transition: 'box-shadow 300ms ease',
        border: '1px solid #f0f0f0',
      }}
    >
      {/* Área visual — gradiente + ícono */}
      <div style={{
        height: 80,
        borderRadius: 12,
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${st.gradFrom}, ${st.gradTo})`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <span style={{
          position: 'absolute', bottom: -8, left: 6,
          width: 28, height: 28, borderRadius: '50%',
          background: st.dotColor, opacity: 0.15,
        }} />
        <span style={{
          position: 'absolute', top: 6, right: 10,
          width: 10, height: 10, borderRadius: '50%',
          background: st.dotColor, opacity: 0.35,
        }} />
        <div style={{
          transform: hovered ? 'scale(1.12)' : 'scale(1)',
          transition: 'transform 300ms ease',
        }}>
          <BikeIcon size={34} color={st.color} />
        </div>
      </div>

      {/* Contenido textual */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <h3 style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#1a202c',
          margin: 0,
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {srv.moto_display || 'Sin moto'}
        </h3>
        <p style={{ fontSize: 11, color: '#a0aec0', margin: 0 }}>
          {srv.folio}
        </p>
        {srv.cliente_nombre && (
          <p style={{ fontSize: 12, color: '#718096', margin: 0 }}>
            👤 {srv.cliente_nombre}
          </p>
        )}
      </div>

      {/* Footer — badge de estado + fecha archivado */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{
          display: 'inline-block',
          alignSelf: 'flex-start',
          background: chipBg,
          color: '#fff',
          borderRadius: 10,
          padding: '2px 10px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.2px',
        }}>
          {STATUS_LABEL[srv.status]}
        </span>
        {srv.fecha_archivado && (
          <p style={{ fontSize: 11, color: '#a0aec0', margin: 0 }}>
            📅 {formatFechaArchivado(srv.fecha_archivado)}
          </p>
        )}
      </div>
    </div>
  );
};

/* ── Vista principal ─────────────────────────────────────────────────── */
const HistorialServiciosView: React.FC<Props> = ({ onOpenDetalle }) => {
  const [servicios,    setServicios]    = useState<ServicioMotoList[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [pagination,   setPagination]   = useState<{
    total: number; page: number; page_size: number; total_pages: number;
  } | null>(null);

  /* ── Modal de detalle interno ── */
  const [detalleId,    setDetalleId]    = useState<number | null>(null);

  // Filtros
  const [fechaDesde,   setFechaDesde]   = useState('');
  const [fechaHasta,   setFechaHasta]   = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);

  // Ref para debounce del campo search
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce del search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search]);

  // Resetear página cuando cambian otros filtros
  useEffect(() => { setPage(1); }, [fechaDesde, fechaHasta, statusFiltro]);

  const loadHistorial = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tallerService.listHistorial({
        fecha_desde: fechaDesde  || undefined,
        fecha_hasta: fechaHasta  || undefined,
        status:      statusFiltro || undefined,
        search:      debouncedSearch || undefined,
        page,
        page_size: 20,
      });
      if (res.success) {
        setServicios(res.data.servicios);
        setPagination(res.data.pagination);
      } else {
        setError('No se pudo cargar el historial.');
        setServicios([]);
      }
    } catch {
      setError('Error al conectar con el servidor.');
      setServicios([]);
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, statusFiltro, debouncedSearch, page]);

  useEffect(() => { loadHistorial(); }, [loadHistorial]);

  /* ── Agrupación por fecha_archivado ──────────────────────────────── */
  const grupos: { dateKey: string; items: ServicioMotoList[] }[] = [];
  const seenKeys: Record<string, number> = {};

  for (const srv of servicios) {
    const key = srv.fecha_archivado ? toDateKey(srv.fecha_archivado) : 'sin-fecha';
    if (seenKeys[key] === undefined) {
      seenKeys[key] = grupos.length;
      grupos.push({ dateKey: key, items: [] });
    }
    grupos[seenKeys[key]].items.push(srv);
  }

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div style={{ padding: '0 4px' }}>

      {/* ── Título ────────────────────────────────────────────────── */}
      <h2 style={{
        fontSize: 20,
        fontWeight: 700,
        color: '#1a202c',
        margin: '0 0 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        📦 Historial de Órdenes
      </h2>

      {/* ── Barra de filtros ──────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        alignItems: 'center',
        marginBottom: 24,
        background: '#f7fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '12px 16px',
      }}>
        {/* Búsqueda */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: '#a0aec0', pointerEvents: 'none', lineHeight: 1,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Folio, cliente, moto…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 32,
              paddingRight: 10,
              paddingTop: 7,
              paddingBottom: 7,
              borderRadius: 8,
              border: '1px solid #cbd5e0',
              fontSize: 13,
              background: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Desde */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <label style={{ fontSize: 12, color: '#718096', whiteSpace: 'nowrap' }}>Desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            style={{
              padding: '6px 8px', borderRadius: 8,
              border: '1px solid #cbd5e0', fontSize: 13,
              background: '#fff', outline: 'none',
            }}
          />
        </div>

        {/* Hasta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <label style={{ fontSize: 12, color: '#718096', whiteSpace: 'nowrap' }}>Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            style={{
              padding: '6px 8px', borderRadius: 8,
              border: '1px solid #cbd5e0', fontSize: 13,
              background: '#fff', outline: 'none',
            }}
          />
        </div>

        {/* Estado */}
        <select
          value={statusFiltro}
          onChange={e => setStatusFiltro(e.target.value)}
          style={{
            padding: '6px 10px', borderRadius: 8,
            border: '1px solid #cbd5e0', fontSize: 13,
            background: '#fff', outline: 'none',
            flex: '1 1 150px', minWidth: 130,
          }}
        >
          <option value="">Todos</option>
          <option value="RECIBIDO">Recibido</option>
          <option value="EN_DIAGNOSTICO">En diagnóstico</option>
          <option value="EN_PROCESO">En proceso</option>
          <option value="ENTREGADO">Entregado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>

        {/* Botón Buscar */}
        <button
          onClick={loadHistorial}
          style={{
            padding: '7px 18px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--color-primary, #3182ce)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Buscar
        </button>
      </div>

      {/* ── Contenido ─────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#a0aec0' }}>
          <div style={{
            display: 'inline-block',
            width: 36,
            height: 36,
            border: '4px solid #e2e8f0',
            borderTopColor: 'var(--color-primary, #3182ce)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ margin: '12px 0 0', fontSize: 14 }}>Cargando historial…</p>
        </div>
      ) : error ? (
        <div style={{
          textAlign: 'center', padding: 48,
          color: '#c53030', background: '#fff5f5',
          borderRadius: 12, border: '1px solid #fed7d7',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
          <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      ) : servicios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#a0aec0' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📦</div>
          <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 4px', color: '#4a5568' }}>
            No hay órdenes en el historial
          </p>
          <p style={{ fontSize: 14, margin: 0 }}>
            Prueba cambiando los filtros o el rango de fechas.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {grupos.map(grupo => (
            <section key={grupo.dateKey}>
              {/* Encabezado de grupo */}
              <div style={{
                background: '#edf2f7',
                borderRadius: 8,
                padding: '8px 16px',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#2d3748' }}>
                  {grupo.dateKey === 'sin-fecha'
                    ? '📅 Sin fecha de archivado'
                    : `📅 Archivado el ${formatFechaArchivado(grupo.dateKey)}`}
                </span>
                <span style={{
                  fontSize: 12,
                  color: '#718096',
                  background: '#fff',
                  borderRadius: 10,
                  padding: '1px 8px',
                  border: '1px solid #e2e8f0',
                }}>
                  {grupo.items.length} {grupo.items.length === 1 ? 'orden' : 'órdenes'}
                </span>
              </div>

              {/* Grid de tarjetas */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16,
              }}>
                {grupo.items.map(srv => (
                  <HistorialCard
                    key={srv.id}
                    srv={srv}
                    onClick={() => {
                      if (onOpenDetalle) onOpenDetalle(srv.id);
                      else setDetalleId(srv.id);
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Paginación ────────────────────────────────────────────── */}
      {pagination && pagination.total_pages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          marginTop: 32,
          paddingTop: 20,
          borderTop: '1px solid #e2e8f0',
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: '7px 18px',
              borderRadius: 8,
              border: '1px solid #cbd5e0',
              background: page <= 1 ? '#f7fafc' : '#fff',
              color: page <= 1 ? '#a0aec0' : '#2d3748',
              fontSize: 13,
              fontWeight: 600,
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Anterior
          </button>

          <span style={{ fontSize: 13, color: '#4a5568', fontWeight: 500 }}>
            Página {pagination.page} de {pagination.total_pages}
            <span style={{ color: '#a0aec0', marginLeft: 8 }}>
              ({pagination.total} {pagination.total === 1 ? 'orden' : 'órdenes'})
            </span>
          </span>

          <button
            onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
            disabled={page >= pagination.total_pages}
            style={{
              padding: '7px 18px',
              borderRadius: 8,
              border: '1px solid #cbd5e0',
              background: page >= pagination.total_pages ? '#f7fafc' : '#fff',
              color: page >= pagination.total_pages ? '#a0aec0' : '#2d3748',
              fontSize: 13,
              fontWeight: 600,
              cursor: page >= pagination.total_pages ? 'not-allowed' : 'pointer',
            }}
          >
            Siguiente →
          </button>
        </div>
      )}
      {/* ── Modal de detalle ──────────────────────────────────────── */}
      {detalleId !== null && (
        <ServicioDetalleModal
          servicioId={detalleId}
          onClose={() => setDetalleId(null)}
          onUpdated={() => { /* historial es solo lectura, no necesita recargar */ }}
        />
      )}
    </div>
  );
};

export default HistorialServiciosView;
