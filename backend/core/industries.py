"""
Industry Configuration Service
Loads and applies industry-specific templates for new tenants
"""
import os
import yaml
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


@dataclass
class IndustryTemplate:
    """Industry configuration template"""
    id: str
    name: str
    icon: str
    description: str
    enabled_modules: List[str]
    terminology: Dict[str, str]
    default_services: List[Dict[str, str]]
    default_materials: List[Dict[str, str]]
    settings: Dict[str, Any]
    inspection_checklist: List[str] = field(default_factory=list)
    abnahme_checklist: List[str] = field(default_factory=list)


# Available industries
INDUSTRIES = ["moving", "plumbing", "electrical", "carpentry", "general"]


class IndustryService:
    """Service for loading and applying industry templates"""
    
    _templates: Dict[str, IndustryTemplate] = {}
    _loaded: bool = False
    
    @classmethod
    def _get_industries_path(cls) -> Path:
        """Get path to industries configuration directory"""
        base_path = Path(__file__).parent.parent.parent
        return base_path / "clients" / "industries"
    
    @classmethod
    def load_templates(cls) -> None:
        """Load all industry templates from YAML files"""
        if cls._loaded:
            return
        
        industries_path = cls._get_industries_path()
        
        for industry_id in INDUSTRIES:
            template_file = industries_path / f"{industry_id}.yaml"
            
            if template_file.exists():
                try:
                    with open(template_file, 'r', encoding='utf-8') as f:
                        data = yaml.safe_load(f)
                    
                    industry_data = data.get('industry', {})
                    
                    template = IndustryTemplate(
                        id=industry_data.get('id', industry_id),
                        name=industry_data.get('name', industry_id.title()),
                        icon=industry_data.get('icon', 'building'),
                        description=industry_data.get('description', ''),
                        enabled_modules=data.get('enabled_modules', []),
                        terminology=data.get('terminology', {}),
                        default_services=data.get('default_services', []),
                        default_materials=data.get('default_materials', []),
                        settings=data.get('settings', {}),
                        inspection_checklist=data.get('inspection_checklist', []),
                        abnahme_checklist=data.get('abnahme_checklist', [])
                    )
                    
                    cls._templates[industry_id] = template
                    print(f"✅ Loaded industry template: {industry_id}")
                    
                except Exception as e:
                    print(f"❌ Failed to load industry template {industry_id}: {e}")
        
        cls._loaded = True
    
    @classmethod
    def get_template(cls, industry_id: str) -> Optional[IndustryTemplate]:
        """Get industry template by ID"""
        cls.load_templates()
        return cls._templates.get(industry_id)
    
    @classmethod
    def get_all_templates(cls) -> Dict[str, IndustryTemplate]:
        """Get all industry templates"""
        cls.load_templates()
        return cls._templates
    
    @classmethod
    def get_available_industries(cls) -> List[Dict[str, str]]:
        """Get list of available industries for UI"""
        cls.load_templates()
        return [
            {
                "id": t.id,
                "name": t.name,
                "icon": t.icon,
                "description": t.description
            }
            for t in cls._templates.values()
        ]
    
    @classmethod
    def get_modules_for_industry(cls, industry_id: str) -> List[str]:
        """Get enabled modules for an industry"""
        template = cls.get_template(industry_id)
        if template:
            return template.enabled_modules
        
        # Default modules if industry not found
        return [
            "projects", "employees", "time_pairs", "materials",
            "services", "morningplan", "users", "feedback"
        ]
    
    @classmethod
    def get_terminology(cls, industry_id: str) -> Dict[str, str]:
        """Get terminology mapping for an industry"""
        template = cls.get_template(industry_id)
        if template:
            return template.terminology
        return {}
    
    @classmethod
    def get_default_services(cls, industry_id: str) -> List[Dict[str, str]]:
        """Get default services for an industry"""
        template = cls.get_template(industry_id)
        if template:
            return template.default_services
        return []
    
    @classmethod
    def get_default_materials(cls, industry_id: str) -> List[Dict[str, str]]:
        """Get default materials for an industry"""
        template = cls.get_template(industry_id)
        if template:
            return template.default_materials
        return []
    
    @classmethod
    def get_settings(cls, industry_id: str) -> Dict[str, Any]:
        """Get industry-specific settings"""
        template = cls.get_template(industry_id)
        if template:
            return template.settings
        return {}
    
    @classmethod
    def apply_template_to_tenant(cls, industry_id: str) -> Dict[str, Any]:
        """
        Generate tenant configuration from industry template.
        Returns a dict that can be used to create/update a tenant.
        """
        template = cls.get_template(industry_id)
        
        if not template:
            template = cls.get_template("general")
        
        if not template:
            return {
                "industry": industry_id,
                "enabled_modules": cls.get_modules_for_industry("general"),
                "settings": {}
            }
        
        return {
            "industry": template.id,
            "enabled_modules": template.enabled_modules,
            "terminology": template.terminology,
            "settings": {
                **template.settings,
                "inspection_checklist": template.inspection_checklist,
                "abnahme_checklist": template.abnahme_checklist
            },
            "default_services": template.default_services,
            "default_materials": template.default_materials
        }


# FastAPI Router for Industries
from fastapi import APIRouter

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


# Exports
__all__ = [
    "IndustryTemplate",
    "IndustryService",
    "INDUSTRIES",
    "router"
]
