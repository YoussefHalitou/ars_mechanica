"""
Multi-tenancy support for LIS SaaS Platform
Provides tenant context injection, data isolation, and row-level filtering
"""
import uuid
from contextvars import ContextVar
from typing import Optional, Type, TypeVar
from sqlalchemy import Column, ForeignKey, event
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Session, Query
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request, Depends, HTTPException, status

from backend.core.database import Base
from backend.core.auth import get_current_user_optional, CurrentUser

# Context variable to store current tenant ID
_current_tenant: ContextVar[Optional[str]] = ContextVar('current_tenant', default=None)


# ============================================================================
# Tenant Context Management
# ============================================================================

def get_current_tenant_id() -> Optional[str]:
    """Get current tenant ID from context"""
    return _current_tenant.get()


def set_current_tenant_id(tenant_id: Optional[str]) -> None:
    """Set current tenant ID in context"""
    _current_tenant.set(tenant_id)


class TenantContext:
    """
    Context manager for tenant-scoped operations.
    
    Usage:
        with TenantContext(tenant_id):
            # All queries will be filtered by tenant_id
            projects = await get_projects()
    """
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.previous_tenant = None
    
    def __enter__(self):
        self.previous_tenant = get_current_tenant_id()
        set_current_tenant_id(self.tenant_id)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        set_current_tenant_id(self.previous_tenant)
        return False


# ============================================================================
# Tenant Mixin for Models
# ============================================================================

class TenantMixin:
    """
    Mixin class to add tenant_id to models.
    
    Usage:
        class Project(Base, TenantMixin):
            __tablename__ = 't_projects'
            ...
    
    Note: This mixin should be added to models that need tenant isolation.
    Some tables like global settings don't need it.
    """
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey('public.t_tenants.tenant_id'),
        nullable=True,  # nullable for migration period
        index=True  # Important for query performance
    )


# ============================================================================
# FastAPI Dependencies for Tenant Context
# ============================================================================

async def get_tenant_context(
    request: Request,
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional)
) -> Optional[str]:
    """
    Dependency to extract and set tenant context from request.
    
    Priority:
    1. X-Tenant-ID header (for API clients)
    2. Current user's tenant_id (from JWT)
    3. None (for unauthenticated requests)
    """
    tenant_id = None
    
    # Check header first (for API integrations)
    header_tenant = request.headers.get("X-Tenant-ID")
    if header_tenant:
        tenant_id = header_tenant
    
    # Fall back to user's tenant
    elif current_user and current_user.tenant_id:
        tenant_id = current_user.tenant_id
    
    # Set in context
    set_current_tenant_id(tenant_id)
    
    return tenant_id


async def require_tenant(
    tenant_id: Optional[str] = Depends(get_tenant_context)
) -> str:
    """
    Dependency that requires a valid tenant context.
    Raises 401 if no tenant is set.
    """
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tenant context required"
        )
    return tenant_id


# ============================================================================
# Query Helpers for Tenant Filtering
# ============================================================================

T = TypeVar('T', bound=Base)


def tenant_filter(model: Type[T], query):
    """
    Add tenant filter to a query if the model has tenant_id.
    
    Usage:
        query = select(Project)
        query = tenant_filter(Project, query)
    """
    tenant_id = get_current_tenant_id()
    
    if tenant_id and hasattr(model, 'tenant_id'):
        return query.where(model.tenant_id == uuid.UUID(tenant_id))
    
    return query


def set_tenant_on_create(instance: Base) -> None:
    """
    Automatically set tenant_id on new instances if not already set.
    
    Usage:
        project = Project(name="Test")
        set_tenant_on_create(project)  # Sets tenant_id from context
    """
    if hasattr(instance, 'tenant_id') and instance.tenant_id is None:
        tenant_id = get_current_tenant_id()
        if tenant_id:
            instance.tenant_id = uuid.UUID(tenant_id)


# ============================================================================
# SQLAlchemy Event Listeners for Automatic Tenant Assignment
# ============================================================================

def setup_tenant_listeners(model_class: Type[Base]) -> None:
    """
    Set up SQLAlchemy event listeners for automatic tenant assignment.
    Call this for each tenant-aware model.
    
    Usage:
        setup_tenant_listeners(Project)
    """
    @event.listens_for(model_class, 'before_insert')
    def set_tenant_before_insert(mapper, connection, target):
        if hasattr(target, 'tenant_id') and target.tenant_id is None:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                target.tenant_id = uuid.UUID(tenant_id)


# ============================================================================
# Tenant-Aware Base Service
# ============================================================================

class TenantAwareService:
    """
    Base service class with tenant-aware query methods.
    
    Usage:
        class ProjectService(TenantAwareService):
            model = Project
            
            async def get_all(self, db: AsyncSession):
                return await self.get_all_for_tenant(db)
    """
    model: Type[Base] = None
    
    @classmethod
    async def get_all_for_tenant(
        cls,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ):
        """Get all records for current tenant"""
        from sqlalchemy import select
        
        query = select(cls.model)
        query = tenant_filter(cls.model, query)
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @classmethod
    async def get_by_id_for_tenant(
        cls,
        db: AsyncSession,
        id_value,
        id_column: str = None
    ):
        """Get single record by ID for current tenant"""
        from sqlalchemy import select
        
        # Determine ID column
        if id_column is None:
            # Try common patterns
            for col_name in [f'{cls.model.__tablename__[2:]}_id', 'id', f'{cls.model.__name__.lower()}_id']:
                if hasattr(cls.model, col_name):
                    id_column = col_name
                    break
        
        if not id_column:
            raise ValueError(f"Could not determine ID column for {cls.model.__name__}")
        
        query = select(cls.model).where(
            getattr(cls.model, id_column) == id_value
        )
        query = tenant_filter(cls.model, query)
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @classmethod
    async def create_for_tenant(
        cls,
        db: AsyncSession,
        **kwargs
    ):
        """Create a new record with tenant context"""
        instance = cls.model(**kwargs)
        set_tenant_on_create(instance)
        db.add(instance)
        await db.flush()
        return instance
    
    @classmethod
    async def count_for_tenant(cls, db: AsyncSession) -> int:
        """Count records for current tenant"""
        from sqlalchemy import select, func
        
        query = select(func.count()).select_from(cls.model)
        query = tenant_filter(cls.model, query)
        
        result = await db.execute(query)
        return result.scalar()


# ============================================================================
# Middleware for Tenant Context (FastAPI)
# ============================================================================

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to set tenant context for each request.
    
    Usage in main.py:
        app.add_middleware(TenantMiddleware)
    """
    async def dispatch(self, request: StarletteRequest, call_next):
        # Extract tenant from various sources
        tenant_id = None
        
        # 1. Check X-Tenant-ID header
        tenant_id = request.headers.get("X-Tenant-ID")
        
        # 2. Check subdomain (e.g., acme.lisapp.com)
        if not tenant_id:
            host = request.headers.get("host", "")
            if "." in host:
                subdomain = host.split(".")[0]
                if subdomain not in ["www", "api", "app", "localhost"]:
                    # Could lookup tenant by subdomain here
                    pass
        
        # Set context
        set_current_tenant_id(tenant_id)
        
        try:
            response = await call_next(request)
            return response
        finally:
            # Clean up context
            set_current_tenant_id(None)


# ============================================================================
# Exports
# ============================================================================

__all__ = [
    # Context
    "get_current_tenant_id",
    "set_current_tenant_id",
    "TenantContext",
    # Mixin
    "TenantMixin",
    # Dependencies
    "get_tenant_context",
    "require_tenant",
    # Query helpers
    "tenant_filter",
    "set_tenant_on_create",
    "setup_tenant_listeners",
    # Service base
    "TenantAwareService",
    # Middleware
    "TenantMiddleware"
]
