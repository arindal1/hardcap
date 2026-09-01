"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function DriftingField() {
  const points = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!points.current) return;
    const t = state.clock.getElapsedTime();
    points.current.rotation.y = t * 0.015;
    points.current.rotation.x = Math.sin(t * 0.05) * 0.05;
  });

  const geometry = new THREE.BufferGeometry();
  const count = 400;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial color="#d8b673" size={0.02} transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

/** Ambient, low-motion WebGL backdrop. Respects prefers-reduced-motion by not rendering at all. */
export function AmbientField() {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        <DriftingField />
      </Canvas>
    </div>
  );
}