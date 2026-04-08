import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, ChevronRight, DollarSign, Loader2 } from 'lucide-react';
import { salesService } from '../../../api/sales.service';
import type { SedeResumenVentas } from '../../../types/sales.types';
import type { SedeSnapshot } from '../../../types/auth.types';
import VentasDelDiaModal from './VentasDelDiaModal';

interface Props {
  resumen: SedeResumenVentas[];
  sedes:   SedeSnapshot[];
}

type Tab = 'hoy' | 'semana' | 'mes' | 'anio' | 'custom';

const fmt = (n: string | number) =>
  parseFloat(String(n)).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const toLocalDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const TAB_LABELS: Record<Tab, string> = {
  hoy:    'Hoy',
  semana: 'Semana',
  mes:    'Mes',
  anio:   'Año',
  custom: 'Personalizado',
};

const GananciasPanel: React.FC<Props> = ({ resumen, sedes }) => {
  const [tab, setTab]             = useState<Tab>('hoy');
  const [customDesde, setDesde]   = useState('');
  const [customHasta, setHasta]   = useState('');
  const [totalCustom, setCustom]  = useState<number | null>(null);
  const [loadingCustom, setLoadC] = useState(false);
  const [modal, setModal]         = useState<{ fechaDesde: string; fechaHasta: string; sedeId?: number; titulo: string } | null>(null);

  // Compute total from resumen based on active tab
  const getIngreso = (r: SedeResumenVentas): number => {
    const map: Record<Tab, string> = {
      hoy:    r.ingresos_hoy,
      semana: r.ingresos_semana,
      mes:    r.ingresos_mes,
      anio:   r.ingresos_anio,
      custom: '0',
    };
    return parseFloat(map[tab] || '0');
  };

  const totalGeneral = tab === 'custom'
    ? (totalCustom ?? 0)
    : resumen.reduce((s, r) => s + getIngreso(r), 0);

  // Date ranges for modal
  const today = toLocalDate(new Date());
  const getRange = (): { desde: string; hasta: string } => {
    const now = new Date();
    if (tab === 'hoy')    return { desde: today, hasta: today };
    if (tab === 'semana') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { desde: toLocalDate(d), hasta: today };
    }
    if (tab === 'mes') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { desde: toLocalDate(d), hasta: today };
    }
    if (tab === 'anio') {
      return { desde: `${now.getFullYear()}-01-01`, hasta: today };
    }
    return { desde: customDesde, hasta: customHasta };
  };

  // Fetch custom range total
  useEffect(() => {
    if (tab !== 'custom' || !customDesde || !customHasta) return;
    setLoadC(true);
    salesService.reportes({ fecha_desde: customDesde, fecha_hasta: customHasta })
      .then(res => setCustom(parseFloat(res.data.resumen.monto_total)))
      .catch(() => setCustom(null))
      .finally(() => setLoadC(false));
  }, [tab, customDesde, customHasta]);

  const range = getRange();

  const openModal = (sedeId?: number, sedeName?: string) => {
    if (!range.desde || !range.hasta) return;
    const titulo = sedeId && sedeName
      ? `Ventas ${TAB_LABELS[tab]} — ${sedeName}`
      : `Ventas ${TAB_LABELS[tab]} — Todas las sedes`;
    setModal({ fechaDesde: range.desde, fechaHasta: range.hasta, sedeId, titulo });
  };

  return (
    <>
      <div style={{
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        overflow: 'hidden',
        marginBottom: 20,
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#276749,#2f855a)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={17} color="#fff" />
            </div>
            <div>
              <h3 style={{ color: '#fff', margin: 0, fontSize: 15, fontWeight: 700 }}>Panel de Ganancias</h3>
              <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: 11 }}>Ingresos por período y sede</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['hoy', 'semana', 'mes', 'anio', 'custom'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: tab === t ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)',
                  color:      tab === t ? '#276749' : 'rgba(255,255,255,0.85)',
                  transition: 'all .15s',
                }}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date inputs */}
        {tab === 'custom' && (
          <div style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, background: '#f7fafc' }}>
            <Calendar size={14} color="#718096" />
            <span style={{ fontSize: 12, color: '#718096', fontWeight: 600 }}>Desde:</span>
            <input type="date" value={customDesde} onChange={e => setDesde(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e0', fontSize: 12 }} />
            <span style={{ fontSize: 12, color: '#718096', fontWeight: 600 }}>Hasta:</span>
            <input type="date" value={customHasta} onChange={e => setHasta(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e0', fontSize: 12 }} />
          </div>
        )}

        {/* Total + Ver ventas */}
        <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: 11, color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <DollarSign size={12} />
              Total {TAB_LABELS[tab]} — Todas las sedes
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#276749', lineHeight: 1.15, marginTop: 4 }}>
              {loadingCustom
                ? <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                : fmt(totalGeneral)
              }
            </div>
          </div>
          <button
            onClick={() => openModal()}
            disabled={tab === 'custom' && (!customDesde || !customHasta)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 8,
              background: '#276749', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              opacity: (tab === 'custom' && (!customDesde || !customHasta)) ? 0.4 : 1,
            }}
          >
            Ver todas las ventas <ChevronRight size={15} />
          </button>
        </div>

        {/* Per-sede sub-cards */}
        {resumen.length > 0 && tab !== 'custom' && (
          <div style={{ display: 'flex', overflowX: 'auto', padding: '16px 24px', gap: 12 }}>
            {resumen.map(r => {
              const monto = getIngreso(r);
              const sede  = sedes.find(s => s.id === r.sede_id);
              return (
                <div
                  key={r.sede_id}
                  onClick={() => openModal(r.sede_id, r.sede_name)}
                  style={{
                    minWidth: 180, flex: '0 0 auto',
                    background: '#f7fafc', borderRadius: 10,
                    padding: '12px 16px', cursor: 'pointer',
                    border: '1px solid #e2e8f0',
                    transition: 'box-shadow .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(39,103,73,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{r.sede_name}</span>
                    <ChevronRight size={12} color="#a0aec0" />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#276749' }}>{fmt(monto)}</div>
                  {sede && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 8, fontSize: 10, color: '#718096' }}>
                      <span>{r.cajas_abiertas.length} caja{r.cajas_abiertas.length !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{sede.total_workers + sede.total_cashiers} empleados</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {resumen.length === 0 && (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: '#a0aec0', fontSize: 13 }}>
            Sin datos de sedes disponibles
          </div>
        )}
      </div>

      {modal && (
        <VentasDelDiaModal
          fechaDesde={modal.fechaDesde}
          fechaHasta={modal.fechaHasta}
          sedeId={modal.sedeId}
          titulo={modal.titulo}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
};

export default GananciasPanel;
