import React, { useEffect, useState } from 'react';
import { CreditCard, Users, Clock, AlertCircle } from 'lucide-react';
import type { SedeResumenVentas } from '../../../types/sales.types';
import type { SedeSnapshot } from '../../../types/auth.types';

interface Props {
  sedes:   SedeSnapshot[];
  resumen: SedeResumenVentas[];
}

const ROLE_LABEL: Record<string, string> = {
  CASHIER:      'Cajero',
  WORKER:       'Trabajador',
  ENCARGADO:    'Encargado',
  MECANICO:     'Mecánico',
  JEFE_MECANICO:'Jefe Mec.',
  ADMINISTRATOR:'Admin',
};

const ROLE_COLOR: Record<string, string> = {
  CASHIER:      '#2b6cb0',
  WORKER:       '#744210',
  ENCARGADO:    '#276749',
  MECANICO:     '#553c9a',
  JEFE_MECANICO:'#97266d',
  ADMINISTRATOR:'#c53030',
};

const ROLE_BG: Record<string, string> = {
  CASHIER:      '#ebf8ff',
  WORKER:       '#fefcbf',
  ENCARGADO:    '#f0fff4',
  MECANICO:     '#faf5ff',
  JEFE_MECANICO:'#fff5f7',
  ADMINISTRATOR:'#fff5f5',
};

/** Returns "Xh Ym" from an ISO date string */
function elapsed(isoStr: string): string {
  const ms = Date.now() - new Date(isoStr).getTime();
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Auto-refresh every minute to keep elapsed times current */
function useMinuteTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}

const TurnosCajasPanel: React.FC<Props> = ({ sedes, resumen }) => {
  useMinuteTick();

  // Flatten cajas
  const cajas = resumen.flatMap(r =>
    r.cajas_abiertas.map(c => ({ ...c, sede_name: r.sede_name, sede_id: r.sede_id }))
  );

  // Flatten on-shift users
  const onShift = sedes.flatMap(s =>
    s.on_shift_users.map(u => ({ ...u, sede_name: s.name, sede_id: s.id }))
  );

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20,
      marginBottom: 20,
    }}>
      {/* ── Cajas abiertas ── */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(135deg,#2b6cb0,#2c5282)',
        }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={15} color="#fff" />
          </div>
          <div>
            <h4 style={{ color: '#fff', margin: 0, fontSize: 14, fontWeight: 700 }}>Cajas abiertas</h4>
            <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: 11 }}>{cajas.length} activa{cajas.length !== 1 ? 's' : ''} ahora</p>
          </div>
        </div>

        <div style={{ padding: '12px 0', maxHeight: 280, overflowY: 'auto' }}>
          {cajas.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#a0aec0' }}>
              <CreditCard size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: 13 }}>No hay cajas abiertas</p>
            </div>
          ) : (
            cajas.map((c, i) => (
              <div key={i} style={{
                padding: '10px 20px',
                borderBottom: i < cajas.length - 1 ? '1px solid #f0f4f8' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: '#ebf8ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#2b6cb0',
                  }}>
                    {c.cajero_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{c.cajero_name}</div>
                    <div style={{ fontSize: 11, color: '#718096' }}>{c.sede_name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#718096' }}>
                  <Clock size={11} />
                  <span style={{ fontWeight: 600, color: '#2b6cb0' }}>{elapsed(c.desde)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Personal en turno ── */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(135deg,#553c9a,#44337a)',
        }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={15} color="#fff" />
          </div>
          <div>
            <h4 style={{ color: '#fff', margin: 0, fontSize: 14, fontWeight: 700 }}>Personal en turno</h4>
            <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: 11 }}>{onShift.length} empleado{onShift.length !== 1 ? 's' : ''} activo{onShift.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div style={{ padding: '12px 0', maxHeight: 280, overflowY: 'auto' }}>
          {onShift.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#a0aec0' }}>
              <AlertCircle size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: 13 }}>Nadie en turno en este momento</p>
            </div>
          ) : (
            onShift.map((u, i) => {
              const color  = ROLE_COLOR[u.role] ?? '#718096';
              const bg     = ROLE_BG[u.role]    ?? '#f7fafc';
              const label  = ROLE_LABEL[u.role] ?? u.role;
              return (
                <div key={`${u.id}-${i}`} style={{
                  padding: '10px 20px',
                  borderBottom: i < onShift.length - 1 ? '1px solid #f0f4f8' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color,
                    }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: '#718096' }}>{u.sede_name}</div>
                    </div>
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 20,
                    fontSize: 10, fontWeight: 700,
                    background: bg, color,
                  }}>
                    {label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TurnosCajasPanel;
