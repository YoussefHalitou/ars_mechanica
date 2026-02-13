"""
Streamlit page for services module (Leistungskatalog)
"""
import streamlit as st
import pandas as pd
import requests
from typing import Dict, Any, Optional, List
import uuid

# Import shared components
from streamlit_app.components.grid import render_editable_grid
from streamlit_app.components.forms import render_service_form
from streamlit_app.utils.api import api_request, get_api_url
from streamlit_app.utils.tenant import get_tenant_config


def page():
    """Main page function for services catalog"""
    st.title("Leistungskatalog")
    
    # Get tenant config
    tenant = get_tenant_config()
    
    # Check if module is enabled
    if not tenant.is_module_enabled("services"):
        st.error("Dieses Modul ist für Ihren Mandanten nicht aktiviert.")
        return
    
    # Add service button
    col1, col2, col3 = st.columns([1, 1, 1])
    with col1:
        if st.button("➕ Neue Leistung", use_container_width=True):
            st.session_state.show_service_form = True
    
    with col2:
        # CSV Upload
        uploaded_file = st.file_uploader("📁 CSV Import", type=['csv'], key="csv_upload")
        if uploaded_file is not None and st.button("📥 Importieren", use_container_width=True):
            import_csv(uploaded_file)
    
    with col3:
        if st.button("📊 CSV Export", use_container_width=True):
            export_csv()
    
    # Show service form in sidebar or modal
    if st.session_state.get('show_service_form', False):
        st.subheader("Neue Leistung anlegen")
        render_service_create_form()
        return
    
    # Show edit form if editing
    if st.session_state.get('editing_service_id'):
        st.subheader("Leistung bearbeiten")
        render_service_edit_form(st.session_state.editing_service_id)
        return
    
    # Load and display services
    load_services_table()


def load_services_table():
    """Load and display services in an editable grid"""
    
    with st.spinner("Lade Leistungen..."):
        response = api_request("GET", "/api/services/", params={"limit": 1000})
    
    if not response.get('success'):
        st.error(f"Fehler beim Laden: {response.get('message', 'Unbekannter Fehler')}")
        return
    
    services_data = response.get('data', {}).get('items', [])
    
    if not services_data:
        st.info("Noch keine Leistungen vorhanden. Klicken Sie auf 'Neue Leistung' um zu beginnen.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(services_data)
    
    # Prepare display columns
    display_columns = {
        'name': 'Bezeichnung',
        'description': 'Beschreibung',
        'category': 'Kategorie',
        'unit': 'Einheit',
        'price_per_unit': 'Preis/Unit',
        'cost_per_unit': 'Kosten/Unit',
        'margin': 'Marge',
        'active': 'Aktiv'
    }
    
    # Select and rename columns
    df_display = df[list(display_columns.keys())].copy()
    df_display.columns = list(display_columns.values())
    
    # Format numeric columns
    df_display['Preis/Unit'] = df_display['Preis/Unit'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "")
    df_display['Kosten/Unit'] = df_display['Kosten/Unit'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "")
    df_display['Marge'] = df_display['Marge'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "")
    df_display['Aktiv'] = df_display['Aktiv'].apply(lambda x: "✓" if x else "✗")
    
    # Add action column
    df_display['Aktionen'] = df['id'].apply(lambda service_id: f"Edit|Delete")
    
    st.dataframe(
        df_display,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Aktionen": st.column_config.TextColumn(
                "Aktionen",
                help="Klicken Sie auf eine Zelle um Aktionen auszuführen"
            )
        }
    )
    
    # Handle row actions
    if st.session_state.get('grid_action'):
        action = st.session_state.grid_action
        if action['type'] == 'edit':
            st.session_state.editing_service_id = action['service_id']
            st.rerun()
        elif action['type'] == 'delete':
            delete_service(action['service_id'])


def render_service_create_form():
    """Render form for creating a new service"""
    
    with st.form("create_service_form"):
        name = st.text_input("Bezeichnung *", key="service_name")
        description = st.text_area("Beschreibung", key="service_description")
        category = st.text_input("Kategorie", key="service_category")
        unit = st.selectbox("Einheit", ["Stunde", "m²", "Pauschal", "Stück", "lfdm", "kg"], key="service_unit")
        
        col1, col2 = st.columns(2)
        with col1:
            price_per_unit = st.number_input("Preis pro Einheit *", min_value=0.0, step=0.01, key="service_price")
        with col2:
            cost_per_unit = st.number_input("Kosten pro Einheit", min_value=0.0, step=0.01, key="service_cost")
        
        active = st.checkbox("Aktiv", value=True, key="service_active")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("💾 Speichern", use_container_width=True):
                if not name or not price_per_unit:
                    st.error("Bitte füllen Sie alle Pflichtfelder aus.")
                else:
                    create_service({
                        'name': name,
                        'description': description,
                        'category': category,
                        'unit': unit,
                        'price_per_unit': price_per_unit,
                        'cost_per_unit': cost_per_unit if cost_per_unit > 0 else None,
                        'active': active
                    })
        
        with col2:
            if st.form_submit_button("❌ Abbrechen", use_container_width=True):
                st.session_state.show_service_form = False
                st.rerun()


def render_service_edit_form(service_id: str):
    """Render form for editing an existing service"""
    
    # Load service data
    response = api_request("GET", f"/api/services/{service_id}")
    if not response.get('success'):
        st.error("Leistung nicht gefunden")
        return
    
    service = response.get('data')
    
    with st.form("edit_service_form"):
        name = st.text_input("Bezeichnung *", value=service.get('name', ''), key="edit_service_name")
        description = st.text_area("Beschreibung", value=service.get('description', ''), key="edit_service_description")
        category = st.text_input("Kategorie", value=service.get('category', ''), key="edit_service_category")
        unit = st.selectbox("Einheit", ["Stunde", "m²", "Pauschal", "Stück", "lfdm", "kg"], 
                           index=["Stunde", "m²", "Pauschal", "Stück", "lfdm", "kg"].index(service.get('unit', 'Stunde')),
                           key="edit_service_unit")
        
        col1, col2 = st.columns(2)
        with col1:
            price_per_unit = st.number_input("Preis pro Einheit *", min_value=0.0, step=0.01, 
                                             value=float(service.get('price_per_unit', 0)), key="edit_service_price")
        with col2:
            cost_per_unit = st.number_input("Kosten pro Einheit", min_value=0.0, step=0.01,
                                            value=float(service.get('cost_per_unit', 0)) if service.get('cost_per_unit') else 0.0,
                                            key="edit_service_cost")
        
        active = st.checkbox("Aktiv", value=service.get('active', True), key="edit_service_active")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("💾 Speichern", use_container_width=True):
                if not name or not price_per_unit:
                    st.error("Bitte füllen Sie alle Pflichtfelder aus.")
                else:
                    update_service(service_id, {
                        'name': name,
                        'description': description,
                        'category': category,
                        'unit': unit,
                        'price_per_unit': price_per_unit,
                        'cost_per_unit': cost_per_unit if cost_per_unit > 0 else None,
                        'active': active
                    })
        
        with col2:
            if st.form_submit_button("❌ Abbrechen", use_container_width=True):
                st.session_state.editing_service_id = None
                st.rerun()


def create_service(service_data: Dict[str, Any]):
    """Create a new service via API"""
    
    response = api_request("POST", "/api/services/", json=service_data)
    
    if response.get('success'):
        st.success("Leistung erfolgreich erstellt!")
        st.session_state.show_service_form = False
        st.rerun()
    else:
        st.error(f"Fehler: {response.get('message', 'Unbekannter Fehler')}")


def update_service(service_id: str, update_data: Dict[str, Any]):
    """Update an existing service via API"""
    
    response = api_request("PUT", f"/api/services/{service_id}", json=update_data)
    
    if response.get('success'):
        st.success("Leistung erfolgreich aktualisiert!")
        st.session_state.editing_service_id = None
        st.rerun()
    else:
        st.error(f"Fehler: {response.get('message', 'Unbekannter Fehler')}")


def delete_service(service_id: str):
    """Delete a service via API"""
    
    if st.button(f"🗑️ Leistung löschen?", key=f"confirm_delete_{service_id}"):
        response = api_request("DELETE", f"/api/services/{service_id}")
        
        if response.get('success'):
            st.success("Leistung gelöscht!")
            st.rerun()
        else:
            st.error(f"Fehler: {response.get('message', 'Unbekannter Fehler')}")


def import_csv(file: Any):
    """Import services from CSV"""
    
    files = {'file': (file.name, file.getvalue(), 'text/csv')}
    response = api_request("POST", "/api/services/import/csv", files=files)
    
    if response.get('success'):
        st.success(f"CSV erfolgreich importiert!")
        st.rerun()
    else:
        st.error(f"Import fehlgeschlagen: {response.get('message', 'Unbekannter Fehler')}")
        if response.get('data', {}).get('errors'):
            with st.expander("Fehlerdetails"):
                for error in response['data']['errors']:
                    st.write(f"• {error}")


def export_csv():
    """Export services to CSV"""
    
    response = api_request("GET", "/api/services/", params={"limit": 10000})
    
    if response.get('success'):
        services = response.get('data', {}).get('items', [])
        df = pd.DataFrame(services)
        
        if not df.empty:
            # Select relevant columns
            export_columns = ['name', 'description', 'category', 'unit', 'price_per_unit', 'cost_per_unit', 'active']
            df_export = df[export_columns]
            
            # Rename columns for German CSV
            column_names = {
                'name': 'Bezeichnung',
                'description': 'Beschreibung',
                'category': 'Kategorie',
                'unit': 'Einheit',
                'price_per_unit': 'Preis_pro_Einheit',
                'cost_per_unit': 'Kosten_pro_Einheit',
                'active': 'Aktiv'
            }
            df_export.rename(columns=column_names, inplace=True)
            
            csv = df_export.to_csv(index=False, sep=';')
            st.download_button(
                label="📥 CSV herunterladen",
                data=csv,
                file_name="leistungskatalog.csv",
                mime="text/csv"
            )
    else:
        st.error("Export fehlgeschlagen")


# For backward compatibility / module auto-discovery
def render():
    page()
