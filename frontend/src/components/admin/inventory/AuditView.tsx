import React, { useEffect, useState, useCallback } from 'react';
import { inventoryService } from '../../../api/inventory.service';
import { branchesService } from '../../../api/branches.service';
import apiClient from '../../../api/axios.config';
import type { AuditoriaInventario, AuditoriaItem } from '../../../types/inventory.types';
import type { SedeDetail, Pagination } from '../../../types/auth.types';
import { Eye, X, FileDown } from 'lucide-react';

const AuditView: React.FC = () => {
  const [audits, setAudits] = useState<AuditoriaInventario[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, page_size: 10, total_pages: 1 });
  const [sedes, setSedes] = useState<SedeDetail[]>([]);
  const [sedeFilter, setSedeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Active audit detail
  const [activeAudit, setActiveAudit] = useState<AuditoriaInventario | null>(null);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [isFinalizing, setIsFinalizing] = useState(false);

  // New supervision form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSede, setNewSede] = useState('');
  const [newFecha, setNewFecha] = useState(new Date().toISOString().split('T')[0]);
  const [newMotivo, setNewMotivo] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // PDF download state
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const loadSedes = useCallback(() => {
    branchesService.list().then(r => setSedes(r.data.filter(s => s.is_active))).catch(() => {});
  }, []);

  const loadAudits = useCallback(() => {
    setIsLoading(true);
    const params: any = { page, page_size: 10 };
    if (sedeFilter) params.sede_id = sedeFilter;
    if (statusFilter) params.status = statusFilter;
    inventoryService.listAudits(params)
      .then(r => { setAudits(r.data.audits); setPagination(r.data.pagination); })
      .catch(() => setError('Error al cargar supervisiones'))
      .finally(() => setIsLoading(false));
  }, [page, sedeFilter, statusFilter]);

  useEffect(() => { loadSedes(); }, [loadSedes]);
  useEffect(() => { loadAudits(); }, [loadAudits]);
  useEffect(() => { setPage(1); }, [sedeFilter, statusFilter]);

  const openAudit = async (id: number) => {
    const r = await inventoryService.getAudit(id);
    setActiveAudit(r.data);
    const init: Record<number, string> = {};
    r.data.items.forEach((item: AuditoriaItem) => {
      init[item.id] = item.stock_fisico !== null ? String(item.stock_fisico) : '';
    });
    setCounts(init);
  };

  const saveCount = async (item: AuditoriaItem) => {
    if (!activeAudit) return;
    const val = counts[item.id];
    if (val === '' || isNaN(Number(val)) || Number(val) < 0) return;
    await inventoryService.updateAuditItem(activeAudit.id, item.id, Number(val));
  };

  const handleFinalize = async () => {
    if (!activeAudit) return;
    setIsFinalizing(true);
    setError('');
    try {
      await inventoryService.finalizeAudit(activeAudit.id);
      setActiveAudit(null);
      loadAudits();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al finalizar');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSede || !newFecha) return;
    setIsCreating(true);
    try {
      const r = await inventoryService.createAudit({
        sede: Number(newSede), fecha: newFecha, motivo: newMotivo,
      });
      setShowNewForm(false);
      setNewMotivo('');
      openAudit(r.data.id);
      loadAudits();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al crear supervisión');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadPDF = async (auditId: number, sedeName: string, fecha: string) => {
    setDownloadingId(auditId);
    try {
      const res = await apiClient.get(`/inventory/audits/${auditId}/pdf/`, {
        responseType: 'blob',
      });
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `supervision_${sedeName.replace(/\s+/g, '_')}_${fecha}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo descargar el PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Active audit detail view ─────────────────────────────────────────────
  if (activeAudit) {
    const pendingCount = activeAudit.items.filter(i => counts[i.id] === '').length;
    return (
      <div className="section-container">
        <div className="section-header">
          <div>
            <h2>Supervisión — {activeAudit.sede_name}</h2>
            <p>
              {activeAudit.fecha}
              {(activeAudit as any).motivo && ` · ${(activeAudit as any).motivo}`}
              {' · '}{activeAudit.status === 'DRAFT' ? 'Borrador' : 'Finalizada'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              disabled={downloadingId === activeAudit.id}
              onClick={() => handleDownloadPDF(activeAudit.id, activeAudit.sede_name, activeAudit.fecha)}
            >
              <FileDown size={14} />
              {downloadingId === activeAudit.id ? 'Generando…' : 'Descargar PDF'}
            </button>
            <button className="btn-secondary" onClick={() => setActiveAudit(null)}>← Volver</button>
            {activeAudit.status === 'DRAFT' && (
              <button className="btn-primary" onClick={handleFinalize} disabled={isFinalizing || pendingCount > 0}>
                {isFinalizing ? 'Finalizando...' : `Finalizar${pendingCount > 0 ? ` (${pendingCount} pendientes)` : ''}`}
              </button>
            )}
          </div>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <div className="table-wrapper">
          <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>SKU</th><th>Producto</th><th>En sistema</th><th>Conteo físico</th><th>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {activeAudit.items.map(item => {
                const diff = counts[item.id] !== '' ? Number(counts[item.id]) - item.stock_sistema : null;
                return (
                  <tr key={item.id}>
                    <td><code className="table-code">{item.producto_sku}</code></td>
                    <td>{item.producto_name}</td>
                    <td>{item.stock_sistema}</td>
                    <td>
                      {activeAudit.status === 'DRAFT' ? (
                        <input
                          type="number" min="0"
                          value={counts[item.id] ?? ''}
                          onChange={e => setCounts(c => ({ ...c, [item.id]: e.target.value }))}
                          onBlur={() => saveCount(item)}
                          className="table-input-number"
                          placeholder="—"
                        />
                      ) : <span>{item.stock_fisico ?? '—'}</span>}
                    </td>
                    <td>
                      {diff !== null ? (
                        <span className={`audit-diff audit-diff--${diff === 0 ? 'zero' : diff > 0 ? 'positive' : 'negative'}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      ) : <span className="text-muted">—</span>}
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
  }

  // ── Supervisiones list ────────────────────────────────────────────────────
  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2>Supervisión de Inventario</h2>
          <p>{pagination.total} supervisiones</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNewForm(true)}>+ Nueva Supervisión</button>
      </div>

      <div className="filters-bar">
        <select className="filter-select" value={sedeFilter} onChange={e => setSedeFilter(e.target.value)}>
          <option value="">Todas las sedes</option>
          {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="DRAFT">Programada</option>
          <option value="FINALIZADA">Finalizada</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {isLoading ? <div className="table-loading">Cargando...</div> : (
        <>
          <div className="table-wrapper">
            <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Sede</th><th>Fecha visita</th><th>Motivo</th><th>Productos</th>
                  <th>Estado</th><th>Creada por</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {audits.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">No hay supervisiones registradas</td></tr>
                ) : audits.map(a => (
                  <tr key={a.id}>
                    <td>{a.sede_name}</td>
                    <td>{a.fecha}</td>
                    <td style={{ color: '#4a5568', fontSize: 13 }}>
                      {(a as any).motivo || <span className="text-muted">—</span>}
                    </td>
                    <td>{a.items_count} productos</td>
                    <td>
                      <span className={`status-badge ${a.status === 'FINALIZADA' ? 'active' : 'inactive'}`}>
                        {a.status === 'FINALIZADA' ? 'Finalizada' : 'Programada'}
                      </span>
                    </td>
                    <td>{a.created_by_name}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-icon btn-edit" title="Ver detalle" onClick={() => openAudit(a.id)}>
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Descargar PDF de stock"
                        disabled={downloadingId === a.id}
                        onClick={() => handleDownloadPDF(a.id, a.sede_name, a.fecha)}
                        style={{ color: '#2b6cb0' }}
                      >
                        <FileDown size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          {pagination.total_pages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
              <span className="page-info">Página {pagination.page} de {pagination.total_pages}</span>
              <button className="page-btn" disabled={page === pagination.total_pages} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
            </div>
          )}
        </>
      )}

      {showNewForm && (
        <div className="modal-overlay" onClick={() => setShowNewForm(false)}>
          <div className="modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Supervisión</h2>
              <button className="modal-close" onClick={() => setShowNewForm(false)} aria-label="Cerrar"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-group">
                <label>Sede *</label>
                <select value={newSede} onChange={e => setNewSede(e.target.value)} required>
                  <option value="">— Selecciona una sede —</option>
                  {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Fecha de visita *</label>
                <input type="date" value={newFecha} onChange={e => setNewFecha(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Motivo de la visita</label>
                <textarea
                  value={newMotivo}
                  onChange={e => setNewMotivo(e.target.value)}
                  rows={2}
                  placeholder="Revisión trimestral, auditoría sorpresa, etc."
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowNewForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isCreating}>
                  {isCreating ? 'Creando...' : 'Crear supervisión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditView;
