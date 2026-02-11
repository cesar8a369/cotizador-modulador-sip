import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useStore } from '../../store/useStore';
import { PROJECT_LOGO } from '../../data/constants';
import { calculateBudget } from '../../utils/budget';

const PDFReportTemplate = ({ snapshots3D, floorPlanImage, geo, quantities = {} }) => {
    const { project, dimensions, selections, prices } = useStore();

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
                        <h1 style={{ margin: 0, fontSize: '48px', fontWeight: 900, color: '#ea580c' }}>COTIZACIÓN</h1>
                        <p style={{ margin: 0, fontSize: '18px', color: '#64748b', fontWeight: 700 }}>REPORTE TÉCNICO V1.0</p>
                    </div>
                </div>

                <div style={{ marginTop: '100px', flex: 1 }}>
                    <h2 style={{ fontSize: '72px', fontWeight: 900, margin: '0 0 20px 0', lineHeight: 1.1 }}>{project.clientName || 'Cliente Particular'}</h2>
                    <div style={{ height: '8px', width: '200px', backgroundColor: '#ea580c', borderRadius: '4px', marginBottom: '40px' }}></div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '60px' }}>
                        <div style={{ position: 'relative' }}>
                            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 5px 0', fontWeight: 800, textTransform: 'uppercase' }}>CLIENTE</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{project.clientName || 'Cliente Particular'}</p>
                            {project.cuit && (
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginTop: '5px' }}>CUIT: {project.cuit}</p>
                            )}
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 5px 0', fontWeight: 800, textTransform: 'uppercase' }}>UBICACIÓN</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{project.location || 'Argentina'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 5px 0', fontWeight: 800, textTransform: 'uppercase' }}>FECHA</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{today}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 5px 0', fontWeight: 800, textTransform: 'uppercase' }}>SUPERFICIE</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{geo.areaPiso?.toFixed(2)} m²</p>
                        </div>
                    </div>
                </div>

                {snapshots3D && snapshots3D[0] && (
                    <div style={{ width: '100%', height: '800px', backgroundColor: '#f8fafc', borderRadius: '40px', overflow: 'hidden', border: '5px solid #ffffff', shadow: '0 25px 50px -12px rgba(0,0,0,0.5)', marginTop: '40px' }}>
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
                <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b', marginBottom: '40px', borderLeft: '10px solid #ea580c', paddingLeft: '20px' }}>PLANTA TÉCNICA Y GEOMETRÍA</h3>

                <div style={{ width: '100%', height: '700px', backgroundColor: '#ffffff', borderRadius: '30px', border: '40px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    {floorPlanImage ? (
                        <img src={floorPlanImage} style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain' }} alt="Planta" />
                    ) : (
                        <p style={{ color: '#94a3b8' }}>Sin imagen de planta disponible</p>
                    )}
                </div>

                <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px', paddingBottom: '40px' }}>
                    {[
                        { label: 'ÁREA DE PLANTA', value: `${geo.areaPiso?.toFixed(2)} m²` },
                        { label: 'PERÍMETRO EXTERIOR', value: `${geo.perimExt?.toFixed(2)} ml` },
                        { label: 'ÁREA MUROS PROYECTADA', value: `${geo.areaMuros?.toFixed(2)} m²` },
                        { label: 'PERÍMETRO DE ABERTURAS', value: `${geo.perimAberturas?.toFixed(2)} ml` },
                        { label: 'CANTIDAD TOTAL PANELES', value: `${geo.totalPaneles} UNID` },
                        { label: 'ALTURA MÁXIMA RIDGE', value: `${dimensions.ridgeHeight} m` }
                    ].map((item, idx) => (
                        <div key={idx} style={{ padding: '40px', backgroundColor: '#f8fafc', borderRadius: '35px', textAlign: 'left', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', trackingSpacing: '2px' }}>{item.label}</p>
                            <p style={{ margin: 0, fontSize: '36px', fontWeight: 900, color: '#0f172a' }}>{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* PAGE 3: REPORT DE MATERIALES */}
            <div className="pdf-page-fixed" style={{ height: '1587px', padding: '60px', position: 'relative', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', borderTop: '40px solid #f8fafc' }}>
                <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b', marginBottom: '44px', borderLeft: '10px solid #ea580c', paddingLeft: '20px' }}>LISTADO DE MATERIALES (ESTIMADO)</h3>

                {(() => {
                    const { items: budgetItems } = calculateBudget(quantities, prices, project);
                    const categories = [...new Set(budgetItems.map(i => i.category))];

                    return categories.map(cat => {
                        const catItems = budgetItems.filter(i => i.category === cat);
                        if (catItems.length === 0) return null;

                        return (
                            <div key={cat} style={{ marginBottom: '30px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#ea580c', textTransform: 'uppercase', marginBottom: '15px', paddingBottom: '5px', borderBottom: '2px solid #fff7ed' }}>
                                    {cat}
                                </h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                                            <th style={{ padding: '12px 15px', textAlign: 'left', borderRadius: '10px 0 0 0' }}>MATERIAL</th>
                                            <th style={{ padding: '12px 15px', textAlign: 'center' }}>UNIDAD</th>
                                            <th style={{ padding: '12px 15px', textAlign: 'center' }}>CANTIDAD</th>
                                            <th style={{ padding: '12px 15px', textAlign: 'right' }}>UNITARIO</th>
                                            <th style={{ padding: '12px 15px', textAlign: 'right', borderRadius: '0 10px 0 0' }}>TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {catItems.map((row, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                                <td style={{ padding: '10px 15px', fontWeight: 600 }}>{row.name}</td>
                                                <td style={{ padding: '10px 15px', textAlign: 'center', color: '#64748b' }}>{row.unit}</td>
                                                <td style={{ padding: '10px 15px', textAlign: 'center', fontWeight: 800 }}>{row.qty || 0}</td>
                                                <td style={{ padding: '10px 15px', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>{formatCurrency(row.price)}</td>
                                                <td style={{ padding: '10px 15px', textAlign: 'right', fontWeight: 800 }}>{formatCurrency(row.total || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    });
                })()}

                <div style={{ marginTop: 'auto', padding: '40px', backgroundColor: '#ea580c', borderRadius: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8 }}>Inversión Total Estimada</p>
                        <p style={{ margin: 0, fontSize: '42px', fontWeight: 900 }}>{formatCurrency(project.finalTotal || 0)}</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>
                        <p style={{ margin: 0 }}>* Sujeto a cambios según flete y montaje</p>
                        <p style={{ margin: 0 }}>Válido por 7 días desde la fecha.</p>
                    </div>
                </div>
            </div>

            {/* PAGE 4: GALERÍA 3D */}
            <div className="pdf-page-fixed" style={{ height: '1587px', padding: '60px', position: 'relative', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', borderTop: '40px solid #f8fafc' }}>
                <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b', marginBottom: '40px', borderLeft: '10px solid #ea580c', paddingLeft: '20px' }}>VISTAS 3D DEL PROYECTO</h3>

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
                        Los paneles utilizan núcleo de EPS de densidad estándar para máxima eficiencia.
                        Las aberturas indicadas se consideran cortes precisos realizados en fábrica.
                    </p>
                </div>
            </div>
            {/* PAGE 5: CONDICIONES Y BENEFICIOS */}
            <div className="pdf-page-fixed" style={{ height: '1587px', padding: '60px', position: 'relative', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', borderTop: '40px solid #f8fafc' }}>
                <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b', marginBottom: '40px', borderLeft: '10px solid #ea580c', paddingLeft: '20px' }}>TÉRMINOS Y BENEFICIOS</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px' }}>
                    {/* Beneficios */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <h4 style={{ fontSize: '20px', fontWeight: 900, color: '#ea580c', marginBottom: '10px' }}>BENEFICIOS EXCLUSIVOS</h4>

                        <div style={{ backgroundColor: '#f8fafc', borderRadius: '30px', padding: '30px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {project.projectInfo?.showEarlyPaymentDiscount !== false && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 900, color: '#0f766e', fontSize: '16px' }}>PRONTO PAGO (6% OFF)</p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: 700 }}>CIERRE EN 7 DÍAS</p>
                                        </div>
                                        <p style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '18px' }}>{formatCurrency((project.finalTotal || 0) * 0.06)} <span style={{ fontSize: '12px', color: '#94a3b8' }}>Ahorro</span></p>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 900, color: '#1d4ed8', fontSize: '16px' }}>BENEFICIO VOLUMEN (8% OFF)</p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: 700 }}>COMPRAS {'>'} 20 PANELES</p>
                                    </div>
                                    <p style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '18px' }}>{formatCurrency((project.finalTotal || 0) * 0.08)} <span style={{ fontSize: '12px', color: '#94a3b8' }}>Ahorro</span></p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 900, color: '#a21caf', fontSize: '16px' }}>PAGO EFECTIVO (12% OFF)</p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: 700 }}>PAGO EN SEDE CENTRAL</p>
                                    </div>
                                    <p style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '18px' }}>{formatCurrency((project.finalTotal || 0) * 0.12)} <span style={{ fontSize: '12px', color: '#94a3b8' }}>Ahorro</span></p>
                                </div>

                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{ width: '8px', height: '8px', backgroundColor: '#ea580c', borderRadius: '50%' }}></div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Acompañamiento integral y asesoría técnica personalizada.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Condiciones */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h4 style={{ fontSize: '20px', fontWeight: 900, color: '#64748b', marginBottom: '10px' }}>CONDICIONES COMERCIALES</h4>

                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { title: 'Validez de la oferta', desc: 'La presente cotización tiene una vigencia de 7 días corridos (sujeta a disponibilidad de stock).' },
                                { title: 'Política impositiva', desc: 'Los precios expresados corresponden a valores netos y no incluyen IVA.' },
                                { title: 'Condición de reserva', desc: 'Los descuentos por pronto pago se aplican validando la compra dentro del plazo de vigencia mencionado.' },
                                { title: 'Logística', desc: 'El presupuesto no incluye gastos de envío ni descarga en obra.' }
                            ].map((item, i) => (
                                <li key={i} style={{ paddingBottom: '20px', borderBottom: '2px solid #f8fafc' }}>
                                    <p style={{ margin: 0, fontWeight: 800, fontSize: '16px', color: '#334155' }}>{item.title}</p>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#64748b', lineHeight: 1.5 }}>{item.desc}</p>
                                </li>
                            ))}
                        </ul>

                        <div style={{ marginTop: '40px', padding: '30px', backgroundColor: '#fff7ed', borderRadius: '25px', border: '1px solid #ffedd5' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 900, color: '#9a3412' }}>NOTA IMPORTANTE</h4>
                            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#7c2d12' }}>
                                Los valores y descuentos están sujetos a los plazos establecidos. El inicio de la producción queda supeditado a la confirmación de la seña y disponibilidad de materiales.
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', padding: '30px', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '14px', fontWeight: 700 }}>
                    <span>LA FÁBRICA DEL PANEL | SISTEMA CONSTRUCTIVO SIP</span>
                    <span>www.lafabricadelpanel.com.ar</span>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PDFReportTemplate;
