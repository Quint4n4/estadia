import React, { useEffect, useRef, useState } from 'react';
import {
  Wrench, Bike, User, CreditCard, CheckSquare, Camera,
  Clock, AlertTriangle, ChevronRight, FileText, DollarSign,
  Loader2, CheckCircle, Package, ArrowRight, UserCheck,
} from 'lucide-react';
import { tallerService } from '../../api/taller.service';
import { usersService } from '../../api/users.service';
import { useAuth } from '../../contexts/AuthContext';
import type {
  ServicioMotoDetail,
  ServicioStatus,
  SolicitudRefaccionExtra,
  MetodoPago,
} from '../../types/taller.types';
import type { User as MecanicoUser } from '../../types/auth.types';

interface Props {
  servicioId: number;
  onClose: () => void;
  onUpdated: () => void;
}

/* ── Status config ────────────────────────────────────────────────────────── */
const STATUS_CFG: Record<ServicioStatus, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  RECIBIDO:            { label: 'Recibido',            color: '#4a5568', bg: '#edf2f7', border: '#cbd5e0', emoji: '📥' },
  EN_DIAGNOSTICO:      { label: 'En diagnóstico',      color: '#6b46c1', bg: '#faf5ff', border: '#d6bcfa', emoji: '🔍' },
  EN_PROCESO:          { label: 'En proceso',           color: '#2b6cb0', bg: '#ebf8ff', border: '#90cdf4', emoji: '⚙️' },
  COTIZACION_EXTRA:    { label: 'Cotización extra',    color: '#975a16', bg: '#fffbeb', border: '#fbd38d', emoji: '💬' },
  LISTA_PARA_ENTREGAR: { label: 'Lista para entregar', color: '#2c7a7b', bg: '#e6fffa', border: '#81e6d9', emoji: '🏷️' },
  LISTO:               { label: 'Lista para entregar', color: '#2c7a7b', bg: '#e6fffa', border: '#81e6d9', emoji: '🏷️' },
  ENTREGADO:           { label: 'Entregado',           color: '#553c9a', bg: '#f3e8ff', border: '#d6bcfa', emoji: '🏁' },
};

const NEXT_STATUS: Partial<Record<ServicioStatus, ServicioStatus>> = {
  RECIBIDO:            'EN_DIAGNOSTICO',   // se ajusta dinámicamente según es_reparacion
  EN_DIAGNOSTICO:      'EN_PROCESO',
  EN_PROCESO:          'LISTA_PARA_ENTREGAR',
  LISTA_PARA_ENTREGAR: 'LISTO',
  LISTO:               'ENTREGADO',
};

const METODOS_PAGO: { value: MetodoPago; label: string; icon: string }[] = [
  { value: 'EFECTIVO',      label: 'Efectivo',       icon: '💵' },
  { value: 'TARJETA',       label: 'Tarjeta',        icon: '💳' },
  { value: 'TRANSFERENCIA', label: 'Transferencia',  icon: '🏦' },
];

const fmt = (v: string | number | null | undefined) =>
  `$${Number(v ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    + ' · ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

/* ── Estilos compartidos ──────────────────────────────────────────────────── */
const card: React.CSSProperties = {
  border: '1px solid #e2e8f0', borderRadius: 12,
  padding: '15px 18px', marginBottom: 12, background: '#fff',
};
const cardHdr: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f0f4f8',
};
const cardTitle: React.CSSProperties = {
  fontWeight: 700, fontSize: 11, color: '#4a5568',
  textTransform: 'uppercase' as const, letterSpacing: '0.06em',
};
const ic = (bg: string): React.CSSProperties => ({
  width: 26, height: 26, borderRadius: '50%', background: bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
});

const InfoField = ({ label, value }: { label: string; value?: string | null }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 13, color: '#2d3748', fontWeight: 500 }}>{value || '—'}</div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════ */
const ServicioDetalleModal: React.FC<Props> = ({ servicioId, onClose, onUpdated }) => {
  const { user } = useAuth();
  const role = user?.role ?? '';

  const [servicio,     setServicio]     = useState<ServicioMotoDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [actionLoading,setAction]       = useState(false);
  const [metodo,       setMetodo]       = useState<MetodoPago>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const [mecanicoId,   setMecanicoId]   = useState<number | ''>('');
  const [mecanicos,    setMecanicos]    = useState<MecanicoUser[]>([]);
  const [imgAmpliada,  setImgAmpliada]  = useState<string | null>(null);

  /* ── Edición de fotos (solo RECIBIDO + recepción) ── */
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [subiendoFotos,  setSubiendoFotos]  = useState(false);
  const [eliminandoId,   setEliminandoId]   = useState<number | null>(null);
  const [errorFotos,     setErrorFotos]     = useState('');

  /* ── Estado para diagnóstico y refacciones ── */
  const [diagVal,      setDiagVal]      = useState('');
  const [refacVal,     setRefacVal]     = useState('');
  const [guardandoDiag, setGuardandoDiag] = useState(false);
  const [guardandoRefac, setGuardandoRefac] = useState(false);
  const [savedDiag,    setSavedDiag]    = useState(false);
  const [savedRefac,   setSavedRefac]   = useState(false);
  const [copiado,      setCopiado]      = useState(false);

  const isCajero   = ['CASHIER', 'ENCARGADO', 'ADMINISTRATOR'].includes(role);
  const isJefe     = ['JEFE_MECANICO', 'ENCARGADO', 'ADMINISTRATOR'].includes(role);
  const isMecanico = role === 'MECANICO';

  /* ── Carga del servicio ── */
  const load = async () => {
    try {
      setLoading(true);
      const res = await tallerService.getServicio(servicioId);
      setServicio(res.data);
      setDiagVal((res.data as any).diagnostico_mecanico ?? '');
      setRefacVal((res.data as any).refacciones_requeridas ?? '');
    } catch {
      setError('No se pudo cargar el servicio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [servicioId]);

  /* ── Cargar mecánicos y jefes mecánicos cuando el jefe ve un servicio RECIBIDO ── */
  useEffect(() => {
    if (!servicio || servicio.status !== 'RECIBIDO' || !isJefe) return;
    Promise.all([
      usersService.list({ role: 'MECANICO',      is_active: true, page_size: 100 }),
      usersService.list({ role: 'JEFE_MECANICO', is_active: true, page_size: 100 }),
    ])
      .then(([mecRes, jefeRes]) => {
        const mecs  = mecRes.data?.users  ?? [];
        const jefes = jefeRes.data?.users ?? [];
        const combined = [...mecs, ...jefes];
        // Deduplicar por id en caso de que el backend devuelva el mismo usuario en ambos roles
        const unique = combined.filter((u, i, arr) => arr.findIndex(x => x.id === u.id) === i);
        setMecanicos(unique);
      })
      .catch(() => setMecanicos([]));
  }, [servicio?.status, isJefe]);

  /* ── Enviar es_reparacion al payload de crear (ya lo hace el modal) ── */

  /* ── Guardar diagnóstico automáticamente al perder foco ── */
  const handleBlurDiag = async () => {
    if (!servicio) return;
    setGuardandoDiag(true);
    try {
      await (tallerService as any).actualizarDiagnostico(servicioId, { diagnostico_mecanico: diagVal });
      setSavedDiag(true);
      setTimeout(() => setSavedDiag(false), 2500);
    } catch { /* silencioso */ }
    finally { setGuardandoDiag(false); }
  };

  const handleBlurRefac = async () => {
    if (!servicio) return;
    setGuardandoRefac(true);
    try {
      await (tallerService as any).actualizarDiagnostico(servicioId, { refacciones_requeridas: refacVal });
      setSavedRefac(true);
      setTimeout(() => setSavedRefac(false), 2500);
    } catch { /* silencioso */ }
    finally { setGuardandoRefac(false); }
  };

  /* ── Copiar link de seguimiento ── */
  const handleCopiarLink = () => {
    const token = (servicio as any)?.tracking_token;
    if (!token) return;
    const url = `${window.location.protocol}//${window.location.hostname}:5174/seguimiento/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }).catch(() => {
      // fallback para navegadores sin clipboard API
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  /* ── Acciones ── */
  const run = async (fn: () => Promise<void>, afterClose = false) => {
    setAction(true); setError('');
    try { await fn(); onUpdated(); afterClose ? onClose() : load(); }
    catch (e: any) { setError(e?.response?.data?.message ?? 'Ocurrió un error.'); }
    finally { setAction(false); }
  };

  const handleAsignar             = () => run(() => tallerService.asignarMecanico(servicioId, { mecanico_id: Number(mecanicoId) }));
  const handleIniciarReparacion   = () => run(() => tallerService.iniciarReparacion(servicioId));
  const handleSubmitDiagnostico   = () => run(() => tallerService.submitDiagnostico(servicioId));
  const handleListaParaEntregar   = () => run(() => tallerService.marcarListaParaEntregar(servicioId));
  const handleMarcarEntregada     = () => run(() => tallerService.marcarEntregada(servicioId));
  const handleEntregar            = () => {
    const yaPageado = servicio?.pago_status === 'PAGADO';
    const payload = yaPageado
      ? { metodo_pago: servicio!.metodo_pago ?? 'EFECTIVO', monto_pagado: Number(servicio!.total) }
      : { metodo_pago: metodo, monto_pagado: parseFloat(montoRecibido) || 0 };
    run(() => tallerService.entregarServicio(servicioId, payload), true);
  };
  const handleAprobar             = (sol: SolicitudRefaccionExtra) => run(() => tallerService.aprobarSolicitud(sol.id));
  const handleRechazar            = (sol: SolicitudRefaccionExtra) => run(() => tallerService.rechazarSolicitud(sol.id));
  const handleAutorizar           = () => run(() => tallerService.autorizarDiagnostico(servicioId), true);
  const handleCancelar            = () => {
    if (!window.confirm('¿Estás seguro de que deseas rechazar/cancelar esta orden? Esta acción no se puede deshacer.')) return;
    run(() => tallerService.cancelarOrden(servicioId), true);
  };

  // nextStatus dinámico: RECIBIDO → EN_DIAGNOSTICO (reparación) o EN_PROCESO (mantenimiento)
  const nextStatusKey = servicio
    ? servicio.status === 'RECIBIDO'
      ? (servicio.es_reparacion ? 'EN_DIAGNOSTICO' : 'EN_PROCESO')
      : NEXT_STATUS[servicio.status]
    : undefined;

  const statusCfg  = servicio ? STATUS_CFG[servicio.status] : null;
  const nextCfg    = nextStatusKey ? STATUS_CFG[nextStatusKey] : null;

  /* ─────────────────────────────────────────────────── RENDER ──────────── */
  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-box"
          onClick={e => e.stopPropagation()}
          style={{ maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', padding: 0 }}
        >
          {/* ══ HEADER ══════════════════════════════════════════════════════ */}
          <div style={{
            padding: '18px 22px 16px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: '10px 10px 0 0',
            position: 'sticky', top: 0, zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Wrench size={18} color="#fff" />
                </div>
                <div>
                  <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>Orden de Servicio</h2>
                  {servicio && (
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: '2px 0 0', fontFamily: 'monospace' }}>
                      {servicio.folio}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {statusCfg && (
                  <span style={{
                    background: statusCfg.bg, color: statusCfg.color,
                    border: `1px solid ${statusCfg.border}`,
                    borderRadius: 20, padding: '4px 14px',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {statusCfg.emoji} {statusCfg.label}
                  </span>
                )}
                <button onClick={onClose} style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                  color: '#fff', width: 30, height: 30, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>✕</button>
              </div>
            </div>
          </div>

          {/* ══ CONTENIDO ═══════════════════════════════════════════════════ */}
          <div style={{ padding: '18px 22px 24px' }}>

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, color: '#a0aec0', gap: 10 }}>
                <Loader2 size={16} className="icon-spin" /> Cargando orden…
              </div>
            )}

            {error && !loading && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#fff5f5', border: '1px solid #fed7d7',
                borderRadius: 10, padding: '10px 14px', marginBottom: 12,
                fontSize: 13, color: '#c53030',
              }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            {!loading && servicio && (
              <>

                {/* ══ PANEL DE CAMBIO DE ESTADO ════════════════════════════ */}
                {servicio.status !== 'ENTREGADO' && (
                  <div style={{
                    borderRadius: 14, marginBottom: 16, overflow: 'hidden',
                    border: `1.5px solid ${nextCfg?.border ?? '#e2e8f0'}`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  }}>
                    {/* Barra de título */}
                    <div style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(90deg, #1a1a2e, #16213e)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <ArrowRight size={14} color="#a0aec0" />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>
                        Cambiar estado
                      </span>
                      {/* Indicador de flujo */}
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {statusCfg && (
                          <span style={{
                            background: statusCfg.bg, color: statusCfg.color,
                            borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                          }}>{statusCfg.emoji} {statusCfg.label}</span>
                        )}
                        {nextCfg && (
                          <>
                            <ChevronRight size={14} color="#a0aec0" />
                            <span style={{
                              background: nextCfg.bg, color: nextCfg.color,
                              borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                            }}>{nextCfg.emoji} {nextCfg.label}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Cuerpo de la acción */}
                    <div style={{ padding: '16px 18px', background: '#fff' }}>

                      {/* ── RECIBIDO → asignar mecánico (Jefe) ── */}
                      {servicio.status === 'RECIBIDO' && isJefe && (
                        <div>
                          <p style={{ fontSize: 13, color: '#4a5568', margin: '0 0 12px' }}>
                            {servicio.es_reparacion
                              ? 'Asigna un mecánico para iniciar el diagnóstico:'
                              : 'Asigna un mecánico para iniciar el servicio:'}
                          </p>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ flex: 1, position: 'relative' as const }}>
                              <UserCheck size={14} color="#3182ce" style={{ position: 'absolute' as const, left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                              <select
                                value={mecanicoId}
                                onChange={e => setMecanicoId(e.target.value ? Number(e.target.value) : '')}
                                className="form-input"
                                style={{ paddingLeft: 32 }}
                              >
                                <option value="">— Selecciona un mecánico —</option>
                                {mecanicos.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.full_name || `${m.first_name} ${m.last_name}`.trim()}
                                    {m.role === 'JEFE_MECANICO' ? ' (Jefe)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={handleAsignar}
                              disabled={actionLoading || !mecanicoId}
                              style={{
                                padding: '0 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                background: mecanicoId ? 'linear-gradient(135deg, #3182ce, #2b6cb0)' : '#e2e8f0',
                                color: mecanicoId ? '#fff' : '#a0aec0',
                                fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                                transition: 'all 0.2s', whiteSpace: 'nowrap' as const,
                              }}
                            >
                              {actionLoading ? <Loader2 size={14} className="icon-spin" /> : <Wrench size={14} />}
                              {servicio.es_reparacion ? 'Asignar y diagnosticar' : 'Asignar e iniciar'}
                            </button>
                          </div>
                          {mecanicos.length === 0 && (
                            <p style={{ fontSize: 12, color: '#a0aec0', margin: '8px 0 0' }}>
                              No hay mecánicos disponibles en esta sede.
                            </p>
                          )}
                        </div>
                      )}

                      {/* ── RECIBIDO (sin permisos) ── */}
                      {servicio.status === 'RECIBIDO' && !isJefe && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#718096', fontSize: 13 }}>
                          <Clock size={15} color="#a0aec0" />
                          Esperando asignación de mecánico por el jefe de taller.
                        </div>
                      )}

                      {/* ── EN_DIAGNOSTICO → EN_PROCESO (Mecánico/Jefe) ── */}
                      {servicio.status === 'EN_DIAGNOSTICO' && (isMecanico || isJefe) && (
                        (servicio as any).diagnostico_listo ? (
                          /* Diagnóstico ya enviado — esperando autorización */
                          <div style={{
                            padding: '14px 16px', borderRadius: 10,
                            background: '#fffbeb', border: '1px solid #f6ad55',
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}>
                            <span style={{ fontSize: 20 }}>⏳</span>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#c05621' }}>
                                Diagnóstico enviado a recepción
                              </p>
                              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#975a16' }}>
                                Esperando que recepción contacte al cliente y autorice la reparación
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Diagnóstico pendiente de enviar */
                          <button
                            onClick={handleSubmitDiagnostico}
                            disabled={actionLoading}
                            style={{
                              width: '100%', padding: '13px', border: 'none', borderRadius: 10, cursor: 'pointer',
                              background: actionLoading ? '#a0aec0' : 'linear-gradient(135deg, #3182ce, #2b6cb0)',
                              color: '#fff', fontWeight: 700, fontSize: 14,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                          >
                            {actionLoading ? <Loader2 size={16} className="icon-spin" /> : '📋'}
                            Diagnóstico completo — enviar a recepción
                          </button>
                        )
                      )}

                      {/* ── EN_DIAGNOSTICO (cajero/encargado/admin) — decisión del cliente ── */}
                      {servicio.status === 'EN_DIAGNOSTICO' && isCajero && (
                        <div>
                          {(servicio as any).diagnostico_listo && (
                            <div style={{
                              padding: '10px 14px', borderRadius: 8, marginBottom: 10,
                              background: '#ebf8ff', border: '1px solid #90cdf4',
                              fontSize: 12, color: '#2b6cb0', fontWeight: 600,
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                              📋 El mecánico completó el diagnóstico. Contacta al cliente y autoriza la reparación.
                            </div>
                          )}
                          <p style={{ fontSize: 11, color: '#718096', margin: '0 0 10px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                            Decisión del cliente:
                          </p>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button
                              onClick={handleAutorizar}
                              disabled={actionLoading}
                              style={{
                                flex: 1, padding: '11px 14px', border: 'none', borderRadius: 10, cursor: actionLoading ? 'not-allowed' : 'pointer',
                                background: actionLoading ? '#c6f6d5' : 'linear-gradient(135deg, #38a169, #276749)',
                                color: '#fff', fontWeight: 700, fontSize: 13,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                transition: 'all 0.2s',
                              }}
                            >
                              {actionLoading ? <Loader2 size={14} className="icon-spin" /> : null}
                              ✅ Autorizar reparación
                            </button>
                            <button
                              onClick={handleCancelar}
                              disabled={actionLoading}
                              style={{
                                flex: 1, padding: '11px 14px', border: 'none', borderRadius: 10, cursor: actionLoading ? 'not-allowed' : 'pointer',
                                background: actionLoading ? '#fed7d7' : 'linear-gradient(135deg, #e53e3e, #c53030)',
                                color: '#fff', fontWeight: 700, fontSize: 13,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                transition: 'all 0.2s',
                              }}
                            >
                              {actionLoading ? <Loader2 size={14} className="icon-spin" /> : null}
                              ✗ Cancelar orden
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── EN_DIAGNOSTICO (mecánico sin rol cajero, solo lectura) ── */}
                      {servicio.status === 'EN_DIAGNOSTICO' && !isMecanico && !isJefe && !isCajero && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b46c1', fontSize: 13 }}>
                          <Clock size={15} /> El mecánico está realizando el diagnóstico.
                        </div>
                      )}

                      {/* ── EN_PROCESO → LISTA_PARA_ENTREGAR (Mecánico/Jefe) ── */}
                      {servicio.status === 'EN_PROCESO' && (isMecanico || isJefe) && (
                        <button
                          onClick={handleListaParaEntregar}
                          disabled={actionLoading}
                          style={{
                            width: '100%', padding: '13px', border: 'none', borderRadius: 10, cursor: 'pointer',
                            background: 'linear-gradient(135deg, #2c7a7b, #234e52)',
                            color: '#fff', fontWeight: 700, fontSize: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}
                        >
                          {actionLoading ? <Loader2 size={16} className="icon-spin" /> : <CheckCircle size={16} />}
                          Servicio terminado — marcar lista para entregar
                        </button>
                      )}

                      {/* ── EN_PROCESO (cajero sin permisos) ── */}
                      {servicio.status === 'EN_PROCESO' && !isMecanico && !isJefe && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#718096', fontSize: 13 }}>
                          <Wrench size={15} color="#a0aec0" />
                          En taller — esperando que el mecánico termine.
                        </div>
                      )}

                      {/* ── COTIZACION_EXTRA ── */}
                      {servicio.status === 'COTIZACION_EXTRA' && (
                        <div>
                          {isCajero ? (
                            <p style={{ fontSize: 13, color: '#975a16', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <AlertTriangle size={14} /> El mecánico encontró una falla adicional y solicitó refacciones. Revísalas abajo y aprueba o rechaza.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#975a16', fontSize: 13 }}>
                              <Clock size={15} /> Esperando respuesta del cajero sobre la falla adicional.
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── LISTA_PARA_ENTREGAR → LISTO (Cajero confirma) ── */}
                      {servicio.status === 'LISTA_PARA_ENTREGAR' && isCajero && (
                        <button
                          onClick={handleMarcarEntregada}
                          disabled={actionLoading}
                          style={{
                            width: '100%', padding: '13px', border: 'none', borderRadius: 10, cursor: 'pointer',
                            background: 'linear-gradient(135deg, #2c7a7b, #234e52)',
                            color: '#fff', fontWeight: 700, fontSize: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}
                        >
                          {actionLoading ? <Loader2 size={16} className="icon-spin" /> : <CheckCircle size={16} />}
                          Confirmar moto en mostrador — marcar como entregada
                        </button>
                      )}

                      {/* ── LISTA_PARA_ENTREGAR (mecánico/jefe, solo lectura) ── */}
                      {servicio.status === 'LISTA_PARA_ENTREGAR' && !isCajero && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2c7a7b', fontSize: 13 }}>
                          <Package size={15} /> Moto lista — esperando confirmación del cajero.
                        </div>
                      )}

                      {/* ── LISTO → ENTREGADO — Cajero: pago ya registrado ── */}
                      {servicio.status === 'LISTO' && isCajero && servicio.pago_status === 'PAGADO' && (
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                          {/* Panel de pago registrado */}
                          <div style={{
                            background: 'linear-gradient(135deg, #f0fff4, #e6fffa)',
                            border: '1px solid #9ae6b4',
                            borderRadius: 12,
                            padding: '16px 18px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                          }}>
                            <span style={{ fontSize: 28, flexShrink: 0 }}>✅</span>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#276749' }}>
                                Pago ya registrado
                              </p>
                              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#2f855a', lineHeight: 1.5 }}>
                                El cliente pagó <strong>{fmt(servicio.total)}</strong> al momento de dejar la moto.
                                {servicio.metodo_pago && (
                                  <> Método: <strong>{servicio.metodo_pago}</strong>.</>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Botón confirmar entrega */}
                          <button
                            onClick={handleEntregar}
                            disabled={actionLoading}
                            style={{
                              width: '100%',
                              padding: '13px',
                              border: 'none',
                              borderRadius: 10,
                              cursor: actionLoading ? 'wait' : 'pointer',
                              background: actionLoading
                                ? '#a0aec0'
                                : 'linear-gradient(135deg, #38a169, #276749)',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 14,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                            }}
                          >
                            {actionLoading
                              ? <Loader2 size={16} className="icon-spin" />
                              : <CheckCircle size={16} />}
                            Confirmar entrega al cliente
                          </button>
                        </div>
                      )}

                      {/* ── LISTO → ENTREGADO — Cajero cobra (pago pendiente) ── */}
                      {servicio.status === 'LISTO' && isCajero && servicio.pago_status !== 'PAGADO' && (
                        <div>
                          <p style={{ fontSize: 13, color: '#276749', margin: '0 0 12px', fontWeight: 500 }}>
                            Selecciona el método de pago y confirma la entrega al cliente:
                          </p>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            {METODOS_PAGO.map(m => (
                              <button
                                key={m.value}
                                type="button"
                                onClick={() => {
                                  setMetodo(m.value);
                                  setMontoRecibido(m.value !== 'EFECTIVO' ? String(servicio.total) : '');
                                }}
                                style={{
                                  flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                                  border: metodo === m.value ? '2px solid #38a169' : '2px solid #e2e8f0',
                                  background: metodo === m.value ? '#f0fff4' : '#f7fafc',
                                  color: metodo === m.value ? '#276749' : '#718096',
                                  fontWeight: metodo === m.value ? 700 : 500,
                                  fontSize: 13, transition: 'all 0.15s',
                                  display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 3,
                                }}
                              >
                                <span style={{ fontSize: 18 }}>{m.icon}</span>
                                {m.label}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                padding: '10px 16px', borderRadius: 10,
                                background: '#f7fafc', border: '1px solid #e2e8f0',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginBottom: 8,
                              }}>
                                <span style={{ fontSize: 12, color: '#718096' }}>Total a cobrar</span>
                                <span style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>{fmt(servicio.total)}</span>
                              </div>
                              {metodo === 'EFECTIVO' ? (
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                                  <label style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                                    Monto recibido
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={montoRecibido}
                                    onChange={e => setMontoRecibido(e.target.value)}
                                    placeholder="0.00"
                                    style={{
                                      padding: '8px 12px', borderRadius: 8,
                                      border: '1px solid #e2e8f0', fontSize: 14,
                                      fontWeight: 600, color: '#2d3748',
                                      background: '#fff', outline: 'none', width: '100%',
                                      boxSizing: 'border-box' as const,
                                    }}
                                  />
                                  {montoRecibido !== '' && parseFloat(montoRecibido) >= servicio.total && (
                                    <div style={{ fontSize: 12, color: '#276749', fontWeight: 700 }}>
                                      Cambio: {fmt(parseFloat(montoRecibido) - servicio.total)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                                  <label style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                                    Monto recibido
                                  </label>
                                  <input
                                    type="text"
                                    value={fmt(servicio.total)}
                                    disabled
                                    style={{
                                      padding: '8px 12px', borderRadius: 8,
                                      border: '1px solid #e2e8f0', fontSize: 14,
                                      fontWeight: 600, color: '#718096',
                                      background: '#f7fafc', outline: 'none', width: '100%',
                                      boxSizing: 'border-box' as const,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            <button
                              onClick={handleEntregar}
                              disabled={
                                actionLoading ||
                                (metodo === 'EFECTIVO' && (montoRecibido === '' || parseFloat(montoRecibido) < servicio.total))
                              }
                              style={{
                                padding: '12px 24px', border: 'none', borderRadius: 10, cursor: 'pointer',
                                background: 'linear-gradient(135deg, #38a169, #276749)',
                                color: '#fff', fontWeight: 700, fontSize: 14,
                                display: 'flex', alignItems: 'center', gap: 8,
                                whiteSpace: 'nowrap' as const,
                                opacity: (metodo === 'EFECTIVO' && (montoRecibido === '' || parseFloat(montoRecibido) < servicio.total)) ? 0.5 : 1,
                                alignSelf: 'flex-end' as const,
                              }}
                            >
                              {actionLoading ? <Loader2 size={15} className="icon-spin" /> : <CreditCard size={15} />}
                              Cobrar y entregar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── LISTO (sin permisos de cajero) ── */}
                      {servicio.status === 'LISTO' && !isCajero && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#276749', fontSize: 13 }}>
                          <CheckCircle size={15} /> Moto entregada al área de caja — esperando cobro.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Servicio ya entregado */}
                {servicio.status === 'ENTREGADO' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                    padding: '12px 16px', borderRadius: 12,
                    background: '#faf5ff', border: '1.5px solid #d6bcfa',
                    fontSize: 13, color: '#553c9a', fontWeight: 600,
                  }}>
                    <span style={{ fontSize: 20 }}>🏁</span>
                    Servicio entregado el {fmtDate(servicio.fecha_entrega)} — orden cerrada.
                  </div>
                )}

                {/* ── Mini info: mecánico + fecha ── */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 14 }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: servicio.pago_status === 'PAGADO' ? '#f0fff4' : '#fffbeb',
                    border: `1px solid ${servicio.pago_status === 'PAGADO' ? '#9ae6b4' : '#fbd38d'}`,
                    color: servicio.pago_status === 'PAGADO' ? '#276749' : '#975a16',
                    borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                  }}>
                    <CreditCard size={11} />
                    {servicio.pago_status === 'PAGADO' ? 'Pagado' : 'Pendiente de pago'}
                  </span>

                  {servicio.mecanico_nombre ? (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: '#ebf8ff', border: '1px solid #bee3f8',
                      color: '#2b6cb0', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500,
                    }}>
                      <Wrench size={11} /> {servicio.mecanico_nombre}
                    </span>
                  ) : (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: '#f7fafc', border: '1px solid #e2e8f0',
                      color: '#a0aec0', borderRadius: 20, padding: '4px 12px', fontSize: 12,
                    }}>
                      <Wrench size={11} /> Sin mecánico
                    </span>
                  )}

                  <span style={{
                    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, color: '#a0aec0',
                  }}>
                    <Clock size={11} /> {fmtDateTime(servicio.fecha_recepcion)}
                  </span>
                </div>

                {/* ── Moto + Cliente ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={card}>
                    <div style={cardHdr}>
                      <div style={ic('#ebf8ff')}><Bike size={12} color="#3182ce" /></div>
                      <span style={cardTitle}>Motocicleta</span>
                    </div>
                    <InfoField label="Vehículo" value={servicio.moto_display} />
                    <InfoField label="No. de serie" value={servicio.moto.numero_serie} />
                    <InfoField label="Placa" value={servicio.moto.placa} />
                    <InfoField label="Color" value={(servicio.moto as any).color} />
                  </div>
                  <div style={card}>
                    <div style={cardHdr}>
                      <div style={ic('#faf5ff')}><User size={12} color="#805ad5" /></div>
                      <span style={cardTitle}>Cliente</span>
                    </div>
                    <InfoField label="Nombre" value={servicio.cliente_nombre || 'Público general'} />
                    <InfoField label="Correo" value={(servicio as any).cliente_email} />
                    <InfoField label="Cajero" value={servicio.cajero_nombre} />
                    <InfoField label="Entrega est." value={fmtDate(servicio.fecha_entrega_estimada)} />
                  </div>
                </div>

                {/* ── Link de seguimiento para el cliente ── */}
                {(servicio as any).tracking_token && isCajero && (
                  <div style={{
                    border: '1px solid #bee3f8', borderRadius: 12,
                    padding: '14px 16px', marginBottom: 12,
                    background: 'linear-gradient(135deg, #ebf8ff, #e6f7ff)',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #bee3f8',
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', background: '#bee3f8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        🔗
                      </div>
                      <span style={{
                        fontWeight: 700, fontSize: 11, color: '#2b6cb0',
                        textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                      }}>
                        Link de seguimiento para el cliente
                      </span>
                    </div>

                    {/* URL visible */}
                    <div style={{
                      background: '#fff', border: '1px solid #bee3f8', borderRadius: 8,
                      padding: '8px 12px', marginBottom: 10,
                      fontSize: 11, color: '#2c5282', fontFamily: 'monospace',
                      wordBreak: 'break-all' as const, lineHeight: 1.5,
                    }}>
                      {`${window.location.protocol}//${window.location.hostname}:5174/seguimiento/${(servicio as any).tracking_token}`}
                    </div>

                    {/* Botón copiar */}
                    <button
                      onClick={handleCopiarLink}
                      style={{
                        width: '100%', padding: '9px', border: 'none', borderRadius: 8,
                        background: copiado ? '#38a169' : '#3182ce',
                        color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'background 0.2s',
                      }}
                    >
                      {copiado ? '✅ Link copiado' : '📋 Copiar link para el cliente'}
                    </button>

                    <p style={{ margin: '8px 0 0', fontSize: 11, color: '#4a90c4', textAlign: 'center' as const }}>
                      Comparte este link por WhatsApp o mensaje — no requiere login
                    </p>
                  </div>
                )}

                {/* ── Descripción ── */}
                <div style={card}>
                  <div style={cardHdr}>
                    <div style={ic('#fffaf0')}><FileText size={12} color="#dd6b20" /></div>
                    <span style={cardTitle}>Descripción del servicio</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#2d3748', margin: 0, lineHeight: 1.6 }}>
                    {servicio.descripcion_problema || '—'}
                  </p>
                  {servicio.notas_internas && (
                    <div style={{
                      marginTop: 10, padding: '8px 12px', borderRadius: 8,
                      background: '#f7fafc', borderLeft: '3px solid #cbd5e0',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', letterSpacing: '0.06em', marginBottom: 2 }}>NOTAS INTERNAS</div>
                      <p style={{ fontSize: 12, color: '#4a5568', margin: 0 }}>{servicio.notas_internas}</p>
                    </div>
                  )}
                </div>

                {/* ── Checklist ── */}
                {servicio.checklist_recepcion?.length > 0 && (
                  <div style={card}>
                    <div style={cardHdr}>
                      <div style={ic('#fffaf0')}><CheckSquare size={12} color="#dd6b20" /></div>
                      <span style={cardTitle}>Checklist de recepción</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#975a16', background: '#fffbeb', border: '1px solid #fbd38d', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
                        {servicio.checklist_recepcion.length} ítems
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                      {servicio.checklist_recepcion.map((item, i) => (
                        <span key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          background: '#fffaf0', border: '1px solid #fbd38d',
                          borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#975a16', fontWeight: 500,
                        }}>
                          <CheckCircle size={10} color="#dd6b20" /> {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Imágenes ── */}
                {(() => {
                  const puedeEditar = servicio.status === 'RECIBIDO' && isCajero;
                  const hayFotos    = (servicio.imagenes?.length ?? 0) > 0;

                  if (!hayFotos && !puedeEditar) return null;

                  const handleSubir = async (files: FileList | null) => {
                    if (!files || files.length === 0) return;
                    const archivos = Array.from(files).filter(f => f.type.startsWith('image/'));
                    const totalActual = servicio.imagenes?.length ?? 0;
                    const espacio = 8 - totalActual;
                    if (espacio <= 0) { setErrorFotos('Límite de 8 fotos alcanzado.'); return; }
                    const aSubir = archivos.slice(0, espacio);
                    setErrorFotos('');
                    setSubiendoFotos(true);
                    try {
                      await tallerService.subirImagenes(servicioId, aSubir);
                      await load();
                      onUpdated();
                    } catch {
                      setErrorFotos('Error al subir las fotos. Intenta de nuevo.');
                    } finally {
                      setSubiendoFotos(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  };

                  const handleEliminar = async (imgId: number) => {
                    setErrorFotos('');
                    setEliminandoId(imgId);
                    try {
                      await tallerService.eliminarImagen(servicioId, imgId);
                      await load();
                      onUpdated();
                    } catch {
                      setErrorFotos('No se pudo eliminar la foto.');
                    } finally {
                      setEliminandoId(null);
                    }
                  };

                  return (
                    <div style={card}>
                      <div style={cardHdr}>
                        <div style={ic('#f0f4ff')}><Camera size={12} color="#4c51bf" /></div>
                        <span style={cardTitle}>Evidencia fotográfica</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#4c51bf', background: '#ebf4ff', border: '1px solid #a3bffa', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
                          {servicio.imagenes?.length ?? 0}/8 fotos
                        </span>
                      </div>

                      {/* Miniaturas */}
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: puedeEditar ? 12 : 0 }}>
                        {(servicio.imagenes ?? []).map(img => (
                          <div
                            key={img.id}
                            style={{
                              position: 'relative', width: 72, height: 72,
                              borderRadius: 8, overflow: 'hidden',
                              border: '2px solid #e2e8f0',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={img.imagen_url}
                              alt="evidencia"
                              onClick={() => setImgAmpliada(img.imagen_url)}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in', display: 'block' }}
                            />
                            {/* Botón eliminar solo en modo edición */}
                            {puedeEditar && (
                              <button
                                onClick={() => handleEliminar(img.id)}
                                disabled={eliminandoId === img.id}
                                title="Eliminar foto"
                                style={{
                                  position: 'absolute', top: 3, right: 3,
                                  width: 20, height: 20, borderRadius: '50%',
                                  background: eliminandoId === img.id ? '#a0aec0' : '#e53e3e',
                                  border: 'none', color: '#fff',
                                  fontSize: 10, fontWeight: 700, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  lineHeight: 1, padding: 0,
                                  boxShadow: '0 1px 4px rgba(0,0,0,.3)',
                                }}
                              >
                                {eliminandoId === img.id ? '…' : '✕'}
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Placeholder "agregar" si hay espacio */}
                        {puedeEditar && (servicio.imagenes?.length ?? 0) < 8 && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={subiendoFotos}
                            title="Agregar fotos"
                            style={{
                              width: 72, height: 72, borderRadius: 8,
                              border: '2px dashed #a3bffa',
                              background: subiendoFotos ? '#f7fafc' : '#f0f4ff',
                              cursor: subiendoFotos ? 'wait' : 'pointer',
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center',
                              gap: 3, color: '#4c51bf', fontSize: 10, fontWeight: 600,
                              flexShrink: 0, transition: 'background 0.15s',
                            }}
                          >
                            {subiendoFotos ? <Loader2 size={18} className="icon-spin" /> : <><Camera size={18} /><span>Agregar</span></>}
                          </button>
                        )}
                      </div>

                      {/* Input oculto */}
                      {puedeEditar && (
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: 'none' }}
                          onChange={e => handleSubir(e.target.files)}
                        />
                      )}

                      {/* Mensaje de error */}
                      {errorFotos && (
                        <div style={{
                          marginTop: 8, padding: '7px 12px', borderRadius: 8,
                          background: '#fff5f5', border: '1px solid #fed7d7',
                          fontSize: 12, color: '#c53030', display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <AlertTriangle size={13} /> {errorFotos}
                        </div>
                      )}

                      {/* Aviso si no hay fotos y se puede editar */}
                      {hayFotos === false && puedeEditar && !errorFotos && (
                        <p style={{ fontSize: 12, color: '#a0aec0', margin: 0, fontStyle: 'italic' }}>
                          No hay fotos de evidencia. Toca "Agregar" para subir imágenes.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* ── Ítems ── */}
                {servicio.items.length > 0 && (
                  <div style={card}>
                    <div style={cardHdr}>
                      <div style={ic('#f0fff4')}><Package size={12} color="#38a169" /></div>
                      <span style={cardTitle}>Ítems del servicio</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f7fafc' }}>
                          {['Descripción', 'Tipo', 'Cant.', 'P. Unit.', 'Subtotal'].map((h, i) => (
                            <th key={h} style={{
                              padding: '7px 10px', color: '#718096', fontWeight: 600, fontSize: 11,
                              borderBottom: '1px solid #e2e8f0',
                              textAlign: i === 0 ? 'left' : i === 1 ? 'center' : 'right',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {servicio.items.map((item, idx) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f0f4f8', background: idx % 2 ? '#fafafa' : '#fff' }}>
                            <td style={{ padding: '7px 10px', color: '#2d3748', fontWeight: 500 }}>{item.producto_nombre ?? item.descripcion}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                                background: item.tipo === 'REFACCION' ? '#ebf8ff' : item.tipo === 'MANO_OBRA' ? '#faf5ff' : '#fffbeb',
                                color:      item.tipo === 'REFACCION' ? '#2b6cb0' : item.tipo === 'MANO_OBRA' ? '#553c9a' : '#975a16',
                              }}>{item.tipo_display}</span>
                            </td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', color: '#4a5568' }}>{item.cantidad}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', color: '#4a5568' }}>{fmt(item.precio_unitario)}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#2d3748' }}>{fmt(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ══ SECCIONES EN_DIAGNOSTICO ════════════════════════════════ */}
                {servicio.status === 'EN_DIAGNOSTICO' && (
                  <>
                    {/* ── 1. Diagnóstico del mecánico ── */}
                    <div style={{
                      ...card,
                      borderColor: '#d6bcfa',
                      background: '#faf5ff',
                    }}>
                      <div style={cardHdr}>
                        <div style={ic('#ede9fe')}><FileText size={12} color="#6b46c1" /></div>
                        <span style={{ ...cardTitle, color: '#6b46c1' }}>Diagnóstico del mecánico</span>
                        {(guardandoDiag) && (
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b46c1', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Loader2 size={11} className="icon-spin" /> Guardando…
                          </span>
                        )}
                        {savedDiag && !guardandoDiag && (
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#276749', fontWeight: 700 }}>
                            Guardado ✓
                          </span>
                        )}
                      </div>
                      {(isMecanico || isJefe) ? (
                        <textarea
                          value={diagVal}
                          onChange={e => setDiagVal(e.target.value)}
                          onBlur={handleBlurDiag}
                          rows={4}
                          placeholder="Describe el diagnóstico de la motocicleta…"
                          style={{
                            width: '100%', boxSizing: 'border-box' as const,
                            padding: '10px 12px', borderRadius: 8,
                            border: '1.5px solid #d6bcfa', background: '#fff',
                            fontSize: 13, color: '#2d3748', resize: 'vertical' as const,
                            fontFamily: 'inherit', lineHeight: 1.6, outline: 'none',
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#9f7aea'; }}
                          onBlurCapture={e => { e.currentTarget.style.borderColor = '#d6bcfa'; }}
                        />
                      ) : (
                        <div style={{
                          padding: '10px 12px', borderRadius: 8,
                          border: '1.5px solid #d6bcfa', background: '#fff',
                          fontSize: 13, color: diagVal ? '#2d3748' : '#a0aec0',
                          minHeight: 72, lineHeight: 1.6, whiteSpace: 'pre-wrap' as const,
                        }}>
                          {diagVal || 'Sin diagnóstico registrado aún.'}
                        </div>
                      )}
                    </div>

                    {/* ── 2. Refacciones requeridas ── */}
                    <div style={{
                      ...card,
                      borderColor: '#d6bcfa',
                      background: '#faf5ff',
                    }}>
                      <div style={cardHdr}>
                        <div style={ic('#ede9fe')}><Package size={12} color="#6b46c1" /></div>
                        <span style={{ ...cardTitle, color: '#6b46c1' }}>Refacciones requeridas</span>
                        {guardandoRefac && (
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b46c1', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Loader2 size={11} className="icon-spin" /> Guardando…
                          </span>
                        )}
                        {savedRefac && !guardandoRefac && (
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#276749', fontWeight: 700 }}>
                            Guardado ✓
                          </span>
                        )}
                      </div>
                      {(isMecanico || isJefe) ? (
                        <textarea
                          value={refacVal}
                          onChange={e => setRefacVal(e.target.value)}
                          onBlur={handleBlurRefac}
                          rows={3}
                          placeholder="Ej: filtro de aceite, bujía, cadena de transmisión..."
                          style={{
                            width: '100%', boxSizing: 'border-box' as const,
                            padding: '10px 12px', borderRadius: 8,
                            border: '1.5px solid #d6bcfa', background: '#fff',
                            fontSize: 13, color: '#2d3748', resize: 'vertical' as const,
                            fontFamily: 'inherit', lineHeight: 1.6, outline: 'none',
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#9f7aea'; }}
                          onBlurCapture={e => { e.currentTarget.style.borderColor = '#d6bcfa'; }}
                        />
                      ) : (
                        <div style={{
                          padding: '10px 12px', borderRadius: 8,
                          border: '1.5px solid #d6bcfa', background: '#fff',
                          fontSize: 13, color: refacVal ? '#2d3748' : '#a0aec0',
                          minHeight: 56, lineHeight: 1.6, whiteSpace: 'pre-wrap' as const,
                        }}>
                          {refacVal || 'Sin refacciones registradas aún.'}
                        </div>
                      )}
                    </div>

                    {/* ── 3. Botones Autorizar / Rechazar (solo cajero/encargado/admin) ── */}
                    {isCajero && (
                      <div style={{
                        border: '1.5px solid #9ae6b4',
                        borderRadius: 14, marginBottom: 12, overflow: 'hidden',
                        boxShadow: '0 2px 12px rgba(39,103,73,0.08)',
                      }}>
                        <div style={{
                          padding: '10px 16px',
                          background: 'linear-gradient(90deg, #276749, #38a169)',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <CheckCircle size={14} color="rgba(255,255,255,0.85)" />
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>
                            Decisión del diagnóstico
                          </span>
                        </div>
                        <div style={{ padding: '16px 18px', background: '#f0fff4' }}>
                          <p style={{ fontSize: 13, color: '#276749', margin: '0 0 14px', fontWeight: 500 }}>
                            Revisa el diagnóstico del mecánico y comunica la decisión del cliente:
                          </p>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button
                              onClick={handleAutorizar}
                              disabled={actionLoading}
                              style={{
                                flex: 1, padding: '13px 14px', border: 'none', borderRadius: 10,
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                background: actionLoading ? '#c6f6d5' : 'linear-gradient(135deg, #38a169, #276749)',
                                color: '#fff', fontWeight: 700, fontSize: 14,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(39,103,73,0.25)',
                              }}
                            >
                              {actionLoading ? <Loader2 size={15} className="icon-spin" /> : null}
                              ✅ Autorizar diagnóstico
                            </button>
                            <button
                              onClick={handleCancelar}
                              disabled={actionLoading}
                              style={{
                                flex: 1, padding: '13px 14px', border: 'none', borderRadius: 10,
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                background: actionLoading ? '#fed7d7' : 'linear-gradient(135deg, #e53e3e, #c53030)',
                                color: '#fff', fontWeight: 700, fontSize: 14,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(197,48,48,0.25)',
                              }}
                            >
                              {actionLoading ? <Loader2 size={15} className="icon-spin" /> : null}
                              ❌ Rechazar / Cancelar orden
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── Cotización Extra ── */}
                {servicio.solicitudes_extra.length > 0 && (
                  <div style={{ ...card, borderColor: '#fbd38d', background: '#fffbeb' }}>
                    <div style={cardHdr}>
                      <div style={ic('#feebc8')}><AlertTriangle size={12} color="#c05621" /></div>
                      <span style={{ ...cardTitle, color: '#c05621' }}>Cotización Extra</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#975a16', background: '#feebc8', border: '1px solid #fbd38d', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
                        {servicio.solicitudes_extra.length} solicitud{servicio.solicitudes_extra.length > 1 ? 'es' : ''}
                      </span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#feebc8' }}>
                          {['Producto', 'Cant.', 'Motivo', 'Solicitado por', 'Estado'].map((h, i) => (
                            <th key={h} style={{
                              padding: '6px 10px', color: '#7b341e', fontWeight: 700, fontSize: 11,
                              borderBottom: '1px solid #fbd38d',
                              textAlign: (i === 2 ? 'left' : i < 2 ? 'left' : 'center') as const,
                            }}>{h}</th>
                          ))}
                          {isCajero && <th style={{ padding: '6px 10px', color: '#7b341e', fontWeight: 700, fontSize: 11, borderBottom: '1px solid #fbd38d', textAlign: 'center' as const }}>Acción</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {servicio.solicitudes_extra.map((sol, idx) => {
                          const statusBadge: Record<string, { bg: string; color: string; border: string }> = {
                            PENDIENTE: { bg: '#fffbeb', color: '#975a16', border: '#fbd38d' },
                            APROBADA:  { bg: '#f0fff4', color: '#276749', border: '#9ae6b4' },
                            RECHAZADA: { bg: '#fff5f5', color: '#c53030', border: '#fed7d7' },
                          };
                          const badge = statusBadge[sol.status] ?? statusBadge.PENDIENTE;
                          return (
                            <tr key={sol.id} style={{ borderBottom: '1px solid #feebc8', background: idx % 2 ? '#fffdf5' : '#fff' }}>
                              <td style={{ padding: '8px 10px', color: '#2d3748', fontWeight: 600 }}>{sol.producto_nombre}</td>
                              <td style={{ padding: '8px 10px', color: '#4a5568' }}>{sol.cantidad}</td>
                              <td style={{ padding: '8px 10px', color: '#718096', maxWidth: 160 }}>{sol.motivo || '—'}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' as const, color: '#4a5568', fontSize: 12 }}>{sol.mecanico_nombre}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' as const }}>
                                <span style={{
                                  display: 'inline-block',
                                  fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 10,
                                  background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                                }}>{sol.status_display}</span>
                              </td>
                              {isCajero && (
                                <td style={{ padding: '8px 10px', textAlign: 'center' as const }}>
                                  {sol.status === 'PENDIENTE' ? (
                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                      <button onClick={() => handleAprobar(sol)} disabled={actionLoading}
                                        style={{ background: '#f0fff4', border: '1px solid #9ae6b4', color: '#276749', padding: '3px 10px', borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                                        ✓ Aprobar
                                      </button>
                                      <button onClick={() => handleRechazar(sol)} disabled={actionLoading}
                                        style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', padding: '3px 10px', borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                                        ✗ Rechazar
                                      </button>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: 11, color: '#a0aec0' }}>—</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Resumen financiero ── */}
                {(() => {
                  const extrasTotal = servicio.items
                    .filter(it => it.tipo === 'EXTRA')
                    .reduce((acc, it) => acc + Number(it.subtotal), 0);
                  const hasExtras = extrasTotal > 0;
                  const cols = hasExtras ? 4 : 3;
                  return (
                    <div style={{
                      ...card,
                      background: 'linear-gradient(135deg, #f7fafc, #edf2f7)',
                      borderColor: '#cbd5e0',
                    }}>
                      <div style={cardHdr}>
                        <div style={ic('#e6fffa')}><DollarSign size={12} color="#2c7a7b" /></div>
                        <span style={cardTitle}>Resumen financiero</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                        <div style={{ padding: '8px 14px', textAlign: 'center' as const, borderRight: '1px solid #cbd5e0' }}>
                          <div style={{ fontSize: 10, color: '#718096', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 4 }}>💪 Mano de obra</div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: '#2d3748' }}>{fmt(servicio.mano_de_obra)}</div>
                        </div>
                        <div style={{ padding: '8px 14px', textAlign: 'center' as const, borderRight: '1px solid #cbd5e0' }}>
                          <div style={{ fontSize: 10, color: '#718096', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 4 }}>🔩 Refacciones</div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: '#2d3748' }}>{fmt(servicio.total_refacciones)}</div>
                        </div>
                        {hasExtras && (
                          <div style={{ padding: '8px 14px', textAlign: 'center' as const, borderRight: '1px solid #cbd5e0' }}>
                            <div style={{ fontSize: 10, color: '#975a16', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 4 }}>➕ Extras aprobados</div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: '#975a16' }}>{fmt(extrasTotal)}</div>
                          </div>
                        )}
                        <div style={{ padding: '8px 14px', textAlign: 'center' as const, background: 'rgba(255,255,255,0.7)', borderRadius: '0 8px 8px 0' }}>
                          <div style={{ fontSize: 10, color: '#718096', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 4 }}>Total</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>{fmt(servicio.total)}</div>
                        </div>
                      </div>
                      {servicio.pago_status === 'PAGADO' && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 16, justifyContent: 'flex-end', fontSize: 12, color: '#4a5568' }}>
                          <span>Método: <strong>{servicio.metodo_pago ?? '—'}</strong></span>
                          {servicio.monto_pagado && <span>Pagado: <strong>{fmt(servicio.monto_pagado)}</strong></span>}
                          {servicio.cambio && Number(servicio.cambio) > 0 && <span>Cambio: <strong>{fmt(servicio.cambio)}</strong></span>}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── Timeline ── */}
                {(servicio.fecha_inicio || servicio.fecha_listo || servicio.fecha_entrega) && (
                  <div style={card}>
                    <div style={cardHdr}>
                      <div style={ic('#ebf8ff')}><Clock size={12} color="#3182ce" /></div>
                      <span style={cardTitle}>Línea de tiempo</span>
                    </div>
                    <div style={{ display: 'flex' }}>
                      {[
                        { label: 'Recibida',   date: servicio.fecha_recepcion, done: true },
                        { label: 'En proceso', date: servicio.fecha_inicio,    done: !!servicio.fecha_inicio },
                        { label: 'Lista',      date: servicio.fecha_listo,     done: !!servicio.fecha_listo },
                        { label: 'Entregada',  date: servicio.fecha_entrega,   done: !!servicio.fecha_entrega },
                      ].map((st, i, arr) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <div style={{ flex: 1, textAlign: 'center' as const }}>
                            <div style={{
                              width: 26, height: 26, borderRadius: '50%', margin: '0 auto 5px',
                              background: st.done ? '#3182ce' : '#e2e8f0',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <CheckCircle size={12} color={st.done ? '#fff' : '#a0aec0'} />
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: st.done ? '#2b6cb0' : '#a0aec0' }}>{st.label}</div>
                            <div style={{ fontSize: 10, color: '#a0aec0', marginTop: 1 }}>{fmtDate(st.date)}</div>
                          </div>
                          {i < arr.length - 1 && <ChevronRight size={13} color={st.done ? '#3182ce' : '#e2e8f0'} style={{ flexShrink: 0 }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {imgAmpliada && (
        <div onClick={() => setImgAmpliada(null)} style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
        }}>
          <img src={imgAmpliada} alt="ampliada" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }} />
          <button onClick={() => setImgAmpliada(null)} style={{
            position: 'absolute', top: 20, right: 24,
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
            color: '#fff', width: 38, height: 38, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>✕</button>
        </div>
      )}
    </>
  );
};

export default ServicioDetalleModal;
