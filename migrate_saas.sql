-- Migration: Add SaaS platform tables
-- Run this against your Supabase database

-- ============================================
-- TENANTS
-- ============================================
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
);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
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
);

-- ============================================
-- BILLING TABLES
-- ============================================
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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS public.t_webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================
-- ADD NEW COLUMNS TO EXISTING TABLES (safe with IF NOT EXISTS)
-- ============================================

-- Add tenant_id and auth columns to t_users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 't_users' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.t_users ADD COLUMN tenant_id UUID REFERENCES public.t_tenants(tenant_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 't_users' AND column_name = 'password_hash') THEN
        ALTER TABLE public.t_users ADD COLUMN password_hash TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 't_users' AND column_name = 'full_name') THEN
        ALTER TABLE public.t_users ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 't_users' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.t_users ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 't_users' AND column_name = 'email_verified') THEN
        ALTER TABLE public.t_users ADD COLUMN email_verified BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 't_users' AND column_name = 'last_login_at') THEN
        ALTER TABLE public.t_users ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add tenant_id to projects (if not present)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 't_projects' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.t_projects ADD COLUMN tenant_id UUID REFERENCES public.t_tenants(tenant_id);
    END IF;
END $$;

-- ============================================
-- SEED DEMO TENANT
-- ============================================
INSERT INTO public.t_tenants (tenant_id, name, slug, industry, email, enabled_modules)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Demo Handwerksbetrieb',
    'demo',
    'moving',
    'demo@arsmechanica.de',
    '["projects", "employees", "time_pairs", "materials", "services", "morningplan", "inspections", "nachkalkulation", "revenue", "vehicle_costs", "material_usage", "users", "abnahmen", "analytics", "feedback"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Seed demo subscription
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
ON CONFLICT (tenant_id) DO NOTHING;

-- Link existing users to the demo tenant
UPDATE public.t_users 
SET tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
WHERE tenant_id IS NULL;

-- Set a password hash for the admin user (password: demo123)
UPDATE public.t_users 
SET password_hash = '$2b$12$LJ3m4ys8Xyqvk0f8RUG0nuONG5eTSjOzXHQvQ0J4Y4uvMS5lCZmMW'
WHERE password_hash IS NULL;

SELECT 'Migration completed successfully!' AS result;
