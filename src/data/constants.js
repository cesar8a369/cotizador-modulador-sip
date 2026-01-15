export const PROJECT_LOGO = "https://lafabricadelpanel.com.ar/wp-content/uploads/2024/03/Isologo_lfp_RGB_sin_fondo.png";

export const INITIAL_PRICES = [
    // --- MUROS EXTERIORES ---
    { id: "OSB-70-E", name: "Muro Ext. SIP OSB 70mm", unit: "Unid", price: 106097, category: "Muro Exterior" },
    { id: "OSBFEN-70-E", name: "Muro Ext. OSB/Fenólico 70mm", unit: "Unid", price: 109113, category: "Muro Exterior" },
    { id: "FEN-70-E", name: "Muro Ext. Fenólico Premium 70mm", unit: "Unid", price: 110738, category: "Muro Exterior" },
    { id: "SID-70-E", name: "Muro Ext. Siding 70mm", unit: "Unid", price: 133943, category: "Muro Exterior" },
    { id: "CE-70-E", name: "Muro Ext. Cementicio 70mm", unit: "Unid", price: 138366, category: "Muro Exterior" },
    { id: "OSB-100-E", name: "Muro Ext. SIP OSB 100mm", unit: "Unid", price: 123348, category: "Muro Exterior" },

    // --- MUROS INTERIORES ---
    { id: "OSB-70-INT", name: "Muro Int. SIP OSB 70mm", unit: "Unid", price: 92993, category: "Muro Interior" },
    { id: "FEN-70-INT", name: "Muro Int. Fenólico Premium 70mm", unit: "Unid", price: 101183, category: "Muro Interior" },

    // --- TECHOS ---
    { id: "OSB-50-TECHO", name: "Techo SIP OSB 50mm", unit: "Unid", price: 99426, category: "Techo" },
    { id: "FEN-50-TECHO", name: "Techo Fenólico Premium 50mm", unit: "Unid", price: 101183, category: "Techo" },
    { id: "OSB-FEN-50", name: "Techo Mixto OSB/Fenólico 50mm", unit: "Unid", price: 102396, category: "Techo" },
    { id: "CE-50-TECHO", name: "Techo Cementicio 50mm", unit: "Unid", price: 123584, category: "Techo" },
    { id: "SID-50-TECHO", name: "Techo Siding 50mm", unit: "Unid", price: 129044, category: "Techo" },
    { id: "COL-50-TECHO", name: "Techo Colonial 50mm", unit: "Unid", price: 104935, category: "Techo" },
    { id: "SAND-OSB-80-4", name: "Techo Sandwich Chapa/OSB (4m)", unit: "Unid", price: 233620, category: "Techo Chapa" },
    { id: "SAND-OSB-80-5", name: "Techo Sandwich Chapa/OSB (5m)", unit: "Unid", price: 261025, category: "Techo Chapa" },
    { id: "SAND-OSB-80-6", name: "Techo Sandwich Chapa/OSB", unit: "m2", price: 58405, category: "Techo Chapa" },
    { id: "SAND-OSB-80-7", name: "Techo Sandwich Chapa/Siding", unit: "m2", price: 75926, category: "Techo Chapa" },

    // --- PISOS ---
    { id: "OSB-50-PISO", name: "Piso SIP OSB 50mm", unit: "Unid", price: 99426, category: "Piso" },
    { id: "FEN-50-PISO", name: "Piso Fenólico Premium 50mm", unit: "Unid", price: 121244, category: "Piso" },

    // --- MADERAS (INSUMOS) ---
    { id: "MAD_VINC_2X3", name: "Pino 2x3\" (Vinculante Panel 70mm)", unit: "ml", price: 4200, category: "Madera" },
    { id: "MAD_VINC_2X4", name: "Pino 2x4\" (Vinculante Panel 100mm)", unit: "ml", price: 5600, category: "Madera" },
    { id: "MAD_SOL_BASE", name: "Pino 1x4\" (Solera Base 70mm)", unit: "ml", price: 2800, category: "Madera" },
    { id: "MAD_SOL_1X5", name: "Pino 1x5\" (Solera Base 100mm)", unit: "ml", price: 3500, category: "Madera" },
    { id: "MAD_CLAV_2X2", name: "Pino 2x2\" (Clavaderas)", unit: "ml", price: 2200, category: "Madera" },
    { id: "MAD_VIGA_3X6", name: "Pino 3x6\" (Techo Estructural)", unit: "ml", price: 14500, category: "Madera" },

    // --- FIJACIONES ---
    { id: "FIX_6X1_5", name: "Tornillo Fix Negro 6 x 1 1/2\" (vinculantes)", unit: "Unid", price: 85, category: "Fijación" },
    { id: "FIX_6X2", name: "Tornillo Fix Negro 6 x 2\" (Pie Solera)", unit: "Unid", price: 120, category: "Fijación" },
    { id: "FIX_8X3", name: "Tornillo Fix Negro 8 x 3\" (Clavaderas)", unit: "Unid", price: 280, category: "Fijación" },
    { id: "TORX_120", name: "Tornillo Torx 120mm (Muros)", unit: "Unid", price: 1450, category: "Fijación" },
    { id: "TORX_140", name: "Tornillo Torx 140mm (Vigas)", unit: "Unid", price: 1800, category: "Fijación" },
    { id: "VARILLA_12", name: "Varilla Roscada Zinc 1/2\" (anclaje)", unit: "Unid", price: 9500, category: "Anclaje" },
    { id: "KIT_TUERCA", name: "Tuerca + Arandela Zinc 1/2\" (anclaje)", unit: "Kit", price: 650, category: "Anclaje" },
    { id: "TORN_HEX_3", name: "Tornillo Hex 3\" c/Oring (Techo)", unit: "Unid", price: 220, category: "Fijación" },

    // --- QUÍMICOS Y AISLACIÓN ---
    { id: "PEG_PU", name: "Pegamento Poliuretánico", unit: "Unid", price: 18500, category: "Químico" },
    { id: "ESPUMA_PU", name: "Espuma Poliuretánica 750cc", unit: "Tubo", price: 24000, category: "Químico" },
    { id: "MEMB_LIQ", name: "Membrana Líquida Poliuretánica (20lts)", unit: "Tacho", price: 125000, category: "Aislación" },
    { id: "MEMB_AUTO", name: "Membrana Autoadhesiva 15cm", unit: "ml", price: 3200, category: "Aislación" },
    { id: "BARRERA", name: "Barrera Viento y Agua (Wichi)", unit: "m2", price: 4500, category: "Aislación" }
];
