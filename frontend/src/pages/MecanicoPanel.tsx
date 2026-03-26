import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tallerService } from '../api/taller.service';
import { inventoryService } from '../api/inventory.service';
import type { ServicioMotoList, SolicitudCreatePayload } from '../types/taller.types';
import type { Producto } from '../types/inventory.types';
import ServicioDetalleModal from '../components/taller/ServicioDetalleModal';

const POLL_INTERVAL = 12_000;

// ─── Estilos por estatus ──────────────────────────────────────────────────────

interface StatusStyle {
  color: string;
  gradFrom: string;
  gradTo: string;
  dotColor: string;
  label: string;
  emoji: string;
}

const STATUS_STYLE: Record<string, StatusStyle> = {
  RECIBIDO:            { color: '#c05621', gradFrom: '#fffbeb', gradTo: '#fff7ed', dotColor: '#f6ad55', label: 'Recibido',            emoji: '📥' },
  EN_DIAGNOSTICO:      { color: '#6b46c1', gradFrom: '#faf5ff', gradTo: '#f3e8ff', dotColor: '#9f7aea', label: 'En diagnóstico',      emoji: '🔍' },
  EN_PROCESO:          { color: '#2b6cb0', gradFrom: '#ebf8ff', gradTo: '#e8f4ff', dotColor: '#63b3ed', label: 'En proceso',          emoji: '⚙️' },
  COTIZACION_EXTRA:    { color: '#b7791f', gradFrom: '#fffbeb', gradTo: '#fef3c7', dotColor: '#f6e05e', label: 'Cotización extra',    emoji: '💬' },
  LISTA_PARA_ENTREGAR: { color: '#2c7a7b', gradFrom: '#e6fffa', gradTo: '#ccfbf1', dotColor: '#38b2ac', label: 'Lista para entregar', emoji: '🏷️' },
  LISTO:               { color: '#2c7a7b', gradFrom: '#e6fffa', gradTo: '#ccfbf1', dotColor: '#38b2ac', label: 'Lista para entregar', emoji: '🏷️' },
  ENTREGADO:           { color: '#553c9a', gradFrom: '#f3e8ff', gradTo: '#ede9fe', dotColor: '#805ad5', label: 'Entregado',           emoji: '🏁' },
  CANCELADO:           { color: '#c53030', gradFrom: '#fff5f5', gradTo: '#fed7d7', dotColor: '#fc8181', label: 'Cancelada',           emoji: '🚫' },
};

// ─── Modal para solicitar refacción extra ─────────────────────────────────────

interface SolicitudModalProps {
  servicioId: number;
  sedeId: number;
  onClose: () => void;
  onSent: () => void;
}

const SolicitudModal: React.FC<SolicitudModalProps> = ({ servicioId, sedeId, onClose, onSent }) => {
  const [busqueda,           setBusqueda]           = useState('');
  const [resultados,         setResultados]         = useState<Producto[]>([]);
  const [buscando,           setBuscando]           = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidad,           setCantidad]           = useState('1');
  const [motivo,             setMotivo]             = useState('');
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Búsqueda con debounce
  const handleBusqueda = (valor: string) => {
    setBusqueda(valor);
    setProductoSeleccionado(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!valor.trim()) { setResultados([]); return; }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await inventoryService.listProducts({ search: valor, sede_id: sedeId, page_size: 8 });
        setResultados(res.data?.products ?? []);
      } catch { setResultados([]); }
      finally { setBuscando(false); }
    }, 300);
  };

  const seleccionar = (p: Producto) => {
    setProductoSeleccionado(p);
    setBusqueda(p.name);
    setResultados([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado || !motivo.trim()) {
      setError('Selecciona un producto y escribe el motivo.');
      return;
    }
    const payload: SolicitudCreatePayload = {
      servicio: servicioId,
      producto: productoSeleccionado.id,
      cantidad: Number(cantidad),
      motivo:   motivo.trim(),
    };
    setLoading(true);
    try {
      await tallerService.createSolicitud(payload);
      onSent();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, color: '#2d3748', background: '#fff',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#718096',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5,
  };
  const canSubmit = !!productoSeleccionado && !!motivo.trim() && !loading;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 600, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #2b6cb0, #1a4a8a)',
          padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔧</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Solicitar refacción extra</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 }}>Servicio #{servicioId}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            color: '#fff', width: 30, height: 30, cursor: 'pointer',
            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px' }}>

          {/* Buscador de producto */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Producto *</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{
                  ...inputStyle,
                  paddingRight: 36,
                  borderColor: productoSeleccionado ? '#68d391' : '#e2e8f0',
                  background: productoSeleccionado ? '#f0fff4' : '#fff',
                }}
                type="text"
                value={busqueda}
                onChange={e => handleBusqueda(e.target.value)}
                placeholder="Escribe el nombre de la refacción…"
                autoComplete="off"
              />
              {/* Ícono estado */}
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>
                {buscando ? '⏳' : productoSeleccionado ? '✅' : '🔍'}
              </span>

              {/* Dropdown resultados */}
              {resultados.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4, overflow: 'hidden',
                }}>
                  {resultados.map(p => {
                    const stock = p.total_stock ?? 0;
                    const hayStock = stock > 0;
                    return (
                      <div
                        key={p.id}
                        onClick={() => seleccionar(p)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between',
                          borderBottom: '1px solid #f7fafc',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#ebf8ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>SKU: {p.sku}</div>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                          background: hayStock ? '#f0fff4' : '#fff5f5',
                          color: hayStock ? '#276749' : '#c53030',
                          border: `1px solid ${hayStock ? '#9ae6b4' : '#fed7d7'}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {hayStock ? `${stock} en stock` : 'Sin stock'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chip del producto seleccionado */}
            {productoSeleccionado && (
              <div style={{
                marginTop: 8, padding: '8px 12px', background: '#f0fff4',
                border: '1px solid #9ae6b4', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: 12, color: '#276749' }}>
                  <strong>{productoSeleccionado.name}</strong>
                  <span style={{ marginLeft: 8, color: '#68d391' }}>
                    · Stock: {productoSeleccionado.total_stock ?? 0}
                  </span>
                </div>
                <button type="button" onClick={() => { setProductoSeleccionado(null); setBusqueda(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c53030', fontSize: 14 }}>✕</button>
              </div>
            )}
          </div>

          {/* Cantidad */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Cantidad *</label>
            <input
              style={{ ...inputStyle, maxWidth: 120 }}
              type="number" min="1" value={cantidad}
              onChange={e => setCantidad(e.target.value)} required
            />
          </div>

          {/* Motivo */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Motivo / descripción *</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }}
              value={motivo} onChange={e => setMotivo(e.target.value)}
              rows={3} placeholder="¿Por qué necesitas esta refacción?" required
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8,
              padding: '10px 14px', fontSize: 13, color: '#c53030', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>⚠️ {error}</div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} disabled={loading} style={{
              padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0',
              background: '#f7fafc', color: '#4a5568', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>Cancelar</button>
            <button type="submit" disabled={!canSubmit} style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: canSubmit ? 'linear-gradient(135deg, #3182ce, #2b6cb0)' : '#a0aec0',
              color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {loading ? '⏳ Enviando…' : '📤 Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Icono de moto ────────────────────────────────────────────────────────────

const BikeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M8 17.5h7" />
    <path d="M8 17.5L12 8l3 4 2-4" />
    <path d="M12 8h4" />
    <path d="M19 8l-1 9.5" />
  </svg>
);

// ─── MecanicoPanel ────────────────────────────────────────────────────────────

const MecanicoPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [servicios,   setServicios]   = useState<ServicioMotoList[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [detalleId,   setDetalleId]   = useState<number | null>(null);
  const [solicitudId, setSolicitudId] = useState<number | null>(null);
  const [hoveredId,   setHoveredId]   = useState<number | null>(null);

  const sedeId   = user?.sede?.id ?? 0;
  const initials =
    (user?.first_name?.charAt(0) ?? '') +
    (user?.last_name?.charAt(0)  ?? '');

  const cargar = useCallback(async () => {
    if (!sedeId) return;
    try {
      const data = await tallerService.listServicios({ sede_id: sedeId, include_entregado: true });
      setServicios(data);
    } catch { /* polling silencioso */ }
    finally { setLoading(false); }
  }, [sedeId]);

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, POLL_INTERVAL);
    return () => clearInterval(iv);
  }, [cargar]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleIniciarReparacion = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await tallerService.iniciarReparacion(id); cargar(); } catch { /* silencioso */ }
  };

  const handleSubmitDiagnostico = async (id: number) => {
    try { await tallerService.submitDiagnostico(id); cargar(); } catch { /* silencioso */ }
  };

  const handleListaParaEntregar = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await tallerService.marcarListaParaEntregar(id); cargar(); } catch { /* silencioso */ }
  };

  // ─── Barra de resumen numérico ─────────────────────────────────────────────
  const contadores: Record<string, number> = {};
  for (const srv of servicios) {
    contadores[srv.status] = (contadores[srv.status] ?? 0) + 1;
  }

  // Consolidar LISTA_PARA_ENTREGAR y LISTO en un solo ítem
  const resumenVisible: Array<{ emoji: string; label: string; color: string; count: number }> = [];
  const listaCount = (contadores['LISTA_PARA_ENTREGAR'] ?? 0) + (contadores['LISTO'] ?? 0);
  if ((contadores['EN_PROCESO'] ?? 0) > 0)
    resumenVisible.push({ emoji: '⚙️', label: 'En proceso', color: '#2b6cb0', count: contadores['EN_PROCESO'] });
  if ((contadores['EN_DIAGNOSTICO'] ?? 0) > 0)
    resumenVisible.push({ emoji: '🔍', label: 'En diagnóstico', color: '#6b46c1', count: contadores['EN_DIAGNOSTICO'] });
  if (listaCount > 0)
    resumenVisible.push({ emoji: '🏷️', label: 'Listas para entregar', color: '#2c7a7b', count: listaCount });
  if ((contadores['ENTREGADO'] ?? 0) > 0)
    resumenVisible.push({ emoji: '🏁', label: 'Entregadas', color: '#553c9a', count: contadores['ENTREGADO'] });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f0f4f8' }}>

      {/* Header */}
      <header style={{
        background: '#1a202c', color: '#fff',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-primary)' }}>MotoQFox</span>
          <span style={{ color: '#a0aec0', fontSize: 13 }}>Mis Servicios</span>
          {user?.sede && (
            <span style={{
              background: '#2d3748', borderRadius: 12, padding: '2px 10px',
              fontSize: 12, color: '#e2e8f0',
            }}>
              📍 {user.sede.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#a0aec0' }}>
            <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{user?.full_name}</div>
            <div>Mecánico</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#3182ce', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14,
          }}>
            {initials}
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent', border: '1px solid #4a5568',
              borderRadius: 8, color: '#a0aec0', cursor: 'pointer',
              padding: '6px 12px', fontSize: 12,
            }}
          >
            Salir
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>

        {/* Barra de resumen numérico */}
        {!loading && servicios.length > 0 && resumenVisible.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            padding: '10px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0,
          }}>
            {resumenVisible.map((item, idx) => (
              <React.Fragment key={item.label + idx}>
                {idx > 0 && (
                  <span style={{
                    display: 'inline-block',
                    width: 1,
                    height: 20,
                    background: '#e2e8f0',
                    margin: '0 16px',
                    flexShrink: 0,
                  }} />
                )}
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontSize: 14 }}>{item.emoji}</span>
                  <span style={{ fontSize: 18, fontWeight: 800 }}>{item.count}</span>
                  <span style={{ color: '#718096', fontWeight: 500, fontSize: 12 }}>{item.label}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: '#718096' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>
            Cargando servicios asignados…
          </div>
        ) : servicios.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔧</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#4a5568', margin: '0 0 6px' }}>Sin servicios asignados</p>
            <p style={{ color: '#a0aec0', fontSize: 14, margin: 0 }}>
              Cuando el jefe de mecánicos te asigne un servicio, aparecerá aquí.
            </p>
          </div>
        ) : (() => {
          // Orden de grupos: activos primero, finalizados al último
          const GRUPO_ORDER = [
            'EN_DIAGNOSTICO',
            'EN_PROCESO',
            'COTIZACION_EXTRA',
            'RECIBIDO',
            'LISTA_PARA_ENTREGAR',
            'LISTO',
            'ENTREGADO',
            'CANCELADO',
          ];

          // Agrupar servicios por status
          const grupos: Record<string, ServicioMotoList[]> = {};
          for (const srv of servicios) {
            if (!grupos[srv.status]) grupos[srv.status] = [];
            grupos[srv.status].push(srv);
          }

          // Fusionar LISTA_PARA_ENTREGAR y LISTO en un solo grupo visual
          const listaGroup = [
            ...(grupos['LISTA_PARA_ENTREGAR'] ?? []),
            ...(grupos['LISTO'] ?? []),
          ];
          if (listaGroup.length > 0) {
            grupos['LISTA_PARA_ENTREGAR'] = listaGroup;
            delete grupos['LISTO'];
          }

          const gruposVisibles = GRUPO_ORDER.filter(
            s => (grupos[s] ?? []).length > 0
          );

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {gruposVisibles.map(statusKey => {
                const st = STATUS_STYLE[statusKey] ?? STATUS_STYLE['RECIBIDO'];
                const items = grupos[statusKey];
                return (
                  <div key={statusKey}>
                    {/* Encabezado de grupo */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      marginBottom: 14,
                      paddingBottom: 10,
                      borderBottom: `2px solid ${st.dotColor}55`,
                    }}>
                      <span style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: `linear-gradient(135deg, ${st.gradFrom}, ${st.gradTo})`,
                        border: `1px solid ${st.dotColor}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, flexShrink: 0,
                      }}>{st.emoji}</span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: st.color }}>
                        {st.label}
                      </span>
                      <span style={{
                        background: `${st.dotColor}22`,
                        color: st.color,
                        border: `1px solid ${st.dotColor}55`,
                        borderRadius: 20,
                        padding: '1px 9px',
                        fontSize: 12, fontWeight: 700,
                      }}>{items.length}</span>
                    </div>

                    {/* Grid de tarjetas del grupo */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: 16,
                    }}>
                      {items.map(srv => {
              const st = STATUS_STYLE[srv.status] ?? STATUS_STYLE['RECIBIDO'];
              const isHovered = hoveredId === srv.id;
              return (
                <div
                  key={srv.id}
                  onClick={() => setDetalleId(srv.id)}
                  onMouseEnter={() => setHoveredId(srv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    borderRadius: 16, background: '#fff',
                    cursor: 'pointer',
                    boxShadow: isHovered ? '0 8px 28px rgba(0,0,0,.13)' : '0 2px 8px rgba(0,0,0,.07)',
                    transition: 'box-shadow 300ms ease, transform 200ms ease',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    border: '1px solid #edf2f7',
                    overflow: 'hidden',
                  }}
                >
                  {/* ── CABECERA con gradiente ── */}
                  <div style={{
                    background: `linear-gradient(135deg, ${st.gradFrom}, ${st.gradTo})`,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${st.dotColor}33`,
                    position: 'relative',
                    minHeight: 64,
                  }}>
                    {/* Ícono de moto */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${st.dotColor}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'transform 300ms ease',
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                    }}>
                      <BikeIcon size={28} color={st.color} />
                    </div>

                    {/* Folio + badge extra */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: st.color,
                        background: `${st.dotColor}22`,
                        padding: '2px 8px', borderRadius: 8,
                        letterSpacing: '0.04em',
                      }}>
                        {srv.folio}
                      </span>
                      {srv.tiene_extra_pendiente && (
                        <span style={{
                          background: '#fbd38d', color: '#744210',
                          borderRadius: 8, padding: '2px 7px',
                          fontSize: 10, fontWeight: 700,
                        }}>
                          ⚠ Extra pendiente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── CUERPO ── */}
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <h3 style={{
                      fontSize: 15, fontWeight: 700, color: '#1a202c', margin: 0,
                      lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {srv.moto_display || 'Sin moto'}
                    </h3>

                    {srv.descripcion_problema ? (
                      <p style={{
                        fontSize: 12, color: '#718096', margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.5,
                      }}>
                        {srv.descripcion_problema}
                      </p>
                    ) : (
                      <p style={{ fontSize: 12, color: '#cbd5e0', margin: 0, fontStyle: 'italic' }}>
                        Sin descripción
                      </p>
                    )}

                    {(srv as any).cliente_display && (
                      <p style={{ fontSize: 11, color: '#a0aec0', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>👤</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(srv as any).cliente_display}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* ── PIE ── */}
                  <div style={{
                    padding: '10px 16px 14px',
                    borderTop: '1px solid #f0f4f8',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    {/* Fila: badge de estado + botón principal */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      {/* Badge de estado */}
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: st.color,
                        background: `${st.dotColor}1a`,
                        border: `1px solid ${st.dotColor}55`,
                        borderRadius: 20,
                        padding: '3px 10px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        {st.emoji} {st.label}
                      </span>

                      {/* Acción principal según estado */}
                      {srv.status === 'RECIBIDO' && (
                        <span style={{ fontSize: 11, color: '#a0aec0', fontStyle: 'italic' }}>
                          Esperando asignación
                        </span>
                      )}

                      {srv.status === 'EN_DIAGNOSTICO' && (
                        srv.diagnostico_listo
                          ? (
                            <div style={{
                              padding: '7px 12px', borderRadius: 8,
                              background: '#fffbeb', border: '1px solid #f6ad55',
                              color: '#c05621', fontSize: 11, fontWeight: 600,
                              display: 'flex', alignItems: 'center', gap: 5,
                            }}>
                              ⏳ Esperando autorización de recepción
                            </div>
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); handleSubmitDiagnostico(srv.id); }}
                              style={{
                                padding: '8px 14px', border: 'none', borderRadius: 8, cursor: 'pointer',
                                background: 'linear-gradient(135deg, #3182ce, #2b6cb0)',
                                color: '#fff', fontWeight: 700, fontSize: 12,
                                display: 'flex', alignItems: 'center', gap: 6,
                              }}
                            >
                              📋 Enviar a recepción
                            </button>
                          )
                      )}

                      {srv.status === 'EN_PROCESO' && (
                        <button
                          style={{
                            background: 'linear-gradient(135deg, #38a169, #276749)',
                            color: '#fff',
                            border: 'none', borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 700, fontSize: 11,
                            padding: '6px 12px',
                            whiteSpace: 'nowrap',
                          }}
                          onClick={e => handleListaParaEntregar(srv.id, e)}
                        >
                          ✓ Lista para entregar
                        </button>
                      )}

                      {srv.status === 'COTIZACION_EXTRA' && (
                        <span style={{ fontSize: 11, color: '#b7791f', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          ⏳ Esperando autorización en caja
                        </span>
                      )}

                      {(srv.status === 'LISTA_PARA_ENTREGAR' || srv.status === 'LISTO') && (
                        <span style={{ fontSize: 11, color: '#2c7a7b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          🏷️ Esperando confirmación en caja
                        </span>
                      )}

                      {srv.status === 'ENTREGADO' && (
                        <span style={{ fontSize: 11, color: '#553c9a', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          🏁 Entregada al cliente
                        </span>
                      )}

                      {srv.status === 'CANCELADO' && (
                        <span style={{ fontSize: 11, color: '#c53030', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          🚫 Cancelada
                        </span>
                      )}
                    </div>

                    {/* Botón secundario "+ Refacción" en EN_DIAGNOSTICO y EN_PROCESO */}
                    {(srv.status === 'EN_DIAGNOSTICO' || srv.status === 'EN_PROCESO') && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          style={{
                            background: '#fff',
                            color: '#4a5568',
                            border: '1px solid #e2e8f0',
                            borderRadius: 7,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 11,
                            padding: '5px 11px',
                            display: 'flex', alignItems: 'center', gap: 4,
                            transition: 'border-color 150ms, background 150ms',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#f7fafc';
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#cbd5e0';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0';
                          }}
                          onClick={e => { e.stopPropagation(); setSolicitudId(srv.id); }}
                        >
                          🔧 + Refacción
                        </button>
                      </div>
                    )}

                  </div>
                </div>
                      );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </main>

      {/* Modales */}
      {detalleId !== null && (
        <ServicioDetalleModal
          servicioId={detalleId}
          onClose={() => setDetalleId(null)}
          onUpdated={cargar}
        />
      )}

      {solicitudId !== null && (
        <SolicitudModal
          servicioId={solicitudId}
          sedeId={sedeId}
          onClose={() => setSolicitudId(null)}
          onSent={cargar}
        />
      )}
    </div>
  );
};

export default MecanicoPanel;
