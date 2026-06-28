import * as THREE from 'three';

export const animationPresets = {
  // 1. Floating: Smooth vertical oscillation
  floating: (time: number, speed: number = 1, amplitude: number = 0.15): number => {
    return Math.sin(time * speed) * amplitude;
  },

  // 2. Hover Lift: Lerp position upwards on hover
  hoverLift: (
    hovered: boolean, 
    currentY: number, 
    baseY: number, 
    liftDistance: number = 0.3, 
    lerpFactor: number = 0.1
  ): number => {
    const targetY = hovered ? baseY + liftDistance : baseY;
    return THREE.MathUtils.lerp(currentY, targetY, lerpFactor);
  },

  // 3. Rotation: Spin mesh on multiple axes
  rotation: (
    rotation: THREE.Euler, 
    speedX: number = 0.2, 
    speedY: number = 0.3, 
    speedZ: number = 0.0, 
    delta: number
  ) => {
    rotation.x += speedX * delta;
    rotation.y += speedY * delta;
    rotation.z += speedZ * delta;
  },

  // 4. Pulse / Breathing: Smooth sinusoidal scaling
  breathing: (time: number, speed: number = 1.5, minScale: number = 0.95, maxScale: number = 1.05): number => {
    const delta = (Math.sin(time * speed) + 1) / 2; // Normalize to 0 - 1
    return THREE.MathUtils.lerp(minScale, maxScale, delta);
  },

  // 5. Elastic Scale: Bounce scaling transition (lerps mesh scale to target)
  elasticScale: (
    currentScale: number, 
    targetScale: number, 
    velocity: number, 
    stiffness: number = 180, 
    damping: number = 12, 
    delta: number
  ): { scale: number; velocity: number } => {
    const force = (targetScale - currentScale) * stiffness;
    const dampingForce = -velocity * damping;
    const nextVelocity = velocity + (force + dampingForce) * delta;
    const nextScale = currentScale + nextVelocity * delta;
    return { scale: nextScale, velocity: nextVelocity };
  },

  // 6. Camera Follow: Lagging camera interpolation towards mouse position
  cameraFollow: (
    camera: THREE.Camera, 
    mouse: { x: number; y: number }, 
    targetXRange: number = 2.0, 
    targetYRange: number = 1.5, 
    lerpFactor: number = 0.05
  ) => {
    const targetX = mouse.x * targetXRange;
    const targetY = mouse.y * targetYRange;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, lerpFactor);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY + camera.position.y * 0.0, lerpFactor);
  },

  // 7. Glow intensity pulsing
  glowPulse: (time: number, speed: number = 2.0, minGlow: number = 0.5, maxGlow: number = 2.0): number => {
    const delta = (Math.sin(time * speed) + 1) / 2;
    return THREE.MathUtils.lerp(minGlow, maxGlow, delta);
  }
};
