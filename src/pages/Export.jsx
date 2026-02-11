import React, { useRef, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { fullCalculation } from '../utils/calculations';
import { calculateBudget } from '../utils/budget';
import FloorPlan from '../components/engineering/FloorPlan';
import FacadeView from '../components/engineering/FacadeView';
import { FileText, Download, Loader2, CheckCircle2, Factory, User, MapPin, Calendar, Home, Ruler, PenTool, Layout, Image as ImageIcon, Maximize, Compass, GitCommit, Settings, Columns, Square } from 'lucide-react';
import { PROJECT_LOGO } from '../data/constants';
import html2canvas from 'html2canvas';

const FACTORY_NAME = "LA FÁBRICA DEL PANEL";

const PageHeader = ({ title }) => {
    const { project, generateBudgetNumber } = useStore();

    React.useEffect(() => {
        if (!project.budgetNumber) {
            generateBudgetNumber();
        }
    }, [project.budgetNumber, generateBudgetNumber]);

    return (
        <div className="relative mb-10 shrink-0">
            <div className="absolute -left-[20mm] top-0 w-2 h-16 bg-orange-600 rounded-r-full"></div>
            <div className="flex justify-between items-end pb-4 border-b-2 border-slate-100">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-slate-200">
                            <img src={PROJECT_LOGO} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-950 tracking-widest leading-none">MODULADOR SIP</span>
                            <span className="text-[8px] font-bold text-orange-600 uppercase tracking-tighter mt-1">{FACTORY_NAME}</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">{title || 'Documento'}</h1>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Registro Técnico No.</p>
                    <p className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full inline-block">
                        {project.budgetNumber || '...'}
                    </p>
                </div>
            </div>
        </div>
    );
};

const ProjectFooter = ({ price, pageNumber, hidePrice }) => (
    <div className="mt-auto shrink-0">
        <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            <div className="flex items-center gap-6">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-100 shadow-sm">
                    <img src={PROJECT_LOGO} alt="Logo Small" className="w-full h-full object-contain" />
                </div>
                <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">WhatsApp / Contacto</p>
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-tighter leading-none">1176561032 (area - ventas)</p>
                </div>
            </div>
            <div className="flex items-center gap-6 text-right">
                {!hidePrice && (
                    <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Inversión Final</p>
                        <p className="text-lg font-black text-slate-900 tracking-tighter leading-none">
                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price)}
                        </p>
                    </div>
                )}
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                    {pageNumber}
                </div>
            </div>
        </div>
    </div>
);

const Export = () => {
    const { dimensions, selections, interiorWalls, openings, facadeConfigs, prices, project, snapshots, foundationType, structureType } = useStore();
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const { geo, quantities } = useMemo(() => {
        try {
            return fullCalculation(dimensions, selections, interiorWalls, openings, facadeConfigs, project, foundationType, structureType, prices);
        } catch (e) {
            console.error("Calculation error:", e);
            return { geo: {}, quantities: {} };
        }
    }, [dimensions, selections, interiorWalls, openings, facadeConfigs, project, foundationType, structureType, prices]);

    const { items: budgetItems, total: finalTotal, subtotal: subtotalWithMarkup } = useMemo(() => {
        try {
            return calculateBudget(quantities, prices, project);
        } catch (e) {
            console.error("Budget calculation error:", e);
            return { items: [], total: 0, subtotal: 0 };
        }
    }, [quantities, prices, project]);

    const { panelsItems, suppliesPages, panelsSubtotal, suppliesSubtotal } = useMemo(() => {
        const panels = budgetItems.filter(item => item.category === '1. SISTEMA DE PANELES');
        const supplies = budgetItems.filter(item => item.category !== '1. SISTEMA DE PANELES');
        const ITEMS_PER_PAGE = 18;
        const pages = [];
        if (supplies.length === 0) {
            pages.push([]);
        } else {
            for (let i = 0; i < supplies.length; i += ITEMS_PER_PAGE) {
                pages.push(supplies.slice(i, i + ITEMS_PER_PAGE));
            }
        }
        return {
            panelsItems: panels,
            suppliesPages: pages,
            panelsSubtotal: panels.reduce((acc, i) => acc + (i.total || 0), 0),
            suppliesSubtotal: supplies.reduce((acc, i) => acc + (i.total || 0), 0)
        };
    }, [budgetItems]);

    const formatCurrency = (val) => {
        try {
            if (val === undefined || val === null || isNaN(val)) return '$ 0';
            return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
        } catch (e) {
            return '$ 0';
        }
    };

    const handleExportPDF = () => { window.print(); };

    const handleExportImage = async () => {
        setIsGeneratingImage(true);
        try {
            window.scrollTo(0, 0);
            const pages = document.querySelectorAll('.pdf-page');
            const canvases = [];
            for (let i = 0; i < pages.length; i++) {
                const canvas = await html2canvas(pages[i], { scale: 1.5, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
                canvases.push(canvas);
            }
            const totalHeight = canvases.reduce((sum, canvas) => sum + canvas.height, 0);
            const maxWidth = Math.max(...canvases.map(c => c.width));
            const mergedCanvas = document.createElement('canvas');
            mergedCanvas.width = maxWidth;
            mergedCanvas.height = totalHeight;
            const ctx = mergedCanvas.getContext('2d');
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, mergedCanvas.width, mergedCanvas.height);
            let currentY = 0;
            canvases.forEach(canvas => {
                ctx.drawImage(canvas, 0, currentY);
                currentY += canvas.height;
            });
            const cleanName = (project.clientName || 'Proyecto').replace(/[^a-z0-9]/gi, '_');
            const link = document.createElement('a');
            link.download = `Cotizacion_${cleanName}_LFP.jpg`;
            link.href = mergedCanvas.toDataURL('image/jpeg', 0.8);
            link.click();
        } catch (err) {
            console.error("Image Fail:", err);
            alert("Error al generar la imagen.");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const isReady = geo && Object.keys(geo).length > 0;
    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 flex-col gap-4">
                <Loader2 className="animate-spin text-cyan-600" size={48} />
                <p className="text-slate-500 font-bold animate-pulse">Generando Reporte Técnico...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen py-10 print:py-0">
            <style>{`
                @media print {
                    @page { size: A4; margin: 0mm !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 210mm !important;
                        overflow: visible !important;
                        background: white !important;
                    }
                    #root, main, .max-w-[1920px], .p-2, .md\\:p-6 {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: none !important;
                        position: static !important;
                        width: 210mm !important;
                    }
                    #export-container { display: block !important; margin: 0 !important; padding: 0 !important; width: 210mm !important; }
                    .pdf-page {
                        display: flex !important;
                        flex-direction: column !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        min-height: 297mm !important;
                        max-height: 297mm !important;
                        margin: 0 !important;
                        padding: 20mm !important;
                        box-sizing: border-box !important;
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                        page-break-before: avoid !important;
                        background: white !important;
                        position: relative !important;
                        overflow: visible !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .pdf-page:first-of-type { page-break-before: avoid !important; margin-top: 0 !important; }
                    #export-container > div { margin-bottom: 0 !important; }
                }
            `}</style>

            <div className="fixed bottom-8 right-8 z-[100] print:hidden flex flex-col gap-3">
                <button disabled={isGeneratingImage} onClick={handleExportPDF} className="group bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all transform active:scale-95 border-4 border-white">
                    {isGeneratingImage ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                    {isGeneratingImage ? "Generando..." : "Descargar PDF Pro"}
                </button>
                <button disabled={isGeneratingImage} onClick={handleExportImage} className="group bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-full font-black uppercase tracking-[0.15em] text-[10px] shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 border-2 border-white">
                    <ImageIcon size={18} /> Exportar como Imagen
                </button>
            </div>

            <div id="export-container" className="flex flex-col items-center gap-10 print:gap-0 print:block">
                {/* PAGE 1: PORTADA */}
                <div className="pdf-page w-[210mm] h-[297mm] bg-white border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none p-[10mm] flex flex-col items-stretch text-slate-900 relative">
                    <div className="absolute top-0 right-0 w-[150mm] h-[150mm] bg-orange-50 rounded-full -mr-[50mm] -mt-[50mm] blur-[100px] opacity-50"></div>
                    <div className="flex-1 flex flex-col border-[4px] border-slate-50 p-6 rounded-[50px] relative z-10 overflow-hidden">
                        <div className="flex justify-between items-center mb-8 px-4">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl border border-slate-100">
                                    <img src={PROJECT_LOGO} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-2xl font-black tracking-widest text-slate-900 leading-none">MODULADOR SIP</h1>
                                    <span className="text-base font-black text-orange-500 uppercase tracking-widest mt-1">{FACTORY_NAME}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</div>
                                <div className="text-sm font-black text-slate-900">{new Date().toLocaleDateString('es-AR')}</div>
                            </div>
                        </div>
                        <div className="mb-8 text-center">
                            <h2 className="text-6xl font-black tracking-tighter leading-tight uppercase mb-2">PROPUESTA <span className="text-orange-500">TÉCNICA</span></h2>
                            <p className="text-2xl font-bold text-slate-500 uppercase tracking-wider">Sistema Constructivo SIP</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-50 to-white rounded-[40px] p-8 border-2 border-slate-100 mb-8 shadow-sm">
                            <h3 className="text-xs font-black text-orange-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div> Información del Proyecto
                            </h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cliente</div><div className="text-lg font-black text-slate-900">{project.clientName || 'No especificado'}</div></div>
                                <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CUIT / CUIL</div><div className="text-lg font-black text-slate-900">{project.cuit || '---'}</div></div>
                                <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ubicación</div><div className="text-lg font-black text-slate-900">{project.location || 'No especificada'}</div></div>
                                <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Superficie</div><div className="text-lg font-black text-slate-900 text-orange-600">{geo?.areaPiso?.toFixed(1) || '0'} m²</div></div>
                            </div>
                        </div>
                        <div className="flex-[3] bg-slate-100 rounded-[50px] overflow-hidden relative border-8 border-white shadow-2xl mb-8">
                            {snapshots && snapshots.length > 0 ? (
                                <img src={snapshots[0]} className="w-full h-full object-cover" alt="Vista 3D" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 uppercase font-black tracking-widest text-xs">Vista 3D proyectada no disponible</div>
                            )}
                        </div>
                        <div className="flex-1"></div>
                    </div>
                </div>

                {/* PAGE 2: SISTEMA SIP */}
                <div className="pdf-page w-[210mm] h-[297mm] bg-white p-[10mm] flex flex-col text-slate-900 border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none">
                    <PageHeader title="Sistema Constructivo SIP" />
                    <div className="flex-1 space-y-6">
                        <div className="bg-gradient-to-br from-orange-50 to-white rounded-[30px] p-6 border-2 border-orange-100">
                            <h3 className="text-lg font-black text-orange-600 uppercase tracking-wider mb-4">¿Qué es el Sistema SIP?</h3>
                            <p className="text-base leading-relaxed text-slate-700 font-bold uppercase">Los Paneles Estructurales Aislados (SIP) son un sistema de última generación que combina estructura y aislación térmica. Consisten en un núcleo de EPS de densidad estándar revestido en ambas caras con tableros OSB estructurales.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            {[
                                { t: 'Construcción Rápida', d: 'Reducción del tiempo de obra hasta un 70%.', e: '⚡' },
                                { t: 'Eficiencia Térmica', d: 'Aislación superior, ahorro de hasta 60% en energía.', e: '🌡️' },
                                { t: 'Alta Resistencia', d: 'Estructura monolítica con excelente respuesta sísmica.', e: '💪' },
                                { t: 'Sustentable', d: 'Menor impacto ambiental y reducción de residuos.', e: '🌱' }
                            ].map((v, i) => (
                                <div key={i} className="bg-white rounded-[25px] p-6 border-2 border-slate-100 shadow-sm flex flex-col items-center text-center justify-center">
                                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 text-4xl">{v.e}</div>
                                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-wide mb-3">{v.t}</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed font-bold uppercase">{v.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <ProjectFooter price={finalTotal} pageNumber={2} />
                </div>

                {/* PAGE 3: PLANTA */}
                <div className="pdf-page w-[210mm] h-[297mm] bg-white p-[10mm] flex flex-col text-slate-900 border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none">
                    <PageHeader title="Plano de Planta y Eficiencia Energética" />
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { l: 'Largo', v: `${dimensions.length}m` },
                                { l: 'Ancho', v: `${dimensions.width}m` },
                                { l: 'Superficie', v: `${geo?.areaPiso?.toFixed(1) || '0'}m²` },
                                { l: 'Perímetro', v: `${geo?.perimExt?.toFixed(1) || '0'}m` }
                            ].map((d, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                                    <div className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">{d.l}</div>
                                    <div className="text-2xl font-black text-slate-900 tracking-tighter">{d.v}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 bg-white border-2 border-slate-100 rounded-[40px] flex items-center justify-center relative overflow-hidden">
                            <FloorPlan isPrint={true} />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-900 rounded-[30px] p-6 text-white space-y-4 shadow-xl">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-orange-400 border-b border-white/10 pb-2 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                                    Memoria Técnica SIP
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider">Núcleo Aislante:</span>
                                        <span className="font-black text-white">70mm EPS Densidad Estándar</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider">Eficiencia Térmica:</span>
                                        <span className="font-black text-orange-400">Hasta 60% Ahorro</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider">Volumen Aislado:</span>
                                        <span className="font-black text-white">{(geo?.areaPiso * dimensions.height).toFixed(1)} m³ aprox.</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider">Anclaje Estructural:</span>
                                        <span className="font-black text-white">Sistema de Solera Continua</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-orange-50 border border-orange-100 rounded-[30px] p-6 space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-orange-700 border-b border-orange-200 pb-2">Beneficios a Largo Plazo</h4>
                                <ul className="space-y-2">
                                    {[
                                        'Confort térmico constante todo el año.',
                                        'Reducción drástica en facturas de energía.',
                                        'Ambiente libre de humedad y moho.',
                                        'Aislamiento acústico superior para el descanso.',
                                        'Mayor valor de reventa del inmueble.'
                                    ].map((b, i) => (
                                        <li key={i} className="flex items-start gap-3 text-[10px] font-black text-slate-700 uppercase tracking-tight">
                                            <div className="mt-1 w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0"></div>
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <ProjectFooter price={finalTotal} pageNumber={3} />
                </div>

                {/* PAGE 4 & 5: FACHADAS */}
                {[['Norte', 'Sur'], ['Este', 'Oeste']].map((sides, pIdx) => (
                    <div key={pIdx} className="pdf-page w-[210mm] h-[297mm] bg-white p-[10mm] flex flex-col text-slate-900 border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none">
                        <PageHeader title={`Fachadas - ${sides[0]} y ${sides[1]}`} />
                        <div className="flex-1 flex flex-col justify-around py-4">
                            {sides.map(side => (
                                <div key={side} className="flex-1 flex flex-col justify-center space-y-4">
                                    <h3 className="text-center text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Fachada: {side}</h3>
                                    <div className="flex-1 bg-white rounded-[40px] border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
                                        <FacadeView type={side} data={{ ...dimensions, openings, facadeConfigs, project, isPrint: true }} scale={35} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <ProjectFooter price={finalTotal} pageNumber={4 + pIdx} />
                    </div>
                ))}

                {/* PAGE 6: MEMORIA */}
                <div className="pdf-page w-[210mm] h-[297mm] bg-white p-[10mm] flex flex-col text-slate-900 border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none">
                    <PageHeader title="Memoria de Materiales" />
                    <div className="flex-1 flex flex-col justify-center space-y-12">
                        <section className="space-y-6">
                            <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4 text-center justify-center">
                                <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200"><Home size={18} /></div>
                                Cómputo de Componentes SIP Principales
                            </h3>
                            <div className="grid grid-cols-5 gap-4 items-stretch">
                                {[
                                    { label: 'Muro Ext.', val: geo?.cantMurosExt || 0, show: selections.includeExterior !== false },
                                    { label: 'Muro Int.', val: geo?.cantMurosInt || 0, show: selections.includeInterior !== false },
                                    { label: 'Piso SIP', val: geo?.cantPiso || 0, show: foundationType !== 'platea' && selections.includeFloor !== false },
                                    { label: 'Techo SIP', val: geo?.cantTecho || 0, show: selections.includeRoof !== false },
                                    { label: 'TOTAL KIT', val: geo?.totalPaneles || 0, highlight: true, show: true }
                                ].filter(item => item.show).map((item, i) => (
                                    <div key={i} className={`p-8 rounded-[35px] border-2 flex flex-col items-center text-center transition-all flex-1 h-full min-h-[160px] justify-center ${item.highlight ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-white border-slate-50 shadow-sm'}`}>
                                        <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${item.highlight ? 'text-orange-400' : 'text-slate-400'}`}>{item.label}</p>
                                        <span className="text-4xl font-black tabular-nums leading-none tracking-tighter">{item.val}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className="space-y-6">
                            <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4 text-center justify-center">
                                <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200"><Ruler size={18} /></div>
                                Especificaciones Métricas de Obra
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Área de Planta', val: geo?.areaPiso?.toFixed(2), unit: 'm²', icon: <Home size={28} /> },
                                    { label: 'Perímetro Exterior', val: geo?.perimExt?.toFixed(2), unit: 'ml', icon: <Maximize size={28} /> },
                                    { label: 'Área Muros Bruta', val: geo?.areaMurosBruta?.toFixed(2), unit: 'm²', icon: <Layout size={28} /> },
                                    { label: 'Área Techos', val: geo?.areaTecho?.toFixed(2), unit: 'm²', icon: <Layout size={28} /> },
                                    { label: 'Lineales Tabiques', val: geo?.tabiques?.toFixed(2), unit: 'ml', icon: <Columns size={28} /> },
                                    { label: 'Perímetro Aberturas', val: geo?.perimAberturas?.toFixed(2), unit: 'ml', icon: <Square size={28} /> }
                                ].map((row, i) => (
                                    <div key={i} className="bg-slate-50 rounded-[40px] p-8 border border-slate-100 flex items-center justify-between group hover:bg-white transition-all shadow-sm">
                                        <div className="flex items-center gap-6">
                                            <div className="text-orange-500 opacity-20 group-hover:opacity-100 transition-opacity">{row.icon}</div>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-tight uppercase font-black uppercase">{row.label}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">{row.val}</span>
                                            <span className="text-[10px] font-black text-orange-600 ml-2 uppercase tracking-widest">{row.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                    <ProjectFooter price={finalTotal} pageNumber={6} />
                </div>

                {/* PAGE 7: ECONOMICA PANELES */}
                <div className="pdf-page w-[210mm] h-[297mm] bg-white p-[10mm] flex flex-col text-slate-900 border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none">
                    <PageHeader title="Propuesta Económica - Sistema SIP" />
                    <div className="flex-1 flex flex-col gap-4 min-h-0">
                        <div className="rounded-[30px] border border-slate-200 bg-white shadow-sm overflow-hidden flex-1 overflow-y-auto">
                            <table className="w-full text-left border-collapse border-b border-slate-100">
                                <thead className="bg-slate-900 text-[8px] font-black text-white uppercase tracking-[0.2em] sticky top-0">
                                    <tr>
                                        <th className="px-5 py-3">Descripción de Paneles</th>
                                        <th className="px-2 py-3 text-center">Unidad</th>
                                        <th className="px-2 py-3 text-center">Cantidad</th>
                                        <th className="px-2 py-3 text-right">Unitario</th>
                                        <th className="px-5 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[9px]">
                                    {panelsItems.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-2 font-black text-slate-800 uppercase tracking-tighter">{item.name}</td>
                                            <td className="px-2 py-2 text-center text-slate-400 font-bold uppercase">{item.unit}</td>
                                            <td className="px-2 py-2 text-center font-black text-slate-700">{item.qty}</td>
                                            <td className="px-2 py-2 text-right font-black text-slate-600">{formatCurrency(item.price)}</td>
                                            <td className="px-5 py-2 text-right font-black text-slate-900">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center p-6 bg-slate-50 rounded-[30px] border border-slate-100 shrink-0">
                            <div className="text-left"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Valor Neto</p></div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subtotal Sistema SIP</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(panelsSubtotal)}</p>
                            </div>
                        </div>
                    </div>
                    <ProjectFooter price={finalTotal} pageNumber={7} />
                </div>

                {/* PAGE 8 & potentially 9: ECONOMICA INSUMOS */}
                {suppliesPages.map((pageItems, pageIdx) => (
                    <div key={`supplies-page-${pageIdx}`} className="pdf-page w-[210mm] h-[297mm] bg-white p-[10mm] flex flex-col text-slate-900 border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none">
                        <PageHeader title={suppliesPages.length > 1 ? `Propuesta Económica - Insumos (Parte ${pageIdx + 1})` : "Propuesta Económica - Insumos y Estructura"} />
                        <div className="flex-1 flex flex-col gap-4 min-h-0">
                            <div className="rounded-[30px] border border-slate-200 bg-white shadow-sm overflow-hidden flex-1 overflow-y-auto">
                                <table className="w-full text-left border-collapse border-b border-slate-100">
                                    <thead className="bg-slate-900 text-[8px] font-black text-white uppercase tracking-[0.2em] sticky top-0">
                                        <tr>
                                            <th className="px-5 py-3">Descripción Insumos y Servicios</th>
                                            <th className="px-2 py-3 text-center">Unidad</th>
                                            <th className="px-2 py-3 text-center">Cantidad</th>
                                            <th className="px-2 py-3 text-right">Unitario</th>
                                            <th className="px-5 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-[9px]">
                                        {(() => {
                                            const renderedCategories = new Set();
                                            return pageItems.map((item, idx) => {
                                                const showCategory = !renderedCategories.has(item.category);
                                                if (showCategory) renderedCategories.add(item.category);
                                                return (
                                                    <React.Fragment key={item.id}>
                                                        {showCategory && (
                                                            <tr className="bg-slate-50">
                                                                <td colSpan="5" className="px-5 py-2 text-[7px] font-black text-orange-600 uppercase tracking-widest">
                                                                    {item.category} {pageIdx > 0 && idx === 0 ? '(Continuación)' : ''}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-5 py-2 font-black text-slate-800 uppercase tracking-tighter">{item.name}</td>
                                                            <td className="px-2 py-2 text-center text-slate-400 font-bold uppercase uppercase font-black uppercase tracking-widest">{item.unit}</td>
                                                            <td className="px-2 py-2 text-center font-black text-slate-700 tracking-tighter">{item.qty}</td>
                                                            <td className="px-2 py-2 text-right font-black text-slate-600 tracking-tighter">{formatCurrency(item.price)}</td>
                                                            <td className="px-5 py-2 text-right font-black text-slate-900 tracking-tighter">{formatCurrency(item.total)}</td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                            {pageIdx === suppliesPages.length - 1 && (
                                <div className="flex justify-end p-6 bg-slate-50 rounded-[30px] border border-slate-100 shrink-0">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subtotal Insumos y Estructura</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(suppliesSubtotal)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <ProjectFooter price={finalTotal} pageNumber={8 + pageIdx} hidePrice={pageIdx < suppliesPages.length - 1} />
                    </div>
                ))}

                {/* PAGE FINAL: RESUMEN */}
                <div className="pdf-page w-[210mm] h-[297mm] bg-white p-[10mm] flex flex-col text-slate-900 border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none">
                    <PageHeader title="Resumen de Inversión" />
                    <div className="flex-1 space-y-8">
                        <div className="bg-slate-50 rounded-[40px] p-8 border-2 border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div> Beneficios por Modalidad de Pago
                            </h4>
                            <div className="space-y-4">
                                {[
                                    { t: 'Pronto Pago (Cierre en 7 días)', v: '6% OFF', c: 'text-emerald-600', s: finalTotal * 0.06, show: project.projectInfo?.showEarlyPaymentDiscount !== false },
                                    { t: 'Por Volumen (Compras > 20 paneles)', v: '8% OFF', c: 'text-blue-600', s: finalTotal * 0.08, show: true },
                                    { t: 'Efectivo (Pago en sede central)', v: '12% OFF', c: 'text-purple-600', s: finalTotal * 0.12, show: true }
                                ].filter(b => b.show).map((b, i) => (
                                    <div key={i} className="flex justify-between items-center border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{b.t}</span>
                                            <span className={`text-[10px] font-bold ${b.c} uppercase mt-0.5`}>{b.v} Aplicado</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-black text-slate-400 uppercase block leading-none mb-1">Ahorro Estimado:</span>
                                            <span className="text-lg font-black text-slate-900 tabular-nums">{formatCurrency(b.s)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-900 rounded-[50px] p-[40px] border-4 border-white flex-col relative shadow-2xl overflow-hidden">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-4 mb-8 relative z-10">
                                <div className="w-2 h-8 bg-orange-500 rounded-full"></div> Resumen de Inversión
                            </h3>
                            <div className="space-y-4 relative z-10 mb-8">
                                <div className="flex justify-between items-center py-4 border-b border-white/10 uppercase font-black uppercase">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xs tracking-tighter">VALOR TOTAL BRUTO (KIT COMPLETO)</span>
                                    <span className="text-2xl font-black text-white">{formatCurrency(finalTotal)}</span>
                                </div>
                                {[
                                    { t: 'CON DESCUENTO 6% (PRONTO PAGO)', d: 0.06, c: 'text-emerald-400', show: project.projectInfo?.showEarlyPaymentDiscount !== false },
                                    { t: 'CON DESCUENTO 8% (VOLUMEN)', d: 0.08, c: 'text-blue-400', show: true },
                                    { t: 'CON DESCUENTO 12% (PAGO EFECTIVO)', d: 0.12, c: 'text-orange-400', show: true }
                                ].filter(b => b.show).map((b, i) => (
                                    <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 uppercase font-black uppercase uppercase tracking-widest">
                                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">{b.t}</span>
                                        <span className={`text-xl font-black ${b.c}`}>{formatCurrency(finalTotal * (1 - b.d))}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                {['Vigencia: 7 días corridos.', 'Precios netos (No incluyen IVA).', 'Descuentos sujetos a validación de compra.', 'No incluye flete ni descarga.'].map((c, i) => (
                                    <div key={i} className="flex items-center gap-3 uppercase font-black uppercase"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{c}</p></div>
                                ))}
                            </div>
                        </div>
                        <ProjectFooter price={finalTotal} pageNumber={8 + suppliesPages.length} />
                    </div>
                </div>

                {/* GALLERIA */}
                {snapshots && snapshots.length > 0 && (
                    <div className="pdf-page w-[210mm] h-[297mm] bg-white p-[10mm] flex flex-col text-slate-900 border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none">
                        <PageHeader title="Galería de Vistas" />
                        <div className="flex-1 flex flex-col gap-6 overflow-hidden uppercase font-black uppercase uppercase font-black uppercase">
                            <div className="grid grid-cols-2 grid-rows-3 gap-4 flex-1">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-slate-50 rounded-[35px] overflow-hidden border border-slate-200 shadow-md flex items-center justify-center relative h-full">
                                        {snapshots[i] ? <img src={snapshots[i]} className="w-full h-full object-cover" alt={`Vista ${i + 1}`} /> : <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest tracking-tighter">Vista no generada</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <ProjectFooter price={finalTotal} pageNumber={8 + suppliesPages.length + 1} hidePrice={false} />
                    </div>
                )}
            </div>
            <div className="h-32 print:hidden uppercase font-black uppercase"></div>
        </div>
    );
};

export default Export;
