# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MotoQFox** is a multi-branch Point-of-Sale (POS) and motorcycle workshop management system. It uses a Django REST API backend and a React + TypeScript frontend, plus a separate customer-facing app.

---

## Commands

### Backend (Django)

```bash
# Activate virtual environment (from project root)
.\venv\Scripts\activate          # Windows
source venv/bin/activate         # Linux/macOS

# Run development server (from backend/)
cd backend
python manage.py runserver

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Seed development data (run from backend/)
python seed_dev.py

# Install dependencies (from project root with venv active)
pip install -r backend/requirements.txt
```

### Frontend — Admin/Staff (React + Vite)

```bash
cd frontend
npm install        # install dependencies
npm run dev        # dev server (http://localhost:5173)
npm run build      # production build (tsc + vite build)
npm run lint       # ESLint
npm run preview    # preview production build
```

### Frontend — Customer App (React + Vite + PWA)

```bash
cd frontend-cliente
npm install
npm run dev        # dev server (http://localhost:5174)
npm run build
npm run preview
```

### Database (PostgreSQL)

```bash
# Import database snapshot (from scripts/)
psql -U postgres -d motoqfox -f scripts/motoqfox_data_20260320.sql

# Export current database
pg_dump -U postgres motoqfox > scripts/motoqfox_data_$(date +%Y%m%d).sql
```

---

## Architecture

The project is split into three main areas:

```
myPoint/
├── backend/           # Django REST API
├── frontend/          # Admin/staff React app
├── frontend-cliente/  # Customer-facing React app
├── scripts/           # DB export/import scripts + SQL snapshots
├── DOCUMENTACION/     # Detailed spec documents for each module
└── auditorias/        # Security and UX audit reports
```

### Backend Structure

Django 5 + DRF + SimpleJWT. Entry point: `backend/config/`.

**8 Django apps:**

| App | Responsibility |
|-----|---------------|
| `users` | Custom user model, JWT auth, account lockout, login audit log |
| `branches` | Multi-sede (branch) management |
| `inventory` | Products, categories, brands, stock, compatibility (motorcycle parts) |
| `sales` | POS transactions, cash register sessions, payment methods, loyalty points |
| `billing` | Fiscal/receipt configuration per branch |
| `customers` | Customer profiles, QR tokens, loyalty system |
| `pedidos` | Warehouse stock requests from cashiers |
| `taller` | Workshop: service orders, motorcycle registry, labor tracking |
| `catalogo_servicios` | Service pricing catalog for workshop |

**URL prefix map** (`config/urls.py`):
- `/api/auth/` → users
- `/api/branches/` → branches
- `/api/inventory/` → inventory
- `/api/sales/` → sales
- `/api/billing/` → billing
- `/api/customers/` → customers
- `/api/pedidos/` → pedidos
- `/api/taller/` → taller
- `/api/catalogo-servicios/` → catalogo_servicios
- `/admin/` → Django admin

**Authentication flow:**
- JWT access token (60 min) + refresh token (24h) via SimpleJWT
- Token rotation enabled with blacklist
- Account locks after repeated failed logins (30-minute cooldown)
- All auth events logged in `LoginAuditLog`

**Custom user model:** `users.CustomUser` extends `AbstractBaseUser` with 7 roles:
`ADMINISTRATOR`, `ENCARGADO`, `JEFE_MECANICO`, `MECANICO`, `WORKER`, `CASHIER`, `CUSTOMER`

### Frontend — Admin/Staff Structure

React 19 + TypeScript + Vite. Each user role gets its own panel page.

**Key directories:**
- `src/api/` — One service file per Django app. Axios client configured in `axios.config.ts` with silent 401 interceptor (queues requests during token refresh).
- `src/pages/` — One panel per role: `DashboardPage` (admin), `EncargadoPanel`, `WorkerPanel`, `CashierPanel`, `JefeMecanicoPanel`, `MecanicoPanel`.
- `src/components/` — Organized by role: `admin/`, `cashier/`, `encargado/`, `taller/`, `common/`.
- `src/contexts/AuthContext.tsx` — Global auth state; restores session from `sessionStorage` on page reload.
- `src/utils/tokenStore.ts` — Access token kept in memory; refresh token in `sessionStorage`.
- `src/types/` — TypeScript interfaces matching Django model serializers.

**Routing:** React Router v7. `RootRedirect` reads role from `AuthContext` and redirects to the appropriate panel. Public routes: `/login`, `/forgot-password`, `/reset-password`.

### Frontend — Customer App Structure

React 19 + TypeScript + Vite 6 + PWA (Workbox). Optimized for mobile browsers.

- `src/pages/` — Lazy-loaded: `SplashPage`, `BienvenidaPage`, `LoginPage`, `HomePage`, `MiQRPage`, `MisComprasPage`, `CuponesPage`, `PerfilPage`, `MisServiciosPage`.
- `src/components/BottomNav.tsx` — Mobile bottom navigation.
- `src/context/AuthContext.tsx` — Auth state (separate from admin app).
- `vite.config.ts` — PWA plugin with Workbox caching strategies configured.

### Environment Configuration

**Backend** — create `backend/.env` (see `backend/.env.example`):
```
SECRET_KEY=<django secret key>
DEBUG=True
DB_NAME=motoqfox
DB_USER=postgres
DB_PASSWORD=12345
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
FRONTEND_URL=http://localhost:5173
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
```

**Frontend** — create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:8000/api
```

---

## Key Patterns

- **Role-based access:** Permissions are enforced in both DRF (backend) and React route guards (`ProtectedRoute.tsx`). When adding a new feature, check both layers.
- **Multi-branch (sede):** Most models link to a `Sede` FK. Queries are always filtered by the user's current branch.
- **Stock management:** Stock entries go through `EntradaInventario`; direct model edits should be avoided to preserve the audit trail in `AuditoriaInventario`.
- **Workshop orders:** `ServicioMoto` → `ServicioItem` (labor) + `SolicitudRefaccionExtra` (parts requests to warehouse).
- **PDF generation:** Currently handled in-thread. For high-volume production use, the deployment guide recommends moving to Celery.
- **Deployment target:** Railway.app. See `backend/DEPLOYMENT.md` for the production checklist.
- **Detailed specs:** The `DOCUMENTACION/` folder contains in-depth Spanish-language specs for each module: `api-endpoints.md`, `base-de-datos.md`, `flujos.md`, `frontend.md`, `arquitectura.md`, `seguridad-owasp.md`.
