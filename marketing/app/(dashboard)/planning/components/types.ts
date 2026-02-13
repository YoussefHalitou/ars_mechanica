import { Database } from '@/types/supabase';

export type Project = Database['public']['Tables']['t_projects']['Row'];
export type Employee = Database['public']['Tables']['t_employees']['Row'];
export type Vehicle = Database['public']['Tables']['t_vehicles']['Row'];
export type StaffRowType = Database['public']['Tables']['t_morningplan_staff']['Row'] & { employee?: Employee };
export type MorningPlan = Database['public']['Tables']['t_morningplan']['Row'] & {
    project?: Project;
    staff?: StaffRowType[];
};
export type VehicleDailyStatus = Database['public']['Tables']['t_vehicle_daily_status']['Row'];
export type EmployeeDailyNote = Database['public']['Tables']['t_employee_daily_notes']['Row'];

export interface PlanTemplate {
    id: string;
    name: string;
    created_at: string;
}

export interface PlanTemplateItem {
    id: string;
    template_id: string;
    project_id?: string;
    project_name?: string;
    start_time?: string;
    vehicle_id?: string;
    service_type?: string;
    notes?: string;
    sort_order?: number;
    created_at: string;
}
