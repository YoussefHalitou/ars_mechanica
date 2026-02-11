"""
Alembic environment configuration with multi-tenant support
"""
import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from sqlalchemy.ext.asyncio import AsyncEngine
from alembic import context

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import your models
from backend.core.database import Base

# Import ALL models for auto-generation
# Users, Tenants, Subscriptions
from backend.modules.users.models import (
    Tenant, Subscription, User, Employee, AnalyticsEvent,
    Feedback, WorkerRating, EmployeeRateHistory, EmployeeDailyNote
)
# Billing
from backend.modules.billing.models import PaymentMethod, Invoice, UsageRecord, WebhookEvent
# Core business modules
from backend.modules.services.models import Service
from backend.modules.projects.models import *
from backend.modules.materials.models import *
from backend.modules.time_pairs.models import *
from backend.modules.morningplan.models import *
from backend.modules.inspections.models import *
from backend.modules.abnahmen.models import *
from backend.modules.revenue.models import *
from backend.modules.vehicle_costs.models import *
from backend.modules.material_usage.models import *
from backend.modules.nachkalkulation.models import *
from backend.modules.employees.models import *
from backend.modules.analytics.models import *
from backend.modules.feedback.models import *
from backend.modules.test_module.models import *

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_database_url():
    """Get database URL from environment"""
    url = os.getenv(
        "DATABASE_URL",
        os.getenv(
            "SUPABASE_URL",
            "postgresql+asyncpg://postgres:postgres@localhost:5432/lis_dev"
        )
    )
    # Ensure we use asyncpg driver
    if "postgresql://" in url and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://")
    return url


def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Use async engine configuration
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_database_url()
    
    connectable = AsyncEngine(
        engine_from_config(
            configuration,
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
            future=True,
        )
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def do_run_migrations(connection):
    """Run migrations with connection"""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    import asyncio
    asyncio.run(run_migrations_online())
