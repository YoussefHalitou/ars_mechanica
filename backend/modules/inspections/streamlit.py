"""
Streamlit page for Inspections module (Draftbit architecture)
"""
import streamlit as st
import pandas as pd
from datetime import datetime
from streamlit_app.utils.tenant import get_tenant_config
from streamlit_app.utils.api import get_api_client


def page():
    """Main page function for inspections management"""
    st.title("🔍 Besichtigungen")
    st.markdown("Verwalten Sie Kundenbesichtigungen und Angebotsdaten.")
    
    tenant = get_tenant_config()
    
    if not tenant.is_module_enabled("inspections"):
        st.error("Dieses Modul ist für Ihren Mandanten nicht aktiviert.")
        return
    
    # Tabs for different views
    tab1, tab2 = st.tabs(["📋 Besichtigungen", "➕ Neue Besichtigung"])
    
    with tab1:
        show_inspections_list()
    
    with tab2:
        show_add_inspection_form()


def show_inspections_list():
    """Display list of all inspections"""
    
    st.markdown("### Alle Besichtigungen")
    
    api = get_api_client()
    
    # Fetch inspections
    response = api.get("/api/inspections/")
    
    if response.get('success') and response.get('data'):
        inspections = response['data']
        
        # Convert to DataFrame for better display
        df = pd.DataFrame(inspections)
        
        if not df.empty:
            # Format the dataframe
            df_display = df[['inspection_code', 'name', 'email', 'telefon', 'status', 'appointment_at']].copy()
            df_display.columns = ['Code', 'Name', 'E-Mail', 'Telefon', 'Status', 'Termin']
            
            # Format datetime
            if 'appointment_at' in df_display.columns:
                df_display['Termin'] = pd.to_datetime(df_display['Termin']).dt.strftime('%d.%m.%Y %H:%M')
            
            st.dataframe(df_display, use_container_width=True)
            
            # Inspection details
            st.markdown("### Details")
            for inspection in inspections:
                with st.expander(f"{inspection.get('name', 'Unbekannt')} - {inspection.get('inspection_code', 'Ohne Code')}"):
                    col1, col2 = st.columns(2)
                    with col1:
                        st.write(f"**E-Mail:** {inspection.get('email', '-')}")
                        st.write(f"**Telefon:** {inspection.get('telefon', '-')}")
                        st.write(f"**Adresse:** {inspection.get('strasse', '')} {inspection.get('nr', '')}, {inspection.get('plz', '')} {inspection.get('ort', '')}")
                    with col2:
                        st.write(f"**Status:** {inspection.get('status', '-')}")
                        if inspection.get('appointment_at'):
                            st.write(f"**Termin:** {datetime.fromisoformat(inspection['appointment_at']).strftime('%d.%m.%Y %H:%M')}")
                        if inspection.get('wunschtermin'):
                            st.write(f"**Wunschtermin:** {datetime.fromisoformat(inspection['wunschtermin']).strftime('%d.%m.%Y')}")
        else:
            st.info("Keine Besichtigungen vorhanden.")
    else:
        st.error(f"Fehler beim Laden der Besichtigungen: {response.get('message', 'Unbekannter Fehler')}")


def show_add_inspection_form():
    """Show form to add new inspection"""
    
    st.markdown("### Neue Besichtigung erstellen")
    
    api = get_api_client()
    
    with st.form("add_inspection_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            inspection_code = st.text_input("Besichtigungscode", placeholder="BS-2024-001")
            anrede = st.selectbox("Anrede", ["Herr", "Frau", ""])
            name = st.text_input("Name *", placeholder="Max Mustermann")
            telefon = st.text_input("Telefon", placeholder="+43 1 2345678")
            email = st.text_input("E-Mail", placeholder="max@example.com")
        
        with col2:
            strasse = st.text_input("Straße", placeholder="Hauptstraße")
            nr = st.text_input("Hausnummer", placeholder="1")
            plz = st.text_input("PLZ", placeholder="1010")
            ort = st.text_input("Ort", placeholder="Wien")
            
            appointment_date = st.date_input("Termin")
            appointment_time = st.time_input("Uhrzeit")
        
        # Combine date and time
        appointment_at = None
        if appointment_date and appointment_time:
            appointment_at = datetime.combine(appointment_date, appointment_time).isoformat()
        
        notes = st.text_area("Notizen", placeholder="Zusätzliche Informationen...")
        
        submitted = st.form_submit_button("Besichtigung speichern", use_container_width=True)
        
        if submitted:
            if not name:
                st.error("Bitte geben Sie einen Namen ein.")
            else:
                new_inspection = {
                    "inspection_code": inspection_code,
                    "anrede": anrede,
                    "name": name,
                    "telefon": telefon,
                    "email": email,
                    "strasse": strasse,
                    "nr": nr,
                    "plz": plz,
                    "ort": ort,
                    "appointment_at": appointment_at,
                    "notes": notes
                }
                
                response = api.post("/api/inspections/", json=new_inspection)
                
                if response.get('success'):
                    st.success(f"✅ Besichtigung für '{name}' erfolgreich erstellt!")
                    st.rerun()
                else:
                    st.error(f"Fehler: {response.get('message', 'Unbekannter Fehler')}")


def render():
    """Alias for page() for backward compatibility"""
    page()
