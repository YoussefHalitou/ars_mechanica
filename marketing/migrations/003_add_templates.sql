-- Create templates table
create table public.t_plan_templates (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone not null default now(),
  constraint t_plan_templates_pkey primary key (id)
) tablespace pg_default;

-- Create template items table (linked to template)
create table public.t_plan_template_items (
  id uuid not null default gen_random_uuid (),
  template_id uuid not null,
  project_id text null, -- Store project ID (might be null for placeholders)
  project_name text null, -- Store name for display
  start_time text null,
  vehicle_id text null,
  service_type text null,
  notes text null,
  sort_order integer null default 0,
  created_at timestamp with time zone not null default now(),
  constraint t_plan_template_items_pkey primary key (id),
  constraint t_plan_template_items_template_id_fkey foreign key (template_id) references t_plan_templates (id) on delete cascade
) tablespace pg_default;

-- Add RLS policies (optional, adjust based on needs)
alter table public.t_plan_templates enable row level security;
alter table public.t_plan_template_items enable row level security;

create policy "Enable all access for authenticated users" on public.t_plan_templates
  for all using (auth.role() = 'authenticated');

create policy "Enable all access for authenticated users" on public.t_plan_template_items
  for all using (auth.role() = 'authenticated');
