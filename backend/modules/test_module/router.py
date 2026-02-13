"""
FastAPI router for test_module module
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.core.schemas import ResponseBase

router = APIRouter(prefix="/api/test_module", tags=["test_module"])


@router.get("/")
async def list_items(db: AsyncSession = Depends(get_db)):
    """List all items"""
    return ResponseBase(success=True, data=[])


@router.post("/")
async def create_item(db: AsyncSession = Depends(get_db)):
    """Create new item"""
    return ResponseBase(success=True, message="Created")


@router.get("/{item_id}")
async def get_item(item_id: str, db: AsyncSession = Depends(get_db)):
    """Get item by ID"""
    return ResponseBase(success=True, data={"id": item_id})


@router.put("/{item_id}")
async def update_item(item_id: str, db: AsyncSession = Depends(get_db)):
    """Update item"""
    return ResponseBase(success=True, message="Updated")


@router.delete("/{item_id}")
async def delete_item(item_id: str, db: AsyncSession = Depends(get_db)):
    """Delete item"""
    return ResponseBase(success=True, message="Deleted")
