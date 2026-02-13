"""
Supabase database configuration with PostgreSQL connection pooling and caching
"""
import os
from typing import AsyncGenerator, Optional
from sqlalchemy import create_engine, event, select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool
from sqlalchemy.engine import Engine
import redis.asyncio as redis
from functools import lru_cache
import time
import asyncio

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Extract database connection from Supabase URL
# Supabase URL format: postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
if SUPABASE_URL:
    # Convert to asyncpg format
    DATABASE_URL = SUPABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
else:
    # Fallback to local PostgreSQL
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/lis_dev"
    )

# Redis configuration for caching (Supabase Redis or external)
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

# Check if we should apply PostgreSQL optimizations (requires superuser privileges)
APPLY_PG_OPTIMIZATIONS = os.getenv("APPLY_PG_OPTIMIZATIONS", "false").lower() == "true"

# Engine configuration with Supabase optimizations
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    poolclass=AsyncAdaptedQueuePool,
    pool_size=10,  # Reduced for Supabase free tier
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={
        "server_settings": {
            "jit": "off",  # Disable JIT for better performance
            "application_name": "LIS_API_Supabase",
        }
    }
)

# Session factory with enhanced configuration
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

# Base class for all models
Base = declarative_base()

# Redis client for caching
redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client with connection pooling. Returns None if Redis unavailable."""
    global redis_client
    if redis_client is None:
        if not REDIS_URL:
            print("⚠️  No REDIS_URL configured. Caching disabled.")
            return None
        try:
            redis_client = redis.from_url(
                REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=20,
                socket_connect_timeout=3,
                socket_timeout=3,
            )
            # Test connection with timeout
            await redis_client.ping()
        except Exception as e:
            print(f"⚠️  Redis connection failed: {e}. Caching disabled.")
            redis_client = None
    return redis_client


@lru_cache(maxsize=128)
def get_cache_key(prefix: str, *args) -> str:
    """Generate cache key from prefix and arguments"""
    return f"{prefix}:{':'.join(str(arg) for arg in args)}"


async def cache_get(key: str, default=None):
    """Get value from cache with automatic deserialization"""
    try:
        client = await get_redis_client()
        if client is None:
            return default
        value = await client.get(key)
        return value if value is not None else default
    except Exception:
        return default


async def cache_set(key: str, value, expire: int = 3600) -> None:
    """Set value in cache with TTL"""
    try:
        client = await get_redis_client()
        if client is not None:
            await client.set(key, value, ex=expire)
    except Exception:
        pass


async def cache_delete(key: str) -> None:
    """Delete key from cache"""
    try:
        client = await get_redis_client()
        if client is not None:
            await client.delete(key)
    except Exception:
        pass


async def cache_delete_pattern(pattern: str) -> None:
    """Delete keys matching pattern from cache"""
    try:
        client = await get_redis_client()
        if client is not None:
            keys = await client.keys(pattern)
            if keys:
                await client.delete(*keys)
    except Exception:
        pass


class DatabaseMetrics:
    """Database performance metrics collector"""
    
    def __init__(self) -> None:
        self.query_count = 0
        self.query_time = 0.0
        self.cache_hits = 0
        self.cache_misses = 0
    
    def record_query(self, duration: float) -> None:
        """Record query execution time"""
        self.query_count += 1
        self.query_time += duration
    
    def record_cache_hit(self) -> None:
        """Record cache hit"""
        self.cache_hits += 1
    
    def record_cache_miss(self) -> None:
        """Record cache miss"""
        self.cache_misses += 1
    
    def get_stats(self) -> dict:
        """Get performance statistics"""
        avg_query_time = self.query_time / self.query_count if self.query_count > 0 else 0
        cache_hit_rate = (self.cache_hits / (self.cache_hits + self.cache_misses) * 100) if (self.cache_hits + self.cache_misses) > 0 else 0
        
        return {
            "query_count": self.query_count,
            "total_query_time": round(self.query_time, 3),
            "avg_query_time": round(avg_query_time, 3),
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "cache_hit_rate": round(cache_hit_rate, 2)
        }


# Global metrics collector
metrics = DatabaseMetrics()


def with_metrics(func):
    """Decorator to measure function execution time"""
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            metrics.record_query(time.time() - start_time)
            return result
        except Exception as e:
            metrics.record_query(time.time() - start_time)
            raise e
    return wrapper


class CachableQuery:
    """Query builder with automatic caching support"""
    
    def __init__(self, model, expiration: int = 3600) -> None:
        self.model = model
        self.expiration = expiration
    
    async def get_by_id(self, id_value, db: AsyncSession):
        """Get by ID with caching"""
        cache_key = get_cache_key(self.model.__tablename__, "id", id_value)
        
        # Try cache first
        cached = await cache_get(cache_key)
        if cached:
            metrics.record_cache_hit()
            return cached
        
        metrics.record_cache_miss()
        
        # Query database
        result = await db.get(self.model, id_value)
        if result:
            await cache_set(cache_key, result, self.expiration)
        
        return result
    
    async def get_all(self, db: AsyncSession, filters=None, order_by=None, limit=None, offset=None):
        """Get all records with caching"""
        cache_key = get_cache_key(
            self.model.__tablename__, "all",
            str(filters), str(order_by), str(limit), str(offset)
        )
        
        # Try cache first
        cached = await cache_get(cache_key)
        if cached:
            metrics.record_cache_hit()
            return cached
        
        metrics.record_cache_miss()
        
        # Build query
        query = select(self.model)
        
        if filters:
            query = query.where(*filters)
        
        if order_by:
            query = query.order_by(order_by)
        
        if limit:
            query = query.limit(limit)
        
        if offset:
            query = query.offset(offset)
        
        result = await db.execute(query)
        items = result.scalars().all()
        
        # Cache results
        await cache_set(cache_key, items, self.expiration)
        
        return items
    
    async def invalidate_cache(self, id_value=None) -> None:
        """Invalidate cache for this model"""
        if id_value:
            cache_key = get_cache_key(self.model.__tablename__, "id", id_value)
            await cache_delete(cache_key)
        else:
            pattern = f"{self.model.__tablename__}:*"
            await cache_delete_pattern(pattern)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session with automatic cleanup"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database with optional Supabase optimizations"""
    try:
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        # Initialize Redis connection (non-blocking)
        await get_redis_client()
        
        # Apply PostgreSQL optimizations only if enabled and user has privileges
        if APPLY_PG_OPTIMIZATIONS:
            try:
                async with engine.connect() as conn:
                    # These settings require superuser privileges
                    # Only apply them if APPLY_PG_OPTIMIZATIONS is explicitly set
                    await conn.execute(text("SET synchronous_commit = on;"))
                    await conn.execute(text("SET checkpoint_completion_target = 0.9;"))
                    # Note: wal_buffers and shared_buffers require server restart
                    # and cannot be set per-session
                print("✅ PostgreSQL optimizations applied")
            except Exception as e:
                print(f"⚠️  Could not apply PostgreSQL optimizations: {e}")
                # Continue without optimizations - not fatal
        
        # Extract host info safely for logging
        db_host = "local"
        if '@' in DATABASE_URL and '/' in DATABASE_URL:
            try:
                db_host = DATABASE_URL.split('@')[1].split('/')[0]
            except IndexError:
                pass
        
        print("✅ Database initialized successfully with Supabase configuration")
        print(f"📊 Connected to: {db_host}")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise


async def close_db() -> None:
    """Cleanup database connections"""
    await engine.dispose()
    if redis_client:
        await redis_client.close()


# Export for use in modules
__all__ = [
    "Base",
    "get_db",
    "init_db",
    "close_db",
    "cache_get",
    "cache_set",
    "cache_delete",
    "cache_delete_pattern",
    "CachableQuery",
    "metrics",
    "SUPABASE_URL"
]
