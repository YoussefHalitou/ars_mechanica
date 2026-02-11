"""
Streamlit page for materials module (Materialkatalog)
"""
import streamlit as st
import pandas as pd
from typing import Dict, Any, Optional
import uuid

# Import shared components
from streamlit_app.utils.api import api_request, get_api_url
from streamlit_app.utils.tenant import get_tenant_config


def page():
    """Main page function for materials catalog"""
    st.title("Materialkatalog")
    
    # Get tenant config
    tenant = get_tenant_config()
    
    # Check if module is enabled
    if not tenant.is_module_enabled("materials"):
        st.error("Dieses Modul ist für Ihren Mandanten nicht aktiviert.")
        return
    
    # Add material button
    col1, col2, col3 = st.columns([1, 1, 1])
    with col1:
        if st.button("➕ Neues Material", use_container_width=True):
            st.session_state.show_material_form = True
    
    with col2:
        # Category filter
        categories = load_categories()
        selected_category = st.selectbox("Kategorie", ["Alle"] + categories, key="category_filter")
    
    with col3:
        if st.button("📊 CSV Export", use_container_width=True):
            export_csv()
    
    # Show material form in sidebar or modal
    if st.session_state.get('show_material_form', False):
        st.subheader("Neues Material anlegen")
        render_material_create_form()
        return
    
    # Show edit form if editing
    if st.session_state.get('editing_material_id'):
        st.subheader("Material bearbeiten")
        render_material_edit_form(st.session_state.editing_material_id)
        return
    
    # Load and display materials
    load_materials_table(selected_category)


def load_categories():
    """Load material categories"""
    response = api_request("GET", "/api/materials/categories/list")
    
    if response.get('success'):
        return response.get('data', [])
    return []


def load_materials_table(category_filter="Alle"):
    """Load and display materials in an editable grid"""
    
    params = {"limit": 1000}
    if category_filter != "Alle":
        params["category"] = category_filter
    
    with st.spinner("Lade Materialien..."):
        response = api_request("GET", "/api/materials/", params=params)
    
    if not response.get('success'):
        st.error(f"Fehler beim Laden: {response.get('message', 'Unbekannter Fehler')}")
        return
    
    materials_data = response.get('data', {}).get('items', [])
    
    if not materials_data:
        st.info("Noch keine Materialien vorhanden. Klicken Sie auf 'Neues Material' um zu beginnen.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(materials_data)
    
    # Prepare display columns
    display_columns = {
        'name': 'Bezeichnung',
        'unit': 'Einheit',
        'category': 'Kategorie',
        'cost_per_unit': 'Einkaufspreis',
        'price_per_unit': 'Verkaufspreis',
        'margin': 'Marge',
        'vat_rate': 'MwSt. %',
        'is_active': 'Aktiv'
    }
    
    # Select and rename columns
    df_display = df[list(display_columns.keys())].copy()
    df_display.columns = list(display_columns.values())
    
    # Format numeric columns
    df_display['Einkaufspreis'] = df_display['Einkaufspreis'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "-")
    df_display['Verkaufspreis'] = df_display['Verkaufspreis'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "-")
    df_display['Marge'] = df_display['Marge'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "-")
    df_display['MwSt. %'] = df_display['MwSt. %'].apply(lambda x: f"{x:.1f}%" if pd.notna(x) else "19.0%")
    df_display['Aktiv'] = df_display['Aktiv'].apply(lambda x: "✓" if x else "✗")
    
    # Add action column
    df_display['Aktionen'] = df['material_id'].apply(lambda material_id: f"Edit|Delete")
    
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
            st.session_state.editing_material_id = action['material_id']
            st.rerun()
        elif action['type'] == 'delete':
            delete_material(action['material_id'])


def render_material_create_form():
    """Render form for creating a new material"""
    
    with st.form("create_material_form"):
        name = st.text_input("Bezeichnung *", key="material_name")
        
        col1, col2 = st.columns(2)
        with col1:
            unit = st.selectbox("Einheit *", ["Stück", "m", "Rolle", "Paket", "kg", "Liter"], key="material_unit")
            category = st.text_input("Kategorie", key="material_category")
        with col2:
            vat_rate = st.number_input("MwSt. %", min_value=0.0, max_value=100.0, value=19.0, step=0.1, key="material_vat")
            default_quantity = st.number_input("Standardmenge", min_value=0.0, step=0.1, key="material_default_qty")
        
        # Pricing section
        st.markdown("---")
        st.markdown("**Preise**")
        col3, col4 = st.columns(2)
        with col3:
            cost_per_unit = st.number_input("Einkaufspreis pro Einheit", min_value=0.0, step=0.01, key="material_cost")
        with col4:
            price_per_unit = st.number_input("Verkaufspreis pro Einheit", min_value=0.0, step=0.01, key="material_price")
        
        is_active = st.checkbox("Aktiv", value=True, key="material_active")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("💾 Speichern", use_container_width=True):
                if not name or not unit:
                    st.error("Bitte füllen Sie alle Pflichtfelder aus.")
                else:
                    create_material({
                        'name': name,
                        'unit': unit,
                        'category': category,
                        'vat_rate': vat_rate,
                        'default_quantity': default_quantity if default_quantity > 0 else None,
                        'is_active': is_active
                    }, cost_per_unit, price_per_unit)
        
        with col2:
            if st.form_submit_button("❌ Abbrechen", use_container_width=True):
                st.session_state.show_material_form = False
                st.rerun()


def render_material_edit_form(material_id: str):
    """Render form for editing an existing material"""
    
    # Load material data
    response = api_request("GET", f"/api/materials/{material_id}")
    if not response.get('success'):
        st.error("Material nicht gefunden")
        return
    
    material = response.get('data')
    
    with st.form("edit_material_form"):
        name = st.text_input("Bezeichnung *", value=material.get('name', ''), key="edit_material_name")
        
        col1, col2 = st.columns(2)
        with col1:
            unit_options = ["Stück", "m", "Rolle", "Paket", "kg", "Liter"]
            current_unit = material.get('unit', 'Stück')
            unit = st.selectbox("Einheit *", unit_options, index=unit_options.index(current_unit) if current_unit in unit_options else 0, key="edit_material_unit")
            category = st.text_input("Kategorie", value=material.get('category', ''), key="edit_material_category")
        with col2:
            vat_rate = st.number_input("MwSt. %", min_value=0.0, max_value=100.0, value=float(material.get('vat_rate', 19.0)), step=0.1, key="edit_material_vat")
            default_quantity = st.number_input("Standardmenge", min_value=0.0, value=float(material.get('default_quantity', 0)) if material.get('default_quantity') else 0.0, step=0.1, key="edit_material_default_qty")
        
        # Pricing section
        st.markdown("---")
        st.markdown("**Preise**")
        col3, col4 = st.columns(2)
        with col3:
            cost_per_unit = st.number_input("Einkaufspreis pro Einheit", min_value=0.0, value=float(material.get('cost_per_unit', 0)) if material.get('cost_per_unit') else 0.0, step=0.01, key="edit_material_cost")
        with col4:
            price_per_unit = st.number_input("Verkaufspreis pro Einheit", min_value=0.0, value=float(material.get('price_per_unit', 0)) if material.get('price_per_unit') else 0.0, step=0.01, key="edit_material_price")
        
        is_active = st.checkbox("Aktiv", value=material.get('is_active', True), key="edit_material_active")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("💾 Speichern", use_container_width=True):
                if not name or not unit:
                    st.error("Bitte füllen Sie alle Pflichtfelder aus.")
                else:
                    update_material(material_id, {
                        'name': name,
                        'unit': unit,
                        'category': category,
                        'vat_rate': vat_rate,
                        'default_quantity': default_quantity if default_quantity > 0 else None,
                        'is_active': is_active
                    }, cost_per_unit, price_per_unit)
        
        with col2:
            if st.form_submit_button("❌ Abbrechen", use_container_width=True):
                st.session_state.editing_material_id = None
                st.rerun()


def create_material(material_data: Dict[str, Any], cost_per_unit: float, price_per_unit: float):
    """Create a new material via API"""
    
    response = api_request("POST", "/api/materials/", json=material_data)
    
    if response.get('success'):
        material_id = response.get('data', {}).get('material_id')
        
        # Set prices if provided
        if cost_per_unit > 0 or price_per_unit > 0:
            api_request("POST", f"/api/materials/{material_id}/prices", json={
                'cost_per_unit': cost_per_unit if cost_per_unit > 0 else None,
                'price_per_unit': price_per_unit if price_per_unit > 0 else None
            })
        
        st.success("Material erfolgreich erstellt!")
        st.session_state.show_material_form = False
        st.rerun()
    else:
        st.error(f"Fehler: {response.get('message', 'Unbekannter Fehler')}")


def update_material(material_id: str, update_data: Dict[str, Any], cost_per_unit: float, price_per_unit: float):
    """Update an existing material via API"""
    
    response = api_request("PUT", f"/api/materials/{material_id}", json=update_data)
    
    if response.get('success'):
        # Update prices
        api_request("POST", f"/api/materials/{material_id}/prices", json={
            'cost_per_unit': cost_per_unit if cost_per_unit > 0 else None,
            'price_per_unit': price_per_unit if price_per_unit > 0 else None
        })
        
        st.success("Material erfolgreich aktualisiert!")
        st.session_state.editing_material_id = None
        st.rerun()
    else:
        st.error(f"Fehler: {response.get('message', 'Unbekannter Fehler')}")


def delete_material(material_id: str):
    """Delete a material via API"""
    
    if st.button(f"🗑️ Material löschen?", key=f"confirm_delete_{material_id}"):
        response = api_request("DELETE", f"/api/materials/{material_id}")
        
        if response.get('success'):
            st.success("Material gelöscht!")
            st.rerun()
        else:
            st.error(f"Fehler: {response.get('message', 'Unbekannter Fehler')}")


def export_csv():
    """Export materials to CSV"""
    
    response = api_request("GET", "/api/materials/", params={"limit": 10000})
    
    if response.get('success'):
        materials = response.get('data', {}).get('items', [])
        df = pd.DataFrame(materials)
        
        if not df.empty:
            # Select relevant columns
            export_columns = ['name', 'unit', 'category', 'cost_per_unit', 'price_per_unit', 'vat_rate', 'is_active']
            df_export = df[export_columns]
            
            # Rename columns for German CSV
            column_names = {
                'name': 'Bezeichnung',
                'unit': 'Einheit',
                'category': 'Kategorie',
                'cost_per_unit': 'Einkaufspreis',
                'price_per_unit': 'Verkaufspreis',
                'vat_rate': 'MwSt_Prozent',
                'is_active': 'Aktiv'
            }
            df_export.rename(columns=column_names, inplace=True)
            
            csv = df_export.to_csv(index=False, sep=';')
            st.download_button(
                label="📥 CSV herunterladen",
                data=csv,
                file_name="materialkatalog.csv",
                mime="text/csv"
            )
    else:
        st.error("Export fehlgeschlagen")


# For backward compatibility / module auto-discovery
def render():
    page()
