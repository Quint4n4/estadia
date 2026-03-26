import React, { useEffect, useState } from 'react';
import { catalogoServiciosService } from '../../../api/catalogo-servicios.service';
import type {
  CatalogoServicioDetail,
  CatalogoServicioPayload,
  CategoriaServicio,
  RefaccionInput,
} from '../../../types/catalogo-servicios.types';
import { X, ClipboardList, Wrench } from 'lucide-react';
import CategoriaServicioModal from './CategoriaServicioModal';
import RefaccionesFormSection from './RefaccionesFormSection';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  servicioEditando?: CatalogoServicioDetail | null;
}

const NOMBRE_RE = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-\/]+$/;

const ServicioFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, servicioEditando }) => {
  const isEdit = !!servicioEditando;

  const [form, setForm] = useState({
    nombre:                    servicioEditando?.nombre                    ?? '',
    descripcion:               servicioEditando?.descripcion               ?? '',
    precio_base:               servicioEditando?.precio_base               ?? '',
    duracion_estimada_minutos: servicioEditando?.duracion_estimada_minutos?.toString() ?? '',
    categoria:                 servicioEditando?.categoria_id?.toString()  ?? '',
  });

  const [refacciones, setRefacciones] = useState<RefaccionInput[]>(() =>
    servicioEditando?.refacciones?.map(r => ({
      producto:    r.producto.id,
      cantidad:    r.cantidad,
      es_opcional: r.es_opcional,
    })) ?? []
  );

  // Build initial product names map from servicioEditando
  const [productoNames] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    if (servicioEditando?.refacciones) {
      for (const r of servicioEditando.refacciones) {
        map[r.producto.id] = r.producto.name;
      }
    }
    return map;
  });

  const [categorias, setCategorias]   = useState<CategoriaServicio[]>([]);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab]     = useState<'info' | 'refacciones'>('info');
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    catalogoServiciosService.getCategorias()
      .then(data => setCategorias(data))
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const change = (field: string, value: string | number) => {
    setForm(f => ({ ...f, [field]: value }));
    // Clear field error on change
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const handleNombreChange = (value: string) => {
    setForm(f => ({ ...f, nombre: value }));
    if (value && !NOMBRE_RE.test(value)) {
      setErrors(e => ({ ...e, nombre: 'El nombre solo puede contener letras y espacios.' }));
    } else {
      setErrors(e => ({ ...e, nombre: '' }));
    }
  };

  const handlePrecioChange = (value: string) => {
    setForm(f => ({ ...f, precio_base: value }));
    if (value !== '' && Number(value) <= 0) {
      setErrors(e => ({ ...e, precio_base: 'El precio debe ser mayor a cero.' }));
    } else {
      setErrors(e => ({ ...e, precio_base: '' }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) {
      errs.nombre = 'El nombre es requerido';
    } else if (!NOMBRE_RE.test(form.nombre)) {
      errs.nombre = 'El nombre solo puede contener letras y espacios.';
    }
    if (!form.categoria) {
      errs.categoria = 'La categoría es requerida';
    }
    if (form.precio_base !== '' && Number(form.precio_base) <= 0) {
      errs.precio_base = 'El precio debe ser mayor a cero.';
    }
    if (form.duracion_estimada_minutos !== '' && Number(form.duracion_estimada_minutos) < 1) {
      errs.duracion_estimada_minutos = 'La duración debe ser al menos 1 minuto.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const hasErrors = () => {
    return Object.values(errors).some(e => !!e);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setActiveTab('info');
      return;
    }
    setIsSubmitting(true);
    setGlobalError('');
    try {
      const payload: CatalogoServicioPayload = {
        nombre:                    form.nombre.trim(),
        descripcion:               form.descripcion || undefined,
        precio_base:               form.precio_base !== '' ? Number(form.precio_base) : null,
        duracion_estimada_minutos: form.duracion_estimada_minutos !== '' ? Number(form.duracion_estimada_minutos) : null,
        categoria:                 Number(form.categoria),
        refacciones,
      };
      if (isEdit && servicioEditando) {
        await catalogoServiciosService.updateServicio(servicioEditando.id, payload);
      } else {
        await catalogoServiciosService.createServicio(payload);
      }
      onSave();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.errors) {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.errors)) {
          mapped[k] = Array.isArray(v) ? (v as string[]).join(' ') : String(v);
        }
        setErrors(mapped);
        setActiveTab('info');
      } else {
        setGlobalError(data?.message ?? 'Error inesperado');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoriaSaved = (nueva: CategoriaServicio) => {
    setCategorias(prev => [...prev, nueva]);
    setForm(f => ({ ...f, categoria: nueva.id.toString() }));
    setErrors(e => ({ ...e, categoria: '' }));
    setShowCategoriaModal(false);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-card"
          style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{isEdit ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
            <button className="modal-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
            {(['info', 'refacciones'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding:      '8px 18px',
                  background:   'none',
                  border:       'none',
                  borderBottom: activeTab === tab ? '2px solid #3182ce' : '2px solid transparent',
                  color:        activeTab === tab ? '#3182ce' : '#718096',
                  fontWeight:   activeTab === tab ? 700 : 400,
                  cursor:       'pointer',
                  fontSize:     14,
                }}
              >
                {tab === 'info' ? (
                  <><ClipboardList size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Información</>
                ) : (
                  <><Wrench size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Refacciones</>
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            {globalError && <div className="form-error-banner">{globalError}</div>}

            {/* ──────────── TAB: INFORMACIÓN ──────────── */}
            {activeTab === 'info' && (
              <>
                {/* Nombre */}
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    value={form.nombre}
                    onChange={e => handleNombreChange(e.target.value)}
                    placeholder="Ej: Cambio de Aceite"
                  />
                  {errors.nombre && <span className="field-error">{errors.nombre}</span>}
                </div>

                {/* Categoría */}
                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    value={form.categoria}
                    onChange={e => {
                      if (e.target.value === '__nueva__') {
                        setShowCategoriaModal(true);
                      } else {
                        change('categoria', e.target.value);
                      }
                    }}
                  >
                    <option value="">— Selecciona una categoría —</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                    <option value="__nueva__">+ Nueva categoría</option>
                  </select>
                  {errors.categoria && <span className="field-error">{errors.categoria}</span>}
                </div>

                {/* Descripción */}
                <div className="form-group">
                  <label>Descripción (opcional)</label>
                  <textarea
                    value={form.descripcion}
                    onChange={e => change('descripcion', e.target.value)}
                    rows={2}
                    placeholder="Descripción del servicio"
                  />
                </div>

                {/* Precio base + Duración */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Precio base <span style={{ fontSize: 11, color: '#a0aec0', fontWeight: 400 }}>(opcional)</span></label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.precio_base}
                      onChange={e => handlePrecioChange(e.target.value)}
                      placeholder="0.00"
                    />
                    {errors.precio_base && <span className="field-error">{errors.precio_base}</span>}
                  </div>
                  <div className="form-group">
                    <label>Duración estimada (min) <span style={{ fontSize: 11, color: '#a0aec0', fontWeight: 400 }}>(opcional)</span></label>
                    <input
                      type="number"
                      min="1"
                      value={form.duracion_estimada_minutos}
                      onChange={e => change('duracion_estimada_minutos', e.target.value)}
                      placeholder="Ej: 90"
                    />
                    {errors.duracion_estimada_minutos && (
                      <span className="field-error">{errors.duracion_estimada_minutos}</span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ──────────── TAB: REFACCIONES ──────────── */}
            {activeTab === 'refacciones' && (
              <div>
                <p style={{ fontSize: 13, color: '#718096', marginBottom: 14 }}>
                  Agrega las refacciones que se utilizan típicamente en este servicio.
                </p>
                <RefaccionesFormSection
                  refacciones={refacciones}
                  onChange={setRefacciones}
                  productoNames={productoNames}
                />
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: 20 }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || hasErrors()}
              >
                {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear servicio'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Inline CategoriaServicioModal */}
      <CategoriaServicioModal
        isOpen={showCategoriaModal}
        onClose={() => setShowCategoriaModal(false)}
        onSave={handleCategoriaSaved}
      />
    </>
  );
};

export default ServicioFormModal;
