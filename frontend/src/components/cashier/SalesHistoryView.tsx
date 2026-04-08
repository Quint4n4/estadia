import React, { useState, useEffect, useCallback } from 'react';
import type { Venta } from '../../types/sales.types';
import type { ServicioMotoDetail } from '../../types/taller.types';
import { salesService } from '../../api/sales.service';
import { tallerService } from '../../api/taller.service';
import TicketModal from '../common/TicketModal';
import TallerTicketModal from '../taller/TallerTicketModal';

interface Props {
  sedeId:   number;
  cajeroId: number;
}

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fmt = (n: string | number) =>
  parseFloat(String(n)).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

const metodoBadgeClass: Record<string, string> = {
  EFECTIVO:      'badge-metodo--efectivo',
  TARJETA:       'badge-metodo--tarjeta',
  TRANSFERENCIA: 'badge-metodo--transferencia',
};

// ── Tipo de venta ─────────────────────────────────────────────────────────────
type TipoFiltro = 'todos' | 'articulos' | 'taller';

const isTaller = (v: Venta) =>
  v.servicio_id != null ||
  v.items.some((i: any) => i.tipo === 'SERVICIO') ||
  v.notas?.startsWith('Servicio de taller');

const SalesHistoryView: React.FC<Props> = ({ sedeId, cajeroId }) => {
  const today = toDateStr(new Date());

  const [fechaDesde,      setFechaDesde]      = useState(today);
  const [fechaHasta,      setFechaHasta]      = useState(today);
  const [ventas,          setVentas]          = useState<Venta[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [page,            setPage]            = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);
  const [totalVentas,     setTotalVentas]     = useState(0);
  const [cancelingId,     setCancelingId]     = useState<number | null>(null);
  const [confirmId,       setConfirmId]       = useState<number | null>(null);
  const [tipoFiltro,      setTipoFiltro]      = useState<TipoFiltro>('todos');

  // Ticket states
  const [ticketVenta,     setTicketVenta]     = useState<Venta | null>(null);
  const [ticketServicio,  setTicketServicio]  = useState<ServicioMotoDetail | null>(null);
  const [loadingTicketId, setLoadingTicketId] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await salesService.listVentas({
        sede_id:     sedeId,
        cajero_id:   cajeroId,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        page:        p,
        page_size:   50,
      });
      setVentas(res.data.ventas);
      setTotalPages(res.data.pagination.total_pages ?? 1);
      setTotalVentas(res.data.pagination.total);
    } catch {
      setVentas([]);
    } finally {
      setLoading(false);
    }
  }, [sedeId, cajeroId, fechaDesde, fechaHasta]);

  useEffect(() => {
    setPage(1);
    load(1);
  }, [fechaDesde, fechaHasta, load]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    load(newPage);
  };

  const handleCancelar = async (id: number) => {
    setCancelingId(id);
    try {
      await salesService.cancelarVenta(id);
      setConfirmId(null);
      load(page);
    } catch { /* ignore */ } finally {
      setCancelingId(null);
    }
  };

  const handleVerTicket = async (v: Venta) => {
    const esTallerVenta = isTaller(v);

    // Try servicio_id directly (available once backend has the updated serializer)
    const servicioId = v.servicio_id ?? null;

    if (servicioId) {
      setLoadingTicketId(v.id);
      try {
        const res = await tallerService.getServicio(servicioId);
        setTicketServicio(res.data);
      } catch { /* ignore */ } finally {
        setLoadingTicketId(null);
      }
    } else if (esTallerVenta) {
      setLoadingTicketId(v.id);
      try {
        // Try 1: search by venta_id FK
        let lista = await tallerService.listServicios({
          venta_id: v.id,
          include_entregado: true,
          incluir_archivados: true,
        });

        // Try 2: parse folio from notas and search by folio
        if (!lista.length && v.notas?.startsWith('Servicio de taller')) {
          const folio = v.notas.split(' — ')[1]?.trim();
          if (folio) {
            lista = await tallerService.listServicios({
              folio,
              include_entregado: true,
              incluir_archivados: true,
            });
          }
        }

        const first = lista[0];
        if (first) {
          const res = await tallerService.getServicio(first.id);
          setTicketServicio(res.data);
        } else {
          setTicketVenta(v);
        }
      } catch {
        setTicketVenta(v);
      } finally {
        setLoadingTicketId(null);
      }
    } else {
      setTicketVenta(v);
    }
  };

  // Filtrado local por tipo
  const ventasFiltradas = ventas.filter(v => {
    if (tipoFiltro === 'articulos') return !isTaller(v);
    if (tipoFiltro === 'taller')    return isTaller(v);
    return true;
  });

  const totalDelDia = ventasFiltradas
    .filter(v => v.status === 'COMPLETADA')
    .reduce((s, v) => s + parseFloat(v.total), 0);

  const countTaller   = ventas.filter(v => isTaller(v) && v.status === 'COMPLETADA').length;
  const countArticulos = ventas.filter(v => !isTaller(v) && v.status === 'COMPLETADA').length;

  return (
    <div className="sales-history-wrap">

      {/* Filters */}
      <div className="sales-history-filters">
        <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Desde:</label>
        <input type="date" value={fechaDesde} max={today} onChange={e => setFechaDesde(e.target.value)} />
        <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Hasta:</label>
        <input type="date" value={fechaHasta} max={today} onChange={e => setFechaHasta(e.target.value)} />
        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}
          onClick={() => load(page)} disabled={loading}>
          {loading ? 'Cargando…' : 'Actualizar'}
        </button>

        {totalVentas > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {totalVentas} venta{totalVentas !== 1 ? 's' : ''} · Total: <strong>{fmt(totalDelDia)}</strong>
          </span>
        )}
      </div>

      {/* Tabs tipo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {([
          { id: 'todos',     label: `Todos (${ventas.length})` },
          { id: 'articulos', label: `🛒 Solo artículos (${countArticulos})` },
          { id: 'taller',    label: `🔧 Servicios taller (${countTaller})` },
        ] as { id: TipoFiltro; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setTipoFiltro(tab.id)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: tipoFiltro === tab.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: tipoFiltro === tab.id ? 'var(--color-primary)' : 'var(--color-bg-card)',
              color: tipoFiltro === tab.id ? '#fff' : 'var(--color-text)',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="sales-history-table-wrap">
        {loading ? (
          <div className="sales-history-empty">Cargando ventas…</div>
        ) : ventasFiltradas.length === 0 ? (
          <div className="sales-history-empty">
            No hay ventas en el período seleccionado.
          </div>
        ) : (
          <table className="sales-history-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Artículos / Concepto</th>
                <th>Método</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.map(v => {
                const esTaller = isTaller(v);
                return (
                  <tr key={v.id} style={{ opacity: v.status === 'CANCELADA' ? 0.55 : 1 }}>
                    <td style={{ fontWeight: 600 }}># {v.id}</td>
                    <td>{fmtTime(v.created_at)}</td>

                    {/* Tipo */}
                    <td>
                      {esTaller ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#faf5ff', border: '1px solid #d6bcfa',
                          color: '#553c9a', borderRadius: 10,
                          padding: '2px 8px', fontSize: 11, fontWeight: 700,
                        }}>
                          🔧 Taller
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#ebf8ff', border: '1px solid #90cdf4',
                          color: '#2b6cb0', borderRadius: 10,
                          padding: '2px 8px', fontSize: 11, fontWeight: 700,
                        }}>
                          🛒 Artículos
                        </span>
                      )}
                    </td>

                    {/* Artículos / Concepto */}
                    <td style={{ fontSize: 12 }}>
                      {esTaller
                        ? <span style={{ color: '#553c9a', fontStyle: 'italic' }}>Servicio de taller</span>
                        : `${v.items.length} artículo${v.items.length !== 1 ? 's' : ''}`
                      }
                    </td>

                    <td>
                      <span className={`badge-metodo ${metodoBadgeClass[v.metodo_pago] ?? ''}`}>
                        {v.metodo_pago}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        background: v.status === 'COMPLETADA' ? '#f0fff4' : '#fff5f5',
                        color:      v.status === 'COMPLETADA' ? '#22543d' : '#c53030',
                        border:     `1px solid ${v.status === 'COMPLETADA' ? '#c6f6d5' : '#fed7d7'}`,
                      }}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(v.total)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleVerTicket(v)}
                          disabled={loadingTicketId === v.id}
                          title="Ver ticket"
                          style={{
                            fontSize: 11, padding: '3px 10px', borderRadius: 6,
                            border: esTaller ? '1px solid #d6bcfa' : '1px solid #bee3f8',
                            background: esTaller ? '#faf5ff' : '#ebf8ff',
                            color: esTaller ? '#553c9a' : '#2b6cb0',
                            cursor: loadingTicketId === v.id ? 'wait' : 'pointer',
                            fontWeight: 600, minWidth: 52,
                          }}
                        >
                          {loadingTicketId === v.id ? '…' : 'Ticket'}
                        </button>
                        {v.status === 'COMPLETADA' && !esTaller && (
                          confirmId === v.id ? (
                            <>
                              <button
                                onClick={() => handleCancelar(v.id)}
                                disabled={cancelingId === v.id}
                                style={{
                                  fontSize: 11, padding: '3px 10px', borderRadius: 6, border: 'none',
                                  background: '#c53030', color: '#fff', cursor: 'pointer', fontWeight: 600,
                                }}
                              >
                                {cancelingId === v.id ? '…' : 'Confirmar'}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                style={{
                                  fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid #cbd5e0',
                                  background: '#fff', cursor: 'pointer',
                                }}
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmId(v.id)}
                              title="Cancelar venta"
                              style={{
                                fontSize: 11, padding: '3px 10px', borderRadius: 6,
                                border: '1px solid #fed7d7', background: '#fff5f5',
                                color: '#c53030', cursor: 'pointer', fontWeight: 600,
                              }}
                            >
                              Cancelar
                            </button>
                          )
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pos-pagination">
          <button onClick={() => handlePageChange(page - 1)} disabled={page <= 1 || loading}>← Anterior</button>
          <span>Página {page} de {totalPages}</span>
          <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages || loading}>Siguiente →</button>
        </div>
      )}

      {/* Ticket de artículos */}
      {ticketVenta && (
        <TicketModal venta={ticketVenta} onClose={() => setTicketVenta(null)} />
      )}

      {/* Ticket de taller */}
      {ticketServicio && (
        <TallerTicketModal servicio={ticketServicio} onClose={() => setTicketServicio(null)} />
      )}
    </div>
  );
};

export default SalesHistoryView;
