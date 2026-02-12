'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Truck, Plus,
    X, Save, Loader2, Clock, FileText, User, MessageSquare, Pencil, Trash2, ArrowLeft, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import {
    DndContext, DragOverlay, useDraggable, useDroppable,
    DragEndEvent, DragStartEvent, closestCorners
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                    {project.project_date ? format(new Date(project.project_date), 'dd.MM.yy') : (project.project_code || 'NEU')}
                </span>
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded",
                    project.status === 'Bestätigt' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>{project.status || 'Planung'}</span>
            </div>
            <h4 className="font-medium text-sm text-slate-800 truncate">{project.name}</h4>
            {project.ort && <div className="text-[10px] text-slate-400 truncate">{project.plz} {project.ort}</div>}
        </div>
    );
}

// ================ DROPPABLE DAY ================
function DroppableDay({ day, plans, onDelete, onEditPlan }: {
    day: Date; plans: MorningPlan[]; onDelete: (id: string, e: React.MouseEvent) => void; onEditPlan: (plan: MorningPlan) => void;
}) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const { setNodeRef, isOver } = useDroppable({ id: `day-${dateStr}`, data: { date: dateStr } });
    const isToday = isSameDay(day, new Date());

    return (
        <div ref={setNodeRef}
            className={cn("flex flex-col h-full rounded-xl border shadow-sm overflow-hidden transition-colors group/day",
                isOver ? "bg-blue-50 border-blue-400" : "bg-white border-slate-200")}>
            <div className={cn("px-3 py-2 border-b flex flex-col items-center gap-0.5 relative", isToday ? "bg-blue-50/50" : "bg-white")}>
                <span className="text-[10px] font-medium text-slate-400 uppercase">{format(day, 'EEE', { locale: de })}</span>
                <span className={cn("text-base font-bold w-7 h-7 flex items-center justify-center rounded-full",
                    isToday ? "bg-blue-600 text-white" : "text-slate-700")}>{format(day, 'd')}</span>
            </div>
            <div className="flex-1 p-1.5 bg-slate-50/30 space-y-1.5 overflow-y-auto">
                {plans.map(plan => (
                    <div key={plan.plan_id} className="relative rounded-md border border-slate-200 bg-white p-2 shadow-sm group hover:border-blue-200 transition-colors cursor-default" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            <button onClick={() => onEditPlan(plan)} className="text-slate-400 hover:text-blue-600 text-xs p-0.5"><Pencil className="h-3 w-3" /></button>
                            <button onClick={(e) => onDelete(plan.plan_id, e)} type="button" className="text-slate-400 hover:text-red-500 text-xs p-0.5">×</button>
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

// ================ SORTABLE STAFF ROW ================
function SortableStaffRow({ staff, onUpdate, onRemove }: {
    staff: StaffRow;
    planStaff: StaffRow[];
    onUpdate: (id: number, field: string, value: any) => void;
    onRemove: (id: number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: `staff-${staff.id}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} className={cn("group hover:bg-slate-50/80 transition-colors", isDragging && "opacity-50 relative z-20 bg-white")}>
            <td className="px-5 py-2 font-medium text-slate-700">
                <div className="flex items-center gap-2">
                    <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-1">
                        <MoreHorizontal className="h-3.5 w-3.5 rotate-90" />
                    </div>
                    <div>
                        {staff.employee?.name}
                        <div className="text-[10px] text-slate-400 font-normal">{staff.employee?.contract_type}</div>
                    </div>
                </div>
            </td>
            <td className="px-2 py-2">
                <input
                    type="time"
                    className="w-full bg-transparent border border-transparent rounded px-1 py-0.5 hover:border-slate-300 focus:border-blue-400 focus:bg-white transition-all text-slate-600 font-mono"
                    defaultValue={staff.individual_start_time?.substring(0, 5) || ''}
                    onBlur={(e) => {
                        if (e.target.value !== staff.individual_start_time?.substring(0, 5)) {
                            onUpdate(staff.id, 'individual_start_time', e.target.value);
                        }
                    }}
                />
            </td>
            <td className="px-2 py-2">
                <input
                    type="text"
                    className="w-full bg-transparent border border-transparent rounded px-1 py-0.5 hover:border-slate-300 focus:border-blue-400 focus:bg-white transition-all text-slate-600 placeholder:text-slate-300"
                    placeholder="Rolle/Notiz..."
                    defaultValue={staff.member_notes || ''}
                    onBlur={(e) => {
                        if (e.target.value !== (staff.member_notes || '')) {
                            onUpdate(staff.id, 'member_notes', e.target.value);
                        }
                    }}
                />
            </td>
            <td className="px-2 py-2 text-right">
                <button
                    onClick={() => onRemove(staff.id)}
                    className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </td>
        </tr>
    );
}

// ================ PREVIEW EXPORT FOR DAY VIEW ================
// Same as previous export, but we keep it here if user wants PDF/HTML download
// ... (omitted if not used directly, but we kept buttons)

// ================ MAIN PAGE ================
export default function PlanningPage() {
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
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

    // Staff modal state REMOVED




    // Sidebar State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [projectSearch, setProjectSearch] = useState('');
    const [projectFilterStart, setProjectFilterStart] = useState('');
    const [projectFilterEnd, setProjectFilterEnd] = useState('');

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
    }, [weekStart, weekEnd]); // Removed currentDate, depends on weekStart

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

    // ---- MEMOS ----
    const filteredProjects = React.useMemo(() => {
        let res = [...projects];
        res.sort((a, b) => {
            const dateA = a.project_date ? new Date(a.project_date).getTime() : 0;
            const dateB = b.project_date ? new Date(b.project_date).getTime() : 0;
            if (dateA === 0 && dateB === 0) return 0;
            if (dateA === 0) return 1;
            if (dateB === 0) return -1;
            return dateA - dateB;
        });
        if (projectSearch) {
            const low = projectSearch.toLowerCase();
            res = res.filter(p => (p.name?.toLowerCase().includes(low)) || (p.ort?.toLowerCase().includes(low)) || (p.project_code?.toLowerCase().includes(low)));
        }
        if (projectFilterStart) res = res.filter(p => p.project_date && p.project_date >= projectFilterStart);
        if (projectFilterEnd) res = res.filter(p => p.project_date && p.project_date <= projectFilterEnd);
        return res;
    }, [projects, projectSearch, projectFilterStart, projectFilterEnd]);

    // ---- DRAG HANDLERS ----
    const handleDragStart = (e: DragStartEvent) => {
        if (e.active.data.current?.type === 'project') {
            setActiveDragItem(e.active.data.current.project);
        }
    };

    const handleDragEnd = async (e: DragEndEvent) => {
        const { active, over } = e;
        setActiveDragItem(null);

        if (!over) return;

        // 1. PROJECT DRAG (to a Day)
        if (active.data.current?.type === 'project') {
            const projectId = active.id.toString().replace('project-', '');
            const dateStr = over.id.toString().replace('day-', '');
            const project = projects.find(p => p.project_id === projectId);
            if (!project) return;
            setPlanForm({ project_id: projectId, start_time: '07:00', vehicle_id: '', vehicle_names: '', service_type: project.dienstleistungen || '', notes: '' });
            setPlanModal({ mode: 'create', date: dateStr });
            return;
        }

        // 2. STAFF REORDERING (within a Plan)
        if (active.id.toString().startsWith('staff-') && over.id.toString().startsWith('staff-')) {
            const activeId = parseInt(active.id.toString().replace('staff-', ''));
            const overId = parseInt(over.id.toString().replace('staff-', ''));

            if (activeId === overId) return;

            // Find which plan this staff belongs to
            const plan = plans.find(p => p.staff?.some(s => s.id === activeId));
            if (!plan || !plan.staff) return;

            const oldIndex = plan.staff.findIndex(s => s.id === activeId);
            const newIndex = plan.staff.findIndex(s => s.id === overId);

            const newStaff = [...plan.staff];
            const [movedItem] = newStaff.splice(oldIndex, 1);
            newStaff.splice(newIndex, 0, movedItem);

            // Update UI optimistically
            setPlans(prev => prev.map(p => p.plan_id === plan.plan_id ? { ...p, staff: newStaff } : p));

            // Persist to DB
            try {
                const updates = newStaff.map((s, idx) => ({
                    id: s.id,
                    sort_order: idx + 1
                }));

                // Promise.all to update all affected staff positions
                await Promise.all(updates.map(u =>
                    supabase.from('t_morningplan_staff').update({ sort_order: u.sort_order }).eq('id', u.id)
                ));
                toast('Reihenfolge gespeichert');
            } catch {
                toast('Fehler beim Sortieren', 'error');
                fetchData(); // Rollback
            }
        }
    };

    // ---- PLAN CRUD ----
    const openCreatePlan = (dateStr: string) => {
        setPlanForm({ project_id: '', start_time: '07:00', vehicle_id: '', vehicle_names: '', service_type: '', notes: '' });
        setPlanModal({ mode: 'create', date: dateStr });
    };

    const openEditPlan = (plan: MorningPlan) => {
        setPlanForm({
            project_id: plan.project_id || '', start_time: plan.start_time?.substring(0, 5) || '07:00',
            vehicle_id: plan.vehicle_id || '', vehicle_names: plan.vehicle_names || '',
            service_type: plan.service_type || '', notes: plan.notes || '',
        });
        setPlanModal({ mode: 'edit', plan, date: plan.plan_date });
    };

    const savePlan = async () => {
        if (!planForm.project_id || !planModal) return;
        setSavingPlan(true);
        try {
            const payload = {
                plan_date: planModal.date, project_id: planForm.project_id, start_time: planForm.start_time || '07:00',
                vehicle_id: planForm.vehicle_id || null, vehicle_names: planForm.vehicle_names || null,
                service_type: planForm.service_type || null, notes: planForm.notes || null,
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

    const handleDeletePlan = async (planId: string, e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!confirm('Einsatz wirklich löschen?')) return;
        setPlans(p => p.filter(x => x.plan_id !== planId));
        const { error } = await supabase.from('t_morningplan').delete().eq('plan_id', planId);
        if (error) toast('Fehler beim Löschen', 'error');
    };

    // ---- STAFF INLINE CRUD ----
    const addStaffToPlan = async (planId: string, employeeId: string) => {
        if (!employeeId) return;
        try {
            // Get max sort order
            const currentStaff = plans.find(p => p.plan_id === planId)?.staff || [];
            const maxOrder = currentStaff.reduce((max, s) => Math.max(max, s.sort_order || 0), 0);

            const { error } = await supabase.from('t_morningplan_staff').insert({
                plan_id: planId,
                employee_id: employeeId,
                sort_order: maxOrder + 1,
                individual_start_time: null // defaults to plan start time usually, or null
            });
            if (error) throw error;
            toast('Mitarbeiter hinzugefügt');
            fetchData();
        } catch { toast('Fehler beim Hinzufügen', 'error'); }
    };

    const updateStaffMember = async (staffId: number, field: string, value: any) => {
        try {
            const { error } = await supabase.from('t_morningplan_staff').update({ [field]: value }).eq('id', staffId);
            if (error) throw error;
            fetchData(); // Refresh to ensure UI sync
        } catch { toast('Fehler beim Aktualisieren', 'error'); }
    };

    const removeStaffFromPlan = async (staffId: number) => {
        try {
            const { error } = await supabase.from('t_morningplan_staff').delete().eq('id', staffId);
            if (error) throw error;
            toast('Mitarbeiter entfernt');
            fetchData();
        } catch { toast('Fehler beim Entfernen', 'error'); }
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



    // Day View: Plan for selected day
    const dayPlans = plans.filter(p => p.plan_date === selectedDay).sort((a, b) => (a.start_time || '07:00').localeCompare(b.start_time || '07:00'));

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
            <div className="flex h-full flex-col bg-slate-50">
                {/* Header */}
                <header className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm z-10 relative">
                    <div className="flex items-center gap-4">
                        {viewMode === 'day' && (
                            <button onClick={() => setViewMode('week')} className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-slate-800">
                            {viewMode === 'week' ? 'Einsatzplanung' : `Tagesplan: ${format(new Date(selectedDay), 'd. MMMM yyyy', { locale: de })}`}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {viewMode === 'week' && (
                            <div className="flex items-center gap-1 rounded-md border bg-white px-2 py-1">
                                <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="h-5 w-5 text-slate-600" /></button>
                                <span className="min-w-[160px] text-center font-medium text-sm text-slate-700">
                                    {format(weekStart, 'd. MMM', { locale: de })} – {format(weekEnd, 'd. MMM yyyy', { locale: de })}
                                </span>
                                <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="h-5 w-5 text-slate-600" /></button>
                            </div>
                        )}
                        <button onClick={() => openCreatePlan(selectedDay)}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 shadow-sm">
                            <Plus className="h-3.5 w-3.5" /> Neuer Einsatz
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Projects (Visible in Week View only, or both?) - Keep visible in both as per user might need to drag? Actually drag only works on droppables. */}
                    {/* Assuming Sidebar is only needed for Week view drag-drop scheduling */}
                    {viewMode === 'week' && (
                        <div className={cn("border-r bg-white flex flex-col transition-all duration-300", sidebarOpen ? "w-80" : "w-10")}>
                            <div className="p-3 border-b bg-slate-50/50 flex items-center justify-between">
                                {sidebarOpen ? (
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                                            <CalendarIcon className="h-4 w-4" /> Offene Aufträge
                                        </h3>
                                        {/* Filters */}
                                        <div className="space-y-2">
                                            <input type="text" placeholder="Suche..." className="w-full text-xs border rounded px-2 py-1"
                                                value={projectSearch} onChange={e => setProjectSearch(e.target.value)} />
                                            <div className="flex items-center gap-1">
                                                <input type="date" className="w-full text-[10px] border rounded px-1 py-1"
                                                    value={projectFilterStart} onChange={e => setProjectFilterStart(e.target.value)} />
                                                <span className="text-slate-400">-</span>
                                                <input type="date" className="w-full text-[10px] border rounded px-1 py-1"
                                                    value={projectFilterEnd} onChange={e => setProjectFilterEnd(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 pt-4">
                                        <CalendarIcon className="h-5 w-5 text-slate-400" />
                                        <span className="text-[10px] font-medium text-slate-400 vertical-text" style={{ writingMode: 'vertical-rl' }}>AUFTRÄGE</span>
                                    </div>
                                )}
                                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-slate-200 text-slate-500">
                                    {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                            </div>

                            {sidebarOpen && (
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    {loading && projects.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 text-sm">Laden...</div>
                                    ) : filteredProjects.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 text-sm">Keine Aufträge gefunden.</div>
                                    ) : filteredProjects.map(p => <DraggableProject key={p.project_id} project={p} />)}
                                </div>
                            )}
                        </div>
                    )}

                    {viewMode === 'week' ? (
                        /* ============ WEEK VIEW ============ */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Calendar Grid */}
                            <div className="flex-1 overflow-auto bg-slate-50 p-4">
                                <div className="grid grid-cols-7 gap-3 h-full min-h-[400px]">
                                    {weekDays.map(day => {
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        return (
                                            <div key={dateStr} onClick={() => { setSelectedDay(dateStr); setViewMode('day'); }}
                                                className={cn("cursor-pointer hover:ring-2 hover:ring-blue-200 rounded-xl transition-all", dateStr === selectedDay && "ring-2 ring-blue-400")}>
                                                <DroppableDay day={day} plans={plans.filter(p => p.plan_date === dateStr)}
                                                    onDelete={handleDeletePlan} onEditPlan={openEditPlan} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ============ DAY VIEW ============ */
                        <div className="flex-1 overflow-auto p-6 space-y-8 max-w-5xl mx-auto w-full">
                            {/* 1. Vehicles (Top) */}
                            <section>
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Fahrzeuge</h3>
                                <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                                    {["L4N", "L4U", "L Khalid", "L Caddy", "L Star"].map(vName => {
                                        const v = vehicles.find(veh => (veh.nickname || veh.vehicle_id) === vName);
                                        if (!v) return null;
                                        const vs = vehicleStatuses.find(s => s.vehicle_name === v.nickname && s.plan_date === selectedDay);
                                        return (
                                            <div key={v.vehicle_id} className="rounded-lg border border-slate-200 p-2.5 bg-white shadow-sm">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 truncate"><Truck className="h-3 w-3" />{v.nickname || v.vehicle_id}</span>
                                                    <select className="text-[10px] border rounded px-1 py-0.5 bg-slate-50"
                                                        value={vs?.status || ''}
                                                        onChange={e => saveVehicleStatus(v.vehicle_id, v.nickname || v.vehicle_id, e.target.value, vs?.informationen || '')}>
                                                        <option value="">—</option>
                                                        <option value="Einsatz">Einsatz</option>
                                                        <option value="Frei">Frei</option>
                                                        <option value="Werkstatt">Werkstatt</option>
                                                    </select>
                                                </div>
                                                <input className="w-full text-[10px] border rounded px-2 py-1 bg-slate-50"
                                                    placeholder="Info..."
                                                    value={vs?.informationen || ''}
                                                    onBlur={e => saveVehicleStatus(v.vehicle_id, v.nickname || v.vehicle_id, vs?.status || '', e.target.value)}
                                                    onChange={e => {
                                                        const newVal = e.target.value;
                                                        setVehicleStatuses(prev => {
                                                            const copy = [...prev];
                                                            const idx = copy.findIndex(s => s.vehicle_name === v.nickname && s.plan_date === selectedDay);
                                                            if (idx >= 0) copy[idx] = { ...copy[idx], informationen: newVal };
                                                            else copy.push({ id: 0, vehicle_name: v.nickname || '', plan_date: selectedDay, status: '', informationen: newVal, vehicle_id: v.vehicle_id, created_at: null, updated_at: null });
                                                            return copy;
                                                        });
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* 2. Projects (Middle) */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Aufträge ({dayPlans.length})</h3>
                                </div>
                                <div className="space-y-6">
                                    {dayPlans.map(plan => (
                                        <div key={plan.plan_id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                                            {/* LEFT: Project Info */}
                                            <div className="md:w-1/3 bg-slate-50 px-5 py-4 border-b md:border-b-0 md:border-r flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{plan.start_time?.substring(0, 5) || '07:00'}</span>
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide border border-slate-200 px-2 py-0.5 rounded">{plan.service_type || 'Service'}</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 text-xl leading-snug mb-1">{plan.project?.name || 'Unbekannt'}</h4>
                                                    <div className="text-sm text-slate-600 flex items-start gap-1.5 mb-4">
                                                        <span className="text-base mt-0.5">📍</span>
                                                        <span className="leading-tight">
                                                            {[plan.project?.strasse, plan.project?.nr].filter(Boolean).join(' ')}<br />
                                                            {plan.project?.plz} {plan.project?.ort}
                                                        </span>
                                                    </div>

                                                    {plan.vehicle_names && (
                                                        <div className="mb-4">
                                                            <div className="inline-block bg-orange-50 text-orange-800 border border-orange-100 rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm">
                                                                🚛 {plan.vehicle_names}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {plan.notes && (
                                                        <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 p-2.5 text-xs italic rounded-lg relative">
                                                            <span className="absolute top-1 right-2 text-yellow-400 font-serif text-xl">”</span>
                                                            {plan.notes}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200/60">
                                                    <button onClick={() => openEditPlan(plan)} className="flex-1 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-medium text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors">Bearbeiten</button>
                                                    <button onClick={(e) => handleDeletePlan(plan.plan_id, e)} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </div>

                                            {/* RIGHT: Staff Table (Inline) */}
                                            <div className="flex-1 p-0 flex flex-col">
                                                <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                        <Users className="h-3.5 w-3.5" /> Einsatz-Team
                                                    </h5>
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-slate-50 hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all w-48"
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    addStaffToPlan(plan.plan_id, e.target.value);
                                                                    e.target.value = ""; // Reset select
                                                                }
                                                            }}
                                                        >
                                                            <option value="">+ Mitarbeiter hinzufügen...</option>
                                                            {employees.map(emp => (
                                                                <option key={emp.employee_id} value={emp.employee_id}>
                                                                    {emp.name} ({emp.contract_type || '?'})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="flex-1 overflow-x-auto">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="text-slate-400 font-medium bg-slate-50/50 border-b border-slate-100">
                                                            <tr>
                                                                <th className="px-5 py-2 w-1/3">Name</th>
                                                                <th className="px-2 py-2 w-20">Start</th>
                                                                <th className="px-2 py-2">Info / Rolle</th>
                                                                <th className="px-2 py-2 w-10"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            <SortableContext
                                                                items={(plan.staff || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 1)).map(s => `staff-${s.id}`)}
                                                                strategy={verticalListSortingStrategy}
                                                            >
                                                                {(plan.staff || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(staff => (
                                                                    <SortableStaffRow
                                                                        key={staff.id}
                                                                        staff={staff}
                                                                        planStaff={plan.staff || []}
                                                                        onUpdate={updateStaffMember}
                                                                        onRemove={removeStaffFromPlan}
                                                                    />
                                                                ))}
                                                            </SortableContext>
                                                            {(plan.staff || []).length === 0 && (
                                                                <tr>
                                                                    <td colSpan={4} className="px-5 py-8 text-center text-slate-300 italic">
                                                                        Noch keine Mitarbeiter zugewiesen.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {dayPlans.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                            Noch keine Aufträge für diesen Tag.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* 3. Employee Notes (Bottom) */}
                            <section className="pb-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* INTERN */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Interne Mitarbeiter</h3>
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 border-b text-xs font-medium text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">Name</th>
                                                        <th className="px-4 py-2 text-left">Info</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {employees.filter(e => e.contract_type !== 'Freelance' && e.contract_type !== 'Extern').map(emp => {
                                                        const note = employeeNotes.find(n => n.employee_code === (emp.employee_code || emp.name));
                                                        return (
                                                            <tr key={emp.employee_id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2 font-medium text-slate-700">{emp.name}</td>
                                                                <td className="px-4 py-2">
                                                                    <input className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none py-1 text-slate-600"
                                                                        placeholder="—"
                                                                        defaultValue={note?.notizen || ''}
                                                                        onBlur={async (e) => {
                                                                            const val = e.target.value;
                                                                            if (val === (note?.notizen || '')) return;

                                                                            const code = emp.employee_code || emp.name;
                                                                            if (note) {
                                                                                await supabase.from('t_employee_daily_notes').update({ notizen: val }).eq('id', note.id);
                                                                            } else if (val) {
                                                                                await supabase.from('t_employee_daily_notes').insert({ employee_code: code, employee_id: emp.employee_id, plan_date: selectedDay, notizen: val, sort_order: 0 });
                                                                            }
                                                                            fetchDayPanels();
                                                                        }}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* EXTERN */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Externe Mitarbeiter</h3>
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 border-b text-xs font-medium text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">Name</th>
                                                        <th className="px-4 py-2 text-left">Info</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {employees.filter(e => e.contract_type === 'Freelance' || e.contract_type === 'Extern').map(emp => {
                                                        const note = employeeNotes.find(n => n.employee_code === (emp.employee_code || emp.name));
                                                        return (
                                                            <tr key={emp.employee_id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2 font-medium text-slate-700">{emp.name}</td>
                                                                <td className="px-4 py-2">
                                                                    <input className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none py-1 text-slate-600"
                                                                        placeholder="—"
                                                                        defaultValue={note?.notizen || ''}
                                                                        onBlur={async (e) => {
                                                                            const val = e.target.value;
                                                                            if (val === (note?.notizen || '')) return;

                                                                            const code = emp.employee_code || emp.name;
                                                                            if (note) {
                                                                                await supabase.from('t_employee_daily_notes').update({ notizen: val }).eq('id', note.id);
                                                                            } else if (val) {
                                                                                await supabase.from('t_employee_daily_notes').insert({ employee_code: code, employee_id: emp.employee_id, plan_date: selectedDay, notizen: val, sort_order: 0 });
                                                                            }
                                                                            fetchDayPanels();
                                                                        }}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
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




        </DndContext>
    );
}
