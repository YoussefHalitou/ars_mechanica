'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { format } from 'date-fns';
import {
    Calculator, ChevronDown, Users, Truck, Package, Wrench,
    TrendingUp, DollarSign, Loader2, Plus, Trash2, Save, FileText, X, Pencil,
    AlertCircle, Percent
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Project = Database['public']['Tables']['t_projects']['Row'];

interface TimePairWithRate {
    pair_id: string; datum: string; mitarbeiter: string; role: string | null;
    lis_von: string | null; lis_bis: string | null; kunde_von: string | null; kunde_bis: string | null;
    pause_min: number; lis_stunden: number; kunden_stunden: number; satz: number; kosten: number;
}
interface MaterialRow {
    id: string; material_id: string; material_name: string; unit: string;
    quantity: number; cost_per_unit: number; price_per_unit: number; total_cost: number; total_price: number;
    isNew?: boolean;
}
interface VehicleCostRow {
    id: string; vehicle_id: string; fahrzeug: string; usage_type: string;
    usage_value: number; cost_per_unit: number; total_cost: number; notes: string;
    isNew?: boolean;
}
interface ServiceCostRow {
    id: string; service_id: string; service_name: string; supplier: string;
    quantity: number; unit: string; cost_per_unit: number; total_cost: number;
    isNew?: boolean;
}
interface RevenueRow {
    id: string; position_label: string; qty: number; unit: string;
    unit_price: number; line_total: number; kind: string; isNew?: boolean;
}
interface DiscountRow {
    discount_id: string; discount_type: string; label: string; value: number; isNew?: boolean;
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
    const { toast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(false);

    const [personnel, setPersonnel] = useState<TimePairWithRate[]>([]);
    const [materials, setMaterials] = useState<MaterialRow[]>([]);
    const [vehicles, setVehicles] = useState<VehicleCostRow[]>([]);
    const [services, setServices] = useState<ServiceCostRow[]>([]);
    const [revenue, setRevenue] = useState<RevenueRow[]>([]);
    const [extraCosts, setExtraCosts] = useState<{ cost_id: string; cost_type: string; description: string; cost: number; isNew?: boolean }[]>([]);
    const [discounts, setDiscounts] = useState<DiscountRow[]>([]);

    // Catalog data for modals
    const [materialCatalog, setMaterialCatalog] = useState<any[]>([]);
    const [vehicleCatalog, setVehicleCatalog] = useState<any[]>([]);
    const [serviceCatalog, setServiceCatalog] = useState<any[]>([]);

    // Add modals
    const [addMatModal, setAddMatModal] = useState(false);
    const [addMatForm, setAddMatForm] = useState({ material_id: '', quantity: 1 });
    const [addVehModal, setAddVehModal] = useState(false);
    const [addVehForm, setAddVehForm] = useState({ vehicle_id: '', usage_type: 'km', usage_value: 0, cost_per_unit: 0, notes: '' });
    const [addExtraModal, setAddExtraModal] = useState(false);
    const [addExtraForm, setAddExtraForm] = useState({ cost_type: 'Sonstiges', description: '', cost: 0 });
    const [addSvcModal, setAddSvcModal] = useState(false);
    const [addSvcForm, setAddSvcForm] = useState({ service_id: '', quantity: 1, unit: 'Std', cost_per_unit: 0, supplier: '' });

    useEffect(() => {
        (async () => {
            const [projRes, matRes, vehRes, svcRes] = await Promise.all([
                supabase.from('t_projects').select('*').order('created_at', { ascending: false }),
                supabase.from('t_materials').select('*, prices:t_material_prices(cost_per_unit, price_per_unit)').eq('is_active', true).order('name'),
                supabase.from('t_vehicles').select('*').eq('is_deleted', false).order('nickname'),
                supabase.from('t_services').select('*, prices:t_service_prices(*)').eq('is_active', true).order('name'),
            ]);
            setProjects(projRes.data || []);
            setMaterialCatalog(matRes.data || []);
            setVehicleCatalog(vehRes.data || []);
            setServiceCatalog(svcRes.data || []);
        })();
    }, []);

    useEffect(() => {
        if (!selectedProjectId) {
            setSelectedProject(null); setPersonnel([]); setMaterials([]); setVehicles([]); setServices([]); setRevenue([]); setExtraCosts([]); setDiscounts([]);
            return;
        }
        loadProjectData(selectedProjectId);
    }, [selectedProjectId]);

    const loadProjectData = async (pid: string) => {
        setLoading(true);
        const proj = projects.find(p => p.project_id === pid) || null;
        setSelectedProject(proj);

        const { data: employees } = await supabase.from('t_employees').select('employee_id, name, hourly_rate, role');
        const rateMap: Record<string, { rate: number; role: string | null }> = {};
        (employees || []).forEach(e => { rateMap[e.name] = { rate: e.hourly_rate || 0, role: e.role }; });

        const [tpRes, matRes, vehRes, svcRes, revRes, extRes, discRes] = await Promise.all([
            supabase.from('t_time_pairs').select('*').eq('project_id', pid).order('datum'),
            supabase.from('t_project_material_usage').select('*, material:t_materials(name, unit), prices:t_material_prices(cost_per_unit, price_per_unit)').eq('project_id', pid),
            supabase.from('t_project_vehicle_costs').select('*, vehicle:t_vehicles(nickname)').eq('project_id', pid),
            supabase.from('t_project_service_usage').select('*, service:t_services(name, default_unit), prices:t_service_prices(cost_per_unit, supplier)').eq('project_id', pid),
            supabase.from('t_project_revenue_items').select('*').eq('project_id', pid).order('sort_order'),
            supabase.from('t_project_costs_extra').select('*').eq('project_id', pid),
            supabase.from('t_project_discounts').select('*').eq('project_id', pid),
        ]);

        setPersonnel((tpRes.data || []).map(tp => {
            const lisH = calcHours(tp.lis_von, tp.lis_bis, tp.pause_min || 0);
            const kdH = calcHours(tp.kunde_von, tp.kunde_bis);
            const satz = rateMap[tp.mitarbeiter]?.rate || 0;
            return {
                pair_id: tp.pair_id, datum: tp.datum, mitarbeiter: tp.mitarbeiter, role: rateMap[tp.mitarbeiter]?.role || null,
                lis_von: tp.lis_von, lis_bis: tp.lis_bis, kunde_von: tp.kunde_von, kunde_bis: tp.kunde_bis,
                pause_min: tp.pause_min || 0, lis_stunden: lisH, kunden_stunden: kdH, satz, kosten: +(lisH * satz).toFixed(2)
            };
        }));

        setMaterials((matRes.data as any || []).map((m: any) => {
            const p = Array.isArray(m.prices) ? m.prices[0] : m.prices;
            return {
                id: m.id, material_id: m.material_id, material_name: m.material?.name || m.material_id, unit: m.material?.unit || '',
                quantity: m.quantity, cost_per_unit: p?.cost_per_unit || 0, price_per_unit: p?.price_per_unit || 0,
                total_cost: +(m.quantity * (p?.cost_per_unit || 0)).toFixed(2), total_price: +(m.quantity * (p?.price_per_unit || 0)).toFixed(2)
            };
        }));

        setVehicles((vehRes.data as any || []).map((v: any) => ({
            id: v.id, vehicle_id: v.vehicle_id, fahrzeug: v.vehicle?.nickname || v.vehicle_id, usage_type: v.usage_type || 'km',
            usage_value: v.usage_value || 0, cost_per_unit: v.cost_per_unit || 0,
            total_cost: v.total_cost || +(v.usage_value * (v.cost_per_unit || 0)).toFixed(2), notes: v.notes || '',
        })));

        setServices((svcRes.data as any || []).map((s: any) => {
            const p = Array.isArray(s.prices) ? s.prices[0] : s.prices;
            return {
                id: s.id, service_id: s.service_id, service_name: s.service?.name || s.service_id, supplier: p?.supplier || '',
                quantity: s.quantity || 1, unit: s.service?.default_unit || 'Std', cost_per_unit: p?.cost_per_unit || 0,
                total_cost: +((s.quantity || 1) * (p?.cost_per_unit || 0)).toFixed(2)
            };
        }));

        setRevenue((revRes.data || []).map(r => ({
            id: r.id, position_label: r.position_label, qty: r.qty, unit: r.unit || '',
            unit_price: r.unit_price, line_total: r.line_total || +(r.qty * r.unit_price).toFixed(2), kind: r.kind
        })));

        setExtraCosts((extRes.data || []).map(e => ({ cost_id: e.cost_id, cost_type: e.cost_type, description: e.description || '', cost: e.cost })));
        setDiscounts((discRes.data || []).map((d: any) => ({ discount_id: d.discount_id, discount_type: d.discount_type || 'flat', label: d.label || '', value: d.value || 0 })));
        setLoading(false);
    };

    // Calculations
    const personalKosten = useMemo(() => personnel.reduce((s, p) => s + p.kosten, 0), [personnel]);
    const materialKosten = useMemo(() => materials.reduce((s, m) => s + m.total_cost, 0), [materials]);
    const materialErloes = useMemo(() => materials.reduce((s, m) => s + m.total_price, 0), [materials]);
    const vehicleKosten = useMemo(() => vehicles.reduce((s, v) => s + v.total_cost, 0), [vehicles]);
    const serviceKosten = useMemo(() => services.reduce((s, sv) => s + sv.total_cost, 0), [services]);
    const extraKosten = useMemo(() => extraCosts.reduce((s, e) => s + e.cost, 0), [extraCosts]);
    const revenueTotal = useMemo(() => revenue.reduce((s, r) => s + r.line_total, 0), [revenue]);
    const discountTotal = useMemo(() => discounts.reduce((s, d) => s + d.value, 0), [discounts]);
    const totalCosts = personalKosten + materialKosten + vehicleKosten + serviceKosten + extraKosten;
    const totalRevenue = revenueTotal + materialErloes - discountTotal;
    const margin = totalRevenue - totalCosts;
    const marginPct = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

    // ---- MATERIAL CRUD ----
    const addMaterial = async () => {
        if (!addMatForm.material_id || !selectedProjectId) return;
        try {
            const { error } = await supabase.from('t_project_material_usage').insert({ project_id: selectedProjectId, material_id: addMatForm.material_id, quantity: addMatForm.quantity });
            if (error) throw error;
            setAddMatModal(false);
            toast('Material hinzugefügt');
            loadProjectData(selectedProjectId);
        } catch { toast('Fehler beim Hinzufügen', 'error'); }
    };
    const updateMaterialQty = (id: string, qty: number) => {
        setMaterials(prev => prev.map(m => m.id === id ? { ...m, quantity: qty, total_cost: +(qty * m.cost_per_unit).toFixed(2), total_price: +(qty * m.price_per_unit).toFixed(2) } : m));
    };
    const saveMaterials = async () => {
        try {
            await Promise.all(materials.filter(m => !m.isNew).map(m =>
                supabase.from('t_project_material_usage').update({ quantity: m.quantity }).eq('id', m.id)
            ));
            toast('Materialmengen gespeichert');
            loadProjectData(selectedProjectId);
        } catch { toast('Fehler beim Speichern', 'error'); }
    };
    const deleteMaterial = async (id: string) => {
        setMaterials(prev => prev.filter(m => m.id !== id));
        const { error } = await supabase.from('t_project_material_usage').delete().eq('id', id);
        if (error) { toast('Fehler beim Löschen', 'error'); loadProjectData(selectedProjectId); }
    };

    // ---- VEHICLE COST CRUD ----
    const addVehicleCost = async () => {
        if (!addVehForm.vehicle_id || !selectedProjectId) return;
        try {
            const total = +(addVehForm.usage_value * addVehForm.cost_per_unit).toFixed(2);
            const { error } = await supabase.from('t_project_vehicle_costs').insert({
                project_id: selectedProjectId, vehicle_id: addVehForm.vehicle_id, usage_type: addVehForm.usage_type,
                usage_value: addVehForm.usage_value, cost_per_unit: addVehForm.cost_per_unit, total_cost: total, notes: addVehForm.notes || null,
            });
            if (error) throw error;
            setAddVehModal(false);
            toast('Fahrzeugkosten hinzugefügt');
            loadProjectData(selectedProjectId);
        } catch { toast('Fehler beim Hinzufügen', 'error'); }
    };
    const updateVehicleCost = (id: string, field: string, value: any) => {
        setVehicles(prev => prev.map(v => {
            if (v.id !== id) return v;
            const updated = { ...v, [field]: value };
            updated.total_cost = +(updated.usage_value * updated.cost_per_unit).toFixed(2);
            return updated;
        }));
    };
    const saveVehicleCosts = async () => {
        try {
            await Promise.all(vehicles.map(v =>
                supabase.from('t_project_vehicle_costs').update({ usage_type: v.usage_type, usage_value: v.usage_value, cost_per_unit: v.cost_per_unit, total_cost: v.total_cost, notes: v.notes }).eq('id', v.id)
            ));
            toast('Fahrzeugkosten gespeichert');
            loadProjectData(selectedProjectId);
        } catch { toast('Fehler beim Speichern', 'error'); }
    };
    const deleteVehicleCost = async (id: string) => {
        setVehicles(prev => prev.filter(v => v.id !== id));
        const { error } = await supabase.from('t_project_vehicle_costs').delete().eq('id', id);
        if (error) { toast('Fehler beim Löschen', 'error'); loadProjectData(selectedProjectId); }
    };

    // ---- SERVICE COST CRUD ----
    const addServiceCost = async () => {
        if (!addSvcForm.service_id || !selectedProjectId) return;
        try {
            const { error } = await supabase.from('t_project_service_usage').insert({
                project_id: selectedProjectId, service_id: addSvcForm.service_id,
                quantity: addSvcForm.quantity, supplier: addSvcForm.supplier || null,
            });
            if (error) throw error;
            setAddSvcModal(false);
            toast('Leistung hinzugefügt');
            loadProjectData(selectedProjectId);
        } catch { toast('Fehler beim Hinzufügen', 'error'); }
    };
    const deleteServiceCost = async (id: string) => {
        setServices(prev => prev.filter(s => s.id !== id));
        const { error } = await supabase.from('t_project_service_usage').delete().eq('id', id);
        if (error) { toast('Fehler beim Löschen', 'error'); loadProjectData(selectedProjectId); }
    };

    // ---- EXTRA COSTS CRUD ----
    const addExtraCost = async () => {
        if (!selectedProjectId || !addExtraForm.description) return;
        try {
            const { error } = await supabase.from('t_project_costs_extra').insert({
                project_id: selectedProjectId, cost_type: addExtraForm.cost_type,
                description: addExtraForm.description, cost: addExtraForm.cost,
            });
            if (error) throw error;
            setAddExtraModal(false);
            toast('Sonderkosten hinzugefügt');
            loadProjectData(selectedProjectId);
        } catch { toast('Fehler beim Hinzufügen', 'error'); }
    };
    const updateExtraCost = (costId: string, field: string, value: any) => {
        setExtraCosts(prev => prev.map(e => e.cost_id === costId ? { ...e, [field]: value } : e));
    };
    const saveExtraCosts = async () => {
        try {
            await Promise.all(extraCosts.map(e =>
                supabase.from('t_project_costs_extra').update({ cost_type: e.cost_type, description: e.description, cost: e.cost }).eq('cost_id', e.cost_id)
            ));
            toast('Sonderkosten gespeichert');
            loadProjectData(selectedProjectId);
        } catch { toast('Fehler beim Speichern', 'error'); }
    };
    const deleteExtraCost = async (costId: string) => {
        setExtraCosts(prev => prev.filter(e => e.cost_id !== costId));
        const { error } = await supabase.from('t_project_costs_extra').delete().eq('cost_id', costId);
        if (error) { toast('Fehler beim Löschen', 'error'); loadProjectData(selectedProjectId); }
    };

    // ---- DISCOUNT CRUD ----
    const addDiscountRow = () => {
        setDiscounts(prev => [...prev, { discount_id: `temp-${Date.now()}`, discount_type: 'flat', label: '', value: 0, isNew: true }]);
    };
    const updateDiscount = (id: string, field: keyof DiscountRow, value: any) => {
        setDiscounts(prev => prev.map(d => d.discount_id === id ? { ...d, [field]: value } : d));
    };
    const saveDiscounts = async () => {
        if (!selectedProjectId) return;
        try {
            await Promise.all(discounts.map(d => {
                const record = { project_id: selectedProjectId, discount_type: d.discount_type, label: d.label, value: d.value };
                return d.isNew || d.discount_id.startsWith('temp-')
                    ? supabase.from('t_project_discounts').insert(record)
                    : supabase.from('t_project_discounts').update(record).eq('discount_id', d.discount_id);
            }));
            toast('Rabatte gespeichert');
            loadProjectData(selectedProjectId);
        } catch { toast('Fehler beim Speichern', 'error'); }
    };
    const deleteDiscount = async (id: string) => {
        if (id.startsWith('temp-')) { setDiscounts(prev => prev.filter(d => d.discount_id !== id)); return; }
        setDiscounts(prev => prev.filter(d => d.discount_id !== id));
        const { error } = await supabase.from('t_project_discounts').delete().eq('discount_id', id);
        if (error) { toast('Fehler beim Löschen', 'error'); loadProjectData(selectedProjectId); }
    };

    // ---- REVENUE CRUD ----
    const addRevenueRow = () => { setRevenue(prev => [...prev, { id: `temp-${Date.now()}`, position_label: '', qty: 1, unit: 'Std', unit_price: 0, line_total: 0, kind: 'manual', isNew: true }]); };
    const updateRevenue = (id: string, field: keyof RevenueRow, value: any) => {
        setRevenue(prev => prev.map(r => {
            if (r.id !== id) return r;
            const updated = { ...r, [field]: value };
            if (field === 'qty' || field === 'unit_price') updated.line_total = +((updated.qty || 0) * (updated.unit_price || 0)).toFixed(2);
            return updated;
        }));
    };
    const saveRevenue = async () => {
        if (!selectedProjectId) return;
        try {
            await Promise.all(revenue.map(r => {
                const record = { project_id: selectedProjectId, position_label: r.position_label, qty: r.qty, unit: r.unit, unit_price: r.unit_price, line_total: r.line_total, kind: r.kind };
                return r.isNew || r.id.startsWith('temp-')
                    ? supabase.from('t_project_revenue_items').insert(record)
                    : supabase.from('t_project_revenue_items').update(record).eq('id', r.id);
            }));
            toast('Erlöse gespeichert');
            loadProjectData(selectedProjectId);
        } catch { toast('Fehler beim Speichern', 'error'); }
    };
    const deleteRevenue = async (id: string) => {
        if (id.startsWith('temp-')) { setRevenue(prev => prev.filter(r => r.id !== id)); return; }
        setRevenue(prev => prev.filter(r => r.id !== id));
        const { error } = await supabase.from('t_project_revenue_items').delete().eq('id', id);
        if (error) { toast('Fehler beim Löschen', 'error'); loadProjectData(selectedProjectId); }
    };

    // ---- EXPORT ----
    const exportHTML = () => {
        const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Nachkalkulation – ${selectedProject?.name || ''}</title>
        <style>body{font-family:system-ui;margin:2rem;color:#1e293b}h1{font-size:1.5rem}h2{margin-top:1.5rem;font-size:1.1rem;border-bottom:2px solid #e2e8f0;padding-bottom:4px}table{width:100%;border-collapse:collapse;margin:.5rem 0}th,td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left;font-size:.8rem}th{background:#f1f5f9;font-weight:600}.right{text-align:right}.kpi{display:flex;gap:1rem;margin:1rem 0}.kpi-card{flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:.75rem;text-align:center}.kpi-label{font-size:.7rem;color:#64748b;text-transform:uppercase}.kpi-value{font-size:1.3rem;font-weight:700;margin-top:2px}.positive{color:#16a34a}.negative{color:#dc2626}</style></head><body>
        <h1>Nachkalkulation: ${selectedProject?.anrede || ''} ${selectedProject?.name || ''}</h1>
        <p>${selectedProject?.strasse || ''} ${selectedProject?.nr || ''}, ${selectedProject?.plz || ''} ${selectedProject?.ort || ''}</p>
        <div class="kpi"><div class="kpi-card"><div class="kpi-label">Gesamtkosten</div><div class="kpi-value">${eur(totalCosts)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Gesamterlöse</div><div class="kpi-value">${eur(totalRevenue)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Marge</div><div class="kpi-value ${margin >= 0 ? 'positive' : 'negative'}">${eur(margin)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Marge %</div><div class="kpi-value ${marginPct >= 0 ? 'positive' : 'negative'}">${marginPct.toFixed(1)}%</div></div></div>
        <h2>1. Personalkosten (${eur(personalKosten)})</h2><table><tr><th>Datum</th><th>Mitarbeiter</th><th>LiS Std.</th><th class="right">Satz</th><th class="right">Kosten</th></tr>
        ${personnel.map(p => `<tr><td>${p.datum}</td><td>${p.mitarbeiter}</td><td>${p.lis_stunden.toFixed(2)}</td><td class="right">${eur(p.satz)}</td><td class="right">${eur(p.kosten)}</td></tr>`).join('')}
        <tr><th colspan="4">Summe</th><th class="right">${eur(personalKosten)}</th></tr></table>
        <h2>2. Materialkosten (${eur(materialKosten)})</h2><table><tr><th>Material</th><th>Menge</th><th>Einheit</th><th class="right">EK</th><th class="right">Kosten</th></tr>
        ${materials.map(m => `<tr><td>${m.material_name}</td><td>${m.quantity}</td><td>${m.unit}</td><td class="right">${eur(m.cost_per_unit)}</td><td class="right">${eur(m.total_cost)}</td></tr>`).join('')}
        <tr><th colspan="4">Summe</th><th class="right">${eur(materialKosten)}</th></tr></table>
        <h2>3. Fahrzeugkosten (${eur(vehicleKosten)})</h2><table><tr><th>Fahrzeug</th><th>Typ</th><th>Wert</th><th class="right">Satz</th><th class="right">Kosten</th></tr>
        ${vehicles.map(v => `<tr><td>${v.fahrzeug}</td><td>${v.usage_type}</td><td>${v.usage_value}</td><td class="right">${eur(v.cost_per_unit)}</td><td class="right">${eur(v.total_cost)}</td></tr>`).join('')}
        <tr><th colspan="4">Summe</th><th class="right">${eur(vehicleKosten)}</th></tr></table>
        <h2>4. Dienstleistungskosten (${eur(serviceKosten)})</h2><table><tr><th>Leistung</th><th>Lieferant</th><th>Menge</th><th class="right">EK</th><th class="right">Kosten</th></tr>
        ${services.map(s => `<tr><td>${s.service_name}</td><td>${s.supplier}</td><td>${s.quantity}</td><td class="right">${eur(s.cost_per_unit)}</td><td class="right">${eur(s.total_cost)}</td></tr>`).join('')}
        <tr><th colspan="4">Summe</th><th class="right">${eur(serviceKosten)}</th></tr></table>
        <h2>5. Erlöse (${eur(revenueTotal)})</h2><table><tr><th>Position</th><th>Menge</th><th>Einheit</th><th class="right">Preis</th><th class="right">Gesamt</th></tr>
        ${revenue.map(r => `<tr><td>${r.position_label}</td><td>${r.qty}</td><td>${r.unit}</td><td class="right">${eur(r.unit_price)}</td><td class="right">${eur(r.line_total)}</td></tr>`).join('')}
        <tr><th colspan="4">Summe Erlöse</th><th class="right">${eur(revenueTotal)}</th></tr></table>
        </body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `Nachkalkulation_${selectedProject?.name || 'Projekt'}.html`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex h-full flex-col bg-slate-50">
            <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <Calculator className="h-6 w-6 text-slate-700" />
                    <h1 className="text-2xl font-bold text-slate-800">Nachkalkulation</h1>
                </div>
                <div className="flex items-center gap-3">
                    <select className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium min-w-[300px]"
                        value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                        <option value="">Projekt auswählen...</option>
                        {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_code || '—'} | {p.name || 'Unbenannt'} | {p.ort || ''}</option>)}
                    </select>
                    {selectedProject && <button onClick={exportHTML} className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 shadow-sm"><FileText className="h-4 w-4" /> Export</button>}
                </div>
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
            ) : !selectedProject ? (
                <div className="flex-1 flex items-center justify-center text-slate-400"><div className="text-center"><Calculator className="h-16 w-16 mx-auto mb-4 opacity-30" /><p className="text-lg">Wähle ein Projekt aus, um die Kalkulation zu starten.</p></div></div>
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
                                    <th className="px-4 py-2 text-right">LiS Std.</th><th className="px-4 py-2 text-right">Kd Std.</th><th className="px-4 py-2 text-right">Satz</th><th className="px-4 py-2 text-right">Kosten</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {personnel.length === 0 ? <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Keine Zeitpaare</td></tr> : personnel.map(p => (
                                    <tr key={p.pair_id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 text-slate-600">{p.datum}</td><td className="px-4 py-2 font-medium">{p.mitarbeiter}</td><td className="px-4 py-2 text-slate-500">{p.role || '—'}</td>
                                        <td className="px-4 py-2 text-right font-mono">{p.lis_stunden.toFixed(2)}</td><td className="px-4 py-2 text-right font-mono text-slate-500">{p.kunden_stunden.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right">{eur(p.satz)}</td><td className="px-4 py-2 text-right font-semibold">{eur(p.kosten)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CostSection>

                    {/* Material Costs */}
                    <CostSection title="Materialkosten" icon={<Package className="h-5 w-5" />} total={materialKosten} color="amber"
                        actions={<div className="flex gap-2">
                            <button onClick={() => { setAddMatForm({ material_id: '', quantity: 1 }); setAddMatModal(true); }} className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900"><Plus className="h-3.5 w-3.5" /> Material</button>
                            <button onClick={saveMaterials} className="flex items-center gap-1 text-xs bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700"><Save className="h-3.5 w-3.5" /> Speichern</button>
                        </div>}>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                                <tr><th className="px-4 py-2 text-left">Material</th><th className="px-4 py-2 text-right w-24">Menge</th><th className="px-4 py-2 text-left">Einheit</th>
                                    <th className="px-4 py-2 text-right">EK/Einheit</th><th className="px-4 py-2 text-right">VK/Einheit</th><th className="px-4 py-2 text-right">Kosten</th><th className="px-4 py-2 text-right">Erlöse</th><th className="w-10"></th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {materials.length === 0 ? <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Keine Materialien</td></tr> : materials.map(m => (
                                    <tr key={m.id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-2 font-medium">{m.material_name}</td>
                                        <td className="px-4 py-1.5"><input type="number" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm text-right" value={m.quantity} onChange={e => updateMaterialQty(m.id, +e.target.value)} /></td>
                                        <td className="px-4 py-2 text-slate-500">{m.unit}</td>
                                        <td className="px-4 py-2 text-right">{eur(m.cost_per_unit)}</td><td className="px-4 py-2 text-right">{eur(m.price_per_unit)}</td>
                                        <td className="px-4 py-2 text-right font-semibold">{eur(m.total_cost)}</td><td className="px-4 py-2 text-right text-green-700">{eur(m.total_price)}</td>
                                        <td className="px-2"><button onClick={() => deleteMaterial(m.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CostSection>

                    {/* Vehicle Costs */}
                    <CostSection title="Fahrzeugkosten" icon={<Truck className="h-5 w-5" />} total={vehicleKosten} color="sky"
                        actions={<div className="flex gap-2">
                            <button onClick={() => { setAddVehForm({ vehicle_id: '', usage_type: 'km', usage_value: 0, cost_per_unit: 0, notes: '' }); setAddVehModal(true); }} className="flex items-center gap-1 text-xs text-sky-700 hover:text-sky-900"><Plus className="h-3.5 w-3.5" /> Fahrzeug</button>
                            <button onClick={saveVehicleCosts} className="flex items-center gap-1 text-xs bg-sky-600 text-white px-2 py-1 rounded hover:bg-sky-700"><Save className="h-3.5 w-3.5" /> Speichern</button>
                        </div>}>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                                <tr><th className="px-4 py-2 text-left">Fahrzeug</th><th className="px-4 py-2 w-20">Typ</th><th className="px-4 py-2 text-right w-24">Wert</th><th className="px-4 py-2 text-right w-28">Satz (€)</th><th className="px-4 py-2 text-right">Kosten</th><th className="w-10"></th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vehicles.length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Keine Fahrzeugkosten</td></tr> : vehicles.map(v => (
                                    <tr key={v.id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-2 font-medium">{v.fahrzeug}</td>
                                        <td className="px-4 py-1.5"><select className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-1 py-1 text-sm" value={v.usage_type} onChange={e => updateVehicleCost(v.id, 'usage_type', e.target.value)}><option value="km">km</option><option value="Std">Std</option><option value="Tag">Tag</option><option value="Pauschal">Pauschal</option></select></td>
                                        <td className="px-4 py-1.5"><input type="number" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm text-right" value={v.usage_value} onChange={e => updateVehicleCost(v.id, 'usage_value', +e.target.value)} /></td>
                                        <td className="px-4 py-1.5"><input type="number" step="0.01" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm text-right" value={v.cost_per_unit} onChange={e => updateVehicleCost(v.id, 'cost_per_unit', +e.target.value)} /></td>
                                        <td className="px-4 py-2 text-right font-semibold">{eur(v.total_cost)}</td>
                                        <td className="px-2"><button onClick={() => deleteVehicleCost(v.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CostSection>

                    {/* Service Costs */}
                    <CostSection title="Dienstleistungskosten" icon={<Wrench className="h-5 w-5" />} total={serviceKosten} color="purple"
                        actions={<button onClick={() => { setAddSvcForm({ service_id: '', quantity: 1, unit: 'Std', cost_per_unit: 0, supplier: '' }); setAddSvcModal(true); }} className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900"><Plus className="h-3.5 w-3.5" /> Leistung</button>}>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                                <tr><th className="px-4 py-2 text-left">Leistung</th><th className="px-4 py-2 text-left">Lieferant</th><th className="px-4 py-2 text-right">Menge</th><th className="px-4 py-2 text-right">EK/Einheit</th><th className="px-4 py-2 text-right">Kosten</th><th className="w-10"></th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {services.length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Keine Dienstleistungen</td></tr> : services.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-2 font-medium">{s.service_name}</td><td className="px-4 py-2 text-slate-500">{s.supplier || '—'}</td>
                                        <td className="px-4 py-2 text-right font-mono">{s.quantity}</td><td className="px-4 py-2 text-right">{eur(s.cost_per_unit)}</td><td className="px-4 py-2 text-right font-semibold">{eur(s.total_cost)}</td>
                                        <td className="px-2"><button onClick={() => deleteServiceCost(s.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CostSection>

                    {/* Extra Costs */}
                    <CostSection title="Sonderkosten" icon={<AlertCircle className="h-5 w-5" />} total={extraKosten} color="amber"
                        actions={<div className="flex gap-2">
                            <button onClick={() => { setAddExtraForm({ cost_type: 'Sonstiges', description: '', cost: 0 }); setAddExtraModal(true); }} className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900"><Plus className="h-3.5 w-3.5" /> Kosten</button>
                            <button onClick={saveExtraCosts} className="flex items-center gap-1 text-xs bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700"><Save className="h-3.5 w-3.5" /> Speichern</button>
                        </div>}>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                                <tr><th className="px-4 py-2 text-left">Typ</th><th className="px-4 py-2 text-left">Beschreibung</th><th className="px-4 py-2 text-right w-32">Betrag (€)</th><th className="w-10"></th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {extraCosts.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Keine Sonderkosten</td></tr> : extraCosts.map(e => (
                                    <tr key={e.cost_id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-1.5"><select className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm" value={e.cost_type} onChange={ev => updateExtraCost(e.cost_id, 'cost_type', ev.target.value)}>
                                            <option value="Maut">Maut</option><option value="Parkgebühr">Parkgebühr</option><option value="Entsorgung">Entsorgung</option><option value="Verpackung">Verpackung</option><option value="Sonstiges">Sonstiges</option>
                                        </select></td>
                                        <td className="px-4 py-1.5"><input className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm" value={e.description} onChange={ev => updateExtraCost(e.cost_id, 'description', ev.target.value)} placeholder="Beschreibung..." /></td>
                                        <td className="px-4 py-1.5"><input type="number" step="0.01" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm text-right" value={e.cost} onChange={ev => updateExtraCost(e.cost_id, 'cost', +ev.target.value)} /></td>
                                        <td className="px-2"><button onClick={() => deleteExtraCost(e.cost_id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CostSection>

                    {/* Discounts */}
                    <CostSection title="Rabatte / Nachlässe" icon={<Percent className="h-5 w-5" />} total={discountTotal} color="purple"
                        actions={<div className="flex gap-2">
                            <button onClick={addDiscountRow} className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900"><Plus className="h-3.5 w-3.5" /> Rabatt</button>
                            <button onClick={saveDiscounts} className="flex items-center gap-1 text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"><Save className="h-3.5 w-3.5" /> Speichern</button>
                        </div>}>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                                <tr><th className="px-4 py-2 text-left">Bezeichnung</th><th className="px-4 py-2 w-24">Typ</th><th className="px-4 py-2 text-right w-32">Wert (€)</th><th className="w-10"></th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {discounts.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Keine Rabatte</td></tr> : discounts.map(d => (
                                    <tr key={d.discount_id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-1.5"><input className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm" value={d.label} onChange={e => updateDiscount(d.discount_id, 'label', e.target.value)} placeholder="Beschreibung..." /></td>
                                        <td className="px-4 py-1.5"><select className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-1 py-1 text-sm" value={d.discount_type} onChange={e => updateDiscount(d.discount_id, 'discount_type', e.target.value)}><option value="flat">Pauschal</option><option value="percent">Prozent</option></select></td>
                                        <td className="px-4 py-1.5"><input type="number" step="0.01" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm text-right" value={d.value} onChange={e => updateDiscount(d.discount_id, 'value', +e.target.value)} /></td>
                                        <td className="px-2"><button onClick={() => deleteDiscount(d.discount_id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CostSection>

                    {/* Revenue */}
                    <CostSection title="Erlöse (Rechnungspositionen)" icon={<TrendingUp className="h-5 w-5" />} total={revenueTotal} color="green"
                        actions={<div className="flex gap-2">
                            <button onClick={addRevenueRow} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900"><Plus className="h-3.5 w-3.5" /> Zeile</button>
                            <button onClick={saveRevenue} className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"><Save className="h-3.5 w-3.5" /> Speichern</button>
                        </div>}>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                                <tr><th className="px-4 py-2 text-left">Position</th><th className="px-4 py-2 text-right w-20">Menge</th><th className="px-4 py-2 w-20">Einheit</th><th className="px-4 py-2 text-right w-28">Preis/Einheit</th><th className="px-4 py-2 text-right w-28">Gesamt</th><th className="w-10"></th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {revenue.length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Keine Erlöse</td></tr> : revenue.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-1.5"><input className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm" value={r.position_label} onChange={e => updateRevenue(r.id, 'position_label', e.target.value)} placeholder="Position..." /></td>
                                        <td className="px-4 py-1.5"><input type="number" step="0.01" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm text-right" value={r.qty} onChange={e => updateRevenue(r.id, 'qty', +e.target.value)} /></td>
                                        <td className="px-4 py-1.5"><input className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm" value={r.unit} onChange={e => updateRevenue(r.id, 'unit', e.target.value)} /></td>
                                        <td className="px-4 py-1.5"><input type="number" step="0.01" className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 text-sm text-right" value={r.unit_price} onChange={e => updateRevenue(r.id, 'unit_price', +e.target.value)} /></td>
                                        <td className="px-4 py-2 text-right font-semibold text-green-700">{eur(r.line_total)}</td>
                                        <td className="px-2"><button onClick={() => deleteRevenue(r.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CostSection>
                </div>
            )}

            {/* ======= ADD MATERIAL MODAL ======= */}
            {addMatModal && <Modal title="Material hinzufügen" onClose={() => setAddMatModal(false)} onSave={addMaterial} disabled={!addMatForm.material_id}>
                <div className="space-y-3">
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Material</label>
                        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addMatForm.material_id} onChange={e => setAddMatForm({ ...addMatForm, material_id: e.target.value })}>
                            <option value="">Wählen...</option>
                            {materialCatalog.map((m: any) => <option key={m.material_id} value={m.material_id}>{m.name} ({m.unit})</option>)}
                        </select></div>
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Menge</label>
                        <input type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addMatForm.quantity} onChange={e => setAddMatForm({ ...addMatForm, quantity: +e.target.value })} /></div>
                </div>
            </Modal>}

            {/* ======= ADD VEHICLE COST MODAL ======= */}
            {addVehModal && <Modal title="Fahrzeugkosten hinzufügen" onClose={() => setAddVehModal(false)} onSave={addVehicleCost} disabled={!addVehForm.vehicle_id}>
                <div className="space-y-3">
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Fahrzeug</label>
                        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addVehForm.vehicle_id} onChange={e => setAddVehForm({ ...addVehForm, vehicle_id: e.target.value })}>
                            <option value="">Wählen...</option>
                            {vehicleCatalog.map((v: any) => <option key={v.vehicle_id} value={v.vehicle_id}>{v.nickname || v.vehicle_id}</option>)}
                        </select></div>
                    <div className="grid grid-cols-3 gap-3">
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">Typ</label>
                            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addVehForm.usage_type} onChange={e => setAddVehForm({ ...addVehForm, usage_type: e.target.value })}>
                                <option value="km">km</option><option value="Std">Std</option><option value="Tag">Tag</option><option value="Pauschal">Pauschal</option>
                            </select></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">Wert</label>
                            <input type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addVehForm.usage_value} onChange={e => setAddVehForm({ ...addVehForm, usage_value: +e.target.value })} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">Satz (€)</label>
                            <input type="number" step="0.01" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addVehForm.cost_per_unit} onChange={e => setAddVehForm({ ...addVehForm, cost_per_unit: +e.target.value })} /></div>
                    </div>
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Notizen</label>
                        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addVehForm.notes} onChange={e => setAddVehForm({ ...addVehForm, notes: e.target.value })} /></div>
                </div>
            </Modal>}

            {/* ======= ADD SERVICE MODAL ======= */}
            {addSvcModal && <Modal title="Dienstleistung hinzufügen" onClose={() => setAddSvcModal(false)} onSave={addServiceCost} disabled={!addSvcForm.service_id}>
                <div className="space-y-3">
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Leistung</label>
                        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addSvcForm.service_id} onChange={e => setAddSvcForm({ ...addSvcForm, service_id: e.target.value })}>
                            <option value="">Wählen...</option>
                            {serviceCatalog.map((s: any) => <option key={s.service_id} value={s.service_id}>{s.name}</option>)}
                        </select></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">Menge</label>
                            <input type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addSvcForm.quantity} onChange={e => setAddSvcForm({ ...addSvcForm, quantity: +e.target.value })} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">Lieferant</label>
                            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addSvcForm.supplier} onChange={e => setAddSvcForm({ ...addSvcForm, supplier: e.target.value })} /></div>
                    </div>
                </div>
            </Modal>}

            {/* ======= ADD EXTRA COST MODAL ======= */}
            {addExtraModal && <Modal title="Sonderkosten hinzufügen" onClose={() => setAddExtraModal(false)} onSave={addExtraCost} disabled={!addExtraForm.description}>
                <div className="space-y-3">
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Typ</label>
                        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addExtraForm.cost_type} onChange={e => setAddExtraForm({ ...addExtraForm, cost_type: e.target.value })}>
                            <option value="Maut">Maut</option><option value="Parkgebühr">Parkgebühr</option><option value="Entsorgung">Entsorgung</option><option value="Verpackung">Verpackung</option><option value="Sonstiges">Sonstiges</option>
                        </select></div>
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Beschreibung</label>
                        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addExtraForm.description} onChange={e => setAddExtraForm({ ...addExtraForm, description: e.target.value })} placeholder="z.B. Autobahnmaut A3" /></div>
                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Betrag (€)</label>
                        <input type="number" step="0.01" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={addExtraForm.cost} onChange={e => setAddExtraForm({ ...addExtraForm, cost: +e.target.value })} /></div>
                </div>
            </Modal>}
        </div>
    );
}

// -- Helper Components --
function KpiCard({ label, value, icon, color, bgColor }: { label: string; value: string; icon: React.ReactNode; color: string; bgColor: string }) {
    return (<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span><div className={cn('p-2 rounded-lg', bgColor, color)}>{icon}</div></div>
        <div className={cn('text-2xl font-bold', color)}>{value}</div>
    </div>);
}

function CostSection({ title, icon, total, color, children, actions }: { title: string; icon: React.ReactNode; total: number; color: string; children: React.ReactNode; actions?: React.ReactNode }) {
    const colorMap: Record<string, string> = { blue: 'border-l-blue-500', amber: 'border-l-amber-500', sky: 'border-l-sky-500', green: 'border-l-green-500', purple: 'border-l-purple-500', red: 'border-l-red-500', orange: 'border-l-orange-500' };
    return (<div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-l-4', colorMap[color] || 'border-l-slate-300')}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">{icon}<span className="font-semibold">{title}</span></div>
            <div className="flex items-center gap-4">{actions}<span className="text-lg font-bold text-slate-800">{eur(total)}</span></div>
        </div>{children}
    </div>);
}

function Modal({ title, onClose, onSave, disabled, children }: { title: string; onClose: () => void; onSave: () => void; disabled?: boolean; children: React.ReactNode }) {
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-6 py-4"><h2 className="text-lg font-bold text-slate-800">{title}</h2><button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button></div>
            <div className="p-6">{children}</div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-300 hover:bg-slate-50">Abbrechen</button>
                <button onClick={onSave} disabled={disabled} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"><Save className="h-4 w-4" /> Hinzufügen</button>
            </div>
        </div>
    </div>);
}
