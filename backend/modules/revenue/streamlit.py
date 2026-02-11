"""
Streamlit page for revenue module
"""
import streamlit as st

# Import shared components
from streamlit_app.utils.tenant import get_tenant_config


def page():
    """Main page function for revenue"""
    st.title("Einnahmen")
    
    # Get tenant config
    tenant = get_tenant_config()
    
    # Check if module is enabled
    if not tenant.is_module_enabled("revenue"):
        st.error("Dieses Modul ist für Ihren Mandanten nicht aktiviert.")
        return
    
    st.info("Einnahmen werden in der Nachkalkulation verwaltet.")
    st.write("Gehen Sie zu 'Projekte & Nachkalkulation' um Einnahmen zu verwalten.")


def render():
    page()
