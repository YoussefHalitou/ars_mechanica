"""
Pytest configuration and fixtures for LIS White-Label System tests.
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from backend.core.database import Base


# Test database URL (in-memory SQLite for tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=StaticPool,
        echo=False
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    await engine.dispose()


@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session_maker() as session:
        yield session
        await session.rollback()


@pytest.fixture
def sample_service_data() -> dict:
    """Sample service data for tests."""
    return {
        "name": "Test Service",
        "description": "A test service",
        "unit": "hour",
        "category": "Test",
        "price_per_unit": 50.0,
        "is_active": True
    }


@pytest.fixture
def sample_project_data() -> dict:
    """Sample project data for tests."""
    return {
        "name": "Test Project",
        "customer_name": "Test Customer",
        "status": "planned",
        "address": "123 Test Street"
    }


@pytest.fixture
def sample_user_data() -> dict:
    """Sample user data for tests."""
    return {
        "email": "test@example.com",
        "role": "Admin",
        "user_type": "office",
        "is_active": True
    }
