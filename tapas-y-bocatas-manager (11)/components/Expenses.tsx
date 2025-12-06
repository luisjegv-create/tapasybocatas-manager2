
import React, { useState } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { Plus, X, Trash2, Wallet, TrendingDown, DollarSign, Calendar } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [showModal, setShowModal] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    category: ExpenseCategory.OTHER,
    date: new Date().toISOString().split('T')[0]
  });

  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.description && newExpense.amount) {
      onAddExpense({
        ...newExpense as Expense,
        id: Math.random().toString(36).substr(2, 9)
      });
      setShowModal(false);
      setNewExpense({
        description: '',
        amount: 0,
        category: ExpenseCategory.OTHER,
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Control de Gastos Generales</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg"
        >
          <Plus size={16} />
          Registrar Gasto
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-full">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Gastos Variados</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalExpenses.toFixed(2)}€</h3>
          </div>
        </div>
        
        {/* Simple category breakdown */}
        <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium mb-3">Distribución por Categoría</h3>
          <div className="flex gap-4 flex-wrap">
            {Object.values(ExpenseCategory).map(cat => {
              const totalCat = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
              if (totalCat === 0) return null;
              return (
                <div key={cat} className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  <span className="text-xs font-bold text-slate-600 uppercase">{cat}</span>
                  <span className="text-sm font-bold text-slate-900">{totalCat.toFixed(0)}€</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-sm text-slate-600">Fecha</th>
              <th className="p-4 font-semibold text-sm text-slate-600">Categoría</th>
              <th className="p-4 font-semibold text-sm text-slate-600">Descripción / Concepto</th>
              <th className="p-4 font-semibold text-sm text-slate-600 text-right">Importe</th>
              <th className="p-4 font-semibold text-sm text-slate-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
              <tr key={expense.id} className="hover:bg-slate-50">
                <td className="p-4 text-slate-500 text-sm font-mono">{expense.date}</td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                    {expense.category}
                  </span>
                </td>
                <td className="p-4 font-medium text-slate-800">{expense.description}</td>
                <td className="p-4 text-right font-bold text-red-600">-{expense.amount.toFixed(2)}€</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => onDeleteExpense(expense.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No hay gastos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="text-red-600" />
                Registrar Nuevo Gasto
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <div className="relative">
                   <Calendar size={18} className="absolute left-3 top-2.5 text-slate-400" />
                   <input 
                    required
                    type="date" 
                    value={newExpense.date}
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                    className="w-full pl-10 p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                <select 
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value as ExpenseCategory})}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white"
                >
                  {Object.values(ExpenseCategory).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Concepto / Descripción</label>
                <input 
                  required
                  type="text" 
                  value={newExpense.description}
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="Ej: Pago Seguridad Social, Compra Leroy Merlin..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Importe (€)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400">€</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                    className="w-full pl-8 p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors mt-4"
              >
                Guardar Gasto
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
