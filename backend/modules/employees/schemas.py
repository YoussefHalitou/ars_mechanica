"""
Pydantic schemas for employees module (Mitarbeiterkatalog)
"""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

from backend.core.schemas import ResponseBase, PaginatedResponse


class EmployeeBase(BaseModel):
    """Base schema for employee"""
    employee_code: Optional[str] = Field(None, description="Employee code (unique)")
    name: str = Field(..., min_length=1, max_length=255, description="Employee name")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    role: Optional[str] = Field(None, description="Role/position")
    contract_type: Optional[str] = Field(None, description="Contract type")
    weekly_hours_contract: Optional[float] = Field(None, ge=0, description="Weekly contract hours")
    hourly_rate: Optional[float] = Field(None, ge=0, description="Hourly rate")
    notes: Optional[str] = Field(None, description="Notes")
    is_active: bool = Field(True, description="Whether employee is active")


class EmployeeCreate(EmployeeBase):
    """Schema for creating an employee"""
    pass


class EmployeeUpdate(BaseModel):
    """Schema for updating an employee"""
    employee_code: Optional[str] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    contract_type: Optional[str] = None
    weekly_hours_contract: Optional[float] = Field(None, ge=0)
    hourly_rate: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(extra="forbid")


class EmployeeResponse(EmployeeBase):
    """Schema for employee response"""
    employee_id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class EmployeeListResponse(PaginatedResponse):
    """Schema for paginated employee list response"""
    items: List[EmployeeResponse]


class EmployeesResponse(ResponseBase):
    """Wrapper for employee responses"""
    data: Optional[List[EmployeeResponse]] = None


class EmployeeDetailResponse(ResponseBase):
    """Wrapper for single employee response"""
    data: Optional[EmployeeResponse] = None
