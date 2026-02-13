"""
Pydantic schemas for Inspections module (Draftbit architecture)
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from backend.core.schemas import TenantAwareBase, ResponseBase


class InspectionBase(BaseModel):
    """Base schema for inspections"""
    project_id: Optional[str] = None
    inspection_code: Optional[str] = None
    
    # Billing Address
    anrede: Optional[str] = None
    name: Optional[str] = None
    strasse: Optional[str] = None
    nr: Optional[str] = None
    plz: Optional[str] = None
    ort: Optional[str] = None
    telefon: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    
    # Target Address
    ziel_anrede: Optional[str] = None
    ziel_name: Optional[str] = None
    ziel_strasse: Optional[str] = None
    ziel_nr: Optional[str] = None
    ziel_plz: Optional[str] = None
    ziel_ort: Optional[str] = None
    
    # Service Details
    etage: Optional[str] = None
    hvz: Optional[str] = None
    sonderstoffe: Optional[str] = None
    lkw_groesse: Optional[str] = None
    extrainformationen: Optional[str] = None
    dienstleistungsart_p: Optional[str] = None
    dienstleistungsart_w: Optional[str] = None
    
    # Appointment
    appointment_at: Optional[datetime] = None
    wunschtermin: Optional[datetime] = None
    
    # Status
    status: Optional[str] = Field('In Bearbeitung', description="Inspection status")

    @validator('status')
    def validate_status(cls, v):
        if v and v not in ['In Bearbeitung', 'Abgeschlossen', 'Storniert', 'Geplant']:
            raise ValueError('Status must be In Bearbeitung, Abgeschlossen, Storniert, or Geplant')
        return v


class InspectionCreate(InspectionBase, TenantAwareBase):
    """Schema for creating inspections"""
    pass


class InspectionUpdate(BaseModel):
    """Schema for updating inspections"""
    project_id: Optional[str] = None
    inspection_code: Optional[str] = None
    
    # Billing Address
    anrede: Optional[str] = None
    name: Optional[str] = None
    strasse: Optional[str] = None
    nr: Optional[str] = None
    plz: Optional[str] = None
    ort: Optional[str] = None
    telefon: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    
    # Target Address
    ziel_anrede: Optional[str] = None
    ziel_name: Optional[str] = None
    ziel_strasse: Optional[str] = None
    ziel_nr: Optional[str] = None
    ziel_plz: Optional[str] = None
    ziel_ort: Optional[str] = None
    
    # Service Details
    etage: Optional[str] = None
    hvz: Optional[str] = None
    sonderstoffe: Optional[str] = None
    lkw_groesse: Optional[str] = None
    extrainformationen: Optional[str] = None
    dienstleistungsart_p: Optional[str] = None
    dienstleistungsart_w: Optional[str] = None
    
    # Appointment
    appointment_at: Optional[datetime] = None
    wunschtermin: Optional[datetime] = None
    
    # Status
    status: Optional[str] = None


class InspectionResponse(InspectionBase):
    """Schema for inspection responses"""
    inspection_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Inspection Item schemas
class InspectionItemBase(BaseModel):
    """Base schema for inspection items (rooms)"""
    inspection_id: str
    room: str
    notes: Optional[str] = None
    volume_m3: Optional[float] = 0
    persons: Optional[int] = 0
    hours: Optional[float] = 0


class InspectionItemCreate(InspectionItemBase):
    """Schema for creating inspection items"""
    pass


class InspectionItemResponse(InspectionItemBase):
    """Schema for inspection item responses"""
    id: int
    sum_hours: float
    created_at: datetime
    
    class Config:
        from_attributes = True


# Inspection Room Item schemas
class InspectionRoomItemBase(BaseModel):
    """Base schema for inspection room items (Gegenstände)"""
    inspection_id: str
    room_id: int
    item_name: str
    quantity: int = 1
    notes: Optional[str] = None
    montage_option: Optional[str] = 'Keine'


class InspectionRoomItemCreate(InspectionRoomItemBase):
    """Schema for creating inspection room items"""
    pass


class InspectionRoomItemResponse(InspectionRoomItemBase):
    """Schema for inspection room item responses"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Inspection Photo schemas
class InspectionPhotoBase(BaseModel):
    """Base schema for inspection photos"""
    inspection_id: str
    url: str
    caption: Optional[str] = None
    category: Optional[str] = None


class InspectionPhotoCreate(InspectionPhotoBase):
    """Schema for creating inspection photos"""
    pass


class InspectionPhotoResponse(InspectionPhotoBase):
    """Schema for inspection photo responses"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Inspection Calc Item schemas
class InspectionCalcItemBase(BaseModel):
    """Base schema for inspection calculation items"""
    inspection_id: str
    kind: str
    position_label: Optional[str] = None
    qty: Optional[float] = 0
    unit: Optional[str] = None
    unit_price: Optional[float] = 0
    sort_order: Optional[int] = 0


class InspectionCalcItemCreate(InspectionCalcItemBase):
    """Schema for creating inspection calc items"""
    pass


class InspectionCalcItemResponse(InspectionCalcItemBase):
    """Schema for inspection calc item responses"""
    id: int
    line_total: float
    created_at: datetime
    
    class Config:
        from_attributes = True


# Inspection Discount schemas
class InspectionDiscountBase(BaseModel):
    """Base schema for inspection discounts"""
    inspection_id: str
    mode: str
    value: float = 0
    description: Optional[str] = None

    @validator('mode')
    def validate_mode(cls, v):
        if v not in ['percent', 'absolute']:
            raise ValueError('Mode must be percent or absolute')
        return v


class InspectionDiscountCreate(InspectionDiscountBase):
    """Schema for creating inspection discounts"""
    pass


class InspectionDiscountResponse(InspectionDiscountBase):
    """Schema for inspection discount responses"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
