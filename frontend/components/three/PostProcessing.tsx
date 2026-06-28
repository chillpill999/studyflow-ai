'use client';

import React from 'react';
import { useStore } from 'src/store/useStore';
import { ENGINE_CONFIG } from 'src/lib/three/config';

export const PostProcessing: React.FC = () => {
  const { performanceProfile } = useStore();
  const profile = ENGINE_CONFIG.QUALITY_PROFILES[performanceProfile];

  // If bloom or vignette is enabled via quality profile settings
  const showEffects = profile.enableBloom;

  return (
    <>
      {/* 
        Standard Three.js lighting and gl configs provide beautiful tone mapping.
        Post-processing shaders would be appended here if packages exist.
        Currently, native physically-based rendering (PBR) clearcoats provide the premium glow.
      */}
      {showEffects && (
        <fog attach="fog" args={['#F7F1F8', 5, 20]} />
      )}
    </>
  );
};
export default PostProcessing;
