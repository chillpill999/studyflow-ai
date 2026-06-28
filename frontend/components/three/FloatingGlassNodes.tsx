'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { sphereGeometry, torusGeometry, icosahedronGeometry } from 'src/lib/three/geometries';
import { frostedGlassMaterial, pearlMetalMaterial, transparentCrystalMaterial } from 'src/lib/three/materials';
import { renderQueue } from 'src/lib/three/renderQueue';

export const FloatingGlassNodes: React.FC = () => {
  const meshRefs = useRef<Array<THREE.Mesh | null>>([]);

  const nodesData = useMemo(() => [
    { geometry: sphereGeometry, material: frostedGlassMaterial, position: [-2.5, 1.5, -2], scale: 1.2, speed: 0.3, phase: 0 },
    { geometry: torusGeometry, material: pearlMetalMaterial, position: [3, -2, -1], scale: 1.5, speed: 0.2, phase: Math.PI / 4 },
    { geometry: icosahedronGeometry, material: transparentCrystalMaterial, position: [-3, -1.8, -3], scale: 1.4, speed: 0.4, phase: Math.PI / 2 },
    { geometry: sphereGeometry, material: frostedGlassMaterial, position: [2.8, 2, -2], scale: 1.0, speed: 0.25, phase: Math.PI },
  ], []);

  useEffect(() => {
    const taskId = 'floating-glass-nodes';

    renderQueue.registerTask(taskId, 4, (delta, time) => {
      nodesData.forEach((node, idx) => {
        const mesh = meshRefs.current[idx];
        if (!mesh) return;

        // Oscillate height gently
        mesh.position.y = node.position[1] + Math.sin(time * node.speed + node.phase) * 0.4;
        
        // Wrap slow rotation
        mesh.rotation.x += 0.1 * delta;
        mesh.rotation.y += 0.15 * delta;
      });
    });

    return () => {
      renderQueue.removeTask(taskId);
    };
  }, [nodesData]);

  return (
    <group>
      {nodesData.map((node, idx) => (
        <mesh
          key={idx}
          ref={(el) => { meshRefs.current[idx] = el; }}
          geometry={node.geometry}
          material={node.material}
          position={node.position as [number, number, number]}
          scale={node.scale}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
};
export default FloatingGlassNodes;
