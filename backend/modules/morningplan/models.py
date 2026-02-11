"""
SQLAlchemy models for Morningplan module (Prä, Inter, Post Morningplan)
Based on Draftbit architecture with t_morningplan and related tables
"""
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, ForeignKey, Integer, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from backend.core.database import Base


class MorningPlan(Base):
    """
    Morning plan (Morgenplan) - daily work plan
    """
    __tablename__ = 't_morningplan'
    __table_args__ = (
        Index('idx_morningplan_tenant', 'tenant_id'),
        {'schema': 'public'}
    )
    
    # Primary key
    plan_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Multi-tenancy support
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('public.t_tenants.tenant_id'), nullable=True, index=True)
    
    # Plan metadata
    plan_date = Column(Date, nullable=False)
    plan_type = Column(String, nullable=False)  # 'prae', 'inter', 'post'
    project_id = Column(String, ForeignKey('public.t_projects.project_id'))
    status = Column(String, default='Entwurf')  # Entwurf, Bestätigt, Abgeschlossen
    
    # Plan details
    title = Column(String, nullable=False)
    description = Column(Text)
    notes = Column(Text)
    
    # Location and logistics
    start_location = Column(String)
    end_location = Column(String)
    vehicle_assignment = Column(String)
    
    # Timing
    planned_start_time = Column(DateTime)
    planned_end_time = Column(DateTime)
    actual_start_time = Column(DateTime)
    actual_end_time = Column(DateTime)
    
    # Status flags
    is_completed = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=False)
    requires_follow_up = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey('public.t_users.user_id'))
    
    # Relationships
    project = relationship("Project", back_populates="morning_plans")
    staff = relationship("MorningPlanStaff", back_populates="plan", cascade="all, delete-orphan")
    time_pairs = relationship("TimePair", back_populates="plan")
    tasks = relationship("MorningPlanTask", back_populates="plan", cascade="all, delete-orphan")
    checklist = relationship("MorningPlanChecklist", back_populates="plan", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<MorningPlan(plan_id='{self.plan_id}', plan_date='{self.plan_date}', type='{self.plan_type}')>"


class MorningPlanStaff(Base):
    """
    Staff assignments for morning plans
    """
    __tablename__ = 't_morningplan_staff'
    __table_args__ = {'schema': 'public'}
    
    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # References
    plan_id = Column(UUID(as_uuid=True), ForeignKey('public.t_morningplan.plan_id'), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('public.t_employees.employee_id'), nullable=False)
    
    # Assignment details
    role = Column(String, default='Mitarbeiter')  # Mitarbeiter, Teamleiter, Fahrer
    individual_start_time = Column(DateTime)
    sort_order = Column(Integer, default=999)
    
    # Status
    is_present = Column(Boolean, default=True)
    attendance_notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    plan = relationship("MorningPlan", back_populates="staff")
    employee = relationship("Employee", back_populates="morningplan_staff")
    
    def __repr__(self):
        return f"<MorningPlanStaff(id={self.id}, plan_id='{self.plan_id}', employee_id='{self.employee_id}')>"


class MorningPlanTask(Base):
    """
    Tasks within a morning plan
    """
    __tablename__ = 't_morningplan_tasks'
    __table_args__ = {'schema': 'public'}
    
    # Primary key
    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # References
    plan_id = Column(UUID(as_uuid=True), ForeignKey('public.t_morningplan.plan_id'), nullable=False)
    
    # Task details
    task_name = Column(String, nullable=False)
    task_description = Column(Text)
    task_category = Column(String)  # Vorbereitung, Transport, Arbeit, Aufräumen
    
    # Timing
    estimated_duration = Column(Integer)  # in minutes
    planned_start = Column(DateTime)
    planned_end = Column(DateTime)
    actual_start = Column(DateTime)
    actual_end = Column(DateTime)
    
    # Status
    status = Column(String, default='Geplant')  # Geplant, In Bearbeitung, Erledigt, Verzögert
    priority = Column(String, default='Normal')  # Niedrig, Normal, Hoch, Kritisch
    
    # Assignment
    assigned_staff_id = Column(UUID(as_uuid=True), ForeignKey('public.t_employees.employee_id'))
    
    # Dependencies
    depends_on_task_id = Column(UUID(as_uuid=True), ForeignKey('public.t_morningplan_tasks.task_id'))
    
    # Notes
    notes = Column(Text)
    completion_notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    plan = relationship("MorningPlan", back_populates="tasks")
    assigned_staff = relationship("Employee")
    dependencies = relationship("MorningPlanTask", remote_side=[task_id])
    
    def __repr__(self):
        return f"<MorningPlanTask(task_id='{self.task_id}', task_name='{self.task_name}', plan_id='{self.plan_id}')>"


class MorningPlanChecklist(Base):
    """
    Checklist items for morning plans
    """
    __tablename__ = 't_morningplan_checklist'
    __table_args__ = {'schema': 'public'}
    
    # Primary key
    checklist_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # References
    plan_id = Column(UUID(as_uuid=True), ForeignKey('public.t_morningplan.plan_id'), nullable=False)
    
    # Checklist item
    item_name = Column(String, nullable=False)
    item_description = Column(Text)
    category = Column(String)  # Sicherheit, Material, Fahrzeug, Dokumente
    
    # Status
    is_completed = Column(Boolean, default=False)
    completed_by = Column(UUID(as_uuid=True), ForeignKey('public.t_users.user_id'))
    completed_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    plan = relationship("MorningPlan", back_populates="checklist")
    
    def __repr__(self):
        return f"<MorningPlanChecklist(checklist_id='{self.checklist_id}', item_name='{self.item_name}', plan_id='{self.plan_id}')>"
