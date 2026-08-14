'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function BadgeCore() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.35;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
  });

  const points = useMemo(
    () => [
      [0, 0.18, 0.45],
      [0.35, -0.05, 0.22],
      [-0.28, 0.08, 0.3],
      [0.08, -0.32, 0.12],
    ],
    [],
  );

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.55} floatIntensity={0.75}>
        <mesh ref={mesh}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#f97316" emissive="#7c2d12" emissiveIntensity={0.55} metalness={0.35} roughness={0.2} />
        </mesh>
        {points.map((position, index) => (
          <Sphere key={index} args={[0.09, 16, 16]} position={position as [number, number, number]}>
            <meshStandardMaterial color="#38bdf8" emissive="#0f172a" emissiveIntensity={1.2} metalness={0.6} roughness={0.1} />
          </Sphere>
        ))}
        <Text position={[0, 1.35, 0]} fontSize={0.26} color="#f8fafc" anchorX="center" anchorY="middle" outlineColor="#020617" outlineWidth={0.01}>
          PoleSafe
        </Text>
        <Text position={[0, -1.15, 0]} fontSize={0.12} color="#cbd5e1" anchorX="center" anchorY="middle">
          Live safety network
        </Text>
      </Float>
    </group>
  );
}

export function FloatingSafetyBadge3D() {
  return (
    <div className="relative h-[280px] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.92))] sm:h-[340px] lg:h-[380px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.16),transparent_58%)]" />
      <Canvas
        className="!absolute inset-0"
        dpr={[1, 1.5]}
        frameloop="demand"
        camera={{ position: [0, 0.2, 4.5], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#020617', 0);
        }}
      >
        <ambientLight intensity={0.95} />
        <directionalLight position={[3, 3, 3]} intensity={1.6} color="#ffffff" />
        <pointLight position={[-3, -2, 2]} intensity={2.2} color="#38bdf8" />
        <Suspense fallback={null}>
          <BadgeCore />
        </Suspense>
      </Canvas>
      <noscript>
        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
          PoleSafe safety badge preview. Enable JavaScript for the interactive 3D view.
        </div>
      </noscript>
    </div>
  );
}
