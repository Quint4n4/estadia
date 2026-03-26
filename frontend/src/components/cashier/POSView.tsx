import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CartItem, MetodoPago } from '../../types/sales.types';
import type { Producto, MarcaMoto, ModeloMoto, Categoria } from '../../types/inventory.types';
import { inventoryService } from '../../api/inventory.service';
import PaymentModal from './PaymentModal';
import PedidoBodegaPanel from './PedidoBodegaPanel';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';

interface Props {
  sedeId: number;
}

const fmt = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const DEBOUNCE_MS = 200;

// ── Shared product card grid ──────────────────────────────────────────────────

interface GridProps {
  results:   Producto[];
  searching: boolean;
  sedeId:    number;
  cart:      CartItem[];
  onAdd:     (p: Producto) => void;
  emptyMsg?: string;
}

const ProductGrid: React.FC<GridProps> = ({ results, searching, sedeId, cart, onAdd, emptyMsg }) => {
  if (searching) return <p className="pos-search-hint">Buscando…</p>;
  if (results.length === 0 && emptyMsg) return <p className="pos-search-hint">{emptyMsg}</p>;
  if (results.length === 0) return null;

  return (
    <div className="pos-product-grid">
      {results.map(p => {
        const stockEntry = p.stock_items?.find(s => s.sede_id === sedeId);
        const disponible = stockEntry?.quantity ?? 0;
        const price      = parseFloat(String(p.price));
        const inCart     = cart.find(c => c.producto_id === p.id);
        const sinStock   = disponible <= 0;
        const lowStock   = disponible > 0 && disponible <= 3;
        const refLine    = [p.numero_parte_oem || p.sku, p.marca_fabricante_name].filter(Boolean).join(' · ');

        const handleAdd = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (!sinStock) onAdd(p);
        };
        const handleCardActivate = () => { if (!sinStock) onAdd(p); };

        return (
          <div
            key={p.id}
            className={`pos-product-card${sinStock ? ' pos-product-card--disabled' : ''}${lowStock && !sinStock ? ' pos-product-card--low' : ''}`}
            onClick={handleCardActivate}
            role="button"
            tabIndex={sinStock ? -1 : 0}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !sinStock) {
                e.preventDefault();
                onAdd(p);
              }
            }}
            title={sinStock ? 'Sin stock en esta sede' : 'Agregar al carrito'}
          >
            <div className="pos-product-card-media">
              {sinStock && (
                <div className="pos-product-oos" aria-hidden>
                  <span>SIN STOCK</span>
                </div>
              )}
              {!sinStock && lowStock && (
                <div className="pos-product-badge pos-product-badge--warn">
                  <span className="material-symbols-outlined pos-product-badge-icon">warning</span>
                  Poco stock
                </div>
              )}
              {p.imagen ? (
                <img src={p.imagen} alt="" className="pos-product-img" />
              ) : (
                <div className="pos-product-img-placeholder">
                  <span className="material-symbols-outlined pos-product-ph-icon">inventory_2</span>
                </div>
              )}
            </div>
            <div className="pos-product-card-body">
              <div className="pos-product-card-title-row">
                <h3 className="pos-product-name">{p.name}</h3>
                <span className="pos-product-price">{fmt(price)}</span>
              </div>
              <p className="pos-product-ref">{refLine || p.sku}</p>
              <div className="pos-product-card-foot">
                {!sinStock && (
                  <span className={`pos-product-stock-tag${lowStock ? ' pos-product-stock-tag--amber' : ''}`}>
                    Stock: {disponible}{inCart ? ` (${inCart.quantity} en carrito)` : ''}
                  </span>
                )}
                {!sinStock && (
                  <button type="button" className="pos-product-add" onClick={handleAdd} aria-label="Agregar al carrito">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Text search mode ──────────────────────────────────────────────────────────

const SCANNER_CHAR_GAP_MS = 60;
const SCANNER_IDLE_MS     = 80;

const TextSearchMode: React.FC<{
  sedeId:          number;
  cart:            CartItem[];
  onAdd:           (p: Producto) => void;
  onBarcodeScan:   (code: string) => void;
}> = ({ sedeId, cart, onAdd, onBarcodeScan }) => {
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<Producto[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const lastCharRef  = useRef<number>(0);
  const isScanSeqRef = useRef<boolean>(false);
  const onBarcodeRef = useRef(onBarcodeScan);
  useEffect(() => { onBarcodeRef.current = onBarcodeScan; }, [onBarcodeScan]);

  const fireScan = useCallback((val: string) => {
    if (val.length < 3) return;
    if (debounceRef.current)  clearTimeout(debounceRef.current);
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setQuery('');
    setResults([]);
    isScanSeqRef.current = false;
    onBarcodeRef.current(val);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await inventoryService.listProducts({
        search: q, sede_id: sedeId, is_active: true, page_size: 40,
      });
      setResults(res.data.products);
    } catch { setResults([]); }
    finally  { setSearching(false); }
  }, [sedeId]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal  = e.target.value;
    const charDiff = newVal.length - query.length;

    if (charDiff >= 4 && newVal.length >= 4) {
      fireScan(newVal);
      return;
    }

    const now   = Date.now();
    const delta = now - lastCharRef.current;
    lastCharRef.current = now;

    if (delta < SCANNER_CHAR_GAP_MS && newVal.length >= 2) {
      isScanSeqRef.current = true;
      if (debounceRef.current)  clearTimeout(debounceRef.current);
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      scanTimerRef.current = setTimeout(() => fireScan(newVal), SCANNER_IDLE_MS);
      setQuery(newVal);
      return;
    }

    isScanSeqRef.current = false;
    if (scanTimerRef.current) { clearTimeout(scanTimerRef.current); scanTimerRef.current = null; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(newVal), DEBOUNCE_MS);
    setQuery(newVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const val = (e.target as HTMLInputElement).value;
    if (val.length >= 3) {
      e.preventDefault();
      e.stopPropagation();
      fireScan(val);
    }
  };

  return (
    <>
      <div className="pos-search-input-wrap pos-search-input-wrap--hero">
        <span className="material-symbols-outlined pos-search-input-icon" aria-hidden>search</span>
        <input
          ref={inputRef}
          className="pos-search-input"
          type="text"
          placeholder="Nombre, SKU, código de barras, número de parte…"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            className="pos-search-clear"
            onClick={() => { setQuery(''); setResults([]); if (scanTimerRef.current) clearTimeout(scanTimerRef.current); }}
            aria-label="Limpiar búsqueda"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>
      <ProductGrid
        results={results} searching={searching} sedeId={sedeId} cart={cart} onAdd={onAdd}
        emptyMsg={query ? `Sin resultados para "${query}".` : 'Escribe para buscar productos…'}
      />
    </>
  );
};

// ── Moto (YMM) search mode ────────────────────────────────────────────────────

const MotoSearchMode: React.FC<{ sedeId: number; cart: CartItem[]; onAdd: (p: Producto) => void }> = ({ sedeId, cart, onAdd }) => {
  const [marcas,      setMarcas]      = useState<MarcaMoto[]>([]);
  const [modelos,     setModelos]     = useState<ModeloMoto[]>([]);
  const [categorias,  setCategorias]  = useState<Categoria[]>([]);

  const [selMarca,    setSelMarca]    = useState('');
  const [año,         setAño]         = useState('');
  const [selModelo,   setSelModelo]   = useState('');
  const [selCategoria,setSelCategoria]= useState('');

  const [results,     setResults]     = useState<Producto[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [searched,    setSearched]    = useState(false);
  const [label,       setLabel]       = useState('');

  useEffect(() => {
    inventoryService.listMotoBrands({ is_active: true })
      .then(r => setMarcas(r.data))
      .catch(() => {});
    inventoryService.listCategories({ is_active: true })
      .then(r => setCategorias(r.data.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSelModelo(''); setModelos([]); setResults([]); setSearched(false);
    if (!selMarca) return;
    inventoryService.listMotoModels({ marca: Number(selMarca), page_size: 300 })
      .then(r => setModelos(r.data.models ?? []))
      .catch(() => {});
  }, [selMarca]);

  const modelosFiltrados = modelos.filter(m => {
    if (!año) return true;
    const y = parseInt(año, 10);
    if (isNaN(y)) return true;
    return m.año_desde <= y && (m.año_hasta === null || m.año_hasta >= y);
  });

  useEffect(() => {
    if (selModelo && !modelosFiltrados.find(m => String(m.id) === selModelo)) {
      setSelModelo('');
    }
  }, [año, selModelo, modelosFiltrados]);

  const handleSearch = async () => {
    if (!selModelo && !selCategoria) return;
    setSearching(true); setSearched(true);
    try {
      const params: import('../../types/inventory.types').ProductoListParams = {
        sede_id: sedeId, is_active: true, page_size: 60,
        ...(selModelo    ? { moto_modelo_id: Number(selModelo) }    : {}),
        ...(selCategoria ? { categoria:      Number(selCategoria) } : {}),
      };
      const res = await inventoryService.listProducts(params);
      setResults(res.data.products);

      const m = modelos.find(x => String(x.id) === selModelo);
      const c = categorias.find(x => String(x.id) === selCategoria);
      const parts: string[] = [];
      if (m) parts.push(`${m.marca_name} ${m.modelo}${año ? ` ${año}` : ''}`);
      if (c) parts.push(c.name);
      setLabel(parts.join(' · '));
    } catch { setResults([]); }
    finally  { setSearching(false); }
  };

  const handleClear = () => {
    setSelMarca(''); setAño(''); setSelModelo(''); setSelCategoria('');
    setResults([]); setSearched(false); setLabel('');
  };

  const canSearch = !!selModelo || !!selCategoria;

  return (
    <>
      <div className="pos-moto-filter-card">
        <div className="pos-moto-grid-2">
          <div className="pos-moto-field">
            <label className="pos-moto-label" htmlFor="pos-moto-marca">Marca de moto</label>
            <select
              id="pos-moto-marca"
              className="pos-moto-select"
              value={selMarca}
              onChange={e => setSelMarca(e.target.value)}
            >
              <option value="">Marca de moto…</option>
              {marcas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="pos-moto-field">
            <label className="pos-moto-label" htmlFor="pos-moto-anio">Año</label>
            <input
              id="pos-moto-anio"
              className="pos-moto-select pos-moto-input-year"
              type="number"
              placeholder="Año"
              value={año}
              onChange={e => setAño(e.target.value)}
              min={1990}
              max={2099}
              step={1}
            />
          </div>
        </div>
        <div className="pos-moto-grid-2">
          <div className="pos-moto-field">
            <label className="pos-moto-label" htmlFor="pos-moto-modelo">Modelo</label>
            <select
              id="pos-moto-modelo"
              className="pos-moto-select"
              value={selModelo}
              onChange={e => setSelModelo(e.target.value)}
              disabled={!selMarca}
            >
              <option value="">
                {!selMarca
                  ? 'Primero elige la marca'
                  : modelosFiltrados.length === 0
                    ? año ? `Sin modelos para año ${año}` : 'Sin modelos'
                    : 'Modelo de moto…'}
              </option>
              {modelosFiltrados.map(m => (
                <option key={m.id} value={m.id}>
                  {m.modelo} ({m.año_desde}–{m.año_hasta ?? 'act.'})
                </option>
              ))}
            </select>
          </div>
          <div className="pos-moto-field">
            <label className="pos-moto-label" htmlFor="pos-moto-cat">Categoría</label>
            <select
              id="pos-moto-cat"
              className="pos-moto-select"
              value={selCategoria}
              onChange={e => setSelCategoria(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="pos-moto-actions">
          <button
            type="button"
            className="pos-moto-btn-primary"
            onClick={handleSearch}
            disabled={!canSearch || searching}
          >
            <span className="material-symbols-outlined">search</span>
            {searching ? 'Buscando…' : 'Buscar piezas'}
          </button>
          <button
            type="button"
            className="pos-moto-btn-secondary"
            onClick={handleClear}
            disabled={!selMarca && !selModelo && !año && !selCategoria && results.length === 0}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {!canSearch && !searched && (
        <div className="pos-moto-empty-hint">
          <span className="material-symbols-outlined pos-moto-empty-icon">two_wheeler</span>
          <p>
            Selecciona la <strong>marca y modelo</strong> de la moto,
            o una <strong>categoría</strong> para ver las piezas disponibles.
            El año es opcional para afinar la búsqueda.
          </p>
        </div>
      )}

      {searched && !searching && (
        <p className="pos-moto-results-summary">
          {results.length === 0
            ? 'Sin piezas disponibles para esa combinación.'
            : (
              <>
                <span className="pos-moto-results-count">{results.length}</span>
                {' '}
                pieza{results.length !== 1 ? 's' : ''} encontrada{results.length !== 1 ? 's' : ''}
                {label ? ` — ${label}` : ''}
              </>
            )}
        </p>
      )}

      <ProductGrid
        results={results} searching={searching} sedeId={sedeId} cart={cart} onAdd={onAdd}
        emptyMsg=""
      />
    </>
  );
};

// ── Main POSView ──────────────────────────────────────────────────────────────

type SearchMode = 'text' | 'moto';

const POSView: React.FC<Props> = ({ sedeId }) => {
  const [searchMode, setSearchMode] = useState<SearchMode>('text');

  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (producto: Producto) => {
    const stockEntry = producto.stock_items?.find(s => s.sede_id === sedeId);
    const disponible = stockEntry?.quantity ?? 0;
    if (disponible <= 0) return;

    setCart(prev => {
      const existing = prev.find(i => i.producto_id === producto.id);
      if (existing) {
        if (existing.quantity >= disponible) return prev;
        return prev.map(i =>
          i.producto_id === producto.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price }
            : i
        );
      }
      const unit_price = parseFloat(String(producto.price));
      return [...prev, {
        producto_id:      producto.id,
        producto_sku:     producto.sku,
        producto_name:    producto.name,
        unit_price,
        quantity:         1,
        subtotal:         unit_price,
        stock_disponible: disponible,
      }];
    });
  };

  const changeQty = (producto_id: number, delta: number) => {
    setCart(prev => prev
      .map(i => {
        if (i.producto_id !== producto_id) return i;
        const newQty = i.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > i.stock_disponible) return i;
        return { ...i, quantity: newQty, subtotal: newQty * i.unit_price };
      })
      .filter((i): i is CartItem => i !== null)
    );
  };

  const removeItem    = (id: number) => setCart(prev => prev.filter(i => i.producto_id !== id));
  const clearCart     = ()           => setCart([]);

  const [descuentoInput, setDescuentoInput] = useState(0);
  const [descuentoTipo,  setDescuentoTipo]  = useState<'MXN' | 'PCT'>('MXN');
  const [metodoPago,     setMetodoPago]     = useState<MetodoPago>('EFECTIVO');
  const [montoPagado,    setMontoPagado]    = useState(0);

  const subtotal  = cart.reduce((s, i) => s + i.subtotal, 0);
  const descuento = descuentoTipo === 'PCT'
    ? Math.min(subtotal, subtotal * descuentoInput / 100)
    : Math.min(subtotal, descuentoInput);
  const total    = Math.max(0, subtotal - descuento);
  const cambio   = metodoPago === 'EFECTIVO' ? Math.max(0, montoPagado - total) : 0;

  useEffect(() => {
    if (cart.length === 0) { setDescuentoInput(0); setMontoPagado(0); }
  }, [cart.length]);

  const [showModal, setShowModal] = useState(false);
  const canCobrar = cart.length > 0 && (metodoPago !== 'EFECTIVO' || montoPagado >= total);

  const productCacheRef  = useRef<Map<string, Producto>>(new Map());
  const [cacheReady, setCacheReady] = useState(false);
  const cacheIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildCache = useCallback(async () => {
    try {
      const res = await inventoryService.listProducts({
        sede_id: sedeId, is_active: true, page_size: 500,
      });
      const map = new Map<string, Producto>();
      for (const p of res.data.products) {
        if (p.codigo_barras) map.set(p.codigo_barras, p);
        map.set(p.sku, p);
      }
      productCacheRef.current = map;
      setCacheReady(true);
    } catch {
      // falla silenciosamente
    }
  }, [sedeId]);

  useEffect(() => {
    buildCache();
    cacheIntervalRef.current = setInterval(buildCache, 5 * 60 * 1000);
    return () => { if (cacheIntervalRef.current) clearInterval(cacheIntervalRef.current); };
  }, [buildCache]);

  const [scanResetKey, setScanResetKey] = useState(0);
  const [scanFlash, setScanFlash] = useState<{ msg: string; type: 'ok' | 'err' | 'warn' } | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showScanFlash = useCallback((msg: string, type: 'ok' | 'err' | 'warn', ms = 2500) => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setScanFlash({ msg, type });
    scanTimerRef.current = setTimeout(() => setScanFlash(null), ms);
  }, []);

  const handleScan = useCallback(async (code: string) => {
    setScanResetKey(k => k + 1);

    const cached = productCacheRef.current.get(code);
    if (cached) {
      const stockEntry = cached.stock_items?.find(s => s.sede_id === sedeId);
      if ((stockEntry?.quantity ?? 0) <= 0) {
        showScanFlash(`Sin stock: ${cached.name}`, 'warn');
        return;
      }
      addToCart(cached);
      showScanFlash(`✓ ${cached.name}`, 'ok');
      return;
    }

    try {
      const res = await inventoryService.listProducts({ barcode: code, sede_id: sedeId, is_active: true });
      const products = res.data.products;
      if (products.length === 0) {
        showScanFlash(`Código no encontrado: ${code}`, 'err');
        return;
      }
      const producto = products[0];
      const stockEntry = producto.stock_items?.find(s => s.sede_id === sedeId);
      if ((stockEntry?.quantity ?? 0) <= 0) {
        showScanFlash(`Sin stock: ${producto.name}`, 'warn');
        return;
      }
      if (producto.codigo_barras) productCacheRef.current.set(producto.codigo_barras, producto);
      productCacheRef.current.set(producto.sku, producto);
      addToCart(producto);
      showScanFlash(`✓ ${producto.name}`, 'ok');
    } catch {
      showScanFlash('Error al buscar el código', 'err');
    }
  }, [sedeId, showScanFlash]); // eslint-disable-line react-hooks/exhaustive-deps

  useBarcodeScanner({ onScan: handleScan, enabled: searchMode === 'moto' });

  const paymentIcon: Record<MetodoPago, string> = {
    EFECTIVO: 'payments',
    TARJETA: 'credit_card',
    TRANSFERENCIA: 'account_balance',
  };

  return (
    <div className="pos-workspace">
      <header className="pos-workspace-header">
        <div className="pos-workspace-title-block">
          <h1 className="pos-workspace-title">MotoQFox POS</h1>
          <p className="pos-workspace-sub">Venta en tienda</p>
        </div>
        <div className="pos-workspace-actions">
          <div
            className={`pos-scanner-pill${cacheReady ? ' pos-scanner-pill--ready' : ''}`}
            title={cacheReady ? 'Escáner listo — productos en caché' : 'Cargando catálogo…'}
          >
            <span className="material-symbols-outlined">barcode_scanner</span>
            {cacheReady ? 'Escáner listo' : 'Cargando…'}
          </div>
          <button type="button" className="pos-header-icon-btn" title="Ayuda" aria-label="Ayuda">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
      </header>

      <div className="pos-layout">
        <div className="pos-search-panel">
          <div className="pos-mode-toolbar">
            <div className="pos-mode-tabs">
              <button
                type="button"
                className={`pos-mode-tab${searchMode === 'text' ? ' pos-mode-tab--active' : ''}`}
                onClick={() => setSearchMode('text')}
              >
                <span className="material-symbols-outlined">search</span>
                Búsqueda rápida
              </button>
              <button
                type="button"
                className={`pos-mode-tab${searchMode === 'moto' ? ' pos-mode-tab--active' : ''}`}
                onClick={() => setSearchMode('moto')}
              >
                <span className="material-symbols-outlined">two_wheeler</span>
                Buscar por moto
              </button>
            </div>
          </div>

          {searchMode === 'text' && (
            <TextSearchMode
              key={scanResetKey}
              sedeId={sedeId}
              cart={cart}
              onAdd={addToCart}
              onBarcodeScan={handleScan}
            />
          )}
          {searchMode === 'moto' && <MotoSearchMode sedeId={sedeId} cart={cart} onAdd={addToCart} />}

          <div className="pos-pedido-section">
            <PedidoBodegaPanel sedeId={sedeId} onAgregarAlCarrito={() => {}} />
          </div>
        </div>

        <div className="pos-cart-panel">
          <div className="pos-cart-shell">
            <div className="pos-cart-header">
              <div>
                <h2 className="pos-cart-title">Carrito</h2>
                {cart.length > 0 && (
                  <p className="pos-cart-sub">
                    {cart.length} ítem{cart.length !== 1 ? 's' : ''} en el pedido
                  </p>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  className="pos-cart-clear"
                  onClick={clearCart}
                  title="Vaciar carrito"
                  aria-label="Vaciar carrito"
                >
                  <span className="material-symbols-outlined">delete_sweep</span>
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="pos-cart-empty">
                <div className="pos-cart-empty-icon-wrap">
                  <span className="material-symbols-outlined pos-cart-empty-cart">shopping_cart</span>
                  <span className="material-symbols-outlined pos-cart-empty-x">close</span>
                </div>
                <h3 className="pos-cart-empty-title">El carrito está vacío</h3>
                <p className="pos-cart-empty-text">
                  Busca productos en el panel izquierdo para agregar al pedido del cliente.
                </p>
              </div>
            ) : (
              <>
                <div className="pos-cart-items">
                  {cart.map(item => (
                    <div key={item.producto_id} className="pos-cart-line">
                      <div className="pos-cart-thumb" aria-hidden>
                        <span className="material-symbols-outlined">inventory_2</span>
                      </div>
                      <div className="pos-cart-line-main">
                        <h4 className="pos-cart-line-name">{item.producto_name}</h4>
                        <p className="pos-cart-line-unit">{fmt(item.unit_price)} c/u</p>
                        <div className="pos-qty-ctrl">
                          <button type="button" className="pos-qty-btn" onClick={() => changeQty(item.producto_id, -1)}>
                            <span className="material-symbols-outlined">remove</span>
                          </button>
                          <span className="pos-qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="pos-qty-btn"
                            onClick={() => changeQty(item.producto_id, +1)}
                            disabled={item.quantity >= item.stock_disponible}
                            title={item.quantity >= item.stock_disponible ? 'Stock máximo alcanzado' : 'Aumentar cantidad'}
                            aria-label={item.quantity >= item.stock_disponible ? 'Stock máximo alcanzado' : 'Aumentar cantidad'}
                          >
                            <span className="material-symbols-outlined">add</span>
                          </button>
                        </div>
                      </div>
                      <div className="pos-cart-line-end">
                        <span className="pos-cart-line-sub">{fmt(item.subtotal)}</span>
                        <button
                          type="button"
                          className="pos-cart-line-remove"
                          onClick={() => removeItem(item.producto_id)}
                          title="Quitar"
                          aria-label="Quitar"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pos-cart-footer">
                  <div className="pos-discount-row">
                    <label htmlFor="descuento">
                      Descuento {descuentoTipo === 'MXN' ? '$' : '%'}
                    </label>
                    <div className="pos-discount-input-wrap">
                      <input
                        id="descuento"
                        className="pos-discount-input"
                        type="number"
                        min={0}
                        max={descuentoTipo === 'PCT' ? 100 : subtotal}
                        step={descuentoTipo === 'PCT' ? 0.1 : 0.01}
                        value={descuentoInput || ''}
                        onChange={e => setDescuentoInput(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                      />
                      <button
                        type="button"
                        className="pos-discount-toggle"
                        onClick={() => { setDescuentoTipo(t => t === 'MXN' ? 'PCT' : 'MXN'); setDescuentoInput(0); }}
                        title={descuentoTipo === 'MXN' ? 'Cambiar a porcentaje' : 'Cambiar a pesos'}
                      >
                        {descuentoTipo === 'MXN' ? '$' : '%'}
                      </button>
                    </div>
                  </div>
                  <div className="pos-totals">
                    <div className="pos-totals-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                    {descuento > 0 && (
                      <div className="pos-totals-row"><span>Descuento</span><span>−{fmt(descuento)}</span></div>
                    )}
                    <div className="pos-totals-row pos-totals-row--total"><span>Total</span><span>{fmt(total)}</span></div>
                  </div>
                  <p className="pos-payment-label">Método de pago</p>
                  <div className="pos-payment-btns">
                    {(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'] as MetodoPago[]).map(m => (
                      <button
                        key={m}
                        type="button"
                        className={`pos-payment-btn${metodoPago === m ? ' pos-payment-btn--active' : ''}`}
                        onClick={() => setMetodoPago(m)}
                      >
                        <span className="material-symbols-outlined">{paymentIcon[m]}</span>
                        {m === 'TRANSFERENCIA' ? 'TRANSF.' : m}
                      </button>
                    ))}
                  </div>
                  {metodoPago === 'EFECTIVO' && (
                    <>
                      <div className="pos-efectivo-box">
                        <div>
                          <p className="pos-efectivo-label">Monto recibido</p>
                          <div className="pos-efectivo-input-row">
                            <span className="pos-efectivo-dollar">$</span>
                            <input
                              id="monto_pagado"
                              className="pos-efectivo-input"
                              type="number"
                              min={total}
                              step={0.01}
                              value={montoPagado || ''}
                              onChange={e => setMontoPagado(parseFloat(e.target.value) || 0)}
                              placeholder={fmt(total)}
                            />
                          </div>
                        </div>
                        {montoPagado > 0 && (
                          <div className="pos-cambio-block">
                            <p className="pos-efectivo-label">Cambio</p>
                            <p className="pos-cambio-value">{fmt(cambio)}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    className="pos-cobrar-btn"
                    disabled={!canCobrar}
                    onClick={() => setShowModal(true)}
                  >
                    Cobrar {fmt(total)}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <PaymentModal
          sedeId={sedeId} items={cart} descuento={descuento}
          metodoPago={metodoPago} montoPagado={montoPagado}
          onClose={() => setShowModal(false)}
          onSuccess={() => { clearCart(); setDescuentoInput(0); setMontoPagado(0); setShowModal(false); }}
        />
      )}

      {scanFlash && (
        <div
          className={`pos-scan-toast pos-scan-toast--${scanFlash.type}`}
          role="status"
        >
          <span className="material-symbols-outlined pos-scan-toast-icon">
            {scanFlash.type === 'ok' ? 'check_circle' : scanFlash.type === 'warn' ? 'warning' : 'error'}
          </span>
          <span className="pos-scan-toast-msg">{scanFlash.msg}</span>
        </div>
      )}
    </div>
  );
};

export default POSView;
