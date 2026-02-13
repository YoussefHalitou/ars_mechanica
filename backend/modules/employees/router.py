"""
FastAPI router for employees module (Mitarbeiterkatalog)
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.core.schemas import ResponseBase

from .schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, 
    EmployeeListResponse, EmployeesResponse, EmployeeDetailResponse
)
from .service import EmployeeService

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("/", response_model=EmployeeListResponse)
async def list_employees(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    active_only: bool = Query(True, description="Return only active employees"),
    db: AsyncSession = Depends(get_db)
):
    """List employees with pagination"""
    
    employees, total = await EmployeeService.get_employees(
        db, skip, limit, active_only
    )
    
    total_pages = (total + limit - 1) // limit
    
    return EmployeeListResponse(
        items=[EmployeeResponse(**employee.to_dict()) for employee in employees],
        total=total,
        page=skip // limit + 1,
        per_page=limit,
        total_pages=total_pages
    )


@router.get("/{employee_id}", response_model=EmployeeDetailResponse)
async def get_employee(
    employee_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a single employee by ID"""
    
    employee = await EmployeeService.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return EmployeeDetailResponse(
        success=True,
        data=EmployeeResponse(**employee.to_dict())
    )


@router.post("/", response_model=EmployeeDetailResponse, status_code=201)
async def create_employee(
    employee_data: EmployeeCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new employee"""
    
    employee = await EmployeeService.create_employee(db, employee_data)
    
    return EmployeeDetailResponse(
        success=True,
        message="Employee created successfully",
        data=EmployeeResponse(**employee.to_dict())
    )


@router.put("/{employee_id}", response_model=EmployeeDetailResponse)
async def update_employee(
    employee_id: str,
    update_data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an employee"""
    
    employee = await EmployeeService.update_employee(db, employee_id, update_data)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return EmployeeDetailResponse(
        success=True,
        message="Employee updated successfully",
        data=EmployeeResponse(**employee.to_dict())
    )


@router.delete("/{employee_id}", response_model=ResponseBase)
async def delete_employee(
    employee_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete an employee"""
    
    success = await EmployeeService.delete_employee(db, employee_id)
    if not success:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return ResponseBase(
        success=True,
        message="Employee deleted successfully"
    )


@router.get("/search/query", response_model=EmployeesResponse)
async def search_employees(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Search employees by name"""
    
    employees = await EmployeeService.search_employees(db, q, limit)
    
    return EmployeesResponse(
        success=True,
        data=[EmployeeResponse(**employee.to_dict()) for employee in employees]
    )
