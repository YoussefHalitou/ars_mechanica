"""
Streamlit page for test_module module
"""
import streamlit as st
from streamlit_app.utils.tenant import get_tenant_config


def page():
    """Main page function"""
    st.title("test_module")
    
    tenant = get_tenant_config()
    
    if not tenant.is_module_enabled("test_module"):
        st.error("Dieses Modul ist für Ihren Mandanten nicht aktiviert.")
        return
    
    st.write("Page content for test_module module")


def render():
    """Alias for page() for backward compatibility"""
    page()
