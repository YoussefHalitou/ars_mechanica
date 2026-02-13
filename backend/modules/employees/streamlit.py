"""
Streamlit page for employees module (Mitarbeiterkatalog)
"""
import streamlit as st
import pandas as pd
from typing import Dict, Any, Optional

# Import shared components
from streamlit_app.utils.api import api_request
from streamlit_app.utils.tenant import get_tenant_config


def page():
    """Main page function for employees catalog"""
    st.title("Mitarbeiterkatalog")
    
    # Get tenant config
    tenant = get_tenant_config()
    
    # Check if module is enabled
    if not tenant.is_module_enabled("employees"):
        st.error("Dieses Modul ist für Ihren Mandanten nicht aktiviert.")
        return
    
    # Add employee button
    col1, col2 = st.columns([1, 1])
    with col1:
        if st.button("➕ Neuer Mitarbeiter", use_container_width=True):
            st.session_state.show_employee_form = True
    
    with col2:
        if st.button("📊 CSV Export", use_container_width=True):
            export_csv()
    
    # Show employee form
    if st.session_state.get('show_employee_form', False):
        st.subheader("Neuen Mitarbeiter anlegen")
        render_employee_create_form()
        return
    
    # Show edit form if editing
    if st.session_state.get('editing_employee_id'):
        st.subheader("Mitarbeiter bearbeiten")
        render_employee_edit_form(st.session_state.editing_employee_id)
        return
    
    # Load and display employees
    load_employees_table()


def load_employees_table():
    """Load and display employees in a table"""
    
    with st.spinner("Lade Mitarbeiter..."):
        response = api_request("GET", "/api/employees/", params={"limit": 1000})
    
    if not response.get('success'):
        st.error(f"Fehler beim Laden: {response.get('message', 'Unbekannter Fehler')}")
        return
    
    employees_data = response.get('data', {}).get('items', [])
    
    if not employees_data:
        st.info("Noch keine Mitarbeiter vorhanden.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(employees_data)
    
    # Prepare display columns
    display_columns = {
        'employee_code': 'Personalnr.',
        'name': 'Name',
        'role': 'Position',
        'phone': 'Telefon',
        'email': 'E-Mail',
        'hourly_rate': 'Stundensatz',
        'is_active': 'Aktiv'
    }
    
    # Select and rename columns
    df_display = df[list(display_columns.keys())].copy()
    df_display.columns = list(display_columns.values())
    
    # Format numeric columns
    df_display['Stundensatz'] = df_display['Stundensatz'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "-")
    df_display['Aktiv'] = df_display['Aktiv'].apply(lambda x: "✓" if x else "✗")
    
    # Add action column
    df_display['Aktionen'] = df['employee_id'].apply(lambda employee_id: f"Edit|Delete")
    
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


def render_employee_create_form():
    """Render form for creating a new employee"""
    
    with st.form("create_employee_form"):
        name = st.text_input("Name *", key="employee_name")
        
        col1, col2 = st.columns(2)
        with col1:
            employee_code = st.text_input("Personalnummer", key="employee_code")
            email = st.text_input("E-Mail", key="employee_email")
            phone = st.text_input("Telefon", key="employee_phone")
        with col2:
            role = st.text_input("Position", key="employee_role")
            contract_type = st.text_input("Vertragsart", key="employee_contract")
            weekly_hours = st.number_input("Wochenstunden", min_value=0.0, step=0.5, key="employee_hours")
        
        hourly_rate = st.number_input("Stundensatz (€)", min_value=0.0, step=0.01, key="employee_rate")
        notes = st.text_area("Notizen", key="employee_notes")
        
        is_active = st.checkbox("Aktiv", value=True, key="employee_active")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("💾 Speichern", use_container_width=True):
                if not name:
                    st.error("Bitte geben Sie einen Namen ein.")
                else:
                    create_employee({
                        'name': name,
                        'employee_code': employee_code,
                        'email': email,
                        'phone': phone,
                        'role': role,
                        'contract_type': contract_type,
                        'weekly_hours_contract': weekly_hours if weekly_hours > 0 else None,
                        'hourly_rate': hourly_rate if hourly_rate > 0 else None,
                        'notes': notes,
                        'is_active': is_active
                    })
        
        with col2:
            if st.form_submit_button("❌ Abbrechen", use_container_width=True):
                st.session_state.show_employee_form = False
                st.rerun()


def render_employee_edit_form(employee_id: str):
    """Render form for editing an existing employee"""
    
    # Load employee data
    response = api_request("GET", f"/api/employees/{employee_id}")
    if not response.get('success'):
        st.error("Mitarbeiter nicht gefunden")
        return
    
    employee = response.get('data')
    
    with st.form("edit_employee_form"):
        name = st.text_input("Name *", value=employee.get('name', ''), key="edit_employee_name")
        
        col1, col2 = st.columns(2)
        with col1:
            employee_code = st.text_input("Personalnummer", value=employee.get('employee_code', ''), key="edit_employee_code")
            email = st.text_input("E-Mail", value=employee.get('email', ''), key="edit_employee_email")
            phone = st.text_input("Telefon", value=employee.get('phone', ''), key="edit_employee_phone")
        with col2:
            role = st.text_input("Position", value=employee.get('role', ''), key="edit_employee_role")
            contract_type = st.text_input("Vertragsart", value=employee.get('contract_type', ''), key="edit_employee_contract")
            weekly_hours = st.number_input("Wochenstunden", min_value=0.0, step=0.5, value=float(employee.get('weekly_hours_contract', 0)) if employee.get('weekly_hours_contract') else 0.0, key="edit_employee_hours")
        
        hourly_rate = st.number_input("Stundensatz (€)", min_value=0.0, step=0.01, value=float(employee.get('hourly_rate', 0)) if employee.get('hourly_rate') else 0.0, key="edit_employee_rate")
        notes = st.text_area("Notizen", value=employee.get('notes', ''), key="edit_employee_notes")
        
        is_active = st.checkbox("Aktiv", value=employee.get('is_active', True), key="edit_employee_active")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("💾 Speichern", use_container_width=True):
                if not name:
                    st.error("Bitte geben Sie einen Namen ein.")
                else:
                    update_employee(employee_id, {
                        'name': name,
                        'employee_code': employee_code,
                        'email': email,
                        'phone': phone,
                        'role': role,
                        'contract_type': contract_type,
                        'weekly_hours_contract': weekly_hours if weekly_hours > 0 else None,
                        'hourly_rate': hourly_rate if hourly_rate > 0 else None,
                        'notes': notes,
                        'is_active': is_active
                    })
        
        with col2:
            if st.form_submit_button("❌ Abbrechen", use_container_width=True):
                st.session_state.editing_employee_id = None
                st.rerun()


def create_employee(employee_data: Dict[str, Any]):
    """Create a new employee via API"""
    
    response = api_request("POST", "/api/employees/", json=employee_data)
    
    if response.get('success'):
        st.success("Mitarbeiter erfolgreich erstellt!")
        st.session_state.show_employee_form = False
        st.rerun()
    else:
        st.error(f"Fehler: {response.get('message', 'Unbekannter Fehler')}")


def update_employee(employee_id: str, update_data: Dict[str, Any]):
    """Update an existing employee via API"""
    
    response = api_request("PUT", f"/api/employees/{employee_id}", json=update_data)
    
    if response.get('success'):
        st.success("Mitarbeiter erfolgreich aktualisiert!")
        st.session_state.editing_employee_id = None
        st.rerun()
    else:
        st.error(f"Fehler: {response.get('message', 'Unbekannter Fehler')}")


def export_csv():
    """Export employees to CSV"""
    
    response = api_request("GET", "/api/employees/", params={"limit": 10000})
    
    if response.get('success'):
        employees = response.get('data', {}).get('items', [])
        df = pd.DataFrame(employees)
        
        if not df.empty:
            # Select relevant columns
            export_columns = ['employee_code', 'name', 'role', 'phone', 'email', 'hourly_rate', 'is_active']
            df_export = df[export_columns]
            
            # Rename columns for German CSV
            column_names = {
                'employee_code': 'Personalnr',
                'name': 'Name',
                'role': 'Position',
                'phone': 'Telefon',
                'email': 'E-Mail',
                'hourly_rate': 'Stundensatz',
                'is_active': 'Aktiv'
            }
            df_export.rename(columns=column_names, inplace=True)
            
            csv = df_export.to_csv(index=False, sep=';')
            st.download_button(
                label="📥 CSV herunterladen",
                data=csv,
                file_name="mitarbeiter.csv",
                mime="text/csv"
            )
    else:
        st.error("Export fehlgeschlagen")


# For backward compatibility / module auto-discovery
def render():
    page()
