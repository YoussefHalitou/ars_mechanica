"""
FastAPI router for vehicle costs module
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/vehicle_costs", tags=["vehicle_costs"])

# Vehicle cost endpoints are handled in projects module
# This router can be extended for specific vehicle cost operations
