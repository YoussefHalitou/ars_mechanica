"""
Pydantic schemas for Morningplan module
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class MorningPlanBase(BaseModel):
    """Base schema for morning plan"""
    plan_date: date
    plan_type: str = Field(..., description="Plan type: prae, inter, post")
    project_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str = "Entwurf"
    planned_start_time: Optional[datetime] = None
    planned_end_time: Optional[datetime] = None
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    vehicle_assignment: Optional[str] = None


class MorningPlanCreate(MorningPlanBase):
    """Schema for creating morning plan"""
    pass


class MorningPlanUpdate(BaseModel):
    """Schema for updating morning plan"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    planned_start_time: Optional[datetime] = None
    planned_end_time: Optional[datetime] = None
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    vehicle_assignment: Optional[str] = None
    is_completed: Optional[bool] = None
    is_approved: Optional[bool] = None
    requires_follow_up: Optional[bool] = None
    notes: Optional[str] = None


class MorningPlanStaffBase(BaseModel):
    """Base schema for morning plan staff assignment"""
    employee_id: str
    role: str = "Mitarbeiter"
    individual_start_time: Optional[datetime] = None
    sort_order: int = 999
    is_present: bool = True
    attendance_notes: Optional[str] = None


class MorningPlanStaffCreate(MorningPlanStaffBase):
    """Schema for creating staff assignment"""
    pass


class MorningPlanStaffUpdate(BaseModel):
    """Schema for updating staff assignment"""
    role: Optional[str] = None
    individual_start_time: Optional[datetime] = None
    sort_order: Optional[int] = None
    is_present: Optional[bool] = None
    attendance_notes: Optional[str] = None


class MorningPlanTaskBase(BaseModel):
    """Base schema for morning plan task"""
    task_name: str
    task_description: Optional[str] = None
    task_category: Optional[str] = None
    estimated_duration: Optional[int] = None
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    status: str = "Geplant"
    priority: str = "Normal"
    assigned_staff_id: Optional[str] = None
    depends_on_task_id: Optional[str] = None
    notes: Optional[str] = None


class MorningPlanTaskCreate(MorningPlanTaskBase):
    """Schema for creating task"""
    pass


class MorningPlanTaskUpdate(BaseModel):
    """Schema for updating task"""
    task_name: Optional[str] = None
    task_description: Optional[str] = None
    task_category: Optional[str] = None
    estimated_duration: Optional[int] = None
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_staff_id: Optional[str] = None
    notes: Optional[str] = None
    completion_notes: Optional[str] = None


class MorningPlanChecklistBase(BaseModel):
    """Base schema for morning plan checklist"""
    item_name: str
    item_description: Optional[str] = None
    category: Optional[str] = None
    is_completed: bool = False


class MorningPlanChecklistCreate(MorningPlanChecklistBase):
    """Schema for creating checklist item"""
    pass


class MorningPlanChecklistUpdate(BaseModel):
    """Schema for updating checklist item"""
    item_name: Optional[str] = None
    item_description: Optional[str] = None
    category: Optional[str] = None
    is_completed: Optional[bool] = None
    completed_by: Optional[str] = None
    completed_at: Optional[datetime] = None


# Response schemas
class MorningPlanStaff(MorningPlanStaffBase):
    """Response schema for morning plan staff"""
    id: int
    plan_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MorningPlanTask(MorningPlanTaskBase):
    """Response schema for morning plan task"""
    task_id: str
    plan_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MorningPlanChecklist(MorningPlanChecklistBase):
    """Response schema for morning plan checklist"""
    checklist_id: str
    plan_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MorningPlan(MorningPlanBase):
    """Response schema for morning plan"""
    plan_id: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    is_completed: bool = False
    is_approved: bool = False
    requires_follow_up: bool = False
    
    staff: List[MorningPlanStaff] = []
    tasks: List[MorningPlanTask] = []
    checklist: List[MorningPlanChecklist] = []
    
    class Config:
        from_attributes = True
