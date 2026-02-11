"""
FastAPI router for revenue module
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/revenue", tags=["revenue"])

# Revenue endpoints are handled in projects module
# This router can be extended for specific revenue operations
