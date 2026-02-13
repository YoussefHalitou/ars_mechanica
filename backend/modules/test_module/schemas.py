"""
Pydantic schemas for test_module module
"""
from pydantic import BaseModel
from backend.core.schemas import TenantAwareBase, ResponseBase


class test_moduleBase(BaseModel):
    """Base schema"""
    name: str
    active: bool = True


class test_moduleCreate(test_moduleBase, TenantAwareBase):
    """Schema for creating"""
    pass


class test_moduleUpdate(BaseModel):
    """Schema for updating"""
    name: str = None
    active: bool = None


class test_moduleResponse(test_moduleBase):
    """Schema for response"""
    id: str
    tenant_id: str
