'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Save, Copy, Loader2, Trash2, Plus, X, Pencil, Briefcase, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

import { SearchableSelect } from '@/components/ui/searchable-select';

type Project = { project_id: string; name: string; project_code: string | null };
type Employee = { employee_id: string; name: string; employee_code: string | null };
type MorningPlan = { plan_id: string; project_id: string | null; project?: Project };
type TimePair = Database['public']['Tables']['t_time_pairs']['Row'];
type WorkAssignment = Database['public']['Tables']['t_work_assignments']['Row'];

// UI row for time tracking
interface TrackingRow {
    _tempId: string;
    pair_id: string | null;
    project_id: string | null;
    project_name: string;
    project_code: string;
    plan_id: string | null;
    mitarbeiter: string;
    employee_id: string | null;
    lis_von: string;
    lis_bis: string;
    kunde_von: string;
    kunde_bis: string;
    pause_min: number;
    notes: string;
    datum?: string; // Added for project view
    isNew: boolean;
}

const WORK_TYPES = ['Büroarbeit', 'Lager', 'Werkstatt', 'Reinigung', 'Fahrt', 'Schulung', 'Sonstiges'];

export default function TrackingPage() {
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [rows, setRows] = useState<TrackingRow[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Project View Mode
    const [viewMode, setViewMode] = useState<'day' | 'project'>('day');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    // Work assignments
    const [workAssignments, setWorkAssignments] = useState<WorkAssignment[]>([]);
    const [waModal, setWaModal] = useState<{ mode: 'create' | 'edit'; item?: WorkAssignment } | null>(null);
    const [waForm, setWaForm] = useState({ work_type: '', employee_name: '', employee_code: '', assignment_date: '', start_time: '', end_time: '', break_minutes: 0, hours_estimated: 0, status: 'Offen', notes: '' });
    const [savingWa, setSavingWa] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState<'timepairs' | 'workassignments'>('timepairs');

    const fetchEmployees = useCallback(async () => {
        const { data } = await supabase.from('t_employees').select('employee_id, name, employee_code').eq('is_active', true).order('name');
        setEmployees(data || []);
    }, []);

    const fetchProjects = useCallback(async () => {
        const { data } = await supabase.from('t_projects').select('project_id, name, project_code').order('created_at', { ascending: false });
        setProjects(data || []);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);

        if (viewMode === 'project' && selectedProjectId) {
            // Project View Fetch
            const { data: timePairs } = await supabase
                .from('t_time_pairs')
                .select('*')
                .eq('project_id', selectedProjectId)
                .order('datum', { ascending: false });

            // We also need project details to fill names (though we selected it, good to have)
            // And maybe plans if we want to link them, but simpler to just show what we have.
            // For now, let's just use the selected project name for all rows or look it up.
            const currentProject = projects.find(p => p.project_id === selectedProjectId);

            const trackingRows: TrackingRow[] = (timePairs || []).map(tp => ({
                _tempId: tp.pair_id,
                pair_id: tp.pair_id,
                project_id: tp.project_id,
                project_name: currentProject?.name || '',
                project_code: currentProject?.project_code || '',
                plan_id: tp.plan_id,
                mitarbeiter: tp.mitarbeiter,
                employee_id: null,
                lis_von: tp.lis_von?.substring(0, 5) || '',
                lis_bis: tp.lis_bis?.substring(0, 5) || '',
                kunde_von: tp.kunde_von?.substring(0, 5) || '',
                kunde_bis: tp.kunde_bis?.substring(0, 5) || '',
                pause_min: tp.pause_min || 0,
                notes: tp.notes || '', // added notes mapping
                datum: tp.datum, // Important for project view
                isNew: false,
            }));

            setRows(trackingRows);
            setLoading(false);
            return;
        }

        // Daily View Fetch (Existing Logic)
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        const [tpRes, planRes, waRes] = await Promise.all([
            supabase.from('t_time_pairs').select('*').eq('datum', dateStr).order('mitarbeiter'),
            supabase.from('t_morningplan').select('*, project:t_projects(project_id, name, project_code)').eq('plan_date', dateStr),
            supabase.from('t_work_assignments').select('*').eq('assignment_date', dateStr).order('employee_name'),
        ]);

        const plans = (planRes.data || []) as (MorningPlan & { project: Project })[];
        const timePairs = tpRes.data || [];

        const trackingRows: TrackingRow[] = timePairs.map(tp => {
            const plan = plans.find(p => p.plan_id === tp.plan_id) || plans.find(p => p.project_id === tp.project_id);
            return {
                _tempId: tp.pair_id || `tp-${Math.random()}`,
                pair_id: tp.pair_id,
                project_id: tp.project_id,
                project_name: plan?.project?.name || tp.project_id || '',
                project_code: plan?.project?.project_code || '',
                plan_id: tp.plan_id,
                mitarbeiter: tp.mitarbeiter,
                employee_id: null,
                lis_von: tp.lis_von?.substring(0, 5) || '',
                lis_bis: tp.lis_bis?.substring(0, 5) || '',
                kunde_von: tp.kunde_von?.substring(0, 5) || '',
                kunde_bis: tp.kunde_bis?.substring(0, 5) || '',
                pause_min: tp.pause_min || 0,
                notes: '',
                isNew: false,
            };
        });

        // -- AUTO MERGE PLAN --
        const { data: planStaff } = await supabase
            .from('t_morningplan_staff')
            .select('*, plan:t_morningplan!inner(*, project:t_projects(project_id, name, project_code)), employee:t_employees(employee_id, name)')
            .eq('plan.plan_date', dateStr);

        const existingKeys = new Set(trackingRows.map(r => `${r.project_id}-${r.mitarbeiter}`));
        const newPlanRows: TrackingRow[] = [];
        const staff = (planStaff as any[] || []).filter((s: any) => s.plan?.plan_date === dateStr);

        staff.forEach((s: any) => {
            const key = `${s.plan?.project_id}-${s.employee?.name}`;
            if (!existingKeys.has(key) && s.employee?.name) {
                newPlanRows.push({
                    _tempId: `new-${Math.random()}`,
                    pair_id: null,
                    project_id: s.plan?.project_id,
                    project_name: s.plan?.project?.name || '',
                    project_code: s.plan?.project?.project_code || '',
                    plan_id: s.plan?.plan_id,
                    mitarbeiter: s.employee.name,
                    employee_id: s.employee.employee_id,
                    lis_von: s.individual_start_time?.substring(0, 5) || s.plan?.start_time?.substring(0, 5) || '07:00',
                    lis_bis: '', kunde_von: '', kunde_bis: '', pause_min: 0, notes: '',
                    isNew: true,
                });
            }
        });

        setRows([...trackingRows, ...newPlanRows]);
        setWorkAssignments(waRes.data || []);
        setLoading(false);
    }, [currentDate, viewMode, selectedProjectId, projects]); // Added dependencies

    useEffect(() => { fetchEmployees(); fetchProjects(); }, [fetchEmployees, fetchProjects]);
    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchData(); }, [fetchData]);



    const calculateHours = (von: string, bis: string, pauseMin: number = 0): string => {
        if (!von || !bis) return '—';
        const [vh, vm] = von.split(':').map(Number);
        const [bh, bm] = bis.split(':').map(Number);
        const totalMin = (bh * 60 + bm) - (vh * 60 + vm) - pauseMin;
        if (totalMin <= 0) return '—';
        return (totalMin / 60).toFixed(2);
    };

    const updateRow = (tempId: string, field: keyof TrackingRow, value: any) => {
        setRows(prev => prev.map(r => r._tempId === tempId ? { ...r, [field]: value } : r));
    };

    const handleSave = async () => {
        setSaving(true);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        try {
            await Promise.all(rows.map(row => {
                const record: any = {
                    pair_id: row.pair_id || `${row.project_id}-${row.employee_id}-${dateStr}-${Date.now()}-${Math.random()}`,
                    project_id: row.project_id,
                    plan_id: row.plan_id,
                    datum: dateStr,
                    mitarbeiter: row.mitarbeiter,
                    lis_von: row.lis_von ? `${row.lis_von}:00` : null,
                    lis_bis: row.lis_bis ? `${row.lis_bis}:00` : null,
                    kunde_von: row.kunde_von ? `${row.kunde_von}:00` : null,
                    kunde_bis: row.kunde_bis ? `${row.kunde_bis}:00` : null,
                    kunde_bis: row.kunde_bis ? `${row.kunde_bis}:00` : null,
                    pause_min: row.pause_min,
                    updated_at: new Date().toISOString(),
                };
                return supabase.from('t_time_pairs').upsert(record, { onConflict: 'pair_id' });
            }));
            toast('Zeiten gespeichert');
            fetchData();
        } catch { toast('Fehler beim Speichern', 'error'); }
        setSaving(false);
    };

    const handleDelete = async (row: TrackingRow) => {
        if (row.isNew) { setRows(prev => prev.filter(r => r._tempId !== row._tempId)); return; }
        if (confirm('Zeiteintrag löschen?') && row.pair_id) {
            setRows(prev => prev.filter(r => r._tempId !== row._tempId));
            const { error } = await supabase.from('t_time_pairs').delete().eq('pair_id', row.pair_id);
            if (error) { toast('Fehler beim Löschen', 'error'); fetchData(); }
        }
    };

    // ---- WORK ASSIGNMENTS CRUD ----
    const openCreateWa = () => {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        setWaForm({ work_type: 'Büroarbeit', employee_name: '', employee_code: '', assignment_date: dateStr, start_time: '08:00', end_time: '16:00', break_minutes: 30, hours_estimated: 0, status: 'Offen', notes: '' });
        setWaModal({ mode: 'create' });
    };

    const openEditWa = (item: WorkAssignment) => {
        setWaForm({
            work_type: item.work_type || '',
            employee_name: item.employee_name || '',
            employee_code: item.employee_code || '',
            assignment_date: item.assignment_date || format(currentDate, 'yyyy-MM-dd'),
            start_time: item.start_time?.substring(0, 5) || '08:00',
            end_time: item.end_time?.substring(0, 5) || '16:00',
            break_minutes: item.break_minutes || 0,
            hours_estimated: item.hours_estimated || 0,
            status: item.status || 'Offen',
            notes: item.notes || '',
        });
        setWaModal({ mode: 'edit', item });
    };

    const saveWa = async () => {
        if (!waForm.employee_name || !waForm.work_type) return;
        setSavingWa(true);
        try {
            const payload = {
                work_type: waForm.work_type,
                employee_name: waForm.employee_name,
                employee_code: waForm.employee_code || null,
                assignment_date: waForm.assignment_date,
                start_time: waForm.start_time ? `${waForm.start_time}:00` : null,
                end_time: waForm.end_time ? `${waForm.end_time}:00` : null,
                break_minutes: waForm.break_minutes,
                hours_estimated: waForm.hours_estimated,
                status: waForm.status,
                notes: waForm.notes || null,
            };

            if (waModal?.mode === 'create') {
                const { error } = await supabase.from('t_work_assignments').insert(payload);
                if (error) throw error;
                toast('Arbeitseinsatz erstellt');
            } else if (waModal?.item) {
                const { error } = await supabase.from('t_work_assignments').update(payload).eq('assignment_id', waModal.item.assignment_id);
                if (error) throw error;
                toast('Arbeitseinsatz aktualisiert');
            }
            setWaModal(null);
            fetchData();
        } catch { toast('Fehler beim Speichern', 'error'); }
        setSavingWa(false);
    };

    const deleteWa = async (id: string) => {
        if (!confirm('Arbeitseinsatz löschen?')) return;
        setWorkAssignments(prev => prev.filter(w => w.assignment_id !== id));
        const { error } = await supabase.from('t_work_assignments').delete().eq('assignment_id', id);
        if (error) { toast('Fehler beim Löschen', 'error'); fetchData(); }
    };

    const calcWaHours = (st: string | null, et: string | null, brk: number | null) => {
        if (!st || !et) return '—';
        const [sh, sm] = st.split(':').map(Number);
        const [eh, em] = et.split(':').map(Number);
        const mins = (eh * 60 + em) - (sh * 60 + sm) - (brk || 0);
        return mins > 0 ? (mins / 60).toFixed(1) : '—';
    };

    return (
        <div className="flex h-full flex-col bg-slate-50">
            <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-800">Rückerfassung</h1>
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setViewMode('day')}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                viewMode === 'day' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Tagesansicht
                        </button>
                        <button
                            onClick={() => setViewMode('project')}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                viewMode === 'project' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Projektansicht
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {viewMode === 'day' ? (
                        <div className="flex items-center gap-2 rounded-md border bg-white px-2 py-1">
                            <button onClick={() => setCurrentDate(addDays(currentDate, -1))} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"><ChevronLeft className="h-5 w-5" /></button>
                            <div className="relative group min-w-[140px] text-center">
                                <div className="flex items-center justify-center gap-2 font-medium text-slate-700 group-hover:text-blue-600 transition-colors cursor-pointer">
                                    <Calendar className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                                    <span>{format(currentDate, 'EEEE, d. MMM', { locale: de })}</span>
                                </div>
                                <input
                                    type="date"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    value={format(currentDate, 'yyyy-MM-dd')}
                                    onChange={(e) => e.target.value && setCurrentDate(new Date(e.target.value))}
                                />
                            </div>
                            <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"><ChevronRight className="h-5 w-5" /></button>
                        </div>
                    ) : (
                        <div className="w-72">
                            <SearchableSelect
                                options={projects.map(p => ({ value: p.project_id, label: p.name || 'Unbenannt' }))}
                                value={selectedProjectId}
                                onChange={setSelectedProjectId}
                                placeholder="Projekt auswählen..."
                            />
                        </div>
                    )}
                </div>
            </header>

            {/* Tab bar */}
            <div className="border-b bg-white px-6 flex items-center gap-4">
                {viewMode === 'day' && (
                    <div className="flex items-center gap-1 p-1">
                        <button onClick={() => setActiveTab('timepairs')}
                            className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                                activeTab === 'timepairs' ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-700")}>
                            <Clock className="h-4 w-4" /> Zeitpaare ({rows.length})
                        </button>
                        <button onClick={() => setActiveTab('workassignments')}
                            className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                                activeTab === 'workassignments' ? "bg-orange-50 text-orange-700" : "text-slate-500 hover:text-slate-700")}>
                            <Briefcase className="h-4 w-4" /> Arbeitseinsätze ({workAssignments.length})
                        </button>
                    </div>
                )}
                {viewMode === 'project' && (
                    <div className="py-3 text-sm font-medium text-slate-500">
                        {rows.length} Zeiteinträge gefunden
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2">
                    {activeTab === 'timepairs' && (
                        <>

                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm disabled:opacity-50">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Speichern
                            </button>
                        </>
                    )}
                    {activeTab === 'workassignments' && viewMode === 'day' && (
                        <button onClick={openCreateWa}
                            className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 shadow-sm">
                            <Plus className="h-4 w-4" /> Neuer Einsatz
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6 flex-1 overflow-auto">
                {activeTab === 'timepairs' ? (
                    /* ===== TIME PAIRS TABLE (GROUPED) ===== */
                    <div className="space-y-8">
                        {loading ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Laden...
                            </div>
                        ) : rows.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                                <p>Keine Einträge gefunden.</p>
                            </div>
                        ) : (
                            Object.entries(rows.reduce((acc, row) => {
                                const key = row.project_id || 'unassigned';
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(row);
                                return acc;
                            }, {} as Record<string, TrackingRow[]>)).map(([projectId, projectRows]) => {
                                const projectTitle = projectId === 'unassigned' ? 'Ohne Projekt' : (projectRows[0]?.project_name || 'Unbenannt');
                                const projectCode = projectId === 'unassigned' ? '' : (projectRows[0]?.project_code || '');

                                return (
                                    <div key={projectId} className="overflow-hidden">
                                        {viewMode === 'day' && (
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <h3 className="text-lg font-bold text-slate-800">{projectTitle}</h3>
                                                {projectCode && <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{projectCode}</span>}
                                            </div>
                                        )}
                                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                                                    <tr>
                                                        <th className="px-4 py-3 w-[200px] hidden">Projekt</th>
                                                        {viewMode === 'project' && <th className="px-4 py-3 w-[120px]">Datum</th>}
                                                        <th className="px-4 py-3 w-[160px]">Mitarbeiter</th>
                                                        <th className="px-3 py-3 w-[90px] text-center border-l border-blue-100 bg-blue-50/50 text-blue-700">LiS Von</th>
                                                        <th className="px-3 py-3 w-[90px] text-center bg-blue-50/50 text-blue-700">LiS Bis</th>
                                                        <th className="px-3 py-3 w-[70px] text-center bg-blue-50/50 text-blue-700">Σ LiS</th>
                                                        <th className="px-3 py-3 w-[90px] text-center border-l border-green-100 bg-green-50/50 text-green-700">Kd Von</th>
                                                        <th className="px-3 py-3 w-[90px] text-center bg-green-50/50 text-green-700">Kd Bis</th>
                                                        <th className="px-3 py-3 w-[70px] text-center bg-green-50/50 text-green-700">Σ Kd</th>
                                                        <th className="px-3 py-3 w-[60px] text-center">Pause</th>
                                                        <th className="px-3 py-3">Notizen</th>
                                                        <th className="w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {projectRows.map((row) => (
                                                        <tr key={row._tempId} className="hover:bg-slate-50 group">
                                                            <td className="px-4 py-3 hidden"></td>
                                                            {viewMode === 'project' && (
                                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                                    {row.datum ? format(new Date(row.datum), 'dd.MM.yyyy') : '—'}
                                                                </td>
                                                            )}
                                                            <td className="px-4 py-3">
                                                                <select className="w-full bg-transparent border-none focus:ring-0 text-slate-900 text-sm"
                                                                    value={row.employee_id || ''}
                                                                    onChange={(e) => {
                                                                        const emp = employees.find(em => em.employee_id === e.target.value);
                                                                        updateRow(row._tempId, 'employee_id', e.target.value);
                                                                        if (emp) updateRow(row._tempId, 'mitarbeiter', emp.name);
                                                                    }}>
                                                                    <option value="">{row.mitarbeiter || 'Wählen...'}</option>
                                                                    {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.name}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="px-2 py-2 border-l border-blue-100 bg-blue-50/20">
                                                                <input type="time" className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    value={row.lis_von} onChange={(e) => updateRow(row._tempId, 'lis_von', e.target.value)} />
                                                            </td>
                                                            <td className="px-2 py-2 bg-blue-50/20">
                                                                <input type="time" className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    value={row.lis_bis} onChange={(e) => updateRow(row._tempId, 'lis_bis', e.target.value)} />
                                                            </td>
                                                            <td className="px-2 py-2 text-center text-sm font-semibold text-blue-700 bg-blue-50/20">{calculateHours(row.lis_von, row.lis_bis, row.pause_min)}</td>
                                                            <td className="px-2 py-2 border-l border-green-100 bg-green-50/20">
                                                                <input type="time" className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                                                    value={row.kunde_von} onChange={(e) => updateRow(row._tempId, 'kunde_von', e.target.value)} />
                                                            </td>
                                                            <td className="px-2 py-2 bg-green-50/20">
                                                                <input type="time" className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                                                    value={row.kunde_bis} onChange={(e) => updateRow(row._tempId, 'kunde_bis', e.target.value)} />
                                                            </td>
                                                            <td className="px-2 py-2 text-center text-sm font-semibold text-green-700 bg-green-50/20">{calculateHours(row.kunde_von, row.kunde_bis)}</td>
                                                            <td className="px-2 py-2">
                                                                <input type="number" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-1.5 py-1 text-center text-sm"
                                                                    value={row.pause_min} onChange={(e) => updateRow(row._tempId, 'pause_min', parseInt(e.target.value) || 0)} />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <input type="text" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm"
                                                                    value={row.notes} onChange={(e) => updateRow(row._tempId, 'notes', e.target.value)} placeholder="Notiz..." />
                                                            </td>
                                                            <td className="px-2 text-center">
                                                                <button onClick={() => handleDelete(row)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* ===== WORK ASSIGNMENTS TABLE ===== */
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                                <tr >
                                    <th className="px-4 py-3">Typ</th>
                                    <th className="px-4 py-3">Mitarbeiter</th>
                                    <th className="px-4 py-3 text-center">Start</th>
                                    <th className="px-4 py-3 text-center">Ende</th>
                                    <th className="px-4 py-3 text-center">Pause (min)</th>
                                    <th className="px-4 py-3 text-center">Stunden</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Notizen</th>
                                    <th className="w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {workAssignments.length === 0 ? (
                                    <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                                        <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                        <p>Keine Arbeitseinsätze für diesen Tag.</p>
                                        <button onClick={openCreateWa} className="text-orange-600 hover:underline mt-2">Neuen Einsatz anlegen</button>
                                    </td></tr>
                                ) : workAssignments.map(wa => (
                                    <tr key={wa.assignment_id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-3"><span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{wa.work_type}</span></td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{wa.employee_name}</td>
                                        <td className="px-4 py-3 text-center font-mono">{wa.start_time?.substring(0, 5) || '—'}</td>
                                        <td className="px-4 py-3 text-center font-mono">{wa.end_time?.substring(0, 5) || '—'}</td>
                                        <td className="px-4 py-3 text-center">{wa.break_minutes || 0}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-slate-700">{calcWaHours(wa.start_time, wa.end_time, wa.break_minutes)}</td>
                                        <td className="px-4 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-full", wa.status === 'Erledigt' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>{wa.status || 'Offen'}</span></td>
                                        <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]">{wa.notes || '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditWa(wa)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                                                <button onClick={() => deleteWa(wa.assignment_id)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ======= WORK ASSIGNMENT MODAL ======= */}
            {waModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setWaModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-lg font-bold text-slate-800">{waModal.mode === 'create' ? 'Neuer Arbeitseinsatz' : 'Arbeitseinsatz bearbeiten'}</h2>
                            <button onClick={() => setWaModal(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Arbeitstyp *</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={waForm.work_type}
                                        onChange={e => setWaForm({ ...waForm, work_type: e.target.value })}>
                                        {WORK_TYPES.map(wt => <option key={wt} value={wt}>{wt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Mitarbeiter *</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={waForm.employee_name}
                                        onChange={e => {
                                            const emp = employees.find(em => em.name === e.target.value);
                                            setWaForm({ ...waForm, employee_name: e.target.value, employee_code: emp?.employee_code || '' });
                                        }}>
                                        <option value="">Wählen...</option>
                                        {employees.map(emp => <option key={emp.employee_id} value={emp.name}>{emp.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Start</label>
                                    <input type="time" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={waForm.start_time}
                                        onChange={e => setWaForm({ ...waForm, start_time: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Ende</label>
                                    <input type="time" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={waForm.end_time}
                                        onChange={e => setWaForm({ ...waForm, end_time: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Pause (min)</label>
                                    <input type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={waForm.break_minutes}
                                        onChange={e => setWaForm({ ...waForm, break_minutes: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Geschätzte Stunden</label>
                                    <input type="number" step="0.5" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={waForm.hours_estimated}
                                        onChange={e => setWaForm({ ...waForm, hours_estimated: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={waForm.status}
                                        onChange={e => setWaForm({ ...waForm, status: e.target.value })}>
                                        <option value="Offen">Offen</option>
                                        <option value="In Bearbeitung">In Bearbeitung</option>
                                        <option value="Erledigt">Erledigt</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Notizen</label>
                                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none" rows={2}
                                    value={waForm.notes} onChange={e => setWaForm({ ...waForm, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t px-6 py-4">
                            <button onClick={() => setWaModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-300 hover:bg-slate-50">Abbrechen</button>
                            <button onClick={saveWa} disabled={savingWa || !waForm.employee_name}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 shadow-sm">
                                {savingWa ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
