"""
FastAPI router for Analytics module (Draftbit architecture)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from backend.core.database import get_db
from backend.core.schemas import ResponseBase

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_analytics_dashboard(
    db: AsyncSession = Depends(get_db)
):
    """Get analytics dashboard data"""
    return ResponseBase(success=True, data=["Analytics dashboard - coming soon"])
