import React from 'react';
import { supabase } from '@/lib/supabase';
import { Employee, EmployeeDailyNote } from './types';

interface EmployeeNotesProps {
    employees: Employee[];
    employeeNotes: EmployeeDailyNote[];
    selectedDay: string;
    fetchDayPanels: () => Promise<void>;
}

export function EmployeeNotes({
    employees,
    employeeNotes,
    selectedDay,
    fetchDayPanels
}: EmployeeNotesProps) {

    // Helper to render a table for a group of employees
    const renderEmployeeTable = (employeeList: Employee[]) => (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b text-xs font-medium text-slate-500 uppercase">
                    <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Info</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {employeeList.map(emp => {
                        const note = employeeNotes.find(n => n.employee_code === (emp.employee_code || emp.name));
                        return (
                            <tr key={emp.employee_id} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-slate-700">{emp.name}</td>
                                <td className="px-4 py-2">
                                    <input className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none py-1 text-slate-600"
                                        placeholder="—"
                                        defaultValue={note?.notizen || ''}
                                        onBlur={async (e) => {
                                            const val = e.target.value;
                                            if (val === (note?.notizen || '')) return;

                                            const code = emp.employee_code || emp.name;
                                            if (note) {
                                                await supabase.from('t_employee_daily_notes').update({ notizen: val }).eq('id', note.id);
                                            } else if (val) {
                                                await supabase.from('t_employee_daily_notes').insert({ employee_code: code, employee_id: emp.employee_id, plan_date: selectedDay, notizen: val, sort_order: 0 });
                                            }
                                            fetchDayPanels();
                                        }}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    const internalEmployees = employees.filter(e => e.contract_type !== 'Freelance' && e.contract_type !== 'Extern');
    const externalEmployees = employees.filter(e => e.contract_type === 'Freelance' || e.contract_type === 'Extern');

    return (
        <section className="pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* INTERN */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Interne Mitarbeiter</h3>
                    {renderEmployeeTable(internalEmployees)}
                </div>

                {/* EXTERN */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Externe Mitarbeiter</h3>
                    {renderEmployeeTable(externalEmployees)}
                </div>
            </div>
        </section>
    );
}
