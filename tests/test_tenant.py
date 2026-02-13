"""
Tests for tenant configuration system.
"""
import pytest
import os
from pathlib import Path

from backend.core.tenant import (
    TenantConfig,
    TenantManager,
    get_current_tenant_sync,
    load_tenant_config_sync
)


class TestTenantConfig:
    """Tests for TenantConfig dataclass."""
    
    def test_default_values(self):
        """Test that default values are correctly set."""
        config = TenantConfig(name="Test", tenant_id="test")
        
        assert config.name == "Test"
        assert config.tenant_id == "test"
        assert config.primary_color == "#2563eb"
        assert config.features is not None
        assert "real_time" in config.features
    
    def test_is_module_enabled(self):
        """Test module enabled check."""
        config = TenantConfig(
            name="Test",
            tenant_id="test",
            enabled_modules=["services", "projects"]
        )
        
        assert config.is_module_enabled("services") is True
        assert config.is_module_enabled("projects") is True
        assert config.is_module_enabled("nonexistent") is False
    
    def test_has_permission_admin(self):
        """Test admin has all permissions."""
        config = TenantConfig(name="Test", tenant_id="test")
        
        assert config.has_permission("Admin", "anything") is True
        assert config.has_permission("Admin", "read") is True
        assert config.has_permission("Admin", "delete") is True
    
    def test_has_permission_worker(self):
        """Test worker has limited permissions."""
        config = TenantConfig(name="Test", tenant_id="test")
        
        assert config.has_permission("Worker", "read") is True
        assert config.has_permission("Worker", "time_tracking") is True
        assert config.has_permission("Worker", "delete") is False
    
    def test_to_dict(self):
        """Test conversion to dictionary."""
        config = TenantConfig(
            name="Test",
            tenant_id="test",
            primary_color="#ff0000"
        )
        
        data = config.to_dict()
        
        assert data["name"] == "Test"
        assert data["tenant_id"] == "test"
        assert data["primary_color"] == "#ff0000"
    
    def test_from_dict(self):
        """Test creation from dictionary."""
        data = {
            "name": "Test",
            "tenant_id": "test",
            "primary_color": "#00ff00"
        }
        
        config = TenantConfig.from_dict(data)
        
        assert config.name == "Test"
        assert config.tenant_id == "test"
        assert config.primary_color == "#00ff00"


class TestTenantManager:
    """Tests for TenantManager class."""
    
    def test_get_default_config(self):
        """Test getting default configuration."""
        manager = TenantManager()
        config = manager.get_default_config("new_tenant")
        
        assert config.name == "LIS System"
        assert config.tenant_id == "new_tenant"
        assert "services" in config.enabled_modules
    
    def test_load_from_file_sync_default(self):
        """Test loading config when file doesn't exist returns default."""
        manager = TenantManager()
        config = manager.load_from_file_sync("nonexistent_tenant")
        
        assert config is not None
        assert config.tenant_id == "nonexistent_tenant"
    
    def test_sync_cache(self):
        """Test that sync cache works."""
        manager = TenantManager()
        
        # First load
        config1 = manager.load_from_file_sync("cache_test")
        
        # Should be cached
        assert "cache_test" in manager._sync_cache
        
        # Second load should return same instance
        config2 = manager.load_from_file_sync("cache_test")
        assert config1 is config2
        
        # Clear cache
        manager.clear_sync_cache("cache_test")
        assert "cache_test" not in manager._sync_cache


class TestGetCurrentTenant:
    """Tests for get_current_tenant functions."""
    
    def test_get_current_tenant_sync_default(self):
        """Test getting current tenant with default env."""
        # Temporarily unset TENANT env var
        original = os.environ.get("TENANT")
        if "TENANT" in os.environ:
            del os.environ["TENANT"]
        
        try:
            config = get_current_tenant_sync()
            assert config.tenant_id == "demo"
        finally:
            if original:
                os.environ["TENANT"] = original
    
    def test_load_tenant_config_sync(self):
        """Test loading specific tenant config."""
        config = load_tenant_config_sync("test_tenant")
        assert config.tenant_id == "test_tenant"
