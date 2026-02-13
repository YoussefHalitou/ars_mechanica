"""
SQLAlchemy models for time pairs module
Matches public.t_time_pairs table exactly from DDL
"""
from sqlalchemy import Column, String, Numeric, DateTime, Date, Time, Text, Integer, ForeignKey, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from backend.core.database import Base


class TimePair(Base):
    """
    Time pair model matching public.t_time_pairs table exactly
    """
    __tablename__ = 't_time_pairs'
    __table_args__ = (
        Index('idx_time_pairs_tenant', 'tenant_id'),
        {'schema': 'public'}
    )
    
    # Primary key (matches DDL: id integer NOT NULL DEFAULT nextval(...))
    id = Column(Integer, primary_key=True)
    
    # Multi-tenancy support
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('public.t_tenants.tenant_id'), nullable=True, index=True)
    
    # Unique pair ID (matches DDL: pair_id text NOT NULL UNIQUE)
    pair_id = Column(String, unique=True, nullable=False)
    
    # Project reference (matches DDL: project_id uuid)
    project_id = Column(String, ForeignKey('public.t_projects.project_id'))
    
    # Date (matches DDL: datum date NOT NULL)
    datum = Column(Date, nullable=False)
    
    # Employee info (matches DDL)
    mitarbeiter = Column(String, nullable=False)  # Employee name
    employee_id = Column(UUID(as_uuid=True), ForeignKey('public.t_employees.employee_id'))
    employee_name = Column(String)
    employee_code = Column(String)
    
    # Time ranges (matches DDL)
    lis_von = Column(Time)  # LIS start time
    lis_bis = Column(Time)  # LIS end time
    kunde_von = Column(Time)  # Customer start time
    kunde_bis = Column(Time)  # Customer end time
    
    # Break time (matches DDL: pause_min integer DEFAULT 0)
    pause_min = Column(Integer, default=0)
    pause = Column(String)
    
    # Calculated totals (matches DDL exactly)
    ges_lis_h = Column(Numeric)  # Total LIS hours
    ges_kd_h = Column(Numeric)   # Total customer hours
    ges_lis = Column(String)     # LIS hours as string
    ges_kd = Column(String)      # Customer hours as string
    
    # Additional references
    staff_id = Column(String)
    abnahme_id = Column(String, ForeignKey('public.t_abnahmen.abnahme_id'))
    plan_id = Column(UUID(as_uuid=True), ForeignKey('public.t_morningplan.plan_id'))
    
    # Notes (matches DDL: notes text)
    notes = Column(Text)
    
    # Timestamps (matches DDL)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", backref="time_pairs", foreign_keys=[project_id])
    employee = relationship("Employee", backref="time_pairs", foreign_keys=[employee_id])
    abnahme = relationship("Abnahme", back_populates="time_pairs")
    plan = relationship("MorningPlan", back_populates="time_pairs")
    
    def __repr__(self):
        return f"<TimePair(id={self.id}, pair_id='{self.pair_id}', datum='{self.datum}', mitarbeiter='{self.mitarbeiter}')>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'pair_id': self.pair_id,
            'project_id': self.project_id,
            'datum': self.datum.isoformat() if self.datum else None,
            'mitarbeiter': self.mitarbeiter,
            'employee_id': self.employee_id,
            'employee_name': self.employee_name,
            'employee_code': self.employee_code,
            'lis_von': self.lis_von.isoformat() if self.lis_von else None,
            'lis_bis': self.lis_bis.isoformat() if self.lis_bis else None,
            'kunde_von': self.kunde_von.isoformat() if self.kunde_von else None,
            'kunde_bis': self.kunde_bis.isoformat() if self.kunde_bis else None,
            'pause_min': self.pause_min,
            'pause': self.pause,
            'ges_lis_h': float(self.ges_lis_h) if self.ges_lis_h else None,
            'ges_kd_h': float(self.ges_kd_h) if self.ges_kd_h else None,
            'ges_lis': self.ges_lis,
            'ges_kd': self.ges_kd,
            'staff_id': self.staff_id,
            'abnahme_id': self.abnahme_id,
            'plan_id': self.plan_id,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def calculate_hours(self):
        """Calculate hours from time fields"""
        # LIS hours
        if self.lis_von and self.lis_bis:
            lis_seconds = (self.lis_bis.hour * 3600 + self.lis_bis.minute * 60 + self.lis_bis.second) - \
                         (self.lis_von.hour * 3600 + self.lis_von.minute * 60 + self.lis_von.second)
            lis_hours = lis_seconds / 3600.0
            if self.pause_min:
                lis_hours -= self.pause_min / 60.0
            self.ges_lis_h = max(0, lis_hours)
            self.ges_lis = f"{int(self.ges_lis_h)}:{int((self.ges_lis_h % 1) * 60):02d}"
        
        # Customer hours
        if self.kunde_von and self.kunde_bis:
            kd_seconds = (self.kunde_bis.hour * 3600 + self.kunde_bis.minute * 60 + self.kunde_bis.second) - \
                        (self.kunde_von.hour * 3600 + self.kunde_von.minute * 60 + self.kunde_von.second)
            kd_hours = kd_seconds / 3600.0
            self.ges_kd_h = max(0, kd_hours)
            self.ges_kd = f"{int(self.ges_kd_h)}:{int((self.ges_kd_h % 1) * 60):02d}"


class EmployeeRef:
    """
    Employee reference for relationships
    """
    pass


class ProjectRef:
    """
    Project reference for relationships
    """
    pass


class AbnahmeRef:
    """
    Abnahme reference for relationships
    """
    pass
