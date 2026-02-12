'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Truck, Plus,
    X, Save, Loader2, Clock, FileText, User, MessageSquare, Pencil, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import {
    DndContext, DragOverlay, useDraggable, useDroppable,
    DragEndEvent, DragStartEvent, closestCorners
} from '@dnd-kit/core';

type Project = Database['public']['Tables']['t_projects']['Row'];
type Employee = Database['public']['Tables']['t_employees']['Row'];
type Vehicle = Database['public']['Tables']['t_vehicles']['Row'];
type MorningPlan = Database['public']['Tables']['t_morningplan']['Row'] & {
    project?: Project;
    staff?: StaffRow[];
};
type StaffRow = Database['public']['Tables']['t_morningplan_staff']['Row'] & { employee?: Employee };
type VehicleDailyStatus = Database['public']['Tables']['t_vehicle_daily_status']['Row'];
type EmployeeDailyNote = Database['public']['Tables']['t_employee_daily_notes']['Row'];

const SERVICE_TYPES = ['Umzug', 'Entrümpelung', 'Transport', 'Einlagerung', 'Malerarbeiten', 'Kartonlieferung', 'Sonstiges'];

// ================ DRAGGABLE PROJECT ================
function DraggableProject({ project }: { project: Project }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `project-${project.project_id}`,
        data: { type: 'project', project },
    });
    return (
        <div ref={setNodeRef} {...listeners} {...attributes}
            className={cn("cursor-grab active:cursor-grabbing rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-blue-300 hover:shadow-md transition-all touch-none", isDragging && "opacity-50")}>
            <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{project.project_code || 'NEU'}</span>
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded",
                    project.status === 'Bestätigt' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>{project.status || 'Planung'}</span>
            </div>
            <h4 className="font-medium text-sm text-slate-800 truncate">{project.name}</h4>
            {project.ort && <div className="text-[10px] text-slate-400 truncate">{project.plz} {project.ort}</div>}
        </div>
    );
}

// ================ DROPPABLE DAY ================
function DroppableDay({ day, plans, onDelete, onOpenStaff, onEditPlan }: {
    day: Date; plans: MorningPlan[]; onDelete: (id: string) => void; onOpenStaff: (plan: MorningPlan) => void; onEditPlan: (plan: MorningPlan) => void;
}) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const { setNodeRef, isOver } = useDroppable({ id: `day-${dateStr}`, data: { date: dateStr } });
    const isToday = isSameDay(day, new Date());

    return (
        <div ref={setNodeRef}
            className={cn("flex flex-col h-full rounded-xl border shadow-sm overflow-hidden transition-colors",
                isOver ? "bg-blue-50 border-blue-400" : "bg-white border-slate-200")}>
            <div className={cn("px-3 py-2 border-b flex flex-col items-center gap-0.5", isToday ? "bg-blue-50/50" : "bg-white")}>
                <span className="text-[10px] font-medium text-slate-400 uppercase">{format(day, 'EEE', { locale: de })}</span>
                <span className={cn("text-base font-bold w-7 h-7 flex items-center justify-center rounded-full",
                    isToday ? "bg-blue-600 text-white" : "text-slate-700")}>{format(day, 'd')}</span>
            </div>
            <div className="flex-1 p-1.5 bg-slate-50/30 space-y-1.5 overflow-y-auto">
                {plans.map(plan => (
                    <div key={plan.plan_id} className="relative rounded-md border border-slate-200 bg-white p-2 shadow-sm group hover:border-blue-200 transition-colors">
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            <button onClick={() => onEditPlan(plan)} className="text-slate-400 hover:text-blue-600 text-xs p-0.5"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => onDelete(plan.plan_id)} className="text-slate-400 hover:text-red-500 text-xs p-0.5">×</button>
                        </div>
                        <div className="text-xs font-semibold text-blue-700 truncate mb-0.5">{plan.project?.name || 'Unbekannt'}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mb-1">
                            <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{plan.start_time?.substring(0, 5) || '07:00'}</span>
                            {plan.vehicle_names && <span className="flex items-center gap-0.5"><Truck className="h-2.5 w-2.5" />{plan.vehicle_names}</span>}
                        </div>
                        {plan.service_type && <div className="text-[9px] text-slate-400 mb-0.5">{plan.service_type}</div>}
                        <div className="flex items-center gap-1 flex-wrap">
                            {(plan.staff || []).map(s => (
                                <span key={s.id} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full truncate max-w-[60px]">{s.employee?.name?.split(' ')[0] || '?'}</span>
                            ))}
                            <button onClick={() => onOpenStaff(plan)}
                                className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors flex items-center gap-0.5">
                                <Users className="h-2.5 w-2.5" /> {(plan.staff || []).length > 0 ? 'Team' : '+ Team'}
                            </button>
                        </div>
                    </div>
                ))}
                {plans.length === 0 && !isOver && (
                    <div className="h-full min-h-[80px] border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-[10px]">Frei</div>
                )}
            </div>
        </div>
    );
}

// ================ MAIN PAGE ================
export default function PlanningPage() {
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [projects, setProjects] = useState<Project[]>([]);
    const [plans, setPlans] = useState<MorningPlan[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehicleStatuses, setVehicleStatuses] = useState<VehicleDailyStatus[]>([]);
    const [employeeNotes, setEmployeeNotes] = useState<EmployeeDailyNote[]>([]);
    const [activeDragItem, setActiveDragItem] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

    // Plan modal
    const [planModal, setPlanModal] = useState<{ mode: 'create' | 'edit'; plan?: MorningPlan; date: string } | null>(null);
    const [planForm, setPlanForm] = useState({ project_id: '', start_time: '07:00', vehicle_id: '', vehicle_names: '', service_type: '', notes: '' });
    const [savingPlan, setSavingPlan] = useState(false);

    // Staff modal
    const [staffModalPlan, setStaffModalPlan] = useState<MorningPlan | null>(null);
    const [staffSelection, setStaffSelection] = useState<{ employee_id: string; start_time: string; notes: string }[]>([]);
    const [savingStaff, setSavingStaff] = useState(false);

    // Bottom panel
    const [bottomTab, setBottomTab] = useState<'vehicles' | 'notes'>('vehicles');

    // Note editing
    const [editingNote, setEditingNote] = useState<{ employee_code: string; notizen: string; id?: number } | null>(null);
    const [savingNote, setSavingNote] = useState(false);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // ---- DATA FETCHING ----
    const fetchData = useCallback(async () => {
        setLoading(true);
        const startDateStr = format(weekStart, 'yyyy-MM-dd');
        const endDateStr = format(weekEnd, 'yyyy-MM-dd');

        const [projRes, planRes, empRes, vehRes] = await Promise.all([
            supabase.from('t_projects').select('*').order('created_at', { ascending: false }).limit(100),
            supabase.from('t_morningplan').select('*, project:t_projects(*)').gte('plan_date', startDateStr).lte('plan_date', endDateStr),
            supabase.from('t_employees').select('*').eq('is_active', true).order('name'),
            supabase.from('t_vehicles').select('*').eq('is_deleted', false).order('nickname'),
        ]);

        setProjects(projRes.data || []);
        setEmployees(empRes.data || []);
        setVehicles(vehRes.data || []);

        const plansRaw = (planRes.data || []) as MorningPlan[];
        if (plansRaw.length > 0) {
            const planIds = plansRaw.map(p => p.plan_id);
            const { data: staffData } = await supabase
                .from('t_morningplan_staff')
                .select('*, employee:t_employees(*)')
                .in('plan_id', planIds);

            const staffByPlan: Record<string, StaffRow[]> = {};
            (staffData as any || []).forEach((s: StaffRow) => {
                if (!staffByPlan[s.plan_id!]) staffByPlan[s.plan_id!] = [];
                staffByPlan[s.plan_id!].push(s);
            });
            plansRaw.forEach(p => { p.staff = staffByPlan[p.plan_id] || []; });
        }

        setPlans(plansRaw);
        setLoading(false);
    }, [currentDate]);

    const fetchDayPanels = useCallback(async () => {
        const [vdsRes, notesRes] = await Promise.all([
            supabase.from('t_vehicle_daily_status').select('*').eq('plan_date', selectedDay),
            supabase.from('t_employee_daily_notes').select('*').eq('plan_date', selectedDay).order('sort_order'),
        ]);
        setVehicleStatuses(vdsRes.data || []);
        setEmployeeNotes(notesRes.data || []);
    }, [selectedDay]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchDayPanels(); }, [fetchDayPanels]);

    // ---- DRAG HANDLERS ----
    const handleDragStart = (e: DragStartEvent) => { if (e.active.data.current?.type === 'project') setActiveDragItem(e.active.data.current.project); };

    const handleDragEnd = async (e: DragEndEvent) => {
        const { active, over } = e;
        setActiveDragItem(null);
        if (!over) return;
        const projectId = active.id.toString().replace('project-', '');
        const dateStr = over.id.toString().replace('day-', '');
        const project = projects.find(p => p.project_id === projectId);
        if (!project) return;

        // Open create modal pre-filled
        setPlanForm({
            project_id: projectId,
            start_time: '07:00',
            vehicle_id: '',
            vehicle_names: '',
            service_type: project.dienstleistungen || '',
            notes: '',
        });
        setPlanModal({ mode: 'create', date: dateStr });
    };

    // ---- PLAN CRUD ----
    const openCreatePlan = (dateStr: string) => {
        setPlanForm({ project_id: '', start_time: '07:00', vehicle_id: '', vehicle_names: '', service_type: '', notes: '' });
        setPlanModal({ mode: 'create', date: dateStr });
    };

    const openEditPlan = (plan: MorningPlan) => {
        setPlanForm({
            project_id: plan.project_id || '',
            start_time: plan.start_time?.substring(0, 5) || '07:00',
            vehicle_id: plan.vehicle_id || '',
            vehicle_names: plan.vehicle_names || '',
            service_type: plan.service_type || '',
            notes: plan.notes || '',
        });
        setPlanModal({ mode: 'edit', plan, date: plan.plan_date });
    };

    const savePlan = async () => {
        if (!planForm.project_id || !planModal) return;
        setSavingPlan(true);
        try {
            const payload = {
                plan_date: planModal.date,
                project_id: planForm.project_id,
                start_time: planForm.start_time || '07:00',
                vehicle_id: planForm.vehicle_id || null,
                vehicle_names: planForm.vehicle_names || null,
                service_type: planForm.service_type || null,
                notes: planForm.notes || null,
            };

            if (planModal.mode === 'create') {
                const { error } = await supabase.from('t_morningplan').insert(payload);
                if (error) throw error;
                toast('Einsatz erstellt');
            } else if (planModal.plan) {
                const { error } = await supabase.from('t_morningplan').update(payload).eq('plan_id', planModal.plan.plan_id);
                if (error) throw error;
                toast('Einsatz aktualisiert');
            }
            setPlanModal(null);
            fetchData();
        } catch { toast('Fehler beim Speichern', 'error'); }
        setSavingPlan(false);
    };

    const handleDeletePlan = async (planId: string) => {
        if (!confirm('Einsatz wirklich löschen?')) return;
        const prev = [...plans];
        setPlans(p => p.filter(x => x.plan_id !== planId));
        const { error } = await supabase.from('t_morningplan').delete().eq('plan_id', planId);
        if (error) { setPlans(prev); toast('Fehler beim Löschen', 'error'); }
    };

    // ---- STAFF MODAL ----
    const openStaffModal = (plan: MorningPlan) => {
        setStaffModalPlan(plan);
        setStaffSelection(
            (plan.staff || []).map(s => ({
                employee_id: s.employee_id || '',
                start_time: s.individual_start_time?.substring(0, 5) || plan.start_time?.substring(0, 5) || '07:00',
                notes: s.member_notes || '',
            }))
        );
    };

    const saveStaff = async () => {
        if (!staffModalPlan) return;
        setSavingStaff(true);
        try {
            // Delete existing
            await supabase.from('t_morningplan_staff').delete().eq('plan_id', staffModalPlan.plan_id);
            // Insert new
            const inserts = staffSelection.filter(s => s.employee_id).map((s, i) => ({
                plan_id: staffModalPlan.plan_id,
                employee_id: s.employee_id,
                individual_start_time: s.start_time || null,
                member_notes: s.notes || null,
                sort_order: i,
            }));
            if (inserts.length > 0) {
                const { error } = await supabase.from('t_morningplan_staff').insert(inserts);
                if (error) throw error;

                // Auto-create time pairs for each new staff member
                const project = staffModalPlan.project;
                if (project) {
                    await Promise.all(inserts.map(async (ins) => {
                        const emp = employees.find(e => e.employee_id === ins.employee_id);
                        if (!emp) return;
                        const { data: existing } = await supabase
                            .from('t_time_pairs').select('pair_id')
                            .eq('project_id', project.project_id)
                            .eq('datum', staffModalPlan.plan_date)
                            .eq('mitarbeiter', emp.name).limit(1);
                        if (!existing || existing.length === 0) {
                            await supabase.from('t_time_pairs').insert({
                                project_id: project.project_id,
                                plan_id: staffModalPlan.plan_id,
                                datum: staffModalPlan.plan_date,
                                mitarbeiter: emp.name,
                                lis_von: ins.individual_start_time || staffModalPlan.start_time || '07:00:00',
                                lis_bis: null, kunde_von: null, kunde_bis: null, pause_min: 0,
                            });
                        }
                    }));
                }
            }
            toast('Team gespeichert');
            setStaffModalPlan(null);
            fetchData();
        } catch { toast('Fehler beim Speichern', 'error'); }
        setSavingStaff(false);
    };

    // ---- VEHICLE STATUS ----
    const saveVehicleStatus = async (vId: string, vName: string, status: string, info: string) => {
        try {
            const existing = vehicleStatuses.find(v => v.vehicle_name === vName && v.plan_date === selectedDay);
            if (existing) {
                const { error } = await supabase.from('t_vehicle_daily_status').update({ status, informationen: info }).eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('t_vehicle_daily_status').insert({ vehicle_name: vName, vehicle_id: vId, plan_date: selectedDay, status, informationen: info });
                if (error) throw error;
            }
            toast('Fahrzeugstatus gespeichert');
            fetchDayPanels();
        } catch { toast('Fehler beim Speichern', 'error'); }
    };

    // ---- EMPLOYEE NOTES CRUD ----
    const openAddNote = () => {
        setEditingNote({ employee_code: '', notizen: '' });
    };

    const openEditNote = (note: EmployeeDailyNote) => {
        setEditingNote({ employee_code: note.employee_code, notizen: note.notizen || '', id: note.id });
    };

    const saveNote = async () => {
        if (!editingNote) return;
        setSavingNote(true);
        try {
            if (editingNote.id) {
                const { error } = await supabase.from('t_employee_daily_notes').update({ notizen: editingNote.notizen }).eq('id', editingNote.id);
                if (error) throw error;
                toast('Notiz aktualisiert');
            } else {
                const maxOrder = employeeNotes.reduce((max, n) => Math.max(max, n.sort_order || 0), 0);
                const { error } = await supabase.from('t_employee_daily_notes').insert({
                    employee_code: editingNote.employee_code,
                    plan_date: selectedDay,
                    notizen: editingNote.notizen,
                    sort_order: maxOrder + 1,
                });
                if (error) throw error;
                toast('Notiz erstellt');
            }
            setEditingNote(null);
            fetchDayPanels();
        } catch { toast('Fehler beim Speichern', 'error'); }
        setSavingNote(false);
    };

    const deleteNote = async (id: number) => {
        if (!confirm('Notiz löschen?')) return;
        setEmployeeNotes(prev => prev.filter(n => n.id !== id));
        const { error } = await supabase.from('t_employee_daily_notes').delete().eq('id', id);
        if (error) { toast('Fehler beim Löschen', 'error'); fetchDayPanels(); }
    };

    // ---- EXPORT ----
    const exportMorningPlan = () => {
        const dayPlans = plans.filter(p => p.plan_date === selectedDay);
        const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Morgenplan ${selectedDay}</title>
        <style>body{font-family:system-ui;margin:2rem;color:#1e293b}h1{font-size:1.5rem;margin-bottom:0.5rem}table{width:100%;border-collapse:collapse;margin:1rem 0}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left;font-size:0.85rem}th{background:#f1f5f9;font-weight:600}.header{background:#1e3a5f;color:white;padding:1rem;border-radius:8px;margin-bottom:1rem}</style></head><body>
        <div class="header"><h1>🌅 Morgenplan</h1><p>${format(new Date(selectedDay), 'EEEE, d. MMMM yyyy', { locale: de })}</p></div>
        <table><tr><th>#</th><th>Projekt</th><th>Adresse</th><th>Start</th><th>Dienstleistung</th><th>Fahrzeug</th><th>Team</th><th>Notizen</th></tr>
        ${dayPlans.map((p, i) => `<tr><td>${i + 1}</td><td>${p.project?.name || '—'}</td><td>${[p.project?.strasse, p.project?.nr].filter(Boolean).join(' ')}, ${p.project?.plz || ''} ${p.project?.ort || ''}</td><td>${p.start_time?.substring(0, 5) || '07:00'}</td><td>${p.service_type || '—'}</td><td>${p.vehicle_names || '—'}</td><td>${(p.staff || []).map(s => s.employee?.name || '?').join(', ') || '—'}</td><td>${p.notes || ''}</td></tr>`).join('')}
        </table>
        <h2>Fahrzeugstatus</h2><table><tr><th>Fahrzeug</th><th>Status</th><th>Info</th></tr>
        ${vehicles.map(v => { const vs = vehicleStatuses.find(s => s.vehicle_name === v.nickname); return `<tr><td>${v.nickname || v.vehicle_id}</td><td>${vs?.status || '—'}</td><td>${vs?.informationen || '—'}</td></tr>`; }).join('')}
        </table>
        ${employeeNotes.length > 0 ? `<h2>Mitarbeiter-Notizen</h2><table><tr><th>Mitarbeiter</th><th>Notiz</th></tr>${employeeNotes.map(n => `<tr><td>${n.employee_code}</td><td>${n.notizen || '—'}</td></tr>`).join('')}</table>` : ''}
        </body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `Morgenplan_${selectedDay}.html`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-800">Einsatzplanung</h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 rounded-md border bg-white px-2 py-1">
                            <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="h-5 w-5 text-slate-600" /></button>
                            <span className="min-w-[160px] text-center font-medium text-sm text-slate-700">
                                {format(weekStart, 'd. MMM', { locale: de })} – {format(weekEnd, 'd. MMM yyyy', { locale: de })}
                            </span>
                            <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="h-5 w-5 text-slate-600" /></button>
                        </div>
                        <button onClick={() => openCreatePlan(selectedDay)}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 shadow-sm">
                            <Plus className="h-3.5 w-3.5" /> Neuer Einsatz
                        </button>
                        <button onClick={exportMorningPlan}
                            className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white hover:bg-slate-900 shadow-sm">
                            <FileText className="h-3.5 w-3.5" /> Export
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Projects */}
                    <div className="w-72 border-r bg-white flex flex-col">
                        <div className="p-3 border-b bg-slate-50/50">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" /> Offene Aufträge
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {loading && projects.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">Laden...</div>
                            ) : projects.map(p => <DraggableProject key={p.project_id} project={p} />)}
                        </div>
                    </div>

                    {/* Calendar + Bottom Panel */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Calendar Grid */}
                        <div className="flex-1 overflow-auto bg-slate-50 p-4">
                            <div className="grid grid-cols-7 gap-3 h-full min-h-[400px]">
                                {weekDays.map(day => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    return (
                                        <div key={dateStr} onClick={() => setSelectedDay(dateStr)}
                                            className={cn("cursor-pointer", dateStr === selectedDay && "ring-2 ring-blue-400 rounded-xl")}>
                                            <DroppableDay day={day} plans={plans.filter(p => p.plan_date === dateStr)}
                                                onDelete={handleDeletePlan} onOpenStaff={openStaffModal} onEditPlan={openEditPlan} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bottom Panel: Vehicles & Notes */}
                        <div className="border-t bg-white" style={{ height: '220px' }}>
                            <div className="flex items-center justify-between border-b px-4 py-2">
                                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                                    <button onClick={() => setBottomTab('vehicles')}
                                        className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                            bottomTab === 'vehicles' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                                        <Truck className="h-3.5 w-3.5" /> Fahrzeuge
                                    </button>
                                    <button onClick={() => setBottomTab('notes')}
                                        className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                            bottomTab === 'notes' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                                        <MessageSquare className="h-3.5 w-3.5" /> Mitarbeiter-Notizen
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">{format(new Date(selectedDay), 'EEEE, d. MMM', { locale: de })}</span>
                                    {bottomTab === 'notes' && (
                                        <button onClick={openAddNote} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                                            <Plus className="h-3 w-3" /> Notiz
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-auto p-3" style={{ height: 'calc(100% - 44px)' }}>
                                {bottomTab === 'vehicles' ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {vehicles.map(v => {
                                            const vs = vehicleStatuses.find(s => s.vehicle_name === v.nickname && s.plan_date === selectedDay);
                                            return (
                                                <div key={v.vehicle_id} className="rounded-lg border border-slate-200 p-2.5 bg-slate-50/50">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1"><Truck className="h-3 w-3" />{v.nickname || v.vehicle_id}</span>
                                                        <select className="text-[10px] border rounded px-1 py-0.5 bg-white"
                                                            value={vs?.status || ''}
                                                            onChange={e => saveVehicleStatus(v.vehicle_id, v.nickname || v.vehicle_id, e.target.value, vs?.informationen || '')}>
                                                            <option value="">—</option>
                                                            <option value="Einsatz">Einsatz</option>
                                                            <option value="Frei">Frei</option>
                                                            <option value="Werkstatt">Werkstatt</option>
                                                        </select>
                                                    </div>
                                                    <input className="w-full text-[10px] border rounded px-2 py-1 bg-white"
                                                        placeholder="Info..."
                                                        value={vs?.informationen || ''}
                                                        onBlur={e => saveVehicleStatus(v.vehicle_id, v.nickname || v.vehicle_id, vs?.status || '', e.target.value)}
                                                        onChange={e => {
                                                            setVehicleStatuses(prev => {
                                                                const copy = [...prev];
                                                                const idx = copy.findIndex(s => s.vehicle_name === v.nickname && s.plan_date === selectedDay);
                                                                if (idx >= 0) copy[idx] = { ...copy[idx], informationen: e.target.value };
                                                                else copy.push({ id: 0, vehicle_name: v.nickname || '', plan_date: selectedDay, status: '', informationen: e.target.value, vehicle_id: v.vehicle_id, created_at: null, updated_at: null });
                                                                return copy;
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {employeeNotes.length === 0 && !editingNote ? (
                                            <div className="text-center py-4 text-xs text-slate-400">Keine Notizen für diesen Tag.
                                                <button onClick={openAddNote} className="text-blue-600 hover:underline ml-1">Notiz hinzufügen</button>
                                            </div>
                                        ) : employeeNotes.map(n => (
                                            <div key={n.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2 bg-slate-50/50 group">
                                                <User className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-xs font-medium text-slate-700">{n.employee_code}</span>
                                                    <p className="text-[10px] text-slate-500">{n.notizen || '—'}</p>
                                                </div>
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button onClick={() => openEditNote(n)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Pencil className="h-3 w-3" /></button>
                                                    <button onClick={() => deleteNote(n.id)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeDragItem && (
                    <div className="w-56 rounded-lg border border-blue-400 bg-white p-3 shadow-xl opacity-90 rotate-2 cursor-grabbing">
                        <h4 className="font-medium text-sm text-slate-800">{activeDragItem.name}</h4>
                        <div className="text-[10px] text-slate-500">{activeDragItem.project_code}</div>
                    </div>
                )}
            </DragOverlay>

            {/* ======= PLAN CREATE/EDIT MODAL ======= */}
            {planModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setPlanModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-lg font-bold text-slate-800">{planModal.mode === 'create' ? 'Neuer Einsatz' : 'Einsatz bearbeiten'}</h2>
                            <button onClick={() => setPlanModal(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{format(new Date(planModal.date), 'EEEE, d. MMMM yyyy', { locale: de })}</div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Projekt *</label>
                                <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={planForm.project_id}
                                    onChange={e => {
                                        const p = projects.find(pr => pr.project_id === e.target.value);
                                        setPlanForm({ ...planForm, project_id: e.target.value, service_type: p?.dienstleistungen || planForm.service_type });
                                    }}>
                                    <option value="">Projekt wählen...</option>
                                    {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_code} — {p.name} ({p.ort})</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Startzeit</label>
                                    <input type="time" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={planForm.start_time}
                                        onChange={e => setPlanForm({ ...planForm, start_time: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Dienstleistung</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={planForm.service_type}
                                        onChange={e => setPlanForm({ ...planForm, service_type: e.target.value })}>
                                        <option value="">—</option>
                                        {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Fahrzeug</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={planForm.vehicle_id}
                                        onChange={e => {
                                            const v = vehicles.find(vh => vh.vehicle_id === e.target.value);
                                            setPlanForm({ ...planForm, vehicle_id: e.target.value, vehicle_names: v?.nickname || '' });
                                        }}>
                                        <option value="">Kein Fahrzeug</option>
                                        {vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.nickname || v.vehicle_id}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Fahrzeug-Name (Text)</label>
                                    <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={planForm.vehicle_names}
                                        onChange={e => setPlanForm({ ...planForm, vehicle_names: e.target.value })} placeholder="z.B. L4U + L Caddy" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Notizen</label>
                                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none" rows={2} value={planForm.notes}
                                    onChange={e => setPlanForm({ ...planForm, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t px-6 py-4">
                            <button onClick={() => setPlanModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-300 hover:bg-slate-50">Abbrechen</button>
                            <button onClick={savePlan} disabled={savingPlan || !planForm.project_id}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                                {savingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======= STAFF ASSIGNMENT MODAL ======= */}
            {staffModalPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setStaffModalPlan(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Team zuweisen</h2>
                                <p className="text-sm text-slate-500">{staffModalPlan.project?.name}</p>
                            </div>
                            <button onClick={() => setStaffModalPlan(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                            {staffSelection.map((s, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <select className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" value={s.employee_id}
                                        onChange={e => { const copy = [...staffSelection]; copy[i].employee_id = e.target.value; setStaffSelection(copy); }}>
                                        <option value="">Mitarbeiter wählen...</option>
                                        {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.name} ({emp.contract_type || ''})</option>)}
                                    </select>
                                    <input type="time" className="rounded-lg border border-slate-300 px-2 py-2 text-sm w-24" value={s.start_time}
                                        onChange={e => { const copy = [...staffSelection]; copy[i].start_time = e.target.value; setStaffSelection(copy); }} />
                                    <input className="rounded-lg border border-slate-300 px-2 py-2 text-sm w-28" placeholder="Notiz" value={s.notes}
                                        onChange={e => { const copy = [...staffSelection]; copy[i].notes = e.target.value; setStaffSelection(copy); }} />
                                    <button onClick={() => setStaffSelection(prev => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                                </div>
                            ))}
                            <button onClick={() => setStaffSelection(prev => [...prev, { employee_id: '', start_time: staffModalPlan?.start_time?.substring(0, 5) || '07:00', notes: '' }])}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="h-4 w-4" /> Mitarbeiter hinzufügen</button>
                        </div>
                        <div className="flex justify-end gap-3 border-t px-6 py-4">
                            <button onClick={() => setStaffModalPlan(null)} className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-300 hover:bg-slate-50">Abbrechen</button>
                            <button onClick={saveStaff} disabled={savingStaff}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                                {savingStaff ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======= EMPLOYEE NOTE MODAL ======= */}
            {editingNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditingNote(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-lg font-bold text-slate-800">{editingNote.id ? 'Notiz bearbeiten' : 'Neue Notiz'}</h2>
                            <button onClick={() => setEditingNote(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-3">
                            {!editingNote.id && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Mitarbeiter</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editingNote.employee_code}
                                        onChange={e => setEditingNote({ ...editingNote, employee_code: e.target.value })}>
                                        <option value="">Mitarbeiter wählen...</option>
                                        {employees.map(emp => <option key={emp.employee_id} value={emp.employee_code || emp.name}>{emp.name} ({emp.employee_code})</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Notiz</label>
                                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none" rows={3}
                                    value={editingNote.notizen} onChange={e => setEditingNote({ ...editingNote, notizen: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t px-6 py-4">
                            <button onClick={() => setEditingNote(null)} className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-300 hover:bg-slate-50">Abbrechen</button>
                            <button onClick={saveNote} disabled={savingNote || (!editingNote.id && !editingNote.employee_code)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                                {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DndContext>
    );
}
