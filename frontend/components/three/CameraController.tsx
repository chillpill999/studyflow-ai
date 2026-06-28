'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from 'src/store/useStore';
import { ENGINE_CONFIG } from 'src/lib/three/config';

export const CameraController: React.FC = () => {
  const { performanceProfile } = useStore();
  const targetCameraPos = useRef(new THREE.Vector3(...ENGINE_CONFIG.CAMERA.defaultPosition));

  useFrame((state) => {
    const { camera, pointer } = state;
    
    // Disable heavy camera swing motions on reducedMotion profile for accessibility
    if (performanceProfile === 'reducedMotion') {
      camera.position.set(0, 0, 8);
      camera.lookAt(0, 0, 0);
      return;
    }

    // Determine target based on mouse coordinates (parallax effect)
    const factorX = 1.2;
    const factorY = 1.0;
    targetCameraPos.current.set(
      pointer.x * factorX,
      pointer.y * factorY,
      8 // Keep default depth
    );

    // Smoothly lerp camera coordinates towards mouse position
    camera.position.lerp(targetCameraPos.current, 0.05);
    
    // Smoothly look at the origin point
    camera.lookAt(0, 0, 0);
  });

  return null;
};
export default CameraController;
