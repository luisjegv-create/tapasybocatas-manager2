
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { Recipes } from './components/Recipes';
import { Invoices } from './components/Invoices';
import { Expenses } from './components/Expenses';
import { Dashboard } from './components/Dashboard';
import { Tables } from './components/Tables';
import { StaffComponent } from './components/Staff';
import { CashCount } from './components/CashCount';
import { KitchenDisplay } from './components/KitchenDisplay';
import { HelpChat } from './components/HelpChat';
import { AppState, CartItem, SupplierInvoice, InventoryItem, Product, Expense, InventoryType, Staff, CashClosure, Table, Zone, Order, WorkShift, WasteRecord } from './types';
import { initialInventory, initialProducts, initialOrders, initialInvoices, initialExpenses, initialTables, initialStaff } from './services/mockData';
import { Trash2, AlertTriangle, X, Save, RefreshCw, Database, HardDrive, AlertOctagon, Image as ImageIcon, Store, Loader2 } from 'lucide-react';
import { saveToDB, loadFromDB, clearDB } from './services/storageService';

// STABLE PRODUCTION KEY
const DB_KEY = 'tapas_manager_v2_stable';
const INIT_FLAG_KEY = 'tapas_manager_has_init';

export default function App() {
  const [activeTab, setActiveTab] = useState('tables'); 
  const [showSettings, setShowSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'warning' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTableId, setActiveTableId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true); // New loading state for Async DB
  
  // Empty initial state
  const [state, setState] = useState<AppState>({
      config: { name: 'Cargando...', address: '...' },
      inventory: [], products: [], orders: [], invoices: [], expenses: [],
      tables: [], staff: [], shifts: [], closures: [], waste: []
  });

  // INITIAL LOAD & MIGRATION LOGIC (IndexedDB)
  useEffect(() => {
      const initApp = async () => {
          try {
              // 1. Try to load from the BIG DATABASE (IndexedDB)
              const dbData = await loadFromDB(DB_KEY);

              if (dbData) {
                  // Found data in IndexedDB, use it
                  setState(dbData);
              } else {
                  // 2. MIGRATION: Check if we have old data in LocalStorage
                  const localData = localStorage.getItem(DB_KEY);
                  const hasInit = localStorage.getItem(INIT_FLAG_KEY);

                  if (localData) {
                      console.log("Migrating data from LocalStorage to IndexedDB...");
                      const parsed = JSON.parse(localData);
                      setState(parsed);
                      // Save to new DB immediately
                      await saveToDB(DB_KEY, parsed);
                  } else if (hasInit === 'true') {
                      // Initialized before but empty (User cleared data)
                      setState({
                        config: { name: 'Tapas y Bocatas', address: 'Calle Principal 123' },
                        inventory: [], products: [], orders: [], invoices: [], expenses: [],
                        tables: initialTables, staff: initialStaff, shifts: [], closures: [], waste: []
                      });
                  } else {
                      // 3. FIRST TIME EVER: Load Mock Data
                      const demoData = {
                        config: { name: 'Tapas y Bocatas', address: 'Calle Principal 123' },
                        inventory: initialInventory,
                        products: initialProducts,
                        orders: initialOrders,
                        invoices: initialInvoices,
                        expenses: initialExpenses,
                        tables: initialTables,
                        staff: initialStaff,
                        shifts: [],
                        closures: [],
                        waste: []
                      };
                      setState(demoData);
                      await saveToDB(DB_KEY, demoData);
                      localStorage.setItem(INIT_FLAG_KEY, 'true');
                  }
              }
          } catch (error) {
              console.error("Initialization Failed:", error);
              // Fallback to demo data on critical failure
              setState({
                  config: { name: 'Tapas y Bocatas', address: 'Calle Principal 123' },
                  inventory: initialInventory,
                  products: initialProducts,
                  orders: initialOrders,
                  invoices: initialInvoices,
                  expenses: initialExpenses,
                  tables: initialTables,
                  staff: initialStaff,
                  shifts: [],
                  closures: [],
                  waste: []
              });
          } finally {
              setIsLoading(false);
          }
      };

      initApp();
  }, []);

  // ASYNC SAVE LOGIC (IndexedDB)
  useEffect(() => {
    if (isLoading) return; // Don't save empty state while loading

    const saveData = async () => {
        setSaveStatus('saving');
        setSaveMessage('');
        
        try {
            await saveToDB(DB_KEY, state);
            
            setTimeout(() => setSaveStatus('saved'), 500);
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e: any) {
            console.error("Save Failed:", e);
            setSaveStatus('error');
            setSaveMessage('Error al guardar en disco.');
        }
    };
    
    // Debounce save (1000ms) to reduce disk writes
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [state, isLoading]);

  // SETTINGS HANDLERS
  const handleFormatDatabase = async () => {
    if (window.confirm("¡PELIGRO! ¿Estás seguro de que quieres BORRAR TODO? Se eliminará toda la base de datos y la aplicación quedará VACÍA.")) {
        await clearDB();
        localStorage.removeItem(DB_KEY); // Also clear legacy localstorage just in case
        window.location.reload();
    }
  };

  const handleRestoreDemo = async () => {
    if (window.confirm("Esto borrará tus datos actuales y cargará los datos de EJEMPLO. ¿Continuar?")) {
        const demoState: AppState = {
            config: state.config, 
            inventory: initialInventory,
            products: initialProducts,
            orders: initialOrders,
            invoices: initialInvoices,
            expenses: initialExpenses,
            tables: initialTables,
            staff: initialStaff,
            shifts: [],
            closures: [],
            waste: []
        };
        await saveToDB(DB_KEY, demoState);
        window.location.reload();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const img = new Image();
              img.src = reader.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 300; // Increased resolution allowed now (IndexedDB)
                  const scaleSize = MAX_WIDTH / img.width;
                  canvas.width = MAX_WIDTH;
                  canvas.height = img.height * scaleSize;
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                  const resizedBase64 = canvas.toDataURL('image/png', 0.8);
                  
                  setState(prev => ({
                      ...prev,
                      config: { ...prev.config, logo: resizedBase64 }
                  }));
              };
          };
          reader.readAsDataURL(file);
      }
  };

  const handleUpdateConfig = (key: string, value: string) => {
      setState(prev => ({
          ...prev,
          config: { ...prev.config, [key]: value }
      }));
  };

  // --- ACTIONS (Unchanged logic, just updates state) ---

  const handleProcessOrder = (items: CartItem[], paymentMethod: 'cash' | 'card' | 'house' = 'cash', waiterId?: string, status: 'paid' | 'pending' = 'paid', discount: number = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - ((subtotal * discount) / 100);
    
    setState(prev => {
        let newOrders = [...prev.orders];
        let existingOrderIndex = -1;

        if (activeTableId) {
            existingOrderIndex = newOrders.findIndex(o => o.tableId === activeTableId && o.status === 'pending');
        }

        let newOrder: Order;

        if (existingOrderIndex > -1) {
            newOrder = {
                ...newOrders[existingOrderIndex],
                items, 
                total,
                status, 
                paymentMethod,
                waiterId: waiterId || newOrders[existingOrderIndex].waiterId,
                date: new Date().toISOString(),
                discount,
                kitchenStatus: status === 'paid' ? 'served' : newOrders[existingOrderIndex].kitchenStatus || 'queued'
            };
            newOrders[existingOrderIndex] = newOrder;
        } else {
            newOrder = {
                id: Math.random().toString(36).substr(2, 9),
                date: new Date().toISOString(),
                items,
                total,
                status, 
                tableId: activeTableId,
                waiterId: waiterId,
                paymentMethod,
                discount,
                kitchenStatus: 'queued'
            };
            newOrders.push(newOrder);
        }

        let newInventory = [...prev.inventory];
        if (status === 'paid') {
             items.forEach(cartItem => {
                const product = prev.products.find(p => p.id === cartItem.id);
                if (product) {
                    product.recipe.forEach(ingredient => {
                    const invItemIndex = newInventory.findIndex(i => i.id === ingredient.inventoryItemId);
                    if (invItemIndex > -1) {
                        newInventory[invItemIndex] = {
                        ...newInventory[invItemIndex],
                        quantity: newInventory[invItemIndex].quantity - (ingredient.quantityRequired * cartItem.quantity)
                        };
                    }
                    });
                }
            });
        }

        let newTables = [...prev.tables];
        if (activeTableId) {
            newTables = newTables.map(t => {
                if (t.id === activeTableId) {
                    return { ...t, status: status === 'pending' ? 'occupied' : 'free', reservationTime: undefined };
                }
                return t;
            });
        }

        return {
            ...prev,
            orders: newOrders,
            inventory: newInventory,
            tables: newTables
        };
    });
    
    if(status === 'paid' && activeTableId) {
      setActiveTab('tables');
      setActiveTableId(undefined);
    }
  };

  const handleSelectTable = (tableId: string) => {
      setActiveTableId(tableId);
      const newTables = state.tables.map(t => 
        t.id === tableId ? { ...t, status: 'occupied' as const } : t
      );
      setActiveTab('pos');
  };

  const handleAddTable = (table: Table) => {
      setState(prev => ({
          ...prev,
          tables: [...prev.tables, table]
      }));
  };

  const handleUpdateTable = (tableId: string, updates: Partial<Table>) => {
    setState(prev => ({
        ...prev,
        tables: prev.tables.map(t => 
            t.id === tableId ? { ...t, ...updates } : t
        )
    }));
  };

  const getActiveTableItems = (): CartItem[] => {
      if (!activeTableId) return [];
      const pendingOrder = state.orders.find(o => o.tableId === activeTableId && o.status === 'pending');
      return pendingOrder ? pendingOrder.items : [];
  };

  const handleAddInvoice = (invoice: SupplierInvoice) => {
    setState(prev => ({ ...prev, invoices: [...prev.invoices, invoice] }));
  };

  const handleUpdateInvoice = (id: string, updates: Partial<SupplierInvoice>) => {
    setState(prev => ({
        ...prev,
        invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv)
    }));
  };

  const handleAddInventoryItem = (item: InventoryItem) => {
    setState(prev => ({ ...prev, inventory: [...prev.inventory, item] }));
  };

  const handleUpdateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  const handleDeleteInventoryItem = (itemId: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => String(i.id) !== String(itemId))
    }));
  };

  const handleAddWaste = (waste: WasteRecord) => {
      setState(prev => {
          const newWaste = [...prev.waste, waste];
          const newInventory = prev.inventory.map(item => {
              if (item.id === waste.inventoryItemId) {
                  return { ...item, quantity: Math.max(0, item.quantity - waste.quantity) };
              }
              return item;
          });
          return { ...prev, waste: newWaste, inventory: newInventory };
      });
  };

  const handleAddProduct = (product: Product) => {
    setState(prev => ({ ...prev, products: [...prev.products, product] }));
  };

  const handleUpdateProduct = (id: string, updates: Partial<Product>) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const handleDeleteProduct = (productId: string) => {
    setState(prev => ({
        ...prev,
        products: prev.products.filter(p => String(p.id) !== String(productId))
    }));
  };

  const handleAddExpense = (expense: Expense) => {
    setState(prev => ({ ...prev, expenses: [...prev.expenses, expense] }));
  };

  const handleDeleteExpense = (expenseId: string) => {
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== expenseId) }));
  };

  const handleAddStaff = (staffMember: Staff) => {
      setState(prev => ({ ...prev, staff: [...prev.staff, staffMember] }));
  };

  const handleDeleteStaff = (id: string) => {
      setState(prev => ({ ...prev, staff: prev.staff.filter(s => s.id !== id) }));
  };

  const handleClockIn = (staffId: string) => {
      const newShift: WorkShift = {
          id: Math.random().toString(36).substr(2, 9),
          staffId,
          startTime: new Date().toISOString()
      };
      setState(prev => ({ ...prev, shifts: [...prev.shifts, newShift] }));
  };

  const handleClockOut = (staffId: string) => {
      setState(prev => {
          const openShiftIndex = prev.shifts.findIndex(s => s.staffId === staffId && !s.endTime);
          if (openShiftIndex === -1) return prev; 
          const updatedShifts = [...prev.shifts];
          updatedShifts[openShiftIndex] = { ...updatedShifts[openShiftIndex], endTime: new Date().toISOString() };
          return { ...prev, shifts: updatedShifts };
      });
  };

  const handleSaveClosure = (closure: CashClosure) => {
      setState(prev => ({ ...prev, closures: [...prev.closures, closure] }));
  };

  const handleUpdateOrder = (orderId: string, updates: Partial<Order>) => {
      setState(prev => ({
          ...prev,
          orders: prev.orders.map(o => o.id === orderId ? { ...o, ...updates } : o)
      }));
  };

  const handleUpdateOrderItem = (orderId: string, cartId: string, completed: boolean) => {
      setState(prev => ({
          ...prev,
          orders: prev.orders.map(o => {
              if (o.id === orderId) {
                  return {
                      ...o,
                      items: o.items.map(item => item.cartId === cartId ? { ...item, completed } : item)
                  };
              }
              return o;
          })
      }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tables':
          return <Tables 
            tables={state.tables} 
            onSelectTable={handleSelectTable} 
            onUpdateTable={handleUpdateTable} 
            onAddTable={handleAddTable}
          />;
      case 'pos':
        return <POS 
          products={state.products} 
          staff={state.staff}
          tables={state.tables}
          inventory={state.inventory}
          orders={state.orders} 
          activeTableId={activeTableId}
          initialCartItems={getActiveTableItems()}
          onProcessOrder={handleProcessOrder} 
          onAddProduct={handleAddProduct} 
          onDeleteProduct={handleDeleteProduct}
          onSelectTable={handleSelectTable}
          restaurantConfig={state.config}
        />;
      case 'kds':
          return <KitchenDisplay 
            orders={state.orders} 
            tables={state.tables}
            onUpdateOrder={handleUpdateOrder}
            onUpdateItem={handleUpdateOrderItem}
          />;
      case 'inventory':
        return <Inventory 
          inventory={state.inventory} 
          products={state.products} 
          onAddItem={handleAddInventoryItem} 
          onUpdateItem={handleUpdateInventoryItem}
          onDeleteItem={handleDeleteInventoryItem}
          onAddWaste={handleAddWaste}
        />;
      case 'recipes':
        return <Recipes 
          products={state.products} 
          inventory={state.inventory} 
          onAddProduct={handleAddProduct} 
          onUpdateProduct={handleUpdateProduct}
          onUpdateInventoryItem={handleUpdateInventoryItem}
          onDeleteProduct={handleDeleteProduct}
        />;
      case 'invoices':
        return <Invoices 
          invoices={state.invoices} 
          onAddInvoice={handleAddInvoice}
          onUpdateInvoice={handleUpdateInvoice}
        />;
      case 'expenses':
        return <Expenses expenses={state.expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />;
      case 'staff':
        return <StaffComponent 
            staff={state.staff} 
            shifts={state.shifts}
            onAddStaff={handleAddStaff} 
            onDeleteStaff={handleDeleteStaff} 
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
        />;
      case 'cashcount':
        return <CashCount 
            orders={state.orders} 
            closures={state.closures} 
            onSaveClosure={handleSaveClosure} 
        />;
      case 'dashboard':
        return <Dashboard 
          orders={state.orders} 
          invoices={state.invoices} 
          expenses={state.expenses}
          products={state.products}
          inventory={state.inventory}
        />;
      default:
        return <Tables tables={state.tables} onSelectTable={handleSelectTable} onUpdateTable={handleUpdateTable} onAddTable={handleAddTable} />;
    }
  };

  if (isLoading) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
              <Loader2 size={64} className="animate-spin text-orange-500 mb-6" />
              <h1 className="text-3xl font-bold mb-2">Tapas Manager</h1>
              <p className="text-slate-400">Cargando base de datos y migrando memoria...</p>
          </div>
      );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans relative">
      
      {state.config.logo && (
          <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-5 blur-[2px] grayscale">
              <img src={state.config.logo} alt="Watermark" className="w-[600px] h-[600px] object-contain" />
          </div>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenSettings={() => setShowSettings(true)}
        logo={state.config.logo}
      />
      
      <main className="flex-1 h-full overflow-hidden relative z-10">
        {renderContent()}

        <HelpChat />

        {/* Save Indicator & Warning */}
        <div className={`fixed bottom-4 left-4 z-40 transition-all duration-300 transform ${saveStatus === 'idle' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-bold text-white border-2
                ${saveStatus === 'error' ? 'bg-red-600 border-red-400' : 
                  saveStatus === 'warning' ? 'bg-orange-600 border-orange-400' : 
                  'bg-green-600 border-green-400'}
            `}>
                {saveStatus === 'saving' && <RefreshCw className="animate-spin" size={18} />}
                {saveStatus === 'saved' && <Save size={18} />}
                {saveStatus === 'warning' && <AlertOctagon size={18} />}
                {saveStatus === 'error' && <AlertTriangle size={18} />}
                
                <div className="flex flex-col">
                    <span>
                        {saveStatus === 'saving' && 'Guardando en disco...'}
                        {saveStatus === 'saved' && 'Datos guardados'}
                        {saveStatus === 'warning' && 'Aviso de almacenamiento'}
                        {saveStatus === 'error' && 'Error al guardar'}
                    </span>
                    {saveMessage && <span className="text-[10px] font-normal opacity-90">{saveMessage}</span>}
                </div>
            </div>
        </div>

      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Database size={20} />
                        Configuración y Datos
                    </h2>
                    <button onClick={() => setShowSettings(false)} className="hover:text-orange-400 p-1"><X /></button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    
                    {/* RESTAURANT BRANDING SECTION */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                            <Store size={16}/> Personalización del Negocio
                        </h4>
                        
                        <div className="mb-3">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nombre del Bar/Restaurante</label>
                            <input 
                                type="text"
                                value={state.config.name}
                                onChange={(e) => handleUpdateConfig('name', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Dirección (para el Ticket)</label>
                            <input 
                                type="text"
                                value={state.config.address}
                                onChange={(e) => handleUpdateConfig('address', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Logo (Aparecerá en el Ticket)</label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden">
                                    {state.config.logo ? (
                                        <img src={state.config.logo} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <ImageIcon size={24} className="text-slate-300"/>
                                    )}
                                </div>
                                <label className="flex-1 bg-white border border-slate-300 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-50 text-center">
                                    Subir Logo (Se optimizará)
                                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* SYSTEM STATUS */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <h4 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-2"><HardDrive size={16}/> Almacenamiento Profesional</h4>
                        <p className="text-sm text-green-700 mb-2">
                           El sistema está usando <strong>IndexedDB</strong>. Puedes guardar miles de fotos sin límite de 5MB.
                        </p>
                        <p className="text-xs text-green-600 font-mono">
                           Items: {state.products.length} | Stock: {state.inventory.length} | Tickets: {state.orders.length}
                        </p>
                    </div>

                    {/* ACTIONS */}
                    <div>
                        <h3 className="font-bold text-slate-800 mb-2">Restaurar Fábrica</h3>
                        <p className="text-sm text-slate-500 mb-3">Si has eliminado todo por error, pulsa aquí para volver a cargar los productos de ejemplo.</p>
                        <button 
                            onClick={handleRestoreDemo}
                            className="w-full bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors border border-slate-300 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} />
                            Cargar Datos de Ejemplo
                        </button>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                        <h3 className="font-bold text-red-600 mb-2">Zona de Peligro</h3>
                        <p className="text-sm text-slate-500 mb-3">Borra TODO para empezar de cero. Útil si quieres limpiar la app completamente.</p>
                        <button 
                            onClick={handleFormatDatabase}
                            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                        >
                            <Trash2 size={20} />
                            FORMATEAR (Borrar Todo)
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
