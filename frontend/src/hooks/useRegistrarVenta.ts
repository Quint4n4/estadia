import { useCallback, useEffect } from 'react';
import { db, resolvePayload } from '../db/localDB';
import { salesService } from '../api/sales.service';
import { useNetworkStatus } from './useNetworkStatus';
import type { VentaPayload } from '../types/sales.types';

export function useRegistrarVenta() {
  const { isOnline } = useNetworkStatus();

  /**
   * Registra una venta. Si hay red → API directa.
   * Si no hay red → guarda en IndexedDB y encola para sincronizar.
   */
  const registrarVenta = useCallback(async (payload: VentaPayload) => {
    if (isOnline) {
      return salesService.createVenta(payload);
    }

    // Sin red: guardar localmente
    const localId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.ventas.put({
      localId,
      sedeId:        payload.sede,
      items:         [],
      metodoPago:    payload.metodo_pago,
      subtotal:      Number(payload.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)),
      descuento:     Number(payload.descuento ?? 0),
      total:         Number(payload.monto_pagado),
      montoRecibido: Number(payload.monto_pagado),
      cambio:        0,
      timestamp:     now,
      status:        'pending',
    });

    // v2: campo `payload` tipado
    await db.syncQueue.add({
      localId,
      payload:   { tipo: 'venta', datos: payload },
      timestamp: Date.now(),
      intentos:  0,
      status:    'pending',
    });

    return {
      success: true,
      message: 'Venta guardada localmente. Se sincronizará al reconectar.',
      data: null as any,
      offline: true,
      localId,
    };
  }, [isOnline]);

  /**
   * Sincroniza solo las ventas pendientes.
   */
  const sincronizarPendientes = useCallback(async () => {
    const allPending = await db.syncQueue.where('status').equals('pending').toArray();
    // Solo ventas (compatibilidad con items v1 que tienen `datos` sin `payload`)
    const ventasPending = allPending.filter(item => {
      const p = resolvePayload(item);
      return p.tipo === 'venta';
    });
    if (ventasPending.length === 0) return;

    for (const item of ventasPending) {
      try {
        await db.syncQueue.update(item.id!, { status: 'processing' });
        const p = resolvePayload(item) as { tipo: 'venta'; datos: VentaPayload };
        const res = await salesService.createVenta(p.datos);
        if (res.success) {
          await db.ventas.update(item.localId, {
            status:   'synced',
            serverId: res.data?.id,
          });
          await db.syncQueue.delete(item.id!);
        } else {
          throw new Error(res.message);
        }
      } catch (e: any) {
        const nuevoIntentos = (item.intentos ?? 0) + 1;
        await db.syncQueue.update(item.id!, {
          status:   nuevoIntentos >= 5 ? 'error' : 'pending',
          intentos: nuevoIntentos,
        });
        await db.ventas.update(item.localId, {
          syncError: e?.message ?? 'Error desconocido',
        });
      }
    }
  }, []);

  // Auto-sync al reconectar
  useEffect(() => {
    if (!isOnline) return;
    db.syncQueue
      .where('status').equals('pending')
      .filter(i => resolvePayload(i).tipo === 'venta')
      .count()
      .then(n => { if (n > 0) sincronizarPendientes(); });
  }, [isOnline, sincronizarPendientes]);

  return { registrarVenta, sincronizarPendientes };
}
