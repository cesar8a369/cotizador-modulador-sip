import React, { useRef, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { fullCalculation } from '../utils/calculations';
import FloorPlan from '../components/engineering/FloorPlan';
import FacadeView from '../components/engineering/FacadeView';
import { FileText, Download, Loader2, CheckCircle2, Factory, User, MapPin, Calendar, Home, Ruler, PenTool, Layout as LayoutIcon, Image as ImageIcon } from 'lucide-react';
import { PROJECT_LOGO } from '../data/constants';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PDFReportTemplate from '../components/export/PDFReportTemplate';

const FACTORY_NAME = "LA FÁBRICA DEL PANEL";

const PageHeader = ({ title }) => {
    const year = new Date().getFullYear();
    const token = useMemo(() => Math.floor(Math.random() * 9000) + 1000, []);

    return (
        <div className="relative mb-10">
            {/* Accent Bar */}
            <div className="absolute -left-[20mm] top-0 w-2 h-16 bg-cyan-600 rounded-r-full"></div>

            <div className="flex justify-between items-end pb-4 border-b-2 border-slate-100">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-slate-200">
                            <img src={PROJECT_LOGO} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-950 tracking-widest leading-none">MODULADOR SIP</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{FACTORY_NAME}</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">{title || 'Documento'}</h1>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Registro Técnico No.</p>
                    <p className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full inline-block">
                        {year}/{token}
                    </p>
                </div>
            </div>
        </div>
    );
};

const ProjectFooter = ({ price, pageNumber }) => (
    <div className="mt-auto">
        <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            <div className="flex items-center gap-6">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-100 shadow-sm">
                    <img src={PROJECT_LOGO} alt="Logo Small" className="w-full h-full object-contain" />
                </div>
                <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Soporte Técnico</p>
                    <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-tighter">consultora.resolvia@gmail.com</p>
                </div>
            </div>

            <div className="flex items-center gap-6 text-right">
                <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Inversión Final</p>
                    <p className="text-lg font-black text-slate-900 tracking-tighter leading-none">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price)}
                    </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                    {pageNumber}
                </div>
            </div>
        </div>
    </div>
);

const Export = () => {
    const { dimensions, selections, interiorWalls, openings, facadeConfigs, prices, project, snapshots } = useStore();
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const { geo, quantities } = useMemo(() => {
        try {
            return fullCalculation(dimensions, selections, interiorWalls, openings, facadeConfigs, project);
        } catch (e) {
            console.error("Calculation error:", e);
            return { geo: {}, quantities: {} };
        }
    }, [dimensions, selections, interiorWalls, openings, facadeConfigs, project]);

    const adjustmentPercentage = project.projectInfo?.adjustmentPercentage || 0;
    const markupMultiplier = adjustmentPercentage > 0 ? (1 + adjustmentPercentage / 100) : 1;
    const discountFactor = adjustmentPercentage < 0 ? (1 + adjustmentPercentage / 100) : 1;

    const budgetItems = useMemo(() => {
        const items = [];
        const allProductIds = new Set([...Object.keys(quantities), ...Object.keys(project.overrides || {})]);

        allProductIds.forEach(id => {
            const product = prices.find(p => p.id === id);
            if (!product) return;

            const override = project.overrides?.[id];
            const qty = override?.qty !== undefined ? override.qty : (quantities[id] || 0);

            if (qty <= 0 && !override) return;

            const basePrice = override?.price !== undefined ? override.price : product.price;
            const effectivePrice = basePrice * markupMultiplier;

            items.push({
                ...product,
                price: Number(effectivePrice) || 0,
                qty: Number(qty) || 0,
                total: (Number(qty) || 0) * (Number(effectivePrice) || 0),
                isOverridden: !!override
            });
        });

        return items.filter(item => item.qty > 0 || item.isOverridden);
    }, [quantities, prices, project.overrides, markupMultiplier]);

    const subtotalWithMarkup = Math.round((budgetItems || []).reduce((acc, item) => acc + (Number(item.total) || 0), 0)) || 0;
    const finalTotal = Math.round(subtotalWithMarkup * (Number(adjustmentPercentage) < 0 ? (Number(discountFactor) || 1) : 1)) || 0;
    const adjustmentAmount = finalTotal - subtotalWithMarkup;

    const formatCurrency = (val) => {
        try {
            return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(val) || 0);
        } catch (e) {
            return '$ 0';
        }
    };

    const [logoBase64, setLogoBase64] = useState(null);

    // Effect to pre-convert the external logo to a base64 string
    // This solves the "tainted canvas" error in html2canvas when the server doesn't send CORS headers
    React.useEffect(() => {
        const fetchLogo = async () => {
            try {
                const response = await fetch(PROJECT_LOGO);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => setLogoBase64(reader.result);
                reader.readAsDataURL(blob);
            } catch (e) {
                console.warn("No se pudo pre-cargar el logo:", e);
                setLogoBase64(PROJECT_LOGO);
            }
        };
        fetchLogo();
    }, []);

    const [canvasImages, setCanvasImages] = useState({ snapshots: [], floor: null });

    const handleExportPDF = async () => {
        try {
            // Simply trigger the browser's print dialog
            // The @media print styles in the page will handle the formatting
            window.print();
        } catch (err) {
            console.error("PDF Print Error:", err);
            alert("No se pudo iniciar el proceso de impresión.");
        }
    };

    const handleExportImage = async () => {
        setIsGeneratingImage(true);
        try {
            window.scrollTo(0, 0);
            const pages = document.querySelectorAll('.pdf-page');
            const canvases = [];

            for (let i = 0; i < pages.length; i++) {
                const canvas = await html2canvas(pages[i], {
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc) => {
                        const clonedPage = clonedDoc.querySelectorAll('.pdf-page')[i];
                        if (clonedPage && logoBase64) {
                            const imgs = clonedPage.getElementsByTagName('img');
                            for (let img of imgs) {
                                if (img.src === PROJECT_LOGO) img.src = logoBase64;
                            }
                        }
                    }
                });
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
            {/* Styles for print */}
            <style>{`
                @media print {
                    @page { 
                        size: A4; 
                        margin: 0mm !important; 
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    html, body { 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        width: 210mm !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                    }
                    /* Ensure root and main don't add spacing or height constraints */
                    #root, main, .max-w-[1920px], .p-2, .md\\:p-6 {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: none !important;
                        position: static !important;
                        width: 210mm !important;
                    }
                    #export-container {
                        display: block !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 210mm !important;
                    }
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
                        overflow: hidden !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .no-break { break-inside: avoid !important; }
                    /* Force first page to top */
                    .pdf-page:first-of-type { 
                        page-break-before: avoid !important; 
                        margin-top: 0 !important;
                    }
                    /* Remove any gaps between pages in print */
                    #export-container > div {
                        margin-bottom: 0 !important;
                    }
                }
            `}</style>
            {/* Floating Print Controls */}
            <div className="fixed bottom-8 right-8 z-[100] print:hidden flex flex-col gap-3">
                <button
                    disabled={isGeneratingImage}
                    onClick={handleExportPDF}
                    className="group bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all transform active:scale-95 border-4 border-white disabled:opacity-50"
                >
                    {isGeneratingImage ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                    {isGeneratingImage ? "Generando..." : "Descargar PDF Pro"}
                </button>

                <button
                    disabled={isGeneratingImage}
                    onClick={handleExportImage}
                    className="group bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-full font-black uppercase tracking-[0.15em] text-[10px] shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 border-2 border-white disabled:opacity-50"
                >
                    <ImageIcon size={18} />
                    Exportar como Imagen
                </button>

                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 text-center shadow-lg">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Formatos de Alta Fidelidad</p>
                </div>
            </div>

            <div id="export-container" className="flex flex-col items-center gap-10 print:gap-0 print:block">
                {/* PAGE 1: PORTADA CON DATOS DEL CLIENTE */}
                <div className="pdf-page w-[210mm] min-h-[297mm] bg-white border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none p-[20mm] flex flex-col items-stretch text-slate-900 relative">
                    <div className="absolute top-0 right-0 w-[150mm] h-[150mm] bg-cyan-50 rounded-full -mr-[50mm] -mt-[50mm] blur-[100px] opacity-50"></div>

                    <div className="flex-1 flex flex-col border-[6px] border-slate-50 p-8 rounded-[60px] relative z-10 overflow-hidden">
                        {/* Header con Logo */}
                        <div className="flex justify-between items-center mb-8 px-4">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl border border-slate-100">
                                    <img src={PROJECT_LOGO} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-2xl font-black tracking-widest text-slate-900 leading-none">MODULADOR SIP</h1>
                                    <span className="text-base font-black text-cyan-500 uppercase tracking-widest mt-1">{FACTORY_NAME}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</div>
                                <div className="text-sm font-black text-slate-900">{new Date().toLocaleDateString('es-AR')}</div>
                            </div>
                        </div>

                        {/* Título Principal */}
                        <div className="mb-8 text-center">
                            <h2 className="text-5xl font-black tracking-tighter leading-tight uppercase mb-2">
                                PROPUESTA <span className="text-cyan-500">TÉCNICA</span>
                            </h2>
                            <p className="text-xl font-bold text-slate-500 uppercase tracking-wider">Sistema Constructivo SIP</p>
                        </div>

                        {/* Datos del Cliente */}
                        <div className="bg-gradient-to-br from-slate-50 to-white rounded-[40px] p-8 border-2 border-slate-100 mb-8 shadow-sm">
                            <h3 className="text-xs font-black text-cyan-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                                Información del Cliente
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cliente</div>
                                    <div className="text-lg font-black text-slate-900">{project.clientName || 'No especificado'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dirección</div>
                                    <div className="text-lg font-black text-slate-900">{project.address || 'No especificada'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Datos del Proyecto */}
                        <div className="bg-gradient-to-br from-cyan-50 to-white rounded-[40px] p-8 border-2 border-cyan-100 mb-8 shadow-sm">
                            <h3 className="text-xs font-black text-cyan-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                                Especificaciones del Proyecto
                            </h3>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Superficie Total</div>
                                    <div className="text-3xl font-black text-cyan-600">{geo?.areaPiso?.toFixed(1) || '0.0'}</div>
                                    <div className="text-xs font-bold text-slate-500">m²</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dimensiones</div>
                                    <div className="text-3xl font-black text-cyan-600">{dimensions.width} × {dimensions.length}</div>
                                    <div className="text-xs font-bold text-slate-500">metros</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Altura</div>
                                    <div className="text-3xl font-black text-cyan-600">{dimensions.height?.toFixed(2)}</div>
                                    <div className="text-xs font-bold text-slate-500">metros</div>
                                </div>
                            </div>
                        </div>

                        {/* Vista 3D */}
                        <div className="flex-1 bg-slate-900 rounded-[40px] overflow-hidden relative border-4 border-slate-50 shadow-xl min-h-[200px]">
                            {snapshots && snapshots.length > 0 ? (
                                <img src={snapshots[0]} className="w-full h-full object-cover" alt="Vista 3D del Proyecto" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                                    <Home size={40} strokeWidth={1} />
                                    <p className="text-xs font-black uppercase tracking-widest mt-2">Vista 3D no generada</p>
                                </div>
                            )}
                            <div className="absolute top-4 left-4 bg-cyan-600/90 backdrop-blur px-4 py-2 rounded-xl text-xs text-white font-black uppercase tracking-widest shadow-lg">
                                Render Proyectual 3D
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Documento generado por {FACTORY_NAME} • Sistema de Construcción Industrializada
                            </p>
                        </div>
                    </div>
                </div>

                {/* PAGE 2: INFORMACIÓN SOBRE EL SISTEMA SIP */}
                <div className="pdf-page w-[210mm] min-h-[297mm] bg-white border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none p-[20mm] flex flex-col text-slate-900">
                    <PageHeader title="Sistema Constructivo SIP" />

                    <div className="flex-1 space-y-6">
                        {/* Introducción */}
                        <div className="bg-gradient-to-br from-cyan-50 to-white rounded-[30px] p-6 border-2 border-cyan-100">
                            <h3 className="text-lg font-black text-cyan-600 uppercase tracking-wider mb-4">¿Qué es el Sistema SIP?</h3>
                            <p className="text-sm leading-relaxed text-slate-700">
                                Los <strong>Paneles Estructurales Aislados (SIP)</strong> son un sistema constructivo de última generación que combina
                                estructura y aislación térmica en un solo elemento. Consisten en un núcleo de espuma de poliestireno expandido (EPS)
                                de alta densidad, revestido en ambas caras con tableros estructurales OSB (Oriented Strand Board).
                            </p>
                        </div>

                        {/* Ventajas */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-[25px] p-5 border-2 border-slate-100 shadow-sm">
                                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center mb-3">
                                    <span className="text-2xl">⚡</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-2">Construcción Rápida</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Reducción del tiempo de obra hasta un 70% comparado con sistemas tradicionales.
                                </p>
                            </div>

                            <div className="bg-white rounded-[25px] p-5 border-2 border-slate-100 shadow-sm">
                                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center mb-3">
                                    <span className="text-2xl">🌡️</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-2">Eficiencia Térmica</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Aislación térmica superior, reduciendo costos de climatización hasta un 60%.
                                </p>
                            </div>

                            <div className="bg-white rounded-[25px] p-5 border-2 border-slate-100 shadow-sm">
                                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center mb-3">
                                    <span className="text-2xl">💪</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-2">Alta Resistencia</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Estructura monolítica con excelente comportamiento sísmico y resistencia estructural.
                                </p>
                            </div>

                            <div className="bg-white rounded-[25px] p-5 border-2 border-slate-100 shadow-sm">
                                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center mb-3">
                                    <span className="text-2xl">🌱</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-2">Sustentable</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Menor impacto ambiental, materiales reciclables y reducción de residuos en obra.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PAGE 3: VISTA DE PLANTA */}
                <div className="pdf-page w-[210mm] min-h-[297mm] bg-white border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none p-[20mm] flex flex-col text-slate-900">
                    <PageHeader title="Plano de Planta" />

                    <div className="flex-1 bg-slate-50 rounded-[40px] p-8 border-2 border-slate-100 overflow-hidden relative flex flex-col">
                        {/* Información del plano */}
                        <div className="flex justify-between items-center mb-6 px-4 shrink-0">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-3">
                                    <div className="w-2 h-4 bg-cyan-500 rounded-full"></div>
                                    DISEÑO DE PLANTA
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Distribución espacial y modulación SIP</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-slate-400 uppercase">Escala</div>
                                <div className="text-sm font-black text-slate-900">1:100</div>
                            </div>
                        </div>

                        {/* Datos técnicos del plano */}
                        <div className="grid grid-cols-4 gap-3 mb-6 shrink-0">
                            <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Largo</div>
                                <div className="text-lg font-black text-cyan-600">{dimensions.length}m</div>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ancho</div>
                                <div className="text-lg font-black text-cyan-600">{dimensions.width}m</div>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Superficie</div>
                                <div className="text-lg font-black text-cyan-600">{geo?.areaPiso?.toFixed(1) || '0'}m²</div>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Perímetro</div>
                                <div className="text-lg font-black text-cyan-600">{geo?.perimExt?.toFixed(1) || '0'}m</div>
                            </div>
                        </div>

                        {/* Plano */}
                        <div className="flex-1 flex items-center justify-center min-h-0 relative z-20 bg-white rounded-[30px] p-6 border-2 border-slate-200">
                            <FloorPlan isPrint={true} />
                        </div>

                        {/* Grid de fondo */}
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-10"
                            style={{ backgroundImage: 'radial-gradient(#000 1.2px, transparent 1.2px)', backgroundSize: '15px 15px' }}></div>
                    </div>
                </div>

                {/* PAGE 4: FACHADAS */}
                <div className="pdf-page w-[210mm] min-h-[297mm] bg-white border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none p-[20mm] flex flex-col text-slate-900">
                    <PageHeader title="Vistas de Fachada" />
                    <div className="grid grid-cols-2 gap-8 flex-1">
                        {['Norte', 'Sur', 'Este', 'Oeste'].map(side => (
                            <div key={side} className="space-y-4">
                                <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-200 aspect-[4/3] flex items-center justify-center overflow-hidden">
                                    <FacadeView
                                        type={side}
                                        data={{ ...dimensions, openings, facadeConfigs, project, isPrint: true }}
                                        scale={20}
                                    />
                                </div>
                                <h3 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Elevación Cardinal: {side}</h3>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 bg-cyan-900 p-6 rounded-[40px] text-white flex items-start gap-4 border-4 border-white shadow-2xl">
                        <div className="w-10 h-10 bg-cyan-500 rounded-2xl flex items-center justify-center shrink-0">
                            <Ruler size={20} />
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed opacity-80">
                            * Representación gráfica de la modulación de paneles SIP (1.22m de ancho) y línea de corte estructural a 2.44m de altura. Los vanos representados corresponden a las dimensiones nominales de las carpinterías solicitadas.
                        </p>
                    </div>

                </div>

                {/* PAGE 3: INGENIERÍA */}
                <div className="pdf-page w-[210mm] min-h-[297mm] bg-white border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none p-[20mm] flex flex-col text-slate-900">
                    <PageHeader title="Memoria de Materiales" />
                    <div className="space-y-6 flex-1">
                        <section className="space-y-3">
                            <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                                <div className="w-6 h-6 bg-cyan-500 rounded-lg flex items-center justify-center text-white"><Home size={14} /></div>
                                Cómputo de Componentes SIP Principales
                            </h3>
                            <div className="grid grid-cols-5 gap-2">
                                {[
                                    { label: 'Exteriores', val: geo?.cantMurosExt || 0 },
                                    { label: 'Interiores', val: geo?.cantMurosInt || 0 },
                                    { label: 'Pisos', val: geo?.cantPiso || 0 },
                                    { label: 'Techo', val: geo?.cantTecho || 0 },
                                    { label: 'TOTAL KIT', val: geo?.totalPaneles || 0, highlight: true }
                                ].map((item, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border flex flex-col items-center text-center ${item.highlight ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100'}`}>
                                        <p className={`text-[7px] font-black uppercase tracking-widest mb-1 ${item.highlight ? 'text-cyan-400' : 'text-slate-400'}`}>{item.label}</p>
                                        <span className="text-xl font-black tabular-nums leading-none">{item.val}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                                <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center text-white"><Ruler size={14} /></div>
                                Especificaciones Métricas de Obra
                            </h3>
                            <div className="bg-slate-50 rounded-[30px] p-2 border border-slate-200">
                                <table className="w-full">
                                    <tbody className="divide-y divide-slate-200">
                                        {[
                                            { label: 'Área Paneles Perimetrales', val: geo?.areaMurosBruta?.toFixed(2), unit: 'm²' },
                                            { label: 'Sexta Cara (Piso Autoportante)', val: geo?.areaPiso?.toFixed(2), unit: 'm²' },
                                            { label: 'Cubierta Técnica SIP', val: geo?.areaTecho?.toFixed(2), unit: 'm²' },
                                            { label: 'Longitud Envolvente Exterior', val: geo?.perimExt?.toFixed(2), unit: 'ml' },
                                            { label: 'Tabiquería Interior Detallada', val: geo?.tabiques?.toFixed(2), unit: 'ml' },
                                            { label: 'Vínculos de Madera (Estimado)', val: geo?.perimLinealPaneles?.toFixed(2), unit: 'ml' },
                                            ...(geo?.facadeDetails ? Object.entries(geo.facadeDetails).map(([side, area]) => ({
                                                label: `Muro Fachada ${side}`, val: area?.toFixed(2), unit: 'm²'
                                            })) : [])
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-white transition-colors">
                                                <td className="px-4 py-1.5 text-[8px] font-black text-slate-800 uppercase tracking-widest">{row.label}</td>
                                                <td className="px-4 py-1.5 text-right">
                                                    <span className="text-sm font-black text-slate-900 tabular-nums">{row.val}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 ml-2 uppercase">{row.unit}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                </div>

                <div className="pdf-page w-[210mm] min-h-[297mm] bg-white border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none p-[20mm] flex flex-col text-slate-900">
                    <PageHeader title="Propuesta Económica" />
                    <div className="flex flex-col gap-4">
                        <div className="rounded-[30px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900 text-[8px] font-black text-white uppercase tracking-[0.2em]">
                                    <tr>
                                        <th className="px-5 py-3">Descripción Técnica del Item</th>
                                        <th className="px-2 py-3 text-center">Unid.</th>
                                        <th className="px-2 py-3 text-center">Cant.</th>
                                        <th className="px-5 py-3 text-right">Monto Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[9px]">
                                    {budgetItems.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-2 leading-tight">
                                                <p className="font-black text-slate-800 uppercase tracking-tighter">{item.name}</p>
                                                <p className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{item.category}</p>
                                            </td>
                                            <td className="px-2 py-2 text-center font-bold text-slate-400 uppercase">{item.unit}</td>
                                            <td className="px-2 py-2 text-center leading-none">
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded-lg font-black text-slate-700 tabular-nums">{item.qty}</span>
                                            </td>
                                            <td className="px-5 py-2 text-right font-black text-slate-900 tabular-nums">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end p-8 bg-slate-50 rounded-[40px] border border-slate-100 shadow-sm no-break">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión Final Proyectada</p>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(finalTotal)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PAGE 5: CONDICIONES */}
                <div className="pdf-page w-[210mm] min-h-[297mm] bg-white border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none p-[20mm] flex flex-col text-slate-900">
                    <PageHeader title="Términos y Condiciones" />
                    <div className="flex-1 space-y-8">
                        <section className="bg-slate-900 rounded-[40px] p-10 text-white space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-cyan-400 flex items-center gap-3">
                                <div className="w-8 h-8 bg-cyan-500/20 rounded-xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
                                Ventajas del Sistema SIP
                            </h3>
                            <div className="text-sm font-medium leading-relaxed opacity-90 pl-11">
                                {project?.projectInfo?.benefits || 'Nuestros paneles ofrecen una aislación térmica superior y una rapidez de montaje inigualable en seco.'}
                            </div>
                        </section>

                        <section className="bg-slate-50 rounded-[40px] p-10 space-y-6 border-2 border-slate-100 flex-1">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white"><FileText size={20} /></div>
                                Condiciones Comerciales
                            </h3>
                            <div className="text-sm font-bold leading-relaxed text-slate-500 pl-11 whitespace-pre-line">
                                {project?.projectInfo?.extraNotes || 'La presente cotización tiene una vigencia de 15 días corridos.'}
                            </div>
                        </section>
                    </div>


                </div>

                {/* PAGE 6: GALERÍA (SI EXISTE) */}
                {snapshots && snapshots.length > 0 && (
                    <div className="pdf-page w-[210mm] min-h-[297mm] bg-white border border-slate-200 shadow-2xl mb-10 print:mb-0 print:border-none p-[20mm] flex flex-col text-slate-900">
                        <PageHeader title="Galería de Vistas" />
                        <div className="flex-1 flex flex-col justify-center gap-8">
                            <div className="grid grid-cols-2 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => {
                                    const snap = snapshots[i];
                                    return (
                                        <div key={i} className="aspect-video bg-slate-100 rounded-[35px] overflow-hidden border border-slate-200 shadow-md flex items-center justify-center">
                                            {snap ? (
                                                <img src={snap} className="w-full h-full object-cover" alt={`Vista ${i + 1}`} />
                                            ) : (
                                                <span className="text-slate-400 text-sm font-medium">No image</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>


                    </div>
                )}
            </div>
            {/* Added spacer to prevent cutting off at the bottom */}
            <div className="h-32 print:hidden"></div>
            {/* HIDDEN REPORT TEMPLATE */}
            <PDFReportTemplate
                snapshots3D={canvasImages.snapshots}
                floorPlanImage={canvasImages.floor}
                geo={geo}
                quantities={quantities}
            />
        </div>
    );
};

export default Export;
