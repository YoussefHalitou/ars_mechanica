"""
SQLAlchemy models for Inspections module (Draftbit architecture)
"""
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base
import uuid


class Inspection(Base):
    """
    Inspection/Besichtigung records
    """
    __tablename__ = 't_inspections'
    __table_args__ = {'schema': 'public'}
    
    inspection_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_code = Column(String, unique=True)
    project_id = Column(String, ForeignKey('public.t_projects.project_id'))
    
    # Billing Address
    anrede = Column(String)
    name = Column(String)
    strasse = Column(String)
    nr = Column(String)
    plz = Column(String)
    ort = Column(String)
    telefon = Column(String)
    email = Column(String)
    notes = Column(Text)
    
    # Target Address
    ziel_anrede = Column(String)
    ziel_name = Column(String)
    ziel_strasse = Column(String)
    ziel_nr = Column(String)
    ziel_plz = Column(String)
    ziel_ort = Column(String)
    
    # Service Details
    etage = Column(String)
    hvz = Column(String)
    sonderstoffe = Column(String)
    lkw_groesse = Column(String)
    extrainformationen = Column(Text)
    dienstleistungsart_p = Column(String)
    dienstleistungsart_w = Column(String)
    
    # Appointment
    appointment_at = Column(DateTime)
    wunschtermin = Column(Date)
    
    # Lexoffice Integration
    lexoffice_contact_id = Column(String)
    lexoffice_quotation_id = Column(String)
    lexoffice_quotation_number = Column(String)
    lexoffice_order_confirmation_id = Column(String)
    lexoffice_order_confirmation_number = Column(String)
    
    # Customer Acceptance
    customer_accepted = Column(Boolean)
    customer_accepted_at = Column(DateTime)
    customer_declined_at = Column(DateTime)
    customer_decision_notes = Column(Text)
    work_project_id = Column(String)
    
    # Status
    status = Column(String, default='In Bearbeitung')
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    project = relationship("Project")
    items = relationship("InspectionItem", back_populates="inspection", cascade="all, delete-orphan")
    room_items = relationship("InspectionRoomItem", back_populates="inspection", cascade="all, delete-orphan")
    photos = relationship("InspectionPhoto", back_populates="inspection", cascade="all, delete-orphan")
    calc_items = relationship("InspectionCalcItem", back_populates="inspection", cascade="all, delete-orphan")
    discounts = relationship("InspectionDiscount", back_populates="inspection", cascade="all, delete-orphan")
    material_usage = relationship("ProjectMaterialUsage")


class InspectionItem(Base):
    """
    Rooms/areas in an inspection
    """
    __tablename__ = 't_inspection_items'
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(UUID(as_uuid=True), ForeignKey('public.t_inspections.inspection_id'), nullable=False)
    room = Column(String, nullable=False)
    notes = Column(Text)
    volume_m3 = Column(Numeric, default=0)
    persons = Column(Integer, default=0)
    hours = Column(Numeric, default=0)
    sum_hours = Column(Numeric, default=0)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    inspection = relationship("Inspection", back_populates="items")
    room_items = relationship("InspectionRoomItem", back_populates="room", cascade="all, delete-orphan")


class InspectionRoomItem(Base):
    """
    Individual items (Gegenstände) for each room
    """
    __tablename__ = 't_inspection_room_items'
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(UUID(as_uuid=True), ForeignKey('public.t_inspections.inspection_id'), nullable=False)
    room_id = Column(Integer, ForeignKey('public.t_inspection_items.id'), nullable=False)
    item_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    notes = Column(Text)
    montage_option = Column(String, nullable=False, default='Keine')
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    inspection = relationship("Inspection", back_populates="room_items")
    room = relationship("InspectionItem", back_populates="room_items")


class InspectionPhoto(Base):
    """
    Photos uploaded for each inspection
    """
    __tablename__ = 't_inspection_photos'
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(UUID(as_uuid=True), ForeignKey('public.t_inspections.inspection_id'), nullable=False)
    url = Column(String, nullable=False)
    caption = Column(Text)
    category = Column(String)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    inspection = relationship("Inspection", back_populates="photos")


class InspectionCalcItem(Base):
    """
    Calculation line items for quotations
    """
    __tablename__ = 't_inspection_calc_items'
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(UUID(as_uuid=True), ForeignKey('public.t_inspections.inspection_id'), nullable=False)
    kind = Column(String, nullable=False)
    position_label = Column(String)
    qty = Column(Numeric, default=0)
    unit = Column(String)
    unit_price = Column(Numeric, default=0)
    line_total = Column(Numeric, default=0)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    inspection = relationship("Inspection", back_populates="calc_items")


class InspectionDiscount(Base):
    """
    Discount entries for quotations
    """
    __tablename__ = 't_inspection_discounts'
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(UUID(as_uuid=True), ForeignKey('public.t_inspections.inspection_id'), nullable=False)
    mode = Column(String, nullable=False)  # 'percent' or 'absolute'
    value = Column(Numeric, default=0)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    inspection = relationship("Inspection", back_populates="discounts")


class InspectionCategory(Base):
    """
    Inspection categories for classification
    """
    __tablename__ = 't_inspection_categories'
    __table_args__ = {'schema': 'public'}
    
    id = Column(String, primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    
    def __repr__(self):
        return f"<InspectionCategory(id='{self.id}', name='{self.name}'>"
