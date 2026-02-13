"""
FastAPI router for services module
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from csv import DictReader
import io
import re

from backend.core.database import get_db
from backend.core.schemas import ResponseBase
from backend.core.tenant import get_current_tenant_sync

from .models import Service
from .schemas import (
    ServiceCreate, ServiceUpdate, ServiceResponse, 
    ServiceListResponse, ServiceCSVImport, ServicesResponse, ServiceDetailResponse
)
from .service import ServiceService

router = APIRouter(prefix="/api/services", tags=["services"])


# CSV field validation rules
CSV_REQUIRED_FIELDS = ['name']
CSV_NUMERIC_FIELDS = ['price_per_unit', 'cost_per_unit']
CSV_BOOLEAN_FIELDS = ['active']


def validate_csv_row(row: dict, row_num: int) -> tuple[dict, List[str]]:
    """
    Validate a single CSV row and return cleaned data with any errors.
    
    Args:
        row: The CSV row as a dictionary
        row_num: The row number for error messages
        
    Returns:
        Tuple of (cleaned_row_data, list_of_errors)
    """
    errors = []
    cleaned = {}
    
    # Check required fields
    for field in CSV_REQUIRED_FIELDS:
        if field not in row or not row[field] or not str(row[field]).strip():
            errors.append(f"Row {row_num}: Missing required field '{field}'")
    
    # Clean and validate string fields
    for key, value in row.items():
        if value is None:
            cleaned[key] = None
            continue
            
        # Strip whitespace from strings
        if isinstance(value, str):
            cleaned[key] = value.strip()
        else:
            cleaned[key] = value
    
    # Validate and convert numeric fields
    for field in CSV_NUMERIC_FIELDS:
        if field in row and row.get(field):
            try:
                # Handle European decimal format (comma as decimal separator)
                value_str = str(row[field]).replace(',', '.')
                cleaned[field] = float(value_str)
                if cleaned[field] < 0:
                    errors.append(f"Row {row_num}: Field '{field}' cannot be negative")
            except (ValueError, TypeError):
                errors.append(f"Row {row_num}: Invalid numeric value for '{field}': {row[field]}")
                cleaned[field] = None
    
    # Validate and convert boolean fields
    for field in CSV_BOOLEAN_FIELDS:
        if field in row and row.get(field) is not None:
            value = str(row[field]).lower().strip()
            if value in ('true', '1', 'yes', 'ja', 'aktiv'):
                cleaned[field] = True
            elif value in ('false', '0', 'no', 'nein', 'inaktiv'):
                cleaned[field] = False
            else:
                errors.append(f"Row {row_num}: Invalid boolean value for '{field}': {row[field]}")
                cleaned[field] = True  # Default to active
    
    # Validate name length
    if 'name' in cleaned and cleaned['name']:
        if len(cleaned['name']) > 255:
            errors.append(f"Row {row_num}: Name too long (max 255 characters)")
        if len(cleaned['name']) < 2:
            errors.append(f"Row {row_num}: Name too short (min 2 characters)")
    
    return cleaned, errors


@router.get("/config", response_model=ResponseBase)
async def get_config():
    """Get tenant configuration for frontend"""
    tenant = get_current_tenant_sync()
    return ResponseBase(
        success=True,
        data=tenant.to_dict()
    )


@router.get("/", response_model=ServiceListResponse)
async def list_services(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    active_only: bool = Query(True, description="Return only active services"),
    db: AsyncSession = Depends(get_db)
) -> ServiceListResponse:
    """List services with pagination"""
    
    services, total = await ServiceService.get_services(
        db, skip, limit, active_only
    )
    
    service_responses = []
    for service in services:
        service_responses.append(ServiceResponse(**service.to_dict()))
    
    total_pages = (total + limit - 1) // limit
    
    return ServiceListResponse(
        items=service_responses,
        total=total,
        page=skip // limit + 1,
        per_page=limit,
        total_pages=total_pages
    )


@router.get("/{service_id}", response_model=ServiceDetailResponse)
async def get_service(
    service_id: str,
    db: AsyncSession = Depends(get_db)
) -> ServiceDetailResponse:
    """Get a single service by ID"""
    
    service = await ServiceService.get_service(db, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return ServiceDetailResponse(
        success=True,
        data=ServiceResponse(**service.to_dict())
    )


@router.post("/", response_model=ServiceDetailResponse, status_code=201)
async def create_service(
    service_data: ServiceCreate,
    db: AsyncSession = Depends(get_db)
) -> ServiceDetailResponse:
    """Create a new service"""
    
    service = await ServiceService.create_service(db, service_data)
    
    return ServiceDetailResponse(
        success=True,
        message="Service created successfully",
        data=ServiceResponse(**service.to_dict())
    )


@router.put("/{service_id}", response_model=ServiceDetailResponse)
async def update_service(
    service_id: str,
    update_data: ServiceUpdate,
    db: AsyncSession = Depends(get_db)
) -> ServiceDetailResponse:
    """Update a service"""
    
    service = await ServiceService.update_service(db, service_id, update_data)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return ServiceDetailResponse(
        success=True,
        message="Service updated successfully",
        data=ServiceResponse(**service.to_dict())
    )


@router.delete("/{service_id}", response_model=ResponseBase)
async def delete_service(
    service_id: str,
    db: AsyncSession = Depends(get_db)
) -> ResponseBase:
    """Delete a service (soft delete)"""
    
    success = await ServiceService.delete_service(db, service_id)
    if not success:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return ResponseBase(
        success=True,
        message="Service deleted successfully"
    )


@router.post("/import/csv", response_model=ResponseBase)
async def import_services_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
) -> ResponseBase:
    """
    Import services from CSV file.
    
    Expected CSV columns:
    - name (required): Service name
    - description: Service description
    - unit: Unit of measurement
    - category: Service category
    - price_per_unit: Price per unit (numeric)
    - cost_per_unit: Cost per unit (numeric)
    - active: Whether service is active (true/false)
    """
    tenant = get_current_tenant_sync()
    
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file (.csv extension)")
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Try to decode the content with different encodings
    decoded_content = None
    for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']:
        try:
            decoded_content = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    
    if decoded_content is None:
        raise HTTPException(status_code=400, detail="Unable to decode file. Please use UTF-8 encoding.")
    
    try:
        csv_file = io.StringIO(decoded_content)
        reader = DictReader(csv_file)
        
        # Validate CSV has headers
        if not reader.fieldnames:
            raise HTTPException(status_code=400, detail="CSV file has no headers")
        
        # Check for required columns
        missing_required = set(CSV_REQUIRED_FIELDS) - set(reader.fieldnames)
        if missing_required:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_required)}"
            )
        
        csv_data = []
        all_errors = []
        row_num = 1  # Start at 1 (after header)
        
        for row in reader:
            row_num += 1
            cleaned_row, row_errors = validate_csv_row(row, row_num)
            
            if row_errors:
                all_errors.extend(row_errors)
                continue  # Skip invalid rows
            
            try:
                csv_data.append(ServiceCSVImport(**cleaned_row))
            except Exception as e:
                all_errors.append(f"Row {row_num}: Validation error - {str(e)}")
        
        if not csv_data and all_errors:
            return ResponseBase(
                success=False,
                message="No valid data to import",
                data={"errors": all_errors[:50], "total_errors": len(all_errors)}  # Limit error list
            )
        
        if not csv_data:
            return ResponseBase(
                success=False,
                message="CSV file contains no data rows"
            )
        
        # Import the data
        imported_count, import_errors = await ServiceService.import_from_csv(db, csv_data, tenant.tenant_id)
        
        all_errors.extend(import_errors)
        
        if all_errors:
            return ResponseBase(
                success=imported_count > 0,
                message=f"Imported {imported_count} services with {len(all_errors)} errors",
                data={
                    "imported": imported_count,
                    "errors": all_errors[:50],  # Limit error list
                    "total_errors": len(all_errors)
                }
            )
        
        return ResponseBase(
            success=True,
            message=f"Successfully imported {imported_count} services"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV processing error: {str(e)}")


@router.get("/search/query", response_model=ServicesResponse)
async def search_services(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Number of results"),
    db: AsyncSession = Depends(get_db)
) -> ServicesResponse:
    """Search services by name using parameterized queries"""
    tenant = get_current_tenant_sync()
    
    # The search is now done safely through the service layer using parameterized queries
    services = await ServiceService.search_services(db, tenant.tenant_id, q, limit)
    
    # Calculate margin for each service
    service_responses = []
    for service in services:
        margin = None
        if service.cost_per_unit is not None:
            margin = float(service.price_per_unit) - float(service.cost_per_unit)
        
        service_responses.append(ServiceResponse(
            **service.to_dict(),
            margin=margin
        ))
    
    return ServicesResponse(
        success=True,
        data=service_responses
    )
