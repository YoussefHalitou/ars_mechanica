.PHONY: help install dev prod stop clean new-client module migrate seed logs test

# Default target
help:
	@echo "LIS White-Label System - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Start development environment"
	@echo "  make backend          - Start only backend service"
	@echo "  make frontend         - Start only frontend service"
	@echo "  make logs             - Show logs for all services"
	@echo "  make stop             - Stop all services"
	@echo ""
	@echo "Management:"
	@echo "  make new-client name=NAME color=COLOR  - Create new client configuration"
	@echo "  make module name=NAME                  - Scaffold new module"
	@echo "  make migrate                          - Run database migrations"
	@echo "  make seed tenant=TENANT               - Seed demo data for tenant"
	@echo ""
	@echo "Production:"
	@echo "  make prod             - Start production environment"
	@echo "  make build            - Build Docker images"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean            - Clean up containers and volumes"
	@echo "  make test             - Run tests"

# Environment check
check-env:
	@if [ ! -f .env ]; then \
		echo "Creating .env file from template..."; \
		cp .env.template .env; \
		echo "Please edit .env file with your configuration."; \
	fi

# Development environment
dev: check-env
	docker-compose --profile dev up -d
	@echo ""
	@echo "Development environment started!"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:8501"
	@echo ""
	@echo "To view logs: make logs"
	@echo "To stop: make stop"

# Start only backend
backend: check-env
	docker-compose --profile dev up -d backend postgres redis

# Start only frontend
frontend: check-env
	docker-compose --profile dev up -d streamlit

# Stop services
stop:
	docker-compose --profile dev down
	docker-compose --profile prod down

# Show logs
logs:
	docker-compose --profile dev logs -f

# Production environment
prod: check-env
	docker-compose --profile prod up -d
	@echo ""
	@echo "Production environment started!"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@echo ""

# Build Docker images
build:
	docker-compose --profile dev build
	docker-compose --profile prod build

# Clean up
clean:
	docker-compose --profile dev down -v
	docker-compose --profile prod down -v
	docker system prune -f

# Create new client configuration
new-client:
	@if [ -z "$(name)" ]; then \
		echo "Error: name parameter required. Usage: make new-client name=acme color=#ff6600"; \
		exit 1; \
	fi
	@mkdir -p clients
	@color=$(or $(color),"#2563eb"); \
	echo "Creating client configuration for $(name)..."; \
	printf "name: %s\n" "$(name)" > clients/$(name).yaml; \
	printf "logo_url: \"\"\n" >> clients/$(name).yaml; \
	printf "primary_color: %s\n" "$$color" >> clients/$(name).yaml; \
	printf "enabled_modules:\n" >> clients/$(name).yaml; \
	printf "- services\n" >> clients/$(name).yaml; \
	printf "- materials\n" >> clients/$(name).yaml; \
	printf "- projects\n" >> clients/$(name).yaml; \
	printf "- time_pairs\n" >> clients/$(name).yaml; \
	printf "- revenue\n" >> clients/$(name).yaml; \
	printf "- vehicle_costs\n" >> clients/$(name).yaml; \
	printf "- material_usage\n" >> clients/$(name).yaml; \
	printf "extra_menu: []\n" >> clients/$(name).yaml; \
	printf "tenant_id: %s\n" "$(name)" >> clients/$(name).yaml; \
	echo "Created clients/$(name).yaml"; \
	echo ""; \
	echo "To start with this client:"; \
	echo "  TENANT=$(name) make dev"; \
	echo ""; \
	echo "Docker run command for this client:"; \
	echo "  docker run -e TENANT=$(name) -p 3000:8501 lis-white_streamlit-prod"

# Scaffold new module
module:
	@if [ -z "$(name)" ]; then \
		echo "Error: name parameter required. Usage: make module name=packing_list"; \
		exit 1; \
	fi
	@echo "Creating module $(name)..."
	@mkdir -p backend/modules/$(name)
	@# Create __init__.py
	touch backend/modules/$(name)/__init__.py
	@# Create router.py
	printf '"""\nFastAPI router for $(name) module\n"""\n' > backend/modules/$(name)/router.py
	printf 'from fastapi import APIRouter, Depends, HTTPException\n' >> backend/modules/$(name)/router.py
	printf 'from sqlalchemy.ext.asyncio import AsyncSession\n\n' >> backend/modules/$(name)/router.py
	printf 'from backend.core.database import get_db\n' >> backend/modules/$(name)/router.py
	printf 'from backend.core.schemas import ResponseBase\n\n' >> backend/modules/$(name)/router.py
	printf 'router = APIRouter(prefix="/api/$(name)", tags=["$(name)"])\n\n\n' >> backend/modules/$(name)/router.py
	printf '@router.get("/")\n' >> backend/modules/$(name)/router.py
	printf 'async def list_items(db: AsyncSession = Depends(get_db)):\n' >> backend/modules/$(name)/router.py
	printf '    """List all items"""\n' >> backend/modules/$(name)/router.py
	printf '    return ResponseBase(success=True, data=[])\n\n\n' >> backend/modules/$(name)/router.py
	printf '@router.post("/")\n' >> backend/modules/$(name)/router.py
	printf 'async def create_item(db: AsyncSession = Depends(get_db)):\n' >> backend/modules/$(name)/router.py
	printf '    """Create new item"""\n' >> backend/modules/$(name)/router.py
	printf '    return ResponseBase(success=True, message="Created")\n\n\n' >> backend/modules/$(name)/router.py
	printf '@router.get("/{item_id}")\n' >> backend/modules/$(name)/router.py
	printf 'async def get_item(item_id: str, db: AsyncSession = Depends(get_db)):\n' >> backend/modules/$(name)/router.py
	printf '    """Get item by ID"""\n' >> backend/modules/$(name)/router.py
	printf '    return ResponseBase(success=True, data={"id": item_id})\n\n\n' >> backend/modules/$(name)/router.py
	printf '@router.put("/{item_id}")\n' >> backend/modules/$(name)/router.py
	printf 'async def update_item(item_id: str, db: AsyncSession = Depends(get_db)):\n' >> backend/modules/$(name)/router.py
	printf '    """Update item"""\n' >> backend/modules/$(name)/router.py
	printf '    return ResponseBase(success=True, message="Updated")\n\n\n' >> backend/modules/$(name)/router.py
	printf '@router.delete("/{item_id}")\n' >> backend/modules/$(name)/router.py
	printf 'async def delete_item(item_id: str, db: AsyncSession = Depends(get_db)):\n' >> backend/modules/$(name)/router.py
	printf '    """Delete item"""\n' >> backend/modules/$(name)/router.py
	printf '    return ResponseBase(success=True, message="Deleted")\n' >> backend/modules/$(name)/router.py
	@# Create service.py
	printf '"""\nBusiness logic for $(name) module\n"""\n' > backend/modules/$(name)/service.py
	printf 'from sqlalchemy.ext.asyncio import AsyncSession\n\n\n' >> backend/modules/$(name)/service.py
	printf 'class $(name)Service:\n' >> backend/modules/$(name)/service.py
	printf '    """Service layer for $(name) operations"""\n' >> backend/modules/$(name)/service.py
	printf '    \n' >> backend/modules/$(name)/service.py
	printf '    @staticmethod\n' >> backend/modules/$(name)/service.py
	printf '    async def create_item(db: AsyncSession):\n' >> backend/modules/$(name)/service.py
	printf '        """Create a new item"""\n' >> backend/modules/$(name)/service.py
	printf '        pass\n' >> backend/modules/$(name)/service.py
	printf '    \n' >> backend/modules/$(name)/service.py
	printf '    @staticmethod\n' >> backend/modules/$(name)/service.py
	printf '    async def get_items(db: AsyncSession):\n' >> backend/modules/$(name)/service.py
	printf '        """Get all items"""\n' >> backend/modules/$(name)/service.py
	printf '        pass\n' >> backend/modules/$(name)/service.py
	printf '    \n' >> backend/modules/$(name)/service.py
	printf '    @staticmethod\n' >> backend/modules/$(name)/service.py
	printf '    async def get_item(db: AsyncSession, item_id: str):\n' >> backend/modules/$(name)/service.py
	printf '        """Get item by ID"""\n' >> backend/modules/$(name)/service.py
	printf '        pass\n' >> backend/modules/$(name)/service.py
	printf '    \n' >> backend/modules/$(name)/service.py
	printf '    @staticmethod\n' >> backend/modules/$(name)/service.py
	printf '    async def update_item(db: AsyncSession, item_id: str):\n' >> backend/modules/$(name)/service.py
	printf '        """Update item"""\n' >> backend/modules/$(name)/service.py
	printf '        pass\n' >> backend/modules/$(name)/service.py
	printf '    \n' >> backend/modules/$(name)/service.py
	printf '    @staticmethod\n' >> backend/modules/$(name)/service.py
	printf '    async def delete_item(db: AsyncSession, item_id: str):\n' >> backend/modules/$(name)/service.py
	printf '        """Delete item"""\n' >> backend/modules/$(name)/service.py
	printf '        pass\n' >> backend/modules/$(name)/service.py
	@# Create models.py
	printf '"""\nSQLAlchemy models for $(name) module\n"""\n' > backend/modules/$(name)/models.py
	printf 'from sqlalchemy import Column, String, DateTime, Boolean\n' >> backend/modules/$(name)/models.py
	printf 'from sqlalchemy.sql import func\n\n' >> backend/modules/$(name)/models.py
	printf 'from backend.core.database import Base\n\n\n' >> backend/modules/$(name)/models.py
	printf 'class $(name)(Base):\n' >> backend/modules/$(name)/models.py
	printf '    """\n' >> backend/modules/$(name)/models.py
	printf '    $(name) model\n' >> backend/modules/$(name)/models.py
	printf '    """\n' >> backend/modules/$(name)/models.py
	printf '    __tablename__ = '"t_$(name)"'\n' >> backend/modules/$(name)/models.py
	printf '    __table_args__ = {'"'"'schema'"'"': '"'"'public'"'"'}\n\n' >> backend/modules/$(name)/models.py
	printf '    id = Column(String, primary_key=True)\n' >> backend/modules/$(name)/models.py
	printf '    name = Column(String, nullable=False)\n' >> backend/modules/$(name)/models.py
	printf '    active = Column(Boolean, default=True, nullable=False)\n' >> backend/modules/$(name)/models.py
	printf '    tenant_id = Column(String, nullable=False, index=True)\n\n' >> backend/modules/$(name)/models.py
	printf '    created_at = Column(DateTime, server_default=func.now(), nullable=False)\n' >> backend/modules/$(name)/models.py
	printf '    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)\n' >> backend/modules/$(name)/models.py
	@# Create schemas.py
	printf '"""\nPydantic schemas for $(name) module\n"""\n' > backend/modules/$(name)/schemas.py
	printf 'from pydantic import BaseModel\n' >> backend/modules/$(name)/schemas.py
	printf 'from backend.core.schemas import TenantAwareBase, ResponseBase\n\n\n' >> backend/modules/$(name)/schemas.py
	printf 'class $(name)Base(BaseModel):\n' >> backend/modules/$(name)/schemas.py
	printf '    """Base schema"""\n' >> backend/modules/$(name)/schemas.py
	printf '    name: str\n' >> backend/modules/$(name)/schemas.py
	printf '    active: bool = True\n\n\n' >> backend/modules/$(name)/schemas.py
	printf 'class $(name)Create($(name)Base, TenantAwareBase):\n' >> backend/modules/$(name)/schemas.py
	printf '    """Schema for creating"""\n' >> backend/modules/$(name)/schemas.py
	printf '    pass\n\n\n' >> backend/modules/$(name)/schemas.py
	printf 'class $(name)Update(BaseModel):\n' >> backend/modules/$(name)/schemas.py
	printf '    """Schema for updating"""\n' >> backend/modules/$(name)/schemas.py
	printf '    name: str = None\n' >> backend/modules/$(name)/schemas.py
	printf '    active: bool = None\n\n\n' >> backend/modules/$(name)/schemas.py
	printf 'class $(name)Response($(name)Base):\n' >> backend/modules/$(name)/schemas.py
	printf '    """Schema for response"""\n' >> backend/modules/$(name)/schemas.py
	printf '    id: str\n' >> backend/modules/$(name)/schemas.py
	printf '    tenant_id: str\n' >> backend/modules/$(name)/schemas.py
	@# Create streamlit.py
	printf '"""\nStreamlit page for $(name) module\n"""\n' > backend/modules/$(name)/streamlit.py
	printf 'import streamlit as st\n' >> backend/modules/$(name)/streamlit.py
	printf 'from streamlit_app.utils.tenant import get_tenant_config\n\n\n' >> backend/modules/$(name)/streamlit.py
	printf 'def page():\n' >> backend/modules/$(name)/streamlit.py
	printf '    """Main page function"""\n' >> backend/modules/$(name)/streamlit.py
	printf '    st.title("$(name)")\n' >> backend/modules/$(name)/streamlit.py
	printf '    \n' >> backend/modules/$(name)/streamlit.py
	printf '    tenant = get_tenant_config()\n' >> backend/modules/$(name)/streamlit.py
	printf '    \n' >> backend/modules/$(name)/streamlit.py
	printf '    if not tenant.is_module_enabled("$(name)"):\n' >> backend/modules/$(name)/streamlit.py
	printf '        st.error("Dieses Modul ist für Ihren Mandanten nicht aktiviert.")\n' >> backend/modules/$(name)/streamlit.py
	printf '        return\n' >> backend/modules/$(name)/streamlit.py
	printf '    \n' >> backend/modules/$(name)/streamlit.py
	printf '    st.write("Page content for $(name) module")\n\n\n' >> backend/modules/$(name)/streamlit.py
	printf 'def render():\n' >> backend/modules/$(name)/streamlit.py
	printf '    """Alias for page() for backward compatibility"""\n' >> backend/modules/$(name)/streamlit.py
	printf '    page()\n' >> backend/modules/$(name)/streamlit.py
	@# Create seed.py
	printf '"""\nDemo data seeder for $(name) module\n"""\n' > backend/modules/$(name)/seed.py
	printf 'from sqlalchemy.ext.asyncio import AsyncSession\n\n\n' >> backend/modules/$(name)/seed.py
	printf 'async def seed_demo_$(name)(db: AsyncSession, tenant_id: str):\n' >> backend/modules/$(name)/seed.py
	printf '    """\n' >> backend/modules/$(name)/seed.py
	printf '    Seed demo data for $(name)\n' >> backend/modules/$(name)/seed.py
	printf '    """\n' >> backend/modules/$(name)/seed.py
	printf '    print(f"Seeding $(name) for tenant {tenant_id}")\n' >> backend/modules/$(name)/seed.py
	@echo ""
	@echo "Module $(name) created successfully!"
	@echo ""
	@echo "Files created:"
	@echo "  backend/modules/$(name)/router.py"
	@echo "  backend/modules/$(name)/service.py"
	@echo "  backend/modules/$(name)/models.py"
	@echo "  backend/modules/$(name)/schemas.py"
	@echo "  backend/modules/$(name)/streamlit.py"
	@echo "  backend/modules/$(name)/seed.py"
	@echo ""
	@echo "To enable this module, add '$(name)' to the enabled_modules list in your client YAML file."

# Database migrations (using Alembic)
migrate:
	@echo "Running database migrations..."
	alembic upgrade head

# Initialize database (create tables)
init-db:
	@echo "Initializing database..."
	-docker exec lis-white-postgres-1 psql -U postgres -d lis_dev -f /docker-entrypoint-initdb.d/init.sql
	@echo "Database initialized!"

# Seed demo data
seed:
	@echo "Seeding demo data..."
	python -m backend.modules.services.seed

# Reset database (drop and recreate)
reset-db:
	@echo "Resetting database..."
	-docker exec lis-white-postgres-1 psql -U postgres -c "DROP DATABASE IF EXISTS lis_dev;"
	-docker exec lis-white-postgres-1 psql -U postgres -c "CREATE DATABASE lis_dev;"
	@echo "Database reset! Now run: make init-db"

# Run tests
test:
	@echo "Running tests..."
	pytest tests/ -v

# Install dependencies (local development)
install:
	pip install -r requirements.txt

# Format code
format:
	black backend/ streamlit_app/
	isort backend/ streamlit_app/

# Lint code
lint:
	flake8 backend/ streamlit_app/
	mypy backend/
