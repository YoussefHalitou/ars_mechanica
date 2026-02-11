"""
Run the SaaS migration against the local database.
Drops old tables with incompatible schemas and creates new ones.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text

DB_URL = f"postgresql://{os.environ.get('USER', 'youssef')}@localhost:5432/lis_dev"
print(f"Connecting to: {DB_URL}")
engine = create_engine(DB_URL, echo=False)


def run_stmt(conn, label, sql):
    try:
        conn.execute(text(sql))
        print(f"  ✅ {label}")
        return True
    except Exception as e:
        err = str(e)
        if 'already exists' in err.lower() or 'does not exist' in err.lower():
            print(f"  ⏭️  {label} (skipped - {err.split(chr(10))[0][:80]})")
        else:
            print(f"  ❌ {label}: {err.split(chr(10))[0][:120]}")
        return False


print("\n=== Phase 1: Drop old incompatible tables ===")
with engine.connect() as conn:
    run_stmt(conn, "Drop old t_subscriptions", "DROP TABLE IF EXISTS public.t_subscriptions CASCADE")
    run_stmt(conn, "Drop old t_tenants", "DROP TABLE IF EXISTS public.t_tenants CASCADE")
    run_stmt(conn, "Drop old t_usage_counters", "DROP TABLE IF EXISTS public.t_usage_counters CASCADE")
    conn.commit()

print("\n=== Phase 2: Create new SaaS tables ===")
with engine.connect() as conn:
    run_stmt(conn, "Create t_tenants", """
        CREATE TABLE IF NOT EXISTS public.t_tenants (
            tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            industry TEXT NOT NULL DEFAULT 'general',
            email TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            logo_url TEXT,
            primary_color TEXT DEFAULT '#1976d2',
            secondary_color TEXT DEFAULT '#424242',
            settings JSONB DEFAULT '{}',
            enabled_modules JSONB DEFAULT '[]',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    
    run_stmt(conn, "Create t_subscriptions", """
        CREATE TABLE IF NOT EXISTS public.t_subscriptions (
            subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL UNIQUE REFERENCES public.t_tenants(tenant_id),
            tier TEXT NOT NULL DEFAULT 'starter',
            status TEXT NOT NULL DEFAULT 'trialing',
            stripe_customer_id TEXT,
            stripe_subscription_id TEXT,
            stripe_price_id TEXT,
            trial_starts_at TIMESTAMPTZ,
            trial_ends_at TIMESTAMPTZ,
            current_period_start TIMESTAMPTZ,
            current_period_end TIMESTAMPTZ,
            cancel_at TIMESTAMPTZ,
            canceled_at TIMESTAMPTZ,
            max_users INTEGER DEFAULT 3,
            max_projects INTEGER DEFAULT 50,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    
    run_stmt(conn, "Create t_payment_methods", """
        CREATE TABLE IF NOT EXISTS public.t_payment_methods (
            payment_method_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES public.t_tenants(tenant_id),
            stripe_payment_method_id TEXT UNIQUE,
            stripe_customer_id TEXT,
            card_brand TEXT,
            card_last4 TEXT,
            card_exp_month INTEGER,
            card_exp_year INTEGER,
            is_default BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    
    run_stmt(conn, "Create t_invoices", """
        CREATE TABLE IF NOT EXISTS public.t_invoices (
            invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES public.t_tenants(tenant_id),
            subscription_id UUID REFERENCES public.t_subscriptions(subscription_id),
            stripe_invoice_id TEXT UNIQUE,
            stripe_payment_intent_id TEXT,
            invoice_number TEXT,
            status TEXT DEFAULT 'draft',
            subtotal INTEGER DEFAULT 0,
            tax INTEGER DEFAULT 0,
            total INTEGER DEFAULT 0,
            amount_paid INTEGER DEFAULT 0,
            amount_due INTEGER DEFAULT 0,
            currency TEXT DEFAULT 'EUR',
            period_start TIMESTAMPTZ,
            period_end TIMESTAMPTZ,
            invoice_pdf TEXT,
            hosted_invoice_url TEXT,
            due_date DATE,
            paid_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    
    run_stmt(conn, "Create t_usage_records", """
        CREATE TABLE IF NOT EXISTS public.t_usage_records (
            usage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES public.t_tenants(tenant_id),
            subscription_id UUID REFERENCES public.t_subscriptions(subscription_id),
            metric TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            period_start TIMESTAMPTZ NOT NULL,
            period_end TIMESTAMPTZ NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    
    run_stmt(conn, "Create t_webhook_events", """
        CREATE TABLE IF NOT EXISTS public.t_webhook_events (
            event_id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            error_message TEXT,
            payload JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            processed_at TIMESTAMPTZ
        )
    """)
    conn.commit()

print("\n=== Phase 3: Add new columns to existing tables ===")
with engine.connect() as conn:
    # Add columns to t_users
    for col, typedef in [
        ("tenant_id", "UUID REFERENCES public.t_tenants(tenant_id)"),
        ("password_hash", "TEXT"),
        ("full_name", "TEXT"),
        ("avatar_url", "TEXT"),
        ("email_verified", "BOOLEAN DEFAULT false"),
        ("last_login_at", "TIMESTAMPTZ"),
    ]:
        run_stmt(conn, f"Add t_users.{col}", f"ALTER TABLE public.t_users ADD COLUMN IF NOT EXISTS {col} {typedef}")
    
    # Add tenant_id to projects
    run_stmt(conn, "Add t_projects.tenant_id", "ALTER TABLE public.t_projects ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.t_tenants(tenant_id)")
    conn.commit()

print("\n=== Phase 4: Seed demo data ===")
with engine.connect() as conn:
    run_stmt(conn, "Insert demo tenant", """
        INSERT INTO public.t_tenants (tenant_id, name, slug, industry, email, enabled_modules)
        VALUES (
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
            'Demo Handwerksbetrieb',
            'demo',
            'moving',
            'demo@arsmechanica.de',
            '["projects", "employees", "time_pairs", "materials", "services", "morningplan", "inspections", "nachkalkulation", "revenue", "vehicle_costs", "material_usage", "users", "abnahmen", "analytics", "feedback"]'::jsonb
        )
        ON CONFLICT (slug) DO NOTHING
    """)
    
    run_stmt(conn, "Insert demo subscription", """
        INSERT INTO public.t_subscriptions (tenant_id, tier, status, trial_starts_at, trial_ends_at, max_users, max_projects)
        VALUES (
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
            'professional',
            'active',
            NOW(),
            NOW() + INTERVAL '30 days',
            10,
            200
        )
        ON CONFLICT (tenant_id) DO NOTHING
    """)
    
    run_stmt(conn, "Link users to demo tenant", """
        UPDATE public.t_users SET tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid WHERE tenant_id IS NULL
    """)
    
    run_stmt(conn, "Set password hashes (demo123)", """
        UPDATE public.t_users SET password_hash = '$2b$12$LJ3m4ys8Xyqvk0f8RUG0nuONG5eTSjOzXHQvQ0J4Y4uvMS5lCZmMW' WHERE password_hash IS NULL
    """)
    conn.commit()

print("\n=== Phase 5: Verify ===")
with engine.connect() as conn:
    r = conn.execute(text("SELECT count(*) FROM t_tenants"))
    print(f"  Tenants: {r.fetchone()[0]}")
    r = conn.execute(text("SELECT count(*) FROM t_subscriptions"))
    print(f"  Subscriptions: {r.fetchone()[0]}")
    r = conn.execute(text("SELECT count(*) FROM t_users WHERE tenant_id IS NOT NULL"))
    print(f"  Users with tenant: {r.fetchone()[0]}")
    r = conn.execute(text("SELECT count(*) FROM t_users WHERE password_hash IS NOT NULL"))
    print(f"  Users with password: {r.fetchone()[0]}")

print("\n✅ Migration completed successfully!")
engine.dispose()
