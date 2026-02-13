"""
FastAPI router for Inspections module (Draftbit architecture)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from backend.core.database import get_db
from backend.core.schemas import ResponseBase
from backend.modules.inspections.models import Inspection
from backend.modules.inspections.schemas import InspectionCreate, InspectionUpdate, InspectionResponse
from backend.modules.inspections.service import InspectionService

router = APIRouter(prefix="/api/inspections", tags=["Inspections"])


@router.get("/", response_model=ResponseBase[List[InspectionResponse]])
async def list_inspections(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db)
):
    """List all inspections with optional filters"""
    inspections = await InspectionService.get_inspections(db, skip=skip, limit=limit, project_id=project_id, status=status)
    return ResponseBase(success=True, data=[InspectionResponse.from_orm(i) for i in inspections])


@router.post("/", response_model=ResponseBase[InspectionResponse])
async def create_inspection(
    inspection_data: InspectionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new inspection"""
    try:
        inspection = await InspectionService.create_inspection(db, inspection_data)
        return ResponseBase(success=True, message="Inspection created successfully", data=InspectionResponse.from_orm(inspection))
    except Exception as e:
        return ResponseBase(success=False, message=f"Error creating inspection: {str(e)}")


@router.get("/{inspection_id}", response_model=ResponseBase[InspectionResponse])
async def get_inspection(
    inspection_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get inspection by ID"""
    inspection = await InspectionService.get_inspection(db, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    return ResponseBase(success=True, data=InspectionResponse.from_orm(inspection))


@router.put("/{inspection_id}", response_model=ResponseBase[InspectionResponse])
async def update_inspection(
    inspection_id: str,
    inspection_data: InspectionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update inspection"""
    inspection = await InspectionService.update_inspection(db, inspection_id, inspection_data)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    return ResponseBase(success=True, message="Inspection updated successfully", data=InspectionResponse.from_orm(inspection))


@router.delete("/{inspection_id}", response_model=ResponseBase)
async def delete_inspection(
    inspection_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete inspection"""
    success = await InspectionService.delete_inspection(db, inspection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    return ResponseBase(success=True, message="Inspection deleted successfully")
