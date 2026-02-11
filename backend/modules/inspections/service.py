"""
Business logic for Inspections module (Draftbit architecture)
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
import uuid

from backend.modules.inspections.models import Inspection
from backend.modules.inspections.schemas import InspectionCreate, InspectionUpdate


class InspectionService:
    """Service layer for inspection operations"""
    
    @staticmethod
    async def create_inspection(db: AsyncSession, inspection_data: InspectionCreate) -> Inspection:
        """Create a new inspection"""
        inspection = Inspection(**inspection_data.dict())
        db.add(inspection)
        await db.commit()
        await db.refresh(inspection)
        return inspection
    
    @staticmethod
    async def get_inspections(db: AsyncSession, skip: int = 0, limit: int = 100,
                             project_id: Optional[str] = None,
                             status: Optional[str] = None) -> List[Inspection]:
        """Get all inspections with optional filters"""
        query = select(Inspection).offset(skip).limit(limit)
        
        filters = []
        if project_id:
            filters.append(Inspection.project_id == project_id)
        if status:
            filters.append(Inspection.status == status)
        
        if filters:
            query = query.where(and_(*filters))
        
        query = query.order_by(Inspection.created_at.desc())
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_inspection(db: AsyncSession, inspection_id: str) -> Optional[Inspection]:
        """Get inspection by ID"""
        result = await db.execute(
            select(Inspection).where(Inspection.inspection_id == inspection_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_inspection(db: AsyncSession, inspection_id: str, inspection_data: InspectionUpdate) -> Optional[Inspection]:
        """Update inspection"""
        inspection = await InspectionService.get_inspection(db, inspection_id)
        if not inspection:
            return None
        
        for field, value in inspection_data.dict(exclude_unset=True).items():
            setattr(inspection, field, value)
        
        await db.commit()
        await db.refresh(inspection)
        return inspection
    
    @staticmethod
    async def delete_inspection(db: AsyncSession, inspection_id: str) -> bool:
        """Delete inspection"""
        inspection = await InspectionService.get_inspection(db, inspection_id)
        if not inspection:
            return False
        
        await db.delete(inspection)
        await db.commit()
        return True
