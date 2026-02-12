'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Save, Copy, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Project = Database['public']['Tables']['t_projects']['Row'];
type Employee = Database['public']['Tables']['t_employees']['Row'];
type MorningPlan = Database['public']['Tables']['t_morningplan']['Row'] & { project?: Project };
type TimePair = Database['public']['Tables']['t_time_pairs']['Row'];

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
    isNew: boolean;
}

export default function TrackingPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [rows, setRows] = useState<TrackingRow[]>([]);
    const [plans, setPlans] = useState<MorningPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchEmployees(); }, []);
    useEffect(() => { fetchData(); }, [currentDate]);

    const fetchEmployees = async () => {
        const { data } = await supabase.from('t_employees').select('*').eq('is_active', true).order('name');
        if (data) setEmployees(data);
    };

    const fetchData = async () => {
        setLoading(true);
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        // 1. Fetch plans for "Copy from Plan"
        const { data: plansData } = await supabase
            .from('t_morningplan')
            .select(`*, project:t_projects(*)`)
            .eq('plan_date', dateStr);
        if (plansData) setPlans(plansData as any);

        // 2. Fetch existing time pairs for this date
        const { data: timePairs } = await supabase
            .from('t_time_pairs')
            .select('*')
            .eq('datum', dateStr)
            .order('mitarbeiter');

        const trackingRows: TrackingRow[] = [];
        if (timePairs) {
            for (const tp of timePairs) {
                // Find the plan/project info
                const plan = (plansData as any)?.find((p: any) => p.plan_id === tp.plan_id);
                trackingRows.push({
                    _tempId: tp.pair_id,
                    pair_id: tp.pair_id,
                    project_id: tp.project_id,
                    project_name: plan?.project?.name || tp.mitarbeiter || 'Unbekannt',
                    project_code: plan?.project?.project_code || '',
                    plan_id: tp.plan_id,
                    mitarbeiter: tp.mitarbeiter,
                    employee_id: tp.employee_id,
                    lis_von: tp.lis_von?.substring(0, 5) || '',
                    lis_bis: tp.lis_bis?.substring(0, 5) || '',
                    kunde_von: tp.kunde_von?.substring(0, 5) || '',
                    kunde_bis: tp.kunde_bis?.substring(0, 5) || '',
                    pause_min: tp.pause_min || 0,
                    notes: tp.notes || '',
                    isNew: false,
                });
            }
        }
        setRows(trackingRows);
        setLoading(false);
    };

    const handleCopyFromPlan = async () => {
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        // For each plan, fetch its staff and create time pair rows
        for (const plan of plans) {
            const { data: staff } = await supabase
                .from('t_morningplan_staff')
                .select('*, employee:t_employees(*)')
                .eq('plan_id', plan.plan_id);

            if (staff) {
                const newRows: TrackingRow[] = staff.map((s: any) => ({
                    _tempId: `temp-${Date.now()}-${s.id}`,
                    pair_id: null,
                    project_id: plan.project_id,
                    project_name: (plan as any).project?.name || 'Unbekannt',
                    project_code: (plan as any).project?.project_code || '',
                    plan_id: plan.plan_id,
                    mitarbeiter: s.employee?.name || '',
                    employee_id: s.employee_id,
                    lis_von: s.individual_start_time?.substring(0, 5) || plan.start_time?.substring(0, 5) || '07:00',
                    lis_bis: '',
                    kunde_von: '',
                    kunde_bis: '',
                    pause_min: 30,
                    notes: '',
                    isNew: true,
                }));
                setRows(prev => [...prev, ...newRows]);
            }
        }
    };

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
            for (const row of rows) {
                const record: any = {
                    pair_id: row.pair_id || `${row.project_id}-${row.employee_id}-${dateStr}-${Date.now()}`,
                    project_id: row.project_id,
                    datum: dateStr,
                    mitarbeiter: row.mitarbeiter,
                    employee_id: row.employee_id,
                    plan_id: row.plan_id,
                    lis_von: row.lis_von || null,
                    lis_bis: row.lis_bis || null,
                    kunde_von: row.kunde_von || null,
                    kunde_bis: row.kunde_bis || null,
                    pause_min: row.pause_min || 0,
                    notes: row.notes || null,
                    updated_at: new Date().toISOString(),
                };

                if (row.isNew) {
                    await supabase.from('t_time_pairs').insert(record);
                } else {
                    await supabase.from('t_time_pairs').update(record).eq('pair_id', row.pair_id);
                }
            }
            fetchData();
        } catch (error) {
            console.error("Error saving:", error);
            alert("Fehler beim Speichern!");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (row: TrackingRow) => {
        if (row.isNew) {
            setRows(prev => prev.filter(r => r._tempId !== row._tempId));
            return;
        }
        if (confirm('Eintrag wirklich löschen?')) {
            await supabase.from('t_time_pairs').delete().eq('pair_id', row.pair_id);
            fetchData();
        }
    };

    return (
        <div className="flex h-full flex-col bg-slate-50">
            <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-800">Rückerfassung</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-md border bg-white px-2 py-1">
                        <button onClick={() => setCurrentDate(addDays(currentDate, -1))} className="p-1 hover:bg-slate-100 rounded">
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <span className="min-w-[140px] text-center font-medium text-slate-700">
                            {format(currentDate, 'EEEE, d. MMM', { locale: de })}
                        </span>
                        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-1 hover:bg-slate-100 rounded">
                            <ChevronRight className="h-5 w-5 text-slate-600" />
                        </button>
                    </div>
                    <button onClick={handleCopyFromPlan}
                        className="flex items-center gap-2 rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                        <Copy className="h-4 w-4" /> Aus Planung übernehmen
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Speichern
                    </button>
                </div>
            </header>
            <div className="p-6 flex-1 overflow-auto">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3 w-[200px]">Projekt</th>
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
                            {loading ? (
                                <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Laden...
                                </td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                                    <p>Keine Einträge für diesen Tag.</p>
                                    <button onClick={handleCopyFromPlan} className="text-blue-600 hover:underline mt-2">Aus Planung übernehmen</button>
                                </td></tr>
                            ) : rows.map((row) => (
                                <tr key={row._tempId} className="hover:bg-slate-50 group">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900 truncate">{row.project_name}</div>
                                        <div className="text-xs text-slate-500">{row.project_code}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <select className="w-full bg-transparent border-none focus:ring-0 text-slate-900 text-sm"
                                            value={row.employee_id || ''}
                                            onChange={(e) => {
                                                const emp = employees.find(em => em.employee_id === e.target.value);
                                                updateRow(row._tempId, 'employee_id', e.target.value);
                                                if (emp) updateRow(row._tempId, 'mitarbeiter', emp.name);
                                            }}>
                                            <option value="">Wählen...</option>
                                            {employees.map(emp => (
                                                <option key={emp.employee_id} value={emp.employee_id}>{emp.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    {/* LiS times */}
                                    <td className="px-2 py-2 border-l border-blue-100 bg-blue-50/20">
                                        <input type="time" className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={row.lis_von} onChange={(e) => updateRow(row._tempId, 'lis_von', e.target.value)} />
                                    </td>
                                    <td className="px-2 py-2 bg-blue-50/20">
                                        <input type="time" className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={row.lis_bis} onChange={(e) => updateRow(row._tempId, 'lis_bis', e.target.value)} />
                                    </td>
                                    <td className="px-2 py-2 text-center text-sm font-semibold text-blue-700 bg-blue-50/20">
                                        {calculateHours(row.lis_von, row.lis_bis, row.pause_min)}
                                    </td>
                                    {/* Kunde times */}
                                    <td className="px-2 py-2 border-l border-green-100 bg-green-50/20">
                                        <input type="time" className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                            value={row.kunde_von} onChange={(e) => updateRow(row._tempId, 'kunde_von', e.target.value)} />
                                    </td>
                                    <td className="px-2 py-2 bg-green-50/20">
                                        <input type="time" className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                            value={row.kunde_bis} onChange={(e) => updateRow(row._tempId, 'kunde_bis', e.target.value)} />
                                    </td>
                                    <td className="px-2 py-2 text-center text-sm font-semibold text-green-700 bg-green-50/20">
                                        {calculateHours(row.kunde_von, row.kunde_bis)}
                                    </td>
                                    {/* Pause */}
                                    <td className="px-2 py-2">
                                        <input type="number" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={row.pause_min} onChange={(e) => updateRow(row._tempId, 'pause_min', parseInt(e.target.value) || 0)} />
                                    </td>
                                    <td className="px-2 py-2">
                                        <input type="text" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={row.notes} onChange={(e) => updateRow(row._tempId, 'notes', e.target.value)} placeholder="Notiz..." />
                                    </td>
                                    <td className="px-2 text-center">
                                        <button onClick={() => handleDelete(row)}
                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
