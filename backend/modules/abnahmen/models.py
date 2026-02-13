"""
SQLAlchemy models for Abnahmen (completion protocols) module
"""
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4

from backend.core.database import Base


class Abnahme(Base):
    """
    Abnahme (completion protocol) model
    """
    __tablename__ = 't_abnahmen'
    __table_args__ = {'schema': 'public'}
    
    # Primary key
    abnahme_id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # Project reference
    project_id = Column(String, ForeignKey('public.t_projects.project_id'), nullable=False)
    
    # Protocol details
    protocol_number = Column(String, unique=True, nullable=False)
    abnahme_date = Column(Date, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_signatory = Column(String)
    description = Column(Text)
    
    # Status fields
    work_completed = Column(Boolean, default=False)
    payment_received = Column(Boolean, default=False)
    defects_reported = Column(Boolean, default=False)
    defect_description = Column(Text)
    completion_percentage = Column(Numeric, default=100)
    
    # Notes and follow-up
    notes = Column(Text)
    follow_up_required = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="abnahmen")
    time_pairs = relationship("TimePair", back_populates="abnahme")
    
    def __repr__(self):
        return f"<Abnahme(abnahme_id='{self.abnahme_id}', protocol_number='{self.protocol_number}')>"
