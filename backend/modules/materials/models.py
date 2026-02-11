"""
SQLAlchemy models for materials module
Matches public.t_materials table exactly from DDL
"""
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

from backend.core.database import Base


class Material(Base):
    """
    Material model matching public.t_materials table exactly
    """
    __tablename__ = 't_materials'
    __table_args__ = (
        Index('idx_materials_tenant', 'tenant_id'),
        {'schema': 'public'}
    )
    
    # Primary key (matches DDL: material_id text NOT NULL)
    material_id = Column(String, primary_key=True)
    
    # Multi-tenancy support
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('public.t_tenants.tenant_id'), nullable=True, index=True)
    
    # Material information (matches DDL exactly)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    category = Column(String)
    vat_rate = Column(Numeric, default=19.00)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps (matches DDL exactly)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Additional fields
    default_quantity = Column(Numeric)
    
    # Relationships
    prices = relationship("MaterialPrice", back_populates="material", uselist=False)
    
    def __repr__(self):
        return f"<Material(material_id='{self.material_id}', name='{self.name}')>"
    
    def to_dict(self):
        result = {
            'material_id': self.material_id,
            'name': self.name,
            'unit': self.unit,
            'category': self.category,
            'vat_rate': float(self.vat_rate) if self.vat_rate else 19.00,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'default_quantity': float(self.default_quantity) if self.default_quantity else None
        }
        
        # Add price information if available
        if self.prices:
            result.update({
                'cost_per_unit': float(self.prices.cost_per_unit) if self.prices.cost_per_unit else None,
                'price_per_unit': float(self.prices.price_per_unit) if self.prices.price_per_unit else None
            })
        
        return result


class MaterialPrice(Base):
    """
    Material prices from t_material_prices table
    """
    __tablename__ = 't_material_prices'
    __table_args__ = {'schema': 'public'}
    
    material_id = Column(
        String,
        ForeignKey("public.t_materials.material_id"),
        primary_key=True
    )
    cost_per_unit = Column(Numeric)
    price_per_unit = Column(Numeric)
    currency = Column(String, default='EUR')
    updated_by = Column(String)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    material = relationship("Material", back_populates="prices")
    
    def __repr__(self):
        return f"<MaterialPrice(material_id='{self.material_id}')>"


class MaterialPriceHistory(Base):
    """
    Material price history from t_material_price_history table
    """
    __tablename__ = 't_material_price_history'
    __table_args__ = {'schema': 'public'}
    
    hist_id = Column(String, primary_key=True, default=func.gen_random_uuid())
    material_id = Column(String, nullable=False)
    old_price = Column(Numeric)
    new_price = Column(Numeric)
    changed_at = Column(DateTime, server_default=func.now())
    changed_by = Column(String)
    
    def __repr__(self):
        return f"<MaterialPriceHistory(hist_id='{self.hist_id}')>"


class MaterialCategory(Base):
    """
    Material category model
    """
    __tablename__ = 't_material_categories'
    __table_args__ = {'schema': 'public'}
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    
    def __repr__(self):
        return f"<MaterialCategory(id='{self.id}', name='{self.name}')>"
