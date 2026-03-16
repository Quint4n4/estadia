import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tallerService } from '../api/taller.service';
import type { ServicioMotoList, ServicioStatus } from '../types/taller.types';
import ServicioDetalleModal from '../components/taller/ServicioDetalleModal';

// ──────────────────────────────────────────────────────────────────────────────
// Columnas del Kanban (excluye ENTREGADO que va al historial)
// ──────────────────────────────────────────────────────────────────────────────

const COLUMNS: { status: ServicioStatus; label: string; color: string; bg: string }[] = [
  { status: 'RECIBIDO',         label: 'Recibidos',         color: '#718096', bg: '#f7fafc' },
  { status: 'EN_PROCESO',       label: 'En proceso',        color: '#3182ce', bg: '#ebf8ff' },
  { status: 'COTIZACION_EXTRA', label: 'Cotización extra',  color: '#d69e2e', bg: '#fffbeb' },
  { status: 'LISTO',            label: 'Listos',            color: '#38a169', bg: '#f0fff4' },
];

const POLL_INTERVAL = 20_000; // refresco automático cada 20 s

// ──────────────────────────────────────────────────────────────────────────────

const JefeMecanicoPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
      const data = await tallerService.listServicios({ sede_id: sedeId });
      setServicios(data);
    } catch { /* silencioso en polling */ }
    finally { setLoading(false); }
  }, [sedeId]);

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

  // Agrupa por status
  const byStatus = (status: ServicioStatus) =>
    servicios.filter(s => s.status === status);

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
        display: 'flex', gap: 16, padding: '16px 20px',
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
                  minWidth: 280, width: 300, flexShrink: 0,
                  display: 'flex', flexDirection: 'column',
                  background: col.bg,
                  border: `1px solid ${col.color}30`,
                  borderTop: `3px solid ${col.color}`,
                  borderRadius: 10,
                  maxHeight: '100%',
                }}
              >
                {/* Columna header */}
                <div style={{
                  padding: '12px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: `1px solid ${col.color}20`,
                }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: col.color }}>
                    {col.label}
                  </span>
                  <span style={{
                    background: col.color, color: '#fff',
                    borderRadius: 12, width: 24, height: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
                  {cards.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#a0aec0', fontSize: 13, marginTop: 20 }}>
                      Sin servicios
                    </p>
                  ) : (
                    cards.map(srv => (
                      <div
                        key={srv.id}
                        onClick={() => setDetalleId(srv.id)}
                        style={{
                          background: '#fff',
                          borderRadius: 8,
                          padding: '12px 12px',
                          marginBottom: 8,
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,.08)',
                          borderLeft: srv.tiene_extra_pendiente ? '3px solid #d69e2e' : '3px solid transparent',
                          transition: 'transform .1s, box-shadow .1s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 10px rgba(0,0,0,.12)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.transform = 'none';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,.08)';
                        }}
                      >
                        {/* Folio + alerta extra */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#2d3748' }}>
                            {srv.folio}
                          </span>
                          {srv.tiene_extra_pendiente && (
                            <span style={{ fontSize: 10, background: '#fbd38d', color: '#744210', borderRadius: 8, padding: '2px 6px' }}>
                              ⚠ Extra
                            </span>
                          )}
                        </div>

                        {/* Moto */}
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 4 }}>
                          {srv.moto_display}
                        </p>

                        {/* Descripción */}
                        <p style={{
                          fontSize: 12, color: '#718096', marginBottom: 8,
                          display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {srv.descripcion_problema}
                        </p>

                        {/* Footer de card */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a0aec0' }}>
                          <span>
                            {srv.mecanico_nombre
                              ? `🔧 ${srv.mecanico_nombre}`
                              : <span style={{ color: '#e53e3e' }}>Sin asignar</span>
                            }
                          </span>
                          <span>⏱ {fmtMin(srv.tiempo_recibido)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal detalle */}
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

export default JefeMecanicoPanel;
