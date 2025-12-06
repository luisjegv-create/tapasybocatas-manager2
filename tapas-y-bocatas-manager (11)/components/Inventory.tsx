

import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, Unit, InventoryType, Product, WasteRecord, WasteReason } from '../types';
import { AlertTriangle, Plus, X, Trash2, Utensils, SprayCan, UtensilsCrossed, PackageOpen, Save, Check, Wine, Pencil, ArrowRightLeft, Search, MapPin, Grape, Calendar, BadgeEuro, ClipboardList, ShoppingCart, Copy, Truck, Martini, GlassWater, Droplets, Globe, Clock, Ban, FileX } from 'lucide-react';

interface InventoryProps {
  inventory: InventoryItem[];
  products?: Product[];
  onAddItem: (item: InventoryItem) => void;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onAddWaste?: (waste: WasteRecord) => void; // New Prop
}

// --- REPLENISHMENT SUB-COMPONENT ---
const ReplenishmentView: React.FC<{
    inventory: InventoryItem[];
    onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
}> = ({ inventory, onUpdateItem }) => {
    const [copiedCategory, setCopiedCategory] = useState<string | null>(null);

    // Filter items that need replenishment (Quantity <= MinStock)
    const criticalItems = useMemo(() => {
        return inventory.filter(i => i.quantity <= (i.minStock || 0));
    }, [inventory]);

    // Group by Type for easier supplier ordering
    const groupedItems = useMemo(() => {
        const groups: Record<string, InventoryItem[]> = {};
        criticalItems.forEach(item => {
            const type = item.type || 'Otros';
            if (!groups[type]) groups[type] = [];
            groups[type].push(item);
        });
        return groups;
    }, [criticalItems]);

    // Calculate suggested order (Target = MinStock * 2 for safety)
    const getSuggestedQty = (item: InventoryItem) => {
        const target = (item.minStock || 1) * 2;
        const diff = target - item.quantity;
        return Math.max(0, diff);
    };

    const handleQuickRestock = (item: InventoryItem) => {
        const suggested = getSuggestedQty(item);
        if (window.confirm(`¿Confirmar entrada de ${suggested.toFixed(2)} ${item.unit} de ${item.name}?`)) {
            onUpdateItem(item.id, { quantity: item.quantity + suggested });
        }
    };

    const copyToClipboard = (type: string, items: InventoryItem[]) => {
        const header = `🛒 PEDIDO SEMANAL - ${type.toUpperCase()}\n\n`;
        const body = items.map(i => {
            const qty = getSuggestedQty(i);
            return `- ${i.name}: ${qty.toFixed(2)} ${i.unit}`;
        }).join('\n');
        
        const footer = `\n\nGenerado por TapasManager`;
        
        navigator.clipboard.writeText(header + body + footer);
        setCopiedCategory(type);
        setTimeout(() => setCopiedCategory(null), 2000);
    };

    if (criticalItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center p-8 bg-green-50 rounded-xl border border-green-200">
                <Check className="w-16 h-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-green-800">¡Almacén Saneado!</h2>
                <p className="text-green-700 mt-2">No hay roturas de stock. Todo está por encima del mínimo.</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="bg-red-50 border border-red-200 p-6 rounded-xl mb-6 flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-full">
                    <AlertTriangle className="text-red-600 w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-red-800">Informe de Roturas Semanales</h2>
                    <p className="text-red-700">Se han detectado <strong>{criticalItems.length} artículos</strong> bajo mínimos. Reponer urgentemente.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {(Object.entries(groupedItems) as [string, InventoryItem[]][]).map(([type, items]) => (
                    <div key={type} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                {type === InventoryType.WINE ? <Wine size={16}/> : 
                                 type === InventoryType.FOOD ? <Utensils size={16}/> : 
                                 <PackageOpen size={16}/>}
                                {type}
                            </h3>
                            <button 
                                onClick={() => copyToClipboard(type, items)}
                                className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                            >
                                {copiedCategory === type ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>}
                                {copiedCategory === type ? '¡Copiado!' : 'Copiar Lista'}
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {items.map(item => {
                                const suggested = getSuggestedQty(item);
                                return (
                                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-800">{item.name}</span>
                                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">
                                                    Stock: {item.quantity} {item.unit}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Mínimo: {item.minStock} | Sugerido: <span className="text-blue-600 font-bold">{suggested.toFixed(2)} {item.unit}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right mr-2 hidden sm:block">
                                                <span className="block text-[10px] text-slate-400 uppercase">Coste Aprox.</span>
                                                <span className="font-bold text-slate-700">{(suggested * item.costPerUnit).toFixed(2)}€</span>
                                            </div>
                                            <button 
                                                onClick={() => handleQuickRestock(item)}
                                                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1"
                                                title="Confirmar entrada de stock"
                                            >
                                                <Truck size={16} />
                                                <span className="text-xs font-bold hidden sm:inline">Reponer</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Sub-component for Wine Card (Visual/Disruptive)
const WineCard: React.FC<{
    item: InventoryItem;
    onUpdate: (id: string, updates: Partial<InventoryItem>) => void;
    onEdit: (item: InventoryItem) => void;
    onDelete: (item: InventoryItem) => void;
}> = ({ item, onUpdate, onEdit, onDelete }) => {
    
    // Determine card style based on wine type
    const getWineStyle = () => {
        switch(item.wineDetails?.type) {
            case 'tinto': return 'bg-gradient-to-br from-red-900 to-red-950 text-red-50 border-red-800';
            case 'blanco': return 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-900 border-yellow-200';
            case 'rosado': return 'bg-gradient-to-br from-pink-50 to-pink-100 text-pink-900 border-pink-200';
            case 'espumoso': return 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 border-slate-300';
            default: return 'bg-white text-slate-800 border-slate-200';
        }
    };

    const isRed = item.wineDetails?.type === 'tinto';
    const textColor = isRed ? 'text-white' : 'text-slate-900';
    const subTextColor = isRed ? 'text-red-200' : 'text-slate-500';

    const glassCost = item.costPerUnit / 6; // Approx 6 glasses per bottle
    // Updated Logic: x2 multiplier (50% Margin = Price is 2x Cost)
    const suggestedGlassPrice = glassCost * 2; 

    const handleStockChange = (e: React.MouseEvent, delta: number) => {
        e.stopPropagation(); // Prevent opening the edit modal
        const newQty = Math.max(0, item.quantity + delta);
        onUpdate(item.id, { quantity: newQty });
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(item);
    };

    return (
        <div 
            onClick={() => onEdit(item)}
            className={`rounded-xl shadow-lg border p-5 relative overflow-hidden group flex flex-col justify-between h-[280px] transition-all hover:scale-[1.02] cursor-pointer ${getWineStyle()}`}
        >
            
            {/* Background Icon */}
            <Wine className={`absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12 ${isRed ? 'text-white' : 'text-slate-900'}`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full bg-black/10 backdrop-blur-sm ${textColor}`}>
                        {item.wineDetails?.type || 'Vino'}
                    </span>
                    <div className="flex gap-2">
                        <div className={`p-1.5 rounded-full bg-black/10 ${textColor}`}>
                            <Pencil size={14} />
                        </div>
                        <div 
                            onClick={handleDeleteClick}
                            className={`p-1.5 rounded-full bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white transition-colors z-20`}
                        >
                            <X size={14} />
                        </div>
                    </div>
                </div>
                
                <h3 className={`text-xl font-black leading-tight mb-1 font-serif ${textColor}`}>{item.name}</h3>
                
                <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 border rounded ${isRed ? 'border-red-700 bg-red-900/50' : 'border-slate-300 bg-white/50'}`}>
                        {item.wineDetails?.vintage || 'NV'}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${textColor}`}>
                        <MapPin size={10} /> {item.wineDetails?.region || 'Sin D.O.'}
                    </span>
                </div>

                <div className={`flex flex-col gap-1 text-xs mb-4 ${subTextColor}`}>
                     <div className="flex items-center gap-1.5">
                         <Grape size={12} className="opacity-70"/>
                         <span className="font-medium">{item.wineDetails?.grape || 'Varietal'}</span>
                     </div>
                </div>
            </div>

            {/* Price & Stock Section */}
            <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className={`text-[10px] font-bold uppercase ${subTextColor}`}>Coste Botella</p>
                        <p className={`font-mono font-bold text-lg ${textColor}`}>{item.costPerUnit.toFixed(2)}€</p>
                    </div>
                    <div className="text-right">
                         <p className={`text-[10px] font-bold uppercase ${subTextColor}`}>Sugerencia Copa (x2)</p>
                         <p className={`font-mono font-bold text-sm ${textColor}`}>{suggestedGlassPrice.toFixed(2)}€</p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10">
                    <button 
                        onClick={(e) => handleStockChange(e, -1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors font-bold ${textColor} z-20`}
                    >
                        -
                    </button>
                    <div className="text-center">
                        <span className={`text-xl font-bold ${textColor}`}>{item.quantity}</span>
                        <span className={`text-[9px] block uppercase ${subTextColor}`}>Botellas</span>
                    </div>
                    <button 
                        onClick={(e) => handleStockChange(e, 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors font-bold ${textColor} z-20`}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Spirit Card (Bar & Mixology)
const SpiritCard: React.FC<{
    item: InventoryItem;
    onUpdate: (id: string, updates: Partial<InventoryItem>) => void;
    onEdit: (item: InventoryItem) => void;
    onDelete: (item: InventoryItem) => void;
}> = ({ item, onUpdate, onEdit, onDelete }) => {
    
    // Determine card style based on spirit type
    const getSpiritStyle = () => {
        switch(item.spiritDetails?.type) {
            case 'gin': return 'bg-gradient-to-br from-slate-900 to-cyan-900 text-cyan-50 border-cyan-800';
            case 'whisky': return 'bg-gradient-to-br from-amber-950 to-orange-900 text-amber-50 border-amber-800';
            case 'ron': return 'bg-gradient-to-br from-red-950 to-orange-950 text-orange-100 border-orange-900';
            case 'vodka': return 'bg-gradient-to-br from-slate-800 to-slate-600 text-white border-slate-500';
            case 'vermut': return 'bg-gradient-to-br from-red-950 to-rose-900 text-rose-50 border-rose-800';
            case 'tequila': return 'bg-gradient-to-br from-yellow-900 to-yellow-700 text-yellow-50 border-yellow-600';
            default: return 'bg-slate-900 text-white border-slate-700';
        }
    };

    const style = getSpiritStyle();
    
    // 70cl bottle / 50ml shot = 14 shots
    const shotCost = item.costPerUnit / 14; 

    const handleStockChange = (e: React.MouseEvent, delta: number) => {
        e.stopPropagation();
        const newQty = Math.max(0, item.quantity + delta);
        onUpdate(item.id, { quantity: newQty });
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(item);
    };

    return (
        <div 
            onClick={() => onEdit(item)}
            className={`rounded-xl shadow-xl border p-5 relative overflow-hidden group flex flex-col justify-between h-[280px] transition-all hover:scale-[1.02] cursor-pointer ${style}`}
        >
            {/* Background Icon */}
            <Martini className="absolute -bottom-6 -right-6 w-40 h-40 opacity-5 rotate-12 text-white" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                        {item.spiritDetails?.type || 'Licor'}
                    </span>
                    <div className="flex gap-2">
                        <div className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                            <Pencil size={14} />
                        </div>
                        <div 
                            onClick={handleDeleteClick}
                            className={`p-1.5 rounded-full bg-white/10 hover:bg-red-600 text-white transition-colors z-20`}
                        >
                            <X size={14} />
                        </div>
                    </div>
                </div>
                
                <h3 className="text-xl font-black leading-tight mb-1 tracking-tight text-white">{item.name}</h3>
                
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold px-2 py-0.5 border border-white/20 rounded bg-black/20 text-white/90">
                        {item.spiritDetails?.style || 'Estándar'}
                    </span>
                    {item.spiritDetails?.aging && (
                        <span className="text-xs font-bold px-2 py-0.5 border border-white/20 rounded bg-black/20 text-white/90 flex items-center gap-1">
                            <Clock size={10} /> {item.spiritDetails.aging}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-1 text-xs mb-4 text-white/60">
                     <div className="flex items-center gap-1.5">
                         <Globe size={12} className="opacity-70"/>
                         <span className="font-medium">{item.spiritDetails?.origin || 'Internacional'}</span>
                     </div>
                </div>
            </div>

            {/* Price & Stock Section */}
            <div className="relative z-10 bg-black/20 backdrop-blur-md rounded-lg p-3 border border-white/10">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-white/50">Coste Botella</p>
                        <p className="font-mono font-bold text-lg text-white">{item.costPerUnit.toFixed(2)}€</p>
                    </div>
                    <div className="text-right">
                         <p className="text-[10px] font-bold uppercase text-white/50">Coste Copa (50ml)</p>
                         <p className="font-mono font-bold text-sm text-white">{shotCost.toFixed(2)}€</p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10">
                    <button 
                        onClick={(e) => handleStockChange(e, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors font-bold text-white z-20 bg-white/5"
                    >
                        -
                    </button>
                    <div className="text-center">
                        <span className="text-xl font-bold text-white">{item.quantity}</span>
                        <span className="text-[9px] block uppercase text-white/50">Botellas</span>
                    </div>
                    <button 
                        onClick={(e) => handleStockChange(e, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors font-bold text-white z-20 bg-white/5"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

// Standard Row for other items
const InventoryRow: React.FC<{
  item: InventoryItem;
  onUpdate: (id: string, updates: Partial<InventoryItem>) => void;
  onDeleteRequest: (item: InventoryItem) => void; 
  onEditRequest: (item: InventoryItem) => void; 
  onWasteRequest: (item: InventoryItem) => void;
}> = ({ item, onUpdate, onDeleteRequest, onEditRequest, onWasteRequest }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [cost, setCost] = useState(item.costPerUnit);
  const [minStock, setMinStock] = useState(item.minStock || 0);
  const [isDirty, setIsDirty] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    setQuantity(item.quantity);
    setCost(item.costPerUnit);
    setMinStock(item.minStock || 0);
    setIsDirty(false);
  }, [item.quantity, item.costPerUnit, item.minStock]);

  const handleSave = () => {
    onUpdate(item.id, { quantity, costPerUnit: cost, minStock });
    setIsDirty(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setQuantity(isNaN(val) ? 0 : val);
    setIsDirty(true);
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCost(isNaN(val) ? 0 : val);
    setIsDirty(true);
  };

  const handleMinStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMinStock(isNaN(val) ? 0 : val);
    setIsDirty(true);
  };

  return (
    <tr className="hover:bg-slate-50 group transition-colors border-b border-slate-100 last:border-0">
      <td className="p-4">
        <div className="flex flex-col">
            <span className="font-bold text-slate-800">{item.name}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{item.unit}</span>
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-2">
           <input 
              type="number" 
              step="0.001"
              value={quantity}
              onChange={handleQuantityChange}
              className={`w-28 text-center p-3 border rounded-lg font-mono font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all
                 ${isDirty ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-slate-50 border-transparent'}`}
           />
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-2">
           <input 
              type="number" 
              step="0.001"
              value={minStock}
              onChange={handleMinStockChange}
              className={`w-24 text-center p-2 border rounded-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all
                 ${isDirty ? 'bg-blue-50 border-blue-300' : 'bg-transparent border-transparent'}
                 ${quantity <= minStock ? 'text-red-600 font-bold bg-red-50' : 'text-slate-500'}`}
           />
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-1">
           <input 
              type="number" 
              step="0.001"
              value={cost}
              onChange={handleCostChange}
              className={`w-28 text-right p-2 border rounded-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all
                 ${isDirty ? 'bg-blue-50 border-blue-300' : 'bg-transparent border-transparent'}`}
           />
           <span className="text-slate-400 font-bold">€</span>
        </div>
      </td>
      <td className="p-4 font-bold text-slate-800 text-right">
        {(quantity * cost).toFixed(2)}€
      </td>
      <td className="p-4 text-center">
        {quantity <= minStock ? (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold border border-red-200">
            <AlertTriangle size={12} /> Bajo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-bold border border-green-200">
            OK
          </span>
        )}
      </td>
      <td className="p-4 text-right relative">
        <div className="flex items-center justify-end gap-2">
            {isDirty && (
                <button onClick={handleSave} className="p-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all animate-in zoom-in">
                    <Save size={18} />
                </button>
            )}
            {showSaved && !isDirty && (
                <span className="text-green-600 animate-in fade-in zoom-out duration-300 flex items-center gap-1 text-xs font-bold mr-2">
                    <Check size={16} /> Guardado
                </span>
            )}
             <button onClick={() => onWasteRequest(item)} className="p-2 bg-white border border-slate-200 text-orange-500 hover:text-orange-700 hover:border-orange-300 hover:bg-orange-50 rounded-lg transition-all" title="Registrar Merma (Basura)">
                <Trash2 size={18} />
            </button>
            <button onClick={() => onEditRequest(item)} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-all" title="Editar Detalles">
                <Pencil size={18} />
            </button>
            <button onClick={() => onDeleteRequest(item)} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 rounded-lg transition-all" title="Eliminar Definitivamente">
                <X size={18} />
            </button>
        </div>
      </td>
    </tr>
  );
};


export const Inventory: React.FC<InventoryProps> = ({ inventory, products = [], onAddItem, onUpdateItem, onDeleteItem, onAddWaste }) => {
  const [activeType, setActiveType] = useState<InventoryType | 'REPLENISHMENT'>(InventoryType.WINE); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // MODALS STATE
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false); // NEW WASTE MODAL
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [wasteItem, setWasteItem] = useState<InventoryItem | null>(null); // Item being wasted
  
  // FORM STATE
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    quantity: 0,
    unit: Unit.KG,
    costPerUnit: 0,
    minStock: 0,
    type: InventoryType.FOOD,
    wineDetails: { type: 'tinto', vintage: '', region: '', grape: '' },
    spiritDetails: { type: 'gin', style: '', origin: '', aging: '' }
  });

  const [wasteData, setWasteData] = useState<{quantity: number, reason: WasteReason, notes: string}>({
      quantity: 0,
      reason: WasteReason.SPOILED,
      notes: ''
  });

  const [useSmallUnits, setUseSmallUnits] = useState(false); 
  const [smallUnitValue, setSmallUnitValue] = useState<string>(''); 

  const filteredInventory = useMemo(() => {
    if (activeType === 'REPLENISHMENT') return []; // Handled by subcomponent
    
    let items = inventory.filter(item => item.type === activeType);
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [inventory, activeType, searchQuery]);

  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock);

  const openAddModal = () => {
      // Default type based on active tab, fallback to FOOD if replenishment tab active
      const defaultType = activeType === 'REPLENISHMENT' ? InventoryType.FOOD : activeType;
      
      setFormData({
        name: '',
        quantity: 0,
        unit: (defaultType === InventoryType.WINE || defaultType === InventoryType.SPIRITS) ? Unit.UNIT : Unit.KG,
        costPerUnit: 0,
        minStock: 0,
        type: defaultType,
        wineDetails: { type: 'tinto', vintage: '', region: '', grape: '' },
        spiritDetails: { type: 'gin', style: '', origin: '', aging: '' }
      });
      setUseSmallUnits(false);
      setSmallUnitValue('');
      setEditingItem(null);
      setShowAddModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
      setFormData({ 
          ...item,
          wineDetails: item.wineDetails || { type: 'tinto', vintage: '', region: '', grape: '' },
          spiritDetails: item.spiritDetails || { type: 'gin', style: '', origin: '', aging: '' }
      });
      setUseSmallUnits(false);
      setSmallUnitValue('');
      setEditingItem(item); 
      setShowAddModal(true); 
  };

  const openWasteModal = (item: InventoryItem) => {
      setWasteItem(item);
      setWasteData({ quantity: 0, reason: WasteReason.SPOILED, notes: '' });
      setShowWasteModal(true);
  };

  const handleSmallUnitChange = (val: string) => {
      setSmallUnitValue(val);
      const num = parseFloat(val);
      if (!isNaN(num)) {
          setFormData(prev => ({ ...prev, quantity: num / 1000 }));
      } else {
          setFormData(prev => ({ ...prev, quantity: 0 }));
      }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.costPerUnit !== undefined) {
      if (editingItem) {
          onUpdateItem(editingItem.id, formData);
      } else {
          onAddItem({
            ...formData as InventoryItem,
            id: Math.random().toString(36).substr(2, 9),
            type: formData.type || InventoryType.FOOD
          });
      }
      setShowAddModal(false);
      setEditingItem(null);
    }
  };

  const handleDeleteFromEdit = () => {
      if (editingItem) {
          if (window.confirm(`¿Seguro que quieres eliminar "${editingItem.name}"?`)) {
              onDeleteItem(editingItem.id);
              setShowAddModal(false);
              setEditingItem(null);
          }
      }
  };

  const handleWasteSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (wasteItem && wasteData.quantity > 0 && onAddWaste) {
          const record: WasteRecord = {
              id: Math.random().toString(36).substr(2, 9),
              date: new Date().toISOString(),
              inventoryItemId: wasteItem.id,
              itemName: wasteItem.name,
              quantity: wasteData.quantity,
              unit: wasteItem.unit,
              costLost: wasteData.quantity * wasteItem.costPerUnit,
              reason: wasteData.reason,
              notes: wasteData.notes
          };
          onAddWaste(record);
          setShowWasteModal(false);
          setWasteItem(null);
      }
  };

  const checkRecipeUsage = (itemId: string) => {
      const usedIn = products.filter(p => p.recipe.some(r => r.inventoryItemId === itemId));
      return usedIn;
  };

  const handleDeleteConfirm = () => {
      if (deletingItem) {
          onDeleteItem(deletingItem.id);
          setDeletingItem(null);
      }
  };

  const tabs = [
    { id: 'REPLENISHMENT', label: 'Asistente Reposición', icon: <ClipboardList size={18} /> },
    { id: InventoryType.SPIRITS, label: 'Bar & Mixología', icon: <Martini size={18} /> }, // NEW TAB
    { id: InventoryType.WINE, label: 'Bodega Sommelier', icon: <Wine size={18} /> },
    { id: InventoryType.FOOD, label: 'Comida', icon: <Utensils size={18} /> },
    { id: InventoryType.DRINK, label: 'Bebida General', icon: <UtensilsCrossed size={18} /> },
    { id: InventoryType.CLEANING, label: 'Limpieza', icon: <SprayCan size={18} /> },
    { id: InventoryType.MENAJE, label: 'Menaje', icon: <PackageOpen size={18} /> },
  ];

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 relative overflow-hidden">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
               {activeType === InventoryType.WINE ? 'Bodega Digital' : 
                activeType === InventoryType.SPIRITS ? 'Bar & Mixología' :
                activeType === 'REPLENISHMENT' ? 'Reposición y Compras' : 'Control de Stock'}
           </h1>
           <p className="text-slate-500 text-sm">
               {activeType === InventoryType.WINE ? 'Gestiona tu carta de vinos con detalle profesional.' : 
                activeType === InventoryType.SPIRITS ? 'Control Premium para destilados y coctelería.' :
                activeType === 'REPLENISHMENT' ? 'Detecta roturas de stock y genera listas de compra.' : 'Gestiona tus ingredientes y costes.'}
           </p>
        </div>
        
        {activeType !== 'REPLENISHMENT' && (
            <div className="flex gap-2">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-800 bg-white shadow-sm"
                    />
                </div>
                <button 
                    onClick={openAddModal}
                    className="bg-slate-900 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-colors font-bold shadow-lg"
                >
                    <Plus size={18} />
                    {activeType === InventoryType.WINE ? 'Añadir Vino' : 
                     activeType === InventoryType.SPIRITS ? 'Añadir Licor' : 'Nuevo'}
                </button>
            </div>
        )}
      </div>

      {lowStockItems.length > 0 && activeType !== 'REPLENISHMENT' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-700">Stock Bajo Alerta</h3>
            <p className="text-sm text-red-600 mt-1">
              {lowStockItems.length} artículos están por debajo del mínimo.
            </p>
          </div>
          <button 
             onClick={() => setActiveType('REPLENISHMENT')}
             className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-red-700"
          >
             Ver Roturas
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit overflow-x-auto max-w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveType(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap
              ${activeType === tab.id 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }
              ${tab.id === 'REPLENISHMENT' && activeType !== 'REPLENISHMENT' ? 'text-blue-600' : ''}
              ${tab.id === InventoryType.SPIRITS && activeType !== InventoryType.SPIRITS ? 'text-cyan-600' : ''}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW ROUTING */}
      {activeType === 'REPLENISHMENT' ? (
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
              <ReplenishmentView inventory={inventory} onUpdateItem={onUpdateItem} />
          </div>
      ) : activeType === InventoryType.WINE ? (
          <div className="flex-1 overflow-y-auto pr-2 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {filteredInventory.map(item => (
                     <WineCard 
                        key={item.id} 
                        item={item} 
                        onUpdate={onUpdateItem} 
                        onEdit={openEditModal} 
                        onDelete={(i) => setDeletingItem(i)}
                     />
                 ))}
                 {filteredInventory.length === 0 && (
                     <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center">
                         <Wine size={64} className="mb-4 opacity-20"/>
                         <p>La bodega está vacía.</p>
                         <button onClick={openAddModal} className="mt-4 text-slate-600 underline hover:text-slate-900">Añadir primera botella</button>
                     </div>
                 )}
              </div>
          </div>
      ) : activeType === InventoryType.SPIRITS ? (
          <div className="flex-1 overflow-y-auto pr-2 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {filteredInventory.map(item => (
                     <SpiritCard 
                        key={item.id} 
                        item={item} 
                        onUpdate={onUpdateItem} 
                        onEdit={openEditModal}
                        onDelete={(i) => setDeletingItem(i)}
                     />
                 ))}
                 {filteredInventory.length === 0 && (
                     <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center">
                         <Martini size={64} className="mb-4 opacity-20"/>
                         <p>No hay licores registrados.</p>
                         <button onClick={openAddModal} className="mt-4 text-slate-600 underline hover:text-slate-900">Añadir primera botella</button>
                     </div>
                 )}
              </div>
          </div>
      ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 font-semibold text-sm text-slate-600">Artículo</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 text-center">Cantidad</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 text-center">Min. Stock</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 text-right">Coste/U</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 text-right">Total</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 text-center">Estado</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 text-right w-48">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <PackageOpen size={40} className="text-slate-300" />
                          <p>No se encontraron artículos.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map(item => (
                        <InventoryRow 
                            key={item.id} 
                            item={item} 
                            onUpdate={onUpdateItem}
                            onDeleteRequest={(i) => setDeletingItem(i)}
                            onEditRequest={openEditModal}
                            onWasteRequest={openWasteModal} // NEW
                        />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {editingItem ? <Pencil size={20} className="text-blue-600"/> : <Plus size={20} className="text-slate-800"/>}
                  {editingItem ? 'Editar Detalles' : `Añadir a ${activeType}`}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              {/* ... (Existing Form Fields remain same) ... */}
              {/* WINE SPECIFIC FIELDS */}
              {activeType === InventoryType.WINE && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mb-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Wine size={12}/> Sommelier Data
                      </h3>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Vino</label>
                          <div className="flex gap-2">
                              {['tinto', 'blanco', 'rosado', 'espumoso'].map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, wineDetails: { ...prev.wineDetails!, type: t as any } }))}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize border-2 transition-all
                                        ${formData.wineDetails?.type === t 
                                            ? (t === 'tinto' ? 'bg-red-100 border-red-500 text-red-800' : 
                                               t === 'blanco' ? 'bg-yellow-100 border-yellow-500 text-yellow-800' :
                                               t === 'rosado' ? 'bg-pink-100 border-pink-500 text-pink-800' :
                                               'bg-slate-100 border-slate-500 text-slate-800')
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}
                                    `}
                                  >
                                      {t}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><MapPin size={10}/> D.O. / Región</label>
                              <input 
                                type="text"
                                placeholder="Ej: Rioja"
                                value={formData.wineDetails?.region}
                                onChange={e => setFormData(prev => ({ ...prev, wineDetails: { ...prev.wineDetails!, region: e.target.value } }))}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Calendar size={10}/> Añada</label>
                              <input 
                                type="text"
                                placeholder="Ej: 2021"
                                value={formData.wineDetails?.vintage}
                                onChange={e => setFormData(prev => ({ ...prev, wineDetails: { ...prev.wineDetails!, vintage: e.target.value } }))}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Grape size={10}/> Uva (Varietal)</label>
                          <input 
                            type="text"
                            placeholder="Ej: Tempranillo, Verdejo..."
                            value={formData.wineDetails?.grape}
                            onChange={e => setFormData(prev => ({ ...prev, wineDetails: { ...prev.wineDetails!, grape: e.target.value } }))}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                          />
                      </div>
                  </div>
              )}

              {/* SPIRITS SPECIFIC FIELDS */}
              {activeType === InventoryType.SPIRITS && (
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-3 mb-4 text-white">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Martini size={12}/> Mixology Data
                      </h3>
                      <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Licor</label>
                          <select
                            value={formData.spiritDetails?.type}
                            onChange={e => setFormData(prev => ({ ...prev, spiritDetails: { ...prev.spiritDetails!, type: e.target.value as any } }))}
                            className="w-full p-2 rounded-lg bg-slate-800 border border-slate-600 text-white outline-none"
                          >
                              <option value="gin">Ginebra</option>
                              <option value="whisky">Whisky</option>
                              <option value="ron">Ron</option>
                              <option value="vodka">Vodka</option>
                              <option value="tequila">Tequila</option>
                              <option value="vermut">Vermut</option>
                              <option value="licor">Otro Licor</option>
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1">Estilo</label>
                              <input 
                                type="text"
                                placeholder="Ej: London Dry"
                                value={formData.spiritDetails?.style}
                                onChange={e => setFormData(prev => ({ ...prev, spiritDetails: { ...prev.spiritDetails!, style: e.target.value } }))}
                                className="w-full p-2 border border-slate-600 bg-slate-800 rounded-lg text-sm text-white"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1">Origen</label>
                              <input 
                                type="text"
                                placeholder="Ej: Escocia"
                                value={formData.spiritDetails?.origin}
                                onChange={e => setFormData(prev => ({ ...prev, spiritDetails: { ...prev.spiritDetails!, origin: e.target.value } }))}
                                className="w-full p-2 border border-slate-600 bg-slate-800 rounded-lg text-sm text-white"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">Añejamiento</label>
                          <input 
                            type="text"
                            placeholder="Ej: 12 Años, Reserva..."
                            value={formData.spiritDetails?.aging}
                            onChange={e => setFormData(prev => ({ ...prev, spiritDetails: { ...prev.spiritDetails!, aging: e.target.value } }))}
                            className="w-full p-2 border border-slate-600 bg-slate-800 rounded-lg text-sm text-white"
                          />
                      </div>
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre {activeType === InventoryType.WINE ? 'del Vino' : activeType === InventoryType.SPIRITS ? 'de la Botella' : 'del Artículo'}</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none"
                  placeholder={activeType === InventoryType.WINE ? "Ej: Protos Roble" : "Ej: Beefeater, Cardhu..."}
                />
              </div>

              {activeType !== InventoryType.WINE && activeType !== InventoryType.SPIRITS && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sección</label>
                    <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as InventoryType})}
                        className="w-full p-3 border border-slate-300 rounded-xl outline-none bg-slate-50"
                    >
                        {Object.values(InventoryType).map(t => (
                        <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unidad Principal</label>
                  <select 
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value as Unit})}
                    className="w-full p-3 border border-slate-300 rounded-xl outline-none"
                  >
                    {Object.values(Unit).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                     <label className="block text-sm font-medium text-slate-700">Cantidad Actual</label>
                     
                     {(formData.unit === Unit.KG || formData.unit === Unit.L) && (
                         <button
                           type="button"
                           onClick={() => {
                               setUseSmallUnits(!useSmallUnits);
                               setSmallUnitValue('');
                           }}
                           className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold"
                         >
                           <ArrowRightLeft size={12}/>
                           {useSmallUnits ? `Volver a ${formData.unit}` : `Introducir en ${formData.unit === Unit.KG ? 'Gramos (g)' : 'Mililitros (ml)'}`}
                         </button>
                     )}
                  </div>
                  
                  {useSmallUnits && (formData.unit === Unit.KG || formData.unit === Unit.L) ? (
                      <div className="relative animate-in fade-in">
                        <input 
                            type="number"
                            placeholder={formData.unit === Unit.KG ? "Ej: 500g" : "Ej: 750ml"}
                            value={smallUnitValue}
                            onChange={(e) => handleSmallUnitChange(e.target.value)}
                            className="w-full p-3 border border-blue-300 rounded-xl outline-none bg-white text-blue-800 font-bold text-lg"
                            autoFocus
                        />
                        <span className="absolute right-3 top-3.5 text-xs font-bold text-blue-400">
                            {formData.unit === Unit.KG ? 'gr' : 'ml'}
                        </span>
                        <p className="text-[10px] text-blue-600 mt-1 font-bold">
                            Se guardará como: {formData.quantity?.toFixed(3)} {formData.unit}
                        </p>
                      </div>
                  ) : (
                      <input 
                        type="number" 
                        step="0.001"
                        required
                        value={formData.quantity}
                        onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                        className="w-full p-3 border border-slate-300 rounded-xl outline-none font-mono text-lg font-bold"
                        placeholder="0.000"
                      />
                  )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo</label>
                  <input 
                    type="number" 
                    step="0.001"
                    required
                    value={formData.minStock}
                    onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value)})}
                    className="w-full p-3 border border-slate-300 rounded-xl outline-none"
                  />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Coste por {formData.unit} (€)</label>
                    <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 font-bold">€</span>
                    <input 
                        type="number" 
                        step="0.001"
                        required
                        value={formData.costPerUnit}
                        onChange={e => setFormData({...formData, costPerUnit: parseFloat(e.target.value)})}
                        className="w-full pl-8 p-3 border border-slate-300 rounded-xl outline-none font-bold"
                    />
                    </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                  {editingItem && (
                      <button 
                        type="button"
                        onClick={handleDeleteFromEdit}
                        className="flex-1 bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 py-4 rounded-xl font-bold transition-colors shadow-sm flex items-center justify-center"
                        title="Eliminar este artículo"
                      >
                          <Trash2 size={20} />
                      </button>
                  )}
                  <button 
                    type="submit"
                    className={`flex-[3] text-white py-4 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2
                        ${editingItem ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300'}
                    `}
                  >
                    <Save size={20} />
                    {editingItem ? 'Guardar Cambios' : 'Añadir al Almacén'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WASTE MODAL */}
      {showWasteModal && wasteItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[65] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <div className="p-4 border-b border-orange-100 flex justify-between items-center bg-orange-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                  <Trash2 size={20} className="text-orange-600"/> Registrar Merma (Basura)
              </h2>
              <button onClick={() => setShowWasteModal(false)} className="text-orange-400 hover:text-orange-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
                <div className="mb-4 bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <p className="text-sm font-bold text-orange-800">{wasteItem.name}</p>
                    <p className="text-xs text-orange-600">Coste por {wasteItem.unit}: {wasteItem.costPerUnit.toFixed(2)}€</p>
                </div>
                
                <form onSubmit={handleWasteSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Cantidad Perdida ({wasteItem.unit})</label>
                        <input 
                            type="number"
                            step="0.001"
                            autoFocus
                            required
                            max={wasteItem.quantity}
                            value={wasteData.quantity || ''}
                            onChange={e => setWasteData({...wasteData, quantity: parseFloat(e.target.value)})}
                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">Stock actual: {wasteItem.quantity}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Motivo</label>
                        <select
                            value={wasteData.reason}
                            onChange={e => setWasteData({...wasteData, reason: e.target.value as WasteReason})}
                            className="w-full p-3 border border-slate-300 rounded-xl bg-white outline-none"
                        >
                            {Object.values(WasteReason).map(reason => (
                                <option key={reason} value={reason}>{reason}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Notas (Opcional)</label>
                         <input 
                            type="text"
                            value={wasteData.notes}
                            onChange={e => setWasteData({...wasteData, notes: e.target.value})}
                            placeholder="Ej: Se cayó la caja..."
                            className="w-full p-3 border border-slate-300 rounded-xl outline-none"
                        />
                    </div>
                    
                    <div className="pt-2">
                        <div className="flex justify-between items-center mb-3">
                             <span className="text-sm font-bold text-slate-500">Pérdida Económica:</span>
                             <span className="text-xl font-black text-red-600">
                                 -{(wasteData.quantity * wasteItem.costPerUnit).toFixed(2)}€
                             </span>
                        </div>
                        <button 
                            type="submit"
                            className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition-colors"
                        >
                            Confirmar Pérdida
                        </button>
                    </div>
                </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE WARNING MODAL */}
      {deletingItem && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
                        <X size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Artículo?</h3>
                    <p className="text-slate-600 mb-4 font-medium text-lg bg-slate-50 py-2 rounded-lg">{deletingItem.name}</p>
                    
                    {checkRecipeUsage(deletingItem.id).length > 0 ? (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-left mb-6">
                            <h4 className="font-bold text-orange-800 text-sm flex items-center gap-2 mb-2">
                                <AlertTriangle size={16}/> Artículo en Uso
                            </h4>
                            <p className="text-xs text-orange-700 mb-2">
                                Este ingrediente es parte de <strong>{checkRecipeUsage(deletingItem.id).length} recetas</strong>:
                            </p>
                            <ul className="text-xs text-orange-800 list-disc list-inside mb-3 font-medium">
                                {checkRecipeUsage(deletingItem.id).slice(0,3).map(p => (
                                    <li key={p.id}>{p.name}</li>
                                ))}
                                {checkRecipeUsage(deletingItem.id).length > 3 && <li>...y más</li>}
                            </ul>
                            <p className="text-[11px] text-orange-900 font-bold text-center border-t border-orange-200 pt-2">
                                Si lo borras, los costes de estos platos serán incorrectos.
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 mb-6 px-4">Esta acción eliminará el artículo del inventario de forma permanente.</p>
                    )}
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setDeletingItem(null)}
                            className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleDeleteConfirm}
                            className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                        >
                            Sí, Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
