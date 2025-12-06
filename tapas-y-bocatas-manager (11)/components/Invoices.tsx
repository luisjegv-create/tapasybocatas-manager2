
import React, { useState, useRef } from 'react';
import { SupplierInvoice } from '../types';
import { analyzeInvoiceImage, ExtractedInvoiceData } from '../services/geminiService';
import { Upload, Loader2, FileCheck, DollarSign, Calendar, Camera, Image as ImageIcon, Plus, X, Clock, CheckCircle } from 'lucide-react';

interface InvoicesProps {
  invoices: SupplierInvoice[];
  onAddInvoice: (invoice: SupplierInvoice) => void;
  onUpdateInvoice: (id: string, updates: Partial<SupplierInvoice>) => void;
}

export const Invoices: React.FC<InvoicesProps> = ({ invoices, onAddInvoice, onUpdateInvoice }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<ExtractedInvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Manual Entry State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualInvoice, setManualInvoice] = useState<{
      supplierName: string;
      date: string;
      totalAmount: string; // Use string for input handling
      status: 'paid' | 'pending';
  }>({
      supplierName: '',
      date: new Date().toISOString().split('T')[0],
      totalAmount: '',
      status: 'pending'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setPreview(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix for API
        const base64Content = base64String.split(',')[1];
        
        try {
          const data = await analyzeInvoiceImage(base64Content, file.type);
          setPreview(data);
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Error analizando la factura.");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error leyendo el archivo.");
      setIsProcessing(false);
    }
  };

  const confirmInvoice = () => {
    if (preview) {
      const newInvoice: SupplierInvoice = {
        id: Math.random().toString(36).substr(2, 9),
        supplierName: preview.supplierName,
        date: preview.date,
        totalAmount: preview.totalAmount,
        items: preview.items.map(i => ({ itemName: i.itemName, quantity: i.quantity, cost: i.totalCost })),
        imageUrl: "placeholder", // In a real app we'd store the image URL
        status: 'pending' // Default to pending for AI uploads
      };
      onAddInvoice(newInvoice);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const amount = parseFloat(manualInvoice.totalAmount);
      if (manualInvoice.supplierName && !isNaN(amount)) {
          const newInvoice: SupplierInvoice = {
            id: Math.random().toString(36).substr(2, 9),
            supplierName: manualInvoice.supplierName,
            date: manualInvoice.date,
            totalAmount: amount,
            items: [{ itemName: 'Entrada Manual / Varios', quantity: 1, cost: amount }], // Generic item for structure
            imageUrl: undefined,
            status: manualInvoice.status
          };
          onAddInvoice(newInvoice);
          setShowManualModal(false);
          setManualInvoice({
            supplierName: '',
            date: new Date().toISOString().split('T')[0],
            totalAmount: '',
            status: 'pending'
          });
      }
  };

  const toggleStatus = (inv: SupplierInvoice) => {
      const newStatus = inv.status === 'paid' ? 'pending' : 'paid';
      onUpdateInvoice(inv.id, { status: newStatus });
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 bg-slate-50 overflow-y-auto">
      
      {/* Upload Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Upload size={24} className="text-orange-600" />
          Subir Factura de Proveedor
        </h2>
        <p className="text-slate-500 mb-6">Elige cómo quieres introducir la factura en el sistema.</p>
        
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {/* Camera Button */}
            <input
              type="file"
              accept="image/*"
              capture="environment" // Forces rear camera on mobile
              ref={cameraInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              <Camera size={24} />
              Escanear (IA)
            </button>

            {/* File Upload Button */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
            >
              <ImageIcon size={24} />
              Subir Imagen
            </button>

            {/* Manual Entry Button */}
            <button 
              onClick={() => setShowManualModal(true)}
              className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              <Plus size={24} />
              Entrada Manual
            </button>
        </div>

        {isProcessing && (
          <div className="mt-6 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-lg animate-pulse border border-slate-200">
            <Loader2 className="animate-spin text-orange-600 mb-2" size={40} />
            <span className="text-slate-800 font-bold text-lg">Analizando factura con Gemini AI...</span>
            <span className="text-slate-500 text-sm">Esto puede tardar unos segundos</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {preview && (
          <div className="mt-6 border border-green-200 bg-green-50 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-green-800 flex items-center gap-2 text-lg">
                <FileCheck size={24} /> Datos Extraídos
              </h3>
              <button 
                onClick={confirmInvoice}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <FileCheck size={18} />
                Confirmar y Guardar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Proveedor</span>
                <p className="font-bold text-slate-800 text-lg mt-1">{preview.supplierName}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Fecha</span>
                <p className="font-bold text-slate-800 text-lg mt-1">{preview.date}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total</span>
                <p className="font-bold text-slate-800 text-lg mt-1">{preview.totalAmount}€</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-green-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-green-100 text-green-800">
                  <tr>
                    <th className="p-3 text-left font-bold">Item</th>
                    <th className="p-3 text-right font-bold">Cant.</th>
                    <th className="p-3 text-right font-bold">Coste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {preview.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-700">{item.itemName}</td>
                      <td className="p-3 text-right text-slate-600">{item.quantity}</td>
                      <td className="p-3 text-right font-bold text-slate-800">{item.totalCost}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">Historial de Facturas</h3>
          <span className="text-sm font-medium text-slate-500">{invoices.length} facturas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-4 font-semibold text-sm text-slate-600">Estado</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Proveedor</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Fecha</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-right">Importe</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No hay facturas registradas aún.
                  </td>
                </tr>
              ) : (
                invoices.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                        {inv.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-200">
                                <CheckCircle size={12} /> Pagada
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold border border-red-200">
                                <Clock size={12} /> Sin Pagar
                            </span>
                        )}
                    </td>
                    <td className="p-4 font-bold text-slate-800">{inv.supplierName}</td>
                    <td className="p-4 text-slate-500 text-sm font-mono">{inv.date}</td>
                    <td className="p-4 text-right font-bold text-slate-900">{inv.totalAmount.toFixed(2)}€</td>
                    <td className="p-4 text-right">
                       <button
                         onClick={() => toggleStatus(inv)}
                         className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors
                            ${inv.status === 'paid' 
                                ? 'bg-white border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200' 
                                : 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                            }`}
                       >
                           {inv.status === 'paid' ? 'Marcar Pendiente' : 'Marcar Pagada'}
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Plus size={20} className="text-blue-600"/>
                        Nueva Factura Manual
                    </h2>
                    <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Proveedor</label>
                        <input 
                            required
                            autoFocus
                            type="text" 
                            value={manualInvoice.supplierName}
                            onChange={e => setManualInvoice({...manualInvoice, supplierName: e.target.value})}
                            className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Makro, Carnicería..."
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                            <input 
                                required
                                type="date" 
                                value={manualInvoice.date}
                                onChange={e => setManualInvoice({...manualInvoice, date: e.target.value})}
                                className="w-full p-3 border border-slate-300 rounded-xl outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Importe Total (€)</label>
                            <input 
                                required
                                type="number"
                                step="0.01" 
                                value={manualInvoice.totalAmount}
                                onChange={e => setManualInvoice({...manualInvoice, totalAmount: e.target.value})}
                                className="w-full p-3 border border-slate-300 rounded-xl outline-none font-bold"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Estado de Pago</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setManualInvoice({...manualInvoice, status: 'paid'})}
                                className={`flex-1 py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition-all
                                    ${manualInvoice.status === 'paid' 
                                        ? 'bg-green-50 border-green-500 text-green-700' 
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <CheckCircle size={18} />
                                Pagada
                            </button>
                            <button
                                type="button"
                                onClick={() => setManualInvoice({...manualInvoice, status: 'pending'})}
                                className={`flex-1 py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition-all
                                    ${manualInvoice.status === 'pending' 
                                        ? 'bg-red-50 border-red-500 text-red-700' 
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <Clock size={18} />
                                Pendiente
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors mt-4 shadow-lg shadow-blue-200"
                    >
                        Guardar Factura
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};
