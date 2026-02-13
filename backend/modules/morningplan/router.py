"""
FastAPI router for Morningplan module
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, date

from backend.core.database import get_db
from backend.modules.morningplan.models import MorningPlan
from backend.modules.morningplan.schemas import (
    MorningPlanCreate, MorningPlanUpdate, MorningPlan, MorningPlanStaffCreate,
    MorningPlanTaskCreate, MorningPlanChecklistCreate, MorningPlanStaffUpdate,
    MorningPlanTaskUpdate, MorningPlanChecklistUpdate
)
from backend.modules.morningplan.service import MorningPlanService

router = APIRouter(prefix="/api/morningplan", tags=["Morningplan"])


# Morning Plan endpoints
@router.post("/", response_model=MorningPlan, status_code=status.HTTP_201_CREATED)
async def create_plan(
    plan_data: MorningPlanCreate,
    created_by: str = "system",  # Should come from auth
    db: AsyncSession = Depends(get_db)
):
    """Create a new morning plan"""
    service = MorningPlanService(db)
    return await service.create_plan(plan_data, created_by)


@router.get("/{plan_id}", response_model=MorningPlan)
async def get_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a morning plan by ID"""
    service = MorningPlanService(db)
    plan = await service.get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Morning plan not found")
    return plan


@router.get("/project/{project_id}", response_model=List[MorningPlan])
async def get_plans_by_project(
    project_id: str,
    plan_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all morning plans for a project"""
    service = MorningPlanService(db)
    return await service.get_plans_by_project(project_id, plan_type)


@router.get("/date/{plan_date}", response_model=List[MorningPlan])
async def get_plans_by_date(
    plan_date: date,
    plan_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all morning plans for a specific date"""
    service = MorningPlanService(db)
    return await service.get_plans_by_date(plan_date, plan_type)


@router.get("/range/", response_model=List[MorningPlan])
async def get_plans_by_date_range(
    start_date: date,
    end_date: date,
    plan_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all morning plans within a date range"""
    service = MorningPlanService(db)
    return await service.get_plans_by_date_range(start_date, end_date, plan_type)


@router.put("/{plan_id}", response_model=MorningPlan)
async def update_plan(
    plan_id: str,
    plan_data: MorningPlanUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a morning plan"""
    service = MorningPlanService(db)
    plan = await service.update_plan(plan_id, plan_data)
    if not plan:
        raise HTTPException(status_code=404, detail="Morning plan not found")
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a morning plan"""
    service = MorningPlanService(db)
    success = await service.delete_plan(plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Morning plan not found")


@router.post("/{plan_id}/duplicate", response_model=MorningPlan)
async def duplicate_plan(
    plan_id: str,
    new_date: date,
    created_by: str = "system",
    db: AsyncSession = Depends(get_db)
):
    """Duplicate a morning plan for a new date"""
    service = MorningPlanService(db)
    new_plan = await service.duplicate_plan(plan_id, new_date, created_by)
    if not new_plan:
        raise HTTPException(status_code=404, detail="Source morning plan not found")
    return new_plan


# Staff endpoints
@router.post("/{plan_id}/staff", response_model=MorningPlanStaffCreate)
async def add_staff_to_plan(
    plan_id: str,
    staff_data: MorningPlanStaffCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add staff to a morning plan"""
    service = MorningPlanService(db)
    return await service.add_staff_to_plan(plan_id, staff_data)


@router.put("/staff/{staff_id}", response_model=MorningPlanStaffCreate)
async def update_staff_assignment(
    staff_id: int,
    staff_data: MorningPlanStaffUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update staff assignment"""
    service = MorningPlanService(db)
    staff = await service.update_staff_assignment(staff_id, staff_data)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff assignment not found")
    return staff


@router.delete("/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_staff_from_plan(
    staff_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Remove staff from a morning plan"""
    service = MorningPlanService(db)
    success = await service.remove_staff_from_plan(staff_id)
    if not success:
        raise HTTPException(status_code=404, detail="Staff assignment not found")


# Task endpoints
@router.post("/{plan_id}/tasks", response_model=MorningPlanTaskCreate)
async def add_task_to_plan(
    plan_id: str,
    task_data: MorningPlanTaskCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add task to a morning plan"""
    service = MorningPlanService(db)
    return await service.add_task_to_plan(plan_id, task_data)


@router.put("/tasks/{task_id}", response_model=MorningPlanTaskCreate)
async def update_task(
    task_id: str,
    task_data: MorningPlanTaskUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a task"""
    service = MorningPlanService(db)
    task = await service.update_task(task_id, task_data)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a task"""
    service = MorningPlanService(db)
    success = await service.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")


# Checklist endpoints
@router.post("/{plan_id}/checklist", response_model=MorningPlanChecklistCreate)
async def add_checklist_item(
    plan_id: str,
    checklist_data: MorningPlanChecklistCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add checklist item to a morning plan"""
    service = MorningPlanService(db)
    return await service.add_checklist_item(plan_id, checklist_data)


@router.put("/checklist/{checklist_id}", response_model=MorningPlanChecklistCreate)
async def update_checklist_item(
    checklist_id: str,
    checklist_data: MorningPlanChecklistUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a checklist item"""
    service = MorningPlanService(db)
    checklist = await service.update_checklist_item(checklist_id, checklist_data)
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    return checklist


# Summary endpoints
@router.get("/summary/range/")
async def get_plans_with_summary(
    start_date: date,
    end_date: date,
    plan_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get plans with staff and task summaries"""
    service = MorningPlanService(db)
    return await service.get_plans_with_summary(start_date, end_date, plan_type)


# Plan type specific endpoints
@router.get("/prae/", response_model=List[MorningPlan])
async def get_prae_plans(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get Prä-Morningplan (Pre-Plan) entries"""
    service = MorningPlanService(db)
    if start_date and end_date:
        return await service.get_plans_by_date_range(start_date, end_date, "prae")
    else:
        # Get today's and future plans
        today = date.today()
        return await service.get_plans_by_date_range(today, today + timedelta(days=30), "prae")


@router.get("/inter/", response_model=List[MorningPlan])
async def get_inter_plans(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get Inter-Morningplan (Interim-Plan) entries"""
    service = MorningPlanService(db)
    if start_date and end_date:
        return await service.get_plans_by_date_range(start_date, end_date, "inter")
    else:
        # Get today's and future plans
        today = date.today()
        return await service.get_plans_by_date_range(today, today + timedelta(days=30), "inter")


@router.get("/post/", response_model=List[MorningPlan])
async def get_post_plans(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get Post-Morningplan entries"""
    service = MorningPlanService(db)
    if start_date and end_date:
        return await service.get_plans_by_date_range(start_date, end_date, "post")
    else:
        # Get today's and future plans
        today = date.today()
        return await service.get_plans_by_date_range(today, today + timedelta(days=30), "post")
