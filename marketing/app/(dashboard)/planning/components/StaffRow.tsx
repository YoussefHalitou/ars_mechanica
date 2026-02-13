import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { X, MoreHorizontal } from 'lucide-react';
import { StaffRowType } from './types';

export function StaffRow({ staff, onUpdate, onRemove, isConflicted = false }: {
    staff: StaffRowType;
    planStaff: StaffRowType[];
    onUpdate: (id: number, field: string, value: any) => void;
    onRemove: (id: number) => void;
    isConflicted?: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: `staff-${staff.id}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} className={cn(
            "group hover:bg-slate-50/80 transition-colors",
            isConflicted ? "bg-red-50/50" : "even:bg-slate-50/30",
            isDragging && "opacity-50 relative z-20 bg-white"
        )}>
            <td className="px-5 py-2 font-medium text-slate-700">
                <div className="flex items-center gap-2">
                    <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-1">
                        <MoreHorizontal className="h-3.5 w-3.5 rotate-90" />
                    </div>
                    <div className="flex items-center gap-2">
                        {isConflicted && <span title="Doppelbuchung!" className="cursor-help">⚠️</span>}
                        <div>
                            {staff.employee?.name}
                            <div className="text-[10px] text-slate-400 font-normal">{staff.employee?.contract_type}</div>
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-2 py-2">
                <input
                    type="text"
                    maxLength={5}
                    placeholder="00:00"
                    className="w-full bg-transparent border border-transparent rounded px-1 py-0.5 hover:border-slate-300 focus:border-blue-400 focus:bg-white transition-all text-slate-600 font-mono text-center"
                    defaultValue={staff.individual_start_time?.substring(0, 5) || ''}
                    onBlur={(e) => {
                        let val = e.target.value.trim();
                        // Simple formatting fix: 800 -> 08:00, 8 -> 08:00
                        if (val.length === 1) val = `0${val}:00`;
                        else if (val.length === 2 && !val.includes(':')) val = `${val}:00`;
                        else if (val.length === 3 && !val.includes(':')) val = `0${val[0]}:${val.slice(1)}`;
                        else if (val.length === 4 && !val.includes(':')) val = `${val.slice(0, 2)}:${val.slice(2)}`;

                        // Validate HH:MM
                        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                        if (val && !timeRegex.test(val)) {
                            // detailed validation could be done here, or just revert/clear
                        }

                        if (val && val !== staff.individual_start_time?.substring(0, 5)) {
                            onUpdate(staff.id, 'individual_start_time', val);
                            e.target.value = val;
                        }
                    }}
                />
            </td>
            <td className="px-2 py-2">
                <input
                    type="text"
                    className="w-full bg-transparent border border-transparent rounded px-1 py-0.5 hover:border-slate-300 focus:border-blue-400 focus:bg-white transition-all text-slate-600 placeholder:text-slate-300"
                    placeholder="Rolle/Notiz..."
                    defaultValue={staff.member_notes || ''}
                    onBlur={(e) => {
                        if (e.target.value !== (staff.member_notes || '')) {
                            onUpdate(staff.id, 'member_notes', e.target.value);
                        }
                    }}
                />
            </td>
            <td className="px-2 py-2 text-right">
                <button
                    onClick={() => onRemove(staff.id)}
                    className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </td>
        </tr>
    );
}
