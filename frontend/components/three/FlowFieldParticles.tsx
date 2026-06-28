'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useStore } from 'src/store/useStore';
import { ENGINE_CONFIG } from 'src/lib/three/config';
import { sphereGeometry } from 'src/lib/three/geometries';
import { glassGlowMaterial } from 'src/lib/three/materials';
import { renderQueue } from 'src/lib/three/renderQueue';

export const FlowFieldParticles: React.FC = () => {
  const { performanceProfile } = useStore();
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Retrieve particle count from active performance profile
  const count = useMemo(() => {
    return ENGINE_CONFIG.QUALITY_PROFILES[performanceProfile].maxParticles;
  }, [performanceProfile]);

  const particles = useRef<Array<{
    position: THREE.Vector3;
    speed: number;
    phase: number;
    scale: number;
  }>>([]);

  useEffect(() => {
    const temp = [];
    for (let i = 0; i < 3000; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 5
        ),
        speed: 0.1 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
        scale: 0.02 + Math.random() * 0.04
      });
    }
    particles.current = temp;
  }, []);

  // Shared reusable Matrix4 instance to avoid garbage collection allocations
  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);

  // Register the rendering queue callback
  useEffect(() => {
    const taskId = 'flow-field-particles';

    renderQueue.registerTask(taskId, 3, (delta, time) => {
      if (!meshRef.current || particles.current.length === 0) return;

      const mesh = meshRef.current;
      
      for (let i = 0; i < count; i++) {
        const p = particles.current[i];
        if (!p) continue;
        
        // Dynamic flow mathematical vector offsets
        p.position.y += Math.sin(time * 0.5 + p.phase) * p.speed * delta;
        p.position.x += Math.cos(time * 0.3 + p.phase) * p.speed * delta * 0.5;
        
        // Wrap around boundaries to keep particles in viewport bounds
        if (p.position.y > 5) p.position.y = -5;
        if (p.position.y < -5) p.position.y = 5;
        if (p.position.x > 8) p.position.x = -8;
        if (p.position.x < -8) p.position.x = 8;

        // Formulate scaling and translation matrix
        dummyMatrix.makeScale(p.scale, p.scale, p.scale);
        dummyMatrix.setPosition(p.position);
        
        mesh.setMatrixAt(i, dummyMatrix);
      }
      
      mesh.instanceMatrix.needsUpdate = true;
    });

    return () => {
      renderQueue.removeTask(taskId);
    };
  }, [count, particles, dummyMatrix]);

  // If particles are disabled for low quality / reduced motion, render nothing
  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[sphereGeometry, glassGlowMaterial, count]}
      castShadow={false}
      receiveShadow={false}
    />
  );
};
export default FlowFieldParticles;
