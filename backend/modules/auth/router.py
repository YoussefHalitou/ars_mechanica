"""
Authentication API Router
Handles registration, login, token refresh, and user profile
"""
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.core.database import get_db
from backend.core.auth import (
    LoginRequest, RegisterRequest, TokenResponse, CurrentUser,
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES,
)
from backend.modules.users.models import User, Tenant, Subscription

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user and create their tenant"""
    
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == request.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create tenant
    tenant = Tenant(
        tenant_id=uuid.uuid4(),
        name=request.company_name,
        slug=request.company_name.lower().replace(" ", "-").replace("ae", "ae").replace("oe", "oe").replace("ue", "ue")[:100],
        industry=request.industry,
        email=request.email,
        enabled_modules=[
            "projects", "employees", "time_pairs", "materials",
            "services", "morningplan", "inspections", "users",
            "nachkalkulation", "revenue", "vehicle_costs", "material_usage"
        ],
    )
    db.add(tenant)
    await db.flush()  # Get tenant_id
    
    # Create subscription (7-day trial)
    subscription = Subscription(
        subscription_id=uuid.uuid4(),
        tenant_id=tenant.tenant_id,
        tier="starter",
        status="trialing",
        trial_starts_at=datetime.now(timezone.utc),
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=7),
        max_users=3,
        max_projects=50,
    )
    db.add(subscription)
    
    # Create user
    user = User(
        user_id=uuid.uuid4(),
        tenant_id=tenant.tenant_id,
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        role="Admin",
        user_type="office",
        is_active=True,
        email_verified=False,
    )
    db.add(user)
    await db.flush()
    
    # Generate tokens
    token_data = {"sub": str(user.user_id), "email": user.email, "role": user.role, "tenant_id": str(tenant.tenant_id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and return tokens"""
    
    # Find user
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    # Update login tracking
    user.last_login_at = datetime.now(timezone.utc)
    user.login_count = (user.login_count or 0) + 1
    
    # Generate tokens
    token_data = {
        "sub": str(user.user_id),
        "email": user.email,
        "role": user.role,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    """Refresh an access token"""
    payload = decode_token(refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    token_data = {
        "sub": str(user.user_id),
        "email": user.email,
        "role": user.role,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
    }
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me")
async def get_me(current_user: CurrentUser = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "role": current_user.role,
        "tenant_id": current_user.tenant_id,
        "full_name": current_user.full_name,
    }


@router.post("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user's password"""
    result = await db.execute(select(User).where(User.user_id == current_user.user_id))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid current password")
    
    user.password_hash = hash_password(new_password)
    await db.commit()
    return {"message": "Password changed successfully"}
