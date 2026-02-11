"""
SQLAlchemy models for services module
Matches public.t_services table exactly from DDL
"""
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from sqlalchemy.sql import func
from datetime import datetime

from backend.core.database import Base


class Service(Base):
    """
    Service model matching public.t_services table exactly
    """
    __tablename__ = 't_services'
    __table_args__ = (
        Index('idx_services_tenant', 'tenant_id'),
        {'schema': 'public'}
    )
    
    # Primary key (matches DDL: service_id text NOT NULL)
    service_id = Column(String, primary_key=True)
    
    # Multi-tenancy support
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('public.t_tenants.tenant_id'), nullable=True, index=True)
    
    # Service information (matches DDL exactly)
    name = Column(String, nullable=False)
    default_unit = Column(String)  # This is 'unit' in DDL
    category = Column(String)
    
    # Status (matches DDL: is_active boolean DEFAULT true)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps (matches DDL exactly)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Service(service_id='{self.service_id}', name='{self.name}')>"
    
    def to_dict(self):
        return {
            'service_id': self.service_id,
            'name': self.name,
            'default_unit': self.default_unit,
            'category': self.category,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ServiceCategory(Base):
    """
    Service category model
    """
    __tablename__ = 't_service_categories'
    __table_args__ = {'schema': 'public'}
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    
    def __repr__(self):
        return f"<ServiceCategory(id='{self.id}', name='{self.name}')>"
