import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRegistrarVenta } from '../../hooks/useRegistrarVenta';
import { useTallerOffline } from '../../hooks/useTallerOffline';
import { db, resolvePayload } from '../../db/localDB';

export const NetworkStatusBadge: React.FC = () => {
  const { status, isOnline } = useNetworkStatus();
  const { sincronizarPendientes }       = useRegistrarVenta();
  const { sincronizarPendientesTaller } = useTallerOffline();
  const [pendingVentas,    setPendingVentas]    = useState(0);
  const [pendingServicios, setPendingServicios] = useState(0);
  const [syncing,          setSyncing]          = useState(false);

  // Contar items pendientes por tipo cada 5 segundos
  useEffect(() => {
    const update = async () => {
      const all = await db.syncQueue.where('status').anyOf('pending', 'error').toArray();
      setPendingVentas(   all.filter(i => resolvePayload(i).tipo === 'venta').length);
      setPendingServicios(all.filter(i => resolvePayload(i).tipo !== 'venta').length);
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalPending = pendingVentas + pendingServicios;

  // Sincronizar todo al reconectar
  useEffect(() => {
    if (!isOnline || totalPending === 0) return;
    setSyncing(true);
    Promise.all([
      sincronizarPendientes(),
      sincronizarPendientesTaller(),
    ]).finally(() => setSyncing(false));
  }, [isOnline, totalPending, sincronizarPendientes, sincronizarPendientesTaller]);

  const effectiveStatus = syncing ? 'syncing' : status;

  // Construir etiqueta offline con detalle por tipo
  const offlineParts: string[] = [];
  if (pendingVentas    > 0) offlineParts.push(`${pendingVentas} venta${pendingVentas !== 1 ? 's' : ''}`);
  if (pendingServicios > 0) offlineParts.push(`${pendingServicios} servicio${pendingServicios !== 1 ? 's' : ''}`);
  const offlineLabel = `Sin conexión${offlineParts.length > 0 ? ' · ' + offlineParts.join(' · ') : ''}`;

  const cfg = {
    online:  {
      bg: '#f0fff4', color: '#276749', border: '#9ae6b4', dot: '#38a169',
      label: 'En línea',
    },
    offline: {
      bg: '#fff5f5', color: '#c53030', border: '#feb2b2', dot: '#e53e3e',
      label: offlineLabel,
    },
    syncing: {
      bg: '#fffbeb', color: '#975a16', border: '#fbd38d', dot: '#d69e2e',
      label: `Sincronizando${totalPending > 0 ? ` ${totalPending}` : ''}…`,
    },
  }[effectiveStatus];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 20,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, color: cfg.color,
      userSelect: 'none',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: cfg.dot, flexShrink: 0,
        ...(effectiveStatus === 'syncing' && {
          animation: 'pulse 1s ease-in-out infinite',
        }),
      }} />
      {cfg.label}
    </div>
  );
};
