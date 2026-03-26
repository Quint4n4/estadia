import React, { useCallback, useEffect, useState } from 'react';
import { catalogoServiciosService } from '../../../api/catalogo-servicios.service';
import type {
  CatalogoServicioList,
  CatalogoServicioDetail,
  CategoriaServicio,
} from '../../../types/catalogo-servicios.types';
import { Pencil, Lock, Unlock } from 'lucide-react';
import ServicioFormModal from './ServicioFormModal';
import ConfirmDialog from '../../common/ConfirmDialog';

const CatalogoServiciosList: React.FC = () => {
  const [servicios,   setServicios]   = useState<CatalogoServicioList[]>([]);
  const [categorias,  setCategorias]  = useState<CategoriaServicio[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState('');

  // Filters
  const [search,          setSearch]          = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [activoFilter,    setActivoFilter]    = useState('true');

  // Pagination
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);

  // Modals
  const [servicioModal,    setServicioModal]    = useState<CatalogoServicioDetail | null | undefined>(undefined);
  const [confirmToggle,    setConfirmToggle]    = useState<CatalogoServicioList | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [searchDebounced, categoriaFilter, activoFilter]);

  const loadCategorias = useCallback(() => {
    catalogoServiciosService.getCategorias()
      .then(data => setCategorias(data))
      .catch(() => {});
  }, []);

  const loadServicios = useCallback(() => {
    setIsLoading(true);
    setError('');
    const params: { categoria?: number; activo?: boolean; search?: string; page?: number } = { page };
    if (searchDebounced)    params.search    = searchDebounced;
    if (categoriaFilter)    params.categoria = Number(categoriaFilter);
    if (activoFilter !== '') params.activo   = activoFilter === 'true';

    catalogoServiciosService.getServicios(params)
      .then((response: any) => {
        // Backend returns { success, data: { servicios: [...], pagination: {...} } }
        const payload = response?.data;
        if (payload?.servicios && Array.isArray(payload.servicios)) {
          setServicios(payload.servicios);
          setTotal(payload.pagination?.total ?? payload.servicios.length);
          setTotalPages(payload.pagination?.total_pages ?? 1);
        } else {
          setServicios([]);
          setTotal(0);
          setTotalPages(1);
        }
      })
      .catch(() => setError('Error al cargar los servicios'))
      .finally(() => setIsLoading(false));
  }, [searchDebounced, categoriaFilter, activoFilter, page]);

  useEffect(() => { loadCategorias(); }, [loadCategorias]);
  useEffect(() => { loadServicios(); }, [loadServicios]);

  const handleToggle = async (s: CatalogoServicioList) => {
    try {
      await catalogoServiciosService.toggleActivoServicio(s.id);
      setConfirmToggle(null);
      loadServicios();
    } catch {
      setConfirmToggle(null);
      setError('Error al cambiar el estado del servicio');
    }
  };

  const handleOpenEdit = async (servicio: CatalogoServicioList) => {
    try {
      const detail = await catalogoServiciosService.getServicioDetail(servicio.id);
      setServicioModal(detail);
    } catch {
      setError('Error al cargar el detalle del servicio');
    }
  };

  const handleSaved = () => {
    setServicioModal(undefined);
    loadServicios();
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2>Catálogo de Servicios</h2>
          <p>{total} servicio{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setServicioModal(null)}>
          + Nuevo Servicio
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <input
          className="filter-input"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <select
          className="filter-select"
          value={categoriaFilter}
          onChange={e => setCategoriaFilter(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={activoFilter}
          onChange={e => setActivoFilter(e.target.value)}
        >
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
          <option value="">Todos</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {isLoading ? (
        <div className="table-loading">Cargando...</div>
      ) : (
        <>
          {servicios.length === 0 ? (
            <div
              className="empty-state"
              style={{ padding: '48px 0', textAlign: 'center', color: '#718096' }}
            >
              No se encontraron servicios
            </div>
          ) : (
            <div className="table-wrapper">
              <div className="table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Precio base</th>
                      <th>Duración (min)</th>
                      <th>Refacciones</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicios.map(s => (
                      <tr key={s.id} className={!s.activo ? 'row-inactive' : ''}>
                        <td><strong>{s.nombre}</strong></td>
                        <td>{s.categoria || <span className="text-muted">—</span>}</td>
                        <td>
                          {s.precio_base != null
                            ? `$${Number(s.precio_base).toFixed(2)}`
                            : <span style={{ color: '#a0aec0', fontSize: 12 }}>Sin definir</span>}
                        </td>
                        <td>
                          {s.duracion_estimada_minutos != null
                            ? `${s.duracion_estimada_minutos} min`
                            : <span style={{ color: '#a0aec0', fontSize: 12 }}>Variable</span>}
                        </td>
                        <td>
                          <span
                            style={{
                              display:      'inline-block',
                              background:   s.total_refacciones > 0 ? '#ebf8ff' : '#f7fafc',
                              color:        s.total_refacciones > 0 ? '#2b6cb0' : '#718096',
                              border:       `1px solid ${s.total_refacciones > 0 ? '#bee3f8' : '#e2e8f0'}`,
                              borderRadius: 12,
                              padding:      '2px 10px',
                              fontSize:     12,
                              fontWeight:   600,
                            }}
                          >
                            {s.total_refacciones}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${s.activo ? 'active' : 'inactive'}`}>
                            {s.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-icon btn-edit"
                              title="Editar"
                              onClick={() => handleOpenEdit(s)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className={`btn-icon ${s.activo ? 'btn-deactivate' : 'btn-activate'}`}
                              title={s.activo ? 'Desactivar' : 'Activar'}
                              onClick={() => setConfirmToggle(s)}
                            >
                              {s.activo ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Anterior
              </button>
              <span className="page-info">Página {page} de {totalPages}</span>
              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* Servicio form modal */}
      {servicioModal !== undefined && (
        <ServicioFormModal
          isOpen={true}
          onClose={() => setServicioModal(undefined)}
          onSave={handleSaved}
          servicioEditando={servicioModal}
        />
      )}

      {/* Toggle confirm dialog */}
      <ConfirmDialog
        open={confirmToggle !== null}
        title={confirmToggle?.activo ? 'Desactivar servicio' : 'Activar servicio'}
        message={
          confirmToggle
            ? confirmToggle.activo
              ? `¿Desactivar el servicio "${confirmToggle.nombre}"?`
              : `¿Activar el servicio "${confirmToggle.nombre}"?`
            : ''
        }
        confirmLabel={confirmToggle?.activo ? 'Desactivar' : 'Activar'}
        variant={confirmToggle?.activo ? 'warning' : 'primary'}
        onConfirm={() => confirmToggle && handleToggle(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
      />
    </div>
  );
};

export default CatalogoServiciosList;
