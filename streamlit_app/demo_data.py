"""
Demo data configuration for standalone/development mode.
This file contains sample data for testing the UI without a backend connection.
"""
from typing import Dict, List, Any

# Demo data for various modules
DEMO_DATA: Dict[str, List[Dict[str, Any]]] = {
    "services": [
        {
            "id": "1",
            "name": "Umzug klein",
            "description": "Kleiner Umzug bis 30 m²",
            "unit": "Pauschal",
            "price_per_unit": 299.0,
            "active": True,
            "category": "Standard"
        },
        {
            "id": "2",
            "name": "Umzug mittel",
            "description": "Mittlerer Umzug 30-80 m²",
            "unit": "Pauschal",
            "price_per_unit": 599.0,
            "active": True,
            "category": "Standard"
        },
        {
            "id": "3",
            "name": "Umzug groß",
            "description": "Großer Umzug über 80 m²",
            "unit": "Pauschal",
            "price_per_unit": 999.0,
            "active": True,
            "category": "Premium"
        },
        {
            "id": "4",
            "name": "Möbelmontage",
            "description": "Auf- und Abbau von Möbeln",
            "unit": "Stunde",
            "price_per_unit": 45.0,
            "active": True,
            "category": "Zusatz"
        },
        {
            "id": "5",
            "name": "Verpackungsservice",
            "description": "Professionelles Verpacken",
            "unit": "Stunde",
            "price_per_unit": 35.0,
            "active": True,
            "category": "Service"
        },
    ],
    "materials": [
        {
            "id": "1",
            "name": "Umzugskarton",
            "description": "Standard Umzugskarton 60x40x40cm",
            "unit": "Stück",
            "cost_per_unit": 3.5,
            "selling_price_per_unit": 7.0,
            "active": True,
            "stock": 150
        },
        {
            "id": "2",
            "name": "Kleiderbox",
            "description": "Wardrobe box für Kleidung",
            "unit": "Stück",
            "cost_per_unit": 8.0,
            "selling_price_per_unit": 15.0,
            "active": True,
            "stock": 45
        },
        {
            "id": "3",
            "name": "Packpapier",
            "description": "Schutzpapier für empfindliche Gegenstände",
            "unit": "kg",
            "cost_per_unit": 2.0,
            "selling_price_per_unit": 4.5,
            "active": True,
            "stock": 25
        },
        {
            "id": "4",
            "name": "Klebeband",
            "description": "Qualitäts-Klebeband",
            "unit": "Rolle",
            "cost_per_unit": 1.5,
            "selling_price_per_unit": 3.0,
            "active": True,
            "stock": 200
        },
        {
            "id": "5",
            "name": "Möbeldecke",
            "description": "Schutzdecke für Möbel",
            "unit": "Stück",
            "cost_per_unit": 12.0,
            "selling_price_per_unit": 25.0,
            "active": True,
            "stock": 80
        },
    ],
    "projects": [
        {
            "id": "1",
            "name": "Familie Müller Umzug",
            "customer_name": "Müller",
            "project_date": "2024-02-15",
            "address": "Hauptstraße 1, 1010 Wien",
            "status": "completed",
            "total_revenue": 1250.0,
            "total_costs": 750.0,
            "margin": 500.0,
            "margin_percent": 40.0,
            "priority": "normal"
        },
        {
            "id": "2",
            "name": "Büroumzug TechCorp",
            "customer_name": "TechCorp GmbH",
            "project_date": "2024-02-20",
            "address": "Business Park 5, 1220 Wien",
            "status": "in_progress",
            "total_revenue": 3500.0,
            "total_costs": 2100.0,
            "margin": 1400.0,
            "margin_percent": 40.0,
            "priority": "high"
        },
        {
            "id": "3",
            "name": "Studentenumzug",
            "customer_name": "Schmidt",
            "project_date": "2024-02-25",
            "address": "Studentenheim 12, 1090 Wien",
            "status": "planned",
            "total_revenue": 450.0,
            "total_costs": 270.0,
            "margin": 180.0,
            "margin_percent": 40.0,
            "priority": "normal"
        },
    ],
    "inspections": [
        {
            "id": "1",
            "inspection_code": "BS-2024-001",
            "name": "Herr Mayer",
            "email": "mayer@example.com",
            "telefon": "+43 1 2345678",
            "status": "completed",
            "appointment_at": "2024-02-10T10:00:00",
            "total_value": 1250.0
        },
        {
            "id": "2",
            "inspection_code": "BS-2024-002",
            "name": "Frau Huber",
            "email": "huber@example.com",
            "telefon": "+43 1 2345679",
            "status": "scheduled",
            "appointment_at": "2024-02-18T14:00:00",
            "total_value": 2800.0
        },
    ],
    "time_pairs": [
        {
            "id": "1",
            "project_id": "1",
            "employee_name": "Max Mustermann",
            "start_time": "08:00",
            "end_time": "12:00",
            "break_duration": 30,
            "total_hours": 3.5,
            "hourly_rate": 25.0,
            "total_cost": 87.5,
            "date": "2024-02-15",
            "verified": True
        },
        {
            "id": "2",
            "project_id": "1",
            "employee_name": "Anna Beispiel",
            "start_time": "08:00",
            "end_time": "12:00",
            "break_duration": 30,
            "total_hours": 3.5,
            "hourly_rate": 22.0,
            "total_cost": 77.0,
            "date": "2024-02-15",
            "verified": True
        },
        {
            "id": "3",
            "project_id": "2",
            "employee_name": "Max Mustermann",
            "start_time": "09:00",
            "end_time": "17:00",
            "break_duration": 60,
            "total_hours": 7.0,
            "hourly_rate": 25.0,
            "total_cost": 175.0,
            "date": "2024-02-20",
            "verified": False
        },
    ],
    "employees": [
        {
            "id": "1",
            "name": "Max Mustermann",
            "email": "max@example.com",
            "phone": "+43 1 2345678",
            "hourly_rate": 25.0,
            "role": "Fahrer",
            "active": True,
            "department": "Feld",
            "rating": 4.8
        },
        {
            "id": "2",
            "name": "Anna Beispiel",
            "email": "anna@example.com",
            "phone": "+43 1 2345679",
            "hourly_rate": 22.0,
            "role": "Helfer",
            "active": True,
            "department": "Feld",
            "rating": 4.9
        },
        {
            "id": "3",
            "name": "Peter Test",
            "email": "peter@example.com",
            "phone": "+43 1 2345680",
            "hourly_rate": 20.0,
            "role": "Helfer",
            "active": True,
            "department": "Feld",
            "rating": 4.5
        },
    ],
    "users": [
        {
            "user_id": "1",
            "email": "admin@example.com",
            "role": "Admin",
            "user_type": "office",
            "is_active": True,
            "last_login": "2024-02-20T10:00:00"
        },
        {
            "user_id": "2",
            "email": "planner@example.com",
            "role": "Planner",
            "user_type": "office",
            "is_active": True,
            "last_login": "2024-02-19T15:30:00"
        },
        {
            "user_id": "3",
            "email": "supervisor@example.com",
            "role": "Supervisor",
            "user_type": "field",
            "is_active": True,
            "last_login": "2024-02-20T08:15:00"
        },
    ]
}


# Dashboard metrics demo data
DASHBOARD_METRICS: Dict[str, Any] = {
    "active_projects": 3,
    "active_projects_delta": "+1",
    "open_inspections": 2,
    "open_inspections_delta": "-1",
    "total_employees": 4,
    "total_revenue": 5200,
    "revenue_delta": "+12%"
}


# Monthly revenue data for charts
MONTHLY_REVENUE_DATA: List[Dict[str, Any]] = [
    {"month": "Jan", "revenue": 4200},
    {"month": "Feb", "revenue": 5200},
    {"month": "Mar", "revenue": 4800},
    {"month": "Apr", "revenue": 6100},
    {"month": "May", "revenue": 5800},
    {"month": "Jun", "revenue": 6500}
]


# Project status distribution for charts
PROJECT_STATUS_DATA: List[Dict[str, Any]] = [
    {"status": "Abgeschlossen", "count": 12},
    {"status": "In Bearbeitung", "count": 3},
    {"status": "Geplant", "count": 5}
]


# Recent activity feed
RECENT_ACTIVITIES: List[Dict[str, str]] = [
    {"time": "vor 5 Min", "action": "Neue Besichtigung erstellt", "user": "Max Mustermann", "icon": "🔍"},
    {"time": "vor 15 Min", "action": "Projekt abgeschlossen", "user": "Anna Schmidt", "icon": "✅"},
    {"time": "vor 1 Stunde", "action": "Zeiten erfasst", "user": "Peter Müller", "icon": "⏰"},
    {"time": "vor 2 Stunden", "action": "Material bestellt", "user": "System", "icon": "📦"},
]


# Export
__all__ = [
    "DEMO_DATA",
    "DASHBOARD_METRICS",
    "MONTHLY_REVENUE_DATA",
    "PROJECT_STATUS_DATA",
    "RECENT_ACTIVITIES"
]
