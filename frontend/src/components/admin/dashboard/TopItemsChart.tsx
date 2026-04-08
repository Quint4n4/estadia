import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingBag, Wrench, Loader2 } from 'lucide-react';
import { salesService } from '../../../api/sales.service';
import type { TopItem } from '../../../types/sales.types';
import type { SedeSnapshot } from '../../../types/auth.types';

interface Props {
  sedes: SedeSnapshot[];
}

type TabType = 'productos' | 'servicios';
type Period  = 7 | 30 | 90;

const COLORS = ['#2b6cb0','#276749','#6b46c1','#c05621','#2c7a7b','#97266d','#d69e2e','#553c9a'];

const fmt = (n: string | number) =>
  parseFloat(String(n)).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const CustomLegend = ({ data, total }: { data: TopItem[]; total: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
    {data.map((item, i) => {
      const pct = total > 0 ? Math.round((item.cantidad / total) * 100) : 0;
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
          <span style={{ flex: 1, color: '#2d3748', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.nombre}
          </span>
          <span style={{ color: '#718096', fontWeight: 600, flexShrink: 0 }}>{item.cantidad} <span style={{ color: '#a0aec0', fontWeight: 400 }}>({pct}%)</span></span>
        </div>
      );
    })}
  </div>
);

const TopItemsChart: React.FC<Props> = ({ sedes }) => {
  const [activeTab, setTab]   = useState<TabType>('productos');
  const [sedeId,    setSedeId] = useState<number | undefined>();
  const [dias,      setDias]   = useState<Period>(30);
  const [productos, setProds]  = useState<TopItem[]>([]);
  const [servicios, setServs]  = useState<TopItem[]>([]);
  const [loading,   setLoading]= useState(false);

  useEffect(() => {
    setLoading(true);
    salesService.getTopItems({ sede_id: sedeId, dias })
      .then(res => {
        setProds(res.data.productos);
        setServs(res.data.servicios);
      })
      .catch(() => { setProds([]); setServs([]); })
      .finally(() => setLoading(false));
  }, [sedeId, dias]);

  const data  = activeTab === 'productos' ? productos : servicios;
  const total = data.reduce((s, d) => s + d.cantidad, 0);

  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#2d3748' }}>Más vendidos</h4>
          <p style={{ margin: 0, fontSize: 11, color: '#718096' }}>Top 8 por cantidad</p>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#f7fafc', borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setTab('productos')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: activeTab === 'productos' ? '#2b6cb0' : 'transparent',
              color:      activeTab === 'productos' ? '#fff'    : '#718096',
            }}
          >
            <ShoppingBag size={12} /> Productos
          </button>
          <button
            onClick={() => setTab('servicios')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: activeTab === 'servicios' ? '#276749' : 'transparent',
              color:      activeTab === 'servicios' ? '#fff'    : '#718096',
            }}
          >
            <Wrench size={12} /> Servicios
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #f0f4f8', display: 'flex', alignItems: 'center', gap: 12 }}>
        <select
          value={sedeId ?? ''}
          onChange={e => setSedeId(e.target.value ? Number(e.target.value) : undefined)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, color: '#4a5568', background: '#fff' }}
        >
          <option value="">Todas las sedes</option>
          {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          {([7, 30, 90] as Period[]).map(d => (
            <button
              key={d}
              onClick={() => setDias(d)}
              style={{
                padding: '3px 10px', borderRadius: 20, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: dias === d ? '#4a5568' : '#fff',
                color:      dias === d ? '#fff'    : '#718096',
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div style={{ padding: '16px 20px', minHeight: 240 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#718096' }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Cargando…
          </div>
        ) : data.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 200, color: '#a0aec0' }}>
            {activeTab === 'productos' ? <ShoppingBag size={36} style={{ opacity: 0.3, marginBottom: 8 }} /> : <Wrench size={36} style={{ opacity: 0.3, marginBottom: 8 }} />}
            <p style={{ margin: 0, fontSize: 13 }}>Sin datos en este período</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: '0 0 180px', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="cantidad"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={((value: any, name: string) => [
                      `${value ?? 0} vendidos (${fmt(data.find((d: any) => d.nombre === name)?.monto ?? 0)})`,
                      name,
                    ]) as any}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#718096', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total: {total} unidades
              </div>
              <CustomLegend data={data} total={total} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopItemsChart;
