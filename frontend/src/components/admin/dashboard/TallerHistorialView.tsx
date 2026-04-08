import React, { useState, useCallback, useEffect } from 'react';
import { FileDown, Search, Loader2, Wrench, Building2, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { tallerService } from '../../../api/taller.service';
import type { ServicioMotoList, ServicioStatus, HistorialParams } from '../../../types/taller.types';
import type { SedeSnapshot } from '../../../types/auth.types';
import ServicioDetalleModal from '../../taller/ServicioDetalleModal';

interface Props {
  sedes: SedeSnapshot[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: string | number) =>
  parseFloat(String(n)).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const STATUS_BADGE: Record<string, { bg: string; color: string; dot: string }> = {
  ENTREGADO:            { bg: '#dcfce7', color: '#15803d', dot: '#16a34a' },
  CANCELADO:            { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626' },
  EN_PROCESO:           { bg: '#fef3c7', color: '#92400e', dot: '#d97706' },
  EN_DIAGNOSTICO:       { bg: '#eff6ff', color: '#1d4ed8', dot: '#2563eb' },
  RECIBIDO:             { bg: '#f3f4f6', color: '#374151', dot: '#6b7280' },
  LISTA_PARA_ENTREGAR:  { bg: '#f0fdf4', color: '#14532d', dot: '#15803d' },
  COTIZACION_EXTRA:     { bg: '#fdf4ff', color: '#7e22ce', dot: '#9333ea' },
  LISTO:                { bg: '#ecfdf5', color: '#065f46', dot: '#059669' },
};

const STATUS_OPTIONS: { value: ServicioStatus | ''; label: string }[] = [
  { value: '',                    label: 'Todos los estados' },
  { value: 'ENTREGADO',           label: 'Entregado' },
  { value: 'CANCELADO',           label: 'Cancelado' },
  { value: 'EN_PROCESO',          label: 'En proceso' },
  { value: 'EN_DIAGNOSTICO',      label: 'En diagnóstico' },
  { value: 'RECIBIDO',            label: 'Recibido' },
  { value: 'LISTA_PARA_ENTREGAR', label: 'Lista para entregar' },
  { value: 'LISTO',               label: 'Listo' },
];

const PAGE_SIZE = 50;

// Agrupación por sede
interface SedeGroup {
  sede_nombre: string;
  servicios: ServicioMotoList[];
  ingresos: number;
  entregados: number;
  cancelados: number;
}

function groupBySede(servicios: ServicioMotoList[]): SedeGroup[] {
  const map = new Map<string, SedeGroup>();
  for (const sv of servicios) {
    const key = sv.sede_nombre || 'Sin sede';
    if (!map.has(key)) {
      map.set(key, { sede_nombre: key, servicios: [], ingresos: 0, entregados: 0, cancelados: 0 });
    }
    const g = map.get(key)!;
    g.servicios.push(sv);
    if (sv.status === 'ENTREGADO') {
      g.ingresos += parseFloat(sv.total);
      g.entregados++;
    }
    if (sv.status === 'CANCELADO') g.cancelados++;
  }
  return Array.from(map.values());
}

// Colores por sede (cycling)
const SEDE_COLORS = [
  { header: '#1e3a5f', accent: '#2b6cb0', light: '#ebf8ff' },
  { header: '#14532d', accent: '#276749', light: '#f0fff4' },
  { header: '#44337a', accent: '#6b46c1', light: '#faf5ff' },
  { header: '#7b341e', accent: '#c05621', light: '#fffaf0' },
  { header: '#702459', accent: '#97266d', light: '#fff5f7' },
];

// ── Component ─────────────────────────────────────────────────────────────────

const TallerHistorialView: React.FC<Props> = ({ sedes }) => {
  const today = toDateStr(new Date());
  // Default: últimos 3 meses
  const defaultDesde = toDateStr(new Date(new Date().setMonth(new Date().getMonth() - 3)));

  // Filters
  const [sedeId,     setSedeId]     = useState('');
  const [fechaDesde, setFechaDesde] = useState(defaultDesde);
  const [fechaHasta, setFechaHasta] = useState(today);
  const [statusFilt, setStatusFilt] = useState<ServicioStatus | ''>('');
  const [search,     setSearch]     = useState('');

  // Results
  const [servicios,  setServicios]  = useState<ServicioMotoList[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page,       setPage]       = useState(1);
  const [loaded,     setLoaded]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  // PDF
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError,   setPdfError]   = useState('');

  // Detalle modal
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const buildParams = useCallback((pg: number, overrides?: Partial<HistorialParams>): HistorialParams => ({
    ...(sedeId     ? { sede_id: Number(sedeId) } : {}),
    ...(fechaDesde ? { fecha_desde: fechaDesde } : {}),
    ...(fechaHasta ? { fecha_hasta: fechaHasta } : {}),
    ...(statusFilt ? { status: statusFilt }       : {}),
    ...(search     ? { search }                   : {}),
    page:      pg,
    page_size: PAGE_SIZE,
    ...overrides,
  }), [sedeId, fechaDesde, fechaHasta, statusFilt, search]);

  const loadData = useCallback(async (pg: number, params?: Partial<HistorialParams>) => {
    setLoading(true);
    setError('');
    setPage(pg);
    try {
      const res = await tallerService.listHistorial(buildParams(pg, params));
      if (res.success && res.data) {
        setServicios(res.data.servicios ?? []);
        setTotal(res.data.pagination?.total ?? 0);
        setTotalPages(res.data.pagination?.total_pages ?? 0);
        setLoaded(true);
      } else {
        setError('Error al cargar el historial.');
      }
    } catch {
      setError('Error al cargar el historial. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Carga automática al montar — últimos 3 meses
  useEffect(() => {
    loadData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => loadData(1);

  const handleDownloadPDF = useCallback(async () => {
    setPdfLoading(true);
    setPdfError('');
    try {
      const params: HistorialParams = {
        ...(sedeId     ? { sede_id: Number(sedeId) } : {}),
        ...(fechaDesde ? { fecha_desde: fechaDesde } : {}),
        ...(fechaHasta ? { fecha_hasta: fechaHasta } : {}),
        ...(statusFilt ? { status: statusFilt }       : {}),
        ...(search     ? { search }                   : {}),
      };
      await tallerService.getReporteTallerPDF(params);
    } catch {
      setPdfError('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setPdfLoading(false);
    }
  }, [sedeId, fechaDesde, fechaHasta, statusFilt, search]);

  // Global KPIs
  const kpiIngresos   = servicios.filter(s => s.status === 'ENTREGADO').reduce((sum, s) => sum + parseFloat(s.total), 0);
  const kpiEntregados = servicios.filter(s => s.status === 'ENTREGADO').length;
  const kpiCancelados = servicios.filter(s => s.status === 'CANCELADO').length;
  const groups        = groupBySede(servicios);

  return (
    <div className="section-container">

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg,#276749,#2f855a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(39,103,73,0.25)',
          }}>
            <Wrench size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>Historial del Taller</h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Servicios archivados · {total > 0 ? `${total} registros encontrados` : 'todas las sedes'}
            </p>
          </div>
        </div>

        {loaded && (
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 9,
              background: '#276749', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              opacity: pdfLoading ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(39,103,73,0.25)',
            }}
          >
            {pdfLoading
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <FileDown size={14} />
            }
            Descargar PDF
          </button>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '14px 18px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        marginBottom: 20,
      }}>
        <div className="form-group" style={{ margin: 0, minWidth: 155 }}>
          <label className="form-label">Sede</label>
          <select className="form-input" value={sedeId} onChange={e => setSedeId(e.target.value)}>
            <option value="">Todas las sedes</option>
            {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Desde</label>
          <input className="form-input" type="date" value={fechaDesde} max={today} onChange={e => setFechaDesde(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Hasta</label>
          <input className="form-input" type="date" value={fechaHasta} max={today} onChange={e => setFechaHasta(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: 170 }}>
          <label className="form-label">Estado</label>
          <select className="form-input" value={statusFilt} onChange={e => setStatusFilt(e.target.value as ServicioStatus | '')}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: 200, flex: 1 }}>
          <label className="form-label">Buscar</label>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', pointerEvents: 'none' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 30 }}
              placeholder="Folio, cliente, moto…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={handleSearch}
          disabled={loading}
          style={{ padding: '9px 22px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
        >
          {loading
            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <Search size={14} />
          }
          Buscar
        </button>
      </div>

      {error    && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}
      {pdfError && <div className="error-banner" style={{ marginBottom: 16 }}>{pdfError}</div>}

      {/* ── Loading skeleton ── */}
      {loading && !loaded && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#a0aec0' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 14 }}>Cargando historial…</p>
        </div>
      )}

      {/* ── Results ── */}
      {loaded && (
        <>
          {/* Global KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
            {[
              { icon: <Wrench size={18} />,       label: 'Total archivados',  value: total,            num: total,           color: '#2b6cb0', bg: '#ebf8ff' },
              { icon: <CheckCircle size={18} />,   label: 'Entregados',        value: kpiEntregados,    num: kpiEntregados,   color: '#16a34a', bg: '#f0fff4' },
              { icon: <XCircle size={18} />,       label: 'Cancelados',        value: kpiCancelados,    num: kpiCancelados,   color: '#dc2626', bg: '#fff5f5' },
              { icon: <DollarSign size={18} />,    label: 'Ingresos (pág.)',   value: fmt(kpiIngresos), num: kpiIngresos,     color: '#276749', bg: '#f0fff4' },
            ].map(k => (
              <div key={k.label} style={{
                background: '#fff', borderRadius: 12,
                padding: '14px 18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: k.color }}>
                  {k.icon}
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1.2 }}>{k.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading overlay while paginating */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#a0aec0' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {/* No results */}
          {!loading && servicios.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#a0aec0' }}>
              <Wrench size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#718096' }}>Sin resultados para los filtros seleccionados</p>
            </div>
          )}

          {/* ── Grouped by sede ── */}
          {!loading && groups.map((group, gi) => {
            const colors = SEDE_COLORS[gi % SEDE_COLORS.length];
            return (
              <div key={group.sede_nombre} style={{ marginBottom: 24 }}>

                {/* Sede header */}
                <div style={{
                  background: colors.header,
                  borderRadius: '12px 12px 0 0',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Building2 size={16} color="rgba(255,255,255,0.7)" />
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{group.sede_nombre}</span>
                    <span style={{
                      marginLeft: 4, padding: '1px 8px', borderRadius: 20,
                      background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {group.servicios.length} servicio{group.servicios.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <span style={{ color: '#86efac', fontWeight: 700 }}>{group.entregados}</span> entregados
                    </span>
                    {group.cancelados > 0 && (
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                        <span style={{ color: '#fca5a5', fontWeight: 700 }}>{group.cancelados}</span> cancelados
                      </span>
                    )}
                    <span style={{ color: '#86efac', fontWeight: 700 }}>{fmt(group.ingresos)}</span>
                  </div>
                </div>

                {/* Table */}
                <div style={{
                  background: '#fff',
                  borderRadius: '0 0 12px 12px',
                  border: '1px solid #e2e8f0',
                  borderTop: 'none',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: colors.light, borderBottom: `2px solid ${colors.accent}22` }}>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Folio</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Moto</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cliente</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mecánico</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estado</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Recepción</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entrega</th>
                          <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.servicios.map((sv, i) => {
                          const badge = STATUS_BADGE[sv.status] ?? { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' };
                          const isLast = i === group.servicios.length - 1;
                          return (
                            <tr
                              key={sv.id}
                              onClick={() => setSelectedId(sv.id)}
                              style={{
                                borderBottom: isLast ? 'none' : '1px solid #f0f4f8',
                                background: i % 2 === 0 ? '#fff' : '#fafafa',
                                transition: 'background .1s',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = colors.light)}
                              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa')}
                            >
                              <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                                <code style={{ fontSize: 11, color: '#718096', background: '#f7fafc', padding: '2px 6px', borderRadius: 4 }}>
                                  {sv.folio}
                                </code>
                              </td>
                              <td style={{ padding: '11px 12px', fontWeight: 600, color: '#2d3748' }}>{sv.moto_display}</td>
                              <td style={{ padding: '11px 12px', color: '#4a5568', fontSize: 12 }}>{sv.cliente_nombre || <span style={{ color: '#cbd5e0' }}>—</span>}</td>
                              <td style={{ padding: '11px 12px', color: '#4a5568', fontSize: 12 }}>{sv.mecanico_nombre || <span style={{ color: '#cbd5e0' }}>—</span>}</td>
                              <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '3px 10px', borderRadius: 20,
                                  fontSize: 11, fontWeight: 600,
                                  background: badge.bg, color: badge.color,
                                  whiteSpace: 'nowrap',
                                }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: badge.dot, flexShrink: 0 }} />
                                  {sv.status_display}
                                </span>
                              </td>
                              <td style={{ padding: '11px 12px', fontSize: 12, color: '#718096', whiteSpace: 'nowrap' }}>
                                {sv.fecha_recepcion?.slice(0, 10) ?? '—'}
                              </td>
                              <td style={{ padding: '11px 12px', fontSize: 12, color: '#718096', whiteSpace: 'nowrap' }}>
                                {(sv as any).fecha_entrega?.slice(0, 10) ?? '—'}
                              </td>
                              <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: colors.accent, whiteSpace: 'nowrap' }}>
                                {fmt(sv.total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 8, paddingBottom: 16 }}>
              <button
                className="btn-secondary"
                disabled={page <= 1 || loading}
                onClick={() => loadData(page - 1)}
                style={{ padding: '6px 16px', fontSize: 13, fontWeight: 600 }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: 13, color: '#718096', fontWeight: 500 }}>
                Página {page} de {totalPages} · {total} servicios
              </span>
              <button
                className="btn-secondary"
                disabled={page >= totalPages || loading}
                onClick={() => loadData(page + 1)}
                style={{ padding: '6px 16px', fontSize: 13, fontWeight: 600 }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {selectedId !== null && (
        <ServicioDetalleModal
          servicioId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={() => loadData(page)}
        />
      )}
    </div>
  );
};

export default TallerHistorialView;
