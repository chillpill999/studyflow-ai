'use client';

import React, { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from 'src/store/useStore';
import { renderQueue, RenderTaskPriority } from 'src/lib/three/renderQueue';

export const RenderScheduler: React.FC = () => {
  const { performanceProfile } = useStore();
  const { invalidate } = useThree();

  // Synchronize Zustand performance states with the Prioritized Render Queue limits
  useEffect(() => {
    let priorityLimit: RenderTaskPriority = 4;
    
    if (performanceProfile === 'reducedMotion') {
      priorityLimit = 1;
    } else if (performanceProfile === 'low') {
      priorityLimit = 2;
    } else if (performanceProfile === 'medium') {
      priorityLimit = 3;
    }
    
    renderQueue.setMaxPriority(priorityLimit);
    
    // Invalidate scene immediately to apply quality changes
    invalidate();
  }, [performanceProfile, invalidate]);

  // Execute registered rendering queues on every R3F frame update
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    renderQueue.executeAll(delta, time);
  });

  return null; // Headless component
};
export default RenderScheduler;
