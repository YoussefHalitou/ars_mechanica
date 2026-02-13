"""
Pydantic schemas for projects module (Nachkalkulation)
"""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date

from backend.core.schemas import ResponseBase, PaginatedResponse


class ProjectBase(BaseModel):
    """Base schema for project"""
    anrede: Optional[str] = Field(None, description="Salutation (Herr/Frau)")
    name: Optional[str] = Field(None, description="Customer name")
    strasse: Optional[str] = Field(None, description="Street")
    nr: Optional[str] = Field(None, description="House number")
    plz: Optional[str] = Field(None, description="Postal code")
    ort: Optional[str] = Field(None, description="City")
    telefon: Optional[str] = Field(None, description="Phone number")
    email: Optional[str] = Field(None, description="Email address")
    notes: Optional[str] = Field(None, description="Notes")
    
    # Project details
    dienstleistungen: Optional[str] = Field(None, description="Services")
    offer_type: Optional[str] = Field(None, description="Offer type")
    
    # Dates
    project_date: Optional[date] = Field(None, description="Project date")
    project_time: Optional[str] = Field(None, description="Project time")
    project_start_date: Optional[date] = Field(None, description="Project start date")
    project_end_date: Optional[date] = Field(None, description="Project end date")
    
    # Status (matches DDL: status text DEFAULT 'In Planung'::text)
    status: Optional[str] = Field('In Planung', description="Project status")


class ProjectCreate(ProjectBase):
    """Schema for creating a project"""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project"""
    anrede: Optional[str] = None
    name: Optional[str] = None
    strasse: Optional[str] = None
    nr: Optional[str] = None
    plz: Optional[str] = None
    ort: Optional[str] = None
    telefon: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    dienstleistungen: Optional[str] = None
    offer_type: Optional[str] = None
    project_date: Optional[date] = None
    project_time: Optional[str] = None
    project_start_date: Optional[date] = None
    project_end_date: Optional[date] = None
    status: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class ProjectResponse(ProjectBase):
    """Schema for project response"""
    project_id: str
    project_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ProjectListResponse(PaginatedResponse):
    """Schema for paginated project list response"""
    items: List[ProjectResponse]


# Nachkalkulation (Post-calculation) schemas

class ProjectRevenueItemSchema(BaseModel):
    """Schema for project revenue items"""
    id: Optional[str] = None
    project_id: str
    position_label: str = Field(..., description="Position label")
    qty: float = Field(..., gt=0, description="Quantity")
    unit: Optional[str] = Field(None, description="Unit")
    unit_price: float = Field(..., ge=0, description="Price per unit")
    line_total: Optional[float] = Field(None, description="Line total (calculated)")
    kind: Optional[str] = Field('manual', description="Item kind")
    source_inspection_id: Optional[str] = None
    sort_order: Optional[float] = None
    notes: Optional[str] = None


class ProjectVehicleCostSchema(BaseModel):
    """Schema for project vehicle costs"""
    id: Optional[str] = None
    project_id: str
    vehicle_id: Optional[str] = None
    usage_type: str = Field(..., description="Usage type (Stunden, Kilometer, Tage)")
    usage_value: float = Field(..., gt=0, description="Usage value")
    cost_per_unit: Optional[float] = Field(None, ge=0, description="Cost per unit")
    total_cost: Optional[float] = Field(None, description="Total cost (calculated)")
    notes: Optional[str] = None


class ProjectMaterialUsageSchema(BaseModel):
    """Schema for project material usage"""
    id: Optional[str] = None
    project_id: str
    material_id: Optional[str] = None
    quantity: float = Field(1, gt=0, description="Quantity used")
    phase: Optional[str] = Field('Nachkalkulation', description="Calculation phase")
    inspection_id: Optional[str] = None


class NachkalkulationResponse(BaseModel):
    """Response schema for Nachkalkulation (post-calculation)"""
    project: ProjectResponse
    revenue_items: List[ProjectRevenueItemSchema]
    vehicle_costs: List[ProjectVehicleCostSchema]
    material_usage: List[ProjectMaterialUsageSchema]
    
    # Calculated totals
    revenue_total: float = Field(0, description="Total revenue")
    cost_total: float = Field(0, description="Total costs")
    marge_eur: float = Field(0, description="Margin in EUR")
    marge_pct: float = Field(0, description="Margin percentage")
    
    model_config = ConfigDict(from_attributes=True)


class ProjectsResponse(ResponseBase):
    """Wrapper for project responses"""
    data: Optional[List[ProjectResponse]] = None


class ProjectDetailResponse(ResponseBase):
    """Wrapper for single project response"""
    data: Optional[ProjectResponse] = None


class NachkalkulationDetailResponse(ResponseBase):
    """Wrapper for Nachkalkulation response"""
    data: Optional[NachkalkulationResponse] = None
