import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { salesService } from '../api/sales.service';
import { tallerService } from '../api/taller.service';
import { inventoryService } from '../api/inventory.service';
import { catalogoServiciosService } from '../api/catalogo-servicios.service';
import { NetworkStatusBadge } from '../components/common/NetworkStatusBadge';
import { db } from '../db/localDB';
import POSView from '../components/cashier/POSView';
import SalesHistoryView from '../components/cashier/SalesHistoryView';
import CajaClosedScreen from '../components/cashier/CajaClosedScreen';
import ServiciosView from '../components/taller/ServiciosView';
import HistorialServiciosView from '../components/taller/HistorialServiciosView';
import '../styles/DashboardPage.css';

type Section    = 'pos' | 'history' | 'servicios' | 'historial_taller';
type CajaStatus = 'loading' | 'cerrada' | 'abierta';

const CashierPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [section,    setSection]    = useState<Section>('pos');
  const [cajaStatus, setCajaStatus] = useState<CajaStatus>('loading');
  const [aperturaId, setAperturaId] = useState<number | null>(null);

  const [showArchivarModal, setShowArchivarModal] = useState(false);
  const [archivando,        setArchivando]        = useState(false);
  const [archivarMsg,       setArchivarMsg]        = useState('');

  const sedeId   = user?.sede?.id ?? 0;
  const cajeroId = user?.id ?? 0;
  const initials =
    (user?.first_name?.charAt(0) ?? '') +
    (user?.last_name?.charAt(0)  ?? '');

  // Poblar caché de productos en IndexedDB al abrir la caja
  const poblarCacheProductos = useCallback(async () => {
    if (!sedeId) return;
    try {
      const res = await inventoryService.listProducts({ is_active: true, page_size: 500, sede_id: sedeId });
      const productos = res.data?.products ?? [];
      await db.productos.bulkPut(productos.map(p => ({
        id:            p.id,
        sku:           p.sku,
        name:          p.name,
        price:         p.price,
        categoria_name: p.categoria_name ?? null,
        isActive:      p.is_active,
        cachedAt:      new Date().toISOString(),
      })));
    } catch { /* usar caché existente si falla */ }
  }, [sedeId]);

  useEffect(() => {
    if (!sedeId) { setCajaStatus('cerrada'); return; }
    salesService.miEstadoCaja()
      .then(async r => {
        if (r.data.tiene_caja_abierta && r.data.apertura) {
          const ap = r.data.apertura;
          // Persistir en IndexedDB para uso offline
          await db.apertura_caja.put({
            id:            ap.id,
            sedeId:        ap.sede,
            cajeroId:      ap.cajero,
            fechaApertura: ap.fecha_apertura,
            status:        'ABIERTA',
            cachedAt:      new Date().toISOString(),
          });
          setAperturaId(ap.id);
          setCajaStatus('abierta');
          // Actualizar cache de productos y catálogo mientras hay red
          poblarCacheProductos();
          catalogoServiciosService.getServicios({ activo: true })
            .then((res: any) => {
              const servicios = res?.data?.servicios ?? [];
              try { localStorage.setItem('motoqfox_catalogo_servicios', JSON.stringify(servicios)); } catch {}
            })
            .catch(() => {});
        } else {
          // Servidor dice cerrada: limpiar cache
          await db.apertura_caja.where('sedeId').equals(sedeId).delete();
          setCajaStatus('cerrada');
        }
      })
      .catch(async () => {
        // Sin red: intentar restaurar desde IndexedDB
        const local = await db.apertura_caja
          .where('sedeId').equals(sedeId)
          .and(a => a.status === 'ABIERTA')
          .first();
        if (local) {
          setAperturaId(local.id);
          setCajaStatus('abierta');
        } else {
          setCajaStatus('cerrada');
        }
      });
  }, [sedeId, poblarCacheProductos]);

  const handleAbierta = async (id: number) => {
    setAperturaId(id);
    setCajaStatus('abierta');
    setSection('pos');
    poblarCacheProductos();
    // Persistir apertura en IndexedDB
    await db.apertura_caja.put({
      id,
      sedeId:        sedeId,
      cajeroId:      cajeroId,
      fechaApertura: new Date().toISOString(),
      status:        'ABIERTA',
      cachedAt:      new Date().toISOString(),
    });
  };

  const handleCerrarCaja = async () => {
    if (!aperturaId) return;
    try {
      await salesService.cerrarCaja(aperturaId);
      // Actualizar estado local
      await db.apertura_caja.update(aperturaId, { status: 'CERRADA' });
      setAperturaId(null);
      setCajaStatus('cerrada');
      setSection('pos');
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleArchivarOrdenes = async () => {
    setArchivando(true);
    setArchivarMsg('');
    try {
      const res = await tallerService.archivarOrdenes(sedeId || undefined);
      const n = res.data?.archivadas ?? 0;
      const msg = n > 0
        ? `✅ ${n} orden(es) entregada(s)/cancelada(s) archivada(s).`
        : '✅ No había órdenes entregadas o canceladas para archivar.';
      setArchivarMsg(msg);
      setTimeout(() => {
        setShowArchivarModal(false);
        setArchivarMsg('');
      }, 1800);
    } catch {
      setArchivarMsg('❌ Error al archivar. Intenta de nuevo.');
    } finally {
      setArchivando(false);
    }
  };

  return (
    <div className="cashier-layout">

      {/* Sidebar */}
      <aside className="cashier-sidebar">
        <div className="cashier-sidebar-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" color="var(--color-primary)">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span>MotoQFox</span>
        </div>

        <button
          className={`cashier-nav-item${section === 'pos' ? ' cashier-nav-item--active' : ''}`}
          onClick={() => setSection('pos')}
          disabled={cajaStatus !== 'abierta'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Punto de Venta
        </button>

        <button
          className={`cashier-nav-item${section === 'history' ? ' cashier-nav-item--active' : ''}`}
          onClick={() => setSection('history')}
          disabled={cajaStatus !== 'abierta'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Ventas del día
        </button>

        <button
          className={`cashier-nav-item${section === 'servicios' ? ' cashier-nav-item--active' : ''}`}
          onClick={() => setSection('servicios')}
          disabled={cajaStatus !== 'abierta'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          Taller / Servicios
        </button>

        <button
          className={`cashier-nav-item${section === 'historial_taller' ? ' cashier-nav-item--active' : ''}`}
          onClick={() => setSection('historial_taller')}
          disabled={cajaStatus !== 'abierta'}
        >
          {/* ícono de caja/archivo */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
          Historial Taller
        </button>

        {/* User info + actions */}
        <div className="cashier-sidebar-footer">
          <div className="cashier-user-info">
            <div className="cashier-user-avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <p className="cashier-user-name">{user?.full_name}</p>
              <p className="cashier-sede-badge">{user?.sede?.name ?? '—'}</p>
            </div>
          </div>
          {cajaStatus === 'abierta' && (
            <button
              onClick={() => { setArchivarMsg(''); setShowArchivarModal(true); }}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d97706',
                background: '#fffbeb', color: '#92400e', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              Archivar órdenes del día
            </button>
          )}
          {cajaStatus === 'abierta' && (
            <button
              onClick={handleCerrarCaja}
              className="cashier-nav-item"
              style={{ color: '#c05621', padding: '8px 0' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Cerrar caja
            </button>
          )}
          <button
            onClick={handleLogout}
            className="cashier-nav-item"
            style={{ color: '#e53e3e', padding: '8px 0' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className={`cashier-main${section === 'pos' && cajaStatus === 'abierta' ? ' cashier-main--pos' : ''}`}>
        {!(section === 'pos' && cajaStatus === 'abierta') && (
          <div className="cashier-main-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              {cajaStatus !== 'abierta'
                ? 'Caja'
                : section === 'pos'             ? 'Punto de Venta'
                : section === 'history'         ? 'Ventas del día'
                : section === 'historial_taller' ? 'Historial Taller'
                : 'Taller / Servicios'
              }
            </span>
            <NetworkStatusBadge />
          </div>
        )}

        <div className={`cashier-main-body${section === 'pos' && cajaStatus === 'abierta' ? ' cashier-main-body--pos' : ''}`}>
          {cajaStatus === 'loading' && (
            <p style={{ textAlign: 'center', marginTop: 60, color: '#718096' }}>Verificando estado de caja…</p>
          )}

          {cajaStatus === 'cerrada' && sedeId > 0 && (
            <CajaClosedScreen onAbierta={handleAbierta} />
          )}

          {cajaStatus === 'abierta' && sedeId > 0 && (
            <>
              {section === 'pos'             && <POSView sedeId={sedeId} />}
              {section === 'history'         && <SalesHistoryView sedeId={sedeId} cajeroId={cajeroId} />}
              {section === 'servicios'       && <ServiciosView sedeId={sedeId} />}
              {section === 'historial_taller' && (
                <HistorialServiciosView />
              )}
            </>
          )}

          {sedeId === 0 && cajaStatus !== 'loading' && (
            <p style={{ color: '#718096', fontSize: 14, marginTop: 40, textAlign: 'center' }}>
              Tu cuenta no tiene sede asignada. Contacta a un administrador.
            </p>
          )}
        </div>
      </main>

      {/* Modal archivar órdenes */}
      {showArchivarModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28, maxWidth: 420, width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#2d3748' }}>
              📦 Archivar órdenes del día
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#718096', lineHeight: 1.5 }}>
              Se moverán al historial del taller todas las órdenes con estatus{' '}
              <strong>Entregada</strong> o <strong>Cancelada</strong> de esta sede.
              Las órdenes activas (en proceso, en diagnóstico, recibidas) <strong>no se verán afectadas</strong>.
              Esta acción se puede realizar en cualquier momento.
            </p>

            {archivarMsg && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: archivarMsg.startsWith('✅') ? '#f0fff4' : '#fff5f5',
                border: `1px solid ${archivarMsg.startsWith('✅') ? '#9ae6b4' : '#fed7d7'}`,
                color: archivarMsg.startsWith('✅') ? '#276749' : '#c53030',
                fontSize: 13,
              }}>
                {archivarMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowArchivarModal(false)}
                disabled={archivando}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#4a5568', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleArchivarOrdenes}
                disabled={archivando || archivarMsg.startsWith('✅')}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none',
                  background: archivando ? '#a0aec0' : '#d97706',
                  color: '#fff', cursor: archivando ? 'wait' : 'pointer',
                  fontWeight: 700, fontSize: 13,
                }}
              >
                {archivando ? 'Archivando…' : 'Confirmar y archivar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CashierPanel;
