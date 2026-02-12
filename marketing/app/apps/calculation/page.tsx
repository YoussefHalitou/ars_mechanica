'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import {
    Calculator, ChevronDown, Users, Truck, Package, Wrench,
    TrendingUp, DollarSign, Loader2, Plus, Trash2, Save, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Project = Database['public']['Tables']['t_projects']['Row'];

interface TimePairWithRate {
    pair_id: string;
    datum: string;
    mitarbeiter: string;
    role: string | null;
    lis_von: string | null;
    lis_bis: string | null;
    kunde_von: string | null;
    kunde_bis: string | null;
    pause_min: number;
    lis_stunden: number;
    kunden_stunden: number;
    satz: number;
    kosten: number;
}

interface MaterialRow {
    id: string;
    material_id: string;
    material_name: string;
    unit: string;
    quantity: number;
    cost_per_unit: number;
    price_per_unit: number;
    total_cost: number;
    total_price: number;
}

interface VehicleCostRow {
    id: string;
    vehicle_id: string;
    fahrzeug: string;
    usage_type: string;
    usage_value: number;
    cost_per_unit: number;
    total_cost: number;
}

interface RevenueRow {
    id: string;
    position_label: string;
    qty: number;
    unit: string;
    unit_price: number;
    line_total: number;
    kind: string;
    isNew?: boolean;
}

function calcHours(von: string | null, bis: string | null, pauseMin: number = 0): number {
    if (!von || !bis) return 0;
    const [vh, vm] = von.split(':').map(Number);
    const [bh, bm] = bis.split(':').map(Number);
    const totalMin = (bh * 60 + bm) - (vh * 60 + vm) - pauseMin;
    return totalMin > 0 ? +(totalMin / 60).toFixed(2) : 0;
}

function eur(n: number) { return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }); }

export default function CalculationPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(false);

    // Cost data
    const [personnel, setPersonnel] = useState<TimePairWithRate[]>([]);
    const [materials, setMaterials] = useState<MaterialRow[]>([]);
    const [vehicles, setVehicles] = useState<VehicleCostRow[]>([]);
    const [revenue, setRevenue] = useState<RevenueRow[]>([]);
    const [extraCosts, setExtraCosts] = useState<{ cost_id: string; cost_type: string; description: string; cost: number }[]>([]);

    // Load projects
    useEffect(() => {
        (async () => {
            const { data } = await supabase.from('t_projects').select('*').order('created_at', { ascending: false });
            setProjects(data || []);
        })();
    }, []);

    // Load project data
    useEffect(() => {
        if (!selectedProjectId) {
            setSelectedProject(null);
            setPersonnel([]);
            setMaterials([]);
            setVehicles([]);
            setRevenue([]);
            setExtraCosts([]);
            return;
        }
        loadProjectData(selectedProjectId);
    }, [selectedProjectId]);

    const loadProjectData = async (pid: string) => {
        setLoading(true);
        const proj = projects.find(p => p.project_id === pid) || null;
        setSelectedProject(proj);

        // 1. Personnel: time pairs + employee hourly rates
        const { data: timePairs } = await supabase
            .from('t_time_pairs')
            .select('*')
            .eq('project_id', pid)
            .order('datum');

        // Get employee rates
        const { data: employees } = await supabase.from('t_employees').select('employee_id, name, hourly_rate, role');
        const rateMap: Record<string, { rate: number; role: string | null }> = {};
        (employees || []).forEach(e => { rateMap[e.name] = { rate: e.hourly_rate || 0, role: e.role }; });

        const personnelRows: TimePairWithRate[] = (timePairs || []).map(tp => {
            const lisH = calcHours(tp.lis_von, tp.lis_bis, tp.pause_min || 0);
            const kdH = calcHours(tp.kunde_von, tp.kunde_bis);
            const satz = rateMap[tp.mitarbeiter]?.rate || 0;
            return {
                pair_id: tp.pair_id,
                datum: tp.datum,
                mitarbeiter: tp.mitarbeiter,
                role: rateMap[tp.mitarbeiter]?.role || null,
                lis_von: tp.lis_von,
                lis_bis: tp.lis_bis,
                kunde_von: tp.kunde_von,
                kunde_bis: tp.kunde_bis,
                pause_min: tp.pause_min || 0,
                lis_stunden: lisH,
                kunden_stunden: kdH,
                satz,
                kosten: +(lisH * satz).toFixed(2),
            };
        });
        setPersonnel(personnelRows);

        // 2. Materials
        const { data: matUsage } = await supabase
            .from('t_project_material_usage')
            .select('*, material:t_materials(name, unit), prices:t_material_prices(cost_per_unit, price_per_unit)')
            .eq('project_id', pid);

        const materialRows: MaterialRow[] = (matUsage as any || []).map((m: any) => ({
            id: m.id,
            material_id: m.material_id,
            material_name: m.material?.name || m.material_id,
            unit: m.material?.unit || '',
            quantity: m.quantity,
            cost_per_unit: m.prices?.cost_per_unit || 0,
            price_per_unit: m.prices?.price_per_unit || 0,
            total_cost: +(m.quantity * (m.prices?.cost_per_unit || 0)).toFixed(2),
            total_price: +(m.quantity * (m.prices?.price_per_unit || 0)).toFixed(2),
        }));
        setMaterials(materialRows);

        // 3. Vehicles
        const { data: vCosts } = await supabase
            .from('t_project_vehicle_costs')
            .select('*, vehicle:t_vehicles(nickname)')
            .eq('project_id', pid);

        const vehicleRows: VehicleCostRow[] = (vCosts as any || []).map((v: any) => ({
            id: v.id,
            vehicle_id: v.vehicle_id,
            fahrzeug: v.vehicle?.nickname || v.vehicle_id,
            usage_type: v.usage_type,
            usage_value: v.usage_value,
            cost_per_unit: v.cost_per_unit || 0,
            total_cost: v.total_cost || +(v.usage_value * (v.cost_per_unit || 0)).toFixed(2),
        }));
        setVehicles(vehicleRows);

        // 4. Revenue items
        const { data: revItems } = await supabase
            .from('t_project_revenue_items')
            .select('*')
            .eq('project_id', pid)
            .order('sort_order');

        const revenueRows: RevenueRow[] = (revItems || []).map(r => ({
            id: r.id,
            position_label: r.position_label,
            qty: r.qty,
            unit: r.unit || '',
            unit_price: r.unit_price,
            line_total: r.line_total || +(r.qty * r.unit_price).toFixed(2),
            kind: r.kind,
        }));
        setRevenue(revenueRows);

        // 5. Extra costs
        const { data: extras } = await supabase.from('t_project_costs_extra').select('*').eq('project_id', pid);
        setExtraCosts((extras || []).map(e => ({ cost_id: e.cost_id, cost_type: e.cost_type, description: e.description || '', cost: e.cost })));

        setLoading(false);
    };

    // Calculations
    const personalKosten = useMemo(() => personnel.reduce((s, p) => s + p.kosten, 0), [personnel]);
    const materialKosten = useMemo(() => materials.reduce((s, m) => s + m.total_cost, 0), [materials]);
    const materialErloes = useMemo(() => materials.reduce((s, m) => s + m.total_price, 0), [materials]);
    const vehicleKosten = useMemo(() => vehicles.reduce((s, v) => s + v.total_cost, 0), [vehicles]);
    const extraKosten = useMemo(() => extraCosts.reduce((s, e) => s + e.cost, 0), [extraCosts]);
    const revenueTotal = useMemo(() => revenue.reduce((s, r) => s + r.line_total, 0), [revenue]);
    const totalCosts = personalKosten + materialKosten + vehicleKosten + extraKosten;
    const totalRevenue = revenueTotal + materialErloes;
    const margin = totalRevenue - totalCosts;
    const marginPct = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

    // Revenue CRUD
    const addRevenueRow = () => {
        setRevenue(prev => [...prev, {
            id: `temp-${Date.now()}`,
            position_label: '', qty: 1, unit: 'Std', unit_price: 0, line_total: 0, kind: 'manual', isNew: true,
        }]);
    };

    const updateRevenue = (id: string, field: keyof RevenueRow, value: any) => {
        setRevenue(prev => prev.map(r => {
            if (r.id !== id) return r;
            const updated = { ...r, [field]: value };
            if (field === 'qty' || field === 'unit_price') {
                updated.line_total = +((updated.qty || 0) * (updated.unit_price || 0)).toFixed(2);
            }
            return updated;
        }));
    };

    const saveRevenue = async () => {
        if (!selectedProjectId) return;
        for (const r of revenue) {
            const record = {
                project_id: selectedProjectId,
                position_label: r.position_label,
                qty: r.qty,
                unit: r.unit,
                unit_price: r.unit_price,
                line_total: r.line_total,
                kind: r.kind,
            };
            if (r.isNew || r.id.startsWith('temp-')) {
                await supabase.from('t_project_revenue_items').insert(record);
            } else {
                await supabase.from('t_project_revenue_items').update(record).eq('id', r.id);
            }
        }
        loadProjectData(selectedProjectId);
    };

    const deleteRevenue = async (id: string) => {
        if (id.startsWith('temp-')) {
            setRevenue(prev => prev.filter(r => r.id !== id));
        } else {
            await supabase.from('t_project_revenue_items').delete().eq('id', id);
            loadProjectData(selectedProjectId);
        }
    };

    // Export
    const exportHTML = () => {
        const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Nachkalkulation – ${selectedProject?.name || ''}</title>
        <style>body{font-family:system-ui;margin:2rem;color:#1e293b}h1{font-size:1.5rem}table{width:100%;border-collapse:collapse;margin:1rem 0}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left;font-size:0.85rem}th{background:#f1f5f9;font-weight:600}.right{text-align:right}.kpi{display:flex;gap:1rem;margin:1rem 0}.kpi-card{flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:1rem;text-align:center}.kpi-label{font-size:0.75rem;color:#64748b;text-transform:uppercase}.kpi-value{font-size:1.5rem;font-weight:700;margin-top:4px}.positive{color:#16a34a}.negative{color:#dc2626}</style></head><body>
        <h1>Nachkalkulation: ${selectedProject?.anrede || ''} ${selectedProject?.name || ''}</h1>
        <p>${selectedProject?.strasse || ''} ${selectedProject?.nr || ''}, ${selectedProject?.plz || ''} ${selectedProject?.ort || ''}</p>
        <div class="kpi"><div class="kpi-card"><div class="kpi-label">Gesamtkosten</div><div class="kpi-value">${eur(totalCosts)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Gesamterlöse</div><div class="kpi-value">${eur(totalRevenue)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Marge</div><div class="kpi-value ${margin >= 0 ? 'positive' : 'negative'}">${eur(margin)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Marge %</div><div class="kpi-value ${marginPct >= 0 ? 'positive' : 'negative'}">${marginPct.toFixed(1)}%</div></div></div>
        <h2>Personalkosten</h2><table><tr><th>Datum</th><th>Mitarbeiter</th><th>LiS Std.</th><th class="right">Satz</th><th class="right">Kosten</th></tr>
        ${personnel.map(p => `<tr><td>${p.datum}</td><td>${p.mitarbeiter}</td><td>${p.lis_stunden.toFixed(2)}</td><td class="right">${eur(p.satz)}</td><td class="right">${eur(p.kosten)}</td></tr>`).join('')}
        <tr><th colspan="4">Summe Personal</th><th class="right">${eur(personalKosten)}</th></tr></table>
        <h2>Materialkosten</h2><table><tr><th>Material</th><th>Menge</th><th>Einheit</th><th class="right">EK/Einheit</th><th class="right">Kosten</th></tr>
        ${materials.map(m => `<tr><td>${m.material_name}</td><td>${m.quantity}</td><td>${m.unit}</td><td class="right">${eur(m.cost_per_unit)}</td><td class="right">${eur(m.total_cost)}</td></tr>`).join('')}
        <tr><th colspan="4">Summe Material</th><th class="right">${eur(materialKosten)}</th></tr></table>
        <h2>Fahrzeugkosten</h2><table><tr><th>Fahrzeug</th><th>Typ</th><th>Wert</th><th class="right">Satz</th><th class="right">Kosten</th></tr>
        ${vehicles.map(v => `<tr><td>${v.fahrzeug}</td><td>${v.usage_type}</td><td>${v.usage_value}</td><td class="right">${eur(v.cost_per_unit)}</td><td class="right">${eur(v.total_cost)}</td></tr>`).join('')}
        <tr><th colspan="4">Summe Fahrzeuge</th><th class="right">${eur(vehicleKosten)}</th></tr></table>
        <h2>Erlöse</h2><table><tr><th>Position</th><th>Menge</th><th>Einheit</th><th class="right">Preis</th><th class="right">Gesamt</th></tr>
        ${revenue.map(r => `<tr><td>${r.position_label}</td><td>${r.qty}</td><td>${r.unit}</td><td class="right">${eur(r.unit_price)}</td><td class="right">${eur(r.line_total)}</td></tr>`).join('')}
        <tr><th colspan="4">Summe Erlöse</th><th class="right">${eur(revenueTotal)}</th></tr></table>
        </body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Nachkalkulation_${selectedProject?.name || 'Projekt'}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex h-full flex-col bg-slate-50">
            {/* Header */}
            <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <Calculator className="h-6 w-6 text-slate-700" />
                    <h1 className="text-2xl font-bold text-slate-800">Nachkalkulation</h1>
                </div>
                <div className="flex items-center gap-3">
                    <select className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none min-w-[300px]"
                        value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                        <option value="">Projekt auswählen...</option>
                        {projects.map(p => (
                            <option key={p.project_id} value={p.project_id}>
                                {p.project_code || '—'} | {p.name || 'Unbenannt'} | {p.ort || ''}
                            </option>
                        ))}
                    </select>
                    {selectedProject && (
                        <button onClick={exportHTML}
                            className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 shadow-sm">
                            <FileText className="h-4 w-4" /> Export
                        </button>
                    )}
                </div>
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            ) : !selectedProject ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                        <Calculator className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg">Wähle ein Projekt aus, um die Kalkulation zu starten.</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <KpiCard label="Gesamtkosten" value={eur(totalCosts)} icon={<DollarSign className="h-5 w-5" />} color="text-slate-800" bgColor="bg-slate-100" />
                        <KpiCard label="Gesamterlöse" value={eur(totalRevenue)} icon={<TrendingUp className="h-5 w-5" />} color="text-blue-700" bgColor="bg-blue-50" />
                        <KpiCard label="Marge (€)" value={eur(margin)} icon={<TrendingUp className="h-5 w-5" />}
                            color={margin >= 0 ? 'text-green-700' : 'text-red-600'} bgColor={margin >= 0 ? 'bg-green-50' : 'bg-red-50'} />
                        <KpiCard label="Marge (%)" value={`${marginPct.toFixed(1)}%`} icon={<TrendingUp className="h-5 w-5" />}
                            color={marginPct >= 0 ? 'text-green-700' : 'text-red-600'} bgColor={marginPct >= 0 ? 'bg-green-50' : 'bg-red-50'} />
                    </div>

                    {/* Personnel Costs */}
                    <CostSection title="Personalkosten" icon={<Users className="h-5 w-5" />} total={personalKosten} color="blue">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                                <tr><th className="px-4 py-2 text-left">Datum</th><th className="px-4 py-2 text-left">Mitarbeiter</th><th className="px-4 py-2 text-left">Rolle</th>
                                    <th className="px-4 py-2 text-right">LiS Std.</th><th className="px-4 py-2 text-right">Kd Std.</th><th className="px-4 py-2 text-right">Satz (€/h)</th><th className="px-4 py-2 text-right">Kosten</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {personnel.length === 0 ? (
                                    <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Keine Zeitpaare vorhanden</td></tr>
                                ) : personnel.map(p => (
                                    <tr key={p.pair_id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 text-slate-600">{p.datum}</td>
                                        <td className="px-4 py-2 font-medium">{p.mitarbeiter}</td>
                                        <td className="px-4 py-2 text-slate-500">{p.role || '—'}</td>
                                        <td className="px-4 py-2 text-right font-mono">{p.lis_stunden.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-slate-500">{p.kunden_stunden.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right">{eur(p.satz)}</td>
                                        <td className="px-4 py-2 text-right font-semibold">{eur(p.kosten)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CostSection>

                    {/* Material Costs */}
                    <CostSection title="Materialkosten" icon={<Package className="h-5 w-5" />} total={materialKosten} color="amber">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                                <tr><th className="px-4 py-2 text-left">Material</th><th className="px-4 py-2 text-right">Menge</th><th className="px-4 py-2 text-left">Einheit</th>
                                    <th className="px-4 py-2 text-right">EK/Einheit</th><th className="px-4 py-2 text-right">VK/Einheit</th>
                                    <th className="px-4 py-2 text-right">Kosten</th><th className="px-4 py-2 text-right">Erlöse</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {materials.length === 0 ? (
                                    <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Keine Materialien zugeordnet</td></tr>
                                ) : materials.map(m => (
                                    <tr key={m.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium">{m.material_name}</td>
                                        <td className="px-4 py-2 text-right font-mono">{m.quantity}</td>
                                        <td className="px-4 py-2 text-slate-500">{m.unit}</td>
                                        <td className="px-4 py-2 text-right">{eur(m.cost_per_unit)}</td>
                                        <td className="px-4 py-2 text-right">{eur(m.price_per_unit)}</td>
                                        <td className="px-4 py-2 text-right font-semibold">{eur(m.total_cost)}</td>
                                        <td className="px-4 py-2 text-right text-green-700">{eur(m.total_price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CostSection>

                    {/* Vehicle Costs */}
                    <CostSection title="Fahrzeugkosten" icon={<Truck className="h-5 w-5" />} total={vehicleKosten} color="sky">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                                <tr><th className="px-4 py-2 text-left">Fahrzeug</th><th className="px-4 py-2 text-left">Typ</th>
                                    <th className="px-4 py-2 text-right">Wert</th><th className="px-4 py-2 text-right">Satz</th><th className="px-4 py-2 text-right">Kosten</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vehicles.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Keine Fahrzeugkosten</td></tr>
                                ) : vehicles.map(v => (
                                    <tr key={v.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium">{v.fahrzeug}</td>
                                        <td className="px-4 py-2 text-slate-500">{v.usage_type}</td>
                                        <td className="px-4 py-2 text-right font-mono">{v.usage_value}</td>
                                        <td className="px-4 py-2 text-right">{eur(v.cost_per_unit)}</td>
                                        <td className="px-4 py-2 text-right font-semibold">{eur(v.total_cost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CostSection>

                    {/* Revenue */}
                    <CostSection title="Erlöse (Rechnungspositionen)" icon={<TrendingUp className="h-5 w-5" />} total={revenueTotal} color="green"
                        actions={
                            <div className="flex gap-2">
                                <button onClick={addRevenueRow} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900"><Plus className="h-3.5 w-3.5" /> Zeile</button>
                                <button onClick={saveRevenue} className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"><Save className="h-3.5 w-3.5" /> Speichern</button>
                            </div>
                        }>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                                <tr><th className="px-4 py-2 text-left">Position</th><th className="px-4 py-2 text-right w-20">Menge</th>
                                    <th className="px-4 py-2 w-20">Einheit</th><th className="px-4 py-2 text-right w-28">Preis/Einheit</th>
                                    <th className="px-4 py-2 text-right w-28">Gesamt</th><th className="w-10"></th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {revenue.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Keine Erlöse</td></tr>
                                ) : revenue.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-1.5"><input className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm"
                                            value={r.position_label} onChange={e => updateRevenue(r.id, 'position_label', e.target.value)} placeholder="Position..." /></td>
                                        <td className="px-4 py-1.5"><input type="number" step="0.01" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm text-right"
                                            value={r.qty} onChange={e => updateRevenue(r.id, 'qty', +e.target.value)} /></td>
                                        <td className="px-4 py-1.5"><input className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm"
                                            value={r.unit} onChange={e => updateRevenue(r.id, 'unit', e.target.value)} /></td>
                                        <td className="px-4 py-1.5"><input type="number" step="0.01" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm text-right"
                                            value={r.unit_price} onChange={e => updateRevenue(r.id, 'unit_price', +e.target.value)} /></td>
                                        <td className="px-4 py-2 text-right font-semibold text-green-700">{eur(r.line_total)}</td>
                                        <td className="px-2"><button onClick={() => deleteRevenue(r.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CostSection>
                </div>
            )}
        </div>
    );
}

// -- Helper Components --

function KpiCard({ label, value, icon, color, bgColor }: { label: string; value: string; icon: React.ReactNode; color: string; bgColor: string }) {
    return (
        <div className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm')}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                <div className={cn('p-2 rounded-lg', bgColor, color)}>{icon}</div>
            </div>
            <div className={cn('text-2xl font-bold', color)}>{value}</div>
        </div>
    );
}

function CostSection({ title, icon, total, color, children, actions }: {
    title: string; icon: React.ReactNode; total: number; color: string; children: React.ReactNode; actions?: React.ReactNode;
}) {
    const colorMap: Record<string, string> = {
        blue: 'border-l-blue-500', amber: 'border-l-amber-500', sky: 'border-l-sky-500', green: 'border-l-green-500',
    };
    return (
        <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-l-4', colorMap[color] || 'border-l-slate-300')}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                    {icon}
                    <span className="font-semibold">{title}</span>
                </div>
                <div className="flex items-center gap-4">
                    {actions}
                    <span className="text-lg font-bold text-slate-800">{eur(total)}</span>
                </div>
            </div>
            {children}
        </div>
    );
}
