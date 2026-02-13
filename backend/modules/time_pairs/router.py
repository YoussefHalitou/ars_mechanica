"""
FastAPI router for time pairs module (Zeiterfassung)
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from backend.core.database import get_db
from backend.core.schemas import ResponseBase

from .schemas import (
    TimePairGenerateRequest, TimePairCreate, TimePairUpdate, 
    TimePairResponse, TimePairListResponse, TimePairGenerateResponse
)
from .service import TimePairService

router = APIRouter(prefix="/api/time_pairs", tags=["time_pairs"])


@router.post("/generate", response_model=TimePairGenerateResponse)
async def generate_time_pairs(
    request: TimePairGenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate time pairs from morning plan data
    Matches Retool endpoint: POST /api/time_pairs/generate
    Body: {plan_id, date}
    Returns: Same shape as tr_time_pairs_with_staff_data transformer
    """
    
    # Generate time pairs from morning plan
    time_pairs = await TimePairService.generate_from_morningplan(
        db, request.plan_id, request.date
    )
    
    # Get them with staff data in Retool format
    result_pairs = await TimePairService.get_time_pairs_with_staff_data(
        db, date=request.date, plan_id=request.plan_id
    )
    
    return TimePairGenerateResponse(
        success=True,
        message=f"Generated {len(result_pairs)} time pairs",
        data=result_pairs,
        count=len(result_pairs)
    )


@router.get("/", response_model=TimePairListResponse)
async def list_time_pairs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    date: Optional[date] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    employee_id: Optional[str] = Query(None, description="Filter by employee ID"),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    db: AsyncSession = Depends(get_db)
):
    """List time pairs with pagination and filtering"""
    
    time_pairs, total = await TimePairService.get_time_pairs(
        db, skip, limit, date, employee_id, project_id
    )
    
    total_pages = (total + limit - 1) // limit
    
    return TimePairListResponse(
        items=[TimePairResponse(**tp.to_dict()) for tp in time_pairs],
        total=total,
        page=skip // limit + 1,
        per_page=limit,
        total_pages=total_pages
    )


@router.get("/with_staff", response_model=TimePairGenerateResponse)
async def get_time_pairs_with_staff(
    date: Optional[date] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    plan_id: Optional[str] = Query(None, description="Filter by plan ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get time pairs with staff data
    Matches Retool transformer: tr_time_pairs_with_staff_data
    """
    
    time_pairs = await TimePairService.get_time_pairs_with_staff_data(
        db, date=date, plan_id=plan_id
    )
    
    return TimePairGenerateResponse(
        success=True,
        data=time_pairs,
        count=len(time_pairs)
    )


@router.post("/", response_model=ResponseBase, status_code=201)
async def create_time_pair(
    time_pair_data: TimePairCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new time pair"""
    
    time_pair = await TimePairService.create_time_pair(db, time_pair_data.model_dump())
    
    return ResponseBase(
        success=True,
        message="Time pair created successfully",
        data=TimePairResponse(**time_pair.to_dict())
    )


@router.put("/{pair_id}", response_model=ResponseBase)
async def update_time_pair(
    pair_id: str,
    update_data: TimePairUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a time pair"""
    
    time_pair = await TimePairService.update_time_pair(db, pair_id, update_data.model_dump(exclude_unset=True))
    if not time_pair:
        raise HTTPException(status_code=404, detail="Time pair not found")
    
    return ResponseBase(
        success=True,
        message="Time pair updated successfully",
        data=TimePairResponse(**time_pair.to_dict())
    )


@router.delete("/{pair_id}", response_model=ResponseBase)
async def delete_time_pair(
    pair_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a time pair"""
    
    success = await TimePairService.delete_time_pair(db, pair_id)
    if not success:
        raise HTTPException(status_code=404, detail="Time pair not found")
    
    return ResponseBase(
        success=True,
        message="Time pair deleted successfully"
    )
