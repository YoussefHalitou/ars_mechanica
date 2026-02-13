"""
FastAPI router for projects module (Nachkalkulation)
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.core.schemas import ResponseBase

from .schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    ProjectRevenueItemSchema, ProjectVehicleCostSchema, ProjectMaterialUsageSchema,
    NachkalkulationResponse, NachkalkulationDetailResponse,
    ProjectDetailResponse, ProjectsResponse
)
from .service import ProjectService

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db)
):
    """List projects with pagination and filtering"""
    
    projects, total = await ProjectService.get_projects(
        db, skip, limit, status
    )
    
    total_pages = (total + limit - 1) // limit
    
    return ProjectListResponse(
        items=[ProjectResponse(**project.to_dict()) for project in projects],
        total=total,
        page=skip // limit + 1,
        per_page=limit,
        total_pages=total_pages
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a single project by ID"""
    
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectDetailResponse(
        success=True,
        data=ProjectResponse(**project.to_dict())
    )


@router.post("/", response_model=ProjectDetailResponse, status_code=201)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new project"""
    
    project = await ProjectService.create_project(db, project_data)
    
    return ProjectDetailResponse(
        success=True,
        message="Project created successfully",
        data=ProjectResponse(**project.to_dict())
    )


@router.put("/{project_id}", response_model=ProjectDetailResponse)
async def update_project(
    project_id: str,
    update_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a project"""
    
    project = await ProjectService.update_project(db, project_id, update_data)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectDetailResponse(
        success=True,
        message="Project updated successfully",
        data=ProjectResponse(**project.to_dict())
    )


@router.delete("/{project_id}", response_model=ResponseBase)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a project"""
    
    success = await ProjectService.delete_project(db, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ResponseBase(
        success=True,
        message="Project deleted successfully"
    )


@router.get("/{project_id}/nachkalkulation", response_model=NachkalkulationDetailResponse)
async def get_nachkalkulation(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete Nachkalkulation (post-calculation) for a project
    Includes revenue, costs, and margin calculations
    """
    
    nachkalkulation = await ProjectService.get_nachkalkulation(db, project_id)
    if not nachkalkulation:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return NachkalkulationDetailResponse(
        success=True,
        data=NachkalkulationResponse(**nachkalkulation)
    )


# Revenue items endpoints

@router.get("/{project_id}/revenue", response_model=ResponseBase)
async def get_project_revenue_items(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get revenue items for a project"""
    
    items = await ProjectService.get_revenue_items(db, project_id)
    
    return ResponseBase(
        success=True,
        data=[ProjectRevenueItemSchema(
            id=item.id,
            project_id=item.project_id,
            position_label=item.position_label,
            qty=float(item.qty) if item.qty else 1.0,
            unit=item.unit,
            unit_price=float(item.unit_price) if item.unit_price else 0.0,
            line_total=float(item.line_total) if item.line_total else 0.0,
            kind=item.kind,
            source_inspection_id=item.source_inspection_id,
            sort_order=float(item.sort_order) if item.sort_order else None,
            notes=item.notes
        ) for item in items]
    )


@router.post("/{project_id}/revenue", response_model=ResponseBase)
async def add_revenue_item(
    project_id: str,
    item_data: ProjectRevenueItemSchema,
    db: AsyncSession = Depends(get_db)
):
    """Add a revenue item to a project"""
    
    # Ensure project_id matches
    item_data.project_id = project_id
    
    item = await ProjectService.add_revenue_item(db, item_data)
    
    return ResponseBase(
        success=True,
        message="Revenue item added successfully",
        data=ProjectRevenueItemSchema(
            id=item.id,
            project_id=item.project_id,
            position_label=item.position_label,
            qty=float(item.qty) if item.qty else 1.0,
            unit=item.unit,
            unit_price=float(item.unit_price) if item.unit_price else 0.0,
            line_total=float(item.line_total) if item.line_total else 0.0,
            kind=item.kind,
            source_inspection_id=item.source_inspection_id,
            sort_order=float(item.sort_order) if item.sort_order else None,
            notes=item.notes
        )
    )


# Vehicle costs endpoints

@router.get("/{project_id}/vehicle_costs", response_model=ResponseBase)
async def get_project_vehicle_costs(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get vehicle costs for a project"""
    
    costs = await ProjectService.get_vehicle_costs(db, project_id)
    
    return ResponseBase(
        success=True,
        data=[ProjectVehicleCostSchema(
            id=cost.id,
            project_id=cost.project_id,
            vehicle_id=cost.vehicle_id,
            usage_type=cost.usage_type,
            usage_value=float(cost.usage_value) if cost.usage_value else 0.0,
            cost_per_unit=float(cost.cost_per_unit) if cost.cost_per_unit else 0.0,
            total_cost=float(cost.total_cost) if cost.total_cost else 0.0,
            notes=cost.notes
        ) for cost in costs]
    )


@router.post("/{project_id}/vehicle_costs", response_model=ResponseBase)
async def add_vehicle_cost(
    project_id: str,
    cost_data: ProjectVehicleCostSchema,
    db: AsyncSession = Depends(get_db)
):
    """Add a vehicle cost to a project"""
    
    # Ensure project_id matches
    cost_data.project_id = project_id
    
    cost = await ProjectService.add_vehicle_cost(db, cost_data)
    
    return ResponseBase(
        success=True,
        message="Vehicle cost added successfully",
        data=ProjectVehicleCostSchema(
            id=cost.id,
            project_id=cost.project_id,
            vehicle_id=cost.vehicle_id,
            usage_type=cost.usage_type,
            usage_value=float(cost.usage_value) if cost.usage_value else 0.0,
            cost_per_unit=float(cost.cost_per_unit) if cost.cost_per_unit else 0.0,
            total_cost=float(cost.total_cost) if cost.total_cost else 0.0,
            notes=cost.notes
        )
    )


# Material usage endpoints

@router.get("/{project_id}/material_usage", response_model=ResponseBase)
async def get_project_material_usage(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get material usage for a project"""
    
    usage = await ProjectService.get_material_usage(db, project_id)
    
    return ResponseBase(
        success=True,
        data=[ProjectMaterialUsageSchema(
            id=item.id,
            project_id=item.project_id,
            material_id=item.material_id,
            quantity=float(item.quantity) if item.quantity else 1.0,
            phase=item.phase,
            inspection_id=item.inspection_id
        ) for item in usage]
    )


@router.post("/{project_id}/material_usage", response_model=ResponseBase)
async def add_material_usage(
    project_id: str,
    usage_data: ProjectMaterialUsageSchema,
    db: AsyncSession = Depends(get_db)
):
    """Add material usage to a project"""
    
    # Ensure project_id matches
    usage_data.project_id = project_id
    
    usage = await ProjectService.add_material_usage(db, usage_data)
    
    return ResponseBase(
        success=True,
        message="Material usage added successfully",
        data=ProjectMaterialUsageSchema(
            id=usage.id,
            project_id=usage.project_id,
            material_id=usage.material_id,
            quantity=float(usage.quantity) if usage.quantity else 1.0,
            phase=usage.phase,
            inspection_id=usage.inspection_id
        )
    )


@router.get("/search/query", response_model=ProjectsResponse)
async def search_projects(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Search projects by name or address"""
    
    projects = await ProjectService.search_projects(db, q, limit)
    
    return ProjectsResponse(
        success=True,
        data=[ProjectResponse(**project.to_dict()) for project in projects]
    )
