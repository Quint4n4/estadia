import React, { useEffect, useState, useCallback } from 'react';
import { tallerService } from '../../api/taller.service';
import { useAuth } from '../../contexts/AuthContext';
import type { ServicioMotoList, ServicioStatus } from '../../types/taller.types';
import NuevoServicioModal from './NuevoServicioModal';
import ServicioDetalleModal from './ServicioDetalleModal';

interface Props {
  sedeId: number;
}

/* ── Configuración de estatus ─────────────────────────────────────────── */
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

/* Chip de estatus con badge color sólido (usado en lista compacta) */
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

const FILTROS: { value: ServicioStatus | ''; label: string }[] = [
  { value: '',                    label: 'Todos (activos)' },
  { value: 'RECIBIDO',            label: 'Recibidos' },
  { value: 'EN_DIAGNOSTICO',      label: 'En diagnóstico' },
  { value: 'EN_PROCESO',          label: 'En proceso' },
  { value: 'COTIZACION_EXTRA',    label: 'Cotización extra' },
  { value: 'LISTA_PARA_ENTREGAR', label: 'Listas para entregar' },
  { value: 'ENTREGADO',           label: 'Entregadas' },
  { value: 'CANCELADO',           label: 'Canceladas' },
];

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

/* ── Icono flecha derecha ────────────────────────────────────────────── */
const ArrowRight: React.FC<{ color?: string; shifted?: boolean }> = ({ color = 'currentColor', shifted = false }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transition: 'transform 200ms ease', transform: shifted ? 'translateX(4px)' : 'translateX(0)' }}
  >
    <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

/* ── Componente de tarjeta individual ────────────────────────────────── */
interface CardProps {
  srv: ServicioMotoList;
  onClick: () => void;
}

const MotoServiceCard: React.FC<CardProps> = ({ srv, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const st = STATUS_STYLE[srv.status];

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
        border: srv.tiene_extra_pendiente ? '2px solid #f6ad55' : '1px solid #f0f0f0',
        position: 'relative',
      }}
    >
      {/* Badge extra pendiente */}
      {srv.tiene_extra_pendiente && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          background: '#fbd38d', color: '#744210',
          borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700,
          letterSpacing: '.3px',
        }}>
          ⚠ Extra
        </span>
      )}

      {/* Área visual — gradiente + ícono */}
      <div style={{
        height: 88,
        borderRadius: 12,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${st.gradFrom}, ${st.gradTo})`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dot decorativo grande */}
        <span style={{
          position: 'absolute', bottom: -8, left: 6,
          width: 28, height: 28, borderRadius: '50%',
          background: st.dotColor, opacity: 0.15,
        }} />
        {/* Dot decorativo pequeño */}
        <span style={{
          position: 'absolute', top: 6, right: 10,
          width: 10, height: 10, borderRadius: '50%',
          background: st.dotColor, opacity: 0.35,
        }} />

        <div style={{
          transform: hovered ? 'scale(1.12)' : 'scale(1)',
          transition: 'transform 300ms ease',
        }}>
          <BikeIcon size={38} color={st.color} />
        </div>
      </div>

      {/* Contenido textual */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <h3 style={{
          fontSize: 15,
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
        <p style={{ fontSize: 12, color: '#a0aec0', margin: 0 }}>
          {srv.folio}
        </p>
        {srv.cliente_nombre && (
          <p style={{ fontSize: 12, color: '#718096', margin: 0 }}>
            👤 {srv.cliente_nombre}
          </p>
        )}
      </div>

      {/* Footer — estatus + flecha */}
      <div style={{
        marginTop: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: st.color }}>
          {STATUS_LABEL[srv.status]}
        </span>
        <ArrowRight color={st.color} shifted={hovered} />
      </div>
      {srv.status === 'EN_DIAGNOSTICO' && (srv as any).diagnostico_listo && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: '#ebf8ff', border: '1px solid #90cdf4',
          color: '#2b6cb0', borderRadius: 10, padding: '2px 8px',
          fontSize: 10, fontWeight: 700, marginTop: 4,
        }}>
          📋 Listo para autorizar
        </span>
      )}
    </div>
  );
};

/* ── Vista principal ─────────────────────────────────────────────────── */
const ServiciosView: React.FC<Props> = ({ sedeId }) => {
  const { user } = useAuth();

  const [servicios,    setServicios]    = useState<ServicioMotoList[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<ServicioStatus | ''>('');
  const [showNuevo,    setShowNuevo]    = useState(false);
  const [detalleId,    setDetalleId]    = useState<number | null>(null);

  const cargar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await tallerService.listServicios({
        sede_id: sedeId,
        status:  filtroStatus || undefined,
        include_entregado: filtroStatus === '',
      });
      setServicios(data);
    } catch {
      if (!silent) setServicios([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sedeId, filtroStatus]);

  useEffect(() => { cargar(); }, [cargar]);

  /* Polling cada 30 s — silencioso para evitar parpadeo */
  useEffect(() => {
    const id = setInterval(() => cargar(true), 30_000);
    return () => clearInterval(id);
  }, [cargar]);

  const pendientesExtra = servicios.filter(s => s.tiene_extra_pendiente).length;

  return (
    <div style={{ padding: '0 4px' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20,
        flexWrap: 'wrap', gap: 10,
      }}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => setFiltroStatus(f.value)}
              style={{
                padding: '5px 14px', borderRadius: 20, border: 'none',
                fontSize: 12, cursor: 'pointer',
                fontWeight: filtroStatus === f.value ? 700 : 400,
                background: filtroStatus === f.value ? 'var(--color-primary)' : '#edf2f7',
                color:      filtroStatus === f.value ? '#fff' : '#4a5568',
                transition: 'all .15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {pendientesExtra > 0 && (
            <span style={{
              background: '#fbd38d', color: '#744210',
              borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
            }}>
              ⚠ {pendientesExtra} cotización{pendientesExtra > 1 ? 'es' : ''} extra pendiente{pendientesExtra > 1 ? 's' : ''}
            </span>
          )}
          <button
            className="btn btn--primary"
            onClick={() => setShowNuevo(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo servicio
          </button>
        </div>
      </div>

      {/* ── Contenido ───────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#a0aec0' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚙️</div>
          <p style={{ margin: 0 }}>Cargando servicios…</p>
        </div>
      ) : servicios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#a0aec0' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🔧</div>
          <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>Sin servicios activos</p>
          <p style={{ fontSize: 14, margin: 0 }}>Crea un nuevo servicio cuando recibas una moto.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 18,
        }}>
          {servicios.map(srv => (
            <MotoServiceCard
              key={srv.id}
              srv={srv}
              onClick={() => setDetalleId(srv.id)}
            />
          ))}
        </div>
      )}

      {/* ── Modales ─────────────────────────────────────────────────── */}
      {showNuevo && (
        <NuevoServicioModal
          sedeId={sedeId}
          onClose={() => setShowNuevo(false)}
          onCreated={cargar}
        />
      )}

      {detalleId !== null && (
        <ServicioDetalleModal
          servicioId={detalleId}
          onClose={() => setDetalleId(null)}
          onUpdated={cargar}
        />
      )}
    </div>
  );
};

export default ServiciosView;
