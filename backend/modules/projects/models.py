"""
SQLAlchemy models for projects module
Matches public.t_projects table exactly from DDL
"""
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Date, Time, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
import uuid

from backend.core.database import Base


class ProjectStatus(str, Enum):
    """Project status enumeration"""
    IN_PLANUNG = "In Planung"
    ANGEBOTEN = "angeboten"
    BESTAETIGT = "bestätigt"
    IN_BEARBEITUNG = "in_bearbeitung"
    ABGESCHLOSSEN = "abgeschlossen"
    STORNIERT = "storniert"


class Project(Base):
    """
    Project model matching public.t_projects table exactly
    """
    __tablename__ = 't_projects'
    __table_args__ = (
        Index('idx_projects_tenant', 'tenant_id'),
        {'schema': 'public'}
    )
    
    # Primary key (matches DDL: project_id uuid NOT NULL DEFAULT uuid_generate_v4())
    project_id = Column(String, primary_key=True)
    
    # Multi-tenancy support
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('public.t_tenants.tenant_id'), nullable=True, index=True)
    
    # Project information (matches DDL exactly)
    project_code = Column(String, unique=True)
    anrede = Column(String)
    name = Column(String)
    strasse = Column(String)
    nr = Column(String)
    plz = Column(String)
    ort = Column(String)
    telefon = Column(String)
    email = Column(String)
    notes = Column(Text)
    
    # Project details
    dienstleistungen = Column(Text)
    offer_type = Column(String)
    
    # Dates and times
    project_date = Column(Date)
    project_time = Column(Time)
    project_start_date = Column(Date)
    project_end_date = Column(Date)
    
    # Status (matches DDL: status text DEFAULT 'In Planung'::text)
    status = Column(String, default='In Planung')
    
    # Timestamps (matches DDL exactly)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    revenue_items = relationship("ProjectRevenueItem", back_populates="project", cascade="all, delete-orphan")
    vehicle_costs = relationship("ProjectVehicleCost", back_populates="project", cascade="all, delete-orphan")
    material_usage = relationship("ProjectMaterialUsage", back_populates="project", cascade="all, delete-orphan")
    extra_costs = relationship("ProjectExtraCost", back_populates="project", cascade="all, delete-orphan")
    discounts = relationship("ProjectDiscount", back_populates="project", cascade="all, delete-orphan")
    morning_plans = relationship("MorningPlan", back_populates="project", cascade="all, delete-orphan")
    nachkalkulation = relationship("Nachkalkulation", back_populates="project", uselist=False)
    abnahmen = relationship("Abnahme", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project(project_id='{self.project_id}', name='{self.name}', project_code='{self.project_code}')>"
    
    def to_dict(self):
        return {
            'project_id': self.project_id,
            'project_code': self.project_code,
            'anrede': self.anrede,
            'name': self.name,
            'strasse': self.strasse,
            'nr': self.nr,
            'plz': self.plz,
            'ort': self.ort,
            'telefon': self.telefon,
            'email': self.email,
            'notes': self.notes,
            'status': self.status,
            'dienstleistungen': self.dienstleistungen,
            'offer_type': self.offer_type,
            'project_date': self.project_date.isoformat() if self.project_date else None,
            'project_time': self.project_time.isoformat() if self.project_time else None,
            'project_start_date': self.project_start_date.isoformat() if self.project_start_date else None,
            'project_end_date': self.project_end_date.isoformat() if self.project_end_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def calculate_totals(self):
        """Calculate project totals for Nachkalkulation"""
        # Revenue total
        revenue_total = sum(item.line_total or 0 for item in self.revenue_items)
        
        # Vehicle costs total
        vehicle_total = sum(cost.total_cost or 0 for cost in self.vehicle_costs)
        
        # Material usage total
        material_total = 0  # Calculated from material_usage with prices
        
        # Extra costs total
        extra_total = sum(cost.cost or 0 for cost in self.extra_costs)
        
        # Total cost
        cost_total = vehicle_total + material_total + extra_total
        
        # Margin calculations
        marge_eur = revenue_total - cost_total
        marge_pct = (marge_eur / revenue_total * 100) if revenue_total > 0 else 0
        
        return {
            'revenue_total': revenue_total,
            'cost_total': cost_total,
            'marge_eur': marge_eur,
            'marge_pct': marge_pct,
            'vehicle_total': vehicle_total,
            'material_total': material_total,
            'extra_total': extra_total
        }


class ProjectRevenueItem(Base):
    """
    Project revenue items from t_project_revenue_items table
    """
    __tablename__ = 't_project_revenue_items'
    __table_args__ = {'schema': 'public'}
    
    id = Column(String, primary_key=True, default=func.uuid_generate_v4())
    project_id = Column(String, ForeignKey('public.t_projects.project_id'), nullable=False)
    position_label = Column(String, nullable=False)
    qty = Column(Numeric, nullable=False)
    unit = Column(String)
    unit_price = Column(Numeric, nullable=False)
    line_total = Column(Numeric)
    kind = Column(String, default='manual')
    source_inspection_id = Column(UUID(as_uuid=True), ForeignKey('public.t_inspections.inspection_id'))
    sort_order = Column(Numeric)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="revenue_items")
    
    def __repr__(self):
        return f"<ProjectRevenueItem(id='{self.id}', project_id='{self.project_id}')>"


class ProjectVehicleCost(Base):
    """
    Project vehicle costs from t_project_vehicle_costs table
    """
    __tablename__ = 't_project_vehicle_costs'
    __table_args__ = {'schema': 'public'}
    
    id = Column(String, primary_key=True, default=func.uuid_generate_v4())
    project_id = Column(String, ForeignKey('public.t_projects.project_id'), nullable=False)
    vehicle_id = Column(String, ForeignKey('public.t_vehicles.vehicle_id'))
    usage_type = Column(String, nullable=False)  # e.g., 'Stunden', 'Kilometer', 'Tage'
    usage_value = Column(Numeric, nullable=False)
    cost_per_unit = Column(Numeric)
    total_cost = Column(Numeric)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="vehicle_costs")
    
    def __repr__(self):
        return f"<ProjectVehicleCost(id='{self.id}', project_id='{self.project_id}')>"


class ProjectMaterialUsage(Base):
    """
    Project material usage from t_project_material_usage table
    """
    __tablename__ = 't_project_material_usage'
    __table_args__ = {'schema': 'public'}
    
    id = Column(String, primary_key=True, default=func.uuid_generate_v4())
    project_id = Column(String, ForeignKey('public.t_projects.project_id'), nullable=False)
    material_id = Column(String, ForeignKey('public.t_materials.material_id'))
    quantity = Column(Numeric, default=1)
    phase = Column(String, default='Nachkalkulation')
    inspection_id = Column(UUID(as_uuid=True), ForeignKey('public.t_inspections.inspection_id'))
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="material_usage")
    
    def __repr__(self):
        return f"<ProjectMaterialUsage(id='{self.id}', project_id='{self.project_id}')>"


class ProjectExtraCost(Base):
    """
    Project extra costs from t_project_costs_extra table
    """
    __tablename__ = 't_project_costs_extra'
    __table_args__ = {'schema': 'public'}
    
    cost_id = Column(String, primary_key=True, default=func.uuid_generate_v4())
    project_id = Column(String, ForeignKey('public.t_projects.project_id'), nullable=False)
    cost_type = Column(String, nullable=False)  # e.g., 'Entsorgung', 'Sonderleistung', 'Externe Kosten'
    description = Column(Text)
    cost = Column(Numeric, nullable=False)
    phase = Column(String, default='Nachkalkulation')
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="extra_costs")
    
    def __repr__(self):
        return f"<ProjectExtraCost(cost_id='{self.cost_id}', project_id='{self.project_id}')>"


class ProjectDiscount(Base):
    """
    Project discounts from t_project_discounts table
    """
    __tablename__ = 't_project_discounts'
    __table_args__ = {'schema': 'public'}
    
    id = Column(String, primary_key=True, default=func.uuid_generate_v4())
    project_id = Column(String, ForeignKey('public.t_projects.project_id'), nullable=False)
    target = Column(String, nullable=False)  # e.g., 'revenue', 'vehicle_costs', 'total'
    mode = Column(String, nullable=False)  # 'percentage' or 'fixed'
    value = Column(Numeric, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="discounts")
    
    def __repr__(self):
        return f"<ProjectDiscount(id='{self.id}', project_id='{self.project_id}')>"


