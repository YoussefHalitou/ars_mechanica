"""
FastAPI router for Nachkalkulation (Post-Calculation) module
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, date
from decimal import Decimal

from backend.core.database import get_db
from backend.modules.nachkalkulation.models import Nachkalkulation
from backend.modules.nachkalkulation.schemas import (
    NachkalkulationCreate, NachkalkulationUpdate, Nachkalkulation, 
    NachkalkulationSummary, NachkalkulationDetailCreate, NachkalkulationDetail,
    NachkalkulationDetailUpdate
)
from backend.modules.nachkalkulation.service import NachkalkulationService

router = APIRouter(prefix="/api/nachkalkulation", tags=["Nachkalkulation"])


# Main calculation endpoints
@router.post("/", response_model=Nachkalkulation, status_code=status.HTTP_201_CREATED)
async def create_calculation(
    calc_data: NachkalkulationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new post-calculation"""
    service = NachkalkulationService(db)
    return await service.create_calculation(calc_data)


@router.get("/{nachkalkulation_id}", response_model=Nachkalkulation)
async def get_calculation(
    nachkalkulation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a post-calculation by ID"""
    service = NachkalkulationService(db)
    calculation = await service.get_calculation(nachkalkulation_id)
    if not calculation:
        raise HTTPException(status_code=404, detail="Post-calculation not found")
    return calculation


@router.get("/project/{project_id}", response_model=Nachkalkulation)
async def get_calculation_by_project(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get post-calculation for a project"""
    service = NachkalkulationService(db)
    calculation = await service.get_calculation_by_project(project_id)
    if not calculation:
        raise HTTPException(status_code=404, detail="No post-calculation found for this project")
    return calculation


@router.get("/", response_model=List[NachkalkulationSummary])
async def get_calculations_by_date_range(
    start_date: date,
    end_date: date,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get post-calculations within a date range"""
    service = NachkalkulationService(db)
    return await service.get_calculations_by_date_range(start_date, end_date, status)


@router.put("/{nachkalkulation_id}", response_model=Nachkalkulation)
async def update_calculation(
    nachkalkulation_id: str,
    calc_data: NachkalkulationUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a post-calculation"""
    service = NachkalkulationService(db)
    calculation = await service.update_calculation(nachkalkulation_id, calc_data)
    if not calculation:
        raise HTTPException(status_code=404, detail="Post-calculation not found")
    return calculation


@router.delete("/{nachkalkulation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calculation(
    nachkalkulation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a post-calculation"""
    service = NachkalkulationService(db)
    success = await service.delete_calculation(nachkalkulation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Post-calculation not found")


# Generation endpoints
@router.post("/generate/{project_id}", response_model=Nachkalkulation)
async def generate_calculation(
    project_id: str,
    calculated_by: str = "system",
    db: AsyncSession = Depends(get_db)
):
    """Generate post-calculation from project data"""
    service = NachkalkulationService(db)
    calculation = await service.generate_calculation(project_id, calculated_by)
    if not calculation:
        raise HTTPException(status_code=404, detail="Project not found or calculation already exists")
    return calculation


# Detail endpoints
@router.post("/{nachkalkulation_id}/details", response_model=NachkalkulationDetail)
async def add_detail(
    nachkalkulation_id: str,
    detail_data: NachkalkulationDetailCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add detail to post-calculation"""
    service = NachkalkulationService(db)
    return await service.add_detail(nachkalkulation_id, detail_data)


@router.put("/details/{detail_id}", response_model=NachkalkulationDetail)
async def update_detail(
    detail_id: str,
    detail_data: NachkalkulationDetailUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a detail"""
    service = NachkalkulationService(db)
    detail = await service.update_detail(detail_id, detail_data)
    if not detail:
        raise HTTPException(status_code=404, detail="Detail not found")
    return detail


@router.delete("/details/{detail_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_detail(
    detail_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a detail"""
    service = NachkalkulationService(db)
    success = await service.delete_detail(detail_id)
    if not success:
        raise HTTPException(status_code=404, detail="Detail not found")


# Workflow endpoints
@router.post("/{nachkalkulation_id}/lock", response_model=Nachkalkulation)
async def lock_calculation(
    nachkalkulation_id: str,
    user_id: str = "system",
    db: AsyncSession = Depends(get_db)
):
    """Lock a calculation for editing"""
    service = NachkalkulationService(db)
    calculation = await service.lock_calculation(nachkalkulation_id, user_id)
    if not calculation:
        raise HTTPException(status_code=400, detail="Calculation not found or already locked")
    return calculation


@router.post("/{nachkalkulation_id}/approve", response_model=Nachkalkulation)
async def approve_calculation(
    nachkalkulation_id: str,
    approved_by: str = "system",
    db: AsyncSession = Depends(get_db)
):
    """Approve a calculation"""
    service = NachkalkulationService(db)
    calculation = await service.approve_calculation(nachkalkulation_id, approved_by)
    if not calculation:
        raise HTTPException(status_code=400, detail="Calculation not found or locked")
    return calculation


# Dashboard endpoints
@router.get("/dashboard/summary/")
async def get_dashboard_data(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard summary data"""
    service = NachkalkulationService(db)
    return await service.get_dashboard_data(start_date, end_date)


@router.get("/dashboard/top-projects/")
async def get_top_projects_by_margin(
    limit: int = 10,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get top projects by profit margin"""
    service = NachkalkulationService(db)
    return await service.get_top_projects_by_margin(limit, start_date, end_date)


# Analysis endpoints
@router.get("/analysis/margin-trend/")
async def get_margin_trend(
    months: int = 12,
    db: AsyncSession = Depends(get_db)
):
    """Get profit margin trend over time"""
    # This would require implementing a trend analysis service
    pass


@router.get("/analysis/cost-breakdown/{nachkalkulation_id}")
async def get_cost_breakdown(
    nachkalkulation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed cost breakdown for a calculation"""
    service = NachkalkulationService(db)
    calculation = await service.get_calculation(nachkalkulation_id)
    if not calculation:
        raise HTTPException(status_code=404, detail="Post-calculation not found")
    
    return {
        'nachkalkulation_id': calculation.nachkalkulation_id,
        'project_name': calculation.project.name if calculation.project else 'Unknown',
        'cost_breakdown': {
            'employees': float(calculation.cost_employees or 0),
            'vehicles': float(calculation.cost_vehicles or 0),
            'materials': float(calculation.cost_materials or 0),
            'external': float(calculation.cost_external or 0),
            'overhead': float(calculation.cost_overhead or 0)
        },
        'revenue_breakdown': {
            'services': float(calculation.revenue_services or 0),
            'materials': float(calculation.revenue_materials or 0),
            'other': float(calculation.revenue_other or 0)
        },
        'totals': {
            'total_revenue': float(calculation.total_revenue or 0),
            'total_costs': float(calculation.total_costs or 0),
            'gross_profit': float(calculation.gross_profit or 0),
            'net_profit': float(calculation.net_profit or 0),
            'profit_margin_percent': float(calculation.profit_margin_percent or 0)
        }
    }
