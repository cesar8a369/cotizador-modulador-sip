import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { User, MapPin, Calendar, DollarSign, Trash2, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';

const CRM = () => {
    const { crmEntries, updateCRMStatus, deleteCRMEntry } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');

    const filteredLeads = (crmEntries || []).filter(lead => {
        const matchesSearch =
            (lead?.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead?.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead?.budgetNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead?.cuit || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'Todos' || lead.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (val) => {
        const num = Number(val) || 0;
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);
    };

    const formatDate = (dateStr) => {
        try {
            if (!dateStr) return '---';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '---';
            return date.toLocaleDateString();
        } catch (e) {
            return '---';
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Ganado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Perdido': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Presupuesto': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Seguimiento': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Gestión de Leads</h2>
                    <p className="text-slate-500 font-medium">Seguimiento comercial de presupuestos emitidos.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                        {['Todos', 'Presupuesto', 'Seguimiento', 'Ganado', 'Perdido'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cliente, Ubicación o #..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-orange-400 outline-none w-64 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Presupuesto / Cliente</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación / Sup.</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado CRM</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Manejo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredLeads.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium">
                                    No se encontraron leads. Guarda proyectos desde la sección de Presupuesto.
                                </td>
                            </tr>
                        ) : (
                            filteredLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 uppercase tracking-tight leading-tight">{lead.client}</div>
                                                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2 mt-1">
                                                    <span className="text-orange-600">{lead.budgetNumber || 'N/A'}</span> • {lead.cuit && <span className="text-slate-500">{lead.cuit} • </span>}{formatDate(lead.date)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                            <MapPin size={14} className="text-orange-500" /> {lead.location}
                                        </div>
                                        <div className="flex gap-4 mt-2">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lead.area?.toFixed(1) || '0'} m²</div>
                                            <div className="text-[9px] font-black text-orange-600 uppercase tracking-widest">{lead.phone || 'Sin tel.'}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-mono font-black text-slate-900 text-lg">{formatCurrency(lead.total)}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <select
                                            value={lead.status}
                                            onChange={(e) => updateCRMStatus(lead.id, e.target.value)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border shadow-sm outline-none cursor-pointer transition-all ${getStatusStyle(lead.status)}`}
                                        >
                                            {['Nuevo', 'Presupuesto', 'Seguimiento', 'Revisión', 'Ganado', 'Perdido'].map(s => (
                                                <option key={s} value={s} className="bg-white text-slate-800">{s}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => { if (window.confirm('¿Eliminar este lead?')) deleteCRMEntry(lead.id); }}
                                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Eliminar Lead"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversión</p>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black tracking-tighter">12%</span>
                        <span className="text-sm font-bold text-emerald-400 mb-1">+2.4% este mes</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas en Curso</p>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black tracking-tighter text-slate-800">{(crmEntries || []).filter(e => e?.status !== 'Perdido' && e?.status !== 'Ganado').length}</span>
                        <span className="text-sm font-bold text-slate-400 mb-1 flex items-center gap-1"><Clock size={12} /> Pendientes</span>
                    </div>
                </div>
                <div className="bg-orange-500 p-8 rounded-[40px] text-white shadow-xl shadow-orange-200 space-y-2">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Pipeline Total</p>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-black tracking-tighter">{formatCurrency((crmEntries || []).reduce((acc, e) => acc + (Number(e?.total) || 0), 0))}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CRM;
