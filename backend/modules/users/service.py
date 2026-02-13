"""
Business logic for Users & Employees module (Draftbit architecture)
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional, Dict, Any
import uuid

from backend.modules.users.models import User, Employee, AnalyticsEvent, Feedback, WorkerRating
from backend.modules.users.schemas import (
    UserCreate, UserUpdate, EmployeeCreate, EmployeeUpdate,
    AnalyticsEventCreate, FeedbackCreate, FeedbackUpdate, WorkerRatingCreate
)


class UserService:
    """Service layer for user operations"""
    
    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
        """Create a new user"""
        user = User(**user_data.dict())
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100, 
                       is_active: Optional[bool] = None, 
                       role: Optional[str] = None,
                       user_type: Optional[str] = None) -> List[User]:
        """Get all users with optional filters"""
        query = select(User).offset(skip).limit(limit)
        
        filters = []
        if is_active is not None:
            filters.append(User.is_active == is_active)
        if role:
            filters.append(User.role == role)
        if user_type:
            filters.append(User.user_type == user_type)
        
        if filters:
            query = query.where(and_(*filters))
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_user(db: AsyncSession, user_id: str) -> Optional[User]:
        """Get user by ID"""
        result = await db.execute(
            select(User).where(User.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email"""
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_user(db: AsyncSession, user_id: str, user_data: UserUpdate) -> Optional[User]:
        """Update user"""
        user = await UserService.get_user(db, user_id)
        if not user:
            return None
        
        for field, value in user_data.dict(exclude_unset=True).items():
            setattr(user, field, value)
        
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def delete_user(db: AsyncSession, user_id: str) -> bool:
        """Delete user"""
        user = await UserService.get_user(db, user_id)
        if not user:
            return False
        
        await db.delete(user)
        await db.commit()
        return True


class EmployeeService:
    """Service layer for employee operations"""
    
    @staticmethod
    async def create_employee(db: AsyncSession, employee_data: EmployeeCreate) -> Employee:
        """Create a new employee"""
        employee = Employee(**employee_data.dict())
        db.add(employee)
        await db.commit()
        await db.refresh(employee)
        return employee
    
    @staticmethod
    async def get_employees(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Employee]:
        """Get all employees"""
        result = await db.execute(
            select(Employee).offset(skip).limit(limit)
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_employee(db: AsyncSession, employee_id: str) -> Optional[Employee]:
        """Get employee by ID"""
        result = await db.execute(
            select(Employee).where(Employee.employee_id == employee_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_employee_by_email(db: AsyncSession, email: str) -> Optional[Employee]:
        """Get employee by email"""
        result = await db.execute(
            select(Employee).where(Employee.email == email)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_employee_by_number(db: AsyncSession, employee_number: str) -> Optional[Employee]:
        """Get employee by employee number"""
        result = await db.execute(
            select(Employee).where(Employee.employee_number == employee_number)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_employee(db: AsyncSession, employee_id: str, employee_data: EmployeeUpdate) -> Optional[Employee]:
        """Update employee"""
        employee = await EmployeeService.get_employee(db, employee_id)
        if not employee:
            return None
        
        for field, value in employee_data.dict(exclude_unset=True).items():
            setattr(employee, field, value)
        
        await db.commit()
        await db.refresh(employee)
        return employee
    
    @staticmethod
    async def delete_employee(db: AsyncSession, employee_id: str) -> bool:
        """Delete employee"""
        employee = await EmployeeService.get_employee(db, employee_id)
        if not employee:
            return False
        
        await db.delete(employee)
        await db.commit()
        return True


class AnalyticsService:
    """Service layer for analytics operations"""
    
    @staticmethod
    async def create_event(db: AsyncSession, event_data: AnalyticsEventCreate) -> AnalyticsEvent:
        """Create analytics event"""
        event = AnalyticsEvent(**event_data.dict())
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event
    
    @staticmethod
    async def get_events(db: AsyncSession, skip: int = 0, limit: int = 100,
                        level: Optional[str] = None,
                        category: Optional[str] = None,
                        user_id: Optional[str] = None) -> List[AnalyticsEvent]:
        """Get analytics events with optional filters"""
        query = select(AnalyticsEvent).offset(skip).limit(limit)
        
        filters = []
        if level:
            filters.append(AnalyticsEvent.level == level)
        if category:
            filters.append(AnalyticsEvent.category == category)
        if user_id:
            filters.append(AnalyticsEvent.user_id == user_id)
        
        if filters:
            query = query.where(and_(*filters))
        
        query = query.order_by(AnalyticsEvent.timestamp.desc())
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_event(db: AsyncSession, event_id: str) -> Optional[AnalyticsEvent]:
        """Get analytics event by ID"""
        result = await db.execute(
            select(AnalyticsEvent).where(AnalyticsEvent.event_id == event_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def cleanup_old_events(db: AsyncSession, days_to_keep: int = 30) -> int:
        """Clean up old debug/info events"""
        from sqlalchemy import text
        
        result = await db.execute(
            text("SELECT public.cleanup_old_analytics(:days)"),
            {"days": days_to_keep}
        )
        return result.scalar()


class FeedbackService:
    """Service layer for feedback operations"""
    
    @staticmethod
    async def create_feedback(db: AsyncSession, feedback_data: FeedbackCreate) -> Feedback:
        """Create feedback"""
        feedback = Feedback(**feedback_data.dict())
        db.add(feedback)
        await db.commit()
        await db.refresh(feedback)
        return feedback
    
    @staticmethod
    async def get_feedback(db: AsyncSession, skip: int = 0, limit: int = 100,
                          status: Optional[str] = None,
                          priority: Optional[str] = None,
                          assigned_to: Optional[str] = None) -> List[Feedback]:
        """Get feedback with optional filters"""
        query = select(Feedback).offset(skip).limit(limit)
        
        filters = []
        if status:
            filters.append(Feedback.status == status)
        if priority:
            filters.append(Feedback.priority == priority)
        if assigned_to:
            filters.append(Feedback.assigned_to == assigned_to)
        
        if filters:
            query = query.where(and_(*filters))
        
        # Order by priority and date
        query = query.order_by(
            Feedback.created_at.desc()
        )
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_feedback_item(db: AsyncSession, feedback_id: str) -> Optional[Feedback]:
        """Get feedback item by ID"""
        result = await db.execute(
            select(Feedback).where(Feedback.feedback_id == feedback_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_feedback(db: AsyncSession, feedback_id: str, feedback_data: FeedbackUpdate) -> Optional[Feedback]:
        """Update feedback"""
        feedback = await FeedbackService.get_feedback_item(db, feedback_id)
        if not feedback:
            return None
        
        update_data = feedback_data.dict(exclude_unset=True)
        
        # Set resolved_at if status changes to resolved
        if 'status' in update_data and update_data['status'] == 'resolved':
            from datetime import datetime
            update_data['resolved_at'] = datetime.utcnow()
        
        for field, value in update_data.items():
            setattr(feedback, field, value)
        
        await db.commit()
        await db.refresh(feedback)
        return feedback
    
    @staticmethod
    async def delete_feedback(db: AsyncSession, feedback_id: str) -> bool:
        """Delete feedback"""
        feedback = await FeedbackService.get_feedback_item(db, feedback_id)
        if not feedback:
            return False
        
        await db.delete(feedback)
        await db.commit()
        return True


class WorkerRatingService:
    """Service layer for worker rating operations"""
    
    @staticmethod
    async def create_rating(db: AsyncSession, rating_data: WorkerRatingCreate) -> WorkerRating:
        """Create worker rating"""
        rating = WorkerRating(**rating_data.dict())
        db.add(rating)
        await db.commit()
        await db.refresh(rating)
        return rating
    
    @staticmethod
    async def get_ratings(db: AsyncSession, skip: int = 0, limit: int = 100,
                         project_id: Optional[str] = None,
                         employee_id: Optional[str] = None) -> List[WorkerRating]:
        """Get worker ratings with optional filters"""
        query = select(WorkerRating).offset(skip).limit(limit)
        
        filters = []
        if project_id:
            filters.append(WorkerRating.project_id == project_id)
        if employee_id:
            filters.append(WorkerRating.employee_id == employee_id)
        
        if filters:
            query = query.where(and_(*filters))
        
        query = query.order_by(WorkerRating.datum.desc())
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_rating(db: AsyncSession, rating_id: str) -> Optional[WorkerRating]:
        """Get worker rating by ID"""
        result = await db.execute(
            select(WorkerRating).where(WorkerRating.rating_id == rating_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_average_rating(db: AsyncSession, employee_id: str) -> float:
        """Get average rating for an employee"""
        from sqlalchemy import func
        
        result = await db.execute(
            select(func.avg(WorkerRating.rating))
            .where(WorkerRating.employee_id == employee_id)
        )
        avg_rating = result.scalar()
        return float(avg_rating) if avg_rating else 0.0
