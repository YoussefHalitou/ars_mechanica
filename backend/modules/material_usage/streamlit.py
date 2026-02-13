"""
Streamlit page for material usage module
"""
import streamlit as st

# Import shared components
from streamlit_app.utils.tenant import get_tenant_config


def page():
    """Main page function for material usage"""
    st.title("Materialverbrauch")
    
    # Get tenant config
    tenant = get_tenant_config()
    
    # Check if module is enabled
    if not tenant.is_module_enabled("material_usage"):
        st.error("Dieses Modul ist für Ihren Mandanten nicht aktiviert.")
        return
    
    st.info("Materialverbrauch wird in der Nachkalkulation verwaltet.")
    st.write("Gehen Sie zu 'Projekte & Nachkalkulation' um Materialverbrauch zu verwalten.")


def render():
    page()
