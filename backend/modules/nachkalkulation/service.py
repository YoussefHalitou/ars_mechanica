"""
Service layer for Nachkalkulation (Post-Calculation) module
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from datetime import datetime, date, timedelta
from decimal import Decimal

from backend.modules.nachkalkulation.models import (
    Nachkalkulation, NachkalkulationDetail, NachkalkulationEmployeeSummary, 
    NachkalkulationMaterialSummary
)
from backend.modules.nachkalkulation.schemas import (
    NachkalkulationCreate, NachkalkulationUpdate, NachkalkulationDetailCreate,
    NachkalkulationDetailUpdate
)
from backend.modules.projects.models import Project, ProjectMaterialUsage, ProjectVehicleCost
from backend.modules.time_pairs.models import TimePair
from backend.modules.users.models import Employee
from backend.modules.materials.models import Material


class NachkalkulationService:
    """Service for post-calculation operations"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_calculation(self, calc_data: NachkalkulationCreate) -> Nachkalkulation:
        """Create a new post-calculation"""
        calculation = Nachkalkulation(**calc_data.dict())
        self.session.add(calculation)
        await self.session.commit()
        await self.session.refresh(calculation)
        return calculation
    
    async def get_calculation(self, nachkalkulation_id: str) -> Optional[Nachkalkulation]:
        """Get a post-calculation by ID"""
        result = await self.session.execute(
            select(Nachkalkulation)
            .where(Nachkalkulation.nachkalkulation_id == nachkalkulation_id)
        )
        return result.scalar_one_or_none()
    
    async def get_calculation_by_project(self, project_id: str) -> Optional[Nachkalkulation]:
        """Get post-calculation for a project"""
        result = await self.session.execute(
            select(Nachkalkulation)
            .where(Nachkalkulation.project_id == project_id)
        )
        return result.scalar_one_or_none()
    
    async def get_calculations_by_date_range(self, start_date: date, end_date: date,
                                           status: Optional[str] = None) -> List[Nachkalkulation]:
        """Get post-calculations within a date range"""
        query = select(Nachkalkulation).where(
            and_(
                Nachkalkulation.calculation_date >= start_date,
                Nachkalkulation.calculation_date <= end_date
            )
        )
        if status:
            query = query.where(Nachkalkulation.status == status)
        query = query.order_by(desc(Nachkalkulation.calculation_date))
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def update_calculation(self, nachkalkulation_id: str, 
                               calc_data: NachkalkulationUpdate) -> Optional[Nachkalkulation]:
        """Update a post-calculation"""
        calculation = await self.get_calculation(nachkalkulation_id)
        if not calculation:
            return None
        
        for key, value in calc_data.dict(exclude_unset=True).items():
            setattr(calculation, key, value)
        
        calculation.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(calculation)
        return calculation
    
    async def delete_calculation(self, nachkalkulation_id: str) -> bool:
        """Delete a post-calculation"""
        calculation = await self.get_calculation(nachkalkulation_id)
        if not calculation:
            return False
        
        await self.session.delete(calculation)
        await self.session.commit()
        return True
    
    async def add_detail(self, nachkalkulation_id: str, 
                        detail_data: NachkalkulationDetailCreate) -> NachkalkulationDetail:
        """Add detail to post-calculation"""
        detail = NachkalkulationDetail(
            nachkalkulation_id=nachkalkulation_id,
            **detail_data.dict()
        )
        detail.calculate_variance()
        self.session.add(detail)
        await self.session.commit()
        await self.session.refresh(detail)
        return detail
    
    async def update_detail(self, detail_id: str, 
                           detail_data: NachkalkulationDetailUpdate) -> Optional[NachkalkulationDetail]:
        """Update a detail"""
        result = await self.session.execute(
            select(NachkalkulationDetail).where(NachkalkulationDetail.detail_id == detail_id)
        )
        detail = result.scalar_one_or_none()
        if not detail:
            return None
        
        for key, value in detail_data.dict(exclude_unset=True).items():
            setattr(detail, key, value)
        
        detail.calculate_variance()
        detail.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(detail)
        return detail
    
    async def delete_detail(self, detail_id: str) -> bool:
        """Delete a detail"""
        result = await self.session.execute(
            select(NachkalkulationDetail).where(NachkalkulationDetail.detail_id == detail_id)
        )
        detail = result.scalar_one_or_none()
        if not detail:
            return False
        
        await self.session.delete(detail)
        await self.session.commit()
        return True
    
    async def generate_calculation(self, project_id: str, calculated_by: str) -> Optional[Nachkalkulation]:
        """Generate post-calculation from project data"""
        # Check if calculation already exists
        existing = await self.get_calculation_by_project(project_id)
        if existing:
            return existing
        
        # Get project
        result = await self.session.execute(
            select(Project).where(Project.project_id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            return None
        
        # Create calculation
        calc_data = NachkalkulationCreate(
            project_id=project_id,
            calculation_date=datetime.utcnow().date(),
            calculated_by=calculated_by
        )
        calculation = await self.create_calculation(calc_data)
        
        # Generate employee summary from time pairs
        time_pairs_result = await self.session.execute(
            select(TimePair).where(TimePair.project_id == project_id)
        )
        time_pairs = time_pairs_result.scalars().all()
        
        employee_hours = {}
        for tp in time_pairs:
            if tp.employee_id:
                if tp.employee_id not in employee_hours:
                    employee_hours[tp.employee_id] = {
                        'hours': Decimal(0),
                        'cost': Decimal(0)
                    }
                hours = float(tp.total_hours or 0)
                rate = float(tp.hourly_rate or 0)
                employee_hours[tp.employee_id]['hours'] += Decimal(str(hours))
                employee_hours[tp.employee_id]['cost'] += Decimal(str(hours * rate))
        
        calculation.cost_employees = sum(data['cost'] for data in employee_hours.values())
        calculation.total_hours_actual = sum(data['hours'] for data in employee_hours.values())
        
        # Generate material summary
        material_usage_result = await self.session.execute(
            select(ProjectMaterialUsage).where(ProjectMaterialUsage.project_id == project_id)
        )
        material_usage = material_usage_result.scalars().all()
        
        calculation.cost_materials = sum(float(mu.total_cost or 0) for mu in material_usage)
        
        # Generate vehicle summary
        vehicle_costs_result = await self.session.execute(
            select(ProjectVehicleCost).where(ProjectVehicleCost.project_id == project_id)
        )
        vehicle_costs = vehicle_costs_result.scalars().all()
        
        calculation.cost_vehicles = sum(float(vc.amount or 0) for vc in vehicle_costs)
        
        # Set revenue from project
        calculation.total_revenue = project.total_revenue
        calculation.revenue_services = project.total_revenue
        
        # Calculate totals
        calculation.calculate_totals()
        
        await self.session.commit()
        await self.session.refresh(calculation)
        
        # Generate detailed items
        for tp in time_pairs:
            if tp.employee_id:
                detail_data = NachkalkulationDetailCreate(
                    item_type="employee",
                    item_category="Arbeitszeit",
                    item_description=f"Arbeitszeit - {tp.mitarbeiter}",
                    quantity_planned=Decimal(str(tp.total_hours or 0)),
                    quantity_actual=Decimal(str(tp.total_hours or 0)),
                    unit="Stunden",
                    unit_price_planned=Decimal(str(tp.hourly_rate or 0)),
                    unit_price_actual=Decimal(str(tp.hourly_rate or 0)),
                    employee_id=tp.employee_id,
                    employee_name=tp.mitarbeiter,
                    hours_worked=Decimal(str(tp.total_hours or 0)),
                    hourly_rate=Decimal(str(tp.hourly_rate or 0))
                )
                await self.add_detail(calculation.nachkalkulation_id, detail_data)
        
        return calculation
    
    async def get_dashboard_data(self, start_date: date, end_date: date) -> dict:
        """Get dashboard summary data"""
        calculations = await self.get_calculations_by_date_range(start_date, end_date)
        
        total_revenue = sum(float(c.total_revenue or 0) for c in calculations)
        total_costs = sum(float(c.total_costs or 0) for c in calculations)
        total_profit = sum(float(c.net_profit or 0) for c in calculations)
        
        avg_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        # Count by status
        status_counts = {}
        for calc in calculations:
            status = calc.status
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            'total_calculations': len(calculations),
            'total_revenue': total_revenue,
            'total_costs': total_costs,
            'total_profit': total_profit,
            'average_margin_percent': avg_margin,
            'status_distribution': status_counts,
            'period_start': start_date,
            'period_end': end_date
        }
    
    async def get_top_projects_by_margin(self, limit: int = 10, 
                                       start_date: Optional[date] = None,
                                       end_date: Optional[date] = None) -> List[dict]:
        """Get top projects by profit margin"""
        query = select(Nachkalkulation).where(Nachkalkulation.status == 'Abgeschlossen')
        
        if start_date:
            query = query.where(Nachkalkulation.calculation_date >= start_date)
        if end_date:
            query = query.where(Nachkalkulation.calculation_date <= end_date)
        
        query = query.order_by(desc(Nachkalkulation.profit_margin_percent)).limit(limit)
        
        result = await self.session.execute(query)
        calculations = result.scalars().all()
        
        return [
            {
                'project_id': calc.project_id,
                'project_name': calc.project.name if calc.project else 'Unknown',
                'total_revenue': float(calc.total_revenue or 0),
                'total_costs': float(calc.total_costs or 0),
                'net_profit': float(calc.net_profit or 0),
                'profit_margin_percent': float(calc.profit_margin_percent or 0)
            }
            for calc in calculations
        ]
    
    async def lock_calculation(self, nachkalkulation_id: str, user_id: str) -> Optional[Nachkalkulation]:
        """Lock a calculation for editing"""
        calculation = await self.get_calculation(nachkalkulation_id)
        if not calculation:
            return None
        
        if calculation.is_locked:
            return None  # Already locked
        
        calculation.is_locked = True
        calculation.updated_at = datetime.utcnow()
        
        await self.session.commit()
        await self.session.refresh(calculation)
        return calculation
    
    async def approve_calculation(self, nachkalkulation_id: str, 
                                approved_by: str) -> Optional[Nachkalkulation]:
        """Approve a calculation"""
        calculation = await self.get_calculation(nachkalkulation_id)
        if not calculation:
            return None
        
        if calculation.is_locked:
            return None  # Cannot approve locked calculation
        
        calculation.status = 'Abgeschlossen'
        calculation.approved_by = approved_by
        calculation.approved_at = datetime.utcnow()
        
        await self.session.commit()
        await self.session.refresh(calculation)
        return calculation
