import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tallerService } from '../api/taller.service';
import type { ServicioMotoList, SolicitudCreatePayload } from '../types/taller.types';
import ServicioDetalleModal from '../components/taller/ServicioDetalleModal';

const POLL_INTERVAL = 12_000;

// ─── Modal para solicitar refacción extra ──────────────────────────────────────

interface SolicitudModalProps {
  servicioId: number;
  sedeId: number;
  onClose: () => void;
  onSent: () => void;
}

const SolicitudModal: React.FC<SolicitudModalProps> = ({ servicioId, onClose, onSent }) => {
  const [productoId, setProductoId] = useState('');
  const [cantidad,   setCantidad]   = useState('1');
  const [motivo,     setMotivo]     = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId || !motivo.trim()) {
      setError('ID del producto y motivo son requeridos.');
      return;
    }
    const payload: SolicitudCreatePayload = {
      servicio:  servicioId,
      producto:  Number(productoId),
      cantidad:  Number(cantidad),
      motivo:    motivo.trim(),
    };
    setLoading(true);
    try {
      await tallerService.createSolicitud(payload);
      onSent();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2 className="modal-title">Solicitar refacción extra</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label className="form-label">ID del producto *</label>
            <input
              className="form-input"
              type="number"
              value={productoId}
              onChange={e => setProductoId(e.target.value)}
              placeholder="Busca el ID en inventario"
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="form-label">Cantidad *</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Motivo / descripción *</label>
            <textarea
              className="form-input"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              rows={3}
              placeholder="¿Por qué necesitas esta refacción?"
              style={{ resize: 'vertical' }}
              required
            />
          </div>

          {error && <div className="alert alert--error" style={{ marginBottom: 10 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MecanicoPanel ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  RECIBIDO:         '#718096',
  EN_PROCESO:       '#3182ce',
  COTIZACION_EXTRA: '#d69e2e',
  LISTO:            '#38a169',
};

const MecanicoPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [servicios,    setServicios]    = useState<ServicioMotoList[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [detalleId,    setDetalleId]    = useState<number | null>(null);
  const [solicitudId,  setSolicitudId]  = useState<number | null>(null);

  const sedeId   = user?.sede?.id ?? 0;
  const initials =
    (user?.first_name?.charAt(0) ?? '') +
    (user?.last_name?.charAt(0)  ?? '');

  const cargar = useCallback(async () => {
    if (!sedeId) return;
    try {
      const data = await tallerService.listServicios({ sede_id: sedeId });
      setServicios(data);
    } catch { /* polling silencioso */ }
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

  const handleMarcarListo = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await tallerService.marcarListo(id);
      cargar();
    } catch { /* sin alerta invasiva */ }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f0f4f8' }}>

      {/* Header */}
      <header style={{
        background: '#1a202c', color: '#fff',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-primary)' }}>MotoQFox</span>
          <span style={{ color: '#a0aec0', fontSize: 13 }}>Mis Servicios</span>
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
            <div>Mecánico</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#3182ce', color: '#fff',
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

      {/* Contenido */}
      <main style={{ flex: 1, padding: '20px', maxWidth: 900, width: '100%', margin: '0 auto' }}>

        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: '#718096' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚙</div>
            Cargando servicios asignados…
          </div>
        ) : servicios.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔧</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#4a5568' }}>Sin servicios asignados</p>
            <p style={{ color: '#a0aec0', fontSize: 14 }}>
              Cuando el jefe de mecánicos te asigne un servicio, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {servicios.map(srv => (
              <div
                key={srv.id}
                onClick={() => setDetalleId(srv.id)}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,.07)',
                  borderTop: `4px solid ${STATUS_COLOR[srv.status] ?? '#718096'}`,
                  transition: 'transform .15s, box-shadow .15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(0,0,0,.12)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.07)';
                }}
              >
                {/* Folio + tiempo */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{srv.folio}</span>
                  <span style={{ fontSize: 12, color: '#a0aec0', background: '#f7fafc', borderRadius: 8, padding: '2px 8px' }}>
                    ⏱ {fmtMin(srv.tiempo_recibido)}
                  </span>
                </div>

                {/* Moto */}
                <p style={{ fontWeight: 600, fontSize: 15, color: '#2d3748', marginBottom: 6 }}>
                  {srv.moto_display}
                </p>

                {/* Descripción */}
                <p style={{
                  fontSize: 13, color: '#718096', marginBottom: 12,
                  display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {srv.descripcion_problema}
                </p>

                {/* Alertas */}
                {srv.tiene_extra_pendiente && (
                  <div style={{
                    background: '#fffbeb', border: '1px solid #fbd38d',
                    borderRadius: 8, padding: '6px 10px', marginBottom: 10,
                    fontSize: 12, color: '#744210',
                  }}>
                    ⚠ Tienes una solicitud de refacción pendiente de respuesta
                  </div>
                )}

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {srv.status === 'EN_PROCESO' && (
                    <>
                      <button
                        className="btn btn--success btn--sm"
                        style={{ flex: 1 }}
                        onClick={e => handleMarcarListo(srv.id, e)}
                      >
                        ✓ Listo
                      </button>
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={e => { e.stopPropagation(); setSolicitudId(srv.id); }}
                      >
                        + Refacción
                      </button>
                    </>
                  )}
                  {srv.status === 'COTIZACION_EXTRA' && (
                    <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#d69e2e', fontWeight: 600, padding: '6px 0' }}>
                      Esperando aprobación del cajero…
                    </div>
                  )}
                  {srv.status === 'RECIBIDO' && (
                    <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#718096', padding: '6px 0' }}>
                      En espera de inicio
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modales */}
      {detalleId !== null && (
        <ServicioDetalleModal
          servicioId={detalleId}
          onClose={() => setDetalleId(null)}
          onUpdated={cargar}
        />
      )}

      {solicitudId !== null && (
        <SolicitudModal
          servicioId={solicitudId}
          sedeId={sedeId}
          onClose={() => setSolicitudId(null)}
          onSent={cargar}
        />
      )}
    </div>
  );
};

export default MecanicoPanel;
