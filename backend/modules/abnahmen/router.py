"""
FastAPI router for Abnahmen (Completion Protocol) module (Draftbit architecture)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from backend.core.database import get_db
from backend.core.schemas import ResponseBase

router = APIRouter(prefix="/api/abnahmen", tags=["Abnahmen (Completion)"])


@router.get("/")
async def list_abnahmen(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """List all completion protocols"""
    return ResponseBase(success=True, data=["Abnahmen module - coming soon"])


@router.post("/")
async def create_abnahme(
    db: AsyncSession = Depends(get_db)
):
    """Create a new completion protocol"""
    return ResponseBase(success=True, message="Abnahme created - coming soon")
