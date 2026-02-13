"""
Business logic for time pairs module
Handles generation of time pairs from morning plan data
"""
import uuid
from typing import List, Optional, Tuple
from datetime import datetime, date, time
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import TimePair
from backend.modules.users.models import Employee
from backend.modules.projects.models import Project
from backend.modules.morningplan.models import MorningPlan as Morningplan, MorningPlanStaff as MorningplanStaff


class TimePairService:
    """Service layer for time pair operations"""
    
    @staticmethod
    async def create_time_pair(db: AsyncSession, time_pair_data: dict) -> TimePair:
        """Create a new time pair"""
        time_pair = TimePair(
            pair_id=str(uuid.uuid4()),
            **time_pair_data
        )
        
        # Calculate hours
        time_pair.calculate_hours()
        
        db.add(time_pair)
        await db.commit()
        await db.refresh(time_pair)
        return time_pair
    
    @staticmethod
    async def get_time_pair(db: AsyncSession, pair_id: str) -> Optional[TimePair]:
        """Get a time pair by pair_id"""
        result = await db.execute(
            select(TimePair)
            .options(selectinload(TimePair.employee))
            .where(TimePair.pair_id == pair_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_time_pairs(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        date_filter: Optional[date] = None,
        employee_id: Optional[str] = None,
        project_id: Optional[str] = None
    ) -> Tuple[List[TimePair], int]:
        """Get time pairs with pagination and filtering"""
        
        # Build count query
        count_query = select(func.count(TimePair.id))
        
        # Build main query with employee data
        query = select(TimePair).options(selectinload(TimePair.employee))
        
        # Apply filters
        if date_filter:
            count_query = count_query.where(TimePair.datum == date_filter)
            query = query.where(TimePair.datum == date_filter)
        
        if employee_id:
            count_query = count_query.where(TimePair.employee_id == employee_id)
            query = query.where(TimePair.employee_id == employee_id)
        
        if project_id:
            count_query = count_query.where(TimePair.project_id == project_id)
            query = query.where(TimePair.project_id == project_id)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        query = query.order_by(TimePair.datum.desc(), TimePair.mitarbeiter).offset(skip).limit(limit)
        
        result = await db.execute(query)
        time_pairs = result.scalars().all()
        
        return list(time_pairs), total
    
    @staticmethod
    async def update_time_pair(
        db: AsyncSession, 
        pair_id: str, 
        update_data: dict
    ) -> Optional[TimePair]:
        """Update a time pair"""
        time_pair = await TimePairService.get_time_pair(db, pair_id)
        if not time_pair:
            return None
        
        # Update fields
        for field, value in update_data.items():
            setattr(time_pair, field, value)
        
        # Recalculate hours if times changed
        time_pair.calculate_hours()
        
        await db.commit()
        await db.refresh(time_pair)
        return time_pair
    
    @staticmethod
    async def delete_time_pair(db: AsyncSession, pair_id: str) -> bool:
        """Delete a time pair"""
        time_pair = await TimePairService.get_time_pair(db, pair_id)
        if not time_pair:
            return False
        
        await db.delete(time_pair)
        await db.commit()
        return True
    
    @staticmethod
    async def generate_from_morningplan(
        db: AsyncSession,
        plan_id: str,
        plan_date: date
    ) -> List[TimePair]:
        """
        Generate time pairs from morning plan data
        This matches the Retool transformer tr_time_pairs_with_staff_data
        """
        
        # Get the morning plan with staff assignments
        plan_result = await db.execute(
            select(Morningplan)
            .where(Morningplan.plan_id == plan_id)
        )
        plan = plan_result.scalar_one_or_none()
        
        if not plan:
            return []
        
        # Get staff assignments for this plan
        staff_result = await db.execute(
            select(MorningplanStaff)
            .where(MorningplanStaff.plan_id == plan_id)
            .order_by(MorningplanStaff.sort_order)
        )
        staff_assignments = staff_result.scalars().all()
        
        # Get employee details for each staff member
        time_pairs = []
        
        for staff in staff_assignments:
            if not staff.employee_id:
                continue
            
            # Get employee details
            employee_result = await db.execute(
                select(Employee)
                .where(Employee.employee_id == staff.employee_id)
            )
            employee = employee_result.scalar_one_or_none()
            
            if not employee:
                continue
            
            # Create time pair
            time_pair_data = {
                'project_id': plan.project_id,
                'datum': plan_date,
                'mitarbeiter': employee.name,
                'employee_id': employee.employee_id,
                'employee_name': employee.name,
                'employee_code': employee.employee_code,
                'plan_id': plan_id,
                'staff_id': str(staff.id),
                'notes': staff.member_notes
            }
            
            # Set individual start time if available
            if staff.individual_start_time:
                time_pair_data['lis_von'] = staff.individual_start_time
            elif plan.start_time:
                time_pair_data['lis_von'] = plan.start_time
            
            # Create and save time pair
            time_pair = await TimePairService.create_time_pair(db, time_pair_data)
            time_pairs.append(time_pair)
        
        return time_pairs
    
    @staticmethod
    async def get_time_pairs_with_staff_data(
        db: AsyncSession,
        date: Optional[date] = None,
        plan_id: Optional[str] = None
    ) -> List[dict]:
        """
        Get time pairs with extended staff data
        Matches the Retool transformer tr_time_pairs_with_staff_data format
        """
        
        # Build query
        query = select(TimePair).options(selectinload(TimePair.employee))
        
        if date:
            query = query.where(TimePair.datum == date)
        
        if plan_id:
            query = query.where(TimePair.plan_id == plan_id)
        
        query = query.order_by(TimePair.datum.desc(), TimePair.mitarbeiter)
        
        result = await db.execute(query)
        time_pairs = result.scalars().all()
        
        # Transform to match Retool format
        transformed = []
        for tp in time_pairs:
            # Get employee rate
            employee_rate = tp.employee.hourly_rate if tp.employee else 0
            
            # Calculate total cost (hours * rate)
            lis_hours = float(tp.ges_lis_h) if tp.ges_lis_h else 0
            total_cost = lis_hours * float(employee_rate) if employee_rate else 0
            
            # Build response matching Retool transformer
            item = {
                'id': tp.id,
                'pair_id': tp.pair_id,
                'project_id': tp.project_id,
                'datum': tp.datum.isoformat() if tp.datum else None,
                'mitarbeiter': tp.mitarbeiter,
                'employee_id': tp.employee_id,
                'employee_name': tp.employee_name,
                'employee_code': tp.employee_code,
                'lis_von': tp.lis_von.isoformat() if tp.lis_von else None,
                'lis_bis': tp.lis_bis.isoformat() if tp.lis_bis else None,
                'kunde_von': tp.kunde_von.isoformat() if tp.kunde_von else None,
                'kunde_bis': tp.kunde_bis.isoformat() if tp.kunde_bis else None,
                'pause_min': tp.pause_min,
                'ges_lis_h': float(tp.ges_lis_h) if tp.ges_lis_h else 0,
                'ges_kd_h': float(tp.ges_kd_h) if tp.ges_kd_h else 0,
                'ges_lis': tp.ges_lis,
                'ges_kd': tp.ges_kd,
                'notes': tp.notes,
                'staff_id': tp.staff_id,
                'abnahme_id': tp.abnahme_id,
                'plan_id': tp.plan_id,
                # Extended fields for Retool transformer
                'staff_data': tp.employee.to_dict() if tp.employee else None,
                'employee_rate': float(employee_rate) if employee_rate else 0,
                'total_cost': total_cost
            }
            transformed.append(item)
        
        return transformed
