# LIS White-Label System v2.1

A multi-tenant web application for German/Austrian/Swiss craftsmanship companies (movers, painters, scaffolders, etc.). Built with FastAPI, SQLAlchemy 2 (async), PostgreSQL, and Streamlit.

**🆕 SUPABASE VERSION**: Now supports Supabase as primary database with local PostgreSQL fallback.

**🆕 NEW FEATURES v2.1**:
- **Morningplan Management**: Prä, Inter, and Post Morningplan for daily work planning
- **Nachkalkulation (Post-Calculation)**: Comprehensive cost and revenue analysis
- **Supabase Integration**: Full compatibility with Supabase PostgreSQL hosting
- **Enhanced Frontend**: Optimized Streamlit UI with better UX

## Features

### Core Features
- **Multi-tenant architecture**: Single codebase serves multiple clients with separate branding
- **Modular design**: Each feature is a self-contained module that can be enabled/disabled per client
- **White-label ready**: Custom logos, colors, and feature sets per client via YAML configuration
- **Real-time calculations**: Revenue, costs, and margin calculations for projects
- **CSV import/export**: Bulk data management for services and materials
- **Responsive UI**: Modern Streamlit interface with German localization

### New in v2.1
- **Morningplan Management**:
  - **Prä-Morningplan**: Pre-planning with staff assignments, tasks, and checklists
  - **Inter-Morningplan**: Interim planning for ongoing projects
  - **Post-Morningplan**: Post-completion planning and documentation
- **Nachkalkulation (Post-Calculation)**:
  - Detailed cost breakdown (employees, vehicles, materials, external services)
  - Revenue analysis and profit margin calculations
  - Variance analysis between planned and actual costs
  - Employee and material efficiency reports
- **Supabase Integration**: 
  - Full compatibility with Supabase PostgreSQL hosting
  - Draftbit architecture support
  - Real-time data synchronization

## Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2 (async), PostgreSQL
- **Frontend**: Streamlit, Pandas, Plotly
- **Database**: Supabase PostgreSQL (primary) or local PostgreSQL (fallback)
- **Caching**: Redis (optional)
- **Containerization**: Docker, Docker Compose
- **Payments**: Stripe (optional)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- Supabase account (optional, for cloud database)

### Setup Options

#### Option 1: Supabase (Recommended for Production)

1. Create a Supabase project at https://supabase.com

2. Copy environment template:
```bash
cp .env.template .env
```

3. Edit `.env` with your Supabase credentials:
```env
SUPABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_ID].supabase.co:5432/postgres
SUPABASE_KEY=your_supabase_anon_key_here
TENANT=demo
```

4. Start the application:
```bash
make dev
```

#### Option 2: Local PostgreSQL (Development)

1. Copy environment template:
```bash
cp .env.template .env
```

2. Use local database configuration:
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/lis_dev
TENANT=demo
```

3. Start with Docker Compose:
```bash
make dev
```

### Access Points

- **Backend API**: http://localhost:8000/docs (FastAPI Swagger)
- **Frontend**: http://localhost:8501 (Streamlit)
- **Database**: PostgreSQL on port 5432 (or your Supabase URL)

## Database Schema

The system uses a comprehensive PostgreSQL schema based on your Draftbit architecture:

### Core Tables
- **t_users**: User accounts with authentication
- **t_employees**: Employee records with hourly rates and qualifications
- **t_projects**: Project master data
- **t_services**: Service catalog with pricing
- **t_materials**: Material catalog with inventory tracking

### New Tables (v2.1)
- **t_morningplan**: Daily work plans (Prä/Inter/Post)
- **t_morningplan_staff**: Staff assignments for plans
- **t_morningplan_tasks**: Tasks within plans
- **t_morningplan_checklist**: Safety and operational checklists
- **t_nachkalkulation**: Post-calculation records
- **t_nachkalkulation_details**: Detailed cost/revenue items
- **t_nachkalkulation_employee_summary**: Employee efficiency metrics
- **t_nachkalkulation_material_summary**: Material consumption analysis

### Integration Tables
- **t_inspections**: Inspection/Besichtigung records (Draftbit compatible)
- **t_abnahmen**: Completion protocols
- **t_time_pairs**: Employee time tracking
- **t_analytics_events**: Application analytics
- **t_feedback**: Customer feedback system

## Module Overview

### Available Modules

| Module | Description | German Title |
|--------|-------------|--------------|
| services | Service catalog and pricing | Leistungskatalog |
| materials | Material catalog and inventory | Materialkatalog |
| projects | Project management with Nachkalkulation | Projekte |
| time_pairs | Employee time tracking | Zeiterfassung |
| revenue | Revenue and invoicing | Einnahmen |
| vehicle_costs | Vehicle cost tracking | Fahrzeugkosten |
| material_usage | Material consumption | Materialverbrauch |
| employees | Employee management | Mitarbeiter |
| users | User & employee management | Benutzer & Mitarbeiter |
| inspections | Inspection/Besichtigung management | Besichtigungen |
| **morningplan** | **NEW**: Daily work planning | **Morningplan** |
| **nachkalkulation** | **NEW**: Post-calculation analysis | **Nachkalkulation** |

### Morningplan Features

#### Prä-Morningplan (Pre-Planning)
- Staff assignment with roles (Mitarbeiter, Teamleiter, Fahrer, Meister)
- Task planning with estimated durations
- Vehicle allocation
- Safety checklists
- Route planning

#### Inter-Morningplan (Interim Planning)
- Progress tracking during project execution
- Material resupply planning
- Staff check-ins
- Status updates

#### Post-Morningplan (Post-Planning)
- Work completion documentation
- Time tracking reconciliation
- Material return tracking
- Customer feedback collection

### Nachkalkulation Features

#### Cost Analysis
- Employee costs with hourly rates and overtime
- Vehicle costs (fuel, maintenance, tolls)
- Material consumption vs. planned quantities
- External service costs
- Overhead allocation

#### Revenue Analysis
- Service revenue breakdown
- Material revenue
- Additional services
- Discount tracking

#### Variance Analysis
- Planned vs. actual hours
- Planned vs. actual costs
- Planned vs. actual revenue
- Employee efficiency metrics
- Material waste analysis

#### Reporting
- Profit & Loss statements per project
- Employee performance reports
- Material consumption reports
- Comparison reports across projects

## API Documentation

### REST Endpoints

All modules provide RESTful API endpoints with German localization:

#### Morningplan API
```
GET    /api/morningplan/                 # List all plans
POST   /api/morningplan/                 # Create new plan
GET    /api/morningplan/{id}             # Get plan details
PUT    /api/morningplan/{id}             # Update plan
DELETE /api/morningplan/{id}             # Delete plan
GET    /api/morningplan/prae/            # Get Prä-Morningplan
GET    /api/morningplan/inter/           # Get Inter-Morningplan
GET    /api/morningplan/post/            # Get Post-Morningplan
POST   /api/morningplan/{id}/staff       # Add staff to plan
POST   /api/morningplan/{id}/tasks       # Add tasks to plan
POST   /api/morningplan/{id}/checklist   # Add checklist items
```

#### Nachkalkulation API
```
GET    /api/nachkalkulation/             # List calculations
POST   /api/nachkalkulation/             # Create calculation
GET    /api/nachkalkulation/{id}         # Get calculation
PUT    /api/nachkalkulation/{id}         # Update calculation
POST   /api/nachkalkulation/generate/{project_id}  # Generate from project
POST   /api/nachkalkulation/{id}/lock    # Lock calculation
POST   /api/nachkalkulation/{id}/approve # Approve calculation
GET    /api/nachkalkulation/dashboard/summary/     # Dashboard data
GET    /api/nachkalkulation/analysis/cost-breakdown/{id}  # Cost analysis
```

## Configuration

### Tenant Configuration (clients/demo.yaml)
```yaml
tenant_id: demo
name: "Müller & Sohn GmbH"
logo_url: "/assets/logos/demo-logo.png"
colors:
  primary: "#2563eb"
  secondary: "#64748b"
  accent: "#f59e0b"
enabled_modules:
  - services
  - materials
  - projects
  - time_pairs
  - inspections
  - morningplan      # NEW
  - nachkalkulation  # NEW
features:
  real_time: true
  advanced_search: true
  export_formats: ["csv", "xlsx"]
  notifications: true
  analytics: true
settings:
  currency: EUR
  language: de
  date_format: dd.mm.yyyy
  vat_rate: 20.0
```

## Usage Examples

### Creating a Morningplan

1. Navigate to "Morningplan" in the sidebar
2. Click "Neuer Plan"
3. Select plan type (Prä/Inter/Post)
4. Choose project and date
5. Assign staff with roles
6. Add tasks with time estimates
7. Complete safety checklist
8. Save and confirm

### Generating Nachkalkulation

1. Complete a project with time tracking
2. Navigate to "Nachkalkulation"
3. Click "Neue Kalkulation"
4. Select the completed project
5. Review auto-generated costs and revenue
6. Adjust any variances
7. Add notes and explanations
8. Lock and approve the calculation

### Exporting Reports

1. Go to "Berichte" in any module
2. Select date range and filters
3. Choose export format (CSV, Excel)
4. Download the report

## Development

### Project Structure
```
lis-white/
├── backend/
│   ├── core/           # Core functionality
│   ├── modules/        # Feature modules
│   │   ├── morningplan/     # NEW: Morningplan module
│   │   ├── nachkalkulation/ # NEW: Post-calculation module
│   │   └── ...              # Other modules
│   └── main.py         # FastAPI application
├── streamlit_app/      # Streamlit frontend
│   ├── modules/        # Frontend modules
│   └── app.py          # Main Streamlit app
├── clients/            # Tenant configurations
├── alembic/            # Database migrations
├── requirements.txt    # Python dependencies
└── docker-compose.yml  # Container orchestration
```

### Adding New Modules

1. Create module directory in `backend/modules/`
2. Implement models.py, schemas.py, service.py, router.py
3. Create Streamlit frontend in `streamlit_app/modules/`
4. Register module in tenant configurations
5. Add to database migrations

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Add new feature"

# Apply migrations
alembic upgrade head

# Downgrade migration
alembic downgrade -1
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure SUPABASE_URL is correctly formatted
2. **Module Loading**: Check that all module files exist and are properly imported
3. **Streamlit Pages**: Verify page rendering functions are correctly registered
4. **Tenant Configuration**: Ensure tenant YAML files are valid

### Debug Mode

Enable debug mode for detailed logging:
```bash
export DEBUG=true
make dev
```

### Performance Monitoring

Access performance metrics at:
- API: http://localhost:8000/metrics
- Database: Check SQLAlchemy query logs
- Frontend: Browser developer tools

## License

This is a proprietary white-label system. Contact the development team for licensing information.

## Support

For technical support:
- Email: support@example.com
- Documentation: /docs (FastAPI Swagger)
- Issues: GitHub Issues (if applicable)

---

**Version**: 2.1.0  
**Last Updated**: January 2026  
**Status**: Production Ready with Supabase Integration
