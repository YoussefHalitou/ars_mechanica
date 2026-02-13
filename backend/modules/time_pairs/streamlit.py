"""
Streamlit page for time pairs module (Zeiterfassung)
"""
import streamlit as st
import pandas as pd
from datetime import datetime, date
from typing import Dict, Any, Optional

# Import shared components
from streamlit_app.utils.api import api_request
from streamlit_app.utils.tenant import get_tenant_config


def page():
    """Main page function for time tracking"""
    st.title("Zeiterfassung")
    
    # Get tenant config
    tenant = get_tenant_config()
    
    # Check if module is enabled
    if not tenant.is_module_enabled("time_pairs"):
        st.error("Dieses Modul ist für Ihren Mandanten nicht aktiviert.")
        return
    
    # Date filter
    col1, col2 = st.columns(2)
    with col1:
        selected_date = st.date_input("Datum", value=date.today(), key="date_filter")
    
    with col2:
        if st.button("➕ Neue Zeiterfassung", use_container_width=True):
            st.session_state.show_timepair_form = True
    
    # Show time pair form
    if st.session_state.get('show_timepair_form', False):
        st.subheader("Neue Zeiterfassung")
        render_timepair_create_form()
        return
    
    # Load and display time pairs for selected date
    load_timepairs_table(selected_date)


def load_timepairs_table(selected_date: date):
    """Load and display time pairs for a date"""
    
    with st.spinner("Lade Zeiterfassungen..."):
        # Use the with_staff endpoint to get extended data
        response = api_request("GET", "/api/time_pairs/with_staff", params={
            'date': selected_date.isoformat()
        })
    
    if not response.get('success'):
        st.error(f"Fehler beim Laden: {response.get('message', 'Unbekannter Fehler')}")
        return
    
    time_pairs_data = response.get('data', [])
    
    if not time_pairs_data:
        st.info(f"Keine Zeiterfassungen für {selected_date.strftime('%d.%m.%Y')} gefunden.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(time_pairs_data)
    
    # Prepare display columns
    display_columns = {
        'mitarbeiter': 'Mitarbeiter',
        'employee_code': 'Personalnr.',
        'datum': 'Datum',
        'lis_von': 'LIS Von',
        'lis_bis': 'LIS Bis',
        'kunde_von': 'Kunde Von',
        'kunde_bis': 'Kunde Bis',
        'ges_lis': 'LIS Std.',
        'ges_kd': 'Kunde Std.',
        'employee_rate': 'Stundensatz',
        'total_cost': 'Kosten',
        'notes': 'Notizen'
    }
    
    # Select and rename columns
    df_display = df[list(display_columns.keys())].copy()
    df_display.columns = list(display_columns.values())
    
    # Format datetime columns
    df_display['Datum'] = pd.to_datetime(df_display['Datum']).dt.strftime('%d.%m.%Y')
    df_display['LIS Von'] = df_display['LIS Von'].apply(lambda x: format_time(x) if pd.notna(x) else "-")
    df_display['LIS Bis'] = df_display['LIS Bis'].apply(lambda x: format_time(x) if pd.notna(x) else "-")
    df_display['Kunde Von'] = df_display['Kunde Von'].apply(lambda x: format_time(x) if pd.notna(x) else "-")
    df_display['Kunde Bis'] = df_display['Kunde Bis'].apply(lambda x: format_time(x) if pd.notna(x) else "-")
    
    # Format numeric columns
    df_display['LIS Std.'] = df_display['LIS Std.'].apply(lambda x: f"{x:.2f}h" if pd.notna(x) else "-")
    df_display['Kunde Std.'] = df_display['Kunde Std.'].apply(lambda x: f"{x:.2f}h" if pd.notna(x) else "-")
    df_display['Stundensatz'] = df_display['Stundensatz'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "-")
    df_display['Kosten'] = df_display['Kosten'].apply(lambda x: f"€{x:.2f}" if pd.notna(x) else "-")
    
    st.dataframe(
        df_display,
        use_container_width=True,
        hide_index=True
    )
    
    # Summary
    st.markdown("---")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Anzahl Mitarbeiter", len(df_display))
    with col2:
        total_hours = df['ges_lis_h'].sum() if 'ges_lis_h' in df.columns else 0
        st.metric("Gesamtstunden LIS", f"{total_hours:.2f}h")
    with col3:
        total_cost = df['total_cost'].sum() if 'total_cost' in df.columns else 0
        st.metric("Gesamtkosten", f"€{total_cost:.2f}")


def format_time(time_str):
    """Format time string to HH:MM"""
    if not time_str:
        return "-"
    try:
        # Handle ISO format time
        if 'T' in time_str:
            dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
            return dt.strftime('%H:%M')
        return time_str
    except:
        return time_str


def render_timepair_create_form():
    """Render form for creating a new time pair"""
    
    # This would be a complex form - simplified for now
    st.write("Formular für neue Zeiterfassung (in Entwicklung)")
    
    if st.button("Zurück zur Übersicht"):
        st.session_state.show_timepair_form = False
        st.rerun()


# For backward compatibility / module auto-discovery
def render():
    page()
