import React, { useEffect, useRef, useState } from 'react';
import { inventoryService } from '../../../api/inventory.service';
import type { Producto } from '../../../types/inventory.types';
import type { RefaccionInput } from '../../../types/catalogo-servicios.types';
import { Trash2, Info } from 'lucide-react';

interface Props {
  refacciones: RefaccionInput[];
  onChange: (refacciones: RefaccionInput[]) => void;
  // For edit mode: display names already resolved
  productoNames?: Record<number, string>;
}

interface RefaccionRow extends RefaccionInput {
  _searchText: string;
  _searchResults: Producto[];
  _showDropdown: boolean;
  _resolvedName: string;
  _duplicateError: string;
}

const RefaccionesFormSection: React.FC<Props> = ({ refacciones, onChange, productoNames = {} }) => {
  const [rows, setRows] = useState<RefaccionRow[]>(() =>
    refacciones.map(r => ({
      ...r,
      _searchText:     productoNames[r.producto] ?? '',
      _searchResults:  [],
      _showDropdown:   false,
      _resolvedName:   productoNames[r.producto] ?? '',
      _duplicateError: '',
    }))
  );

  const debounceRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Sync rows -> parent onChange whenever rows change
  useEffect(() => {
    onChange(rows.map(r => ({
      producto:    r.producto,
      cantidad:    r.cantidad,
      es_opcional: r.es_opcional,
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const updateRow = (index: number, patch: Partial<RefaccionRow>) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleSearchChange = (index: number, value: string) => {
    updateRow(index, { _searchText: value, _resolvedName: '', producto: 0, _duplicateError: '' });
    if (debounceRefs.current[index]) clearTimeout(debounceRefs.current[index]);
    if (!value.trim()) {
      updateRow(index, { _searchResults: [], _showDropdown: false });
      return;
    }
    debounceRefs.current[index] = setTimeout(async () => {
      try {
        const res = await inventoryService.listProducts({ search: value, page_size: 8 });
        setRows(prev => {
          const next = [...prev];
          next[index] = { ...next[index], _searchResults: res.data.products, _showDropdown: true };
          return next;
        });
      } catch {
        // silently fail
      }
    }, 400);
  };

  const handleSelectProduct = (index: number, product: Producto) => {
    // Check duplicate
    const isDuplicate = rows.some(
      (r, i) => i !== index && r.producto === product.id
    );
    if (isDuplicate) {
      updateRow(index, {
        _showDropdown:   false,
        _duplicateError: `"${product.name}" ya está en la lista.`,
      });
      return;
    }
    updateRow(index, {
      producto:        product.id,
      _searchText:     product.name,
      _resolvedName:   product.name,
      _searchResults:  [],
      _showDropdown:   false,
      _duplicateError: '',
    });
  };

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        producto:        0,
        cantidad:        1,
        es_opcional:     false,
        _searchText:     '',
        _searchResults:  [],
        _showDropdown:   false,
        _resolvedName:   '',
        _duplicateError: '',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  if (rows.length === 0) {
    return (
      <div>
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          8,
            background:   '#ebf8ff',
            border:       '1px solid #bee3f8',
            borderRadius: 8,
            padding:      '10px 14px',
            fontSize:     13,
            color:        '#2b6cb0',
            marginBottom: 12,
          }}
        >
          <Info size={15} style={{ flexShrink: 0 }} />
          <span>Este servicio no requiere refacciones (solo mano de obra).</span>
        </div>
        <button type="button" className="btn-secondary" onClick={handleAddRow} style={{ fontSize: 13 }}>
          + Agregar refacción
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((row, index) => (
          <div
            key={index}
            style={{
              background:   '#f7fafc',
              border:       '1px solid #e2e8f0',
              borderRadius: 8,
              padding:      '10px 12px',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Buscador de producto */}
              <div style={{ flex: '1 1 200px', position: 'relative' }}>
                <label style={{ fontSize: 12, color: '#718096', display: 'block', marginBottom: 3 }}>
                  Producto *
                </label>
                <input
                  value={row._searchText}
                  onChange={e => handleSearchChange(index, e.target.value)}
                  placeholder="Buscar producto..."
                  onBlur={() => setTimeout(() => updateRow(index, { _showDropdown: false }), 150)}
                  onFocus={() => {
                    if (row._searchResults.length > 0) updateRow(index, { _showDropdown: true });
                  }}
                  style={{ width: '100%' }}
                />
                {row._showDropdown && row._searchResults.length > 0 && (
                  <div
                    style={{
                      position:   'absolute',
                      top:        '100%',
                      left:       0,
                      right:      0,
                      background: '#fff',
                      border:     '1px solid #e2e8f0',
                      borderRadius: 6,
                      boxShadow:  '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex:     50,
                      maxHeight:  200,
                      overflowY:  'auto',
                    }}
                  >
                    {row._searchResults.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => handleSelectProduct(index, p)}
                        style={{
                          display:    'block',
                          width:      '100%',
                          textAlign:  'left',
                          padding:    '8px 12px',
                          background: 'none',
                          border:     'none',
                          cursor:     'pointer',
                          fontSize:   13,
                          color:      '#2d3748',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f0f4f8')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        <span style={{ color: '#718096', marginLeft: 6, fontSize: 11 }}>{p.sku}</span>
                      </button>
                    ))}
                  </div>
                )}
                {row._duplicateError && (
                  <span className="field-error" style={{ display: 'block', marginTop: 3 }}>
                    {row._duplicateError}
                  </span>
                )}
              </div>

              {/* Cantidad */}
              <div style={{ width: 90 }}>
                <label style={{ fontSize: 12, color: '#718096', display: 'block', marginBottom: 3 }}>
                  Cantidad
                </label>
                <input
                  type="number"
                  min={1}
                  value={row.cantidad}
                  onChange={e => updateRow(index, { cantidad: Math.max(1, Number(e.target.value)) })}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Opcional */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 2 }}>
                <label style={{ fontSize: 12, color: '#718096', display: 'block', marginBottom: 3 }}>
                  &nbsp;
                </label>
                <label
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        5,
                    fontSize:   13,
                    cursor:     'pointer',
                    whiteSpace: 'nowrap',
                    paddingTop: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={row.es_opcional}
                    onChange={e => updateRow(index, { es_opcional: e.target.checked })}
                  />
                  Opcional
                </label>
              </div>

              {/* Eliminar */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 2 }}>
                <label style={{ fontSize: 12, color: '#718096', display: 'block', marginBottom: 3 }}>
                  &nbsp;
                </label>
                <button
                  type="button"
                  className="btn-icon btn-deactivate"
                  title="Eliminar refacción"
                  onClick={() => handleRemoveRow(index)}
                  style={{ marginTop: 6 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn-secondary"
        onClick={handleAddRow}
        style={{ fontSize: 13, marginTop: 10 }}
      >
        + Agregar refacción
      </button>
    </div>
  );
};

export default RefaccionesFormSection;
