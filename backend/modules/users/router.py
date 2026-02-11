"""
FastAPI router for Users & Employees module (Draftbit architecture)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from backend.core.database import get_db
from backend.core.schemas import ResponseBase
from backend.modules.users.models import User, Employee, AnalyticsEvent, Feedback, WorkerRating
from backend.modules.users.schemas import (
    UserCreate, UserUpdate, UserResponse, UserWithEmployeeResponse,
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeWithUserResponse,
    AnalyticsEventCreate, AnalyticsEventResponse,
    FeedbackCreate, FeedbackUpdate, FeedbackResponse,
    WorkerRatingCreate, WorkerRatingResponse
)
from backend.modules.users.service import UserService, EmployeeService, AnalyticsService, FeedbackService, WorkerRatingService

router = APIRouter(prefix="/api/users", tags=["Users & Employees"])


# ========== USER ENDPOINTS ==========

@router.get("/", response_model=ResponseBase[List[UserResponse]])
async def list_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    role: Optional[str] = Query(None, description="Filter by role"),
    user_type: Optional[str] = Query(None, description="Filter by user type"),
    db: AsyncSession = Depends(get_db)
):
    """List all users with optional filters"""
    users = await UserService.get_users(db, skip=skip, limit=limit, is_active=is_active, role=role, user_type=user_type)
    return ResponseBase(success=True, data=[UserResponse.from_orm(user) for user in users])


@router.post("/", response_model=ResponseBase[UserResponse])
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new user"""
    try:
        user = await UserService.create_user(db, user_data)
        return ResponseBase(success=True, message="User created successfully", data=UserResponse.from_orm(user))
    except Exception as e:
        return ResponseBase(success=False, message=f"Error creating user: {str(e)}")


@router.get("/{user_id}", response_model=ResponseBase[UserWithEmployeeResponse])
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID with employee data"""
    user = await UserService.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    response = UserWithEmployeeResponse.from_orm(user)
    return ResponseBase(success=True, data=response)


@router.put("/{user_id}", response_model=ResponseBase[UserResponse])
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update user"""
    user = await UserService.update_user(db, user_id, user_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return ResponseBase(success=True, message="User updated successfully", data=UserResponse.from_orm(user))


@router.delete("/{user_id}", response_model=ResponseBase)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete user"""
    success = await UserService.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return ResponseBase(success=True, message="User deleted successfully")


@router.get("/email/{email}", response_model=ResponseBase[UserWithEmployeeResponse])
async def get_user_by_email(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """Get user by email"""
    user = await UserService.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return ResponseBase(success=True, data=UserWithEmployeeResponse.from_orm(user))


# ========== EMPLOYEE ENDPOINTS ==========

@router.get("/employees/", response_model=ResponseBase[List[EmployeeWithUserResponse]])
async def list_employees(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    db: AsyncSession = Depends(get_db)
):
    """List all employees with user data"""
    employees = await EmployeeService.get_employees(db, skip=skip, limit=limit)
    return ResponseBase(success=True, data=[EmployeeWithUserResponse.from_orm(emp) for emp in employees])


@router.post("/employees/", response_model=ResponseBase[EmployeeResponse])
async def create_employee(
    employee_data: EmployeeCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new employee"""
    try:
        employee = await EmployeeService.create_employee(db, employee_data)
        return ResponseBase(success=True, message="Employee created successfully", data=EmployeeResponse.from_orm(employee))
    except Exception as e:
        return ResponseBase(success=False, message=f"Error creating employee: {str(e)}")


@router.get("/employees/{employee_id}", response_model=ResponseBase[EmployeeWithUserResponse])
async def get_employee(
    employee_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get employee by ID with user data"""
    employee = await EmployeeService.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return ResponseBase(success=True, data=EmployeeWithUserResponse.from_orm(employee))


@router.put("/employees/{employee_id}", response_model=ResponseBase[EmployeeResponse])
async def update_employee(
    employee_id: str,
    employee_data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update employee"""
    employee = await EmployeeService.update_employee(db, employee_id, employee_data)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return ResponseBase(success=True, message="Employee updated successfully", data=EmployeeResponse.from_orm(employee))


@router.delete("/employees/{employee_id}", response_model=ResponseBase)
async def delete_employee(
    employee_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete employee"""
    success = await EmployeeService.delete_employee(db, employee_id)
    if not success:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return ResponseBase(success=True, message="Employee deleted successfully")


@router.get("/employees/email/{email}", response_model=ResponseBase[EmployeeWithUserResponse])
async def get_employee_by_email(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """Get employee by email"""
    employee = await EmployeeService.get_employee_by_email(db, email)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return ResponseBase(success=True, data=EmployeeWithUserResponse.from_orm(employee))


@router.get("/employees/number/{employee_number}", response_model=ResponseBase[EmployeeWithUserResponse])
async def get_employee_by_number(
    employee_number: str,
    db: AsyncSession = Depends(get_db)
):
    """Get employee by employee number"""
    employee = await EmployeeService.get_employee_by_number(db, employee_number)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return ResponseBase(success=True, data=EmployeeWithUserResponse.from_orm(employee))


# ========== ANALYTICS ENDPOINTS ==========

@router.post("/analytics/events", response_model=ResponseBase[AnalyticsEventResponse])
async def create_analytics_event(
    event_data: AnalyticsEventCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create analytics event"""
    try:
        event = await AnalyticsService.create_event(db, event_data)
        return ResponseBase(success=True, message="Analytics event created", data=AnalyticsEventResponse.from_orm(event))
    except Exception as e:
        return ResponseBase(success=False, message=f"Error creating event: {str(e)}")


@router.get("/analytics/events", response_model=ResponseBase[List[AnalyticsEventResponse]])
async def list_analytics_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    level: Optional[str] = Query(None, description="Filter by level"),
    category: Optional[str] = Query(None, description="Filter by category"),
    user_id: Optional[str] = Query(None, description="Filter by user"),
    db: AsyncSession = Depends(get_db)
):
    """List analytics events"""
    events = await AnalyticsService.get_events(db, skip=skip, limit=limit, level=level, category=category, user_id=user_id)
    return ResponseBase(success=True, data=[AnalyticsEventResponse.from_orm(event) for event in events])


@router.get("/analytics/events/{event_id}", response_model=ResponseBase[AnalyticsEventResponse])
async def get_analytics_event(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get analytics event by ID"""
    event = await AnalyticsService.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return ResponseBase(success=True, data=AnalyticsEventResponse.from_orm(event))


@router.post("/analytics/cleanup", response_model=ResponseBase[int])
async def cleanup_old_analytics(
    days_to_keep: int = Query(30, ge=1, description="Days to keep"),
    db: AsyncSession = Depends(get_db)
):
    """Clean up old analytics events"""
    count = await AnalyticsService.cleanup_old_events(db, days_to_keep)
    return ResponseBase(success=True, message=f"Cleaned up {count} old events", data=count)


# ========== FEEDBACK ENDPOINTS ==========

@router.post("/feedback", response_model=ResponseBase[FeedbackResponse])
async def create_feedback(
    feedback_data: FeedbackCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create feedback"""
    try:
        feedback = await FeedbackService.create_feedback(db, feedback_data)
        return ResponseBase(success=True, message="Feedback submitted successfully", data=FeedbackResponse.from_orm(feedback))
    except Exception as e:
        return ResponseBase(success=False, message=f"Error submitting feedback: {str(e)}")


@router.get("/feedback", response_model=ResponseBase[List[FeedbackResponse]])
async def list_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned user"),
    db: AsyncSession = Depends(get_db)
):
    """List feedback items"""
    feedback_items = await FeedbackService.get_feedback(db, skip=skip, limit=limit, status=status, priority=priority, assigned_to=assigned_to)
    return ResponseBase(success=True, data=[FeedbackResponse.from_orm(fb) for fb in feedback_items])


@router.get("/feedback/{feedback_id}", response_model=ResponseBase[FeedbackResponse])
async def get_feedback(
    feedback_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get feedback by ID"""
    feedback = await FeedbackService.get_feedback_item(db, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return ResponseBase(success=True, data=FeedbackResponse.from_orm(feedback))


@router.put("/feedback/{feedback_id}", response_model=ResponseBase[FeedbackResponse])
async def update_feedback(
    feedback_id: str,
    feedback_data: FeedbackUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update feedback"""
    feedback = await FeedbackService.update_feedback(db, feedback_id, feedback_data)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return ResponseBase(success=True, message="Feedback updated", data=FeedbackResponse.from_orm(feedback))


@router.delete("/feedback/{feedback_id}", response_model=ResponseBase)
async def delete_feedback(
    feedback_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete feedback"""
    success = await FeedbackService.delete_feedback(db, feedback_id)
    if not success:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return ResponseBase(success=True, message="Feedback deleted")


# ========== WORKER RATING ENDPOINTS ==========

@router.post("/ratings", response_model=ResponseBase[WorkerRatingResponse])
async def create_worker_rating(
    rating_data: WorkerRatingCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create worker rating"""
    try:
        rating = await WorkerRatingService.create_rating(db, rating_data)
        return ResponseBase(success=True, message="Rating created", data=WorkerRatingResponse.from_orm(rating))
    except Exception as e:
        return ResponseBase(success=False, message=f"Error creating rating: {str(e)}")


@router.get("/ratings", response_model=ResponseBase[List[WorkerRatingResponse]])
async def list_worker_ratings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    project_id: Optional[str] = Query(None, description="Filter by project"),
    employee_id: Optional[str] = Query(None, description="Filter by employee"),
    db: AsyncSession = Depends(get_db)
):
    """List worker ratings"""
    ratings = await WorkerRatingService.get_ratings(db, skip=skip, limit=limit, project_id=project_id, employee_id=employee_id)
    return ResponseBase(success=True, data=[WorkerRatingResponse.from_orm(rating) for rating in ratings])


@router.get("/ratings/employee/{employee_id}/average", response_model=ResponseBase[float])
async def get_average_rating(
    employee_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get average rating for an employee"""
    avg_rating = await WorkerRatingService.get_average_rating(db, employee_id)
    return ResponseBase(success=True, data=avg_rating)
