"""
Business logic for employees module
"""
import uuid
from typing import List, Optional, Tuple
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Employee
from .schemas import EmployeeCreate, EmployeeUpdate


class EmployeeService:
    """Service layer for employee operations"""
    
    @staticmethod
    async def create_employee(db: AsyncSession, employee_data: EmployeeCreate) -> Employee:
        """Create a new employee"""
        employee = Employee(
            employee_id=str(uuid.uuid4()),
            **employee_data.model_dump()
        )
        
        db.add(employee)
        await db.commit()
        await db.refresh(employee)
        return employee
    
    @staticmethod
    async def get_employee(db: AsyncSession, employee_id: str) -> Optional[Employee]:
        """Get an employee by ID"""
        result = await db.execute(
            select(Employee).where(Employee.employee_id == employee_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_employees(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        active_only: bool = True
    ) -> Tuple[List[Employee], int]:
        """Get employees with pagination"""
        
        # Build count query
        count_query = select(func.count(Employee.employee_id))
        # Note: Employee model from users doesn't have is_active field
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Build main query
        query = select(Employee)
        
        query = query.order_by(Employee.last_name, Employee.first_name).offset(skip).limit(limit)
        
        result = await db.execute(query)
        employees = result.scalars().all()
        
        return list(employees), total
    
    @staticmethod
    async def update_employee(
        db: AsyncSession, 
        employee_id: str, 
        update_data: EmployeeUpdate
    ) -> Optional[Employee]:
        """Update an employee"""
        employee = await EmployeeService.get_employee(db, employee_id)
        if not employee:
            return None
        
        # Update only provided fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(employee, field, value)
        
        await db.commit()
        await db.refresh(employee)
        return employee
    
    @staticmethod
    async def delete_employee(db: AsyncSession, employee_id: str) -> bool:
        """Delete an employee (soft delete by setting is_active=False)"""
        employee = await EmployeeService.get_employee(db, employee_id)
        if not employee:
            return False
        
        employee.is_active = False
        await db.commit()
        return True
    
    @staticmethod
    async def search_employees(
        db: AsyncSession,
        query: str,
        limit: int = 20
    ) -> List[Employee]:
        """Search employees by name"""
        search_term = f"%{query}%"
        
        result = await db.execute(
            select(Employee)
            .where(
                and_(
                    Employee.is_active == True,
                    func.lower(Employee.name).ilike(func.lower(search_term))
                )
            )
            .order_by(Employee.name)
            .limit(limit)
        )
        
        return list(result.scalars().all())
