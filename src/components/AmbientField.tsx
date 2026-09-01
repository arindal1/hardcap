"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 520;

function buildField(spread: number, depth: number) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = (Math.random() - 0.5) * depth;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

/** Slow gold dust field, parallaxing gently toward the pointer. */
function DriftingField() {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const near = useMemo(() => buildField(14, 7), []);
  const far = useMemo(() => buildField(9, 4), []);

  useFrame((state) => {
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = t * 0.02;
    group.current.rotation.x = Math.sin(t * 0.06) * 0.06;
    group.current.position.x += (pointer.current.x * 0.4 - group.current.position.x) * 0.02;
    group.current.position.y += (pointer.current.y * 0.25 - group.current.position.y) * 0.02;
  });

  return (
    <group ref={group}>
      <points geometry={near}>
        <pointsMaterial color="#d8b673" size={0.022} transparent opacity={0.4} sizeAttenuation />
      </points>
      <points geometry={far} position={[0, 0, 1]}>
        <pointsMaterial color="#e8ca8f" size={0.014} transparent opacity={0.25} sizeAttenuation />
      </points>
    </group>
  );
}

/** Ambient, low-motion WebGL backdrop. Respects prefers-reduced-motion by not rendering at all. */
export function AmbientField() {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-70">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
        <DriftingField />
      </Canvas>
    </div>
  );
}