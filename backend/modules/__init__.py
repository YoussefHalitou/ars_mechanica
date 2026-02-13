"""
Auto-discovered modules

This package contains all feature modules that are automatically loaded
by the main FastAPI application and Streamlit frontend.

Each module should follow this structure:
- models.py      # SQLAlchemy models
- schemas.py     # Pydantic schemas
- service.py     # Business logic
- router.py      # FastAPI routes
- streamlit.py   # Streamlit page
- seed.py        # Demo data seeder
"""

# Import all models to ensure they're registered with SQLAlchemy
from .services.models import Service, ServiceCategory
from .materials.models import Material, MaterialPrice, MaterialPriceHistory, MaterialCategory
from .projects.models import (
    Project, ProjectRevenueItem, ProjectVehicleCost, 
    ProjectMaterialUsage, ProjectExtraCost, ProjectDiscount
)
from .users.models import Employee, EmployeeRateHistory, EmployeeDailyNote
from .time_pairs.models import TimePair, EmployeeRef as TPEmployee, ProjectRef as TPProject
from .vehicle_costs.models import Vehicle, VehicleRate, VehicleDailyStatus, VehicleInventory, VehicleCost
from .material_usage.models import ProjectMaterialUsage as MUProjectMaterialUsage
from .inspections.models import Inspection, InspectionCategory
from .abnahmen.models import Abnahme
from .morningplan.models import MorningPlan, MorningPlanStaff, MorningPlanTask, MorningPlanChecklist
from .nachkalkulation.models import Nachkalkulation, NachkalkulationDetail, NachkalkulationEmployeeSummary, NachkalkulationMaterialSummary

__all__ = [
    'Service', 'ServiceCategory',
    'Material', 'MaterialPrice', 'MaterialPriceHistory', 'MaterialCategory',
    'Project', 'ProjectRevenueItem', 'ProjectVehicleCost', 
    'ProjectMaterialUsage', 'ProjectExtraCost', 'ProjectDiscount',
    'Employee', 'EmployeeRateHistory', 'EmployeeDailyNote',
    'TimePair', 'TPEmployee', 'TPProject',
    'Vehicle', 'VehicleRate', 'VehicleDailyStatus', 'VehicleInventory', 'VehicleCost',
    'MUProjectMaterialUsage',
    'Inspection', 'InspectionCategory',
    'Abnahme',
    'MorningPlan', 'MorningPlanStaff', 'MorningPlanTask', 'MorningPlanChecklist',
    'Nachkalkulation', 'NachkalkulationDetail', 'NachkalkulationEmployeeSummary', 'NachkalkulationMaterialSummary'
]
