"""
Material usage module - imports from projects.models
"""
from sqlalchemy import Column, String, Numeric, DateTime, Date, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4

from backend.core.database import Base
from backend.modules.projects.models import ProjectMaterialUsage


class MaterialUsage(Base):
    """
    Material usage for projects
    """
    __tablename__ = 't_material_usage'
    __table_args__ = {'schema': 'public'}
    
    # Primary key
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # Project and material references
    project_id = Column(String, ForeignKey('public.t_projects.project_id'), nullable=False)
    material_id = Column(String, ForeignKey('public.t_materials.material_id'), nullable=False)
    
    # Usage details
    usage_date = Column(Date, nullable=False)
    quantity = Column(Numeric, nullable=False, default=1)
    unit_cost = Column(Numeric)
    total_cost = Column(Numeric)
    
    # Notes
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    project = relationship("Project")
    material = relationship("Material")
    
    def __repr__(self):
        return f"<MaterialUsage(id='{self.id}', project_id='{self.project_id}', material_id='{self.material_id}')>"
