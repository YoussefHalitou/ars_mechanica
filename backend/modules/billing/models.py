"""
SQLAlchemy models for billing module
Tracks payment methods, invoices, and usage
"""
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Date, Text, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from backend.core.database import Base


class PaymentMethod(Base):
    __tablename__ = 't_payment_methods'
    __table_args__ = {'schema': 'public'}
    
    payment_method_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('public.t_tenants.tenant_id'), nullable=False)
    stripe_payment_method_id = Column(String(255), unique=True)
    stripe_customer_id = Column(String(255))
    card_brand = Column(String(50))
    card_last4 = Column(String(4))
    card_exp_month = Column(Integer)
    card_exp_year = Column(Integer)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class Invoice(Base):
    __tablename__ = 't_invoices'
    __table_args__ = {'schema': 'public'}
    
    invoice_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('public.t_tenants.tenant_id'), nullable=False)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey('public.t_subscriptions.subscription_id'))
    stripe_invoice_id = Column(String(255), unique=True)
    stripe_payment_intent_id = Column(String(255))
    invoice_number = Column(String(50))
    status = Column(String(50), default='draft')
    subtotal = Column(Integer, default=0)
    tax = Column(Integer, default=0)
    total = Column(Integer, default=0)
    amount_paid = Column(Integer, default=0)
    amount_due = Column(Integer, default=0)
    currency = Column(String(3), default='EUR')
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    invoice_pdf = Column(String(500))
    hosted_invoice_url = Column(String(500))
    due_date = Column(Date)
    paid_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class UsageRecord(Base):
    __tablename__ = 't_usage_records'
    __table_args__ = {'schema': 'public'}
    
    usage_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('public.t_tenants.tenant_id'), nullable=False)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey('public.t_subscriptions.subscription_id'))
    metric = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    extra_data = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class WebhookEvent(Base):
    __tablename__ = 't_webhook_events'
    __table_args__ = {'schema': 'public'}
    
    event_id = Column(String(255), primary_key=True)
    event_type = Column(String(100), nullable=False)
    status = Column(String(50), default='pending')
    error_message = Column(Text)
    payload = Column(JSON)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    processed_at = Column(DateTime)
