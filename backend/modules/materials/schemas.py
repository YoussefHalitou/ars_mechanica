"""
Pydantic schemas for materials module
"""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

from backend.core.schemas import ResponseBase, PaginatedResponse


class MaterialBase(BaseModel):
    """Base schema for material"""
    name: str = Field(..., min_length=1, max_length=255, description="Material name")
    unit: str = Field(..., max_length=50, description="Unit of measurement (Stück, m, Rolle, etc.)")
    category: Optional[str] = Field(None, max_length=100, description="Material category")
    vat_rate: Optional[float] = Field(19.00, ge=0, le=100, description="VAT rate percentage")
    is_active: bool = Field(True, description="Whether material is active")
    default_quantity: Optional[float] = Field(None, ge=0, description="Default quantity")


class MaterialCreate(MaterialBase):
    """Schema for creating a material"""
    pass


class MaterialUpdate(BaseModel):
    """Schema for updating a material"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    vat_rate: Optional[float] = Field(None, ge=0, le=100)
    is_active: Optional[bool] = None
    default_quantity: Optional[float] = Field(None, ge=0)
    
    model_config = ConfigDict(extra="forbid")


class MaterialPriceSchema(BaseModel):
    """Schema for material pricing"""
    cost_per_unit: Optional[float] = Field(None, ge=0, description="Cost per unit")
    price_per_unit: Optional[float] = Field(None, ge=0, description="Selling price per unit")
    currency: str = Field('EUR', max_length=3, description="Currency code")
    
    model_config = ConfigDict(from_attributes=True)


class MaterialResponse(MaterialBase):
    """Schema for material response"""
    material_id: str
    created_at: datetime
    updated_at: datetime
    prices: Optional[MaterialPriceSchema] = None
    margin: Optional[float] = Field(None, description="Calculated margin (price - cost)")
    
    model_config = ConfigDict(from_attributes=True)


class MaterialListResponse(PaginatedResponse):
    """Schema for paginated material list response"""
    items: List[MaterialResponse]


class MaterialCSVImport(BaseModel):
    """Schema for CSV import"""
    name: str
    unit: str
    category: Optional[str] = None
    vat_rate: Optional[float] = 19.00
    is_active: bool = True
    cost_per_unit: Optional[float] = None
    price_per_unit: Optional[float] = None
    default_quantity: Optional[float] = None


class MaterialsResponse(ResponseBase):
    """Wrapper for material responses"""
    data: Optional[List[MaterialResponse]] = None


class MaterialDetailResponse(ResponseBase):
    """Wrapper for single material response"""
    data: Optional[MaterialResponse] = None
