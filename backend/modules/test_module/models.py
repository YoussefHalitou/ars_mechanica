"""
SQLAlchemy models for test_module module
"""
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.sql import func

from backend.core.database import Base


class test_module(Base):
    """
    test_module model
    """
    __tablename__ = t_test_module
    __table_args__ = {'schema': 'public'}

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    tenant_id = Column(String, nullable=False, index=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
