-- Migration: Add t_project_service_usage table
-- This table tracks which services (from t_services) are used on each project,
-- similar to t_project_material_usage for materials and t_project_vehicle_costs for vehicles.

CREATE TABLE IF NOT EXISTS public.t_project_service_usage (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  project_id text NOT NULL,
  service_id text NOT NULL,
  quantity numeric DEFAULT 1,
  supplier text,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT t_project_service_usage_pkey PRIMARY KEY (id),
  CONSTRAINT t_project_service_usage_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.t_projects(project_id),
  CONSTRAINT t_project_service_usage_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.t_services(service_id)
);

-- Enable RLS (matching pattern of other project tables)
ALTER TABLE public.t_project_service_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.t_project_service_usage FOR ALL USING (true);
