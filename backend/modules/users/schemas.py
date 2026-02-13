"""
Pydantic schemas for Users & Employees module (Draftbit architecture)
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any, Dict
from datetime import datetime
from uuid import UUID
from backend.core.schemas import TenantAwareBase, ResponseBase


# Tenant schemas
class TenantBase(BaseModel):
    """Base schema for tenants"""
    name: str = Field(..., description="Company name")
    industry: str = Field(default="general", description="Industry: moving, plumbing, electrical, carpentry, general")
    email: str = Field(..., description="Primary contact email")
    phone: Optional[str] = Field(None, description="Contact phone")
    address: Optional[str] = Field(None, description="Business address")
    
    @validator('industry')
    def validate_industry(cls, v):
        allowed = ['moving', 'plumbing', 'electrical', 'carpentry', 'general']
        if v not in allowed:
            raise ValueError(f'Industry must be one of: {allowed}')
        return v


class TenantCreate(TenantBase):
    """Schema for creating tenants"""
    pass


class TenantUpdate(BaseModel):
    """Schema for updating tenants"""
    name: Optional[str] = None
    industry: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    enabled_modules: Optional[List[str]] = None


class TenantResponse(TenantBase):
    """Schema for tenant responses"""
    tenant_id: UUID
    slug: str
    logo_url: Optional[str]
    primary_color: str
    secondary_color: str
    settings: Dict[str, Any]
    enabled_modules: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Subscription schemas
class SubscriptionBase(BaseModel):
    """Base schema for subscriptions"""
    tier: str = Field(default="starter", description="Subscription tier: starter, professional, enterprise")
    
    @validator('tier')
    def validate_tier(cls, v):
        allowed = ['starter', 'professional', 'enterprise']
        if v not in allowed:
            raise ValueError(f'Tier must be one of: {allowed}')
        return v


class SubscriptionCreate(SubscriptionBase):
    """Schema for creating subscriptions"""
    tenant_id: UUID


class SubscriptionUpdate(BaseModel):
    """Schema for updating subscriptions"""
    tier: Optional[str] = None
    status: Optional[str] = None
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            allowed = ['trialing', 'active', 'past_due', 'canceled', 'paused']
            if v not in allowed:
                raise ValueError(f'Status must be one of: {allowed}')
        return v


class SubscriptionResponse(SubscriptionBase):
    """Schema for subscription responses"""
    subscription_id: UUID
    tenant_id: UUID
    status: str
    stripe_customer_id: Optional[str]
    stripe_subscription_id: Optional[str]
    trial_starts_at: Optional[datetime]
    trial_ends_at: Optional[datetime]
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    max_users: int
    max_projects: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# User schemas
class UserBase(BaseModel):
    """Base schema for users"""
    email: str = Field(..., description="User email address")
    role: str = Field(..., description="User role: Admin, Secretary, Planner, Supervisor, Worker")
    user_type: str = Field(..., description="User type: office or field")
    is_active: bool = Field(default=True, description="Account status")

    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ['Admin', 'Secretary', 'Planner', 'Supervisor', 'Worker']
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {allowed_roles}')
        return v

    @validator('user_type')
    def validate_user_type(cls, v):
        allowed_types = ['office', 'field']
        if v not in allowed_types:
            raise ValueError(f'User type must be one of: {allowed_types}')
        return v


class UserCreate(UserBase, TenantAwareBase):
    """Schema for creating users"""
    pass


class UserUpdate(BaseModel):
    """Schema for updating users"""
    email: Optional[str] = None
    role: Optional[str] = None
    user_type: Optional[str] = None
    is_active: Optional[bool] = None

    @validator('role')
    def validate_role(cls, v):
        if v is not None:
            allowed_roles = ['Admin', 'Secretary', 'Planner', 'Supervisor', 'Worker']
            if v not in allowed_roles:
                raise ValueError(f'Role must be one of: {allowed_roles}')
        return v

    @validator('user_type')
    def validate_user_type(cls, v):
        if v is not None:
            allowed_types = ['office', 'field']
            if v not in allowed_types:
                raise ValueError(f'User type must be one of: {allowed_types}')
        return v


class UserResponse(UserBase):
    """Schema for user responses"""
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Employee schemas
class EmployeeBase(BaseModel):
    """Base schema for employees"""
    email: str = Field(..., description="Employee email")
    employee_number: Optional[str] = Field(None, description="Company employee number")
    first_name: Optional[str] = Field(None, description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    phone: Optional[str] = Field(None, description="Phone number")
    department: Optional[str] = Field(None, description="Department")
    position: Optional[str] = Field(None, description="Job position")
    hire_date: Optional[datetime] = Field(None, description="Date hired")


class EmployeeCreate(EmployeeBase, TenantAwareBase):
    """Schema for creating employees"""
    user_id: str = Field(..., description="Associated user ID")


class EmployeeUpdate(BaseModel):
    """Schema for updating employees"""
    email: Optional[str] = None
    employee_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    hire_date: Optional[datetime] = None


class EmployeeResponse(EmployeeBase):
    """Schema for employee responses"""
    employee_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Analytics schemas
class AnalyticsEventBase(BaseModel):
    """Base schema for analytics events"""
    event_id: str = Field(..., description="Unique event identifier")
    level: str = Field(..., description="Event level: debug, info, warn, error, fatal")
    category: str = Field(..., description="Event category: auth, navigation, inspection, abnahme, sync, offline, user_action, error, performance")
    event_name: str = Field(..., description="Event name")
    user_id: Optional[str] = Field(None, description="Associated user ID")
    metadata: Optional[dict] = Field(None, description="Additional event data")
    error_message: Optional[str] = Field(None, description="Error message if applicable")
    error_stack: Optional[str] = Field(None, description="Error stack trace")
    error_code: Optional[str] = Field(None, description="Error code")

    @validator('level')
    def validate_level(cls, v):
        allowed_levels = ['debug', 'info', 'warn', 'error', 'fatal']
        if v not in allowed_levels:
            raise ValueError(f'Level must be one of: {allowed_levels}')
        return v

    @validator('category')
    def validate_category(cls, v):
        allowed_categories = ['auth', 'navigation', 'inspection', 'abnahme', 'sync', 'offline', 'user_action', 'error', 'performance']
        if v not in allowed_categories:
            raise ValueError(f'Category must be one of: {allowed_categories}')
        return v


class AnalyticsEventCreate(AnalyticsEventBase):
    """Schema for creating analytics events"""
    pass


class AnalyticsEventResponse(AnalyticsEventBase):
    """Schema for analytics event responses"""
    created_at: datetime

    class Config:
        from_attributes = True


# Feedback schemas
class FeedbackBase(BaseModel):
    """Base schema for feedback"""
    user_email: str = Field(..., description="User email")
    feedback_type: str = Field(..., description="Feedback type: bug, feature, feedback, sync_issue, other")
    message: str = Field(..., description="Feedback message")
    priority: Optional[str] = Field('medium', description="Priority: low, medium, high, critical")

    @validator('feedback_type')
    def validate_feedback_type(cls, v):
        allowed_types = ['bug', 'feature', 'feedback', 'sync_issue', 'other']
        if v not in allowed_types:
            raise ValueError(f'Feedback type must be one of: {allowed_types}')
        return v

    @validator('priority')
    def validate_priority(cls, v):
        if v is not None:
            allowed_priorities = ['low', 'medium', 'high', 'critical']
            if v not in allowed_priorities:
                raise ValueError(f'Priority must be one of: {allowed_priorities}')
        return v


class FeedbackCreate(FeedbackBase, TenantAwareBase):
    """Schema for creating feedback"""
    pass


class FeedbackUpdate(BaseModel):
    """Schema for updating feedback"""
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None

    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            allowed_status = ['new', 'in_progress', 'resolved', 'closed']
            if v not in allowed_status:
                raise ValueError(f'Status must be one of: {allowed_status}')
        return v


class FeedbackResponse(FeedbackBase):
    """Schema for feedback responses"""
    feedback_id: str
    user_id: Optional[str]
    assigned_to: Optional[str]
    status: str
    resolution_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


# Worker rating schemas
class WorkerRatingBase(BaseModel):
    """Base schema for worker ratings"""
    rating_id: str = Field(..., description="Unique rating identifier")
    project_id: str = Field(..., description="Project reference")
    plan_id: str = Field(..., description="Plan reference")
    employee_id: str = Field(..., description="Employee reference")
    employee_name: Optional[str] = Field(None, description="Employee name (denormalized)")
    datum: datetime = Field(..., description="Rating date")
    rating: int = Field(..., description="Rating value (1-10)", ge=1, le=10)
    notes: Optional[str] = Field(None, description="Rating notes")


class WorkerRatingCreate(WorkerRatingBase):
    """Schema for creating worker ratings"""
    pass


class WorkerRatingResponse(WorkerRatingBase):
    """Schema for worker rating responses"""
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Combined response schemas
class UserWithEmployeeResponse(UserResponse):
    """User response with employee data"""
    employee: Optional[EmployeeResponse] = None


class EmployeeWithUserResponse(EmployeeResponse):
    """Employee response with user data"""
    user: Optional[UserResponse] = None
