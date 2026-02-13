'use client';

import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MorningPlan, Employee, Vehicle } from './types';
import { Users, Truck } from 'lucide-react';

interface TimelineViewProps {
    plans: MorningPlan[];
    selectedDay: string;
    employees: Employee[];
    vehicles: Vehicle[];
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 6); // 6:00 to 18:00

export function TimelineView({ plans, selectedDay }: TimelineViewProps) {
    // Helper to calculate left offset and width based on time
    const getPosition = (timeStr: string | null) => {
        if (!timeStr) return { left: '8.33%', width: '15%' }; // Default
        const [hours, minutes] = timeStr.split(':').map(Number);
        const totalMinutes = (hours - 6) * 60 + minutes;
        const percentage = (totalMinutes / (12 * 60)) * 100;
        return { left: `${Math.max(0, percentage)}%`, width: '160px' };
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Timeline Header */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
                <div className="w-64 border-r border-slate-200 p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Fahrzeuge / Projekte
                </div>
                <div className="flex-1 relative h-12">
                    {HOURS.map((hour) => (
                        <div
                            key={hour}
                            className="absolute h-full border-l border-slate-200 flex flex-col justify-end pb-1 pl-1"
                            style={{ left: `${((hour - 6) / 12) * 100}%` }}
                        >
                            <span className="text-[10px] font-medium text-slate-400">{hour}:00</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline Body */}
            <div className="flex-1 overflow-y-auto">
                {plans.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 italic">
                        Keine Einsätze für diesen Tag geplant.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {plans.map((plan) => {
                            const { left, width } = getPosition(plan.start_time);
                            return (
                                <div key={plan.plan_id} className="flex group hover:bg-slate-50/50 transition-colors h-20">
                                    {/* Sidebar Info */}
                                    <div className="w-64 border-r border-slate-200 p-3 flex flex-col justify-center">
                                        <div className="font-bold text-slate-800 text-sm truncate">{plan.project?.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold">
                                                {plan.start_time?.substring(0, 5) || '07:00'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                                {plan.vehicle_names || 'Kein Fahrzeug'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Grid Area */}
                                    <div className="flex-1 relative bg-grid-slate-100/[0.05]">
                                        {/* Hour markers background */}
                                        {HOURS.map((hour) => (
                                            <div
                                                key={hour}
                                                className="absolute h-full border-l border-slate-100/50"
                                                style={{ left: `${((hour - 6) / 12) * 100}%` }}
                                            />
                                        ))}

                                        {/* Project Bar */}
                                        <div
                                            className="absolute top-4 h-12 bg-white border border-blue-200 rounded-lg shadow-sm flex items-center px-3 gap-3 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer overflow-hidden group/bar"
                                            style={{ left, width: '280px' }} // Fixed width for now as we don't have end_time
                                        >
                                            <div className="w-1.5 h-full bg-blue-500 absolute left-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <Users className="h-3 w-3 text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-700">
                                                        {plan.staff?.length || 0} Personen
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 truncate">
                                                    {plan.staff?.map(s => s.employee?.name).join(', ') || 'Unbesetzt'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
