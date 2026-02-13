"""
Business logic for projects module (Nachkalkulation)
"""
import uuid
from typing import List, Optional, Tuple
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import (
    Project, ProjectRevenueItem, ProjectVehicleCost, 
    ProjectMaterialUsage, ProjectExtraCost, ProjectDiscount
)
from .schemas import (
    ProjectCreate, ProjectUpdate, ProjectRevenueItemSchema,
    ProjectVehicleCostSchema, ProjectMaterialUsageSchema
)


class ProjectService:
    """Service layer for project operations"""
    
    @staticmethod
    async def create_project(db: AsyncSession, project_data: ProjectCreate) -> Project:
        """Create a new project"""
        project = Project(
            project_id=str(uuid.uuid4()),
            **project_data.model_dump()
        )
        
        db.add(project)
        await db.commit()
        await db.refresh(project)
        return project
    
    @staticmethod
    async def get_project(db: AsyncSession, project_id: str) -> Optional[Project]:
        """Get a project by ID"""
        result = await db.execute(
            select(Project)
            .where(Project.project_id == project_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_projects(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[str] = None
    ) -> Tuple[List[Project], int]:
        """Get projects with pagination and filtering"""
        
        # Build count query
        count_query = select(func.count(Project.project_id))
        if status:
            count_query = count_query.where(Project.status == status)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Build main query
        query = select(Project)
        if status:
            query = query.where(Project.status == status)
        
        query = query.order_by(Project.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        projects = result.scalars().all()
        
        return list(projects), total
    
    @staticmethod
    async def update_project(
        db: AsyncSession, 
        project_id: str, 
        update_data: ProjectUpdate
    ) -> Optional[Project]:
        """Update a project"""
        project = await ProjectService.get_project(db, project_id)
        if not project:
            return None
        
        # Update only provided fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(project, field, value)
        
        await db.commit()
        await db.refresh(project)
        return project
    
    @staticmethod
    async def delete_project(db: AsyncSession, project_id: str) -> bool:
        """Delete a project"""
        project = await ProjectService.get_project(db, project_id)
        if not project:
            return False
        
        await db.delete(project)
        await db.commit()
        return True
    
    # Nachkalkulation (Post-calculation) methods
    
    @staticmethod
    async def get_nachkalkulation(db: AsyncSession, project_id: str) -> Optional[dict]:
        """
        Get complete Nachkalkulation for a project
        Includes revenue, costs, and margin calculations
        """
        
        # Get project with all related data
        project = await ProjectService.get_project(db, project_id)
        if not project:
            return None
        
        # Get revenue items
        revenue_items = await ProjectService.get_revenue_items(db, project_id)
        
        # Get vehicle costs
        vehicle_costs = await ProjectService.get_vehicle_costs(db, project_id)
        
        # Get material usage
        material_usage = await ProjectService.get_material_usage(db, project_id)
        
        # Get extra costs
        extra_costs = await ProjectService.get_extra_costs(db, project_id)
        
        # Calculate totals
        revenue_total = sum(item.line_total or 0 for item in revenue_items)
        vehicle_total = sum(cost.total_cost or 0 for cost in vehicle_costs)
        material_total = 0  # Would need to fetch material prices
        extra_total = sum(cost.cost or 0 for cost in extra_costs)
        
        # Time pair costs (would need to fetch from time_pairs table)
        time_pair_total = 0
        
        # Total cost
        cost_total = vehicle_total + material_total + extra_total + time_pair_total
        
        # Margin calculations
        marge_eur = revenue_total - cost_total
        marge_pct = (marge_eur / revenue_total * 100) if revenue_total > 0 else 0
        
        return {
            'project': project,
            'revenue_items': revenue_items,
            'vehicle_costs': vehicle_costs,
            'material_usage': material_usage,
            'extra_costs': extra_costs,
            'revenue_total': revenue_total,
            'cost_total': cost_total,
            'marge_eur': marge_eur,
            'marge_pct': marge_pct
        }
    
    @staticmethod
    async def get_revenue_items(db: AsyncSession, project_id: str) -> List[ProjectRevenueItem]:
        """Get revenue items for a project"""
        result = await db.execute(
            select(ProjectRevenueItem)
            .where(ProjectRevenueItem.project_id == project_id)
            .order_by(ProjectRevenueItem.sort_order, ProjectRevenueItem.created_at)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def add_revenue_item(db: AsyncSession, item_data: ProjectRevenueItemSchema) -> ProjectRevenueItem:
        """Add a revenue item to a project"""
        # Calculate line total
        qty = float(item_data.qty) if item_data.qty else 0
        unit_price = float(item_data.unit_price) if item_data.unit_price else 0
        line_total = qty * unit_price
        
        item = ProjectRevenueItem(
            id=str(uuid.uuid4()),
            project_id=item_data.project_id,
            position_label=item_data.position_label,
            qty=item_data.qty,
            unit=item_data.unit,
            unit_price=item_data.unit_price,
            line_total=line_total,
            kind=item_data.kind,
            source_inspection_id=item_data.source_inspection_id,
            sort_order=item_data.sort_order,
            notes=item_data.notes
        )
        
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item
    
    @staticmethod
    async def get_vehicle_costs(db: AsyncSession, project_id: str) -> List[ProjectVehicleCost]:
        """Get vehicle costs for a project"""
        result = await db.execute(
            select(ProjectVehicleCost)
            .where(ProjectVehicleCost.project_id == project_id)
            .order_by(ProjectVehicleCost.created_at)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def add_vehicle_cost(db: AsyncSession, cost_data: ProjectVehicleCostSchema) -> ProjectVehicleCost:
        """Add a vehicle cost to a project"""
        # Calculate total cost
        usage_value = float(cost_data.usage_value) if cost_data.usage_value else 0
        cost_per_unit = float(cost_data.cost_per_unit) if cost_data.cost_per_unit else 0
        total_cost = usage_value * cost_per_unit
        
        cost = ProjectVehicleCost(
            id=str(uuid.uuid4()),
            project_id=cost_data.project_id,
            vehicle_id=cost_data.vehicle_id,
            usage_type=cost_data.usage_type,
            usage_value=cost_data.usage_value,
            cost_per_unit=cost_data.cost_per_unit,
            total_cost=total_cost,
            notes=cost_data.notes
        )
        
        db.add(cost)
        await db.commit()
        await db.refresh(cost)
        return cost
    
    @staticmethod
    async def get_material_usage(db: AsyncSession, project_id: str) -> List[ProjectMaterialUsage]:
        """Get material usage for a project"""
        result = await db.execute(
            select(ProjectMaterialUsage)
            .where(ProjectMaterialUsage.project_id == project_id)
            .order_by(ProjectMaterialUsage.created_at)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def add_material_usage(db: AsyncSession, usage_data: ProjectMaterialUsageSchema) -> ProjectMaterialUsage:
        """Add material usage to a project"""
        usage = ProjectMaterialUsage(
            id=str(uuid.uuid4()),
            project_id=usage_data.project_id,
            material_id=usage_data.material_id,
            quantity=usage_data.quantity,
            phase=usage_data.phase,
            inspection_id=usage_data.inspection_id
        )
        
        db.add(usage)
        await db.commit()
        await db.refresh(usage)
        return usage
    
    @staticmethod
    async def get_extra_costs(db: AsyncSession, project_id: str) -> List[ProjectExtraCost]:
        """Get extra costs for a project"""
        result = await db.execute(
            select(ProjectExtraCost)
            .where(ProjectExtraCost.project_id == project_id)
            .order_by(ProjectExtraCost.created_at)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def search_projects(
        db: AsyncSession,
        query: str,
        limit: int = 20
    ) -> List[Project]:
        """Search projects by name or address"""
        search_term = f"%{query}%"
        
        result = await db.execute(
            select(Project)
            .where(
                and_(
                    func.lower(Project.name).ilike(func.lower(search_term))
                )
            )
            .order_by(Project.name)
            .limit(limit)
        )
        
        return list(result.scalars().all())
