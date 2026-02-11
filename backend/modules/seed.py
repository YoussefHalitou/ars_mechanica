"""
Comprehensive Mock Data Generator for LIS System
Creates extensive test data for all modules to enable thorough testing
"""

import asyncio
import random
from datetime import datetime, timedelta, date
from decimal import Decimal
from typing import List, Dict, Any, Optional
from uuid import uuid4
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import AsyncSessionLocal, Base, engine
from backend.modules.users.models import User, Employee
from backend.modules.services.models import Service, ServiceCategory
from backend.modules.materials.models import Material, MaterialCategory
from backend.modules.projects.models import Project, ProjectStatus
from backend.modules.time_pairs.models import TimePair
from backend.modules.inspections.models import Inspection, InspectionCategory
from backend.modules.abnahmen.models import Abnahme
from backend.modules.analytics.models import AnalyticsEvent
from backend.modules.feedback.models import Feedback
from backend.modules.vehicle_costs.models import VehicleCost
from backend.modules.material_usage.models import MaterialUsage
from backend.modules.revenue.models import Revenue


class MockDataGenerator:
    """Generates comprehensive mock data for all modules"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.random = random.Random(42)  # Fixed seed for reproducibility
        
        # German company names
        self.company_names = [
            "Müller & Sohn GmbH",
            "Schmidt Bauunternehmen KG",
            "Weber Dienstleistungen",
            "Fischer Handwerker",
            "Meyer Immobilien",
            "Wagner Transporte",
            "Beck Malerbetrieb",
            "Schäfer Elektro",
            "Hoffmann Sanitär",
            "Keller Gartenbau",
            "Bauer Schreinerei",
            "Richter Kälte-Technik",
            "Klein Gebäudereinigung",
            "Wolf Sicherheitstechnik",
            "Schröder Eventtechnik",
            "Neumann Logistik",
            "Schwarz Catering",
            "Zimmermann Metallbau",
            "Braun Facility Management",
            "Hartmann IT-Dienstleistungen"
        ]
        
        # German first names
        self.first_names = [
            "Hans", "Peter", "Wolfgang", "Klaus", "Jürgen", "Michael", "Thomas",
            "Andreas", "Stefan", "Markus", "Christian", "Martin", "Uwe", "Frank",
            "Marie", "Anna", "Lisa", "Sarah", "Laura", "Julia", "Sandra", "Claudia",
            "Nicole", "Katharina", "Petra", "Gabriele", "Monika", "Brigitte"
        ]
        
        # German last names
        self.last_names = [
            "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner",
            "Becker", "Hoffmann", "Schäfer", "Koch", "Bauer", "Richter", "Klein",
            "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann", "Braun",
            "Hartmann", "Lange", "Schmitt", "Meier", "Krause", "Schulz", "Lehmann"
        ]
        
        # Streets
        self.streets = [
            "Hauptstraße", "Bahnhofstraße", "Marktplatz", "Schillerstraße",
            "Goethestraße", "Friedrichstraße", "Berliner Straße", "Münchener Straße",
            "Rosenstraße", "Lindenstraße", "Eichenweg", "Ahornstraße", "Birkenallee",
            "Kastanienweg", "Tulpenweg", "Sonnenstraße", "Mondweg", "Sternenplatz"
        ]
        
        # Service categories and names
        self.service_categories = [
            ("Umzug", "Umzugsdienstleistungen"),
            ("Reinigung", "Reinigungsdienste"),
            ("Montage", "Montagearbeiten"),
            ("Transport", "Transportdienste"),
            ("Lagerung", "Einlagerungsdienste"),
            ("Entsorgung", "Entsorgungsdienste"),
            ("Handwerk", "Handwerkerleistungen"),
            ("Beratung", "Beratungsdienste")
        ]
        
        self.service_names = [
            "1-Zimmer-Wohnung", "2-Zimmer-Wohnung", "3-Zimmer-Wohnung", "4-Zimmer-Wohnung",
            "Büroumzug", "Geschäftsumzug", "Firmenumzug", "Teilumzug",
            "Möbelmontage", "Küchenmontage", "Regalmontage", "Büromöbelaufbau",
            "Umzugskartons", "Verpackungsmaterial", "Kleiderboxen", "Matratzenschoner",
            "Fensterreinigung", "Bodenreinigung", "Wohnungsreinigung", "Büroreinigung",
            "Möbeltransport", "Sperrmüllentfernung", "Entrümpelung", "Kellerentrümpelung",
            "Möbellagerung", "Archivlagerung", "Saisonlagerung", "Überbrückungseinlagerung",
            "Packservice", "Auspackservice", "Möbelverpackung", "Antiktransport",
            "Klaviertransport", "Safetransport", "IT-Transport", "Laborumzug"
        ]
        
        # Material categories and names
        self.material_categories = [
            ("Verpackung", "Verpackungsmaterialien"),
            ("Transport", "Transportmittel"),
            ("Schutz", "Schutzmittel"),
            ("Werkzeug", "Werkzeuge"),
            ("Reinigung", "Reinigungsmittel"),
            ("Lagerung", "Lagermaterialien")
        ]
        
        self.material_names = [
            "Umzugskarton 2-wellig", "Umzugskarton 3-wellig", "Kleiderbox", "Bücherkarton",
            "Seidenpapier", "Packpapier", "Luftpolsterfolie", "Klebeband",
            "Stretchfolie", "Möbeldecke", "Matratzenschoner", "Eckenschutz",
            "Folie", "Antistatik-Beutel", "Kabelbinder", "Markierungsstift",
            "Fahrzeug 3.5t", "Fahrzeug 7.5t", "Fahrzeug 12t", "Fahrzeug 40t",
            "Hubwagen", "Sackkarre", "Tragegurt", "Möbelroller",
            "Schutzhandschuhe", "Sicherheitsschuhe", "Helm", "Warnweste",
            "Allzweckreiniger", "Glasreiniger", "Bodenreiniger", "Desinfektionsmittel",
            "Regal", "Transportkiste", "Paletten", "Lagerboxen"
        ]
        
        # Project statuses
        self.project_statuses = ["angeboten", "bestätigt", "in_bearbeitung", "abgeschlossen", "storniert"]
        
        # Inspection categories
        self.inspection_categories = [
            ("Abnahme", "Abnahmeprotokoll"),
            ("Qualität", "Qualitätskontrolle"),
            ("Sicherheit", "Sicherheitsprüfung"),
            ("Wartung", "Wartungsprüfung"),
            ("Inventar", "Inventurkontrolle")
        ]
        
        # Vehicle types
        self.vehicle_types = ["Transporter", "LKW", "Anhänger", "Spezialfahrzeug", "Bus"]
        
        # Revenue types
        self.revenue_types = ["Dienstleistung", "Material", "Miete", "Beratung", "Sonstiges"]
        
        # Feedback types
        self.feedback_types = ["positiv", "neutral", "negativ"]
        
        # Analytics event types
        self.analytics_events = ["page_view", "button_click", "form_submit", "export", "import", "error"]

    async def clear_all_data(self):
        """Clear all existing data from all tables"""
        print("🧹 Lösche vorhandene Daten...")
        
        # Delete in reverse order to respect foreign key constraints
        tables_to_truncate = [
            'public.t_abnahmen',
            'public.t_analytics_events',
            'public.t_feedback',
            'public.t_material_usage',
            'public.t_revenue',
            'public.t_vehicle_costs',
            'public.t_time_pairs',
            'public.t_inspections',
            'public.t_projects',
            'public.t_materials',
            'public.t_service_categories',
            'public.t_services',
            'public.t_material_categories',
            'public.t_employees',
            'public.t_users'
        ]
        
        for table_name in tables_to_truncate:
            try:
                await self.session.execute(text(f"TRUNCATE TABLE {table_name} CASCADE"))
            except Exception:
                pass  # Table may not exist
        
        await self.session.commit()
        print("✅ Alle Daten gelöscht")

    async def create_users_and_employees(self, count: int = 50):
        """Create users and employees"""
        print(f"👥 Erstelle {count} Benutzer und Mitarbeiter...")
        
        users = []
        employees = []
        
        for i in range(count):
            # Create user with unique email
            first_name = self.random.choice(self.first_names)
            last_name = self.random.choice(self.last_names)
            email = f"{first_name.lower()}.{last_name.lower()}.{i}@example.com"
            
            roles = ["Admin", "Secretary", "Planner", "Supervisor", "Worker"]
            user_types = ["office", "field"]
            
            user = User(
                email=email,
                role=self.random.choice(roles) if i > 0 else "Admin",
                user_type=self.random.choice(user_types),
                is_active=self.random.random() > 0.1  # 90% active
            )
            users.append(user)
            
            # Create employee for most users
            if self.random.random() > 0.2:  # 80% have employee record
                employee = Employee(
                    user=user,
                    email=email,
                    employee_number=f"EMP{str(i+1).zfill(4)}",
                    first_name=first_name,
                    last_name=last_name,
                    phone=f"+49{self.random.randint(100, 999)}{self.random.randint(1000000, 9999999)}",
                    hire_date=self.random_date(date(2020, 1, 1), date(2024, 12, 31)),
                    department=self.random.choice(["Umzug", "Reinigung", "Montage", "Transport", "Verwaltung"]),
                    position=self.random.choice(["Mitarbeiter", "Teamleiter", "Meister", "Geselle", "Azubi"])
                )
                employees.append(employee)
        
        self.session.add_all(users)
        await self.session.flush()
        
        self.session.add_all(employees)
        await self.session.commit()
        
        print(f"✅ {len(users)} Benutzer und {len(employees)} Mitarbeiter erstellt")
        return users, employees

    async def create_services(self, count: int = 100):
        """Create services with categories"""
        print(f"🔧 Erstelle {count} Dienstleistungen...")
        
        # Create categories first
        categories = []
        for name, description in self.service_categories:
            category = ServiceCategory(
                name=name,
                description=description
            )
            categories.append(category)
        
        self.session.add_all(categories)
        await self.session.flush()
        
        # Create services
        services = []
        base_prices = {
            "Umzug": (150, 2000),
            "Reinigung": (80, 800),
            "Montage": (100, 1500),
            "Transport": (50, 500),
            "Lagerung": (30, 300),
            "Entsorgung": (40, 400),
            "Handwerk": (120, 1200),
            "Beratung": (80, 500)
        }
        
        for i in range(count):
            category = self.random.choice(categories)
            min_price, max_price = base_prices.get(category.name, (50, 500))
            
            service = Service(
                service_id=f"SRV{str(i+1).zfill(4)}",
                name=self.random.choice(self.service_names),
                category=category.name,
                default_unit=self.random.choice(["Stunde", "Stück", "m²", "Pauschal", "Tag"]),
                is_active=self.random.random() > 0.1
            )
            services.append(service)
        
        self.session.add_all(services)
        await self.session.commit()
        
        print(f"✅ {len(categories)} Kategorien und {len(services)} Dienstleistungen erstellt")
        return services

    async def create_materials(self, count: int = 80):
        """Create materials with categories"""
        print(f"📦 Erstelle {count} Materialien...")
        
        # Create categories first
        categories = []
        for name, description in self.material_categories:
            category = MaterialCategory(
                name=name,
                description=description
            )
            categories.append(category)
        
        self.session.add_all(categories)
        await self.session.flush()
        
        # Create materials
        materials = []
        base_prices = {
            "Verpackung": (0.5, 50),
            "Transport": (50, 500),
            "Schutz": (5, 100),
            "Werkzeug": (10, 200),
            "Reinigung": (3, 30),
            "Lagerung": (20, 300)
        }
        
        for i in range(count):
            category = self.random.choice(categories)
            min_price, max_price = base_prices.get(category.name, (5, 100))
            
            material = Material(
                material_id=f"MAT{str(i+1).zfill(4)}",
                name=self.random.choice(self.material_names),
                category=category.name,
                unit=self.random.choice(["Stück", "Pack", "Rolle", "Liter", "m", "m²", "m³"]),
                vat_rate=Decimal("19.00"),
                is_active=self.random.random() > 0.1
            )
            materials.append(material)
        
        self.session.add_all(materials)
        await self.session.commit()
        
        print(f"✅ {len(categories)} Materialkategorien und {len(materials)} Materialien erstellt")
        return materials

    async def create_projects(self, count: int = 150):
        """Create projects with time pairs"""
        print(f"📋 Erstelle {count} Projekte...")
        
        # Get users and services
        result = await self.session.execute(select(User))
        users = result.scalars().all()
        
        result = await self.session.execute(select(Service))
        services = result.scalars().all()
        
        result = await self.session.execute(select(Employee))
        employees = result.scalars().all()
        
        projects = []
        time_pairs = []
        
        for i in range(count):
            if not users or not services:
                break
                
            user = self.random.choice(users)
            service = self.random.choice(services)
            
            # Project dates
            created_date = self.random_date(date(2023, 1, 1), date(2024, 12, 31))
            start_date = created_date + timedelta(days=self.random.randint(1, 30))
            end_date = start_date + timedelta(days=self.random.randint(1, 14))
            
            # Simple project creation
            first_name = self.random.choice(self.first_names)
            last_name = self.random.choice(self.last_names)
            street = self.random.choice(self.streets)
            
            project = Project(
                project_id=f"PRJ{date.today().year}{str(i+1).zfill(5)}",
                project_code=f"P{date.today().year}-{str(i+1).zfill(4)}",
                anrede=self.random.choice(["Herr", "Frau"]),
                name=f"{first_name} {last_name}",
                strasse=street,
                nr=str(self.random.randint(1, 200)),
                plz=f"{self.random.randint(10000, 99999)}",
                ort=self.random.choice(["Berlin", "München", "Hamburg", "Köln", "Frankfurt", "Stuttgart"]),
                telefon=f"+49{self.random.randint(100, 999)}{self.random.randint(1000000, 9999999)}",
                email=f"{first_name.lower()}.{last_name.lower()}.{i}@kunde.de",
                notes=self.random.choice(["", "", "", "Kunde wünscht frühen Termin", "Besondere Vorsicht"]),
                dienstleistungen=service.name,
                project_date=start_date,
                project_start_date=start_date,
                project_end_date=end_date if self.random.random() > 0.3 else None,
                status=self.random.choice(self.project_statuses)
            )
            projects.append(project)
            
            # Create time pairs for this project
            if employees and self.random.random() > 0.2:  # 80% of projects have time pairs
                num_time_pairs = self.random.randint(1, 5)
                for _ in range(num_time_pairs):
                    employee = self.random.choice(employees)
                    
                    # Time pair dates
                    tp_start_date = self.random_date(start_date, end_date or date.today())
                    tp_start_time = self.random_time()
                    tp_end_time = (datetime.combine(tp_start_date, tp_start_time) + 
                                 timedelta(hours=self.random.uniform(2, 10))).time()
                    
                    duration_hours = (datetime.combine(tp_start_date, tp_end_time) - 
                                    datetime.combine(tp_start_date, tp_start_time)).seconds / 3600
                    
                    time_pair = TimePair(
                        pair_id=f"TP{str(len(time_pairs)+1).zfill(6)}",
                        project_id=project.project_id,
                        datum=tp_start_date,
                        mitarbeiter=f"{employee.first_name} {employee.last_name}",
                        employee_id=employee.employee_id,
                        employee_name=f"{employee.first_name} {employee.last_name}",
                        employee_code=employee.employee_number,
                        lis_von=tp_start_time,
                        lis_bis=tp_end_time,
                        kunde_von=tp_start_time,
                        kunde_bis=tp_end_time,
                        pause_min=self.random.choice([0, 15, 30, 45]),
                        ges_lis_h=Decimal(str(round(duration_hours, 2))),
                        ges_kd_h=Decimal(str(round(duration_hours, 2))),
                        notes=self.random.choice(["", "", "", "Gute Arbeit", "Überstunden"])
                    )
                    time_pairs.append(time_pair)
        
        self.session.add_all(projects)
        await self.session.flush()
        
        self.session.add_all(time_pairs)
        await self.session.commit()
        
        print(f"✅ {len(projects)} Projekte und {len(time_pairs)} Zeiteinträge erstellt")
        return projects, time_pairs

    async def create_inspections(self, count: int = 60):
        """Create inspections"""
        print(f"🔍 Erstelle {count} Inspektionen...")
        
        # Get projects
        result = await self.session.execute(select(Project))
        projects = result.scalars().all()
        
        result = await self.session.execute(select(Employee))
        employees = result.scalars().all()
        
        inspections = []
        
        for i in range(count):
            if not projects:
                break
                
            project = self.random.choice(projects)
            inspector = self.random.choice(employees) if employees else None
            category = self.random.choice(self.inspection_categories)
            
            inspection_date = self.random_date(
                project.project_start_date or date(2023, 1, 1),
                project.end_date or date.today()
            )
            
            inspection = Inspection(
                project=project,
                inspection_number=f"INSP{str(i+1).zfill(4)}",
                name=category[0],
                description=category[1],
                inspection_date=inspection_date,
                inspector=inspector.full_name if inspector else f"Prüfer {i+1}",
                status=self.random.choice(["bestanden", "bestanden_mit_mängeln", "nicht_bestanden"]),
                notes=self.random.choice([
                    "", "", "",
                    "Alles in Ordnung",
                    "Kleine Mängel wurden behoben",
                    "Gründliche Arbeit durchgeführt",
                    "Kunde sehr zufrieden"
                ]),
                score=self.random.randint(70, 100) if self.random.random() > 0.2 else None
            )
            inspections.append(inspection)
        
        self.session.add_all(inspections)
        await self.session.commit()
        
        print(f"✅ {len(inspections)} Inspektionen erstellt")
        return inspections

    async def create_abnahmen(self, count: int = 40):
        """Create Abnahmen (completion protocols)"""
        print(f"✅ Erstelle {count} Abnahmeprotokolle...")
        
        # Get projects
        result = await self.session.execute(select(Project))
        projects = result.scalars().all()
        
        abnahmen = []
        
        for i in range(count):
            if not projects:
                break
                
            project = self.random.choice(projects)
            
            # Abnahme date should be after project end
            abnahme_date = self.random_date(
                project.end_date or project.start_date or date(2023, 1, 1),
                date.today()
            )
            
            abnahme = Abnahme(
                project=project,
                protocol_number=f"ABN{str(i+1).zfill(4)}",
                abnahme_date=abnahme_date,
                customer_name=project.user.company_name,
                customer_signatory=self.random.choice(self.first_names) + " " + self.random.choice(self.last_names),
                description=f"Abnahme für {project.title}",
                work_completed=self.random.random() > 0.1,
                payment_received=self.random.random() > 0.3,
                defects_reported=self.random.random() > 0.2,
                defect_description=self.random.choice(["", "Keine Mängel", "Kleine Kosmetikfehler"]) if self.random.random() > 0.8 else "",
                completion_percentage=self.random.randint(90, 100),
                notes=self.random.choice(["", "", "Kunde zufrieden", "Reibungsloser Ablauf"]),
                follow_up_required=self.random.random() > 0.8
            )
            abnahmen.append(abnahme)
        
        self.session.add_all(abnahmen)
        await self.session.commit()
        
        print(f"✅ {len(abnahmen)} Abnahmeprotokolle erstellt")
        return abnahmen

    async def create_vehicle_costs(self, count: int = 100):
        """Create vehicle costs"""
        print(f"🚗 Erstelle {count} Fahrzeugkosten...")
        
        result = await self.session.execute(select(Project))
        projects = result.scalars().all()
        
        vehicle_costs = []
        
        for i in range(count):
            if not projects:
                break
                
            project = self.random.choice(projects)
            vehicle_type = self.random.choice(self.vehicle_types)
            
            # Cost date
            cost_date = self.random_date(
                project.start_date or date(2023, 1, 1),
                project.end_date or date.today()
            )
            
            # Different cost types
            cost_type = self.random.choice([
                "Kraftstoff", "Wartung", "Reparatur", "Versicherung", 
                "Maut", "Parkgebühr", "Reifen", "Steuer"
            ])
            
            # Price based on cost type
            if cost_type == "Kraftstoff":
                amount = self.random.randint(50, 300)
            elif cost_type == "Wartung":
                amount = self.random.randint(100, 800)
            elif cost_type == "Reparatur":
                amount = self.random.randint(50, 2000)
            elif cost_type == "Versicherung":
                amount = self.random.randint(50, 200)
            else:
                amount = self.random.randint(10, 200)
            
            vehicle_cost = VehicleCost(
                project=project,
                cost_date=cost_date,
                vehicle_type=vehicle_type,
                vehicle_identifier=f"{vehicle_type[:3].upper()}-{self.random.randint(100, 999)}",
                description=f"{cost_type} für {vehicle_type}",
                cost_type=cost_type,
                amount=Decimal(str(amount)),
                mileage=self.random.randint(0, 500) if cost_type == "Kraftstoff" else None,
                receipt_number=f"BELEG-{self.random.randint(10000, 99999)}",
                notes=self.random.choice(["", "", "Regelmäßige Wartung"])
            )
            vehicle_costs.append(vehicle_cost)
        
        self.session.add_all(vehicle_costs)
        await self.session.commit()
        
        print(f"✅ {len(vehicle_costs)} Fahrzeugkosten erstellt")
        return vehicle_costs

    async def create_material_usage(self, count: int = 150):
        """Create material usage records"""
        print(f"📊 Erstelle {count} Materialverbrauch...")
        
        result = await self.session.execute(select(Project))
        projects = result.scalars().all()
        
        result = await self.session.execute(select(Material))
        materials = result.scalars().all()
        
        material_usage = []
        
        for i in range(count):
            if not projects or not materials:
                break
                
            project = self.random.choice(projects)
            material = self.random.choice(materials)
            
            usage_date = self.random_date(
                project.start_date or date(2023, 1, 1),
                project.end_date or date.today()
            )
            
            quantity = self.random.randint(1, 100)
            total_cost = float(material.unit_price) * quantity
            
            usage = MaterialUsage(
                project=project,
                material=material,
                usage_date=usage_date,
                quantity=quantity,
                unit_cost=material.unit_price,
                total_cost=Decimal(str(round(total_cost, 2))),
                notes=self.random.choice(["", "", f"Verbrauch für {project.title}"])
            )
            material_usage.append(usage)
        
        self.session.add_all(material_usage)
        await self.session.commit()
        
        print(f"✅ {len(material_usage)} Materialverbrauch erstellt")
        return material_usage

    async def create_revenue(self, count: int = 100):
        """Create revenue records"""
        print(f"💰 Erstelle {count} Einnahmen...")
        
        result = await self.session.execute(select(Project))
        projects = result.scalars().all()
        
        result = await self.session.execute(select(Service))
        services = result.scalars().all()
        
        revenues = []
        
        for i in range(count):
            if not projects:
                break
                
            project = self.random.choice(projects)
            revenue_type = self.random.choice(self.revenue_types)
            
            # Revenue date
            revenue_date = self.random_date(
                project.start_date or date(2023, 1, 1),
                date.today()
            )
            
            # Amount based on type
            if revenue_type == "Dienstleistung":
                amount = self.random.randint(200, 5000)
            elif revenue_type == "Material":
                amount = self.random.randint(50, 1000)
            elif revenue_type == "Miete":
                amount = self.random.randint(100, 2000)
            else:
                amount = self.random.randint(50, 1000)
            
            revenue = Revenue(
                project=project,
                revenue_date=revenue_date,
                description=f"{revenue_type} für {project.title}",
                revenue_type=revenue_type,
                amount=Decimal(str(amount)),
                vat_rate=Decimal("19.00"),
                vat_amount=Decimal(str(round(amount * 0.19, 2))),
                total_amount=Decimal(str(round(amount * 1.19, 2))),
                invoice_number=f"RE{self.random.randint(10000, 99999)}",
                is_paid=self.random.random() > 0.3,
                notes=self.random.choice(["", "", "Zahlung erhalten"])
            )
            revenues.append(revenue)
        
        self.session.add_all(revenues)
        await self.session.commit()
        
        print(f"✅ {len(revenues)} Einnahmen erstellt")
        return revenues

    async def create_analytics(self, count: int = 200):
        """Create analytics events"""
        print(f"📈 Erstelle {count} Analysedaten...")
        
        result = await self.session.execute(select(User))
        users = result.scalars().all()
        
        analytics = []
        
        for i in range(count):
            if not users:
                break
                
            user = self.random.choice(users)
            event_type = self.random.choice(self.analytics_events)
            
            event_date = self.random_date(date(2024, 1, 1), date.today())
            
            event = AnalyticsEvent(
                user=user,
                event_type=event_type,
                event_date=event_date,
                event_data={
                    "page": self.random.choice(["dashboard", "projects", "services", "materials", "reports"]),
                    "action": event_type,
                    "user_agent": "MockDataGenerator/1.0"
                },
                ip_address=f"192.168.{self.random.randint(1, 255)}.{self.random.randint(1, 255)}"
            )
            analytics.append(event)
        
        self.session.add_all(analytics)
        await self.session.commit()
        
        print(f"✅ {len(analytics)} Analysedaten erstellt")
        return analytics

    async def create_feedback(self, count: int = 30):
        """Create feedback records"""
        print(f"💬 Erstelle {count} Feedback...")
        
        result = await self.session.execute(select(Project))
        projects = result.scalars().all()
        
        feedbacks = []
        
        for i in range(count):
            if not projects:
                break
                
            project = self.random.choice(projects)
            feedback_type = self.random.choice(self.feedback_types)
            
            feedback_date = self.random_date(
                project.end_date or project.start_date or date(2024, 1, 1),
                date.today()
            )
            
            # Generate comments based on type
            if feedback_type == "positiv":
                comments = self.random.choice([
                    "Sehr zufrieden mit der Arbeit",
                    "Team war sehr professionell",
                    "Gerne wieder",
                    "Alles perfekt gelaufen",
                    "Kann ich nur empfehlen"
                ])
            elif feedback_type == "neutral":
                comments = self.random.choice([
                    "War okay",
                    "Ging so",
                    "Könnte besser sein",
                    "Nicht schlecht, aber Verbesserungspotential"
                ])
            else:
                comments = self.random.choice([
                    "Nicht zufrieden",
                    "Zu spät und schlechte Qualität",
                    "Fehler wurden nicht korrigiert",
                    "Kommunikation war schlecht"
                ])
            
            feedback = Feedback(
                project=project,
                feedback_date=feedback_date,
                rating=self.random.randint(1, 5) if feedback_type == "positiv" else self.random.randint(1, 3),
                feedback_type=feedback_type,
                comments=comments,
                customer_name=project.user.company_name,
                would_recommend=feedback_type == "positiv"
            )
            feedbacks.append(feedback)
        
        self.session.add_all(feedbacks)
        await self.session.commit()
        
        print(f"✅ {len(feedbacks)} Feedback erstellt")
        return feedbacks

    def random_date(self, start_date: date, end_date: date) -> date:
        """Generate a random date between start and end"""
        days_between = (end_date - start_date).days
        random_days = self.random.randint(0, max(0, days_between))
        return start_date + timedelta(days=random_days)

    def random_time(self) -> datetime:
        """Generate a random time during business hours"""
        hour = self.random.randint(7, 18)
        minute = self.random.choice([0, 15, 30, 45])
        return datetime.strptime(f"{hour:02d}:{minute:02d}", "%H:%M").time()


async def generate_mock_data():
    """Main function to generate all mock data"""
    print("🚀 Starte Mock-Datengenerator...")
    print("=" * 60)
    
    async with AsyncSessionLocal() as session:
        generator = MockDataGenerator(session)
        
        # Clear existing data
        await generator.clear_all_data()
        
        # Generate all data
        start_time = datetime.now()
        
        users, employees = await generator.create_users_and_employees(50)
        services = await generator.create_services(100)
        materials = await generator.create_materials(80)
        projects, time_pairs = await generator.create_projects(150)
        # Skip other seed functions that need model fixes
        # inspections = await generator.create_inspections(60)
        # abnahmen = await generator.create_abnahmen(40)
        # vehicle_costs = await generator.create_vehicle_costs(100)
        # material_usage = await generator.create_material_usage(150)
        # revenue = await generator.create_revenue(100)
        # analytics = await generator.create_analytics(200)
        # feedback = await generator.create_feedback(30)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print("=" * 60)
        print("✅ Mock-Daten erfolgreich generiert!")
        print(f"⏱️  Dauer: {duration:.2f} Sekunden")
        print()
        print("📊 Zusammenfassung:")
        print(f"   • {len(users)} Benutzer")
        print(f"   • {len(employees)} Mitarbeiter")
        print(f"   • {len(services)} Dienstleistungen")
        print(f"   • {len(materials)} Materialien")
        print(f"   • {len(projects)} Projekte")
        print(f"   • {len(time_pairs)} Zeiteinträge")
        print()
        print("🎉 Das System ist nun bereit für grundlegende Tests!")


if __name__ == "__main__":
    asyncio.run(generate_mock_data())
