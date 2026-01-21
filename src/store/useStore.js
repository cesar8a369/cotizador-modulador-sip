import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_PRICES } from '../data/constants';

const SNAP_VALUE = 0.05; // 5cm snapping for easier alignment
const roundToSnap = (val) => Math.round(val / SNAP_VALUE) * SNAP_VALUE;

export const useStore = create(
    persist(
        (set) => ({
            // --- PROJECT STATE ---
            project: {
                clientName: '',
                phone: '',
                email: '',
                location: '',
                date: new Date().toISOString().split('T')[0],
                projectInfo: {
                    benefits: '',
                    extraNotes: '',
                    adjustmentPercentage: 0
                },
                recesses: [], // For irregular shapes like halls
                overrides: {} // { [productId]: { qty: number, price: number } }
            },

            // --- DEFAULTS FOR ADMIN ---
            defaults: {
                benefits: '• Aislación térmica superior\n• Rapidez de montaje\n• Estética moderna y funcional',
                extraNotes: 'Vigencia del presupuesto: 15 días.'
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
                width: 6, // meters
                length: 8, // meters
                height: 2.44, // standard panel height (Minimum)
                ridgeHeight: 3.5, // Absolute peak height (Maximum)
            },

            // Selected Product IDs
            selections: {
                exteriorWallId: "OSB-70-E",
                interiorWallId: "OSB-70-INT",
                roofId: "OSB-70-TECHO",
                floorId: "OSB-70-PISO",
                includeExterior: true,
                includeInterior: true,
                includeRoof: true,
                includeFloor: true,
            },

            // Geometry
            interiorWalls: [],
            interiorWallsLength: 0,
            openings: [],
            foundationType: 'platea', // 'platea' or 'estructura'
            structureType: 'madera', // 'madera' or 'metal'

            // Decoupled Facade Logic
            facadeConfigs: {
                Norte: { type: '2-aguas', hBase: 2.44, hMax: 3.5 },
                Sur: { type: '2-aguas', hBase: 2.44, hMax: 3.5 },
                Este: { type: 'recto', hBase: 2.44, hMax: 2.44 },
                Oeste: { type: 'recto', hBase: 2.44, hMax: 2.44 }
            },

            showBeams: true,
            showRoofPlates: true,
            beamOffset: 0, // Manual vertical offset for beams

            // --- PRICES ---
            prices: INITIAL_PRICES,

            // --- ACTIONS ---
            toggleSelectionCategory: (category) => set((state) => ({
                selections: {
                    ...state.selections,
                    [category]: !state.selections[category]
                }
            })),
            setShowBeams: (val) => set({ showBeams: val }),
            setShowRoofPlates: (val) => set({ showRoofPlates: val }),
            setBeamOffset: (val) => set({ beamOffset: Number(val) }),
            setDimensions: (dims) => set((state) => {
                const newDims = {};
                Object.keys(dims).forEach(k => { newDims[k] = Number(dims[k]); });

                const finalDims = { ...state.dimensions, ...newDims };

                // Propagate height changes to FacadeConfigs
                // We create a deep copy to ensure immutability
                const updatedFacadeConfigs = {
                    Norte: { ...state.facadeConfigs.Norte },
                    Sur: { ...state.facadeConfigs.Sur },
                    Este: { ...state.facadeConfigs.Este },
                    Oeste: { ...state.facadeConfigs.Oeste },
                };

                let facadesChanged = false;

                Object.keys(updatedFacadeConfigs).forEach(side => {
                    const config = updatedFacadeConfigs[side];

                    // 1. Update hBase if global height changed (or if just syncing)
                    // We use 'dims.height' to check if it was specifically modified in this action,
                    // OR we can just force sync to finalDims if we want global slider to always rule.
                    // Given the user expectation ("you are using min height"), forcing sync when global changes seems best.
                    if (dims.height !== undefined || dims.ridgeHeight !== undefined) {
                        // Sync hBase to global height (Minimum/Base)
                        if (config.hBase !== finalDims.height) {
                            config.hBase = finalDims.height;
                            facadesChanged = true;
                        }

                        // Sync hMax based on type
                        if (config.type === 'recto') {
                            // Structurally, a recto wall's max height is its base height
                            if (config.hMax !== finalDims.height) {
                                config.hMax = finalDims.height;
                                facadesChanged = true;
                            }
                        } else {
                            // For 2-aguas/inclinado, hMax follows ridgeHeight
                            if (config.hMax !== finalDims.ridgeHeight) {
                                config.hMax = finalDims.ridgeHeight;
                                facadesChanged = true;
                            }
                        }
                    }
                });

                return {
                    dimensions: finalDims,
                    facadeConfigs: facadesChanged ? updatedFacadeConfigs : state.facadeConfigs
                };
            }),
            updatePrice: (id, newPrice) => set((state) => ({
                prices: state.prices.map(p => p.id === id ? { ...p, price: Number(newPrice) } : p)
            })),
            updateProduct: (id, updates) => set((state) => ({
                prices: state.prices.map(p => p.id === id ? { ...p, ...updates } : p)
            })),
            addProduct: (product) => set((state) => ({
                prices: [...state.prices, { ...product, id: product.id || crypto.randomUUID() }]
            })),
            deleteProduct: (id) => set((state) => ({
                prices: state.prices.filter(p => p.id !== id)
            })),
            updateDefaults: (updates) => set((state) => ({
                defaults: { ...state.defaults, ...updates }
            })),

            // Wall Actions
            addInteriorWall: (overrides = {}) => set((state) => {
                const defaultWall = {
                    id: crypto.randomUUID(),
                    x: state.dimensions.width / 2,
                    y: state.dimensions.length / 2,
                    length: 2.44,
                    isVertical: true, // Default Vertical
                    thickness: 0.1
                };
                return { interiorWalls: [...state.interiorWalls, { ...defaultWall, ...overrides, id: defaultWall.id }] };
            }),
            updateInteriorWall: (id, updates) => set((state) => ({
                interiorWalls: state.interiorWalls.map(w => w.id === id ? { ...w, ...updates } : w)
            })),
            removeInteriorWall: (id) => set((state) => ({
                interiorWalls: state.interiorWalls.filter(w => w.id !== id)
            })),

            // Opening Actions
            addOpening: (side, type, recessId = null, recessWall = null) => set((state) => ({
                openings: [...state.openings, {
                    id: crypto.randomUUID(),
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
            })),
            removeOpening: (id) => set((state) => ({
                openings: state.openings.filter(o => o.id !== id)
            })),
            updateOpening: (id, updates) => set((state) => ({
                openings: state.openings.map(o => o.id === id ? { ...o, ...updates } : o)
            })),

            setFoundationType: (type) => set({ foundationType: type }),
            setStructureType: (type) => set({ structureType: type }),

            updateFacadeConfig: (side, updates) => set((state) => ({
                facadeConfigs: {
                    ...state.facadeConfigs,
                    [side]: { ...state.facadeConfigs[side], ...updates }
                }
            })),

            snapshots: [],

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
            setActiveInteriorWallId: (id) => set({ activeInteriorWallId: id }),
            addSnapshot: (img) => set((state) => ({
                snapshots: [img, ...state.snapshots].slice(0, 10)
            })),
            removeSnapshot: (index) => set((state) => ({
                snapshots: state.snapshots.filter((_, i) => i !== index)
            })),
            clearSnapshots: () => set({ snapshots: [] }),

            // --- CRM ACTIONS ---
            saveToCRM: (total) => set((state) => {
                const newEntry = {
                    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
                    date: new Date().toISOString().split('T')[0],
                    client: state.project?.clientName || 'Sin Nombre',
                    phone: state.project?.phone || '---',
                    location: state.project?.location || '---',
                    area: (state.dimensions?.width || 0) * (state.dimensions?.length || 0),
                    status: 'Pendiente',
                    total: Number(total) || 0,
                    projectData: {
                        dimensions: { ...state.dimensions },
                        selections: { ...state.selections },
                        project: { ...state.project }
                    }
                };
                const currentEntries = Array.isArray(state.crmEntries) ? state.crmEntries : [];
                return { crmEntries: [newEntry, ...currentEntries] };
            }),

            updateCRMStatus: (id, status) => set((state) => ({
                crmEntries: state.crmEntries.map(e => e.id === id ? { ...e, status } : e)
            })),

            deleteCRMEntry: (id) => set((state) => ({
                crmEntries: state.crmEntries.filter(e => e.id !== id)
            })),

            // --- RECESS ACTIONS ---
            addRecess: (side) => set((state) => ({
                project: {
                    ...state.project,
                    recesses: [...(state.project.recesses || []), {
                        id: crypto.randomUUID(),
                        side,
                        x: 1,      // offset from start of wall
                        width: 1.5, // width of the recess
                        depth: 1,    // depth (push inwards)
                        height: 2.44 // Initial height matching standard panels
                    }]
                }
            })),
            updateRecess: (id, updates) => set((state) => ({
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

            addLShape: () => set((state) => {
                const { width, length } = state.dimensions;
                const recessWidth = width * 0.4;
                const recessDepth = length * 0.4;

                const newRecess = {
                    id: crypto.randomUUID(),
                    side: 'Sur',
                    x: width - recessWidth, // Right side
                    width: recessWidth,
                    depth: recessDepth,
                    height: 2.44
                };

                return {
                    project: {
                        ...state.project,
                        recesses: [...(state.project.recesses || []), newRecess]
                    }
                };
            }),

            // Reset to default
            resetProject: () => set({
                dimensions: {
                    width: 6,
                    length: 8,
                    height: 2.44,
                    ridgeHeight: 3.5
                },
                facadeConfigs: {
                    Norte: { type: '2-aguas', hBase: 2.44, hMax: 3.5 },
                    Sur: { type: '2-aguas', hBase: 2.44, hMax: 3.5 },
                    Este: { type: 'recto', hBase: 2.44, hMax: 2.44 },
                    Oeste: { type: 'recto', hBase: 2.44, hMax: 2.44 }
                },
                interiorWalls: [],
                openings: [],
                selections: {
                    exteriorWallId: "OSB-70-E",
                    interiorWallId: "OSB-70-INT",
                    roofId: "OSB-70-TECHO",
                    floorId: "OSB-70-PISO",
                },
                foundationType: 'platea',
                structureType: 'madera',
                project: {
                    clientName: '', phone: '', email: '', location: '',
                    date: new Date().toISOString().split('T')[0],
                    projectInfo: {
                        benefits: state.defaults?.benefits || '',
                        extraNotes: state.defaults?.extraNotes || '',
                        adjustmentPercentage: 0
                    },
                    recesses: [],
                    overrides: {}
                },
                snapshots: []
            })
        }),
        {
            name: 'sip-project-storage', // name of the item in the storage (must be unique)
        }
    )
);

