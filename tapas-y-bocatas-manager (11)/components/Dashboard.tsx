import React, { useMemo, useState } from 'react';
import { Order, SupplierInvoice, Expense, Product, InventoryItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis, ReferenceLine, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Star, AlertCircle, HelpCircle, ArrowUpRight, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, DollarSign, FileText, ShoppingBag } from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  invoices: SupplierInvoice[];
  expenses: Expense[];
  products: Product[];
  inventory: InventoryItem[];
}

export const Dashboard: React.FC<DashboardProps> = ({ orders, invoices, expenses, products, inventory }) => {
  // STATE FOR CALENDAR
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  
  const totalSupplierInvoices = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalGeneralExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const totalExpenses = totalSupplierInvoices + totalGeneralExpenses;
  const profit = totalSales - totalExpenses;

  // --- MENU ENGINEERING LOGIC ---
  const menuMatrixData = useMemo(() => {
    // 1. Calculate stats per product
    const stats = products.map(product => {
      // Cost of Ingredients
      const cost = product.recipe.reduce((acc, ing) => {
        const invItem = inventory.find(i => i.id === ing.inventoryItemId);
        return acc + (invItem ? invItem.costPerUnit * ing.quantityRequired : 0);
      }, 0);
      
      const margin = product.price - cost;
      
      // Total Qty Sold
      let quantitySold = 0;
      orders.forEach(order => {
        const lineItem = order.items.find(i => i.id === product.id);
        if (lineItem) quantitySold += lineItem.quantity;
      });

      return {
        id: product.id,
        name: product.name,
        sales: quantitySold,
        margin: margin,
        price: product.price,
        cost: cost
      };
    }).filter(p => p.sales > 0); // Only show items with sales

    return stats;
  }, [orders, products, inventory]);

  // Averages for Quadrants
  const avgSales = menuMatrixData.length > 0 ? menuMatrixData.reduce((acc, p) => acc + p.sales, 0) / menuMatrixData.length : 0;
  const avgMargin = menuMatrixData.length > 0 ? menuMatrixData.reduce((acc, p) => acc + p.margin, 0) / menuMatrixData.length : 0;

  // Custom Tooltip for Scatter Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-bold text-slate-800">{data.name}</p>
          <p className="text-sm text-slate-600">Ventas: <span className="font-bold">{data.sales}</span></p>
          <p className="text-sm text-slate-600">Margen: <span className="font-bold text-green-600">{data.margin.toFixed(2)}€</span></p>
        </div>
      );
    }
    return null;
  };

  // Mock data for sales chart (Existing logic)
  const salesData = [
    { name: 'Lun', ventas: 1200, gastos: 800 },
    { name: 'Mar', ventas: 1500, gastos: 600 },
    { name: 'Mie', ventas: 1100, gastos: 900 },
    { name: 'Jue', ventas: 1800, gastos: 700 },
    { name: 'Vie', ventas: 2400, gastos: 1200 },
    { name: 'Sab', ventas: 3200, gastos: 1500 },
    { name: 'Dom', ventas: 2800, gastos: 1000 },
  ];

  // --- CALENDAR HELPERS ---
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    // 0 = Sunday, 1 = Monday, etc. Adjust to make Monday = 0
    let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDataForDate = (date: Date) => {
    const dateStr = date.toDateString();
    
    // Sales
    const dayOrders = orders.filter(o => new Date(o.date).toDateString() === dateStr && o.status === 'paid');
    const sales = dayOrders.reduce((sum, o) => sum + o.total, 0);

    // Invoices
    const dayInvoices = invoices.filter(inv => new Date(inv.date).toDateString() === dateStr);
    const invoiceTotal = dayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Expenses
    const dayExpenses = expenses.filter(exp => new Date(exp.date).toDateString() === dateStr);
    const expenseTotal = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      sales,
      expenses: invoiceTotal + expenseTotal,
      profit: sales - (invoiceTotal + expenseTotal),
      details: { orders: dayOrders, invoices: dayInvoices, generalExpenses: dayExpenses }
    };
  };

  // Render Calendar Grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const startDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 border border-slate-100 opacity-50"></div>);
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const data = getDataForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const hasActivity = data.sales > 0 || data.expenses > 0;

      days.push(
        <div 
          key={d} 
          onClick={() => setSelectedDate(date)}
          className={`h-24 p-2 border border-slate-200 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md relative group
            ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-slate-50'}
          `}
        >
          <div className="flex justify-between items-start">
             <span className={`font-bold text-sm ${isToday ? 'text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>{d}</span>
             {hasActivity && (
                 <span className={`text-[10px] font-bold px-1.5 rounded-full 
                    ${data.profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {data.profit >= 0 ? '+' : ''}{data.profit.toFixed(0)}€
                 </span>
             )}
          </div>
          
          {hasActivity ? (
             <div className="space-y-1">
                 {data.sales > 0 && (
                     <div className="flex justify-between text-[10px] text-green-600 font-medium">
                         <span>Ing:</span>
                         <span>{data.sales.toFixed(0)}€</span>
                     </div>
                 )}
                 {data.expenses > 0 && (
                     <div className="flex justify-between text-[10px] text-red-600 font-medium">
                         <span>Gas:</span>
                         <span>-{data.expenses.toFixed(0)}€</span>
                     </div>
                 )}
             </div>
          ) : (
             <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-20 transition-opacity">
                <span className="text-xs text-slate-400">Ver detalle</span>
             </div>
          )}
        </div>
      );
    }

    return days;
  };

  const selectedDayData = selectedDate ? getDataForDate(selectedDate) : null;

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Resumen Financiero</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-full">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Ventas Totales</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalSales.toFixed(2)}€</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-full">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Facturas Proveedores</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalSupplierInvoices.toFixed(2)}€</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-red-100 text-red-600 rounded-full">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Gastos Generales</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalGeneralExpenses.toFixed(2)}€</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className={`p-4 rounded-full ${profit >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Beneficio Neto</p>
            <h3 className={`text-2xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {profit.toFixed(2)}€
            </h3>
          </div>
        </div>
      </div>

      {/* --- FINANCIAL CALENDAR --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon size={20} className="text-indigo-600"/> Calendario de Facturación
            </h2>
            <div className="flex items-center gap-4">
                <button onClick={prevMonth} className="p-1 hover:bg-slate-200 rounded-full"><ChevronLeft /></button>
                <span className="font-bold text-slate-700 capitalize w-32 text-center">
                    {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-slate-200 rounded-full"><ChevronRight /></button>
            </div>
        </div>
        
        {/* Calendar Grid Header */}
        <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase">{day}</div>
            ))}
        </div>
        
        {/* Calendar Body */}
        <div className="grid grid-cols-7">
            {renderCalendar()}
        </div>
      </div>

      {/* MENU ENGINEERING MATRIX */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
           <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Star className="text-yellow-500" /> Ingeniería de Menú (Popularidad vs Rentabilidad)
              </h3>
              <p className="text-sm text-slate-500">Analiza qué platos mantener, potenciar o eliminar.</p>
           </div>
           
           <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> Estrella (Alta Venta/Margen)</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-400"></div> Caballo (Alta Venta/Bajo Margen)</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-400"></div> Puzzle (Baja Venta/Alto Margen)</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-400"></div> Perro (Baja Venta/Bajo Margen)</div>
           </div>
        </div>

        <div className="h-96 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
               <CartesianGrid />
               <XAxis type="number" dataKey="sales" name="Popularidad (Ventas)" label={{ value: 'Popularidad (Cantidad Vendida)', position: 'insideBottom', offset: -10 }} />
               <YAxis type="number" dataKey="margin" name="Rentabilidad (€)" label={{ value: 'Rentabilidad (Margen €)', angle: -90, position: 'insideLeft' }} />
               <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
               <ZAxis type="number" dataKey="sales" range={[100, 500]} name="Volume" />
               
               {/* Average Lines (Quadrants) */}
               <ReferenceLine x={avgSales} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Media Ventas' }} />
               <ReferenceLine y={avgMargin} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'right', value: 'Media Margen' }} />

               <Scatter name="Platos" data={menuMatrixData} fill="#8884d8">
                  {menuMatrixData.map((entry, index) => {
                    // Logic for coloring
                    const isHighSales = entry.sales >= avgSales;
                    const isHighMargin = entry.margin >= avgMargin;
                    
                    let color = '#ef4444'; // Dog (Red)
                    if (isHighSales && isHighMargin) color = '#eab308'; // Star (Yellow)
                    else if (isHighSales && !isHighMargin) color = '#3b82f6'; // Plowhorse (Blue)
                    else if (!isHighSales && isHighMargin) color = '#22c55e'; // Puzzle (Green)

                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
               </Scatter>
             </ScatterChart>
           </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-slate-50 p-4 rounded-lg">
           <div className="text-center">
              <h4 className="font-bold text-yellow-600">🌟 Estrellas</h4>
              <p className="text-xs text-slate-500">Mantener calidad y visibilidad.</p>
           </div>
           <div className="text-center">
              <h4 className="font-bold text-green-600">❓ Puzzles</h4>
              <p className="text-xs text-slate-500">¡Hacer marketing! Alta ganancia.</p>
           </div>
           <div className="text-center">
              <h4 className="font-bold text-blue-600">🐎 Caballos</h4>
              <p className="text-xs text-slate-500">Subir precio o reducir ración.</p>
           </div>
           <div className="text-center">
              <h4 className="font-bold text-red-600">🐶 Perros</h4>
              <p className="text-xs text-slate-500">Eliminar de la carta.</p>
           </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
          <h3 className="font-bold text-slate-700 mb-4">Ventas vs Gastos (Semana Actual)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="ventas" fill="#f97316" radius={[4, 4, 0, 0]} name="Ventas" />
              <Bar dataKey="gastos" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
          <h3 className="font-bold text-slate-700 mb-4">Evolución del Beneficio</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="ventas" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DAILY DETAIL MODAL */}
      {selectedDate && selectedDayData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
              <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                          <h2 className="text-xl font-bold text-slate-800 capitalize">
                              {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </h2>
                          <div className={`flex items-center gap-2 mt-1 font-bold ${selectedDayData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <span>Saldo Neto: {selectedDayData.profit >= 0 ? '+' : ''}{selectedDayData.profit.toFixed(2)}€</span>
                          </div>
                      </div>
                      <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* SALES COLUMN */}
                          <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                              <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2 border-b border-green-50 pb-2">
                                  <ShoppingBag size={18} /> Ingresos (Tickets)
                              </h3>
                              {selectedDayData.details.orders.length === 0 ? (
                                  <p className="text-sm text-slate-400 italic">Sin ventas registradas.</p>
                              ) : (
                                  <div className="space-y-3">
                                      {selectedDayData.details.orders.map(order => (
                                          <div key={order.id} className="flex justify-between items-center text-sm">
                                              <div>
                                                  <span className="text-slate-500 font-mono text-xs">{new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                                                  <span className="ml-2 font-medium text-slate-700">Ticket #{order.id.substr(0,4)}</span>
                                              </div>
                                              <span className="font-bold text-green-600">+{order.total.toFixed(2)}€</span>
                                          </div>
                                      ))}
                                      <div className="border-t border-green-50 pt-2 mt-2 flex justify-between font-bold text-green-800">
                                          <span>Total Ventas</span>
                                          <span>{selectedDayData.sales.toFixed(2)}€</span>
                                      </div>
                                  </div>
                              )}
                          </div>

                          {/* INVOICES COLUMN */}
                          <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                              <h3 className="font-bold text-orange-700 mb-3 flex items-center gap-2 border-b border-orange-50 pb-2">
                                  <FileText size={18} /> Facturas Prov.
                              </h3>
                              {selectedDayData.details.invoices.length === 0 ? (
                                  <p className="text-sm text-slate-400 italic">Sin facturas este día.</p>
                              ) : (
                                  <div className="space-y-3">
                                      {selectedDayData.details.invoices.map(inv => (
                                          <div key={inv.id} className="flex justify-between items-center text-sm">
                                              <span className="text-slate-700 truncate max-w-[120px]" title={inv.supplierName}>{inv.supplierName}</span>
                                              <span className="font-bold text-red-600">-{inv.totalAmount.toFixed(2)}€</span>
                                          </div>
                                      ))}
                                      <div className="border-t border-orange-50 pt-2 mt-2 flex justify-between font-bold text-orange-800">
                                          <span>Total Facturas</span>
                                          <span>{selectedDayData.details.invoices.reduce((s,i) => s + i.totalAmount, 0).toFixed(2)}€</span>
                                      </div>
                                  </div>
                              )}
                          </div>

                          {/* EXPENSES COLUMN */}
                          <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                              <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2 border-b border-red-50 pb-2">
                                  <Wallet size={18} /> Gastos Generales
                              </h3>
                              {selectedDayData.details.generalExpenses.length === 0 ? (
                                  <p className="text-sm text-slate-400 italic">Sin gastos extra.</p>
                              ) : (
                                  <div className="space-y-3">
                                      {selectedDayData.details.generalExpenses.map(exp => (
                                          <div key={exp.id} className="flex justify-between items-center text-sm">
                                              <span className="text-slate-700 truncate max-w-[120px]" title={exp.description}>{exp.description}</span>
                                              <span className="font-bold text-red-600">-{exp.amount.toFixed(2)}€</span>
                                          </div>
                                      ))}
                                      <div className="border-t border-red-50 pt-2 mt-2 flex justify-between font-bold text-red-800">
                                          <span>Total Gastos</span>
                                          <span>{selectedDayData.details.generalExpenses.reduce((s,e) => s + e.amount, 0).toFixed(2)}€</span>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};