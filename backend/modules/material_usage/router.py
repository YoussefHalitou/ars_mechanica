"""
FastAPI router for material usage module
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/material_usage", tags=["material_usage"])

# Material usage endpoints are handled in projects module
# This router can be extended for specific material usage operations
