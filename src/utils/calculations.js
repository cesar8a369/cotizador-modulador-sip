export const PANEL_WIDTH = 1.22; // Standard SIP panel width
export const PANEL_HEIGHT = 2.44; // Standard

export const calculateGeometry = (dimensions, interiorWalls, facadeConfigs, openings = [], project = {}, selections = {}) => {
    const { width, length } = dimensions;
    const recesses = project.recesses || [];

    // 1. Interior Walls Length (Robust calculation: uses length property or coordinates from structural interiorWalls array)
    // IMPORTANT: customMeasurements (reference rulers) are kept in a separate array in the store 
    // and should NEVER be passed here or counted as functional walls.
    const interiorWallsLength = Array.isArray(interiorWalls)
        ? interiorWalls.reduce((acc, wall) => {
            // Ensure we are working with a structural wall object and not a generic reference
            if (wall.length !== undefined) return acc + (Number(wall.length) || 0);
            if ((wall.x1 !== undefined && wall.x2 !== undefined) && (wall.y1 !== undefined && wall.y2 !== undefined)) {
                const dx = wall.x2 - wall.x1;
                const dy = wall.y2 - wall.y1;
                return acc + Math.sqrt(dx * dx + dy * dy);
            }
            return acc;
        }, 0)
        : (Number(interiorWalls) || 0);

    // 2. Facade-based Area Calculation (Gross Exterior)
    const sides = {};
    let areaFachadasTotal = 0;
    let cantMurosExtTotal = 0;
    let maxH = 2.44;
    let minBaseH = 2.44;

    Object.entries(facadeConfigs).forEach(([side, config]) => {
        const isFB = side === 'Norte' || side === 'Sur';
        const w = isFB ? width : length;
        const { hBase, hMax } = config;
        if (hMax > maxH) maxH = hMax;
        if (hBase < minBaseH) minBaseH = hBase;

        // Skip calculations if side is hidden
        const isVisible = project.perimeterVisibility?.[side] !== false;
        if (!isVisible) {
            sides[side] = {
                area: 0,
                panels: 0,
                openingML: 0,
                perimPanels: 0,
                isVisible: false
            };
            return;
        }

        let sideArea = 0;
        if (config.type === 'recto') sideArea = w * hBase;
        else if (config.type === 'inclinado') sideArea = w * (hBase + hMax) / 2;
        else if (config.type === '2-aguas') sideArea = w * hBase + (w * (hMax - hBase) / 2);

        const sideOpenings = (openings || []).filter(o => o.side === side);
        const sideOpeningsML = sideOpenings.reduce((acc, o) => {
            const ow = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
            const oh = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
            return acc + ((ow + oh) * 2);
        }, 0);

        const sidePanels = Math.ceil(sideArea / (PANEL_WIDTH * PANEL_HEIGHT));

        areaFachadasTotal += sideArea;
        cantMurosExtTotal += sidePanels;

        sides[side] = {
            area: sideArea,
            panels: sidePanels,
            openingML: sideOpeningsML,
            perimPanels: sidePanels * 7.32,
            isVisible: true
        };
    });

    // 3. Recesses (kept for perimeter and piso, but wall area is now facade-based as per user)
    let recessPisoArea = 0;
    let extraLineal = 0;

    recesses.forEach(r => {
        recessPisoArea += r.width * r.depth;
        // Only calculate extra lineal for recesses if its facade is visible
        if (project.perimeterVisibility?.[r.side] !== false) {
            if (r.hideBase) {
                if (!r.hideSideWall) {
                    extraLineal += 2 * r.depth;
                }
            } else {
                extraLineal += (2 * r.depth + r.width);
            }
        }
    });

    let perimExtBase = 0;
    if (project.perimeterVisibility?.Norte !== false) perimExtBase += width;
    if (project.perimeterVisibility?.Sur !== false) perimExtBase += width;
    if (project.perimeterVisibility?.Este !== false) perimExtBase += length;
    if (project.perimeterVisibility?.Oeste !== false) perimExtBase += length;

    const perimExt = Math.max(0, perimExtBase + extraLineal);
    const areaPiso = Math.max(0, (width * length) - recessPisoArea);

    // User requested: "area bruta en muros salga de la suma de las 4 fachadas laterales"
    let areaMurosExtBruta = areaFachadasTotal;

    // 4. Openings Analysis
    const visibleOpenings = (openings || []).filter(o => project.perimeterVisibility?.[o.side] !== false);
    const totalAberturasCount = visibleOpenings.length;
    const perimAberturas = visibleOpenings.reduce((acc, o) => {
        const w = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
        const h = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
        return acc + ((w + h) * 2);
    }, 0);

    const areaAberturas = visibleOpenings.reduce((acc, o) => {
        const w = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
        const h = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
        return acc + (w * h);
    }, 0);

    // 5. Roof Area estimation
    const areaTecho = areaPiso * 1.25;

    // 6. Walls Area (Net)
    const areaMurosExtNeta = Math.max(0, areaMurosExtBruta - areaAberturas);

    // 7. Panels Calculation
    const isSandwichRoof = selections.roofSystem === 'sandwich';
    const roofPanelWidth = isSandwichRoof ? 1.0 : PANEL_WIDTH;

    // Interior walls height = min(2.44, minBaseH)
    const intHeight = Math.min(2.44, minBaseH);

    // Filter by inclusions
    const incExt = selections.includeExterior !== false;
    const incInt = selections.includeInterior !== false;
    const incRoof = selections.includeRoof !== false;
    const incFloor = (project.foundationType === 'platea') ? false : (selections.includeFloor !== false);

    const cantMurosExt = incExt ? cantMurosExtTotal : 0;
    const cantMurosInt = incInt ? Math.ceil((interiorWallsLength * intHeight) / (PANEL_WIDTH * PANEL_HEIGHT)) : 0;
    const cantPiso = incFloor ? Math.ceil(areaPiso / (PANEL_WIDTH * PANEL_HEIGHT)) : 0;
    const cantTecho = incRoof ? Math.ceil(areaTecho / (roofPanelWidth * PANEL_HEIGHT)) : 0;

    const totalPaneles = cantMurosExt + cantMurosInt + cantPiso + cantTecho;
    const perimLinealPaneles = totalPaneles * 7.32;

    const result = {
        perimExt,
        areaPiso,
        areaTecho,
        cantMurosExt,
        cantMurosInt,
        cantPiso,
        cantTecho,
        perimMurosExt: cantMurosExt * 7.32,
        perimMurosInt: cantMurosInt * 7.32,
        perimPiso: cantPiso * 7.32,
        perimTecho: cantTecho * 7.32,
        totalPaneles,
        tabiques: interiorWallsLength,
        areaMurosBruta: areaMurosExtBruta,
        areaMuros: areaMurosExtNeta,
        perimAberturas,
        perimLinealPaneles,
        totalAberturasCount,
        sides
    };

    // Global Safety: Ensure no NaN leaks to components
    Object.keys(result).forEach(key => {
        if (typeof result[key] === 'number' && isNaN(result[key])) {
            result[key] = 0;
        }
    });

    return result;
};

export const calculateQuantities = (geo, selections, openingsCount, prices, dimensions = {}, foundationType = 'platea', structureType = 'madera') => {
    const {
        perimExt, areaPiso, areaTecho, cantMurosExt, cantMurosInt,
        cantPiso, cantTecho, totalPaneles, tabiques, areaMurosBruta,
        totalAberturasCount, perimAberturas, perimLinealPaneles
    } = geo;

    const { width = 0, length = 0 } = dimensions;
    const quantities = {};

    const includeExt = selections.includeExterior !== undefined ? selections.includeExterior : true;
    const includeInt = selections.includeInterior !== undefined ? selections.includeInterior : true;
    // Floor is automatically excluded if foundation is 'platea'
    const includeFloor = foundationType === 'platea' ? false : (selections.includeFloor !== undefined ? selections.includeFloor : true);
    const includeRoof = selections.includeRoof !== undefined ? selections.includeRoof : true;
    const includeAnyWall = includeExt || includeInt;

    // --- 1. SISTEMA DE PANELES ---
    // Ensure all values are checked and have valid defaults. We trim IDs to avoid whitespace issues.
    // Logic updated to ensure we don't accidentally skip them if 'include*' flags were somehow false (though they are hardcoded true).

    if (includeExt && geo.cantMurosExt > 0) {
        const id = (selections?.exteriorWallId || 'OSB-70-E').toString().trim();
        quantities[`${id}@@EXTERIOR`] = geo.cantMurosExt;
    }

    // Interior Walls
    if (includeInt && geo.cantMurosInt > 0) {
        const id = (selections?.interiorWallId || 'OSB-70-DECO').toString().trim();
        quantities[`${id}@@INTERIOR`] = geo.cantMurosInt;
    }

    // Floor
    if (includeFloor && geo.cantPiso > 0) {
        const id = (selections?.floorId || 'PISO-OSB-70').toString().trim();
        quantities[`${id}@@PISO`] = geo.cantPiso;
    }

    // Roof
    if (includeRoof) {
        const id = (selections?.roofId || 'TECHO-OSB-70').toString().trim();
        const isSandwich = selections.roofSystem === 'sandwich' || id.includes('SAND-');

        if (isSandwich) {
            quantities[`${id}@@TECHO`] = Math.round(geo.areaTecho);
        } else if (geo.cantTecho > 0) {
            quantities[`${id}@@TECHO`] = geo.cantTecho;
        }
    }

    // --- 2. MADERAS ESTRUCTURALES ---

    // Pino 3x6" (Techo Estructural): (Largo/0.6) * Ancho * 1.1
    if (includeRoof) {
        quantities['MAD_VIGA_TECHO_3X6'] = Math.ceil((length / 0.6) * width * 1.1);
    } else {
        quantities['MAD_VIGA_TECHO_3X6'] = 0;
    }

    // Pino 3x6" (Piso Estructural): Keep previous logic but update price label as per constants
    if (includeFloor && (structureType === 'madera' || structureType === 'metal')) {
        quantities['MAD_VIGA_PISO_3X6'] = Math.ceil(areaPiso * 2.5 * 1.1);
    } else {
        quantities['MAD_VIGA_PISO_3X6'] = 0;
    }

    // Pino 2x3" (Vinculante): (Paneles_Muros + Paneles_Tabiques + Paneles_pisos) * 6.6
    const cantPanelesMuro = (includeExt ? cantMurosExt : 0) + (includeInt ? cantMurosInt : 0);
    const cantPanelesPiso = includeFloor ? cantPiso : 0;
    quantities['MAD_VINC_2X3'] = Math.ceil((cantPanelesMuro + cantPanelesPiso) * 6.6);

    // Pino 1x4" (Solera): (Paneles_Muros + Paneles_Tabiques) * 1.3
    quantities['MAD_SOL_BASE'] = Math.ceil(cantPanelesMuro * 1.3);

    // Pino 2x2" (Clavadera): Perim_Ext * 5.5
    quantities['MAD_CLAV_2X2'] = Math.ceil(perimExt * 5.5);

    // --- 3. FIJACIONES Y ANCLAJES ---

    // Varilla Roscada 1/2": (Paneles_Muros * 1.3 + Paneles_Tabiques * 1.3) / 5
    // Anclaje Químico: (Paneles_Muros * 1.3 + Paneles_Tabiques * 1.3) / 10
    const factorMuros = cantPanelesMuro * 1.3;
    if (!includeFloor) {
        quantities['VARILLA_12'] = Math.ceil(factorMuros / 5);
        quantities['ANCLAJE_QUIMICO'] = Math.ceil(factorMuros / 10);
    } else {
        quantities['VARILLA_12'] = 0;
        quantities['ANCLAJE_QUIMICO'] = 0;
    }

    // Tuerca + Arandela: Cant_Varillas * 5
    quantities['KIT_TUERCA'] = Math.ceil(quantities['VARILLA_12'] * 5);

    // Tornillos Fix
    // Fix 6x1.5: (Paneles_totales * 55) + (Perimetro_Aberturas * 6.6)
    quantities['FIX_6X1_5'] = Math.ceil((totalPaneles * 55) + (perimAberturas * 6.6));

    // Fix 6x2: (Paneles_Muros + Paneles_Tabiques) * 5.3
    quantities['FIX_6X2'] = Math.ceil(cantPanelesMuro * 5.3);

    // Fix 8x3: Paneles_Muros * 13
    quantities['FIX_8X3'] = Math.ceil(includeExt ? cantMurosExt * 13 : 0);

    // Tornillos Especiales
    const isTechoSandwich = includeRoof && selections.roofId && selections.roofId.includes('SAND-');

    if (includeRoof) {
        // Hex 14x3": Area_Techo * 4.5
        quantities['TORN_HEX_3'] = Math.ceil(areaTecho * 4.5);
        // Torx 140mm: (Area_Techo + Area_Piso) * 3.5
        quantities['TORX_140'] = Math.ceil((areaTecho + areaPiso) * 3.5);

        if (isTechoSandwich) {
            // Hex 14x5": Area_Techo * 4.5 (if sandwich)
            quantities['HEX_T2_14X5'] = Math.ceil(areaTecho * 4.5);
        } else {
            quantities['HEX_T2_14X5'] = 0;
        }
    } else {
        quantities['TORN_HEX_3'] = 0;
        quantities['TORX_140'] = 0;
        quantities['HEX_T2_14X5'] = 0;
    }

    // Torx 120mm (Muros): Paneles_Muros * 4
    quantities['TORX_120'] = Math.ceil(cantPanelesMuro * 4);

    // --- 4. AISLACIÓN Y SELLADO QUÍMICO ---

    // Espuma PU: (Total Paneles * 8) / 25
    quantities['ESPUMA_PU'] = Math.ceil((totalPaneles * 8) / 25);

    // Pegamento: (Paneles_Muros * 1.2 + Paneles_Tabiques * 1.2) / 4
    quantities['PEG_PU'] = Math.ceil((cantPanelesMuro * 1.2) / 4);

    // Membrana Líquida: ((Paneles_Muros * 1.3 + Paneles_Tabiques * 1.3) * 0.15 + 30) / 20
    quantities['MEMB_LIQ'] = Math.ceil((((includeExt ? cantMurosExt : 0) * 1.3 + (includeInt ? cantMurosInt : 0) * 1.3) * 0.15 + 30) / 20);

    // Barrera Viento: (Area_Muros * 1.1 + Area_Techo * 1.1) / 30
    quantities['BARRERA'] = Math.ceil((areaMurosBruta * 1.1 + areaTecho * 1.1) / 30);

    // Membrana Asfáltica: (Paneles_Muros * 1.3 + Paneles_Tabiques * 1.3) / 25
    quantities['MEMB_AUTO'] = Math.ceil(factorMuros / 25);

    // Chapa C27: Area_Techo
    quantities['CHAPA_C27'] = Math.ceil(areaTecho);

    // --- 5. SERVICIOS Y EXTRAS ---
    quantities['INGENIERIA_DETALLE'] = selections.includeEngineeringDetail ? Math.ceil(areaPiso) : 0;


    return quantities;
};

export const fullCalculation = (dimensions, selections, interiorWalls, openings, facadeConfigs, project = {}, foundationType = 'platea', structureType = 'madera', prices = []) => {
    const actualOpenings = Array.isArray(openings) ? openings : [];
    const safeSelections = selections || {};
    const geo = calculateGeometry(dimensions, interiorWalls || [], facadeConfigs || {}, actualOpenings, { ...project, foundationType, perimeterWalls: project.perimeterWalls || [], interiorWalls: project.interiorWalls || [] }, safeSelections);
    const q = calculateQuantities(geo, safeSelections, actualOpenings.length, prices, dimensions, foundationType, structureType);


    // Safety check for NaN values in geo and quantities
    [geo, q].forEach(obj => {
        if (obj) {
            Object.keys(obj).forEach(key => {
                if (typeof obj[key] === 'number' && isNaN(obj[key])) obj[key] = 0;
            });
        }
    });

    return { geo, quantities: q };
};
