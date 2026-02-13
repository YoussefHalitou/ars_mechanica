"""
Statistics API Router
Provides analytics endpoints with tier-based access control
"""
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.core.auth import get_current_user, CurrentUser
from backend.core.features import (
    require_feature, require_tier,
    Feature, SubscriptionTier
)
from backend.modules.statistics.service import StatisticsService

router = APIRouter(prefix="/api/statistics", tags=["statistics"])


# ============================================================================
# Descriptive Statistics (All Tiers)
# ============================================================================

@router.get("/dashboard")
async def get_dashboard_statistics(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard statistics appropriate for user's tier.
    All tiers get basic stats; Enterprise gets advanced analytics.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant context")
    
    stats = await StatisticsService.get_dashboard_stats(
        db, current_user.tenant_id, current_user.tier
    )
    
    return stats


@router.get("/projects")
async def get_project_statistics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get project statistics summary"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant context")
    
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    return await StatisticsService.descriptive.get_project_summary(
        db, current_user.tenant_id, start_date, end_date
    )


@router.get("/hours")
async def get_hours_statistics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get employee hours statistics"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant context")
    
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    return await StatisticsService.descriptive.get_employee_hours(
        db, current_user.tenant_id, start_date, end_date
    )


# ============================================================================
# Inferential Statistics (Enterprise Only)
# ============================================================================

@router.get("/forecast/revenue")
async def get_revenue_forecast(
    months_ahead: int = Query(default=3, ge=1, le=12),
    current_user: CurrentUser = Depends(require_feature(Feature.STATS_INFERENTIAL)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get revenue forecast using predictive analytics.
    Enterprise tier only.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant context")
    
    try:
        return await StatisticsService.inferential.forecast_revenue(
            db, current_user.tenant_id, months_ahead
        )
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Analytics libraries not available: {e}"
        )


@router.get("/productivity")
async def get_productivity_analysis(
    current_user: CurrentUser = Depends(require_feature(Feature.STATS_INFERENTIAL)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get employee productivity analysis.
    Enterprise tier only.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant context")
    
    try:
        return await StatisticsService.inferential.analyze_productivity(
            db, current_user.tenant_id
        )
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Analytics libraries not available: {e}"
        )


@router.get("/anomalies")
async def get_anomaly_detection(
    metric: str = Query(default="hours"),
    current_user: CurrentUser = Depends(require_feature(Feature.STATS_ANOMALY)),
    db: AsyncSession = Depends(get_db)
):
    """
    Detect anomalies in business metrics.
    Enterprise tier only.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant context")
    
    try:
        return await StatisticsService.inferential.detect_anomalies(
            db, current_user.tenant_id, metric
        )
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Analytics libraries not available: {e}"
        )


@router.get("/profitability")
async def get_profitability_analysis(
    current_user: CurrentUser = Depends(require_feature(Feature.STATS_INFERENTIAL)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get project profitability analysis.
    Enterprise tier only.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant context")
    
    try:
        return await StatisticsService.inferential.project_profitability_analysis(
            db, current_user.tenant_id
        )
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Analytics libraries not available: {e}"
        )
