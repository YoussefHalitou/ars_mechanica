"""
SQLAlchemy models for Nachkalkulation (Post-Calculation) module
Comprehensive cost and revenue analysis for completed projects
"""
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Date, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4
import uuid

from backend.core.database import Base


class Nachkalkulation(Base):
    """
    Main post-calculation record for projects
    """
    __tablename__ = 't_nachkalkulation'
    __table_args__ = {'schema': 'public'}
    
    # Primary key
    nachkalkulation_id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # Project reference
    project_id = Column(String, ForeignKey('public.t_projects.project_id'), nullable=False, unique=True)
    
    # Calculation period
    calculation_date = Column(Date, nullable=False)
    calculated_by = Column(UUID(as_uuid=True), ForeignKey('public.t_users.user_id'), nullable=False)
    
    # Revenue summary
    total_revenue = Column(Numeric(15, 2), default=0)
    revenue_services = Column(Numeric(15, 2), default=0)
    revenue_materials = Column(Numeric(15, 2), default=0)
    revenue_other = Column(Numeric(15, 2), default=0)
    
    # Cost breakdown
    total_costs = Column(Numeric(15, 2), default=0)
    cost_employees = Column(Numeric(15, 2), default=0)
    cost_vehicles = Column(Numeric(15, 2), default=0)
    cost_materials = Column(Numeric(15, 2), default=0)
    cost_external = Column(Numeric(15, 2), default=0)
    cost_overhead = Column(Numeric(15, 2), default=0)
    
    # Calculated metrics
    gross_profit = Column(Numeric(15, 2), default=0)
    net_profit = Column(Numeric(15, 2), default=0)
    profit_margin_percent = Column(Numeric(5, 2), default=0)
    
    # Hour tracking
    total_hours_planned = Column(Numeric(8, 2), default=0)
    total_hours_actual = Column(Numeric(8, 2), default=0)
    hours_variance_percent = Column(Numeric(5, 2), default=0)
    
    # Status
    status = Column(String, default='In Bearbeitung')  # In Bearbeitung, Freigegeben, Abgeschlossen
    is_locked = Column(Boolean, default=False)
    
    # Review and approval
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey('public.t_users.user_id'))
    reviewed_at = Column(DateTime)
    approved_by = Column(UUID(as_uuid=True), ForeignKey('public.t_users.user_id'))
    approved_at = Column(DateTime)
    
    # Notes
    notes = Column(Text)
    variance_explanation = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="nachkalkulation")
    calculated_by_user = relationship("User", foreign_keys=[calculated_by])
    reviewed_by_user = relationship("User", foreign_keys=[reviewed_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    details = relationship("NachkalkulationDetail", back_populates="nachkalkulation", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Nachkalkulation(nachkalkulation_id='{self.nachkalkulation_id}', project_id='{self.project_id}')>"
    
    def calculate_totals(self):
        """Calculate all totals and margins"""
        # Calculate costs
        self.total_costs = (self.cost_employees or 0) + (self.cost_vehicles or 0) + \
                          (self.cost_materials or 0) + (self.cost_external or 0) + \
                          (self.cost_overhead or 0)
        
        # Calculate revenue
        self.total_revenue = (self.revenue_services or 0) + (self.revenue_materials or 0) + \
                            (self.revenue_other or 0)
        
        # Calculate profit
        self.gross_profit = self.total_revenue - self.total_costs
        self.net_profit = self.gross_profit  # Could add tax calculations here
        
        # Calculate margin
        if self.total_revenue and self.total_revenue > 0:
            self.profit_margin_percent = (self.net_profit / self.total_revenue) * 100
        
        # Calculate hours variance
        if self.total_hours_planned and self.total_hours_planned > 0:
            self.hours_variance_percent = ((self.total_hours_actual or 0) - self.total_hours_planned) / self.total_hours_planned * 100


class NachkalkulationDetail(Base):
    """
    Detailed line items for post-calculation
    """
    __tablename__ = 't_nachkalkulation_details'
    __table_args__ = {'schema': 'public'}
    
    # Primary key
    detail_id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # Reference to main calculation
    nachkalkulation_id = Column(String, ForeignKey('public.t_nachkalkulation.nachkalkulation_id'), nullable=False)
    
    # Item details
    item_type = Column(String, nullable=False)  # service, material, vehicle, employee, external
    item_category = Column(String)  # Dienstleistung, Verpackung, Fahrzeug, Arbeitszeit
    item_description = Column(String, nullable=False)
    item_reference_id = Column(String)  # Reference to original item (service_id, material_id, etc.)
    
    # Planned vs actual
    quantity_planned = Column(Numeric(10, 2), default=0)
    quantity_actual = Column(Numeric(10, 2), default=0)
    unit = Column(String)
    unit_price_planned = Column(Numeric(10, 2), default=0)
    unit_price_actual = Column(Numeric(10, 2), default=0)
    
    # Totals
    total_planned = Column(Numeric(15, 2), default=0)
    total_actual = Column(Numeric(15, 2), default=0)
    variance = Column(Numeric(15, 2), default=0)
    variance_percent = Column(Numeric(5, 2), default=0)
    
    # Employee reference (for time-based entries)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('public.t_employees.employee_id'))
    employee_name = Column(String)
    hours_worked = Column(Numeric(8, 2))
    hourly_rate = Column(Numeric(10, 2))
    
    # Notes
    notes = Column(Text)
    variance_reason = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    nachkalkulation = relationship("Nachkalkulation", back_populates="details")
    employee = relationship("Employee")
    
    def __repr__(self):
        return f"<NachkalkulationDetail(detail_id='{self.detail_id}', item_description='{self.item_description}')>"
    
    def calculate_variance(self):
        """Calculate variance between planned and actual"""
        self.total_planned = (self.quantity_planned or 0) * (self.unit_price_planned or 0)
        self.total_actual = (self.quantity_actual or 0) * (self.unit_price_actual or 0)
        self.variance = self.total_actual - self.total_planned
        
        if self.total_planned and self.total_planned > 0:
            self.variance_percent = (self.variance / self.total_planned) * 100


class NachkalkulationEmployeeSummary(Base):
    """
    Employee summary for post-calculation
    """
    __tablename__ = 't_nachkalkulation_employee_summary'
    __table_args__ = {'schema': 'public'}
    
    # Primary key
    summary_id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # References
    nachkalkulation_id = Column(String, ForeignKey('public.t_nachkalkulation.nachkalkulation_id'), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('public.t_employees.employee_id'), nullable=False)
    
    # Employee info
    employee_name = Column(String, nullable=False)
    employee_role = Column(String)
    hourly_rate = Column(Numeric(10, 2), default=0)
    
    # Hours summary
    hours_planned = Column(Numeric(8, 2), default=0)
    hours_actual = Column(Numeric(8, 2), default=0)
    hours_overtime = Column(Numeric(8, 2), default=0)
    hours_weekend = Column(Numeric(8, 2), default=0)
    
    # Cost summary
    cost_planned = Column(Numeric(15, 2), default=0)
    cost_actual = Column(Numeric(15, 2), default=0)
    cost_overtime = Column(Numeric(15, 2), default=0)
    
    # Performance metrics
    efficiency_percent = Column(Numeric(5, 2), default=0)
    attendance_score = Column(Numeric(3, 1), default=0)
    quality_score = Column(Numeric(3, 1), default=0)
    
    # Notes
    performance_notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    nachkalkulation = relationship("Nachkalkulation")
    employee = relationship("Employee")
    
    def __repr__(self):
        return f"<NachkalkulationEmployeeSummary(summary_id='{self.summary_id}', employee_name='{self.employee_name}')>"
    
    def calculate_efficiency(self):
        """Calculate employee efficiency"""
        if self.hours_planned and self.hours_planned > 0:
            self.efficiency_percent = (self.hours_planned / (self.hours_actual or 1)) * 100


class NachkalkulationMaterialSummary(Base):
    """
    Material summary for post-calculation
    """
    __tablename__ = 't_nachkalkulation_material_summary'
    __table_args__ = {'schema': 'public'}
    
    # Primary key
    summary_id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # References
    nachkalkulation_id = Column(String, ForeignKey('public.t_nachkalkulation.nachkalkulation_id'), nullable=False)
    material_id = Column(String, ForeignKey('public.t_materials.material_id'))
    
    # Material info
    material_name = Column(String, nullable=False)
    material_category = Column(String)
    unit = Column(String)
    
    # Quantity summary
    quantity_planned = Column(Numeric(10, 2), default=0)
    quantity_actual = Column(Numeric(10, 2), default=0)
    quantity_waste = Column(Numeric(10, 2), default=0)
    
    # Cost summary
    cost_planned = Column(Numeric(15, 2), default=0)
    cost_actual = Column(Numeric(15, 2), default=0)
    cost_waste = Column(Numeric(15, 2), default=0)
    
    # Waste metrics
    waste_percent = Column(Numeric(5, 2), default=0)
    
    # Notes
    usage_notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    nachkalkulation = relationship("Nachkalkulation")
    material = relationship("Material")
    
    def __repr__(self):
        return f"<NachkalkulationMaterialSummary(summary_id='{self.summary_id}', material_name='{self.material_name}')>"
    
    def calculate_waste(self):
        """Calculate material waste"""
        if self.quantity_planned and self.quantity_planned > 0:
            self.waste_percent = ((self.quantity_waste or 0) / self.quantity_planned) * 100
