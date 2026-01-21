import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, Minus, Move, Camera, Trash2, RotateCw, Maximize2, X, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';

const WallElement = ({ wall, scale, onUpdate, onRemove, isPrint }) => {
    const pxLength = wall.length * scale;
    const pxThickness = 0.15 * scale;

    const handleMouseDown = (e, type) => {
        if (isPrint) return;
        e.stopPropagation();
        onUpdate(wall.id, { interaction: type });
    };

    return (
        <g
            transform={`translate(${wall.x * scale}, ${wall.y * scale}) rotate(${wall.isVertical ? 90 : 0})`}
            className="group"
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            onDoubleClick={(e) => { if (isPrint) return; e.stopPropagation(); onUpdate(wall.id, { interaction: 'rotate-click' }); }}
        >
            <rect
                x={-pxLength / 2}
                y={-pxThickness / 2}
                width={pxLength}
                height={pxThickness}
                fill={isPrint ? "#64748b" : "#94a3b8"}
                stroke="#475569"
                strokeWidth="2"
                className={isPrint ? "" : "cursor-move group-hover:fill-cyan-200 group-hover:stroke-cyan-600 transition-colors"}
            />

            {!isPrint && (
                <>
                    <circle
                        cx={0} cy={0} r={5}
                        fill="#06b6d4"
                        className="opacity-0 group-hover:opacity-100 cursor-pointer"
                        onMouseDown={(e) => { e.stopPropagation(); onUpdate(wall.id, { interaction: 'rotate-click' }); }}
                    />
                    <circle
                        cx={-pxLength / 2} cy={0} r={6}
                        fill="#475569" stroke="white" strokeWidth="2"
                        className="cursor-ew-resize opacity-0 group-hover:opacity-100 hover:scale-150 transition-all"
                        onMouseDown={(e) => handleMouseDown(e, 'resize-start')}
                    />
                    <circle
                        cx={pxLength / 2} cy={0} r={6}
                        fill="#475569" stroke="white" strokeWidth="2"
                        className="cursor-ew-resize opacity-0 group-hover:opacity-100 hover:scale-150 transition-all"
                        onMouseDown={(e) => handleMouseDown(e, 'resize-end')}
                    />
                    <g
                        transform="translate(0, -15)"
                        className="opacity-0 group-hover:opacity-100 cursor-pointer hover:scale-110 transition-all"
                        onMouseDown={(e) => { e.stopPropagation(); onRemove(wall.id); }}
                    >
                        <circle r="6" fill="#ef4444" />
                        <path d="M-2 -2 L2 2 M-2 2 L2 -2" stroke="white" strokeWidth="1.5" />
                    </g>
                </>
            )}
        </g>
    );
};

const SNAP = 0.04;
const snapVal = (v) => Math.round(v / SNAP) * SNAP;

const FloorPlan = ({ isPrint = false }) => {
    const {
        dimensions, setDimensions, interiorWalls, addInteriorWall, updateInteriorWall, removeInteriorWall,
        openings, addOpening, removeOpening, updateOpening, activeInteriorWallId, setActiveInteriorWallId,
        project, addRecess, updateRecess, removeRecess, addSnapshot, resetProject
    } = useStore();
    const { width, length } = dimensions;
    const recesses = project?.recesses || [];

    const containerRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isMaximized, setIsMaximized] = useState(false);

    // Interaction State
    const [interactionType, setInteractionType] = useState(null);
    const [activeRecessId, setActiveRecessId] = useState(null);
    const [activeOpeningId, setActiveOpeningId] = useState(null);
    const [initialWallState, setInitialWallState] = useState(null);

    const BASE_SCALE = 55;

    const activeWall = interiorWalls.find(w => w.id === activeInteriorWallId);
    const activeRecess = recesses.find(r => r.id === activeRecessId);
    const activeOpening = openings.find(o => o.id === activeOpeningId);

    const takeSnapshot = async () => {
        if (containerRef.current) {
            try {
                const canvas = await html2canvas(containerRef.current, { backgroundColor: '#ffffff' });
                const image = canvas.toDataURL("image/png");
                addSnapshot(image);
                const link = document.createElement('a');
                link.href = image;
                link.download = `planta-${new Date().getTime()}.png`;
                link.click();
            } catch (e) { console.error("Snapshot failed", e); }
        }
    };

    const handleInteractionStart = (id, { interaction }) => {
        if (interaction.includes('recess')) {
            setActiveRecessId(id);
            setActiveInteriorWallId(null);
            setActiveOpeningId(null);
        } else {
            setActiveInteriorWallId(id);
            setActiveRecessId(null);
            setActiveOpeningId(null);
        }
        setInteractionType(interaction);
        const wall = interiorWalls.find(w => w.id === id);
        if (wall) setInitialWallState({ ...wall });
    };

    const handleGlobalMouseMove = (e) => {
        if (!interactionType) return;
        if (interactionType === 'pan') {
            setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
            return;
        }
        const dx = e.movementX / zoom / BASE_SCALE;
        const dy = e.movementY / zoom / BASE_SCALE;

        if (activeInteriorWallId) {
            const current = interiorWalls.find(w => w.id === activeInteriorWallId);
            if (!current) return;
            if (interactionType === 'move') {
                updateInteriorWall(activeInteriorWallId, { x: snapVal(current.x + dx), y: snapVal(current.y + dy) });
            } else if (interactionType.startsWith('resize')) {
                let change = current.isVertical ? (interactionType === 'resize-end' ? 1 : -1) * dy : (interactionType === 'resize-end' ? 1 : -1) * dx;
                const newLen = Math.max(0.4, snapVal(current.length + change));
                const actualChange = newLen - current.length;
                const centerShift = actualChange / 2;
                const updates = { length: newLen };
                if (current.isVertical) { updates.y = snapVal(current.y + (interactionType === 'resize-end' ? centerShift : -centerShift)); }
                else { updates.x = snapVal(current.x + (interactionType === 'resize-end' ? centerShift : -centerShift)); }
                updateInteriorWall(activeInteriorWallId, updates);
            }
        }
        if (activeRecessId) {
            const current = recesses.find(r => r.id === activeRecessId);
            if (!current) return;
            const isNS = current.side === 'Norte' || current.side === 'Sur';
            if (interactionType === 'move-recess') {
                updateRecess(activeRecessId, { x: snapVal(current.x + (isNS ? dx : dy)) });
            } else if (interactionType === 'resize-recess-depth') {
                const depthChange = current.side === 'Norte' ? dy : (current.side === 'Sur' ? -dy : (current.side === 'Este' ? -dx : dx));
                updateRecess(activeRecessId, { depth: Math.max(0.1, snapVal(current.depth + depthChange)) });
            } else if (interactionType === 'resize-recess-width') {
                updateRecess(activeRecessId, { width: Math.max(0.4, snapVal(current.width + (isNS ? dx : dy))) });
            }
        }
    };

    const handleGlobalMouseUp = () => { setInteractionType(null); setInitialWallState(null); };

    useEffect(() => {
        if (interactionType) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleGlobalMouseMove);
                window.removeEventListener('mouseup', handleGlobalMouseUp);
            };
        }
    }, [interactionType, activeInteriorWallId, activeRecessId, zoom, interiorWalls, recesses]);

    const contentWidth = width * BASE_SCALE;
    const contentHeight = length * BASE_SCALE;

    // --- CALCULATIONS FOR UI ---
    let recessPisoArea = 0;
    recesses.forEach(r => { recessPisoArea += r.width * r.depth; });
    const areaPiso = Math.max(0, (width * length) - recessPisoArea);
    const PANEL_SURFACE = 1.22 * 2.44;
    const cantPiso = Math.ceil(areaPiso / PANEL_SURFACE);
    const panelPerimeterPiso = cantPiso * 7.32;

    const getPerimeterPath = () => {
        const w = width * BASE_SCALE, h = length * BASE_SCALE;
        let p = `M 0 0`;
        const nr = recesses.filter(r => r.side === 'Norte').sort((a, b) => a.x - b.x);
        nr.forEach(r => { p += ` L ${r.x * BASE_SCALE} 0 L ${r.x * BASE_SCALE} ${r.depth * BASE_SCALE} L ${(r.x + r.width) * BASE_SCALE} ${r.depth * BASE_SCALE} L ${(r.x + r.width) * BASE_SCALE} 0`; });
        p += ` L ${w} 0`;
        const er = recesses.filter(r => r.side === 'Este').sort((a, b) => a.x - b.x);
        er.forEach(r => { p += ` L ${w} ${r.x * BASE_SCALE} L ${w - r.depth * BASE_SCALE} ${r.x * BASE_SCALE} L ${w - r.depth * BASE_SCALE} ${(r.x + r.width) * BASE_SCALE} L ${w} ${(r.x + r.width) * BASE_SCALE}`; });
        p += ` L ${w} ${h}`;
        const sr = recesses.filter(r => r.side === 'Sur').sort((a, b) => b.x - a.x);
        sr.forEach(r => { p += ` L ${(r.x + r.width) * BASE_SCALE} ${h} L ${(r.x + r.width) * BASE_SCALE} ${h - r.depth * BASE_SCALE} L ${r.x * BASE_SCALE} ${h - r.depth * BASE_SCALE} L ${r.x * BASE_SCALE} ${h}`; });
        p += ` L 0 ${h}`;
        const or = recesses.filter(r => r.side === 'Oeste').sort((a, b) => b.x - a.x);
        or.forEach(r => { p += ` L 0 ${(r.x + r.width) * BASE_SCALE} L ${r.depth * BASE_SCALE} ${(r.x + r.width) * BASE_SCALE} L ${r.depth * BASE_SCALE} ${r.x * BASE_SCALE} L 0 ${r.x * BASE_SCALE}`; });
        p += ` L 0 0 Z`;
        return p;
    };

    return (
        <div className={isMaximized ? "fixed inset-0 z-[100] bg-white flex flex-col" : `flex flex-col h-full bg-white relative ${isPrint ? '' : 'rounded-3xl border border-slate-200 shadow-sm overflow-hidden'}`}>
            {!isPrint && (
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 relative z-20">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Minus size={14} /></button>
                            <div className="w-10 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">{Math.round(zoom * 100)}%</div>
                            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => setIsMaximized(!isMaximized)} className={`p-2 rounded-lg transition-colors ${isMaximized ? 'bg-cyan-500 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:text-cyan-500'}`}><Maximize2 size={16} /></button>
                    </div>

                    <div className="flex gap-2 flex-wrap justify-end">
                        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
                            <button onClick={() => addRecess('Sur')} className="p-1 px-2 hover:bg-cyan-50 rounded text-[9px] font-bold text-slate-600 flex items-center gap-1 border-r" title="Hall Frontal">Front</button>
                            <button onClick={() => addRecess('Norte')} className="p-1 px-2 hover:bg-cyan-50 rounded text-[9px] font-bold text-slate-600 flex items-center gap-1 border-r" title="Hall Posterior">Back</button>
                            <button onClick={() => addRecess('Este')} className="p-1 px-2 hover:bg-cyan-50 rounded text-[9px] font-bold text-slate-600 flex items-center gap-1 border-r" title="Hall Lateral Este">East</button>
                            <button onClick={() => addRecess('Oeste')} className="p-1 px-2 hover:bg-cyan-50 rounded text-[9px] font-bold text-slate-600 flex items-center gap-1" title="Hall Lateral Oeste">West</button>
                        </div>

                        <button
                            onClick={() => {
                                const state = useStore.getState();
                                if (state.addLShape) state.addLShape();
                            }}
                            className="bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 uppercase flex items-center gap-2 shadow-sm"
                        >
                            <Maximize2 size={14} className="rotate-45" /> Forma L
                        </button>

                        <div className="h-6 w-px bg-slate-200 mx-1"></div>
                        <button onClick={() => addInteriorWall()} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"><Plus size={14} /> Tabique</button>
                        <button
                            onClick={() => { if (confirm('¿Eliminar todos los muros y halls?')) resetProject(); }}
                            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg"
                            title="Borrar Todo"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button onClick={takeSnapshot} className="p-2 text-slate-400 hover:text-cyan-500 rounded-lg"><Camera size={18} /></button>
                    </div>
                </div>
            )}

            {/* TECH DATA OVERLAY */}
            {!isPrint && (
                <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1">
                    <div className="bg-slate-900/90 backdrop-blur px-3 py-2 rounded-2xl text-[8px] font-black text-cyan-400 border border-white/10 flex flex-col gap-1 shadow-2xl">
                        <div className="flex justify-between gap-6">
                            <span className="text-white/40 uppercase tracking-widest">ÁREA DE PISO:</span>
                            <span className="text-white text-[10px]">{areaPiso.toFixed(2)} m²</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span className="text-white/40 uppercase tracking-widest">PANELES DE PISO:</span>
                            <span className="text-white text-[10px]">{cantPiso} u.</span>
                        </div>
                        <div className="flex justify-between gap-6 border-t border-white/5 pt-1 mt-1 font-bold">
                            <span className="text-cyan-500/60 uppercase tracking-widest">PERÍM. PANELES PISO:</span>
                            <span className="text-cyan-400 text-[10px]">{panelPerimeterPiso.toFixed(2)} ml</span>
                        </div>
                    </div>
                </div>
            )}

            {(activeWall || activeRecess || activeOpening) && !isPrint && (
                <div className="absolute top-16 right-4 z-40 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl space-y-4 animate-in slide-in-from-right-4 w-[220px]">
                    <div className="flex justify-between items-center bg-slate-50 -m-4 mb-2 p-3 rounded-t-2xl border-b">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                            {activeWall ? 'Editar Tabique' : activeRecess ? `Hall ${activeRecess.side === 'Sur' ? 'Frontal' : 'Posterior'}` : 'Editar Abertura'}
                        </h4>
                        <button onClick={() => {
                            if (activeWall) removeInteriorWall(activeWall.id);
                            else if (activeRecess) removeRecess(activeRecess.id);
                            else if (activeOpening) removeOpening(activeOpening.id);
                            setActiveInteriorWallId(null); setActiveRecessId(null); setActiveOpeningId(null);
                        }} className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"><Trash2 size={14} /></button>
                    </div>

                    {activeOpening && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between items-center"><label className="text-[8px] font-bold text-cyan-600 uppercase italic">Posición en Muro</label><span className="text-[10px] font-black text-cyan-700">{activeOpening.x.toFixed(2)}m</span></div>
                                <input
                                    type="range" min="0" max={activeOpening.recessId ? (activeOpening.recessWall === 'back' ? activeRecess?.width : activeRecess?.depth) : (activeOpening.side === 'Norte' || activeOpening.side === 'Sur' ? width : length)}
                                    step="0.04" className="w-full accent-cyan-500" value={activeOpening.x}
                                    onChange={(e) => updateOpening(activeOpening.id, { x: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center"><label className="text-[8px] font-bold text-slate-400 uppercase">Ancho Abertura</label><span className="text-[10px] font-black text-slate-600">{activeOpening.width.toFixed(2)}m</span></div>
                                <input type="range" min="0.4" max="2.4" step="0.04" className="w-full accent-slate-400" value={activeOpening.width} onChange={(e) => updateOpening(activeOpening.id, { width: Number(e.target.value) })} />
                            </div>
                            {activeOpening.type === 'door' && (
                                <div className="pt-2 border-t border-slate-100">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase block mb-2">Dirección de Apertura</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => updateOpening(activeOpening.id, { isOutward: false })}
                                            className={`px-3 py-2 rounded-lg text-[9px] font-bold transition-all ${!activeOpening.isOutward ? 'bg-cyan-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            Hacia Adentro
                                        </button>
                                        <button
                                            onClick={() => updateOpening(activeOpening.id, { isOutward: true })}
                                            className={`px-3 py-2 rounded-lg text-[9px] font-bold transition-all ${activeOpening.isOutward ? 'bg-cyan-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            Hacia Afuera
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeWall && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between items-center"><label className="text-[8px] font-bold text-slate-400 uppercase">Longitud</label><span className="text-[10px] font-black text-cyan-600">{activeWall.length.toFixed(2)}m</span></div>
                                <input type="range" min="0.4" max={Math.max(width, length)} step="0.04" className="w-full accent-cyan-500" value={activeWall.length} onChange={(e) => updateInteriorWall(activeWall.id, { length: Number(e.target.value) })} />
                                <button onClick={() => updateInteriorWall(activeWall.id, { isVertical: !activeWall.isVertical })} className="w-full py-1 text-[8px] font-black bg-slate-100 rounded uppercase tracking-widest mt-1">Rotar Eje</button>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center"><label className="text-[8px] font-bold text-slate-400 uppercase">Posición X</label><span className="text-[10px] font-black text-slate-600">{activeWall.x.toFixed(2)}m</span></div>
                                <input type="range" min="0" max={width} step="0.04" className="w-full accent-slate-400" value={activeWall.x} onChange={(e) => updateInteriorWall(activeWall.id, { x: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center"><label className="text-[8px] font-bold text-slate-400 uppercase">Posición Y</label><span className="text-[10px] font-black text-slate-600">{activeWall.y.toFixed(2)}m</span></div>
                                <input type="range" min="0" max={length} step="0.04" className="w-full accent-slate-400" value={activeWall.y} onChange={(e) => updateInteriorWall(activeWall.id, { y: Number(e.target.value) })} />
                            </div>
                        </div>
                    )}

                    {activeRecess && !activeOpening && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between items-center"><label className="text-[8px] font-bold text-slate-400 uppercase">Posición</label><span className="text-[10px] font-black text-slate-600">{activeRecess.x.toFixed(2)}m</span></div>
                                <input type="range" min="0" max={width - activeRecess.width} step="0.04" className="w-full accent-slate-400" value={activeRecess.x} onChange={(e) => updateRecess(activeRecess.id, { x: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center"><label className="text-[8px] font-bold text-cyan-600 uppercase italic">Profundidad</label><span className="text-[10px] font-black text-cyan-700">{activeRecess.depth.toFixed(2)}m</span></div>
                                <input type="range" min="0.1" max="2.5" step="0.04" className="w-full accent-cyan-500" value={activeRecess.depth} onChange={(e) => updateRecess(activeRecess.id, { depth: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center"><label className="text-[8px] font-bold text-slate-400 uppercase">Ancho</label><span className="text-[10px] font-black text-slate-600">{activeRecess.width.toFixed(2)}m</span></div>
                                <input type="range" min="0.4" max={width - activeRecess.x} step="0.04" className="w-full accent-slate-400" value={activeRecess.width} onChange={(e) => updateRecess(activeRecess.id, { width: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center"><label className="text-[8px] font-bold text-amber-500 uppercase italic">Altura del Muro</label><span className="text-[10px] font-black text-amber-600">{activeRecess.height?.toFixed(2) || '2.44'}m</span></div>
                                <input type="range" min="2.0" max="3.5" step="0.02" className="w-full accent-amber-500" value={activeRecess.height || 2.44} onChange={(e) => updateRecess(activeRecess.id, { height: Number(e.target.value) })} />
                            </div>
                            <div className="pt-2 border-t grid grid-cols-3 gap-1">
                                <button onClick={() => addOpening(activeRecess.side, 'door', activeRecess.id, 'back')} className="text-[7px] bg-slate-900 text-white p-1 rounded font-black uppercase hover:bg-cyan-600">Door B</button>
                                <button onClick={() => addOpening(activeRecess.side, 'door', activeRecess.id, 'left')} className="text-[7px] bg-slate-900 text-white p-1 rounded font-black uppercase hover:bg-cyan-600">Door L</button>
                                <button onClick={() => addOpening(activeRecess.side, 'door', activeRecess.id, 'right')} className="text-[7px] bg-slate-900 text-white p-1 rounded font-black uppercase hover:bg-cyan-600">Door R</button>
                                <button onClick={() => addOpening(activeRecess.side, 'window', activeRecess.id, 'back')} className="text-[7px] bg-cyan-600 text-white p-1 rounded font-black uppercase hover:bg-cyan-700">Win B</button>
                                <button onClick={() => addOpening(activeRecess.side, 'window', activeRecess.id, 'left')} className="text-[7px] bg-cyan-600 text-white p-1 rounded font-black uppercase hover:bg-cyan-700">Win L</button>
                                <button onClick={() => addOpening(activeRecess.side, 'window', activeRecess.id, 'right')} className="text-[7px] bg-cyan-600 text-white p-1 rounded font-black uppercase hover:bg-cyan-700">Win R</button>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeRecess(activeRecess.id); setActiveRecessId(null); }} className="w-full py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg ring-rose-200 hover:bg-rose-700 transition-all flex items-center justify-center gap-2"><Trash2 size={12} /> Eliminar Hall</button>
                        </div>
                    )}
                </div>
            )}

            <div id="floorplan-container" ref={containerRef} className={`flex-1 ${isPrint ? 'bg-white' : 'bg-slate-100'} relative overflow-hidden transform-gpu touch-none`} onMouseDown={(e) => { if (e.target === e.currentTarget || e.target.tagName === 'svg') { setInteractionType('pan'); setActiveInteriorWallId(null); setActiveRecessId(null); setActiveOpeningId(null); } }}>
                <div style={{ transform: isPrint ? 'none' : `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg
                        width="100%"
                        height="100%"
                        viewBox={`-200 -200 ${Number(contentWidth + 400) || 1000} ${Number(contentHeight + 400) || 1000}`}
                        preserveAspectRatio="xMidYMid meet"
                        className={`bg-white transition-shadow ${isPrint ? '' : 'shadow-2xl rounded-sm'}`}
                    >
                        <defs>
                            <pattern id="sipGrid" x="0" y="0" width={1.22 * BASE_SCALE} height={2.44 * BASE_SCALE} patternUnits="userSpaceOnUse"><rect width={1.22 * BASE_SCALE} height={2.44 * BASE_SCALE} fill="none" stroke="#f1f5f9" strokeWidth="1" /></pattern>
                            <pattern id="smallGrid" x="0" y="0" width={SNAP * BASE_SCALE} height={SNAP * BASE_SCALE} patternUnits="userSpaceOnUse"><rect width={SNAP * BASE_SCALE} height={SNAP * BASE_SCALE} fill="none" stroke="#f8fafc" strokeWidth="0.5" /></pattern>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" /></marker>
                            <marker id="arrowhead-rev" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="10 0, 0 3.5, 10 7" fill="#94a3b8" /></marker>
                        </defs>
                        <path d={getPerimeterPath()} fill="url(#smallGrid)" stroke="#334155" strokeWidth="4" strokeJoin="round" />
                        <path d={getPerimeterPath()} fill="url(#sipGrid)" stroke="none" pointerEvents="none" />
                        {recesses.map(r => (
                            <rect key={r.id}
                                x={(r.side === 'Norte' || r.side === 'Sur') ? r.x * BASE_SCALE : (r.side === 'Oeste' ? 0 : contentWidth - r.depth * BASE_SCALE)}
                                y={(r.side === 'Este' || r.side === 'Oeste') ? r.x * BASE_SCALE : (r.side === 'Norte' ? 0 : contentHeight - r.depth * BASE_SCALE)}
                                width={(r.side === 'Norte' || r.side === 'Sur') ? r.width * BASE_SCALE : r.depth * BASE_SCALE}
                                height={(r.side === 'Este' || r.side === 'Oeste') ? r.width * BASE_SCALE : r.depth * BASE_SCALE}
                                fill={activeRecessId === r.id ? "rgba(6, 182, 212, 0.2)" : "rgba(0,0,0,0.08)"}
                                stroke={activeRecessId === r.id ? "#06b6d4" : "rgba(0,0,0,0.3)"}
                                strokeWidth={activeRecessId === r.id ? "3" : "1.5"}
                                strokeDasharray="8 4" className="cursor-pointer hover:fill-cyan-500/20 transition-colors"
                                onMouseDown={(e) => { e.stopPropagation(); setActiveRecessId(r.id); setActiveInteriorWallId(null); setActiveOpeningId(null); setInteractionType('move-recess'); }}
                            />
                        ))}
                        {interiorWalls.map(wall => <WallElement key={wall.id} wall={wall} scale={BASE_SCALE} onUpdate={handleInteractionStart} onRemove={removeInteriorWall} isPrint={isPrint} />)}
                        {interiorWalls.map(wall => (
                            <g key={`label-${wall.id}`} transform={`translate(${wall.x * BASE_SCALE}, ${wall.y * BASE_SCALE})`}>
                                <rect x="-15" y="-7" width="30" height="14" rx="4" fill="white" fillOpacity="0.9" stroke="#cbd5e1" strokeWidth="0.5" />
                                <text textAnchor="middle" dy="5" className="text-[10px] font-black fill-slate-700" transform={`rotate(${wall.isVertical ? -90 : 0})`}>{wall.length.toFixed(2)}m</text>
                            </g>
                        ))}
                        {openings.map(o => {
                            const ow = o.width * BASE_SCALE, th = 8;
                            let tx = 0, ty = 0, rot = 0;
                            if (!o.recessId) {
                                if (o.side === 'Norte') { tx = o.x * BASE_SCALE; ty = 0; rot = 0; }
                                else if (o.side === 'Sur') { tx = (width - o.x - o.width) * BASE_SCALE; ty = length * BASE_SCALE; rot = 0; }
                                else if (o.side === 'Oeste') { tx = 0; ty = (length - o.x) * BASE_SCALE; rot = -90; }
                                else if (o.side === 'Este') { tx = width * BASE_SCALE; ty = o.x * BASE_SCALE; rot = 90; }
                            } else {
                                const r = recesses.find(rc => rc.id === o.recessId);
                                if (!r) return null;
                                if (o.recessWall === 'back') {
                                    if (r.side === 'Norte') { tx = (r.x + o.x) * BASE_SCALE; ty = r.depth * BASE_SCALE; rot = 0; }
                                    else if (r.side === 'Sur') { tx = (r.x + r.width - o.x - o.width) * BASE_SCALE; ty = (length - r.depth) * BASE_SCALE; rot = 0; }
                                } else if (o.recessWall === 'left') {
                                    if (r.side === 'Norte') { tx = r.x * BASE_SCALE; ty = o.x * BASE_SCALE; rot = 90; }
                                    else if (r.side === 'Sur') { tx = (r.x + r.width) * BASE_SCALE; ty = (length - o.x) * BASE_SCALE; rot = -90; }
                                } else if (o.recessWall === 'right') {
                                    if (r.side === 'Norte') { tx = (r.x + r.width) * BASE_SCALE; ty = (r.depth - o.x) * BASE_SCALE; rot = -90; }
                                    else if (r.side === 'Sur') { tx = r.x * BASE_SCALE; ty = (length - r.depth + o.x) * BASE_SCALE; rot = 90; }
                                }
                            }
                            const isSelected = activeOpeningId === o.id;
                            const arcDirection = o.isOutward ? 1 : -1; // 1 = outward, -1 = inward
                            return (
                                <g key={o.id} transform={`translate(${tx}, ${ty}) rotate(${rot})`} className="cursor-pointer group"
                                    onMouseDown={(e) => { e.stopPropagation(); setActiveOpeningId(o.id); setActiveInteriorWallId(null); setActiveRecessId(null); }}>
                                    <rect x={0} y={-th / 2} width={ow} height={th}
                                        fill={isSelected ? '#fef08a' : (o.type === 'door' ? '#ffffff' : '#bae6fd')}
                                        stroke={isSelected ? '#ca8a04' : '#1e293b'} strokeWidth={isSelected ? '3' : '2'}
                                        className="group-hover:fill-cyan-50 transition-colors" />
                                    {o.type === 'door' && <path d={`M 0 0 C 0 ${arcDirection * -ow} ${ow} ${arcDirection * -ow} ${ow} 0`} fill="none" stroke={isSelected ? '#ca8a04' : '#94a3b8'} strokeWidth="1" strokeDasharray="2 2" />}
                                </g>
                            );
                        })}
                        <g transform="translate(0, -80)">
                            <line x1="0" y1="0" x2={contentWidth} y2="0" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrowhead-rev)" markerEnd="url(#arrowhead)" />
                            <rect x={contentWidth / 2 - 50} y="-28" width="100" height="20" rx="4" fill="white" fillOpacity="0.9" stroke="#cbd5e1" strokeWidth="0.5" />
                            <text x={contentWidth / 2} y="-14" textAnchor="middle" className="text-[12px] font-black fill-slate-500 uppercase tracking-widest">
                                NORTE: {width.toFixed(2)}m
                            </text>
                        </g>

                        <g transform={`translate(0, ${contentHeight + 80})`}>
                            <line x1="0" y1="0" x2={contentWidth} y2="0" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrowhead-rev)" markerEnd="url(#arrowhead)" />
                            <rect x={contentWidth / 2 - 60} y="4" width="120" height="24" rx="6" fill="#06b6d4" />
                            <text x={contentWidth / 2} y="20" textAnchor="middle" className="text-[14px] font-black fill-white uppercase tracking-[0.2em]">
                                SUR: {width.toFixed(2)}m
                            </text>
                        </g>

                        <g transform="translate(-120, 0)">
                            <line x1="0" y1="0" x2="0" y2={contentHeight} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrowhead-rev)" markerEnd="url(#arrowhead)" />
                            <rect x="-42" y={contentHeight / 2 - 40} width="20" height="80" rx="4" fill="white" fillOpacity="0.9" stroke="#cbd5e1" strokeWidth="0.5" />
                            <text
                                x="-28"
                                y={contentHeight / 2}
                                textAnchor="middle"
                                transform={`rotate(-90, -28, ${contentHeight / 2})`}
                                className="text-[10px] font-black fill-slate-500 uppercase tracking-widest"
                            >
                                OESTE: {length.toFixed(2)}m
                            </text>
                        </g>

                        <g transform={`translate(${contentWidth + 120}, 0)`}>
                            <line x1="0" y1="0" x2="0" y2={contentHeight} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrowhead-rev)" markerEnd="url(#arrowhead)" />
                            <rect x="22" y={contentHeight / 2 - 40} width="20" height="80" rx="4" fill="white" fillOpacity="0.9" stroke="#cbd5e1" strokeWidth="0.5" />
                            <text
                                x="36"
                                y={contentHeight / 2}
                                textAnchor="middle"
                                transform={`rotate(90, 36, ${contentHeight / 2})`}
                                className="text-[10px] font-black fill-slate-500 uppercase tracking-widest"
                            >
                                ESTE: {length.toFixed(2)}m
                            </text>
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default FloorPlan;
