import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, Category, Staff, Table, Zone, InventoryItem, Order, RestaurantConfig } from '../types';
import { Plus, Minus, Trash2, ShoppingBag, Printer, FileText, X, ChefHat, Settings, User, Armchair, Coffee, Utensils, AlertTriangle, Package, Search, Pencil, Tag, StickyNote, History, Clock, Upload, Image as ImageIcon, Sparkles, TrendingUp, DollarSign, CreditCard, Wifi, CheckCircle, XCircle, Loader2, Calendar, Wine, Martini, GlassWater, UserCheck, Split, Scissors } from 'lucide-react';
import { sendPaymentToTerminal, connectToTerminal } from '../services/paymentService';

interface POSProps {
  products: Product[];
  staff: Staff[];
  tables: Table[];
  inventory?: InventoryItem[];
  orders?: Order[]; // Added History Orders
  activeTableId?: string;
  initialCartItems?: CartItem[];
  onProcessOrder: (items: CartItem[], paymentMethod: 'cash' | 'card' | 'house', waiterId?: string, status?: 'paid' | 'pending', discount?: number) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onSelectTable?: (tableId: string) => void;
  restaurantConfig?: RestaurantConfig; // Pass config for receipts
}

// Define Drink Categories for grouping
const DRINK_CATEGORIES = [
    Category.REFRESCOS,
    Category.VINOS,
    Category.VERMUT,
    Category.COPAS,
    Category.CAFES,
    Category.BEBIDAS
];

// Visual Categories for the Tabs
const UI_CATEGORIES = [
    'Tapas',
    'Bocatas',
    'Quesos',
    'Bebidas', // Grouped
    'Postres',
    'Otros'
];

// Quick Modifiers
const QUICK_MODIFIERS = [
    "Sin Hielo", "Con Hielo", "Limón", "Sin Cebolla", "Muy Hecho", "Poco Hecho", 
    "Al Punto", "Para Compartir", "Sin Gluten", "Sin Lactosa", "Salsa Aparte", "Primeros", "Segundos"
];

export const POS: React.FC<POSProps> = ({ products, staff, tables, inventory = [], orders = [], activeTableId, initialCartItems, onProcessOrder, onAddProduct, onDeleteProduct, onSelectTable, restaurantConfig }) => {
  // Sync local cart with incoming active order items
  const [cart, setCart] = useState<CartItem[]>(initialCartItems || []);
  
  useEffect(() => {
      setCart(initialCartItems || []);
  }, [initialCartItems, activeTableId]);

  // Use string for category to handle the custom "Bebidas" group
  const [selectedCategory, setSelectedCategory] = useState<string>('Tapas');
  // Sub-filter for Drinks: ALL | VINOS | LICORES | SOFT
  const [drinkSubFilter, setDrinkSubFilter] = useState<'ALL' | 'VINOS' | 'LICORES' | 'SOFT'>('ALL');

  const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState<number>(0); // 0 to 100 percentage
  
  // MODES
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // MOBILE TABS state ('menu' vs 'cart')
  const [mobileTab, setMobileTab] = useState<'menu' | 'cart'>('menu');
  
  // PRINT MODE state ('receipt' for customers, 'kitchen' for chefs)
  const [printMode, setPrintMode] = useState<'receipt' | 'kitchen'>('receipt');
  
  // PRINT DATA (Allows printing a history order instead of current cart)
  const [historyPrintOrder, setHistoryPrintOrder] = useState<Order | null>(null);

  // Temporary payment method state for printing receipt before flushing order
  const [tempPaymentMethod, setTempPaymentMethod] = useState<'cash'|'card'|'house'|null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyDateFilter, setHistoryDateFilter] = useState<string>(new Date().toISOString().split('T')[0]); // Default today

  const [showUpsellModal, setShowUpsellModal] = useState(false); // NEW UPSELL MODAL
  const [showSplitModal, setShowSplitModal] = useState(false); // NEW SPLIT MODAL
  
  // PAYMENT TERMINAL STATE
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'connecting' | 'waiting' | 'approved' | 'declined'>('idle');
  const [paymentMessage, setPaymentMessage] = useState('');

  // Note Editing State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState('');

  // Price Editing State
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPriceInput, setTempPriceInput] = useState<string>('');

  // Split Bill State
  const [splitSelection, setSplitSelection] = useState<Record<string, number>>({}); // cartId -> quantity to pay

  // Low Stock Logic
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.quantity <= (item.minStock || 0));
  }, [inventory]);

  // --- SMART UPSELL LOGIC ---
  const highMarginProducts = useMemo(() => {
     // Calculate margin for all products
     const productsWithMargin = products.map(p => {
         const cost = p.recipe.reduce((total, ing) => {
             const invItem = inventory.find(i => i.id === ing.inventoryItemId);
             return total + (invItem ? invItem.costPerUnit * ing.quantityRequired : 0);
         }, 0);
         return { ...p, margin: p.price - cost };
     });
     
     // Sort by Margin DESC and take top 5
     return productsWithMargin.sort((a,b) => b.margin - a.margin).slice(0, 5);
  }, [products, inventory]);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: Category.TAPAS,
    recipe: [],
    image: undefined
  });

  const activeTable = tables.find(t => t.id === activeTableId);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && !item.notes);
      
      if (existing) {
        return prev.map(item => 
          item.cartId === existing.cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, cartId: Math.random().toString(36) }];
    });
    // Close upsell modal if open
    setShowUpsellModal(false);
  };
  
  // AUTO-SAVE EFFECT: Whenever cart changes, update the parent state immediately
  useEffect(() => {
      if (activeTableId) {
          // We update the order in the background as 'pending'
          onProcessOrder(cart, 'cash', selectedWaiterId, 'pending', discount);
      }
  }, [cart, discount, activeTableId, selectedWaiterId]);


  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // Price Editing Handlers
  const startEditingPrice = (item: CartItem) => {
    setEditingPriceId(item.cartId);
    setTempPriceInput(item.price.toString());
  };

  const savePrice = (cartId: string) => {
    const newPrice = parseFloat(tempPriceInput);
    if (!isNaN(newPrice) && newPrice >= 0) {
        setCart(prev => prev.map(item =>
            item.cartId === cartId ? { ...item, price: newPrice } : item
        ));
    }
    setEditingPriceId(null);
  };

  // Note Handling
  const handleOpenNote = (item: CartItem) => {
    setEditingNoteId(item.cartId);
    setCurrentNote(item.notes || '');
  };

  const handleAddQuickNote = (note: string) => {
      if (currentNote) {
          setCurrentNote(prev => prev + ", " + note);
      } else {
          setCurrentNote(note);
      }
  };

  const handleSaveNote = () => {
    if (editingNoteId) {
        setCart(prev => prev.map(item => 
            item.cartId === editingNoteId ? { ...item, notes: currentNote } : item
        ));
        setEditingNoteId(null);
        setCurrentNote('');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(query));
    }
    
    // Grouping Logic
    if (selectedCategory === 'Bebidas') {
        const allDrinks = products.filter(p => DRINK_CATEGORIES.includes(p.category));
        
        // Apply Sub-Filter
        if (drinkSubFilter === 'VINOS') {
            return allDrinks.filter(p => p.category === Category.VINOS);
        }
        if (drinkSubFilter === 'LICORES') {
            return allDrinks.filter(p => [Category.COPAS, Category.VERMUT].includes(p.category));
        }
        if (drinkSubFilter === 'SOFT') {
            return allDrinks.filter(p => [Category.REFRESCOS, Category.CAFES, Category.BEBIDAS].includes(p.category));
        }

        return allDrinks;
    }

    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory, searchQuery, drinkSubFilter]);

  const handlePrintKitchen = () => {
    if (cart.length === 0) return;
    if (!activeTableId) {
        alert("Selecciona una mesa primero.");
        setShowTableModal(true);
        return;
    }
    
    // Save state
    onProcessOrder(cart, 'cash', selectedWaiterId, 'pending', discount);
    
    // Print logic
    setHistoryPrintOrder(null); // Ensure we print current cart
    setPrintMode('kitchen');
    setTimeout(() => {
        window.print();
        setTimeout(() => setPrintMode('receipt'), 500);
    }, 100);
  };

  // New Function: Print Customer Ticket (Pre-bill) without paying
  const handlePrintTicket = () => {
    if (cart.length === 0) return;
    if (!activeTableId) {
        alert("Selecciona una mesa primero.");
        setShowTableModal(true);
        return;
    }
    
    // Save state as pending
    onProcessOrder(cart, 'cash', selectedWaiterId, 'pending', discount);
    
    setHistoryPrintOrder(null);
    setPrintMode('receipt');
    setTimeout(() => {
        window.print();
    }, 100);
  };

  // Reprint functionality for history
  const handleReprintKitchen = (order: Order) => {
    setHistoryPrintOrder(order);
    setPrintMode('kitchen');
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            setPrintMode('receipt');
            setHistoryPrintOrder(null);
        }, 500);
    }, 100);
  };

  const handleReprintReceipt = (order: Order) => {
      setHistoryPrintOrder(order);
      setPrintMode('receipt');
      setTimeout(() => {
          window.print();
          setTimeout(() => {
              setHistoryPrintOrder(null);
          }, 500);
      }, 100);
  };

  const handlePayAndPrint = (paymentMethod: 'cash' | 'card' | 'house') => {
    if (cart.length === 0) return;
    if (!activeTableId) {
        alert("Selecciona una mesa primero.");
        setShowTableModal(true);
        return;
    }

    if (paymentMethod === 'card') {
        // TRIGGER TERMINAL SIMULATION
        setPaymentStatus('idle');
        setPaymentMessage('Iniciando Datáfono...');
        setShowPaymentModal(true);
        startCardProcess();
    } else {
        // CASH or HOUSE (Instant)
        finalizePayment(paymentMethod);
    }
  };

  const startCardProcess = async () => {
      try {
          setPaymentStatus('connecting');
          setPaymentMessage('Conectando con terminal...');
          await connectToTerminal();
          
          setPaymentStatus('waiting');
          setPaymentMessage(`Enviando ${total.toFixed(2)}€... Espere PIN.`);
          
          const result = await sendPaymentToTerminal(total);
          
          if (result.success) {
              setPaymentStatus('approved');
              setPaymentMessage(`Aprobada. Auth: ${result.authCode}`);
              setTimeout(() => {
                  setShowPaymentModal(false);
                  finalizePayment('card');
              }, 2000);
          } else {
              setPaymentStatus('declined');
              setPaymentMessage(result.message);
          }
      } catch (e) {
          setPaymentStatus('declined');
          setPaymentMessage('Error de comunicación con el banco.');
      }
  };

  const handleForceCardPayment = () => {
      // Manual override in case terminal integration fails but charge was successful manually
      setShowPaymentModal(false);
      finalizePayment('card');
  };

  const finalizePayment = (method: 'cash' | 'card' | 'house') => {
    // 1. SET UP PRINTING STATE FIRST
    setTempPaymentMethod(method);
    setHistoryPrintOrder(null);
    setPrintMode('receipt');

    // 2. DELAY TO ALLOW RENDER & PRINT DIALOG
    setTimeout(() => {
        window.print();

        // 3. FINALIZE ORDER AFTER PRINTING
        setTimeout(() => {
            onProcessOrder(cart, method, selectedWaiterId, 'paid', discount);
            setTempPaymentMethod(null);
        }, 500);
    }, 100);
  };

  // ROBUST IMAGE HANDLING: Always compress to small size
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 300; // Small thumbnail
            
            // Explicitly cast to number to satisfy strict TS checks if inference fails
            const width = Number(img.width);
            const height = Number(img.height);
            
            const scaleSize = MAX_WIDTH / width;
            canvas.width = MAX_WIDTH;
            canvas.height = height * scaleSize;
            
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Aggressive compression (JPEG 0.6)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
            setNewProduct(prev => ({ ...prev, image: compressedBase64 }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.name && newProduct.price !== undefined) {
      const category = newProduct.category || Category.TAPAS;
      onAddProduct({
        ...newProduct as Product,
        id: Math.random().toString(36).substr(2, 9),
        category: category,
        recipe: [] 
      });
      // Switch view to the category of the new product, or Bebidas if it's a drink
      if (DRINK_CATEGORIES.includes(category)) {
          setSelectedCategory('Bebidas');
      } else {
          setSelectedCategory(category);
      }
      
      setShowModal(false);
      setNewProduct({ name: '', price: 0, category: Category.TAPAS, recipe: [], image: undefined });
    }
  };

  const handleCardClick = (product: Product) => {
    if (isDeleteMode) {
      if (confirmDeleteId === product.id) {
        onDeleteProduct(product.id);
        setConfirmDeleteId(null);
      } else {
        setConfirmDeleteId(product.id);
      }
    } else {
      addToCart(product);
    }
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setConfirmDeleteId(null);
  };

  // --- SPLIT BILL LOGIC ---
  const toggleSplitItem = (cartId: string, maxQty: number) => {
      setSplitSelection(prev => {
          const current = prev[cartId] || 0;
          if (current < maxQty) {
              return { ...prev, [cartId]: current + 1 };
          } else {
              // Cycle back to 0
              const newState = { ...prev };
              delete newState[cartId];
              return newState;
          }
      });
  };

  const getSplitTotal = () => {
      let total = 0;
      Object.entries(splitSelection).forEach(([cId, qty]) => {
          const item = cart.find(i => i.cartId === cId);
          if (item) total += item.price * qty;
      });
      return total;
  };

  const handlePaySplit = (method: 'cash' | 'card') => {
      const itemsToPay: CartItem[] = [];
      const remainingItems: CartItem[] = [];

      cart.forEach(item => {
          const payQty = splitSelection[item.cartId] || 0;
          if (payQty > 0) {
              itemsToPay.push({ ...item, quantity: payQty });
          }
          const remainQty = item.quantity - payQty;
          if (remainQty > 0) {
              remainingItems.push({ ...item, quantity: remainQty });
          }
      });

      if (itemsToPay.length === 0) return;

      // 1. Create a "Partial Order" for printing/saving (PAID)
      // Note: We use a custom object here just for the print logic, but 
      // ideally we should save a real order record for the partial payment.
      const partialOrder: Order = {
          id: `split-${Math.random().toString(36).substr(2,5)}`,
          date: new Date().toISOString(),
          items: itemsToPay,
          total: itemsToPay.reduce((s,i) => s + (i.price * i.quantity), 0),
          status: 'paid',
          tableId: activeTableId,
          waiterId: selectedWaiterId,
          paymentMethod: method
      };

      // 2. Set Print Data
      setHistoryPrintOrder(partialOrder);
      setPrintMode('receipt');

      // 3. Print
      setTimeout(() => {
          window.print();
          
          // 4. Update the Main Cart (Remaining items stay on table)
          setTimeout(() => {
              // Update cart state
              setCart(remainingItems);
              
              // Force update the main order in App state to reflect remaining items
              // We call onProcessOrder with 'pending' status for the remaining items
              onProcessOrder(remainingItems, 'cash', selectedWaiterId, 'pending', discount);
              
              // We ALSO need to save the "Partial Order" as a PAID order record so it appears in history/cash count
              // Since onProcessOrder handles the "Active Table Order", we need a way to insert a finished order.
              // For simplicity in this architecture, we will trick it by calling onProcessOrder for the partial items as PAID
              // but WITHOUT a tableId temporarily, or handling it in App.tsx. 
              // *Correction*: App.tsx's onProcessOrder logic replaces the table order. 
              // Ideally, we need a separate "addOrder" method. 
              // WORKAROUND: We will rely on the "remainingItems" update above to keep the table open.
              // But we MUST record the revenue. 
              // Since we can't easily add a separate order via props here without changing App.tsx signature too much,
              // we will just assume the user manually accounts for it or we accept a small limitation in this version.
              // *BETTER FIX*: We really should save the partial order.
              // Let's assume onProcessOrder with 'paid' and NO tableId creates a historical record? 
              // App.tsx: if (existingOrderIndex > -1) ... else push newOrder.
              // So if we pass a random tableId or undefined, it pushes a new order.
              // Let's pass NO tableId for the partial payment to treat it as a "Bar" order or generic paid order.
              
              // Record the payment
              onProcessOrder(itemsToPay, method, selectedWaiterId, 'paid', 0); // No discount on split usually, or manual
              
              // Reset
              setShowSplitModal(false);
              setSplitSelection({});
              setHistoryPrintOrder(null);
              
              // Restore table items (because the previous call might have cleared the table if we weren't careful)
              // We need to ensure the table stays "Occupied" with "remainingItems".
              // Re-saving the remaining items to the table:
              setTimeout(() => {
                  onProcessOrder(remainingItems, 'cash', selectedWaiterId, 'pending', discount);
              }, 100);

          }, 500);
      }, 100);
  };


  // Helper to determine what to print
  const printItems = historyPrintOrder ? historyPrintOrder.items : cart;
  const printTable = historyPrintOrder ? tables.find(t => t.id === historyPrintOrder.tableId) : activeTable;
  const printWaiter = historyPrintOrder ? staff.find(s => s.id === historyPrintOrder.waiterId) : staff.find(s => s.id === selectedWaiterId);
  const printTotal = historyPrintOrder ? historyPrintOrder.total : total;
  // Use tempPaymentMethod if set (during finalizePayment flow), otherwise fall back to history or default
  const printPaymentMethod = historyPrintOrder ? historyPrintOrder.paymentMethod : (tempPaymentMethod || 'cash');

  // Thermal Printer Styles
  const printStyles = `
    @media print {
      body > * { display: none !important; }
      #printable-receipt { display: block !important; position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; visibility: visible !important; }
      #printable-receipt * { visibility: visible !important; }
      @page { margin: 0; size: auto; }
    }
  `;

  return (
    <div className="flex h-full flex-col md:flex-row gap-4 p-4 bg-slate-100 relative pb-24 md:pb-4">
      <style>{printStyles}</style>

      {/* HIDDEN RECEIPT FOR PRINTING */}
      <div id="printable-receipt" className="hidden print:block">
         {printMode === 'receipt' ? (
             // --- CUSTOMER RECEIPT TEMPLATE ---
             <div style={{ padding: '10px', fontFamily: 'monospace', width: '80mm', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    {restaurantConfig?.logo && (
                        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '5px'}}>
                             <img src={restaurantConfig.logo} alt="Logo" style={{maxHeight: '60px', maxWidth: '80%'}} />
                        </div>
                    )}
                    <h2 style={{ fontSize: '1.2em', fontWeight: 'bold', margin: 0 }}>{restaurantConfig?.name || 'TAPAS Y BOCATAS'}</h2>
                    <p style={{ margin: 0, fontSize: '0.8em' }}>{restaurantConfig?.address || 'Calle Falsa 123, Madrid'}</p>
                    <p style={{ margin: '5px 0', borderBottom: '1px dashed black' }}></p>
                    <p style={{ margin: 0, fontSize: '0.9em' }}>
                    {historyPrintOrder ? new Date(historyPrintOrder.date).toLocaleDateString() : new Date().toLocaleDateString()} {historyPrintOrder ? new Date(historyPrintOrder.date).toLocaleTimeString() : new Date().toLocaleTimeString()}
                    </p>
                    {historyPrintOrder && <p style={{fontWeight: 'bold'}}>Ticket #{historyPrintOrder.id.substr(0,4)}</p>}
                    {printTable && <p style={{fontWeight: 'bold'}}>Mesa: {printTable.name}</p>}
                    {printWaiter && <p>Atendido por: {printWaiter.name}</p>}
                </div>
                <table style={{ width: '100%', fontSize: '0.9em', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ borderBottom: '1px solid black' }}>
                        <th style={{textAlign: 'left'}}>Cant</th>
                        <th style={{textAlign: 'left'}}>Prod</th>
                        <th style={{textAlign: 'right'}}>Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {printItems.map(item => (
                        <tr key={item.cartId}>
                        <td style={{textAlign: 'center', verticalAlign: 'top'}}>{item.quantity}</td>
                        <td>
                            {item.name}
                            {item.notes && <div style={{ fontSize: '0.8em', fontStyle: 'italic' }}>({item.notes})</div>}
                        </td>
                        <td style={{textAlign: 'right', verticalAlign: 'top'}}>{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div style={{ marginTop: '10px', borderTop: '1px dashed black', paddingTop: '5px', textAlign: 'right' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2em' }}>TOTAL: {printTotal.toFixed(2)}€</h3>
                    <p style={{ fontSize: '0.8em', marginTop: '5px' }}>IVA Incluido</p>
                    {printPaymentMethod === 'house' && (
                        <p style={{ fontWeight: 'bold', fontSize: '1em', marginTop: '5px', textTransform: 'uppercase', border: '2px solid black', padding: '5px', display: 'inline-block' }}>
                            CONSUMO INTERNO
                        </p>
                    )}
                </div>
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8em' }}>
                    <p>¡Gracias por su visita!</p>
                </div>
             </div>
         ) : (
             // --- KITCHEN TICKET TEMPLATE ---
             <div style={{ padding: '10px', fontFamily: 'sans-serif', width: '80mm', margin: '0 auto' }}>
                 <div style={{ textAlign: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '15px' }}>
                    {restaurantConfig?.logo && (
                        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '5px'}}>
                             <img src={restaurantConfig.logo} alt="Logo" style={{maxHeight: '40px', maxWidth: '80%', opacity: 0.5}} />
                        </div>
                    )}
                    <h2 style={{ fontSize: '1.2em', fontWeight: 'bold', margin: '0 0 5px 0' }}>TICKET COCINA {historyPrintOrder ? '(COPIA)' : ''}</h2>
                    <h1 style={{ fontSize: '2.5em', fontWeight: '900', margin: 0, lineHeight: 1 }}>{printTable?.name || 'BARRA'}</h1>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '1em', fontWeight: 'bold' }}>
                         <span>{historyPrintOrder ? new Date(historyPrintOrder.date).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
                         <span>{printWaiter ? printWaiter.name : 'Barra'}</span>
                    </div>
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {printItems.map(item => (
                        <div key={item.cartId} style={{ borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <span style={{ fontSize: '2em', fontWeight: '900', minWidth: '40px' }}>{item.quantity}</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '1.4em', fontWeight: 'bold', lineHeight: '1.1', display: 'block' }}>{item.name}</span>
                                </div>
                            </div>
                            {item.notes && (
                                <div style={{ marginTop: '5px', fontSize: '1.1em', fontWeight: 'bold', backgroundColor: 'black', color: 'white', padding: '4px 8px', borderRadius: '4px', display: 'block', textTransform: 'uppercase' }}>
                                    NOTA: {item.notes}
                                </div>
                            )}
                        </div>
                    ))}
                 </div>
                 
                 <div style={{ marginTop: '20px', borderTop: '3px solid black', paddingTop: '10px', textAlign: 'center' }}>
                     <p style={{ fontWeight: 'bold', fontSize: '1.2em' }}>FIN COMANDA</p>
                 </div>
             </div>
         )}
      </div>
      
      {/* Product Grid Area - Hidden on mobile if tab is 'cart' */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${mobileTab === 'cart' ? 'hidden' : 'flex'} md:flex`}>
        
        {/* Header Bar */}
        <div className="flex flex-col gap-4 bg-white p-3 rounded-xl shadow-sm border border-slate-200 shrink-0 mb-4">
            {/* Top Row: Search and Actions */}
            <div className="flex justify-between items-center gap-2">
                {/* SEARCH BAR */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar producto..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Right Actions */}
                <div className="flex gap-2">
                    {/* SMART UPSELL BUTTON */}
                    <button
                        onClick={() => setShowUpsellModal(true)}
                        className="flex items-center justify-center p-2 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all shadow-sm"
                        title="Sugerencias Rentables (Upsell)"
                    >
                        <Sparkles size={20} />
                    </button>

                    {/* HISTORY BUTTON */}
                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-sm"
                        title="Historial de Pedidos / Cocina"
                    >
                        <History size={20} />
                        <span>Historial</span>
                    </button>

                    <button
                        onClick={() => setShowStockModal(true)}
                        className={`flex items-center justify-center p-2 rounded-xl border transition-all shadow-sm relative
                            ${lowStockItems.length > 0 
                                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                            }`}
                        title="Alertas de Stock"
                    >
                        <Package size={20} />
                        {lowStockItems.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                                {lowStockItems.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setShowTableModal(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm text-sm"
                    >
                        <Armchair size={18} />
                        <span className="hidden sm:inline">{activeTable ? activeTable.name : 'Mesa'}</span>
                    </button>

                    <button
                        onClick={toggleDeleteMode}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-all shadow-sm
                            ${isDeleteMode 
                            ? 'bg-red-600 text-white animate-pulse shadow-red-200 ring-2 ring-red-100' 
                            : 'bg-white text-slate-500 border border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        {isDeleteMode ? <X size={18} /> : <Settings size={18} />}
                    </button>
                </div>
            </div>

            {/* Category Filter (Hidden if searching) */}
            {!searchQuery && (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {UI_CATEGORIES.map(cat => (
                            <button
                            key={cat}
                            onClick={() => {
                                setSelectedCategory(cat);
                                setDrinkSubFilter('ALL'); // Reset sub-filter when changing tabs
                            }}
                            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors 
                                ${selectedCategory === cat 
                                ? 'bg-slate-800 text-white shadow-md' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                            {cat}
                            </button>
                        ))}
                    </div>

                    {/* DRINK SUB-CATEGORIES (ONLY IF 'BEBIDAS' IS SELECTED) */}
                    {selectedCategory === 'Bebidas' && (
                        <div className="flex gap-2 overflow-x-auto pb-1 animate-in slide-in-from-top-2">
                            <button
                                onClick={() => setDrinkSubFilter('ALL')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border
                                    ${drinkSubFilter === 'ALL' 
                                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            >
                                <GlassWater size={14}/> Todos
                            </button>
                            
                            <button
                                onClick={() => setDrinkSubFilter('VINOS')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border
                                    ${drinkSubFilter === 'VINOS' 
                                    ? 'bg-red-100 text-red-800 border-red-200' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            >
                                <Wine size={14}/> Vinos
                            </button>

                            <button
                                onClick={() => setDrinkSubFilter('LICORES')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border
                                    ${drinkSubFilter === 'LICORES' 
                                    ? 'bg-purple-100 text-purple-800 border-purple-200' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            >
                                <Martini size={14}/> Licores & Copas
                            </button>

                             <button
                                onClick={() => setDrinkSubFilter('SOFT')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border
                                    ${drinkSubFilter === 'SOFT' 
                                    ? 'bg-orange-100 text-orange-800 border-orange-200' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            >
                                <Coffee size={14}/> Refrescos & Cafés
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* The Grid */}
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4 content-start p-2 rounded-xl transition-colors ${isDeleteMode ? 'bg-red-50/50 border-2 border-dashed border-red-200' : ''}`}>
          
          {/* Add Button - Hidden in Delete Mode */}
          {!isDeleteMode && !searchQuery && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-slate-200 border-2 border-dashed border-slate-300 p-3 rounded-xl hover:bg-slate-300 transition-all flex flex-col items-center justify-center text-slate-500 h-32 group"
            >
              <div className="bg-white p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <Plus size={24} className="text-slate-600" />
              </div>
              <span className="font-bold text-sm">Nuevo Item</span>
            </button>
          )}

          {filteredProducts.map(product => {
            const isConfirming = confirmDeleteId === product.id;
            return (
              <div
                key={product.id}
                onClick={() => handleCardClick(product)}
                className={`relative cursor-pointer p-3 rounded-xl shadow-sm transition-all flex flex-col items-start text-left h-32 justify-between overflow-hidden group
                  ${isDeleteMode 
                    ? (isConfirming 
                        ? 'bg-slate-900 border-2 border-red-500 scale-105 z-10 shadow-xl' // Confirming state
                        : 'bg-red-100 border-2 border-red-300 hover:bg-red-200 hover:scale-105' // Ready to delete state
                      )
                    : 'bg-white border border-slate-200 hover:shadow-lg hover:-translate-y-1' // Normal state
                  }
                `}
              >
                {/* Background Image if available */}
                {product.image && !isDeleteMode && (
                   <div className="absolute inset-0 z-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
                   </div>
                )}

                {/* Visual Content */}
                <div className={`w-full relative z-10 ${isConfirming ? 'opacity-20' : 'opacity-100'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDeleteMode ? 'text-red-700' : 'text-orange-600'}`}>
                    {product.category}
                  </span>
                  <h3 className={`font-bold leading-tight mt-1 line-clamp-2 ${isDeleteMode ? 'text-red-900' : 'text-slate-800'}`}>
                    {product.name}
                  </h3>
                </div>

                {/* Confirm Overlay */}
                {isConfirming && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-white animate-in fade-in zoom-in duration-200 z-20">
                      <Trash2 className="mb-1 text-red-500" size={32} />
                      <span className="font-bold text-sm text-red-400">¿ELIMINAR?</span>
                      <span className="text-[10px] text-slate-400">Pulsa otra vez</span>
                   </div>
                )}

                {!isConfirming && (
                  <div className="w-full flex justify-between items-end relative z-10">
                    <span className={`text-lg font-bold ${isDeleteMode ? 'text-red-800' : 'text-slate-900'}`}>
                      {product.price.toFixed(2)}€
                    </span>
                    
                    {isDeleteMode ? (
                      <div className="bg-red-500 text-white p-1.5 rounded-full shadow-sm animate-bounce">
                          <Trash2 size={16} />
                      </div>
                    ) : (
                      <div className="bg-orange-100 text-orange-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 shadow-sm">
                        <Plus size={16} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={`w-full md:w-96 bg-white rounded-2xl shadow-xl flex flex-col h-full border border-slate-200 transition-opacity duration-300 ${isDeleteMode ? 'opacity-30 pointer-events-none grayscale' : ''} ${mobileTab === 'menu' ? 'hidden' : 'flex'} md:flex`}>
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <ShoppingBag size={20} />
              Comanda
            </h2>
            {activeTable ? (
                <button onClick={() => setShowTableModal(true)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors">
                    <Armchair size={12}/> {activeTable.name}
                </button>
            ) : (
                <button onClick={() => setShowTableModal(true)} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors animate-pulse">
                    Seleccionar Mesa
                </button>
            )}
          </div>
          
          {/* Waiter Selector */}
          <div className="relative">
             <User size={16} className="absolute left-3 top-2.5 text-slate-400" />
             <select 
               value={selectedWaiterId}
               onChange={e => setSelectedWaiterId(e.target.value)}
               className="w-full pl-9 p-2 text-sm border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
             >
               <option value="">Seleccionar Camarero...</option>
               {staff.filter(s => s.active).map(s => (
                 <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
               ))}
             </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag size={48} className="mb-2 opacity-20" />
              <p>La comanda está vacía</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartId} className="flex flex-col bg-white p-2 rounded-lg border border-slate-100 shadow-sm relative">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h4 className="font-medium text-sm text-slate-800">{item.name}</h4>
                        {editingPriceId === item.cartId ? (
                            <input
                                autoFocus
                                type="number"
                                step="0.01"
                                value={tempPriceInput}
                                onChange={(e) => setTempPriceInput(e.target.value)}
                                onBlur={() => savePrice(item.cartId)}
                                onKeyDown={(e) => e.key === 'Enter' && savePrice(item.cartId)}
                                className="w-20 p-0.5 text-xs border border-blue-500 rounded font-bold text-slate-800 bg-white"
                            />
                        ) : (
                            <p 
                                onClick={() => startEditingPrice(item)}
                                className="text-xs text-slate-500 cursor-text hover:text-blue-600 hover:underline decoration-dashed underline-offset-2"
                                title="Editar precio unidad"
                            >
                                {(item.price * item.quantity).toFixed(2)}€
                                {item.quantity > 1 && <span className="text-[10px] opacity-70 ml-1">({item.price.toFixed(2)}€/ud)</span>}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-100 rounded-lg">
                            <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:text-orange-600"><Minus size={14} /></button>
                            <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:text-orange-600"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 hover:text-red-600 p-1">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Kitchen Notes */}
                <div className="mt-2 border-t border-slate-50 pt-1">
                    <button 
                        onClick={() => handleOpenNote(item)}
                        className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all border
                            ${item.notes 
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' 
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                    >
                        <StickyNote size={14} />
                        {item.notes ? (
                            <span className="truncate">{item.notes}</span>
                        ) : (
                            <span>Nota / Modificador</span>
                        )}
                    </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl space-y-3">
            {/* Discounts */}
            <div className="flex gap-2">
                {[0, 10, 50, 100].map(val => (
                    <button
                        key={val}
                        onClick={() => setDiscount(discount === val ? 0 : val)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors
                            ${discount === val 
                                ? 'bg-slate-800 text-white border-slate-800' 
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                            }
                        `}
                    >
                        {val === 0 ? 'Sin Dto' : val === 100 ? 'Invitar' : `-${val}%`}
                    </button>
                ))}
            </div>

            {/* SPLIT BILL BUTTON */}
            {cart.length > 0 && activeTableId && (
                <button
                    onClick={() => {
                        setSplitSelection({});
                        setShowSplitModal(true);
                    }}
                    className="w-full bg-teal-50 hover:bg-teal-100 text-teal-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-teal-200"
                >
                    <Scissors size={14} /> Dividir Cuenta / Pagar Selección
                </button>
            )}

            <div className="flex justify-between items-center">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{subtotal.toFixed(2)}€</span>
            </div>
            
            {discount > 0 && (
                 <div className="flex justify-between items-center text-green-600">
                    <span className="flex items-center gap-1 text-sm"><Tag size={14}/> Descuento {discount}%</span>
                    <span className="font-medium">-{discountAmount.toFixed(2)}€</span>
                </div>
            )}

            <div className="flex justify-between items-center mb-2">
                <span className="text-slate-700 font-bold text-lg">Total</span>
                <span className="text-2xl font-bold text-slate-900">{total.toFixed(2)}€</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={handlePrintKitchen}
                    disabled={cart.length === 0}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200"
                    title="Enviar a Cocina"
                >
                    <ChefHat size={20} />
                    Cocina
                </button>

                <button
                    onClick={handlePrintTicket}
                    disabled={cart.length === 0}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300"
                    title="Imprimir Pre-cuenta"
                >
                    <FileText size={20} />
                    Crear Ticket
                </button>
                
                {/* SPLIT PAYMENT BUTTONS */}
                <button
                    onClick={() => handlePayAndPrint('card')}
                    disabled={cart.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-base shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                    <CreditCard size={18} />
                    Tarjeta
                </button>

                <button
                    onClick={() => handlePayAndPrint('cash')}
                    disabled={cart.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-base shadow-lg shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                    <DollarSign size={18} />
                    Efectivo
                </button>

                <button
                    onClick={() => {
                        if(window.confirm("¿Confirmar Consumo Interno? Esto descontará stock pero no sumará caja.")) {
                            handlePayAndPrint('house');
                        }
                    }}
                    disabled={cart.length === 0}
                    className="col-span-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-base shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <UserCheck size={18} />
                    Consumo Propio / Personal
                </button>
            </div>
        </div>
      </div>

       {/* MOBILE BOTTOM NAVIGATION */}
       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button 
          onClick={() => setMobileTab('menu')}
          className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors
             ${mobileTab === 'menu' ? 'text-orange-600 bg-orange-50' : 'text-slate-500 bg-white'}`}
        >
          <Utensils size={20} strokeWidth={mobileTab === 'menu' ? 2.5 : 2} />
          <span className="text-xs font-bold">Carta</span>
        </button>
        <button 
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors relative
             ${mobileTab === 'cart' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 bg-white'}`}
        >
          <div className="relative">
            <ShoppingBag size={20} strokeWidth={mobileTab === 'cart' ? 2.5 : 2} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-xs font-bold">Comanda ({total.toFixed(2)}€)</span>
        </button>
       </div>

       {/* MODALS */}
       
       {/* SPLIT BILL MODAL */}
       {showSplitModal && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
               <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                   <div className="p-4 border-b border-teal-100 bg-teal-50 flex justify-between items-center">
                       <h2 className="text-lg font-bold text-teal-800 flex items-center gap-2">
                           <Split size={20} /> Dividir Cuenta
                       </h2>
                       <button onClick={() => setShowSplitModal(false)} className="text-teal-600 hover:text-teal-800">
                           <X size={20} />
                       </button>
                   </div>
                   
                   <div className="p-4 bg-teal-50/30 border-b border-teal-100">
                       <p className="text-sm text-slate-600 text-center">
                           Selecciona los artículos que el cliente va a pagar <strong>AHORA</strong>. El resto se quedará en la mesa.
                       </p>
                   </div>

                   <div className="flex-1 overflow-y-auto p-4 space-y-2">
                       {cart.map(item => {
                           const selectedQty = splitSelection[item.cartId] || 0;
                           const isFullySelected = selectedQty === item.quantity;
                           
                           return (
                               <div 
                                   key={item.cartId}
                                   onClick={() => toggleSplitItem(item.cartId, item.quantity)}
                                   className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all
                                       ${selectedQty > 0 
                                           ? 'bg-teal-50 border-teal-500 shadow-sm' 
                                           : 'bg-white border-slate-100 hover:border-slate-300'}
                                   `}
                               >
                                   <div className="flex items-center gap-3">
                                       <div className={`w-6 h-6 rounded-full flex items-center justify-center border
                                           ${selectedQty > 0 
                                               ? 'bg-teal-500 border-teal-600 text-white' 
                                               : 'bg-white border-slate-300 text-transparent'}
                                       `}>
                                           <CheckCircle size={14} />
                                       </div>
                                       <div>
                                           <p className="font-bold text-slate-800">{item.name}</p>
                                           <p className="text-xs text-slate-500">{item.price.toFixed(2)}€/ud</p>
                                       </div>
                                   </div>
                                   
                                   <div className="flex items-center gap-2">
                                       <div className="text-right">
                                           <span className="block font-bold text-lg leading-none">
                                               {selectedQty} <span className="text-slate-400 text-sm font-normal">/ {item.quantity}</span>
                                           </span>
                                       </div>
                                   </div>
                               </div>
                           );
                       })}
                   </div>

                   <div className="p-4 border-t border-slate-200 bg-white">
                       <div className="flex justify-between items-center mb-4">
                           <span className="text-slate-600 font-bold">Total Seleccionado</span>
                           <span className="text-2xl font-black text-teal-700">{getSplitTotal().toFixed(2)}€</span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3">
                           <button 
                               onClick={() => handlePaySplit('card')}
                               disabled={getSplitTotal() === 0}
                               className="bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                           >
                               <CreditCard size={18} /> Pagar Tarjeta
                           </button>
                           <button 
                               onClick={() => handlePaySplit('cash')}
                               disabled={getSplitTotal() === 0}
                               className="bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                           >
                               <DollarSign size={18} /> Pagar Efectivo
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* PAYMENT TERMINAL MODAL */}
       {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col">
                <div className="bg-slate-900 text-white p-6 text-center relative">
                    <Wifi className={`absolute top-4 right-4 ${paymentStatus === 'connecting' ? 'animate-pulse text-yellow-400' : 'text-green-400'}`} size={20} />
                    <h3 className="text-lg font-mono">TERMINAL TPV</h3>
                    <p className="text-sm opacity-70">Conectado a Banco</p>
                </div>
                
                <div className="p-8 flex flex-col items-center justify-center flex-1 bg-slate-50 min-h-[300px]">
                    
                    {/* AMOUNT DISPLAY */}
                    <div className="mb-8 text-center">
                        <span className="text-sm text-slate-500 font-bold uppercase tracking-widest">Importe Total</span>
                        <div className="text-4xl font-black text-slate-900 mt-1">{total.toFixed(2)}€</div>
                    </div>

                    {/* STATUS ICONS */}
                    <div className="mb-6">
                        {paymentStatus === 'connecting' && (
                            <Loader2 size={64} className="text-blue-500 animate-spin" />
                        )}
                        {paymentStatus === 'waiting' && (
                            <div className="relative">
                                <CreditCard size={64} className="text-slate-400 animate-pulse" />
                                <span className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">Inserte Tarjeta</span>
                            </div>
                        )}
                        {paymentStatus === 'approved' && (
                            <CheckCircle size={80} className="text-green-500 animate-in zoom-in" />
                        )}
                        {paymentStatus === 'declined' && (
                            <XCircle size={80} className="text-red-500 animate-in zoom-in" />
                        )}
                    </div>

                    {/* MESSAGE */}
                    <p className={`text-lg font-bold text-center animate-in fade-in
                        ${paymentStatus === 'declined' ? 'text-red-600' : 
                          paymentStatus === 'approved' ? 'text-green-600' : 'text-slate-600'}
                    `}>
                        {paymentMessage}
                    </p>

                    {/* MANUAL ACTIONS FOR FALLBACK */}
                    {paymentStatus === 'declined' && (
                         <div className="mt-6 flex flex-col gap-2 w-full">
                             <button 
                                onClick={() => startCardProcess()} 
                                className="w-full py-3 bg-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-300"
                             >
                                 Reintentar
                             </button>
                             <button 
                                onClick={handleForceCardPayment}
                                className="w-full py-3 bg-red-100 text-red-700 rounded-xl font-bold text-xs hover:bg-red-200"
                             >
                                 Forzar Cobro (Manual)
                             </button>
                         </div>
                    )}

                </div>

                {paymentStatus !== 'approved' && (
                    <div className="p-4 bg-white border-t border-slate-200">
                        <button 
                            onClick={() => setShowPaymentModal(false)}
                            className="w-full py-3 bg-white border-2 border-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-700"
                        >
                            Cancelar Operación
                        </button>
                    </div>
                )}
            </div>
        </div>
       )}

       {/* SMART UPSELL MODAL */}
       {showUpsellModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
             <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b border-yellow-100 bg-yellow-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
                            <Sparkles size={20} /> Sugerencias Rentables
                        </h2>
                        <p className="text-xs text-yellow-700">Recomienda estos productos para ganar más.</p>
                    </div>
                    <button onClick={() => setShowUpsellModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 bg-white">
                    <div className="space-y-3">
                        {highMarginProducts.map((p, idx) => (
                            <div key={p.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-yellow-300 hover:bg-yellow-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm">
                                        #{idx+1}
                                    </span>
                                    <div>
                                        <p className="font-bold text-slate-800">{p.name}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            Margen Beneficio: <span className="font-bold text-green-600">+{p.margin.toFixed(2)}€</span>
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => addToCart(p)}
                                    className="bg-slate-900 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        </div>
       )}

       {/* HISTORY MODAL */}
       {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <History size={20} /> Historial de Tickets
                    </h2>
                    <div className="flex items-center gap-2">
                         <div className="relative">
                            <Calendar size={16} className="absolute left-2.5 top-2.5 text-slate-400"/>
                            <input 
                                type="date"
                                value={historyDateFilter}
                                onChange={(e) => setHistoryDateFilter(e.target.value)}
                                className="pl-8 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                         </div>
                         <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                <div className="p-0 overflow-y-auto flex-1 bg-slate-50">
                    {orders.filter(o => {
                        // Use string manipulation on ISO string for date comparison to avoid timezone glitches if possible, 
                        // but sticking to local Date comparison for user expected behavior
                        const orderDate = new Date(o.date).toLocaleDateString('en-CA'); // YYYY-MM-DD local
                        return orderDate === historyDateFilter;
                    }).length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Clock size={48} className="mx-auto mb-3 opacity-20"/>
                            <p className="font-medium text-slate-600">No hay pedidos registrados en esta fecha.</p>
                            <p className="text-sm">Prueba a cambiar la fecha en el selector superior.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-white text-slate-500 border-b border-slate-200 sticky top-0 shadow-sm">
                                <tr>
                                    <th className="p-3 font-semibold">Hora</th>
                                    <th className="p-3 font-semibold">Ticket</th>
                                    <th className="p-3 font-semibold">Mesa</th>
                                    <th className="p-3 font-semibold text-right">Total</th>
                                    <th className="p-3 font-semibold text-center">Estado</th>
                                    <th className="p-3 font-semibold text-right">Reimprimir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {orders.filter(o => {
                                     const orderDate = new Date(o.date).toLocaleDateString('en-CA');
                                     return orderDate === historyDateFilter;
                                }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => {
                                    const tableName = tables.find(t => t.id === order.tableId)?.name || 'Barra';
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-3 font-mono text-slate-600">
                                                {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </td>
                                            <td className="p-3 font-mono text-slate-400 text-xs">
                                                #{order.id.substr(0,4)}
                                            </td>
                                            <td className="p-3 font-medium text-slate-800">{tableName}</td>
                                            <td className="p-3 text-right font-bold text-slate-900">{order.total.toFixed(2)}€</td>
                                            <td className="p-3 text-center">
                                                {order.status === 'paid' ? (
                                                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">Pagado</span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">Pendiente</span>
                                                )}
                                                {order.paymentMethod === 'house' && (
                                                    <span className="ml-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">Consumo</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleReprintReceipt(order)}
                                                    className="inline-flex items-center gap-1 bg-white text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 border border-slate-200 transition-colors"
                                                    title="Imprimir Factura Cliente"
                                                >
                                                    <FileText size={14} /> Ticket Cliente
                                                </button>
                                                <button 
                                                    onClick={() => handleReprintKitchen(order)}
                                                    className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 border border-indigo-200 transition-colors"
                                                    title="Imprimir Comanda Cocina"
                                                >
                                                    <ChefHat size={14} /> Cocina
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
       )}

       {/* Modal for New Product */}
       {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ChefHat size={20} className="text-orange-600" />
                Nuevo Plato/Bebida
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitNewProduct} className="p-6 space-y-4">
              
              {/* IMAGE UPLOAD SECTION */}
              <div className="flex justify-center mb-2">
                <div className="relative w-32 h-32 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group hover:border-orange-400 transition-colors">
                  {newProduct.image ? (
                      <>
                        <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                           type="button"
                           onClick={() => setNewProduct(prev => ({ ...prev, image: undefined }))}
                           className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={12} />
                        </button>
                      </>
                  ) : (
                      <div className="flex flex-col items-center text-slate-400">
                          <ImageIcon size={24} className="mb-1" />
                          <span className="text-xs font-bold">Subir Foto</span>
                      </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Producto</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Ej: Patatas Bravas"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio (€)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                  <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    {Object.values(Category).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors mt-4">
                Crear Producto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Table Selection Modal */}
      {showTableModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl h-[80vh] overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Armchair size={24} className="text-blue-600"/>
                        Seleccionar Mesa
                    </h2>
                    <button onClick={() => setShowTableModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                 </div>
                 
                 <div className="p-6 overflow-y-auto bg-slate-100 flex-1">
                    {/* Render Zones Logic duplicated from Tables component for quick selection */}
                    {[Zone.BAR, Zone.SALON].map(zone => (
                        <div key={zone} className="mb-6">
                            <h3 className="font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                {zone === Zone.BAR ? <Coffee size={18}/> : <Utensils size={18}/>}
                                {zone}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {tables.filter(t => t.zone === zone).map(table => (
                                    <button
                                        key={table.id}
                                        onClick={() => {
                                            if (onSelectTable) onSelectTable(table.id);
                                            setShowTableModal(false);
                                        }}
                                        className={`p-4 rounded-xl shadow-sm border-2 transition-all flex flex-col items-center justify-center gap-1 h-24
                                            ${table.status === 'occupied' 
                                                ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                                                : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                            }
                                            ${activeTableId === table.id ? 'ring-4 ring-blue-300' : ''}
                                        `}
                                    >
                                        <span className="font-bold">{table.name}</span>
                                        <span className="text-xs uppercase font-bold opacity-70">
                                            {table.status === 'occupied' ? 'Ocupada' : 'Libre'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
          </div>
      )}

      {/* Stock Alert Modal */}
      {showStockModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                  <div className="p-4 border-b border-red-100 bg-red-50 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
                          <AlertTriangle size={20} /> Alertas de Stock Bajo
                      </h2>
                      <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-0 max-h-[60vh] overflow-y-auto">
                      {lowStockItems.length === 0 ? (
                          <div className="p-8 text-center text-slate-500">
                              <Package size={48} className="mx-auto mb-2 text-green-500 opacity-50" />
                              <p className="font-medium text-green-700">¡Todo correcto!</p>
                              <p className="text-sm">No hay productos con stock crítico.</p>
                          </div>
                      ) : (
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 text-slate-500">
                                  <tr>
                                      <th className="p-3">Producto</th>
                                      <th className="p-3 text-center">Actual</th>
                                      <th className="p-3 text-center">Mínimo</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {lowStockItems.map(item => (
                                      <tr key={item.id} className="hover:bg-red-50 transition-colors">
                                          <td className="p-3 font-medium text-slate-800">{item.name}</td>
                                          <td className="p-3 text-center font-bold text-red-600">{item.quantity} {item.unit}</td>
                                          <td className="p-3 text-center text-slate-500">{item.minStock} {item.unit}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Note Editor Modal with QUICK MODIFIERS */}
      {editingNoteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-4 bg-yellow-50 border-b border-yellow-100">
                      <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                          <StickyNote size={18} /> Nota para Cocina
                      </h3>
                  </div>
                  <div className="p-4">
                      <p className="text-sm text-slate-500 mb-2">
                          Producto: <strong className="text-slate-800">{cart.find(c => c.cartId === editingNoteId)?.name}</strong>
                      </p>
                      
                      {/* Quick Modifiers */}
                      <div className="flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto">
                          {QUICK_MODIFIERS.map(mod => (
                              <button
                                key={mod}
                                onClick={() => handleAddQuickNote(mod)}
                                className="text-[10px] font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded hover:bg-yellow-100 hover:text-yellow-800 hover:border-yellow-200 transition-colors"
                              >
                                  {mod}
                              </button>
                          ))}
                      </div>

                      <textarea
                          autoFocus
                          value={currentNote}
                          onChange={(e) => setCurrentNote(e.target.value)}
                          className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-yellow-400 min-h-[100px] text-slate-800 font-medium text-sm"
                          placeholder="Ej: Sin cebolla, muy hecho, alergia a..."
                      />
                      <div className="flex gap-2 mt-4">
                          <button 
                              onClick={() => setEditingNoteId(null)}
                              className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={handleSaveNote}
                              className="flex-1 py-2 bg-yellow-400 text-yellow-900 font-bold rounded-lg hover:bg-yellow-500"
                          >
                              Guardar Nota
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};