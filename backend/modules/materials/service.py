"""
Business logic for materials module
"""
import uuid
from typing import List, Optional, Tuple
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import Material, MaterialPrice, MaterialPriceHistory
from .schemas import MaterialCreate, MaterialUpdate, MaterialCSVImport


class MaterialService:
    """Service layer for material operations"""
    
    @staticmethod
    async def create_material(db: AsyncSession, material_data: MaterialCreate) -> Material:
        """Create a new material"""
        material = Material(
            material_id=str(uuid.uuid4()),
            name=material_data.name,
            unit=material_data.unit,
            category=material_data.category,
            vat_rate=material_data.vat_rate,
            is_active=material_data.is_active,
            default_quantity=material_data.default_quantity
        )
        
        db.add(material)
        await db.commit()
        await db.refresh(material)
        return material
    
    @staticmethod
    async def get_material(db: AsyncSession, material_id: str) -> Optional[Material]:
        """Get a material by ID with prices"""
        result = await db.execute(
            select(Material)
            .options(selectinload(Material.prices))
            .where(Material.material_id == material_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_materials(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        active_only: bool = True,
        category: Optional[str] = None
    ) -> Tuple[List[Material], int]:
        """Get materials with pagination and optional filtering"""
        
        # Build count query
        count_query = select(func.count(Material.material_id))
        if active_only:
            count_query = count_query.where(Material.is_active == True)
        if category:
            count_query = count_query.where(Material.category == category)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Build main query with prices
        query = select(Material).options(selectinload(Material.prices))
        if active_only:
            query = query.where(Material.is_active == True)
        if category:
            query = query.where(Material.category == category)
        
        query = query.order_by(Material.name).offset(skip).limit(limit)
        
        result = await db.execute(query)
        materials = result.scalars().all()
        
        return list(materials), total
    
    @staticmethod
    async def update_material(
        db: AsyncSession, 
        material_id: str, 
        update_data: MaterialUpdate
    ) -> Optional[Material]:
        """Update a material"""
        material = await MaterialService.get_material(db, material_id)
        if not material:
            return None
        
        # Update only provided fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(material, field, value)
        
        await db.commit()
        await db.refresh(material)
        return material
    
    @staticmethod
    async def delete_material(db: AsyncSession, material_id: str) -> bool:
        """Delete a material (soft delete by setting is_active=False)"""
        material = await MaterialService.get_material(db, material_id)
        if not material:
            return False
        
        material.is_active = False
        await db.commit()
        return True
    
    @staticmethod
    async def set_material_prices(
        db: AsyncSession,
        material_id: str,
        cost_per_unit: Optional[float],
        price_per_unit: Optional[float],
        updated_by: Optional[str] = None
    ) -> Optional[MaterialPrice]:
        """Set or update material prices"""
        
        # Get existing prices
        existing = await db.execute(
            select(MaterialPrice).where(MaterialPrice.material_id == material_id)
        )
        price_record = existing.scalar_one_or_none()
        
        # Store old price in history if updating
        if price_record and price_record.price_per_unit != price_per_unit:
            history = MaterialPriceHistory(
                material_id=material_id,
                old_price=float(price_record.price_per_unit) if price_record.price_per_unit else None,
                new_price=price_per_unit,
                changed_by=updated_by
            )
            db.add(history)
        
        if price_record:
            # Update existing
            price_record.cost_per_unit = cost_per_unit
            price_record.price_per_unit = price_per_unit
            price_record.updated_by = updated_by
        else:
            # Create new
            price_record = MaterialPrice(
                material_id=material_id,
                cost_per_unit=cost_per_unit,
                price_per_unit=price_per_unit,
                updated_by=updated_by
            )
            db.add(price_record)
        
        await db.commit()
        await db.refresh(price_record)
        return price_record
    
    @staticmethod
    async def search_materials(
        db: AsyncSession,
        query: str,
        limit: int = 20
    ) -> List[Material]:
        """Search materials by name"""
        search_term = f"%{query}%"
        
        result = await db.execute(
            select(Material)
            .options(selectinload(Material.prices))
            .where(
                and_(
                    Material.is_active == True,
                    func.lower(Material.name).ilike(func.lower(search_term))
                )
            )
            .order_by(Material.name)
            .limit(limit)
        )
        
        return list(result.scalars().all())
    
    @staticmethod
    async def get_material_categories(db: AsyncSession) -> List[str]:
        """Get all unique material categories"""
        result = await db.execute(
            select(Material.category)
            .where(Material.category.isnot(None))
            .distinct()
            .order_by(Material.category)
        )
        return [row[0] for row in result.fetchall() if row[0]]
