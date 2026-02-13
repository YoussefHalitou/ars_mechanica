"""
Authentication utilities for Ars Mechanica
JWT token creation/verification and password hashing
"""
import os
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.core.database import get_db

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "ars-mechanica-dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Security scheme
security = HTTPBearer(auto_error=False)


# ============================================
# Pydantic Models
# ============================================

class LoginRequest(BaseModel):
    email: str  # Use plain str to allow local/dev domains
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: str
    industry: str = "general"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class CurrentUser(BaseModel):
    user_id: str
    email: str
    role: str
    tenant_id: Optional[str] = None
    full_name: Optional[str] = None


# ============================================
# Password Hashing (using bcrypt directly)
# ============================================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


# ============================================
# JWT Token Management
# ============================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================
# FastAPI Dependencies
# ============================================

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    """FastAPI dependency to get the current authenticated user"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    return CurrentUser(
        user_id=payload.get("sub", ""),
        email=payload.get("email", ""),
        role=payload.get("role", "user"),
        tenant_id=payload.get("tenant_id"),
        full_name=payload.get("full_name"),
    )


def require_role(*roles: str):
    """FastAPI dependency to require specific roles"""
    async def role_checker(current_user: CurrentUser = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' not authorized. Required: {roles}",
            )
        return current_user
    return role_checker


def require_tier(*tiers: str):
    """FastAPI dependency to require specific subscription tiers"""
    async def tier_checker(current_user: CurrentUser = Depends(get_current_user)):
        # TODO: Check actual subscription tier from DB
        return current_user
    return tier_checker
