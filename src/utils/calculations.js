export const PANEL_WIDTH = 1.22; // Standard SIP panel width
export const PANEL_HEIGHT = 2.44; // Standard

export const calculateGeometry = (dimensions, interiorWalls, facadeConfigs, openings = [], project = {}, selections = {}) => {
    const { width, length } = dimensions;
    const recesses = project.recesses || [];

    // 1. Interior Walls Length
    const interiorWallsLength = selections.includeInterior !== false ? (
        Array.isArray(interiorWalls)
            ? interiorWalls.reduce((acc, wall) => acc + wall.length, 0)
            : (Number(interiorWalls) || 0)
    ) : 0;

    // 2. Facade-based Area Calculation (Gross Exterior)
    let areaFachadas = 0;
    let maxH = 2.44;

    Object.entries(facadeConfigs).forEach(([side, config]) => {
        const isFB = side === 'Norte' || side === 'Sur';
        const w = isFB ? width : length;
        const { hBase, hMax } = config;
        if (hMax > maxH) maxH = hMax;
        const hPromedio = (hBase + hMax) / 2;
        areaFachadas += w * hPromedio;
    });

    // Adjust for Recesses
    let recessPisoArea = 0;
    let recessExtraWallArea = 0;
    let extraLineal = 0;

    recesses.forEach(r => {
        recessPisoArea += r.width * r.depth;
        const sideConfig = facadeConfigs[r.side];
        const h = r.height || (sideConfig ? (sideConfig.hBase + sideConfig.hMax) / 2 : 2.44);
        recessExtraWallArea += (2 * r.depth) * h;
        extraLineal += 2 * r.depth;
    });

    const perimExt = (width + length) * 2 + extraLineal;
    const areaPiso = Math.max(0, (width * length) - recessPisoArea);

    // Total Area Bruta
    let areaMurosExtBruta = selections.includeExterior !== false ? (areaFachadas + recessExtraWallArea) : 0;

    // 3. Openings Analysis
    const totalAberturasCount = (selections.includeExterior !== false || selections.includeInterior !== false) ? openings.length : 0;
    const perimAberturas = (selections.includeExterior !== false || selections.includeInterior !== false) ? openings.reduce((acc, o) => {
        const w = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
        const h = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
        return acc + ((w + h) * 2);
    }, 0) : 0;

    const areaAberturas = (selections.includeExterior !== false || selections.includeInterior !== false) ? openings.reduce((acc, o) => {
        const w = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
        const h = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
        return acc + (w * h);
    }, 0) : 0;

    // 4. Roof Area estimation
    const hasGable = Object.values(facadeConfigs).some(c => c.type === '2-aguas');
    const hasSlope = Object.values(facadeConfigs).some(c => c.type === 'inclinado');
    let slopeFactor = 1.05;
    if (hasGable) slopeFactor = 1.25;
    else if (hasSlope) slopeFactor = 1.15;

    const areaTecho = (selections.includeRoof !== false) ? (areaPiso * slopeFactor) : 0;

    // 5. Walls Area (Net)
    const areaMurosExtNeta = Math.max(0, areaMurosExtBruta - areaAberturas);

    // 6. Panels Calculation
    const cantMurosExt = selections.includeExterior !== false ? Math.ceil(areaMurosExtBruta / (PANEL_WIDTH * PANEL_HEIGHT)) : 0;
    const cantMurosInt = selections.includeInterior !== false ? Math.ceil((interiorWallsLength * 2.44) / (PANEL_WIDTH * PANEL_HEIGHT)) : 0;
    const cantPiso = selections.includeFloor !== false ? Math.ceil(areaPiso / (PANEL_WIDTH * PANEL_HEIGHT)) : 0;
    const cantTecho = selections.includeRoof !== false ? Math.ceil(areaTecho / (PANEL_WIDTH * PANEL_HEIGHT)) : 0;

    const totalPaneles = cantMurosExt + cantMurosInt + cantPiso + cantTecho;

    // Perímetro Lineal de Paneles (USER FORMULA): Panel Count * 7.32 ML
    const perimLinealPaneles = totalPaneles * 7.32;

    // Detail per Facade for Reporting
    const facadeDetails = {};
    Object.entries(facadeConfigs).forEach(([side, config]) => {
        const isFB = side === 'Norte' || side === 'Sur';
        const w = isFB ? width : length;
        const { hBase, hMax } = config;
        const hPromedio = (hBase + hMax) / 2;
        facadeDetails[side] = selections.includeExterior !== false ? (w * hPromedio) : 0;
    });

    return {
        perimExt,
        areaPiso,
        areaTecho,
        cantMurosExt,
        cantMurosInt,
        cantPiso,
        cantTecho,
        totalPaneles,
        tabiques: interiorWallsLength,
        areaMurosBruta: areaMurosExtBruta,
        areaMuros: areaMurosExtNeta,
        perimAberturas,
        perimLinealPaneles,
        totalAberturasCount,
        facadeDetails
    };
};

export const calculateQuantities = (geo, selections, openingsCount, prices, dimensions = {}, foundationType = 'platea', structureType = 'madera') => {
    const {
        perimExt, areaPiso, areaTecho, cantMurosExt, cantMurosInt,
        cantPiso, cantTecho, totalPaneles, tabiques, areaMurosBruta,
        totalAberturasCount, perimAberturas, perimLinealPaneles
    } = geo;

    const { width = 0, length = 0 } = dimensions;
    const quantities = {};

    const includeExt = selections.includeExterior !== false;
    const includeInt = selections.includeInterior !== false;
    const includeFloor = selections.includeFloor !== false;
    const includeRoof = selections.includeRoof !== false;
    const includeAnyWall = includeExt || includeInt;

    // --- 1. SISTEMA SIP ---
    if (selections.exteriorWallId && includeExt) quantities[selections.exteriorWallId] = cantMurosExt;
    if (selections.interiorWallId && includeInt) quantities[selections.interiorWallId] = cantMurosInt;

    // Panel de Piso: Solo en Estruc. Madera/Metal
    if (foundationType !== 'platea' && includeFloor) {
        if (selections.floorId) quantities[selections.floorId] = cantPiso;
    }

    if (selections.roofId && includeRoof) quantities[selections.roofId] = cantTecho;

    // --- 2. MADERAS ESTRUCTURALES ---
    // Pino 3x6" (Techo): ((Largo / 0.6) * Ancho) * 1.2
    const vigaTechoML = includeRoof ? ((length / 0.6) * width) * 1.2 : 0;
    // Pino 3x6" (Piso): Superficie x 2.5 (Solo Madera/Metal)
    const vigaPisoML = (foundationType !== 'platea' && includeFloor) ? (areaPiso * 2.5) : 0;
    quantities['MAD_VIGA_3X6'] = Math.ceil(vigaTechoML + vigaPisoML);

    // Pino 2x3" (Vinculante): (Paneles Muro x 6) + Perim. Aberturas
    const cantPanelesMuro = (includeExt ? cantMurosExt : 0) + (includeInt ? cantMurosInt : 0);
    quantities['MAD_VINC_2X3'] = Math.ceil((cantPanelesMuro * 6) + (includeAnyWall ? perimAberturas : 0));

    // Pino 1x4" (Solera): Perim. Casa + ML Tabiques Int.
    const soleraML = (includeExt ? perimExt : 0) + (includeInt ? tabiques : 0);
    quantities['MAD_SOL_BASE'] = Math.ceil(soleraML);

    // Pino 2x2" (Clavadera): (Perim. Casa x 5) + (Sup. Casa x 2)
    const clavExt = includeExt ? (perimExt * 5) : 0;
    const clavPiso = includeFloor ? (areaPiso * 2) : 0;
    quantities['MAD_CLAV_2X2'] = Math.ceil(clavExt + clavPiso);

    // --- 3. FIJACIONES Y ANCLAJES ---
    // Fix Negro (ml madera x 6) - Dividido 100 porque se vende por 100 UNID
    // Lógica de Techo Sandwich: Eliminar Clavaderas y Fix 8x3
    const isTechoSandwich = includeRoof && selections.roofId && (
        selections.roofId.includes('COL-') ||
        selections.roofId.includes('SID-') ||
        selections.roofId.includes('CE-') ||
        selections.roofId.includes('OSB-FEN')
    );

    quantities['FIX_6X1_5'] = Math.ceil(((quantities['MAD_VINC_2X3'] || 0) * 6) / 100);
    quantities['FIX_6X2'] = Math.ceil(((quantities['MAD_SOL_BASE'] || 0) * 6) / 100);

    if (isTechoSandwich) {
        // If it's sandwich roof, we remove the clavaderas that might have been added for the roof part
        quantities['MAD_CLAV_2X2'] = Math.ceil(clavExt); // Keep only exterior wall part if any
        quantities['FIX_8X3'] = Math.ceil(((quantities['MAD_CLAV_2X2'] || 0) * 6) / 100);
        quantities['TORN_HEX_3'] = Math.ceil(areaTecho * 4);
    } else {
        quantities['FIX_8X3'] = Math.ceil(((quantities['MAD_CLAV_2X2'] || 0) * 6) / 100);
        quantities['TORN_HEX_3'] = 0;
    }

    // Torx 120mm (Muros)
    quantities['TORX_120'] = Math.ceil(cantPanelesMuro * 3);

    // Torx 160mm (Vigas Techo)
    quantities['TORX_160'] = includeRoof ? Math.ceil(vigaTechoML * 2) : 0;

    // HBS Torx 180 (Piso Madera)
    if (structureType === 'madera' && foundationType !== 'platea' && includeFloor) {
        quantities['HBS_TORX_180'] = Math.ceil(areaPiso * 4);
    }

    // Hexagonal 14x5" (Piso Metal)
    if (structureType === 'metal' && includeFloor) {
        quantities['HEX_T2_14X5'] = Math.ceil(areaPiso * 4);
    }

    // Kit de Anclaje (Puntos de anclaje cada 1m)
    const puntosAnclaje = Math.ceil(soleraML);

    // Varilla 1/2": Platea y Madera
    if ((foundationType === 'platea' || structureType === 'madera') && includeAnyWall) {
        quantities['VARILLA_12'] = Math.ceil(puntosAnclaje / 5);
        quantities['KIT_TUERCA'] = Math.ceil(puntosAnclaje / 10); // Pack de 10
    }

    // Anclaje Químico: Solo Platea
    if (foundationType === 'platea' && includeAnyWall) {
        quantities['ANCLAJE_QUIMICO'] = Math.ceil(puntosAnclaje / 8);
    }

    // --- 4. AISLACIÓN Y SELLADO QUÍMICO ---
    const perimTotalSellado = perimLinealPaneles + (includeAnyWall ? perimAberturas : 0);

    // Pegamento PU (500gr): (Perim Paneles + Aberturas) x 25g / 500g
    quantities['PEG_PU'] = Math.ceil((perimTotalSellado * 25) / 500);

    // Espuma PU (750cc): (Perim Paneles + Aberturas) / 25
    quantities['ESPUMA_PU'] = Math.ceil(perimTotalSellado / 25);

    // Membrana Líquida: Sup Piso / 40 (Solo Madera/Metal)
    if (foundationType !== 'platea' && includeFloor) {
        quantities['MEMB_LIQ'] = Math.ceil(areaPiso / 40);
    }

    // Membrana Autoadhesiva: Rollo 10m
    quantities['MEMB_AUTO'] = includeExt ? Math.ceil(perimExt / 10) : 0;

    // Barrera Wichi: (Sup Muros + Techo) / 30
    const barreraMuros = includeExt ? areaMurosBruta : 0;
    const barreraTecho = includeRoof ? areaTecho : 0;
    quantities['BARRERA'] = Math.ceil((barreraMuros + barreraTecho) / 30);

    return quantities;
};

export const fullCalculation = (dimensions, selections, interiorWalls, openings, facadeConfigs, project = {}, foundationType = 'platea', structureType = 'madera', prices = []) => {
    const actualOpenings = Array.isArray(openings) ? openings : [];
    const safeSelections = selections || {};
    const geo = calculateGeometry(dimensions, interiorWalls, facadeConfigs, actualOpenings, project, safeSelections);
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
