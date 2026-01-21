import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useStore } from '../../store/useStore';
import { PROJECT_LOGO } from '../../data/constants';

const PDFReportTemplate = ({ snapshots3D, floorPlanImage, geo, quantities = {} }) => {
    const { project, dimensions } = useStore();

    const formatCurrency = (val) => {
        try {
            return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(val) || 0);
        } catch (e) {
            return '$ 0';
        }
    };

    const today = new Date().toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return ReactDOM.createPortal(
        <div id="hidden-report-container" style={{
            position: 'absolute',
            left: '-10000px',
            top: 0,
            width: '1123px', // High Resolution A4 Width
            backgroundColor: '#ffffff',
            color: '#1e293b',
            fontFamily: 'sans-serif'
        }}>
            {/* PAGE 1: COVER */}
            <div className="pdf-page-fixed" style={{ height: '1587px', padding: '60px', position: 'relative', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <img src={PROJECT_LOGO} alt="Logo" style={{ height: '100px', objectFit: 'contain' }} />
                    <div style={{ textAlign: 'right' }}>
                        <h1 style={{ margin: 0, fontSize: '48px', fontWeight: 900, color: '#0891b2' }}>COTIZACIÓN</h1>
                        <p style={{ margin: 0, fontSize: '18px', color: '#64748b', fontWeight: 700 }}>REPORTE TÉCNICO V1.0</p>
                    </div>
                </div>

                <div style={{ marginTop: '100px', flex: 1 }}>
                    <h2 style={{ fontSize: '72px', fontWeight: 900, margin: '0 0 20px 0', lineHeight: 1.1 }}>{project.clientName || 'Cliente Particular'}</h2>
                    <div style={{ height: '8px', width: '200px', backgroundColor: '#0891b2', borderRadius: '4px', marginBottom: '40px' }}></div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '60px' }}>
                        <div>
                            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 5px 0', fontWeight: 800, uppercase: 'true' }}>PROYECTO</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{project.projectName || 'Vivienda SIP Modulada'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 5px 0', fontWeight: 800, uppercase: 'true' }}>UBICACIÓN</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{project.location || 'Argentina'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 5px 0', fontWeight: 800, uppercase: 'true' }}>FECHA</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{today}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 5px 0', fontWeight: 800, uppercase: 'true' }}>SUPERFICIE</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{geo.areaPiso?.toFixed(2)} m²</p>
                        </div>
                    </div>
                </div>

                {snapshots3D && snapshots3D[0] && (
                    <div style={{ width: '100%', height: '500px', backgroundColor: '#f8fafc', borderRadius: '40px', overflow: 'hidden', border: '2px solid #f1f5f9', marginTop: '60px' }}>
                        <img src={snapshots3D[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Principal" />
                    </div>
                )}

                <div style={{ marginTop: 'auto', borderTop: '2px solid #f1f5f9', paddingTop: '30px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '14px', fontWeight: 700 }}>
                    <span>LA FÁBRICA DEL PANEL | SISTEMA CONSTRUCTIVO SIP</span>
                    <span>www.lafabricadelpanel.com.ar</span>
                </div>
            </div>

            {/* PAGE 2: PLANTA Y GEOMETRÍA */}
            <div className="pdf-page-fixed" style={{ height: '1587px', padding: '60px', position: 'relative', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', borderTop: '40px solid #f8fafc' }}>
                <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b', marginBottom: '40px', borderLeft: '10px solid #0891b2', paddingLeft: '20px' }}>PLANTA TÉCNICA</h3>

                <div style={{ width: '100%', height: '800px', backgroundColor: '#ffffff', borderRadius: '30px', border: '2px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {floorPlanImage ? (
                        <img src={floorPlanImage} style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain' }} alt="Planta" />
                    ) : (
                        <p style={{ color: '#94a3b8' }}>Sin imagen de planta disponible</p>
                    )}
                </div>

                <div style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                    {[
                        { label: 'ANCHO TOTAL', value: `${dimensions.width}m` },
                        { label: 'LARGO TOTAL', value: `${dimensions.length}m` },
                        { label: 'PERÍMETRO EXT.', value: `${geo.perimExt?.toFixed(2)}ml` },
                        { label: 'ÁREA PISOS', value: `${geo.areaPiso?.toFixed(2)}m²` },
                        { label: 'ÁREA MUROS', value: `${geo.areaMuros?.toFixed(2)}m²` },
                        { label: 'TOTAL PANELES', value: `${geo.totalPaneles}u` }
                    ].map((item, idx) => (
                        <div key={idx} style={{ padding: '25px', backgroundColor: '#f8fafc', borderRadius: '25px', textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: 900, marginBottom: '10px' }}>{item.label}</p>
                            <p style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* PAGE 3: REPORT DE MATERIALES */}
            <div className="pdf-page-fixed" style={{ height: '1587px', padding: '60px', position: 'relative', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', borderTop: '40px solid #f8fafc' }}>
                <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b', marginBottom: '44px', borderLeft: '10px solid #0891b2', paddingLeft: '20px' }}>LISTADO DE MATERIALES (ESTIMADO)</h3>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '16px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                            <th style={{ padding: '20px', textAlign: 'left', borderRadius: '15px 0 0 0' }}>MATERIAL</th>
                            <th style={{ padding: '20px', textAlign: 'center' }}>UNID.</th>
                            <th style={{ padding: '20px', textAlign: 'right', borderRadius: '0 15px 0 0' }}>CANTIDAD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { label: 'Muro Exterior', val: geo.cantMurosExt, unit: 'UNID' },
                            { label: 'Muro Interior', val: geo.cantMurosInt, unit: 'UNID' },
                            { label: 'Piso SIP OSB 70mm', val: geo.cantPiso, unit: 'UNID' },
                            { label: 'Techo SIP OSB 70mm', val: geo.cantTecho, unit: 'UNID' },
                            { label: 'Pino 3x6" (Techo/Piso)', val: quantities['MAD_VIGA_3X6'], unit: 'ML' },
                            { label: 'Pino 2x3" (Vinculante)', val: quantities['MAD_VINC_2X3'] || quantities['MAD_VINC_2X4'], unit: 'ML' },
                            { label: 'Pino 1x4" (Solera)', val: quantities['MAD_SOL_BASE'] || quantities['MAD_SOL_1X5'], unit: 'ML' },
                            { label: 'Pino 2x2" (Clavadera)', val: quantities['MAD_CLAV_2X2'], unit: 'ML' },
                            { label: 'Torx 120mm (Muros)', val: quantities['TORX_120'], unit: 'UNID' },
                            { label: 'Tornillo Hex 3" (Techo)', val: quantities['TORN_HEX_3'], unit: 'UNID' },
                            { label: 'Pegamento Poliuretánico', val: quantities['PEG_PU'], unit: 'POMO' },
                            { label: 'Espuma Poliuretánica', val: quantities['ESPUMA_PU'], unit: 'UNID' },
                            { label: 'Barrera Viento y Agua', val: quantities['BARRERA'], unit: 'ROLLO 30 M2' }
                        ].map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                <td style={{ padding: '18px 20px', fontWeight: 600 }}>{row.label}</td>
                                <td style={{ padding: '18px 20px', textAlign: 'center', color: '#64748b' }}>{row.unit}</td>
                                <td style={{ padding: '18px 20px', textAlign: 'right', fontWeight: 800 }}>{row.val || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ marginTop: 'auto', padding: '40px', backgroundColor: '#0ea5e9', borderRadius: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8 }}>Inversión Total Estimada</p>
                        <p style={{ margin: 0, fontSize: '42px', fontWeight: 900 }}>{formatCurrency(project.finalTotal || 0)}</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>
                        <p style={{ margin: 0 }}>* Sujeto a cambios según flete y montaje</p>
                        <p style={{ margin: 0 }}>Válido por 10 días desde la fecha.</p>
                    </div>
                </div>
            </div>

            {/* PAGE 4: GALERÍA 3D */}
            <div className="pdf-page-fixed" style={{ height: '1587px', padding: '60px', position: 'relative', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', borderTop: '40px solid #f8fafc' }}>
                <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b', marginBottom: '40px', borderLeft: '10px solid #0891b2', paddingLeft: '20px' }}>VISTAS 3D DEL PROYECTO</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} style={{ height: '400px', backgroundColor: '#f8fafc', borderRadius: '30px', border: '2px solid #f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {snapshots3D && snapshots3D[idx] ? (
                                <img src={snapshots3D[idx]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Vista ${idx + 1}`} />
                            ) : (
                                <p style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 700 }}>SIN CAPTURA</p>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '60px', padding: '40px', backgroundColor: '#f1f5f9', borderRadius: '30px' }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 900 }}>NOTAS TÉCNICAS</h4>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#475569' }}>
                        El sistema SIP (Structural Insulated Panels) ofrece un aislamiento térmico superior, reduciendo el consumo energético hasta un 60%.
                        Este reporte ha sido generado de forma dinámica basándose en la modulación estándar de paneles de 1.22 x 2.44m.
                        Las aberturas indicadas se consideran cortes precisos realizados en fábrica.
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PDFReportTemplate;
