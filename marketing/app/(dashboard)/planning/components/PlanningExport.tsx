import React, { useState } from 'react';
import { format } from 'date-fns';
import { Download, Loader2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
                { data: timePairs },
                { data: employees },
                { data: vehicleCosts },
                { data: projects }
            ] = await Promise.all([
                supabase.from('t_morningplan')
                    .select('*, project:t_projects(*)')
                    .eq('plan_date', date),
                supabase.from('t_time_pairs')
                    .select('*')
                    .eq('datum', date),
                supabase.from('t_employees').select('*'),
                // Vehicle costs might be linked to projects on this day?
                // Or maybe explicitly created for this day? Usually project costs are per project, not per day.
                // But let's fetch costs for projects active on this day.
                supabase.from('t_project_vehicle_costs').select('*'),
                supabase.from('t_projects').select('*')
            ]);

            const activeProjectIds = new Set(plans?.map(p => p.project_id).filter(Boolean) as string[]);

            // Filter relevant data
            const dayTimePairs = (timePairs || []).filter(tp => tp.project_id && activeProjectIds.has(tp.project_id));
            const dayVehicleCosts = (vehicleCosts || []).filter(vc => vc.project_id && activeProjectIds.has(vc.project_id));

            // Map Employees for rates
            const employeeMap = new Map(employees?.map(e => [e.employee_id, e]));

            // Generate HTML
            let html = `
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <title>Nachkalkulation ${date}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333; }
                    h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
                    h2 { margin-top: 30px; color: #475569; background: #f1f5f9; padding: 8px; border-radius: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
                    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                    th { background-color: #f8fafc; font-weight: 600; color: #475569; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
                    .total-row { background-color: #f0f9ff; font-weight: bold; }
                    .cost-positive { color: #dc2626; } /* Costs are red/expense */
                    .profit-positive { color: #16a34a; } /* Profit is green */
                    .meta { margin-bottom: 20px; color: #64748b; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <h1>Nachkalkulation: ${format(new Date(date), 'dd.MM.yyyy')}</h1>
                <div class="meta">Exportiert am ${new Date().toLocaleString('de-DE')}</div>
            `;

            if (!plans || plans.length === 0) {
                html += `<p>Keine Projekte für dieses Datum gefunden.</p>`;
            } else {
                activeProjectIds.forEach(projectId => {
                    const project = projects?.find(p => p.project_id === projectId);
                    const safeName = project?.name || 'Unbekanntes Projekt';
                    const safeCode = project?.project_code || '';

                    // Data for this project
                    const projTimePairs = dayTimePairs.filter(tp => tp.project_id === projectId);
                    const projVehicleCosts = dayVehicleCosts.filter(vc => vc.project_id === projectId);

                    // Calc Labor
                    let totalLaborCost = 0;
                    let totalHours = 0;

                    const laborRows = projTimePairs.map(tp => {
                        const emp = employees?.find(e => e.name === tp.mitarbeiter); // Match by name if ID missing in timepair? Timepair usually has name.
                        // Best effort match
                        const rate = emp?.hourly_rate || 0;

                        // Calc hours
                        let hours = 0;
                        if (tp.lis_von && tp.lis_bis) {
                            const [h1, m1] = tp.lis_von.split(':').map(Number);
                            const [h2, m2] = tp.lis_bis.split(':').map(Number);
                            const mins = (h2 * 60 + m2) - (h1 * 60 + m1) - (tp.pause_min || 0);
                            hours = mins > 0 ? mins / 60 : 0;
                        }

                        const cost = hours * rate;
                        totalLaborCost += cost;
                        totalHours += hours;

                        return `
                            <tr>
                                <td>${tp.mitarbeiter}</td>
                                <td>${tp.lis_von?.substring(0, 5)} - ${tp.lis_bis?.substring(0, 5)}</td>
                                <td class="text-right">${hours.toFixed(2)} h</td>
                                <td class="text-right">${rate.toFixed(2)} €</td>
                                <td class="text-right">${cost.toFixed(2)} €</td>
                            </tr>
                        `;
                    }).join('');

                    // Calc Vehicle
                    let totalVehicleCost = 0;
                    const vehicleRows = projVehicleCosts.map(vc => {
                        const cost = vc.total_cost || 0;
                        totalVehicleCost += cost;
                        return `
                            <tr>
                                <td>${vc.usage_type}</td>
                                <td>${vc.notes || '-'}</td>
                                <td class="text-right">-</td>
                                <td class="text-right">-</td>
                                <td class="text-right">${cost.toFixed(2)} €</td>
                            </tr>
                        `;
                    }).join('');

                    const totalCost = totalLaborCost + totalVehicleCost;

                    html += `
                        <h2>${safeName} <span style="font-weight:normal; font-size:0.8em; color:#94a3b8">(${safeCode})</span></h2>
                        
                        <h3>Personalkosten</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Mitarbeiter</th>
                                    <th>Zeit</th>
                                    <th class="text-right">Stunden</th>
                                    <th class="text-right">Satz/h</th>
                                    <th class="text-right">Kosten</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${laborRows || '<tr><td colspan="5" style="font-style:italic; text-align:center; color:#94a3b8;">Keine Personalzeiten erfasst</td></tr>'}
                                <tr class="total-row">
                                    <td colspan="2">Gesamt Personal</td>
                                    <td class="text-right">${totalHours.toFixed(2)} h</td>
                                    <td></td>
                                    <td class="text-right">${totalLaborCost.toFixed(2)} €</td>
                                </tr>
                            </tbody>
                        </table>

                        ${vehicleRows ? `
                        <h3>Fahrzeugkosten / Sonstiges</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Typ</th>
                                    <th>Beschreibung</th>
                                    <th></th>
                                    <th></th>
                                    <th class="text-right">Kosten</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${vehicleRows}
                                <tr class="total-row">
                                    <td colspan="4">Gesamt Fahrzeuge</td>
                                    <td class="text-right">${totalVehicleCost.toFixed(2)} €</td>
                                </tr>
                            </tbody>
                        </table>
                        ` : ''}

                        <div style="margin-top: 15px; text-align: right; font-size: 1.1em; font-weight: bold;">
                            Projekt Gesamtkosten (vorl.): <span class="cost-positive">${totalCost.toFixed(2)} €</span>
                        </div>
                        <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 20px 0;">
                    `;
                });
            }

            html += `
            </body>
            </html>
            `;

            // Download
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Nachkalkulation_${date}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({ title: "Export erfolgreich", description: `Nachkalkulation_${date}.html heruntergeladen.` });
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: "Fehler beim Export", description: "Daten konnten nicht geladen werden.", variant: "destructive" });
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nachkalkulation exportieren</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Datum
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleExport} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Exportieren
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
