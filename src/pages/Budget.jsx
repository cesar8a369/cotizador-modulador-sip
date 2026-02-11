import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { fullCalculation } from '../utils/calculations';
import { User, Phone, Mail, MapPin, Calendar, Home, Download, CheckCircle, Clock, Percent, AlertCircle, X, FileText, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateBudget } from '../utils/budget';

const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);
};

const Budget = () => {
    const {
        dimensions, selections, interiorWalls, perimeterWalls, openings, facadeConfigs,
        prices, project, setProjectData, saveToCRM, updateProjectInfo,
        setOverride, removeOverride, foundationType, structureType, defaults,
        setSelections, setSelectionId, setRoofSystem
    } = useStore();
    const [isSaved, setIsSaved] = React.useState(false);
    const navigate = useNavigate();

    // Sync defaults if missing (same logic as in Engineering to ensure consistency)
    React.useEffect(() => {
        const defaultValues = {
            exteriorWallId: "OSB-70-E",
            interiorWallId: "OSB-70-DECO",
            roofId: "TECHO-OSB-70",
            floorId: "PISO-OSB-70",
            includeExterior: true,
            includeInterior: true,
            includeRoof: true,
            includeFloor: true,
            includeEngineeringDetail: true,
        };
        const missing = {};
        let needsSync = false;
        Object.keys(defaultValues).forEach(key => {
            if (selections[key] === undefined) {
                missing[key] = defaultValues[key];
                needsSync = true;
            }
        });
        if (needsSync) {
            setSelections(missing);
        }
    }, [selections, setSelections]);

    const { geo = {}, quantities = {} } = useMemo(() =>
        fullCalculation(dimensions, selections, interiorWalls, openings, facadeConfigs, { ...project, perimeterWalls, interiorWalls }, foundationType, structureType, prices),
        [dimensions, selections, interiorWalls, perimeterWalls, openings, facadeConfigs, project, foundationType, structureType, prices]
    );

    const adjustmentPercentage = project?.projectInfo?.adjustmentPercentage || 0;
    const markupMultiplier = adjustmentPercentage > 0 ? (1 + adjustmentPercentage / 100) : 1;

    const { items: budgetItems, total: finalTotal, subtotal: subtotalWithMarkup } = useMemo(() => {
        return calculateBudget(quantities, prices, project);
    }, [quantities, prices, project]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProjectData({ [name]: value });
    };

    const handleAdjustmentChange = (val) => {
        updateProjectInfo('adjustmentPercentage', val);
    };

    const adjustmentAmount = finalTotal - subtotalWithMarkup;

    return (
        <div className="max-w-[1200px] mx-auto px-4 md:px-0 space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20">
            {/* PROJECT HEADER & INFO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client Data Form */}
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                        <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                            <User size={20} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Datos del Proyecto</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Registro</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="text" name="budgetNumber" value={project.budgetNumber || ''} readOnly
                                    className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-black text-orange-600 focus:ring-0 outline-none cursor-default"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de Seguimiento</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <select
                                    name="status" value={project.status || 'Presupuesto'}
                                    onChange={(e) => setProjectData({ status: e.target.value })}
                                    className="w-full bg-orange-50 border border-orange-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-black text-orange-700 focus:ring-2 focus:ring-orange-500 transition-all outline-none appearance-none"
                                >
                                    {['Presupuesto', 'Seguimiento', 'Ganado', 'Perdido'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CUIT / CUIL</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="text" name="cuit" value={project.cuit || ''} onChange={handleInputChange}
                                    placeholder="20-XXXXXXXX-X"
                                    className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Cliente</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="text" name="clientName" value={project.clientName} onChange={handleInputChange}
                                    placeholder="Ej. Juan Pérez"
                                    className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="text" name="phone" value={project.phone} onChange={handleInputChange}
                                    placeholder="+54 9 ..."
                                    className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="text" name="location" value={project.location} onChange={handleInputChange}
                                    placeholder="Ej. Neuquén, Argentina"
                                    className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="date" name="date"
                                    value={project.date ? (project.date.includes('T') ? project.date.split('T')[0] : project.date) : ''}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-slate-900 rounded-[40px] p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-orange-500/20 transition-all"></div>

                    <div className="space-y-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                                <Home size={24} className="text-orange-400" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-1">Superficie Total</p>
                                <h3 className="text-3xl font-black">{geo?.areaPiso?.toFixed(1) || '0.0'} <span className="text-sm font-light text-slate-400">m²</span></h3>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Presupuesto Final</p>
                            <div className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                {formatCurrency(finalTotal)}
                            </div>
                            {adjustmentPercentage < 0 && (
                                <p className="text-[10px] font-bold mt-1 text-emerald-400">
                                    {adjustmentPercentage}% de descuento aplicado
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={() => {
                                try {
                                    saveToCRM(finalTotal);
                                    setIsSaved(true);
                                    setTimeout(() => setIsSaved(false), 2000);
                                } catch (err) {
                                    console.error("Error al guardar en CRM:", err);
                                    alert("Hubo un problema al guardar. Por favor revisa los datos.");
                                }
                            }}
                            disabled={isSaved}
                            className={`flex-1 ${isSaved ? 'bg-emerald-500' : 'bg-slate-700 hover:bg-slate-600'} text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all transform active:scale-95`}
                        >
                            {isSaved ? <CheckCircle size={16} /> : <Clock size={16} />}
                            {isSaved ? 'Guardado' : 'Guardar en CRM'}
                        </button>
                        <button
                            onClick={() => navigate('/export')}
                            className="flex-1 bg-orange-500 hover:bg-orange-400 text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all transform active:scale-95"
                        >
                            <Download size={16} />
                            Generar PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* ADJUSTMENT & TERMS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                            <Percent size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest text-left">Ajuste de Precio</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">Descuentos o Recargos</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 w-full">
                        <input
                            type="range" min="-30" max="100" step="1"
                            value={adjustmentPercentage}
                            onChange={(e) => handleAdjustmentChange(Number(e.target.value))}
                            className="flex-1 accent-amber-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="bg-amber-50 px-4 py-3 rounded-2xl border border-amber-100 min-w-[120px] flex items-center gap-1">
                            <input
                                type="number"
                                value={adjustmentPercentage || ''}
                                onChange={(e) => handleAdjustmentChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                className="w-full bg-transparent text-xl font-black text-center text-amber-700 outline-none focus:ring-0"
                            />
                            <span className="text-xl font-black text-amber-700">%</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <AlertCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                            Ajuste de margen. Los recargos se aplican de forma prorrateada en los unitarios.
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest text-left">Propuesta Comercial</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">Beneficios y condiciones</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Beneficios (Ventajas)</label>
                            <textarea
                                className="w-full h-24 bg-slate-50 border-none rounded-2xl p-3 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                                value={project.projectInfo?.benefits || ''}
                                onChange={(e) => updateProjectInfo('benefits', e.target.value)}
                                placeholder={defaults.benefits || '• Rapidez, • Térmico...'}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Condiciones (Notas)</label>
                            <textarea
                                className="w-full h-24 bg-slate-50 border-none rounded-2xl p-3 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                                value={project.projectInfo?.extraNotes || ''}
                                onChange={(e) => updateProjectInfo('extraNotes', e.target.value)}
                                placeholder={defaults.extraNotes || 'Validez del presupuesto...'}
                            />
                        </div>
                    </div>
                </div>
            </div>


            {/* PANEL CONFIGURATION SECTION */}
            <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest text-left">Configuración de Paneles</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">Selección de tipologías constructivas</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {[
                        { idField: 'exteriorWallId', includeField: 'includeExterior', label: 'Muros Exteriores', suffix: '@@EXTERIOR', filter: (p) => p.id.includes('-E') && !p.id.includes('-INT') && !p.id.includes('PISO') },
                        { idField: 'interiorWallId', includeField: 'includeInterior', label: 'Tabiquería Interior', suffix: '@@INTERIOR', filter: (p) => p.id.includes('-INT') || p.id.includes('DECO') || p.id === 'OSB-70' },
                        {
                            idField: 'roofId',
                            includeField: 'includeRoof',
                            label: 'Cubierta / Techo',
                            suffix: '@@TECHO',
                            isRoof: true,
                            filter: (p) => p.category === '1. SISTEMA DE PANELES' && (selections.roofSystem === 'sandwich' ? p.id.includes('SAND-') : (p.id.includes('TECHO') || p.id === 'COL-70' || p.id === 'CE-70' || p.id === 'SID-70' || p.id === 'OSB-FEN-70'))
                        },
                        {
                            idField: 'floorId',
                            includeField: 'includeFloor',
                            label: 'Entrepiso / Piso',
                            suffix: '@@PISO',
                            disabled: foundationType === 'platea',
                            filter: (p) => p.id.includes('PISO')
                        },
                    ].map(cat => (
                        <div key={cat.idField} className="space-y-3 bg-slate-50/50 p-4 rounded-[28px] border border-slate-100">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat.label}</label>
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                                        {cat.disabled ? 'NO APLICA (PLATEA)' : (selections[cat.includeField] ? 'INCLUIDO' : 'EXCLUIDO')}
                                    </span>
                                    <label className={`relative inline-flex items-center ${cat.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            disabled={cat.disabled}
                                            checked={cat.disabled ? false : (selections[cat.includeField] !== false)}
                                            onChange={(e) => setSelections({ [cat.includeField]: e.target.checked })}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                                    </label>
                                </div>
                            </div>

                            {cat.isRoof && selections[cat.includeField] && (
                                <div className="grid grid-cols-2 gap-2 pb-1">
                                    <button
                                        onClick={() => setRoofSystem('sip')}
                                        className={`py-1.5 rounded-xl text-[9px] font-black border-2 transition-all ${selections.roofSystem === 'sip' ? 'bg-white border-orange-500 text-orange-700 shadow-sm' : 'bg-transparent border-slate-100 text-slate-400 opacity-60'}`}
                                    >
                                        TECHO SIP
                                    </button>
                                    <button
                                        onClick={() => setRoofSystem('sandwich')}
                                        className={`py-1.5 rounded-xl text-[9px] font-black border-2 transition-all ${selections.roofSystem === 'sandwich' ? 'bg-white border-orange-500 text-orange-700 shadow-sm' : 'bg-transparent border-slate-100 text-slate-400 opacity-60'}`}
                                    >
                                        SANDWICH
                                    </button>
                                </div>
                            )}

                            <select
                                value={selections[cat.idField] || ''}
                                onChange={(e) => {
                                    const newVal = e.target.value;
                                    setSelectionId(cat.idField, newVal);
                                    if (newVal) {
                                        removeOverride(`${newVal}${cat.suffix}`);
                                    }
                                }}
                                disabled={!selections[cat.includeField] || cat.disabled}
                                className={`w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-orange-500 transition-all outline-none ${(!selections[cat.includeField] || cat.disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-orange-200'}`}
                            >
                                <option value="">Seleccionar Material...</option>
                                {prices.filter(cat.filter).map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} - {formatCurrency(p.price)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            </div>



            {/* PANEL SUMMARY SECTION */}
            <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                        <Home size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest text-left">Resumen de Panelizado</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">Cómputo métrico de unidades</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {selections.includeExterior !== false && (
                        <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 text-center flex flex-col items-center justify-center group hover:bg-white hover:border-orange-200 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Muros Exteriores</p>
                            <p className="text-3xl font-black text-slate-900 leading-none">{geo.cantMurosExt || 0}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Unidades</p>
                        </div>
                    )}
                    {selections.includeInterior !== false && (
                        <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 text-center flex flex-col items-center justify-center group hover:bg-white hover:border-orange-200 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Muros Interiores</p>
                            <p className="text-3xl font-black text-slate-900 leading-none">{geo.cantMurosInt || 0}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Unidades</p>
                        </div>
                    )}
                    {(foundationType !== 'platea' && selections.includeFloor !== false) && (
                        <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 text-center flex flex-col items-center justify-center group hover:bg-white hover:border-orange-200 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Paneles de Piso</p>
                            <p className="text-3xl font-black text-slate-900 leading-none">{geo.cantPiso || 0}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Unidades</p>
                        </div>
                    )}
                    {selections.includeRoof !== false && (
                        <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 text-center flex flex-col items-center justify-center group hover:bg-white hover:border-orange-200 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Paneles de Techo</p>
                            <p className="text-3xl font-black text-slate-900 leading-none">{geo.cantTecho || 0}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Unidades</p>
                        </div>
                    )}
                </div>
            </div>

            {/* POTENTIAL SAVINGS SECTION */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-[40px] border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                        <Percent size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest text-left">Beneficios y Ahorros de LFP</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">Calculados sobre el total final</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`bg-white p-6 rounded-[32px] border shadow-sm flex flex-col justify-between group transition-all ${project.projectInfo?.showEarlyPaymentDiscount === false ? 'opacity-50 border-slate-100 grayscale' : 'border-emerald-100 hover:border-emerald-200'}`}>
                        <div>
                            <div className="flex justify-between items-start">
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">Pronto Pago</span>
                                <label className="relative inline-flex items-center cursor-pointer scale-75">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={project.projectInfo?.showEarlyPaymentDiscount !== false}
                                        onChange={(e) => updateProjectInfo('showEarlyPaymentDiscount', e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                            <h5 className="text-xl font-black text-slate-800 mt-2">6% OFF</h5>
                            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">Cierre temprano del presupuesto (válido por 7 días).</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ahorras:</p>
                            <p className="text-lg font-black text-emerald-600 font-mono">
                                {project.projectInfo?.showEarlyPaymentDiscount !== false ? formatCurrency(finalTotal * 0.06) : '$ 0'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
                        <div>
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-widest">Beneficio por Volumen</span>
                            <h5 className="text-xl font-black text-slate-800 mt-2">8% OFF</h5>
                            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">Aplicable en compras superiores a 20 paneles.</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ahorras:</p>
                            <p className="text-lg font-black text-indigo-600 font-mono">{formatCurrency(finalTotal * 0.08)}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-amber-200 transition-all">
                        <div>
                            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-widest">Ciudad de Córdoba</span>
                            <h5 className="text-xl font-black text-slate-800 mt-2">12% OFF</h5>
                            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">Especial para pago en efectivo en nuestra sede central.</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ahorras:</p>
                            <p className="text-lg font-black text-amber-600 font-mono">{formatCurrency(finalTotal * 0.12)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* BUDGET TABLE */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                        DETALLE DE MATERIALES - SISTEMA SIP
                    </h3>
                    <button
                        onClick={() => {
                            const id = `EXTRA-${Date.now()}`;
                            setOverride(id, {
                                name: 'Nuevo Ítem',
                                qty: 1,
                                price: 0,
                                unit: 'UNID',
                                category: '5. SERVICIOS Y EXTRAS'
                            });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                    >
                        + Agregar Ítem
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left notranslate" translate="no">
                        <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Descripción Técnica</th>
                                <th className="px-4 py-5 text-center">Unidad</th>
                                <th className="px-4 py-5 text-center">Cant.</th>
                                <th className="px-8 py-5 text-right">Unitario</th>
                                <th className="px-8 py-5 text-right">Total</th>
                                <th className="px-4 py-5 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {['1. SISTEMA DE PANELES', '2. MADERAS ESTRUCTURALES (PINO TRATADO)', '3. FIJACIONES Y ANCLAJES', '4. AISLACIÓN Y SELLADO QUÍMICO', '5. SERVICIOS Y EXTRAS'].map(category => {
                                const categoryItems = budgetItems.filter(item => item.category === category);
                                if (categoryItems.length === 0) return null;

                                return (
                                    <React.Fragment key={category}>
                                        <tr className="bg-slate-50/30">
                                            <td colSpan="6" className="px-8 py-2 text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] bg-slate-50/50">
                                                {category}
                                            </td>
                                        </tr>
                                        {categoryItems.map((item) => (
                                            <tr key={item.id} className={`hover:bg-slate-50/80 transition-all duration-300 ${item.qty === 0 ? 'opacity-40' : ''}`}>
                                                <td className="px-8 py-5 text-sm font-bold text-slate-800">
                                                    {item.id.startsWith('EXTRA-') ? (
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) => setOverride(item.id, { name: e.target.value })}
                                                            className="w-full bg-slate-50 border-none rounded-lg px-2 py-1 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    ) : (
                                                        <div>{item.name}</div>
                                                    )}
                                                    {item.isOverridden && <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest italic mt-1 inline-block">Manual</span>}
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    {item.id.startsWith('EXTRA-') ? (
                                                        <input
                                                            type="text"
                                                            value={item.unit}
                                                            onChange={(e) => setOverride(item.id, { unit: e.target.value })}
                                                            className="w-12 bg-slate-50 border-none rounded-lg px-1 py-1 text-[10px] font-black text-slate-500 uppercase text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    ) : (
                                                        <span className="text-[10px] font-black text-slate-500 uppercase">{item.unit}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <input
                                                        type="number"
                                                        value={item.qty}
                                                        onChange={(e) => setOverride(item.id, { qty: Number(e.target.value) })}
                                                        className="w-16 h-10 rounded-xl bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm text-center focus:ring-2 focus:ring-orange-500 outline-none"
                                                    />
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <input
                                                        type="number"
                                                        value={Math.round(item.price)}
                                                        onChange={(e) => setOverride(item.id, { price: Number(e.target.value) / markupMultiplier })}
                                                        className="w-28 h-10 rounded-xl bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm text-right px-3 focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                                                    />
                                                </td>
                                                <td className="px-8 py-5 text-right font-mono text-sm font-black text-slate-800">
                                                    {formatCurrency(item.total)}
                                                </td>
                                                <td className="px-4 py-5 text-right">
                                                    {item.isOverridden ? (
                                                        <button
                                                            onClick={() => removeOverride(item.id)}
                                                            title="Restaurar valor automático"
                                                            className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-100 transition-colors flex items-center gap-1 mx-auto"
                                                        >
                                                            <AlertCircle size={12} /> RESTAURAR
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => setOverride(item.id, { qty: 0 })} title="Ocultar ítem" className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                                            <X size={18} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Final Total Footer */}
                <div className="bg-slate-50 p-8 flex flex-col items-end border-t border-slate-100">
                    <div className="space-y-1 text-right mb-4">
                        <div className="flex justify-end items-baseline gap-4 text-slate-400">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Subtotal:</span>
                            <span className="text-lg font-bold font-mono">{formatCurrency(subtotalWithMarkup)}</span>
                        </div>
                        {adjustmentPercentage < 0 && (
                            <div className="flex justify-end items-baseline gap-4 text-emerald-600">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Descuento Aplicado ({Math.abs(adjustmentPercentage)}%):</span>
                                <span className="text-lg font-bold font-mono">-{formatCurrency(Math.abs(adjustmentAmount))}</span>
                            </div>
                        )}
                        <div className="flex flex-col md:flex-row items-end md:items-baseline gap-2 md:gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Total Final de Obra:</span>
                            <span className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter tabular-nums">{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Budget;
