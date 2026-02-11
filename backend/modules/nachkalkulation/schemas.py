"""
Pydantic schemas for Nachkalkulation (Post-Calculation) module
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class NachkalkulationBase(BaseModel):
    """Base schema for nachkalkulation"""
    project_id: str
    calculation_date: date
    calculated_by: str
    status: str = "In Bearbeitung"
    notes: Optional[str] = None
    variance_explanation: Optional[str] = None


class NachkalkulationCreate(NachkalkulationBase):
    """Schema for creating nachkalkulation"""
    pass


class NachkalkulationUpdate(BaseModel):
    """Schema for updating nachkalkulation"""
    status: Optional[str] = None
    notes: Optional[str] = None
    variance_explanation: Optional[str] = None
    is_locked: Optional[bool] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None


class NachkalkulationDetailBase(BaseModel):
    """Base schema for nachkalkulation detail"""
    item_type: str  # service, material, vehicle, employee, external
    item_category: Optional[str] = None
    item_description: str
    item_reference_id: Optional[str] = None
    quantity_planned: Optional[Decimal] = Decimal(0)
    quantity_actual: Optional[Decimal] = Decimal(0)
    unit: Optional[str] = None
    unit_price_planned: Optional[Decimal] = Decimal(0)
    unit_price_actual: Optional[Decimal] = Decimal(0)
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    hours_worked: Optional[Decimal] = None
    hourly_rate: Optional[Decimal] = None
    notes: Optional[str] = None
    variance_reason: Optional[str] = None


class NachkalkulationDetailCreate(NachkalkulationDetailBase):
    """Schema for creating nachkalkulation detail"""
    pass


class NachkalkulationDetailUpdate(BaseModel):
    """Schema for updating nachkalkulation detail"""
    item_description: Optional[str] = None
    quantity_planned: Optional[Decimal] = None
    quantity_actual: Optional[Decimal] = None
    unit_price_planned: Optional[Decimal] = None
    unit_price_actual: Optional[Decimal] = None
    notes: Optional[str] = None
    variance_reason: Optional[str] = None


class NachkalkulationEmployeeSummaryBase(BaseModel):
    """Base schema for employee summary"""
    employee_id: str
    employee_name: str
    employee_role: Optional[str] = None
    hourly_rate: Optional[Decimal] = Decimal(0)
    hours_planned: Optional[Decimal] = Decimal(0)
    hours_actual: Optional[Decimal] = Decimal(0)
    hours_overtime: Optional[Decimal] = Decimal(0)
    hours_weekend: Optional[Decimal] = Decimal(0)
    attendance_score: Optional[Decimal] = Decimal(0)
    quality_score: Optional[Decimal] = Decimal(0)
    performance_notes: Optional[str] = None


class NachkalkulationMaterialSummaryBase(BaseModel):
    """Base schema for material summary"""
    material_id: Optional[str] = None
    material_name: str
    material_category: Optional[str] = None
    unit: Optional[str] = None
    quantity_planned: Optional[Decimal] = Decimal(0)
    quantity_actual: Optional[Decimal] = Decimal(0)
    quantity_waste: Optional[Decimal] = Decimal(0)
    usage_notes: Optional[str] = None


# Response schemas
class NachkalkulationDetail(NachkalkulationDetailBase):
    """Response schema for nachkalkulation detail"""
    detail_id: str
    nachkalkulation_id: str
    total_planned: Optional[Decimal] = Decimal(0)
    total_actual: Optional[Decimal] = Decimal(0)
    variance: Optional[Decimal] = Decimal(0)
    variance_percent: Optional[Decimal] = Decimal(0)
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class NachkalkulationEmployeeSummary(NachkalkulationEmployeeSummaryBase):
    """Response schema for employee summary"""
    summary_id: str
    nachkalkulation_id: str
    cost_planned: Optional[Decimal] = Decimal(0)
    cost_actual: Optional[Decimal] = Decimal(0)
    cost_overtime: Optional[Decimal] = Decimal(0)
    efficiency_percent: Optional[Decimal] = Decimal(0)
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class NachkalkulationMaterialSummary(NachkalkulationMaterialSummaryBase):
    """Response schema for material summary"""
    summary_id: str
    nachkalkulation_id: str
    cost_planned: Optional[Decimal] = Decimal(0)
    cost_actual: Optional[Decimal] = Decimal(0)
    cost_waste: Optional[Decimal] = Decimal(0)
    waste_percent: Optional[Decimal] = Decimal(0)
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class Nachkalkulation(NachkalkulationBase):
    """Response schema for nachkalkulation"""
    nachkalkulation_id: str
    created_at: datetime
    updated_at: datetime
    
    # Calculated fields
    total_revenue: Optional[Decimal] = Decimal(0)
    revenue_services: Optional[Decimal] = Decimal(0)
    revenue_materials: Optional[Decimal] = Decimal(0)
    revenue_other: Optional[Decimal] = Decimal(0)
    total_costs: Optional[Decimal] = Decimal(0)
    cost_employees: Optional[Decimal] = Decimal(0)
    cost_vehicles: Optional[Decimal] = Decimal(0)
    cost_materials: Optional[Decimal] = Decimal(0)
    cost_external: Optional[Decimal] = Decimal(0)
    cost_overhead: Optional[Decimal] = Decimal(0)
    gross_profit: Optional[Decimal] = Decimal(0)
    net_profit: Optional[Decimal] = Decimal(0)
    profit_margin_percent: Optional[Decimal] = Decimal(0)
    total_hours_planned: Optional[Decimal] = Decimal(0)
    total_hours_actual: Optional[Decimal] = Decimal(0)
    hours_variance_percent: Optional[Decimal] = Decimal(0)
    is_locked: bool = False
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    
    # Nested relationships
    details: List[NachkalkulationDetail] = []
    employee_summaries: List[NachkalkulationEmployeeSummary] = []
    material_summaries: List[NachkalkulationMaterialSummary] = []
    
    class Config:
        from_attributes = True


class NachkalkulationSummary(BaseModel):
    """Summary schema for dashboard display"""
    nachkalkulation_id: str
    project_id: str
    calculation_date: date
    status: str
    total_revenue: Decimal
    total_costs: Decimal
    net_profit: Decimal
    profit_margin_percent: Decimal
    is_locked: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
