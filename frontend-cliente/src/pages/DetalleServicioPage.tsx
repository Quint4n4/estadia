import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Circle, Clock } from 'lucide-react';
import { customersService } from '../api/customers.service';
import type { ServicioMotoCliente, ServicioStatus } from '../types/customer.types';

// ── Línea de tiempo ───────────────────────────────────────────────────────────

const STEPS: { status: ServicioStatus; label: string; desc: string }[] = [
  { status: 'RECIBIDO',         label: 'Moto recibida',        desc: 'Tu moto ingresó al taller.' },
  { status: 'EN_PROCESO',       label: 'En reparación',        desc: 'El mecánico está trabajando en tu moto.' },
  { status: 'COTIZACION_EXTRA', label: 'Piezas adicionales',   desc: 'El taller necesita piezas extra. Consulta con caja.' },
  { status: 'LISTO',            label: '¡Lista para recoger!', desc: 'Tu moto está lista. Pasa a recogerla.' },
  { status: 'ENTREGADO',        label: 'Entregada',            desc: 'Servicio completado. ¡Gracias!' },
];

const ORDER: ServicioStatus[] = ['RECIBIDO', 'EN_PROCESO', 'COTIZACION_EXTRA', 'LISTO', 'ENTREGADO'];

// Obtiene índice del estado actual (COTIZACION_EXTRA no bloquea el avance visual)
const getStepIndex = (status: ServicioStatus): number => ORDER.indexOf(status);

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: string | number) =>
  Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const fmtDate = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ── Component ─────────────────────────────────────────────────────────────────

const DetalleServicioPage: React.FC = () => {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();
  const location  = useLocation();

  const [srv,     setSrv]     = useState<ServicioMotoCliente | null>(location.state?.srv ?? null);
  const [loading, setLoading] = useState(!location.state?.srv);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (srv) return; // ya tenemos datos del state
    customersService.getMiServicio(Number(id))
      .then(data => setSrv(data))
      .catch(() => setError('No se pudo cargar el servicio.'))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  if (loading) {
    return (
      <div className="screen">
        <div className="page-header">
          <button className="btn-icon" onClick={() => navigate('/taller')}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="page-title">Servicio</h1>
        </div>
        <div style={{ padding: '32px 20px', display: 'flex', justifyContent: 'center' }}>
          <span className="spinner" style={{ borderTopColor: 'var(--c-primary)' }} />
        </div>
      </div>
    );
  }

  if (error || !srv) {
    return (
      <div className="screen">
        <div className="page-header">
          <button className="btn-icon" onClick={() => navigate('/taller')}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="page-title">Servicio #{id}</h1>
        </div>
        <p style={{ padding: '24px 20px', color: 'var(--c-text-sec)' }}>
          {error || 'Servicio no encontrado.'}
        </p>
      </div>
    );
  }

  const currentIdx = getStepIndex(srv.status);

  return (
    <div className="screen">

      {/* Header */}
      <div className="page-header">
        <button className="btn-icon" onClick={() => navigate('/taller')}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="page-title">{srv.folio}</h1>
      </div>

      <div style={{ padding: '0 20px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Alerta si cotización pendiente */}
        {srv.tiene_extra_pendiente && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fbd38d',
            borderRadius: 12, padding: '12px 16px',
            fontSize: 14, color: '#744210',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 2 }}>Refacción adicional pendiente</p>
              <p style={{ fontSize: 13 }}>El mecánico necesita una pieza extra. Pasa a caja para aprobar o rechazar la cotización.</p>
            </div>
          </div>
        )}

        {/* Datos de la moto */}
        <div className="card" style={{ borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-dis)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Tu moto
          </p>
          <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-text)', marginBottom: 4 }}>
            {srv.moto_display}
          </p>
          {srv.moto.placa && (
            <p style={{ fontSize: 13, color: 'var(--c-text-sec)' }}>Placa: {srv.moto.placa}</p>
          )}
          <p style={{ fontSize: 13, color: 'var(--c-text-sec)', marginTop: 6 }}>
            📍 {srv.sede_nombre}
          </p>
          {srv.fecha_entrega_estimada && (
            <p style={{ fontSize: 13, color: 'var(--c-text-sec)', marginTop: 4 }}>
              📅 Entrega estimada: {new Date(srv.fecha_entrega_estimada).toLocaleDateString('es-MX', { day: '2-digit', month: 'long' })}
            </p>
          )}
        </div>

        {/* Línea de tiempo */}
        <div className="card" style={{ borderRadius: 14, padding: '16px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-dis)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Estado del servicio
          </p>

          {STEPS.map((step, idx) => {
            const done    = idx < currentIdx;
            const active  = idx === currentIdx;
            const pending = idx > currentIdx;

            // COTIZACION_EXTRA se muestra solo si es el estado actual
            if (step.status === 'COTIZACION_EXTRA' && !active) return null;

            return (
              <div key={step.status} style={{ display: 'flex', gap: 14, marginBottom: idx < STEPS.length - 1 ? 0 : 0 }}>

                {/* Línea vertical + ícono */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                  {done ? (
                    <CheckCircle size={22} color="var(--c-success)" fill="var(--c-success)" style={{ flexShrink: 0 }} />
                  ) : active ? (
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      border: `3px solid var(--c-primary)`,
                      background: 'var(--c-primary)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }} />
                    </div>
                  ) : (
                    <Circle size={22} color="var(--c-text-dis)" style={{ flexShrink: 0 }} />
                  )}
                  {/* Línea vertical (no en el último) */}
                  {idx < STEPS.filter(s => s.status !== 'COTIZACION_EXTRA' || active).length - 1 && (
                    <div style={{
                      width: 2, flex: 1, minHeight: 24,
                      background: done ? 'var(--c-success)' : '#e2e8f0',
                      margin: '3px 0',
                    }} />
                  )}
                </div>

                {/* Contenido del paso */}
                <div style={{ flex: 1, paddingBottom: 20 }}>
                  <p style={{
                    fontWeight:  active ? 700 : 500,
                    fontSize:    14,
                    color:       pending ? 'var(--c-text-dis)' : active ? 'var(--c-primary)' : 'var(--c-text)',
                    marginBottom: active ? 4 : 0,
                  }}>
                    {step.label}
                  </p>
                  {active && (
                    <p style={{ fontSize: 12, color: 'var(--c-text-sec)' }}>{step.desc}</p>
                  )}
                  {/* Fecha del paso si disponible */}
                  {done && (
                    <p style={{ fontSize: 11, color: 'var(--c-text-dis)', marginTop: 2 }}>
                      {step.status === 'RECIBIDO'   && fmtDate(srv.fecha_recepcion)}
                      {step.status === 'EN_PROCESO'  && fmtDate(srv.fecha_inicio)}
                      {step.status === 'LISTO'       && fmtDate(srv.fecha_listo)}
                      {step.status === 'ENTREGADO'   && fmtDate(srv.fecha_entrega)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Descripción del problema */}
        <div className="card" style={{ borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-dis)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Problema reportado
          </p>
          <p style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: 1.5 }}>
            {srv.descripcion_problema}
          </p>
        </div>

        {/* Resumen de costos */}
        <div className="card" style={{ borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-dis)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Resumen de costos
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--c-text-sec)' }}>Mano de obra</span>
              <span>{fmt(srv.mano_de_obra)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--c-text-sec)' }}>Refacciones</span>
              <span>{fmt(srv.total_refacciones)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              borderTop: '1px solid var(--c-border)', paddingTop: 10,
              fontWeight: 700, fontSize: 16,
            }}>
              <span>Total</span>
              <span style={{ color: 'var(--c-primary)' }}>{fmt(srv.total)}</span>
            </div>
          </div>

          {/* Estado de pago */}
          <div style={{
            marginTop: 12,
            background: srv.pago_status === 'PAGADO' ? '#f0fff4' : '#fffbeb',
            borderRadius: 8, padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
            color: srv.pago_status === 'PAGADO' ? 'var(--c-success)' : '#d69e2e',
            fontWeight: 600,
          }}>
            <Clock size={14} />
            {srv.pago_status_display}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DetalleServicioPage;
