import React, { useEffect, useState } from 'react';
import { X, ShoppingBag, CreditCard, Banknote, ArrowLeftRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { salesService } from '../../../api/sales.service';
import type { Venta, MetodoPago } from '../../../types/sales.types';

interface Props {
  fechaDesde: string;
  fechaHasta: string;
  sedeId?:   number;
  titulo:    string;
  onClose:   () => void;
}

const fmt = (n: string | number) =>
  parseFloat(String(n)).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const METODO_ICON: Record<MetodoPago, React.ReactNode> = {
  EFECTIVO:      <Banknote size={13} />,
  TARJETA:       <CreditCard size={13} />,
  TRANSFERENCIA: <ArrowLeftRight size={13} />,
};

const METODO_COLOR: Record<MetodoPago, string> = {
  EFECTIVO:      '#276749',
  TARJETA:       '#2b6cb0',
  TRANSFERENCIA: '#6b46c1',
};

const VentasDelDiaModal: React.FC<Props> = ({ fechaDesde, fechaHasta, sedeId, titulo, onClose }) => {
  const [ventas,   setVentas]   = useState<Venta[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const PAGE_SIZE = 30;

  useEffect(() => {
    setLoading(true);
    setError('');
    salesService.listVentas({
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      sede_id:     sedeId,
      status:      'COMPLETADA',
      page,
      page_size:   PAGE_SIZE,
    }).then(res => {
      setVentas(res.data.ventas);
      setTotal(res.data.pagination.total);
    }).catch(() => setError('Error al cargar las ventas.'))
      .finally(() => setLoading(false));
  }, [fechaDesde, fechaHasta, sedeId, page]);

  // KPIs rápidos
  const totalMonto = ventas.reduce((s, v) => s + parseFloat(v.total), 0);
  const byMetodo = ventas.reduce<Record<string, { count: number; monto: number }>>((acc, v) => {
    const m = v.metodo_pago;
    if (!acc[m]) acc[m] = { count: 0, monto: 0 };
    acc[m].count += 1;
    acc[m].monto += parseFloat(v.total);
    return acc;
  }, {});

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 820,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '18px 24px 14px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '14px 14px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ color: '#fff', margin: 0, fontSize: 16, fontWeight: 700 }}>{titulo}</h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: 11 }}>
                {fechaDesde === fechaHasta ? fechaDesde : `${fechaDesde} — ${fechaHasta}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* KPI strip */}
        {!loading && ventas.length > 0 && (
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0', background: '#f7fafc' }}>
            <div style={{ flex: 1, padding: '12px 20px', borderRight: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total ventas</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#2d3748' }}>{total}</div>
            </div>
            <div style={{ flex: 1, padding: '12px 20px', borderRight: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monto total</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#276749' }}>{fmt(totalMonto)}</div>
            </div>
            {Object.entries(byMetodo).map(([metodo, val]) => (
              <div key={metodo} style={{ flex: 1, padding: '12px 20px', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: METODO_COLOR[metodo as MetodoPago] }}>{METODO_ICON[metodo as MetodoPago]}</span>
                  {metodo.charAt(0) + metodo.slice(1).toLowerCase()}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2d3748' }}>{val.count} <span style={{ fontWeight: 400, color: '#718096', fontSize: 12 }}>{fmt(val.monto)}</span></div>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, color: '#718096' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} /> Cargando ventas…
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#c53030' }}>{error}</div>
          ) : ventas.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#a0aec0' }}>
              <ShoppingBag size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: 15 }}>Sin ventas en este período</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Folio', 'Fecha/Hora', 'Sede', 'Cajero', 'Método', 'Total', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#4a5568', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ventas.map(v => (
                  <React.Fragment key={v.id}>
                    <tr
                      style={{ borderBottom: '1px solid #f0f4f8', cursor: 'pointer', background: expanded === v.id ? '#f0fff4' : 'transparent' }}
                      onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                    >
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#2b6cb0' }}>#{v.id}</td>
                      <td style={{ padding: '10px 16px', color: '#4a5568' }}>
                        {new Date(v.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })}{' '}
                        <span style={{ color: '#a0aec0' }}>{new Date(v.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#4a5568' }}>{v.sede_name}</td>
                      <td style={{ padding: '10px 16px', color: '#4a5568' }}>{v.cajero_name}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: METODO_COLOR[v.metodo_pago] + '18', color: METODO_COLOR[v.metodo_pago] }}>
                          {METODO_ICON[v.metodo_pago]} {v.metodo_pago.charAt(0) + v.metodo_pago.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#276749' }}>{fmt(v.total)}</td>
                      <td style={{ padding: '10px 16px', color: '#a0aec0' }}>
                        {expanded === v.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>
                    {expanded === v.id && (
                      <tr style={{ background: '#f0fff4' }}>
                        <td colSpan={7} style={{ padding: '0 16px 14px 32px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 4 }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #9ae6b4' }}>
                                <th style={{ padding: '4px 8px', textAlign: 'left', color: '#276749', fontWeight: 600 }}>Producto/Servicio</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right', color: '#276749', fontWeight: 600 }}>Cant.</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right', color: '#276749', fontWeight: 600 }}>P. Unit.</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right', color: '#276749', fontWeight: 600 }}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.items.map(it => (
                                <tr key={it.id} style={{ borderBottom: '1px solid #c6f6d5' }}>
                                  <td style={{ padding: '4px 8px', color: '#2d3748' }}>{it.producto_name} <span style={{ color: '#a0aec0' }}>{it.producto_sku}</span></td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#4a5568' }}>{it.quantity}</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#4a5568' }}>{fmt(it.unit_price)}</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600, color: '#276749' }}>{fmt(it.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12, color: '#4a5568' }}>
                            <span>Subtotal: <b>{fmt(v.subtotal)}</b></span>
                            {parseFloat(v.descuento) > 0 && <span style={{ color: '#c53030' }}>Descuento: -<b>{fmt(v.descuento)}</b></span>}
                            <span style={{ fontWeight: 700, color: '#276749' }}>Total: <b>{fmt(v.total)}</b></span>
                            {v.metodo_pago === 'EFECTIVO' && parseFloat(v.cambio) > 0 && <span>Cambio: <b>{fmt(v.cambio)}</b></span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#718096' }}>Página {page} de {totalPages} ({total} ventas)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>‹ Ant</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>Sig ›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VentasDelDiaModal;
