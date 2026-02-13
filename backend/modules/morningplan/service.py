"""
Service layer for Morningplan module
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from datetime import datetime, date, timedelta

from backend.modules.morningplan.models import (
    MorningPlan, MorningPlanStaff, MorningPlanTask, MorningPlanChecklist
)
from backend.modules.morningplan.schemas import (
    MorningPlanCreate, MorningPlanUpdate, MorningPlanStaffCreate, 
    MorningPlanTaskCreate, MorningPlanChecklistCreate,
    MorningPlanTaskUpdate, MorningPlanStaffUpdate, MorningPlanChecklistUpdate
)
from backend.modules.projects.models import Project
from backend.modules.users.models import Employee, User


class MorningPlanService:
    """Service for morning plan operations"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_plan(self, plan_data: MorningPlanCreate, created_by: str) -> MorningPlan:
        """Create a new morning plan"""
        plan = MorningPlan(
            **plan_data.dict(),
            created_by=created_by
        )
        self.session.add(plan)
        await self.session.commit()
        await self.session.refresh(plan)
        return plan
    
    async def get_plan(self, plan_id: str) -> Optional[MorningPlan]:
        """Get a morning plan by ID"""
        result = await self.session.execute(
            select(MorningPlan)
            .where(MorningPlan.plan_id == plan_id)
        )
        return result.scalar_one_or_none()
    
    async def get_plans_by_project(self, project_id: str, plan_type: Optional[str] = None) -> List[MorningPlan]:
        """Get all morning plans for a project"""
        query = select(MorningPlan).where(MorningPlan.project_id == project_id)
        if plan_type:
            query = query.where(MorningPlan.plan_type == plan_type)
        query = query.order_by(desc(MorningPlan.plan_date))
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_plans_by_date(self, plan_date: date, plan_type: Optional[str] = None) -> List[MorningPlan]:
        """Get all morning plans for a specific date"""
        query = select(MorningPlan).where(MorningPlan.plan_date == plan_date)
        if plan_type:
            query = query.where(MorningPlan.plan_type == plan_type)
        query = query.order_by(MorningPlan.planned_start_time)
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_plans_by_date_range(self, start_date: date, end_date: date, 
                                    plan_type: Optional[str] = None) -> List[MorningPlan]:
        """Get all morning plans within a date range"""
        query = select(MorningPlan).where(
            and_(
                MorningPlan.plan_date >= start_date,
                MorningPlan.plan_date <= end_date
            )
        )
        if plan_type:
            query = query.where(MorningPlan.plan_type == plan_type)
        query = query.order_by(MorningPlan.plan_date, MorningPlan.planned_start_time)
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def update_plan(self, plan_id: str, plan_data: MorningPlanUpdate) -> Optional[MorningPlan]:
        """Update a morning plan"""
        plan = await self.get_plan(plan_id)
        if not plan:
            return None
        
        for key, value in plan_data.dict(exclude_unset=True).items():
            setattr(plan, key, value)
        
        plan.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(plan)
        return plan
    
    async def delete_plan(self, plan_id: str) -> bool:
        """Delete a morning plan"""
        plan = await self.get_plan(plan_id)
        if not plan:
            return False
        
        await self.session.delete(plan)
        await self.session.commit()
        return True
    
    async def add_staff_to_plan(self, plan_id: str, staff_data: MorningPlanStaffCreate) -> MorningPlanStaff:
        """Add staff to a morning plan"""
        staff = MorningPlanStaff(
            plan_id=plan_id,
            **staff_data.dict()
        )
        self.session.add(staff)
        await self.session.commit()
        await self.session.refresh(staff)
        return staff
    
    async def remove_staff_from_plan(self, staff_id: int) -> bool:
        """Remove staff from a morning plan"""
        result = await self.session.execute(
            select(MorningPlanStaff).where(MorningPlanStaff.id == staff_id)
        )
        staff = result.scalar_one_or_none()
        if not staff:
            return False
        
        await self.session.delete(staff)
        await self.session.commit()
        return True
    
    async def update_staff_assignment(self, staff_id: int, 
                                    staff_data: MorningPlanStaffUpdate) -> Optional[MorningPlanStaff]:
        """Update staff assignment"""
        result = await self.session.execute(
            select(MorningPlanStaff).where(MorningPlanStaff.id == staff_id)
        )
        staff = result.scalar_one_or_none()
        if not staff:
            return None
        
        for key, value in staff_data.dict(exclude_unset=True).items():
            setattr(staff, key, value)
        
        staff.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(staff)
        return staff
    
    async def add_task_to_plan(self, plan_id: str, task_data: MorningPlanTaskCreate) -> MorningPlanTask:
        """Add task to a morning plan"""
        task = MorningPlanTask(
            plan_id=plan_id,
            **task_data.dict()
        )
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task
    
    async def update_task(self, task_id: str, task_data: MorningPlanTaskUpdate) -> Optional[MorningPlanTask]:
        """Update a task"""
        result = await self.session.execute(
            select(MorningPlanTask).where(MorningPlanTask.task_id == task_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            return None
        
        for key, value in task_data.dict(exclude_unset=True).items():
            setattr(task, key, value)
        
        task.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(task)
        return task
    
    async def delete_task(self, task_id: str) -> bool:
        """Delete a task"""
        result = await self.session.execute(
            select(MorningPlanTask).where(MorningPlanTask.task_id == task_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            return False
        
        await self.session.delete(task)
        await self.session.commit()
        return True
    
    async def add_checklist_item(self, plan_id: str, 
                               checklist_data: MorningPlanChecklistCreate) -> MorningPlanChecklist:
        """Add checklist item to a morning plan"""
        checklist = MorningPlanChecklist(
            plan_id=plan_id,
            **checklist_data.dict()
        )
        self.session.add(checklist)
        await self.session.commit()
        await self.session.refresh(checklist)
        return checklist
    
    async def update_checklist_item(self, checklist_id: str, 
                                  checklist_data: MorningPlanChecklistUpdate) -> Optional[MorningPlanChecklist]:
        """Update a checklist item"""
        result = await self.session.execute(
            select(MorningPlanChecklist).where(MorningPlanChecklist.checklist_id == checklist_id)
        )
        checklist = result.scalar_one_or_none()
        if not checklist:
            return None
        
        for key, value in checklist_data.dict(exclude_unset=True).items():
            setattr(checklist, key, value)
        
        checklist.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(checklist)
        return checklist
    
    async def get_plans_with_summary(self, start_date: date, end_date: date,
                                   plan_type: Optional[str] = None) -> List[dict]:
        """Get plans with staff and task summaries"""
        plans = await self.get_plans_by_date_range(start_date, end_date, plan_type)
        
        result = []
        for plan in plans:
            plan_dict = {
                'plan': plan,
                'staff_count': len(plan.staff),
                'task_count': len(plan.tasks),
                'completed_tasks': len([t for t in plan.tasks if t.status == 'Erledigt']),
                'checklist_progress': len([c for c in plan.checklist if c.is_completed]) / max(len(plan.checklist), 1)
            }
            result.append(plan_dict)
        
        return result
    
    async def duplicate_plan(self, source_plan_id: str, new_date: date, 
                           created_by: str) -> Optional[MorningPlan]:
        """Duplicate a morning plan for a new date"""
        source_plan = await self.get_plan(source_plan_id)
        if not source_plan:
            return None
        
        # Create new plan
        new_plan_data = MorningPlanCreate(
            plan_date=new_date,
            plan_type=source_plan.plan_type,
            project_id=source_plan.project_id,
            title=f"{source_plan.title} (Kopie)",
            description=source_plan.description,
            status="Entwurf",
            planned_start_time=source_plan.planned_start_time,
            planned_end_time=source_plan.planned_end_time,
            start_location=source_plan.start_location,
            end_location=source_plan.end_location,
            vehicle_assignment=source_plan.vehicle_assignment
        )
        
        new_plan = await self.create_plan(new_plan_data, created_by)
        
        # Duplicate staff
        for staff in source_plan.staff:
            staff_data = MorningPlanStaffCreate(
                employee_id=staff.employee_id,
                role=staff.role,
                individual_start_time=staff.individual_start_time,
                sort_order=staff.sort_order,
                is_present=staff.is_present
            )
            await self.add_staff_to_plan(new_plan.plan_id, staff_data)
        
        # Duplicate tasks
        for task in source_plan.tasks:
            task_data = MorningPlanTaskCreate(
                task_name=task.task_name,
                task_description=task.task_description,
                task_category=task.task_category,
                estimated_duration=task.estimated_duration,
                planned_start=task.planned_start,
                planned_end=task.planned_end,
                status="Geplant",
                priority=task.priority,
                assigned_staff_id=task.assigned_staff_id,
                notes=task.notes
            )
            await self.add_task_to_plan(new_plan.plan_id, task_data)
        
        # Duplicate checklist
        for checklist in source_plan.checklist:
            checklist_data = MorningPlanChecklistCreate(
                item_name=checklist.item_name,
                item_description=checklist.item_description,
                category=checklist.category,
                is_completed=False
            )
            await self.add_checklist_item(new_plan.plan_id, checklist_data)
        
        return new_plan
