export const PROJECT_LOGO = "https://lafabricadelpanel.com.ar/wp-content/uploads/2024/03/Isologo_lfp_RGB_sin_fondo.png";

export const INITIAL_PRICES = [
    // --- 1. SISTEMA DE PANELES ---
    { id: "OSB-70-E", name: "Muro Exterior", unit: "UNID", price: 106097, category: "1. SISTEMA DE PANELES" },
    { id: "OSBFEN-70-E", name: "Muro Exterior OSB/Fenólico", unit: "UNID", price: 109113, category: "1. SISTEMA DE PANELES" },
    { id: "FEN-70-E", name: "Muro Exterior Fenólico", unit: "UNID", price: 110738, category: "1. SISTEMA DE PANELES" },
    { id: "SID-70-E", name: "Muro Exterior Siding", unit: "UNID", price: 133943, category: "1. SISTEMA DE PANELES" },
    { id: "CE-70-E", name: "Muro Exterior Cementicio", unit: "UNID", price: 138366, category: "1. SISTEMA DE PANELES" },
    { id: "OSB-100-E", name: "Muro Exterior 100mm", unit: "UNID", price: 123348, category: "1. SISTEMA DE PANELES" },

    { id: "OSB-70-INT", name: "Muro Interior", unit: "UNID", price: 92993, category: "1. SISTEMA DE PANELES" },
    { id: "FEN-70-INT", name: "Muro Interior Fenólico", unit: "UNID", price: 101183, category: "1. SISTEMA DE PANELES" },

    { id: "OSB-70-PISO", name: "Piso SIP OSB 70mm", unit: "UNID", price: 99426, category: "1. SISTEMA DE PANELES" },
    { id: "FEN-70-PISO", name: "Piso Fenólico 70mm", unit: "UNID", price: 121244, category: "1. SISTEMA DE PANELES" },

    { id: "OSB-70-TECHO", name: "Techo SIP OSB 70mm", unit: "UNID", price: 99426, category: "1. SISTEMA DE PANELES" },
    { id: "FEN-70-TECHO", name: "Techo Fenólico 70mm", unit: "UNID", price: 101183, category: "1. SISTEMA DE PANELES" },
    { id: "OSB-FEN-50", name: "Techo Mixto 50mm", unit: "UNID", price: 102396, category: "1. SISTEMA DE PANELES" },
    { id: "CE-50-TECHO", name: "Techo Cementicio 50mm", unit: "UNID", price: 123584, category: "1. SISTEMA DE PANELES" },
    { id: "SID-50-TECHO", name: "Techo Siding 50mm", unit: "UNID", price: 129044, category: "1. SISTEMA DE PANELES" },
    { id: "COL-50-TECHO", name: "Techo Colonial 50mm", unit: "UNID", price: 104935, category: "1. SISTEMA DE PANELES" },

    // --- 2. MADERAS ESTRUCTURALES (PINO TRATADO) ---
    { id: "MAD_VINC_2X3", name: "Pino 2x3\" (Panel Vinculante)", unit: "ML", price: 4200, category: "2. MADERAS ESTRUCTURALES (PINO TRATADO)" },
    { id: "MAD_SOL_BASE", name: "Pino 1x4\" (Solera de Base)", unit: "ML", price: 2800, category: "2. MADERAS ESTRUCTURALES (PINO TRATADO)" },
    { id: "MAD_CLAV_2X2", name: "Pino 2x2\" (Clavaderas)", unit: "ML", price: 2200, category: "2. MADERAS ESTRUCTURALES (PINO TRATADO)" },
    { id: "MAD_VIGA_3X6", name: "Pino 3x6\" (Techo/Piso Estructural)", unit: "ML", price: 14500, category: "2. MADERAS ESTRUCTURALES (PINO TRATADO)" },

    // --- 3. FIJACIONES Y ANCLAJES ---
    { id: "FIX_6X1_5", name: "Tornillo Fix Negro 6 x 1 1/2\" (Vinculantes)", unit: "X 100 UNID", price: 8500, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "FIX_6X2", name: "Tornillo Fix Negro 6 x 2\" (Pie Solera)", unit: "X 100 UNID", price: 12000, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "FIX_8X3", name: "Tornillo Fix Negro 8 x 3\" (Clavaderas)", unit: "X 100 UNID", price: 28000, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "TORX_120", name: "Tornillo Torx 120mm (Muros)", unit: "UNID", price: 1450, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "TORX_160", name: "Tornillo Torx 160mm (Vigas Techo)", unit: "UNID", price: 1800, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "TORN_HEX_3", name: "Tornillo Hexagonal 3\" c/Oring (Techo sandwich)", unit: "UNID", price: 220, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "HBS_TORX_180", name: "Tornillo HBS Torx 180 (Piso Madera)", unit: "UNID", price: 2200, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "HEX_T2_14X5", name: "Tornillo Hexagonal 14x5\" (Piso Metal)", unit: "UNID", price: 1850, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "VARILLA_12", name: "Varilla Roscada Zinc 1/2\" (1 m)", unit: "UNID", price: 9500, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "ANCLAJE_QUIMICO", name: "Anclaje Químico Epoxídico (490 gr)", unit: "UNID", price: 24500, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "KIT_TUERCA", name: "Tuerca + Arandela Zinc 1/2\"", unit: "X 10 UNID", price: 6500, category: "3. FIJACIONES Y ANCLAJES" },

    // --- 4. AISLACIÓN Y SELLADO QUÍMICO ---
    { id: "PEG_PU", name: "Pegamento Poliuretánico Químico (500gr)", unit: "POMO", price: 18500, category: "4. AISLACIÓN Y SELLADO QUÍMICO" },
    { id: "ESPUMA_PU", name: "Espuma Poliuretánica (750cc)", unit: "UNID", price: 24000, category: "4. AISLACIÓN Y SELLADO QUÍMICO" },
    { id: "MEMB_LIQ", name: "Membrana Líquida Poliuretánica (Piso SIP)", unit: "TACHO 20 LTS", price: 125000, category: "4. AISLACIÓN Y SELLADO QUÍMICO" },
    { id: "MEMB_AUTO", name: "Membrana Autoadhesiva Asfáltica 15 cm", unit: "ROLLO 10 MTS", price: 32000, category: "4. AISLACIÓN Y SELLADO QUÍMICO" },
    { id: "BARRERA", name: "Barrera Viento y Agua", unit: "ROLLO 30 M2", price: 135000, category: "4. AISLACIÓN Y SELLADO QUÍMICO" }
];
