export interface DeviceCapabilities {
  webgl2: boolean;
  webgpu: boolean;
  gpuTier: 'high' | 'medium' | 'low';
  isTouchDevice: boolean;
  reducedMotion: boolean;
  batterySaver: boolean;
}

interface NavigatorBattery {
  level: number;
  charging: boolean;
}

interface ExtendedNavigator {
  battery?: NavigatorBattery;
  mozBattery?: NavigatorBattery;
  webkitBattery?: NavigatorBattery;
}

export const detectCapabilities = (): DeviceCapabilities => {
  if (typeof window === 'undefined') {
    return {
      webgl2: false,
      webgpu: false,
      gpuTier: 'low',
      isTouchDevice: false,
      reducedMotion: false,
      batterySaver: false,
    };
  }

  // 1. WebGL2 Check
  let webgl2 = false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    webgl2 = !!gl;
  } catch {
    webgl2 = false;
  }

  // 2. WebGPU Check
  const webgpu = typeof navigator !== 'undefined' && 'gpu' in navigator;

  // 3. Touch check
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // 4. Reduced Motion check
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 5. Estimate GPU Tier
  let gpuTier: 'high' | 'medium' | 'low' = 'medium';
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        
        // Match high-end cards (RTX, GTX, Radeon RX, Apple M1/M2/M3 Pro/Max)
        if (
          renderer.includes('rtx') ||
          renderer.includes('gtx') ||
          (renderer.includes('radeon') && (renderer.includes('rx') || renderer.includes('pro'))) ||
          renderer.includes('apple m')
        ) {
          gpuTier = 'high';
        }
        // Match low-end or virtualized software renders (SwiftShader, Basic Render, Intel HD/UHD)
        else if (
          renderer.includes('intel') ||
          renderer.includes('swiftshader') ||
          renderer.includes('basic render') ||
          renderer.includes('software')
        ) {
          gpuTier = 'low';
        }
      }
    }
  } catch {
    gpuTier = 'low';
  }

  // 6. Battery Saver approximation (if battery is low or discharging quickly, assume saver)
  let batterySaver = false;
  const extNav = navigator as unknown as ExtendedNavigator;
  const navBattery = extNav.battery || extNav.mozBattery || extNav.webkitBattery;
  if (navBattery) {
    batterySaver = navBattery.level <= 0.20 && !navBattery.charging;
  }

  return {
    webgl2,
    webgpu,
    gpuTier,
    isTouchDevice,
    reducedMotion,
    batterySaver,
  };
};
