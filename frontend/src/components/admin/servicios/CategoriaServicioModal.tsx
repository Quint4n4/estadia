import React, { useState } from 'react';
import { catalogoServiciosService } from '../../../api/catalogo-servicios.service';
import type { CategoriaServicio, CategoriaServicioPayload } from '../../../types/catalogo-servicios.types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoria: CategoriaServicio) => void;
  categoriaEditando?: CategoriaServicio | null;
}

const NOMBRE_RE = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-]+$/;

const CategoriaServicioModal: React.FC<Props> = ({ isOpen, onClose, onSave, categoriaEditando }) => {
  const isEdit = !!categoriaEditando;

  const [form, setForm] = useState({
    nombre:      categoriaEditando?.nombre      ?? '',
    descripcion: categoriaEditando?.descripcion ?? '',
  });
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNombreChange = (value: string) => {
    setForm(f => ({ ...f, nombre: value }));
    if (value && !NOMBRE_RE.test(value)) {
      setErrors(e => ({ ...e, nombre: 'Solo se permiten letras y espacios.' }));
    } else {
      setErrors(e => ({ ...e, nombre: '' }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) {
      errs.nombre = 'El nombre es requerido';
    } else if (!NOMBRE_RE.test(form.nombre)) {
      errs.nombre = 'Solo se permiten letras y espacios.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setGlobalError('');
    try {
      const payload: CategoriaServicioPayload = {
        nombre:      form.nombre.trim(),
        descripcion: form.descripcion || undefined,
      };
      let result: CategoriaServicio;
      if (isEdit && categoriaEditando) {
        result = await catalogoServiciosService.updateCategoria(categoriaEditando.id, payload);
      } else {
        result = await catalogoServiciosService.createCategoria(payload);
      }
      onSave(result);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.errors) {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.errors)) {
          mapped[k] = Array.isArray(v) ? (v as string[]).join(' ') : String(v);
        }
        setErrors(mapped);
      } else {
        setGlobalError(data?.message ?? 'Error inesperado');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Editar Categoría de Servicio' : 'Nueva Categoría de Servicio'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {globalError && <div className="form-error-banner">{globalError}</div>}
          <div className="form-group">
            <label>Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => handleNombreChange(e.target.value)}
              placeholder="Ej: Mantenimiento General"
            />
            {errors.nombre && <span className="field-error">{errors.nombre}</span>}
          </div>
          <div className="form-group">
            <label>Descripción (opcional)</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              placeholder="Descripción breve de la categoría de servicio"
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoriaServicioModal;
