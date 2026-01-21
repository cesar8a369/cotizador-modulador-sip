import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Square, DoorOpen, Maximize } from 'lucide-react';

const FacadeView = ({ type, data, scale = 20, onMaximize, isMaximized = false }) => {
    const { width = 0, length = 0, openings = [], facadeConfigs = {}, project = {} } = data || {};
    const { addOpening, removeOpening, updateOpening } = useStore();
    const recesses = project?.recesses || [];

    const config = facadeConfigs[type] || { type: 'recto', hBase: 2.44, hMax: 2.44 };
    const h1 = config.hBase;
    const h2 = config.hMax;

    const isFrontBack = type === 'Norte' || type === 'Sur';
    const wallWidth = isFrontBack ? width : length;

    // Canvas dimensions
    const viewMaxHeight = Math.max(h1, h2, 2.44);
    const viewHeight = Math.max(viewMaxHeight * scale, 50); // Minimum height to avoid collapse

    // Outside View Logic: Mirror the horizontal axis
    const isFlipped = true;

    // Filter and Process openings for this facade
    const facadeOpenings = useMemo(() => {
        return (openings || [])
            .filter(o => o.side === type)
            .map(o => {
                let globalX = o.x;
                if (o.recessId) {
                    const r = recesses.find(rc => rc.id === o.recessId);
                    if (r && o.recessWall === 'back') {
                        // For 'back' walls, o.x is relative to the recess width
                        globalX = r.x + o.x;
                    } else {
                        // Hide lateral openings in direct facade view
                        return null;
                    }
                }

                // Mirror logic for 'Outside View'
                const renderX = isFlipped ? (wallWidth - globalX - o.width) : globalX;
                return { ...o, renderX };
            })
            .filter(Boolean);
    }, [openings, type, width, length, recesses, isFlipped]);

    // Interaction State
    const [activeOpeningId, setActiveOpeningId] = useState(null);
    const [interaction, setInteraction] = useState(null);

    const handleInteraction = (e) => {
        if (interaction && activeOpeningId) {
            const scaleInv = 1 / scale;
            let dx = e.movementX * scaleInv;
            const dy = e.movementY * scaleInv;

            if (isFlipped) dx = -dx; // Invert dx for mirrored view

            const current = openings.find(o => o.id === activeOpeningId);
            if (!current) return;

            const r = current.recessId ? recesses.find(rc => rc.id === current.recessId) : null;
            const limit = r ? r.width : wallWidth;

            if (interaction === 'move') {
                updateOpening(activeOpeningId, {
                    x: Math.max(0, Math.min(limit - current.width, current.x + dx)),
                    y: Math.max(0, Math.min(viewMaxHeight - current.height, current.y - dy))
                });
            } else if (interaction === 'resize') {
                updateOpening(activeOpeningId, {
                    width: Math.max(0.4, Math.min(limit - current.x, current.width + dx)),
                    height: Math.max(0.4, Math.min(viewMaxHeight - current.y, current.height - dy))
                });
            }
        }
    };

    useEffect(() => {
        const up = () => { setInteraction(null); setActiveOpeningId(null); };
        if (interaction) {
            window.addEventListener('mouseup', up);
            window.addEventListener('mousemove', handleInteraction);
        }
        return () => {
            window.removeEventListener('mouseup', up);
            window.removeEventListener('mousemove', handleInteraction);
        };
    }, [interaction, activeOpeningId, openings]);

    // Wall Points for Polygon (Mirroring shape if needed)
    const points = [];
    points.push([0, 0]);
    points.push([wallWidth * scale, 0]);

    if (config.type === 'recto') {
        points.push([wallWidth * scale, h1 * scale]);
        points.push([0, h1 * scale]);
    } else if (config.type === 'inclinado') {
        // Swap h1/h2 visually if flipped
        points.push([wallWidth * scale, (isFlipped ? h1 : h2) * scale]);
        points.push([0, (isFlipped ? h2 : h1) * scale]);
    } else if (config.type === '2-aguas') {
        points.push([wallWidth * scale, h1 * scale]);
        points.push([(wallWidth * scale) / 2, h2 * scale]);
        points.push([0, h1 * scale]);
    }

    const wallPointsString = points.map(p => `${p[0]},${viewHeight - p[1]}`).join(' ');

    // --- CALCULATIONS FOR UI ---
    const hAverage = (h1 + h2) / 2;
    const wallArea = wallWidth * hAverage;
    const PANEL_SURFACE = 1.22 * 2.44;
    const panelCount = Math.ceil(wallArea / PANEL_SURFACE);
    const panelPerimeter = panelCount * 7.32;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-full relative group" style={{ minHeight: '300px' }}>
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                <div className="bg-slate-100/80 backdrop-blur px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-500 border border-slate-200 flex items-center gap-2 shadow-sm">
                    Fachada {type}
                    <span className="text-slate-300">|</span>
                    <span className="text-[9px] text-slate-400">{wallWidth.toFixed(1)}m</span>
                </div>
                <div className="bg-cyan-500/10 text-cyan-600 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-cyan-500/20 w-fit">
                    Vista Exterior
                </div>
            </div>

            {/* NEW TECH DATA OVERLAY */}
            <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-0.5">
                <div className="bg-slate-900/90 backdrop-blur px-2 py-1 rounded text-[7px] font-black text-cyan-400 border border-white/10 flex flex-col gap-0.5 shadow-xl">
                    <div className="flex justify-between gap-4">
                        <span className="text-white/40 uppercase tracking-tighter">ÁREA TOTAL:</span>
                        <span className="text-white">{wallArea.toFixed(2)} m²</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-white/40 uppercase tracking-tighter">CANT. PANELES:</span>
                        <span className="text-white">{panelCount} u.</span>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-white/5 pt-0.5 mt-0.5 font-bold">
                        <span className="text-cyan-500/60 uppercase tracking-tighter">PERÍM. PANELES:</span>
                        <span className="text-cyan-400">{panelPerimeter.toFixed(2)} ml</span>
                    </div>
                </div>
            </div>

            {onMaximize && !isMaximized && !data.isPrint && (
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => addOpening(type, 'window')} className="bg-white shadow-sm p-1.5 rounded-lg text-slate-600 hover:text-cyan-500 hover:bg-cyan-50 border border-slate-200" title="Ventana"><Square size={16} /></button>
                    <button onClick={() => addOpening(type, 'door')} className="bg-white shadow-sm p-1.5 rounded-lg text-slate-600 hover:text-cyan-500 hover:bg-cyan-50 border border-slate-200" title="Puerta"><DoorOpen size={16} /></button>
                    <button onClick={onMaximize} className="bg-white shadow-sm p-1.5 rounded-lg text-slate-600 hover:text-cyan-500 hover:bg-cyan-50 border border-slate-200 ml-1"><Maximize size={16} /></button>
                </div>
            )}

            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/30">
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`-30 -20 ${Number(wallWidth * scale + 60) || 100} ${Number(viewHeight + 60) || 100}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="overflow-visible"
                    style={{ filter: data.isPrint ? 'none' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}
                >
                    <defs>
                        <pattern id={`sipPanel-${type}`} x="0" y={viewHeight} width={1.22 * scale} height={2.44 * scale} patternUnits="userSpaceOnUse">
                            <rect width={1.22 * scale} height={2.44 * scale} fill="white" stroke="#e2e8f0" strokeWidth="0.5" />
                        </pattern>
                        <mask id={`mask-${type}`}>
                            <polygon points={wallPointsString} fill="white" />
                            {facadeOpenings.map(o => (
                                <rect key={o.id} x={o.renderX * scale} y={viewHeight - (o.y + o.height) * scale} width={o.width * scale} height={o.height * scale} fill="black" />
                            ))}
                        </mask>
                    </defs>

                    <polygon points={wallPointsString} fill={`url(#sipPanel-${type})`} stroke="#334155" strokeWidth="2" mask={`url(#mask-${type})`} />

                    {/* Openings Render */}
                    {facadeOpenings.map(o => (
                        <g
                            key={o.id}
                            transform={`translate(${o.renderX * scale}, ${viewHeight - (o.y + o.height) * scale})`}
                            className={`${data.isPrint ? '' : 'cursor-move group/opening'}`}
                            onMouseDown={(e) => { if (data.isPrint) return; e.stopPropagation(); setActiveOpeningId(o.id); setInteraction('move'); }}
                        >
                            <rect
                                width={o.width * scale}
                                height={o.height * scale}
                                fill={o.type === 'window' ? '#f0f9ff' : '#f8fafc'}
                                fillOpacity={o.recessId ? "0.6" : "0.9"}
                                stroke={o.recessId ? "#94a3b8" : "#0ea5e9"}
                                strokeWidth="2"
                                rx="2"
                                strokeDasharray={o.recessId ? "4 2" : "0"}
                            />

                            {!data.isPrint && (
                                <>
                                    <g className="opacity-0 group-hover/opening:opacity-100 transition-opacity pointer-events-none">
                                        <rect x={0} y={-35} width={70} height={30} fill="#0ea5e9" rx="6" />
                                        <text x={35} y={-22} className="text-[8px] fill-white font-black" textAnchor="middle">{o.width.toFixed(2)}x{o.height.toFixed(2)} m</text>
                                        <text x={35} y={-10} className="text-[7px] fill-cyan-100 font-bold" textAnchor="middle">PERÍM: {((o.width + o.height) * 2).toFixed(2)} ml</text>
                                    </g>
                                    <circle cx={o.width * scale} cy={0} r={6} fill="white" stroke="#0ea5e9" strokeWidth="2" className="opacity-0 group-hover/opening:opacity-100 cursor-ne-resize" onMouseDown={(e) => { e.stopPropagation(); setActiveOpeningId(o.id); setInteraction('resize'); }} />
                                    <g className="opacity-0 group-hover/opening:opacity-100 cursor-pointer" transform={`translate(${o.width * scale + 10}, ${o.height * scale})`} onMouseDown={(e) => { e.stopPropagation(); removeOpening(o.id); }}>
                                        <circle r="8" fill="#ef4444" stroke="white" strokeWidth="1" /><path d="M-3 -3 L3 3 M-3 3 L3 -3" stroke="white" strokeWidth="2" />
                                    </g>
                                </>
                            )}
                        </g>
                    ))}

                    <g className="pointer-events-none opacity-60">
                        <line x1="0" y1={viewHeight + 10} x2={wallWidth * scale} y2={viewHeight + 10} stroke="#64748b" strokeWidth="1" />
                        <text x={wallWidth * scale / 2} y={viewHeight + 22} textAnchor="middle" className="text-[10px] font-mono fill-slate-500">{wallWidth.toFixed(2)}m</text>
                        <line x1="-12" y1={viewHeight} x2="-12" y2={viewHeight - (isFlipped ? h2 : h1) * scale} stroke="#64748b" strokeWidth="1" />
                        <text x="-16" y={viewHeight - ((isFlipped ? h2 : h1) * scale) / 2} textAnchor="end" className="text-[9px] font-mono fill-slate-500">{(isFlipped ? h2 : h1).toFixed(2)}m</text>
                        <line x1={wallWidth * scale + 12} y1={viewHeight} x2={wallWidth * scale + 12} y2={viewHeight - (isFlipped ? h1 : h2) * scale} stroke="#64748b" strokeWidth="1" />
                        <text x={wallWidth * scale + 16} y={viewHeight - ((isFlipped ? h1 : h2) * scale) / 2} textAnchor="start" className="text-[9px] font-mono fill-slate-500">{(isFlipped ? h1 : h2).toFixed(2)}m</text>
                    </g>
                </svg>
            </div>
        </div>
    );
};

export default FacadeView;
