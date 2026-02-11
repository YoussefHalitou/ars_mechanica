"""
Industries API Router
Exposes industry templates and configuration endpoints
"""
from fastapi import APIRouter
from backend.core.industries import IndustryService

router = APIRouter(prefix="/api/industries", tags=["industries"])


@router.get("/")
async def list_industries():
    """Get list of available industries"""
    return {
        "industries": IndustryService.get_available_industries()
    }


@router.get("/{industry_id}")
async def get_industry(industry_id: str):
    """Get industry template details"""
    template = IndustryService.get_template(industry_id)
    
    if not template:
        return {"error": "Industry not found"}
    
    return {
        "id": template.id,
        "name": template.name,
        "icon": template.icon,
        "description": template.description,
        "enabled_modules": template.enabled_modules,
        "terminology": template.terminology,
        "settings": template.settings,
        "default_services_count": len(template.default_services),
        "default_materials_count": len(template.default_materials)
    }


@router.get("/{industry_id}/services")
async def get_industry_services(industry_id: str):
    """Get default services for an industry"""
    return {
        "services": IndustryService.get_default_services(industry_id)
    }


@router.get("/{industry_id}/materials")
async def get_industry_materials(industry_id: str):
    """Get default materials for an industry"""
    return {
        "materials": IndustryService.get_default_materials(industry_id)
    }
