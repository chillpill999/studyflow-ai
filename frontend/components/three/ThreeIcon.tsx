'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { View } from '@react-three/drei';
import * as THREE from 'three';
import { 
  boxGeometry,
  sphereGeometry,
  torusGeometry,
  torusKnotGeometry,
  icosahedronGeometry,
  capsuleGeometry
} from 'src/lib/three/geometries';
import { 
  pearlMetalMaterial,
  frostedGlassMaterial,
  goldMetallicMaterial,
  glassGlowMaterial,
  transparentCrystalMaterial,
  accentMaterial
} from 'src/lib/three/materials';
import { handlePointerOver, handlePointerOut } from 'src/lib/three/events';
import { useStore } from 'src/store/useStore';
import { detectCapabilities } from 'src/lib/three/capabilities';

interface ThreeIconProps {
  name: 'Book' | 'Chat' | 'Upload' | 'Flashcard' | 'Brain' | 'Mind Map' | 'Quiz' | 'Planner' | 'Analytics' | 'Profile' | 'Settings';
  trackRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

const ThreeIconInner: React.FC<ThreeIconProps> = ({ name, trackRef, className = '' }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { performanceProfile } = useStore();

  // Map geometries and materials based on icon type
  const { geometry, material } = React.useMemo(() => {
    switch (name) {
      case 'Book':
        return { geometry: boxGeometry, material: pearlMetalMaterial };
      case 'Chat':
        return { geometry: capsuleGeometry, material: frostedGlassMaterial };
      case 'Upload':
        return { geometry: torusKnotGeometry, material: goldMetallicMaterial };
      case 'Flashcard':
        return { geometry: boxGeometry, material: transparentCrystalMaterial };
      case 'Brain':
        return { geometry: icosahedronGeometry, material: glassGlowMaterial };
      case 'Mind Map':
        return { geometry: torusGeometry, material: accentMaterial };
      case 'Quiz':
        return { geometry: torusKnotGeometry, material: pearlMetalMaterial };
      case 'Planner':
        return { geometry: boxGeometry, material: goldMetallicMaterial };
      case 'Analytics':
        return { geometry: icosahedronGeometry, material: transparentCrystalMaterial };
      case 'Profile':
        return { geometry: sphereGeometry, material: pearlMetalMaterial };
      case 'Settings':
        return { geometry: torusGeometry, material: frostedGlassMaterial };
      default:
        return { geometry: sphereGeometry, material: pearlMetalMaterial };
    }
  }, [name]);

  // Frame-rate independent animation adjustments
  useFrame((state, delta) => {
    if (!meshRef.current || performanceProfile === 'reducedMotion') return;
    
    const mesh = meshRef.current;
    const time = state.clock.getElapsedTime();
    
    // Constant rotation
    mesh.rotation.y += 0.4 * delta;
    mesh.rotation.x = Math.sin(time * 0.5) * 0.2;

    // Hover elasticity scale
    const targetScale = hovered ? 1.25 : 1.0;
    mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
  });

  return (
    <View track={trackRef as React.RefObject<HTMLElement>} className={`w-full h-full ${className}`}>
      {/* Local lighting rig so that reflections stand out on materials */}
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#b998d2" />
      
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onPointerOver={(e) => {
          setHovered(true);
          handlePointerOver(e);
        }}
        onPointerOut={(e) => {
          setHovered(false);
          handlePointerOut(e);
        }}
        castShadow
        receiveShadow
      />
    </View>
  );
};

export const ThreeIcon: React.FC<ThreeIconProps> = ({ name, trackRef, className = '' }) => {
  const [webglSupported] = useState<boolean>(() => detectCapabilities().webgl2);

  if (!webglSupported) {
    return null;
  }

  return <ThreeIconInner name={name} trackRef={trackRef} className={className} />;
};

export default ThreeIcon;
