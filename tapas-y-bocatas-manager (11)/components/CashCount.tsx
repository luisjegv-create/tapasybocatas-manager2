


import React, { useState } from 'react';
import { Order, CashClosure } from '../types';
import { DollarSign, Save, AlertTriangle, CheckCircle, Calculator, History, Calendar, CreditCard, Coins, UserCheck } from 'lucide-react';

interface CashCountProps {
  orders: Order[];
  closures: CashClosure[]; // Received history
  onSaveClosure: (closure: CashClosure) => void;
}

export const CashCount: React.FC<CashCountProps> = ({ orders, closures, onSaveClosure }) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  // NEW CLOSURE STATE
  const [countedCash, setCountedCash] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Filter orders for today using LOCAL date (not UTC) to avoid timezone issues
  const today = new Date().toLocaleDateString();
  const todaysOrders = orders.filter(o => {
      const orderDate = new Date(o.date).toLocaleDateString();
      return orderDate === today && o.status === 'paid';
  });
  
  // Calculate Totals - EXCLUDING Internal Consumption (House)
  const revenueOrders = todaysOrders.filter(o => o.paymentMethod !== 'house');
  
  const totalSystem = revenueOrders.reduce((sum, o) => sum + o.total, 0); // Gross Sales (Real Money)
  const totalCard = revenueOrders
    .filter(o => o.paymentMethod === 'card')
    .reduce((sum, o) => sum + o.total, 0);
  
  const totalHouse = todaysOrders
    .filter(o => o.paymentMethod === 'house')
    .reduce((sum, o) => sum + o.total, 0);

  const expectedCash = totalSystem - totalCard; // This is what should be in the drawer
  const difference = countedCash - expectedCash;

  const handleSave = () => {
    const closure: CashClosure = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      totalSystem,
      totalCard,
      totalCounted: countedCash,
      difference,
      notes: notes + (totalHouse > 0 ? ` (Consumo Interno: ${totalHouse.toFixed(2)}€)` : '')
    };
    onSaveClosure(closure);
    setIsSaved(true);
  };

  if (isSaved) {
    return (
      <div className="p-12 h-full flex flex-col items-center justify-center bg-green-50 text-center animate-in fade-in">
        <CheckCircle size={64} className="text-green-600 mb-4" />
        <h2 className="text-3xl font-bold text-green-800">¡Cierre Guardado!</h2>
        <p className="text-green-600 mt-2">El cierre de caja se ha registrado correctamente.</p>
        <div className="flex gap-4 mt-8">
            <button 
                onClick={() => { setIsSaved(false); setActiveTab('new'); setCountedCash(0); setNotes(''); }}
                className="px-6 py-3 bg-white text-green-700 font-bold rounded-xl shadow-sm hover:bg-green-100 border border-green-200"
            >
                Nuevo Cierre
            </button>
            <button 
                onClick={() => { setIsSaved(false); setActiveTab('history'); }}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl shadow-sm hover:bg-green-700"
            >
                Ver Historial
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50 flex flex-col">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="text-green-600" /> Cierre de Caja (Z)
          </h1>
          
          <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
              <button 
                onClick={() => setActiveTab('new')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2
                    ${activeTab === 'new' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <DollarSign size={16} /> Realizar Cierre
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2
                    ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <History size={16} /> Historial
              </button>
          </div>
      </div>

      {activeTab === 'new' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-300">
            {/* System Data */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-fit">
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-lg font-bold text-slate-500 uppercase tracking-wide">Resumen Ventas Hoy</h2>
                     <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{new Date().toLocaleDateString()}</span>
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <span className="text-slate-600 flex items-center gap-2"><CheckCircle size={16}/> Tickets Cobrados (Ingresos)</span>
                        <span className="font-bold text-slate-900">{revenueOrders.length}</span>
                    </div>
                    
                    {/* Gross Total */}
                    <div className="flex justify-between items-center py-3 border-b border-slate-100 bg-slate-50/50 px-2 rounded-lg">
                        <span className="text-slate-700 font-bold">Ventas Reales (Bruto)</span>
                        <span className="font-bold text-xl text-slate-900">{totalSystem.toFixed(2)}€</span>
                    </div>

                    {/* Breakdown */}
                    <div className="pl-4 space-y-2">
                         <div className="flex justify-between items-center py-2 text-sm">
                            <span className="text-slate-500 flex items-center gap-2"><CreditCard size={14}/> Cobros Tarjeta</span>
                            <span className="font-medium text-slate-700">-{totalCard.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between items-center py-2 text-sm">
                            <span className="text-slate-500 flex items-center gap-2"><Coins size={14}/> Cobros Efectivo</span>
                            <span className="font-medium text-slate-700">{(totalSystem - totalCard).toFixed(2)}€</span>
                        </div>
                    </div>

                    {/* Internal Consumption Info (Non-revenue) */}
                    {totalHouse > 0 && (
                        <div className="mt-2 py-2 px-2 border border-purple-100 bg-purple-50 rounded-lg flex justify-between text-sm">
                            <span className="text-purple-700 font-bold flex items-center gap-1"><UserCheck size={14}/> Consumo Interno (No suma caja)</span>
                            <span className="font-bold text-purple-900">{totalHouse.toFixed(2)}€</span>
                        </div>
                    )}

                    {/* Expected Cash */}
                    <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-blue-600 font-bold uppercase mb-1">Efectivo Esperado en Cajón</p>
                            <p className="text-2xl font-black text-blue-800">{expectedCash.toFixed(2)}€</p>
                        </div>
                        <Coins size={32} className="text-blue-300" />
                    </div>
                </div>
            </div>

            {/* Count Input */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-500 uppercase tracking-wide mb-6">Arqueo de Caja (Recuento)</h2>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Dinero Contado (€)</label>
                    <div className="relative">
                        <Calculator className="absolute left-4 top-4 text-slate-400" />
                        <input 
                        type="number"
                        step="0.01"
                        value={countedCash}
                        onChange={e => setCountedCash(parseFloat(e.target.value) || 0)}
                        className="w-full pl-12 p-4 text-3xl font-bold border border-slate-300 rounded-xl focus:ring-4 focus:ring-green-100 outline-none text-slate-800"
                        placeholder="0.00"
                        onFocus={e => e.target.select()}
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 ml-1">Introduce el total de monedas y billetes que hay en el cajón.</p>
                </div>

                {/* Difference Display */}
                <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 border transition-colors duration-300
                    ${difference === 0 ? 'bg-green-50 border-green-200 text-green-700' : 
                    difference > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                    'bg-red-50 border-red-200 text-red-700'}
                `}>
                    <div className="p-2 bg-white/50 rounded-full">
                         {difference === 0 ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <div className="flex-1">
                        <p className="text-xs uppercase font-bold opacity-80">Descuadre</p>
                        <p className="text-3xl font-black tracking-tight">{difference > 0 ? '+' : ''}{difference.toFixed(2)}€</p>
                    </div>
                    <div className="text-right text-xs font-medium opacity-70">
                        {difference === 0 ? 'Perfecto' : difference > 0 ? 'Sobra dinero' : 'Falta dinero'}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Notas / Incidencias</label>
                    <textarea 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl outline-none text-sm h-24 resize-none focus:border-slate-400 transition-colors"
                    placeholder="Ej: Se sacaron 10€ para cambio, faltan tickets..."
                    />
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                    <Save size={20} /> Cerrar Caja y Guardar
                </button>
            </div>
          </div>
      ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 animate-in fade-in">
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                              <th className="p-4 font-semibold text-sm text-slate-600 w-48"><Calendar size={16}/> Fecha</th>
                              <th className="p-4 font-semibold text-sm text-slate-600 text-right">Ventas Totales</th>
                              <th className="p-4 font-semibold text-sm text-slate-600 text-right text-slate-400">Tarjeta</th>
                              <th className="p-4 font-semibold text-sm text-slate-600 text-right bg-blue-50/30 border-l border-r border-slate-100">Esperado Efectivo</th>
                              <th className="p-4 font-semibold text-sm text-slate-600 text-right">Contado</th>
                              <th className="p-4 font-semibold text-sm text-slate-600 text-right">Descuadre</th>
                              <th className="p-4 font-semibold text-sm text-slate-600">Notas</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {closures.length === 0 ? (
                              <tr>
                                  <td colSpan={7} className="p-12 text-center text-slate-400">
                                      <History size={48} className="mx-auto mb-2 opacity-20"/>
                                      <p>No hay cierres registrados aún.</p>
                                  </td>
                              </tr>
                          ) : (
                              closures.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(closure => {
                                  const date = new Date(closure.date);
                                  const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                                  const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                  
                                  // Fallback for legacy data without totalCard
                                  const displayTotalSystem = closure.totalSystem || 0;
                                  const displayTotalCard = closure.totalCard || 0;
                                  const displayExpected = displayTotalSystem - displayTotalCard;

                                  return (
                                      <tr key={closure.id} className="hover:bg-slate-50">
                                          <td className="p-4">
                                              <p className="font-bold text-slate-800 capitalize">{formattedDate}</p>
                                              <p className="text-xs text-slate-400 font-mono">{formattedTime}</p>
                                          </td>
                                          <td className="p-4 text-right font-mono text-slate-600">
                                              {displayTotalSystem.toFixed(2)}€
                                          </td>
                                          <td className="p-4 text-right font-mono text-slate-400 text-sm">
                                              -{displayTotalCard.toFixed(2)}€
                                          </td>
                                          <td className="p-4 text-right font-mono font-bold text-blue-700 bg-blue-50/30 border-l border-r border-slate-100">
                                              {displayExpected.toFixed(2)}€
                                          </td>
                                          <td className="p-4 text-right font-mono font-bold text-slate-900">
                                              {closure.totalCounted.toFixed(2)}€
                                          </td>
                                          <td className="p-4 text-right">
                                              <span className={`px-2 py-1 rounded-full text-xs font-bold
                                                  ${closure.difference === 0 ? 'bg-green-100 text-green-700' : 
                                                    closure.difference > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}
                                              `}>
                                                  {closure.difference > 0 ? '+' : ''}{closure.difference.toFixed(2)}€
                                              </span>
                                          </td>
                                          <td className="p-4 text-sm text-slate-500 italic truncate max-w-[200px]">
                                              {closure.notes || '-'}
                                          </td>
                                      </tr>
                                  );
                              })
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
};