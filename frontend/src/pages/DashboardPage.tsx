import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Package,
  Tags,
  ClipboardList,
  Bike,
  Menu as MenuIcon,
  Wrench,
  LogOut,
  Factory,
  TrendingUp,
  List,
  Receipt,
  FileText,
  RefreshCw,
  UserCheck,
  CreditCard,
  Clock,
  History,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../api/auth.service';
import { salesService } from '../api/sales.service';
import type { DashboardStats, SedeSnapshot } from '../types/auth.types';
import type { SedeResumenVentas } from '../types/sales.types';
import UsersList from '../components/admin/UsersList';
import SedesList from '../components/admin/SedesList';
import ProductsList from '../components/admin/inventory/ProductsList';
import CategoriesList from '../components/admin/inventory/CategoriesList';
import SubcategoriesList from '../components/admin/inventory/SubcategoriesList';
import FabricantesList from '../components/admin/inventory/FabricantesList';
import MotoCatalogView from '../components/admin/inventory/MotoCatalogView';
import AuditView from '../components/admin/inventory/AuditView';
import SedeDetailPanel from '../components/admin/dashboard/SedeDetailPanel';
import GananciasPanel from '../components/admin/dashboard/GananciasPanel';
import TurnosCajasPanel from '../components/admin/dashboard/TurnosCajasPanel';
import TopItemsChart from '../components/admin/dashboard/TopItemsChart';
import StockBajoChart from '../components/admin/dashboard/StockBajoChart';
import ReportesView from '../components/admin/dashboard/ReportesView';
import ConfigFiscalView from '../components/admin/billing/ConfigFiscalView';
import ReportesCajaView from '../components/encargado/ReportesCajaView';
import LockedAccountsBanner from '../components/admin/LockedAccountsBanner';
import SecurityView from '../components/admin/SecurityView';
import CatalogoServiciosList from '../components/admin/servicios/CatalogoServiciosList';
import TallerHistorialView from '../components/admin/dashboard/TallerHistorialView';
import '../styles/DashboardPage.css';

type Section =
  | 'dashboard' | 'users' | 'sedes' | 'security'
  | 'products' | 'categories' | 'subcategories' | 'fabricantes' | 'motos' | 'audits'
  | 'reportes' | 'reportes-caja' | 'config-fiscal'
  | 'catalogo-servicios'
  | 'taller-historial';

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode; group?: string }[] = [
  { id: 'dashboard',     label: 'Dashboard',      icon: <LayoutDashboard size={18} /> },
  { id: 'users',         label: 'Usuarios',        icon: <Users size={18} />,        group: 'Admin' },
  { id: 'sedes',         label: 'Sedes',           icon: <Building2 size={18} />,    group: 'Admin' },
  { id: 'security',      label: 'Seguridad',       icon: <Shield size={18} />,       group: 'Admin' },
  { id: 'products',      label: 'Productos',       icon: <Package size={18} />,      group: 'Inventario' },
  { id: 'categories',    label: 'Categorías',      icon: <Tags size={18} />,         group: 'Inventario' },
  { id: 'subcategories', label: 'Subcategorías',   icon: <List size={18} />,         group: 'Inventario' },
  { id: 'fabricantes',   label: 'Fabricantes',     icon: <Factory size={18} />,      group: 'Inventario' },
  { id: 'motos',         label: 'Catálogo Motos',  icon: <Bike size={18} />,         group: 'Inventario' },
  { id: 'audits',        label: 'Auditorías',      icon: <ClipboardList size={18} />,group: 'Inventario' },
  { id: 'catalogo-servicios', label: 'Catálogo de Servicios', icon: <Wrench size={18} />,  group: 'Servicios' },
  { id: 'taller-historial',  label: 'Historial Taller',      icon: <History size={18} />, group: 'Servicios' },
  { id: 'reportes',      label: 'Reportes',        icon: <TrendingUp size={18} />,   group: 'Reportes' },
  { id: 'reportes-caja',  label: 'Reportes Caja',   icon: <FileText size={18} />,   group: 'Reportes' },
  { id: 'config-fiscal', label: 'Config. Tickets', icon: <Receipt size={18} />,      group: 'Reportes' },
];

// ─── Dashboard overview ───────────────────────────────────────────────────────

interface OverviewProps {
  stats:    DashboardStats | null;
  sedes:    SedeSnapshot[];
  resumen:  SedeResumenVentas[];
  isLoading: boolean;
  error:    string;
  onRefresh: () => void;
  onNavigateSecurity: () => void;
}

const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  bg: string;
}> = ({ icon, label, value, sub, color, bg }) => (
  <div style={{
    background: '#fff',
    borderRadius: 12,
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  }}>
    <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {React.cloneElement(icon as React.ReactElement<{ size?: number; color?: string }>, { size: 20, color })}
    </div>
    <div>
      <div style={{ fontSize: 11, color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#2d3748', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

const DashboardOverview: React.FC<OverviewProps> = ({ sedes, resumen, isLoading, error, onRefresh, onNavigateSecurity }) => {
  const [selectedSede, setSelectedSede] = useState<SedeSnapshot | null>(null);

  // FILA 1 KPI values
  const totalStaff          = sedes.reduce((s, x) => s + x.total_workers + x.total_cashiers + x.total_encargados, 0);
  const totalClientes       = sedes.reduce((s, x) => s + (x.total_clientes ?? 0), 0);
  const totalCajasAbiertas  = resumen.reduce((s, r) => s + r.cajas_abiertas.length, 0);
  const totalEnTurno        = sedes.reduce((s, x) => s + x.on_shift_now, 0);

  if (isLoading) {
    return <div className="table-loading">Cargando dashboard…</div>;
  }

  return (
    <div className="section-container">
      {/* Locked accounts alert */}
      <LockedAccountsBanner onUnlock={onNavigateSecurity} />
      {error && <div className="error-banner">{error}</div>}

      {/* Header row: título + refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>Dashboard</h2>
          <p style={{ margin: 0, fontSize: 12, color: '#718096' }}>{sedes.length} sede{sedes.length !== 1 ? 's' : ''} activa{sedes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onRefresh}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#4a5568', cursor: 'pointer' }}
        >
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* FILA 1 — KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard icon={<Users />}       label="Staff total"     value={totalStaff}         sub="trabajadores y cajeros" color="#2b6cb0" bg="#ebf8ff" />
        <KpiCard icon={<UserCheck />}   label="Clientes"        value={totalClientes}       sub="registrados"            color="#276749" bg="#f0fff4" />
        <KpiCard icon={<CreditCard />}  label="Cajas abiertas"  value={totalCajasAbiertas}  sub="en este momento"        color="#6b46c1" bg="#faf5ff" />
        <KpiCard icon={<Clock />}       label="En turno ahora"  value={totalEnTurno}        sub="empleados activos"      color="#c05621" bg="#fffaf0" />
      </div>

      {/* FILA 2 — Panel de ganancias */}
      <GananciasPanel resumen={resumen} sedes={sedes} />

      {/* FILA 3 — Cajas + Turnos */}
      <TurnosCajasPanel sedes={sedes} resumen={resumen} />

      {/* FILA 4 — Gráficas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <TopItemsChart sedes={sedes} />
        <StockBajoChart sedes={sedes} />
      </div>

      {/* Sede detail modal */}
      {selectedSede && (
        <SedeDetailPanel sede={selectedSede} onClose={() => setSelectedSede(null)} />
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [sedes, setSedes]     = useState<SedeSnapshot[]>([]);
  const [resumen, setResumen] = useState<SedeResumenVentas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadDashboard = useCallback(() => {
    setIsLoading(true);
    setError('');
    Promise.all([
      authService.getDashboardSummary(),
      salesService.adminResumen().catch(() => ({ success: false, data: [] as SedeResumenVentas[] })),
    ])
      .then(([dash, res]) => {
        if (dash.success && dash.data.mode === 'administrator') {
          setStats(dash.data.statistics ?? null);
          setSedes(dash.data.sedes_summary ?? []);
        }
        if (res.success) setResumen(res.data);
      })
      .catch(() => setError('Error al cargar los datos del dashboard'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-shell">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon"><Bike size={24} /></span>
          <span className="sidebar-brand-name">MotoQFox</span>
        </div>

        <nav className="sidebar-nav">
          {(() => {
            let lastGroup: string | undefined = undefined;
            return NAV_ITEMS.map((item) => {
              const showGroup = item.group && item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <React.Fragment key={item.id}>
                  {showGroup && <p className="nav-group-label">{item.group}</p>}
                  <button
                    className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
                    onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                </React.Fragment>
              );
            });
          })()}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.first_name.charAt(0)}{user?.last_name.charAt(0)}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user?.full_name}</p>
              <p className="sidebar-user-role">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────── */}
      <div className="dashboard-main-area">
        <header className="topbar">
          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Menú"
          >
            <MenuIcon size={22} />
          </button>
          <h1 className="topbar-title">
            {NAV_ITEMS.find((i) => i.id === activeSection)?.label}
          </h1>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={18} />
            Salir
          </button>
        </header>

        <main className="dashboard-content">
          {activeSection === 'dashboard' && (
            <DashboardOverview
              stats={stats}
              sedes={sedes}
              resumen={resumen}
              isLoading={isLoading}
              error={error}
              onRefresh={loadDashboard}
              onNavigateSecurity={() => setActiveSection('security')}
            />
          )}
          {activeSection === 'users'         && <UsersList />}
          {activeSection === 'sedes'         && <SedesList />}
          {activeSection === 'security'      && <SecurityView />}
          {activeSection === 'products'      && <ProductsList />}
          {activeSection === 'categories'    && <CategoriesList />}
          {activeSection === 'subcategories' && <SubcategoriesList />}
          {activeSection === 'fabricantes'   && <FabricantesList />}
          {activeSection === 'motos'         && <MotoCatalogView />}
          {activeSection === 'audits'        && <AuditView />}
          {activeSection === 'catalogo-servicios' && <CatalogoServiciosList />}
          {activeSection === 'taller-historial'  && <TallerHistorialView sedes={sedes} />}
          {activeSection === 'reportes'      && <ReportesView sedes={sedes} />}
          {activeSection === 'reportes-caja'  && <ReportesCajaView showSede />}
          {activeSection === 'config-fiscal' && <ConfigFiscalView sedes={sedes} />}
        </main>
      </div>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default DashboardPage;
