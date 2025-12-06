



import React, { useState, useMemo } from 'react';
import { Product, InventoryItem, Unit, Category, RecipeIngredient, Allergen } from '../types';
import { Calculator, ChefHat, Plus, X, Trash2, Scale, DollarSign, ArrowRight, Save, Check, AlertTriangle, Pencil, Info } from 'lucide-react';

interface RecipesProps {
  products: Product[];
  inventory: InventoryItem[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onUpdateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  onDeleteProduct: (productId: string) => void;
}

// Inline Editable Row for existing recipe ingredients
const RecipeRow: React.FC<{
    ingredient: RecipeIngredient;
    inventoryItem: InventoryItem;
    onUpdateQuantity: (qty: number) => void;
    onUpdateCost: (cost: number) => void;
    onRemove: () => void;
}> = ({ ingredient, inventoryItem, onUpdateQuantity, onUpdateCost, onRemove }) => {
    const [quantity, setQuantity] = useState(ingredient.quantityRequired);
    const [cost, setCost] = useState(inventoryItem.costPerUnit);
    const [isDirty, setIsDirty] = useState(false);
    const [showSaved, setShowSaved] = useState(false);

    const handleSave = () => {
        if (quantity !== ingredient.quantityRequired) onUpdateQuantity(quantity);
        if (cost !== inventoryItem.costPerUnit) onUpdateCost(cost);
        setIsDirty(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    const handleChange = (type: 'qty' | 'cost', val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) return;
        
        if (type === 'qty') setQuantity(num);
        if (type === 'cost') setCost(num);
        setIsDirty(true);
    };

    const totalCost = quantity * cost;

    return (
        <tr className="group hover:bg-slate-50 transition-colors">
            <td className="p-3 font-medium text-slate-700">{inventoryItem.name}</td>
            <td className="p-3 text-right">
                <div className="flex items-center justify-end gap-1">
                    <input 
                        type="number" 
                        step="0.001"
                        value={quantity}
                        onChange={(e) => handleChange('qty', e.target.value)}
                        className={`w-24 text-right p-1 border rounded-md font-mono text-sm outline-none focus:ring-1 focus:ring-blue-500
                        ${isDirty ? 'bg-blue-50 border-blue-300' : 'bg-transparent border-transparent'}`}
                    />
                    <span className="text-xs text-slate-500 w-6 text-left">{inventoryItem.unit}</span>
                </div>
            </td>
            <td className="p-3 text-right">
                 <div className="flex items-center justify-end gap-1">
                    <input 
                        type="number" 
                        step="0.001"
                        value={cost}
                        onChange={(e) => handleChange('cost', e.target.value)}
                        className={`w-20 text-right p-1 border rounded-md font-mono text-sm outline-none focus:ring-1 focus:ring-blue-500
                        ${isDirty ? 'bg-blue-50 border-blue-300' : 'bg-transparent border-transparent'}`}
                    />
                    <span className="text-xs text-slate-400">€</span>
                </div>
            </td>
            <td className="p-3 text-right font-bold text-slate-800">
                {totalCost.toFixed(2)}€
            </td>
            <td className="p-3 text-center w-16">
                <div className="flex items-center justify-center gap-1">
                    {isDirty ? (
                        <button onClick={handleSave} className="text-blue-600 hover:scale-110 transition-transform p-1"><Save size={16} /></button>
                    ) : showSaved ? (
                        <Check size={16} className="text-green-600 animate-in fade-in" />
                    ) : null}
                    
                    <button onClick={onRemove} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Quitar ingrediente">
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export const Recipes: React.FC<RecipesProps> = ({ products, inventory, onAddProduct, onUpdateProduct, onUpdateInventoryItem, onDeleteProduct }) => {
  // Use ID selection to prevent stale state issues
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  const selectedProduct = useMemo(() => 
    products.find(p => p.id === selectedProductId) || null
  , [products, selectedProductId]);

  const [showModal, setShowModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null); // New state to track if we are editing

  // New Product Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: Category.TAPAS,
    recipe: [],
    allergens: []
  });
  
  // Ingredient Adder State (Modal)
  const [tempIngredientId, setTempIngredientId] = useState<string>('');
  const [tempQuantityInput, setTempQuantityInput] = useState<number>(0);
  const [tempUnitType, setTempUnitType] = useState<'standard' | 'grams' | 'ml' | 'cl'>('standard');

  // Ingredient Adder State (Detail View)
  const [addIngId, setAddIngId] = useState<string>('');
  const [addIngQty, setAddIngQty] = useState<number>(0);
  const [addIngUnitType, setAddIngUnitType] = useState<'standard' | 'grams' | 'ml' | 'cl'>('standard');

  // Helper to get ingredient details
  const getIngredient = (id: string) => inventory.find(i => i.id === id);

  const calculateCost = (product: Product | Partial<Product>) => {
    return (product.recipe || []).reduce((total, ing) => {
      const item = getIngredient(ing.inventoryItemId);
      return total + (item ? item.costPerUnit * ing.quantityRequired : 0);
    }, 0);
  };

  // Calculate the cost of the currently selected temporary ingredient
  const currentTempCost = () => {
    if (!tempIngredientId || !tempQuantityInput) return 0;
    const item = getIngredient(tempIngredientId);
    if (!item) return 0;

    let finalQty = tempQuantityInput;
    // Conversion Logic
    if (tempUnitType === 'grams' && item.unit === Unit.KG) {
      finalQty = tempQuantityInput / 1000;
    } else if (tempUnitType === 'ml' && item.unit === Unit.L) {
      finalQty = tempQuantityInput / 1000;
    } else if (tempUnitType === 'cl' && item.unit === Unit.L) {
      finalQty = tempQuantityInput / 100;
    }

    return item.costPerUnit * finalQty;
  };

  const handleAddIngredient = () => {
    if (tempIngredientId && tempQuantityInput > 0) {
      const item = getIngredient(tempIngredientId);
      if (!item) return;

      let finalQty = tempQuantityInput;
      // Normalize to storage unit
      if (tempUnitType === 'grams' && item.unit === Unit.KG) {
        finalQty = tempQuantityInput / 1000;
      } else if (tempUnitType === 'ml' && item.unit === Unit.L) {
        finalQty = tempQuantityInput / 1000;
      } else if (tempUnitType === 'cl' && item.unit === Unit.L) {
        finalQty = tempQuantityInput / 100;
      }

      const existing = newProduct.recipe?.find(r => r.inventoryItemId === tempIngredientId);
      if (existing) {
         setNewProduct(prev => ({
          ...prev,
          recipe: prev.recipe?.map(r => 
            r.inventoryItemId === tempIngredientId 
            ? { ...r, quantityRequired: finalQty } 
            : r
          )
        }));
      } else {
        setNewProduct(prev => ({
          ...prev,
          recipe: [...(prev.recipe || []), { inventoryItemId: tempIngredientId, quantityRequired: finalQty }]
        }));
      }
      // Reset temp fields
      setTempIngredientId('');
      setTempQuantityInput(0);
      setTempUnitType('standard');
    }
  };

  const removeIngredient = (id: string) => {
    setNewProduct(prev => ({
      ...prev,
      recipe: prev.recipe?.filter(r => r.inventoryItemId !== id)
    }));
  };

  const toggleAllergen = (allergen: Allergen) => {
    setNewProduct(prev => {
        const current = prev.allergens || [];
        if (current.includes(allergen)) {
            return { ...prev, allergens: current.filter(a => a !== allergen) };
        } else {
            return { ...prev, allergens: [...current, allergen] };
        }
    });
  };

  const applySuggestedPrice = () => {
    const cost = calculateCost(newProduct);
    // Updated Logic: x2 for Wines (50% Margin), x3 for others
    const multiplier = newProduct.category === Category.VINOS ? 2 : 3;
    const suggested = cost * multiplier; 
    setNewProduct(prev => ({ ...prev, price: parseFloat(suggested.toFixed(2)) }));
  };

  // Open Create Modal
  const openCreateModal = () => {
    setNewProduct({ name: '', price: 0, category: Category.TAPAS, recipe: [], allergens: [] });
    setEditingProductId(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleEditFullProduct = () => {
    if (!selectedProduct) return;
    setNewProduct({ ...selectedProduct, allergens: selectedProduct.allergens || [] });
    setEditingProductId(selectedProduct.id);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.name && newProduct.price !== undefined) {
      
      if (editingProductId) {
        // UPDATE EXISTING
        onUpdateProduct(editingProductId, {
            name: newProduct.name,
            price: newProduct.price,
            category: newProduct.category,
            recipe: newProduct.recipe || [],
            allergens: newProduct.allergens || []
        });
      } else {
        // CREATE NEW
        onAddProduct({
            ...newProduct as Product,
            id: Math.random().toString(36).substr(2, 9),
            recipe: newProduct.recipe || [],
            allergens: newProduct.allergens || []
        });
      }
      
      setShowModal(false);
      setNewProduct({ name: '', price: 0, category: Category.TAPAS, recipe: [], allergens: [] });
      setEditingProductId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setProductToDelete(product);
  };

  const confirmDelete = () => {
    if (productToDelete) {
        if (selectedProductId === productToDelete.id) {
          setSelectedProductId(null);
        }
        onDeleteProduct(productToDelete.id);
        setProductToDelete(null);
    }
  };

  // Live Updates for Existing Product
  const handleUpdateIngredientQuantity = (invId: string, newQty: number) => {
    if (!selectedProduct) return;
    const newRecipe = selectedProduct.recipe.map(r => 
        r.inventoryItemId === invId ? { ...r, quantityRequired: newQty } : r
    );
    onUpdateProduct(selectedProduct.id, { recipe: newRecipe });
  };

  const handleUpdateIngredientCost = (invId: string, newCost: number) => {
    onUpdateInventoryItem(invId, { costPerUnit: newCost });
  };

  const handleRemoveIngredientFromExisting = (invId: string) => {
    if (!selectedProduct) return;
    if (window.confirm("¿Quitar este ingrediente de la receta?")) {
        const newRecipe = selectedProduct.recipe.filter(r => r.inventoryItemId !== invId);
        onUpdateProduct(selectedProduct.id, { recipe: newRecipe });
    }
  };

  const handleAddDetailIngredient = () => {
    if (!selectedProduct || !addIngId || addIngQty <= 0) return;
    
    const item = getIngredient(addIngId);
    if (!item) return;

    let finalQty = addIngQty;
    // Conversion Logic for Detail View
    if (addIngUnitType === 'grams' && item.unit === Unit.KG) {
      finalQty = addIngQty / 1000;
    } else if (addIngUnitType === 'ml' && item.unit === Unit.L) {
      finalQty = addIngQty / 1000;
    } else if (addIngUnitType === 'cl' && item.unit === Unit.L) {
      finalQty = addIngQty / 100;
    }

    const newRecipe = [...selectedProduct.recipe];
    const existingIdx = newRecipe.findIndex(r => r.inventoryItemId === addIngId);

    if (existingIdx >= 0) {
        // Add quantity to existing
        newRecipe[existingIdx] = {
            ...newRecipe[existingIdx],
            quantityRequired: newRecipe[existingIdx].quantityRequired + finalQty
        };
    } else {
        // Add new line
        newRecipe.push({
            inventoryItemId: addIngId,
            quantityRequired: finalQty
        });
    }

    onUpdateProduct(selectedProduct.id, { recipe: newRecipe });
    setAddIngId('');
    setAddIngQty(0);
    setAddIngUnitType('standard'); // Reset unit type
  };


  return (
    <div className="p-6 h-full flex flex-col md:flex-row gap-6 bg-slate-50 relative">
      
      {/* Product List */}
      <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-100px)]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <ChefHat size={20} className="text-orange-600" />
            Lista de Platos
          </h2>
          <button 
            onClick={openCreateModal}
            className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 transition-colors shadow-md"
            title="Crear Nuevo Escandallo"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {products.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No hay productos. Crea uno nuevo.
            </div>
          ) : (
            products.map(product => (
              <div
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex justify-between items-center cursor-pointer group border
                  ${selectedProduct?.id === product.id 
                    ? 'bg-orange-50 border-orange-200 shadow-sm' 
                    : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'}`}
              >
                <div className="flex-1">
                  <span className="font-bold text-slate-700 block">{product.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{product.category}</span>
                     <span className="text-sm font-bold text-orange-600">{product.price.toFixed(2)}€</span>
                  </div>
                  {product.allergens && product.allergens.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                          {product.allergens.map(a => (
                              <span key={a} className="text-[9px] bg-red-100 text-red-600 px-1 rounded border border-red-200">{a.substring(0,3)}</span>
                          ))}
                      </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => handleDeleteClick(e, product)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                  title="Borrar producto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Escandallo Detail */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-100px)] overflow-hidden">
        {selectedProduct ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">{selectedProduct.category}</span>
                <h2 className="text-3xl font-bold text-slate-900 mt-1 flex items-center gap-3">
                    {selectedProduct.name}
                </h2>
                {selectedProduct.allergens && selectedProduct.allergens.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {selectedProduct.allergens.map(a => (
                            <span key={a} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                                <AlertTriangle size={12}/> {a}
                            </span>
                        ))}
                    </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                  <button 
                    onClick={handleEditFullProduct}
                    className="bg-white border border-slate-200 text-slate-700 hover:text-orange-600 hover:border-orange-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Pencil size={16} />
                    Editar Ficha
                  </button>
                  <div className="text-right bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase font-bold">P.V.P.</p>
                    <p className="text-2xl font-bold text-slate-900">{selectedProduct.price.toFixed(2)}€</p>
                  </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Scale size={20} />
                Ingredientes y Costes (Editable)
              </h3>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full">
                  <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="p-3 text-left">Ingrediente</th>
                      <th className="p-3 text-right">Cantidad</th>
                      <th className="p-3 text-right">Precio/Unidad</th>
                      <th className="p-3 text-right">Coste Total</th>
                      <th className="p-3 w-16 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProduct.recipe.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          Este producto no tiene ingredientes definidos.
                        </td>
                      </tr>
                    ) : (
                      selectedProduct.recipe.map((ing, idx) => {
                        const item = getIngredient(ing.inventoryItemId);
                        if (!item) return null;
                        return (
                           <RecipeRow 
                             key={ing.inventoryItemId}
                             ingredient={ing}
                             inventoryItem={item}
                             onUpdateQuantity={(qty) => handleUpdateIngredientQuantity(ing.inventoryItemId, qty)}
                             onUpdateCost={(cost) => handleUpdateIngredientCost(ing.inventoryItemId, cost)}
                             onRemove={() => handleRemoveIngredientFromExisting(ing.inventoryItemId)}
                           />
                        );
                      })
                    )}
                  </tbody>
                </table>
                
                {/* Add New Ingredient Row */}
                <div className="bg-slate-50 p-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2 items-center">
                    <div className="flex-1 w-full">
                         <select 
                            value={addIngId}
                            onChange={(e) => {
                                setAddIngId(e.target.value);
                                setAddIngUnitType('standard');
                            }}
                            className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none cursor-pointer bg-white"
                         >
                             <option value="">+ Añadir Ingrediente...</option>
                             {inventory.map(item => (
                                 <option key={item.id} value={item.id}>
                                     {item.name} ({item.unit}) - {item.costPerUnit.toFixed(2)}€
                                 </option>
                             ))}
                         </select>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                            type="number" 
                            step="0.001" 
                            placeholder="Cant."
                            value={addIngQty || ''}
                            onChange={(e) => setAddIngQty(parseFloat(e.target.value))}
                            className="w-20 p-2 text-sm border border-slate-300 rounded-lg outline-none"
                        />
                        
                        {/* Unit Selector for Detail View */}
                        <div className="w-24">
                            <select 
                            value={addIngUnitType}
                            onChange={(e) => setAddIngUnitType(e.target.value as any)}
                            className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none bg-white"
                            disabled={!addIngId}
                            >
                                {addIngId && getIngredient(addIngId) ? (
                                    <>
                                        <option value="standard">{getIngredient(addIngId)?.unit}</option>
                                        {getIngredient(addIngId)?.unit === Unit.KG && <option value="grams">Gramos (g)</option>}
                                        {getIngredient(addIngId)?.unit === Unit.L && (
                                            <>
                                                <option value="ml">Mililitros (ml)</option>
                                                <option value="cl">Centilitros (cl)</option>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <option>-</option>
                                )}
                            </select>
                        </div>

                        <button 
                            onClick={handleAddDetailIngredient}
                            disabled={!addIngId || !addIngQty}
                            className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm"
                            title="Añadir a la receta"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-sm text-red-600 font-medium mb-1">Coste Materia Prima</p>
                  <p className="text-2xl font-bold text-red-700">{calculateCost(selectedProduct).toFixed(2)}€</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <p className="text-sm text-green-600 font-medium mb-1">Margen Beneficio</p>
                  <p className="text-2xl font-bold text-green-700">
                    {(selectedProduct.price - calculateCost(selectedProduct)).toFixed(2)}€
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium mb-1">% Rentabilidad</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {selectedProduct.price > 0 
                      ? (( (selectedProduct.price - calculateCost(selectedProduct)) / selectedProduct.price ) * 100).toFixed(0)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <Calculator size={64} className="mb-4 text-slate-300" />
            <p className="text-lg font-medium">Selecciona un plato para ver su escandallo</p>
            <p className="text-sm">O crea uno nuevo con el botón (+)</p>
          </div>
        )}
      </div>

      {/* NEW/EDIT PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {editingProductId ? <Pencil size={24} className="text-blue-600" /> : <ChefHat size={24} className="text-orange-600" />}
                  {editingProductId ? 'Editar Escandallo' : 'Diseñador de Escandallos'}
                </h2>
                <p className="text-sm text-slate-500">
                    {editingProductId ? 'Modifica los detalles del producto y sus ingredientes' : 'Añade ingredientes para calcular el coste real'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Basic Info Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">1. Información del Plato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                      <input 
                        required
                        type="text" 
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="Ej: Solomillo al Whisky"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                      <select 
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})}
                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white"
                      >
                        {Object.values(Category).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* ALLERGEN SELECTOR */}
                  <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                          <AlertTriangle size={16} className="text-red-500"/> Alérgenos (Seguridad Alimentaria)
                      </label>
                      <div className="flex flex-wrap gap-2">
                          {Object.values(Allergen).map(allergen => {
                              const isSelected = newProduct.allergens?.includes(allergen);
                              return (
                                  <button
                                      key={allergen}
                                      type="button"
                                      onClick={() => toggleAllergen(allergen)}
                                      className={`text-xs px-3 py-1.5 rounded-full border transition-all font-bold flex items-center gap-1
                                          ${isSelected 
                                              ? 'bg-red-100 text-red-700 border-red-300' 
                                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}
                                      `}
                                  >
                                      {isSelected && <Check size={12}/>}
                                      {allergen}
                                  </button>
                              );
                          })}
                      </div>
                  </div>
                </div>

                {/* 2. Ingredients Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                   <div className="flex justify-between items-end mb-4 border-b pb-2">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">2. Composición (Ingredientes)</h3>
                      <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-slate-200"
                            onClick={() => {
                                // Visual feedback for the calculation action
                                const cost = calculateCost(newProduct);
                            }}
                          >
                             <Calculator size={14}/> Calcular Coste
                          </button>
                          <div className="text-right">
                             <span className="text-xs text-slate-500">Coste Actual</span>
                             <p className="text-xl font-bold text-red-600 leading-none">{calculateCost(newProduct).toFixed(2)}€</p>
                          </div>
                      </div>
                   </div>
                  
                  {/* Ingredient Adder Toolbar */}
                  <div className="bg-slate-100 p-4 rounded-lg mb-4 flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Ingrediente</label>
                      <select 
                        value={tempIngredientId}
                        onChange={e => {
                            setTempIngredientId(e.target.value);
                            setTempUnitType('standard'); // Reset unit type on item change
                        }}
                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white text-sm"
                      >
                        <option value="">Seleccionar del Almacén...</option>
                        {inventory.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} (Stock: {item.quantity} {item.unit}) - {item.costPerUnit.toFixed(2)}€/{item.unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-32">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Cantidad</label>
                      <input 
                        type="number"
                        step="0.001"
                        placeholder="0"
                        value={tempQuantityInput || ''}
                        onChange={e => setTempQuantityInput(parseFloat(e.target.value))}
                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none text-sm"
                      />
                    </div>

                    <div className="w-36">
                       <label className="block text-xs font-bold text-slate-500 mb-1">Unidad Medida</label>
                       <select 
                        value={tempUnitType}
                        onChange={e => setTempUnitType(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white text-sm"
                        disabled={!tempIngredientId}
                       >
                         {tempIngredientId && (
                             <>
                                <option value="standard">
                                    {getIngredient(tempIngredientId)?.unit}
                                </option>
                                
                                {getIngredient(tempIngredientId)?.unit === Unit.KG && (
                                    <option value="grams">Gramos (gr)</option>
                                )}
                                
                                {getIngredient(tempIngredientId)?.unit === Unit.L && (
                                    <>
                                        <option value="ml">Mililitros (ml)</option>
                                        <option value="cl">Centilitros (cl)</option>
                                    </>
                                )}
                             </>
                         )}
                       </select>
                    </div>

                    <div className="pb-2 px-2 text-right min-w-[80px]">
                       <span className="block text-xs text-slate-400">Coste</span>
                       <span className="font-bold text-slate-700">{currentTempCost().toFixed(2)}€</span>
                    </div>

                    <button 
                      type="button"
                      onClick={handleAddIngredient}
                      disabled={!tempIngredientId || !tempQuantityInput}
                      className="bg-slate-800 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Añadir
                    </button>
                  </div>

                  {/* Added Ingredients List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {newProduct.recipe?.map((ing, idx) => {
                      const item = getIngredient(ing.inventoryItemId);
                      if (!item) return null;
                      return (
                         <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                           <div className="flex items-center gap-3">
                              <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                                <Scale size={16} />
                              </div>
                              <div>
                                 <span className="text-sm font-bold text-slate-800 block">{item.name}</span>
                                 <span className="text-xs text-slate-500">
                                   {ing.quantityRequired.toFixed(3)} {item.unit} x {item.costPerUnit}€
                                 </span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                             <span className="text-sm font-bold text-slate-700">{(item.costPerUnit * ing.quantityRequired).toFixed(2)}€</span>
                             <button 
                              type="button"
                              onClick={() => removeIngredient(ing.inventoryItemId)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                               <Trash2 size={18} />
                             </button>
                           </div>
                         </div>
                      );
                    })}
                    {(!newProduct.recipe || newProduct.recipe.length === 0) && (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <p className="text-slate-400 text-sm">No hay ingredientes. Usa el formulario de arriba.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Pricing Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                   <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">3. Precio Final</h3>
                   
                   <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1 w-full">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Precio de Venta al Público</label>
                         <div className="relative">
                            <DollarSign className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                              required
                              type="number"
                              step="0.01" 
                              value={newProduct.price}
                              onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                              className="w-full pl-10 p-3 border border-slate-300 rounded-xl text-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="0.00"
                            />
                         </div>
                      </div>

                      <div className="hidden md:flex items-center justify-center pt-6">
                        <ArrowRight className="text-slate-300" />
                      </div>

                      <div className="flex-1 w-full bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                         <div>
                           <p className="text-xs text-blue-600 font-bold uppercase mb-1">
                               Sugerencia ({newProduct.category === Category.VINOS ? 'Margen 50% (x2)' : 'Margen x3'})
                           </p>
                           <p className="text-xs text-slate-500">
                               {newProduct.category === Category.VINOS ? 'Coste Botella x 2' : 'Coste Ingredientes x 3'}
                           </p>
                         </div>
                         <button
                           type="button"
                           onClick={applySuggestedPrice}
                           className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95"
                         >
                           Aplicar: {(calculateCost(newProduct) * (newProduct.category === Category.VINOS ? 2 : 3)).toFixed(2)}€
                         </button>
                      </div>
                   </div>
                </div>

              </form>
            </div>

            <div className="p-5 border-t border-slate-200 bg-white flex gap-4">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="productForm"
                className={`flex-[2] text-white py-3 rounded-xl font-bold text-lg transition-colors shadow-lg
                    ${editingProductId 
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                        : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'
                    }`}
              >
                {editingProductId ? 'Guardar Cambios' : 'Crear Escandallo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Producto?</h3>
                    <p className="text-slate-600 mb-1 font-medium">{productToDelete.name}</p>
                    <p className="text-sm text-slate-500 mb-6">Esta acción es irreversible y eliminará el escandallo asociado.</p>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setProductToDelete(null)}
                            className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDelete}
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