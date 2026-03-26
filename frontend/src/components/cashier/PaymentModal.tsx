import React, { useEffect, useState } from 'react';
import axios from 'axios';
import type { CartItem, MetodoPago, Venta } from '../../types/sales.types';
import { salesService } from '../../api/sales.service';

interface Props {
  sedeId:        number;
  items:         CartItem[];
  descuento:     number;
  metodoPago:    MetodoPago;
  montoPagado:   number;
  onClose:       () => void;
  onSuccess:     () => void;  // limpia carrito + cierra modal
  /** Cambia la cantidad de un ítem (delta: +1 o −1). Coincide con changeQty de POSView. */
  onChangeQty?:  (producto_id: number, delta: number) => void;
  /** Elimina un ítem del carrito por su producto_id. Coincide con removeItem de POSView. */
  onRemoveItem?: (producto_id: number) => void;
}

const fmt = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const PaymentModal: React.FC<Props> = ({
  sedeId, items, descuento, metodoPago, montoPagado,
  onClose, onSuccess, onChangeQty, onRemoveItem,
}) => {
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | React.ReactNode>('');
  const [venta,        setVenta]        = useState<Venta | null>(null);
  const [cartMsg,      setCartMsg]      = useState('');
  // UX-014: track whether the user has "touched" the monto recibido section
  // Since the modal opens with the value already set from POSView, we treat it
  // as touched from the first render so the inline error is visible immediately.
  const [montoTouched, setMontoTouched] = useState(true);

  // Cierra el modal automáticamente si el carrito queda vacío durante la edición
  useEffect(() => {
    if (!venta && items.length === 0) {
      setCartMsg('El carrito está vacío.');
      const t = setTimeout(() => { setCartMsg(''); onClose(); }, 1200);
      return () => clearTimeout(t);
    }
  }, [items.length, venta, onClose]);

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const total    = Math.max(0, subtotal - descuento);
  const cambio   = metodoPago === 'EFECTIVO' ? Math.max(0, montoPagado - total) : 0;

  // UX-014: efectivo insufficient
  const montoInsuficiente = metodoPago === 'EFECTIVO' && montoPagado < total;

  // UX-015: descuento alto (> 30 % del subtotal)
  const descuentoPct     = subtotal > 0 ? (descuento / subtotal) * 100 : 0;
  const descuentoAlto    = descuento > 0 && descuentoPct > 30;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        sede:         sedeId,
        items:        items.map(i => ({
          producto:           i.tipo === 'SERVICIO' ? null : i.producto_id,
          catalogo_servicio:  i.tipo === 'SERVICIO' ? (i.catalogo_servicio_id ?? null) : null,
          tipo:               i.tipo ?? 'PRODUCTO',
          quantity:           i.quantity,
          unit_price:         i.unit_price,
        })),
        descuento,
        metodo_pago:  metodoPago,
        monto_pagado: metodoPago === 'EFECTIVO' ? montoPagado : total,
        notas:        '',
      };
      const res = await salesService.createVenta(payload);
      setVenta(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        let errorMsg: string;
        if (data?.errors) {
          // collect all field errors
          const msgs: string[] = [];
          for (const key of Object.keys(data.errors)) {
            const val = data.errors[key];
            if (Array.isArray(val)) msgs.push(...val);
            else msgs.push(String(val));
          }
          errorMsg = msgs.join(' | ');
        } else {
          errorMsg = data?.message || 'Error al registrar la venta.';
        }

        // UX-033: stock error → actionable message with "Revisar carrito" link
        const isStockError =
          errorMsg.toLowerCase().includes('stock') ||
          errorMsg.toLowerCase().includes('inventario');

        if (isStockError) {
          setError(
            <span>
              {errorMsg}{' '}
              <button
                onClick={onClose}
                style={{
                  textDecoration: 'underline', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 'inherit',
                }}
              >
                Revisar carrito
              </button>
            </span>
          );
        } else {
          setError(errorMsg);
        }
      } else {
        console.error('[PaymentModal] Error inesperado:', err);
        setError('Error al registrar la venta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">

        {/* Header */}
        <div className="payment-modal-header">
          <h2>{venta ? 'Venta registrada' : 'Confirmar cobro'}</h2>
          {!loading && (
            <button
              className="payment-modal-close"
              onClick={venta ? onSuccess : onClose}
              title="Cerrar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="payment-modal-body">
          {!venta ? (
            <>
              {/* Mensaje de carrito vacío */}
              {cartMsg && (
                <p style={{
                  padding: '8px 12px', marginBottom: 10,
                  background: '#fff5f5', border: '1px solid #fed7d7',
                  borderRadius: 8, color: '#c53030', fontSize: 13, textAlign: 'center',
                }}>
                  {cartMsg}
                </p>
              )}

              {/* Items editables */}
              <div className="payment-items-list">
                {items.map(item => (
                  <div key={item.tipo === 'SERVICIO' ? `svc-${item.catalogo_servicio_id}` : `prd-${item.producto_id}`}
                    className="payment-item-row"
                    style={{ alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>

                    {/* Nombre del producto */}
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.producto_name}
                    </span>

                    {/* Controles de cantidad (solo si se pasaron los callbacks) */}
                    {onChangeQty && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={() => onChangeQty(item.producto_id, -1)}
                          disabled={item.quantity <= 1}
                          title="Reducir cantidad"
                          style={{
                            width: 22, height: 22, borderRadius: 4,
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-main)',
                            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                            fontSize: 14, lineHeight: 1, color: 'var(--color-text)',
                            opacity: item.quantity <= 1 ? 0.4 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >−</button>
                        <span style={{ fontSize: 13, minWidth: 22, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onChangeQty(item.producto_id, +1)}
                          disabled={item.quantity >= item.stock_disponible}
                          title="Aumentar cantidad"
                          style={{
                            width: 22, height: 22, borderRadius: 4,
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-main)',
                            cursor: item.quantity >= item.stock_disponible ? 'not-allowed' : 'pointer',
                            fontSize: 14, lineHeight: 1, color: 'var(--color-text)',
                            opacity: item.quantity >= item.stock_disponible ? 0.4 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >+</button>
                      </div>
                    )}

                    {/* Subtotal por línea */}
                    <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 70, textAlign: 'right', flexShrink: 0 }}>
                      {fmt(item.subtotal)}
                    </span>

                    {/* Botón eliminar (solo si se pasó el callback) */}
                    {onRemoveItem && (
                      <button
                        onClick={() => onRemoveItem(item.producto_id)}
                        title="Eliminar producto"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--color-danger, #e53e3e)', padding: '2px 4px',
                          fontSize: 14, lineHeight: 1, flexShrink: 0,
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}

                  </div>
                ))}
              </div>

              {/* Servicios incluidos (solo si hay items de tipo SERVICIO) */}
              {items.some(i => i.tipo === 'SERVICIO') && (
                <div style={{
                  marginTop: 10, marginBottom: 4,
                  padding: '8px 12px',
                  background: '#f0fff4',
                  border: '1px solid #9ae6b4',
                  borderRadius: 6,
                  fontSize: 12,
                }}>
                  <p style={{ fontWeight: 700, color: '#276749', marginBottom: 4 }}>Servicios incluidos:</p>
                  {items.filter(i => i.tipo === 'SERVICIO').map(i => (
                    <p key={`svc-label-${i.catalogo_servicio_id}`} style={{ color: '#276749', lineHeight: 1.6 }}>
                      • {i.producto_name}
                    </p>
                  ))}
                </div>
              )}

              <hr className="payment-divider" />

              <div className="payment-summary-row">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              {descuento > 0 && (
                <>
                  <div className="payment-summary-row">
                    <span>Descuento</span><span>−{fmt(descuento)}</span>
                  </div>
                  {/* UX-015: warning when descuento > 30% of subtotal */}
                  {descuentoAlto && (
                    <p style={{
                      margin: '4px 0 6px',
                      padding: '6px 10px',
                      background: '#fffbeb',
                      border: '1px solid #f6ad55',
                      borderRadius: 6,
                      color: '#b45309',
                      fontSize: 12,
                      lineHeight: 1.4,
                    }}>
                      Descuento alto: {descuentoPct.toFixed(1)}% del total
                    </p>
                  )}
                </>
              )}
              <div className="payment-summary-row payment-summary-row--total">
                <span>Total</span><span>{fmt(total)}</span>
              </div>

              {metodoPago === 'EFECTIVO' && (
                <>
                  <hr className="payment-divider" />
                  {/* UX-014: Recibido row with inline validation styling */}
                  <div
                    className="payment-summary-row"
                    onMouseEnter={() => setMontoTouched(true)}
                  >
                    <span>Recibido</span>
                    <span style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: montoTouched && montoInsuficiente ? '#c53030' : undefined,
                      border: montoTouched && montoInsuficiente
                        ? '1px solid #fc8181'
                        : undefined,
                      borderRadius: montoTouched && montoInsuficiente ? 4 : undefined,
                      padding: montoTouched && montoInsuficiente ? '1px 6px' : undefined,
                    }}>
                      {fmt(montoPagado)}
                    </span>
                  </div>

                  {/* UX-014: inline error when monto is insufficient */}
                  {montoTouched && montoInsuficiente && (
                    <p style={{
                      margin: '4px 0 6px',
                      padding: '6px 10px',
                      background: '#fff5f5',
                      border: '1px solid #fc8181',
                      borderRadius: 6,
                      color: '#c53030',
                      fontSize: 12,
                      lineHeight: 1.4,
                    }}>
                      Monto insuficiente. Debe ser ≥ ${total.toFixed(2)}
                    </p>
                  )}

                  {/* UX-014 adicional: cambio en verde cuando monto >= total */}
                  {!montoInsuficiente && (
                    <div className="payment-summary-row">
                      <span>Cambio</span>
                      <span style={{ fontWeight: 700, color: '#276749' }}>
                        {fmt(cambio)}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="payment-summary-row" style={{ marginTop: 12 }}>
                <span>Método de pago</span>
                <span style={{ fontWeight: 600 }}>{metodoPago}</span>
              </div>

              {error && (
                <p style={{
                  marginTop: 12, padding: '10px 14px',
                  background: '#fff5f5', border: '1px solid #fed7d7',
                  borderRadius: 8, color: '#c53030', fontSize: 13,
                }}>
                  {error}
                </p>
              )}
            </>
          ) : (
            /* Ticket de éxito */
            <div className="payment-ticket">
              <div className="payment-ticket-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3>¡Venta completada!</h3>
              <p className="payment-ticket-id">Folio # {venta.id}</p>

              <div className="payment-ticket-details">
                <div className="payment-ticket-row">
                  <span>Total cobrado</span>
                  <span style={{ fontWeight: 700 }}>{fmt(parseFloat(venta.total))}</span>
                </div>
                <div className="payment-ticket-row">
                  <span>Método</span>
                  <span>{venta.metodo_pago}</span>
                </div>
                {venta.metodo_pago === 'EFECTIVO' && (
                  <>
                    <div className="payment-ticket-row">
                      <span>Recibido</span>
                      <span>{fmt(parseFloat(venta.monto_pagado))}</span>
                    </div>
                    <div className="payment-ticket-cambio">
                      <span>Cambio</span>
                      <span>{fmt(parseFloat(venta.cambio))}</span>
                    </div>
                  </>
                )}
                <div className="payment-ticket-row" style={{ marginTop: 8 }}>
                  <span>Cajero</span>
                  <span>{venta.cajero_name}</span>
                </div>
                <div className="payment-ticket-row">
                  <span>Sede</span>
                  <span>{venta.sede_name}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="payment-modal-footer">
          {!venta ? (
            <>
              <button className="btn-cancel-modal" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button
                className="btn-confirm-sale"
                onClick={handleConfirm}
                disabled={loading || montoInsuficiente}
              >
                {loading ? 'Procesando…' : `Confirmar ${fmt(total)}`}
              </button>
            </>
          ) : (
            <button className="btn-nueva-venta" onClick={onSuccess}>
              Nueva venta
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default PaymentModal;
