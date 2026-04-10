import { useCallback, useEffect } from 'react';
import { db, resolvePayload } from '../db/localDB';
import { tallerService } from '../api/taller.service';
import { useNetworkStatus } from './useNetworkStatus';
import type { ServicioCreatePayload, EntregarServicioPayload, ServicioMotoList } from '../types/taller.types';

export function useTallerOffline() {
  const { isOnline } = useNetworkStatus();

  /**
   * Crear una orden de servicio.
   * Online → API directa. Offline → guarda en IndexedDB + encola.
   */
  const crearServicio = useCallback(async (
    payload: ServicioCreatePayload,
    sedeId: number,
    clienteNombre?: string,
    motoDisplay?: string,
  ) => {
    if (isOnline) {
      return tallerService.createServicio(payload);
    }

    const localId = crypto.randomUUID();
    await db.servicios.put({
      localId,
      sedeId,
      clienteNombre,
      motoDisplay,
      descripcion:  payload.descripcion ?? '',
      status:       'RECIBIDO',
      pagoStatus:   'PENDIENTE_PAGO',
      timestamp:    new Date().toISOString(),
      syncStatus:   'pending',
      payload,
    });
    await db.syncQueue.add({
      localId,
      payload: { tipo: 'crear_servicio', datos: payload, localServicioId: localId },
      timestamp: Date.now(),
      intentos:  0,
      status:    'pending',
    });

    return { success: true, offline: true, localId, data: null as any };
  }, [isOnline]);

  /**
   * Entregar y cobrar un servicio.
   * Online → API directa. Offline → actualiza cache local + encola.
   */
  const entregarServicio = useCallback(async (
    servicioId: number,
    datos: EntregarServicioPayload,
  ) => {
    if (isOnline) {
      return tallerService.entregarServicio(servicioId, datos);
    }

    const localId = crypto.randomUUID();
    // Marcar como pagado en cache local si existe
    await db.servicios
      .where('serverId').equals(servicioId)
      .modify({ pagoStatus: 'PAGADO', status: 'ENTREGADO' });

    await db.syncQueue.add({
      localId,
      payload: { tipo: 'entregar_servicio', datos, servicioId },
      timestamp: Date.now(),
      intentos:  0,
      status:    'pending',
    });

    return { success: true, offline: true, localId, data: null as any };
  }, [isOnline]);

  /**
   * Iniciar reparación (mecánico): ASIGNADO → EN_PROCESO.
   * Online → API directa. Offline → actualiza cache local + encola.
   */
  const iniciarReparacion = useCallback(async (servicioId: number) => {
    if (isOnline) return tallerService.iniciarReparacion(servicioId);

    await db.servicios.where('serverId').equals(servicioId).modify({ status: 'EN_PROCESO' });
    await db.syncQueue.add({
      localId: crypto.randomUUID(),
      payload: { tipo: 'iniciar_reparacion', servicioId },
      timestamp: Date.now(), intentos: 0, status: 'pending',
    });
    return { success: true, offline: true, data: null as any };
  }, [isOnline]);

  /**
   * Marcar lista para entregar (jefe/mecánico): EN_PROCESO → LISTA_PARA_ENTREGAR.
   * Online → API directa. Offline → actualiza cache local + encola.
   */
  const marcarListaParaEntregar = useCallback(async (servicioId: number) => {
    if (isOnline) return tallerService.marcarListaParaEntregar(servicioId);

    await db.servicios.where('serverId').equals(servicioId).modify({ status: 'LISTA_PARA_ENTREGAR' });
    await db.syncQueue.add({
      localId: crypto.randomUUID(),
      payload: { tipo: 'marcar_lista_entregar', servicioId },
      timestamp: Date.now(), intentos: 0, status: 'pending',
    });
    return { success: true, offline: true, data: null as any };
  }, [isOnline]);

  /**
   * Confirmar moto en mostrador (cajero): LISTA_PARA_ENTREGAR → LISTO.
   * Online → API directa. Offline → actualiza cache local + encola.
   */
  const marcarEntregada = useCallback(async (servicioId: number) => {
    if (isOnline) return tallerService.marcarEntregada(servicioId);

    await db.servicios.where('serverId').equals(servicioId).modify({ status: 'LISTO' });
    await db.syncQueue.add({
      localId: crypto.randomUUID(),
      payload: { tipo: 'marcar_entregada', servicioId },
      timestamp: Date.now(), intentos: 0, status: 'pending',
    });
    return { success: true, offline: true, data: null as any };
  }, [isOnline]);

  /**
   * Actualizar diagnóstico del mecánico.
   * Online → API directa. Offline → encola.
   */
  const actualizarDiagnostico = useCallback(async (
    servicioId: number,
    datos: { diagnostico_mecanico?: string; refacciones_requeridas?: string },
  ) => {
    if (isOnline) {
      return tallerService.actualizarDiagnostico(servicioId, datos);
    }

    const localId = crypto.randomUUID();
    await db.syncQueue.add({
      localId,
      payload: { tipo: 'actualizar_diagnostico', datos, servicioId },
      timestamp: Date.now(),
      intentos:  0,
      status:    'pending',
    });

    return { success: true, offline: true, localId, data: null as any };
  }, [isOnline]);

  /**
   * Guarda/actualiza la lista de servicios activos en IndexedDB.
   * Llamar cuando se obtiene la lista desde el servidor.
   */
  const cacheServicios = useCallback(async (sedeId: number, lista: ServicioMotoList[]) => {
    const ahora = new Date().toISOString();
    await db.servicios.bulkPut(lista.map(s => ({
      localId:       `server-${s.id}`,
      serverId:      s.id,
      sedeId,
      clienteNombre: s.cliente_nombre,
      motoDisplay:   s.moto_display,
      descripcion:   s.descripcion_problema ?? '',
      status:        s.status,
      pagoStatus:    s.pago_status,
      total:         s.total,
      timestamp:     ahora,
      syncStatus:    'synced' as const,
      payload:       {} as ServicioCreatePayload,
    })));
  }, []);

  /**
   * Sincroniza con el servidor todos los items taller pendientes.
   * Procesa en orden: crear_servicio primero (pueden desbloquear entregas).
   */
  const sincronizarPendientesTaller = useCallback(async () => {
    const allPending = await db.syncQueue
      .where('status').equals('pending')
      .toArray();

    // Separar ventas (ya las maneja useRegistrarVenta) del resto
    const tallerPending = allPending.filter(item => {
      const p = resolvePayload(item);
      return p.tipo !== 'venta';
    });

    if (tallerPending.length === 0) return;

    // Procesar crear_servicio primero para resolver dependencias de entrega
    const sorted = [
      ...tallerPending.filter(i => resolvePayload(i).tipo === 'crear_servicio'),
      ...tallerPending.filter(i => resolvePayload(i).tipo !== 'crear_servicio'),
    ];

    for (const item of sorted) {
      try {
        await db.syncQueue.update(item.id!, { status: 'processing' });
        const p = resolvePayload(item);

        if (p.tipo === 'crear_servicio') {
          const res = await tallerService.createServicio(p.datos);
          if (res.data?.id) {
            await db.servicios
              .where('localId').equals(p.localServicioId)
              .modify({ syncStatus: 'synced', serverId: res.data.id });

            // Resolver dependencias: entregas que esperaban este servicio
            const entregas = await db.syncQueue
              .where('status').anyOf('pending', 'processing')
              .filter(q => {
                const qp = resolvePayload(q);
                return qp.tipo === 'entregar_servicio' &&
                  (qp as any).localServicioId === p.localServicioId;
              })
              .toArray();
            for (const e of entregas) {
              await db.syncQueue.update(e.id!, {
                payload: { ...resolvePayload(e), servicioId: res.data.id } as any,
                status: 'pending',
              });
            }
            await db.syncQueue.delete(item.id!);
          }
        } else if (p.tipo === 'entregar_servicio') {
          await tallerService.entregarServicio(p.servicioId, p.datos);
          await db.syncQueue.delete(item.id!);
        } else if (p.tipo === 'actualizar_diagnostico') {
          await tallerService.actualizarDiagnostico(p.servicioId, p.datos);
          await db.syncQueue.delete(item.id!);
        } else if (p.tipo === 'iniciar_reparacion') {
          await tallerService.iniciarReparacion(p.servicioId);
          await db.syncQueue.delete(item.id!);
        } else if (p.tipo === 'marcar_lista_entregar') {
          await tallerService.marcarListaParaEntregar(p.servicioId);
          await db.syncQueue.delete(item.id!);
        } else if (p.tipo === 'marcar_entregada') {
          await tallerService.marcarEntregada(p.servicioId);
          await db.syncQueue.delete(item.id!);
        }
      } catch {
        const nuevos = (item.intentos ?? 0) + 1;
        await db.syncQueue.update(item.id!, {
          status:   nuevos >= 5 ? 'error' : 'pending',
          intentos: nuevos,
        });
      }
    }
  }, []);

  // Auto-sync al reconectar
  useEffect(() => {
    if (!isOnline) return;
    db.syncQueue
      .where('status').equals('pending')
      .filter(i => {
        const p = resolvePayload(i);
        return p.tipo !== 'venta';
      })
      .count()
      .then(n => { if (n > 0) sincronizarPendientesTaller(); });
  }, [isOnline, sincronizarPendientesTaller]);

  return {
    crearServicio,
    entregarServicio,
    iniciarReparacion,
    marcarListaParaEntregar,
    marcarEntregada,
    actualizarDiagnostico,
    cacheServicios,
    sincronizarPendientesTaller,
  };
}
