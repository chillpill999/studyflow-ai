'use client';

import React, { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useStore } from 'src/store/useStore';

export const ThreeDebugOverlay: React.FC = () => {
  const { performanceProfile } = useStore();
  const { gl } = useThree();
  
  const [fps, setFps] = useState(60);
  const [drawCalls, setDrawCalls] = useState(0);
  const [triangles, setTriangles] = useState(0);

  // FPS calculation
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    let lastTime = performance.now();
    let frameCount = 0;
    let animId: number;

    const tick = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;

        // Pull active render metrics from WebGL renderer info object
        setDrawCalls(gl.info.render.calls);
        setTriangles(gl.info.render.triangles);
      }
      
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [gl]);

  // Hide completely in production builds
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 p-4 rounded-xl border border-white/20 bg-purple-950/80 text-white font-mono text-[10px] space-y-1 shadow-2xl backdrop-blur-md pointer-events-none select-none">
      <div className="font-bold text-[#B998D2] border-b border-white/10 pb-1 mb-1.5 uppercase tracking-wider">
        WebGL Performance
      </div>
      <div>FPS: <span className="font-semibold text-green-400">{fps}</span></div>
      <div>Draw Calls: <span className="font-semibold text-blue-300">{drawCalls}</span></div>
      <div>Triangles: <span className="font-semibold text-yellow-300">{triangles.toLocaleString()}</span></div>
      <div>Active Profile: <span className="font-semibold text-purple-300">{performanceProfile}</span></div>
      <div>VRAM Geoms: <span className="font-semibold text-purple-300">{gl.info.memory.geometries}</span></div>
    </div>
  );
};
export default ThreeDebugOverlay;
