"""
FastAPI router for Feedback module (Draftbit architecture)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from backend.core.database import get_db
from backend.core.schemas import ResponseBase

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])


@router.get("/")
async def list_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """List all feedback items"""
    return ResponseBase(success=True, data=["Feedback module - coming soon"])


@router.post("/")
async def submit_feedback(
    db: AsyncSession = Depends(get_db)
):
    """Submit new feedback"""
    return ResponseBase(success=True, message="Feedback submitted - coming soon")
