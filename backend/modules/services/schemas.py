"""
Pydantic schemas for services module
"""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

from backend.core.schemas import TenantAwareBase, ResponseBase, PaginatedResponse


class ServiceBase(BaseModel):
    """Base schema for service"""
    name: str = Field(..., min_length=1, max_length=255, description="Service name")
    default_unit: Optional[str] = Field(None, max_length=50, description="Unit of measurement")
    category: Optional[str] = Field(None, max_length=100, description="Service category")
    is_active: bool = Field(True, description="Whether service is active")


class ServiceCreate(ServiceBase):
    """Schema for creating a service"""
    pass


class ServiceUpdate(BaseModel):
    """Schema for updating a service"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    default_unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(extra="forbid")


class ServiceResponse(ServiceBase):
    """Schema for service response"""
    service_id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ServiceListResponse(PaginatedResponse):
    """Schema for paginated service list response"""
    items: List[ServiceResponse]


class ServiceCSVImport(BaseModel):
    """Schema for CSV import"""
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    price_per_unit: float
    cost_per_unit: Optional[float] = None
    active: bool = True


class ServicesResponse(ResponseBase):
    """Wrapper for service responses"""
    data: Optional[List[ServiceResponse]] = None


class ServiceDetailResponse(ResponseBase):
    """Wrapper for single service response"""
    data: Optional[ServiceResponse] = None
