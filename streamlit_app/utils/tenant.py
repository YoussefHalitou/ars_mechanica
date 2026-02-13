"""
Tenant utilities for Streamlit app
"""
import os
from backend.core.tenant import load_tenant_config_sync, TenantConfig


def get_tenant_config() -> TenantConfig:
    """Get current tenant configuration for Streamlit"""
    tenant_id = os.getenv("TENANT", "demo")
    return load_tenant_config_sync(tenant_id)


def get_tenant_theme():
    """Get tenant theme configuration for Streamlit"""
    tenant = get_tenant_config()
    
    # Map CSS colors to Streamlit theme
    return {
        "primaryColor": tenant.primary_color,
        "backgroundColor": "#ffffff",
        "secondaryBackgroundColor": "#f0f2f6",
        "textColor": "#262730",
        "font": "sans serif"
    }


def inject_tenant_css():
    """Inject tenant-specific CSS"""
    tenant = get_tenant_config()
    
    css = f"""
    <style>
    /* Primary color overrides */
    .stButton > button {{
        background-color: {tenant.primary_color} !important;
        color: white !important;
        border-color: {tenant.primary_color} !important;
    }}
    
    .stButton > button:hover {{
        background-color: {tenant.primary_color}dd !important;
    }}
    
    /* Sidebar styling */
    [data-testid="stSidebar"] {{
        background-color: #f8f9fa;
    }}
    
    /* Headers */
    h1, h2, h3 {{
        color: {tenant.primary_color} !important;
    }}
    
    /* Links */
    a {{
        color: {tenant.primary_color} !important;
    }}
    
    /* Metric cards */
    [data-testid="stMetricValue"] {{
        color: {tenant.primary_color} !important;
    }}
    </style>
    """
    
    return css
