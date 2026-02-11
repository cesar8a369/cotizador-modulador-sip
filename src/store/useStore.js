import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_PRICES } from '../data/constants';

const SNAP_VALUE = 0.05; // 5cm snapping for easier alignment
const roundToSnap = (val) => Math.round(val / SNAP_VALUE) * SNAP_VALUE;

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
};

export const useStore = create(
    persist(
        (set, get) => ({
            // --- HISTORY STATE ---
            history: [],
            historyIndex: -1,

            saveHistory: () => {
                const state = get();
                const snapshot = JSON.parse(JSON.stringify({
                    project: state.project,
                    dimensions: state.dimensions,
                    perimeterWalls: state.perimeterWalls,
                    interiorWalls: state.interiorWalls,
                    openings: state.openings,
                    facadeConfigs: state.facadeConfigs,
                    selections: state.selections,
                    foundationType: state.foundationType,
                    structureType: state.structureType,
                    customMeasurements: state.customMeasurements
                }));

                const newHistory = state.history.slice(0, state.historyIndex + 1);
                newHistory.push(snapshot);
                if (newHistory.length > 50) newHistory.shift();

                set({
                    history: newHistory,
                    historyIndex: newHistory.length - 1
                });
            },

            undo: () => {
                const { history, historyIndex } = get();
                if (historyIndex > 0) {
                    const prevState = history[historyIndex - 1];
                    set({
                        ...prevState,
                        historyIndex: historyIndex - 1
                    });
                }
            },

            redo: () => {
                const { history, historyIndex } = get();
                if (historyIndex < history.length - 1) {
                    const nextState = history[historyIndex + 1];
                    set({
                        ...nextState,
                        historyIndex: historyIndex + 1
                    });
                }
            },

            // --- PROJECT STATE ---
            project: {
                budgetNumber: '',
                status: 'Borrador', // 'Borrador', 'Presupuestado', 'En Seguimiento', 'Cerrado', 'Perdido'
                clientName: '',
                cuit: '',
                phone: '',
                email: '',
                location: '',
                date: new Date().toISOString().split('T')[0],
                projectInfo: {
                    benefits: '',
                    extraNotes: '',
                    adjustmentPercentage: 0,
                    showEarlyPaymentDiscount: true
                },
                recesses: [], // For irregular shapes like halls
                perimeterVisibility: { Norte: true, Sur: true, Este: true, Oeste: true },
                overrides: {} // { [productId]: { qty: number, price: number } }
            },

            // --- DEFAULTS FOR ADMIN ---
            defaults: {
                benefits: '• Compromiso de Eficiencia: 6% de descuento por cierre temprano (7 días).\n• Escalabilidad: 8% de descuento en compras > 20 unidades.\n• Optimización: 12% de beneficio por pago en efectivo.\n• Acompañamiento: Asesoría técnica y manuales paso a paso.',
                extraNotes: '• Validez: 7 días corridos.\n• Precios Netos: No incluyen IVA.\n• Reserva: Descuentos válidos según vigencia.\n• Logística: No incluye envío ni descarga.'
            },


            // --- CRM / LEADS ---
            crmEntries: [
                { id: '1', date: '2024-01-10', client: 'Juan Perez', email: 'juan@example.com', phone: '11223344', location: 'Buenos Aires', area: 48, status: 'Presupuesto', total: 12500000 },
                { id: '2', date: '2024-01-12', client: 'Maria Garcia', email: 'maria@example.com', phone: '22334455', location: 'Cordoba', area: 64, status: 'Contacto', total: 15800000 }
            ],

            // --- SNAPSHOTS ---
            snapshots: [],

            // --- ENGINEERING STATE ---
            dimensions: {
                width: 6,
                length: 8,
                height: 2.44,
                ridgeHeight: 3.5,
            },

            // Geometry
            perimeterWalls: [
                { id: 'Norte', side: 'Norte' },
                { id: 'Sur', side: 'Sur' },
                { id: 'Este', side: 'Este' },
                { id: 'Oeste', side: 'Oeste' },
            ],
            interiorWalls: [],
            openings: [],
            facadeConfigs: {
                Norte: { type: '2-aguas', hBase: 2.44, hMax: 3.5 },
                Sur: { type: '2-aguas', hBase: 2.44, hMax: 3.5 },
                Este: { type: 'recto', hBase: 2.44, hMax: 2.44 },
                Oeste: { type: 'recto', hBase: 2.44, hMax: 2.44 }
            },
            activeId: null,
            activeType: null,
            activeOpeningId: null,
            activeRecessId: null,
            showBeams: true,
            showRoofPlates: true,
            beamOffset: 0,

            selections: {
                exteriorWallId: "OSB-70-E",
                interiorWallId: "OSB-70-DECO",
                roofId: "TECHO-OSB-70",
                floorId: "PISO-OSB-70",
                roofSystem: "sip",
                includeExterior: true,
                includeInterior: true,
                includeRoof: true,
                includeFloor: true,
                includeEngineeringDetail: true,
            },
            foundationType: 'platea',
            structureType: 'madera',
            prices: INITIAL_PRICES,
            customMeasurements: [], // { id, start: {x,y}, end: {x,y} }
            // --- ACTIONS ---
            setActive: (id, type) => set({ activeId: id, activeType: type }),

            addWall: (type, data) => {
                get().saveHistory();
                set((state) => ({
                    [type === 'perimeter' ? 'perimeterWalls' : 'interiorWalls']: [
                        ...(state[type === 'perimeter' ? 'perimeterWalls' : 'interiorWalls']),
                        { id: generateUUID(), ...data }
                    ]
                }));
            },

            updateWall: (id, updates) => {
                get().saveHistory();
                set((state) => {
                    const isPerimeter = state.perimeterWalls.some(w => w.id === id);
                    const key = isPerimeter ? 'perimeterWalls' : 'interiorWalls';
                    return {
                        [key]: state[key].map(w => w.id === id ? { ...w, ...updates } : w)
                    };
                });
            },

            removeWall: (id) => {
                get().saveHistory();
                set((state) => {
                    const isPerimeter = state.perimeterWalls.some(w => w.id === id);
                    const key = isPerimeter ? 'perimeterWalls' : 'interiorWalls';
                    return {
                        [key]: state[key].filter(w => w.id !== id),
                        activeId: state.activeId === id ? null : state.activeId,
                        activeType: state.activeId === id ? null : state.activeType,
                        activeInteriorWallId: state.activeInteriorWallId === id ? null : state.activeInteriorWallId
                    };
                });
            },

            duplicateWall: (id) => {
                get().saveHistory();
                set((state) => {
                    const wall = state.interiorWalls.find(w => w.id === id);
                    if (!wall) return state;
                    const newWall = {
                        ...wall,
                        id: generateUUID(),
                        x: wall.x + 0.5,
                        y: wall.y + 0.5
                    };
                    return {
                        interiorWalls: [...state.interiorWalls, newWall],
                        activeInteriorWallId: newWall.id
                    };
                });
            },

            // --- CLIPBOARD ---
            clipboard: null,
            copyWall: (id) => {
                const wall = get().interiorWalls.find(w => w.id === id);
                if (wall) set({ clipboard: { type: 'wall', data: wall } });
            },
            cutWall: (id) => {
                const wall = get().interiorWalls.find(w => w.id === id);
                if (wall) {
                    set({ clipboard: { type: 'wall', data: wall } });
                    get().removeWall(id);
                }
            },
            pasteWall: () => {
                const { clipboard } = get();
                if (clipboard && clipboard.type === 'wall') {
                    get().saveHistory();
                    const newWall = {
                        ...clipboard.data,
                        id: generateUUID(),
                        x: clipboard.data.x + 0.2,
                        y: clipboard.data.y + 0.2
                    };
                    set((state) => ({
                        interiorWalls: [...state.interiorWalls, newWall],
                        activeInteriorWallId: newWall.id
                    }));
                }
            },

            setDimensions: (dims) => {
                get().saveHistory();
                set((state) => {
                    const newDims = { ...state.dimensions, ...dims };
                    const newConfigs = { ...state.facadeConfigs };

                    if (dims.height !== undefined) {
                        Object.keys(newConfigs).forEach(side => {
                            newConfigs[side] = { ...newConfigs[side], hBase: dims.height };
                            if (newConfigs[side].type === 'recto') {
                                newConfigs[side].hMax = dims.height;
                            }
                        });
                    }
                    if (dims.ridgeHeight !== undefined) {
                        Object.keys(newConfigs).forEach(side => {
                            if (newConfigs[side].type === '2-aguas' || newConfigs[side].type === 'inclinado') {
                                newConfigs[side].hMax = dims.ridgeHeight;
                            }
                        });
                    }

                    return {
                        dimensions: newDims,
                        facadeConfigs: newConfigs
                    };
                });
            },

            // Opening Actions
            addOpening: (side, type, recessId = null, recessWall = null) => {
                get().saveHistory();
                set((state) => ({
                    openings: [...state.openings, {
                        id: generateUUID(),
                        side,
                        type, // 'window' or 'door'
                        width: type === 'door' ? 0.9 : 1.2,
                        height: type === 'door' ? 2.1 : 1.2,
                        x: 0.5, // Default position
                        y: type === 'door' ? 0 : 0.8,
                        recessId,
                        recessWall, // 'back', 'left', 'right'
                        isOutward: false
                    }]
                }));
            },
            removeOpening: (id) => {
                get().saveHistory();
                set((state) => ({
                    openings: state.openings.filter(o => o.id !== id)
                }));
            },
            updateOpening: (id, updates) => {
                get().saveHistory();
                set((state) => ({
                    openings: state.openings.map(o => o.id === id ? { ...o, ...updates } : o)
                }));
            },

            setShowBeams: (val) => set({ showBeams: val }),
            setShowRoofPlates: (val) => set({ showRoofPlates: val }),
            setBeamOffset: (val) => set({ beamOffset: val }),
            updateFacadeConfig: (side, updates) => {
                get().saveHistory();
                set((state) => ({
                    facadeConfigs: {
                        ...state.facadeConfigs,
                        [side]: { ...state.facadeConfigs[side], ...updates }
                    }
                }));
            },

            setFoundationType: (type) => set((state) => ({
                foundationType: type,
                selections: {
                    ...state.selections,
                    includeFloor: type === 'platea' ? false : state.selections.includeFloor
                }
            })),
            setStructureType: (type) => set({ structureType: type }),

            setSelectionId: (id, value) => set((state) => ({
                selections: { ...state.selections, [id]: value }
            })),
            setSelections: (updates) => set((state) => ({
                selections: { ...state.selections, ...updates }
            })),
            setRoofSystem: (type) => set((state) => {
                const newSelections = { ...state.selections, roofSystem: type };
                // Also update the roofId to the first matching one
                const compatibleProduct = state.prices.find(p =>
                    p.category === "1. SISTEMA DE PANELES" &&
                    (type === 'sandwich' ? p.id.includes('SAND-') : (p.id.includes('TECHO-') || p.id === 'COL-70' || p.id === 'CE-70' || p.id === 'SID-70'))
                );
                if (compatibleProduct) {
                    newSelections.roofId = compatibleProduct.id;
                }
                return { selections: newSelections };
            }),
            toggleSelectionCategory: (cat) => set((state) => ({
                selections: { ...state.selections, [cat]: !state.selections[cat] }
            })),

            activeInteriorWallId: null,

            setProjectData: (data) => set((state) => ({
                project: { ...state.project, ...data }
            })),

            updateProjectInfo: (field, value) => set((state) => ({
                project: {
                    ...state.project,
                    projectInfo: {
                        ...(state.project?.projectInfo || {}),
                        [field]: value
                    }
                }
            })),
            togglePerimeterVisibility: (side) => set((state) => ({
                project: {
                    ...state.project,
                    perimeterVisibility: {
                        ...(state.project.perimeterVisibility || { Norte: true, Sur: true, Este: true, Oeste: true }),
                        [side]: !(state.project.perimeterVisibility?.[side] ?? true)
                    }
                }
            })),
            setOverride: (id, data) => set((state) => ({
                project: {
                    ...state.project,
                    overrides: {
                        ...state.project.overrides,
                        [id]: { ...(state.project.overrides[id] || {}), ...data }
                    }
                }
            })),
            removeOverride: (id) => set((state) => {
                const newOverrides = { ...state.project.overrides };
                delete newOverrides[id];
                return {
                    project: { ...state.project, overrides: newOverrides }
                };
            }),
            setActiveInteriorWallId: (id) => set({ activeInteriorWallId: id, activeId: null, activeOpeningId: null, activeRecessId: null }),
            setActiveOpeningId: (id) => set({ activeOpeningId: id, activeId: null, activeInteriorWallId: null, activeRecessId: null }),
            setActiveRecessId: (id) => set({ activeRecessId: id, activeId: null, activeInteriorWallId: null, activeOpeningId: null }),
            updateInteriorWall: (id, updates) => {
                get().saveHistory();
                set((state) => ({
                    interiorWalls: state.interiorWalls.map(w => w.id === id ? { ...w, ...updates } : w)
                }));
            },
            addSnapshot: (img) => set((state) => ({
                snapshots: [img, ...state.snapshots].slice(0, 10)
            })),
            removeSnapshot: (index) => set((state) => ({
                snapshots: state.snapshots.filter((_, i) => i !== index)
            })),
            addCustomMeasurement: (m) => {
                get().saveHistory();
                set((state) => ({
                    customMeasurements: [...state.customMeasurements, { id: generateUUID(), ...m }]
                }));
            },
            clearCustomMeasurements: () => set({ customMeasurements: [] }),
            removeCustomMeasurement: (id) => {
                get().saveHistory();
                set((state) => ({
                    customMeasurements: state.customMeasurements.filter(m => m.id !== id)
                }));
            },
            updateCustomMeasurement: (id, updates) => set((state) => ({
                customMeasurements: state.customMeasurements.map(m => m.id === id ? { ...m, ...updates } : m)
            })),

            updateRecess: (side, id, updates) => set((state) => ({
                project: {
                    ...state.project,
                    recesses: (state.project.recesses || []).map(r => r.id === id ? { ...r, ...updates } : r)
                }
            })),
            removeRecess: (id) => set((state) => ({
                project: {
                    ...state.project,
                    recesses: (state.project.recesses || []).filter(r => r.id !== id)
                }
            })),
            clearRecesses: () => set((state) => ({
                project: { ...state.project, recesses: [] }
            })),

            addLShape: () => set((state) => {
                const { width, length } = state.dimensions;
                const recessWidth = width * 0.4;
                const recessDepth = length * 0.4;
                const newRecess = {
                    id: generateUUID(),
                    side: 'Sur',
                    x: 0,
                    width: recessWidth,
                    depth: recessDepth,
                    height: state.dimensions.height,
                    hideBase: true,
                    hideSideWall: true
                };
                return { project: { ...state.project, recesses: [newRecess] } };
            }),

            addCShape: () => set((state) => {
                const { width, length } = state.dimensions;
                const recessWidth = width * 0.5;
                const recessDepth = length * 0.3;
                const newRecess = {
                    id: generateUUID(),
                    side: 'Norte',
                    x: (width - recessWidth) / 2,
                    width: recessWidth,
                    depth: recessDepth,
                    height: state.dimensions.height,
                    hideBase: true
                };
                return { project: { ...state.project, recesses: [newRecess] } };
            }),

            resetProject: () => set({
                dimensions: { width: 6, length: 8, height: 2.44, ridgeHeight: 3.5 },
                facadeConfigs: {
                    Norte: { type: '2-aguas', hBase: 2.44, hMax: 3.5 },
                    Sur: { type: '2-aguas', hBase: 2.44, hMax: 3.5 },
                    Este: { type: 'recto', hBase: 2.44, hMax: 2.44 },
                    Oeste: { type: 'recto', hBase: 2.44, hMax: 2.44 }
                },
                perimeterWalls: [{ id: 'Norte', side: 'Norte' }, { id: 'Sur', side: 'Sur' }, { id: 'Este', side: 'Este' }, { id: 'Oeste', side: 'Oeste' }],
                interiorWalls: [], activeId: null, activeType: null, activeOpeningId: null, activeRecessId: null, openings: [], showBeams: true, showRoofPlates: true, beamOffset: 0, selections: { exteriorWallId: "OSB-70-E", interiorWallId: "OSB-70-DECO", roofId: "TECHO-OSB-70", floorId: "PISO-OSB-70", roofSystem: "sip", includeExterior: true, includeInterior: true, includeRoof: true, includeFloor: true, includeEngineeringDetail: true }, foundationType: 'platea', structureType: 'madera', project: { budgetNumber: `LFP-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 9000) + 1000}`, status: 'Borrador', clientName: '', phone: '', email: '', location: '', date: new Date().toISOString().split('T')[0], projectInfo: { benefits: '', extraNotes: '', adjustmentPercentage: 0, showEarlyPaymentDiscount: true }, recesses: [], overrides: {}, perimeterVisibility: { Norte: true, Sur: true, Este: true, Oeste: true } }, snapshots: [], customMeasurements: []
            })
        }),
        {
            name: 'sip-project-storage',
            version: 5,
            migrate: (persistedState) => {
                const init = {
                    project: { budgetNumber: '', status: 'Borrador', clientName: '', cuit: '', phone: '', email: '', location: '', date: new Date().toISOString().split('T')[0], projectInfo: { benefits: '', extraNotes: '', adjustmentPercentage: 0, showEarlyPaymentDiscount: true }, recesses: [], perimeterVisibility: { Norte: true, Sur: true, Este: true, Oeste: true }, overrides: {} },
                    dimensions: { width: 6, length: 8, height: 2.44, ridgeHeight: 3.5 },
                    perimeterWalls: [{ id: 'Norte', side: 'Norte' }, { id: 'Sur', side: 'Sur' }, { id: 'Este', side: 'Este' }, { id: 'Oeste', side: 'Oeste' }],
                    interiorWalls: [], openings: [],
                    facadeConfigs: { Norte: { type: '2-aguas', hBase: 2.44, hMax: 3.5 }, Sur: { type: '2-aguas', hBase: 2.44, hMax: 3.5 }, Este: { type: 'recto', hBase: 2.44, hMax: 2.44 }, Oeste: { type: 'recto', hBase: 2.44, hMax: 2.44 } },
                    selections: { exteriorWallId: "OSB-70-E", interiorWallId: "OSB-70-DECO", roofId: "TECHO-OSB-70", floorId: "PISO-OSB-70", roofSystem: "sip", includeExterior: true, includeInterior: true, includeRoof: true, includeFloor: true, includeEngineeringDetail: true },
                    prices: INITIAL_PRICES, foundationType: 'platea', structureType: 'madera', snapshots: [], crmEntries: [], activeId: null, activeType: null, showBeams: true, showRoofPlates: true, beamOffset: 0, defaults: {
                        benefits: '• Compromiso de Eficiencia: 6% de descuento por cierre temprano (7 días).\n• Escalabilidad: 8% de descuento en compras > 20 unidades.\n• Optimización: 12% de beneficio por pago en efectivo.\n• Acompañamiento: Asesoría técnica y manuales paso a paso.',
                        extraNotes: '• Validez: 7 días corridos.\n• Precios Netos: No incluyen IVA.\n• Reserva: Descuentos válidos según vigencia.\n• Logística: No incluye envío ni descarga.'
                    }
                };
                if (!persistedState) return init;
                const m = { ...init, ...persistedState };
                m.project = { ...init.project, ...(persistedState.project || {}) };
                m.project.projectInfo = { ...init.project.projectInfo, ...(persistedState.project?.projectInfo || {}) };
                m.selections = { ...init.selections, ...(persistedState.selections || {}) };
                m.prices = INITIAL_PRICES;
                return m;
            }
        }
    )
);
