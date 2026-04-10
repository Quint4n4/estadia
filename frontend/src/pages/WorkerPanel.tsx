import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, LogOut, Wifi, WifiOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { pedidosService } from '../api/pedidos.service';
import { db } from '../db/localDB';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import type { PedidoBodega } from '../types/pedidos.types';
import '../styles/WorkerPanel.css';

const POLL_INTERVAL = 6000; // 6 segundos

const WorkerPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isOnline: networkOnline } = useNetworkStatus();

  const [pedidos,      setPedidos]      = useState<PedidoBodega[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [online,       setOnline]       = useState(true);
  const [lastUpdate,   setLastUpdate]   = useState<Date | null>(null);
  // UX-022: IDs completados localmente (pendiente confirmación o ya confirmados)
  const [completados,  setCompletados]  = useState<Set<number>>(new Set());
  const [completando,  setCompletando]  = useState<Set<number>>(new Set());

  const fetchPedidos = useCallback(async (isMounted: () => boolean) => {
    try {
      const data = await pedidosService.listar();
      if (!isMounted()) return;
      setPedidos(data);
      setOnline(true);
      setLastUpdate(new Date());
      // Guardar en cache para uso offline
      const ahora = new Date().toISOString();
      await db.pedidos.bulkPut(data.map(p => ({ ...p, cachedAt: ahora })));
    } catch {
      if (!isMounted()) return;
      setOnline(false);
      // Intentar cargar desde cache local
      const cached = await db.pedidos.orderBy('id').reverse().toArray();
      if (isMounted() && cached.length > 0) setPedidos(cached);
    } finally {
      if (isMounted()) setLoading(false);
    }
  }, []);

  // Carga inicial + polling
  useEffect(() => {
    let mounted = true;
    const isMounted = () => mounted;

    fetchPedidos(isMounted);
    const interval = setInterval(() => fetchPedidos(isMounted), POLL_INTERVAL);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchPedidos]);

  // Auto-sync pedidos completados offline cuando vuelve la red
  useEffect(() => {
    if (!networkOnline) return;
    db.syncQueue
      .where('status').equals('pending')
      .filter(i => (i.payload as any)?.tipo === 'marcar_pedido_completado')
      .toArray()
      .then(async pendientes => {
        for (const item of pendientes) {
          try {
            const p = item.payload as { tipo: string; pedidoId: number };
            await pedidosService.marcarEntregado(p.pedidoId);
            await db.syncQueue.delete(item.id!);
          } catch { /* reintento en siguiente reconexión */ }
        }
      });
  }, [networkOnline]);

  // UX-022: marcar pedido como completado via API, con fallback offline
  const marcarCompletado = useCallback(async (pedidoId: number) => {
    setCompletando(prev => new Set([...prev, pedidoId]));
    try {
      await pedidosService.marcarEntregado(pedidoId);
    } catch {
      // Sin red: encolar para sincronizar al reconectar
      await db.syncQueue.add({
        localId:   crypto.randomUUID(),
        payload:   { tipo: 'marcar_pedido_completado', pedidoId } as any,
        timestamp: Date.now(),
        intentos:  0,
        status:    'pending',
      });
    } finally {
      setCompletando(prev => { const s = new Set(prev); s.delete(pedidoId); return s; });
      setCompletados(prev => new Set([...prev, pedidoId]));
    }
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="worker-layout">

      {/* Header compacto */}
      <header className="worker-header">
        <div className="worker-header-left">
          <span className="worker-logo">MotoQFox</span>
          <span className="worker-sede">{user?.sede?.name ?? ''}</span>
          <span className={`worker-status ${online ? 'worker-status--on' : 'worker-status--off'}`}>
            {online ? <Wifi size={14} /> : <WifiOff size={14} />}
            {online
              ? lastUpdate ? `Act. ${fmt(lastUpdate.toISOString())}` : 'Conectado'
              : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--color-danger)' }}>Sin conexión</span>
                  <button
                    onClick={() => { let alive = true; fetchPedidos(() => alive); }}
                    aria-label="Intentar reconectar con el servidor"
                    style={{
                      padding: '4px 12px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-primary)', color: '#fff',
                      border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                    }}
                  >
                    Reconectar
                  </button>
                </span>
              )}
          </span>
        </div>

        <div className="worker-header-right">
          <span className="worker-username">{user?.full_name}</span>
          <button className="worker-logout-btn" onClick={handleLogout} title="Cerrar sesión" aria-label="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="worker-main">

        {loading ? (
          <div className="worker-empty">
            <div className="worker-spinner" />
            <p>Cargando pedidos…</p>
          </div>

        ) : pedidos.length === 0 ? (
          <div className="worker-empty">
            <Package size={72} strokeWidth={1} color="var(--worker-empty-color)" />
            <h2>Sin pedidos pendientes</h2>
            <p>Cuando la cajera envíe un pedido aparecerá aquí automáticamente.</p>
          </div>

        ) : (
          <>
            {/* ── Pedidos pendientes ── */}
            {pedidos.filter(p => !completados.has(p.id)).length === 0 ? (
              <div className="worker-empty">
                <CheckCircle size={72} strokeWidth={1} color="var(--worker-empty-color)" />
                <h2>¡Todo entregado!</h2>
                <p>No quedan pedidos pendientes por ahora.</p>
              </div>
            ) : (
              <div className="worker-grid">
                {pedidos
                  .filter(pedido => !completados.has(pedido.id))
                  .map(pedido => (
                    <div key={pedido.id} className="worker-card">

                      {/* Número de pedido + hora */}
                      <div className="worker-card-header">
                        <span className="worker-card-num">#{pedido.id}</span>
                        <span className="worker-card-time">{fmt(pedido.created_at)}</span>
                      </div>

                      {/* Cajero que lo pidió */}
                      <p className="worker-card-cajero">{pedido.cajero_name}</p>

                      {/* Notas */}
                      {pedido.notas && (
                        <p className="worker-card-notas">"{pedido.notas}"</p>
                      )}

                      {/* UX-021 — Items con scroll interno cuando hay 10+ items */}
                      <div
                        className="worker-card-items"
                        style={{
                          maxHeight: '280px',
                          overflowY: 'auto',
                          WebkitOverflowScrolling: 'touch',
                        }}
                      >
                        {pedido.items.map(item => (
                          <div key={item.id} className="worker-item">
                            <div className="worker-item-info">
                              <span className="worker-item-name">{item.producto_name}</span>
                              <span className="worker-item-sku">{item.producto_sku}</span>
                            </div>
                            <div className="worker-item-right">
                              {item.ubicacion && (
                                <span className="worker-item-ubicacion">
                                  <MapPin size={14} />
                                  {item.ubicacion}
                                </span>
                              )}
                              <span className="worker-item-qty">×{item.cantidad}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* UX-021 — Indicador de scroll cuando hay más de 5 items */}
                      {pedido.items.length > 5 && (
                        <p style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted, var(--worker-text-sec))',
                          textAlign: 'center',
                          padding: '0.5rem 0 0',
                          borderTop: '1px solid var(--color-border, var(--worker-border))',
                          margin: 0,
                        }}>
                          {pedido.items.length} items en total — desplázate para ver más
                        </p>
                      )}

                      {/* UX-022 — Botón Marcar completado */}
                      <button
                        onClick={() => marcarCompletado(pedido.id)}
                        disabled={completando.has(pedido.id)}
                        className="worker-btn-completar"
                        aria-label="Marcar este pedido como completado"
                      >
                        {completando.has(pedido.id) ? 'Entregando…' : '✓ Marcar completado'}
                      </button>

                    </div>
                  ))}
              </div>
            )}

            {/* UX-022 — Sección "Completados hoy" */}
            {completados.size > 0 && (
              <section className="worker-completados-section">
                <h3 className="worker-completados-title">
                  Completados hoy ({completados.size})
                </h3>
                <div className="worker-completados-list">
                  {pedidos
                    .filter(p => completados.has(p.id))
                    .map(p => (
                      <div key={p.id} className="worker-completado-item">
                        <CheckCircle size={16} color="var(--color-success, #48bb78)" />
                        <span className="worker-completado-num">#{p.id}</span>
                        <span className="worker-completado-cajero">{p.cajero_name}</span>
                        <span className="worker-completado-time">{fmt(p.created_at)}</span>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default WorkerPanel;
