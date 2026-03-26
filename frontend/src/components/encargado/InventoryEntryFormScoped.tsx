import React, { useEffect, useRef, useState } from 'react';
import { inventoryService } from '../../api/inventory.service';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import type { Producto, EntradaPayload } from '../../types/inventory.types';
import { ScanLine, X } from 'lucide-react';

interface Props {
  sedeId:  number;
  onClose: () => void;
  onSaved: () => void;
}

const SCANNER_CHAR_GAP_MS = 60;
const SCANNER_IDLE_MS     = 80;

const InventoryEntryFormScoped: React.FC<Props> = ({ sedeId, onClose, onSaved }) => {
  // ── Product lookup ────────────────────────────────────────────────────────
  const [scanInput,    setScanInput]    = useState('');
  const [scanning,     setScanning]     = useState(false);
  const [scanError,    setScanError]    = useState('');
  const [foundProduct, setFoundProduct] = useState<Producto | null>(null);

  // ── Form fields ───────────────────────────────────────────────────────────
  const [quantity,     setQuantity]     = useState('');
  const [notes,        setNotes]        = useState('');
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [globalError,  setGlobalError]  = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const scanInputRef  = useRef<HTMLInputElement>(null);
  const quantityRef   = useRef<HTMLInputElement>(null);
  const lastCharRef   = useRef<number>(0);
  const scanTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTimeout(() => scanInputRef.current?.focus(), 50);
  }, []);

  // ── Lookup product by barcode ─────────────────────────────────────────────
  const handleScan = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setScanning(true);
    setScanError('');
    setFoundProduct(null);
    setErrors({});
    try {
      const res = await inventoryService.listProducts({
        barcode: trimmed, is_active: true, page_size: 1,
      });
      const p = res.data.products[0];
      if (p) {
        setFoundProduct(p);
        setScanInput(trimmed);
        // Auto-focus quantity after product found
        setTimeout(() => { quantityRef.current?.focus(); quantityRef.current?.select(); }, 60);
      } else {
        setScanError(`Código "${trimmed}" no encontrado.`);
        scanInputRef.current?.select();
      }
    } catch {
      setScanError('Error al buscar el producto.');
    } finally {
      setScanning(false);
    }
  };

  // ── Detect scanner batch delivery (charDiff >= 4) ─────────────────────────
  const handleScanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal   = e.target.value;
    const charDiff = newVal.length - scanInput.length;

    // Multiple chars arrived at once → scanner batch delivery
    if (charDiff >= 4 && newVal.length >= 4) {
      setScanInput(newVal);
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      scanTimerRef.current = setTimeout(() => handleScan(newVal), SCANNER_IDLE_MS);
      return;
    }

    // Sequential chars at scanner speed
    const now   = Date.now();
    const delta = now - lastCharRef.current;
    lastCharRef.current = now;

    if (delta < SCANNER_CHAR_GAP_MS && newVal.length >= 2) {
      setScanInput(newVal);
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      scanTimerRef.current = setTimeout(() => handleScan(newVal), SCANNER_IDLE_MS);
      return;
    }

    // Human typing
    setScanInput(newVal);
    setScanError('');
  };

  const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      handleScan(scanInput);
    }
  };

  // Global hook — fires when scanner sends chars without the input focused
  useBarcodeScanner({ onScan: handleScan, enabled: !foundProduct });

  const clearProduct = () => {
    setFoundProduct(null);
    setScanInput('');
    setScanError('');
    setQuantity('');
    setErrors({});
    setTimeout(() => scanInputRef.current?.focus(), 50);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!foundProduct)                              errs.producto = 'Escanea un producto';
    if (!quantity || Number(quantity) <= 0)         errs.quantity = 'La cantidad debe ser mayor a 0';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    setGlobalError('');
    try {
      const payload: EntradaPayload = {
        producto:  foundProduct!.id,
        sede:      sedeId,
        quantity:  Number(quantity),
        cost_unit: Number(foundProduct!.price),
        notes,
      };
      await inventoryService.createEntry(payload);
      onSaved();
    } catch (err: unknown) {
      const data = (err as any)?.response?.data;
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
      <div className="modal-card" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrar entrada de inventario</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {globalError && <div className="form-error-banner">{globalError}</div>}

          {/* ── Barcode scan field ── */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ScanLine size={15} />
              Escanea el código de barras *
            </label>

            {!foundProduct ? (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    ref={scanInputRef}
                    type="text"
                    placeholder="Escanea o escribe el código…"
                    value={scanInput}
                    onChange={handleScanInputChange}
                    onKeyDown={handleScanKeyDown}
                    style={{ flex: 1 }}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleScan(scanInput)}
                    disabled={scanning || !scanInput.trim()}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {scanning ? 'Buscando…' : 'Buscar'}
                  </button>
                </div>
                {scanError && <span className="field-error">{scanError}</span>}
                {errors.producto && <span className="field-error">{errors.producto}</span>}
              </>
            ) : (
              /* Producto encontrado */
              <div style={{
                padding: '10px 14px',
                background: '#f0fff4', border: '1px solid #9ae6b4',
                borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#22543d', fontSize: 14 }}>
                    {foundProduct.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#48bb78', marginTop: 2 }}>
                    SKU: {foundProduct.sku}
                    {foundProduct.codigo_barras && ` · Barcode: ${foundProduct.codigo_barras}`}
                    {' · '}Precio: ${Number(foundProduct.price).toFixed(2)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearProduct}
                  title="Cambiar producto"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: 20 }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* ── Cantidad ── */}
          <div className="form-group">
            <label>Cantidad recibida *</label>
            <input
              ref={quantityRef}
              type="number" min="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="0"
              disabled={!foundProduct}
            />
            {errors.quantity && <span className="field-error">{errors.quantity}</span>}
          </div>

          {/* ── Notas ── */}
          <div className="form-group">
            <label>Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Proveedor, número de factura, observaciones…"
              disabled={!foundProduct}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || !foundProduct}>
              {isSubmitting ? 'Registrando…' : 'Registrar entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryEntryFormScoped;
