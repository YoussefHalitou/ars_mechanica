"""
Pydantic schemas for time pairs module
"""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date
from datetime import time as dt_time

from backend.core.schemas import ResponseBase, PaginatedResponse


class TimePairGenerateRequest(BaseModel):
    """Request schema for generating time pairs from morning plan"""
    plan_id: str = Field(..., description="Morning plan ID")
    plan_date: date = Field(..., description="Date for the plan")


class TimePairBase(BaseModel):
    """Base schema for time pair"""
    project_id: Optional[str] = Field(None, description="Project ID")
    datum: date = Field(..., description="Date of the time pair")
    mitarbeiter: str = Field(..., description="Employee name")
    employee_id: Optional[str] = Field(None, description="Employee ID")
    employee_name: Optional[str] = Field(None, description="Employee name")
    employee_code: Optional[str] = Field(None, description="Employee code")
    
    # Time ranges
    lis_von: Optional[dt_time] = Field(None, description="LIS start time")
    lis_bis: Optional[dt_time] = Field(None, description="LIS end time")
    kunde_von: Optional[dt_time] = Field(None, description="Customer start time")
    kunde_bis: Optional[dt_time] = Field(None, description="Customer end time")
    
    # Break and calculated fields
    pause_min: Optional[int] = Field(0, ge=0, description="Break time in minutes")
    pause: Optional[str] = Field(None, description="Break time as string")
    
    # References
    staff_id: Optional[str] = Field(None, description="Staff assignment ID")
    abnahme_id: Optional[str] = Field(None, description="Abnahme (acceptance) ID")
    plan_id: Optional[str] = Field(None, description="Morning plan ID")
    
    notes: Optional[str] = Field(None, description="Notes")


class TimePairCreate(TimePairBase):
    """Schema for creating a time pair"""
    pass


class TimePairUpdate(BaseModel):
    """Schema for updating a time pair"""
    project_id: Optional[str] = None
    datum: Optional[date] = None
    mitarbeiter: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    lis_von: Optional[dt_time] = None
    lis_bis: Optional[dt_time] = None
    kunde_von: Optional[dt_time] = None
    kunde_bis: Optional[dt_time] = None
    pause_min: Optional[int] = Field(None, ge=0)
    pause: Optional[str] = None
    staff_id: Optional[str] = None
    abnahme_id: Optional[str] = None
    plan_id: Optional[str] = None
    notes: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class TimePairResponse(TimePairBase):
    """Schema for time pair response"""
    id: int
    pair_id: str
    ges_lis_h: Optional[float] = Field(None, description="Total LIS hours (calculated)")
    ges_kd_h: Optional[float] = Field(None, description="Total customer hours (calculated)")
    ges_lis: Optional[str] = Field(None, description="LIS hours as string")
    ges_kd: Optional[str] = Field(None, description="Customer hours as string")
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class TimePairListResponse(PaginatedResponse):
    """Schema for paginated time pair list response"""
    items: List[TimePairResponse]


class TimePairWithStaffData(TimePairResponse):
    """Extended response with staff data (matches Retool transformer tr_time_pairs_with_staff_data)"""
    staff_data: Optional[dict] = None
    employee_rate: Optional[float] = None
    total_cost: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


class TimePairsResponse(ResponseBase):
    """Wrapper for time pair responses"""
    data: Optional[List[TimePairResponse]] = None


class TimePairGenerateResponse(ResponseBase):
    """Response for time pair generation"""
    data: Optional[List[TimePairWithStaffData]] = None
    count: int = 0
