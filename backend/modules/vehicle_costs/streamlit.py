"""
Streamlit page for vehicle costs module
"""
import streamlit as st

# Import shared components
from streamlit_app.utils.tenant import get_tenant_config


def page():
    """Main page function for vehicle costs"""
    st.title("Fahrzeugkosten")
    
    # Get tenant config
    tenant = get_tenant_config()
    
    # Check if module is enabled
    if not tenant.is_module_enabled("vehicle_costs"):
        st.error("Dieses Modul ist für Ihren Mandanten nicht aktiviert.")
        return
    
    st.info("Fahrzeugkosten werden in der Nachkalkulation verwaltet.")
    st.write("Gehen Sie zu 'Projekte & Nachkalkulation' um Fahrzeugkosten zu verwalten.")


def render():
    page()
