import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle, Loader2 } from 'lucide-react';
import { inventoryService } from '../../../api/inventory.service';
import type { StockBajoItem } from '../../../types/sales.types';
import type { SedeSnapshot } from '../../../types/auth.types';

interface Props {
  sedes: SedeSnapshot[];
}

const StockBajoChart: React.FC<Props> = ({ sedes }) => {
  const [sedeId, setSedeId]   = useState<number | undefined>();
  const [items,  setItems]    = useState<StockBajoItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    inventoryService.getStockBajo({ sede_id: sedeId })
      .then(res => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [sedeId]);

  // Prepare chart data (max 20 items to keep chart readable)
  const chartData = items.slice(0, 20).map(it => ({
    name:     it.nombre.length > 22 ? it.nombre.slice(0, 22) + '…' : it.nombre,
    fullName: it.nombre,
    cantidad: it.cantidad,
    minimo:   it.minimo,
    alerta:   it.alerta,
    sede:     it.sede,
    sku:      it.sku,
  }));

  const sinStock  = items.filter(i => i.alerta === 'SIN_STOCK').length;
  const stockBajo = items.filter(i => i.alerta === 'BAJO').length;

  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#2d3748' }}>Stock bajo mínimo</h4>
          <p style={{ margin: 0, fontSize: 11, color: '#718096' }}>Productos que requieren reabastecimiento</p>
        </div>
        {items.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {sinStock > 0 && (
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fff5f5', color: '#c53030' }}>
                🔴 {sinStock} sin stock
              </span>
            )}
            {stockBajo > 0 && (
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fffff0', color: '#d69e2e' }}>
                🟡 {stockBajo} bajo
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #f0f4f8' }}>
        <select
          value={sedeId ?? ''}
          onChange={e => setSedeId(e.target.value ? Number(e.target.value) : undefined)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, color: '#4a5568', background: '#fff' }}
        >
          <option value="">Todas las sedes</option>
          {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Chart area */}
      <div style={{ padding: '16px 20px', minHeight: 240 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#718096' }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 200, color: '#276749' }}>
            <CheckCircle size={40} style={{ marginBottom: 10, color: '#48bb78' }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#276749' }}>¡Todo el inventario está bien!</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#68d391' }}>Ningún producto por debajo del mínimo</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 28)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 50, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f4f8" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#718096' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 10, fill: '#4a5568' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
                        <div style={{ fontWeight: 700, color: '#2d3748', marginBottom: 4 }}>{d.fullName}</div>
                        <div style={{ color: '#718096' }}>SKU: {d.sku}</div>
                        <div style={{ color: '#718096' }}>Sede: {d.sede}</div>
                        <div style={{ marginTop: 4 }}>
                          <span style={{ color: d.alerta === 'SIN_STOCK' ? '#c53030' : '#d69e2e', fontWeight: 700 }}>
                            Actual: {d.cantidad}
                          </span>
                          {' / '}
                          <span style={{ color: '#4a5568' }}>Mínimo: {d.minimo}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.alerta === 'SIN_STOCK' ? '#fc8181' : '#f6e05e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, fontSize: 11, color: '#718096' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#fc8181', display: 'inline-block' }} />
                Sin stock
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f6e05e', display: 'inline-block' }} />
                Stock bajo
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockBajoChart;
