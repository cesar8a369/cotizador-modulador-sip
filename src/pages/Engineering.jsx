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
        project
    } = useStore();

    const [maximizedFacade, setMaximizedFacade] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [canvasImages, setCanvasImages] = useState({ snapshots: [], floor: null });
    const [logoBase64, setLogoBase64] = useState(null);

    // Pre-load logo to avoid CORS blocking the PDF generation
    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const response = await fetch(PROJECT_LOGO);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => setLogoBase64(reader.result);
                reader.readAsDataURL(blob);
            } catch (e) {
                console.warn("PDF Logo Pre-load failed:", e);
                // Fallback will be the URL if local fetch fails
            }
        };
        fetchLogo();
    }, []);

    const captureCanvases = async () => {
        // 1. Capture 3D Canvas
        const viewer3d = document.querySelector('#viewer-3d-container canvas');
        const snapshots = [];
        if (viewer3d) {
            snapshots.push(viewer3d.toDataURL('image/jpeg', 0.9));
        }

        // 2. Capture FloorPlan SVG to Canvas
        const floorPlanContainer = document.getElementById('floorplan-container');
        let floorImage = null;
        if (floorPlanContainer) {
            const canvas = await html2canvas(floorPlanContainer, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true
            });
            floorImage = canvas.toDataURL('image/png');
        }

        return { snapshots, floorImage };
    };

    const handleGenerateHighResPDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const { snapshots, floorImage } = await captureCanvases();
            setCanvasImages({ snapshots: snapshots, floor: floorImage });
            await new Promise(r => setTimeout(r, 800));

            document.body.classList.add('printing-pro-report');
            setTimeout(() => {
                window.print();
                document.body.classList.remove('printing-pro-report');
                setIsGeneratingPDF(false);
            }, 600);
        } catch (err) {
            console.error("PDF Print Error:", err);
            alert("No se pudo iniciar el proceso de impresión.");
            document.body.classList.remove('printing-pro-report');
            setIsGeneratingPDF(false);
        }
    };

    const geo = useMemo(() => {
        const result = calculateGeometry(dimensions, interiorWalls, facadeConfigs, openings, project);
        console.log('Geometry calculated:', result);
        return result;
    }, [dimensions, interiorWalls, facadeConfigs, openings, project]);

    const quantities = useMemo(() => {
        const { selections = {}, prices = {} } = useStore.getState();
        const result = fullCalculation(dimensions, selections, interiorWalls, openings, facadeConfigs, project);
        return result.quantities || {};
    }, [dimensions, interiorWalls, facadeConfigs, openings, project]);

    useEffect(() => {
        console.log('Geo object updated:', geo);
    }, [geo]);

    const copyToClipboard = () => {
        const text = `Reporte Técnico - SIP Modulador\n` +
            `Planta: ${dimensions.width}x${dimensions.length}m\n` +
            `Área Piso: ${(geo.areaPiso || 0).toFixed(2)}m²\n` +
            `Perímetro: ${(geo.perimExt || 0).toFixed(2)}m\n` +
            `Paneles Totales: ${geo.totalPaneles || 0}`;
        navigator.clipboard.writeText(text);
        alert("Reporte copiado!");
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

                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                                        <span className="font-black uppercase tracking-widest block mb-1">Nota SIP:</span>
                                        Las alturas de las esquinas deben coincidir entre fachadas adyacentes para una unión estructural correcta.
                                    </p>
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

                    {/* BOTTOM: FACADES GRID */}
                    <div className="lg:h-[260px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 transition-all p-1">
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

                {/* RIGHT COLUMN: CONTROLS (1 col) */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar lg:max-h-[calc(100vh-120px)] pb-20 lg:pb-0">

                    {/* HOUSE DIMENSIONS - TOP PRIORITY */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm shrink-0">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-sm shadow-indigo-200"></div>
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Dimensiones Base</h3>
                        </div>
                        <div className="space-y-5">
                            <RangeControl label="Largo Casa" value={dimensions.length} onChange={(v) => setDimensions({ length: v })} min={3} max={20} step={0.04} unit="m" />
                            <RangeControl label="Ancho Casa" value={dimensions.width} onChange={(v) => setDimensions({ width: v })} min={3} max={15} step={0.04} unit="m" />
                            <RangeControl label="Altura Base del Proyecto" value={dimensions.height} onChange={(v) => setDimensions({ height: v })} min={2.44} max={6.0} step={0.01} unit="m" />
                            <RangeControl label="Altura Cumbrera" value={dimensions.ridgeHeight} onChange={(v) => setDimensions({ ridgeHeight: v })} min={2.44} max={8.0} step={0.01} unit="m" />
                        </div>
                    </div>

                    {/* 3D VIEWER COMPACT */}
                    <div className="shrink-0">
                        <div className="h-64 shadow-sm border border-slate-200 rounded-[40px] overflow-hidden">
                            <Viewer3D />
                        </div>

                        {/* BEAM ADJUSTMENT - RIGHT BELOW 3D */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-3">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 bg-amber-500 rounded-full shadow-sm shadow-amber-200"></div>
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Ajuste de Vigas</h3>
                            </div>
                            <RangeControl
                                label="Offset Vertical"
                                value={beamOffset}
                                onChange={setBeamOffset}
                                min={-0.5}
                                max={0.5}
                                step={0.01}
                                unit="m"
                            />
                            <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">
                                Ajusta la altura de las vigas para alinearlas con el techo.
                            </p>
                        </div>
                    </div>

                    {/* TECHNICAL DATA - MOVED UP */}
                    <div className="bg-slate-900 rounded-3xl p-5 text-slate-300 font-mono text-[10px] shadow-2xl border border-slate-800 shrink-0">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                            <span className="text-cyan-500 font-black tracking-[0.2em] text-[10px] uppercase">Reporte de Ingeniería</span>
                            <span className="text-slate-600 text-[9px] font-bold">Z1-MOD-2026</span>
                        </div>

                        <div className="space-y-5">
                            {/* CATEGORY 1: PANELES */}
                            <div className="space-y-1.5">
                                <h4 className="text-slate-500 font-bold text-[9px] uppercase tracking-widest border-l-2 border-cyan-500 pl-2">Paneles Totales</h4>
                                <DataRow label="- Muros Perimetrales" value={geo.cantMurosExt || 0} sub="u" inverted />
                                <DataRow label="- Tabiquería Interna" value={geo.cantMurosInt || 0} sub="u" inverted />
                                <DataRow label="- Paneles de Losa (Piso)" value={geo.cantPiso || 0} sub="u" inverted />
                                <DataRow label="- Paneles de Cubierta (Techo)" value={geo.cantTecho || 0} sub="u" inverted />
                                <div className="pt-1 flex justify-between font-bold text-cyan-400 border-t border-slate-800 mt-1">
                                    <span>TOTAL PANELES SIP</span>
                                    <span>{geo.totalPaneles || 0} u</span>
                                </div>
                            </div>

                            {/* CATEGORY 2: GEOMETRY */}
                            <div className="space-y-1.5">
                                <h4 className="text-slate-500 font-bold text-[9px] uppercase tracking-widest border-l-2 border-slate-700 pl-2">Geometría de la Casa</h4>
                                <DataRow label="- Área de Planta" value={(geo.areaPiso || 0).toFixed(2)} sub="m²" inverted />
                                <DataRow label="- Perímetro Exterior" value={(geo.perimExt || 0).toFixed(2)} sub="ml" inverted />
                                <DataRow label="- Área Muros" value={(geo.areaMuros || 0).toFixed(2)} sub="m²" inverted />
                                <DataRow label="- Área Techos" value={(geo.areaTecho || 0).toFixed(2)} sub="m²" inverted />
                                <DataRow label="- Metros Lineales Divisiones" value={(geo.tabiques || 0).toFixed(2)} sub="ml" inverted />
                            </div>

                            {/* CATEGORY 3: PERIMETERS */}
                            <div className="space-y-1.5">
                                <h4 className="text-slate-500 font-bold text-[9px] uppercase tracking-widest border-l-2 border-slate-700 pl-2">Otros Perímetros</h4>
                                <DataRow label="- Perímetro Total Aberturas" value={(geo.perimAberturas || 0).toFixed(2)} sub="ml" inverted />
                                <DataRow label="- Perímetro Lineal de Paneles" value={(geo.perimLinealPaneles || 0).toFixed(0)} sub="ml" inverted />
                            </div>

                            {/* CATEGORY 4: FACADE DETAILS */}
                            <div className="space-y-1.5">
                                <h4 className="text-slate-500 font-bold text-[9px] uppercase tracking-widest border-l-2 border-cyan-500 pl-2">Detalle Fachadas</h4>
                                {geo.facadeDetails && Object.entries(geo.facadeDetails).map(([side, area]) => (
                                    <DataRow key={side} label={`- Fachada ${side}`} value={(area || 0).toFixed(2)} sub="m²" inverted />
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800">
                            <button onClick={copyToClipboard} className="w-full bg-slate-800 hover:bg-slate-700 transition-colors text-white py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold">
                                <Copy size={14} /> Copiar Reporte
                            </button>
                        </div>
                    </div>

                    {/* GEOMETRY CONTROLS */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 shrink-0">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-sm shadow-cyan-200"></div>
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Visualización 3D</h3>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mostrar Vigas</span>
                                <button
                                    onClick={() => setShowBeams(!showBeams)}
                                    className={`w-10 h-5 rounded-full transition-all relative outline-none ${showBeams ? 'bg-amber-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${showBeams ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mostrar Cubierta</span>
                                <button
                                    onClick={() => setShowRoofPlates(!showRoofPlates)}
                                    className={`w-10 h-5 rounded-full transition-all relative outline-none ${showRoofPlates ? 'bg-cyan-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${showRoofPlates ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>

                        {/* SELECTION CONTROL: TABIQUE */}
                        {activeInteriorWallId && (
                            <div className="space-y-4 pt-4 border-t-2 border-cyan-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                        <h3 className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.2em]">Tabique Seleccionado</h3>
                                    </div>
                                    <button
                                        onClick={() => setActiveInteriorWallId(null)}
                                        className="text-[9px] font-bold text-slate-400 hover:text-rose-500 uppercase transition-colors"
                                    >
                                        Deseleccionar
                                    </button>
                                </div>

                                {interiorWalls.find(w => w.id === activeInteriorWallId) && (
                                    <RangeControl
                                        label="Largo del Tabique"
                                        value={interiorWalls.find(w => w.id === activeInteriorWallId).length}
                                        onChange={(v) => updateInteriorWall(activeInteriorWallId, { length: v })}
                                        min={0.4} max={10} step={0.04} unit="m"
                                    />
                                )}
                                <p className="text-[9px] text-slate-400 italic">Mueve el tabique arrastrándolo en el plano 2D.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* HIDDEN REPORT TEMPLATE FOR PDF GENERATION */}
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
