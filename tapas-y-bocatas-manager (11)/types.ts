

export enum Unit {
  KG = 'kg',
  L = 'L',
  UNIT = 'unid',
  PORTION = 'ración'
}

export enum Category {
  TAPAS = 'Tapas',
  BOCATAS = 'Bocatas',
  QUESOS = 'Quesos', // Nueva Categoría
  BEBIDAS = 'Bebidas', // Categoría General
  REFRESCOS = 'Refrescos',
  VINOS = 'Vinos',
  VERMUT = 'Vermut',
  COPAS = 'Copas',
  POSTRES = 'Postres',
  CAFES = 'Cafés',
  OTROS = 'Otros'
}

export enum Allergen {
  GLUTEN = 'Gluten',
  CRUSTACEANS = 'Crustáceos',
  EGGS = 'Huevos',
  FISH = 'Pescado',
  PEANUTS = 'Cacahuetes',
  SOY = 'Soja',
  MILK = 'Lácteos',
  NUTS = 'Frutos Cáscara',
  CELERY = 'Apio',
  MUSTARD = 'Mostaza',
  SESAME = 'Sésamo',
  SULPHITES = 'Sulfitos',
  LUPIN = 'Altramuces',
  MOLLUSCS = 'Moluscos'
}

export enum InventoryType {
  FOOD = 'Comida',
  DRINK = 'Bebida',
  WINE = 'Bodega / Vinos', // DISRUPTIVE TYPE
  SPIRITS = 'Bar & Mixología', // NEW DISRUPTIVE TYPE
  CLEANING = 'Limpieza',
  MENAJE = 'Menaje'
}

export enum ExpenseCategory {
  RENT = 'Alquiler',
  UTILITIES = 'Suministros (Luz/Agua/Gas)',
  STAFF = 'Personal / Nóminas',
  TAXES = 'Impuestos',
  AGENCY = 'Gestoría',
  MAINTENANCE = 'Mantenimiento',
  MARKETING = 'Marketing',
  OTHER = 'Otros'
}

export enum Zone {
  BAR = 'Barra',
  SALON = 'Salón',
  TERRACE = 'Terraza'
}

export enum WasteReason {
  EXPIRED = 'Caducado',
  SPOILED = 'Estropeado / Mala Calidad',
  BROKEN = 'Rotura / Accidente',
  KITCHEN_ERROR = 'Error Cocina / Quemado',
  THEFT = 'Robo / Desconocido',
  PROMOTION = 'Invitación / Promo'
}

export interface WasteRecord {
  id: string;
  date: string;
  inventoryItemId: string;
  itemName: string;
  quantity: number;
  unit: Unit;
  costLost: number;
  reason: WasteReason;
  notes?: string;
}

export interface Table {
  id: string;
  name: string;
  zone: Zone;
  status: 'free' | 'occupied' | 'reserved';
  currentOrderId?: string; // Links to an active order
  reservationTime?: string; // e.g. "21:00"
}

export interface Staff {
  id: string;
  name: string;
  role: 'admin' | 'waiter';
  active: boolean;
}

export interface WorkShift {
  id: string;
  staffId: string;
  startTime: string; // ISO String
  endTime?: string; // ISO String (undefined if currently working)
}

export interface CashClosure {
  id: string;
  date: string;
  totalSystem: number; // Gross Sales (Cash + Card)
  totalCard: number; // New: Amount paid by card (not in drawer)
  totalCounted: number; // Physical cash counted
  difference: number; // Counted - (System - Card)
  notes?: string;
}

// Raw ingredient or item in stock (e.g., Bread, Ham, Plates)
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  costPerUnit: number;
  minStock: number; // For warnings
  type: InventoryType; // Distinction between food, drink, cleaning and kitchenware
  
  // WINE SPECIFIC FIELDS
  wineDetails?: {
      type: 'tinto' | 'blanco' | 'rosado' | 'espumoso';
      vintage: string; // Añada
      region: string; // D.O.
      grape: string; // Uva
  };

  // SPIRITS SPECIFIC FIELDS (Bar & Mixología)
  spiritDetails?: {
      type: 'gin' | 'whisky' | 'ron' | 'vodka' | 'vermut' | 'licor' | 'tequila';
      style: string; // e.g. "London Dry", "Single Malt", "Añejo"
      origin: string; // e.g. "Escocia", "Cuba"
      aging: string; // e.g. "12 años", "Reserva"
  };
}

// Recipe link (Escandallo)
export interface RecipeIngredient {
  inventoryItemId: string;
  quantityRequired: number;
}

// Sellable Product
export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  image?: string;
  recipe: RecipeIngredient[]; // The "Escandallo"
  allergens?: Allergen[]; // NEW: Safety feature
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  notes?: string; // Kitchen notes (e.g., "No onions")
  completed?: boolean; // For KDS: individual item marked as done
}

export interface Order {
  id: string;
  date: string; // ISO string
  items: CartItem[];
  total: number;
  status: 'paid' | 'pending';
  kitchenStatus?: 'queued' | 'ready' | 'served'; // For KDS
  tableId?: string; // Linked Table
  waiterId?: string; // Linked Waiter
  paymentMethod?: 'cash' | 'card' | 'house'; // Added 'house' for internal consumption
  discount?: number; // Discount percentage (0-100)
}

export interface SupplierInvoice {
  id: string;
  date: string;
  supplierName: string;
  totalAmount: number;
  items: { itemName: string; quantity: number; cost: number }[];
  imageUrl?: string;
  status: 'paid' | 'pending'; // Added status field
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
}

export interface RestaurantConfig {
    name: string;
    address: string;
    logo?: string; // Base64 string of the logo
}

export interface AppState {
  config: RestaurantConfig; // New config state
  inventory: InventoryItem[];
  products: Product[];
  orders: Order[];
  invoices: SupplierInvoice[];
  expenses: Expense[];
  tables: Table[];
  staff: Staff[];
  shifts: WorkShift[]; // Added shifts tracking
  closures: CashClosure[];
  waste: WasteRecord[]; // NEW: Waste tracking
}