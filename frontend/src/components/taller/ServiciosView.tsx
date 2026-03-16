import React, { useEffect, useState, useCallback } from 'react';
import { tallerService } from '../../api/taller.service';
import { useAuth } from '../../contexts/AuthContext';
import type { ServicioMotoList, ServicioStatus } from '../../types/taller.types';
import NuevoServicioModal from './NuevoServicioModal';
import ServicioDetalleModal from './ServicioDetalleModal';

interface Props {
  sedeId: number;
}

const STATUS_LABEL: Record<ServicioStatus, string> = {
  RECIBIDO:         'Recibido',
  EN_PROCESO:       'En proceso',
  COTIZACION_EXTRA: 'Cotización extra',
  LISTO:            'Listo',
  ENTREGADO:        'Entregado',
};

const STATUS_COLOR: Record<ServicioStatus, string> = {
  RECIBIDO:         '#718096',
  EN_PROCESO:       '#3182ce',
  COTIZACION_EXTRA: '#d69e2e',
  LISTO:            '#38a169',
  ENTREGADO:        '#553c9a',
};

const STATUS_BG: Record<ServicioStatus, string> = {
  RECIBIDO:         '#edf2f7',
  EN_PROCESO:       '#ebf8ff',
  COTIZACION_EXTRA: '#fffbeb',
  LISTO:            '#f0fff4',
  ENTREGADO:        '#faf5ff',
};

const FILTROS: { value: ServicioStatus | ''; label: string }[] = [
  { value: '',                label: 'Todos (activos)' },
  { value: 'RECIBIDO',        label: 'Recibidos' },
  { value: 'EN_PROCESO',      label: 'En proceso' },
  { value: 'COTIZACION_EXTRA', label: 'Cotización extra' },
  { value: 'LISTO',           label: 'Listos' },
];

const ServiciosView: React.FC<Props> = ({ sedeId }) => {
  const { user } = useAuth();

  const [servicios,   setServicios]   = useState<ServicioMotoList[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<ServicioStatus | ''>('');
  const [showNuevo,   setShowNuevo]   = useState(false);
  const [detalleId,   setDetalleId]   = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tallerService.listServicios({
        sede_id: sedeId,
        status:  filtroStatus || undefined,
      });
      setServicios(data);
    } catch {
      setServicios([]);
    } finally {
      setLoading(false);
    }
  }, [sedeId, filtroStatus]);

  useEffect(() => { cargar(); }, [cargar]);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const fmtMin = (min: number) => {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    return `${h}h ${min % 60}m`;
  };

  const pendientesExtra = servicios.filter(s => s.tiene_extra_pendiente).length;

  return (
    <div style={{ padding: '0 4px' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => setFiltroStatus(f.value)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                fontSize: 13, cursor: 'pointer', fontWeight: filtroStatus === f.value ? 600 : 400,
                background: filtroStatus === f.value ? 'var(--color-primary)' : '#edf2f7',
                color:      filtroStatus === f.value ? '#fff' : '#4a5568',
                transition: 'all .15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo servicio
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#a0aec0' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⚙</div>
          Cargando servicios…
        </div>
      ) : servicios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#a0aec0' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🔧</div>
          <p style={{ fontWeight: 600, fontSize: 16 }}>Sin servicios activos</p>
          <p style={{ fontSize: 14 }}>Crea un nuevo servicio cuando recibas una moto.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {servicios.map(srv => (
            <div
              key={srv.id}
              onClick={() => setDetalleId(srv.id)}
              style={{
                background: STATUS_BG[srv.status],
                border: `1px solid ${srv.tiene_extra_pendiente ? '#fbd38d' : '#e2e8f0'}`,
                borderLeft: `4px solid ${STATUS_COLOR[srv.status]}`,
                borderRadius: 10, padding: '14px 16px',
                cursor: 'pointer', transition: 'box-shadow .15s',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 8,
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              {/* Columna izquierda */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#2d3748' }}>
                    {srv.folio}
                  </span>
                  <span style={{
                    background: STATUS_COLOR[srv.status], color: '#fff',
                    borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 600,
                  }}>
                    {STATUS_LABEL[srv.status]}
                  </span>
                  {srv.tiene_extra_pendiente && (
                    <span style={{
                      background: '#fbd38d', color: '#744210',
                      borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 600,
                    }}>
                      Extra pendiente
                    </span>
                  )}
                </div>

                <p style={{ fontSize: 14, color: '#4a5568', marginBottom: 4 }}>
                  <strong>{srv.moto_display}</strong>
                  {srv.moto_display && ' · '}
                  {srv.descripcion_problema}
                </p>

                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#718096', flexWrap: 'wrap' }}>
                  <span>👤 {srv.cliente_nombre || 'Público general'}</span>
                  {srv.mecanico_nombre && <span>🔧 {srv.mecanico_nombre}</span>}
                  <span>📅 {fmt(srv.fecha_recepcion)}</span>
                  <span>⏱ {fmtMin(srv.tiempo_recibido)}</span>
                </div>
              </div>

              {/* Columna derecha — Totales */}
              <div style={{ textAlign: 'right', minWidth: 100 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)' }}>
                  ${Number(srv.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <p style={{
                  fontSize: 11, fontWeight: 600,
                  color: srv.pago_status === 'PAGADO' ? '#38a169' : '#d69e2e',
                }}>
                  {srv.pago_status_display}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
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
