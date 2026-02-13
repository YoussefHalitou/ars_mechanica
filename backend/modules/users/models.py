"""
SQLAlchemy models for Users & Employees module (Draftbit architecture)
"""
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, ForeignKey, Integer, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base
import uuid
from uuid import uuid4


class Tenant(Base):
    """
    Tenant model - represents a company/organization using the platform
    """
    __tablename__ = 't_tenants'
    __table_args__ = {'schema': 'public'}
    
    tenant_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)  # URL-friendly identifier
    industry = Column(String(50), nullable=False, default='general')  # moving, plumbing, electrical, etc.
    
    # Contact info
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    address = Column(Text)
    
    # Branding
    logo_url = Column(String(500))
    primary_color = Column(String(7), default='#1976d2')
    secondary_color = Column(String(7), default='#424242')
    
    # Settings
    settings = Column(JSON, default=dict)
    enabled_modules = Column(JSON, default=list)
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="tenant")
    subscription = relationship("Subscription", back_populates="tenant", uselist=False)


class Subscription(Base):
    """
    Subscription model - tracks tenant subscription status and billing
    """
    __tablename__ = 't_subscriptions'
    __table_args__ = {'schema': 'public'}
    
    subscription_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('public.t_tenants.tenant_id'), nullable=False, unique=True)
    
    # Tier: starter, professional, enterprise
    tier = Column(String(50), nullable=False, default='starter')
    
    # Status: trialing, active, past_due, canceled, paused
    status = Column(String(50), nullable=False, default='trialing')
    
    # Stripe integration
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))
    stripe_price_id = Column(String(255))
    
    # Trial information
    trial_starts_at = Column(DateTime)
    trial_ends_at = Column(DateTime)
    
    # Billing
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    cancel_at = Column(DateTime)
    canceled_at = Column(DateTime)
    
    # Usage limits based on tier
    max_users = Column(Integer, default=3)  # starter: 3, professional: 10, enterprise: unlimited
    max_projects = Column(Integer, default=50)  # starter: 50, professional: 200, enterprise: unlimited
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="subscription")


class User(Base):
    """
    User model - both office staff and field workers
    """
    __tablename__ = 't_users'
    __table_args__ = {'schema': 'public'}
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('public.t_tenants.tenant_id'), nullable=True)  # nullable for migration
    
    # Authentication
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # nullable for social auth
    
    # Profile
    full_name = Column(String(255))
    avatar_url = Column(String(500))
    
    # Role and type
    role = Column(String, nullable=False, default='Worker')  # Admin, Secretary, Planner, Supervisor, Worker
    user_type = Column(String, nullable=False, default='office')  # 'office' or 'field'
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    email_verified = Column(Boolean, default=False)
    
    # Login tracking
    last_login_at = Column(DateTime)
    login_count = Column(Integer, default=0)
    
    # Preferences
    preferences = Column(JSON, default=dict)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    employee = relationship("Employee", back_populates="user", uselist=False)
    analytics_events = relationship("AnalyticsEvent", back_populates="user")
    feedback_submitted = relationship("Feedback", foreign_keys="[Feedback.user_id]", back_populates="user")
    feedback_assigned = relationship("Feedback", foreign_keys="[Feedback.assigned_to]", back_populates="assigned_admin")


class Employee(Base):
    """
    Employee model - additional data for on-site workers
    """
    __tablename__ = 't_employees'
    __table_args__ = {'schema': 'public'}
    
    employee_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('public.t_users.user_id'), nullable=False)
    email = Column(String, unique=True, nullable=False)
    employee_number = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String)
    department = Column(String)
    position = Column(String)
    hire_date = Column(Date)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="employee")
    ratings = relationship("WorkerRating", back_populates="employee")
    morningplan_staff = relationship("MorningPlanStaff", back_populates="employee")


class AnalyticsEvent(Base):
    """
    Application analytics and error logging
    """
    __tablename__ = 't_analytics_events'
    __table_args__ = {'schema': 'public'}
    
    event_id = Column(String, primary_key=True)
    timestamp = Column(DateTime, server_default=func.now(), nullable=False)
    level = Column(String, nullable=False)  # debug, info, warn, error, fatal
    category = Column(String, nullable=False)  # auth, navigation, inspection, abnahme, sync, offline, user_action, error, performance
    event_name = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('public.t_users.user_id'))
    event_metadata = Column(Text)  # JSON data
    error_message = Column(Text)
    error_stack = Column(Text)
    error_code = Column(String)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="analytics_events")


class Feedback(Base):
    """
    User feedback, bug reports, and feature requests
    """
    __tablename__ = 't_feedback'
    __table_args__ = {'schema': 'public'}
    
    feedback_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('public.t_users.user_id'))
    user_email = Column(String, nullable=False)
    feedback_type = Column(String, nullable=False)  # bug, feature, feedback, sync_issue, other
    message = Column(Text, nullable=False)
    status = Column(String, nullable=False, default='new')  # new, in_progress, resolved, closed
    priority = Column(String, default='medium')  # low, medium, high, critical
    assigned_to = Column(UUID(as_uuid=True), ForeignKey('public.t_users.user_id'))
    resolution_notes = Column(Text)
    timestamp = Column(DateTime, server_default=func.now(), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    resolved_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", foreign_keys="[Feedback.user_id]", back_populates="feedback_submitted")
    assigned_admin = relationship("User", foreign_keys="[Feedback.assigned_to]", back_populates="feedback_assigned")


class WorkerRating(Base):
    """
    Employee performance ratings (1-10 scale)
    """
    __tablename__ = 't_worker_ratings'
    __table_args__ = {'schema': 'public'}
    
    rating_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey('public.t_projects.project_id'), nullable=False)
    plan_id = Column(UUID(as_uuid=True), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('public.t_employees.employee_id'), nullable=False)
    employee_name = Column(String)
    datum = Column(Date, nullable=False)
    rating = Column(Integer, nullable=False)  # CHECK constraint: 1-10
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    employee = relationship("Employee", back_populates="ratings")


class EmployeeRateHistory(Base):
    """
    Employee rate history from t_employee_rate_history table
    """
    __tablename__ = 't_employee_rate_history'
    __table_args__ = {'schema': 'public'}
    
    hist_id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    employee_id = Column(UUID(as_uuid=True), ForeignKey('public.t_employees.employee_id'), nullable=False)
    old_rate = Column(Numeric(10, 2), nullable=False)
    new_rate = Column(Numeric(10, 2), nullable=False)
    effective_date = Column(DateTime, nullable=False, default=func.now())
    changed_by = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    def __repr__(self):
        return f"<EmployeeRateHistory(hist_id='{self.hist_id}', employee_id='{self.employee_id}')>"


class EmployeeDailyNote(Base):
    """
    Employee daily notes from t_employee_daily_notes table
    """
    __tablename__ = 't_employee_daily_notes'
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True)
    employee_code = Column(String, nullable=False)
    plan_date = Column(Date, nullable=False)
    notizen = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    employee_id = Column(UUID(as_uuid=True), ForeignKey('public.t_employees.employee_id'))
    sort_order = Column(Integer, default=999)
    
    def __repr__(self):
        return f"<EmployeeDailyNote(id={self.id}, employee_code='{self.employee_code}', plan_date='{self.plan_date}')>"

