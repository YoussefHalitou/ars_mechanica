import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Trash2, Users, Copy, ArrowRight } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { StaffRow } from './StaffRow';
import { MorningPlan, Employee } from './types';

interface ProjectCardProps {
    plan: MorningPlan;
    onEditPlan: (plan: MorningPlan) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    employees: Employee[];
    onAddStaff: (planId: string, employeeId: string) => void;
    onUpdateStaff: (staffId: number, field: string, value: any) => void;
    onRemoveStaff: (staffId: number) => void;
    onDuplicate: (plan: MorningPlan) => void;
    onMoveToTomorrow: (plan: MorningPlan) => void;
    compact?: boolean;
    conflicts?: { employees: Set<string>, vehicles: Set<string> };
}

export function ProjectCard({
    plan,
    onEditPlan,
    onDelete,
    employees,
    onAddStaff,
    onUpdateStaff,
    onRemoveStaff,
    onDuplicate,
    onMoveToTomorrow,
    compact = false,
    conflicts = { employees: new Set(), vehicles: new Set() }
}: ProjectCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: `plan-${plan.plan_id}`,
        data: { type: 'plan', plan }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row", isDragging && "opacity-50 relative z-20 bg-slate-50")}>
            {/* LEFT: Project Info */}
            <div className={cn("bg-slate-50 border-b md:border-b-0 md:border-r flex flex-col justify-between transition-all", compact ? "md:w-1/4 px-3 py-2" : "md:w-1/3 px-5 py-4")}>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-1 mr-1">
                            <MoreHorizontal className="h-4 w-4 rotate-90" />
                        </div>
                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{plan.start_time?.substring(0, 5) || '07:00'}</span>
                        {!compact && <span className="text-xs font-bold text-slate-500 uppercase tracking-wide border border-slate-200 px-2 py-0.5 rounded">{plan.service_type || 'Service'}</span>}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onDuplicate(plan)} title="Duplizieren" className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors"><Copy className="h-3.5 w-3.5" /></button>
                            <button onClick={() => onMoveToTomorrow(plan)} title="Auf morgen verschieben" className="p-1 hover:bg-orange-50 text-slate-400 hover:text-orange-600 rounded transition-colors"><ArrowRight className="h-3.5 w-3.5" /></button>
                        </div>
                    </div>
                    <h4 className={cn("font-bold text-slate-800 leading-snug mb-1", compact ? "text-base" : "text-xl")}>{plan.project?.name || 'Unbekannt'}</h4>

                    {!compact && (
                        <div className="text-sm text-slate-600 flex items-start gap-1.5 mb-4">
                            <span className="text-base mt-0.5">📍</span>
                            <span className="leading-tight">
                                {[plan.project?.strasse, plan.project?.nr].filter(Boolean).join(' ')}<br />
                                {plan.project?.plz} {plan.project?.ort}
                            </span>
                        </div>
                    )}

                    {!compact && plan.vehicle_names && (
                        <div className="mb-4">
                            <div className={cn(
                                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm border",
                                plan.vehicle_id && conflicts.vehicles.has(plan.vehicle_id)
                                    ? "bg-red-50 text-red-800 border-red-100 animate-pulse"
                                    : "bg-orange-50 text-orange-800 border-orange-100"
                            )}>
                                {plan.vehicle_id && conflicts.vehicles.has(plan.vehicle_id) && <span>⚠️</span>}
                                <span>🚛 {plan.vehicle_names}</span>
                            </div>
                        </div>
                    )}

                    {!compact && plan.notes && (
                        <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 p-2.5 text-xs italic rounded-lg relative">
                            <span className="absolute top-1 right-2 text-yellow-400 font-serif text-xl">”</span>
                            {plan.notes}
                        </div>
                    )}
                </div>

                <div className={cn("flex items-center gap-2 border-t border-slate-200/60", compact ? "mt-2 pt-2" : "mt-4 pt-4")}>
                    <button onClick={() => onEditPlan(plan)} className="flex-1 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-medium text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors">Bearbeiten</button>
                    <button onClick={(e) => onDelete(plan.plan_id, e)} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
            </div>

            {/* RIGHT: Staff Table (Inline) */}
            <div className="flex-1 p-0 flex flex-col">
                <div className={cn("bg-white border-b border-slate-100 flex items-center justify-between", compact ? "px-3 py-1.5" : "px-5 py-3")}>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Users className="h-3 w-3" /> Einsatz-Team
                    </h5>
                    {!compact && (
                        <div className="flex items-center gap-2">
                            <select
                                className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-slate-50 hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all w-48"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        onAddStaff(plan.plan_id, e.target.value);
                                        e.target.value = ""; // Reset select
                                    }
                                }}
                            >
                                <option value="">+ Mitarbeiter hinzufügen...</option>
                                {employees.map(emp => (
                                    <option key={emp.employee_id} value={emp.employee_id}>
                                        {emp.name} ({emp.contract_type || '?'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-[11px] text-left">
                        <thead className={cn("text-slate-400 font-medium bg-slate-50/50 border-b border-slate-100", compact && "hidden")}>
                            <tr>
                                <th className={cn("py-2 w-1/3", compact ? "px-3" : "px-5")}>Name</th>
                                <th className="px-2 py-2 w-20">Start</th>
                                <th className="px-2 py-2">Info / Rolle</th>
                                <th className="px-2 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <SortableContext
                                items={(plan.staff || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(s => `staff-${s.id}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                {(plan.staff || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(staff => (
                                    <StaffRow
                                        key={staff.id}
                                        staff={staff}
                                        planStaff={plan.staff || []}
                                        onUpdate={onUpdateStaff}
                                        onRemove={onRemoveStaff}
                                        isConflicted={conflicts.employees.has(staff.employee_id)}
                                    />
                                ))}
                            </SortableContext>
                            {(plan.staff || []).length === 0 && (
                                <tr>
                                    <td colSpan={4} className={cn("text-center text-slate-300 italic", compact ? "py-2 text-[10px]" : "py-8")}>
                                        Noch keine Mitarbeiter zugewiesen.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
