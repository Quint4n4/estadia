import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { inventoryService } from '../../../api/inventory.service';
import { branchesService } from '../../../api/branches.service';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import type { Producto, EntradaPayload } from '../../../types/inventory.types';
import type { SedeDetail } from '../../../types/auth.types';
import { X, ScanLine } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const InventoryEntryForm: React.FC<Props> = ({ onClose, onSaved }) => {
  const [sedes,       setSedes]       = useState<SedeDetail[]>([]);
  const [form,        setForm]        = useState({ producto: '', sede: '', quantity: '', cost_unit: '', notes: '' });
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Scanner state ──────────────────────────────────────────────────────
  const [scanInput,    setScanInput]    = useState('');
  const [scanning,     setScanning]     = useState(false);
  const [scanError,    setScanError]    = useState('');
  const [foundProduct, setFoundProduct] = useState<Producto | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    branchesService.list()
      .then(sr => setSedes(sr.data.filter((s: SedeDetail) => s.is_active)))
      .catch(() => {});
    // Auto-focus the scan input when the modal opens
    setTimeout(() => scanInputRef.current?.focus(), 50);
  }, []);

  // ── Handle barcode scan (hook or manual Enter) ─────────────────────────
  const handleScan = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setScanning(true);
    setScanError('');
    setFoundProduct(null);
    setForm(f => ({ ...f, producto: '' }));
    try {
      const res = await inventoryService.listProducts({ barcode: trimmed, is_active: true, page_size: 1 });
      const p = res.data.products[0];
      if (p) {
        setFoundProduct(p);
        setForm(f => ({ ...f, producto: String(p.id) }));
        setScanInput(trimmed);
      } else {
        setScanError(`Código "${trimmed}" no encontrado. Verifica que el producto exista.`);
      }
    } catch {
      setScanError('Error al buscar el producto. Intenta de nuevo.');
    } finally {
      setScanning(false);
    }
  };

  useBarcodeScanner({ onScan: handleScan, enabled: true });

  const clearProduct = () => {
    setFoundProduct(null);
    setScanInput('');
    setScanError('');
    setForm(f => ({ ...f, producto: '' }));
    setTimeout(() => scanInputRef.current?.focus(), 50);
  };

  const change = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.producto)  errs.producto  = 'Escanea o busca un producto';
    if (!form.sede)      errs.sede      = 'Selecciona una sede';
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity  = 'La cantidad debe ser mayor a 0';
    if (!form.cost_unit || Number(form.cost_unit) < 0) errs.cost_unit = 'El costo no puede ser negativo';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setGlobalError('');
    try {
      const payload: EntradaPayload = {
        producto:  Number(form.producto),
        sede:      Number(form.sede),
        quantity:  Number(form.quantity),
        cost_unit: Number(form.cost_unit),
        notes:     form.notes,
      };
      await inventoryService.createEntry(payload);
      onSaved();
    } catch (err: unknown) {
      const data = axios.isAxiosError(err) ? err.response?.data : undefined;
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
      <div className="modal-card" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Alta de Inventario</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {globalError && <div className="form-error-banner">{globalError}</div>}

          {/* ── Barcode scanner field ── */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ScanLine size={15} />
              Código de barras del producto *
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={scanInputRef}
                type="text"
                placeholder="Escanea o escribe el código..."
                value={scanInput}
                onChange={e => { setScanInput(e.target.value); setScanError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleScan(scanInput); } }}
                disabled={!!foundProduct}
                style={{ flex: 1 }}
              />
              {!foundProduct && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleScan(scanInput)}
                  disabled={scanning || !scanInput.trim()}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {scanning ? 'Buscando...' : 'Buscar'}
                </button>
              )}
            </div>

            {scanError && <span className="field-error">{scanError}</span>}
            {errors.producto && !foundProduct && <span className="field-error">{errors.producto}</span>}

            {/* Producto encontrado */}
            {foundProduct && (
              <div style={{
                marginTop: 8, padding: '10px 14px',
                background: '#f0fff4', border: '1px solid #9ae6b4',
                borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#22543d', fontSize: 14 }}>{foundProduct.name}</div>
                  <div style={{ fontSize: 12, color: '#48bb78', marginTop: 2 }}>
                    SKU: {foundProduct.sku} · Barcode: {foundProduct.codigo_barras}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearProduct}
                  title="Cambiar producto"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: 20, lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* ── Sede ── */}
          <div className="form-group">
            <label>Sede destino *</label>
            <select value={form.sede} onChange={e => change('sede', e.target.value)}>
              <option value="">— Selecciona una sede —</option>
              {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.sede && <span className="field-error">{errors.sede}</span>}
          </div>

          {/* ── Cantidad y costo ── */}
          <div className="form-row">
            <div className="form-group">
              <label>Cantidad recibida *</label>
              <input
                type="number" min="1"
                value={form.quantity}
                onChange={e => change('quantity', e.target.value)}
                placeholder="0"
              />
              {errors.quantity && <span className="field-error">{errors.quantity}</span>}
            </div>
            <div className="form-group">
              <label>Costo unitario *</label>
              <input
                type="number" step="0.01" min="0"
                value={form.cost_unit}
                onChange={e => change('cost_unit', e.target.value)}
                placeholder="0.00"
              />
              {errors.cost_unit && <span className="field-error">{errors.cost_unit}</span>}
            </div>
          </div>

          {/* ── Notas ── */}
          <div className="form-group">
            <label>Notas (opcional)</label>
            <textarea
              value={form.notes}
              onChange={e => change('notes', e.target.value)}
              rows={2}
              placeholder="Proveedor, factura, observaciones..."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryEntryForm;
