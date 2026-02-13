"""
Streamlit page for projects module (Projekte / Nachkalkulation)
"""
import streamlit as st
import pandas as pd
from datetime import date
from typing import Dict, Any, Optional

# Import shared components
from streamlit_app.utils.api import api_request
from streamlit_app.utils.tenant import get_tenant_config


def page():
    """Main page function for projects"""
    st.title("Projekte & Nachkalkulation")
    
    # Get tenant config
    tenant = get_tenant_config()
    
    # Check if module is enabled
    if not tenant.is_module_enabled("projects"):
        st.error("Dieses Modul ist für Ihren Mandanten nicht aktiviert.")
        return
    
    # Page selection
    page_mode = st.sidebar.selectbox("Ansicht", ["Projektübersicht", "Nachkalkulation"])
    
    if page_mode == "Projektübersicht":
        show_project_overview()
    else:
        show_nachkalkulation()


def show_project_overview():
    """Show project overview"""
    st.subheader("Projektübersicht")
    
    # Add project button
    col1, col2 = st.columns([1, 1])
    with col1:
        if st.button("➕ Neues Projekt"):
            st.session_state.show_project_form = True
            st.rerun()
    
    # Load projects
    response = api_request("GET", "/api/projects/", params={"limit": 100})
    
    if not response.get('success'):
        st.error("Fehler beim Laden der Projekte")
        return
    
    projects_data = response.get('data', {}).get('items', [])
    
    if not projects_data:
        st.info("Noch keine Projekte vorhanden.")
        return
    
    # Display projects table
    df = pd.DataFrame(projects_data)
    
    # Prepare display columns
    display_columns = {
        'project_code': 'Projekt-Nr.',
        'name': 'Kunde',
        'strasse': 'Strasse',
        'plz': 'PLZ',
        'ort': 'Ort',
        'project_date': 'Datum',
        'status': 'Status'
    }
    
    df_display = df[list(display_columns.keys())].copy()
    df_display.columns = list(display_columns.values())
    
    # Format date
    df_display['Datum'] = pd.to_datetime(df_display['Datum']).dt.strftime('%d.%m.%Y')
    
    st.dataframe(
        df_display,
        use_container_width=True,
        hide_index=True
    )


def show_nachkalkulation():
    """Show Nachkalkulation (post-calculation) interface"""
    st.subheader("Nachkalkulation")
    
    # Project picker
    st.markdown("**Projekt auswählen**")
    
    # Search for project
    search_query = st.text_input("Projekt suchen", placeholder="Kundenname oder Projekt-Nr.")
    
    if search_query:
        response = api_request("GET", "/api/projects/search/query", params={
            'q': search_query,
            'limit': 10
        })
        
        if response.get('success') and response.get('data'):
            projects = response.get('data', [])
            project_options = {f"{p.get('name', 'Unbekannt')} ({p.get('project_code', 'N/A')})": p.get('project_id') for p in projects}
            selected_project_label = st.selectbox("Projekt auswählen", list(project_options.keys()))
            
            if selected_project_label:
                selected_project_id = project_options[selected_project_label]
                load_nachkalkulation(selected_project_id)
        else:
            st.info("Keine Projekte gefunden.")
    
    else:
        st.info("Bitte suchen Sie nach einem Projekt.")


def load_nachkalkulation(project_id: str):
    """Load and display Nachkalkulation for a project"""
    
    response = api_request("GET", f"/api/projects/{project_id}/nachkalkulation")
    
    if not response.get('success'):
        st.error("Nachkalkulation nicht gefunden")
        return
    
    data = response.get('data', {})
    
    # Display summary cards
    st.markdown("---")
    st.markdown("**Zusammenfassung**")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        revenue = data.get('revenue_total', 0)
        st.metric("Gesamtumsatz", f"€{revenue:,.2f}")
    
    with col2:
        costs = data.get('cost_total', 0)
        st.metric("Gesamtkosten", f"€{costs:,.2f}")
    
    with col3:
        margin_eur = data.get('marge_eur', 0)
        st.metric("Marge (EUR)", f"€{margin_eur:,.2f}")
    
    with col4:
        margin_pct = data.get('marge_pct', 0)
        st.metric("Marge (%)", f"{margin_pct:.1f}%")
    
    # Display tables
    st.markdown("---")
    
    # Revenue items
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**Einnahmen (Leistungen)**")
        revenue_items = data.get('revenue_items', [])
        if revenue_items:
            df_revenue = pd.DataFrame(revenue_items)
            if not df_revenue.empty:
                df_revenue_display = df_revenue[['position_label', 'qty', 'unit', 'unit_price', 'line_total']].copy()
                df_revenue_display.columns = ['Position', 'Menge', 'Einheit', 'Preis', 'Gesamt']
                df_revenue_display['Preis'] = df_revenue_display['Preis'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "-")
                df_revenue_display['Gesamt'] = df_revenue_display['Gesamt'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "-")
                st.dataframe(df_revenue_display, use_container_width=True, hide_index=True)
        else:
            st.info("Keine Einnahmen eingetragen.")
    
    with col2:
        st.markdown("**Fahrzeugkosten**")
        vehicle_costs = data.get('vehicle_costs', [])
        if vehicle_costs:
            df_vehicle = pd.DataFrame(vehicle_costs)
            if not df_vehicle.empty:
                df_vehicle_display = df_vehicle[['usage_type', 'usage_value', 'cost_per_unit', 'total_cost']].copy()
                df_vehicle_display.columns = ['Typ', 'Menge', 'Preis/Unit', 'Gesamt']
                df_vehicle_display['Preis/Unit'] = df_vehicle_display['Preis/Unit'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "-")
                df_vehicle_display['Gesamt'] = df_vehicle_display['Gesamt'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "-")
                st.dataframe(df_vehicle_display, use_container_width=True, hide_index=True)
        else:
            st.info("Keine Fahrzeugkosten eingetragen.")
    
    # Material usage
    st.markdown("**Materialverbrauch**")
    material_usage = data.get('material_usage', [])
    if material_usage:
        df_material = pd.DataFrame(material_usage)
        if not df_material.empty:
            df_material_display = df_material[['material_id', 'quantity', 'phase']].copy()
            df_material_display.columns = ['Material', 'Menge', 'Phase']
            st.dataframe(df_material_display, use_container_width=True, hide_index=True)
    else:
        st.info("Kein Materialverbrauch eingetragen.")
    
    # Add item buttons
    st.markdown("---")
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("+ Einnahme hinzufügen"):
            st.session_state.adding_revenue = True
    with col2:
        if st.button("+ Fahrzeugkosten hinzufügen"):
            st.session_state.adding_vehicle = True
    with col3:
        if st.button("+ Materialverbrauch"):
            st.session_state.adding_material = True


# For backward compatibility / module auto-discovery
def render():
    page()
