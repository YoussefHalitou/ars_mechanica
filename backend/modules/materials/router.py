"""
FastAPI router for materials module (Materialkatalog)
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.core.schemas import ResponseBase

from .models import Material
from .schemas import (
    MaterialCreate, MaterialUpdate, MaterialResponse, 
    MaterialListResponse, MaterialsResponse, MaterialDetailResponse
)
from .service import MaterialService

router = APIRouter(prefix="/api/materials", tags=["materials"])


@router.get("/", response_model=MaterialListResponse)
async def list_materials(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    active_only: bool = Query(True, description="Return only active materials"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: AsyncSession = Depends(get_db)
):
    """List materials with pagination and filtering"""
    
    materials, total = await MaterialService.get_materials(
        db, skip, limit, active_only, category
    )
    
    # Calculate margin for each material
    material_responses = []
    for material in materials:
        margin = None
        if material.prices and material.prices.cost_per_unit and material.prices.price_per_unit:
            margin = float(material.prices.price_per_unit) - float(material.prices.cost_per_unit)
        
        material_responses.append(MaterialResponse(
            **material.to_dict(),
            margin=margin
        ))
    
    total_pages = (total + limit - 1) // limit
    
    return MaterialListResponse(
        items=material_responses,
        total=total,
        page=skip // limit + 1,
        per_page=limit,
        total_pages=total_pages
    )


@router.get("/{material_id}", response_model=MaterialDetailResponse)
async def get_material(
    material_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a single material by ID with pricing"""
    
    material = await MaterialService.get_material(db, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    # Calculate margin
    margin = None
    if material.prices and material.prices.cost_per_unit and material.prices.price_per_unit:
        margin = float(material.prices.price_per_unit) - float(material.prices.cost_per_unit)
    
    return MaterialDetailResponse(
        success=True,
        data=MaterialResponse(**material.to_dict(), margin=margin)
    )


@router.post("/", response_model=MaterialDetailResponse, status_code=201)
async def create_material(
    material_data: MaterialCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new material"""
    
    material = await MaterialService.create_material(db, material_data)
    
    return MaterialDetailResponse(
        success=True,
        message="Material created successfully",
        data=MaterialResponse(**material.to_dict())
    )


@router.put("/{material_id}", response_model=MaterialDetailResponse)
async def update_material(
    material_id: str,
    update_data: MaterialUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a material"""
    
    material = await MaterialService.update_material(db, material_id, update_data)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    # Calculate margin
    margin = None
    if material.prices and material.prices.cost_per_unit and material.prices.price_per_unit:
        margin = float(material.prices.price_per_unit) - float(material.prices.cost_per_unit)
    
    return MaterialDetailResponse(
        success=True,
        message="Material updated successfully",
        data=MaterialResponse(**material.to_dict(), margin=margin)
    )


@router.delete("/{material_id}", response_model=ResponseBase)
async def delete_material(
    material_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a material (soft delete)"""
    
    success = await MaterialService.delete_material(db, material_id)
    if not success:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return ResponseBase(
        success=True,
        message="Material deleted successfully"
    )


@router.get("/categories/list", response_model=ResponseBase)
async def get_categories(
    db: AsyncSession = Depends(get_db)
):
    """Get all unique material categories"""
    
    categories = await MaterialService.get_material_categories(db)
    
    return ResponseBase(
        success=True,
        data=categories
    )


@router.post("/{material_id}/prices", response_model=ResponseBase)
async def set_material_prices(
    material_id: str,
    cost_per_unit: Optional[float] = Body(None, ge=0),
    price_per_unit: Optional[float] = Body(None, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Set or update material prices"""
    
    price_record = await MaterialService.set_material_prices(
        db, material_id, cost_per_unit, price_per_unit
    )
    
    if not price_record:
        raise HTTPException(status_code=404, detail="Material not found")
    
    return ResponseBase(
        success=True,
        message="Prices updated successfully"
    )


@router.get("/search/query", response_model=MaterialsResponse)
async def search_materials(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Search materials by name"""
    
    materials = await MaterialService.search_materials(db, q, limit)
    
    # Calculate margin for each material
    material_responses = []
    for material in materials:
        margin = None
        if material.prices and material.prices.cost_per_unit and material.prices.price_per_unit:
            margin = float(material.prices.price_per_unit) - float(material.prices.cost_per_unit)
        
        material_responses.append(MaterialResponse(
            **material.to_dict(),
            margin=margin
        ))
    
    return MaterialsResponse(
        success=True,
        data=material_responses
    )
