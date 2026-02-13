"""
Enhanced Services module with modern UI and advanced features
"""
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import time
from typing import Dict, Any, List

# Import mock API
from streamlit_app.utils.api import get_api_client
from streamlit_app.utils.export import export_to_csv, export_to_excel


def page():
    """Main page function for services management with enhanced UI"""
    
    st.title("📦 Leistungskatalog v2.0")
    st.markdown("Verwalten Sie Ihre Umzugsleistungen mit moderner Oberfläche und erweiterten Funktionen.")
    
    # Initialize session state
    if 'services_search_query' not in st.session_state:
        st.session_state.services_search_query = ""
    if 'services_filters' not in st.session_state:
        st.session_state.services_filters = {}
    
    # Tabs for different views
    tab1, tab2, tab3, tab4 = st.tabs(["📋 Alle Leistungen", "➕ Neue Leistung", "📊 Analyse", "📤 Export"])
    
    with tab1:
        show_services_list()
    
    with tab2:
        show_add_service_form()
    
    with tab3:
        show_services_analytics()
    
    with tab4:
        show_export_options()


def show_services_list():
    """Enhanced services list with search, filters, and bulk operations"""
    
    st.markdown("### Alle Leistungen")
    
    api = get_api_client()
    
    # Search and filter controls
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        search_query = st.text_input(
            "🔍 Suchen...",
            value=st.session_state.services_search_query,
            placeholder="Nach Name oder Beschreibung suchen...",
            key="services_search"
        )
        st.session_state.services_search_query = search_query
    
    with col2:
        category_filter = st.selectbox(
            "Kategorie",
            ["Alle", "Standard", "Premium", "Zusatz", "Service"],
            key="services_category_filter"
        )
    
    with col3:
        status_filter = st.selectbox(
            "Status",
            ["Alle", "Aktiv", "Inaktiv"],
            key="services_status_filter"
        )
    
    # Bulk operations
    st.markdown("#### 📦 Massenoperationen")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        if st.button("✅ Alle aktivieren", use_container_width=True):
            st.info("Massenaktivierung - In Entwicklung")
    
    with col2:
        if st.button("❌ Alle deaktivieren", use_container_width=True):
            st.info("Massendeaktivierung - In Entwicklung")
    
    with col3:
        if st.button("📤 Exportieren", use_container_width=True):
            st.info("Export - In Entwicklung")
    
    with col4:
        if st.button("🗑️ Löschen", use_container_width=True):
            st.warning("Massenlöschung - In Entwicklung")
    
    # Fetch services
    response = api.get("/api/services/")
    
    if response.get('success') and response.get('data'):
        services = response['data']
        
        # Apply search and filters
        if search_query:
            services = [s for s in services if search_query.lower() in s.get('name', '').lower() or search_query.lower() in s.get('description', '').lower()]
        
        if category_filter != "Alle":
            services = [s for s in services if s.get('category') == category_filter]
        
        if status_filter == "Aktiv":
            services = [s for s in services if s.get('active', True)]
        elif status_filter == "Inaktiv":
            services = [s for s in services if not s.get('active', False)]
        
        if not services:
            st.info("Keine Leistungen gefunden, die Ihren Kriterien entsprechen.")
            return
        
        # Display services in enhanced table
        df = pd.DataFrame(services)
        
        # Format dataframe
        df_display = df[['name', 'description', 'unit', 'price_per_unit', 'category', 'active']].copy()
        df_display.columns = ['Name', 'Beschreibung', 'Einheit', 'Preis', 'Kategorie', 'Status']
        df_display['Preis'] = df_display['Preis'].apply(lambda x: f"€ {x:.2f}")
        df_display['Status'] = df_display['Status'].apply(lambda x: '✅ Aktiv' if x else '❌ Inaktiv')
        
        # Enhanced table with actions
        st.markdown("#### Leistungsübersicht")
        
        # Use AgGrid for advanced table features
        st.dataframe(
            df_display,
            use_container_width=True,
            column_config={
                "Name": st.column_config.TextColumn("Name", width="medium"),
                "Beschreibung": st.column_config.TextColumn("Beschreibung", width="large"),
                "Einheit": st.column_config.TextColumn("Einheit", width="small"),
                "Preis": st.column_config.TextColumn("Preis", width="small"),
                "Kategorie": st.column_config.TextColumn("Kategorie", width="small"),
                "Status": st.column_config.TextColumn("Status", width="small")
            }
        )
        
        # Service details with actions
        st.markdown("#### Details & Aktionen")
        
        for idx, service in enumerate(services):
            with st.expander(f"📦 {service['name']} - € {service['price_per_unit']:.2f}"):
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.write(f"**Beschreibung:** {service['description']}")
                    st.write(f"**Einheit:** {service['unit']}")
                    st.write(f"**Kategorie:** {service.get('category', 'Standard')}")
                
                with col2:
                    st.write(f"**Preis:** € {service['price_per_unit']:.2f}")
                    st.write(f"**Status:** {'Aktiv' if service['active'] else 'Inaktiv'}")
                    st.write(f"**Erstellt:** 15.02.2024")
                
                with col3:
                    # Action buttons
                    if st.button("✏️ Bearbeiten", key=f"edit_{idx}"):
                        st.info("Bearbeiten - In Entwicklung")
                    
                    if st.button("📋 Duplizieren", key=f"dup_{idx}"):
                        st.info("Duplizieren - In Entwicklung")
                    
                    if service['active']:
                        if st.button("❌ Deaktivieren", key=f"deact_{idx}"):
                            st.info("Deaktivieren - In Entwicklung")
                    else:
                        if st.button("✅ Aktivieren", key=f"act_{idx}"):
                            st.info("Aktivieren - In Entwicklung")
        
        # Summary stats
        st.markdown("#### Zusammenfassung")
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Gesamt", len(services), help="Anzahl Leistungen")
        
        with col2:
            active_count = len([s for s in services if s.get('active', True)])
            st.metric("Aktiv", active_count, help="Aktive Leistungen")
        
        with col3:
            avg_price = sum(s['price_per_unit'] for s in services) / len(services)
            st.metric("Ø Preis", f"€ {avg_price:.2f}", help="Durchschnittspreis")
        
        with col4:
            total_value = sum(s['price_per_unit'] for s in services)
            st.metric("Gesamtwert", f"€ {total_value:.2f}", help="Summe aller Preise")
    else:
        st.error(f"Fehler beim Laden der Leistungen: {response.get('message', 'Unbekannter Fehler')}")


def show_add_service_form():
    """Enhanced form for adding new services"""
    
    st.markdown("### Neue Leistung erstellen")
    
    with st.form("add_service_form_v2", clear_on_submit=True):
        st.markdown("#### Grundinformationen")
        
        col1, col2 = st.columns(2)
        
        with col1:
            name = st.text_input("Leistungsname *", placeholder="z.B. Umzug klein", help="Der Name der Leistung")
            category = st.selectbox("Kategorie", ["Standard", "Premium", "Zusatz", "Service"], help="Kategorie der Leistung")
            unit = st.selectbox("Einheit *", ["Pauschal", "Stunde", "Stück", "m²", "kg", "Tag"], help="Abrechnungseinheit")
        
        with col2:
            description = st.text_area("Beschreibung", placeholder="Detaillierte Beschreibung der Leistung...", help="Was umfasst diese Leistung?")
            price = st.number_input("Preis pro Einheit (€) *", min_value=0.0, step=0.5, help="Preis in Euro")
        
        st.markdown("#### Erweiterte Einstellungen")
        
        col1, col2 = st.columns(2)
        
        with col1:
            min_hours = st.number_input("Mindeststunden", min_value=0.0, step=0.5, help="Minimale Abrechnungszeit")
            requires_certification = st.checkbox("Zertifizierung erforderlich", help="Benötigt spezielle Qualifikation")
        
        with col2:
            tags = st.text_input("Tags", placeholder="premium, spezial, ...", help="Schlagwörter für die Suche")
            active = st.checkbox("Aktiv", value=True, help="Leistung ist aktiv und buchbar")
        
        st.markdown("#### Preisstaffeln (optional)")
        
        st.info("Fügen Sie Preisstaffeln für Mengenrabatte hinzu")
        
        price_tiers = []
        for i in range(3):
            col1, col2, col3 = st.columns(3)
            with col1:
                min_qty = st.number_input(f"Ab Menge {i+1}", min_value=0, step=1, key=f"min_qty_{i}")
            with col2:
                discount = st.number_input(f"Rabatt % {i+1}", min_value=0.0, max_value=100.0, step=5.0, key=f"discount_{i}")
            with col3:
                final_price = price * (1 - discount/100) if discount > 0 else price
                st.metric(f"Preis {i+1}", f"€ {final_price:.2f}")
        
        submitted = st.form_submit_button("Leistung speichern", use_container_width=True)
        
        if submitted:
            if not name:
                st.error("Bitte geben Sie einen Leistungsnamen ein.")
            elif price <= 0:
                st.error("Der Preis muss größer als 0 sein.")
            else:
                # Create new service
                new_service = {
                    "name": name,
                    "description": description,
                    "unit": unit,
                    "price_per_unit": price,
                    "category": category,
                    "min_hours": min_hours,
                    "requires_certification": requires_certification,
                    "tags": tags.split(",") if tags else [],
                    "active": active
                }
                
                # Simulate API call
                time.sleep(0.5)
                st.success(f"✅ Leistung '{name}' erfolgreich erstellt!")
                
                # Show success animation
                with st.spinner("Leistung wird gespeichert..."):
                    time.sleep(1)
                
                st.balloons()


def show_services_analytics():
    """Services analytics dashboard"""
    
    st.markdown("### 📊 Leistungsanalyse")
    
    api = get_api_client()
    
    # Fetch services
    response = api.get("/api/services/")
    
    if response.get('success') and response.get('data'):
        services = response['data']
        df = pd.DataFrame(services)
        
        # Key metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Gesamtumsatzpotential", f"€ {sum(s['price_per_unit'] for s in services):,.2f}")
        
        with col2:
            active_services = [s for s in services if s.get('active', True)]
            st.metric("Aktive Leistungen", len(active_services))
        
        with col3:
            avg_price = sum(s['price_per_unit'] for s in services) / len(services)
            st.metric("Durchschnittspreis", f"€ {avg_price:.2f}")
        
        with col4:
            premium_services = [s for s in services if s.get('category') == 'Premium']
            st.metric("Premium-Leistungen", len(premium_services))
        
        # Charts
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### Preisverteilung")
            fig = px.histogram(df, x='price_per_unit', nbins=10, title="Preisverteilung der Leistungen")
            fig.update_layout(showlegend=False)
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            st.markdown("#### Kategorien")
            category_counts = df['category'].value_counts() if 'category' in df.columns else pd.Series({'Standard': len(services)})
            fig = px.pie(values=category_counts.values, names=category_counts.index, title="Leistungen nach Kategorie")
            st.plotly_chart(fig, use_container_width=True)
        
        # Category breakdown
        st.markdown("#### Kategoriedetails")
        
        if 'category' in df.columns:
            category_stats = df.groupby('category').agg({
                'price_per_unit': ['count', 'mean', 'sum']
            }).round(2)
            
            category_stats.columns = ['Anzahl', 'Ø Preis', 'Gesamt']
            st.dataframe(category_stats, use_container_width=True)
        
        # Top services
        st.markdown("#### Meistgebuchte Leistungen")
        
        # Mock booking data
        booking_data = [
            {"name": "Umzug klein", "bookings": 45, "revenue": 13455},
            {"name": "Möbelmontage", "bookings": 38, "revenue": 1710},
            {"name": "Umzug mittel", "bookings": 32, "revenue": 19168},
            {"name": "Verpackungsservice", "bookings": 28, "revenue": 980},
            {"name": "Umzug groß", "bookings": 15, "revenue": 14985},
        ]
        
        booking_df = pd.DataFrame(booking_data)
        st.dataframe(booking_df, use_container_width=True)
    else:
        st.error("Keine Daten verfügbar")


def show_export_options():
    """Export options for services"""
    
    st.markdown("### 📤 Export-Optionen")
    
    api = get_api_client()
    
    # Fetch services for export
    response = api.get("/api/services/")
    
    if response.get('success') and response.get('data'):
        services = response['data']
        df = pd.DataFrame(services)
        
        st.markdown("#### Export-Einstellungen")
        
        col1, col2 = st.columns(2)
        
        with col1:
            export_format = st.selectbox("Format", ["CSV", "Excel", "PDF"])
            include_inactive = st.checkbox("Inaktive Leistungen einbeziehen")
            include_descriptions = st.checkbox("Beschreibungen einbeziehen")
        
        with col2:
            sort_by = st.selectbox("Sortierung", ["Name", "Preis", "Kategorie"])
            group_by_category = st.checkbox("Nach Kategorie gruppieren")
        
        # Preview
        st.markdown("#### Vorschau")
        
        preview_df = df[['name', 'description', 'unit', 'price_per_unit', 'category', 'active']].copy()
        preview_df.columns = ['Name', 'Beschreibung', 'Einheit', 'Preis', 'Kategorie', 'Aktiv']
        
        if not include_descriptions:
            preview_df = preview_df.drop('Beschreibung', axis=1)
        
        if not include_inactive:
            preview_df = preview_df[preview_df['Aktiv'] == '✅ Ja']
        
        st.dataframe(preview_df.head(10), use_container_width=True)
        
        st.markdown(f"**Gesamt:** {len(preview_df)} Leistungen")
        
        # Export buttons
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("📄 Als CSV exportieren", use_container_width=True):
                csv_data = export_to_csv(preview_df)
                st.download_button(
                    label="CSV herunterladen",
                    data=csv_data,
                    file_name=f"leistungen_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    mime="text/csv"
                )
        
        with col2:
            if st.button("📊 Als Excel exportieren", use_container_width=True):
                excel_data = export_to_excel(preview_df)
                st.download_button(
                    label="Excel herunterladen",
                    data=excel_data,
                    file_name=f"leistungen_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
        
        with col3:
            if st.button("📑 Als PDF exportieren", use_container_width=True):
                st.info("PDF-Export - In Entwicklung")


def render():
    """Alias for page() for backward compatibility"""
    page()
