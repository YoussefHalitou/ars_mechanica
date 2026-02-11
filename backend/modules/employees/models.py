"""
SQLAlchemy models for employees module
Re-exports from users module to avoid duplicate table definitions
"""
# Re-export Employee from users module
from backend.modules.users.models import Employee, EmployeeRateHistory, EmployeeDailyNote

__all__ = ['Employee', 'EmployeeRateHistory', 'EmployeeDailyNote']
