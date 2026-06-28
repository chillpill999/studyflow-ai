'use client';

import React, { useEffect, useRef } from 'react';
import { useStore } from 'src/store/useStore';
import { detectCapabilities } from 'src/lib/three/capabilities';

export const PerformanceManager: React.FC = () => {
  const { setPerformanceProfile, performanceProfile } = useStore();
  
  const frameTimes = useRef<number[]>([]);
  const lastTime = useRef<number>(0);
  const lowFpsCount = useRef<number>(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    lastTime.current = performance.now();
    // 1. Initial Capability Detection
    const caps = detectCapabilities();

    if (caps.reducedMotion) {
      setPerformanceProfile('reducedMotion');
    } else if (caps.batterySaver || caps.gpuTier === 'low') {
      setPerformanceProfile('low');
    } else if (caps.gpuTier === 'medium') {
      setPerformanceProfile('medium');
    } else {
      setPerformanceProfile('high');
    }

    // 2. Runtime FPS Monitoring (Only if 3D animations are active and not reduced motion)
    if (caps.reducedMotion) return;

    const monitorFPS = (now: number) => {
      const delta = now - lastTime.current;
      lastTime.current = now;

      // Calculate instantaneous FPS
      const fps = 1000 / delta;
      
      // Maintain rolling history of last 60 frames
      frameTimes.current.push(fps);
      if (frameTimes.current.length > 60) {
        frameTimes.current.shift();
      }

      // Every 1 second (approx 60 frames), evaluate performance
      if (frameTimes.current.length >= 60) {
        const avgFps = frameTimes.current.reduce((sum, val) => sum + val, 0) / frameTimes.current.length;
        
        // If FPS drops below 50, increment drop count
        if (avgFps < 50) {
          lowFpsCount.current += 1;
          
          // If low performance persists for 3 periods (~3 seconds)
          if (lowFpsCount.current >= 3) {
            // Downgrade quality dynamically
            if (performanceProfile === 'high') {
              setPerformanceProfile('medium');
              console.log('Three.js PerformanceManager: Downgrading to MEDIUM profile due to low FPS.');
            } else if (performanceProfile === 'medium') {
              setPerformanceProfile('low');
              console.log('Three.js PerformanceManager: Downgrading to LOW profile due to low FPS.');
            }
            lowFpsCount.current = 0;
            frameTimes.current = [];
          }
        } else {
          // Reset low FPS counters if rendering behaves healthy
          lowFpsCount.current = Math.max(0, lowFpsCount.current - 1);
        }
      }

      rafId.current = requestAnimationFrame(monitorFPS);
    };

    rafId.current = requestAnimationFrame(monitorFPS);

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [performanceProfile, setPerformanceProfile]);

  return null; // Headless component
};
export default PerformanceManager;
