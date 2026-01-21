import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Save, ShoppingBag, FileText, CheckCircle2 } from 'lucide-react';

const Admin = () => {
    const { prices, updateProduct, addProduct, deleteProduct, defaults, updateDefaults } = useStore();
    const [newItem, setNewItem] = useState({ name: '', category: '', price: 0, unit: 'Unid' });
    const [showToast, setShowToast] = useState(false);

    const handleAddItem = () => {
        if (!newItem.name || !newItem.category) return;
        addProduct({ ...newItem, id: crypto.randomUUID() });
        setNewItem({ name: '', category: '', price: 0, unit: 'Unid' });
        triggerToast();
    };

    const triggerToast = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* TOAST NOTIFICATION */}
            {showToast && (
                <div className="fixed top-24 right-8 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-right duration-300">
                    <CheckCircle2 size={18} className="text-cyan-400" />
                    <span className="text-sm font-bold uppercase tracking-wider">Cambios guardados</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Panel de Administración</h2>
                    <p className="text-slate-400 font-medium">Gestiona la base de datos de precios y configuraciones globales.</p>
                </div>
            </div>

            {/* DEFAULTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-6 relative group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center text-cyan-600">
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Beneficios Predeterminados</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Para nuevos presupuestos</p>
                            </div>
                        </div>
                        <button
                            onClick={() => triggerToast()}
                            className="p-2 text-slate-300 hover:text-cyan-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Guardar cambios"
                        >
                            <Save size={20} />
                        </button>
                    </div>
                    <textarea
                        className="w-full h-40 border-2 border-slate-50 rounded-3xl p-6 text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-400 outline-none font-medium text-slate-600 transition-all resize-none"
                        value={defaults.benefits}
                        placeholder="Ej: • Rapidez Constructiva..."
                        onChange={(e) => {
                            updateDefaults({ benefits: e.target.value });
                        }}
                    />
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-6 relative group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Condiciones Predeterminadas</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Legales y vigencias</p>
                            </div>
                        </div>
                        <button
                            onClick={() => triggerToast()}
                            className="p-2 text-slate-300 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Guardar cambios"
                        >
                            <Save size={20} />
                        </button>
                    </div>
                    <textarea
                        className="w-full h-40 border-2 border-slate-50 rounded-3xl p-6 text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-400 outline-none font-medium text-slate-600 transition-all resize-none"
                        value={defaults.extraNotes}
                        placeholder="Ej: Validez por 15 días..."
                        onChange={(e) => {
                            updateDefaults({ extraNotes: e.target.value });
                        }}
                    />
                </div>
            </div>

            {/* ITEMS MANAGEMENT */}
            <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                        <div className="w-2 h-6 bg-cyan-500 rounded-full"></div>
                        Catálogo de Productos y Precios
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5">Nombre del Producto</th>
                                <th className="px-4 py-5">Categoría</th>
                                <th className="px-4 py-5 text-center">Unidad</th>
                                <th className="px-8 py-5 text-right">Precio ($)</th>
                                <th className="px-8 py-5 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {/* Add New Item Row */}
                            <tr className="bg-cyan-50/30">
                                <td className="px-8 py-4">
                                    <input
                                        type="text" placeholder="Nuevo material..."
                                        value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        className="w-full bg-white border border-cyan-100 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-cyan-400 outline-none"
                                    />
                                </td>
                                <td className="px-4 py-4">
                                    <input
                                        type="text" placeholder="Categoría..."
                                        value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                        className="w-full bg-white border border-cyan-100 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-cyan-400 outline-none"
                                    />
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <input
                                        type="text" placeholder="ml/u"
                                        value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                        className="w-16 mx-auto bg-white border border-cyan-100 rounded-xl px-2 py-2 text-sm font-bold text-center focus:ring-2 focus:ring-cyan-400 outline-none"
                                    />
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <input
                                        type="number"
                                        value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                                        className="w-32 bg-white border border-cyan-100 rounded-xl px-4 py-2 text-sm font-bold text-right focus:ring-2 focus:ring-cyan-400 outline-none font-mono"
                                    />
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <button
                                        onClick={handleAddItem}
                                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 p-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
                                    >
                                        <Plus size={18} strokeWidth={3} />
                                    </button>
                                </td>
                            </tr>

                            {/* Existing Items */}
                            {prices.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                                    <td className="px-8 py-3">
                                        <input
                                            type="text" value={item.name}
                                            onChange={(e) => updateProduct(item.id, { name: e.target.value })}
                                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-cyan-400 rounded-lg px-2 py-1 text-sm font-bold text-slate-700 outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="text" value={item.category}
                                            onChange={(e) => updateProduct(item.id, { category: e.target.value })}
                                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-cyan-400 rounded-lg px-2 py-1 text-xs font-black text-slate-400 uppercase tracking-widest outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="text" value={item.unit}
                                            onChange={(e) => updateProduct(item.id, { unit: e.target.value })}
                                            className="w-16 bg-transparent border-none focus:ring-2 focus:ring-cyan-400 rounded-lg px-1 py-1 text-xs font-black text-slate-500 text-center outline-none"
                                        />
                                    </td>
                                    <td className="px-8 py-3 text-right">
                                        <input
                                            type="number" value={item.price}
                                            onChange={(e) => updateProduct(item.id, { price: Number(e.target.value) })}
                                            className="w-32 bg-transparent border-none focus:ring-2 focus:ring-cyan-400 rounded-lg px-2 py-1 text-sm font-bold text-slate-900 text-right outline-none font-mono"
                                        />
                                    </td>
                                    <td className="px-8 py-3 text-right">
                                        <button
                                            onClick={() => deleteProduct(item.id)}
                                            className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin;
