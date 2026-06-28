export interface PerformanceProfile {
  maxParticles: number;
  enableBloom: boolean;
  enableVignette: boolean;
  maxDPR: number;
  shadowQuality: 'low' | 'medium' | 'high' | 'off';
  maxActiveAnimations: number;
}

export const ENGINE_CONFIG = {
  // Feature Flags
  FEATURE_FLAGS: {
    ENABLE_THREE: true,
    ENABLE_BLOOM: true,
    ENABLE_PARTICLES: true,
    ENABLE_HDR: true,
    ENABLE_DEBUG: process.env.NODE_ENV === 'development',
  },

  // Performance Quality Profiles
  QUALITY_PROFILES: {
    high: {
      maxParticles: 3000,
      enableBloom: true,
      enableVignette: true,
      maxDPR: 2.0,
      shadowQuality: 'high',
      maxActiveAnimations: 15,
    } as PerformanceProfile,
    medium: {
      maxParticles: 1500,
      enableBloom: true,
      enableVignette: true,
      maxDPR: 1.5,
      shadowQuality: 'medium',
      maxActiveAnimations: 8,
    } as PerformanceProfile,
    low: {
      maxParticles: 400,
      enableBloom: false,
      enableVignette: false,
      maxDPR: 1.0,
      shadowQuality: 'off',
      maxActiveAnimations: 3,
    } as PerformanceProfile,
    reducedMotion: {
      maxParticles: 0,
      enableBloom: false,
      enableVignette: false,
      maxDPR: 1.0,
      shadowQuality: 'off',
      maxActiveAnimations: 0,
    } as PerformanceProfile,
  },

  // Camera Settings
  CAMERA: {
    fov: 45,
    near: 0.1,
    far: 100,
    defaultPosition: [0, 0, 8] as [number, number, number],
  },

  // Light settings
  LIGHTS: {
    ambient: {
      intensity: 0.6,
      color: '#ffffff',
    },
    hemisphere: {
      intensity: 0.4,
      skyColor: '#ffffff',
      groundColor: '#b998d2',
    },
    directional: {
      intensity: 1.2,
      color: '#ffffff',
      position: [5, 10, 5] as [number, number, number],
    },
  },

  // Theme Color Mappings
  THEME_MAPPINGS: {
    accent: '#B998D2',
    accentDark: '#7C3AED',
    glowColor: '#E8D7EA',
    ambientColor: '#F7F1F8',
  },
};
