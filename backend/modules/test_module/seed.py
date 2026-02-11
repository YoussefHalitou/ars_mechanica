"""
Demo data seeder for test_module module
"""
from sqlalchemy.ext.asyncio import AsyncSession


async def seed_demo_test_module(db: AsyncSession, tenant_id: str):
    """
    Seed demo data for test_module
    """
    print(f"Seeding test_module for tenant {tenant_id}")
