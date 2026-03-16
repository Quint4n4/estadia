import React, { useState } from 'react';
import { Bike, Wrench, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { tallerService } from '../../api/taller.service';
import type { ServicioCreatePayload, MetodoPago } from '../../types/taller.types';

interface Props {
  sedeId: number;
  onClose: () => void;
  onCreated: () => void;
}

const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO',      label: 'Efectivo' },
  { value: 'TARJETA',       label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

/* ── inline styles ────────────────────────────────────────── */
const sectionCard: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '18px 20px',
  marginBottom: 16,
  background: '#fff',
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: '1px solid #f0f4f8',
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 13,
  color: '#2d3748',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const iconCircle = (bg: string): React.CSSProperties => ({
  width: 30,
  height: 30,
  borderRadius: '50%',
  background: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
};

/* ── component ────────────────────────────────────────────── */
const NuevoServicioModal: React.FC<Props> = ({ sedeId, onClose, onCreated }) => {

  // Datos de la moto
  const [marca,  setMarca]  = useState('');
  const [modelo, setModelo] = useState('');
  const [anio,   setAnio]   = useState(new Date().getFullYear().toString());
  const [placa,  setPlaca]  = useState('');
  const [color,  setColor]  = useState('');

  // Datos del servicio
  const [descripcion,   setDescripcion]   = useState('');
  const [manoDeObra,    setManoDeObra]    = useState('0.00');
  const [fechaEstimada, setFechaEstimada] = useState('');
  const [notasInternas, setNotasInternas] = useState('');

  // Pago inmediato
  const [pagarAhora, setPagarAhora] = useState(false);
  const [metodo,     setMetodo]     = useState<MetodoPago>('EFECTIVO');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!marca.trim() || !modelo.trim() || !descripcion.trim()) {
      setError('Marca, modelo y descripción del problema son requeridos.');
      return;
    }

    const payload: ServicioCreatePayload = {
      sede: sedeId,
      moto_nueva: {
        marca:  marca.trim(),
        modelo: modelo.trim(),
        anio:   Number(anio),
        placa:  placa.trim(),
        color:  color.trim(),
      },
      descripcion_problema:   descripcion.trim(),
      mano_de_obra:           manoDeObra,
      fecha_entrega_estimada: fechaEstimada || null,
      notas_internas:         notasInternas.trim(),
      pagar_ahora:            pagarAhora,
      metodo_pago:            pagarAhora ? metodo : undefined,
    };

    setLoading(true);
    try {
      await tallerService.createServicio(payload);
      onCreated();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.errors?.join(', ') ??
        'Error al crear el servicio.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 600, maxHeight: '92vh', overflowY: 'auto', padding: 0 }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '10px 10px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wrench size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>
                Nuevo Servicio de Taller
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, marginTop: 2 }}>
                Registra la moto y el trabajo a realizar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
              color: '#fff', width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>

          {/* ── Sección: Moto ── */}
          <div style={sectionCard}>
            <div style={sectionHeader}>
              <div style={iconCircle('#ebf8ff')}>
                <Bike size={15} color="#3182ce" />
              </div>
              <span style={sectionTitle}>Datos de la moto</span>
            </div>

            <div style={grid2}>
              <div>
                <label className="form-label">Marca *</label>
                <input
                  className="form-input"
                  value={marca}
                  onChange={e => setMarca(e.target.value)}
                  placeholder="Honda, Yamaha, Italika…"
                  required
                />
              </div>
              <div>
                <label className="form-label">Modelo *</label>
                <input
                  className="form-input"
                  value={modelo}
                  onChange={e => setModelo(e.target.value)}
                  placeholder="CB190R, FZ25, DM200…"
                  required
                />
              </div>
              <div>
                <label className="form-label">Año</label>
                <input
                  className="form-input"
                  type="number"
                  value={anio}
                  onChange={e => setAnio(e.target.value)}
                  min={1970}
                  max={new Date().getFullYear() + 1}
                />
              </div>
              <div>
                <label className="form-label">Placa</label>
                <input
                  className="form-input"
                  value={placa}
                  onChange={e => setPlaca(e.target.value.toUpperCase())}
                  placeholder="ABC-123"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Color</label>
                <input
                  className="form-input"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  placeholder="Rojo, Negro mate, Azul metálico…"
                />
              </div>
            </div>
          </div>

          {/* ── Sección: Servicio ── */}
          <div style={sectionCard}>
            <div style={sectionHeader}>
              <div style={iconCircle('#faf5ff')}>
                <Wrench size={15} color="#805ad5" />
              </div>
              <span style={sectionTitle}>Detalles del servicio</span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Descripción del problema *</label>
              <textarea
                className="form-input"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                rows={3}
                placeholder="Falla en frenos, cambio de aceite, revisión general, ruido en motor…"
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={grid2}>
              <div>
                <label className="form-label">Mano de obra ($)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    color: '#718096', fontSize: 14, pointerEvents: 'none',
                  }}>$</span>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={manoDeObra}
                    onChange={e => setManoDeObra(e.target.value)}
                    style={{ paddingLeft: 22 }}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Entrega estimada</label>
                <input
                  className="form-input"
                  type="date"
                  value={fechaEstimada}
                  onChange={e => setFechaEstimada(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="form-label">Notas internas <span style={{ fontWeight: 400, color: '#a0aec0' }}>(solo visible para el taller)</span></label>
              <textarea
                className="form-input"
                value={notasInternas}
                onChange={e => setNotasInternas(e.target.value)}
                rows={2}
                placeholder="Observaciones extra para los mecánicos…"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* ── Sección: Pago ── */}
          <div style={{
            ...sectionCard,
            background: pagarAhora ? '#f0fff4' : '#f7fafc',
            borderColor: pagarAhora ? '#9ae6b4' : '#e2e8f0',
            transition: 'all 0.2s',
          }}>
            <div style={sectionHeader}>
              <div style={iconCircle(pagarAhora ? '#c6f6d5' : '#e2e8f0')}>
                <CreditCard size={15} color={pagarAhora ? '#276749' : '#718096'} />
              </div>
              <span style={{ ...sectionTitle, color: pagarAhora ? '#276749' : '#2d3748' }}>
                Pago al recibir
              </span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#2d3748' }}>
              <input
                type="checkbox"
                checked={pagarAhora}
                onChange={e => setPagarAhora(e.target.checked)}
                style={{ width: 17, height: 17, accentColor: '#38a169', cursor: 'pointer' }}
              />
              <span>El cliente <strong>paga por adelantado</strong> en este momento</span>
            </label>

            {pagarAhora && (
              <div style={{ marginTop: 14 }}>
                <label className="form-label">Método de pago</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {METODOS_PAGO.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMetodo(m.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: metodo === m.value ? '2px solid #38a169' : '2px solid #e2e8f0',
                        background: metodo === m.value ? '#f0fff4' : '#fff',
                        color: metodo === m.value ? '#276749' : '#718096',
                        fontWeight: metodo === m.value ? 700 : 500,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#fff5f5', border: '1px solid #fed7d7',
              borderRadius: 10, padding: '12px 14px', marginBottom: 16,
              fontSize: 13, color: '#c53030',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* ── Footer ── */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={loading}
              style={{ minWidth: 110 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
              style={{ minWidth: 140 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={14} className="icon-spin" /> Guardando…
                </span>
              ) : (
                '✓ Crear servicio'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevoServicioModal;
