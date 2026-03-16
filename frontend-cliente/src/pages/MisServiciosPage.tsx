import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, ChevronRight } from 'lucide-react';
import { customersService } from '../api/customers.service';
import type { ServicioMotoCliente, ServicioStatus } from '../types/customer.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ServicioStatus, string> = {
  RECIBIDO:         'Recibido',
  EN_PROCESO:       'En proceso',
  COTIZACION_EXTRA: 'Pendiente aprobación',
  LISTO:            '¡Listo para recoger!',
  ENTREGADO:        'Entregado',
};

const STATUS_COLOR: Record<ServicioStatus, string> = {
  RECIBIDO:         'var(--c-text-dis)',
  EN_PROCESO:       '#3182ce',
  COTIZACION_EXTRA: '#d69e2e',
  LISTO:            'var(--c-success)',
  ENTREGADO:        '#553c9a',
};

const STATUS_BG: Record<ServicioStatus, string> = {
  RECIBIDO:         '#f7fafc',
  EN_PROCESO:       '#ebf8ff',
  COTIZACION_EXTRA: '#fffbeb',
  LISTO:            '#f0fff4',
  ENTREGADO:        '#faf5ff',
};

const fmt = (n: string | number) =>
  Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Component ─────────────────────────────────────────────────────────────────

const MisServiciosPage: React.FC = () => {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState<ServicioMotoCliente[]>([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await customersService.getMisServicios();
      setServicios(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!loading && servicios.length === 0) {
    return (
      <div className="screen">
        <div className="page-header">
          <h1 className="page-title">Mis servicios</h1>
        </div>
        <div className="empty-state">
          <Wrench size={48} strokeWidth={1.5} />
          <h3>Sin servicios registrados</h3>
          <p>Cuando lleves tu moto al taller, podrás ver el seguimiento aquí.</p>
        </div>
      </div>
    );
  }

  // Separar activos de entregados
  const activos    = servicios.filter(s => s.status !== 'ENTREGADO');
  const entregados = servicios.filter(s => s.status === 'ENTREGADO');

  return (
    <div className="screen">
      <div className="page-header">
        <h1 className="page-title">Mis servicios</h1>
        {servicios.length > 0 && (
          <span style={{ fontSize: 13, color: 'var(--c-text-sec)' }}>
            {servicios.length} total
          </span>
        )}
      </div>

      <div style={{ padding: '0 0 100px' }}>

        {/* Activos */}
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14, margin: '0 20px 12px' }} />
          ))
        ) : (
          <>
            {activos.length > 0 && (
              <div style={{ padding: '0 20px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-dis)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Activos
                </p>
                {activos.map(srv => (
                  <ServicioCard key={srv.id} srv={srv} onClick={() => navigate(`/taller/${srv.id}`, { state: { srv } })} />
                ))}
              </div>
            )}

            {/* Entregados */}
            {entregados.length > 0 && (
              <div style={{ padding: '0 20px', marginTop: activos.length > 0 ? 24 : 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-dis)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Historial
                </p>
                {entregados.map(srv => (
                  <ServicioCard key={srv.id} srv={srv} onClick={() => navigate(`/taller/${srv.id}`, { state: { srv } })} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Tarjeta ───────────────────────────────────────────────────────────────────

const ServicioCard: React.FC<{ srv: ServicioMotoCliente; onClick: () => void }> = ({ srv, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background:   STATUS_BG[srv.status],
      borderRadius: 14,
      padding:      '14px 16px',
      marginBottom: 12,
      borderLeft:   `4px solid ${STATUS_COLOR[srv.status]}`,
      cursor:       'pointer',
      display:      'flex',
      alignItems:   'center',
      gap:          12,
      boxShadow:    '0 1px 4px rgba(0,0,0,.06)',
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Folio + estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>
          {srv.folio}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, borderRadius: 20,
          padding: '2px 8px',
          background: STATUS_COLOR[srv.status] + '20',
          color: STATUS_COLOR[srv.status],
        }}>
          {STATUS_LABEL[srv.status]}
        </span>
        {srv.tiene_extra_pendiente && (
          <span style={{
            fontSize: 10, fontWeight: 600, borderRadius: 20,
            padding: '2px 8px',
            background: '#fbd38d', color: '#744210',
          }}>
            ⚠ Cotización
          </span>
        )}
      </div>

      {/* Moto */}
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {srv.moto_display}
      </p>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--c-text-sec)', flexWrap: 'wrap' }}>
        <span>{srv.sede_nombre}</span>
        <span>·</span>
        <span>{fmtDate(srv.fecha_recepcion)}</span>
        {srv.status !== 'ENTREGADO' && (
          <>
            <span>·</span>
            <span style={{ fontWeight: 600, color: 'var(--c-primary)' }}>{fmt(srv.total)}</span>
          </>
        )}
      </div>
    </div>

    <ChevronRight size={18} color="var(--c-text-dis)" style={{ flexShrink: 0 }} />
  </div>
);

export default MisServiciosPage;
