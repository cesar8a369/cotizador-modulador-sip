import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { calculateGeometry, fullCalculation } from '../utils/calculations';
import FloorPlan from '../components/engineering/FloorPlan';
import FacadeView from '../components/engineering/FacadeView';
import Viewer3D from '../components/engineering/Viewer3D';
import { Link } from 'react-router-dom';
import { FileText, Copy, ChevronLeft, ChevronRight, Maximize2, X, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PDFReportTemplate from '../components/export/PDFReportTemplate';
import ExportDataButton from '../components/export/ExportDataButton';

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
                onChange={(e) => onChange(parseFloat(e.target.value))}
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
        selections, toggleSelectionCategory,
        prices
    } = useStore();

    const [maximizedFacade, setMaximizedFacade] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [canvasImages, setCanvasImages] = useState({ snapshots: [], floor: null });
    const [logoBase64, setLogoBase64] = useState(null);

    const geo = useMemo(() => {
        return calculateGeometry(dimensions, interiorWalls, facadeConfigs, openings, project, selections);
    }, [dimensions, interiorWalls, facadeConfigs, openings, project, selections]);

    const quantities = useMemo(() => {
        const result = fullCalculation(dimensions, selections, interiorWalls, openings, facadeConfigs, project, foundationType, structureType, prices);
        return result.quantities || {};
    }, [dimensions, selections, interiorWalls, openings, facadeConfigs, project, foundationType, structureType, prices]);

    const copyToClipboard = () => {
        const text = `REPORTE TÉCNICO - SIP MODULADOR\n\n` +
            `PANELES TOTALES:\n` +
            `- Muro Exterior: ${geo.cantMurosExt || 0}\n` +
            `- Muro Interior: ${geo.cantMurosInt || 0}\n` +
            `- Piso SIP OSB 70mm: ${geo.cantPiso || 0}\n` +
            `- Techo SIP OSB 70mm: ${geo.cantTecho || 0}\n\n` +
            `GEOMETRÍA DE LA CASA:\n` +
            `- Área de Planta: ${(geo.areaPiso || 0).toFixed(2)} m²\n` +
            `- Perímetro Exterior: ${(geo.perimExt || 0).toFixed(2)} ml\n` +
            `- Área Muros: ${(geo.areaMurosBruta || 0).toFixed(2)} m²\n` +
            `- Área Techos: ${(geo.areaTecho || 0).toFixed(2)} m²\n` +
            `- Metros Lineales Divisiones: ${(geo.tabiques || 0).toFixed(2)} ml\n\n` +
            `OTROS PERÍMETROS:\n` +
            `- Perímetro Total Aberturas: ${(geo.perimAberturas || 0).toFixed(2)} ml\n` +
            `- Perímetro Total de Paneles (Muros/Piso): ${(geo.perimLinealPaneles || 0).toFixed(2)} ml\n\n` +
            `TOTAL PANELES: ${geo.totalPaneles || 0} Unid.`;
        navigator.clipboard.writeText(text);
        alert("Reporte detallado copiado!");
    };

    return (
        <div className="flex flex-col min-h-screen lg:h-screen bg-slate-50 p-2 md:p-4 gap-4 overflow-x-hidden">

            {/* FACADE MODAL */}
            {maximizedFacade && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-8">
                    <div className="bg-white w-full max-w-6xl h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                    Configuración de Fachada {maximizedFacade}
                                    <span className="bg-cyan-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">Avanzado</span>
                                </h2>
                                <p className="text-slate-400 text-sm font-medium">Define el tipo de techo y alturas específicas para este lado.</p>
                            </div>
                            <button onClick={() => setMaximizedFacade(null)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-slate-400 hover:text-rose-500 group">
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
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
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">TIPO DE TECHO</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {['recto', 'inclinado', '2-aguas'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => updateFacadeConfig(maximizedFacade, { type })}
                                                className={`px-4 py-4 rounded-2xl text-sm font-bold border-2 transition-all flex flex-col gap-1 ${facadeConfigs[maximizedFacade].type === type
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

                                    {facadeConfigs[maximizedFacade].type === 'recto' && (
                                        <RangeControl
                                            label="Altura Muro (Base)"
                                            value={facadeConfigs[maximizedFacade].hBase}
                                            onChange={(v) => updateFacadeConfig(maximizedFacade, { hBase: v, hMax: v })}
                                            min={2.44} max={5.0} step={0.1} unit="m"
                                        />
                                    )}

                                    {facadeConfigs[maximizedFacade].type === 'inclinado' && (
                                        <>
                                            <RangeControl
                                                label="Altura Izquierda"
                                                value={facadeConfigs[maximizedFacade].hBase}
                                                onChange={(v) => updateFacadeConfig(maximizedFacade, { hBase: v })}
                                                min={2.44} max={6.0} step={0.1} unit="m"
                                            />
                                            <RangeControl
                                                label="Altura Derecha"
                                                value={facadeConfigs[maximizedFacade].hMax}
                                                onChange={(v) => updateFacadeConfig(maximizedFacade, { hMax: v })}
                                                min={2.44} max={6.0} step={0.1} unit="m"
                                            />
                                        </>
                                    )}

                                    {facadeConfigs[maximizedFacade].type === '2-aguas' && (
                                        <>
                                            <RangeControl
                                                label="Altura Aleros (Base)"
                                                value={facadeConfigs[maximizedFacade].hBase}
                                                onChange={(v) => updateFacadeConfig(maximizedFacade, { hBase: v })}
                                                min={2.44} max={6.0} step={0.1} unit="m"
                                            />
                                            <RangeControl
                                                label="Altura Cumbrera (Pico)"
                                                value={facadeConfigs[maximizedFacade].hMax}
                                                onChange={(v) => updateFacadeConfig(maximizedFacade, { hMax: v })}
                                                min={2.44} max={7.0} step={0.1} unit="m"
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT GRID */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-4 pb-2">

                {/* LEFT COLUMN: VISUALS (3 cols) */}
                <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
                    <div className="flex-1 min-h-[400px] lg:min-h-0 bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                        <FloorPlan />
                    </div>

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
                </div>

                {/* RIGHT COLUMN: CONTROLS */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar lg:max-h-[calc(100vh-120px)] pb-20 lg:pb-0">

                    {/* HOUSE DIMENSIONS */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Dimensiones Base</h3>
                        </div>
                        <div className="space-y-5">
                            <RangeControl label="Largo" value={dimensions.length} onChange={(v) => setDimensions({ length: v })} min={3} max={20} step={1} unit="m" />
                            <RangeControl label="Ancho" value={dimensions.width} onChange={(v) => setDimensions({ width: v })} min={3} max={15} step={1} unit="m" />
                            <RangeControl label="Altura" value={dimensions.height} onChange={(v) => setDimensions({ height: v })} min={2.44} max={6.0} step={0.10} unit="m" />
                            <RangeControl label="Cumbrera" value={dimensions.ridgeHeight} onChange={(v) => setDimensions({ ridgeHeight: v })} min={2.44} max={8.0} step={0.10} unit="m" />
                        </div>
                    </div>

                    {/* ACTIVE INTERIOR WALL CONTROLS */}
                    {activeInteriorWallId && (
                        <div className="bg-white p-5 rounded-3xl border border-cyan-500 shadow-lg animate-in fade-in slide-in-from-right-2">
                            <div className="flex items-center justify-between border-b border-cyan-100 pb-2 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                    <h3 className="text-[10px] font-black text-cyan-800 uppercase tracking-widest">Edición de Tabique</h3>
                                </div>
                                <button
                                    onClick={() => setActiveInteriorWallId(null)}
                                    className="p-1 hover:bg-cyan-50 rounded text-cyan-400"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="space-y-5">
                                {(() => {
                                    const wall = interiorWalls.find(w => w.id === activeInteriorWallId);
                                    if (!wall) return null;
                                    return (
                                        <>
                                            <RangeControl
                                                label="Longitud"
                                                value={wall.length}
                                                onChange={(v) => updateInteriorWall(wall.id, { length: v })}
                                                min={0.4}
                                                max={wall.isVertical ? dimensions.length : dimensions.width}
                                                step={0.01}
                                                unit="m"
                                            />
                                            <RangeControl
                                                label="Posición X"
                                                value={wall.x}
                                                onChange={(v) => updateInteriorWall(wall.id, { x: v })}
                                                min={0}
                                                max={dimensions.width}
                                                step={0.01}
                                                unit="m"
                                            />
                                            <RangeControl
                                                label="Posición Y"
                                                value={wall.y}
                                                onChange={(v) => updateInteriorWall(wall.id, { y: v })}
                                                min={0}
                                                max={dimensions.length}
                                                step={0.01}
                                                unit="m"
                                            />
                                            <button
                                                onClick={() => updateInteriorWall(wall.id, { isVertical: !wall.isVertical })}
                                                className="w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-cyan-500 hover:text-cyan-600 transition-all"
                                            >
                                                Rotar Orientación
                                            </button>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

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
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Estructura de Piso</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setStructureType('madera')} className={`py-2 rounded-xl text-[10px] font-black border-2 transition-all ${structureType === 'madera' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-slate-100 text-slate-400'}`}>MADERA</button>
                                    <button onClick={() => setStructureType('metal')} className={`py-2 rounded-xl text-[10px] font-black border-2 transition-all ${structureType === 'metal' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-slate-100 text-slate-400'}`}>METAL</button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Incluir en Cómputo</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { id: 'includeExterior', label: 'Muros Perimetrales' },
                                        { id: 'includeInterior', label: 'Tabiques Internos' },
                                        { id: 'includeFloor', label: 'Paneles de Piso' },
                                        { id: 'includeRoof', label: 'Paneles de Techo' },
                                    ].map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => toggleSelectionCategory(cat.id)}
                                            className={`flex items-center justify-between px-3 py-2 rounded-xl border-2 transition-all ${selections[cat.id] ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'}`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-wider">{cat.label}</span>
                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${selections[cat.id] ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-200'}`}>
                                                {selections[cat.id] && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3D VIEWER COMPACT */}
                    <div className="space-y-4">
                        <div className="h-64 shadow-sm border border-slate-200 rounded-[40px] overflow-hidden">
                            <Viewer3D />
                        </div>
                        <div className="bg-white p-4 rounded-3xl border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Vigas</h3>
                            </div>
                            <RangeControl label="Offset" value={beamOffset} onChange={setBeamOffset} min={-0.5} max={0.5} step={0.01} unit="m" />
                        </div>
                    </div>

                    {/* REPORT */}
                    <div className="bg-slate-900 rounded-[40px] p-6 text-slate-300 font-mono text-[10px]">
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                            <span className="text-cyan-400 font-black">REPORTE TÉCNICO</span>
                            <span className="text-white/20">SIP 2026</span>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-white/40 text-[8px] uppercase font-black mb-2">PANELES TOTALES</h4>
                                <DataRow label="Muro Exterior" value={geo.cantMurosExt} inverted />
                                <DataRow label="Muro Interior" value={geo.cantMurosInt} inverted />
                                <DataRow label="Piso SIP OSB 70mm" value={geo.cantPiso} inverted />
                                <DataRow label="Techo SIP OSB 70mm" value={geo.cantTecho} inverted />
                            </div>

                            <div>
                                <h4 className="text-white/40 text-[8px] uppercase font-black mb-2">GEOMETRÍA DE LA CASA</h4>
                                <DataRow label="Área de Planta" value={geo.areaPiso?.toFixed(2)} sub="m²" inverted />
                                <DataRow label="Perímetro Exterior" value={geo.perimExt?.toFixed(2)} sub="ml" inverted />
                                <DataRow label="Área Muros" value={geo.areaMurosBruta?.toFixed(2)} sub="m²" inverted />
                                <DataRow label="Área Techos" value={geo.areaTecho?.toFixed(2)} sub="m²" inverted />
                                <DataRow label="ML Divisiones" value={geo.tabiques?.toFixed(2)} sub="ml" inverted />
                            </div>

                            <div>
                                <h4 className="text-white/40 text-[8px] uppercase font-black mb-2">OTROS PERÍMETROS</h4>
                                <DataRow label="Total Aberturas" value={geo.perimAberturas?.toFixed(2)} sub="ml" inverted />
                                <DataRow label="Total Paneles (Muros/Piso)" value={geo.perimLinealPaneles?.toFixed(2)} sub="ml" inverted />
                            </div>

                            <div className="pt-2 border-t border-white/5 flex justify-between font-black text-cyan-400 text-xs uppercase">
                                <span>TOTAL PANELES</span>
                                <span>{geo.totalPaneles} Unid.</span>
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
                    </div>
                </div>
            </div>

            <PDFReportTemplate
                snapshots3D={canvasImages.snapshots}
                floorPlanImage={canvasImages.floor}
                geo={geo}
                quantities={quantities}
            />
        </div>
    );
};

export default Engineering;
