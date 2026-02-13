'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus,
    X, Save, Loader2, ArrowLeft, FolderOpen, List, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
    DndContext, DragOverlay,
    DragEndEvent, DragStartEvent, closestCorners
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// Types
import { Project, Employee, Vehicle, MorningPlan, StaffRowType, VehicleDailyStatus, EmployeeDailyNote, PlanTemplate } from './components/types';

// Components
import { DraggableProject } from './components/DraggableProject';
import { DroppableDay } from './components/DroppableDay';
import { ProjectCard } from './components/ProjectCard';
import { VehicleList } from './components/VehicleList';
import { EmployeeNotes } from './components/EmployeeNotes';
import { TimelineView } from './components/TimelineView';
import { PlanningExport } from './components/PlanningExport';

const SERVICE_TYPES = ['Umzug', 'Entrümpelung', 'Transport', 'Einlagerung', 'Malerarbeiten', 'Kartonlieferung', 'Sonstiges'];

export function PlanningClient() {
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState<'week' | 'day' | 'timeline'>('week');
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
    const [isCompact, setIsCompact] = useState(false);

    // Plan modal
    const [planModal, setPlanModal] = useState<{ mode: 'create' | 'edit'; plan?: MorningPlan; date: string } | null>(null);
    const [planForm, setPlanForm] = useState({ project_id: '', start_time: '07:00', vehicle_id: '', vehicle_names: '', service_type: '', notes: '' });
    const [savingPlan, setSavingPlan] = useState(false);

    // Templates
    const [templates, setTemplates] = useState<PlanTemplate[]>([]);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

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
            supabase.from('t_morningplan')
                .select('*, project:t_projects(*), staff:t_morningplan_staff(*, employee:t_employees(*))')
                .gte('plan_date', startDateStr)
                .lte('plan_date', endDateStr),
            supabase.from('t_employees').select('*').eq('is_active', true).order('name'),
            supabase.from('t_vehicles').select('*').eq('is_deleted', false).order('nickname'),
        ]);

        setProjects(projRes.data || []);
        setEmployees(empRes.data || []);
        setVehicles(vehRes.data || []);

        const plansRaw = (planRes.data || []) as MorningPlan[];
        // No manual staff mapping needed anymore as it is fetched nested
        setPlans(plansRaw);
        setLoading(false);
    }, [weekStart, weekEnd]);

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

                await Promise.all(updates.map(u =>
                    supabase.from('t_morningplan_staff').update({ sort_order: u.sort_order }).eq('id', u.id)
                ));
                toast('Reihenfolge gespeichert');
            } catch {
                toast('Fehler beim Sortieren', 'error');
                fetchData(); // Rollback
            }
        }

        // 3. PROJECT CARD REORDERING (within Day View)
        if (active.id.toString().startsWith('plan-') && over.id.toString().startsWith('plan-')) {
            const activeId = active.id.toString().replace('plan-', '');
            const overId = over.id.toString().replace('plan-', '');

            if (activeId === overId) return;

            const dayPlansFiltered = plans.filter(p => p.plan_date === selectedDay);
            const oldIndex = dayPlansFiltered.findIndex(p => p.plan_id === activeId);
            const newIndex = dayPlansFiltered.findIndex(p => p.plan_id === overId);

            const newDayPlans = [...dayPlansFiltered];
            const [movedItem] = newDayPlans.splice(oldIndex, 1);
            newDayPlans.splice(newIndex, 0, movedItem);

            setPlans(prev => {
                const otherPlans = prev.filter(p => p.plan_date !== selectedDay);
                const reordered = newDayPlans.map((p, idx) => ({ ...p, sort_order: idx + 1 }));
                return [...otherPlans, ...reordered];
            });

            try {
                await Promise.all(newDayPlans.map((p, idx) =>
                    supabase.from('t_morningplan').update({ sort_order: idx + 1 } as any).eq('plan_id', p.plan_id)
                ));
                toast('Reihenfolge der Einsätze gespeichert');
            } catch {
                toast('Fehler beim Sortieren', 'error');
                fetchData();
            }
        }

        // 4. PROJECT CARD TO DIFFERENT DAY (Move plan)
        if (active.id.toString().startsWith('plan-') && over.id.toString().startsWith('day-')) {
            const planId = active.id.toString().replace('plan-', '');
            const newDate = over.id.toString().replace('day-', '');
            const plan = plans.find(p => p.plan_id === planId);
            if (!plan || plan.plan_date === newDate) return;

            setPlans(prev => prev.map(p => p.plan_id === planId ? { ...p, plan_date: newDate } : p));

            try {
                const { error } = await supabase.from('t_morningplan').update({ plan_date: newDate }).eq('plan_id', planId);
                if (error) throw error;
                toast(`Verschoben auf ${format(new Date(newDate), 'dd.MM.')}`);
            } catch {
                toast('Fehler beim Verschieben', 'error');
                fetchData();
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

    const duplicatePlan = async (plan: MorningPlan) => {
        setSavingPlan(true);
        try {
            const { data: newPlan, error } = await supabase.from('t_morningplan').insert({
                plan_date: plan.plan_date,
                project_id: plan.project_id,
                start_time: plan.start_time,
                vehicle_id: plan.vehicle_id,
                vehicle_names: plan.vehicle_names,
                service_type: plan.service_type,
                notes: plan.notes,
                sort_order: (plan as any).sort_order ? (plan as any).sort_order + 1 : 1
            }).select().single();

            if (error) throw error;

            // Also duplicate staff
            if (plan.staff && plan.staff.length > 0) {
                const staffPayload = plan.staff.map(s => ({
                    plan_id: newPlan.plan_id,
                    employee_id: s.employee_id,
                    individual_start_time: s.individual_start_time,
                    member_notes: (s as any).member_notes,
                    sort_order: s.sort_order
                }));
                await supabase.from('t_morningplan_staff').insert(staffPayload);
            }

            toast('Einsatz dupliziert');
            fetchData();
        } catch { toast('Fehler beim Duplizieren', 'error'); }
        setSavingPlan(false);
    };

    const moveToTomorrow = async (plan: MorningPlan) => {
        const tomorrow = format(addDays(new Date(plan.plan_date), 1), 'yyyy-MM-dd');
        try {
            const { error } = await supabase.from('t_morningplan').update({ plan_date: tomorrow }).eq('plan_id', plan.plan_id);
            if (error) throw error;
            toast(`Auf morgen (${format(new Date(tomorrow), 'dd.MM.')}) verschoben`);
            fetchData();
        } catch { toast('Fehler beim Verschieben', 'error'); }
    };

    // ---- TEMPLATES ----
    const handleSaveTemplate = async () => {
        const name = window.prompt('Name für Vorlage eingeben:');
        if (!name) return;

        setLoading(true);
        try {
            // 1. Create Template
            const { data: template, error: tError } = await supabase.from('t_plan_templates').insert({ name }).select().single();
            if (tError) throw tError;

            // 2. Create Items
            const items = dayPlans.map(p => ({
                template_id: template.id,
                project_id: p.project_id,
                project_name: p.project?.name || 'Unbekanntes Projekt',
                start_time: p.start_time,
                vehicle_id: p.vehicle_id,
                service_type: p.service_type,
                notes: p.notes,
                sort_order: p.sort_order
            }));

            if (items.length > 0) {
                const { error: iError } = await supabase.from('t_plan_template_items').insert(items);
                if (iError) throw iError;
            }

            toast('Vorlage gespeichert', 'success');
        } catch (e: any) {
            console.error(e);
            toast('Fehler beim Speichern der Vorlage', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const { data, error } = await supabase.from('t_plan_templates').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setTemplates(data || []);
            setTemplateModalOpen(true);
        } catch {
            toast('Fehler beim Laden der Vorlagen', 'error');
        } finally {
            setLoadingTemplates(false);
        }
    };

    const applyTemplate = async (templateId: string) => {
        if (!window.confirm('Warnung: Dies fügt die Vorlage zum aktuellen Tag hinzu. Fortfahren?')) return;

        setLoading(true);
        setTemplateModalOpen(false);
        try {
            // 1. Get Items
            const { data: items, error: iError } = await supabase.from('t_plan_template_items').select('*').eq('template_id', templateId);
            if (iError) throw iError;

            if (!items || items.length === 0) {
                toast('Vorlage ist leer', 'info');
                return;
            }

            // 2. Create Plans
            const newPlans = items.map(item => ({
                plan_date: selectedDay,
                project_id: item.project_id,
                start_time: item.start_time,
                vehicle_id: item.vehicle_id,
                service_type: item.service_type,
                notes: item.notes,
                sort_order: item.sort_order
            }));

            const { error: pError } = await supabase.from('t_morningplan').insert(newPlans);
            if (pError) throw pError;

            toast('Vorlage angewendet', 'success');
            fetchData();
        } catch (e) {
            console.error(e);
            toast('Fehler beim Anwenden', 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteTemplate = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm('Vorlage wirklich löschen?')) return;
        try {
            const { error } = await supabase.from('t_plan_templates').delete().eq('id', id);
            if (error) throw error;
            setTemplates(templates.filter(t => t.id !== id));
            toast('Vorlage gelöscht');
        } catch {
            toast('Fehler beim Löschen', 'error');
        }
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
                individual_start_time: null
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
            fetchData();
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
    const dayPlans = plans
        .filter(p => p.plan_date === selectedDay)
        .sort((a, b) => {
            if ((a as any).sort_order !== (b as any).sort_order) {
                return ((a as any).sort_order || 0) - ((b as any).sort_order || 0);
            }
            return (a.start_time || '07:00').localeCompare(b.start_time || '07:00');
        });

    // Conflict Detection
    const conflicts = React.useMemo(() => {
        const empMap: Record<string, string[]> = {}; // employee_id -> [plan_ids]
        const vehMap: Record<string, string[]> = {}; // vehicle_id -> [plan_ids]

        dayPlans.forEach(p => {
            if (p.vehicle_id) {
                if (!vehMap[p.vehicle_id]) vehMap[p.vehicle_id] = [];
                vehMap[p.vehicle_id].push(p.plan_id);
            }
            p.staff?.forEach(s => {
                if (s.employee_id) {
                    if (!empMap[s.employee_id]) empMap[s.employee_id] = [];
                    empMap[s.employee_id].push(p.plan_id);
                }
            });
        });

        const conflictingEmps = new Set<string>();
        const conflictingVehs = new Set<string>();

        Object.entries(empMap).forEach(([id, pIds]) => { if (pIds.length > 1) conflictingEmps.add(id); });
        Object.entries(vehMap).forEach(([id, pIds]) => { if (pIds.length > 1) conflictingVehs.add(id); });

        return { employees: conflictingEmps, vehicles: conflictingVehs };
    }, [dayPlans]);

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
            <div className="flex h-full flex-col bg-slate-50">
                {/* Header */}
                <header className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm z-10 relative">
                    <div className="flex items-center gap-4">
                        {(viewMode === 'day' || viewMode === 'timeline') && (
                            <button onClick={() => setViewMode('week')} className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-slate-800">
                            {viewMode === 'week' ? 'Einsatzplanung' :
                                viewMode === 'day' ? `Tagesplan: ${format(new Date(selectedDay), 'd. MMMM yyyy', { locale: de })}` :
                                    `Timeline: ${format(new Date(selectedDay), 'd. MMMM yyyy', { locale: de })}`}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {viewMode !== 'week' && (
                            <div className="flex p-1 bg-slate-100 rounded-lg mr-4">
                                <button
                                    onClick={() => setViewMode('day')}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                        viewMode === 'day' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    Tagesansicht
                                </button>
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                        viewMode === 'timeline' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    Timeline
                                </button>
                            </div>
                        )}
                        {viewMode === 'week' && (
                            <div className="flex items-center gap-1 rounded-md border bg-white px-2 py-1">
                                <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="h-5 w-5 text-slate-600" /></button>
                                <span className="min-w-[160px] text-center font-medium text-sm text-slate-700">
                                    {format(weekStart, 'd. MMM', { locale: de })} – {format(weekEnd, 'd. MMM yyyy', { locale: de })}
                                </span>
                                <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="h-5 w-5 text-slate-600" /></button>
                            </div>
                        )}
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all shadow-sm border",
                                isCompact ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            {isCompact ? "Detail Ansicht" : "Kompakt Modus"}
                        </button>
                        <div className="flex items-center gap-1 rounded-lg border bg-white px-1 py-1 mr-2">
                            <button onClick={handleSaveTemplate} title="Als Vorlage speichern" className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600">
                                <Save className="h-4 w-4" />
                            </button>
                            <button onClick={loadTemplates} title="Vorlage laden" className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600">
                                <FolderOpen className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="mr-2">
                            <PlanningExport />
                        </div>
                        <button onClick={() => openCreatePlan(selectedDay)}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 shadow-sm">
                            <Plus className="h-3.5 w-3.5" /> Neuer Einsatz
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Projects (Visible in Week View only) */}
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
                    ) : viewMode === 'day' ? (
                        /* ============ DAY VIEW ============ */
                        <div className="flex-1 overflow-auto p-6 space-y-8 max-w-5xl mx-auto w-full">
                            {/* 1. Vehicles (Top) */}
                            <VehicleList
                                vehicles={vehicles}
                                vehicleStatuses={vehicleStatuses}
                                selectedDay={selectedDay}
                                saveVehicleStatus={saveVehicleStatus}
                                setVehicleStatuses={setVehicleStatuses}
                            />

                            {/* 2. Projects (Middle) */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Aufträge ({dayPlans.length})</h3>
                                </div>
                                <div className="space-y-6">
                                    <SortableContext
                                        items={dayPlans.map(p => `plan-${p.plan_id}`)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {dayPlans.map(plan => (
                                            <ProjectCard
                                                key={plan.plan_id}
                                                plan={plan}
                                                onEditPlan={openEditPlan}
                                                onDelete={handleDeletePlan}
                                                employees={employees}
                                                onAddStaff={addStaffToPlan}
                                                onUpdateStaff={updateStaffMember}
                                                onRemoveStaff={removeStaffFromPlan}
                                                compact={isCompact}
                                                conflicts={conflicts}
                                                onDuplicate={duplicatePlan}
                                                onMoveToTomorrow={moveToTomorrow}
                                            />
                                        ))}
                                    </SortableContext>
                                    {dayPlans.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                            Noch keine Aufträge für diesen Tag.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* 3. Employee Notes (Bottom) */}
                            <EmployeeNotes
                                employees={employees}
                                employeeNotes={employeeNotes}
                                selectedDay={selectedDay}
                                fetchDayPanels={fetchDayPanels}
                            />
                        </div>
                    ) : (
                        /* ============ TIMELINE VIEW ============ */
                        <div className="flex-1 overflow-auto p-6">
                            <TimelineView
                                plans={dayPlans}
                                selectedDay={selectedDay}
                                employees={employees}
                                vehicles={vehicles}
                            />
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

            {/* ======= TEMPLATE MODAL ======= */}
            {templateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setTemplateModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-lg font-bold text-slate-800">Vorlagen</h2>
                            <button onClick={() => setTemplateModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <div className="p-2 overflow-y-auto flex-1">
                            {loadingTemplates ? (
                                <div className="text-center py-8 text-slate-400"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Laden...</div>
                            ) : templates.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">Keine Vorlagen gefunden.</div>
                            ) : (
                                <div className="space-y-1">
                                    {templates.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group border border-transparent hover:border-slate-100">
                                            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => applyTemplate(t.id)}>
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><List className="h-4 w-4" /></div>
                                                <div>
                                                    <div className="font-medium text-slate-700">{t.name}</div>
                                                    <div className="text-xs text-slate-400">{format(new Date(t.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
                                                </div>
                                            </div>
                                            <button onClick={(e) => deleteTemplate(e, t.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </DndContext>
    );
}
