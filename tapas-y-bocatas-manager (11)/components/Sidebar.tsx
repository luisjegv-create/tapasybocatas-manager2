


import React from 'react';
import { LayoutDashboard, ShoppingCart, Utensils, Package, FileText, Settings, Coffee, Wallet, Armchair, Users, DollarSign, MonitorPlay } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings?: () => void;
  logo?: string; // Receive logo prop
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenSettings, logo }) => {
  const menuItems = [
    { id: 'tables', label: 'Mapa Mesas', icon: <Armchair size={20} /> },
    { id: 'pos', label: 'TPV / Comandas', icon: <ShoppingCart size={20} /> },
    { id: 'kds', label: 'Monitor Cocina', icon: <MonitorPlay size={20} /> }, // NEW KDS
    { id: 'inventory', label: 'Almacén & Menaje', icon: <Package size={20} /> },
    { id: 'recipes', label: 'Escandallos', icon: <Utensils size={20} /> },
    { id: 'invoices', label: 'Facturas Prov.', icon: <FileText size={20} /> },
    { id: 'expenses', label: 'Gastos Variados', icon: <Wallet size={20} /> },
    { id: 'staff', label: 'Personal', icon: <Users size={20} /> },
    { id: 'cashcount', label: 'Cierre Caja (Z)', icon: <DollarSign size={20} /> },
    { id: 'dashboard', label: 'Finanzas', icon: <LayoutDashboard size={20} /> },
  ];

  return (
    <div className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-full flex-shrink-0 transition-all duration-300 shadow-2xl z-20 relative">
      <div className="p-4 flex items-center justify-center md:justify-start gap-3 border-b border-slate-700 h-20">
        <div className="bg-orange-500 p-2 rounded-lg flex-shrink-0 w-10 h-10 flex items-center justify-center overflow-hidden">
          {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
              <Coffee size={24} className="text-white" />
          )}
        </div>
        <span className="font-bold text-lg hidden md:block tracking-tight leading-tight">Tapas y<br/>Bocatas</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200
                  ${activeTab === item.id 
                    ? 'bg-orange-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="hidden md:block font-medium text-sm">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 text-slate-400 text-sm hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors"
        >
          <Settings size={18} />
          <span className="hidden md:block">Configuración</span>
        </button>
      </div>
    </div>
  );
};