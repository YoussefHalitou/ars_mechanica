import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, Pencil, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MorningPlan } from './types';

interface DroppableDayProps {
    day: Date;
    plans: MorningPlan[];
    onDelete: (id: string, e: React.MouseEvent) => void;
    onEditPlan: (plan: MorningPlan) => void;
}

export function DroppableDay({ day, plans, onDelete, onEditPlan }: DroppableDayProps) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const { setNodeRef, isOver } = useDroppable({ id: `day-${dateStr}`, data: { date: dateStr } });
    const isToday = isSameDay(day, new Date());

    return (
        <div ref={setNodeRef}
            className={cn("flex flex-col h-full rounded-xl border shadow-sm overflow-hidden transition-colors group/day",
                isOver ? "bg-blue-50 border-blue-400" : "bg-white border-slate-200")}>
            <div className={cn("px-3 py-2 border-b flex flex-col items-center gap-0.5 relative", isToday ? "bg-blue-50/50" : "bg-white")}>
                <span className="text-[10px] font-medium text-slate-400 uppercase">{format(day, 'EEE', { locale: de })}</span>
                <span className={cn("text-base font-bold w-7 h-7 flex items-center justify-center rounded-full",
                    isToday ? "bg-blue-600 text-white" : "text-slate-700")}>{format(day, 'd')}</span>
            </div>
            <div className="flex-1 p-1.5 bg-slate-50/30 space-y-1.5 overflow-y-auto">
                {plans.map(plan => (
                    <div key={plan.plan_id} className="relative rounded-md border border-slate-200 bg-white p-2 shadow-sm group hover:border-blue-200 transition-colors cursor-default" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            <button onClick={() => onEditPlan(plan)} className="text-slate-400 hover:text-blue-600 text-xs p-0.5"><Pencil className="h-3 w-3" /></button>
                            <button onClick={(e) => onDelete(plan.plan_id, e)} type="button" className="text-slate-400 hover:text-red-500 text-xs p-0.5">×</button>
                        </div>
                        <div className="text-xs font-semibold text-blue-700 truncate mb-0.5">{plan.project?.name || 'Unbekannt'}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mb-1">
                            <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{plan.start_time?.substring(0, 5) || '07:00'}</span>
                            {plan.vehicle_names && <span className="flex items-center gap-0.5"><Truck className="h-2.5 w-2.5" />{plan.vehicle_names}</span>}
                        </div>
                        {plan.service_type && <div className="text-[9px] text-slate-400 mb-0.5">{plan.service_type}</div>}
                        <div className="flex items-center gap-1 flex-wrap">
                            {(plan.staff || []).map(s => (
                                <span key={s.id} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full truncate max-w-[60px]">{s.employee?.name?.split(' ')[0] || '?'}</span>
                            ))}

                        </div>
                    </div>
                ))}
                {plans.length === 0 && !isOver && (
                    <div className="h-full min-h-[80px] border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-[10px]">Frei</div>
                )}
            </div>
        </div>
    );
}
