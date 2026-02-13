"""
Base service class with common CRUD operations and pagination logic.
Provides reusable methods for all module services.
"""
from typing import TypeVar, Generic, List, Optional, Tuple, Type, Any, Dict
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import uuid

from backend.core.database import Base


# Generic type variables for model and schema types
ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Base service class with common CRUD operations.
    
    Provides:
    - get_by_id: Get a single record by ID
    - get_all: Get all records with pagination
    - create: Create a new record
    - update: Update an existing record
    - delete: Delete a record (soft or hard delete)
    - search: Search records with parameterized queries
    - count: Count records with optional filters
    """
    
    def __init__(self, model: Type[ModelType], id_field: str = "id") -> None:
        """
        Initialize the base service.
        
        Args:
            model: The SQLAlchemy model class
            id_field: The name of the primary key field (default: "id")
        """
        self.model = model
        self.id_field = id_field
    
    def _get_id_column(self):
        """Get the ID column from the model"""
        return getattr(self.model, self.id_field)
    
    async def get_by_id(
        self, 
        db: AsyncSession, 
        record_id: Any
    ) -> Optional[ModelType]:
        """
        Get a single record by ID.
        
        Args:
            db: Database session
            record_id: The ID of the record to retrieve
            
        Returns:
            The record if found, None otherwise
        """
        id_column = self._get_id_column()
        result = await db.execute(
            select(self.model).where(id_column == record_id)
        )
        return result.scalar_one_or_none()
    
    async def get_all(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[List] = None,
        order_by: Optional[Any] = None
    ) -> Tuple[List[ModelType], int]:
        """
        Get all records with pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            filters: Optional list of filter conditions
            order_by: Optional order by clause
            
        Returns:
            Tuple of (list of records, total count)
        """
        # Build count query
        count_query = select(func.count(self._get_id_column()))
        if filters:
            count_query = count_query.where(and_(*filters))
        
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Build main query
        query = select(self.model)
        if filters:
            query = query.where(and_(*filters))
        
        if order_by is not None:
            query = query.order_by(order_by)
        
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        records = result.scalars().all()
        
        return list(records), total
    
    async def create(
        self,
        db: AsyncSession,
        data: CreateSchemaType,
        **extra_fields: Any
    ) -> ModelType:
        """
        Create a new record.
        
        Args:
            db: Database session
            data: The data to create the record with
            **extra_fields: Additional fields to set on the record
            
        Returns:
            The created record
        """
        # Convert Pydantic model to dict
        data_dict = data.model_dump(exclude_unset=True) if hasattr(data, 'model_dump') else data.dict(exclude_unset=True)
        
        # Merge with extra fields
        data_dict.update(extra_fields)
        
        # Generate ID if not provided and field exists
        if self.id_field not in data_dict:
            data_dict[self.id_field] = str(uuid.uuid4())
        
        record = self.model(**data_dict)
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record
    
    async def update(
        self,
        db: AsyncSession,
        record_id: Any,
        data: UpdateSchemaType
    ) -> Optional[ModelType]:
        """
        Update an existing record.
        
        Args:
            db: Database session
            record_id: The ID of the record to update
            data: The data to update the record with
            
        Returns:
            The updated record if found, None otherwise
        """
        record = await self.get_by_id(db, record_id)
        if not record:
            return None
        
        # Convert Pydantic model to dict, excluding unset values
        update_data = data.model_dump(exclude_unset=True) if hasattr(data, 'model_dump') else data.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            if hasattr(record, key):
                setattr(record, key, value)
        
        await db.commit()
        await db.refresh(record)
        return record
    
    async def delete(
        self,
        db: AsyncSession,
        record_id: Any,
        soft_delete: bool = True,
        active_field: str = "is_active"
    ) -> bool:
        """
        Delete a record.
        
        Args:
            db: Database session
            record_id: The ID of the record to delete
            soft_delete: If True, set active field to False; if False, hard delete
            active_field: The name of the active/soft-delete field
            
        Returns:
            True if the record was deleted, False if not found
        """
        record = await self.get_by_id(db, record_id)
        if not record:
            return False
        
        if soft_delete and hasattr(record, active_field):
            setattr(record, active_field, False)
            await db.commit()
        else:
            await db.delete(record)
            await db.commit()
        
        return True
    
    async def search(
        self,
        db: AsyncSession,
        search_term: str,
        search_fields: List[str],
        limit: int = 20,
        filters: Optional[List] = None
    ) -> List[ModelType]:
        """
        Search records using parameterized queries (SQL injection safe).
        
        Args:
            db: Database session
            search_term: The term to search for
            search_fields: List of field names to search in
            limit: Maximum number of results
            filters: Optional additional filter conditions
            
        Returns:
            List of matching records
        """
        # Build search conditions using parameterized queries
        search_conditions = []
        search_pattern = f"%{search_term}%"
        
        for field_name in search_fields:
            if hasattr(self.model, field_name):
                field = getattr(self.model, field_name)
                search_conditions.append(field.ilike(search_pattern))
        
        if not search_conditions:
            return []
        
        # Build query
        query = select(self.model).where(or_(*search_conditions))
        
        if filters:
            query = query.where(and_(*filters))
        
        query = query.limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    async def count(
        self,
        db: AsyncSession,
        filters: Optional[List] = None
    ) -> int:
        """
        Count records with optional filters.
        
        Args:
            db: Database session
            filters: Optional list of filter conditions
            
        Returns:
            Count of matching records
        """
        count_query = select(func.count(self._get_id_column()))
        if filters:
            count_query = count_query.where(and_(*filters))
        
        result = await db.execute(count_query)
        return result.scalar() or 0
    
    async def exists(
        self,
        db: AsyncSession,
        record_id: Any
    ) -> bool:
        """
        Check if a record exists.
        
        Args:
            db: Database session
            record_id: The ID of the record to check
            
        Returns:
            True if the record exists, False otherwise
        """
        id_column = self._get_id_column()
        result = await db.execute(
            select(func.count(id_column)).where(id_column == record_id)
        )
        return (result.scalar() or 0) > 0


def calculate_pagination(total: int, page: int, per_page: int) -> Dict[str, Any]:
    """
    Calculate pagination metadata.
    
    Args:
        total: Total number of records
        page: Current page number (1-based)
        per_page: Number of records per page
        
    Returns:
        Dictionary with pagination metadata
    """
    total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
    
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }


# Export
__all__ = [
    "BaseService",
    "calculate_pagination",
    "ModelType",
    "CreateSchemaType",
    "UpdateSchemaType"
]
