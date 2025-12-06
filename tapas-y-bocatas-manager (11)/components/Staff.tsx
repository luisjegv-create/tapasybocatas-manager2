
import React, { useState } from 'react';
import { Staff, WorkShift } from '../types';
import { Users, UserPlus, Trash2, Shield, User, Clock, LogIn, LogOut, History, UserCheck, CalendarDays } from 'lucide-react';

interface StaffProps {
  staff: Staff[];
  shifts: WorkShift[];
  onAddStaff: (staff: Staff) => void;
  onDeleteStaff: (id: string) => void;
  onClockIn: (staffId: string) => void;
  onClockOut: (staffId: string) => void;
}

export const StaffComponent: React.FC<StaffProps> = ({ staff, shifts, onAddStaff, onDeleteStaff, onClockIn, onClockOut }) => {
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'waiter'>('waiter');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaffName) {
      onAddStaff({
        id: Math.random().toString(36).substr(2, 9),
        name: newStaffName,
        role: newStaffRole,
        active: true
      });
      setNewStaffName('');
    }
  };

  // Helper to check if staff is currently working
  const isWorking = (staffId: string) => {
      return shifts.some(s => s.staffId === staffId && !s.endTime);
  };

  const calculateDuration = (start: string, end?: string) => {
      if (!end) return 'En curso...';
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      const diffMs = endTime - startTime;
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50 flex flex-col gap-6">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-orange-600" /> Control de Personal y Horarios
        </h1>
        <p className="text-slate-500 text-sm mt-1">Gestiona el alta de empleados y sus fichajes de entrada/salida.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: STAFF MANAGEMENT & CLOCK IN/OUT */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* 1. CLOCK IN / OUT PANEL */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Clock size={20} className="text-blue-600"/> Fichaje (Entrada / Salida)
                    </h2>
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {staff.filter(s => isWorking(s.id)).length} Activos
                    </span>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {staff.map(member => {
                        const active = isWorking(member.id);
                        return (
                            <div key={member.id} className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between
                                ${active 
                                    ? 'bg-green-50 border-green-200 shadow-sm' 
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }
                            `}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${active ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                                        {active ? <Clock size={20} className="animate-pulse"/> : <UserCheck size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{member.name}</p>
                                        <p className={`text-xs font-bold uppercase ${active ? 'text-green-600' : 'text-slate-400'}`}>
                                            {active ? 'Trabajando ahora' : 'Fuera de turno'}
                                        </p>
                                    </div>
                                </div>
                                
                                {active ? (
                                    <button
                                        onClick={() => onClockOut(member.id)}
                                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                                    >
                                        <LogOut size={16} /> Salir
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onClockIn(member.id)}
                                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                                    >
                                        <LogIn size={16} /> Entrar
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {staff.length === 0 && (
                        <p className="text-slate-400 text-center col-span-2 py-4">Añade empleados para gestionar sus horarios.</p>
                    )}
                </div>
            </div>

            {/* 2. ADD STAFF FORM & LIST */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Users size={20} className="text-orange-600"/> Gestión de Empleados
                    </h2>
                 </div>
                 
                 <div className="p-6">
                    {/* Add Form */}
                    <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nombre</label>
                            <input 
                                type="text" 
                                value={newStaffName}
                                onChange={e => setNewStaffName(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white text-sm"
                                placeholder="Ej: Juan Pérez"
                                required
                            />
                        </div>
                        <div className="w-full sm:w-40">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Rol</label>
                            <select 
                                value={newStaffRole} 
                                onChange={e => setNewStaffRole(e.target.value as any)}
                                className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white text-sm"
                            >
                                <option value="waiter">Camarero</option>
                                <option value="admin">Encargado</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2 text-sm shadow-md">
                                <UserPlus size={16} /> Añadir
                            </button>
                        </div>
                    </form>

                    {/* Staff List */}
                    <div className="space-y-2">
                        {staff.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${member.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {member.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">{member.name}</h3>
                                        <span className="text-xs uppercase font-bold text-slate-400">{member.role}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (window.confirm(`¿Eliminar a ${member.name}?`)) onDeleteStaff(member.id);
                                    }}
                                    className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                                    title="Eliminar empleado"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>

        {/* RIGHT COLUMN: HISTORY */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px] lg:h-auto">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <History size={20} className="text-purple-600"/> Historial de Turnos
                </h2>
            </div>
            <div className="overflow-y-auto flex-1 p-0">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200">
                        <tr>
                            <th className="p-3 font-semibold"><CalendarDays size={14}/> Fecha</th>
                            <th className="p-3 font-semibold">Empleado</th>
                            <th className="p-3 font-semibold">Entrada</th>
                            <th className="p-3 font-semibold">Salida</th>
                            <th className="p-3 font-semibold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {shifts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400">
                                    No hay registros de actividad.
                                </td>
                            </tr>
                        ) : (
                            shifts
                                .sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                                .slice(0, 50) // Limit to last 50 entries
                                .map(shift => {
                                    const employee = staff.find(s => s.id === shift.staffId);
                                    const startDate = new Date(shift.startTime);
                                    
                                    // Formatting
                                    const dateStr = startDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                                    // Capitalize first letter
                                    const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
                                    
                                    const timeIn = startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' });
                                    const timeOut = shift.endTime 
                                        ? new Date(shift.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' })
                                        : null;

                                    return (
                                        <tr key={shift.id} className="hover:bg-slate-50">
                                            <td className="p-3 font-bold text-slate-700 whitespace-nowrap bg-slate-50/50">
                                                {formattedDate}
                                            </td>
                                            <td className="p-3 font-medium text-slate-800">
                                                {employee ? employee.name : 'Desconocido'}
                                            </td>
                                            <td className="p-3 text-slate-600 font-mono">
                                                {timeIn}
                                            </td>
                                            <td className="p-3 text-slate-600 font-mono">
                                                {timeOut || <span className="text-green-600 font-bold text-xs animate-pulse">ACTIVO</span>}
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-slate-900 bg-slate-50/30">
                                                {calculateDuration(shift.startTime, shift.endTime)}
                                            </td>
                                        </tr>
                                    );
                                })
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};
