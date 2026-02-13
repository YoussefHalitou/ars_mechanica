'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import {
    Users, Truck, Package, Wrench, Plus, Pencil, Trash2, X, Save, Loader2, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Employee = Database['public']['Tables']['t_employees']['Row'];
type Vehicle = Database['public']['Tables']['t_vehicles']['Row'];
type Material = Database['public']['Tables']['t_materials']['Row'];
type Service = Database['public']['Tables']['t_services']['Row'];

const TABS = [
    { id: 'employees', label: 'Mitarbeiter', icon: Users },
    { id: 'vehicles', label: 'Fahrzeuge', icon: Truck },
    { id: 'materials', label: 'Material', icon: Package },
    { id: 'services', label: 'Leistungen', icon: Wrench },
] as const;

type TabId = typeof TABS[number]['id'];

export default function ResourcesPage() {
    const [activeTab, setActiveTab] = useState<TabId>('employees');

    return (
        <div className="flex h-full flex-col bg-slate-50">
            <header className="flex items-center gap-4 border-b bg-white px-6 py-4 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-800">Ressourcen</h1>
                <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 ml-4">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={cn('flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all',
                                    activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                                <Icon className="h-4 w-4" /> {tab.label}
                            </button>
                        );
                    })}
                </div>
            </header>
            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'employees' && <EmployeesTab />}
                {activeTab === 'vehicles' && <VehiclesTab />}
                {activeTab === 'materials' && <MaterialsTab />}
                {activeTab === 'services' && <ServicesTab />}
            </div>
        </div>
    );
}

// ============ EMPLOYEES TAB ============

function EmployeesTab() {
    const { toast } = useToast();
    const [items, setItems] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Partial<Employee> | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('t_employees').select('*').order('name');
        setItems(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const openNew = () => { setEditing({ name: '', is_active: true, hourly_rate: 0, contract_type: 'Vollzeit' }); setIsNew(true); };
    const openEdit = (e: Employee) => { setEditing({ ...e }); setIsNew(false); };

    const save = async () => {
        if (!editing?.name) return;
        setSaving(true);
        try {
            if (isNew) {
                const { error } = await supabase.from('t_employees').insert({
                    name: editing.name,
                    employee_code: editing.employee_code || null,
                    email: editing.email || null,
                    phone: editing.phone || null,
                    role: editing.role || null,
                    contract_type: editing.contract_type || null,
                    weekly_hours_contract: editing.weekly_hours_contract || null,
                    hourly_rate: editing.hourly_rate || null,
                    notes: editing.notes || null,
                    is_active: editing.is_active ?? true,
                });
                if (error) throw error;
                toast('Mitarbeiter erstellt');
            } else {
                const { employee_id, created_at, updated_at, ...upd } = editing as Employee;
                const { error } = await supabase.from('t_employees').update(upd).eq('employee_id', employee_id);
                if (error) throw error;
                toast('Mitarbeiter aktualisiert');
            }
            setEditing(null);
            fetch();
        } catch { toast('Fehler beim Speichern', 'error'); }
        setSaving(false);
    };

    const remove = async (id: string, e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!confirm('Mitarbeiter wirklich löschen?')) return;
        setItems(prev => prev.filter(e => e.employee_id !== id));
        const { error } = await supabase.from('t_employees').delete().eq('employee_id', id);
        if (error) { toast('Fehler beim Löschen', 'error'); fetch(); }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500">{items.length} Mitarbeiter</span>
                <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm">
                    <Plus className="h-4 w-4" /> Hinzufügen
                </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b text-xs font-medium text-slate-500 uppercase">
                        <tr><th className="px-4 py-3">Kürzel</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Rolle</th>
                            <th className="px-4 py-3">Vertrag</th><th className="px-4 py-3 text-right">Std./Woche</th>
                            <th className="px-4 py-3 text-right">Stundensatz</th><th className="px-4 py-3 text-center">Aktiv</th><th className="w-20"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map(e => (
                            <tr key={e.employee_id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => openEdit(e)}>
                                <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.employee_code || '—'}</td>
                                <td className="px-4 py-3 font-medium text-slate-900">{e.name}</td>
                                <td className="px-4 py-3 text-slate-600">{e.role || '—'}</td>
                                <td className="px-4 py-3"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{e.contract_type || '—'}</span></td>
                                <td className="px-4 py-3 text-right font-mono">{e.weekly_hours_contract ?? '—'}</td>
                                <td className="px-4 py-3 text-right font-mono">{e.hourly_rate ? `${e.hourly_rate.toFixed(2)} €` : '—'}</td>
                                <td className="px-4 py-3 text-center">{e.is_active ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-slate-300 mx-auto" />}</td>
                                <td className="px-4 py-3" onClick={ev => ev.stopPropagation()}>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                                        <button onClick={(ev) => remove(e.employee_id, ev)} type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editing && (
                <Modal title={isNew ? 'Neuer Mitarbeiter' : 'Bearbeiten'} onClose={() => setEditing(null)} onSave={save} saving={saving}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Kürzel" value={editing.employee_code || ''} onChange={v => setEditing({ ...editing, employee_code: v })} />
                        <Field label="Name *" value={editing.name || ''} onChange={v => setEditing({ ...editing, name: v })} />
                        <Field label="Rolle" value={editing.role || ''} onChange={v => setEditing({ ...editing, role: v })} />
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">Vertrag</label>
                            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={editing.contract_type || ''} onChange={e => setEditing({ ...editing, contract_type: e.target.value })}>
                                <option value="">—</option><option value="Vollzeit">Vollzeit</option><option value="Teilzeit">Teilzeit</option><option value="Minijob">Minijob</option><option value="Freelance">Freelance</option>
                            </select>
                        </div>
                        <Field label="Std./Woche" type="number" value={String(editing.weekly_hours_contract || '')} onChange={v => setEditing({ ...editing, weekly_hours_contract: +v })} />
                        <Field label="Stundensatz (€)" type="number" value={String(editing.hourly_rate || '')} onChange={v => setEditing({ ...editing, hourly_rate: +v })} />
                        <Field label="Telefon" value={editing.phone || ''} onChange={v => setEditing({ ...editing, phone: v })} />
                        <Field label="E-Mail" value={editing.email || ''} onChange={v => setEditing({ ...editing, email: v })} />
                    </div>
                    <div className="mt-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active ?? true} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} className="rounded" /> Aktiv</label></div>
                    <Field label="Notizen" value={editing.notes || ''} onChange={v => setEditing({ ...editing, notes: v })} textarea />
                </Modal>
            )}
        </>
    );
}

// ============ VEHICLES TAB ============

function VehiclesTab() {
    const { toast } = useToast();
    const [items, setItems] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Partial<Vehicle> | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('t_vehicles').select('*').eq('is_deleted', false).order('nickname');
        setItems(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const openNew = () => { setEditing({ nickname: '', vehicle_id: `v-${Date.now()}`, is_deleted: false }); setIsNew(true); };
    const openEdit = (v: Vehicle) => { setEditing({ ...v }); setIsNew(false); };

    const save = async () => {
        if (!editing?.nickname) return;
        setSaving(true);
        try {
            if (isNew) {
                const { error } = await supabase.from('t_vehicles').insert({
                    vehicle_id: editing.vehicle_id || `v-${Date.now()}`,
                    nickname: editing.nickname,
                    unit: editing.unit || null,
                    status: editing.status || null,
                    inhalt: editing.inhalt || null,
                    notes: editing.notes || null,
                    is_deleted: false,
                });
                if (error) throw error;
                toast('Fahrzeug erstellt');
            } else {
                const { created_at, updated_at, ...upd } = editing as Vehicle;
                const { error } = await supabase.from('t_vehicles').update(upd).eq('vehicle_id', editing.vehicle_id);
                if (error) throw error;
                toast('Fahrzeug aktualisiert');
            }
            setEditing(null);
            fetch();
        } catch { toast('Fehler beim Speichern', 'error'); }
        setSaving(false);
    };

    const remove = async (id: string, e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!confirm('Fahrzeug wirklich löschen?')) return;
        setItems(prev => prev.filter(v => v.vehicle_id !== id));
        const { error } = await supabase.from('t_vehicles').update({ is_deleted: true }).eq('vehicle_id', id);
        if (error) { toast('Fehler beim Löschen', 'error'); fetch(); }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500">{items.length} Fahrzeuge</span>
                <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm">
                    <Plus className="h-4 w-4" /> Hinzufügen
                </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b text-xs font-medium text-slate-500 uppercase">
                        <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Spitzname</th><th className="px-4 py-3">Einheit</th>
                            <th className="px-4 py-3">Status</th><th className="px-4 py-3">Inhalt</th><th className="w-20"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map(v => (
                            <tr key={v.vehicle_id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => openEdit(v)}>
                                <td className="px-4 py-3 font-mono text-xs text-slate-500">{v.vehicle_id}</td>
                                <td className="px-4 py-3 font-medium text-slate-900">{v.nickname}</td>
                                <td className="px-4 py-3 text-slate-600">{v.unit || '—'}</td>
                                <td className="px-4 py-3"><span className={cn('text-xs px-2 py-0.5 rounded-full', v.status === 'Aktiv' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600')}>{v.status || '—'}</span></td>
                                <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]">{v.inhalt || '—'}</td>
                                <td className="px-4 py-3" onClick={ev => ev.stopPropagation()}>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                                        <button onClick={(e) => remove(v.vehicle_id, e)} type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editing && (
                <Modal title={isNew ? 'Neues Fahrzeug' : 'Bearbeiten'} onClose={() => setEditing(null)} onSave={save} saving={saving}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Spitzname *" value={editing.nickname || ''} onChange={v => setEditing({ ...editing, nickname: v })} />
                        <Field label="Einheit" value={editing.unit || ''} onChange={v => setEditing({ ...editing, unit: v })} placeholder="z.B. km, Std" />
                        <Field label="Status" value={editing.status || ''} onChange={v => setEditing({ ...editing, status: v })} />
                        <Field label="Inhalt" value={editing.inhalt || ''} onChange={v => setEditing({ ...editing, inhalt: v })} />
                    </div>
                    <Field label="Notizen" value={editing.notes || ''} onChange={v => setEditing({ ...editing, notes: v })} textarea />
                </Modal>
            )}
        </>
    );
}

function MaterialsTab() {
    const { toast } = useToast();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('t_materials').select('*, prices:t_material_prices(cost_per_unit, price_per_unit)').eq('is_active', true).order('name');
        setItems((data as any) || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const openNew = () => {
        setEditing({ material_id: '', name: '', unit: 'Stk', category: '', vat_rate: 19, cost_per_unit: 0, price_per_unit: 0 });
        setIsNew(true);
    };
    const openEdit = (m: any) => {
        const p = Array.isArray(m.prices) ? m.prices[0] : m.prices;
        setEditing({ ...m, cost_per_unit: p?.cost_per_unit || 0, price_per_unit: p?.price_per_unit || 0 });
        setIsNew(false);
    };

    const save = async () => {
        if (!editing?.name) return;
        setSaving(true);
        try {
            if (isNew) {
                const id = editing.material_id || `MAT-${Date.now()}`;
                const { error } = await supabase.from('t_materials').insert({
                    material_id: id, name: editing.name, unit: editing.unit || 'Stk',
                    category: editing.category || null, vat_rate: editing.vat_rate || 19, is_active: true,
                });
                if (error) throw error;
                await supabase.from('t_material_prices').upsert({
                    material_id: id, cost_per_unit: Number(editing.cost_per_unit) || 0, price_per_unit: Number(editing.price_per_unit) || 0
                });
                toast('Material erstellt');
            } else {
                const { error } = await supabase.from('t_materials').update({
                    name: editing.name, unit: editing.unit, category: editing.category,
                    vat_rate: editing.vat_rate,
                }).eq('material_id', editing.material_id);
                if (error) throw error;
                await supabase.from('t_material_prices').upsert({
                    material_id: editing.material_id, cost_per_unit: Number(editing.cost_per_unit) || 0, price_per_unit: Number(editing.price_per_unit) || 0
                });
                toast('Material aktualisiert');
            }
            setEditing(null); fetch();
        } catch { toast('Fehler beim Speichern', 'error'); }
        setSaving(false);
    };

    const remove = async (id: string, e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!confirm('Material wirklich löschen?')) return;
        setItems(prev => prev.filter(m => m.material_id !== id));
        const { error } = await supabase.from('t_materials').update({ is_active: false }).eq('material_id', id);
        if (error) { toast('Fehler beim Löschen', 'error'); fetch(); }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500">{items.length} Materialien</span>
                <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm">
                    <Plus className="h-4 w-4" /> Hinzufügen
                </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b text-xs font-medium text-slate-500 uppercase">
                        <tr><th className="px-4 py-3">Material</th><th className="px-4 py-3">Einheit</th>
                            <th className="px-4 py-3">Kategorie</th><th className="px-4 py-3 text-right">EK/Einheit</th>
                            <th className="px-4 py-3 text-right">VK/Einheit</th><th className="px-4 py-3 text-right">MwSt %</th><th className="w-20"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map(m => {
                            const p = Array.isArray(m.prices) ? m.prices[0] : m.prices;
                            return (
                                <tr key={m.material_id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => openEdit(m)}>
                                    <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                                    <td className="px-4 py-3 text-slate-600">{m.unit}</td>
                                    <td className="px-4 py-3"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{m.category || '—'}</span></td>
                                    <td className="px-4 py-3 text-right font-mono">{p?.cost_per_unit ? `${p.cost_per_unit.toFixed(2)} €` : '—'}</td>
                                    <td className="px-4 py-3 text-right font-mono">{p?.price_per_unit ? `${p.price_per_unit.toFixed(2)} €` : '—'}</td>
                                    <td className="px-4 py-3 text-right">{m.vat_rate ? `${m.vat_rate}%` : '—'}</td>
                                    <td className="px-4 py-3" onClick={ev => ev.stopPropagation()}>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(m)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                                            <button onClick={(e) => remove(m.material_id, e)} type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {editing && (
                <Modal title={isNew ? 'Neues Material' : 'Material bearbeiten'} onClose={() => setEditing(null)} onSave={save} saving={saving}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Name *" value={editing.name || ''} onChange={v => setEditing({ ...editing, name: v })} />
                        <Field label="Einheit" value={editing.unit || ''} onChange={v => setEditing({ ...editing, unit: v })} placeholder="z.B. Stk, m², Rolle" />
                        <Field label="Kategorie" value={editing.category || ''} onChange={v => setEditing({ ...editing, category: v })} />
                        <Field label="MwSt (%)" value={String(editing.vat_rate || '')} onChange={v => setEditing({ ...editing, vat_rate: parseFloat(v) || 0 })} type="number" />
                        <Field label="EK/Einheit (€)" value={String(editing.cost_per_unit || '')} onChange={v => setEditing({ ...editing, cost_per_unit: v })} type="number" />
                        <Field label="VK/Einheit (€)" value={String(editing.price_per_unit || '')} onChange={v => setEditing({ ...editing, price_per_unit: v })} type="number" />
                    </div>
                </Modal>
            )}
        </>
    );
}

function ServicesTab() {
    const { toast } = useToast();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('t_services').select('*, prices:t_service_prices(*)').eq('is_active', true).order('name');
        setItems((data as any) || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const openNew = () => {
        setEditing({ service_id: '', name: '', default_unit: 'Std', category: '' });
        setIsNew(true);
    };
    const openEdit = (s: any) => { setEditing({ ...s }); setIsNew(false); };

    const save = async () => {
        if (!editing?.name) return;
        setSaving(true);
        try {
            if (isNew) {
                const id = editing.service_id || `SVC-${Date.now()}`;
                const { error } = await supabase.from('t_services').insert({
                    service_id: id, name: editing.name, default_unit: editing.default_unit || 'Std',
                    category: editing.category || null, is_active: true,
                });
                if (error) throw error;
                toast('Leistung erstellt');
            } else {
                const { error } = await supabase.from('t_services').update({
                    name: editing.name, default_unit: editing.default_unit, category: editing.category,
                }).eq('service_id', editing.service_id);
                if (error) throw error;
                toast('Leistung aktualisiert');
            }
            setEditing(null); fetch();
        } catch { toast('Fehler beim Speichern', 'error'); }
        setSaving(false);
    };

    const remove = async (id: string, e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!confirm('Leistung wirklich löschen?')) return;
        setItems(prev => prev.filter(s => s.service_id !== id));
        const { error } = await supabase.from('t_services').update({ is_active: false }).eq('service_id', id);
        if (error) { toast('Fehler beim Löschen', 'error'); fetch(); }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500">{items.length} Leistungen</span>
                <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm">
                    <Plus className="h-4 w-4" /> Hinzufügen
                </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b text-xs font-medium text-slate-500 uppercase">
                        <tr><th className="px-4 py-3">Leistung</th><th className="px-4 py-3">Einheit</th>
                            <th className="px-4 py-3">Kategorie</th><th className="px-4 py-3">Lieferanten / Preise</th><th className="w-20"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((s: any) => (
                            <tr key={s.service_id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => openEdit(s)}>
                                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                                <td className="px-4 py-3 text-slate-600">{s.default_unit || '—'}</td>
                                <td className="px-4 py-3"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{s.category || '—'}</span></td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {(s.prices || []).map((p: any, i: number) => (
                                            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                                {p.supplier}: EK {p.cost_per_unit?.toFixed(2) || '—'} € / VK {p.customer_price_per_unit?.toFixed(2) || '—'} €
                                            </span>
                                        ))}
                                        {(!s.prices || s.prices.length === 0) && <span className="text-slate-400 text-xs">Keine Preise</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3" onClick={ev => ev.stopPropagation()}>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                                        <button onClick={(e) => remove(s.service_id, e)} type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editing && (
                <Modal title={isNew ? 'Neue Leistung' : 'Leistung bearbeiten'} onClose={() => setEditing(null)} onSave={save} saving={saving}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Name *" value={editing.name || ''} onChange={v => setEditing({ ...editing, name: v })} />
                        <Field label="Einheit" value={editing.default_unit || ''} onChange={v => setEditing({ ...editing, default_unit: v })} placeholder="z.B. Std, m³, Pauschal" />
                        <Field label="Kategorie" value={editing.category || ''} onChange={v => setEditing({ ...editing, category: v })} />
                    </div>
                </Modal>
            )}
        </>
    );
}

// ============ SHARED COMPONENTS ============

function LoadingSpinner() {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
}

function Modal({ title, onClose, onSave, saving, children }: {
    title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
                </div>
                <div className="p-6 space-y-3">{children}</div>
                <div className="flex justify-end gap-3 border-t px-6 py-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-300 hover:bg-slate-50">Abbrechen</button>
                    <button onClick={onSave} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Speichern
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, type = 'text', textarea = false, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean; placeholder?: string;
}) {
    return (
        <div className={textarea ? 'col-span-full mt-2' : ''}>
            <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
            {textarea ? (
                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:border-blue-500 focus:outline-none"
                    rows={2} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            ) : (
                <input type={type} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            )}
        </div>
    );
}
