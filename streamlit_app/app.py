"""
Enhanced Streamlit application v2.0 - Modern UI with advanced features
"""
import asyncio
import os
import sys
import inspect
from pathlib import Path
import streamlit as st
from typing import Dict, Any, List, Optional, Union
import json
import time
from datetime import datetime

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import API client and demo data
from streamlit_app.api_client import get_api_client, APIResponse
from streamlit_app.demo_data import (
    DEMO_DATA, DASHBOARD_METRICS, MONTHLY_REVENUE_DATA,
    PROJECT_STATUS_DATA, RECENT_ACTIVITIES
)


class ModernTenant:
    """Enhanced tenant configuration with modern features"""
    
    def __init__(self, tenant_id: str = "demo") -> None:
        self.id = tenant_id
        self.name = "LIS System v2.0"
        self.logo_url = ""
        self.primary_color = "#2563eb"
        self.secondary_color = "#64748b"
        self.accent_color = "#f59e0b"
        self.enabled_modules = [
            "services", "materials", "projects", "time_pairs", "revenue",
            "vehicle_costs", "material_usage", "employees", "users", "inspections",
            "morningplan", "nachkalkulation"
        ]
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
        self.settings = {
            "date_format": "dd.mm.yyyy",
            "time_format": "24h",
            "currency": "EUR",
            "language": "de",
            "decimal_separator": ",",
            "vat_rate": 20.0
        }
        self.ui_preferences = {
            "sidebar_collapsed": False,
            "default_view": "dashboard",
            "items_per_page": 25,
            "compact_mode": False,
            "show_tooltips": True,
            "animations": True
        }
    
    def is_module_enabled(self, module_name: str) -> bool:
        """Check if module is enabled"""
        return module_name in self.enabled_modules


# Global API client instance (lazy-loaded)
_api_client = None


def get_client():
    """Get or create the API client"""
    global _api_client
    if _api_client is None:
        _api_client = get_api_client()
    return _api_client


def get_current_tenant() -> ModernTenant:
    """Get mock tenant"""
    return ModernTenant(os.getenv("TENANT", "demo"))


def load_tenant_config(tenant_id: str) -> ModernTenant:
    """Load mock tenant config"""
    return ModernTenant(tenant_id)


def setup_page_config() -> None:
    """Enhanced Streamlit page configuration with tenant theme"""
    tenant = get_current_tenant()
    
    # Set page config
    st.set_page_config(
        page_title=f"{tenant.name} - LIS System v2.0",
        page_icon="📦",
        layout="wide",
        initial_sidebar_state="expanded",
        menu_items={
            "Get Help": "https://example.com/help",
            "Report a bug": "https://example.com/feedback",
            "About": f"LIS White-Label System v2.0 - {tenant.name}"
        }
    )
    
    # Apply custom theme
    theme = f"""
    <style>
    :root {{
        --primary-color: {tenant.primary_color};
        --secondary-color: {tenant.secondary_color};
        --accent-color: {tenant.accent_color};
    }}
    
    /* Enhanced button styling */
    .stButton > button {{
        background: linear-gradient(135deg, {tenant.primary_color}, {tenant.primary_color}dd);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-weight: 600;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }}
    
    .stButton > button:hover {{
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }}
    
    /* Enhanced sidebar */
    .st-emotion-cache-1vbd788 {{
        background: linear-gradient(180deg, {tenant.primary_color}, {tenant.primary_color}ee);
    }}
    
    /* Modern cards */
    .metric-card {{
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
        transition: all 0.2s ease;
    }}
    
    .metric-card:hover {{
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }}
    
    /* Improved tables */
    .stDataFrame {{
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }}
    
    /* Modern info boxes */
    .info-box {{
        background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
        border-left: 4px solid {tenant.primary_color};
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
    }}
    
    /* Animated elements */
    @keyframes fadeIn {{
        from {{ opacity: 0; transform: translateY(10px); }}
        to {{ opacity: 1; transform: translateY(0); }}
    }}
    
    .fade-in {{
        animation: fadeIn 0.3s ease-out;
    }}
    
    /* Status badges */
    .status-badge {{
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 500;
    }}
    
    .status-active {{ background: #dcfce7; color: #166534; }}
    .status-completed {{ background: #dbeafe; color: #1e40af; }}
    .status-pending {{ background: #fef3c7; color: #92400e; }}
    .status-cancelled {{ background: #fee2e2; color: #991b1b; }}
    
    /* Progress indicators */
    .progress-bar {{
        background: #f3f4f6;
        border-radius: 10px;
        overflow: hidden;
    }}
    
    .progress-fill {{
        background: linear-gradient(90deg, {tenant.primary_color}, {tenant.accent_color});
        height: 8px;
        border-radius: 10px;
        transition: width 0.3s ease;
    }}
    </style>
    """
    st.markdown(theme, unsafe_allow_html=True)


def discover_streamlit_pages() -> Dict[str, Any]:
    """
    Get Streamlit pages from modules.
    Returns dict of {page_name: render_function}
    """
    pages: Dict[str, Any] = {
        "services": None,
        "materials": None,
        "projects": None,
        "time_pairs": None,
        "revenue": None,
        "vehicle_costs": None,
        "material_usage": None,
        "employees": None,
        "users": None,
        "inspections": None,
        "morningplan": None,
        "nachkalkulation": None
    }
    
    # Import pages dynamically from backend modules
    try:
        from streamlit_app.modules.services import page as services_page
        pages["services"] = services_page
    except ImportError:
        try:
            from backend.modules.services.streamlit import page as services_page
            pages["services"] = services_page
        except ImportError:
            pass
    
    try:
        from backend.modules.materials.streamlit import page as materials_page
        pages["materials"] = materials_page
    except ImportError:
        pass
    
    try:
        from backend.modules.projects.streamlit import page as projects_page
        pages["projects"] = projects_page
    except ImportError:
        pass
    
    try:
        from backend.modules.time_pairs.streamlit import page as time_pairs_page
        pages["time_pairs"] = time_pairs_page
    except ImportError:
        pass
    
    try:
        from backend.modules.revenue.streamlit import page as revenue_page
        pages["revenue"] = revenue_page
    except ImportError:
        pass
    
    try:
        from backend.modules.vehicle_costs.streamlit import page as vehicle_costs_page
        pages["vehicle_costs"] = vehicle_costs_page
    except ImportError:
        pass
    
    try:
        from backend.modules.material_usage.streamlit import page as material_usage_page
        pages["material_usage"] = material_usage_page
    except ImportError:
        pass
    
    try:
        from backend.modules.employees.streamlit import page as employees_page
        pages["employees"] = employees_page
    except ImportError:
        pass
    
    try:
        from backend.modules.users.streamlit import page as users_page
        pages["users"] = users_page
    except ImportError:
        pass
    
    try:
        from backend.modules.inspections.streamlit import page as inspections_page
        pages["inspections"] = inspections_page
    except ImportError:
        pass
    
    try:
        from streamlit_app.modules.morningplan import streamlit as morningplan_ui
        pages["morningplan"] = morningplan_ui.render_morningplan_page
    except ImportError:
        try:
            from backend.modules.morningplan.streamlit import render_morningplan_page
            pages["morningplan"] = render_morningplan_page
        except ImportError:
            pass
    
    try:
        from streamlit_app.modules.nachkalkulation import streamlit as nachkalkulation_ui
        pages["nachkalkulation"] = nachkalkulation_ui.render_nachkalkulation_page
    except ImportError:
        try:
            from backend.modules.nachkalkulation.streamlit import render_nachkalkulation_page
            pages["nachkalkulation"] = render_nachkalkulation_page
        except ImportError:
            pass
    
    return pages


def get_page_title(module_name: str) -> str:
    """Get German page title for module"""
    titles = {
        "services": "Leistungskatalog",
        "materials": "Materialkatalog", 
        "projects": "Projekte",
        "time_pairs": "Zeiterfassung",
        "revenue": "Einnahmen",
        "vehicle_costs": "Fahrzeugkosten",
        "material_usage": "Materialverbrauch",
        "employees": "Mitarbeiter",
        "users": "Benutzer & Mitarbeiter",
        "inspections": "Besichtigungen",
        "morningplan": "Morningplan",
        "nachkalkulation": "Nachkalkulation"
    }
    return titles.get(module_name, module_name.title())


def get_module_icon(module_name: str) -> str:
    """Get icon for module"""
    icons = {
        "services": "📦",
        "materials": "📦",
        "projects": "📋",
        "time_pairs": "⏰",
        "revenue": "💰",
        "vehicle_costs": "🚚",
        "material_usage": "📊",
        "employees": "👥",
        "users": "👥",
        "inspections": "🔍",
        "morningplan": "🌅",
        "nachkalkulation": "💰"
    }
    return icons.get(module_name, "📄")


def check_api_status() -> bool:
    """Check if API is available"""
    client = get_client()
    response = client.get("/health")
    return response.success


def render_sidebar(pages: Dict[str, Any]) -> Optional[str]:
    """Enhanced sidebar with modern design"""
    tenant = get_current_tenant()
    
    with st.sidebar:
        # Header with logo and tenant info
        st.markdown(f"""
        <div style='text-align: center; padding: 1rem 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 1rem;'>
            <h3 style='margin: 0; color: {tenant.primary_color};'>{tenant.name}</h3>
            <p style='margin: 0.5rem 0 0 0; color: #6b7280; font-size: 0.875rem;'>LIS System v2.0</p>
        </div>
        """, unsafe_allow_html=True)
        
        # API status indicator
        api_available = check_api_status()
        if api_available:
            st.success("🟢 API Connected")
        else:
            st.info("🎭 Demo Mode (Sample Data)")
        
        st.markdown("---")
        
        # Quick stats from demo data
        with st.expander("📊 Quick Overview", expanded=True):
            st.metric("Active Projects", DASHBOARD_METRICS["active_projects"], delta=DASHBOARD_METRICS["active_projects_delta"])
            st.metric("Open Inspections", DASHBOARD_METRICS["open_inspections"], delta=DASHBOARD_METRICS["open_inspections_delta"])
            st.metric("Employees", DASHBOARD_METRICS["total_employees"], delta=None)
        
        # Navigation
        st.markdown("### Navigation")
        
        # Filter pages by enabled modules and availability
        enabled_pages = {}
        for module_name, render_func in pages.items():
            if tenant.is_module_enabled(module_name) and render_func:
                enabled_pages[module_name] = render_func
        
        # Create navigation buttons with modern styling
        selected_page = None
        for module_name in enabled_pages.keys():
            page_title = get_page_title(module_name)
            icon = get_module_icon(module_name)
            
            if st.button(f"{icon} {page_title}", use_container_width=True, key=f"nav_{module_name}"):
                selected_page = module_name
        
        st.markdown("---")
        
        # Quick actions
        st.markdown("### Quick Actions")
        
        if st.button("📋 New Project", use_container_width=True):
            st.session_state.quick_action = "new_project"
        
        if st.button("🔍 New Inspection", use_container_width=True):
            st.session_state.quick_action = "new_inspection"
        
        if st.button("⏰ Track Time", use_container_width=True):
            st.session_state.quick_action = "new_time"
        
        st.markdown("---")
        
        # System info
        with st.expander("⚙️ System"):
            st.json({
                "Version": "2.0.0",
                "API": "FastAPI",
                "Database": "PostgreSQL",
                "Caching": "Redis",
                "Frontend": "Streamlit"
            })
        
        return selected_page


def show_dashboard(pages: Dict[str, Any], tenant: ModernTenant) -> None:
    """Enhanced dashboard with modern layout"""
    
    st.markdown(f"# Welcome to {tenant.name}")
    
    # Feature highlights
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Active Projects", DASHBOARD_METRICS["active_projects"], delta=DASHBOARD_METRICS["active_projects_delta"], help="Currently running projects")
    
    with col2:
        st.metric("Open Inspections", DASHBOARD_METRICS["open_inspections"], delta=DASHBOARD_METRICS["open_inspections_delta"], help="Scheduled customer appointments")
    
    with col3:
        st.metric("Employees", DASHBOARD_METRICS["total_employees"], help="Active employees")
    
    with col4:
        st.metric("Total Revenue", f"€{DASHBOARD_METRICS['total_revenue']:,}", delta=DASHBOARD_METRICS["revenue_delta"], help="This month")
    
    # Charts section
    st.markdown("### 📊 Performance Overview")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Monthly revenue chart
        import pandas as pd
        revenue_data = pd.DataFrame(MONTHLY_REVENUE_DATA)
        revenue_data.columns = ['Month', 'Revenue']
        st.line_chart(revenue_data.set_index('Month'))
    
    with col2:
        # Project status bar chart
        status_data = pd.DataFrame(PROJECT_STATUS_DATA)
        status_data.columns = ['Status', 'Count']
        st.bar_chart(status_data.set_index('Status'))
    
    # Recent activity
    st.markdown("### 🔔 Recent Activities")
    
    for activity in RECENT_ACTIVITIES:
        st.markdown(f"""
        <div class='info-box' style='margin: 0.5rem 0; padding: 0.75rem;'>
            <strong>{activity['icon']} {activity['action']}</strong><br>
            <small style='color: #6b7280;'>{activity['user']} • {activity['time']}</small>
        </div>
        """, unsafe_allow_html=True)
    
    # Quick access cards
    st.markdown("### ⚡ Quick Access")
    
    # Filter to only modules with render functions
    available_modules = [(name, func) for name, func in pages.items() if func and tenant.is_module_enabled(name)]
    
    if available_modules:
        cols = st.columns(min(len(available_modules), 6))
        
        for idx, (module_name, render_func) in enumerate(available_modules[:6]):
            with cols[idx % len(cols)]:
                page_title = get_page_title(module_name)
                icon = get_module_icon(module_name)
                
                st.markdown(f"""
                <div class='metric-card' style='cursor: pointer; text-align: center;'>
                    <div style='font-size: 2rem; margin-bottom: 0.5rem;'>{icon}</div>
                    <div style='font-weight: 600;'>{page_title}</div>
                </div>
                """, unsafe_allow_html=True)


def main() -> None:
    """Main application entry point v2.0"""
    
    # Setup page
    setup_page_config()
    
    # Get tenant
    tenant_id = os.getenv("TENANT", "demo")
    tenant = load_tenant_config(tenant_id)
    
    # Discover available pages
    pages = discover_streamlit_pages()
    
    if not pages:
        st.error("No pages found.")
        return
    
    # Check for quick actions
    if 'quick_action' in st.session_state:
        if st.session_state.quick_action == "new_project":
            st.session_state.current_page = "projects"
        elif st.session_state.quick_action == "new_inspection":
            st.session_state.current_page = "inspections"
        elif st.session_state.quick_action == "new_time":
            st.session_state.current_page = "time_pairs"
        del st.session_state.quick_action
    
    # Render sidebar and get selection
    selected_page = render_sidebar(pages)
    
    # Update current page in session
    if 'current_page' not in st.session_state:
        st.session_state.current_page = None
    
    if selected_page:
        st.session_state.current_page = selected_page
        st.rerun()
    
    # Get current page from session
    current_page = st.session_state.current_page
    
    # Show appropriate content
    if not current_page or current_page not in pages or not tenant.is_module_enabled(current_page):
        show_dashboard(pages, tenant)
    else:
        # Render selected page
        try:
            if pages.get(current_page):
                result = pages[current_page]()
                if inspect.iscoroutine(result):
                    try:
                        asyncio.run(result)
                    except RuntimeError:
                        # Fallback when a loop is already running
                        loop = asyncio.new_event_loop()
                        try:
                            loop.run_until_complete(result)
                        finally:
                            loop.close()
            else:
                st.info(
                    "This module UI isn't available locally. "
                    "Install the Streamlit module or enable the API-backed UI."
                )
        except Exception as e:
            st.error(f"Error rendering page: {e}")
            if st.button("← Back to Dashboard"):
                st.session_state.current_page = None
                st.rerun()


if __name__ == "__main__":
    main()
