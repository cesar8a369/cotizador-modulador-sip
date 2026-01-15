import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Camera, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

const OSB_COLOR = '#e2b17a';
const INT_WALL_COLOR = '#ffffff';
const BEAM_COLOR = '#8b5a2b';
const ROOF_PLATE_COLOR = '#334155';

const getWallHeight = (x, wallLen, config) => {
    const { type, hBase, hMax } = config;
    if (type === 'recto') return hBase;
    if (type === 'inclinado') return hBase + (hMax - hBase) * (x / wallLen);
    if (type === '2-aguas') {
        const mid = wallLen / 2;
        if (x <= mid) return hBase + (hMax - hBase) * (x / mid);
        return hMax - (hMax - hBase) * ((x - mid) / mid);
    }
    return hBase;
};

const Opening3D = ({ opening, dimensions, project }) => {
    const { width, length } = dimensions;
    const { x, y, width: w, height: h, side, type, recessId, recessWall } = opening;
    const recesses = project?.recesses || [];
    let pos = [0, 0, 0], rot = [0, 0, 0];
    const offset = 0.01;

    if (!recessId) {
        if (side === 'Norte') pos = [x + w / 2, y + h / 2, -offset];
        else if (side === 'Sur') { pos = [width - x - w / 2, y + h / 2, length + offset]; rot = [0, Math.PI, 0]; }
        else if (side === 'Este') { pos = [width + offset, y + h / 2, x + w / 2]; rot = [0, -Math.PI / 2, 0]; }
        else if (side === 'Oeste') { pos = [-offset, y + h / 2, length - x - w / 2]; rot = [0, Math.PI / 2, 0]; }
    } else {
        const r = recesses.find(rc => rc.id === recessId);
        if (!r) return null;
        if (recessWall === 'back') {
            if (side === 'Norte') { pos = [r.x + x + w / 2, y + h / 2, r.depth + offset]; rot = [0, 0, 0]; }
            else if (side === 'Sur') { pos = [width - (r.x + r.width) + x + w / 2, y + h / 2, length - r.depth - offset]; rot = [0, Math.PI, 0]; }
        } else if (recessWall === 'left') {
            if (side === 'Norte') { pos = [r.x + offset, y + h / 2, x + w / 2]; rot = [0, -Math.PI / 2, 0]; }
            else if (side === 'Sur') { pos = [width - (r.x + r.width) - offset, y + h / 2, length - x - w / 2]; rot = [0, Math.PI / 2, 0]; }
        } else if (recessWall === 'right') {
            if (side === 'Norte') { pos = [r.x + r.width - offset, y + h / 2, x + w / 2]; rot = [0, Math.PI / 2, 0]; }
            else if (side === 'Sur') { pos = [width - r.x + offset, y + h / 2, length - x - w / 2]; rot = [0, -Math.PI / 2, 0]; }
        }
    }

    return (
        <mesh position={pos} rotation={rot} castShadow>
            <boxGeometry args={[w, h, 0.14]} />
            <meshStandardMaterial color={type === 'window' ? '#bae6fd' : '#1e293b'} transparent opacity={type === 'window' ? 0.6 : 1} />
        </mesh>
    );
};

const GenericBeam = ({ l, w, h, pos, rot, color = BEAM_COLOR }) => (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
        <boxGeometry args={[l, h, w]} />
        <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
);

const WallSegment = ({ xStart, xEnd, h1, h2, material, position, rotation }) => {
    const w = Math.abs(xEnd - xStart);
    const thickness = 0.15;

    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(w / 2, h2);
    shape.lineTo(-w / 2, h1);
    shape.lineTo(-w / 2, 0);

    const extrudeSettings = {
        depth: thickness,
        bevelEnabled: false
    };

    return (
        <mesh position={position} rotation={rotation} material={material} castShadow receiveShadow>
            <extrudeGeometry args={[shape, extrudeSettings]} />
        </mesh>
    );
};

const HouseModel = ({ dimensions, openings, facadeConfigs, interiorWalls, showBeams, showRoofPlates, project, beamOffset = 0 }) => {
    const { width, length } = dimensions;
    const recesses = project?.recesses || [];
    const mat = new THREE.MeshStandardMaterial({ color: OSB_COLOR, side: THREE.DoubleSide });

    const floorShape = useMemo(() => {
        const s = new THREE.Shape(); s.moveTo(0, 0);
        const nr = recesses.filter(r => r.side === 'Norte').sort((a, b) => a.x - b.x);
        nr.forEach(r => { s.lineTo(r.x, 0); s.lineTo(r.x, r.depth); s.lineTo(r.x + r.width, r.depth); s.lineTo(r.x + r.width, 0); });
        s.lineTo(width, 0);
        const er = recesses.filter(r => r.side === 'Este').sort((a, b) => a.x - b.x);
        er.forEach(r => { s.lineTo(width, r.x); s.lineTo(width - r.depth, r.x); s.lineTo(width - r.depth, r.x + r.width); s.lineTo(width, r.x + r.width); });
        s.lineTo(width, length);
        const sr = recesses.filter(r => r.side === 'Sur').sort((a, b) => b.x - a.x);
        sr.forEach(r => { s.lineTo(r.x + r.width, length); s.lineTo(r.x + r.width, length - r.depth); s.lineTo(r.x, length - r.depth); s.lineTo(r.x, length); });
        s.lineTo(0, length);
        const or = recesses.filter(r => r.side === 'Oeste').sort((a, b) => b.x - a.x);
        or.forEach(r => { s.lineTo(0, r.x + r.width); s.lineTo(r.depth, r.x + r.width); s.lineTo(r.depth, r.x); s.lineTo(0, r.x); });
        s.lineTo(0, 0); return s;
    }, [width, length, recesses]);

    const roofConfig = facadeConfigs.Norte || facadeConfigs.Sur;
    const { hBase, hMax, type: roofType } = roofConfig;
    const angle = Math.atan2(hMax - hBase, roofType === '2-aguas' ? width / 2 : width);

    return (
        <group position={[-width / 2, 0, -length / 2]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, -0.05, length / 2]} receiveShadow>
                <planeGeometry args={[100, 100]} /><meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
                <shapeGeometry args={[floorShape]} /><meshStandardMaterial color="#ffffff" />
            </mesh>

            {Object.entries(facadeConfigs).map(([side, conf]) => {
                const isNS = side === 'Norte' || side === 'Sur';
                const wallLen = isNS ? width : length;
                const rList = recesses.filter(r => r.side === side).sort((a, b) => a.x - b.x);
                const mid = wallLen / 2;

                // Build segment boundaries
                const segments = [];
                let currentX = 0;

                rList.forEach(r => {
                    // Add main wall segment before hall
                    if (r.x > currentX) {
                        segments.push({ type: 'main', xStart: currentX, xEnd: r.x });
                    }
                    // Add hall segments
                    segments.push({ type: 'hall', recess: r, xStart: r.x, xEnd: r.x + r.width });
                    currentX = r.x + r.width;
                });

                // Final main wall segment
                if (currentX < wallLen) {
                    segments.push({ type: 'main', xStart: currentX, xEnd: wallLen });
                }

                return (
                    <group key={side}>
                        {segments.map((seg, i) => {
                            if (seg.type === 'main') {
                                // Split at peak for 2-aguas roofs
                                let subSegs = [seg];
                                if (conf.type === '2-aguas' && seg.xStart < mid && seg.xEnd > mid) {
                                    subSegs = [
                                        { xStart: seg.xStart, xEnd: mid },
                                        { xStart: mid, xEnd: seg.xEnd }
                                    ];
                                }

                                return subSegs.map((s, j) => {
                                    const h1 = getWallHeight(s.xStart, wallLen, conf);
                                    const h2 = getWallHeight(s.xEnd, wallLen, conf);
                                    const sLen = s.xEnd - s.xStart;
                                    const offset = 0.075; // Half of wall thickness
                                    let p = [0, 0, 0], rot = [0, 0, 0];

                                    if (side === 'Norte') { p = [s.xStart + sLen / 2, 0, -offset]; rot = [0, 0, 0]; }
                                    else if (side === 'Sur') { p = [width - s.xStart - sLen / 2, 0, length + offset]; rot = [0, Math.PI, 0]; }
                                    else if (side === 'Oeste') { p = [-offset, 0, length - s.xStart - sLen / 2]; rot = [0, Math.PI / 2, 0]; }
                                    else if (side === 'Este') { p = [width + offset, 0, s.xStart + sLen / 2]; rot = [0, -Math.PI / 2, 0]; }

                                    return <WallSegment key={`main-${i}-${j}`} xStart={0} xEnd={sLen} h1={h1} h2={h2} material={mat} position={p} rotation={rot} />;
                                });
                            } else if (seg.type === 'hall') {
                                const r = seg.recess;
                                const hB = getWallHeight(r.x + r.width / 2, wallLen, conf);
                                const offset = 0.075; // Half of wall thickness
                                let pB = [0, 0, 0], rB = [0, 0, 0], pL = [0, 0, 0], rL = [0, 0, 0], pR = [0, 0, 0], rR = [0, 0, 0];

                                if (side === 'Norte') {
                                    pB = [r.x + r.width / 2, 0, r.depth - offset]; rB = [0, 0, 0];
                                    pL = [r.x - offset, 0, r.depth / 2]; rL = [0, Math.PI / 2, 0];
                                    pR = [r.x + r.width + offset, 0, r.depth / 2]; rR = [0, -Math.PI / 2, 0];
                                } else if (side === 'Sur') {
                                    pB = [width - (r.x + r.width / 2), 0, length - r.depth + offset]; rB = [0, Math.PI, 0];
                                    pL = [width - (r.x + r.width) + offset, 0, length - r.depth / 2]; rL = [0, -Math.PI / 2, 0];
                                    pR = [width - r.x - offset, 0, length - r.depth / 2]; rR = [0, Math.PI / 2, 0];
                                }

                                return (
                                    <group key={`hall-${i}`}>
                                        <WallSegment xStart={0} xEnd={r.width} h1={r.height || hB} h2={r.height || hB} material={mat} position={pB} rotation={rB} />
                                        <WallSegment xStart={0} xEnd={r.depth} h1={r.height || hB} h2={r.height || hB} material={mat} position={pL} rotation={rL} />
                                        <WallSegment xStart={0} xEnd={r.depth} h1={r.height || hB} h2={r.height || hB} material={mat} position={pR} rotation={rR} />
                                    </group>
                                );
                            }
                            return null;
                        })}
                    </group>
                );
            })}

            {interiorWalls.map(w => (
                <mesh key={w.id} position={[w.x, 1.22, w.y]} rotation={[0, w.isVertical ? 0 : Math.PI / 2, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.08, 2.44, w.length]} /><meshStandardMaterial color={INT_WALL_COLOR} />
                </mesh>
            ))}

            {/* OVERHAULED ROOF AND BEAMS SYSTEM */}
            {(() => {
                // Ensure dimensional values are numbers to prevent string concatenation
                const W = Number(width);
                const L = Number(length);
                const offset = Number(beamOffset);

                // Helper to get interpolated height at any x, z on the house plan
                const getPointHeight = (px, pz) => {
                    const hN = Number(getWallHeight(px, W, facadeConfigs.Norte));
                    const hS = Number(getWallHeight(px, W, facadeConfigs.Sur));
                    // Linear interpolation between North (z=0) and South (z=L)
                    const t = Math.max(0, Math.min(1, pz / L));
                    return hN * (1 - t) + hS * t;
                };

                const roofMeshes = [];
                const structuralBeams = [];

                // Determine structure type from primary facade configs
                const is2Aguas = facadeConfigs.Norte.type === '2-aguas' || facadeConfigs.Sur.type === '2-aguas';

                const BEAM_H = 0.16;
                const BEAM_W = 0.08;

                if (showRoofPlates) {
                    // Create roof geometry that perfectly connects the points
                    if (is2Aguas) {
                        const mid = W / 2;

                        // Left Section
                        const leftGeom = new THREE.BufferGeometry();
                        const leftVerts = new Float32Array([
                            0, getPointHeight(0, 0), 0,
                            mid, getPointHeight(mid, 0), 0,
                            mid, getPointHeight(mid, L), L,

                            0, getPointHeight(0, 0), 0,
                            mid, getPointHeight(mid, L), L,
                            0, getPointHeight(0, L), L
                        ]);
                        leftGeom.setAttribute('position', new THREE.BufferAttribute(leftVerts, 3));
                        leftGeom.computeVertexNormals();
                        // Position roof plate ON TOP of the beams (BEAM_H)
                        roofMeshes.push(
                            <mesh key="roof-l" geometry={leftGeom} position={[0, BEAM_H + offset, 0]} castShadow receiveShadow>
                                <meshStandardMaterial color={ROOF_PLATE_COLOR} side={THREE.DoubleSide} />
                            </mesh>
                        );

                        // Right Section
                        const rightGeom = new THREE.BufferGeometry();
                        const rightVerts = new Float32Array([
                            mid, getPointHeight(mid, 0), 0,
                            W, getPointHeight(W, 0), 0,
                            W, getPointHeight(W, L), L,

                            mid, getPointHeight(mid, 0), 0,
                            W, getPointHeight(W, L), L,
                            mid, getPointHeight(mid, L), L
                        ]);
                        rightGeom.setAttribute('position', new THREE.BufferAttribute(rightVerts, 3));
                        rightGeom.computeVertexNormals();
                        roofMeshes.push(
                            <mesh key="roof-r" geometry={rightGeom} position={[0, BEAM_H + offset, 0]} castShadow receiveShadow>
                                <meshStandardMaterial color={ROOF_PLATE_COLOR} side={THREE.DoubleSide} />
                            </mesh>
                        );
                    } else {
                        // Single slope Section
                        const slopedGeom = new THREE.BufferGeometry();
                        const verts = new Float32Array([
                            0, getPointHeight(0, 0), 0,
                            W, getPointHeight(W, 0), 0,
                            W, getPointHeight(W, L), L,

                            0, getPointHeight(0, 0), 0,
                            W, getPointHeight(W, L), L,
                            0, getPointHeight(0, L), L
                        ]);
                        slopedGeom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
                        slopedGeom.computeVertexNormals();
                        roofMeshes.push(
                            <mesh key="roof-sloped" geometry={slopedGeom} position={[0, BEAM_H + offset, 0]} castShadow receiveShadow>
                                <meshStandardMaterial color={ROOF_PLATE_COLOR} side={THREE.DoubleSide} />
                            </mesh>
                        );
                    }
                }

                if (showBeams) {
                    const step = 1.22;
                    const count = Math.ceil(L / step) + 1;

                    for (let i = 0; i < count; i++) {
                        const z = Math.min(i * step, L);

                        if (is2Aguas) {
                            const mid = W / 2;
                            const hStart = getPointHeight(0, z);
                            const hMid = getPointHeight(mid, z);
                            const hEnd = getPointHeight(W, z);

                            // Left rafter: center at average height + half beam height to rest on wall
                            const lenL = Math.sqrt(Math.pow(mid, 2) + Math.pow(hMid - hStart, 2));
                            const angL = Math.atan2(hMid - hStart, mid);
                            structuralBeams.push(
                                <GenericBeam key={`beam-l-${i}`} l={lenL} w={BEAM_W} h={BEAM_H}
                                    pos={[mid / 2, (hStart + hMid) / 2 + offset + BEAM_H / 2, z]}
                                    rot={[0, 0, angL]} />
                            );

                            // Right rafter
                            const lenR = Math.sqrt(Math.pow(mid, 2) + Math.pow(hMid - hEnd, 2));
                            const angR = Math.atan2(hMid - hEnd, mid);
                            structuralBeams.push(
                                <GenericBeam key={`beam-r-${i}`} l={lenR} w={BEAM_W} h={BEAM_H}
                                    pos={[mid + mid / 2, (hEnd + hMid) / 2 + offset + BEAM_H / 2, z]}
                                    rot={[0, 0, -angR]} />
                            );
                        } else {
                            // Unified sloped rafter
                            const h0 = getPointHeight(0, z);
                            const hW = getPointHeight(W, z);
                            const len = Math.sqrt(Math.pow(W, 2) + Math.pow(hW - h0, 2));
                            const ang = Math.atan2(hW - h0, W);
                            // Position center at (average wall height) + (half beam height) to SIT ON TOP
                            structuralBeams.push(
                                <GenericBeam key={`beam-s-${i}`} l={len} w={BEAM_W} h={BEAM_H}
                                    pos={[W / 2, (h0 + hW) / 2 + offset + BEAM_H / 2, z]}
                                    rot={[0, 0, ang]} />
                            );
                        }
                    }

                    // Ridge beam if 2-aguas
                    if (is2Aguas) {
                        const mid = W / 2;
                        const hRidgeStart = getPointHeight(mid, 0);
                        const hRidgeEnd = getPointHeight(mid, L);
                        const ridgeLen = Math.sqrt(Math.pow(L, 2) + Math.pow(hRidgeEnd - hRidgeStart, 2));
                        const ridgeAng = Math.atan2(hRidgeEnd - hRidgeStart, L);
                        // Center is 10cm higher than wall mid to sit correctly
                        structuralBeams.push(
                            <GenericBeam key="ridge-beam" l={ridgeLen} w={0.2} h={0.2}
                                pos={[mid, (hRidgeStart + hRidgeEnd) / 2 + offset + 0.1, L / 2]}
                                rot={[ridgeAng, Math.PI / 2, 0]} />
                        );
                    }
                }

                return (
                    <group>
                        {structuralBeams}
                        {roofMeshes}
                    </group>
                );
            })()}


            {openings.map(op => <Opening3D key={op.id} opening={op} dimensions={dimensions} project={project} />)}
        </group>
    );
};

const Viewer3D = () => {
    const { dimensions, openings, facadeConfigs, interiorWalls, showBeams, showRoofPlates, project, addSnapshot, beamOffset, setBeamOffset } = useStore();
    const canvasRef = React.useRef();
    const [captured, setCaptured] = React.useState(false);

    const handleCapture = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current.querySelector('canvas');
        if (canvas) {
            const img = canvas.toDataURL('image/jpeg', 0.9);
            addSnapshot(img);
            setCaptured(true);
            setTimeout(() => setCaptured(false), 2000);
        }
    };

    return (
        <div id="viewer-3d-container" ref={canvasRef} className="w-full h-full bg-slate-100 rounded-[40px] overflow-hidden border border-slate-200 shadow-inner relative group">
            <Canvas
                shadows
                camera={{ position: [12, 10, 12], fov: 35 }}
                gl={{
                    preserveDrawingBuffer: true,
                    antialias: true,
                    alpha: false,
                    powerPreference: "high-performance"
                }}
                dpr={[1, 2]}
            >
                <ambientLight intensity={0.8} />
                <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
                <HouseModel dimensions={dimensions} openings={openings} facadeConfigs={facadeConfigs} interiorWalls={interiorWalls} showBeams={showBeams} showRoofPlates={showRoofPlates} project={project} beamOffset={beamOffset} />
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
                <ContactShadows opacity={0.25} scale={40} blur={2} far={10} position={[0, -0.01, 0]} />
            </Canvas>

            {/* Float Capture Button */}
            <button
                onClick={handleCapture}
                className={`absolute bottom-6 right-6 p-4 rounded-2xl shadow-xl transition-all flex items-center gap-2 group/btn ${captured
                    ? 'bg-emerald-500 text-white translate-y-0 opacity-100 scale-100'
                    : 'bg-white/80 backdrop-blur-md text-slate-800 hover:bg-slate-900 hover:text-white lg:translate-y-4 lg:opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
                    }`}
            >
                {captured ? <Check size={20} /> : <Camera size={20} />}
                <span className="text-[10px] font-black uppercase tracking-widest overflow-hidden whitespace-nowrap transition-all w-0 group-hover/btn:w-20">
                    {captured ? 'Capturado' : 'Captura 3D'}
                </span>
            </button>
        </div>
    );
};
export default Viewer3D;
