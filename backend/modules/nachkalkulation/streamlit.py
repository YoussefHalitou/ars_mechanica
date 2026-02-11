"""
Streamlit frontend for Nachkalkulation (Post-Calculation) module
Optimized UI with German localization and comprehensive analytics
"""
import streamlit as st
import pandas as pd
import io
from datetime import datetime, date, timedelta
from typing import List, Optional
import plotly.express as px
import plotly.graph_objects as go
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func

from backend.core.database import get_db_session
from backend.modules.nachkalkulation.models import Nachkalkulation, NachkalkulationDetail
from backend.modules.nachkalkulation.schemas import (
    NachkalkulationCreate, NachkalkulationDetailCreate
)
from backend.modules.nachkalkulation.service import NachkalkulationService
from backend.modules.projects.models import Project


class NachkalkulationUI:
    """Streamlit UI for Nachkalkulation module"""
    
    def __init__(self):
        self.session = get_db_session()
        self.service = NachkalkulationService(self.session)
    
    async def run(self):
        """Main UI entry point"""
        st.set_page_config(
            page_title="Nachkalkulation",
            page_icon="💰",
            layout="wide"
        )
        
        st.title("💰 Nachkalkulation (Post-Calculation)")
        
        # Sidebar navigation
        menu = st.sidebar.selectbox(
            "Navigation",
            ["Dashboard", "Übersicht", "Neue Kalkulation", "Projekt-Analyse", "Berichte"]
        )
        
        if menu == "Dashboard":
            await self.show_dashboard()
        elif menu == "Übersicht":
            await self.show_overview()
        elif menu == "Neue Kalkulation":
            await self.create_new_calculation()
        elif menu == "Projekt-Analyse":
            await self.show_project_analysis()
        elif menu == "Berichte":
            await self.show_reports()
    
    async def show_dashboard(self):
        """Show main dashboard"""
        st.header("📊 Nachkalkulation Dashboard")
        
        # Date range for dashboard
        col1, col2 = st.columns(2)
        
        with col1:
            period = st.selectbox("Zeitraum", ["Diese Woche", "Dieser Monat", "Dieses Quartal", "Dieses Jahr", "Benutzerdefiniert"])
        
        with col2:
            if period == "Benutzerdefiniert":
                start_date = st.date_input("Startdatum", value=date.today() - timedelta(days=30))
                end_date = st.date_input("Enddatum", value=date.today())
            else:
                end_date = date.today()
                if period == "Diese Woche":
                    start_date = end_date - timedelta(days=end_date.weekday())
                elif period == "Dieser Monat":
                    start_date = end_date.replace(day=1)
                elif period == "Dieses Quartal":
                    quarter = (end_date.month - 1) // 3
                    start_date = end_date.replace(month=quarter * 3 + 1, day=1)
                else:  # Dieses Jahr
                    start_date = end_date.replace(month=1, day=1)
        
        # Get dashboard data
        dashboard_data = await self.service.get_dashboard_data(start_date, end_date)
        
        # KPI Cards
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "Gesamteinnahmen",
                f"€{dashboard_data['total_revenue']:,.2f}",
                delta=f"€{dashboard_data['total_revenue'] * 0.05:,.0f}" if dashboard_data['total_revenue'] > 0 else None
            )
        
        with col2:
            st.metric(
                "Gesamtkosten",
                f"€{dashboard_data['total_costs']:,.2f}",
                delta_color="inverse"
            )
        
        with col3:
            st.metric(
                "Nettogewinn",
                f"€{dashboard_data['total_profit']:,.2f}",
                delta=f"€{dashboard_data['total_profit'] * 0.1:,.0f}" if dashboard_data['total_profit'] > 0 else None
            )
        
        with col4:
            st.metric(
                "Durchschnittliche Marge",
                f"{dashboard_data['average_margin_percent']:.1f}%",
                delta=f"{dashboard_data['average_margin_percent'] * 0.05:.1f}%" if dashboard_data['average_margin_percent'] > 0 else None
            )
        
        # Charts
        col1, col2 = st.columns(2)
        
        with col1:
            # Profit trend (simplified - would need time series data)
            st.subheader("📈 Gewinnentwicklung")
            
            # Create sample trend data
            trend_dates = pd.date_range(start=start_date, end=end_date, freq='W')
            trend_profits = [dashboard_data['total_profit'] * (0.8 + i * 0.05) for i in range(len(trend_dates))]
            
            fig = px.line(
                x=trend_dates, 
                y=trend_profits,
                title="Wöchentlicher Gewinn",
                labels={'x': 'Datum', 'y': 'Gewinn (€)'}
            )
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            # Status distribution
            st.subheader("📊 Statusverteilung")
            
            if dashboard_data['status_distribution']:
                fig = px.pie(
                    values=list(dashboard_data['status_distribution'].values()),
                    names=list(dashboard_data['status_distribution'].keys()),
                    title="Kalkulationen nach Status"
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Keine Daten verfügbar")
        
        # Cost breakdown
        st.subheader("💸 Kostenaufschlüsselung")
        
        # Get sample cost breakdown
        cost_categories = ['Mitarbeiter', 'Fahrzeuge', 'Materialien', 'Externe Dienstleister', 'Gemeinkosten']
        cost_values = [
            dashboard_data['total_costs'] * 0.45,  # Employees
            dashboard_data['total_costs'] * 0.20,  # Vehicles
            dashboard_data['total_costs'] * 0.15,  # Materials
            dashboard_data['total_costs'] * 0.12,  # External
            dashboard_data['total_costs'] * 0.08   # Overhead
        ]
        
        fig = px.bar(
            x=cost_categories,
            y=cost_values,
            title="Kosten nach Kategorie",
            labels={'x': 'Kategorie', 'y': 'Kosten (€)'},
            color=cost_categories
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Top projects
        st.subheader("🏆 Top Projekte nach Marge")
        
        top_projects = await self.service.get_top_projects_by_margin(limit=10, start_date=start_date, end_date=end_date)
        
        if top_projects:
            top_df = pd.DataFrame(top_projects)
            st.dataframe(top_df, use_container_width=True)
        
        # Quick actions
        st.subheader("⚡ Schnellaktionen")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("📊 Neue Kalkulation", use_container_width=True):
                st.session_state.page = "Neue Kalkulation"
                st.rerun()
        
        with col2:
            if st.button("📈 Berichte", use_container_width=True):
                st.session_state.page = "Berichte"
                st.rerun()
        
        with col3:
            if st.button("🔍 Projekt-Analyse", use_container_width=True):
                st.session_state.page = "Projekt-Analyse"
                st.rerun()
    
    async def show_overview(self):
        """Show all calculations overview"""
        st.header("📋 Nachkalkulation Übersicht")
        
        # Filters
        col1, col2, col3 = st.columns(3)
        
        with col1:
            period = st.selectbox("Zeitraum", ["Diese Woche", "Dieser Monat", "Dieses Quartal", "Dieses Jahr", "Alle"])
        
        with col2:
            status_filter = st.selectbox("Status", ["Alle", "In Bearbeitung", "Freigegeben", "Abgeschlossen"])
        
        with col3:
            project_filter = st.text_input("Projekt suchen")
        
        # Get calculations
        end_date = date.today()
        
        if period == "Diese Woche":
            start_date = end_date - timedelta(days=end_date.weekday())
        elif period == "Dieser Monat":
            start_date = end_date.replace(day=1)
        elif period == "Dieses Quartal":
            quarter = (end_date.month - 1) // 3
            start_date = end_date.replace(month=quarter * 3 + 1, day=1)
        elif period == "Dieses Jahr":
            start_date = end_date.replace(month=1, day=1)
        else:
            start_date = end_date - timedelta(days=365*5)  # 5 years
        
        calculations = await self.service.get_calculations_by_date_range(start_date, end_date)
        
        if status_filter != "Alle":
            calculations = [c for c in calculations if c.status == status_filter]
        
        if project_filter:
            calculations = [c for c in calculations if c.project and project_filter.lower() in c.project.name.lower()]
        
        # Display calculations
        if calculations:
            st.subheader(f"📊 {len(calculations)} Kalkulationen gefunden")
            
            calc_data = []
            for calc in calculations:
                calc_data.append({
                    "Datum": calc.calculation_date,
                    "Projekt": calc.project.name if calc.project else "Unbekannt",
                    "Status": calc.status,
                    "Einnahmen": f"€{calc.total_revenue:,.2f}" if calc.total_revenue else "€0.00",
                    "Kosten": f"€{calc.total_costs:,.2f}" if calc.total_costs else "€0.00",
                    "Gewinn": f"€{calc.net_profit:,.2f}" if calc.net_profit else "€0.00",
                    "Marge": f"{calc.profit_margin_percent:.1f}%" if calc.profit_margin_percent else "0.0%",
                    "Gesperrt": "Ja" if calc.is_locked else "Nein",
                    "Erstellt von": calc.calculated_by_user.full_name if calc.calculated_by_user else "System"
                })
            
            df = pd.DataFrame(calc_data)
            
            # Add color coding
            def color_profit(val):
                if '€' in str(val):
                    amount = float(str(val).replace('€', '').replace(',', ''))
                    if amount > 0:
                        return 'color: green'
                    elif amount < 0:
                        return 'color: red'
                return ''
            
            styled_df = df.style.applymap(color_profit, subset=['Gewinn'])
            st.dataframe(styled_df, use_container_width=True)
            
            # Export functionality
            if st.button("📥 Als Excel exportieren"):
                excel_buffer = io.BytesIO()
                with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
                    df.to_excel(writer, sheet_name='Nachkalkulationen', index=False)
                
                excel_data = excel_buffer.getvalue()
                st.download_button(
                    label="Download Excel",
                    data=excel_data,
                    file_name=f"nachkalkulationen_{start_date}_{end_date}.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
            
            # Action buttons for each calculation
            st.subheader("🔧 Aktionen")
            
            selected_calc_id = st.selectbox(
                "Kalkulation auswählen",
                options=[c.nachkalkulation_id for c in calculations],
                format_func=lambda x: f"{[c for c in calculations if c.nachkalkulation_id == x][0].project.name if [c for c in calculations if c.nachkalkulation_id == x][0].project else 'Unbekannt'} - {[c for c in calculations if c.nachkalkulation_id == x][0].calculation_date}"
            )
            
            if selected_calc_id:
                selected_calc = [c for c in calculations if c.nachkalkulation_id == selected_calc_id][0]
                
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    if st.button("📊 Details anzeigen"):
                        st.session_state.selected_calculation = selected_calc_id
                        st.rerun()
                
                with col2:
                    if not selected_calc.is_locked and st.button("🔒 Sperren"):
                        await self.service.lock_calculation(selected_calc_id, "system")
                        st.success("Kalkulation gesperrt!")
                        st.rerun()
                
                with col3:
                    if not selected_calc.is_locked and selected_calc.status != "Abgeschlossen" and st.button("✅ Freigeben"):
                        await self.service.approve_calculation(selected_calc_id, "system")
                        st.success("Kalkulation freigegeben!")
                        st.rerun()
        else:
            st.info("Keine Kalkulationen für den ausgewählten Zeitraum gefunden")
    
    async def create_new_calculation(self):
        """Create new post-calculation"""
        st.header("➕ Neue Nachkalkulation")
        
        # Get projects without calculation
        result = await self.session.execute(select(Project))
        projects = result.scalars().all()
        
        # Filter projects that don't have a calculation yet
        available_projects = []
        for project in projects:
            existing_calc = await self.service.get_calculation_by_project(project.project_id)
            if not existing_calc:
                available_projects.append(project)
        
        if not available_projects:
            st.info("Alle Projekte haben bereits eine Nachkalkulation oder es sind keine Projekte verfügbar.")
            return
        
        # Project selection
        project_options = [(p.project_id, f"{p.name or p.project_code or 'Unbekannt'} ({p.project_date or 'Kein Datum'})") for p in available_projects]
        
        selected_project_id = st.selectbox(
            "Projekt auswählen",
            options=project_options,
            format_func=lambda x: x[1]
        )[0] if project_options else None
        
        if selected_project_id:
            # Get project details
            result = await self.session.execute(select(Project).where(Project.project_id == selected_project_id))
            project = result.scalar_one_or_none()
            
            if project:
                st.subheader(f"📋 Projekt: {project.name or project.project_code or 'Unbekannt'}")
                
                col1, col2 = st.columns(2)
                
                with col1:
                    st.write(f"**Kunde:** {project.name}")
                    st.write(f"**Datum:** {project.project_date}")
                    st.write(f"**Dienstleistung:** {project.dienstleistungen or 'Nicht angegeben'}")
                
                with col2:
                    st.write(f"**Einnahmen:** €{project.total_revenue:,.2f}" if project.total_revenue else "**Einnahmen:** -")
                    st.write(f"**Kosten:** €{project.total_costs:,.2f}" if project.total_costs else "**Kosten:** -")
                    st.write(f"**Marge:** {project.margin_percent:.1f}%" if project.margin_percent else "**Marge:** -")
                
                # Calculation details
                st.subheader("🔧 Kalkulationsdetails")
                
                # Revenue breakdown
                col1, col2 = st.columns(2)
                
                with col1:
                    st.write("**Einnahmen:**")
                    revenue_services = st.number_input("Dienstleistungen (€)", value=float(project.total_revenue or 0), step=100.0)
                    revenue_materials = st.number_input("Materialien (€)", value=0.0, step=50.0)
                    revenue_other = st.number_input("Sonstiges (€)", value=0.0, step=25.0)
                
                with col2:
                    st.write("**Kosten:**")
                    cost_employees = st.number_input("Mitarbeiter (€)", value=float(project.employee_cost or 0), step=50.0)
                    cost_vehicles = st.number_input("Fahrzeuge (€)", value=float(project.vehicle_cost or 0), step=25.0)
                    cost_materials = st.number_input("Materialverbrauch (€)", value=float(project.material_cost or 0), step=25.0)
                    cost_external = st.number_input("Externe Dienstleister (€)", value=0.0, step=25.0)
                    cost_overhead = st.number_input("Gemeinkosten (€)", value=0.0, step=10.0)
                
                # Calculate totals
                total_revenue = revenue_services + revenue_materials + revenue_other
                total_costs = cost_employees + cost_vehicles + cost_materials + cost_external + cost_overhead
                net_profit = total_revenue - total_costs
                profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
                
                st.subheader("📊 Zusammenfassung")
                
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric("Gesamteinnahmen", f"€{total_revenue:,.2f}")
                
                with col2:
                    st.metric("Gesamtkosten", f"€{total_costs:,.2f}")
                
                with col3:
                    st.metric("Nettogewinn", f"€{net_profit:,.2f}", 
                             delta=f"{profit_margin:.1f}% Marge",
                             delta_color="normal" if profit_margin > 0 else "inverse")
                
                # Notes
                notes = st.text_area("Notizen", placeholder="Zusätzliche Informationen zur Kalkulation...")
                variance_explanation = st.text_area("Abweichungs-Erklärung", placeholder="Erklärung für Abweichungen zwischen Planung und Ist...")
                
                # Create calculation
                if st.button("Kalkulation erstellen", type="primary"):
                    try:
                        calc_data = NachkalkulationCreate(
                            project_id=selected_project_id,
                            calculation_date=datetime.utcnow().date(),
                            calculated_by="system",  # Should come from auth
                            total_revenue=Decimal(str(total_revenue)),
                            revenue_services=Decimal(str(revenue_services)),
                            revenue_materials=Decimal(str(revenue_materials)),
                            revenue_other=Decimal(str(revenue_other)),
                            total_costs=Decimal(str(total_costs)),
                            cost_employees=Decimal(str(cost_employees)),
                            cost_vehicles=Decimal(str(cost_vehicles)),
                            cost_materials=Decimal(str(cost_materials)),
                            cost_external=Decimal(str(cost_external)),
                            cost_overhead=Decimal(str(cost_overhead)),
                            net_profit=Decimal(str(net_profit)),
                            profit_margin_percent=Decimal(str(profit_margin)),
                            notes=notes,
                            variance_explanation=variance_explanation,
                            status="In Bearbeitung"
                        )
                        
                        calculation = await self.service.create_calculation(calc_data)
                        calculation.calculate_totals()
                        await self.session.commit()
                        
                        st.success("Nachkalkulation erfolgreich erstellt!")
                        st.balloons()
                        
                        # Show summary
                        st.subheader("📋 Erstellte Kalkulation")
                        st.json({
                            "Kalkulations-ID": calculation.nachkalkulation_id,
                            "Projekt": project.name or project.project_code,
                            "Datum": str(calculation.calculation_date),
                            "Einnahmen": f"€{float(calculation.total_revenue):,.2f}",
                            "Kosten": f"€{float(calculation.total_costs):,.2f}",
                            "Gewinn": f"€{float(calculation.net_profit):,.2f}",
                            "Marge": f"{float(calculation.profit_margin_percent):.1f}%"
                        })
                        
                    except Exception as e:
                        st.error(f"Fehler beim Erstellen der Kalkulation: {str(e)}")
    
    async def show_project_analysis(self):
        """Show detailed project analysis"""
        st.header("🔍 Projekt-Analyse")
        
        # Get all calculations
        calculations = await self.service.get_calculations_by_date_range(date.today() - timedelta(days=365), date.today())
        
        if not calculations:
            st.info("Keine Kalkulationen verfügbar. Erstellen Sie zunächst eine Nachkalkulation.")
            return
        
        # Project selection
        project_options = [(c.nachkalkulation_id, f"{c.project.name if c.project else 'Unbekannt'} ({c.calculation_date})") for c in calculations]
        
        selected_calc_id = st.selectbox(
            "Kalkulation auswählen",
            options=project_options,
            format_func=lambda x: x[1]
        )[0] if project_options else None
        
        if selected_calc_id:
            calculation = await self.service.get_calculation(selected_calc_id)
            
            if calculation:
                st.subheader(f"📊 Analyse: {calculation.project.name if calculation.project else 'Unbekannt'}")
                
                # Summary cards
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    st.metric("Einnahmen", f"€{float(calculation.total_revenue or 0):,.2f}")
                
                with col2:
                    st.metric("Kosten", f"€{float(calculation.total_costs or 0):,.2f}")
                
                with col3:
                    st.metric("Gewinn", f"€{float(calculation.net_profit or 0):,.2f}")
                
                with col4:
                    st.metric("Marge", f"{float(calculation.profit_margin_percent or 0):.1f}%")
                
                # Cost breakdown chart
                st.subheader("💸 Kostenaufschlüsselung")
                
                cost_breakdown = {
                    'Mitarbeiter': float(calculation.cost_employees or 0),
                    'Fahrzeuge': float(calculation.cost_vehicles or 0),
                    'Materialien': float(calculation.cost_materials or 0),
                    'Externe': float(calculation.cost_external or 0),
                    'Gemeinkosten': float(calculation.cost_overhead or 0)
                }
                
                # Remove zero values
                cost_breakdown = {k: v for k, v in cost_breakdown.items() if v > 0}
                
                if cost_breakdown:
                    fig = px.pie(
                        values=list(cost_breakdown.values()),
                        names=list(cost_breakdown.keys()),
                        title="Kostenverteilung",
                        hole=0.4
                    )
                    st.plotly_chart(fig, use_container_width=True)
                
                # Revenue breakdown
                st.subheader("💰 Einnahmen-Aufschlüsselung")
                
                revenue_breakdown = {
                    'Dienstleistungen': float(calculation.revenue_services or 0),
                    'Materialien': float(calculation.revenue_materials or 0),
                    'Sonstiges': float(calculation.revenue_other or 0)
                }
                
                # Remove zero values
                revenue_breakdown = {k: v for k, v in revenue_breakdown.items() if v > 0}
                
                if revenue_breakdown:
                    fig = px.bar(
                        x=list(revenue_breakdown.keys()),
                        y=list(revenue_breakdown.values()),
                        title="Einnahmen nach Kategorie",
                        color=list(revenue_breakdown.keys())
                    )
                    st.plotly_chart(fig, use_container_width=True)
                
                # Profit analysis
                st.subheader("📈 Gewinn-Analyse")
                
                profit_data = {
                    'Kategorie': ['Einnahmen', 'Kosten', 'Gewinn'],
                    'Betrag': [
                        float(calculation.total_revenue or 0),
                        -float(calculation.total_costs or 0),
                        float(calculation.net_profit or 0)
                    ]
                }
                
                fig = px.bar(
                    profit_data,
                    x='Kategorie',
                    y='Betrag',
                    title="Gewinn & Verlust",
                    color='Kategorie',
                    color_discrete_map={'Einnahmen': 'green', 'Kosten': 'red', 'Gewinn': 'blue'}
                )
                st.plotly_chart(fig, use_container_width=True)
                
                # Details
                if st.checkbox("Detaillierte Informationen anzeigen"):
                    st.subheader("📄 Details")
                    
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.write("**Allgemeine Informationen:**")
                        st.write(f"- Kalkulations-ID: {calculation.nachkalkulation_id}")
                        st.write(f"- Erstellt am: {calculation.created_at}")
                        st.write(f"- Status: {calculation.status}")
                        st.write(f"- Gesperrt: {'Ja' if calculation.is_locked else 'Nein'}")
                        
                        if calculation.notes:
                            st.write(f"- Notizen: {calculation.notes}")
                    
                    with col2:
                        st.write("**Zeitliche Informationen:**")
                        st.write(f"- Geplante Stunden: {float(calculation.total_hours_planned or 0):.1f}")
                        st.write(f"- Tatsächliche Stunden: {float(calculation.total_hours_actual or 0):.1f}")
                        st.write(f"- Stundenabweichung: {float(calculation.hours_variance_percent or 0):.1f}%")
                        
                        if calculation.variance_explanation:
                            st.write(f"- Abweichungs-Erklärung: {calculation.variance_explanation}")
                
                # Actions
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    if st.button("📊 Details bearbeiten"):
                        st.info("Detail-Bearbeitung wird geladen...")
                
                with col2:
                    if not calculation.is_locked and st.button("🔒 Sperren"):
                        await self.service.lock_calculation(selected_calc_id, "system")
                        st.success("Kalkulation gesperrt!")
                        st.rerun()
                
                with col3:
                    if not calculation.is_locked and calculation.status != "Abgeschlossen" and st.button("✅ Freigeben"):
                        await self.service.approve_calculation(selected_calc_id, "system")
                        st.success("Kalkulation freigegeben!")
                        st.rerun()
    
    async def show_reports(self):
        """Show reports and analytics"""
        st.header("📈 Nachkalkulation Berichte")
        
        # Report type selection
        report_type = st.selectbox(
            "Berichtstyp",
            ["Gewinn-Verlust", "Kosten-Analyse", "Mitarbeiter-Effizienz", "Material-Verbrauch", "Vergleichs-Analyse"]
        )
        
        # Date range
        col1, col2 = st.columns(2)
        
        with col1:
            start_date = st.date_input("Startdatum", value=date.today() - timedelta(days=90))
        
        with col2:
            end_date = st.date_input("Enddatum", value=date.today())
        
        # Get data
        calculations = await self.service.get_calculations_by_date_range(start_date, end_date)
        
        if not calculations:
            st.info("Keine Kalkulationen für den ausgewählten Zeitraum gefunden")
            return
        
        if report_type == "Gewinn-Verlust":
            await self.show_profit_loss_report(calculations)
        elif report_type == "Kosten-Analyse":
            await self.show_cost_analysis_report(calculations)
        elif report_type == "Mitarbeiter-Effizienz":
            await self.show_employee_efficiency_report(calculations)
        elif report_type == "Material-Verbrauch":
            await self.show_material_consumption_report(calculations)
        elif report_type == "Vergleichs-Analyse":
            await self.show_comparison_report(calculations)
    
    async def show_profit_loss_report(self, calculations: List[Nachkalkulation]):
        """Show profit/loss report"""
        st.subheader("💰 Gewinn-Verlust Bericht")
        
        # Summary
        total_revenue = sum(float(c.total_revenue or 0) for c in calculations)
        total_costs = sum(float(c.total_costs or 0) for c in calculations)
        total_profit = sum(float(c.net_profit or 0) for c in calculations)
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Gesamteinnahmen", f"€{total_revenue:,.2f}")
        
        with col2:
            st.metric("Gesamtkosten", f"€{total_costs:,.2f}")
        
        with col3:
            st.metric("Nettogewinn", f"€{total_profit:,.2f}")
        
        # Data table
        data = []
        for calc in calculations:
            data.append({
                "Projekt": calc.project.name if calc.project else "Unbekannt",
                "Datum": calc.calculation_date,
                "Einnahmen": float(calc.total_revenue or 0),
                "Kosten": float(calc.total_costs or 0),
                "Gewinn": float(calc.net_profit or 0),
                "Marge %": float(calc.profit_margin_percent or 0)
            })
        
        df = pd.DataFrame(data)
        st.dataframe(df, use_container_width=True)
        
        # Export
        if st.button("📥 Exportieren"):
            csv = df.to_csv(index=False)
            st.download_button(
                label="Download CSV",
                data=csv,
                file_name="gewinn_verlust_bericht.csv",
                mime="text/csv"
            )
    
    async def show_cost_analysis_report(self, calculations: List[Nachkalkulation]):
        """Show cost analysis report"""
        st.subheader("💸 Kosten-Analyse Bericht")
        
        # Aggregate costs by category
        cost_categories = {
            'Mitarbeiter': sum(float(c.cost_employees or 0) for c in calculations),
            'Fahrzeuge': sum(float(c.cost_vehicles or 0) for c in calculations),
            'Materialien': sum(float(c.cost_materials or 0) for c in calculations),
            'Externe Dienstleister': sum(float(c.cost_external or 0) for c in calculations),
            'Gemeinkosten': sum(float(c.cost_overhead or 0) for c in calculations)
        }
        
        # Filter out zero categories
        cost_categories = {k: v for k, v in cost_categories.items() if v > 0}
        
        if cost_categories:
            # Pie chart
            fig = px.pie(
                values=list(cost_categories.values()),
                names=list(cost_categories.keys()),
                title="Kostenverteilung nach Kategorie"
            )
            st.plotly_chart(fig, use_container_width=True)
            
            # Bar chart
            fig2 = px.bar(
                x=list(cost_categories.keys()),
                y=list(cost_categories.values()),
                title="Kosten nach Kategorie",
                labels={'x': 'Kategorie', 'y': 'Kosten (€)'},
                color=list(cost_categories.keys())
            )
            st.plotly_chart(fig2, use_container_width=True)
            
            # Data table
            cost_df = pd.DataFrame([
                {"Kategorie": k, "Betrag": v, "Prozent": (v / sum(cost_categories.values()) * 100)}
                for k, v in cost_categories.items()
            ])
            st.dataframe(cost_df, use_container_width=True)
    
    async def show_employee_efficiency_report(self, calculations: List[Nachkalkulation]):
        """Show employee efficiency report"""
        st.subheader("👷 Mitarbeiter-Effizienz Bericht")
        st.info("Diese Funktion erfordert erweiterte Mitarbeiter-Daten. Implementierung in Arbeit...")
    
    async def show_material_consumption_report(self, calculations: List[Nachkalkulation]):
        """Show material consumption report"""
        st.subheader("📦 Material-Verbrauch Bericht")
        st.info("Diese Funktion erfordert erweiterte Material-Daten. Implementierung in Arbeit...")
    
    async def show_comparison_report(self, calculations: List[Nachkalkulation]):
        """Show comparison report"""
        st.subheader("📊 Vergleichs-Analyse")
        
        # Compare actual vs planned
        data = []
        for calc in calculations:
            if calc.project:
                data.append({
                    "Projekt": calc.project.name,
                    "Geplant Einnahmen": float(calc.project.total_revenue or 0),  # This would be from project planning
                    "Tatsächlich Einnahmen": float(calc.total_revenue or 0),
                    "Geplante Kosten": float(calc.project.total_costs or 0),  # This would be from project planning
                    "Tatsächliche Kosten": float(calc.total_costs or 0),
                    "Abweichung Einnahmen": float(calc.total_revenue or 0) - float(calc.project.total_revenue or 0),
                    "Abweichung Kosten": float(calc.total_costs or 0) - float(calc.project.total_costs or 0)
                })
        
        if data:
            df = pd.DataFrame(data)
            st.dataframe(df, use_container_width=True)


# Helper function to run the UI
async def run_nachkalkulation_ui():
    """Run the Nachkalkulation UI"""
    ui = NachkalkulationUI()
    await ui.run()


if __name__ == "__main__":
    import asyncio
    import io
    asyncio.run(run_nachkalkulation_ui())
