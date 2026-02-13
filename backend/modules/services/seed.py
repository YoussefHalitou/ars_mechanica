"""
Demo data seeder for services module
"""
import asyncio
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from .models import Service
from .schemas import ServiceCreate
from .service import ServiceService


async def seed_demo_services(db: AsyncSession, tenant_id: str):
    """
    Seed demo services for a new tenant
    """
    
    demo_services = [
        {
            "name": "Umzugstransport",
            "default_unit": "Stunde",
            "category": "Transport",
            "is_active": True
        },
        {
            "name": "Möbelmontage",
            "default_unit": "Stunde",
            "category": "Montage",
            "is_active": True
        },
        {
            "name": "Verpackungsservice",
            "default_unit": "Stunde",
            "category": "Service",
            "is_active": True
        },
        {
            "name": "Kartonagen",
            "default_unit": "Pauschal",
            "category": "Material",
            "is_active": True
        },
        {
            "name": "Fernumzug",
            "default_unit": "Pauschal",
            "category": "Transport",
            "is_active": True
        },
        {
            "name": "Lagerung",
            "default_unit": "m²",
            "category": "Lagerung",
            "is_active": True
        },
        {
            "name": "Seniorenumzug",
            "default_unit": "Stunde",
            "category": "Spezial",
            "is_active": True
        },
        {
            "name": "Pianotransport",
            "default_unit": "Pauschal",
            "category": "Spezial",
            "is_active": True
        },
        {
            "name": "Entsorgung",
            "default_unit": "Stunde",
            "category": "Entsorgung",
            "is_active": True
        },
        {
            "name": "Reinigung",
            "default_unit": "m²",
            "category": "Reinigung",
            "is_active": True
        },
        {
            "name": "Malerservice",
            "default_unit": "m²",
            "category": "Handwerk",
            "is_active": True
        },
        {
            "name": "Elektroinstallation",
            "default_unit": "Stunde",
            "category": "Handwerk",
            "is_active": True
        }
    ]
    
    # Check if services already exist
    existing_count = await db.scalar(
        select(func.count(Service.service_id))
    )
    
    if existing_count > 0:
        print(f"Services already exist for tenant {tenant_id}, skipping seed")
        return
    
    # Create services
    created_count = 0
    for service_data in demo_services:
        try:
            service_create = ServiceCreate(**service_data)
            await ServiceService.create_service(db, service_create)
            created_count += 1
        except Exception as e:
            print(f"Error creating service {service_data['name']}: {e}")
    
    print(f"Seeded {created_count} demo services for tenant {tenant_id}")


async def clear_all_services(db: AsyncSession):
    """
    Clear all services (for testing/reset)
    """
    await db.execute(delete(Service))
    await db.commit()
    print("Cleared all services")


# For direct script execution
if __name__ == "__main__":
    import os
    import sys
    from backend.core.database import AsyncSessionLocal
    
    # Add backend to path
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    
    async def main():
        tenant_id = os.getenv("TENANT", "demo")
        async with AsyncSessionLocal() as db:
            await seed_demo_services(db, tenant_id)
    
    asyncio.run(main())
