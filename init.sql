-- Database initialization script for LIS White-Label System v2.0 - Modern Architecture
-- Enhanced PostgreSQL schema with performance optimizations and modern features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For performance monitoring

-- ============================================
-- PERFORMANCE OPTIMIZATION SETTINGS
-- ============================================

-- Create indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_t_projects_status_created 
ON public.t_projects (status, created_at) WHERE status IN ('active', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_t_inspections_project_status 
ON public.t_inspections (project_id, status) WHERE status != 'Storniert';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_t_time_pairs_employee_date 
ON public.t_time_pairs (staff_id, created_at);

-- ============================================
-- SAAS PLATFORM TABLES (Tenants, Subscriptions, Billing)
-- ============================================

-- Tenants (organizations/companies)
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

-- Subscriptions (billing tiers)
CREATE TABLE IF NOT EXISTS public.t_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES public.t_tenants(tenant_id),
    tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'professional', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
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

-- Payment methods
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

-- Invoices
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

-- Usage records (metered billing)
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

-- Webhook events log
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
-- USER & AUTHENTICATION TABLES (Enhanced)
-- ============================================

CREATE TABLE IF NOT EXISTS public.t_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.t_tenants(tenant_id),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'Worker' CHECK (role IN ('Admin', 'Secretary', 'Planner', 'Supervisor', 'Worker')),
    user_type TEXT NOT NULL DEFAULT 'office' CHECK (user_type IN ('office', 'field')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee records with enhanced tracking
CREATE TABLE IF NOT EXISTS public.t_employees (
    employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.t_users(user_id) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    employee_number TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    department TEXT,
    position TEXT,
    hire_date DATE,
    skills TEXT[], -- Array of skills
    certifications JSONB DEFAULT '{}', -- Certifications with expiry dates
    emergency_contact JSONB DEFAULT '{}', -- Emergency contact info
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECT & INSPECTION TABLES (Enhanced)
-- ============================================

-- Projects with enhanced metadata
CREATE TABLE IF NOT EXISTS public.t_projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code TEXT UNIQUE,
    anrede TEXT,
    name TEXT NOT NULL,
    strasse TEXT,
    nr TEXT,
    plz TEXT,
    ort TEXT,
    telefon TEXT,
    email TEXT,
    dienstleistungen TEXT,
    project_date TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled', 'archived')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    estimated_value NUMERIC(12,2) DEFAULT 0,
    actual_value NUMERIC(12,2) DEFAULT 0,
    tags TEXT[], -- Project tags for categorization
    custom_fields JSONB DEFAULT '{}', -- Custom project fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced inspections with workflow states
CREATE TABLE IF NOT EXISTS public.t_inspections (
    inspection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_code TEXT UNIQUE,
    project_id UUID REFERENCES public.t_projects(project_id),
    
    -- Billing Address
    anrede TEXT,
    name TEXT NOT NULL,
    strasse TEXT,
    nr TEXT,
    plz TEXT,
    ort TEXT,
    telefon TEXT,
    email TEXT,
    notes TEXT,
    
    -- Target Address
    ziel_anrede TEXT,
    ziel_name TEXT,
    ziel_strasse TEXT,
    ziel_nr TEXT,
    ziel_plz TEXT,
    ziel_ort TEXT,
    
    -- Service Details
    etage TEXT,
    hvz TEXT,
    sonderstoffe TEXT,
    lkw_groesse TEXT,
    extrainformationen TEXT,
    dienstleistungsart_p TEXT,
    dienstleistungsart_w TEXT,
    
    -- Appointment
    appointment_at TIMESTAMPTZ,
    wunschtermin DATE,
    
    -- Workflow State Machine
    workflow_state TEXT DEFAULT 'new' CHECK (workflow_state IN ('new', 'scheduled', 'in_progress', 'completed', 'quoted', 'accepted', 'declined', 'cancelled')),
    
    -- Lexoffice Integration
    lexoffice_contact_id TEXT,
    lexoffice_quotation_id TEXT,
    lexoffice_quotation_number TEXT,
    lexoffice_order_confirmation_id TEXT,
    lexoffice_order_confirmation_number TEXT,
    
    -- Customer Acceptance
    customer_accepted BOOLEAN,
    customer_accepted_at TIMESTAMPTZ,
    customer_declined_at TIMESTAMPTZ,
    customer_decision_notes TEXT,
    work_project_id UUID,
    
    -- Status
    status TEXT DEFAULT 'In Bearbeitung',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INSPECTION DETAIL TABLES
-- ============================================

-- Rooms with computed fields
CREATE TABLE IF NOT EXISTS public.t_inspection_items (
    id SERIAL PRIMARY KEY,
    inspection_id UUID REFERENCES public.t_inspections(inspection_id) NOT NULL,
    room TEXT NOT NULL,
    room_type TEXT CHECK (room_type IN ('living_room', 'bedroom', 'kitchen', 'bathroom', 'office', 'storage', 'other')),
    notes TEXT,
    volume_m3 NUMERIC DEFAULT 0,
    persons INTEGER DEFAULT 0,
    hours NUMERIC DEFAULT 0,
    sum_hours NUMERIC GENERATED ALWAYS AS (persons * hours) STORED,
    difficulty TEXT DEFAULT 'normal' CHECK (difficulty IN ('easy', 'normal', 'hard', 'special')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual items with enhanced tracking
CREATE TABLE IF NOT EXISTS public.t_inspection_room_items (
    id SERIAL PRIMARY KEY,
    inspection_id UUID NOT NULL REFERENCES public.t_inspections(inspection_id),
    room_id INTEGER NOT NULL REFERENCES public.t_inspection_items(id),
    item_name TEXT NOT NULL,
    item_category TEXT CHECK (item_category IN ('furniture', 'electronics', 'boxes', 'appliances', 'art', 'instruments', 'other')),
    quantity INTEGER NOT NULL DEFAULT 1,
    estimated_volume_m3 NUMERIC DEFAULT 0,
    weight_kg NUMERIC DEFAULT 0,
    fragile BOOLEAN DEFAULT false,
    notes TEXT,
    montage_option TEXT NOT NULL DEFAULT 'Keine' CHECK (montage_option IN ('Keine', 'Demontage', 'Montage', 'Bohrmontage')),
    special_handling TEXT[], -- Array of special handling requirements
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos with metadata
CREATE TABLE IF NOT EXISTS public.t_inspection_photos (
    id SERIAL PRIMARY KEY,
    inspection_id UUID REFERENCES public.t_inspections(inspection_id) NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    category TEXT,
    tags TEXT[], -- Photo tags for search
    file_size INTEGER,
    dimensions TEXT, -- e.g., "1920x1080"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calculation items with enhanced pricing
CREATE TABLE IF NOT EXISTS public.t_inspection_calc_items (
    id SERIAL PRIMARY KEY,
    inspection_id UUID REFERENCES public.t_inspections(inspection_id) NOT NULL,
    kind TEXT NOT NULL,
    position_label TEXT,
    description TEXT,
    qty NUMERIC DEFAULT 0,
    unit TEXT,
    unit_price NUMERIC DEFAULT 0,
    unit_cost NUMERIC DEFAULT 0, -- For margin calculation
    line_total NUMERIC GENERATED ALWAYS AS (qty * unit_price) STORED,
    line_cost NUMERIC GENERATED ALWAYS AS (qty * unit_cost) STORED,
    margin NUMERIC GENERATED ALWAYS AS ((unit_price - unit_cost) / unit_price * 100) STORED,
    sort_order INTEGER DEFAULT 0,
    tax_rate NUMERIC DEFAULT 19.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discounts with flexible application
CREATE TABLE IF NOT EXISTS public.t_inspection_discounts (
    id SERIAL PRIMARY KEY,
    inspection_id UUID REFERENCES public.t_inspections(inspection_id) NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('percent', 'absolute', 'fixed_price')),
    value NUMERIC DEFAULT 0,
    applies_to TEXT DEFAULT 'total' CHECK (applies_to IN ('total', 'services', 'materials', 'specific_items')),
    target_items UUID[], -- Array of item IDs if applies_to = 'specific_items'
    description TEXT,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ABNAHME (COMPLETION PROTOCOL) TABLES
-- ============================================

-- Enhanced completion protocols
CREATE TABLE IF NOT EXISTS public.t_abnahmen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.t_projects(project_id),
    plan_id UUID,
    
    -- Basic Meta
    abnahme_datum DATE,
    telefon TEXT,
    auftrag TEXT NOT NULL,
    
    -- Billing Address
    rechnung_zeile1 TEXT,
    rechnung_zeile2 TEXT,
    rechnung_zeile3 TEXT,
    
    -- On-site Times
    arbeitsbeginn_vor_ort TIME,
    arbeitsende_vor_ort TIME,
    ende_wiegeschein TIME,
    
    -- Additional Services
    zusatz_sonderstoffentsorgung BOOLEAN NOT NULL DEFAULT false,
    zusatz_sonstiges BOOLEAN NOT NULL DEFAULT false,
    zusatz_sonstiges_beschreibung TEXT,
    
    -- Vehicle & Disposal
    fahrzeug TEXT,
    folgetag TEXT,
    wiegescheine_unvollstaendig BOOLEAN NOT NULL DEFAULT false,
    entsorgung_termin DATE,
    entsorgung_was TEXT,
    mannanzahl INTEGER,
    
    -- Storage & Material
    idr_im_lager_beschriftet BOOLEAN NOT NULL DEFAULT false,
    geliehenes_material TEXT,
    
    -- No-parking Zone (HVZ)
    hvz_vor_ort BOOLEAN NOT NULL DEFAULT false,
    hvz_mitgebracht BOOLEAN NOT NULL DEFAULT false,
    hvz_nummer TEXT,
    
    -- Signatures
    unterschrift_auftraggeber TEXT,
    unterschrift_baustellenleiter TEXT,
    
    -- Enhanced Material Tracking
    mat_umzugskartons INTEGER DEFAULT 0,
    mat_packseide INTEGER DEFAULT 0,
    mat_kleiderkisten INTEGER DEFAULT 0,
    mat_klebeband INTEGER DEFAULT 0,
    mat_lupo INTEGER DEFAULT 0,
    mat_stretchfolie INTEGER DEFAULT 0,
    mat_sonstiges TEXT,
    mat_decken_anzahl INTEGER DEFAULT 0,
    mat_kantenschutz_meter NUMERIC(10,2) DEFAULT 0,
    mat_verbrauch_kartons INTEGER DEFAULT 0,
    mat_verbrauch_packseide INTEGER DEFAULT 0,
    
    -- Quality Metrics
    quality_score NUMERIC(3,2) DEFAULT 0, -- 0.00 to 10.00
    customer_satisfaction NUMERIC(3,2) DEFAULT 0,
    completion_time_minutes INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE (project_id, plan_id)
);

-- ============================================
-- TIME TRACKING TABLES (Enhanced)
-- ============================================

-- Enhanced time pairs with GPS tracking
CREATE TABLE IF NOT EXISTS public.t_time_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abnahme_id UUID NOT NULL REFERENCES public.t_abnahmen(id),
    plan_id UUID NOT NULL,
    staff_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    employee_code TEXT,
    
    -- Time Fields (HH:MM format)
    lis_von TEXT,
    kunde_von TEXT,
    kunde_bis TEXT,
    lis_bis TEXT,
    pause TEXT,
    ges_lis TEXT,
    ges_kd TEXT,
    
    -- GPS Tracking
    start_location JSONB, -- {lat, lng, accuracy}
    end_location JSONB,
    route_distance_km NUMERIC(6,2),
    
    notes TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily staff assignments with availability tracking
CREATE TABLE IF NOT EXISTS public.t_morningplan_staff (
    id SERIAL PRIMARY KEY,
    plan_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES public.t_employees(employee_id),
    role TEXT DEFAULT 'Mitarbeiter',
    individual_start_time TIME,
    sort_order INTEGER DEFAULT 0,
    confirmed BOOLEAN DEFAULT false,
    attendance_status TEXT DEFAULT 'present' CHECK (attendance_status IN ('present', 'late', 'absent', 'excused')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (plan_id, employee_id)
);

-- ============================================
-- MATERIAL MANAGEMENT TABLES (Enhanced)
-- ============================================

-- Master materials with enhanced categorization
CREATE TABLE IF NOT EXISTS public.t_materials (
    material_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    category TEXT,
    subcategory TEXT,
    default_quantity NUMERIC(10,2) DEFAULT 1,
    min_stock NUMERIC(10,2) DEFAULT 0,
    max_stock NUMERIC(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_consumable BOOLEAN DEFAULT true,
    is_reusable BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material pricing with history tracking
CREATE TABLE IF NOT EXISTS public.t_material_prices (
    material_id UUID PRIMARY KEY REFERENCES public.t_materials(material_id),
    cost_per_unit NUMERIC(10,2) DEFAULT 0 CHECK (cost_per_unit >= 0),
    price_per_unit NUMERIC(10,2) DEFAULT 0 CHECK (price_per_unit >= 0),
    margin_percent NUMERIC GENERATED ALWAYS AS (CASE WHEN price_per_unit > 0 THEN ((price_per_unit - cost_per_unit) / price_per_unit * 100) ELSE 0 END) STORED,
    currency TEXT DEFAULT 'EUR',
    supplier TEXT,
    supplier_sku TEXT,
    updated_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material stock levels with automatic tracking
CREATE TABLE IF NOT EXISTS public.t_material_stock (
    material_id UUID PRIMARY KEY REFERENCES public.t_materials(material_id),
    current_quantity NUMERIC(10,2) DEFAULT 0,
    reserved_quantity NUMERIC(10,2) DEFAULT 0,
    available_quantity NUMERIC GENERATED ALWAYS AS (current_quantity - reserved_quantity) STORED,
    last_restocked TIMESTAMPTZ,
    location TEXT,
    min_auto_order NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material consumption tracking
CREATE TABLE IF NOT EXISTS public.t_material_movements (
    movement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.t_materials(material_id),
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer', 'adjustment')),
    quantity NUMERIC(10,2) NOT NULL,
    reference_type TEXT, -- 'project', 'inspection', 'adjustment'
    reference_id UUID,
    cost_per_unit NUMERIC(10,2),
    total_cost NUMERIC(10,2),
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material consumption per project with phase tracking
CREATE TABLE IF NOT EXISTS public.t_project_material_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID REFERENCES public.t_inspections(inspection_id),
    project_id UUID NOT NULL REFERENCES public.t_projects(project_id),
    material_id UUID NOT NULL REFERENCES public.t_materials(material_id),
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    phase TEXT DEFAULT 'Nachkalkulation' CHECK (phase IN ('Vorkalkulation', 'Nachkalkulation', 'Ausführung', 'Nachbereitung')),
    estimated_cost NUMERIC(10,2) DEFAULT 0,
    actual_cost NUMERIC(10,2) DEFAULT 0,
    variance NUMERIC(10,2) GENERATED ALWAYS AS (actual_cost - estimated_cost) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS & FEEDBACK TABLES (Enhanced)
-- ============================================

-- Application analytics with performance metrics
CREATE TABLE IF NOT EXISTS public.t_analytics_events (
    event_id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    category TEXT NOT NULL CHECK (category IN ('auth', 'navigation', 'inspection', 'abnahme', 'sync', 'offline', 'user_action', 'error', 'performance', 'api')),
    event_name TEXT NOT NULL,
    user_id UUID REFERENCES public.t_users(user_id),
    session_id TEXT,
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    error_stack TEXT,
    error_code TEXT,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User feedback with enhanced tracking
CREATE TABLE IF NOT EXISTS public.t_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.t_users(user_id),
    user_email TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'feedback', 'sync_issue', 'other')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed', 'duplicate')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to UUID REFERENCES public.t_users(user_id),
    resolution_notes TEXT,
    screenshot_url TEXT,
    device_info JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Employee performance ratings with trends
CREATE TABLE IF NOT EXISTS public.t_worker_ratings (
    rating_id TEXT PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.t_projects(project_id),
    plan_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES public.t_employees(employee_id),
    employee_name TEXT,
    datum DATE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    category TEXT CHECK (category IN ('punctuality', 'quality', 'teamwork', 'efficiency', 'customer_service', 'overall')),
    notes TEXT,
    evaluator_id UUID REFERENCES public.t_users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SERVICES & MATERIALS (Enhanced)
-- ============================================

CREATE TABLE IF NOT EXISTS public.t_services (
    service_id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    default_unit TEXT,
    category TEXT,
    subcategory TEXT,
    base_price NUMERIC(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    requires_certification BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service pricing with regional variations
CREATE TABLE IF NOT EXISTS public.t_service_pricing (
    service_id TEXT NOT NULL REFERENCES public.t_services(service_id),
    region TEXT NOT NULL DEFAULT 'default',
    unit_price NUMERIC(10,2) DEFAULT 0,
    unit_cost NUMERIC(10,2) DEFAULT 0,
    minimum_hours NUMERIC(4,2) DEFAULT 0,
    hourly_rate NUMERIC(8,2) DEFAULT 0,
    PRIMARY KEY (service_id, region)
);

-- ============================================
-- VEHICLES (Enhanced)
-- ============================================

CREATE TABLE IF NOT EXISTS public.t_vehicles (
    vehicle_id TEXT NOT NULL PRIMARY KEY,
    nickname TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,
    license_plate TEXT UNIQUE,
    unit TEXT DEFAULT 'Tag'::text,
    status TEXT DEFAULT 'bereit'::text CHECK (status IN ('bereit', 'in_use', 'maintenance', 'out_of_service')),
    inhalt TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.t_vehicle_rates (
    vehicle_id TEXT NOT NULL PRIMARY KEY REFERENCES public.t_vehicles(vehicle_id),
    cost_per_unit NUMERIC(10,2),
    gas_cost_per_unit NUMERIC(10,2),
    price_per_unit NUMERIC(10,2),
    gas_price_per_unit NUMERIC(10,2),
    insurance_per_day NUMERIC(8,2) DEFAULT 0,
    maintenance_per_km NUMERIC(6,3) DEFAULT 0,
    currency TEXT DEFAULT 'EUR'::text,
    updated_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle GPS tracking
CREATE TABLE IF NOT EXISTS public.t_vehicle_tracking (
    tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id TEXT NOT NULL REFERENCES public.t_vehicles(vehicle_id),
    latitude NUMERIC(10,8) NOT NULL,
    longitude NUMERIC(11,8) NOT NULL,
    speed_kmh NUMERIC(5,2),
    heading NUMERIC(5,2),
    altitude NUMERIC(7,2),
    accuracy_meters NUMERIC(6,2),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    plan_id UUID,
    driver_id UUID REFERENCES public.t_employees(employee_id)
);

-- ============================================
-- REAL-TIME FEATURES
-- ============================================

-- Live project status updates
CREATE TABLE IF NOT EXISTS public.t_project_status_live (
    project_id UUID PRIMARY KEY REFERENCES public.t_projects(project_id),
    current_phase TEXT CHECK (current_phase IN ('planning', 'preparation', 'execution', 'completion', 'billing')),
    progress_percent NUMERIC(5,2) DEFAULT 0,
    estimated_completion TIMESTAMPTZ,
    last_update TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.t_users(user_id)
);

-- Live employee status
CREATE TABLE IF NOT EXISTS public.t_employee_status_live (
    employee_id UUID PRIMARY KEY REFERENCES public.t_employees(employee_id),
    current_status TEXT CHECK (current_status IN ('available', 'in_transit', 'on_site', 'break', 'off_duty', 'sick')),
    current_project_id UUID REFERENCES public.t_projects(project_id),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    location JSONB, -- {lat, lng, accuracy}
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100)
);

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS public.t_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.t_users(user_id),
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success', 'reminder')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ============================================
-- DATABASE VIEWS (Enhanced)
-- ============================================

-- Complete inspection details with computed totals
CREATE OR REPLACE VIEW public.v_inspection_detail_complete AS
SELECT 
    i.*,
    p.name AS project_name,
    p.project_code,
    p.status AS project_status,
    COALESCE(SUM(ci.line_total), 0) AS total_calculated,
    COALESCE(SUM(ci.line_cost), 0) AS total_cost,
    COALESCE(SUM(ci.line_total), 0) - COALESCE(SUM(ci.line_cost), 0) AS total_margin,
    CASE 
        WHEN COALESCE(SUM(ci.line_total), 0) > 0 
        THEN ((COALESCE(SUM(ci.line_total), 0) - COALESCE(SUM(ci.line_cost), 0)) / COALESCE(SUM(ci.line_total), 0) * 100)
        ELSE 0 
    END AS margin_percent
FROM public.t_inspections i
LEFT JOIN public.t_projects p ON i.project_id = p.project_id
LEFT JOIN public.t_inspection_calc_items ci ON i.inspection_id = ci.inspection_id
GROUP BY i.inspection_id, p.name, p.project_code, p.status;

-- Employee performance summary
CREATE OR REPLACE VIEW public.v_employee_performance AS
SELECT 
    e.employee_id,
    e.first_name,
    e.last_name,
    e.position,
    COUNT(DISTINCT tp.id) AS total_time_pairs,
    COUNT(DISTINCT wr.rating_id) AS total_ratings,
    COALESCE(AVG(wr.rating), 0) AS average_rating,
    COALESCE(SUM(tp.ges_lis::numeric), 0) AS total_hours_lis,
    COALESCE(SUM(tp.ges_kd::numeric), 0) AS total_hours_customer
FROM public.t_employees e
LEFT JOIN public.t_time_pairs tp ON e.employee_id = tp.staff_id
LEFT JOIN public.t_worker_ratings wr ON e.employee_id = wr.employee_id
GROUP BY e.employee_id, e.first_name, e.last_name, e.position;

-- Project financial summary
CREATE OR REPLACE VIEW public.v_project_financial_summary AS
SELECT 
    p.project_id,
    p.name,
    p.status,
    COUNT(DISTINCT i.inspection_id) AS inspection_count,
    COALESCE(SUM(i.total_calculated), 0) AS total_revenue,
    COALESCE(SUM(i.total_cost), 0) AS total_cost,
    COALESCE(SUM(i.total_margin), 0) AS total_margin,
    COALESCE(AVG(i.margin_percent), 0) AS avg_margin_percent
FROM public.t_projects p
LEFT JOIN public.v_inspection_detail_complete i ON p.project_id = i.project_id
GROUP BY p.project_id, p.name, p.status;

-- ============================================
-- DATABASE FUNCTIONS (Enhanced)
-- ============================================

-- Calculate project margin
CREATE OR REPLACE FUNCTION public.calculate_project_margin(project_uuid UUID)
RETURNS TABLE(
    total_revenue NUMERIC,
    total_cost NUMERIC,
    total_margin NUMERIC,
    margin_percent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(line_total), 0),
        COALESCE(SUM(line_cost), 0),
        COALESCE(SUM(line_total), 0) - COALESCE(SUM(line_cost), 0),
        CASE 
            WHEN COALESCE(SUM(line_total), 0) > 0 
            THEN ((COALESCE(SUM(line_total), 0) - COALESCE(SUM(line_cost), 0)) / COALESCE(SUM(line_total), 0) * 100)
            ELSE 0
        END
    FROM public.t_inspection_calc_items
    WHERE inspection_id IN (
        SELECT inspection_id FROM public.t_inspections WHERE project_id = project_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Get employee availability
CREATE OR REPLACE FUNCTION public.get_employee_availability(emp_id UUID, check_date DATE)
RETURNS TABLE(
    is_available BOOLEAN,
    current_project UUID,
    next_available DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN false
            ELSE true
        END,
        CASE 
            WHEN COUNT(*) > 0 THEN plan.project_id
            ELSE NULL
        END,
        CASE 
            WHEN COUNT(*) > 0 THEN (plan.plan_date + INTERVAL '1 day')::DATE
            ELSE check_date
        END
    FROM public.t_morningplan_staff staff
    JOIN public.t_morningplan plan ON staff.plan_id = plan.plan_id
    WHERE staff.employee_id = emp_id
    AND plan.plan_date = check_date
    AND staff.attendance_status = 'present'
    GROUP BY plan.project_id, plan.plan_date;
END;
$$ LANGUAGE plpgsql;

-- Auto-cleanup old analytics
CREATE OR REPLACE FUNCTION public.auto_cleanup_analytics()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.t_analytics_events 
    WHERE timestamp < NOW() - INTERVAL '90 days'
    AND level IN ('debug', 'info');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS (Enhanced)
-- ============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_update_updated_at_users BEFORE UPDATE ON public.t_users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_updated_at_employees BEFORE UPDATE ON public.t_employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_updated_at_projects BEFORE UPDATE ON public.t_projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_updated_at_inspections BEFORE UPDATE ON public.t_inspections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-calculate margins
CREATE OR REPLACE FUNCTION public.calculate_inspection_margins()
RETURNS TRIGGER AS $$
BEGIN
    -- Update project financial summary when inspection changes
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.t_projects 
        SET updated_at = NOW()
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_margins AFTER INSERT OR UPDATE ON public.t_inspection_calc_items
    FOR EACH ROW EXECUTE FUNCTION public.calculate_inspection_margins();

-- ============================================
-- INITIAL DEMO DATA (Enhanced)
-- ============================================

-- Insert demo tenant
INSERT INTO public.t_tenants (tenant_id, name, slug, industry, email, enabled_modules)
SELECT 
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Demo Handwerksbetrieb',
    'demo',
    'moving',
    'demo@arsmechanica.de',
    '["projects", "employees", "time_pairs", "materials", "services", "morningplan", "inspections", "nachkalkulation", "revenue", "vehicle_costs", "material_usage", "users", "abnahmen", "analytics", "feedback"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.t_tenants LIMIT 1);

-- Insert demo subscription (starter tier, trialing)
INSERT INTO public.t_subscriptions (tenant_id, tier, status, trial_starts_at, trial_ends_at, max_users, max_projects)
SELECT 
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'professional',
    'active',
    NOW(),
    NOW() + INTERVAL '7 days',
    10,
    200
WHERE NOT EXISTS (SELECT 1 FROM public.t_subscriptions LIMIT 1);

-- Insert demo users with more variety
-- password_hash is bcrypt of 'demo123' : $2b$12$LJ3m4ys8Xyqvk0f8RUG0nuONG5eTSjOzXHQvQ0J4Y4uvMS5lCZmMW
INSERT INTO public.t_users (user_id, tenant_id, email, password_hash, full_name, role, user_type, is_active, email_verified, preferences)
SELECT 
    gen_random_uuid(),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    user_data.email,
    user_data.password_hash,
    user_data.full_name,
    user_data.role,
    user_data.user_type,
    true,
    true,
    user_data.preferences
FROM (
    VALUES 
        ('admin@example.com', '$2b$12$LJ3m4ys8Xyqvk0f8RUG0nuONG5eTSjOzXHQvQ0J4Y4uvMS5lCZmMW', 'Admin User', 'Admin', 'office', '{"theme": "dark", "notifications": true}'::jsonb),
        ('secretary@example.com', '$2b$12$LJ3m4ys8Xyqvk0f8RUG0nuONG5eTSjOzXHQvQ0J4Y4uvMS5lCZmMW', 'Sekretärin Schmidt', 'Secretary', 'office', '{"theme": "light", "notifications": true}'::jsonb),
        ('planner@example.com', '$2b$12$LJ3m4ys8Xyqvk0f8RUG0nuONG5eTSjOzXHQvQ0J4Y4uvMS5lCZmMW', 'Planer Müller', 'Planner', 'office', '{"theme": "auto", "notifications": false}'::jsonb),
        ('supervisor@example.com', '$2b$12$LJ3m4ys8Xyqvk0f8RUG0nuONG5eTSjOzXHQvQ0J4Y4uvMS5lCZmMW', 'Vorarbeiter Weber', 'Supervisor', 'field', '{"theme": "dark", "notifications": true}'::jsonb),
        ('worker1@example.com', '$2b$12$LJ3m4ys8Xyqvk0f8RUG0nuONG5eTSjOzXHQvQ0J4Y4uvMS5lCZmMW', 'Arbeiter Fischer', 'Worker', 'field', '{}'::jsonb),
        ('worker2@example.com', '$2b$12$LJ3m4ys8Xyqvk0f8RUG0nuONG5eTSjOzXHQvQ0J4Y4uvMS5lCZmMW', 'Arbeiter Wagner', 'Worker', 'field', '{}'::jsonb)
) AS user_data(email, password_hash, full_name, role, user_type, preferences)
WHERE NOT EXISTS (SELECT 1 FROM public.t_users LIMIT 1);

-- Insert demo materials with enhanced data
INSERT INTO public.t_materials (material_id, name, unit, category, subcategory, default_quantity, min_stock, is_consumable, is_reusable)
SELECT 
    gen_random_uuid(),
    m.name,
    m.unit,
    m.category,
    m.subcategory,
    m.default_quantity,
    m.min_stock,
    m.is_consumable,
    m.is_reusable
FROM (
    VALUES 
        ('Umzugskartons', 'Stück', 'Verpackung', 'Kartons', 20, 5, true, false),
        ('Kleiderkisten', 'Stück', 'Verpackung', 'Spezialkartons', 5, 2, true, false),
        ('Packseide', 'Rolle', 'Verpackung', 'Schutzmaterial', 3, 1, true, false),
        ('Klebeband', 'Rolle', 'Verpackung', 'Klebematerial', 5, 2, true, false),
        ('Stretchfolie', 'Rolle', 'Verpackung', 'Schutzmaterial', 2, 1, true, false),
        ('Decken', 'Stück', 'Schutzmaterial', 'Möbelschutz', 10, 3, true, false),
        ('Kantenschutz', 'm', 'Schutzmaterial', 'Kantenschutz', 20, 5, true, false),
        ('Handschuhe', 'Paar', 'Sicherheit', 'Arbeitsschutz', 5, 2, true, false),
        ('Werkzeugkiste', 'Stück', 'Werkzeug', 'Transport', 1, 0, false, true)
) AS m(name, unit, category, subcategory, default_quantity, min_stock, is_consumable, is_reusable)
WHERE NOT EXISTS (SELECT 1 FROM public.t_materials LIMIT 1);

-- Insert demo services with pricing
INSERT INTO public.t_services (service_id, name, default_unit, category, subcategory, base_price, requires_certification)
SELECT 
    gen_random_uuid()::text,
    s.name,
    s.default_unit,
    s.category,
    s.subcategory,
    s.base_price,
    s.requires_certification
FROM (
    VALUES 
        ('Umzugstransport', 'Stunde', 'Transport', 'Standard', 85.00, false),
        ('Möbelmontage', 'Stunde', 'Montage', 'Standard', 65.00, false),
        ('Verpackungsservice', 'Stunde', 'Service', 'Premium', 55.00, false),
        ('Kartonagen', 'Pauschal', 'Material', 'Standard', 150.00, false),
        ('Fernumzug', 'Pauschal', 'Transport', 'Spezial', 1200.00, false),
        ('Lagerung', 'm²', 'Lagerung', 'Standard', 25.00, false),
        ('Seniorenumzug', 'Stunde', 'Service', 'Spezial', 75.00, true),
        ('Entsorgung', 'Stunde', 'Entsorgung', 'Standard', 45.00, false),
        ('Pianotransport', 'Pauschal', 'Transport', 'Spezial', 350.00, true),
        ('Reinigung', 'm²', 'Service', 'Zusatz', 15.00, false)
) AS s(name, default_unit, category, subcategory, base_price, requires_certification)
WHERE NOT EXISTS (SELECT 1 FROM public.t_services LIMIT 1);

-- Insert demo vehicles
INSERT INTO public.t_vehicles (vehicle_id, nickname, make, model, year, license_plate, status)
SELECT 
    gen_random_uuid()::text,
    v.nickname,
    v.make,
    v.model,
    v.year,
    v.license_plate,
    'bereit'
FROM (
    VALUES 
        ('LKW 1', 'Mercedes', 'Atego', 2020, 'W-AT 123'),
        ('LKW 2', 'MAN', 'TGL', 2019, 'W-AT 456'),
        ('Sprinter', 'Mercedes', 'Sprinter', 2021, 'W-AT 789'),
        ('Transporter', 'VW', 'Crafter', 2020, 'W-AT 012')
) AS v(nickname, make, model, year, license_plate)
WHERE NOT EXISTS (SELECT 1 FROM public.t_vehicles LIMIT 1);

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly') THEN
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
    END IF;
END $$;

-- ============================================
-- MAINTENANCE SCHEDULES
-- ============================================

-- Schedule regular maintenance tasks (only if pg_cron is available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
        PERFORM cron.schedule('cleanup-old-analytics', '0 3 * * *', 'SELECT public.auto_cleanup_analytics();');
        PERFORM cron.schedule('update-material-stock', '0 4 * * *', 'UPDATE public.t_material_stock SET updated_at = NOW();');
    END IF;
END $$;
