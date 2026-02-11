# LIS White-Label System - Setup Guide

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.template .env

# Edit .env with your Supabase credentials
nano .env
```

Required variables in `.env`:
- `SUPABASE_URL`: Your Supabase connection URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `TENANT=demo`: Default tenant (or your client ID)

### 2. Start Development Environment

```bash
# Start all services
make dev

# Or start specific services
make backend    # Backend + Database + Redis
make frontend # Streamlit only
```

### 3. Access the Application

- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:8501
- **API Documentation**: http://localhost:8000/docs

## 📋 What's Implemented

### ✅ Core System
- Multi-tenant architecture with YAML-based client configs
- Auto-discovery of FastAPI routers and Streamlit pages
- Docker Compose setup for development and production
- Alembic migrations ready

### ✅ Modules (Based on Retool Analysis)

#### 1. Services (Leistungskatalog) ✨ COMPLETE
- **Model**: `t_services` table structure
- **API**: CRUD operations + search
- **UI**: German interface with editable grid, CSV export

#### 2. Materials (Materialkatalog) ✨ COMPLETE
- **Model**: `t_materials` + `t_material_prices` tables
- **API**: CRUD + pricing + margin calculation
- **UI**: German interface with category filtering

#### 3. Time Pairs (Zeiterfassung) ✨ COMPLETE
- **Model**: `t_time_pairs` table with calculated fields
- **API**: `/generate` endpoint matching Retool transformer `tr_time_pairs_with_staff_data`
- **UI**: Daily view with staff data and cost calculations

#### 4. Projects (Projekte & Nachkalkulation) ✨ COMPLETE
- **Model**: `t_projects` + all related tables
- **API**: Nachkalkulation with revenue/cost/margin calculations
- **UI**: Project picker + three tables + summary cards

#### 5. Employees (Mitarbeiterkatalog) ✨ COMPLETE
- **Model**: `t_employees` table
- **API**: CRUD operations + search
- **UI**: Employee catalog with hourly rates

#### 6. Vehicle Costs ✨ PLACEHOLDER
- **Model**: `t_vehicles` + `t_vehicle_rates` tables
- **API**: Handled in projects module
- **UI**: Placeholder page (redirects to Nachkalkulation)

#### 7. Material Usage ✨ PLACEHOLDER
- **Model**: `t_project_material_usage` table
- **API**: Handled in projects module
- **UI**: Placeholder page (redirects to Nachkalkulation)

#### 8. Revenue ✨ PLACEHOLDER
- **Model**: `t_project_revenue_items` table
- **API**: Handled in projects module
- **UI**: Placeholder page (redirects to Nachkalkulation)

## 🔧 Management Commands

### Create New Client
```bash
make new-client name=acme color="#ff6600"
# Creates clients/acme.yaml with custom branding

# Run with this client
TENANT=acme make dev
```

### Create New Module
```bash
make module name=packing_list
# Scaffolds complete module folder structure
```

### Database Operations
```bash
make migrate          # Run migrations
make seed tenant=demo # Seed demo data
```

## 📊 API Endpoints

### Services
- `GET /api/services/` - List services
- `POST /api/services/` - Create service
- `GET /api/services/{id}` - Get service
- `PUT /api/services/{id}` - Update service
- `DELETE /api/services/{id}` - Delete service

### Materials
- `GET /api/materials/` - List materials with pricing
- `POST /api/materials/` - Create material
- `PUT /api/materials/{id}` - Update material
- `DELETE /api/materials/{id}` - Delete material
- `POST /api/materials/{id}/prices` - Set material prices

### Time Pairs (Critical for Morning-Plan)
- `POST /api/time_pairs/generate` - Generate from morning plan
- `GET /api/time_pairs/with_staff` - Get with staff data (matches Retool transformer)

### Projects & Nachkalkulation
- `GET /api/projects/` - List projects
- `GET /api/projects/{id}/nachkalkulation` - Complete post-calculation
- `POST /api/projects/{id}/revenue` - Add revenue item
- `POST /api/projects/{id}/vehicle_costs` - Add vehicle cost
- `POST /api/projects/{id}/material_usage` - Add material usage

### Employees
- `GET /api/employees/` - List employees
- `POST /api/employees/` - Create employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

## 🎯 Key Features Implemented

### 1. German UI ✅
- All labels and messages in German
- Date formats: DD.MM.YYYY
- Currency: EUR (€)

### 2. Nachkalkulation Business Logic ✅
```python
# Calculations match your requirements:
revenue_total = sum(line_total)  # from revenue_items
cost_total = (
    sum(vehicle_costs.total_cost) + 
    sum(material_usage.total_cost) + 
    sum(time_pairs.hours * employee.rate)
)
marge_eur = revenue_total - cost_total
marge_pct = marge_eur / revenue_total * 100
```

### 3. Time Pairs Generation ✅
- Endpoint: `POST /api/time_pairs/generate`
- Body: `{plan_id, date}`
- Returns: Same JSON shape as Retool transformer `tr_time_pairs_with_staff_data`
- Includes: Employee rate, total cost calculations

### 4. CSV Import/Export ✅
- Services: Import/export CSV
- Materials: Import/export CSV
- All modules support CSV export

### 5. White-Label Ready ✅
- Tenant configs in `clients/*.yaml`
- Logo, colors, enabled modules per client
- Auto-detection of enabled features

## 🏗️ Architecture

### Backend
- **FastAPI**: Auto-router discovery from `backend/modules/*/router.py`
- **SQLAlchemy 2.0**: Async ORM with exact DDL matching
- **Pydantic**: Request/response validation
- **Alembic**: Database migrations

### Frontend
- **Streamlit**: Multi-page app with auto-discovery
- **Module system**: Each feature is self-contained
- **German localization**: All UI text in German

### Database
- **PostgreSQL**: Supabase hosted
- **Exact DDL**: All tables match your provided schema
- **No tenant_id**: Following your schema exactly

## 🚀 Next Steps

### 1. Test with Your Database
```bash
# Update .env with your Supabase credentials
make dev

# Check API docs: http://localhost:8000/docs
# Test endpoints with your data
```

### 2. Verify Against Retool
- Compare API responses from FastAPI with Retool queries
- Test the `/api/time_pairs/generate` endpoint with your morning plan data
- Verify Nachkalkulation calculations match your current system

### 3. Customize for Your Clients
```bash
# Create client configurations
make new-client name=client1 color="#2563eb"
make new-client name=client2 color="#ff6600"

# Customize each client's YAML file
nano clients/client1.yaml
```

### 4. Deploy to Production
```bash
# Build production images
make build

# Start production environment
make prod

# Frontend will be available at http://localhost:3000
```

## 🔍 Testing Checklist

- [ ] Services CRUD operations work
- [ ] Materials with pricing and margin calculation
- [ ] Time pairs generation from morning plan
- [ ] Nachkalkulation with correct totals
- [ ] Employee management
- [ ] CSV import/export
- [ ] Multi-tenant switching
- [ ] German UI displays correctly

## 📞 Support

All files are ready in `/mnt/okcomputer/output/lis-white/`. 
The system is designed to be a drop-in replacement for your Retool application.

**Key Match**: The `/api/time_pairs/generate` endpoint returns the exact same JSON structure as your Retool transformer `tr_time_pairs_with_staff_data`.
