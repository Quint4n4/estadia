import React from 'react';
import type { SedeSnapshot } from '../../../types/auth.types';
import type { SedeResumenVentas } from '../../../types/sales.types';

interface Props {
  sede:    SedeSnapshot;
  resumen?: SedeResumenVentas;
  onClick: (sede: SedeSnapshot) => void;
}

const fmtMXN = (n: string | number) =>
  `$${parseFloat(String(n)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SedeCard: React.FC<Props> = ({ sede, resumen, onClick }) => {
  const hasAlerts    = sede.low_stock_count > 0 || sede.out_of_stock_count > 0;
  const cajasAbiertas = resumen?.cajas_abiertas.length ?? 0;
  const ingresosHoy   = resumen ? parseFloat(String(resumen.ingresos_hoy)) : null;

  return (
    <div
      className="sede-card sede-card--clickable"
      onClick={() => onClick(sede)}
    >
      {/* Header */}
      <div className="sede-card-header">
        <div>
          <h3 className="sede-card-name">{sede.name}</h3>
          {sede.address && (
            <p className="sede-card-address">{sede.address}</p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span
            className={`status-badge ${sede.is_active ? 'active' : 'inactive'}`}
            style={{ fontSize: 11 }}
          >
            {sede.is_active ? 'Activa' : 'Inactiva'}
          </span>
          {/* Cajas badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px',
            borderRadius: 6, lineHeight: 1.5,
            background: cajasAbiertas > 0 ? 'var(--color-success-bg)' : 'var(--color-bg-main)',
            color:      cajasAbiertas > 0 ? 'var(--color-success)'    : 'var(--color-text-secondary)',
            border:     cajasAbiertas > 0 ? '1px solid #86efac'       : '1px solid var(--color-border)',
          }}>
            {cajasAbiertas > 0 ? `${cajasAbiertas} caja${cajasAbiertas > 1 ? 's' : ''} abierta${cajasAbiertas > 1 ? 's' : ''}` : 'Sin cajas abiertas'}
          </span>
        </div>
      </div>

      {/* Ingresos hoy */}
      {ingresosHoy !== null && (
        <div style={{
          margin: '10px 0 4px',
          padding: '8px 12px',
          background: 'var(--color-primary-bg)',
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            Ingresos hoy
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>
            {fmtMXN(ingresosHoy)}
          </span>
        </div>
      )}

      {/* Employee stats */}
      <div className="sede-card-stats-grid">
        <Stat label="Empleados" value={sede.total_employees} />
        <Stat label="En turno ahora" value={sede.on_shift_now} />
        <Stat label="Trabajadores" value={sede.total_workers} />
        <Stat label="Cajeros" value={sede.total_cashiers} />
      </div>

      {/* Inventario total */}
      <div style={{
        marginTop: 8, padding: '6px 10px',
        background: 'var(--color-bg-main)',
        borderRadius: 6, border: '1px solid var(--color-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Inventario total</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {(sede.total_stock_quantity ?? 0).toLocaleString('es-MX')} uds.
        </span>
      </div>

      {/* Stock alerts */}
      {hasAlerts && (
        <div className="sede-card-alerts">
          {sede.out_of_stock_count > 0 && (
            <span className="sede-alert-badge sede-alert-badge--error">
              {sede.out_of_stock_count} sin stock
            </span>
          )}
          {sede.low_stock_count > 0 && (
            <span className="sede-alert-badge sede-alert-badge--warning">
              {sede.low_stock_count} stock bajo
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      <p className="sede-card-cta">Ver detalle →</p>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="sede-stat-box">
    <p className="sede-stat-label">{label}</p>
    <p className="sede-stat-value">{value}</p>
  </div>
);

export default SedeCard;
