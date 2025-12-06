
import React, { useState } from 'react';
import { Table, Zone } from '../types';
import { Armchair, Users, Utensils, Coffee, Pencil, Settings, X, Save, Plus, Clock } from 'lucide-react';

interface TablesProps {
  tables: Table[];
  onSelectTable: (tableId: string) => void;
  onUpdateTable: (tableId: string, updates: Partial<Table>) => void;
  onAddTable: (table: Table) => void;
}

export const Tables: React.FC<TablesProps> = ({ tables, onSelectTable, onUpdateTable, onAddTable }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [newName, setNewName] = useState('');

  // Add Table State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableData, setNewTableData] = useState<{name: string, zone: Zone}>({ name: '', zone: Zone.SALON });

  // Reservation Modal State
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [tableToReserve, setTableToReserve] = useState<Table | null>(null);
  const [reservationTime, setReservationTime] = useState('');

  const handleTableClick = (table: Table) => {
    if (isEditMode) {
      setEditingTable(table);
      setNewName(table.name);
    } else {
       // If table is free, offer to Reserve or Open Order
       if (table.status === 'free') {
           onSelectTable(table.id);
       } else if (table.status === 'reserved') {
           if (window.confirm(`¿Ocupar la mesa reservada "${table.name}" y abrir cuenta?`)) {
               // Clear reservation and select
               onUpdateTable(table.id, { status: 'free', reservationTime: undefined });
               onSelectTable(table.id);
           }
       } else {
           // Occupied
           onSelectTable(table.id);
       }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, table: Table) => {
      e.preventDefault(); // Block browser context menu
      if (table.status === 'free') {
          setTableToReserve(table);
          setReservationTime('21:00');
          setShowReserveModal(true);
      } else if (table.status === 'reserved') {
          if (window.confirm(`¿Cancelar reserva de ${table.name}?`)) {
              onUpdateTable(table.id, { status: 'free', reservationTime: undefined });
          }
      }
  };

  const saveReservation = (e: React.FormEvent) => {
      e.preventDefault();
      if (tableToReserve && reservationTime) {
          onUpdateTable(tableToReserve.id, { status: 'reserved', reservationTime });
          setShowReserveModal(false);
          setTableToReserve(null);
      }
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTable && newName.trim()) {
      onUpdateTable(editingTable.id, { name: newName.trim() });
      setEditingTable(null);
    }
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if(newTableData.name.trim()) {
        const newTable: Table = {
            id: Math.random().toString(36).substr(2, 9),
            name: newTableData.name.trim(),
            zone: newTableData.zone,
            status: 'free'
        };
        onAddTable(newTable);
        setShowAddModal(false);
        setNewTableData({ name: '', zone: Zone.SALON });
    }
  };

  const getZoneIcon = (zone: Zone) => {
    switch(zone) {
      case Zone.BAR: return <Coffee size={20} />;
      case Zone.SALON: return <Utensils size={20} />;
      default: return <Armchair size={20} />;
    }
  };

  const renderZone = (zone: Zone) => {
    const zoneTables = tables.filter(t => t.zone === zone);
    
    return (
      <div className="mb-8" key={zone}>
        <div className="flex items-center gap-2 mb-4 text-slate-500 border-b border-slate-200 pb-2">
           {getZoneIcon(zone)}
           <h3 className="font-bold uppercase tracking-wider">{zone}</h3>
           <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{zoneTables.length} mesas</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {zoneTables.map(table => (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              onContextMenu={(e) => handleContextMenu(e, table)}
              className={`p-4 rounded-xl shadow-sm border-2 transition-all flex flex-col items-center justify-center gap-2 h-32 relative group
                ${isEditMode
                    ? 'bg-yellow-50 border-yellow-300 cursor-pointer hover:bg-yellow-100 hover:scale-105 animate-in fade-in'
                    : table.status === 'occupied' 
                        ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:shadow-md'
                        : table.status === 'reserved'
                            ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                            : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:shadow-md'
                }
              `}
            >
              <div className={`p-3 rounded-full transition-colors relative
                ${isEditMode 
                    ? 'bg-slate-100' 
                    : table.status === 'occupied' 
                        ? 'bg-red-200' 
                        : table.status === 'reserved'
                            ? 'bg-purple-200'
                            : 'bg-green-200'
                }`}>
                 {isEditMode ? <Pencil size={24} className="text-yellow-600" /> : <Armchair size={24} />}
              </div>
              <span className="font-bold text-sm text-center leading-tight">{table.name}</span>
              
              {!isEditMode && table.status === 'occupied' && (
                <span className="absolute top-2 right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}

              {table.status === 'reserved' && (
                  <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <Clock size={10} />
                      {table.reservationTime}
                  </div>
              )}

              {isEditMode && (
                <span className="absolute top-2 right-2 bg-yellow-400 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil size={12} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mapa de Mesas</h1>
          <p className="text-slate-500 text-sm">
            {isEditMode ? 'MODO EDICIÓN: Toca una mesa para renombrarla' : 'Click para abrir comanda. Click Derecho para RESERVAR.'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
            {!isEditMode && (
                <div className="hidden lg:flex gap-4 mr-4">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                        <span>Libre</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span>Reservada</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Ocupada</span>
                    </div>
                </div>
            )}
            
            <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm bg-blue-600 text-white hover:bg-blue-700"
            >
                <Plus size={18} />
                <span className="hidden sm:inline">Nueva Mesa</span>
            </button>

            <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm
                    ${isEditMode 
                        ? 'bg-yellow-400 text-yellow-900 shadow-yellow-200 ring-2 ring-yellow-200' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
            >
                {isEditMode ? <X size={18} /> : <Settings size={18} />}
                <span className="hidden sm:inline">{isEditMode ? 'Salir Edición' : 'Editar Mesas'}</span>
            </button>
        </div>
      </div>

      {renderZone(Zone.BAR)}
      {renderZone(Zone.SALON)}

      {/* RENAME MODAL */}
      {editingTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Pencil size={18} /> Renombrar Mesa
                    </h3>
                    <button onClick={() => setEditingTable(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSaveRename} className="p-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nuevo Nombre</label>
                    <input 
                        type="text" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        autoFocus
                        className="w-full p-3 border border-slate-300 rounded-xl mb-4 focus:ring-2 focus:ring-yellow-400 outline-none font-bold text-lg"
                        placeholder="Ej: Mesa VIP..."
                    />
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => setEditingTable(null)}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={!newName.trim()}
                            className="flex-1 py-3 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:bg-yellow-500 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} /> Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* ADD TABLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Plus size={18} /> Nueva Mesa
                    </h3>
                    <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleCreateTable} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nombre</label>
                        <input 
                            type="text" 
                            value={newTableData.name}
                            onChange={e => setNewTableData({...newTableData, name: e.target.value})}
                            autoFocus
                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                            placeholder="Ej: Mesa 9, Terraza 1..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Zona</label>
                        <div className="flex gap-2">
                            {[Zone.BAR, Zone.SALON].map(zone => (
                                <button
                                    key={zone}
                                    type="button"
                                    onClick={() => setNewTableData({...newTableData, zone})}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all
                                        ${newTableData.zone === zone 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    {zone}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex gap-3 mt-4">
                        <button 
                            type="button" 
                            onClick={() => setShowAddModal(false)}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={!newTableData.name.trim()}
                            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            Crear Mesa
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* RESERVE MODAL */}
      {showReserveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b border-purple-100 flex justify-between items-center bg-purple-50">
                    <h3 className="font-bold text-lg text-purple-900 flex items-center gap-2">
                        <Clock size={18} /> Reservar {tableToReserve?.name}
                    </h3>
                    <button onClick={() => setShowReserveModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={saveReservation} className="p-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Hora de Reserva</label>
                    <input 
                        type="time" 
                        value={reservationTime}
                        onChange={e => setReservationTime(e.target.value)}
                        className="w-full p-4 border border-slate-300 rounded-xl mb-4 focus:ring-2 focus:ring-purple-400 outline-none font-bold text-xl text-center"
                        required
                    />
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => setShowReserveModal(false)}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                        >
                            <Clock size={18} /> Confirmar
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};
