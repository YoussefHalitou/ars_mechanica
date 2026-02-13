import React, { useState } from 'react';
import { format } from 'date-fns';
import { Download, Loader2, Calendar, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';

export function PlanningExport() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            // 1. Fetch Data
            const [
                { data: plans },
                { data: vehicleStatuses },
                { data: employeeNotes },
                { data: employees }
            ] = await Promise.all([
                supabase.from('t_morningplan')
                    .select('*, project:t_projects(*), staff:t_morningplan_staff(*, employee:t_employees(*))')
                    .eq('plan_date', date),
                supabase.from('t_vehicle_daily_status')
                    .select('*')
                    .eq('plan_date', date),
                supabase.from('t_employee_daily_notes')
                    .select('*')
                    .eq('plan_date', date),
                supabase.from('t_employees').select('*')
            ]);

            const employeeMap = new Map(employees?.map(e => [e.employee_id, e]));

            // Helper to escape HTML
            const escapeHtml = (str: any) => {
                if (str == null) return '';
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            };

            // Prepare Data

            // Vehicles
            // Map statuses to a list. If we want all vehicles we might need to fetch t_vehicles too, 
            // but the retool snippet implies it only shows those with status/info.
            const vehicleRows = (vehicleStatuses || []).filter(v => v.status || v.informationen);

            // Cards
            const cards = (plans || []).map(p => {
                // Determine project name/address from joined project or plan fallback? 
                // schema: p.project is the joined object.
                const proj = p.project || {};

                // Map staff
                const teamMembers = (p.staff || []).map((s: any) => ({
                    employee_name: s.employee?.name || 'Unbekannt',
                    individual_start_time: s.individual_start_time,
                    member_notes: s.member_notes
                }));

                return {
                    anrede: proj.anrede,
                    name: proj.name,
                    strasse: proj.strasse,
                    nr: proj.nr,
                    plz: proj.plz,
                    ort: proj.ort,
                    telefon: proj.telefon,
                    service_type: p.service_type || proj.dienstleistungen,
                    notes: p.notes || proj.notes, // Plan notes priority?
                    start_time: p.start_time,
                    vehicle_name: p.vehicle_names, // or lookup vehicle_id?
                    offer_type: p.angebotsart || proj.offer_type,
                    plan_date: p.plan_date,
                    teamMembers
                };
            });

            // Employees
            // Join notes with employee names
            const notesWithNames = (employeeNotes || []).map(n => {
                let name = '';
                // Try to find employee by ID if available (schema check needed) or code
                // t_employee_daily_notes has employee_id and employee_code
                if (n.employee_id && employeeMap.has(n.employee_id)) {
                    name = employeeMap.get(n.employee_id)!.name;
                } else if (n.employee_code) {
                    const emp = employees?.find(e => e.employee_code === n.employee_code);
                    name = emp ? emp.name : n.employee_code;
                }
                const empObj = n.employee_id ? employeeMap.get(n.employee_id) : null;

                return {
                    name,
                    notizen: n.notizen,
                    is_external: empObj?.contract_type === 'Freelancer' || empObj?.role === 'Subunternehmer' // Simple heuristic
                };
            });

            const employeesInternal = notesWithNames.filter(e => !e.is_external);
            const employeesExternal = notesWithNames.filter(e => e.is_external);


            // CSS
            const css = `
            :root {
                --color-bg: #f5f5f8;
                --color-surface: #ffffff;
                --color-border: #d2d6e0;
                --color-border-strong: #a4a9b7;
                --color-text: #222333;
                --color-muted: #7a8090;
                --color-primary: #1f6feb;
                --color-primary-soft: #e4edff;
                --color-accent: #f59f00;
                --color-danger: #d64545;
                --radius-card: 8px;
                --shadow-soft: 0 2px 6px rgba(15, 23, 42, 0.08);
            }

            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 12px; color: var(--color-text); background-color: var(--color-bg); }
            .page { max-width: 980px; margin: 16px auto; padding: 24px 28px 32px; background-color: var(--color-surface); border-radius: 10px; box-shadow: var(--shadow-soft); }
            .header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--color-border); }
            .header-left { display: flex; align-items: center; gap: 12px; }
            .logo-placeholder { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, var(--color-primary), #3b82f6); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #fff; }
            .header-title-block { display: flex; flex-direction: column; gap: 2px; }
            .header-title { font-size: 20px; font-weight: 700; letter-spacing: 0.02em; }
            .header-subtitle { font-size: 11px; color: var(--color-muted); }
            .header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
            .chip-date { padding: 4px 10px; border-radius: 999px; font-size: 11px; background-color: var(--color-primary-soft); color: var(--color-primary); font-weight: 600; }
            .chip-tagline { font-size: 10px; color: var(--color-muted); }
            .section { margin-top: 18px; }
            .section-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; gap: 8px; }
            .section-title { font-size: 14px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase; color: #111827; }
            .section-caption { font-size: 10px; color: var(--color-muted); }
            .section-divider { border-top: 1px solid var(--color-border); margin: 10px 0 14px; }
            .table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 6px; }
            .table th, .table td { border: 1px solid var(--color-border-strong); padding: 4px 6px; vertical-align: top; word-wrap: break-word; }
            .table th { background-color: #f3f4f8; font-weight: 600; font-size: 11px; }
            .table td { font-size: 11px; }
            .table--compact td { padding: 3px 5px; }
            .text-muted { color: var(--color-muted); font-size: 10px; }
            .text-right { text-align: right; }
            .vehicles-note { font-size: 10px; color: var(--color-muted); margin-bottom: 4px; }
            .cards-grid { display: flex; flex-direction: column; gap: 10px; }
            .card { border-radius: var(--radius-card); border: 1px solid var(--color-border); background-color: #fcfcff; padding: 10px 12px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); page-break-inside: avoid; }
            .card-header-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
            .card-title-block { max-width: 70%; }
            .card-title { font-size: 13px; font-weight: 600; }
            .card-subtitle { font-size: 11px; color: var(--color-muted); margin-top: 1px; }
            .card-tag { display: none; }
            .card-body { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1.5fr); gap: 12px; margin-top: 6px; }
            .card-contact-block { font-size: 11px; }
            .card-contact-block .line { margin-bottom: 2px; }
            .card-contact-block .label { font-weight: 600; }
            .card-notes-label { font-size: 10px; font-weight: 600; margin-top: 6px; margin-bottom: 1px; }
            .card-notes { font-size: 11px; white-space: pre-wrap; padding: 4px 6px; border-radius: 4px; background-color: #f9fafb; border: 1px dashed var(--color-border); }
            .card-meta-right { display: flex; flex-direction: column; gap: 8px; }
            .info-pills { display: flex; flex-direction: column; gap: 4px; }
            .pill-row { display: flex; gap: 6px; }
            .pill-box { flex: 1; border-radius: 6px; border: 1px solid var(--color-border); background-color: #ffffff; padding: 4px 6px; }
            .pill-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-muted); margin-bottom: 1px; }
            .pill-value { font-size: 12px; font-weight: 500; }
            .badge-service-type { display: inline-block; margin-top: 4px; padding: 2px 6px; border-radius: 999px; background-color: #fff7e6; color: #92400e; font-size: 10px; }
            .card-team-title { font-size: 10px; font-weight: 600; margin: 6px 0 3px; }
            .team-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            .team-table th, .team-table td { border: 1px solid var(--color-border); padding: 3px 4px; font-size: 10px; }
            .team-table th { background-color: #eef2ff; font-weight: 600; }
            .employees-container { display: flex; gap: 12px; margin-top: 10px; }
            .employees-section { flex: 1; }
            .employees-title { font-size: 11px; font-weight: 600; margin-bottom: 4px; }
            .footer { margin-top: 20px; font-size: 10px; color: var(--color-muted); text-align: right; border-top: 1px solid var(--color-border); padding-top: 6px; }
            @media print { body { background-color: #ffffff; } .page { margin: 0; border-radius: 0; box-shadow: none; page-break-after: always; } .card { page-break-inside: avoid; } .header { margin-top: 4px; } }
            `;

            // HTML Construction

            // Vehicles
            let vehiclesHtml = `
            <div class="section">
                <div class="section-header">
                <div class="section-title">Fahrzeuge</div>
                <div class="section-caption">Status und kurze Hinweise zum Einsatztag</div>
                </div>
                <div class="vehicles-note">Hinweis: Änderungen im Tagesverlauf bitte handschriftlich ergänzen.</div>
                <table class="table table--compact">
                <thead><tr><th style="width: 22%;">Fahrzeug</th><th style="width: 18%;">Status</th><th>Informationen</th></tr></thead>
                <tbody>
            `;
            if (vehicleRows.length > 0) {
                vehicleRows.forEach(v => {
                    vehiclesHtml += `<tr><td>${escapeHtml(v.vehicle_name)}</td><td>${escapeHtml(v.status)}</td><td>${escapeHtml(v.informationen)}</td></tr>`;
                });
            } else {
                vehiclesHtml += `<tr><td colspan="3" class="text-muted">(keine Fahrzeugdaten)</td></tr>`;
            }
            vehiclesHtml += `</tbody></table></div>`;

            // Cards
            let cardsHtml = `
            <div class="section">
                <div class="section-header"><div class="section-title">Einsätze</div><div class="section-caption">Touren, Kundendaten und Teamzuordnung</div></div>
                <div class="cards-grid">
            `;

            if (cards.length > 0) {
                cards.forEach(card => {
                    const nameLine = [card.anrede, card.name].filter(Boolean).join(' ');
                    const service = card.service_type || '';
                    const headerLine = (nameLine || service) ?
                        `${nameLine}${nameLine && service ? ' – ' + service : service}` : 'Einsatz';

                    const serviceBadge = service ? `<span class="badge-service-type">${escapeHtml(service)}</span>` : '';

                    const addrLines = [
                        [card.anrede, card.name].filter(Boolean).join(' '),
                        [card.strasse, card.nr].filter(Boolean).join(' '),
                        [card.plz, card.ort].filter(Boolean).join(' ')
                    ].filter(l => l.trim().length > 0);

                    const contactHtml = `
                        <div class="card-contact-block">
                            ${addrLines.map(l => `<div class="line">${escapeHtml(l)}</div>`).join('')}
                            <div class="line"><span class="label">Telefon:</span> ${escapeHtml(card.telefon)}</div>
                            ${serviceBadge}
                        </div>
                    `;

                    const notesHtml = `
                        <div class="card-notes-label">Notizen / Besonderheiten vor Ort:</div>
                        <div class="card-notes">${escapeHtml(card.notes)}</div>
                    `;

                    const timeVehicleHtml = `
                        <div class="card-meta-right">
                            <div class="info-pills">
                                <div class="pill-row">
                                    <div class="pill-box"><div class="pill-label">Startzeit</div><div class="pill-value">${escapeHtml(card.start_time?.substring(0, 5))}</div></div>
                                    <div class="pill-box"><div class="pill-label">Fahrzeug</div><div class="pill-value">${escapeHtml(card.vehicle_name)}</div></div>
                                </div>
                                <div class="pill-row">
                                    <div class="pill-box"><div class="pill-label">Angebotsart</div><div class="pill-value">${escapeHtml(card.offer_type)}</div></div>
                                </div>
                            </div>
                        </div>
                    `;

                    let teamHtml = `
                        <div class="card-team-title">Team</div>
                        <table class="team-table">
                            <thead><tr><th style="width: 40%;">Mitarbeiter</th><th style="width: 20%;">Start</th><th>Notizen</th></tr></thead>
                            <tbody>
                    `;
                    if (card.teamMembers.length > 0) {
                        card.teamMembers.forEach((m: any) => {
                            teamHtml += `<tr><td>${escapeHtml(m.employee_name)}</td><td>${escapeHtml(m.individual_start_time?.substring(0, 5))}</td><td>${escapeHtml(m.member_notes)}</td></tr>`;
                        });
                    } else {
                        teamHtml += `<tr><td colspan="3" class="text-muted">(keine Teamzuordnung)</td></tr>`;
                    }
                    teamHtml += `</tbody></table>`;

                    cardsHtml += `
                        <div class="card">
                            <div class="card-header-row">
                                <div class="card-title-block">
                                    <div class="card-title">${escapeHtml(headerLine)}</div>
                                </div>
                            </div>
                            <div class="card-body">
                                <div>${contactHtml}${notesHtml}</div>
                                ${timeVehicleHtml}
                            </div>
                            ${teamHtml}
                        </div>
                    `;
                });
            } else {
                cardsHtml += `<p class="text-muted">Keine Einsätze für diesen Tag vorhanden.</p>`;
            }
            cardsHtml += `</div></div>`;

            // Employees
            const buildEmployeesBlock = (rows: any[], emptyLabel: string) => {
                const filtered = rows.filter(r => r.notizen && r.notizen.trim() !== '');
                let h = `<div class="employees-section"><table class="table table--compact"><thead><tr><th style="width: 35%;">Name</th><th>Notizen / Verfügbarkeit</th></tr></thead><tbody>`;
                if (filtered.length > 0) {
                    filtered.forEach(emp => {
                        h += `<tr><td>${escapeHtml(emp.name)}</td><td>${escapeHtml(emp.notizen)}</td></tr>`;
                    });
                } else {
                    h += `<tr><td colspan="2" class="text-muted">${escapeHtml(emptyLabel)}</td></tr>`;
                }
                h += `</tbody></table></div>`;
                return h;
            };

            const employeesInternalHtml = buildEmployeesBlock(employeesInternal, '(keine internen Mitarbeiter)');
            const employeesExternalHtml = buildEmployeesBlock(employeesExternal, '(keine externen Mitarbeiter)');

            // Full HTML
            const html = `
            <!DOCTYPE html>
            <html lang="de">
            <head><meta charset="UTF-8"><title>MorningPlan ${format(new Date(date), 'dd.MM.yyyy')}</title>
            <style>${css}</style></head>
            <body>
            <div class="page">
                <div class="header">
                    <div class="header-left">
                        <div class="logo-placeholder">LiS</div>
                        <div class="header-title-block"><div class="header-title">MorningPlan</div><div class="header-subtitle">Tagesübersicht · Einsätze, Fahrzeuge & Team</div></div>
                    </div>
                    <div class="header-right">
                        <div class="chip-date">Tag: ${format(new Date(date), 'dd.MM.yyyy')}</div>
                        <div class="chip-tagline">Bereit für die Einsatzbesprechung am Morgen</div>
                    </div>
                </div>
                ${vehiclesHtml}
                <div class="section-divider"></div>
                ${cardsHtml}
                <div class="section-divider"></div>
                <div class="employees-container">
                    ${employeesInternalHtml}
                    ${employeesExternalHtml}
                </div>
                <div class="footer">Erstellt am: ${new Date().toLocaleString('de-DE')} · Land in Sicht GmbH</div>
            </div>
            </body></html>
            `;

            // Download
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `MorningPlan_${date}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast(`MorningPlan exportiert: MorningPlan_${date}.html`, 'success');
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast("Fehler beim Export.", 'error');
        }
        setLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
            >
                <Download className="h-4 w-4" />
                Export
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm m-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b px-4 py-3 bg-slate-50">
                            <h3 className="text-sm font-bold text-slate-800">Nachkalkulation exportieren</h3>
                            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-500">Datum wählen</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                    />
                                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 bg-slate-50 px-4 py-3 border-t">
                            <button
                                onClick={() => setOpen(false)}
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Exportieren
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
