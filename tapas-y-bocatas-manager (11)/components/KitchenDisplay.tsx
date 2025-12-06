
import React, { useEffect, useState } from 'react';
import { Order, Table } from '../types';
import { Clock, CheckCircle, ChefHat, Flame, Utensils, Undo2 } from 'lucide-react';

interface KitchenDisplayProps {
    orders: Order[];
    tables: Table[];
    onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
    onUpdateItem: (orderId: string, itemId: string, completed: boolean) => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ orders, tables, onUpdateOrder, onUpdateItem }) => {
    // Force refresh every 30 seconds to update relative times
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 30000);
        return () => clearInterval(interval);
    }, []);

    // Filter only Pending orders, sort by oldest first
    const pendingOrders = orders
        .filter(o => o.status === 'pending' && o.kitchenStatus !== 'served')
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const getTimeElapsed = (dateStr: string) => {
        const start = new Date(dateStr).getTime();
        const now = new Date().getTime();
        const diffMins = Math.floor((now - start) / 60000);
        return diffMins;
    };

    const getStatusColor = (mins: number, isCooking: boolean) => {
        if (isCooking) return 'bg-blue-50 border-blue-600 text-blue-900'; // Cooking state overrides time
        if (mins < 5) return 'bg-green-50 border-green-400 text-green-900';
        if (mins < 15) return 'bg-yellow-50 border-yellow-400 text-yellow-900';
        // Urgent: Solid Red style, NO blinking/pulse
        return 'bg-red-50 border-red-600 text-red-900 shadow-md shadow-red-100'; 
    };

    const handleOido = (orderId: string) => {
        onUpdateOrder(orderId, { kitchenStatus: 'ready' }); // Reuse 'ready' as 'Cooking/Oído' status
    };

    const handleServido = (orderId: string) => {
        if (window.confirm("¿Marcar comanda completa como SERVIDA? (Desaparecerá de la pantalla)")) {
            onUpdateOrder(orderId, { kitchenStatus: 'served' });
        }
    };

    return (
        <div className="p-4 h-full bg-slate-800 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ChefHat className="text-orange-400" size={32} />
                    Monitor de Cocina (KDS)
                </h1>
                <div className="flex items-center gap-4 text-white text-sm font-bold flex-wrap">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div> &lt; 5m</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500 border border-white"></div> 5-15m</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600 border border-white"></div> &gt; 15m (Urgente)</div>
                    <div className="flex items-center gap-2 ml-4"><div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div> En Preparación (Oído)</div>
                </div>
            </div>

            {pendingOrders.length === 0 ? (
                <div className="h-[60vh] flex flex-col items-center justify-center text-slate-500 opacity-50">
                    <CheckCircle size={100} className="mb-4" />
                    <h2 className="text-3xl font-bold">Todo en orden, Chef</h2>
                    <p>No hay comandas pendientes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {pendingOrders.map(order => {
                        const mins = getTimeElapsed(order.date);
                        const isCooking = order.kitchenStatus === 'ready';
                        const statusClass = getStatusColor(mins, isCooking);
                        const tableName = tables.find(t => t.id === order.tableId)?.name || 'Barra';

                        return (
                            <div key={order.id} className={`rounded-xl overflow-hidden shadow-xl flex flex-col h-full border-l-8 transition-colors duration-300 ${statusClass.replace('bg-', 'border-l-') /* Hack to match border color */ } bg-white`}>
                                {/* Header */}
                                <div className={`p-3 border-b-2 flex justify-between items-center ${statusClass}`}>
                                    <div>
                                        <h3 className="font-black text-xl leading-none">{tableName}</h3>
                                        <span className="text-xs font-mono font-bold opacity-80">#{order.id.substring(0,4)}</span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="flex items-center gap-1 font-mono font-bold text-lg">
                                            <Clock size={16} /> {mins}m
                                        </div>
                                        {isCooking && <span className="text-[10px] font-black uppercase bg-white/20 px-1 rounded">Cocinando</span>}
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="p-2 flex-1 overflow-y-auto bg-white">
                                    <ul className="space-y-2">
                                        {order.items.map((item, idx) => (
                                            <li 
                                                key={`${item.cartId}-${idx}`} 
                                                className={`p-2 rounded-lg border-2 transition-all select-none flex justify-between items-stretch gap-2
                                                    ${item.completed 
                                                        ? 'bg-slate-100 border-slate-200 text-slate-400' 
                                                        : 'bg-white border-slate-100 shadow-sm'
                                                    }
                                                `}
                                            >
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <div className={`flex items-start ${item.completed ? 'line-through opacity-50' : ''}`}>
                                                        <span className="font-black text-xl mr-2 inline-block min-w-[24px] text-slate-700">{item.quantity}</span>
                                                        <span className="font-bold text-lg leading-tight text-slate-800">{item.name}</span>
                                                    </div>
                                                    
                                                    {/* Kitchen Note Highlight */}
                                                    {item.notes && (
                                                        <div className={`mt-2 text-xs font-bold uppercase p-1.5 rounded inline-block w-fit
                                                            ${item.completed ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-yellow-300'}
                                                        `}>
                                                            NOTA: {item.notes}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* ITEM FINISHED BUTTON */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUpdateItem(order.id, item.cartId, !item.completed);
                                                    }}
                                                    className={`px-3 rounded-lg font-bold text-xs flex flex-col items-center justify-center min-w-[70px] transition-colors shadow-sm
                                                        ${item.completed
                                                            ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                                            : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                                        }
                                                    `}
                                                >
                                                    {item.completed ? <Undo2 size={20} className="mb-1"/> : <CheckCircle size={20} className="mb-1"/>}
                                                    <span>{item.completed ? 'Recuperar' : 'HECHO'}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Actions - TWO BUTTONS NOW */}
                                <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
                                    {/* OÍDO BUTTON (Only if not already cooking) */}
                                    {!isCooking && (
                                        <button 
                                            onClick={() => handleOido(order.id)}
                                            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <Flame size={20} /> OÍDO
                                        </button>
                                    )}

                                    {/* SERVIDO BUTTON */}
                                    <button 
                                        onClick={() => handleServido(order.id)}
                                        className={`flex-1 py-3 rounded-xl font-bold text-lg transition-colors shadow-sm flex items-center justify-center gap-2
                                            ${isCooking 
                                                ? 'bg-green-600 text-white hover:bg-green-700' // Prominent when cooking
                                                : 'bg-slate-200 text-slate-400 hover:bg-slate-300' // Muted when new
                                            }
                                        `}
                                    >
                                        <Utensils size={20} /> SERVIDO
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
