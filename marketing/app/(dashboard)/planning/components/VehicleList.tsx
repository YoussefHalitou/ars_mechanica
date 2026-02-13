import React from 'react';
import { Truck } from 'lucide-react';
import { Vehicle, VehicleDailyStatus } from './types';

interface VehicleListProps {
    vehicles: Vehicle[];
    vehicleStatuses: VehicleDailyStatus[];
    selectedDay: string;
    saveVehicleStatus: (vId: string, vName: string, status: string, info: string) => Promise<void>;
    setVehicleStatuses: React.Dispatch<React.SetStateAction<VehicleDailyStatus[]>>;
}

export function VehicleList({
    vehicles,
    vehicleStatuses,
    selectedDay,
    saveVehicleStatus,
    setVehicleStatuses
}: VehicleListProps) {
    return (
        <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Fahrzeuge</h3>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                {["L4N", "L4U", "L Khalid", "L Caddy", "L Star"].map(vName => {
                    const v = vehicles.find(veh => (veh.nickname || veh.vehicle_id) === vName);
                    if (!v) return null;
                    const vs = vehicleStatuses.find(s => s.vehicle_name === v.nickname && s.plan_date === selectedDay);
                    return (
                        <div key={v.vehicle_id} className="rounded-lg border border-slate-200 p-2.5 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 truncate"><Truck className="h-3 w-3" />{v.nickname || v.vehicle_id}</span>
                                <select className="text-[10px] border rounded px-1 py-0.5 bg-slate-50"
                                    value={vs?.status || ''}
                                    onChange={e => saveVehicleStatus(v.vehicle_id, v.nickname || v.vehicle_id, e.target.value, vs?.informationen || '')}>
                                    <option value="">—</option>
                                    <option value="Einsatz">Einsatz</option>
                                    <option value="Frei">Frei</option>
                                    <option value="Werkstatt">Werkstatt</option>
                                </select>
                            </div>
                            <input className="w-full text-[10px] border rounded px-2 py-1 bg-slate-50"
                                placeholder="Info..."
                                value={vs?.informationen || ''}
                                onBlur={e => saveVehicleStatus(v.vehicle_id, v.nickname || v.vehicle_id, vs?.status || '', e.target.value)}
                                onChange={e => {
                                    const newVal = e.target.value;
                                    setVehicleStatuses(prev => {
                                        const copy = [...prev];
                                        const idx = copy.findIndex(s => s.vehicle_name === v.nickname && s.plan_date === selectedDay);
                                        if (idx >= 0) copy[idx] = { ...copy[idx], informationen: newVal };
                                        else copy.push({ id: 0, vehicle_name: v.nickname || '', plan_date: selectedDay, status: '', informationen: newVal, vehicle_id: v.vehicle_id, created_at: null, updated_at: null });
                                        return copy;
                                    });
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
