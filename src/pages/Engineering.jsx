import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { calculateGeometry, fullCalculation } from '../utils/calculations';
import FloorPlan from '../components/engineering/FloorPlan';
import FacadeView from '../components/engineering/FacadeView';
import Viewer3D from '../components/engineering/Viewer3D';
import { Link } from 'react-router-dom';
import { FileText, Copy, ChevronLeft, ChevronRight, Maximize2, X, Download, Loader2, Square } from 'lucide-react';
import html2canvas from 'html2canvas';

const RangeControl = ({ label, value, onChange, min, max, step, unit }) => {
    const [localValue, setLocalValue] = React.useState(value);

    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        let val = parseFloat(localValue);
        if (isNaN(val)) val = min;
        val = Math.max(min, Math.min(max, val));
        setLocalValue(val);
        onChange(val);
    };

    return (
        <div className="space-y-1.5 flex flex-col">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                <div className="flex items-center gap-1 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100 focus-within:border-cyan-400 transition-colors">
                    <input
                        type="number"
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                        className="bg-transparent text-xs font-mono font-bold text-cyan-600 outline-none w-10 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[9px] font-bold text-cyan-400">{unit}</span>
                </div>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => {
                    const newVal = parseFloat(e.target.value);
                    setLocalValue(newVal);
                    onChange(newVal);
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
            />
        </div>
    );
};

const DataRow = ({ label, value, sub, inverted }) => (
    <div className={`flex justify-between items-baseline border-b py-1.5 font-mono text-[11px] leading-none ${inverted ? 'border-slate-800' : 'border-slate-100'}`}>
        <span className={inverted ? 'text-slate-500' : 'text-slate-400'}>{label}</span>
        <div className="text-right">
            <span className={`font-bold ${inverted ? 'text-slate-200' : 'text-slate-800'}`}>{value}</span>
            {sub && <span className={`ml-1 text-[9px] ${inverted ? 'text-slate-600' : 'text-slate-400'}`}>{sub}</span>}
        </div>
    </div>
);

const Engineering = () => {
    const {
        dimensions, setDimensions,
        interiorWalls, updateInteriorWall,
        openings,
        facadeConfigs, updateFacadeConfig,
        showBeams, setShowBeams,
        showRoofPlates, setShowRoofPlates,
        beamOffset, setBeamOffset,
        activeInteriorWallId, setActiveInteriorWallId,
        project, foundationType, setFoundationType, structureType, setStructureType,
        selections, toggleSelectionCategory, setSelectionId, setSelections, setRoofSystem,
        prices, perimeterWalls,
        updateRecess, removeRecess, clearRecesses, addLShape, addCShape,
        togglePerimeterVisibility
    } = useStore();

    useEffect(() => {
        const { history, saveHistory } = useStore.getState();
        if (history.length === 0) {
            saveHistory();
        }

        const defaultValues = {
            exteriorWallId: "OSB-70-E",
            interiorWallId: "OSB-70-DECO",
            roofId: "TECHO-OSB-70",
            floorId: "PISO-OSB-70",
            includeExterior: true,
            includeInterior: true,
            includeRoof: true,
            includeFloor: true,
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

    const [maximizedFacade, setMaximizedFacade] = useState(null);
    const [isFloorPlanExpanded, setIsFloorPlanExpanded] = useState(false);

    const geo = useMemo(() => {
        return calculateGeometry(dimensions, interiorWalls, facadeConfigs, openings, { ...project, perimeterWalls, interiorWalls }, selections);
    }, [dimensions, interiorWalls, facadeConfigs, openings, project, selections, perimeterWalls]);

    const copyToClipboard = () => {
        let text = `======================================\n`;
        text += `   REPORTE TÉCNICO - SIP MODULADOR\n`;
        text += `======================================\n\n`;

        text += `1. MUROS EXTERIORES (FACHADAS)\n`;
        text += `   Dimensiones Base: ${dimensions.width}m x ${dimensions.length}m x ${dimensions.height}m (H)\n`;
        Object.entries(geo.sides || {}).filter(([_, stats]) => stats.isVisible).forEach(([side, stats]) => {
            text += `    Fachada ${side}:\n`;
            text += `    - Área: ${stats.area.toFixed(2)} m²\n`;
            text += `    - Paneles: ${stats.panels} unid.\n`;
            text += `    - Perímetro Paneles: ${stats.perimPanels?.toFixed(2)} ml\n`;
            text += `    - Aberturas (ML): ${stats.openingML.toFixed(2)} ml\n`;
        });
        text += `   --------------------------------------\n`;
        text += `   Total Área Muros Ext: ${geo.areaMurosBruta.toFixed(2)} m²\n`;
        text += `   Total Perim. Paneles Muro: ${geo.perimMurosExt?.toFixed(2)} ml\n`;
        text += `   Total Paneles Muro Ext: ${geo.cantMurosExt} unid.\n\n`;

        text += `2. TABIQUES INTERIORES\n`;
        text += `   - Metros Lineales: ${geo.tabiques.toFixed(2)} ml\n`;
        text += `   - Paneles Tabique: ${geo.cantMurosInt} unid.\n`;
        text += `   - Perímetro Paneles Tabique: ${geo.perimMurosInt?.toFixed(2)} ml\n\n`;

        text += `3. PISO Y TECHO\n`;
        text += `   - PISO: ${geo.areaPiso.toFixed(2)} m² (${geo.cantPiso} paneles | Perim: ${geo.perimPiso?.toFixed(2)} ml)\n`;
        text += `   - TECHO: ${geo.areaTecho.toFixed(2)} m² (${geo.cantTecho} paneles | Perim: ${geo.perimTecho?.toFixed(2)} ml)\n\n`;

        text += `4. RESUMEN DE GEOMETRÍA Y ABERTURAS\n`;
        text += `   - Dimensiones: ${dimensions.width}m x ${dimensions.length}m\n`;
        text += `   - Altura de Muros: ${dimensions.height}m\n`;
        text += `   - Altura de Cumbrera: ${dimensions.ridgeHeight}m\n`;
        text += `   - Área de Planta (Neto): ${geo.areaPiso.toFixed(2)} m²\n`;
        text += `   - Perímetro Exterior Casa: ${geo.perimExt.toFixed(2)} ml\n`;
        text += `   - Cantidad de Aberturas: ${geo.totalAberturasCount} unid.\n`;
        text += `   - Metros Lineales de Aberturas: ${geo.perimAberturas.toFixed(2)} ml\n\n`;

        text += `5. RESUMEN DE PANELES\n`;
        text += `   - Perímetro Lineal Total Paneles: ${geo.perimLinealPaneles.toFixed(2)} ml\n`;
        text += `   - Cantidad Total Paneles: ${geo.totalPaneles} unid.\n\n`;

        text += `======================================`;

        navigator.clipboard.writeText(text);
        alert("Reporte completo copiado al portapapeles!");
    };

    return (
        <div className="flex flex-col min-h-screen lg:h-screen bg-slate-50 p-2 md:p-4 gap-4 overflow-x-hidden">

            {/* FACADE MODAL */}
            {maximizedFacade && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-8">
                    <div className="bg-white w-full max-w-6xl h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                    Configuración de Fachada {maximizedFacade}
                                    <span className="bg-cyan-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">Avanzado</span>
                                </h2>
                                <p className="text-slate-400 text-sm font-medium">Define el tipo de techo y alturas específicas para este lado.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => togglePerimeterVisibility(maximizedFacade)}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg border-2 ${project.perimeterVisibility?.[maximizedFacade] !== false
                                        ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {project.perimeterVisibility?.[maximizedFacade] !== false ? 'Fachada Activa' : 'Fachada Excluida'}
                                    <div className={`w-2.5 h-2.5 rounded-full ${project.perimeterVisibility?.[maximizedFacade] !== false ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
                                </button>
                                <div className="w-px h-10 bg-slate-200"></div>
                                <button onClick={() => setMaximizedFacade(null)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-slate-400 hover:text-rose-500 group">
                                    <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex min-h-0 bg-white">
                            <div className="flex-1 p-8 bg-slate-50/30">
                                <FacadeView
                                    type={maximizedFacade}
                                    data={{ ...dimensions, openings, facadeConfigs }}
                                    scale={45}
                                    isMaximized={true}
                                />
                            </div>

                            <div className="w-96 border-l border-slate-100 p-8 space-y-8 bg-white overflow-y-auto">
                                {(() => {
                                    const config = facadeConfigs[maximizedFacade] || { type: 'recto', hBase: 2.44, hMax: 2.44 };
                                    return (
                                        <>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">TIPO DE TECHO</label>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {['recto', 'inclinado', '2-aguas'].map(type => (
                                                        <button
                                                            key={type}
                                                            onClick={() => updateFacadeConfig(maximizedFacade, { type })}
                                                            className={`px-4 py-4 rounded-2xl text-sm font-bold border-2 transition-all flex flex-col gap-1 ${config.type === type
                                                                ? 'bg-cyan-50 border-cyan-500 text-cyan-700 shadow-sm'
                                                                : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <span className="capitalize">{type.replace('-', ' ')}</span>
                                                            <span className="text-[10px] font-normal opacity-60">
                                                                {type === 'recto' && "Techo plano o altura constante."}
                                                                {type === 'inclinado' && "Pendiente hacia un lado lateral."}
                                                                {type === '2-aguas' && "Doble pendiente simétrica desde el centro."}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-6 pt-6 border-t border-slate-50">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">COTAS DE ELEVACIÓN</label>

                                                {config.type === 'recto' && (
                                                    <RangeControl
                                                        label="Altura Muro (Base)"
                                                        value={config.hBase}
                                                        onChange={(v) => updateFacadeConfig(maximizedFacade, { hBase: v, hMax: v })}
                                                        min={2.44} max={5.0} step={0.1} unit="m"
                                                    />
                                                )}

                                                {config.type === 'inclinado' && (
                                                    <>
                                                        <RangeControl
                                                            label="Altura Izquierda"
                                                            value={config.hBase}
                                                            onChange={(v) => updateFacadeConfig(maximizedFacade, { hBase: v })}
                                                            min={2.44} max={6.0} step={0.1} unit="m"
                                                        />
                                                        <RangeControl
                                                            label="Altura Derecha"
                                                            value={config.hMax}
                                                            onChange={(v) => updateFacadeConfig(maximizedFacade, { hMax: v })}
                                                            min={2.44} max={6.0} step={0.1} unit="m"
                                                        />
                                                    </>
                                                )}

                                                {config.type === '2-aguas' && (
                                                    <>
                                                        <RangeControl
                                                            label="Altura Aleros (Base)"
                                                            value={config.hBase}
                                                            onChange={(v) => updateFacadeConfig(maximizedFacade, { hBase: v })}
                                                            min={2.44} max={6.0} step={0.1} unit="m"
                                                        />
                                                        <RangeControl
                                                            label="Altura Cumbrera (Pico)"
                                                            value={config.hMax}
                                                            onChange={(v) => updateFacadeConfig(maximizedFacade, { hMax: v })}
                                                            min={2.44} max={7.0} step={0.1} unit="m"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT GRID */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-4 pb-2">

                {/* LEFT COLUMN: VISUALS (3 cols) */}
                <div className={`lg:col-span-3 flex flex-col gap-4 min-h-0 ${isFloorPlanExpanded ? 'fixed inset-0 z-[100] bg-white' : ''}`}>
                    <div className={`flex-1 min-h-[400px] lg:min-h-0 bg-white overflow-hidden relative ${isFloorPlanExpanded ? '' : 'rounded-[40px] border border-slate-200 shadow-sm'}`}>
                        <FloorPlan hideUI={!!maximizedFacade} isExpanded={isFloorPlanExpanded} />
                        <button
                            onClick={() => setIsFloorPlanExpanded(!isFloorPlanExpanded)}
                            className={`absolute z-50 p-3 transition-all ${isFloorPlanExpanded ? 'top-10 right-10 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800' : 'top-6 right-6 bg-white/90 backdrop-blur border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-500 hover:border-indigo-500 shadow-xl'}`}
                            title={isFloorPlanExpanded ? "Contraer Plano" : "Expandir Plano"}
                        >
                            <X size={20} className={isFloorPlanExpanded ? "" : "hidden"} />
                            <Maximize2 size={20} className={isFloorPlanExpanded ? "hidden" : ""} />
                        </button>
                    </div>

                    {!isFloorPlanExpanded && (
                        <div className="lg:h-[260px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 p-1">
                            {['Norte', 'Sur', 'Este', 'Oeste'].map(side => (
                                <div key={side} className="h-48 lg:h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                    <FacadeView
                                        type={side}
                                        data={{ ...dimensions, openings, facadeConfigs }}
                                        onMaximize={() => setMaximizedFacade(side)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: CONTROLS */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar lg:max-h-[calc(100vh-120px)] pb-20 lg:pb-0">

                    {/* HOUSE DIMENSIONS */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Geometría Base</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => clearRecesses()}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all group ${project.recesses?.length === 0 ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-indigo-500 hover:bg-indigo-50'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${project.recesses?.length === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                                        <Square size={16} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Rectángulo</span>
                                </button>
                                <button
                                    onClick={() => addLShape()}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all group ${project.recesses?.length === 1 && project.recesses[0].side === 'Sur' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-indigo-500 hover:bg-indigo-50'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${project.recesses?.length === 1 && project.recesses[0].side === 'Sur' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v16h16" /></svg>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Forma L</span>
                                </button>
                                <button
                                    onClick={() => addCShape()}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all group ${project.recesses?.length === 1 && project.recesses[0].side === 'Norte' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-indigo-500 hover:bg-indigo-50'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${project.recesses?.length === 1 && project.recesses[0].side === 'Norte' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 4H4v16h16" /></svg>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Forma C</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5 pt-4 border-t border-slate-50">
                            <RangeControl label="Largo (Profundidad)" value={dimensions.length} onChange={(v) => setDimensions({ length: v })} min={3} max={20} step={1} unit="m" />
                            <RangeControl label="Ancho (Frente)" value={dimensions.width} onChange={(v) => setDimensions({ width: v })} min={3} max={15} step={1} unit="m" />
                            <RangeControl label="Altura Muros" value={dimensions.height} onChange={(v) => setDimensions({ height: v })} min={2.44} max={5.0} step={0.1} unit="m" />
                            <RangeControl label="Altura Cumbrera" value={dimensions.ridgeHeight} onChange={(v) => setDimensions({ ridgeHeight: v })} min={2.44} max={7.0} step={0.1} unit="m" />
                        </div>
                    </div>

                    {/* FACHADAS ACTIVAS */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Inclusión de Fachadas</h3>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mb-4 leading-relaxed line-clamp-2">
                            Marca las fachadas que deseas contabilizar en el presupuesto.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {['Norte', 'Sur', 'Este', 'Oeste'].map(side => {
                                const isVisible = project.perimeterVisibility?.[side] !== false;
                                return (
                                    <button
                                        key={side}
                                        onClick={() => togglePerimeterVisibility(side)}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${isVisible ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{side}</span>
                                        <div className={`w-6 h-3 rounded-full relative transition-colors ${isVisible ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${isVisible ? 'left-3.5' : 'left-0.5'}`}></div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>



                    {/* STRUCTURAL CONFIGURATION */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Configuración Estructural</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Cimentación</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setFoundationType('platea')} className={`py-2 rounded-xl text-[10px] font-black border-2 transition-all ${foundationType === 'platea' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-100 text-slate-400'}`}>PLATEA</button>
                                    <button onClick={() => setFoundationType('estructura')} className={`py-2 rounded-xl text-[10px] font-black border-2 transition-all ${foundationType === 'estructura' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-100 text-slate-400'}`}>ESTRUCTURA</button>
                                </div>
                            </div>
                            <div className={`space-y-2 transition-all duration-300 ${foundationType === 'platea' ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estructura de Piso</label>
                                    {foundationType === 'platea' && <span className="text-[8px] font-black text-rose-500 uppercase bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">No aplica en Platea</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setStructureType('madera')} className={`py-2 rounded-xl text-[10px] font-black border-2 transition-all ${structureType === 'madera' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-slate-100 text-slate-400'}`}>MADERA</button>
                                    <button onClick={() => setStructureType('metal')} className={`py-2 rounded-xl text-[10px] font-black border-2 transition-all ${structureType === 'metal' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-slate-100 text-slate-400'}`}>METAL</button>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Sistema de Techo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setRoofSystem('sip')}
                                        className={`py-2 rounded-xl text-[10px] font-black border-2 transition-all ${selections.roofSystem === 'sip' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-slate-100 text-slate-400'}`}
                                    >
                                        TECHO SIP
                                    </button>
                                    <button
                                        onClick={() => setRoofSystem('sandwich')}
                                        className={`py-2 rounded-xl text-[10px] font-black border-2 transition-all ${selections.roofSystem === 'sandwich' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-slate-100 text-slate-400'}`}
                                    >
                                        SANDWICH
                                    </button>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block ml-1">Material Techo</label>
                                    <select
                                        value={selections.roofId}
                                        onChange={(e) => setSelectionId('roofId', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                                    >
                                        {prices
                                            .filter(p => p.category === "1. SISTEMA DE PANELES" &&
                                                (selections.roofSystem === 'sandwich' ? p.id.includes('SAND-') : (p.id.includes('TECHO-') || p.id === 'COL-70' || p.id === 'CE-70' || p.id === 'SID-70')))
                                            .map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            {/* Configuración de Componentes Removed by User Request */}
                        </div>
                    </div>

                    {/* 3D VIEWER COMPACT */}
                    <div className="space-y-4">
                        <div className="h-64 shadow-sm border border-slate-200 rounded-[40px] overflow-hidden">
                            <Viewer3D />
                        </div>

                    </div>

                    {/* REPORT */}
                    <div className="bg-slate-900 rounded-[40px] p-6 text-slate-300 font-mono text-[10px]">
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                            <span className="text-cyan-400 font-black">REPORTE TÉCNICO</span>
                            <span className="text-white/20">SIP 2026</span>
                        </div>
                        <div className="space-y-6">
                            {/* MUROS Y FACHADAS */}
                            <div>
                                <h4 className="text-cyan-400 text-[8px] uppercase font-black mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]"></span> MUROS EXTERIORES
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(geo.sides || {}).filter(([_, stats]) => stats.isVisible).map(([side, stats]) => (
                                        <div key={side} className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-white uppercase tracking-tight">Fachada {side}</span>
                                                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">{stats.panels} Panels</span>
                                            </div>
                                            <div className="space-y-1">
                                                <DataRow label="Superficie" value={stats.area.toFixed(2)} sub="m²" inverted />
                                                <DataRow label="Perim. Paneles" value={stats.perimPanels?.toFixed(2)} sub="ml" inverted />
                                                <DataRow label="Aberturas ML" value={stats.openingML.toFixed(2)} sub="ml" inverted />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/10 space-y-1">
                                    <DataRow label="Total Área Muros" value={geo.areaMurosBruta.toFixed(2)} sub="m²" inverted />
                                    <DataRow label="Total Perim. Paneles" value={geo.perimMurosExt?.toFixed(2)} sub="ml" inverted />
                                </div>
                            </div>

                            {/* TABIQUES (INTERIOR) */}
                            <div>
                                <h4 className="text-amber-400 text-[8px] uppercase font-black mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span> TABIQUES INTERIORES
                                </h4>
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1">
                                    <DataRow label="Metros Lineales" value={geo.tabiques.toFixed(2)} sub="ml" inverted />
                                    <DataRow label="Paneles" value={geo.cantMurosInt} sub="unid" inverted />
                                    <DataRow label="Perim. Paneles" value={geo.perimMurosInt?.toFixed(2)} sub="ml" inverted />
                                </div>
                            </div>

                            {/* PISO Y TECHO */}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <h4 className="text-emerald-400 text-[8px] uppercase font-black mb-3">PISO</h4>
                                    <div className="bg-emerald-400/5 p-4 rounded-2xl border border-emerald-400/10 space-y-1">
                                        <DataRow label="Área" value={geo.areaPiso.toFixed(2)} sub="m²" inverted />
                                        <DataRow label="Perim. Paneles" value={geo.perimPiso?.toFixed(2)} sub="ml" inverted />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-indigo-400 text-[8px] uppercase font-black mb-3">TECHO</h4>
                                    <div className="bg-indigo-400/5 p-4 rounded-2xl border border-indigo-400/10 space-y-1">
                                        <DataRow label="Área" value={geo.areaTecho.toFixed(2)} sub="m²" inverted />
                                        <DataRow label="Perim. Paneles" value={geo.perimTecho?.toFixed(2)} sub="ml" inverted />
                                    </div>
                                </div>
                            </div>

                            {/* RESUMEN DE GEOMETRÍA */}
                            <div className="pt-6 border-t-2 border-white/10 space-y-2">
                                <h4 className="text-white/40 text-[9px] uppercase font-black mb-3 tracking-widest">GEOMETRÍA Y ABERTURAS</h4>
                                <DataRow label="Dimensiones" value={`${dimensions.width}m x ${dimensions.length}m`} inverted />
                                <DataRow label="Altura Muros" value={dimensions.height.toFixed(2)} sub="m" inverted />
                                <DataRow label="Altura Cumbrera" value={dimensions.ridgeHeight.toFixed(2)} sub="m" inverted />
                                <DataRow label="Área Planta" value={geo.areaPiso.toFixed(2)} sub="m²" inverted />
                                <DataRow label="Perímetro Exterior" value={geo.perimExt.toFixed(2)} sub="ml" inverted />
                                <DataRow label="Cantidad Aberturas" value={geo.totalAberturasCount} inverted />
                                <DataRow label="Perímetro Aberturas" value={geo.perimAberturas.toFixed(2)} sub="ml" inverted />

                                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                                    <DataRow label="Perímetro Lineal Total" value={geo.perimLinealPaneles.toFixed(2)} sub="ml" inverted />
                                    <div className="flex justify-between items-center pt-3 text-cyan-400 font-black text-xs border-t border-white/5">
                                        <span className="tracking-tighter uppercase">TOTAL PANELES</span>
                                        <span className="text-xl">{geo.totalPaneles} UNID.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={copyToClipboard} className="w-full mt-6 bg-white/5 hover:bg-white/10 py-3 rounded-2xl flex items-center justify-center gap-2 border border-white/5 transition-all active:scale-95">
                            <Copy size={14} /> COPIAR REPORTE
                        </button>
                    </div>

                    {/* VISUALS */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mostrar Vigas</span>
                            <button onClick={() => setShowBeams(!showBeams)} className={`w-10 h-5 rounded-full relative ${showBeams ? 'bg-cyan-500' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showBeams ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cubierta</span>
                            <button onClick={() => setShowRoofPlates(!showRoofPlates)} className={`w-10 h-5 rounded-full relative ${showRoofPlates ? 'bg-cyan-500' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showRoofPlates ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1">
                                <span>Ajuste Altura Cubierta</span>
                                <span className="text-cyan-600">{(beamOffset * 100).toFixed(0)}cm</span>
                            </div>
                            <input
                                type="range" min="-0.2" max="0.5" step="0.01" value={beamOffset}
                                onChange={(e) => setBeamOffset(parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Engineering;
