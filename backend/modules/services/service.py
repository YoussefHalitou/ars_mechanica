"""
Business logic for services module.
Provides CRUD operations and search functionality for services.
"""
import uuid
from typing import List, Optional, Tuple
from sqlalchemy import select, and_, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Service
from .schemas import ServiceCreate, ServiceUpdate, ServiceCSVImport


class ServiceService:
    """Service layer for service operations with parameterized queries."""
    
    @staticmethod
    async def create_service(db: AsyncSession, service_data: ServiceCreate) -> Service:
        """
        Create a new service.
        
        Args:
            db: Database session
            service_data: Service creation data
            
        Returns:
            The created service
        """
        service = Service(
            service_id=str(uuid.uuid4()),
            name=service_data.name,
            default_unit=service_data.default_unit,
            category=service_data.category,
            is_active=service_data.is_active
        )
        
        db.add(service)
        await db.commit()
        await db.refresh(service)
        return service
    
    @staticmethod
    async def get_service(db: AsyncSession, service_id: str) -> Optional[Service]:
        """
        Get a service by ID using parameterized query.
        
        Args:
            db: Database session
            service_id: The service ID to look up
            
        Returns:
            The service if found, None otherwise
        """
        result = await db.execute(
            select(Service).where(Service.service_id == service_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_services(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        active_only: bool = True
    ) -> Tuple[List[Service], int]:
        """
        Get services with pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            active_only: If True, only return active services
            
        Returns:
            Tuple of (list of services, total count)
        """
        # Build count query
        count_query = select(func.count(Service.service_id))
        if active_only:
            count_query = count_query.where(Service.is_active == True)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Build main query
        query = select(Service)
        if active_only:
            query = query.where(Service.is_active == True)
        
        query = query.order_by(Service.name).offset(skip).limit(limit)
        
        result = await db.execute(query)
        services = result.scalars().all()
        
        return list(services), total
    
    @staticmethod
    async def update_service(
        db: AsyncSession, 
        service_id: str, 
        update_data: ServiceUpdate
    ) -> Optional[Service]:
        """
        Update a service.
        
        Args:
            db: Database session
            service_id: The service ID to update
            update_data: The update data
            
        Returns:
            The updated service if found, None otherwise
        """
        service = await ServiceService.get_service(db, service_id)
        if not service:
            return None
        
        # Update only provided fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if hasattr(service, field):
                setattr(service, field, value)
        
        await db.commit()
        await db.refresh(service)
        return service
    
    @staticmethod
    async def delete_service(db: AsyncSession, service_id: str) -> bool:
        """
        Delete a service (soft delete by setting is_active=False).
        
        Args:
            db: Database session
            service_id: The service ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        service = await ServiceService.get_service(db, service_id)
        if not service:
            return False
        
        service.is_active = False
        await db.commit()
        return True
    
    @staticmethod
    async def import_from_csv(
        db: AsyncSession, 
        csv_data: List[ServiceCSVImport],
        tenant_id: str
    ) -> Tuple[int, List[str]]:
        """
        Import services from validated CSV data.
        
        Args:
            db: Database session
            csv_data: List of validated CSV import records
            tenant_id: The tenant ID for the imported services
            
        Returns:
            Tuple of (imported count, list of error messages)
        """
        imported_count = 0
        errors: List[str] = []
        
        for idx, item in enumerate(csv_data):
            try:
                service_data = ServiceCreate(
                    **item.model_dump()
                )
                await ServiceService.create_service(db, service_data)
                imported_count += 1
            except Exception as e:
                errors.append(f"Import row {idx + 1}: {str(e)}")
        
        await db.commit()
        return imported_count, errors
    
    @staticmethod
    async def search_services(
        db: AsyncSession,
        tenant_id: str,
        query: str,
        limit: int = 20
    ) -> List[Service]:
        """
        Search services by name or category using parameterized queries.
        
        This method is SQL injection safe as it uses SQLAlchemy's
        parameterized query system with the ilike() function.
        
        Args:
            db: Database session
            tenant_id: The tenant ID (for future multi-tenant filtering)
            query: Search term
            limit: Maximum number of results
            
        Returns:
            List of matching services
        """
        # Use parameterized query - SQLAlchemy automatically escapes the search_term
        # This prevents SQL injection attacks
        search_term = f"%{query}%"
        
        result = await db.execute(
            select(Service)
            .where(
                and_(
                    Service.is_active == True,
                    or_(
                        Service.name.ilike(search_term),
                        Service.category.ilike(search_term)
                    )
                )
            )
            .order_by(Service.name)
            .limit(limit)
        )
        
        return list(result.scalars().all())
    
    @staticmethod
    async def get_by_category(
        db: AsyncSession,
        category: str,
        active_only: bool = True
    ) -> List[Service]:
        """
        Get services by category using parameterized query.
        
        Args:
            db: Database session
            category: The category to filter by
            active_only: If True, only return active services
            
        Returns:
            List of services in the category
        """
        query = select(Service).where(Service.category == category)
        
        if active_only:
            query = query.where(Service.is_active == True)
        
        query = query.order_by(Service.name)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def count_active(db: AsyncSession) -> int:
        """
        Count active services.
        
        Args:
            db: Database session
            
        Returns:
            Count of active services
        """
        result = await db.execute(
            select(func.count(Service.service_id)).where(Service.is_active == True)
        )
        return result.scalar() or 0
