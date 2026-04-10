import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tallerService } from '../api/taller.service';
import type { ServicioMotoList, ServicioStatus } from '../types/taller.types';
import ServicioDetalleModal from '../components/taller/ServicioDetalleModal';
import { useTallerOffline } from '../hooks/useTallerOffline';
import { db } from '../db/localDB';

// ──────────────────────────────────────────────────────────────────────────────
// Columnas del Kanban
// ──────────────────────────────────────────────────────────────────────────────

const COLUMNS: { status: ServicioStatus; label: string; color: string; bg: string; emoji: string }[] = [
  { status: 'RECIBIDO',            label: 'Recibidos',            color: '#c05621', bg: '#fffbeb', emoji: '📥' },
  { status: 'EN_DIAGNOSTICO',      label: 'En diagnóstico',       color: '#6b46c1', bg: '#faf5ff', emoji: '🔍' },
  { status: 'EN_PROCESO',          label: 'En proceso',           color: '#2b6cb0', bg: '#ebf8ff', emoji: '⚙️' },
  { status: 'COTIZACION_EXTRA',    label: 'Cotización extra',     color: '#b7791f', bg: '#fffbeb', emoji: '💬' },
  { status: 'LISTA_PARA_ENTREGAR', label: 'Lista para entregar',  color: '#2c7a7b', bg: '#e6fffa', emoji: '🏷️' },
  { status: 'CANCELADO',           label: 'Canceladas',           color: '#c53030', bg: '#fff5f5', emoji: '🚫' },
  { status: 'ENTREGADO',           label: 'Entregadas',           color: '#553c9a', bg: '#f3e8ff', emoji: '🏁' },
];

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

const POLL_INTERVAL = 20_000;

// ── Icono de moto ─────────────────────────────────────────────────────────────
const BikeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 28, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M8 17.5h7" />
    <path d="M8 17.5L12 8l3 4 2-4" />
    <path d="M12 8h4" />
    <path d="M19 8l-1 9.5" />
  </svg>
);

// ── Card de kanban con diseño v0 ──────────────────────────────────────────────
interface KanbanCardProps {
  srv: ServicioMotoList;
  onClick: () => void;
  fmtMin: (m: number) => string;
  isCurrentUser: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ srv, onClick, fmtMin, isCurrentUser }) => {
  const [hovered, setHovered] = useState(false);
  const st = STATUS_STYLE[srv.status];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 12,
        marginBottom: 10,
        cursor: 'pointer',
        boxShadow: hovered ? '0 6px 18px rgba(0,0,0,.13)' : '0 1px 4px rgba(0,0,0,.07)',
        transition: 'box-shadow 250ms ease',
        border: srv.tiene_extra_pendiente ? '2px solid #f6ad55' : '1px solid #f0f0f0',
        overflow: 'hidden',
      }}
    >
      {/* Franja de gradiente con ícono */}
      <div style={{
        height: 62,
        background: `linear-gradient(135deg, ${st.gradFrom}, ${st.gradTo})`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dot decorativo */}
        <span style={{
          position: 'absolute', bottom: -6, right: 10,
          width: 24, height: 24, borderRadius: '50%',
          background: st.dotColor, opacity: 0.2,
        }} />
        <span style={{
          position: 'absolute', top: 4, left: 8,
          width: 8, height: 8, borderRadius: '50%',
          background: st.dotColor, opacity: 0.35,
        }} />

        <div style={{ transform: hovered ? 'scale(1.1)' : 'scale(1)', transition: 'transform 250ms ease' }}>
          <BikeIcon size={28} color={st.color} />
        </div>

        {/* Badge extra */}
        {srv.tiene_extra_pendiente && (
          <span style={{
            background: '#fbd38d', color: '#744210',
            borderRadius: 8, padding: '2px 7px', fontSize: 10, fontWeight: 700,
          }}>
            ⚠ Extra
          </span>
        )}

        {/* Tiempo */}
        <span style={{ fontSize: 11, color: st.color, fontWeight: 600, opacity: 0.8 }}>
          ⏱ {fmtMin(srv.tiempo_recibido)}
        </span>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{
          fontWeight: 700, fontSize: 13, color: '#1a202c',
          margin: '0 0 2px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {srv.moto_display || 'Sin moto'}
        </p>
        <p style={{ fontSize: 11, color: '#a0aec0', margin: '0 0 6px' }}>{srv.folio}</p>

        {srv.descripcion_problema && (
          <p style={{
            fontSize: 12, color: '#718096', margin: '0 0 8px',
            display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {srv.descripcion_problema}
          </p>
        )}

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 11, color: '#a0aec0',
          borderTop: '1px solid #f0f0f0', paddingTop: 6, marginTop: 2,
        }}>
          <span>
            {srv.mecanico_nombre
              ? (
                <>
                  {`🔧 ${srv.mecanico_nombre}`}
                  {isCurrentUser && (
                    <span style={{ background: '#553c9a', color: '#fff', borderRadius: 8, padding: '1px 6px', fontSize: 9, fontWeight: 700, marginLeft: 4 }}>JEFE</span>
                  )}
                </>
              )
              : <span style={{ color: '#e53e3e', fontWeight: 600 }}>Sin asignar</span>
            }
          </span>
          <span style={{ color: '#718096' }}>👤 {srv.cliente_nombre || 'General'}</span>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────

const JefeMecanicoPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cacheServicios } = useTallerOffline();

  const [servicios,  setServicios]  = useState<ServicioMotoList[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [detalleId,  setDetalleId]  = useState<number | null>(null);

  const sedeId   = user?.sede?.id ?? 0;
  const initials =
    (user?.first_name?.charAt(0) ?? '') +
    (user?.last_name?.charAt(0)  ?? '');

  const cargar = useCallback(async () => {
    if (!sedeId) return;
    try {
      const data = await tallerService.listServicios({ sede_id: sedeId, include_entregado: true });
      setServicios(data);
      await cacheServicios(sedeId, data);
    } catch {
      // Sin red: cargar desde IndexedDB
      const locales = await db.servicios.where('sedeId').equals(sedeId).toArray();
      if (locales.length > 0) {
        setServicios(locales.map((s, idx) => ({
          id: s.serverId ?? -(idx + 1),
          folio: s.serverId ? `SVC-${s.serverId}` : `OFFLINE-${s.localId.slice(0,8)}`,
          sede_nombre: '', cliente_nombre: s.clienteNombre ?? '', moto_display: s.motoDisplay ?? '',
          cajero_nombre: '', mecanico_nombre: null, status: s.status, status_display: s.status,
          pago_status: s.pagoStatus, pago_status_display: s.pagoStatus,
          mano_de_obra: '0', total_refacciones: '0', total: s.total ?? '0',
          descripcion_problema: s.descripcion, tiempo_recibido: 0, tiene_extra_pendiente: false,
          archivado: false, fecha_recepcion: s.timestamp,
          fecha_entrega_estimada: null, fecha_archivado: null, archivado_por_nombre: null, diagnostico_listo: false,
          _localId: s.localId,
        } as ServicioMotoList)));
      }
    }
    finally { setLoading(false); }
  }, [sedeId, cacheServicios]);

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, POLL_INTERVAL);
    return () => clearInterval(iv);
  }, [cargar]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const fmtMin = (min: number) => {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    return `${h}h ${min % 60}m`;
  };

  const byStatus = (status: ServicioStatus) =>
    servicios.filter(s =>
      status === 'LISTA_PARA_ENTREGAR'
        ? s.status === 'LISTA_PARA_ENTREGAR' || s.status === 'LISTO'
        : s.status === status
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f0f4f8' }}>

      {/* Header */}
      <header style={{
        background: '#1a202c', color: '#fff',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-primary)' }}>MotoQFox</span>
          <span style={{ color: '#a0aec0', fontSize: 13 }}>Taller — Tablero Kanban</span>
          {user?.sede && (
            <span style={{
              background: '#2d3748', borderRadius: 12, padding: '2px 10px',
              fontSize: 12, color: '#e2e8f0',
            }}>
              📍 {user.sede.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#a0aec0' }}>
            <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{user?.full_name}</div>
            <div>Jefe de Mecánicos</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--color-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14,
          }}>
            {initials}
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent', border: '1px solid #4a5568',
              borderRadius: 8, color: '#a0aec0', cursor: 'pointer',
              padding: '6px 12px', fontSize: 12,
            }}
          >
            Salir
          </button>
        </div>
      </header>

      {/* Kanban body */}
      <div style={{
        flex: 1, overflowX: 'auto', overflowY: 'hidden',
        display: 'flex', gap: 14, padding: '16px 20px',
      }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096', fontSize: 15 }}>
            Cargando servicios…
          </div>
        ) : (
          COLUMNS.map(col => {
            const cards = byStatus(col.status);
            return (
              <div
                key={col.status}
                style={{
                  minWidth: 270, width: 290, flexShrink: 0,
                  display: 'flex', flexDirection: 'column',
                  background: col.bg,
                  border: `1px solid ${col.color}28`,
                  borderTop: `3px solid ${col.color}`,
                  borderRadius: 12,
                  maxHeight: '100%',
                }}
              >
                {/* Cabecera de columna */}
                <div style={{
                  padding: '11px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: `1px solid ${col.color}18`,
                }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: col.color }}>
                    {col.emoji} {col.label}
                  </span>
                  <span style={{
                    background: col.color, color: '#fff',
                    borderRadius: 10, minWidth: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, padding: '0 6px',
                  }}>
                    {cards.length}
                  </span>
                </div>

                {/* Cards con scroll */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 6px' }}>
                  {cards.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#c0c9d4', fontSize: 12, marginTop: 24 }}>
                      Sin servicios
                    </p>
                  ) : (
                    cards.map(srv => (
                      <KanbanCard
                        key={srv.id}
                        srv={srv}
                        onClick={() => setDetalleId(srv.id)}
                        fmtMin={fmtMin}
                        isCurrentUser={!!(srv.mecanico_nombre && user?.full_name && srv.mecanico_nombre === user.full_name)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal detalle */}
      {detalleId !== null && (() => {
        const detalleServicio = servicios.find(s => s.id === detalleId);
        const detalleLocalId  = detalleServicio ? (detalleServicio as any)._localId as string | undefined : undefined;
        return (
          <ServicioDetalleModal
            servicioId={Math.max(detalleId, 0)}
            localId={detalleLocalId}
            onClose={() => setDetalleId(null)}
            onUpdated={cargar}
          />
        );
      })()}
    </div>
  );
};

export default JefeMecanicoPanel;
