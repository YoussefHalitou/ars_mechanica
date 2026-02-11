"""
Enhanced tenant configuration system with caching and advanced features
"""
import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
import json
import asyncio


@dataclass
class TenantConfig:
    """Enhanced tenant configuration with modern features"""
    
    # Basic info
    name: str
    tenant_id: str
    
    # Branding
    logo_url: str = ""
    primary_color: str = "#2563eb"
    secondary_color: str = "#64748b"
    accent_color: str = "#f59e0b"
    
    # Modules
    enabled_modules: List[str] = field(default_factory=list)
    
    # Features
    features: Dict[str, Any] = field(default_factory=dict)
    
    # Settings
    settings: Dict[str, Any] = field(default_factory=dict)
    
    # UI Preferences
    ui_preferences: Dict[str, Any] = field(default_factory=dict)
    
    # Notifications
    notifications: Dict[str, Any] = field(default_factory=dict)
    
    # Integrations
    integrations: Dict[str, Any] = field(default_factory=dict)
    
    # Permissions
    permissions: Dict[str, List[str]] = field(default_factory=dict)
    
    def __post_init__(self) -> None:
        """Initialize default values if not provided"""
        if not self.features:
            self.features = {
                "real_time": True,
                "advanced_search": True,
                "export_formats": ["csv", "xlsx", "pdf"],
                "bulk_operations": True,
                "notifications": True,
                "analytics": True,
                "mobile_optimized": True,
                "dark_mode": True,
                "keyboard_shortcuts": True
            }
        
        if not self.settings:
            self.settings = {
                "date_format": "dd.mm.yyyy",
                "time_format": "24h",
                "currency": "EUR",
                "language": "de",
                "timezone": "Europe/Vienna",
                "decimal_separator": ",",
                "thousands_separator": ".",
                "vat_rate": 20.0,
                "auto_save": True,
                "session_timeout": 3600
            }
        
        if not self.ui_preferences:
            self.ui_preferences = {
                "sidebar_collapsed": False,
                "default_view": "dashboard",
                "items_per_page": 25,
                "compact_mode": False,
                "show_tooltips": True,
                "animations": True
            }
        
        if not self.notifications:
            self.notifications = {
                "email_enabled": True,
                "push_enabled": True,
                "sms_enabled": False,
                "desktop_enabled": True,
                "frequency": "realtime",
                "types": {
                    "project_updates": True,
                    "inspection_reminders": True,
                    "time_tracking": True,
                    "material_low": True,
                    "feedback_resolved": True
                }
            }
        
        if not self.integrations:
            self.integrations = {
                "lexoffice": {"enabled": False, "api_key": ""},
                "google_calendar": {"enabled": False, "credentials": {}},
                "slack": {"enabled": False, "webhook_url": ""},
                "webhook": {"enabled": False, "url": ""},
                "sms_gateway": {"enabled": False, "provider": ""}
            }
        
        if not self.permissions:
            self.permissions = {
                "Admin": ["*"],
                "Secretary": ["read", "create", "update"],
                "Planner": ["read", "create", "update", "schedule"],
                "Supervisor": ["read", "create", "update", "approve"],
                "Worker": ["read", "time_tracking", "material_usage"]
            }
    
    def is_module_enabled(self, module_name: str) -> bool:
        """Check if module is enabled"""
        return module_name in self.enabled_modules
    
    def has_permission(self, role: str, action: str) -> bool:
        """Check if role has permission for action"""
        role_permissions = self.permissions.get(role, [])
        return "*" in role_permissions or action in role_permissions
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "name": self.name,
            "tenant_id": self.tenant_id,
            "logo_url": self.logo_url,
            "primary_color": self.primary_color,
            "secondary_color": self.secondary_color,
            "accent_color": self.accent_color,
            "enabled_modules": self.enabled_modules,
            "features": self.features,
            "settings": self.settings,
            "ui_preferences": self.ui_preferences,
            "notifications": self.notifications,
            "integrations": self.integrations,
            "permissions": self.permissions
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TenantConfig':
        """Create from dictionary"""
        return cls(**data)


class TenantManager:
    """Enhanced tenant manager with caching and advanced features"""
    
    def __init__(self) -> None:
        self.clients_dir = Path(__file__).parent.parent / "clients"
        self.cache_prefix = "tenant_config"
        self.cache_expiration = 3600  # 1 hour
        self._sync_cache: Dict[str, TenantConfig] = {}  # In-memory cache for sync operations
    
    def get_config_file_path(self, tenant_id: str) -> Path:
        """Get path to tenant config file"""
        return self.clients_dir / f"{tenant_id}.yaml"
    
    async def load_from_file(self, tenant_id: str) -> Optional[TenantConfig]:
        """Load tenant config from file with caching"""
        # Import here to avoid circular imports
        from backend.core.database import cache_get, cache_set
        
        cache_key = f"{self.cache_prefix}:{tenant_id}"
        
        # Try cache first
        cached_config = await cache_get(cache_key)
        if cached_config:
            try:
                return TenantConfig.from_dict(json.loads(cached_config))
            except Exception:
                pass  # Cache miss, load from file
        
        config_file = self.get_config_file_path(tenant_id)
        
        if not config_file.exists():
            # Return default config
            return self.get_default_config(tenant_id)
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            config = TenantConfig.from_dict(data)
            
            # Cache the config
            await cache_set(cache_key, json.dumps(config.to_dict()), self.cache_expiration)
            
            return config
            
        except Exception as e:
            print(f"Error loading config for tenant {tenant_id}: {e}")
            return self.get_default_config(tenant_id)
    
    def load_from_file_sync(self, tenant_id: str) -> TenantConfig:
        """
        Load tenant config from file synchronously (no async/await).
        Uses in-memory cache to avoid repeated file reads.
        """
        # Check in-memory cache first
        if tenant_id in self._sync_cache:
            return self._sync_cache[tenant_id]
        
        config_file = self.get_config_file_path(tenant_id)
        
        if not config_file.exists():
            config = self.get_default_config(tenant_id)
            self._sync_cache[tenant_id] = config
            return config
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            config = TenantConfig.from_dict(data)
            self._sync_cache[tenant_id] = config
            return config
            
        except Exception as e:
            print(f"Error loading config for tenant {tenant_id}: {e}")
            config = self.get_default_config(tenant_id)
            self._sync_cache[tenant_id] = config
            return config
    
    def get_default_config(self, tenant_id: str) -> TenantConfig:
        """Get default configuration for new tenants"""
        return TenantConfig(
            name="LIS System",
            tenant_id=tenant_id,
            enabled_modules=[
                "services", "materials", "projects", "time_pairs", "revenue",
                "vehicle_costs", "material_usage", "employees", "users", "inspections"
            ],
            features={
                "real_time": True,
                "advanced_search": True,
                "export_formats": ["csv", "xlsx"],
                "bulk_operations": True,
                "notifications": True,
                "analytics": True,
                "mobile_optimized": True,
                "dark_mode": True
            }
        )
    
    def clear_sync_cache(self, tenant_id: Optional[str] = None) -> None:
        """Clear the in-memory sync cache"""
        if tenant_id:
            self._sync_cache.pop(tenant_id, None)
        else:
            self._sync_cache.clear()
    
    async def save_to_file(self, config: TenantConfig) -> None:
        """Save tenant config to file"""
        from backend.core.database import cache_delete_pattern
        
        config_file = self.get_config_file_path(config.tenant_id)
        
        # Ensure directory exists
        config_file.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                yaml.dump(config.to_dict(), f, default_flow_style=False, allow_unicode=True)
            
            # Invalidate both caches
            cache_key = f"{self.cache_prefix}:{config.tenant_id}"
            await cache_delete_pattern(cache_key)
            self.clear_sync_cache(config.tenant_id)
            
        except Exception as e:
            print(f"Error saving config for tenant {config.tenant_id}: {e}")
            raise
    
    async def update_config(self, tenant_id: str, updates: Dict[str, Any]) -> TenantConfig:
        """Update tenant configuration"""
        config = await self.load_from_file(tenant_id)
        
        # Apply updates
        for key, value in updates.items():
            if hasattr(config, key):
                setattr(config, key, value)
        
        # Save updated config
        await self.save_to_file(config)
        
        return config
    
    async def get_themes(self) -> Dict[str, Dict[str, str]]:
        """Get available themes"""
        return {
            "light": {
                "primary": "#2563eb",
                "secondary": "#64748b",
                "accent": "#f59e0b",
                "background": "#ffffff",
                "surface": "#f8fafc"
            },
            "dark": {
                "primary": "#3b82f6",
                "secondary": "#94a3b8",
                "accent": "#fbbf24",
                "background": "#0f172a",
                "surface": "#1e293b"
            },
            "blue": {
                "primary": "#1e40af",
                "secondary": "#3730a3",
                "accent": "#0891b2",
                "background": "#ffffff",
                "surface": "#f1f5f9"
            },
            "green": {
                "primary": "#059669",
                "secondary": "#047857",
                "accent": "#d97706",
                "background": "#ffffff",
                "surface": "#f0fdf4"
            }
        }
    
    async def validate_config(self, config: TenantConfig) -> List[str]:
        """Validate tenant configuration and return list of errors"""
        errors = []
        
        # Validate colors
        for color_field in ["primary_color", "secondary_color", "accent_color"]:
            color = getattr(config, color_field, "")
            if color and not color.startswith("#"):
                errors.append(f"{color_field} must be a valid hex color")
        
        # Validate modules
        if not config.enabled_modules:
            errors.append("enabled_modules cannot be empty")
        
        # Validate features
        required_features = ["real_time", "advanced_search", "export_formats"]
        for feature in required_features:
            if feature not in config.features:
                errors.append(f"features.{feature} is required")
        
        # Validate settings
        required_settings = ["date_format", "currency", "language"]
        for setting in required_settings:
            if setting not in config.settings:
                errors.append(f"settings.{setting} is required")
        
        return errors


# Global tenant manager instance
tenant_manager = TenantManager()


def get_current_tenant_sync() -> TenantConfig:
    """
    Get current tenant configuration synchronously.
    This function does NOT create a new event loop - it uses synchronous file I/O.
    Safe to call from both sync and async contexts.
    """
    tenant_id = os.getenv("TENANT", "demo")
    return tenant_manager.load_from_file_sync(tenant_id)


def load_tenant_config_sync(tenant_id: str) -> TenantConfig:
    """
    Load tenant configuration synchronously.
    This function does NOT create a new event loop - it uses synchronous file I/O.
    Safe to call from both sync and async contexts.
    """
    return tenant_manager.load_from_file_sync(tenant_id)


async def get_current_tenant_async() -> TenantConfig:
    """
    Get current tenant configuration asynchronously.
    Use this when you're already in an async context and want caching benefits.
    """
    tenant_id = os.getenv("TENANT", "demo")
    return await tenant_manager.load_from_file(tenant_id)


async def load_tenant_config_async(tenant_id: str) -> TenantConfig:
    """
    Load tenant configuration asynchronously.
    Use this when you're already in an async context and want caching benefits.
    """
    return await tenant_manager.load_from_file(tenant_id)


# Legacy aliases for backwards compatibility
get_current_tenant = get_current_tenant_sync
load_tenant_config = load_tenant_config_sync


# Export for use in other modules
__all__ = [
    "TenantConfig",
    "TenantManager",
    "tenant_manager",
    "get_current_tenant",
    "load_tenant_config",
    "get_current_tenant_sync",
    "load_tenant_config_sync",
    "get_current_tenant_async",
    "load_tenant_config_async",
]
