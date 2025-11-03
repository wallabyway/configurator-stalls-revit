import React, { useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { COLORS, Stalls, GridFloor } from "./3d-components";
import { ConfiguratorPanel } from "./web-ui";

function Lighting({ lightPosition }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[lightPosition, 100, lightPosition]}
        castShadow
        intensity={1.5}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-camera-near={0.5}
        shadow-camera-far={400}
        shadow-bias={-0.0005}
      />
    </>
  );
}

function Scene({ numStalls, doorWidth, lightPosition, swingOutward, hoverInfo, setHoverInfo, wireframe }) {
  const selectionRef = useRef();

  // Leader line points for elbow shape (angled along normal, then vertical)
  const getLeaderPoints = () => {
    if (!hoverInfo) return null;
    const start = hoverInfo.pos.clone();
    const normal = hoverInfo.normal || new THREE.Vector3(0, 1, 0);
    
    // Elbow point: follow the surface normal direction
    const elbow = start.clone();
    const normalOffset = normal.clone().multiplyScalar(40); // extend along normal
    elbow.add(normalOffset);
    elbow.y += 20; // also raise a bit
    
    // End point: go straight up from elbow
    const end = elbow.clone();
    end.y += 40; // raise label higher
    
    return { start, elbow, end };
  };

  const leaderPoints = getLeaderPoints();
  const labelWorld = leaderPoints?.end;

  return (
    <>
      <OrbitControls enablePan enableZoom enableRotate />
      
      {/* Lighting */}
      <Lighting lightPosition={lightPosition} />

      {/* Ground plane - clear hover when pointer hits it */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow 
        position={[0, 0, 0]}
        onPointerOver={() => {
          setHoverInfo(null);
        }}
      >
        <planeGeometry args={[10000, 10000]} />
        <meshStandardMaterial color={COLORS.plane} />
      </mesh>

      {/* Grid overlay */}
      <GridFloor size={10000} divisions={200} color="#ffffff" />

      {/* Main stall geometry */}
      <Stalls
        numStalls={numStalls}
        doorWidth={doorWidth}
        swingOutward={swingOutward}
        setHoverInfo={setHoverInfo}
        selectionGroupRef={selectionRef}
        wireframe={wireframe}
      />

      {/* Hover leader line (elbow shape) + pill tooltip */}
      {hoverInfo && leaderPoints && labelWorld && (
        <>
          <Line
            points={[leaderPoints.start, leaderPoints.elbow, leaderPoints.end]}
            color="white"
            lineWidth={2}
            renderOrder={20}
          />
          <Html position={labelWorld} center zIndexRange={[10, 0]}>
            <div className="pointer-events-none select-none rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-black shadow-lg ring-1 ring-black/20">
              {hoverInfo.type === "stall" ? "Stall" : hoverInfo.type === "alcove" ? "Alcove" : "Wall"}
            </div>
          </Html>
        </>
      )}
    </>
  );
}

export default function Viewer() {
  const [numStalls, setNumStalls] = useState(5);
  const [doorWidth, setDoorWidth] = useState(20);
  const [lightPosition, setLightPosition] = useState(50);
  const [swingOutward, setSwingOutward] = useState(true);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [wireframe, setWireframe] = useState(false);

  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-100 p-4">
      <div className="mx-auto grid h-full max-w-7xl grid-cols-1 gap-4 md:grid-cols-[1fr_280px]">
        <div className="relative rounded-2xl ring-1 ring-white/10 overflow-hidden">
          <Canvas
            shadows
            camera={{ fov: 60, position: [0, 140, 260], far: 20000 }}
            onCreated={({ gl }) => gl.setClearColor(COLORS.bg)}
            onPointerMissed={() => {
              setHoverInfo(null);
            }}
          >
            <Scene 
              numStalls={numStalls} 
              doorWidth={doorWidth} 
              lightPosition={lightPosition}
              swingOutward={swingOutward}
              hoverInfo={hoverInfo}
              setHoverInfo={setHoverInfo}
              wireframe={wireframe}
            />
          </Canvas>
        </div>

        <ConfiguratorPanel
          numStalls={numStalls}
          setNumStalls={setNumStalls}
          doorWidth={doorWidth}
          setDoorWidth={setDoorWidth}
          lightPosition={lightPosition}
          setLightPosition={setLightPosition}
          swingOutward={swingOutward}
          setSwingOutward={setSwingOutward}
          wireframe={wireframe}
          setWireframe={setWireframe}
        />
      </div>
    </div>
  );
}

