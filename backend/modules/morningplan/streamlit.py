"""
Streamlit frontend for Morningplan module
Optimized UI with German localization
"""
import streamlit as st
import pandas as pd
from datetime import datetime, date, timedelta
from typing import List, Optional
import plotly.express as px
import plotly.graph_objects as go
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from backend.core.database import get_db_session
from backend.modules.morningplan.models import MorningPlan, MorningPlanStaff, MorningPlanTask, MorningPlanChecklist
from backend.modules.morningplan.schemas import (
    MorningPlanCreate, MorningPlanUpdate, MorningPlanStaffCreate,
    MorningPlanTaskCreate, MorningPlanChecklistCreate, MorningPlanTaskUpdate
)
from backend.modules.morningplan.service import MorningPlanService
from backend.modules.projects.models import Project
from backend.modules.users.models import Employee
from backend.modules.vehicle_costs.models import Vehicle


class MorningplanUI:
    """Streamlit UI for Morningplan module"""
    
    def __init__(self):
        self.session = get_db_session()
        self.service = MorningPlanService(self.session)
    
    async def run(self):
        """Main UI entry point"""
        st.set_page_config(
            page_title="Morningplan Management",
            page_icon="📋",
            layout="wide"
        )
        
        st.title("🌅 Morningplan Management")
        
        # Sidebar navigation
        menu = st.sidebar.selectbox(
            "Navigation",
            ["Übersicht", "Prä-Morningplan", "Inter-Morningplan", "Post-Morningplan", 
             "Neuer Plan", "Berichte"]
        )
        
        if menu == "Übersicht":
            await self.show_overview()
        elif menu == "Prä-Morningplan":
            await self.show_plan_type_overview("prae", "Prä-Morningplan")
        elif menu == "Inter-Morningplan":
            await self.show_plan_type_overview("inter", "Inter-Morningplan")
        elif menu == "Post-Morningplan":
            await self.show_plan_type_overview("post", "Post-Morningplan")
        elif menu == "Neuer Plan":
            await self.create_new_plan()
        elif menu == "Berichte":
            await self.show_reports()
    
    async def show_overview(self):
        """Show overview dashboard"""
        st.header("📊 Morningplan Übersicht")
        
        col1, col2, col3, col4 = st.columns(4)
        
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        # Get plans for this week
        plans = await self.service.get_plans_by_date_range(week_start, week_end)
        
        # Calculate metrics
        total_plans = len(plans)
        completed_plans = len([p for p in plans if p.is_completed])
        pending_plans = len([p for p in plans if not p.is_completed and p.plan_date >= today])
        overdue_plans = len([p for p in plans if not p.is_completed and p.plan_date < today])
        
        with col1:
            st.metric("Gesamt Pläne diese Woche", total_plans)
        with col2:
            st.metric("Abgeschlossen", completed_plans)
        with col3:
            st.metric("Offen", pending_plans)
        with col4:
            st.metric("Überfällig", overdue_plans, delta=overdue_plans if overdue_plans > 0 else None, delta_color="inverse")
        
        # Plan type distribution
        st.subheader("📈 Planverteilung")
        
        type_counts = {}
        for plan in plans:
            plan_type = plan.plan_type
            if plan_type == "prae":
                type_name = "Prä-Morningplan"
            elif plan_type == "inter":
                type_name = "Inter-Morningplan"
            elif plan_type == "post":
                type_name = "Post-Morningplan"
            else:
                type_name = plan_type
            
            type_counts[type_name] = type_counts.get(type_name, 0) + 1
        
        if type_counts:
            fig = px.pie(
                values=list(type_counts.values()),
                names=list(type_counts.keys()),
                title="Verteilung der Plantypen"
            )
            st.plotly_chart(fig, use_container_width=True)
        
        # Today's plans
        st.subheader("📅 Heutige Pläne")
        today_plans = await self.service.get_plans_by_date(today)
        
        if today_plans:
            plan_data = []
            for plan in today_plans:
                plan_data.append({
                    "Datum": plan.plan_date,
                    "Typ": "Prä" if plan.plan_type == "prae" else "Inter" if plan.plan_type == "inter" else "Post",
                    "Titel": plan.title,
                    "Status": plan.status,
                    "Mitarbeiter": len(plan.staff),
                    "Aufgaben": len(plan.tasks),
                    "Fahrzeug": plan.vehicle_assignment or "-"
                })
            
            df = pd.DataFrame(plan_data)
            st.dataframe(df, use_container_width=True)
        else:
            st.info("Keine Pläne für heute")
        
        # Quick actions
        st.subheader("⚡ Schnellaktionen")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("Neuer Prä-Morningplan", use_container_width=True):
                st.session_state.new_plan_type = "prae"
                st.rerun()
        
        with col2:
            if st.button("Neuer Inter-Morningplan", use_container_width=True):
                st.session_state.new_plan_type = "inter"
                st.rerun()
        
        with col3:
            if st.button("Neuer Post-Morningplan", use_container_width=True):
                st.session_state.new_plan_type = "post"
                st.rerun()
    
    async def show_plan_type_overview(self, plan_type: str, title: str):
        """Show overview for specific plan type"""
        st.header(f"📝 {title}")
        
        # Filters
        col1, col2, col3 = st.columns(3)
        
        with col1:
            date_filter = st.selectbox("Zeitraum", ["Heute", "Diese Woche", "Dieser Monat", "Alle"])
        
        with col2:
            status_filter = st.selectbox("Status", ["Alle", "Entwurf", "Bestätigt", "Abgeschlossen"])
        
        with col3:
            project_filter = st.text_input("Projekt filtern")
        
        # Get plans based on filters
        today = date.today()
        
        if date_filter == "Heute":
            start_date = today
            end_date = today
        elif date_filter == "Diese Woche":
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif date_filter == "Dieser Monat":
            start_date = today.replace(day=1)
            next_month = today.replace(day=28) + timedelta(days=4)
            end_date = next_month - timedelta(days=next_month.day)
        else:
            start_date = today - timedelta(days=365)
            end_date = today + timedelta(days=365)
        
        plans = await self.service.get_plans_by_date_range(start_date, end_date, plan_type)
        
        if status_filter != "Alle":
            plans = [p for p in plans if p.status == status_filter]
        
        if project_filter:
            plans = [p for p in plans if p.project and project_filter.lower() in p.project.name.lower()]
        
        # Display plans
        if plans:
            st.subheader(f"📋 {len(plans)} Pläne gefunden")
            
            for plan in plans:
                with st.expander(f"{plan.plan_date} - {plan.title}"):
                    col1, col2, col3, col4 = st.columns(4)
                    
                    with col1:
                        st.write(f"**Status:** {plan.status}")
                        st.write(f"**Mitarbeiter:** {len(plan.staff)}")
                    
                    with col2:
                        st.write(f"**Aufgaben:** {len(plan.tasks)}")
                        completed_tasks = len([t for t in plan.tasks if t.status == 'Erledigt'])
                        st.write(f"**Erledigt:** {completed_tasks}")
                    
                    with col3:
                        st.write(f"**Checkliste:** {len(plan.checklist)} Items")
                        completed_checklist = len([c for c in plan.checklist if c.is_completed])
                        st.write(f"**Abgehakt:** {completed_checklist}")
                    
                    with col4:
                        if plan.vehicle_assignment:
                            st.write(f"**Fahrzeug:** {plan.vehicle_assignment}")
                        if plan.planned_start_time:
                            st.write(f"**Start:** {plan.planned_start_time.strftime('%H:%M')}")
                    
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        if st.button("📝 Bearbeiten", key=f"edit_{plan.plan_id}"):
                            st.session_state.edit_plan_id = plan.plan_id
                            st.rerun()
                    
                    with col2:
                        if st.button("📋 Duplizieren", key=f"dup_{plan.plan_id}"):
                            new_date = st.date_input("Neues Datum", value=plan.plan_date + timedelta(days=1))
                            if st.button("Duplizieren bestätigen"):
                                await self.service.duplicate_plan(plan.plan_id, new_date, "system")
                                st.success("Plan dupliziert!")
                                st.rerun()
                    
                    with col3:
                        if st.button("🗑️ Löschen", key=f"del_{plan.plan_id}"):
                            await self.service.delete_plan(plan.plan_id)
                            st.success("Plan gelöscht!")
                            st.rerun()
        else:
            st.info("Keine Pläne für den ausgewählten Zeitraum gefunden")
            
            if st.button("Neuen Plan erstellen"):
                st.session_state.new_plan_type = plan_type
                st.rerun()
    
    async def create_new_plan(self):
        """Create new morning plan"""
        st.header("➕ Neuer Morningplan")
        
        # Get plan type from session or default
        plan_type = st.session_state.get('new_plan_type', 'prae')
        
        # Basic information
        col1, col2 = st.columns(2)
        
        with col1:
            plan_type = st.selectbox(
                "Plantyp",
                options=[("prae", "Prä-Morningplan"), ("inter", "Inter-Morningplan"), ("post", "Post-Morningplan")],
                format_func=lambda x: x[1],
                index=0 if plan_type == "prae" else 1 if plan_type == "inter" else 2
            )[0]
            
            plan_date = st.date_input("Datum", value=date.today())
            
            # Get projects
            result = await self.session.execute(select(Project))
            projects = result.scalars().all()
            
            project_options = [(p.project_id, p.name or p.project_code or "Unbekannt") for p in projects]
            project_id = st.selectbox(
                "Projekt",
                options=project_options,
                format_func=lambda x: x[1]
            )[0] if project_options else None
        
        with col2:
            title = st.text_input("Titel", placeholder="Morningplan Titel")
            
            planned_start = st.time_input("Geplante Startzeit", value=datetime.strptime("08:00", "%H:%M").time())
            planned_end = st.time_input("Geplante Endzeit", value=datetime.strptime("17:00", "%H:%M").time())
            
            vehicle_assignment = st.text_input("Fahrzeugzuordnung", placeholder="Fahrzeug-Kennzeichen")
        
        description = st.text_area("Beschreibung", placeholder="Detaillierte Beschreibung des Plans")
        
        # Location information
        st.subheader("📍 Ortsangaben")
        col1, col2 = st.columns(2)
        
        with col1:
            start_location = st.text_input("Startort", placeholder="Firmensitz oder Abholort")
        
        with col2:
            end_location = st.text_input("Zielort", placeholder="Einsatzort oder Zielort")
        
        # Staff selection
        st.subheader("👥 Mitarbeiterzuordnung")
        
        result = await self.session.execute(select(Employee))
        employees = result.scalars().all()
        
        if employees:
            selected_employees = st.multiselect(
                "Mitarbeiter auswählen",
                options=employees,
                format_func=lambda e: f"{e.user.full_name if e.user else 'Unbekannt'} ({e.department or 'Keine Abteilung'})"
            )
            
            staff_data = []
            for emp in selected_employees:
                col1, col2 = st.columns(2)
                with col1:
                    role = st.selectbox(
                        f"Rolle für {emp.user.full_name if emp.user else 'Mitarbeiter'}",
                        options=["Mitarbeiter", "Teamleiter", "Fahrer", "Meister"],
                        key=f"role_{emp.employee_id}"
                    )
                
                staff_data.append({
                    "employee_id": emp.employee_id,
                    "role": role,
                    "sort_order": len(staff_data)
                })
        else:
            st.warning("Keine Mitarbeiter verfügbar")
            staff_data = []
        
        # Tasks
        st.subheader("✅ Aufgaben")
        
        task_count = st.number_input("Anzahl der Aufgaben", min_value=0, max_value=20, value=3)
        
        tasks_data = []
        for i in range(task_count):
            col1, col2 = st.columns(2)
            
            with col1:
                task_name = st.text_input(f"Aufgabe {i+1} Name", key=f"task_name_{i}")
                task_category = st.selectbox(
                    f"Kategorie {i+1}",
                    options=["Vorbereitung", "Transport", "Arbeit", "Aufräumen", "Dokumentation"],
                    key=f"task_cat_{i}"
                )
            
            with col2:
                estimated_duration = st.number_input(f"Geschätzte Dauer (Min) {i+1}", min_value=0, max_value=480, value=60, key=f"task_dur_{i}")
                task_priority = st.selectbox(
                    f"Priorität {i+1}",
                    options=["Niedrig", "Normal", "Hoch", "Kritisch"],
                    index=1,
                    key=f"task_prio_{i}"
                )
            
            if task_name:
                tasks_data.append({
                    "task_name": task_name,
                    "task_category": task_category,
                    "estimated_duration": estimated_duration,
                    "priority": task_priority
                })
        
        # Checklist
        st.subheader("📋 Checkliste")
        
        checklist_templates = {
            "prae": ["Fahrzeug checken", "Material verladen", "Route planen", "Kundentelefonat führen", "Team briefing"],
            "inter": ["Zwischenstand dokumentieren", "Materialnachschub organisieren", "Team check-in"],
            "post": ["Arbeitsende dokumentieren", "Fahrzeug reinigen", "Material zurückführen", "Kundenfeedback einholen"]
        }
        
        template_items = checklist_templates.get(plan_type, [])
        
        st.write("Vorgeschlagene Checklist-Items:")
        selected_items = []
        for item in template_items:
            if st.checkbox(item, value=True):
                selected_items.append(item)
        
        custom_items = st.text_area("Weitere Checklist-Items (eine pro Zeile)", placeholder="z.B. Sicherheitsausrüstung checken\\nWerkzeuge mitnehmen")
        
        if custom_items:
            for item in custom_items.split("\\n"):
                if item.strip():
                    selected_items.append(item.strip())
        
        # Create plan
        if st.button("Plan erstellen", type="primary"):
            try:
                # Prepare plan data
                plan_data = MorningPlanCreate(
                    plan_date=plan_date,
                    plan_type=plan_type,
                    project_id=project_id,
                    title=title or f"{plan_type.upper()}-Morningplan {plan_date}",
                    description=description,
                    planned_start_time=datetime.combine(plan_date, planned_start),
                    planned_end_time=datetime.combine(plan_date, planned_end),
                    start_location=start_location,
                    end_location=end_location,
                    vehicle_assignment=vehicle_assignment,
                    status="Entwurf"
                )
                
                # Create the plan
                plan = await self.service.create_plan(plan_data, "system")
                
                # Add staff
                for staff_item in staff_data:
                    staff_create = MorningPlanStaffCreate(**staff_item)
                    await self.service.add_staff_to_plan(plan.plan_id, staff_create)
                
                # Add tasks
                for task_item in tasks_data:
                    task_create = MorningPlanTaskCreate(**task_item)
                    await self.service.add_task_to_plan(plan.plan_id, task_create)
                
                # Add checklist items
                for checklist_item in selected_items:
                    checklist_create = MorningPlanChecklistCreate(item_name=checklist_item)
                    await self.service.add_checklist_item(plan.plan_id, checklist_create)
                
                st.success(f"Morningplan '{plan.title}' erfolgreich erstellt!")
                st.balloons()
                
                # Show the created plan
                st.subheader("📋 Erstellter Plan")
                st.json({
                    "Plan-ID": plan.plan_id,
                    "Titel": plan.title,
                    "Datum": str(plan.plan_date),
                    "Typ": plan.plan_type,
                    "Mitarbeiter": len(staff_data),
                    "Aufgaben": len(tasks_data),
                    "Checklist-Items": len(selected_items)
                })
                
            except Exception as e:
                st.error(f"Fehler beim Erstellen des Plans: {str(e)}")
    
    async def show_reports(self):
        """Show reports and analytics"""
        st.header("📈 Morningplan Berichte")
        
        # Date range selection
        col1, col2 = st.columns(2)
        
        with col1:
            start_date = st.date_input("Startdatum", value=date.today() - timedelta(days=30))
        
        with col2:
            end_date = st.date_input("Enddatum", value=date.today())
        
        # Get summary data
        plans_with_summary = await self.service.get_plans_with_summary(start_date, end_date)
        
        if plans_with_summary:
            st.subheader(f"📊 Zusammenfassung ({len(plans_with_summary)} Pläne)")
            
            # Create summary dataframe
            summary_data = []
            for item in plans_with_summary:
                plan = item['plan']
                summary_data.append({
                    "Datum": plan.plan_date,
                    "Typ": plan.plan_type,
                    "Titel": plan.title,
                    "Status": plan.status,
                    "Mitarbeiter": item['staff_count'],
                    "Aufgaben": item['task_count'],
                    "Erledigt": item['completed_tasks'],
                    "Checklist": f"{int(item['checklist_progress'] * 100)}%"
                })
            
            df = pd.DataFrame(summary_data)
            st.dataframe(df, use_container_width=True)
            
            # Export functionality
            if st.button("📥 Als CSV exportieren"):
                csv = df.to_csv(index=False)
                st.download_button(
                    label="Download CSV",
                    data=csv,
                    file_name=f"morningplan_bericht_{start_date}_{end_date}.csv",
                    mime="text/csv"
                )
            
            # Charts
            col1, col2 = st.columns(2)
            
            with col1:
                # Plans by status
                status_counts = df['Status'].value_counts()
                fig = px.bar(x=status_counts.index, y=status_counts.values, title="Pläne nach Status")
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                # Plans by type
                type_counts = df['Typ'].value_counts()
                fig = px.pie(values=type_counts.values, names=type_counts.index, title="Verteilung nach Typ")
                st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Keine Daten für den ausgewählten Zeitraum verfügbar")


# Helper function to run the UI
async def run_morningplan_ui():
    """Run the Morningplan UI"""
    ui = MorningplanUI()
    await ui.run()


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_morningplan_ui())
