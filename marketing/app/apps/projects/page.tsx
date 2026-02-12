'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/toast';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
    Search, Plus, Pencil, Trash2, X, Save, Loader2, ChevronDown,
    FolderKanban, MapPin, Phone, Mail, Filter, FileText, Clock, StickyNote,
    ChevronRight, ArrowLeft, Calendar, Tag, User, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Project = Database['public']['Tables']['t_projects']['Row'];
type ProjectInsert = Database['public']['Tables']['t_projects']['Insert'];

const SERVICE_TYPES = ['Umzug', 'Entrümpelung', 'Transport', 'Einlagerung', 'Malerarbeiten', 'Kartonlieferung', 'Sonstiges'];
const STATUS_OPTIONS = ['In Planung', 'Bestätigt', 'Abgeschlossen', 'Storniert'];
const ANREDE_OPTIONS = ['Herr', 'Frau', 'Firma', 'Herr und Frau'];

const STATUS_COLORS: Record<string, string> = {
    'In Planung': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Bestätigt': 'bg-green-100 text-green-800 border-green-200',
    'Abgeschlossen': 'bg-blue-100 text-blue-800 border-blue-200',
    'Storniert': 'bg-red-100 text-red-800 border-red-200',
};

const SERVICE_COLORS: Record<string, string> = {
    'Umzug': 'bg-emerald-100 text-emerald-800',
    'Entrümpelung': 'bg-amber-100 text-amber-800',
    'Transport': 'bg-sky-100 text-sky-800',
    'Einlagerung': 'bg-violet-100 text-violet-800',
    'Malerarbeiten': 'bg-pink-100 text-pink-800',
    'Kartonlieferung': 'bg-orange-100 text-orange-800',
    'Sonstiges': 'bg-slate-100 text-slate-700',
};

const empty: ProjectInsert = {
    anrede: '', name: '', strasse: '', nr: '', plz: '', ort: '',
    telefon: '', email: '', notes: '', status: 'In Planung',
    dienstleistungen: '', offer_type: '', project_date: '', project_time: '',
};

export default function ProjectsPage() {
    const { toast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterService, setFilterService] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectInsert>(empty);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Detail panel
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [detailTab, setDetailTab] = useState<'info' | 'notes' | 'history'>('info');
    const [projectNotes, setProjectNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    // Timeline data
    const [timePairs, setTimePairs] = useState<any[]>([]);
    const [planEntries, setPlanEntries] = useState<any[]>([]);

    const debouncedSearch = useDebounce(search, 300);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        let query = supabase.from('t_projects').select('*').order('created_at', { ascending: false }).limit(200);

        if (filterStatus) query = query.eq('status', filterStatus);
        if (filterService) query = query.ilike('dienstleistungen', `%${filterService}%`);
        if (debouncedSearch) {
            query = query.or(`name.ilike.%${debouncedSearch}%,ort.ilike.%${debouncedSearch}%,project_code.ilike.%${debouncedSearch}%,plz.ilike.%${debouncedSearch}%,strasse.ilike.%${debouncedSearch}%`);
        }

        const { data } = await query;
        setProjects(data || []);
        setLoading(false);
    }, [debouncedSearch, filterService, filterStatus]);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    // Load detail data when a project is selected
    const loadProjectDetail = async (project: Project) => {
        setSelectedProject(project);
        setProjectNotes(project.notes || '');
        setDetailTab('info');

        // Load time pairs for this project
        const { data: tp } = await supabase
            .from('t_time_pairs').select('*')
            .eq('project_id', project.project_id)
            .order('datum', { ascending: false }).limit(20);
        setTimePairs(tp || []);

        // Load plan entries for this project
        const { data: pe } = await supabase
            .from('t_morningplan').select('*, staff:t_morningplan_staff(*, employee:t_employees(name))')
            .eq('project_id', project.project_id)
            .order('plan_date', { ascending: false }).limit(20);
        setPlanEntries(pe || []);
    };

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
                const { error } = await supabase.from('t_projects').update(updateData).eq('project_id', project_id);
                if (error) throw error;
                toast('Projekt aktualisiert');
            } else {
                const { project_id, project_code, ...insertData } = editingProject;
                const { error } = await supabase.from('t_projects').insert(insertData);
                if (error) throw error;
                toast('Projekt erstellt');
            }
            setModalOpen(false);
            fetchProjects();
        } catch (err) {
            console.error(err);
            toast('Fehler beim Speichern', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Projekt wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) return;
        setProjects(prev => prev.filter(p => p.project_id !== id));
        if (selectedProject?.project_id === id) setSelectedProject(null);
        const { error } = await supabase.from('t_projects').delete().eq('project_id', id);
        if (error) { toast('Fehler beim Löschen', 'error'); fetchProjects(); }
    };

    // Inline status change from the table
    const handleStatusChange = async (projectId: string, newStatus: string) => {
        setProjects(prev => prev.map(p => p.project_id === projectId ? { ...p, status: newStatus } : p));
        if (selectedProject?.project_id === projectId) {
            setSelectedProject(prev => prev ? { ...prev, status: newStatus } : null);
        }
        const { error } = await supabase.from('t_projects').update({ status: newStatus }).eq('project_id', projectId);
        if (error) { toast('Status-Änderung fehlgeschlagen', 'error'); fetchProjects(); }
    };

    // Save notes from detail panel
    const handleSaveNotes = async () => {
        if (!selectedProject) return;
        setSavingNotes(true);
        const { error } = await supabase.from('t_projects').update({ notes: projectNotes }).eq('project_id', selectedProject.project_id);
        if (error) { toast('Fehler beim Speichern der Notizen', 'error'); }
        else {
            toast('Notizen gespeichert');
            setSelectedProject(prev => prev ? { ...prev, notes: projectNotes } : null);
            setProjects(prev => prev.map(p => p.project_id === selectedProject.project_id ? { ...p, notes: projectNotes } : p));
        }
        setSavingNotes(false);
    };

    const setField = (key: keyof ProjectInsert, val: string) => {
        setEditingProject(prev => ({ ...prev, [key]: val }));
    };

    return (
        <div className="flex h-full bg-slate-50">
            {/* Main Table Area */}
            <div className={cn("flex flex-col flex-1 transition-all duration-300", selectedProject ? "mr-0" : "")}>
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
                        <input type="text" placeholder="Suche nach Name, Ort, PLZ, Straße oder Projektnr..."
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
                                    <tr key={p.project_id}
                                        className={cn(
                                            "hover:bg-slate-50 group cursor-pointer transition-colors",
                                            selectedProject?.project_id === p.project_id && "bg-blue-50 hover:bg-blue-50"
                                        )}
                                        onClick={() => loadProjectDetail(p)}>
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
                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                            <select
                                                className={cn(
                                                    'text-xs font-medium px-2 py-1 rounded-full border cursor-pointer appearance-none text-center',
                                                    STATUS_COLORS[p.status || ''] || 'bg-slate-100 text-slate-600 border-slate-200'
                                                )}
                                                value={p.status || 'In Planung'}
                                                onChange={e => handleStatusChange(p.project_id, e.target.value)}>
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
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
            </div>

            {/* Detail Panel (slide-out) */}
            {selectedProject && (
                <div className="w-[420px] border-l border-slate-200 bg-white flex flex-col shadow-lg animate-in slide-in-from-right">
                    {/* Detail Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
                        <div className="flex items-center gap-2 min-w-0">
                            <button onClick={() => setSelectedProject(null)} className="p-1 rounded hover:bg-slate-200 text-slate-500">
                                <X className="h-4 w-4" />
                            </button>
                            <div className="min-w-0">
                                <h2 className="font-bold text-slate-800 truncate">
                                    {selectedProject.anrede ? `${selectedProject.anrede} ` : ''}{selectedProject.name}
                                </h2>
                                <span className="text-xs text-slate-500 font-mono">{selectedProject.project_code || '—'}</span>
                            </div>
                        </div>
                        <select
                            className={cn(
                                'text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer',
                                STATUS_COLORS[selectedProject.status || ''] || 'bg-slate-100 text-slate-600 border-slate-200'
                            )}
                            value={selectedProject.status || 'In Planung'}
                            onChange={e => handleStatusChange(selectedProject.project_id, e.target.value)}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Detail Tabs */}
                    <div className="flex border-b bg-white">
                        {(['info', 'notes', 'history'] as const).map(tab => (
                            <button key={tab} onClick={() => setDetailTab(tab)}
                                className={cn(
                                    'flex-1 px-3 py-2.5 text-xs font-medium transition-colors border-b-2',
                                    detailTab === tab ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'
                                )}>
                                {tab === 'info' && <><FileText className="h-3.5 w-3.5 inline mr-1" />Info</>}
                                {tab === 'notes' && <><StickyNote className="h-3.5 w-3.5 inline mr-1" />Notizen</>}
                                {tab === 'history' && <><Clock className="h-3.5 w-3.5 inline mr-1" />Verlauf</>}
                            </button>
                        ))}
                    </div>

                    {/* Detail Content */}
                    <div className="flex-1 overflow-auto">
                        {detailTab === 'info' && (
                            <div className="p-5 space-y-5">
                                {/* Customer */}
                                <section>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kunde</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-4 w-4 text-slate-400" />
                                            <span className="text-slate-800">{selectedProject.anrede ? `${selectedProject.anrede} ` : ''}{selectedProject.name}</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <div className="text-slate-800">{[selectedProject.strasse, selectedProject.nr].filter(Boolean).join(' ')}</div>
                                                <div className="text-slate-600">{selectedProject.plz} {selectedProject.ort}</div>
                                            </div>
                                        </div>
                                        {selectedProject.telefon && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4 text-slate-400" />
                                                <a href={`tel:${selectedProject.telefon}`} className="text-blue-600 hover:underline">{selectedProject.telefon}</a>
                                            </div>
                                        )}
                                        {selectedProject.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                <a href={`mailto:${selectedProject.email}`} className="text-blue-600 hover:underline">{selectedProject.email}</a>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Project Details */}
                                <section>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Projektdetails</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <DetailField label="Dienstleistung" value={selectedProject.dienstleistungen} />
                                        <DetailField label="Angebotsart" value={selectedProject.offer_type} />
                                        <DetailField label="Projektdatum" value={selectedProject.project_date ? format(new Date(selectedProject.project_date), 'dd.MM.yyyy') : null} />
                                        <DetailField label="Uhrzeit" value={selectedProject.project_time} />
                                        <DetailField label="Beginn" value={selectedProject.project_start_date ? format(new Date(selectedProject.project_start_date), 'dd.MM.yyyy') : null} />
                                        <DetailField label="Ende" value={selectedProject.project_end_date ? format(new Date(selectedProject.project_end_date), 'dd.MM.yyyy') : null} />
                                    </div>
                                </section>

                                {/* Quick Stats */}
                                <section>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Übersicht</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                            <div className="text-xs text-slate-500">Einsätze (Plan)</div>
                                            <div className="text-lg font-bold text-slate-800">{planEntries.length}</div>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                            <div className="text-xs text-slate-500">Zeitpaare</div>
                                            <div className="text-lg font-bold text-slate-800">{timePairs.length}</div>
                                        </div>
                                    </div>
                                </section>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => openEdit(selectedProject)}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm">
                                        <Pencil className="h-4 w-4" /> Bearbeiten
                                    </button>
                                    <button onClick={() => handleDelete(selectedProject.project_id)}
                                        className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" /> Löschen
                                    </button>
                                </div>
                            </div>
                        )}

                        {detailTab === 'notes' && (
                            <div className="p-5">
                                <textarea
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none min-h-[200px]"
                                    rows={8}
                                    value={projectNotes}
                                    onChange={e => setProjectNotes(e.target.value)}
                                    placeholder="Anmerkungen zum Projekt..."
                                />
                                <div className="flex justify-end mt-3">
                                    <button onClick={handleSaveNotes} disabled={savingNotes}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                                        {savingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Notizen speichern
                                    </button>
                                </div>
                            </div>
                        )}

                        {detailTab === 'history' && (
                            <div className="p-5 space-y-4">
                                {/* Plan entries */}
                                {planEntries.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Einsatzplanung</h3>
                                        <div className="space-y-2">
                                            {planEntries.map((pe: any) => (
                                                <div key={pe.plan_id} className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-slate-800">
                                                            {pe.plan_date ? format(new Date(pe.plan_date), 'dd.MM.yyyy (EEEE)', { locale: de }) : '—'}
                                                        </span>
                                                        <span className="text-xs text-slate-500">{pe.start_time?.substring(0, 5) || ''}</span>
                                                    </div>
                                                    {pe.vehicle_names && <div className="text-xs text-slate-600">🚛 {pe.vehicle_names}</div>}
                                                    {(pe.staff || []).length > 0 && (
                                                        <div className="text-xs text-slate-600 mt-1">
                                                            👥 {pe.staff.map((s: any) => s.employee?.name || '?').join(', ')}
                                                        </div>
                                                    )}
                                                    {pe.notes && <div className="text-xs text-slate-500 mt-1 italic">{pe.notes}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Time pairs */}
                                {timePairs.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Zeiterfassung</h3>
                                        <div className="space-y-1">
                                            {timePairs.map((tp: any) => (
                                                <div key={tp.pair_id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                                                    <div>
                                                        <span className="font-medium text-slate-800">{tp.mitarbeiter || '—'}</span>
                                                        <span className="text-xs text-slate-500 ml-2">
                                                            {tp.datum ? format(new Date(tp.datum), 'dd.MM.yy') : ''}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-600 font-mono">
                                                        {tp.lis_von?.substring(0, 5) || '—'} – {tp.lis_bis?.substring(0, 5) || '—'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {planEntries.length === 0 && timePairs.length === 0 && (
                                    <div className="text-center text-slate-400 py-8 text-sm">
                                        Noch keine Einträge für dieses Projekt.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

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

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <div className="text-xs text-slate-400 mb-0.5">{label}</div>
            <div className="text-sm text-slate-800">{value || '—'}</div>
        </div>
    );
}
