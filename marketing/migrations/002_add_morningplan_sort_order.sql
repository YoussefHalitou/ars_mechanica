-- Migration: Add sort_order to t_morningplan
-- This allows users to reorder project cards in the Einsatzplanung Day View.

ALTER TABLE public.t_morningplan ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Optional: Initialize sort_order based on start_time for existing records
-- WITH ordered_plans AS (
--   SELECT plan_id, row_number() OVER (PARTITION BY plan_date ORDER BY start_time) as rn
--   FROM public.t_morningplan
-- )
-- UPDATE public.t_morningplan
-- SET sort_order = ordered_plans.rn
-- FROM ordered_plans
-- WHERE public.t_morningplan.plan_id = ordered_plans.plan_id;
