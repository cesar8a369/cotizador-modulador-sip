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
                    <CheckCircle2 size={18} className="text-orange-400" />
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
                            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Beneficios Predeterminados</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Para nuevos presupuestos</p>
                            </div>
                        </div>
                        <button
                            onClick={() => triggerToast()}
                            className="p-2 text-slate-300 hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Guardar cambios"
                        >
                            <Save size={20} />
                        </button>
                    </div>
                    <textarea
                        className="w-full h-40 border-2 border-slate-50 rounded-3xl p-6 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 outline-none font-medium text-slate-600 transition-all resize-none"
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
                        className="w-full h-40 border-2 border-slate-50 rounded-3xl p-6 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 outline-none font-medium text-slate-600 transition-all resize-none"
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
                        <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
                        Catálogo de Productos y Precios
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Material / Producto</th>
                                <th className="px-4 py-5">Categoría</th>
                                <th className="px-4 py-5 text-center">Unidad</th>
                                <th className="px-4 py-5">Fórmula / Lógica de Cálculo</th>
                                <th className="px-8 py-5 text-right">Precio ($)</th>
                                <th className="px-8 py-5 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[11px]">
                            {/* Add New Item Row */}
                            <tr className="bg-orange-50/20">
                                <td className="px-8 py-4">
                                    <input
                                        type="text" placeholder="Nuevo material..."
                                        value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        className="w-full bg-white border border-orange-100 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-orange-400 outline-none"
                                    />
                                </td>
                                <td className="px-4 py-4">
                                    <input
                                        type="text" placeholder="Categoría..."
                                        value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                        className="w-full bg-white border border-orange-100 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-orange-400 outline-none"
                                    />
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <input
                                        type="text" placeholder="u"
                                        value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                        className="w-12 mx-auto bg-white border border-orange-100 rounded-xl px-2 py-2 text-xs font-bold text-center focus:ring-2 focus:ring-orange-400 outline-none"
                                    />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="text-[9px] text-slate-400 font-bold italic">Manual / Estático</div>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <input
                                        type="number"
                                        value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                                        className="w-28 bg-white border border-orange-100 rounded-xl px-4 py-2 text-xs font-bold text-right focus:ring-2 focus:ring-orange-400 outline-none font-mono"
                                    />
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <button
                                        onClick={handleAddItem}
                                        className="bg-orange-500 hover:bg-orange-400 text-slate-900 p-2.5 rounded-xl transition-all shadow-lg active:scale-95"
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                    </button>
                                </td>
                            </tr>

                            {/* Calculation Mapping Helper */}
                            {(() => {
                                const formulaMapping = {
                                    'SAND': 'Área Bruta de Techo (m²)',
                                    'PANELES': 'Área Bruta / 2.97 (Redondeado Subida)',
                                    'VIGA': '(Largo / 0.6) * Ancho * 1.1',
                                    'MAD_VINC': '(Paneles Muro/Tab/Piso) * 6.6',
                                    'SOLERA': '(Paneles Muro/Tab) * 1.3',
                                    'CLAVADERA': 'Perímetro Exterior * 5.5',
                                    'VARILLA': '(Paneles Muro/Tab * 1.3) / 5',
                                    'ANCLAJE_QUIMICO': '(Paneles Muro/Tab * 1.3) / 10',
                                    'FIX_6X1_5': '(Paneles Totales * 55) + (Perímetro Ab. * 6.6)',
                                    'FIX_6X2': '(Paneles Muro/Tab) * 5.3',
                                    'FIX_8X3': 'Paneles Muro * 13',
                                    'TORX_120': 'Paneles Muro * 4',
                                    'TORX_140': '(Área Techo + Piso) * 3.5',
                                    'TORN_HEX_3': 'Área Techo * 4.5',
                                    'HEX_T2_14X5': 'Área Techo * 4.5 (Sandwich)',
                                    'KIT_TUERCA': 'Cant. Varillas * 5',
                                    'ESPUMA_PU': '(Paneles Totales * 8) / 25',
                                    'PEG_PU': '(Paneles Muro/Tab * 1.2) / 4',
                                    'BARRERA': '(Área Muros * 1.1 + Área Techo * 1.1) / 30',
                                    'MEMB_LIQ': '((P. Muro * 1.3 + P. Tab * 1.3) * 0.15 + 30) / 20',
                                    'MEMB_AUTO': '(Paneles Muro/Tab * 1.3) / 25',
                                    'CHAPA_C27': 'Área de Techo (Directo)'
                                };
                                return prices.map(item => {
                                    // Robust matching: ID should win over category to avoid generic matches like "ANCLAJE" in category name
                                    const formulaKey = Object.keys(formulaMapping).find(k => item.id?.includes(k)) ||
                                        Object.keys(formulaMapping).find(k => item.category?.includes(k));

                                    const formula = formulaMapping[formulaKey] || 'Basado en Geometría';

                                    // Refined conditions based on logic in calculations.js
                                    let condition = 'General';
                                    if (item.id?.includes('VARILLA') || item.id?.includes('ANCLAJE_QUIMICO')) condition = 'SI NO HAY PISO SIP';
                                    else if (item.id?.includes('MEMB_LIQ')) condition = 'SOLO SI HAY PISO SIP';
                                    else if (item.id?.includes('HBS_TORX')) condition = 'PISO SIP + MADERA';
                                    else if (item.id?.includes('HEX_T2')) condition = 'PISO SIP (METAL) O SANDWICH';
                                    else if (item.id?.includes('VIGA_PISO')) condition = 'ESTRUC. MADERA/METAL + PISO SIP';

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-all duration-300 group border-b border-slate-50">
                                            <td className="px-8 py-3">
                                                <input
                                                    type="text" value={item.name}
                                                    onChange={(e) => updateProduct(item.id, { name: e.target.value })}
                                                    className="w-full bg-transparent border-none focus:ring-2 focus:ring-orange-400 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text" value={item.category}
                                                    onChange={(e) => updateProduct(item.id, { category: e.target.value })}
                                                    className="w-full bg-transparent border-none focus:ring-2 focus:ring-orange-400 rounded-lg px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="text" value={item.unit}
                                                    onChange={(e) => updateProduct(item.id, { unit: e.target.value })}
                                                    className="w-12 bg-transparent border-none focus:ring-2 focus:ring-orange-400 rounded-lg px-1 py-1 text-[10px] font-black text-slate-500 text-center outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={formula}>{formula}</span>
                                                    <span className="text-[8px] font-black text-orange-400 uppercase tracking-tighter">{condition}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-3 text-right">
                                                <input
                                                    type="number" value={item.price}
                                                    onChange={(e) => updateProduct(item.id, { price: Number(e.target.value) })}
                                                    className="w-28 bg-transparent border-none focus:ring-2 focus:ring-orange-400 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 text-right outline-none font-mono"
                                                />
                                            </td>
                                            <td className="px-8 py-3 text-right">
                                                <button
                                                    onClick={() => deleteProduct(item.id)}
                                                    className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ENHANCED FORMULAS REFERENCE SECTION */}
            <div className="bg-slate-900 rounded-[40px] p-10 shadow-3xl border border-slate-800 text-slate-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full -mr-32 -mt-32"></div>

                <div className="flex items-center gap-6 mb-12 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-3xl flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                        <FileText size={32} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">Motor de Cálculo SIP</h3>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500/60 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Sistema de lógica dinámica v2.6
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">
                    {[
                        { title: "SISTEMA DE PANELES", formula: "Área / 2.97", cond: "SIP Estándar", desc: "Muros Ext, Int, Piso y Techo. Incluye factor de aprovechamiento del panel estándar (1.22x2.44m)." },
                        { title: "TECHO SANDWICH", formula: "Área Bruta Techo (m²)", cond: "Si Sandwich = ON", desc: "Cálculo directo por metro cuadrado de cubierta. No requiere despiece por paneles." },
                        { title: "VIGAS 3x6 (TECHO)", formula: "(Largo / 0.6) * Ancho * 1.1", cond: "Si Techo SIP = ON", desc: "Cálculo de vigas estructurales cada 60cm con 10% extra por desperdicio y fijaciones." },
                        { title: "VIGAS 3x6 (PISO)", formula: "Área Piso * 2.5", cond: "Madera/Metal + PISO SIP", desc: "ML de madera para bastidor de piso. No se aplica si la fundación es Platea de Hormigón." },
                        { title: "MADERA VINC. 2x3\"", formula: "(Paneles Muro/Tab/Piso) * 6.6", cond: "Siempre", desc: "Listón de pino macizo para unión entre todos los paneles del sistema." },
                        { title: "SOLERA BASE 1x4\"", formula: "(Paneles Muro/Tab) * 1.3", cond: "Siempre", desc: "Pie de solera para apoyo y nivelación de paneles verticales (Muros y Tabiques)." },
                        { title: "CLAVADERA 2x2\"", formula: "Perímetro Exterior * 5.5", cond: "Muros Exteriores", desc: "Listones para fijación de revestimientos externos y terminaciones." },
                        { title: "ANCLAJES PLATEA", formula: "(P. Muro + Tab * 1.3) / 10", cond: "Solo si NO hay PISO", desc: "Cálculo de Anclaje Químico y Varillas (factor /5) para fijación directa a la platea." },
                        { title: "TORNILLERÍA FIX", formula: "Paneles * Factor (55 o 5.3)", cond: "Siempre", desc: "Cálculo por unidad de tornillo fix para vinculantes y pie de solera." },
                        { title: "TORNILLERÍA TORX", formula: "Paneles * 4 | (Techo+Piso)*3.5", cond: "Estructural", desc: "Tornillos Torx de alto rendimiento (120mm y 140mm) para encuentros estructurales." },
                        { title: "FIJACIONES CHAPA", formula: "Área Techo * 4.5", cond: "Cubierta", desc: "Tornillos Hexagonales con O-ring para fijación de chapa o panel sandwich." },
                        { title: "SELLADO QUÍMICO", formula: "(Paneles Totales * 8) / 25", cond: "Siempre", desc: "Espuma de Poliuretano 750cc para sellar todas las uniones del sistema SIP." },
                        { title: "PEGAMENTO PU", formula: "(Paneles Muro/Tab * 1.2) / 4", cond: "Soleras", desc: "Pegamento poliuretánico para vinculación de soleras con la platea." },
                        { title: "SOLUCIÓN HÍDRICA", formula: "((P. Muro*1.3 + P. Tab*1.3)*0.15 + 30) / 20", cond: "Membrana Líquida", desc: "Lógica de cálculo para protección hídrica basada en cantidad de paneles y factor de rendimiento." }
                    ].map((item, i) => (
                        <div key={i} className="bg-slate-800/40 p-6 rounded-[32px] border border-white/5 hover:border-emerald-500/40 hover:bg-slate-800/60 transition-all duration-300 group">
                            <h4 className="text-[10px] font-black text-emerald-400 mb-3 uppercase tracking-widest flex items-center justify-between">
                                {item.title}
                                <span className="bg-white/5 px-2 py-0.5 rounded-lg text-[8px] text-slate-500">{item.cond}</span>
                            </h4>
                            <div className="bg-slate-950/80 p-3 rounded-2xl border border-white/5 group-hover:border-emerald-500/20 mb-3 transition-all">
                                <code className="text-xs font-mono text-emerald-100 font-bold block">{item.formula}</code>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 border border-orange-500/30">
                            <CheckCircle2 size={16} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Todos los cálculos incluyen un factor de seguridad del +10% (x1.1)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
