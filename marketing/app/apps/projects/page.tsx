'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
    Search, Plus, Pencil, Trash2, X, Save, Loader2,
    ChevronDown, FolderKanban, MapPin, Phone, Mail, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Project = Database['public']['Tables']['t_projects']['Row'];
type ProjectInsert = Database['public']['Tables']['t_projects']['Insert'];

const SERVICE_TYPES = ['Umzug', 'Entrümpelung', 'Transport', 'Einlagerung', 'Sonstiges'];
const STATUS_OPTIONS = ['In Planung', 'Bestätigt', 'Abgeschlossen', 'Storniert'];
const ANREDE_OPTIONS = ['Herr', 'Frau', 'Firma', 'Herr und Frau'];

const STATUS_COLORS: Record<string, string> = {
    'In Planung': 'bg-yellow-100 text-yellow-800',
    'Bestätigt': 'bg-green-100 text-green-800',
    'Abgeschlossen': 'bg-blue-100 text-blue-800',
    'Storniert': 'bg-red-100 text-red-800',
};

const SERVICE_COLORS: Record<string, string> = {
    'Umzug': 'bg-emerald-100 text-emerald-800',
    'Entrümpelung': 'bg-amber-100 text-amber-800',
    'Transport': 'bg-sky-100 text-sky-800',
    'Einlagerung': 'bg-violet-100 text-violet-800',
    'Sonstiges': 'bg-slate-100 text-slate-700',
};

const empty: ProjectInsert = {
    anrede: '', name: '', strasse: '', nr: '', plz: '', ort: '',
    telefon: '', email: '', notes: '', status: 'In Planung',
    dienstleistungen: '', offer_type: '', project_date: '', project_time: '',
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterService, setFilterService] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectInsert>(empty);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        let query = supabase.from('t_projects').select('*').order('created_at', { ascending: false }).limit(200);

        if (filterStatus) query = query.eq('status', filterStatus);
        if (filterService) query = query.ilike('dienstleistungen', `%${filterService}%`);
        if (search) {
            query = query.or(`name.ilike.%${search}%,ort.ilike.%${search}%,project_code.ilike.%${search}%,plz.ilike.%${search}%`);
        }

        const { data } = await query;
        setProjects(data || []);
        setLoading(false);
    }, [search, filterService, filterStatus]);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const openCreate = () => {
        setEditingProject({ ...empty });
        setIsEditing(false);
        setModalOpen(true);
    };

    const openEdit = (p: Project) => {
        setEditingProject({
            project_id: p.project_id,
            project_code: p.project_code,
            anrede: p.anrede || '',
            name: p.name || '',
            strasse: p.strasse || '',
            nr: p.nr || '',
            plz: p.plz || '',
            ort: p.ort || '',
            telefon: p.telefon || '',
            email: p.email || '',
            notes: p.notes || '',
            status: p.status || 'In Planung',
            dienstleistungen: p.dienstleistungen || '',
            offer_type: p.offer_type || '',
            project_date: p.project_date || '',
            project_time: p.project_time || '',
            project_start_date: p.project_start_date || '',
            project_end_date: p.project_end_date || '',
        });
        setIsEditing(true);
        setModalOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (isEditing && editingProject.project_id) {
                const { project_id, project_code, ...updateData } = editingProject;
                await supabase.from('t_projects').update(updateData).eq('project_id', project_id);
            } else {
                const { project_id, project_code, ...insertData } = editingProject;
                await supabase.from('t_projects').insert(insertData);
            }
            setModalOpen(false);
            fetchProjects();
        } catch (err) {
            console.error(err);
            alert('Fehler beim Speichern!');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Projekt wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) return;
        await supabase.from('t_projects').delete().eq('project_id', id);
        fetchProjects();
    };

    const setField = (key: keyof ProjectInsert, val: string) => {
        setEditingProject(prev => ({ ...prev, [key]: val }));
    };

    return (
        <div className="flex h-full flex-col bg-slate-50">
            {/* Header */}
            <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <FolderKanban className="h-6 w-6 text-slate-700" />
                    <h1 className="text-2xl font-bold text-slate-800">Projekte</h1>
                    <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {projects.length}
                    </span>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors">
                    <Plus className="h-4 w-4" /> Neues Projekt
                </button>
            </header>

            {/* Filters */}
            <div className="flex items-center gap-3 border-b bg-white px-6 py-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Suche nach Name, Ort, PLZ oder Projektnr..."
                        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={filterService} onChange={(e) => setFilterService(e.target.value)}>
                    <option value="">Alle Dienstleistungen</option>
                    {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">Alle Status</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Projektnr.</th>
                                <th className="px-4 py-3">Kunde</th>
                                <th className="px-4 py-3">Adresse</th>
                                <th className="px-4 py-3">Kontakt</th>
                                <th className="px-4 py-3">Dienstleistung</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Datum</th>
                                <th className="w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Projekte laden...
                                </td></tr>
                            ) : projects.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                                    Keine Projekte gefunden.
                                </td></tr>
                            ) : projects.map(p => (
                                <tr key={p.project_id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => openEdit(p)}>
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs text-slate-500">{p.project_code || '—'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">
                                            {p.anrede ? `${p.anrede} ` : ''}{p.name || 'Unbenannt'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <span className="truncate max-w-[200px]">
                                                {[p.strasse, p.nr].filter(Boolean).join(' ')}{p.strasse ? ', ' : ''}{p.plz} {p.ort}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {p.telefon && <div className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" />{p.telefon}</div>}
                                        {p.email && <div className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" />{p.email}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.dienstleistungen && (
                                            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', SERVICE_COLORS[p.dienstleistungen] || SERVICE_COLORS['Sonstiges'])}>
                                                {p.dienstleistungen}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[p.status || ''] || 'bg-slate-100 text-slate-600')}>
                                            {p.status || 'Unbekannt'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 text-xs">
                                        {p.project_date ? format(new Date(p.project_date), 'dd.MM.yyyy') : '—'}
                                    </td>
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                                            <button onClick={() => handleDelete(p.project_id)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-lg font-bold text-slate-800">{isEditing ? 'Projekt bearbeiten' : 'Neues Projekt'}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Kundendaten */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">Kundendaten</h3>
                                <div className="grid grid-cols-6 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Anrede</label>
                                        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.anrede || ''} onChange={e => setField('anrede', e.target.value)}>
                                            <option value="">—</option>
                                            {ANREDE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Name *</label>
                                        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.name || ''} onChange={e => setField('name', e.target.value)} placeholder="Nachname / Firma" />
                                    </div>
                                </div>
                            </div>
                            {/* Adresse */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">Adresse</h3>
                                <div className="grid grid-cols-6 gap-3">
                                    <div className="col-span-4">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Straße</label>
                                        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.strasse || ''} onChange={e => setField('strasse', e.target.value)} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Nr.</label>
                                        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.nr || ''} onChange={e => setField('nr', e.target.value)} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">PLZ</label>
                                        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.plz || ''} onChange={e => setField('plz', e.target.value)} />
                                    </div>
                                    <div className="col-span-4">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Ort</label>
                                        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.ort || ''} onChange={e => setField('ort', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            {/* Kontakt */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">Kontakt</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Telefon</label>
                                        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.telefon || ''} onChange={e => setField('telefon', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">E-Mail</label>
                                        <input type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.email || ''} onChange={e => setField('email', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            {/* Projektdetails */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">Projektdetails</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Dienstleistung</label>
                                        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.dienstleistungen || ''} onChange={e => setField('dienstleistungen', e.target.value)}>
                                            <option value="">—</option>
                                            {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.status || 'In Planung'} onChange={e => setField('status', e.target.value)}>
                                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Angebotsart</label>
                                        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.offer_type || ''} onChange={e => setField('offer_type', e.target.value)}>
                                            <option value="">—</option>
                                            <option value="Pauschal">Pauschal</option>
                                            <option value="Stundenlohn">Stundenlohn</option>
                                            <option value="Kostenvoranschlag">Kostenvoranschlag</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Projektdatum</label>
                                        <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.project_date || ''} onChange={e => setField('project_date', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Beginn (Mehrtag)</label>
                                        <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.project_start_date || ''} onChange={e => setField('project_start_date', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Ende (Mehrtag)</label>
                                        <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={editingProject.project_end_date || ''} onChange={e => setField('project_end_date', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            {/* Notizen */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Notizen</label>
                                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                                    rows={3} value={editingProject.notes || ''} onChange={e => setField('notes', e.target.value)} placeholder="Anmerkungen..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t px-6 py-4">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-300 hover:bg-slate-50">Abbrechen</button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isEditing ? 'Aktualisieren' : 'Erstellen'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
