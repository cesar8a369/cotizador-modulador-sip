export const PROJECT_LOGO = "https://lafabricadelpanel.com.ar/wp-content/uploads/2024/03/Isologo_lfp_RGB_sin_fondo.png";

export const INITIAL_PRICES = [
    // --- 1. SISTEMA DE PANELES (ESP 70mm estándar, 80mm Sandwich) ---
    // PANELES DE MURO - PERÍMETRO (Estructural / 'E') - EPS 70mm
    { id: "OSB-70-E", name: "MURO SIP OSB \"E\"", unit: "UNID", price: 134955, category: "1. SISTEMA DE PANELES" },
    { id: "OSBFEN-70-E", name: "MURO SIP OSB FENÓLICO \"E\"", unit: "UNID", price: 138792, category: "1. SISTEMA DE PANELES" },
    { id: "FEN-70-E", name: "MURO SIP FENÓLICO PREMIUM \"E\"", unit: "UNID", price: 140859, category: "1. SISTEMA DE PANELES" },
    { id: "SID-70-E-TL-RA", name: "MURO SIP SIDING \"E\" \"TL\" \"RA\"", unit: "UNID", price: 170376, category: "1. SISTEMA DE PANELES" },
    { id: "CE-70-E-RA", name: "MURO SIP CEMENTICIO \"E\" \"TL\" \"RA\"", unit: "UNID", price: 176002, category: "1. SISTEMA DE PANELES" },

    // PANELES DE MURO - INTERIOR - EPS 70mm
    { id: "OSB-70-DECO", name: "MURO SIP OSB DECORATIVO", unit: "UNID", price: 118287, category: "1. SISTEMA DE PANELES" },
    { id: "FEN-70-INT", name: "MURO FENÓLICO PREMIUM", unit: "UNID", price: 128705, category: "1. SISTEMA DE PANELES" },
    { id: "OSB-70-E-INT", name: "MURO SIP OSB \"E\" (Interior)", unit: "UNID", price: 134955, category: "1. SISTEMA DE PANELES" },

    // PANELES DE TECHO - ESTÁNDAR - EPS 70mm
    { id: "TECHO-OSB-70", name: "TECHO SIP OSB", unit: "UNID", price: 135469, category: "1. SISTEMA DE PANELES" },
    { id: "TECHO-FEN-70", name: "TECHO SIP FENÓLICO PREMIUM", unit: "UNID", price: 137705, category: "1. SISTEMA DE PANELES" },
    { id: "OSB-FEN-70", name: "TECHO SIP FEN OSB", unit: "UNID", price: 139248, category: "1. SISTEMA DE PANELES" },
    { id: "COL-70", name: "TECHO SIP COLONIAL", unit: "UNID", price: 142478, category: "1. SISTEMA DE PANELES" },
    { id: "CE-70", name: "TECHO SIP CEMENTICIO", unit: "UNID", price: 166199, category: "1. SISTEMA DE PANELES" },
    { id: "SID-70", name: "TECHO SIP SIDING", unit: "UNID", price: 173144, category: "1. SISTEMA DE PANELES" },

    // PANELES DE TECHO - SANDWICH DE CHAPA - EPS 80mm
    { id: "SAND-OSB-80-M2", name: "TECHO SANDWICH CHAPA ACANALADA (OSB)", unit: "M2", price: 66405, category: "1. SISTEMA DE PANELES" },
    { id: "SAND-SID-80-M2", name: "TECHO SANDWICH CHAPA ACANALADA (SIDING)", unit: "M2", price: 86038, category: "1. SISTEMA DE PANELES" },
    { id: "SAND-80-M2-SIN", name: "TECHO SANDWICH CHAPA ACANALADA (SIN COBERTURA)", unit: "M2", price: 48148, category: "1. SISTEMA DE PANELES" },

    // PANELES DE PISO / ENTREPISO - EPS 70mm
    { id: "PISO-OSB-70", name: "PISO SIP OSB", unit: "UNID", price: 135469, category: "1. SISTEMA DE PANELES" },
    { id: "PISO-FEN-70-E", name: "PISO SIP FENÓLICO PREMIUM \"E\"", unit: "UNID", price: 163222, category: "1. SISTEMA DE PANELES" },

    // --- 2. MADERAS ESTRUCTURALES (PINO TRATADO) ---
    { id: "MAD_VINC_2X3", name: "Madera pino macizo 2x3Mts", unit: "UNID", price: 4370, category: "2. MADERAS ESTRUCTURALES (PINO TRATADO)" },
    { id: "MAD_CLAV_2X2", name: "Madera pino macizo 2x2Mts", unit: "UNID", price: 4350, category: "2. MADERAS ESTRUCTURALES (PINO TRATADO)" },
    { id: "MAD_SOL_BASE", name: "Madera pino macizo 1x4Mts", unit: "UNID", price: 1830, category: "2. MADERAS ESTRUCTURALES (PINO TRATADO)" },
    { id: "MAD_VIGA_TECHO_3X6", name: "Madera pino macizo G1 3x6x4.88 Mts", unit: "UNID", price: 8206, category: "2. MADERAS ESTRUCTURALES (PINO TRATADO)" },
    { id: "MAD_VIGA_TECHO_VIC", name: "Madera pino macizo victoria 3x6x4.27Mts", unit: "UNID", price: 12544, category: "2. MADERAS ESTRUCTURALES (PINO TRATADO)" },
    { id: "MAD_VIGA_MULTI", name: "Madera pino multilaminada 3x6Mts", unit: "UNID", price: 20750, category: "2. MADERAS ESTRUCTURALES (PINO TRATADO)" },
    { id: "MAD_VIGA_PISO_3X6", name: "Pino 3x6\" (Piso Estructural)", unit: "UNID", price: 8206, category: "2. MADERAS ESTRUCTURALES (PINO TRATADO)" },

    // --- 3. FIJACIONES Y ANCLAJES ---
    { id: "FIX_6X1_5", name: "Tornillo Fix 6 x 1 1/2\"", unit: "UNID", price: 55, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "FIX_6X2", name: "Tornillo Fix 6x2\"", unit: "UNID", price: 69, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "FIX_8X3", name: "Tornillo Fix 8x3\"", unit: "UNID", price: 183, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "TORX_120", name: "Tornillo Torx 120mm", unit: "UNID", price: 963, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "TORX_140", name: "Tornillo Torx 140mm", unit: "UNID", price: 1100, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "TORN_HEX_3", name: "Tornillo Hex c/O-ring 14x3\"", unit: "UNID", price: 416, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "HEX_T2_14X5", name: "Tornillo Hex c/O-ring 14x5\"", unit: "UNID", price: 1015, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "VARILLA_12", name: "Varilla Roscada Zinc 1/2\" X 1M", unit: "UNID", price: 9170, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "KIT_TUERCA", name: "Tuerca + Arandela Zinc 1/2\"", unit: "UNID", price: 210, category: "3. FIJACIONES Y ANCLAJES" },
    { id: "ANCLAJE_QUIMICO", name: "Anclaje Químico Epoxi 300ml fisher", unit: "UNID", price: 51330, category: "3. FIJACIONES Y ANCLAJES" },

    // --- 4. AISLACIÓN Y SELLADO QUÍMICO ---
    { id: "ESPUMA_PU", name: "Espuma Poliuretánica 750cc", unit: "UNID", price: 28250, category: "4. AISLACIÓN Y SELLADO QUÍMICO" },
    { id: "PEG_PU", name: "Pegamento Poliuretánico 500gr", unit: "UNID", price: 14730, category: "4. AISLACIÓN Y SELLADO QUÍMICO" },
    { id: "BARRERA", name: "Barrera Viento y Agua 30m2", unit: "UNID", price: 54450, category: "4. AISLACIÓN Y SELLADO QUÍMICO" },
    { id: "MEMB_LIQ", name: "Membrana Líquida 20 kg", unit: "UNID", price: 113230, category: "4. AISLACIÓN Y SELLADO QUÍMICO" },
    { id: "MEMB_AUTO", name: "Membrana Asfáltica autoadhesiva 15cm x 25mts", unit: "UNID", price: 51250, category: "4. AISLACIÓN Y SELLADO QUÍMICO" },
    { id: "CHAPA_C27", name: "Chapa galvanizada acanalada C27", unit: "UNID", price: 17250, category: "4. AISLACIÓN Y SELLADO QUÍMICO" },


    // --- 5. SERVICIOS Y EXTRAS ---
    { id: "INGENIERIA_DETALLE", name: "Ingeniería de detalle", unit: "UNID", price: 6000, category: "5. SERVICIOS Y EXTRAS" }

];
