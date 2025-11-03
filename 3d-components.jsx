import React, { useMemo, useRef, useCallback } from "react";
import { Edges, Line } from "@react-three/drei";
import * as THREE from "three";

// ====== Colors (high contrast) ======
export const COLORS = {
  bg: "#0f172a",            // slate-900
  plane: "#64748b",         // slate-500 (lighter for visible shadows)
  partition: "#e5e7eb",     // gray-200
  door: "#22d3ee",          // cyan-400
  back: "#f8fafc",          // slate-50
  edges: "#000000",
  hoverFill: "#ffffff",
};

// ====== Geometry constants ======
export const GEOMETRY = {
  t: 2,              // partition thickness
  wallT: 4,          // wall thickness
  depth: 60,         // stall depth
  stallH: 80,        // stall height
  doorH: 70,         // door height
  doorGap: 10,       // gap below door
  alcoveW: 36,       // alcove width
};

// ====== Simple Grid Floor ======
export function GridFloor({ size = 2000, divisions = 100, color = "#ffffff" }) {
  const gridGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const halfSize = size / 2;
    const step = size / divisions;

    // Create grid lines
    for (let i = 0; i <= divisions; i++) {
      const pos = -halfSize + i * step;
      
      // Horizontal lines (along X axis)
      vertices.push(-halfSize, 0, pos);
      vertices.push(halfSize, 0, pos);
      
      // Vertical lines (along Z axis)
      vertices.push(pos, 0, -halfSize);
      vertices.push(pos, 0, halfSize);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, [size, divisions]);

  return (
    <lineSegments geometry={gridGeometry} position={[0, 0.5, 0]}>
      <lineBasicMaterial color={color} opacity={0.3} transparent depthWrite={false} />
    </lineSegments>
  );
}

// ====== Door swing arc on ground ======
export function DoorSwingArc({ position, doorWidth, swingOutward }) {
  const arcPoints = useMemo(() => {
    const points = [];
    const radius = doorWidth; // door width is the swing radius
    const segments = 32;
    
    let startAngle, endAngle;
    if (swingOutward) {
      // Swing outward (toward viewer)
      startAngle = 0; // start pointing right (door closed, along stall front)
      endAngle = Math.PI / 2; // end pointing outward (door open, 90 degrees)
    } else {
      // Swing inward (into stall)
      startAngle = 0; // start pointing right (door closed, along stall front)
      endAngle = -Math.PI / 2; // end pointing inward (door open, -90 degrees)
    }
    
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / segments);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, 0, z));
    }
    
    return points;
  }, [doorWidth, swingOutward]);

  return (
    <group position={position}>
      <Line
        points={arcPoints}
        color="white"
        lineWidth={3}
        renderOrder={5}
      />
    </group>
  );
}

// ====== One logical element (box + default thin edges) ======
export function BoxElement({
  name,
  size,
  pos,
  color,
  onPointerOver,
  castShadow = true,
  receiveShadow = true,
  wireframe = false,
}) {
  return (
    <group position={pos}>
      <mesh
        name={name}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver?.(e);
        }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} wireframe={wireframe} />
        {/* Thin, always-on edges for high-contrast readability */}
        {!wireframe && (
          <Edges
            threshold={15}
            color={COLORS.edges}
            scale={1.001}
            renderOrder={10}
          />
        )}
      </mesh>
    </group>
  );
}

/** Build the whole layout (alcove + N stalls + back wall) with only boxes */
export function Stalls({
  numStalls,
  doorWidth,
  swingOutward,
  setHoverInfo,
  selectionGroupRef,
  wireframe = false,
}) {
  const { t, wallT, depth, stallH, doorH, doorGap, alcoveW } = GEOMETRY;

  const { meshes, doorSwings, centerX } = useMemo(() => {
    const out = [];
    const doorPositions = [];
    let curX = 0;

    // Left building wall (always)
    out.push({
      key: "wall-left",
      type: "wall",
      size: [wallT, stallH, depth],
      pos: [curX - wallT / 2, stallH / 2, -depth / 2],
      color: COLORS.partition,
    });

    // Alcove partition
    curX += alcoveW;
    out.push({
      key: "alcove-partition",
      type: "alcove",
      size: [t, stallH, depth],
      pos: [curX + t / 2, stallH / 2, -depth / 2],
      color: COLORS.partition,
    });

    curX += t;

    // Stalls (door + partition per stall)
    for (let i = 0; i < numStalls; i++) {
      const doorX = curX + doorWidth / 2;
      out.push({
        key: `door-${i}`,
        type: "stall",
        size: [doorWidth, doorH, 1],
        pos: [doorX, doorGap + doorH / 2, -depth],
        color: COLORS.door,
      });

      // Track door swing position (on ground, at left edge of door)
      doorPositions.push({
        key: `swing-${i}`,
        pos: [doorX - doorWidth / 2, 0.2, -depth],
      });

      curX += doorWidth;
      out.push({
        key: `partition-${i}`,
        type: "stall",
        size: [t, stallH, depth],
        pos: [curX + t / 2, stallH / 2, -depth / 2],
        color: COLORS.partition,
      });

      curX += t;
    }

    const totalInteriorW = alcoveW + numStalls * doorWidth + numStalls * t;

    // Back wall across alcove + stalls
    out.push({
      key: "back-wall",
      type: "wall",
      size: [totalInteriorW, stallH, t],
      pos: [totalInteriorW / 2, stallH / 2, -t / 2],
      color: COLORS.partition,
    });

    const cx = (alcoveW + numStalls * doorWidth) / 2;
    return { meshes: out, doorSwings: doorPositions, centerX: cx };
  }, [numStalls, doorWidth, t, wallT, depth, stallH, doorH, doorGap, alcoveW]);

  // Pointer handlers
  const onOver = useCallback(
    (e, m) => {
      e.stopPropagation(); // Stop event from hitting other elements
      const worldPos = e.eventObject.getWorldPosition(new THREE.Vector3());
      // Get the face normal in world space
      const normal = e.face ? e.face.normal.clone() : new THREE.Vector3(0, 1, 0);
      const worldNormal = normal.transformDirection(e.object.matrixWorld).normalize();
      
      setHoverInfo({
        key: m.key,
        type: m.type,
        pos: worldPos.clone(), // where the leader line starts
        normal: worldNormal, // surface normal for leader line direction
      });
    },
    [setHoverInfo]
  );

  const onOut = useCallback(() => {
    // Clear hover state when leaving the entire group
    setHoverInfo(null);
  }, [setHoverInfo]);

  // Position group to keep centered
  return (
    <group 
      ref={selectionGroupRef} 
      position={[-centerX, 0, 0]}
      onPointerLeave={onOut}
    >
      {meshes.map((m) => (
        <BoxElement
          key={m.key}
          name={m.key}
          size={m.size}
          pos={m.pos}
          color={m.color}
          onPointerOver={(e) => onOver(e, m)}
          wireframe={wireframe}
        />
      ))}
      {doorSwings.map((swing) => (
        <DoorSwingArc
          key={swing.key}
          position={swing.pos}
          doorWidth={doorWidth}
          swingOutward={swingOutward}
        />
      ))}
    </group>
  );
}

