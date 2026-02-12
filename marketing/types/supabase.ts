export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            t_projects: {
                Row: {
                    project_id: string
                    project_code: string | null
                    anrede: string | null
                    name: string | null
                    strasse: string | null
                    nr: string | null
                    plz: string | null
                    ort: string | null
                    telefon: string | null
                    email: string | null
                    notes: string | null
                    status: string | null
                    dienstleistungen: string | null
                    project_date: string | null
                    project_time: string | null
                    project_start_date: string | null
                    project_end_date: string | null
                    offer_type: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    project_id?: string
                    project_code?: string | null
                    anrede?: string | null
                    name?: string | null
                    strasse?: string | null
                    nr?: string | null
                    plz?: string | null
                    ort?: string | null
                    telefon?: string | null
                    email?: string | null
                    notes?: string | null
                    status?: string | null
                    dienstleistungen?: string | null
                    project_date?: string | null
                    project_time?: string | null
                    project_start_date?: string | null
                    project_end_date?: string | null
                    offer_type?: string | null
                }
                Update: {
                    project_id?: string
                    project_code?: string | null
                    anrede?: string | null
                    name?: string | null
                    strasse?: string | null
                    nr?: string | null
                    plz?: string | null
                    ort?: string | null
                    telefon?: string | null
                    email?: string | null
                    notes?: string | null
                    status?: string | null
                    dienstleistungen?: string | null
                    project_date?: string | null
                    project_time?: string | null
                    project_start_date?: string | null
                    project_end_date?: string | null
                    offer_type?: string | null
                }
            }
            t_employees: {
                Row: {
                    employee_id: string
                    employee_code: string | null
                    name: string
                    email: string | null
                    phone: string | null
                    role: string | null
                    contract_type: string | null
                    weekly_hours_contract: number | null
                    hourly_rate: number | null
                    notes: string | null
                    is_active: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    employee_id?: string
                    employee_code?: string | null
                    name: string
                    email?: string | null
                    phone?: string | null
                    role?: string | null
                    contract_type?: string | null
                    weekly_hours_contract?: number | null
                    hourly_rate?: number | null
                    notes?: string | null
                    is_active?: boolean | null
                }
                Update: {
                    employee_id?: string
                    employee_code?: string | null
                    name?: string
                    email?: string | null
                    phone?: string | null
                    role?: string | null
                    contract_type?: string | null
                    weekly_hours_contract?: number | null
                    hourly_rate?: number | null
                    notes?: string | null
                    is_active?: boolean | null
                }
            }
            t_morningplan: {
                Row: {
                    plan_id: string
                    plan_date: string
                    project_id: string | null
                    vehicle_id: string | null
                    start_time: string | null
                    service_type: string | null
                    notes: string | null
                    angebotsart: string | null
                    vehicle_names: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    plan_id?: string
                    plan_date: string
                    project_id?: string | null
                    vehicle_id?: string | null
                    start_time?: string | null
                    service_type?: string | null
                    notes?: string | null
                    angebotsart?: string | null
                    vehicle_names?: string | null
                }
                Update: {
                    plan_id?: string
                    plan_date?: string
                    project_id?: string | null
                    vehicle_id?: string | null
                    start_time?: string | null
                    service_type?: string | null
                    notes?: string | null
                    angebotsart?: string | null
                    vehicle_names?: string | null
                }
            }
            t_morningplan_staff: {
                Row: {
                    id: number
                    plan_id: string | null
                    employee_id: string | null
                    role: string | null
                    individual_start_time: string | null
                    member_notes: string | null
                    sort_order: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: number
                    plan_id?: string | null
                    employee_id?: string | null
                    role?: string | null
                    individual_start_time?: string | null
                    member_notes?: string | null
                    sort_order?: number | null
                }
                Update: {
                    id?: number
                    plan_id?: string | null
                    employee_id?: string | null
                    role?: string | null
                    individual_start_time?: string | null
                    member_notes?: string | null
                    sort_order?: number | null
                }
            }
            t_vehicles: {
                Row: {
                    vehicle_id: string
                    nickname: string | null
                    unit: string | null
                    status: string | null
                    inhalt: string | null
                    notes: string | null
                    is_deleted: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    vehicle_id: string
                    nickname?: string | null
                    unit?: string | null
                    status?: string | null
                    inhalt?: string | null
                    notes?: string | null
                    is_deleted?: boolean | null
                }
                Update: {
                    vehicle_id?: string
                    nickname?: string | null
                    unit?: string | null
                    status?: string | null
                    inhalt?: string | null
                    notes?: string | null
                    is_deleted?: boolean | null
                }
            }
            t_vehicle_daily_status: {
                Row: {
                    id: number
                    vehicle_name: string
                    status: string | null
                    informationen: string | null
                    plan_date: string
                    vehicle_id: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: number
                    vehicle_name: string
                    status?: string | null
                    informationen?: string | null
                    plan_date: string
                    vehicle_id?: string | null
                }
                Update: {
                    vehicle_name?: string
                    status?: string | null
                    informationen?: string | null
                    plan_date?: string
                    vehicle_id?: string | null
                }
            }
            t_vehicle_rates: {
                Row: {
                    vehicle_id: string
                    cost_per_unit: number | null
                    gas_cost_per_unit: number | null
                    price_per_unit: number | null
                    gas_price_per_unit: number | null
                    currency: string | null
                    updated_by: string | null
                    updated_at: string | null
                    total_cost_per_unit: number | null
                    total_price_per_unit: number | null
                }
                Insert: {
                    vehicle_id: string
                    cost_per_unit?: number | null
                    gas_cost_per_unit?: number | null
                    price_per_unit?: number | null
                    gas_price_per_unit?: number | null
                    currency?: string | null
                    updated_by?: string | null
                }
                Update: {
                    vehicle_id?: string
                    cost_per_unit?: number | null
                    gas_cost_per_unit?: number | null
                    price_per_unit?: number | null
                    gas_price_per_unit?: number | null
                    currency?: string | null
                    updated_by?: string | null
                }
            }
            t_employee_daily_notes: {
                Row: {
                    id: number
                    employee_code: string
                    plan_date: string
                    notizen: string | null
                    sort_order: number | null
                    employee_id: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: number
                    employee_code: string
                    plan_date: string
                    notizen?: string | null
                    sort_order?: number | null
                    employee_id?: string | null
                }
                Update: {
                    employee_code?: string
                    plan_date?: string
                    notizen?: string | null
                    sort_order?: number | null
                    employee_id?: string | null
                }
            }
            t_time_pairs: {
                Row: {
                    id: number
                    pair_id: string
                    project_id: string | null
                    datum: string
                    mitarbeiter: string
                    lis_von: string | null
                    lis_bis: string | null
                    kunde_von: string | null
                    kunde_bis: string | null
                    pause_min: number | null
                    ges_lis_h: number | null
                    ges_kd_h: number | null
                    employee_id: string | null
                    abnahme_id: string | null
                    plan_id: string | null
                    staff_id: string | null
                    employee_name: string | null
                    employee_code: string | null
                    pause: string | null
                    ges_lis: string | null
                    ges_kd: string | null
                    notes: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    pair_id: string
                    project_id?: string | null
                    datum: string
                    mitarbeiter: string
                    lis_von?: string | null
                    lis_bis?: string | null
                    kunde_von?: string | null
                    kunde_bis?: string | null
                    pause_min?: number | null
                    employee_id?: string | null
                    plan_id?: string | null
                    staff_id?: string | null
                    employee_name?: string | null
                    employee_code?: string | null
                    pause?: string | null
                    ges_lis?: string | null
                    ges_kd?: string | null
                    notes?: string | null
                }
                Update: {
                    pair_id?: string
                    project_id?: string | null
                    datum?: string
                    mitarbeiter?: string
                    lis_von?: string | null
                    lis_bis?: string | null
                    kunde_von?: string | null
                    kunde_bis?: string | null
                    pause_min?: number | null
                    employee_id?: string | null
                    plan_id?: string | null
                    staff_id?: string | null
                    employee_name?: string | null
                    employee_code?: string | null
                    pause?: string | null
                    ges_lis?: string | null
                    ges_kd?: string | null
                    notes?: string | null
                }
            }
            t_work_assignments: {
                Row: {
                    assignment_id: string
                    work_type: string
                    employee_name: string
                    employee_code: string | null
                    assignment_date: string
                    start_time: string | null
                    end_time: string | null
                    hours_estimated: number | null
                    status: string | null
                    notes: string | null
                    break_minutes: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    assignment_id?: string
                    work_type: string
                    employee_name: string
                    employee_code?: string | null
                    assignment_date: string
                    start_time?: string | null
                    end_time?: string | null
                    hours_estimated?: number | null
                    status?: string | null
                    notes?: string | null
                    break_minutes?: number | null
                }
                Update: {
                    work_type?: string
                    employee_name?: string
                    employee_code?: string | null
                    assignment_date?: string
                    start_time?: string | null
                    end_time?: string | null
                    hours_estimated?: number | null
                    status?: string | null
                    notes?: string | null
                    break_minutes?: number | null
                }
            }
            t_materials: {
                Row: {
                    material_id: string
                    name: string
                    unit: string
                    category: string | null
                    vat_rate: number | null
                    is_active: boolean | null
                    default_quantity: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    material_id: string
                    name: string
                    unit: string
                    category?: string | null
                    vat_rate?: number | null
                    is_active?: boolean | null
                    default_quantity?: number | null
                }
                Update: {
                    material_id?: string
                    name?: string
                    unit?: string
                    category?: string | null
                    vat_rate?: number | null
                    is_active?: boolean | null
                    default_quantity?: number | null
                }
            }
            t_material_prices: {
                Row: {
                    material_id: string
                    cost_per_unit: number | null
                    price_per_unit: number | null
                    currency: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Insert: {
                    material_id: string
                    cost_per_unit?: number | null
                    price_per_unit?: number | null
                    currency?: string | null
                    updated_by?: string | null
                }
                Update: {
                    material_id?: string
                    cost_per_unit?: number | null
                    price_per_unit?: number | null
                    currency?: string | null
                    updated_by?: string | null
                }
            }
            t_project_material_usage: {
                Row: {
                    id: string
                    project_id: string | null
                    material_id: string | null
                    quantity: number
                    phase: string | null
                    inspection_id: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    project_id?: string | null
                    material_id?: string | null
                    quantity?: number
                    phase?: string | null
                    inspection_id?: string | null
                }
                Update: {
                    project_id?: string | null
                    material_id?: string | null
                    quantity?: number
                    phase?: string | null
                    inspection_id?: string | null
                }
            }
            t_project_vehicle_costs: {
                Row: {
                    id: string
                    project_id: string | null
                    vehicle_id: string | null
                    usage_type: string
                    usage_value: number
                    cost_per_unit: number | null
                    total_cost: number | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id?: string | null
                    vehicle_id?: string | null
                    usage_type: string
                    usage_value: number
                    cost_per_unit?: number | null
                    total_cost?: number | null
                    notes?: string | null
                }
                Update: {
                    project_id?: string | null
                    vehicle_id?: string | null
                    usage_type?: string
                    usage_value?: number
                    cost_per_unit?: number | null
                    total_cost?: number | null
                    notes?: string | null
                }
            }
            t_project_revenue_items: {
                Row: {
                    id: string
                    project_id: string | null
                    position_label: string
                    qty: number
                    unit: string | null
                    unit_price: number
                    line_total: number | null
                    kind: string
                    source_inspection_id: string | null
                    sort_order: number | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id?: string | null
                    position_label: string
                    qty: number
                    unit?: string | null
                    unit_price: number
                    line_total?: number | null
                    kind?: string
                    source_inspection_id?: string | null
                    sort_order?: number | null
                    notes?: string | null
                }
                Update: {
                    project_id?: string | null
                    position_label?: string
                    qty?: number
                    unit?: string | null
                    unit_price?: number
                    line_total?: number | null
                    kind?: string
                    source_inspection_id?: string | null
                    sort_order?: number | null
                    notes?: string | null
                }
            }
            t_project_costs_extra: {
                Row: {
                    cost_id: string
                    project_id: string | null
                    cost_type: string
                    description: string | null
                    cost: number
                    phase: string | null
                    created_at: string | null
                }
                Insert: {
                    cost_id?: string
                    project_id?: string | null
                    cost_type: string
                    description?: string | null
                    cost: number
                    phase?: string | null
                }
                Update: {
                    project_id?: string | null
                    cost_type?: string
                    description?: string | null
                    cost?: number
                    phase?: string | null
                }
            }
            t_disposal_costs: {
                Row: {
                    id: string
                    project_id: string | null
                    waste_type: string
                    used_unit: number
                    cost_per_unit: number
                    total_cost: number | null
                    phase: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    project_id?: string | null
                    waste_type: string
                    used_unit: number
                    cost_per_unit: number
                    total_cost?: number | null
                    phase?: string | null
                }
                Update: {
                    project_id?: string | null
                    waste_type?: string
                    used_unit?: number
                    cost_per_unit?: number
                    total_cost?: number | null
                    phase?: string | null
                }
            }
            t_project_discounts: {
                Row: {
                    id: string
                    project_id: string | null
                    target: string
                    mode: string
                    value: number
                    description: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    project_id?: string | null
                    target: string
                    mode: string
                    value: number
                    description?: string | null
                }
                Update: {
                    project_id?: string | null
                    target?: string
                    mode?: string
                    value?: number
                    description?: string | null
                }
            }
            t_services: {
                Row: {
                    service_id: string
                    name: string
                    default_unit: string | null
                    category: string | null
                    is_active: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    service_id: string
                    name: string
                    default_unit?: string | null
                    category?: string | null
                    is_active?: boolean | null
                }
                Update: {
                    service_id?: string
                    name?: string
                    default_unit?: string | null
                    category?: string | null
                    is_active?: boolean | null
                }
            }
            t_service_prices: {
                Row: {
                    price_id: string
                    service_id: string
                    supplier: string
                    unit: string | null
                    cost_per_unit: number | null
                    customer_price_per_unit: number | null
                }
                Insert: {
                    price_id: string
                    service_id: string
                    supplier: string
                    unit?: string | null
                    cost_per_unit?: number | null
                    customer_price_per_unit?: number | null
                }
                Update: {
                    price_id?: string
                    service_id?: string
                    supplier?: string
                    unit?: string | null
                    cost_per_unit?: number | null
                    customer_price_per_unit?: number | null
                }
            }
            t_worker_ratings: {
                Row: {
                    rating_id: string
                    project_id: string
                    plan_id: string
                    employee_id: string
                    employee_name: string | null
                    datum: string
                    rating: number | null
                    notes: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    rating_id: string
                    project_id: string
                    plan_id: string
                    employee_id: string
                    employee_name?: string | null
                    datum: string
                    rating?: number | null
                    notes?: string | null
                }
                Update: {
                    rating_id?: string
                    project_id?: string
                    plan_id?: string
                    employee_id?: string
                    employee_name?: string | null
                    datum?: string
                    rating?: number | null
                    notes?: string | null
                }
            }
        }
    }
}
