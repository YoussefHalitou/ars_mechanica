"""
Demo data seeder for Users & Employees module (Draftbit architecture)
"""
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.users.models import User, Employee
from backend.modules.users.schemas import UserCreate, EmployeeCreate
from backend.modules.users.service import UserService, EmployeeService


async def seed_demo_users_and_employees(db: AsyncSession, tenant_id: str):
    """
    Seed demo users and employees for Draftbit architecture
    """
    print(f"Seeding users and employees for tenant {tenant_id}")
    
    # Create demo office users
    office_users = [
        {
            "email": "admin@demo.com",
            "role": "Admin",
            "user_type": "office",
            "is_active": True
        },
        {
            "email": "secretary@demo.com",
            "role": "Secretary",
            "user_type": "office",
            "is_active": True
        },
        {
            "email": "planner@demo.com",
            "role": "Planner",
            "user_type": "office",
            "is_active": True
        }
    ]
    
    created_users = []
    for user_data in office_users:
        try:
            existing = await UserService.get_user_by_email(db, user_data["email"])
            if not existing:
                user_create = UserCreate(**user_data)
                user = await UserService.create_user(db, user_create)
                created_users.append(user)
                print(f"Created user: {user.email}")
            else:
                created_users.append(existing)
        except Exception as e:
            print(f"Error creating user {user_data['email']}: {e}")
    
    # Create demo field users and employees
    field_workers = [
        {
            "user_email": "supervisor@demo.com",
            "user_role": "Supervisor",
            "employee_email": "supervisor@demo.com",
            "first_name": "Max",
            "last_name": "Mustermann",
            "position": "Teamleiter",
            "department": "Feld",
            "employee_number": "E001"
        },
        {
            "user_email": "worker1@demo.com",
            "user_role": "Worker",
            "employee_email": "worker1@demo.com",
            "first_name": "John",
            "last_name": "Doe",
            "position": "Fahrer",
            "department": "Feld",
            "employee_number": "E002"
        },
        {
            "user_email": "worker2@demo.com",
            "user_role": "Worker",
            "employee_email": "worker2@demo.com",
            "first_name": "Anna",
            "last_name": "Schmidt",
            "position": "Helfer",
            "department": "Feld",
            "employee_number": "E003"
        },
        {
            "user_email": "worker3@demo.com",
            "user_role": "Worker",
            "employee_email": "worker3@demo.com",
            "first_name": "Peter",
            "last_name": "Müller",
            "position": "Helfer",
            "department": "Feld",
            "employee_number": "E004"
        }
    ]
    
    for worker_data in field_workers:
        try:
            # Create user
            existing_user = await UserService.get_user_by_email(db, worker_data["user_email"])
            if not existing_user:
                user_create = UserCreate(
                    email=worker_data["user_email"],
                    role=worker_data["user_role"],
                    user_type="field",
                    is_active=True
                )
                user = await UserService.create_user(db, user_create)
                print(f"Created user: {user.email}")
            else:
                user = existing_user
            
            # Create employee
            existing_employee = await EmployeeService.get_employee_by_email(db, worker_data["employee_email"])
            if not existing_employee:
                employee_create = EmployeeCreate(
                    user_id=str(user.user_id),
                    email=worker_data["employee_email"],
                    first_name=worker_data["first_name"],
                    last_name=worker_data["last_name"],
                    position=worker_data["position"],
                    department=worker_data["department"],
                    employee_number=worker_data["employee_number"]
                )
                employee = await EmployeeService.create_employee(db, employee_create)
                print(f"Created employee: {employee.first_name} {employee.last_name}")
        except Exception as e:
            print(f"Error creating worker {worker_data['user_email']}: {e}")
    
    print("✅ Users and employees seeding completed")
