"""
Feature Gating System for LIS SaaS Platform
Controls access to features based on subscription tier
"""
from enum import Enum
from typing import List, Optional, Set, Callable
from functools import wraps
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from backend.core.database import get_db
from backend.core.auth import get_current_user, CurrentUser


# ============================================================================
# Subscription Tiers
# ============================================================================

class SubscriptionTier(str, Enum):
    """Available subscription tiers"""
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


# Tier hierarchy (higher number = more features)
TIER_LEVELS = {
    SubscriptionTier.STARTER: 1,
    SubscriptionTier.PROFESSIONAL: 2,
    SubscriptionTier.ENTERPRISE: 3
}


# ============================================================================
# Feature Definitions
# ============================================================================

class Feature(str, Enum):
    """
    Available features in the platform.
    Features are organized by category.
    """
    # Core modules (all tiers)
    PROJECTS = "modules.projects"
    EMPLOYEES = "modules.employees"
    TIME_TRACKING = "modules.time_tracking"
    MATERIALS = "modules.materials"
    SERVICES = "modules.services"
    MORNINGPLAN = "modules.morningplan"
    USERS = "modules.users"
    FEEDBACK = "modules.feedback"
    
    # Industry-specific modules (all tiers)
    ABNAHMEN = "modules.abnahmen"
    VEHICLE_COSTS = "modules.vehicle_costs"
    INSPECTIONS = "modules.inspections"
    MATERIAL_USAGE = "modules.material_usage"
    
    # Statistics (tier-dependent)
    STATS_DESCRIPTIVE = "stats.descriptive"
    STATS_INFERENTIAL = "stats.inferential"
    STATS_FORECASTING = "stats.forecasting"
    STATS_ANOMALY = "stats.anomaly"
    
    # Integrations (Professional+)
    INTEGRATION_LEXOFFICE = "integrations.lexoffice"
    INTEGRATION_GOOGLE_CALENDAR = "integrations.google_calendar"
    INTEGRATION_SLACK = "integrations.slack"
    INTEGRATION_WEBHOOKS = "integrations.webhooks"
    INTEGRATION_API = "integrations.api"
    
    # Enterprise features
    AI_CHATBOT = "enterprise.chatbot"
    CUSTOM_BRANDING = "enterprise.custom_branding"
    PRIORITY_SUPPORT = "enterprise.priority_support"
    SSO = "enterprise.sso"
    AUDIT_LOGS = "enterprise.audit_logs"
    DATA_EXPORT = "enterprise.data_export"
    
    # Usage limits
    UNLIMITED_USERS = "limits.unlimited_users"
    UNLIMITED_PROJECTS = "limits.unlimited_projects"


# ============================================================================
# Tier Feature Mapping
# ============================================================================

TIER_FEATURES: dict[SubscriptionTier, Set[Feature]] = {
    SubscriptionTier.STARTER: {
        # Core modules
        Feature.PROJECTS,
        Feature.EMPLOYEES,
        Feature.TIME_TRACKING,
        Feature.MATERIALS,
        Feature.SERVICES,
        Feature.MORNINGPLAN,
        Feature.USERS,
        Feature.FEEDBACK,
        # Industry modules
        Feature.ABNAHMEN,
        Feature.VEHICLE_COSTS,
        Feature.INSPECTIONS,
        Feature.MATERIAL_USAGE,
        # Basic stats
        Feature.STATS_DESCRIPTIVE,
    },
    
    SubscriptionTier.PROFESSIONAL: {
        # All Starter features plus:
        Feature.PROJECTS,
        Feature.EMPLOYEES,
        Feature.TIME_TRACKING,
        Feature.MATERIALS,
        Feature.SERVICES,
        Feature.MORNINGPLAN,
        Feature.USERS,
        Feature.FEEDBACK,
        Feature.ABNAHMEN,
        Feature.VEHICLE_COSTS,
        Feature.INSPECTIONS,
        Feature.MATERIAL_USAGE,
        Feature.STATS_DESCRIPTIVE,
        # Integrations
        Feature.INTEGRATION_LEXOFFICE,
        Feature.INTEGRATION_GOOGLE_CALENDAR,
        Feature.INTEGRATION_SLACK,
        Feature.INTEGRATION_WEBHOOKS,
        Feature.INTEGRATION_API,
    },
    
    SubscriptionTier.ENTERPRISE: {
        # All Professional features plus:
        Feature.PROJECTS,
        Feature.EMPLOYEES,
        Feature.TIME_TRACKING,
        Feature.MATERIALS,
        Feature.SERVICES,
        Feature.MORNINGPLAN,
        Feature.USERS,
        Feature.FEEDBACK,
        Feature.ABNAHMEN,
        Feature.VEHICLE_COSTS,
        Feature.INSPECTIONS,
        Feature.MATERIAL_USAGE,
        Feature.STATS_DESCRIPTIVE,
        Feature.INTEGRATION_LEXOFFICE,
        Feature.INTEGRATION_GOOGLE_CALENDAR,
        Feature.INTEGRATION_SLACK,
        Feature.INTEGRATION_WEBHOOKS,
        Feature.INTEGRATION_API,
        # Advanced stats
        Feature.STATS_INFERENTIAL,
        Feature.STATS_FORECASTING,
        Feature.STATS_ANOMALY,
        # Enterprise features
        Feature.AI_CHATBOT,
        Feature.CUSTOM_BRANDING,
        Feature.PRIORITY_SUPPORT,
        Feature.SSO,
        Feature.AUDIT_LOGS,
        Feature.DATA_EXPORT,
        # Unlimited
        Feature.UNLIMITED_USERS,
        Feature.UNLIMITED_PROJECTS,
    }
}


# ============================================================================
# Feature Checking Functions
# ============================================================================

def get_tier_features(tier: str) -> Set[Feature]:
    """Get all features available for a tier"""
    try:
        tier_enum = SubscriptionTier(tier)
        return TIER_FEATURES.get(tier_enum, set())
    except ValueError:
        return TIER_FEATURES.get(SubscriptionTier.STARTER, set())


def has_feature(tier: str, feature: Feature) -> bool:
    """Check if a tier has access to a specific feature"""
    features = get_tier_features(tier)
    return feature in features


def has_any_feature(tier: str, features: List[Feature]) -> bool:
    """Check if a tier has access to any of the specified features"""
    tier_features = get_tier_features(tier)
    return any(f in tier_features for f in features)


def has_all_features(tier: str, features: List[Feature]) -> bool:
    """Check if a tier has access to all specified features"""
    tier_features = get_tier_features(tier)
    return all(f in tier_features for f in features)


def get_tier_level(tier: str) -> int:
    """Get numeric level of a tier"""
    try:
        tier_enum = SubscriptionTier(tier)
        return TIER_LEVELS.get(tier_enum, 0)
    except ValueError:
        return 0


def is_tier_at_least(user_tier: str, required_tier: str) -> bool:
    """Check if user's tier is at least the required tier"""
    return get_tier_level(user_tier) >= get_tier_level(required_tier)


# ============================================================================
# FastAPI Dependencies for Feature Gating
# ============================================================================

def require_feature(feature: Feature):
    """
    Dependency factory that requires a specific feature.
    
    Usage:
        @router.get("/lexoffice/sync")
        async def sync_lexoffice(
            user: CurrentUser = Depends(require_feature(Feature.INTEGRATION_LEXOFFICE))
        ):
            ...
    """
    async def feature_checker(
        current_user: CurrentUser = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> CurrentUser:
        # Get user's tier
        tier = current_user.tier
        
        if not has_feature(tier, feature):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{feature.value}' requires a higher subscription tier. "
                       f"Your tier: {tier}. Please upgrade to access this feature."
            )
        
        return current_user
    
    return feature_checker


def require_any_feature(*features: Feature):
    """
    Dependency factory that requires any of the specified features.
    """
    async def feature_checker(
        current_user: CurrentUser = Depends(get_current_user)
    ) -> CurrentUser:
        tier = current_user.tier
        
        if not has_any_feature(tier, list(features)):
            feature_names = ", ".join(f.value for f in features)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these features is required: {feature_names}. "
                       f"Please upgrade your subscription."
            )
        
        return current_user
    
    return feature_checker


def require_tier(required_tier: SubscriptionTier):
    """
    Dependency factory that requires a minimum tier.
    
    Usage:
        @router.get("/enterprise-dashboard")
        async def enterprise_dashboard(
            user: CurrentUser = Depends(require_tier(SubscriptionTier.ENTERPRISE))
        ):
            ...
    """
    async def tier_checker(
        current_user: CurrentUser = Depends(get_current_user)
    ) -> CurrentUser:
        if not is_tier_at_least(current_user.tier, required_tier.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires {required_tier.value} tier or higher. "
                       f"Your tier: {current_user.tier}"
            )
        
        return current_user
    
    return tier_checker


# ============================================================================
# Usage Limit Checking
# ============================================================================

async def check_user_limit(
    db: AsyncSession,
    tenant_id: str,
    tier: str
) -> tuple[int, int, bool]:
    """
    Check if tenant can add more users.
    Returns (current_count, max_allowed, can_add)
    """
    from backend.modules.users.models import User, Subscription
    
    # Get current user count
    result = await db.execute(
        select(User).where(User.tenant_id == uuid.UUID(tenant_id))
    )
    current_count = len(result.scalars().all())
    
    # Get subscription limits
    sub_result = await db.execute(
        select(Subscription).where(Subscription.tenant_id == uuid.UUID(tenant_id))
    )
    sub = sub_result.scalar_one_or_none()
    
    max_allowed = sub.max_users if sub else 3
    can_add = current_count < max_allowed
    
    return current_count, max_allowed, can_add


async def check_project_limit(
    db: AsyncSession,
    tenant_id: str,
    tier: str
) -> tuple[int, int, bool]:
    """
    Check if tenant can add more projects.
    Returns (current_count, max_allowed, can_add)
    """
    from backend.modules.projects.models import Project
    from backend.modules.users.models import Subscription
    
    # Get current project count
    result = await db.execute(
        select(Project).where(Project.tenant_id == uuid.UUID(tenant_id))
    )
    current_count = len(result.scalars().all())
    
    # Get subscription limits
    sub_result = await db.execute(
        select(Subscription).where(Subscription.tenant_id == uuid.UUID(tenant_id))
    )
    sub = sub_result.scalar_one_or_none()
    
    max_allowed = sub.max_projects if sub else 50
    can_add = current_count < max_allowed
    
    return current_count, max_allowed, can_add


def require_user_quota():
    """Dependency to check user quota before adding users"""
    async def quota_checker(
        current_user: CurrentUser = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> CurrentUser:
        if not current_user.tenant_id:
            raise HTTPException(status_code=400, detail="No tenant context")
        
        current, max_allowed, can_add = await check_user_limit(
            db, current_user.tenant_id, current_user.tier
        )
        
        if not can_add:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User limit reached ({current}/{max_allowed}). "
                       f"Upgrade your subscription to add more users."
            )
        
        return current_user
    
    return quota_checker


def require_project_quota():
    """Dependency to check project quota before adding projects"""
    async def quota_checker(
        current_user: CurrentUser = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> CurrentUser:
        if not current_user.tenant_id:
            raise HTTPException(status_code=400, detail="No tenant context")
        
        current, max_allowed, can_add = await check_project_limit(
            db, current_user.tenant_id, current_user.tier
        )
        
        if not can_add:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Project limit reached ({current}/{max_allowed}). "
                       f"Upgrade your subscription to add more projects."
            )
        
        return current_user
    
    return quota_checker


# ============================================================================
# Feature Descriptions for UI
# ============================================================================

FEATURE_DESCRIPTIONS = {
    Feature.PROJECTS: {
        "name": "Project Management",
        "description": "Create and manage customer projects",
        "icon": "folder"
    },
    Feature.EMPLOYEES: {
        "name": "Employee Management",
        "description": "Manage your workforce",
        "icon": "users"
    },
    Feature.TIME_TRACKING: {
        "name": "Time Tracking",
        "description": "Track work hours and attendance",
        "icon": "clock"
    },
    Feature.STATS_DESCRIPTIVE: {
        "name": "Descriptive Statistics",
        "description": "Basic reports and dashboards",
        "icon": "chart-bar"
    },
    Feature.STATS_INFERENTIAL: {
        "name": "Advanced Analytics",
        "description": "Predictions and trend analysis",
        "icon": "chart-line"
    },
    Feature.INTEGRATION_LEXOFFICE: {
        "name": "Lexoffice Integration",
        "description": "Sync with Lexoffice accounting",
        "icon": "link"
    },
    Feature.AI_CHATBOT: {
        "name": "AI Assistant",
        "description": "Ask questions about your data",
        "icon": "robot"
    },
}


def get_feature_info(feature: Feature) -> dict:
    """Get display information for a feature"""
    return FEATURE_DESCRIPTIONS.get(feature, {
        "name": feature.value,
        "description": "",
        "icon": "star"
    })


# ============================================================================
# Exports
# ============================================================================

__all__ = [
    # Enums
    "SubscriptionTier",
    "Feature",
    # Checking functions
    "get_tier_features",
    "has_feature",
    "has_any_feature",
    "has_all_features",
    "is_tier_at_least",
    # Dependencies
    "require_feature",
    "require_any_feature",
    "require_tier",
    # Quota checks
    "check_user_limit",
    "check_project_limit",
    "require_user_quota",
    "require_project_quota",
    # UI helpers
    "get_feature_info",
    "FEATURE_DESCRIPTIONS"
]
