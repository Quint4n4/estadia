import React, { useEffect, useState } from 'react';
import { tallerService } from '../../api/taller.service';
import { useAuth } from '../../contexts/AuthContext';
import type {
  ServicioMotoDetail,
  ServicioStatus,
  SolicitudRefaccionExtra,
  MetodoPago,
} from '../../types/taller.types';

interface Props {
  servicioId: number;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_LABEL: Record<ServicioStatus, string> = {
  RECIBIDO:          'Recibido',
  EN_PROCESO:        'En proceso',
  COTIZACION_EXTRA:  'Cotización extra',
  LISTO:             'Listo',
  ENTREGADO:         'Entregado',
};

const STATUS_COLOR: Record<ServicioStatus, string> = {
  RECIBIDO:          '#718096',
  EN_PROCESO:        '#3182ce',
  COTIZACION_EXTRA:  '#d69e2e',
  LISTO:             '#38a169',
  ENTREGADO:         '#553c9a',
};

const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO',     label: 'Efectivo' },
  { value: 'TARJETA',      label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

const ServicioDetalleModal: React.FC<Props> = ({ servicioId, onClose, onUpdated }) => {
  const { user } = useAuth();
  const role = user?.role ?? '';

  const [servicio, setServicio]       = useState<ServicioMotoDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [actionLoading, setAction]    = useState(false);
  const [metodo, setMetodo]           = useState<MetodoPago>('EFECTIVO');

  // Para jefe mecánico: asignar mecánico
  const [mecanicoId, setMecanicoId]   = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await tallerService.getServicio(servicioId);
      setServicio(res.data);
    } catch {
      setError('No se pudo cargar el servicio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [servicioId]);

  const handleAsignar = async () => {
    if (!mecanicoId) return;
    setAction(true);
    try {
      await tallerService.asignarMecanico(servicioId, { mecanico_id: Number(mecanicoId) });
      onUpdated(); load();
    } catch { setError('Error al asignar mecánico.'); }
    finally { setAction(false); }
  };

  const handleMarcarListo = async () => {
    setAction(true);
    try {
      await tallerService.marcarListo(servicioId);
      onUpdated(); load();
    } catch { setError('Error al marcar como listo.'); }
    finally { setAction(false); }
  };

  const handleEntregar = async () => {
    setAction(true);
    try {
      await tallerService.entregarServicio(servicioId, { metodo_pago: metodo });
      onUpdated(); onClose();
    } catch { setError('Error al entregar servicio.'); }
    finally { setAction(false); }
  };

  const handleAprobarSolicitud = async (sol: SolicitudRefaccionExtra) => {
    setAction(true);
    try {
      await tallerService.aprobarSolicitud(sol.id);
      onUpdated(); load();
    } catch { setError('Error al aprobar solicitud.'); }
    finally { setAction(false); }
  };

  const handleRechazarSolicitud = async (sol: SolicitudRefaccionExtra) => {
    setAction(true);
    try {
      await tallerService.rechazarSolicitud(sol.id);
      onUpdated(); load();
    } catch { setError('Error al rechazar solicitud.'); }
    finally { setAction(false); }
  };

  const isCajero   = ['CASHIER', 'ENCARGADO', 'ADMINISTRATOR'].includes(role);
  const isJefe     = ['JEFE_MECANICO', 'ENCARGADO', 'ADMINISTRATOR'].includes(role);
  const isMecanico = role === 'MECANICO';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box modal-box--lg"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            Detalle de Servicio
            {servicio && (
              <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 400, color: '#718096' }}>
                {servicio.folio}
              </span>
            )}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#718096' }}>
            Cargando…
          </div>
        )}

        {error && (
          <div className="alert alert--error" style={{ margin: '12px 0' }}>{error}</div>
        )}

        {!loading && servicio && (
          <div style={{ padding: '0 0 8px' }}>

            {/* Status badge + pago */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18 }}>
              <span style={{
                background: STATUS_COLOR[servicio.status],
                color: '#fff', borderRadius: 20,
                padding: '4px 14px', fontSize: 13, fontWeight: 600,
              }}>
                {STATUS_LABEL[servicio.status]}
              </span>
              <span style={{
                background: servicio.pago_status === 'PAGADO' ? '#c6f6d5' : '#feebc8',
                color:      servicio.pago_status === 'PAGADO' ? '#276749' : '#744210',
                borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 500,
              }}>
                {servicio.pago_status_display}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#a0aec0' }}>
                {servicio.mecanico_nombre ? `Mecánico: ${servicio.mecanico_nombre}` : 'Sin asignar'}
              </span>
            </div>

            {/* Dos columnas: moto + cliente / descripción */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div className="detail-block">
                <p className="detail-label">Moto</p>
                <p className="detail-value">{servicio.moto_display}</p>
                <p className="detail-label" style={{ marginTop: 8 }}>Placa</p>
                <p className="detail-value">{servicio.moto.placa || '—'}</p>
              </div>
              <div className="detail-block">
                <p className="detail-label">Cliente</p>
                <p className="detail-value">{servicio.cliente_nombre || 'Público general'}</p>
                <p className="detail-label" style={{ marginTop: 8 }}>Entrega estimada</p>
                <p className="detail-value">{servicio.fecha_entrega_estimada ?? '—'}</p>
              </div>
            </div>

            {/* Descripción del problema */}
            <div style={{ marginBottom: 18 }}>
              <p className="detail-label">Descripción del problema</p>
              <p style={{ fontSize: 14, color: '#2d3748', marginTop: 4 }}>
                {servicio.descripcion_problema}
              </p>
            </div>

            {/* Ítems */}
            {servicio.items.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <p className="detail-label" style={{ marginBottom: 8 }}>Ítems del servicio</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f7fafc' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: '#718096' }}>Descripción</th>
                      <th style={{ textAlign: 'center', padding: '6px 8px', color: '#718096' }}>Tipo</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#718096' }}>Cant.</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#718096' }}>Precio</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#718096' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicio.items.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                        <td style={{ padding: '6px 8px' }}>
                          {item.producto_nombre ?? item.descripcion}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: '#718096', fontSize: 11 }}>
                          {item.tipo_display}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{item.cantidad}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                          ${Number(item.precio_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                          ${Number(item.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totales */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 24,
              borderTop: '1px solid #e2e8f0', paddingTop: 12, marginBottom: 18,
            }}>
              <div style={{ textAlign: 'right', fontSize: 13 }}>
                <p style={{ color: '#718096' }}>Mano de obra</p>
                <p style={{ fontWeight: 600 }}>
                  ${Number(servicio.mano_de_obra).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13 }}>
                <p style={{ color: '#718096' }}>Refacciones</p>
                <p style={{ fontWeight: 600 }}>
                  ${Number(servicio.total_refacciones).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: 15 }}>
                <p style={{ color: '#718096' }}>Total</p>
                <p style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  ${Number(servicio.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Solicitudes de refacción extra (solo cajero) */}
            {isCajero && servicio.solicitudes_extra.filter(s => s.status === 'PENDIENTE').length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <p className="detail-label" style={{ marginBottom: 8, color: '#d69e2e' }}>
                  ⚠ Solicitudes de refacción extra pendientes
                </p>
                {servicio.solicitudes_extra
                  .filter(s => s.status === 'PENDIENTE')
                  .map(sol => (
                    <div key={sol.id} style={{
                      background: '#fffbeb', border: '1px solid #fbd38d',
                      borderRadius: 8, padding: '10px 14px', marginBottom: 8,
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{ flex: 1, fontSize: 13 }}>
                        <strong>{sol.producto_nombre}</strong> × {sol.cantidad}
                        <p style={{ color: '#718096', marginTop: 2 }}>{sol.motivo}</p>
                      </div>
                      <button
                        className="btn btn--success btn--sm"
                        onClick={() => handleAprobarSolicitud(sol)}
                        disabled={actionLoading}
                      >Aprobar</button>
                      <button
                        className="btn btn--danger btn--sm"
                        onClick={() => handleRechazarSolicitud(sol)}
                        disabled={actionLoading}
                      >Rechazar</button>
                    </div>
                  ))}
              </div>
            )}

            {/* Acción: asignar mecánico (jefe) */}
            {isJefe && servicio.status === 'RECIBIDO' && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <input
                  type="number"
                  placeholder="ID del mecánico"
                  value={mecanicoId}
                  onChange={e => setMecanicoId(e.target.value)}
                  style={{
                    flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0',
                    borderRadius: 8, fontSize: 14,
                  }}
                />
                <button
                  className="btn btn--primary"
                  onClick={handleAsignar}
                  disabled={actionLoading || !mecanicoId}
                >
                  Asignar mecánico
                </button>
              </div>
            )}

            {/* Acción: marcar listo (mecánico) */}
            {isMecanico && servicio.status === 'EN_PROCESO' && (
              <div style={{ marginBottom: 16 }}>
                <button
                  className="btn btn--success"
                  style={{ width: '100%' }}
                  onClick={handleMarcarListo}
                  disabled={actionLoading}
                >
                  ✓ Marcar servicio como LISTO
                </button>
              </div>
            )}

            {/* Acción: entregar y cobrar (cajero) */}
            {isCajero && servicio.status === 'LISTO' && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <select
                  value={metodo}
                  onChange={e => setMetodo(e.target.value as MetodoPago)}
                  style={{
                    flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0',
                    borderRadius: 8, fontSize: 14,
                  }}
                >
                  {METODOS_PAGO.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <button
                  className="btn btn--primary"
                  onClick={handleEntregar}
                  disabled={actionLoading}
                >
                  Entregar y cobrar
                </button>
              </div>
            )}

            {/* Notas internas */}
            {servicio.notas_internas && (
              <div style={{ marginTop: 8 }}>
                <p className="detail-label">Notas internas</p>
                <p style={{ fontSize: 13, color: '#4a5568', marginTop: 4 }}>{servicio.notas_internas}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicioDetalleModal;
