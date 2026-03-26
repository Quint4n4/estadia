import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { customersService } from '../api/customers.service';
import type { SeguimientoData } from '../types/customer.types';

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonBlock: React.FC<{ height?: number; width?: string; borderRadius?: number }> = ({
  height = 20,
  width = '100%',
  borderRadius = 6,
}) => (
  <div
    style={{
      height,
      width,
      borderRadius,
      background: 'linear-gradient(90deg, #e2e8f0 25%, #edf2f7 50%, #e2e8f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }}
  />
);

// ── Pulse animation style (injected once) ────────────────────────────────────
const GlobalStyles: React.FC = () => (
  <style>{`
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: .85; }
    }
  `}</style>
);

// ── Timeline ──────────────────────────────────────────────────────────────────
const Timeline: React.FC<{ steps: SeguimientoData['timeline'] }> = ({ steps }) => (
  <div>
    {steps.map((step, i) => (
      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 0 }}>
        {/* Icono + línea */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: step.completado ? '#38a169' : step.activo ? '#ed8936' : '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: step.completado || step.activo ? '#fff' : '#a0aec0',
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {step.completado ? '✓' : step.activo ? '●' : '○'}
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                width: 2,
                flex: 1,
                minHeight: 20,
                background: step.completado ? '#38a169' : '#e2e8f0',
                marginTop: 4,
              }}
            />
          )}
        </div>
        {/* Texto */}
        <div style={{ paddingBottom: 16 }}>
          <p
            style={{
              margin: 0,
              fontWeight: step.activo ? 700 : 600,
              fontSize: 14,
              color: step.activo ? '#ed8936' : step.completado ? '#2d3748' : '#a0aec0',
            }}
          >
            {step.label}
          </p>
          {step.fecha && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#718096' }}>
              {new Date(step.fecha).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>
    ))}
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const SeguimientoPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData]       = useState<SeguimientoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const loadSeguimiento = useCallback(async () => {
    if (!token) return;
    try {
      const res = await customersService.getSeguimiento(token);
      if (res.success) {
        setData(res.data);
        setError(null);
      } else {
        setError('No se encontró la orden de servicio.');
      }
    } catch {
      setError('No se encontró la orden o el enlace ha expirado.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Carga inicial
  useEffect(() => {
    loadSeguimiento();
  }, [loadSeguimiento]);

  // Polling cada 90 s (se detiene si status es ENTREGADO)
  useEffect(() => {
    if (!data || data.status === 'ENTREGADO') return;
    const interval = setInterval(() => { loadSeguimiento(); }, 90_000);
    return () => clearInterval(interval);
  }, [data?.status, loadSeguimiento]);

  const isListo = data?.status === 'LISTO' || data?.status === 'LISTA_PARA_ENTREGAR';

  // ── Estilos compartidos ────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,.07)',
    padding: 20,
    marginBottom: 12,
  };

  const pageWrap: React.CSSProperties = {
    minHeight: '100dvh',
    background: '#f7fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  const contentWrap: React.CSSProperties = {
    maxWidth: 480,
    margin: '0 auto',
    padding: '16px 16px 40px',
  };

  // ── Render: error ──────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <div style={pageWrap}>
        <GlobalStyles />
        {/* Header */}
        <header style={{ background: '#1a202c', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🦊</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>MotoQFox</span>
        </header>
        <div style={contentWrap}>
          <div style={{ ...card, textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 700, fontSize: 18, color: '#2d3748', margin: '0 0 8px' }}>
              Orden no encontrada
            </p>
            <p style={{ color: '#718096', fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: loading skeleton ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={pageWrap}>
        <GlobalStyles />
        <header style={{ background: '#1a202c', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🦊</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>MotoQFox</span>
        </header>
        <div style={contentWrap}>
          <div style={card}>
            <SkeletonBlock height={22} width="60%" />
            <div style={{ marginTop: 10 }}><SkeletonBlock height={16} width="45%" /></div>
            <div style={{ marginTop: 8 }}><SkeletonBlock height={16} width="55%" /></div>
          </div>
          <div style={card}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <SkeletonBlock height={28} width="28px" borderRadius={50} />
                <div style={{ flex: 1 }}>
                  <SkeletonBlock height={14} width="60%" />
                  <div style={{ marginTop: 6 }}><SkeletonBlock height={12} width="40%" /></div>
                </div>
              </div>
            ))}
          </div>
          <div style={card}>
            <SkeletonBlock height={16} width="50%" />
            <div style={{ marginTop: 8 }}><SkeletonBlock height={16} width="50%" /></div>
            <div style={{ marginTop: 8 }}><SkeletonBlock height={16} width="40%" /></div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: datos ──────────────────────────────────────────────────────────
  if (!data) return null;

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtMoney = (val: string) =>
    parseFloat(val).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <div style={pageWrap}>
      <GlobalStyles />

      {/* ── Header ── */}
      <header style={{ background: '#1a202c', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>🦊</span>
        <div>
          <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>MotoQFox</p>
          <p style={{ margin: 0, color: '#a0aec0', fontSize: 12 }}>Seguimiento de orden</p>
        </div>
      </header>

      <div style={contentWrap}>

        {/* ── Card moto ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 32, lineHeight: 1 }}>🏍️</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 17, color: '#1a202c' }}>
                {data.moto_display}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#718096' }}>
                Folio: <strong style={{ color: '#3182ce' }}>{data.folio}</strong>
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#718096', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>📍</span> {data.sede_nombre}
              </p>
            </div>
          </div>
        </div>

        {/* Alerta especial: diagnóstico listo, esperando autorización del cliente */}
        {data.diagnostico_listo && data.status === 'EN_DIAGNOSTICO' && (
          <div style={{
            background: 'linear-gradient(135deg, #ebf8ff, #e6f7ff)',
            border: '2px solid #90cdf4',
            borderRadius: 14,
            padding: '18px 20px',
            marginBottom: 12,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>📋</span>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#2b6cb0' }}>
                  ¡El diagnóstico está listo!
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#3182ce' }}>
                  El taller se comunicará contigo para informarte el costo y pedir tu autorización.
                </p>
              </div>
            </div>
            <div style={{
              background: '#fff', borderRadius: 8, padding: '10px 14px',
              fontSize: 12, color: '#4a5568', lineHeight: 1.6,
            }}>
              ⚠️ <strong>Nota importante:</strong> La reparación <strong>no iniciará</strong> hasta que tú la autorices.
              Si decides no proceder, el taller te informará los próximos pasos.
            </div>
          </div>
        )}

        {/* ── Banner LISTO ── */}
        {isListo && (
          <div
            style={{
              background: 'linear-gradient(135deg, #38a169, #276749)',
              borderRadius: 16,
              padding: '20px',
              marginBottom: 12,
              textAlign: 'center',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: 28 }}>🎉</p>
            <p style={{ margin: '0 0 4px', color: '#fff', fontWeight: 700, fontSize: 18 }}>
              ¡Tu moto está lista!
            </p>
            <p style={{ margin: 0, color: '#c6f6d5', fontSize: 14 }}>
              Pasa a recogerla a {data.sede_nombre}
            </p>
          </div>
        )}

        {/* ── Timeline ── */}
        <div style={card}>
          <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 15, color: '#2d3748' }}>
            Estado del servicio
          </p>
          <Timeline steps={data.timeline} />
        </div>

        {/* ── Alerta extra pendiente ── */}
        {data.tiene_extra_pendiente && (
          <div
            style={{
              ...card,
              background: '#fffbeb',
              border: '1px solid #f6e05e',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: '#744210' }}>
                  Se encontró una falla adicional
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#975a16' }}>
                  Consulta con el personal en caja para más detalles.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Info adicional ── */}
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 15, color: '#2d3748' }}>
            Información del servicio
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.fecha_entrega_estimada && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: '#718096' }}>Entrega estimada</p>
                  <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#2d3748' }}>
                    {fmtDate(data.fecha_entrega_estimada)}
                  </p>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16 }}>📝</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#718096' }}>Descripción del problema</p>
                <p style={{ margin: '2px 0 0', fontSize: 14, color: '#2d3748' }}>
                  {data.descripcion}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16 }}>🔧</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#718096' }}>Fecha de recepción</p>
                <p style={{ margin: '2px 0 0', fontSize: 14, color: '#2d3748' }}>
                  {fmtDate(data.fecha_recepcion)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Resumen de costos ── */}
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 15, color: '#2d3748' }}>
            Resumen de costos
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: '#718096' }}>Mano de obra</span>
              <span style={{ fontSize: 14, color: '#2d3748', fontWeight: 500 }}>
                {fmtMoney(data.mano_de_obra)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: '#718096' }}>Refacciones</span>
              <span style={{ fontSize: 14, color: '#2d3748', fontWeight: 500 }}>
                {fmtMoney(data.total_refacciones)}
              </span>
            </div>
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: 8,
                marginTop: 4,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a202c' }}>Total</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a202c' }}>
                {fmtMoney(data.total)}
              </span>
            </div>
            <div
              style={{
                marginTop: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13, color: '#718096' }}>Estado de pago</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: data.pago_status === 'PAGADO' ? '#c6f6d5' : '#fed7aa',
                  color: data.pago_status === 'PAGADO' ? '#276749' : '#9c4221',
                }}
              >
                {data.pago_status_display}
              </span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#a0aec0', margin: '8px 0 0' }}>
          {data.status !== 'ENTREGADO'
            ? 'Se actualiza automáticamente cada 90 segundos'
            : 'Este servicio ha sido entregado'}
        </p>
      </div>
    </div>
  );
};

export default SeguimientoPage;
