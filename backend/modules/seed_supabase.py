"""
Seed Supabase schema created by init.sql with minimal demo data.
Uses raw SQL to match the public.t_* tables.
"""
import asyncio
import os
import random
import uuid
from datetime import date, timedelta
from pathlib import Path

import asyncpg


def load_env() -> None:
    env_path = Path(".env")
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key, value)


def rand_date(start: date, end: date) -> date:
    delta_days = (end - start).days
    return start + timedelta(days=random.randint(0, max(delta_days, 1)))


async def ensure_users(conn: asyncpg.Connection) -> list[dict]:
    count = await conn.fetchval("SELECT COUNT(*) FROM public.t_users")
    if count and int(count) > 0:
        return await conn.fetch("SELECT user_id, email FROM public.t_users")

    demo_users = [
        ("admin@lis.local", "Admin", "office"),
        ("planner@lis.local", "Planner", "office"),
        ("worker1@lis.local", "Worker", "field"),
        ("worker2@lis.local", "Worker", "field"),
        ("supervisor@lis.local", "Supervisor", "office"),
        ("secretary@lis.local", "Secretary", "office"),
    ]
    records = [(str(uuid.uuid4()), email, role, user_type) for email, role, user_type in demo_users]
    await conn.executemany(
        """
        INSERT INTO public.t_users (user_id, email, role, user_type, is_active)
        VALUES ($1, $2, $3, $4, true)
        """,
        records,
    )
    return await conn.fetch("SELECT user_id, email FROM public.t_users")


async def ensure_employees(conn: asyncpg.Connection, users: list[asyncpg.Record]) -> list[dict]:
    count = await conn.fetchval("SELECT COUNT(*) FROM public.t_employees")
    if count and int(count) > 0:
        return await conn.fetch(
            "SELECT employee_id, email, employee_number FROM public.t_employees"
        )

    employees = []
    for idx, user in enumerate(users, start=1):
        email = user["email"]
        local = email.split("@")[0]
        if "." in local:
            first, last = local.split(".", 1)
        else:
            first, last = local, "User"
        employees.append(
            (
                str(uuid.uuid4()),
                user["user_id"],
                email,
                f"EMP{idx:04d}",
                first.capitalize(),
                last.capitalize(),
                "Umzug",
                "Mitarbeiter",
                rand_date(date(2021, 1, 1), date(2024, 12, 31)),
            )
        )

    await conn.executemany(
        """
        INSERT INTO public.t_employees
            (employee_id, user_id, email, employee_number, first_name, last_name,
             department, position, hire_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """,
        employees,
    )
    return await conn.fetch(
        "SELECT employee_id, email, employee_number FROM public.t_employees"
    )


async def ensure_projects(conn: asyncpg.Connection) -> list[dict]:
    count = await conn.fetchval("SELECT COUNT(*) FROM public.t_projects")
    if count and int(count) > 0:
        return await conn.fetch("SELECT project_id, project_code FROM public.t_projects")

    projects = []
    for i in range(1, 6):
        project_id = str(uuid.uuid4())
        project_code = f"LIS-{date.today().year}-{i:03d}"
        name = f"Demo Projekt {i}"
        projects.append((project_id, project_code, name))

    await conn.executemany(
        """
        INSERT INTO public.t_projects (project_id, project_code, name, status)
        VALUES ($1, $2, $3, 'active')
        """,
        projects,
    )
    return await conn.fetch("SELECT project_id, project_code FROM public.t_projects")


async def ensure_abnahmen(conn: asyncpg.Connection, projects: list[asyncpg.Record]) -> list[dict]:
    count = await conn.fetchval("SELECT COUNT(*) FROM public.t_abnahmen")
    if count and int(count) > 0:
        return await conn.fetch("SELECT id, project_id FROM public.t_abnahmen")

    abnahmen = []
    for project in projects:
        abnahmen.append(
            (
                str(uuid.uuid4()),
                project["project_id"],
                str(uuid.uuid4()),
                date.today(),
                f"Auftrag {project['project_code']}",
            )
        )

    await conn.executemany(
        """
        INSERT INTO public.t_abnahmen (id, project_id, plan_id, abnahme_datum, auftrag)
        VALUES ($1, $2, $3, $4, $5)
        """,
        abnahmen,
    )
    return await conn.fetch("SELECT id, project_id, plan_id FROM public.t_abnahmen")


async def ensure_time_pairs(
    conn: asyncpg.Connection,
    abnahmen: list[asyncpg.Record],
    employees: list[asyncpg.Record],
) -> None:
    count = await conn.fetchval("SELECT COUNT(*) FROM public.t_time_pairs")
    if count and int(count) > 0:
        return

    pairs = []
    for abnahme in abnahmen:
        for employee in employees[:2]:
            pairs.append(
                (
                    str(uuid.uuid4()),
                    abnahme["id"],
                    abnahme["plan_id"] or str(uuid.uuid4()),
                    employee["employee_id"],
                    employee["email"].split("@")[0],
                    employee["employee_number"],
                    "08:00",
                    "08:00",
                    "16:00",
                    "16:00",
                    "00:30",
                    "7:30",
                    "8:00",
                    "Demo time pair",
                )
            )

    await conn.executemany(
        """
        INSERT INTO public.t_time_pairs
            (id, abnahme_id, plan_id, staff_id, employee_name, employee_code,
             lis_von, kunde_von, kunde_bis, lis_bis, pause, ges_lis, ges_kd, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        """,
        pairs,
    )


async def main() -> None:
    random.seed(42)
    load_env()
    dsn = os.getenv("SUPABASE_URL") or os.getenv("DATABASE_URL")
    if not dsn:
        raise SystemExit("SUPABASE_URL or DATABASE_URL not set")
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)

    conn = await asyncpg.connect(dsn)
    try:
        users = await ensure_users(conn)
        employees = await ensure_employees(conn, users)
        projects = await ensure_projects(conn)
        abnahmen = await ensure_abnahmen(conn, projects)
        await ensure_time_pairs(conn, abnahmen, employees)
        print("✅ Supabase demo seed completed")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
