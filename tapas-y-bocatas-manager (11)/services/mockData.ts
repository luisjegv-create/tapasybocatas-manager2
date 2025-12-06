

import { InventoryItem, Product, Category, Unit, Order, SupplierInvoice, Expense, ExpenseCategory, InventoryType, Table, Zone, Staff } from '../types';

export const initialInventory: InventoryItem[] = [
  { id: '1', name: 'Jamón Serrano', quantity: 5.5, unit: Unit.KG, costPerUnit: 25.0, minStock: 2, type: InventoryType.FOOD },
  { id: '2', name: 'Pan Barra', quantity: 50, unit: Unit.UNIT, costPerUnit: 0.40, minStock: 10, type: InventoryType.FOOD },
  { id: '3', name: 'Queso Manchego', quantity: 3.2, unit: Unit.KG, costPerUnit: 18.0, minStock: 1, type: InventoryType.FOOD },
  { id: '4', name: 'Tomate', quantity: 10, unit: Unit.KG, costPerUnit: 1.5, minStock: 3, type: InventoryType.FOOD },
  { id: '5', name: 'Aceite Oliva', quantity: 20, unit: Unit.L, costPerUnit: 6.0, minStock: 5, type: InventoryType.FOOD },
  { id: '6', name: 'Platos Pizarra', quantity: 45, unit: Unit.UNIT, costPerUnit: 3.0, minStock: 50, type: InventoryType.MENAJE },
  { id: '7', name: 'Copas Vino', quantity: 30, unit: Unit.UNIT, costPerUnit: 2.5, minStock: 40, type: InventoryType.MENAJE },
  { id: '8', name: 'Patatas', quantity: 25, unit: Unit.KG, costPerUnit: 0.8, minStock: 5, type: InventoryType.FOOD },
  { id: '9', name: 'Huevos', quantity: 60, unit: Unit.UNIT, costPerUnit: 0.15, minStock: 12, type: InventoryType.FOOD },
  { id: '10', name: 'Coca Cola', quantity: 48, unit: Unit.UNIT, costPerUnit: 0.60, minStock: 12, type: InventoryType.DRINK },
  { id: '11', name: 'Vino Rioja Crianza', quantity: 12, unit: Unit.UNIT, costPerUnit: 4.50, minStock: 4, type: InventoryType.DRINK },
  { id: '12', name: 'Vermut Casero', quantity: 10, unit: Unit.L, costPerUnit: 3.00, minStock: 2, type: InventoryType.DRINK },
  { id: '13', name: 'Lejía', quantity: 5, unit: Unit.L, costPerUnit: 0.90, minStock: 2, type: InventoryType.CLEANING },
  { id: '14', name: 'Lavavajillas Industrial', quantity: 20, unit: Unit.L, costPerUnit: 2.50, minStock: 5, type: InventoryType.CLEANING },
  { id: '15', name: 'Servilletas Papel', quantity: 1000, unit: Unit.UNIT, costPerUnit: 0.01, minStock: 200, type: InventoryType.MENAJE },
  { id: '16', name: 'Café Grano', quantity: 5, unit: Unit.KG, costPerUnit: 12.00, minStock: 1, type: InventoryType.DRINK },
  { id: '17', name: 'Cerveza Barril', quantity: 50, unit: Unit.L, costPerUnit: 2.20, minStock: 10, type: InventoryType.DRINK },
  // DISRUPTIVE WINE DATA
  { 
    id: 'w1', name: 'Protos Roble', quantity: 24, unit: Unit.UNIT, costPerUnit: 8.50, minStock: 6, type: InventoryType.WINE,
    wineDetails: { type: 'tinto', vintage: '2021', region: 'Ribera del Duero', grape: 'Tempranillo' }
  },
  { 
    id: 'w2', name: 'José Pariente', quantity: 12, unit: Unit.UNIT, costPerUnit: 11.20, minStock: 3, type: InventoryType.WINE,
    wineDetails: { type: 'blanco', vintage: '2022', region: 'Rueda', grape: 'Verdejo' }
  },
  { 
    id: 'w3', name: 'Moët & Chandon', quantity: 6, unit: Unit.UNIT, costPerUnit: 35.00, minStock: 2, type: InventoryType.WINE,
    wineDetails: { type: 'espumoso', vintage: 'NV', region: 'Champagne', grape: 'Chardonnay' }
  },
  // DISRUPTIVE SPIRITS DATA
  {
    id: 's1', name: 'Beefeater', quantity: 6, unit: Unit.UNIT, costPerUnit: 12.50, minStock: 2, type: InventoryType.SPIRITS,
    spiritDetails: { type: 'gin', style: 'London Dry', origin: 'UK', aging: '-' }
  },
  {
    id: 's2', name: 'Macallan 12', quantity: 2, unit: Unit.UNIT, costPerUnit: 65.00, minStock: 1, type: InventoryType.SPIRITS,
    spiritDetails: { type: 'whisky', style: 'Single Malt', origin: 'Escocia', aging: '12 Años' }
  },
  {
    id: 's3', name: 'Yzaguirre Rojo', quantity: 12, unit: Unit.UNIT, costPerUnit: 8.00, minStock: 4, type: InventoryType.SPIRITS,
    spiritDetails: { type: 'vermut', style: 'Rojo Clásico', origin: 'Reus', aging: 'Reserva' }
  }
];

export const initialProducts: Product[] = [
  {
    id: 'p1', name: 'Tapa Jamón', price: 4.50, category: Category.TAPAS,
    recipe: [{ inventoryItemId: '1', quantityRequired: 0.05 }, { inventoryItemId: '2', quantityRequired: 0.1 }]
  },
  {
    id: 'p2', name: 'Bocata de Queso', price: 5.00, category: Category.BOCATAS,
    recipe: [{ inventoryItemId: '3', quantityRequired: 0.08 }, { inventoryItemId: '2', quantityRequired: 1 }]
  },
  {
    id: 'p3', name: 'Tortilla Española', price: 3.50, category: Category.TAPAS,
    recipe: [{ inventoryItemId: '8', quantityRequired: 0.2 }, { inventoryItemId: '9', quantityRequired: 2 }]
  },
  {
    id: 'p4', name: 'Pan con Tomate', price: 2.50, category: Category.TAPAS,
    recipe: [{ inventoryItemId: '2', quantityRequired: 0.5 }, { inventoryItemId: '4', quantityRequired: 0.1 }, { inventoryItemId: '5', quantityRequired: 0.02 }]
  },
  {
    id: 'p5', name: 'Coca Cola Zero', price: 2.50, category: Category.REFRESCOS,
    recipe: [{ inventoryItemId: '10', quantityRequired: 1 }]
  },
  {
    id: 'p6', name: 'Copa Rioja', price: 3.50, category: Category.VINOS,
    recipe: [{ inventoryItemId: '11', quantityRequired: 0.15 }]
  },
  {
    id: 'p7', name: 'Vermut de la Casa', price: 3.00, category: Category.VERMUT,
    recipe: [{ inventoryItemId: '12', quantityRequired: 0.15 }]
  },
  {
    id: 'p8', name: 'Gin Tonic', price: 8.00, category: Category.COPAS,
    recipe: [] // Add gin/tonic later
  }
];

export const initialOrders: Order[] = [
  { id: 'o1', date: new Date().toISOString(), items: [], total: 45.50, status: 'paid' },
  { id: 'o2', date: new Date().toISOString(), items: [], total: 12.00, status: 'paid' },
];

export const initialInvoices: SupplierInvoice[] = [
  { id: 'inv1', date: '2023-10-01', supplierName: 'Embutidos García', totalAmount: 150.00, items: [], status: 'paid' },
  { id: 'inv2', date: '2023-10-05', supplierName: 'Panadería Central', totalAmount: 45.00, items: [], status: 'pending' },
];

export const initialExpenses: Expense[] = [
  { id: 'ex1', date: '2023-10-01', category: ExpenseCategory.RENT, description: 'Alquiler Local Octubre', amount: 850.00 },
  { id: 'ex2', date: '2023-10-02', category: ExpenseCategory.UTILITIES, description: 'Factura Luz Endesa', amount: 210.50 },
  { id: 'ex3', date: '2023-10-05', category: ExpenseCategory.STAFF, description: 'Seguridad Social', amount: 450.00 },
  { id: 'ex4', date: '2023-10-10', category: ExpenseCategory.AGENCY, description: 'Gestoría Trimestral', amount: 120.00 },
];

export const initialTables: Table[] = [
  // BARRA (8 spots)
  { id: 't1', name: 'Barra 1', zone: Zone.BAR, status: 'free' },
  { id: 't2', name: 'Barra 2', zone: Zone.BAR, status: 'free' },
  { id: 't3', name: 'Barra 3', zone: Zone.BAR, status: 'free' },
  { id: 't4', name: 'Barra 4', zone: Zone.BAR, status: 'free' },
  { id: 't5', name: 'Barra 5', zone: Zone.BAR, status: 'free' },
  { id: 't6', name: 'Barra 6', zone: Zone.BAR, status: 'free' },
  { id: 't7', name: 'Barra 7', zone: Zone.BAR, status: 'free' },
  { id: 't8', name: 'Barra 8', zone: Zone.BAR, status: 'free' },
  
  // SALON (8 tables)
  { id: 't9', name: 'Mesa 1', zone: Zone.SALON, status: 'free' },
  { id: 't10', name: 'Mesa 2', zone: Zone.SALON, status: 'free' },
  { id: 't11', name: 'Mesa 3', zone: Zone.SALON, status: 'free' },
  { id: 't12', name: 'Mesa 4', zone: Zone.SALON, status: 'free' },
  { id: 't13', name: 'Mesa 5', zone: Zone.SALON, status: 'free' },
  { id: 't14', name: 'Mesa 6', zone: Zone.SALON, status: 'free' },
  { id: 't15', name: 'Mesa 7', zone: Zone.SALON, status: 'free' },
  { id: 't16', name: 'Mesa 8', zone: Zone.SALON, status: 'free' },
];

export const initialStaff: Staff[] = [
  { id: 's1', name: 'Jefe', role: 'admin', active: true },
  { id: 's2', name: 'Camarero 1', role: 'waiter', active: true },
  { id: 's3', name: 'Camarero 2', role: 'waiter', active: true },
];