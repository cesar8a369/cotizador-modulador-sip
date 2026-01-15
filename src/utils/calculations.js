export const PANEL_WIDTH = 1.22; // Standard SIP panel width
export const PANEL_HEIGHT = 2.44; // Standard

export const calculateGeometry = (dimensions, interiorWalls, facadeConfigs, openings = [], project = {}) => {
    const { width, length } = dimensions;
    const recesses = project.recesses || [];

    // 1. Interior Walls Length
    const interiorWallsLength = Array.isArray(interiorWalls)
        ? interiorWalls.reduce((acc, wall) => acc + wall.length, 0)
        : (Number(interiorWalls) || 0);

    // 2. Facade-based Area Calculation (Gross Exterior)
    // 2. Facade-based Area Calculation (Gross Exterior) - STRICT USER LOGIC
    // Formula: Area_Muros_Bruta = Suma(Area_Norte + Area_Sur + Area_Este + Area_Oeste)
    let areaFachadas = 0;
    let maxH = 2.44;

    Object.entries(facadeConfigs).forEach(([side, config]) => {
        const isFB = side === 'Norte' || side === 'Sur';
        const w = isFB ? width : length;
        const { type, hBase, hMax } = config;

        if (hMax > maxH) maxH = hMax;

        // Regla de la Altura Promedio: (Base + Cumbrera) / 2
        const hPromedio = (hBase + hMax) / 2;
        const areaFachada = w * hPromedio;

        areaFachadas += areaFachada;
    });

    // Adjust for Recesses (Corrección: Solo sumar los laterales del recess)
    // El ancho (width) del recess ya está contado en el largo total de la fachada (w).
    // Solo agregamos la superficie "extra" generada por la profundidad (2 muros laterales).
    let recessPisoArea = 0;
    let recessExtraWallArea = 0;
    let extraLineal = 0;

    recesses.forEach(r => {
        recessPisoArea += r.width * r.depth;

        // Use custom height if available, otherwise fallback to side config average
        const sideConfig = facadeConfigs[r.side];
        const h = r.height || (sideConfig ? (sideConfig.hBase + sideConfig.hMax) / 2 : 2.44);

        // Extra Wall Area = 2 * depth * height (Side walls of the recess)
        recessExtraWallArea += (2 * r.depth) * h;

        extraLineal += 2 * r.depth;
    });

    const perimExt = (width + length) * 2 + extraLineal;
    const areaPiso = Math.max(0, (width * length) - recessPisoArea);

    // Total Area Bruta = Suma Fachadas + Extras por Recess (Physics correction)
    let areaMurosExtBruta = areaFachadas + recessExtraWallArea;

    // 3. Openings Analysis
    const totalAberturasCount = openings.length;

    // Perimetro total = suma de los 4 lados de cada abertura (2*ancho + 2*alto)
    const perimAberturas = openings.reduce((acc, o) => {
        const w = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
        const h = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
        return acc + ((w + h) * 2);
    }, 0);

    const areaAberturas = openings.reduce((acc, o) => {
        const w = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
        const h = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
        return acc + (w * h);
    }, 0);

    // 4. Roof Area estimation
    const hasGable = Object.values(facadeConfigs).some(c => c.type === '2-aguas');
    const hasSlope = Object.values(facadeConfigs).some(c => c.type === 'inclinado');

    let slopeFactor = 1.05;
    if (hasGable) slopeFactor = 1.25;
    else if (hasSlope) slopeFactor = 1.15;

    const areaTecho = areaPiso * slopeFactor;

    // 5. Walls Area (Net)
    const areaMurosExtNeta = Math.max(0, areaMurosExtBruta - areaAberturas);

    // 6. Panels Calculation
    const cantMurosExt = Math.ceil(areaMurosExtBruta / (PANEL_WIDTH * PANEL_HEIGHT));
    const cantMurosInt = Math.ceil((interiorWallsLength * 2.44) / (PANEL_WIDTH * PANEL_HEIGHT));
    const cantPiso = Math.ceil(areaPiso / (PANEL_WIDTH * PANEL_HEIGHT));
    const cantTecho = Math.ceil(areaTecho / (PANEL_WIDTH * PANEL_HEIGHT));

    const totalPaneles = cantMurosExt + cantMurosInt + cantPiso + cantTecho;

    // Perímetro Lineal de Paneles: All walls perimeter + vertical joints estimation
    const perimLinealPaneles = (perimExt + interiorWallsLength) + (totalPaneles * 2.44 / 2);

    // Detail per Facade for Reporting
    const facadeDetails = {};
    Object.entries(facadeConfigs).forEach(([side, config]) => {
        const isFB = side === 'Norte' || side === 'Sur';
        const w = isFB ? width : length;
        const { hBase, hMax } = config;
        const hPromedio = (hBase + hMax) / 2;
        facadeDetails[side] = w * hPromedio;
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
        facadeDetails // New detailed breakdown
    };
};

export const calculateQuantities = (geo, selections, openingsCount, prices, dimensions = {}) => {
    const {
        perimExt, areaPiso, areaTecho, cantMurosExt, cantMurosInt,
        cantPiso, cantTecho, totalPaneles, tabiques, areaMurosBruta,
        totalAberturasCount, perimAberturas
    } = geo;

    const { width = 0, length = 0 } = dimensions;
    const countAberturas = totalAberturasCount !== undefined ? totalAberturasCount : openingsCount;
    const quantities = {};

    // --- 1. PANELES ---
    if (selections.exteriorWallId) quantities[selections.exteriorWallId] = cantMurosExt;
    if (selections.interiorWallId) quantities[selections.interiorWallId] = cantMurosInt;
    if (selections.floorId) quantities[selections.floorId] = cantPiso;
    if (selections.roofId) quantities[selections.roofId] = cantTecho;

    const extPanelId = selections.exteriorWallId || "";
    const is100mm = extPanelId.includes('100');

    // --- 2. MADERAS ---
    // Maderas Vinculantes y Soleras (Lógica Condicional por espesor)
    const perimTab = perimExt + tabiques;
    const pAberturas = perimAberturas || 0;

    if (!is100mm) {
        // MAD_VINC_2X3 = (Perim_Ext + Tabiques) * 6 + Perimetro_Aberturas
        quantities['MAD_VINC_2X3'] = Math.ceil(perimTab * 6 + pAberturas);
        // MAD_SOL_BASE (1x4) = Perim_Ext + Tabiques
        quantities['MAD_SOL_BASE'] = Math.ceil(perimTab);
    } else {
        // MAD_VINC_2X4 = (Perim_Ext + Tabiques) * 6 + Perimetro_Aberturas
        quantities['MAD_VINC_2X4'] = Math.ceil(perimTab * 6 + pAberturas);
        // MAD_SOL_1X5 = Perim_Ext + Tabiques
        quantities['MAD_SOL_1X5'] = Math.ceil(perimTab);
    }

    // MAD_CLAV_2X2 = Perim_Ext * 5
    const metrosClavadera = perimExt * 5;
    quantities['MAD_CLAV_2X2'] = Math.ceil(metrosClavadera);

    // MAD_VIGA_3X6 = ((Largo / 0.6) * Ancho) * 1.2
    const vigaQty = ((length / 0.6) * width) * 1.2;
    quantities['MAD_VIGA_3X6'] = Math.ceil(vigaQty);

    // --- 3. FIJACIONES ---
    // FIX_6X1_5 = (Total_Paneles * 50) + (Total_Aberturas * 12)
    quantities['FIX_6X1_5'] = Math.ceil((totalPaneles * 50) + (countAberturas * 12));

    // FIX_6X2 (Pie Solera) = (Perim_Ext + Tabiques) * 4
    quantities['FIX_6X2'] = Math.ceil(perimTab * 4);

    // FIX_8X3 (Clavaderas) = Metros_Clavadera * 2
    quantities['FIX_8X3'] = Math.ceil(metrosClavadera * 2);

    // TORX_120 (Muros) = Cant_Muros * 3
    const cantMurosTotal = cantMurosExt + cantMurosInt;
    quantities['TORX_120'] = Math.ceil(cantMurosTotal * 3);

    // TORX_140 (Vigas) = (Area_Techo + Area_Piso) * 3
    quantities['TORX_140'] = Math.ceil((areaTecho + areaPiso) * 3);

    // VARILLA_12 (Anclaje) = (Perim_Ext + Tabiques) / 5
    const cantVarillas = perimTab / 5;
    quantities['VARILLA_12'] = Math.ceil(cantVarillas);

    // KIT_TUERCA = Cant_Varillas * 10
    quantities['KIT_TUERCA'] = Math.ceil(cantVarillas * 10);

    // TORN_HEX_3 (Techo) = Area_Techo * 4
    quantities['TORN_HEX_3'] = Math.ceil(areaTecho * 4);

    // --- 4. QUIMICOS Y AISLACION ---
    // PEG_PU = Total_Paneles / 4
    quantities['PEG_PU'] = Math.ceil(totalPaneles / 4);

    // ESPUMA_PU = (Total_Paneles * 7.32) / 25
    quantities['ESPUMA_PU'] = Math.ceil((totalPaneles * 7.32) / 25);

    // MEMB_LIQ = Area_Piso / 15
    quantities['MEMB_LIQ'] = Math.ceil(areaPiso / 15);

    // MEMB_AUTO = Perim_Ext + Tabiques
    quantities['MEMB_AUTO'] = Math.ceil(perimTab);

    // BARRERA (Wichi) = (Area_Muros_Ext + Area_Techo) * 1.1
    quantities['BARRERA'] = Math.ceil((areaMurosBruta + areaTecho) * 1.1);

    return quantities;
};

export const fullCalculation = (dimensions, selections, interiorWalls, openings, facadeConfigs, project = {}) => {
    const actualOpenings = Array.isArray(openings) ? openings : [];
    const geo = calculateGeometry(dimensions, interiorWalls, facadeConfigs, actualOpenings, project);
    const q = calculateQuantities(geo, selections, actualOpenings.length, [], dimensions);

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
