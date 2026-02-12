/* 
  # Retool Migration Schema
  
  Run this SQL in your Supabase SQL Editor to create the tables.
*/

-- 1. Projects Table
create table public.t_projects (
  id uuid default gen_random_uuid() primary key,
  project_code text unique not null,
  client_details jsonb default '{}'::jsonb, -- Store address, name, contact info
  status text check (status in ('Planung', 'Bestätigt', 'Abgeschlossen', 'Archiviert')),
  dates jsonb default '{}'::jsonb, -- start_date, end_date, project_time
  services jsonb default '[]'::jsonb, -- Array of service objects
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Employees Table
create table public.t_employees (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text,
  type text check (type in ('Intern', 'Extern', 'Frei')),
  hourly_rate decimal(10, 2) default 0.00,
  email text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Vehicles Table
create table public.t_vehicles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  plate_number text,
  capacity text,
  status text default 'Verfügbar',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Morning Plan (Daily Disposition)
create table public.t_morningplan (
  id uuid default gen_random_uuid() primary key,
  plan_date date not null,
  project_id uuid references public.t_projects(id) on delete cascade,
  start_time time,
  vehicle_ids uuid[] default array[]::uuid[], -- Array of vehicle IDs
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Staff Assignments (Who works on which plan)
create table public.t_staff_assignments (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.t_morningplan(id) on delete cascade,
  employee_id uuid references public.t_employees(id) on delete set null,
  start_time time,
  role_on_job text, -- Specific role for this day (e.g. Team Lead)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Time Entries (Post-Processing / Nachkalkulation)
create table public.t_time_entries (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references public.t_staff_assignments(id) on delete cascade,
  hours_worked decimal(5, 2) default 0.00,
  break_minutes integer default 0,
  type text check (type in ('LiS', 'Kunde')), -- Internal vs Billable
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Material Usage (Cost Tracking)
create table public.t_material_usage (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.t_projects(id) on delete cascade,
  material_name text not null,
  quantity decimal(10, 2) default 0.00,
  unit text,
  unit_cost decimal(10, 2) default 0.00,
  unit_price decimal(10, 2) default 0.00, -- Charge to customer
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) - Optional for now but recommended
alter table public.t_projects enable row level security;
alter table public.t_employees enable row level security;
alter table public.t_morningplan enable row level security;
alter table public.t_staff_assignments enable row level security;
alter table public.t_time_entries enable row level security;

-- Create simple "allow all" policies for development (Change this for production!)
create policy "Enable all access for all users" on public.t_projects for all using (true);
create policy "Enable all access for all users" on public.t_employees for all using (true);
create policy "Enable all access for all users" on public.t_vehicles for all using (true);
create policy "Enable all access for all users" on public.t_morningplan for all using (true);
create policy "Enable all access for all users" on public.t_staff_assignments for all using (true);
create policy "Enable all access for all users" on public.t_time_entries for all using (true);
create policy "Enable all access for all users" on public.t_material_usage for all using (true);
