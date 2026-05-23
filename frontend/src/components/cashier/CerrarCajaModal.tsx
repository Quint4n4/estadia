import React, { useState } from 'react';
import { salesService } from '../../api/sales.service';
import type { CorteCaja } from '../../types/sales.types';

interface Props {
  aperturaId: number;
  onCancel: () => void;   // El cajero cierra el modal SIN cerrar la caja
  onClosed: () => void;   // La caja ya se cerró y el cajero terminó de ver el corte
}

const money = (val: string | number | null | undefined) =>
  Number(val ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const CerrarCajaModal: React.FC<Props> = ({ aperturaId, onCancel, onClosed }) => {
  const [fase, setFase]           = useState<'contar' | 'resultado'>('contar');
  const [efectivo, setEfectivo]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [corte, setCorte]         = useState<CorteCaja | null>(null);

  const cerrar = async (conConteo: boolean) => {
    setLoading(true);
    setError('');
    try {
      const contado = conConteo ? parseFloat(efectivo || '0') : undefined;
      const res = await salesService.cerrarCaja(aperturaId, contado);
      setCorte(res.corte);
      setFase('resultado');
    } catch {
      setError('No se pudo cerrar la caja. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const dif = corte?.diferencia != null ? Number(corte.diferencia) : null;
  const difColor = dif == null ? '#718096' : dif === 0 ? '#276749' : dif > 0 ? '#2b6cb0' : '#c53030';
  const difLabel = dif == null ? '' : dif === 0 ? 'Sin diferencia ✓' : dif > 0 ? 'Sobrante' : 'Faltante';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
        maxWidth: 440, width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {fase === 'contar' && (
          <>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#1a202c' }}>
              Cerrar caja
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#718096', lineHeight: 1.5 }}>
              Cuenta el <strong>efectivo físico</strong> que hay en el cajón (incluyendo el fondo inicial)
              y captúralo aquí. El sistema lo comparará con lo que debería haber.
            </p>

            <label htmlFor="efectivo-contado" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
              Efectivo contado en el cajón
            </label>
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: '#a0aec0', fontSize: 18, fontWeight: 600,
              }}>$</span>
              <input
                id="efectivo-contado"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                autoFocus
                value={efectivo}
                onChange={e => setEfectivo(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%', padding: '12px 14px 12px 30px', borderRadius: 10,
                  border: '1px solid #e2e8f0', fontSize: 18, fontWeight: 600, outline: 'none',
                  boxSizing: 'border-box', color: '#1a202c',
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#c53030', fontSize: 13, margin: '8px 0 0' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
              <button
                onClick={() => cerrar(true)}
                disabled={loading || efectivo.trim() === ''}
                style={{
                  flex: '1 1 180px', padding: '12px', borderRadius: 10, border: 'none',
                  background: 'var(--color-primary, #4c51bf)', color: '#fff', fontWeight: 700, fontSize: 15,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: (loading || efectivo.trim() === '') ? 0.6 : 1,
                }}
              >
                {loading ? 'Cerrando…' : 'Contar y cerrar'}
              </button>
              <button
                onClick={() => cerrar(false)}
                disabled={loading}
                style={{
                  flex: '0 1 auto', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#718096', fontWeight: 600, fontSize: 13,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                Cerrar sin contar
              </button>
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                width: '100%', marginTop: 10, padding: '8px', borderRadius: 10, border: 'none',
                background: 'transparent', color: '#a0aec0', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </>
        )}

        {fase === 'resultado' && corte && (
          <>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#1a202c' }}>
              Corte de caja
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: '#718096' }}>
              La caja se cerró correctamente. Este es el resumen del efectivo.
            </p>

            {/* Efectivo en cajón */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ background: '#f7fafc', padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Efectivo en el cajón
              </div>
              {[
                ['Fondo inicial', money(corte.monto_inicial)],
                ['(+) Ventas en efectivo', money(corte.efectivo_ventas)],
                ['(=) Debería haber', money(corte.efectivo_esperado)],
              ].map(([k, v], i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '9px 14px',
                  fontSize: 14, borderTop: i === 0 ? 'none' : '1px solid #edf2f7',
                  fontWeight: i === 2 ? 700 : 400,
                  color: i === 2 ? '#1a202c' : '#4a5568',
                  background: i === 2 ? '#f0f4ff' : '#fff',
                }}>
                  <span>{k}</span><span>{v}</span>
                </div>
              ))}
              {corte.efectivo_contado != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', fontSize: 14, borderTop: '1px solid #edf2f7', color: '#4a5568' }}>
                  <span>Contaste físicamente</span><span>{money(corte.efectivo_contado)}</span>
                </div>
              )}
            </div>

            {/* Diferencia */}
            {dif != null ? (
              <div style={{
                textAlign: 'center', padding: '12px', borderRadius: 12, marginBottom: 14,
                background: dif === 0 ? '#f0fff4' : dif > 0 ? '#ebf8ff' : '#fff5f5',
                border: `1px solid ${dif === 0 ? '#9ae6b4' : dif > 0 ? '#bee3f8' : '#fed7d7'}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: difColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {difLabel}
                </div>
                {dif !== 0 && (
                  <div style={{ fontSize: 24, fontWeight: 800, color: difColor, marginTop: 2 }}>
                    {dif > 0 ? '+' : '−'}{money(Math.abs(dif))}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#a0aec0', textAlign: 'center', marginBottom: 14 }}>
                No capturaste el conteo, así que no se calculó diferencia.
              </p>
            )}

            {/* No efectivo (banco) */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ background: '#f7fafc', padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                No es efectivo (va al banco)
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', fontSize: 14, color: '#4a5568' }}>
                <span>Tarjeta</span><span>{money(corte.monto_tarjeta)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', fontSize: 14, borderTop: '1px solid #edf2f7', color: '#4a5568' }}>
                <span>Transferencia</span><span>{money(corte.monto_transferencia)}</span>
              </div>
            </div>

            <button
              onClick={onClosed}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                background: 'var(--color-primary, #4c51bf)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}
            >
              Entendido
            </button>
            <p style={{ fontSize: 11, color: '#a0aec0', textAlign: 'center', margin: '10px 0 0' }}>
              El reporte PDF con este corte queda guardado para el encargado.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CerrarCajaModal;
