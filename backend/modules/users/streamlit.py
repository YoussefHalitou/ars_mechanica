"""
Streamlit page for Users & Employees module (Draftbit architecture)
"""
import streamlit as st
import pandas as pd
from datetime import datetime
from streamlit_app.utils.tenant import get_tenant_config
from streamlit_app.utils.api import get_api_client


def page():
    """Main page function for users and employees management"""
    st.title("👥 Benutzer & Mitarbeiter")
    st.markdown("Verwalten Sie Benutzerkonten und Mitarbeiterdaten.")
    
    tenant = get_tenant_config()
    
    if not tenant.is_module_enabled("users"):
        st.error("Dieses Modul ist für Ihren Mandanten nicht aktiviert.")
        return
    
    # Tabs for different views
    tab1, tab2, tab3, tab4 = st.tabs(["📋 Benutzer", "👷 Mitarbeiter", "📊 Analytik", "💬 Feedback"])
    
    with tab1:
        show_users_tab()
    
    with tab2:
        show_employees_tab()
    
    with tab3:
        show_analytics_tab()
    
    with tab4:
        show_feedback_tab()


def show_users_tab():
    """Show users management"""
    st.markdown("### Benutzerverwaltung")
    
    api = get_api_client()
    
    # Fetch users
    response = api.get("/api/users/")
    
    if response.get('success') and response.get('data'):
        users = response['data']
        
        # Display users in dataframe
        df = pd.DataFrame(users)
        if not df.empty:
            df_display = df[['email', 'role', 'user_type', 'is_active', 'created_at']].copy()
            df_display.columns = ['E-Mail', 'Rolle', 'Typ', 'Aktiv', 'Erstellt']
            df_display['Aktiv'] = df_display['Aktiv'].apply(lambda x: '✅ Ja' if x else '❌ Nein')
            df_display['Typ'] = df_display['Typ'].apply(lambda x: 'Büro' if x == 'office' else 'Feld')
            
            st.dataframe(df_display, use_container_width=True)
        else:
            st.info("Keine Benutzer vorhanden.")
    else:
        st.error(f"Fehler beim Laden der Benutzer: {response.get('message', 'Unbekannter Fehler')}")
    
    # Add new user form
    with st.expander("➕ Neuen Benutzer erstellen"):
        with st.form("create_user_form"):
            col1, col2 = st.columns(2)
            
            with col1:
                email = st.text_input("E-Mail *", placeholder="user@example.com")
                role = st.selectbox("Rolle *", ["Admin", "Secretary", "Planner", "Supervisor", "Worker"])
            
            with col2:
                user_type = st.selectbox("Typ *", ["office", "field"], format_func=lambda x: "Büro" if x == "office" else "Feld")
                is_active = st.checkbox("Aktiv", value=True)
            
            submitted = st.form_submit_button("Benutzer erstellen", use_container_width=True)
            
            if submitted:
                if not email:
                    st.error("Bitte geben Sie eine E-Mail-Adresse ein.")
                else:
                    new_user = {
                        "email": email,
                        "role": role,
                        "user_type": user_type,
                        "is_active": is_active
                    }
                    
                    response = api.post("/api/users/", json=new_user)
                    if response.get('success'):
                        st.success(f"✅ Benutzer '{email}' erfolgreich erstellt!")
                        st.rerun()
                    else:
                        st.error(f"Fehler: {response.get('message', 'Unbekannter Fehler')}")


def show_employees_tab():
    """Show employees management"""
    st.markdown("### Mitarbeiterverwaltung")
    
    api = get_api_client()
    
    # Fetch employees
    response = api.get("/api/users/employees/")
    
    if response.get('success') and response.get('data'):
        employees = response['data']
        
        # Display employees in dataframe
        df = pd.DataFrame(employees)
        if not df.empty:
            df_display = df[['first_name', 'last_name', 'email', 'position', 'department', 'employee_number']].copy()
            df_display.columns = ['Vorname', 'Nachname', 'E-Mail', 'Position', 'Abteilung', 'Mitarbeiternr.']
            
            st.dataframe(df_display, use_container_width=True)
        else:
            st.info("Keine Mitarbeiter vorhanden.")
    else:
        st.error(f"Fehler beim Laden der Mitarbeiter: {response.get('message', 'Unbekannter Fehler')}")


def show_analytics_tab():
    """Show analytics dashboard"""
    st.markdown("### Analytik-Dashboard")
    
    api = get_api_client()
    
    # Fetch recent events
    response = api.get("/api/users/analytics/events/", params={"limit": 50})
    
    if response.get('success') and response.get('data'):
        events = response['data']
        
        if events:
            df = pd.DataFrame(events)
            df_display = df[['event_name', 'category', 'level', 'timestamp']].copy()
            df_display.columns = ['Ereignis', 'Kategorie', 'Level', 'Zeitpunkt']
            
            st.dataframe(df_display, use_container_width=True)
            
            # Summary by category
            st.markdown("#### Zusammenfassung nach Kategorie")
            category_counts = df['category'].value_counts()
            st.bar_chart(category_counts)
        else:
            st.info("Keine Analytik-Ereignisse vorhanden.")
    else:
        st.error(f"Fehler beim Laden der Analytik: {response.get('message', 'Unbekannter Fehler')}")


def show_feedback_tab():
    """Show feedback management"""
    st.markdown("### Feedback-Verwaltung")
    
    api = get_api_client()
    
    # Fetch feedback
    response = api.get("/api/users/feedback/")
    
    if response.get('success') and response.get('data'):
        feedback_items = response['data']
        
        if feedback_items:
            df = pd.DataFrame(feedback_items)
            df_display = df[['feedback_type', 'status', 'priority', 'user_email', 'created_at']].copy()
            df_display.columns = ['Typ', 'Status', 'Priorität', 'Nutzer', 'Erstellt']
            
            st.dataframe(df_display, use_container_width=True)
            
            # Summary by status
            st.markdown("#### Zusammenfassung nach Status")
            status_counts = df['status'].value_counts()
            st.bar_chart(status_counts)
        else:
            st.info("Kein Feedback vorhanden.")
    else:
        st.error(f"Fehler beim Laden des Feedbacks: {response.get('message', 'Unbekannter Fehler')}")
    
    # Add feedback form
    with st.expander("➕ Neues Feedback geben"):
        with st.form("create_feedback_form"):
            email = st.text_input("Ihre E-Mail *", placeholder="ihre.email@example.com")
            feedback_type = st.selectbox("Typ *", ["bug", "feature", "feedback", "sync_issue", "other"])
            priority = st.selectbox("Priorität", ["low", "medium", "high", "critical"])
            message = st.text_area("Nachricht *", placeholder="Beschreiben Sie Ihr Feedback oder Problem...")
            
            submitted = st.form_submit_button("Feedback senden", use_container_width=True)
            
            if submitted:
                if not email or not message:
                    st.error("Bitte füllen Sie alle Pflichtfelder aus.")
                else:
                    new_feedback = {
                        "user_email": email,
                        "feedback_type": feedback_type,
                        "priority": priority,
                        "message": message
                    }
                    
                    response = api.post("/api/users/feedback/", json=new_feedback)
                    if response.get('success'):
                        st.success("✅ Feedback erfolgreich gesendet!")
                        st.rerun()
                    else:
                        st.error(f"Fehler: {response.get('message', 'Unbekannter Fehler')}")


def render():
    """Alias for page() for backward compatibility"""
    page()
