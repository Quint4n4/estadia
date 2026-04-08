import React, { useState, useEffect, useCallback } from 'react';
import { tallerService } from '../../api/taller.service';
import type {
  ReporteTallerData,
  ReportePeriodoItem,
  ReporteMecanicoItem,
  ReporteMetodoPagoItem,
  ReporteTardiaItem,
  ReporteActivoStatusItem,
} from '../../types/taller.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMXN(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return '$0.00';
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function fmtHoras(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 24) return `${h.toFixed(1)} hrs`;
  const dias = Math.floor(h / 24);
  const hrs = (h % 24).toFixed(0);
  return `${dias}d ${hrs}h`;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getFirstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function getFirstDayPrevMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

}

function getLastDayPrevMonth(): string {
  const d = new Date();
  d.setDate(0); // último día del mes anterior
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 4px rgba(0,0,0,.07)',
  padding: '20px 24px',
};

const sectionTitle: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 14,
  fontWeight: 700,
  color: '#4a5568',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left' as const,
  padding: '8px 10px',
  background: '#f7fafc',
  color: '#718096',
  fontWeight: 600,
  fontSize: 12,
  borderBottom: '1px solid #e2e8f0',
};

const tdStyle: React.CSSProperties = {
  padding: '9px 10px',
  borderBottom: '1px solid #edf2f7',
  color: '#2d3748',
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: string;
}> = ({ label, value, sub, color = '#3182ce', icon }) => (
  <div style={{
    ...card,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    borderTop: `3px solid ${color}`,
  }}>
    <span style={{ fontSize: 11, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
    <span style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</span>
    {sub && <span style={{ fontSize: 11, color: '#a0aec0' }}>{sub}</span>}
  </div>
);

// Gráfica de barras con divs
const BarChart: React.FC<{ data: ReportePeriodoItem[]; showIngresos: boolean }> = ({ data, showIngresos }) => {
  if (data.length === 0) {
    return <div style={{ textAlign: 'center', color: '#a0aec0', padding: '40px 0', fontSize: 13 }}>Sin datos en este período</div>;
  }

  const values = data.map(d => showIngresos ? parseFloat(d.ingresos) : d.ordenes);
  const maxVal = Math.max(...values, 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, paddingBottom: 28, position: 'relative', overflowX: 'auto' }}>
      {data.map((d, i) => {
        const val = values[i];
        const pct = (val / maxVal) * 100;
        const barH = Math.max(pct * 1.4, 4); // 140px max height
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', minWidth: 36, maxWidth: 56, width: `${Math.max(100 / data.length, 3.5)}%` }}>
            <span style={{ fontSize: 10, color: '#4a5568', marginBottom: 2, fontWeight: 600 }}>
              {showIngresos ? (val >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val.toFixed(0)}`) : String(val)}
            </span>
            <div
              title={showIngresos ? fmtMXN(d.ingresos) : `${d.ordenes} órdenes`}
              style={{
                width: '100%',
                height: `${barH}px`,
                background: showIngresos ? 'linear-gradient(to top, #3182ce, #63b3ed)' : 'linear-gradient(to top, #38a169, #68d391)',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
                cursor: 'default',
              }}
            />
            <span style={{ fontSize: 9, color: '#718096', marginTop: 4, textAlign: 'center', lineHeight: 1.2, maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  sedeId: number;
}

type Preset = 'hoy' | 'semana' | 'mes' | 'mes_anterior' | 'custom';

const ReporteTallerView: React.FC<Props> = ({ sedeId }) => {
  const [preset, setPreset]               = useState<Preset>('mes');
  const [fechaDesde, setFechaDesde]       = useState(getFirstDayOfMonth());
  const [fechaHasta, setFechaHasta]       = useState(getToday());
  const [data, setData]                   = useState<ReporteTallerData | null>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [showIngresos, setShowIngresos]   = useState(true);
  const [activasExpanded, setActivasExpanded] = useState(false);

  const applyPreset = useCallback((p: Preset) => {
    setPreset(p);
    const hoy = getToday();
    if (p === 'hoy')          { setFechaDesde(hoy); setFechaHasta(hoy); }
    else if (p === 'semana')  { setFechaDesde(getMonday()); setFechaHasta(hoy); }
    else if (p === 'mes')     { setFechaDesde(getFirstDayOfMonth()); setFechaHasta(hoy); }
    else if (p === 'mes_anterior') { setFechaDesde(getFirstDayPrevMonth()); setFechaHasta(getLastDayPrevMonth()); }
    // 'custom' → no cambia fechas
  }, []);

  const cargarReporte = useCallback(async (desde: string, hasta: string) => {
    if (!desde || !hasta) return;
    setLoading(true);
    setError(null);
    try {
      const res = await tallerService.getReporteTaller({ fecha_desde: desde, fecha_hasta: hasta, sede_id: sedeId });
      if (res.success) {
        setData(res.data);
      } else {
        setError('No se pudo cargar el reporte.');
      }
    } catch {
      setError('Error de conexión al cargar el reporte.');
    } finally {
      setLoading(false);
    }
  }, [sedeId]);

  // Carga automática cuando cambia fecha (excepto custom que espera botón)
  useEffect(() => {
    if (preset !== 'custom') {
      cargarReporte(fechaDesde, fechaHasta);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaDesde, fechaHasta, preset]);

  const kpis = data?.kpis;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: 20 }}>
        <h3 style={sectionTitle}>📊 Reporte de Servicios del Taller</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>

          {/* Presets */}
          {(['hoy', 'semana', 'mes', 'mes_anterior', 'custom'] as Preset[]).map(p => {
            const labels: Record<Preset, string> = {
              hoy: 'Hoy', semana: 'Esta semana', mes: 'Este mes',
              mes_anterior: 'Mes anterior', custom: 'Personalizado',
            };
            return (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1.5px solid ${preset === p ? '#3182ce' : '#e2e8f0'}`,
                  background: preset === p ? '#ebf8ff' : '#fff',
                  color: preset === p ? '#2c5282' : '#4a5568',
                  fontSize: 13,
                  fontWeight: preset === p ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {labels[p]}
              </button>
            );
          })}

          {/* Fechas (siempre visibles, editable en custom) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <input
              type="date"
              value={fechaDesde}
              disabled={preset !== 'custom'}
              onChange={e => setFechaDesde(e.target.value)}
              style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, opacity: preset !== 'custom' ? 0.6 : 1 }}
            />
            <span style={{ color: '#718096', fontSize: 13 }}>→</span>
            <input
              type="date"
              value={fechaHasta}
              disabled={preset !== 'custom'}
              onChange={e => setFechaHasta(e.target.value)}
              style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, opacity: preset !== 'custom' ? 0.6 : 1 }}
            />
            {preset === 'custom' && (
              <button
                onClick={() => cargarReporte(fechaDesde, fechaHasta)}
                style={{
                  padding: '6px 16px',
                  background: '#3182ce',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Generar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Loading / Error ──────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096', fontSize: 14 }}>
          ⏳ Cargando reporte...
        </div>
      )}

      {error && !loading && (
        <div style={{
          background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10,
          padding: '16px 20px', color: '#c53030', fontSize: 13, marginBottom: 16,
        }}>
          ❌ {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}>
            <KpiCard icon="🔧" label="Total órdenes"      value={String(kpis!.total_ordenes)}       color="#3182ce" />
            <KpiCard icon="✅" label="Entregadas"          value={String(kpis!.total_entregadas)}     color="#38a169" />
            <KpiCard icon="❌" label="Canceladas"          value={String(kpis!.total_canceladas)}     color="#e53e3e" sub={`${kpis!.tasa_cancelacion_pct}% cancelación`} />
            <KpiCard icon="⚙️" label="En proceso"         value={String(kpis!.total_activas)}        color="#d69e2e" />
            <KpiCard icon="💰" label="Ingresos totales"   value={fmtMXN(kpis!.ingresos_totales)}    color="#2b6cb0" />
            <KpiCard icon="📊" label="Ticket promedio"    value={fmtMXN(kpis!.ticket_promedio)}      color="#6b46c1" />
            <KpiCard icon="⏱️" label="Tiempo prom."       value={fmtHoras(kpis!.tiempo_promedio_horas)} color="#319795" sub="desde recepción a entrega" />
          </div>

          {/* ── Gráfica de ingresos ────────────────────────────────────────── */}
          <div style={{ ...card, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ ...sectionTitle, margin: 0 }}>📈 Evolución en el período</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setShowIngresos(true)}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12,
                    border: `1.5px solid ${showIngresos ? '#3182ce' : '#e2e8f0'}`,
                    background: showIngresos ? '#ebf8ff' : '#fff',
                    color: showIngresos ? '#2c5282' : '#718096',
                    cursor: 'pointer', fontWeight: showIngresos ? 700 : 400,
                  }}
                >
                  💰 Ingresos
                </button>
                <button
                  onClick={() => setShowIngresos(false)}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12,
                    border: `1.5px solid ${!showIngresos ? '#38a169' : '#e2e8f0'}`,
                    background: !showIngresos ? '#f0fff4' : '#fff',
                    color: !showIngresos ? '#22543d' : '#718096',
                    cursor: 'pointer', fontWeight: !showIngresos ? 700 : 400,
                  }}
                >
                  🔧 Órdenes
                </button>
              </div>
            </div>
            <BarChart data={data.ingresos_por_periodo} showIngresos={showIngresos} />
          </div>

          {/* ── Fila: mecánicos + tipo/pago ────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 20, alignItems: 'start' }}>

            {/* Tabla mecánicos */}
            <div style={card}>
              <h3 style={sectionTitle}>👷 Rendimiento por mecánico</h3>
              {data.por_mecanico.length === 0 ? (
                <p style={{ color: '#a0aec0', fontSize: 13, margin: 0 }}>Sin mecánicos asignados en este período.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Mecánico</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Asignadas</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Entregadas</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>%</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Ingreso</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>T. Prom.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.por_mecanico.map((m: ReporteMecanicoItem) => (
                        <tr key={m.mecanico_id}>
                          <td style={tdStyle}><strong>{m.mecanico_nombre}</strong></td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{m.asignadas}</td>
                          <td style={{ ...tdStyle, textAlign: 'center', color: '#38a169', fontWeight: 600 }}>{m.entregadas}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 20,
                              background: m.pct_completadas >= 80 ? '#f0fff4' : m.pct_completadas >= 50 ? '#fffaf0' : '#fff5f5',
                              color: m.pct_completadas >= 80 ? '#22543d' : m.pct_completadas >= 50 ? '#c05621' : '#c53030',
                              fontWeight: 700, fontSize: 12,
                            }}>
                              {m.pct_completadas}%
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmtMXN(m.ingreso_generado)}</td>
                          <td style={{ ...tdStyle, textAlign: 'center', color: '#718096' }}>{fmtHoras(m.tiempo_promedio_horas)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Columna derecha: tipo + método pago */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 240 }}>

              {/* Por tipo */}
              <div style={card}>
                <h3 style={sectionTitle}>🔩 Por tipo de servicio</h3>
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>Reparación</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#3182ce', fontWeight: 700 }}>{data.por_tipo.reparacion.conteo}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#2b6cb0' }}>{fmtMXN(data.por_tipo.reparacion.ingresos)}</td>
                    </tr>
                    <tr>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>Mantenimiento</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#38a169', fontWeight: 700 }}>{data.por_tipo.mantenimiento.conteo}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#276749' }}>{fmtMXN(data.por_tipo.mantenimiento.ingresos)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Por método de pago */}
              <div style={card}>
                <h3 style={sectionTitle}>💳 Método de pago</h3>
                <table style={tableStyle}>
                  <tbody>
                    {data.por_metodo_pago.length === 0 ? (
                      <tr><td style={{ ...tdStyle, color: '#a0aec0' }}>Sin datos</td></tr>
                    ) : (
                      data.por_metodo_pago.map((m: ReporteMetodoPagoItem) => (
                        <tr key={m.metodo}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>
                            {m.metodo === 'EFECTIVO' ? '💵' : m.metodo === 'TARJETA' ? '💳' : m.metodo === 'TRANSFERENCIA' ? '🏦' : '—'}{' '}
                            {m.metodo === 'SIN_REGISTRAR' ? 'Sin registrar' : m.metodo.charAt(0) + m.metodo.slice(1).toLowerCase()}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center', color: '#718096' }}>{m.conteo}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{fmtMXN(m.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Órdenes activas (colapsable) ───────────────────────────────── */}
          {data.activas_por_status.length > 0 && (
            <div style={{ ...card, marginBottom: 20 }}>
              <button
                onClick={() => setActivasExpanded(e => !e)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  width: '100%', padding: 0, textAlign: 'left',
                }}
              >
                <h3 style={{ ...sectionTitle, margin: 0, flex: 1 }}>
                  ⚙️ Órdenes activas en este período ({data.kpis.total_activas})
                </h3>
                <span style={{ fontSize: 18, color: '#718096' }}>{activasExpanded ? '▲' : '▼'}</span>
              </button>

              {activasExpanded && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                  {data.activas_por_status.map((a: ReporteActivoStatusItem) => (
                    <div key={a.status} style={{
                      padding: '10px 16px', borderRadius: 10,
                      background: '#edf2f7', border: '1px solid #e2e8f0',
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#2d3748' }}>{a.conteo}</div>
                      <div style={{ fontSize: 12, color: '#718096' }}>{a.status_display}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Órdenes tardías ────────────────────────────────────────────── */}
          {data.ordenes_tardias.length > 0 && (
            <div style={{ ...card, marginBottom: 20 }}>
              <h3 style={{ ...sectionTitle, color: '#c05621' }}>⚠️ Entregas fuera de fecha ({data.ordenes_tardias.length})</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Folio</th>
                      <th style={thStyle}>Mecánico</th>
                      <th style={thStyle}>Fecha prometida</th>
                      <th style={thStyle}>Fecha entrega</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Días retraso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ordenes_tardias.map((t: ReporteTardiaItem) => (
                      <tr key={t.folio}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#2b6cb0' }}>{t.folio}</td>
                        <td style={tdStyle}>{t.mecanico_nombre}</td>
                        <td style={{ ...tdStyle, color: '#718096' }}>{t.fecha_estimada}</td>
                        <td style={{ ...tdStyle, color: '#718096' }}>{t.fecha_entrega}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 10px', borderRadius: 20,
                            background: t.dias_retraso > 3 ? '#fff5f5' : '#fffaf0',
                            color: t.dias_retraso > 3 ? '#c53030' : '#c05621',
                            fontWeight: 700, fontSize: 12,
                          }}>
                            +{t.dias_retraso}d
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </>
      )}

      {/* Estado vacío inicial */}
      {!data && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#a0aec0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <p style={{ fontSize: 14, margin: 0 }}>Selecciona un período para generar el reporte</p>
        </div>
      )}
    </div>
  );
};

export default ReporteTallerView;
