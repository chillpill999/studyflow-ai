'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, View } from '@react-three/drei';
import { useStore } from 'src/store/useStore';
import { ENGINE_CONFIG } from 'src/lib/three/config';
import { detectCapabilities } from 'src/lib/three/capabilities';
import { PerformanceManager } from './PerformanceManager';
import { RenderScheduler } from './RenderScheduler';
import { CameraController } from './CameraController';
import { PostProcessing } from './PostProcessing';
import { AssetPreloader } from './AssetPreloader';
import { ThreeDebugOverlay } from './ThreeDebugOverlay';

interface SceneManagerProps {
  children?: React.ReactNode;
}

export const SceneManager: React.FC<SceneManagerProps> = ({ children }) => {
  const { performanceProfile, theme } = useStore();
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [assetsLoaded, setAssetsLoaded] = useState<boolean>(false);

  // Check WebGL support on mount
  useEffect(() => {
    const caps = detectCapabilities();
    const timer = setTimeout(() => {
      setWebglSupported(caps.webgl2);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Synchronize Three.js materials with theme
  useEffect(() => {
    import('src/lib/three/materials').then(({ glassGlowMaterial, pearlMetalMaterial, frostedGlassMaterial }) => {
      const glassGlow = glassGlowMaterial.clone();
      const pearlMetal = pearlMetalMaterial.clone();
      const frostedGlass = frostedGlassMaterial.clone();
      if (theme === 'dark') {
        glassGlow.color.set('#3B82F6');
        glassGlow.emissive.set('#60A5FA');
        glassGlow.emissiveIntensity = 2.0;
        pearlMetal.color.set('#2E1E4E');
        frostedGlass.color.set('#1E1035');
        frostedGlass.opacity = 0.6;
      } else if (theme === 'light') {
        glassGlow.color.set('#A78BFA');
        glassGlow.emissive.set('#C084FC');
        glassGlow.emissiveIntensity = 0.8;
        pearlMetal.color.set('#F3EEF6');
        frostedGlass.color.set('#FFFFFF');
        frostedGlass.opacity = 0.9;
      } else { // pearl
        glassGlow.color.set('#8B5CF6');
        glassGlow.emissive.set('#7C3AED');
        glassGlow.emissiveIntensity = 1.5;
        pearlMetal.color.set('#F0E6F2');
        frostedGlass.color.set('#FFFFFF');
        frostedGlass.opacity = 0.8;
      }
      Object.assign(glassGlowMaterial, glassGlow);
      Object.assign(pearlMetalMaterial, pearlMetal);
      Object.assign(frostedGlassMaterial, frostedGlass);
    });
  }, [theme]);

  // WebGL Fallback layout if unsupported
  if (!webglSupported) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#FDFCFB] via-[#F7F1F8] to-[#D8BFD8] pointer-events-none z-0">
        {/* Soft static blur spots */}
        <div className="absolute top-[20%] left-[10%] w-[35vw] h-[35vw] rounded-full bg-[#B998D2]/10 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[#E8D7EA]/30 blur-[130px]" />
      </div>
    );
  }

  const dprLimit = ENGINE_CONFIG.QUALITY_PROFILES[performanceProfile].maxDPR;

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* Performance monitoring scripts */}
      <PerformanceManager />
      
      {/* Frosted loading screen */}
      {!assetsLoaded && (
        <AssetPreloader onComplete={() => setAssetsLoaded(true)} />
      )}

      {/* Single shared global WebGL Canvas */}
      <Canvas
        flat
        shadows
        gl={{ 
          antialias: performanceProfile !== 'low', 
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
        dpr={[0.75, dprLimit]}
        camera={{
          fov: ENGINE_CONFIG.CAMERA.fov,
          near: ENGINE_CONFIG.CAMERA.near,
          far: ENGINE_CONFIG.CAMERA.far,
          position: ENGINE_CONFIG.CAMERA.defaultPosition
        }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          {/* Shared lighting rig */}
          <ambientLight 
            intensity={ENGINE_CONFIG.LIGHTS.ambient.intensity} 
            color={ENGINE_CONFIG.LIGHTS.ambient.color} 
          />
          <hemisphereLight
            intensity={ENGINE_CONFIG.LIGHTS.hemisphere.intensity}
            color={ENGINE_CONFIG.LIGHTS.hemisphere.skyColor}
            groundColor={ENGINE_CONFIG.LIGHTS.hemisphere.groundColor}
          />
          <directionalLight
            castShadow={performanceProfile !== 'low'}
            intensity={ENGINE_CONFIG.LIGHTS.directional.intensity}
            color={ENGINE_CONFIG.LIGHTS.directional.color}
            position={ENGINE_CONFIG.LIGHTS.directional.position}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          />

          {/* Core scene components */}
          <CameraController />
          <RenderScheduler />
          <PostProcessing />
          <ThreeDebugOverlay />

          {/* Children views rendered via Drei's View portals */}
          {children}
          <View.Port />

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
};
export default SceneManager;
